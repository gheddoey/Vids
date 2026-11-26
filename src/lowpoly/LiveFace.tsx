import React, {useMemo} from 'react';
import * as THREE from 'three';
import {lambert, px, speckle, tex64} from '../ps1/ps1';
import type {Look} from './Rig';

// LIVE FACE (animation directive): the approved face, rebuilt as separate layered geometry so it can
// ACT. Same design language (cream-rectangle eyes with a tan rim, square pupils with a highlight,
// thick bevelled slab brows in the hair colour) but every part is a control:
//   eyes  : gaze (gx, gy), pupil size, upper lids (lidL/lidR) + lower lids (lowL/lowR) with tilt
//   brows : raise + tilt per side (asymmetry)
//   mouth : viseme / expression shape (64-px textures), jaw open, tilt + sideways shift (smirks)
// The head texture underneath is a blank face (skin, nose, freckles, stubble, painted beard/mustache).
// Character's R is at -x (viewer's left), L at +x. All parts are boxes; textures <= 32 px.

export type Mouth =
	| 'rest' | 'mbp' | 'aa' | 'ee' | 'oh' | 'oo' | 'fv' | 'lth' | 'smile' | 'grin' | 'frown' | 'smirk' | 'shock' | 'grit' | 'sadopen' | 'worried' | 'pucker';
export const MOUTHS: Mouth[] = ['rest', 'mbp', 'aa', 'ee', 'oh', 'oo', 'fv', 'lth', 'smile', 'grin', 'frown', 'smirk', 'shock', 'grit', 'sadopen', 'worried', 'pucker'];

export type FaceCtl = {
	browL: number; browR: number; // raise (-1 frown down … 1 up)
	tiltL: number; tiltR: number; // +1 = inner end down (anger/focus), -1 = inner end up (worry/sad)
	lidL: number; lidR: number; // upper lid 0 open … 1 closed
	lowL: number; lowR: number; // lower lid 0 … 1 (squint / smile cheeks)
	lidTilt: number; // +1 angry lids, -1 sad lids
	gx: number; gy: number; // gaze -1…1 (character's left = +x on screen? no: +gx = toward viewer's right)
	pupil: number; // 1 normal, 0.75 shocked, 1.15 soft
	mouth: Mouth;
	jaw: number; // 0…1 extra opening
	mTilt: number; // mouth tilt (-1…1), + = viewer-right corner up
	mX: number; // mouth sideways shift (-1…1)
	wide: number; // 0…1 eyes taller (surprise)
};
export const NEUTRAL: FaceCtl = {browL: 0, browR: 0, tiltL: 0, tiltR: 0, lidL: 0.12, lidR: 0.12, lowL: 0, lowR: 0, lidTilt: 0, gx: 0, gy: 0, pupil: 1, mouth: 'rest', jaw: 0, mTilt: 0, mX: 0, wide: 0};

const INK = '#1d140f';
const LIP = '#b2485a';
const shade = (hex: string, k: number) => {
	const c = new THREE.Color(hex);
	if (k < 0) c.lerp(new THREE.Color('#000000'), -k);
	else c.lerp(new THREE.Color('#ffffff'), k);
	return '#' + c.getHexString();
};

// Blank face under the live parts.
export const drawFaceBase = (L: Look) =>
	tex64((g) => {
		const skinD = shade(L.skin, -0.18);
		px(g, L.skin, 0, 0, 64, 64);
		speckle(g, 64, 64, [skinD + '44', shade(L.skin, 0.08)], 40, 9);
		if (L.blush) (px(g, '#d9787a88', 7, 41, 7, 3), px(g, '#d9787a88', 50, 41, 7, 3));
		if (L.freckles) for (const [x, y] of [[10, 38], [13, 40], [51, 38], [54, 40], [11, 42], [52, 42]]) px(g, shade(L.skin, -0.35), x, y, 1, 1);
		px(g, skinD, 31, 40, 3, 3); // nose hint
		px(g, shade(L.skin, -0.1), 14, 37, 10, 1); // under-eye creases
		px(g, shade(L.skin, -0.1), 40, 37, 10, 1);
		if (L.stubble) {
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
			speckle(g, 64, 10, [shade(L.beard, 0.2)], 20, 4);
		}
	});

// Mouth shapes, 32x16 px with transparency (drawn centred on x=16, y=8).
const drawMouth = (m: Mouth) =>
	tex64(
		(g) => {
			g.clearRect(0, 0, 32, 16);
			const dark = '#2a1014';
			const teeth = '#f4eee0';
			const tongue = '#c8606a';
			const open = (x: number, y: number, w: number, h: number, top = true, tg = true) => {
				px(g, INK, x - 1, y - 1, w + 2, h + 2);
				px(g, dark, x, y, w, h);
				if (top) px(g, teeth, x + 1, y, w - 2, Math.max(1, Math.round(h / 4)));
				if (tg && h > 3) px(g, tongue, x + 2, y + h - 2, w - 4, 2);
			};
			switch (m) {
				case 'rest': px(g, INK, 10, 8, 12, 2); break;
				case 'mbp': (px(g, LIP, 9, 7, 14, 3), px(g, INK, 9, 8, 14, 1)); break;
				case 'aa': open(9, 4, 14, 9); break;
				case 'ee': (open(7, 6, 18, 4, true, false), px(g, teeth, 8, 8, 16, 1)); break;
				case 'oh': open(11, 4, 10, 9, false); break;
				case 'oo': (px(g, LIP, 12, 5, 8, 7), open(14, 7, 4, 3, false, false)); break;
				case 'pucker': (px(g, LIP, 12, 6, 8, 5), px(g, INK, 14, 8, 4, 1)); break;
				case 'fv': (px(g, LIP, 9, 9, 14, 2), px(g, teeth, 10, 7, 12, 2), px(g, INK, 9, 6, 14, 1)); break;
				case 'lth': (open(9, 6, 14, 5), px(g, tongue, 13, 6, 6, 2)); break;
				case 'smile': (px(g, INK, 10, 9, 12, 2), px(g, INK, 8, 7, 2, 2), px(g, INK, 22, 7, 2, 2)); break;
				case 'grin': (px(g, INK, 5, 4, 22, 8), px(g, teeth, 7, 5, 18, 3), px(g, LIP, 10, 9, 12, 2), px(g, INK, 4, 3, 2, 2), px(g, INK, 26, 3, 2, 2)); break;
				case 'frown': (px(g, INK, 10, 8, 12, 2), px(g, INK, 8, 10, 2, 2), px(g, INK, 22, 10, 2, 2)); break;
				case 'smirk': (px(g, INK, 10, 9, 12, 2), px(g, INK, 22, 7, 3, 2), px(g, shade(LIP, -0.2), 12, 11, 6, 1)); break;
				case 'shock': open(11, 2, 10, 12, false); break;
				case 'grit': (px(g, INK, 7, 6, 18, 6), px(g, teeth, 8, 7, 16, 4), px(g, INK, 8, 9, 16, 1), px(g, INK, 12, 7, 1, 4), px(g, INK, 16, 7, 1, 4), px(g, INK, 20, 7, 1, 4)); break;
				case 'sadopen': (open(10, 6, 12, 5, false), px(g, INK, 8, 11, 2, 2), px(g, INK, 22, 11, 2, 2)); break;
				case 'worried': (px(g, INK, 9, 9, 3, 2), px(g, INK, 12, 8, 4, 2), px(g, INK, 16, 9, 4, 2), px(g, INK, 20, 8, 3, 2)); break;
			}
		},
		32,
		16,
	);

type FaceMats = Record<string, THREE.Material>;
const cache = new WeakMap<Look, {m: FaceMats; mouths: Record<Mouth, THREE.Material>}>();
const faceMats = (L: Look) => {
	let c = cache.get(L);
	if (!c) {
		const brC = L.brow ?? L.hair.color;
		const eyeTex = tex64((g) => (px(g, '#f3ead2', 0, 0, 16, 12), px(g, '#fffaf0', 1, 1, 14, 3), px(g, '#e4d8bc', 0, 10, 16, 2)), 16, 12);
		const pupTex = tex64((g) => (px(g, L.eye, 0, 0, 8, 8), px(g, INK, 2, 2, 5, 5), px(g, '#ffffff', 1, 1, 2, 2)), 8, 8);
		const browTex = tex64((g) => (px(g, brC, 0, 0, 16, 4), px(g, shade(brC, 0.3), 0, 0, 16, 1), px(g, shade(brC, -0.25), 0, 3, 16, 1)), 16, 4);
		const m: FaceMats = {
			rim: lambert({color: shade(L.skin, -0.32)}),
			eye: lambert({map: eyeTex}),
			pupil: lambert({map: pupTex}),
			lid: lambert({color: shade(L.skin, -0.06)}),
			lash: lambert({color: INK}),
			brow: lambert({map: browTex}),
			glass: L.glasses ? lambert({color: L.glasses}) : lambert({color: INK}),
		};
		const mouths = Object.fromEntries(MOUTHS.map((k) => [k, lambert({map: drawMouth(k), transparent: true, alphaTest: 0.5})])) as Record<Mouth, THREE.Material>;
		cache.set(L, (c = {m, mouths}));
	}
	return c;
};

const Bx: React.FC<{s: [number, number, number]; p: [number, number, number]; r?: number; m: THREE.Material}> = ({s, p, r = 0, m}) => (
	<mesh position={p} rotation={[0, 0, r]} material={m}>
		<boxGeometry args={s} />
	</mesh>
);

// Placed in head-local space (head box centred at 0, front face at z = 0.6).
export const LiveFace: React.FC<{look: Look; c: FaceCtl}> = ({look: L, c}) => {
	const {m, mouths} = useMemo(() => faceMats(L), [L]);
	const Z = 0.6;
	const EW = 0.29;
	const EH = 0.22 + c.wide * 0.06;
	const EY = 0.03 + c.wide * 0.02;
	const eye = (side: -1 | 1) => {
		const x = side * 0.245;
		const lid = Math.min(1, Math.max(0, side < 0 ? c.lidR : c.lidL));
		const low = Math.min(1 - lid, Math.max(0, side < 0 ? c.lowR : c.lowL));
		const lt = c.lidTilt * 0.28 * side; // inner corner down for +lidTilt
		const ps = 0.105 * c.pupil;
		const gx = Math.max(-1, Math.min(1, c.gx)) * (EW / 2 - ps / 2 - 0.012);
		const gy = Math.max(-1, Math.min(1, c.gy)) * (EH / 2 - ps / 2 - 0.012);
		const lh = EH * lid + (lid > 0.02 ? 0.02 : 0);
		const bh = EH * low;
		return (
			<group key={side}>
				<Bx s={[EW + 0.035, EH + 0.035, 0.01]} p={[x, EY, Z + 0.004]} m={m.rim} />
				<Bx s={[EW, EH, 0.012]} p={[x, EY, Z + 0.01]} m={m.eye} />
				<Bx s={[ps, ps, 0.012]} p={[x + gx, EY + gy, Z + 0.018]} m={m.pupil} />
				{lh > 0.004 ? (
					<group position={[x, EY + EH / 2, Z + 0.026]} rotation={[0, 0, lt]}>
						<Bx s={[EW + 0.04, lh, 0.012]} p={[0, -lh / 2 + 0.01, 0]} m={m.lid} />
						<Bx s={[EW + 0.04, 0.025, 0.014]} p={[0, -lh + 0.01, 0.002]} m={m.lash} />
					</group>
				) : null}
				{bh > 0.004 ? <Bx s={[EW + 0.04, bh, 0.012]} p={[x, EY - EH / 2 + bh / 2 - 0.005, Z + 0.026]} r={-lt * 0.4} m={m.lid} /> : null}
			</group>
		);
	};
	const brow = (side: -1 | 1) => {
		const raise = side < 0 ? c.browR : c.browL;
		const tilt = side < 0 ? c.tiltR : c.tiltL;
		return <Bx key={`b${side}`} s={[0.35, 0.11, 0.07]} p={[side * 0.245, 0.255 + raise * 0.075 + c.wide * 0.03, Z + 0.035]} r={tilt * 0.38 * side} m={m.brow} />;
	};
	const openShapes = new Set<Mouth>(['aa', 'oh', 'shock', 'lth', 'ee', 'sadopen']);
	const jy = openShapes.has(c.mouth) ? 1 + c.jaw * 0.8 : 1 + c.jaw * 0.25;
	return (
		<group>
			{eye(-1)}
			{eye(1)}
			{brow(-1)}
			{brow(1)}
			<group position={[c.mX * 0.08, -0.47 - (jy - 1) * 0.06, Z + 0.03]} rotation={[0, 0, c.mTilt * 0.2]}>
				<mesh material={mouths[c.mouth]} scale={[1, jy, 1]}>
					<boxGeometry args={[0.78, 0.39, 0.012]} />
				</mesh>
			</group>
			{L.glasses ? (
				<group position={[0, EY, Z + 0.05]}>
					{[-1, 1].map((s) => (
						<group key={s} position={[s * 0.245, 0, 0]}>
							<Bx s={[0.36, 0.04, 0.03]} p={[0, 0.15, 0]} m={m.glass} />
							<Bx s={[0.36, 0.04, 0.03]} p={[0, -0.15, 0]} m={m.glass} />
							<Bx s={[0.04, 0.34, 0.03]} p={[-0.17, 0, 0]} m={m.glass} />
							<Bx s={[0.04, 0.34, 0.03]} p={[0.17, 0, 0]} m={m.glass} />
						</group>
					))}
					<Bx s={[0.14, 0.035, 0.03]} p={[0, 0.06, 0]} m={m.glass} />
				</group>
			) : null}
		</group>
	);
};
