import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Pose, REST} from '../Character';
import {lambert, px, speckle, tex64} from '../ps1/ps1';
import {FaceCtl, LiveFace, drawFaceBase} from './LiveFace';

// Six-rules character rig, reusable for every video.
// - Plain boxes only (12 triangles each), flat shading; a full character is ~15-25 boxes (<300 tris).
// - Every surface is a 64-px (or smaller) texture painted by code below.
// - Same proportions as the approved R6 rig: legs 1x2x1, torso 2x2x1, arms 1x2x1, head 1.2x1.4x1.2,
//   cream-rectangle eyes with square pupils, slab brows that follow the hair colour.
// - `half` renders only one side of the body (for "slice it open" cutaways).

export type Face = 'talkA' | 'talkB' | 'smile' | 'grin' | 'shock' | 'smug' | 'serious' | 'sad' | 'proud' | 'closed';
export const FACES: Face[] = ['talkA', 'talkB', 'smile', 'grin', 'shock', 'smug', 'serious', 'sad', 'proud', 'closed'];

export type HairStyle = 'flattop' | 'bun' | 'curls' | 'twists' | 'puffs' | 'greybun' | 'bald' | 'short' | 'none';
export type Top = {
	kind: 'tee' | 'jersey' | 'suit' | 'jacket' | 'cardigan' | 'windbreaker' | 'overalls' | 'vest' | 'gown';
	base: string;
	trim?: string;
	accent?: string; // shirt under a jacket, tie, stripe…
	num?: string;
	numColor?: string;
	icon?: 'ball' | 'plaid' | 'floral' | 'none';
	chest?: string; // lettering above the number (pixel font), e.g. a school nickname
	sleeves?: 'short' | 'long' | 'none';
};
export type Look = {
	skin: string;
	eye: string;
	brow?: string;
	hair: {style: HairStyle; color: string; accent?: string};
	hat?: {type: 'cap' | 'beanie' | 'headband' | 'straw' | 'police'; color: string; accent?: string};
	top: Top;
	pants: string;
	shoes?: string;
	shoeAccent?: string;
	mustache?: string;
	beard?: string;
	glasses?: string;
	earrings?: string;
	freckles?: boolean;
	blush?: boolean;
	whistle?: boolean;
	wrist?: string; // wristbands
	cuffs?: boolean; // rolled jeans cuffs
	tapeToe?: boolean;
	// Facial hair, the user's way: "some hand-drawn and some 3D".
	stubble?: {color: string; mode: 'paint' | '3d'}; // short stubble on jaw + upper lip
	mustache3d?: string; // block mustache (3D)
	beard3d?: string; // block beard around the jaw (3D)
	belly?: boolean; // heavier build: a belly box on the torso front
	watch?: string; // wristwatch colour (left wrist)
};

const INK = '#1d140f';
const shade = (hex: string, k: number) => {
	const c = new THREE.Color(hex);
	if (k < 0) c.lerp(new THREE.Color('#000000'), -k);
	else c.lerp(new THREE.Color('#ffffff'), k);
	return '#' + c.getHexString();
};

// ---------- 64-px painters ----------

const drawFace = (L: Look, face: Face) =>
	tex64((g) => {
		const skinD = shade(L.skin, -0.18);
		px(g, L.skin, 0, 0, 64, 64);
		speckle(g, 64, 64, [skinD + '44', shade(L.skin, 0.08)], 40, 9);
		if (L.blush) {
			px(g, '#d9787a88', 7, 41, 7, 3);
			px(g, '#d9787a88', 50, 41, 7, 3);
		}
		if (L.freckles) for (const [x, y] of [[10, 38], [13, 40], [51, 38], [54, 40], [11, 42], [52, 42]]) px(g, shade(L.skin, -0.35), x, y, 1, 1);
		const brC = L.brow ?? L.hair.color;
		const eye = (x: number, kind: 'open' | 'closed' | 'wide' | 'lid' | 'happy', look = 0) => {
			if (kind === 'closed') return px(g, INK, x + 1, 31, 12, 2);
			if (kind === 'happy') {
				px(g, INK, x + 2, 30, 10, 2);
				px(g, INK, x, 32, 2, 2);
				px(g, INK, x + 12, 32, 2, 2);
				return;
			}
			const top = kind === 'wide' ? 24 : 26;
			const h = kind === 'wide' ? 12 : 10;
			px(g, '#00000033', x, top + 1, 15, h + 1); // soft drop shadow
			px(g, shade(L.skin, -0.3), x - 1, top - 1, 16, h + 2); // tan rim
			px(g, '#f3ead2', x, top, 14, h); // cream
			px(g, '#fffaf0', x + 1, top + 1, 12, 3); // lighter inner panel
			const lid = kind === 'lid' ? 4 : 0;
			if (lid) px(g, skinD, x, top, 14, lid);
			const ps = kind === 'wide' ? 3 : 4;
			const cx = x + 5 + look;
			px(g, L.eye, cx, top + 3 + lid / 2, ps, ps);
			px(g, INK, cx + 1, top + 4 + lid / 2, ps - 2, ps - 2);
			px(g, '#ffffff', cx, top + 3 + lid / 2, 1, 1);
		};
		const brow = (x: number, tilt: number, lift = 0) => {
			for (let i = 0; i < 16; i++) {
				const y = 19 - lift + Math.round(((i - 7.5) / 16) * tilt * 4);
				px(g, shade(brC, 0.25), x - 1 + i, y, 1, 1);
				px(g, brC, x - 1 + i, y + 1, 1, 3);
			}
		};
		const mouth = (kind: 'open' | 'line' | 'smile' | 'grin' | 'o' | 'smirk' | 'frown') => {
			const lip = '#b2485a';
			if (kind === 'line') px(g, INK, 26, 50, 12, 2);
			if (kind === 'open') (px(g, INK, 26, 48, 12, 6), px(g, lip, 28, 51, 8, 3));
			if (kind === 'smile') (px(g, INK, 24, 48, 2, 2), px(g, INK, 38, 48, 2, 2), px(g, INK, 26, 50, 12, 2));
			if (kind === 'grin') (px(g, INK, 22, 46, 20, 8), px(g, '#ffffff', 24, 47, 16, 2), px(g, lip, 27, 51, 10, 2));
			if (kind === 'o') (px(g, INK, 28, 46, 8, 9), px(g, lip, 30, 50, 4, 4));
			if (kind === 'smirk') (px(g, INK, 28, 50, 12, 2), px(g, INK, 40, 48, 2, 2));
			if (kind === 'frown') (px(g, INK, 26, 49, 12, 2), px(g, INK, 24, 51, 2, 2), px(g, INK, 38, 51, 2, 2));
		};
		px(g, skinD, 31, 40, 3, 3); // nose hint
		const F: Record<Face, () => void> = {
			talkA: () => (eye(12, 'open'), eye(38, 'open'), brow(12, 0), brow(38, 0), mouth('open')),
			talkB: () => (eye(12, 'open'), eye(38, 'open'), brow(12, 0), brow(38, 0), mouth('line')),
			smile: () => (eye(12, 'open'), eye(38, 'open'), brow(12, -0.5), brow(38, 0.5), mouth('smile')),
			grin: () => (eye(12, 'happy'), eye(38, 'happy'), brow(12, -0.6, 2), brow(38, 0.6, 2), mouth('grin')),
			shock: () => (eye(12, 'wide'), eye(38, 'wide'), brow(12, 0, 4), brow(38, 0, 4), mouth('o')),
			smug: () => (eye(12, 'lid', 2), eye(38, 'lid', 2), brow(12, 0.4), brow(38, -0.8, 3), mouth('smirk')),
			serious: () => (eye(12, 'open'), eye(38, 'open'), brow(12, 1.2, -1), brow(38, -1.2, -1), mouth('line')),
			sad: () => (eye(12, 'lid', 0), eye(38, 'lid', 0), brow(12, -1.4, 1), brow(38, 1.4, 1), mouth('frown')),
			proud: () => (eye(12, 'lid', 0), eye(38, 'lid', 0), brow(12, 0.6, -1), brow(38, -0.6, -1), mouth('smile')),
			closed: () => (eye(12, 'closed'), eye(38, 'closed'), brow(12, 0, 1), brow(38, 0, 1), mouth('line')),
		};
		F[face]();
		if (L.stubble?.mode === 'paint' || L.stubble?.mode === '3d') {
			// hand-drawn stubble: a stippled shadow over jaw, chin and upper lip (also under the 3D shell)
			const c = L.stubble.color;
			let sd = 17;
			const r = () => ((sd = (sd * 16807) % 2147483647) - 1) / 2147483646;
			const inZone = (x: number, y: number) => (y >= 43 && y <= 47 && x >= 20 && x <= 44) || (y >= 52 && x >= 6 && x <= 58) || (y >= 40 && (x <= 9 || x >= 55));
			for (let i = 0; i < 900; i++) {
				const x = Math.floor(r() * 64);
				const y = 38 + Math.floor(r() * 26);
				if (inZone(x, y)) px(g, c + (r() < 0.5 ? 'aa' : '66'), x, y, 1, 1);
			}
		}
		if (L.mustache) (px(g, L.mustache, 20, 44, 24, 4), px(g, L.mustache, 18, 46, 4, 4), px(g, L.mustache, 42, 46, 4, 4));
		if (L.beard) {
			px(g, L.beard, 0, 54, 64, 10);
			px(g, L.beard, 0, 40, 5, 16);
			px(g, L.beard, 59, 40, 5, 16);
			px(g, L.beard, 22, 44, 20, 3);
			speckle(g, 64, 10, [shade(L.beard, 0.2)], 20, 4);
			px(g, '#b2485a', 27, 50, 10, 2);
		}
		if (L.glasses) {
			for (const x of [10, 36]) {
				px(g, L.glasses, x, 23, 18, 2);
				px(g, L.glasses, x, 37, 18, 2);
				px(g, L.glasses, x, 23, 2, 16);
				px(g, L.glasses, x + 16, 23, 2, 16);
			}
			px(g, L.glasses, 28, 28, 8, 2);
		}
	});

const paintTorso = (T: Top, side: 'front' | 'back' | 'side', skin: string) =>
	tex64(
		(g, w, h) => {
			const b = T.base;
			const d = shade(b, -0.25);
			const l = shade(b, 0.15);
			px(g, b, 0, 0, w, h);
			speckle(g, w, h, [shade(b, -0.08), shade(b, 0.06)], w, 4);
			if (T.kind === 'jersey') {
				if (side !== 'side') {
					px(g, skin, 12, 0, 40, side === 'front' ? 10 : 6); // neck scoop
					px(g, T.trim ?? '#ffffff', 10, side === 'front' ? 10 : 6, 44, 2);
				}
				px(g, T.trim ?? '#ffffff', 0, 0, side === 'side' ? 0 : 8, h);
				if (side !== 'side') px(g, T.trim ?? '#ffffff', 56, 0, 8, h);
				if (side === 'side') px(g, T.trim ?? '#ffffff', 12, 0, 8, h);
				if (T.chest && side === 'front') drawWord(g, T.chest, T.numColor ?? '#ffffff', 14, T.trim);
				if (T.num && side !== 'side') drawNum(g, T.num, T.numColor ?? '#ffffff', side === 'front' ? (T.chest ? 30 : 18) : 14, T.trim, T.chest && side === 'front' ? 3 : 4);
				px(g, d, 0, h - 4, w, 4);
			} else if (T.kind === 'suit' || T.kind === 'jacket' || T.kind === 'windbreaker' || T.kind === 'cardigan' || T.kind === 'vest') {
				if (side === 'front') {
					const shirt = T.accent ?? '#f3f0e8';
					px(g, shirt, 24, 0, 16, 64);
					if (T.kind === 'suit') px(g, T.trim ?? '#c9a227', 30, 6, 4, 40); // tie
					px(g, d, 20, 0, 4, 64);
					px(g, d, 40, 0, 4, 64);
					if (T.kind === 'windbreaker') (px(g, T.trim ?? '#ffffff', 0, 26, 64, 4), px(g, '#c8c8c8', 31, 0, 2, 64));
					if (T.kind === 'cardigan') for (let y = 10; y < 60; y += 12) px(g, T.trim ?? '#e8dcc4', 42, y, 3, 3);
					if (T.kind === 'vest') for (const [x, y] of [[6, 30], [46, 30], [6, 44], [46, 44]]) px(g, d, x, y, 12, 10);
					if (T.kind === 'jacket') (px(g, d, 6, 30, 12, 2), px(g, d, 46, 30, 12, 2));
				} else if (T.kind === 'windbreaker' && side === 'back') px(g, T.trim ?? '#ffffff', 0, 26, 64, 4);
				px(g, d, 0, h - 5, w, 5);
			} else if (T.kind === 'overalls') {
				px(g, T.accent ?? '#e8c84a', 0, 0, w, 24); // shirt
				px(g, b, side === 'side' ? 0 : 12, 0, side === 'side' ? w : 8, 24); // straps
				if (side !== 'side') px(g, b, 44, 0, 8, 24);
				if (side === 'front') px(g, d, 20, 30, 24, 14); // bib pocket
			} else if (T.kind === 'gown') {
				for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < w; x += 8) px(g, shade(b, -0.12), x, y, 3, 3);
			} else {
				// tee
				if (side === 'front') (px(g, skin, 22, 0, 20, 5), px(g, d, 20, 5, 24, 2));
				if (side === 'front' && T.icon === 'ball') {
					px(g, '#e07a2a', 24, 24, 16, 16);
					px(g, '#e07a2a', 22, 28, 20, 8);
					px(g, INK, 31, 22, 2, 20);
					px(g, INK, 22, 31, 20, 2);
				}
				if (T.icon === 'floral') {
					let sd = 9;
					const r = () => ((sd = (sd * 16807) % 2147483647) - 1) / 2147483646;
					for (let i = 0; i < 22; i++) {
						const x = Math.floor(r() * w);
						const y = Math.floor(r() * h);
						const c = ['#c84a3a', '#3a6a4a', '#e8a83a', '#4a5a9a'][i % 4];
						px(g, c, x, y - 1, 1, 3);
						px(g, c, x - 1, y, 3, 1);
						px(g, '#f8f0d0', x, y, 1, 1);
					}
				}
				if (T.icon === 'plaid') {
					for (let x = 0; x < w; x += 12) px(g, d + 'aa', x, 0, 4, h);
					for (let y = 0; y < h; y += 12) px(g, d + 'aa', 0, y, w, 4);
				}
				px(g, d, 0, h - 4, w, 4);
			}
		},
		side === 'side' ? 32 : 64,
		64,
	);

// Block numbers, 3x5 pixel font scaled x3.
const DIG: Record<string, string[]> = {
	'0': ['111', '101', '101', '101', '111'],
	'1': ['010', '110', '010', '010', '111'],
	'2': ['111', '001', '111', '100', '111'],
	'3': ['111', '001', '111', '001', '111'],
	'4': ['101', '101', '111', '001', '001'],
	'5': ['111', '100', '111', '001', '111'],
	'6': ['111', '100', '111', '101', '111'],
	'7': ['111', '001', '010', '010', '010'],
	'8': ['111', '101', '111', '101', '111'],
	'9': ['111', '101', '111', '001', '111'],
};
const LET: Record<string, string[]> = {
	A: ['010', '101', '111', '101', '101'],
	C: ['011', '100', '100', '100', '011'],
	E: ['111', '100', '110', '100', '111'],
	H: ['101', '101', '111', '101', '101'],
	I: ['111', '010', '010', '010', '111'],
	L: ['100', '100', '100', '100', '111'],
	N: ['101', '111', '111', '111', '101'],
	O: ['111', '101', '101', '101', '111'],
	R: ['110', '101', '110', '101', '101'],
	S: ['011', '100', '010', '001', '110'],
	T: ['111', '010', '010', '010', '010'],
	V: ['101', '101', '101', '101', '010'],
};
const drawWord = (g: CanvasRenderingContext2D, w: string, col: string, y: number, outline?: string) => {
	const s = 2;
	let x0 = Math.round(32 - (w.length * 4 * s - s) / 2);
	for (const ch of w) {
		const rows = LET[ch] ?? LET.O;
		if (outline) rows.forEach((r, yy) => [...r].forEach((b, xx) => b === '1' && px(g, outline, x0 + xx * s - 1, y + yy * s - 1, s + 2, s + 2)));
		rows.forEach((r, yy) => [...r].forEach((b, xx) => b === '1' && px(g, col, x0 + xx * s, y + yy * s, s, s)));
		x0 += 4 * s;
	}
};
const drawNum = (g: CanvasRenderingContext2D, n: string, col: string, y: number, outline?: string, s = 4) => {
	const W = n.length * 3 * s + (n.length - 1) * s;
	let x0 = Math.round(32 - W / 2);
	for (const ch of n) {
		const rows = DIG[ch] ?? DIG['0'];
		rows.forEach((r, yy) =>
			[...r].forEach((b, xx) => {
				if (b === '1') {
					if (outline) px(g, outline, x0 + xx * s - 1, y + yy * s - 1, s + 2, s + 2);
				}
			}),
		);
		rows.forEach((r, yy) => [...r].forEach((b, xx) => b === '1' && px(g, col, x0 + xx * s, y + yy * s, s, s)));
		x0 += 4 * s;
	}
};

const paintArm = (L: Look) =>
	tex64(
		(g) => {
			const T = L.top;
			const sl = T.sleeves ?? (T.kind === 'jersey' ? 'none' : T.kind === 'tee' || T.kind === 'overalls' ? 'short' : 'long');
			const col = T.kind === 'overalls' ? (T.accent ?? '#e8c84a') : T.base;
			px(g, L.skin, 0, 0, 32, 64);
			speckle(g, 32, 64, [shade(L.skin, -0.1)], 16, 6);
			const len = sl === 'long' ? 56 : sl === 'short' ? 22 : 0;
			if (len) {
				px(g, col, 0, 0, 32, len);
				speckle(g, 32, len, [shade(col, -0.08), shade(col, 0.06)], 20, 7);
				px(g, shade(col, -0.3), 0, len - 3, 32, 3);
				if (T.kind === 'windbreaker') px(g, T.trim ?? '#ffffff', 0, 12, 32, 3);
				if (T.kind === 'suit') px(g, T.accent ?? '#f3f0e8', 0, len, 32, 3); // shirt cuff
			}
			if (L.wrist) px(g, L.wrist, 0, 46, 32, 6);
		},
		32,
		64,
	);

const paintLeg = (L: Look) =>
	tex64(
		(g) => {
			px(g, L.pants, 0, 0, 32, 64);
			speckle(g, 32, 64, [shade(L.pants, -0.08), shade(L.pants, 0.06)], 40, 8);
			px(g, shade(L.pants, -0.25), 14, 0, 2, 50);
			if (L.cuffs) px(g, shade(L.pants, 0.25), 0, 46, 32, 4);
			const sh = L.shoes ?? '#f2efe6';
			px(g, sh, 0, 52, 32, 12);
			px(g, L.shoeAccent ?? shade(sh, -0.3), 0, 56, 32, 2);
			px(g, '#5a5650', 0, 62, 32, 2);
			if (L.tapeToe) px(g, '#c8c4b8', 4, 58, 10, 4);
		},
		32,
		64,
	);

const solid = (c: string) => lambert({color: c});
const sixMats = (side: THREE.Material, front: THREE.Material, top: THREE.Material, bottom: THREE.Material, back?: THREE.Material) => [side, side, top, bottom, front, back ?? side];

// Restrict a texture to the left/right half (for sliced boxes).
const halfMat = (m: THREE.Material, half: -1 | 1): THREE.Material => {
	const mm = m as THREE.MeshLambertMaterial;
	if (!mm.map) return m;
	const t = mm.map.clone();
	t.repeat.set(0.5, 1);
	t.offset.set(half < 0 ? 0 : 0.5, 0);
	t.needsUpdate = true;
	return lambert({map: t});
};

type V3 = [number, number, number];
// Box that can be cut down the character's centre plane (x = 0 in root space; `ox` = box x offset).
const B: React.FC<{size: V3; pos?: V3; rot?: V3; mat: THREE.Material | THREE.Material[]; half?: -1 | 1; ox?: number; inner?: THREE.Material}> = ({size, pos = [0, 0, 0], rot = [0, 0, 0], mat, half, ox = 0, inner}) => {
	let s = size;
	let p = pos;
	let m = mat;
	if (half) {
		const x0 = ox + pos[0] - size[0] / 2;
		const x1 = ox + pos[0] + size[0] / 2;
		if (half < 0 ? x0 >= 0 : x1 <= 0) return null; // entirely on the other side
		if (x0 < 0 && x1 > 0) {
			const a = half < 0 ? x0 : 0;
			const b = half < 0 ? 0 : x1;
			s = [b - a, size[1], size[2]];
			p = [(a + b) / 2 - ox, pos[1], pos[2]];
			if (Array.isArray(mat)) {
				const cut = inner ?? mat[0];
				const sides = half < 0 ? [cut, mat[1]] : [mat[0], cut];
				m = [sides[0], sides[1], mat[2], mat[3], halfMat(mat[4], half), halfMat(mat[5], half === -1 ? 1 : -1)];
			}
		}
	}
	return (
		<mesh position={p} rotation={rot} material={m} castShadow receiveShadow>
			<boxGeometry args={s} />
		</mesh>
	);
};

const HEAD_H = 1.4;
type HB = [number, number, number, number, number, number, string?];
const hairBoxes = (st: HairStyle, c: string, acc?: string): HB[] => {
	const a = acc ?? shade(c, 0.2);
	switch (st) {
		case 'flattop':
			return [[1.26, 0.42, 1.26, 0, 0.8, 0], [1.26, 0.7, 0.14, 0, 0.4, -0.62], [0.08, 0.5, 1.0, -0.63, 0.45, -0.08], [0.08, 0.5, 1.0, 0.63, 0.45, -0.08]];
		case 'short':
			return [[1.26, 0.22, 1.26, 0, 0.73, 0], [1.26, 0.6, 0.12, 0, 0.42, -0.62], [0.07, 0.4, 0.9, -0.63, 0.5, -0.1], [0.07, 0.4, 0.9, 0.63, 0.5, -0.1]];
		case 'bun':
			return [[1.26, 0.26, 1.26, 0, 0.75, 0], [1.26, 1.0, 0.14, 0, 0.3, -0.62], [0.1, 0.8, 1.1, -0.64, 0.35, -0.05], [0.1, 0.8, 1.1, 0.64, 0.35, -0.05], [0.62, 0.5, 0.62, 0, 1.12, -0.25], [0.68, 0.12, 0.68, 0, 0.92, -0.25, a]];
		case 'greybun':
			return [[1.26, 0.24, 1.26, 0, 0.74, 0], [1.26, 0.8, 0.14, 0, 0.38, -0.62], [0.08, 0.6, 1.0, -0.63, 0.42, -0.1], [0.08, 0.6, 1.0, 0.63, 0.42, -0.1], [0.56, 0.46, 0.56, 0, 1.05, -0.35], [0.06, 0.06, 0.9, 0.12, 1.12, -0.2, '#e8c84a']];
		case 'curls': {
			const out: HB[] = [[1.3, 0.3, 1.3, 0, 0.78, 0], [1.3, 0.8, 0.16, 0, 0.36, -0.64]];
			for (const x of [-0.45, 0, 0.45]) for (const z of [-0.4, 0.1, 0.5]) out.push([0.38, 0.3, 0.38, x, 0.98, z]);
			for (const s of [-1, 1]) out.push([0.24, 0.6, 0.9, s * 0.68, 0.45, -0.1]);
			return out;
		}
		case 'twists': {
			const out: HB[] = [[1.26, 0.24, 1.26, 0, 0.74, 0], [1.26, 0.6, 0.12, 0, 0.42, -0.62]];
			for (const x of [-0.42, -0.14, 0.14, 0.42]) for (const z of [-0.35, 0.05, 0.4]) out.push([0.16, 0.34, 0.16, x, 1.0, z]);
			return out;
		}
		case 'puffs':
			return [[1.26, 0.22, 1.26, 0, 0.73, 0], [1.26, 0.6, 0.12, 0, 0.42, -0.62], [0.5, 0.5, 0.5, -0.62, 0.95, -0.1], [0.5, 0.5, 0.5, 0.62, 0.95, -0.1], [0.3, 0.12, 0.3, -0.4, 0.82, -0.1, a], [0.3, 0.12, 0.3, 0.4, 0.82, -0.1, a]];
		case 'bald':
			return [[0.08, 0.36, 0.8, -0.63, 0.25, -0.15], [0.08, 0.36, 0.8, 0.63, 0.25, -0.15], [1.26, 0.36, 0.1, 0, 0.25, -0.62]];
		default:
			return [];
	}
};

// Extra acting controls (animation directive): squash/stretch, shrug, arm roll, stance, live face.
export type Extra = {sq?: number; shrug?: number; shrugL?: number; shrugR?: number; armLY?: number; armRY?: number; legLZ?: number; legRZ?: number; chest?: number; fc?: FaceCtl};
export type RigProps = {look: Look; pose?: Partial<Pose> & {face?: string} & Extra; half?: -1 | 1; holdL?: React.ReactNode; holdR?: React.ReactNode; bust?: boolean; headOnly?: boolean};

const matCache = new WeakMap<Look, ReturnType<typeof buildMats>>();
const buildMats = (L: Look) => {
	const skin = solid(L.skin);
	const top = solid(L.top.kind === 'overalls' ? (L.top.accent ?? '#e8c84a') : L.top.base);
	const arm = lambert({map: paintArm(L)});
	const leg = lambert({map: paintLeg(L)});
	const faces = Object.fromEntries(FACES.map((f) => [f, sixMats(skin, lambert({map: drawFace(L, f)}), skin, skin)])) as Record<Face, THREE.Material[]>;
	const liveBase = sixMats(skin, lambert({map: drawFaceBase(L)}), skin, skin);
	const hairTex = tex64((g) => (px(g, L.hair.color, 0, 0, 16, 16), speckle(g, 16, 16, [shade(L.hair.color, -0.15), shade(L.hair.color, 0.12)], 24, 2)), 16, 16);
	return {
		skin,
		faces,
		liveBase,
		torso: sixMats(lambert({map: paintTorso(L.top, 'side', L.skin)}), lambert({map: paintTorso(L.top, 'front', L.skin)}), top, solid(shade(L.top.base, -0.3)), lambert({map: paintTorso(L.top, 'back', L.skin)})),
		arm: sixMats(arm, arm, top, skin),
		leg: sixMats(leg, leg, solid(L.pants), solid('#5a5650')),
		hair: lambert({map: hairTex}),
		hairAcc: new Map<string, THREE.Material>(),
		inner: solid('#2a1d16'),
		hat: L.hat ? solid(L.hat.color) : null,
		hatAcc: L.hat ? solid(L.hat.accent ?? shade(L.hat.color, -0.3)) : null,
		ear: L.earrings ? lambert({color: L.earrings, emissive: L.earrings, emissiveIntensity: 0.25}) : null,
		whistle: solid('#c8c8c8'),
		cord: solid('#e04848'),
		glassArm: L.glasses ? solid(L.glasses) : null,
		stubbleShell:
			L.stubble?.mode === '3d'
				? lambert({
						map: tex64((g) => {
							let sd = 5;
							const r = () => ((sd = (sd * 16807) % 2147483647) - 1) / 2147483646;
							for (let i = 0; i < 260; i++) px(g, L.stubble!.color, Math.floor(r() * 64), Math.floor(r() * 32), 1, 1);
						}, 64, 32),
						transparent: true,
						alphaTest: 0.5,
					})
				: null,
		mus3d: L.mustache3d ? solid(L.mustache3d) : null,
		beard3d: L.beard3d ? lambert({map: tex64((g) => (px(g, L.beard3d!, 0, 0, 16, 16), speckle(g, 16, 16, [shade(L.beard3d!, 0.18), shade(L.beard3d!, -0.2)], 40, 3)), 16, 16)}) : null,
		belly: solid(L.top.kind === 'overalls' ? (L.top.accent ?? '#e8c84a') : L.top.base),
		watch: L.watch ? lambert({color: L.watch, emissive: L.watch, emissiveIntensity: 0.3}) : null,
	};
};
const mats = (L: Look) => {
	let m = matCache.get(L);
	if (!m) matCache.set(L, (m = buildMats(L)));
	return m;
};

export const Rig: React.FC<RigProps> = ({look: L, pose = {}, half, holdL, holdR, bust, headOnly}) => {
	const p = {...REST, ...pose} as Pose & {face?: string} & Extra;
	const fc = p.fc;
	const sq = p.sq ?? 0;
	const shR = (p.shrug ?? 0) + (p.shrugR ?? 0);
	const shL = (p.shrug ?? 0) + (p.shrugL ?? 0);
	const M = useMemo(() => mats(L), [L]);
	const face = (FACES.includes(p.face as Face) ? p.face : 'smile') as Face;
	const acc = (c: string) => {
		if (!M.hairAcc.has(c)) M.hairAcc.set(c, solid(c));
		return M.hairAcc.get(c)!;
	};
	const show = (x: number) => !half || Math.sign(x) === half || x === 0;
	const head = (
		<group>
			<B size={[1.2, HEAD_H, 1.2]} mat={fc ? M.liveBase : M.faces[face]} half={half} inner={M.inner} />
			{fc && !half ? <LiveFace look={L} c={fc} /> : null}
			{M.stubbleShell ? (
				// 3D stubble: a thin speckled shell standing just off the jaw
				<mesh material={M.stubbleShell} position={[0, -0.42, 0.04]}>
					<boxGeometry args={[1.24, 0.56, 1.16]} />
				</mesh>
			) : null}
			{M.mus3d ? (
				<>
					<B size={[0.62, 0.12, 0.1]} pos={[0, -0.25, 0.63]} mat={M.mus3d} half={half} />
					<B size={[0.12, 0.22, 0.1]} pos={[-0.28, -0.33, 0.63]} mat={M.mus3d} half={half} />
					<B size={[0.12, 0.22, 0.1]} pos={[0.28, -0.33, 0.63]} mat={M.mus3d} half={half} />
				</>
			) : null}
			{M.beard3d ? (
				<>
					<B size={[1.28, 0.36, 0.3]} pos={[0, -0.56, 0.5]} mat={M.beard3d} half={half} />
					<B size={[0.14, 0.75, 1.0]} pos={[-0.64, -0.34, 0.08]} mat={M.beard3d} half={half} />
					<B size={[0.14, 0.75, 1.0]} pos={[0.64, -0.34, 0.08]} mat={M.beard3d} half={half} />
					<B size={[0.5, 0.14, 0.08]} pos={[0, -0.24, 0.63]} mat={M.beard3d} half={half} />
				</>
			) : null}
			{hairBoxes(L.hair.style, L.hair.color, L.hair.accent).map((b, i) => (
				<B key={i} size={[b[0], b[1], b[2]]} pos={[b[3], b[4] - 0.1, b[5]]} mat={b[6] ? acc(b[6]) : M.hair} half={half} inner={M.inner} />
			))}
			{L.hat?.type === 'cap' ? (
				<>
					<B size={[1.28, 0.3, 1.28]} pos={[0, 0.76, 0]} mat={M.hat!} half={half} />
					<B size={[0.9, 0.07, 0.45]} pos={[0, 0.62, 0.8]} rot={[-0.12, 0, 0]} mat={M.hatAcc!} half={half} />
				</>
			) : null}
			{L.hat?.type === 'beanie' ? (
				<>
					<B size={[1.3, 0.5, 1.3]} pos={[0, 0.72, 0]} mat={M.hat!} half={half} />
					<B size={[1.34, 0.16, 1.34]} pos={[0, 0.5, 0]} mat={M.hatAcc!} half={half} />
				</>
			) : null}
			{L.hat?.type === 'straw' ? (
				<>
					<B size={[1.3, 0.42, 1.3]} pos={[0, 0.86, 0]} mat={M.hat!} half={half} />
					<B size={[2.1, 0.06, 2.1]} pos={[0, 0.66, 0]} mat={M.hat!} half={half} />
					<B size={[1.32, 0.1, 1.32]} pos={[0, 0.72, 0]} mat={M.hatAcc!} half={half} />
				</>
			) : null}
			{L.hat?.type === 'police' ? (
				<>
					<B size={[1.34, 0.36, 1.34]} pos={[0, 0.8, 0]} mat={M.hat!} half={half} />
					<B size={[1.0, 0.07, 0.4]} pos={[0, 0.62, 0.78]} mat={M.hatAcc!} half={half} />
					<B size={[0.22, 0.2, 0.06]} pos={[0, 0.84, 0.68]} mat={M.ear ?? M.hatAcc!} half={half} />
				</>
			) : null}
			{L.hat?.type === 'headband' ? <B size={[1.28, 0.2, 1.28]} pos={[0, 0.45, 0]} mat={M.hat!} half={half} /> : null}
			{L.earrings ? [-1, 1].filter(show).map((s) => <B key={s} size={[0.08, 0.2, 0.2]} pos={[s * 0.66, -0.28, 0.1]} mat={M.ear!} />) : null}
			{L.glasses ? [-1, 1].filter(show).map((s) => <B key={s} size={[0.04, 0.05, 0.7]} pos={[s * 0.62, 0.07, 0.25]} mat={M.glassArm!} />) : null}
		</group>
	);
	if (headOnly) return <group rotation={[p.headX, p.headY, p.headZ]}>{head}</group>;
	const limb = (m: THREE.Material[]) => <B size={[0.99, 2, 1]} pos={[0, -1, 0]} mat={m} />;
	return (
		<group position={[p.x, p.y, p.z]} rotation={[0, p.rotY, 0]} scale={[1 / Math.sqrt(1 + sq), 1 + sq, 1 / Math.sqrt(1 + sq)]}>
			{!bust && show(-0.5) ? (
				<group position={[-0.5, 2, 0]} rotation={[p.legRX, 0, p.legRZ ?? 0]}>
					{limb(M.leg)}
				</group>
			) : null}
			{!bust && show(0.5) ? (
				<group position={[0.5, 2, 0]} rotation={[p.legLX, 0, p.legLZ ?? 0]}>
					{limb(M.leg)}
				</group>
			) : null}
			<group position={[0, 2, 0]} rotation={[p.lean, p.twist, p.side]}>
				<B size={[2, 2, 1]} pos={[0, 1, 0]} mat={M.torso} half={half} inner={M.inner} />
				{L.belly ? <B size={[1.8, 1.1, 0.35]} pos={[0, 0.7, 0.62]} mat={M.belly} half={half} inner={M.inner} /> : null}
				{L.whistle && show(0) ? (
					<>
						<B size={[0.06, 0.9, 0.04]} pos={[-0.3, 1.5, 0.52]} rot={[0, 0, 0.35]} mat={M.cord} />
						<B size={[0.06, 0.9, 0.04]} pos={[0.3, 1.5, 0.52]} rot={[0, 0, -0.35]} mat={M.cord} />
						<B size={[0.22, 0.14, 0.14]} pos={[0, 1.05, 0.56]} mat={M.whistle} />
					</>
				) : null}
				{show(-1.5) ? (
					<group position={[-1.5, 1.75 + shR * 0.3, 0]} rotation={[p.armRX, p.armRY ?? 0, p.armRZ]}>
						<group position={[0, 0.25, 0]}>
							{limb(M.arm)}
							{holdR ? <group position={[0, -2.05, 0.1]}>{holdR}</group> : null}
						</group>
					</group>
				) : null}
				{show(1.5) ? (
					<group position={[1.5, 1.75 + shL * 0.3, 0]} rotation={[p.armLX, p.armLY ?? 0, p.armLZ]}>
						<group position={[0, 0.25, 0]}>
							{limb(M.arm)}
							{holdL ? <group position={[0, -2.05, 0.1]}>{holdL}</group> : null}
							{M.watch ? <B size={[1.04, 0.22, 1.04]} pos={[0, -1.55, 0]} mat={M.watch} /> : null}
						</group>
					</group>
				) : null}
				<group position={[0, 2 - ((shR + shL) / 2) * 0.12, 0]} rotation={[p.headX, p.headY, p.headZ]}>
					<group position={[0, HEAD_H / 2 + 0.02, 0]}>{head}</group>
				</group>
			</group>
		</group>
	);
};

// Place a rig with a height (scale).
export const Who: React.FC<RigProps & {at?: V3; h?: number}> = ({at = [0, 0, 0], h = 1, ...r}) => (
	<group position={at} scale={h}>
		<Rig {...r} />
	</group>
);
