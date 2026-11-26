import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Pose, REST} from '../Character';
import {lambert, px, speckle, tex64} from './ps1';

// "Pix": the narrator, built to the six rules. Every part is a plain box (12 triangles),
// every surface a 64-px texture painted below. ~150 triangles in total.

export type PixFace = 'talkA' | 'talkB' | 'smile' | 'grin' | 'shock' | 'smug' | 'wink';
const FACES: PixFace[] = ['talkA', 'talkB', 'smile', 'grin', 'shock', 'smug', 'wink'];

const SKIN = '#e9b48a';
const SKIN_D = '#c98d66';
const HAIR = '#e2632a';
const HAIR_D = '#a8401b';
const HAIR_L = '#f59a4a';
const TEE = '#2fa39a';
const TEE_D = '#1d6f6a';
const TEE_L = '#55c7b8';
const JEANS = '#34406b';
const JEANS_D = '#252e52';
const INK = '#20160f';
const EYE = '#3fa34a'; // green pupils

// ---------- 64-px textures, painted by code ----------

const drawFace = (face: PixFace) =>
	tex64((g) => {
		px(g, SKIN, 0, 0, 64, 64);
		speckle(g, 64, 64, [SKIN_D + '55', '#f5c9a2'], 50, 9);
		// cheeks + freckles (unique feature)
		px(g, '#e8967a', 8, 41, 6, 3);
		px(g, '#e8967a', 50, 41, 6, 3);
		for (const [x, y] of [[10, 38], [13, 40], [51, 38], [54, 40], [11, 42], [52, 42]]) px(g, '#b8653f', x, y, 1, 1);
		const eye = (x: number, kind: 'open' | 'closed' | 'wide' | 'lid', look = 0) => {
			if (kind === 'closed') {
				px(g, INK, x + 1, 31, 12, 2);
				return;
			}
			const top = kind === 'wide' ? 24 : 26;
			const h = kind === 'wide' ? 12 : 10;
			px(g, '#9c7350', x - 1, top - 1, 16, h + 2); // rim
			px(g, '#f3ead2', x, top, 14, h); // cream
			px(g, '#fffaf0', x + 1, top + 1, 12, 3); // lighter inner panel
			if (kind === 'lid') px(g, SKIN_D, x, top, 14, 4);
			const ps = kind === 'wide' ? 3 : 4;
			const cx = x + 5 + look;
			px(g, EYE, cx, top + 3 + (kind === 'lid' ? 1 : 0), ps, ps);
			px(g, INK, cx + 1, top + 4 + (kind === 'lid' ? 1 : 0), ps - 2, ps - 2);
			px(g, '#ffffff', cx, top + 3 + (kind === 'lid' ? 1 : 0), 1, 1);
		};
		const brow = (x: number, tilt: number, lift = 0) => {
			for (let i = 0; i < 16; i++) {
				const y = 19 - lift + Math.round(((i - 7.5) / 16) * tilt * 4);
				px(g, HAIR_L, x - 1 + i, y, 1, 1);
				px(g, HAIR_D, x - 1 + i, y + 1, 1, 3);
			}
		};
		const mouth = (kind: 'open' | 'line' | 'smile' | 'grin' | 'o' | 'smirk') => {
			if (kind === 'line') px(g, INK, 26, 50, 12, 2);
			if (kind === 'open') {
				px(g, INK, 26, 48, 12, 6);
				px(g, '#c4485a', 28, 51, 8, 3);
			}
			if (kind === 'smile') {
				px(g, INK, 24, 48, 2, 2);
				px(g, INK, 38, 48, 2, 2);
				px(g, INK, 26, 50, 12, 2);
			}
			if (kind === 'grin') {
				px(g, INK, 22, 46, 20, 8);
				px(g, '#ffffff', 24, 47, 16, 2);
				px(g, '#c4485a', 27, 51, 10, 2);
			}
			if (kind === 'o') {
				px(g, INK, 28, 46, 8, 9);
				px(g, '#c4485a', 30, 50, 4, 4);
			}
			if (kind === 'smirk') {
				px(g, INK, 28, 50, 12, 2);
				px(g, INK, 40, 48, 2, 2);
			}
		};
		px(g, SKIN_D, 31, 40, 3, 3); // nose hint
		if (face === 'talkA' || face === 'talkB') {
			eye(12, 'open');
			eye(38, 'open');
			brow(12, 0);
			brow(38, 0);
			mouth(face === 'talkA' ? 'open' : 'line');
		} else if (face === 'smile') {
			eye(12, 'open');
			eye(38, 'open');
			brow(12, -0.5);
			brow(38, 0.5);
			mouth('smile');
		} else if (face === 'grin') {
			eye(12, 'closed');
			eye(38, 'closed');
			brow(12, -0.6, 2);
			brow(38, 0.6, 2);
			mouth('grin');
		} else if (face === 'shock') {
			eye(12, 'wide');
			eye(38, 'wide');
			brow(12, 0, 4);
			brow(38, 0, 4);
			mouth('o');
		} else if (face === 'smug') {
			eye(12, 'lid', 2);
			eye(38, 'lid', 2);
			brow(12, 0.4);
			brow(38, -0.8, 3);
			mouth('smirk');
		} else if (face === 'wink') {
			eye(12, 'open');
			eye(38, 'closed');
			brow(12, 0, 2);
			brow(38, 0.6);
			mouth('grin');
		}
	});

const shirtFront = () =>
	tex64((g) => {
		px(g, TEE, 0, 0, 64, 64);
		speckle(g, 64, 64, [TEE_D, TEE_L], 120, 4);
		px(g, TEE_D, 22, 0, 20, 6); // collar
		px(g, SKIN, 24, 0, 16, 4);
		// pixel controller icon (generic, no logo)
		px(g, '#f3ead2', 18, 24, 28, 14);
		px(g, '#f3ead2', 14, 28, 36, 12);
		px(g, INK, 21, 29, 2, 6);
		px(g, INK, 19, 31, 6, 2);
		px(g, '#e04848', 40, 29, 3, 3);
		px(g, '#4870e0', 36, 32, 3, 3);
		px(g, TEE_D, 0, 58, 64, 6); // hem
	});
const shirtPlain = (w = 64, h = 64) =>
	tex64(
		(g) => {
			px(g, TEE, 0, 0, w, h);
			speckle(g, w, h, [TEE_D, TEE_L], 60, 5);
			px(g, TEE_D, 0, h - 5, w, 5);
		},
		w,
		h,
	);
const sleeve = () =>
	tex64(
		(g) => {
			px(g, SKIN, 0, 0, 32, 64);
			speckle(g, 32, 64, [SKIN_D + '66'], 20, 6);
			px(g, TEE, 0, 0, 32, 24);
			speckle(g, 32, 24, [TEE_D, TEE_L], 30, 7);
			px(g, TEE_D, 0, 22, 32, 3);
			// a wristband
			px(g, '#e8c84a', 0, 50, 32, 4);
		},
		32,
		64,
	);
const jeans = () =>
	tex64(
		(g) => {
			px(g, JEANS, 0, 0, 32, 64);
			speckle(g, 32, 64, [JEANS_D, '#46548a'], 90, 8);
			px(g, JEANS_D, 14, 0, 2, 50); // seam
			// sneakers
			px(g, '#f2efe6', 0, 50, 32, 14);
			px(g, '#e04848', 0, 54, 32, 3);
			px(g, '#8c8a84', 0, 61, 32, 3);
		},
		32,
		64,
	);
const solid = (c: string) => lambert({color: c});

// Box face order: +x, -x, +y, -y, +z (front), -z (back).
const boxMats = (side: THREE.Material, front: THREE.Material, top: THREE.Material, bottom: THREE.Material, back?: THREE.Material) => [side, side, top, bottom, front, back ?? side];

const Box: React.FC<{size: [number, number, number]; pos?: [number, number, number]; rot?: [number, number, number]; mat: THREE.Material | THREE.Material[]; wire?: THREE.Material}> = ({
	size,
	pos = [0, 0, 0],
	rot = [0, 0, 0],
	mat,
	wire,
}) => (
	<group position={pos} rotation={rot}>
		<mesh material={mat} castShadow receiveShadow>
			<boxGeometry args={size} />
		</mesh>
		{wire ? (
			<mesh material={wire} scale={1.01}>
				<boxGeometry args={size} />
			</mesh>
		) : null}
	</group>
);

export type PixProps = {
	pose?: Partial<Pose> & {face?: string};
	// 0 = whole head; >0 = head sliced down the middle, halves pulled apart by this much.
	slice?: number;
	// Show the triangle wireframe over every part.
	wire?: boolean;
	holdR?: React.ReactNode;
	holdL?: React.ReactNode;
};

const HEAD_H = 1.4;
// Hair chunks [w,h,d,x,y,z] in head space (head centre at 0); mirrored pairs so a slice splits them.
const HAIR_BOXES: [number, number, number, number, number, number][] = [
	[0.62, 0.32, 1.3, -0.31, 0.82, -0.02],
	[0.62, 0.32, 1.3, 0.31, 0.82, -0.02],
	[0.3, 0.36, 0.5, -0.38, 1.08, 0.12], // spikes
	[0.3, 0.44, 0.5, 0.2, 1.12, -0.1],
	[0.14, 0.7, 1.0, -0.66, 0.42, -0.1], // sideburn blocks
	[0.14, 0.7, 1.0, 0.66, 0.42, -0.1],
	[0.62, 0.9, 0.16, -0.31, 0.3, -0.66], // back
	[0.62, 0.9, 0.16, 0.31, 0.3, -0.66],
];

export const Pix: React.FC<PixProps> = ({pose = {}, slice = 0, wire = false, holdL, holdR}) => {
	const p = {...REST, ...pose} as Pose & {face?: string};
	const faceKey = (FACES.includes(p.face as PixFace) ? p.face : 'smile') as PixFace;
	const M = useMemo(() => {
		const faces = Object.fromEntries(FACES.map((f) => [f, drawFace(f)])) as Record<PixFace, THREE.CanvasTexture>;
		const skin = solid(SKIN);
		const tee = solid(TEE);
		const jean = lambert({map: jeans()});
		const sl = lambert({map: sleeve()});
		const halves = (t: THREE.CanvasTexture, half: 0 | 1) => {
			const h = t.clone();
			h.repeat.set(0.5, 1);
			h.offset.set(half * 0.5, 0);
			h.needsUpdate = true;
			return lambert({map: h});
		};
		return {
			head: Object.fromEntries(FACES.map((f) => [f, boxMats(skin, lambert({map: faces[f]}), skin, skin)])) as Record<PixFace, THREE.Material[]>,
			headHalf: Object.fromEntries(
				FACES.map((f) => [f, [0, 1].map((hh) => [hh ? skin : solid('#f4d3b0'), hh ? solid('#f4d3b0') : skin, skin, skin, halves(faces[f], hh as 0 | 1), skin])]),
			) as Record<PixFace, THREE.Material[][]>,
			torso: boxMats(lambert({map: shirtPlain(32, 64)}), lambert({map: shirtFront()}), tee, tee, lambert({map: shirtPlain()})),
			arm: boxMats(sl, sl, tee, skin),
			leg: boxMats(jean, jean, solid(JEANS), solid('#8c8a84')),
			hair: lambert({map: tex64((g) => (px(g, HAIR, 0, 0, 16, 16), speckle(g, 16, 16, [HAIR_D, HAIR_L], 40, 2)), 16, 16)}),
			brain: lambert({map: tex64((g) => {
				px(g, '#f08aa0', 0, 0, 32, 32);
				for (let y = 2; y < 32; y += 6) for (let x = (y / 2) % 6; x < 32; x += 8) px(g, '#c45a76', x, y, 5, 2);
			}, 32, 32)}),
			wire: new THREE.MeshBasicMaterial({color: '#7dff5a', wireframe: true}),
		};
	}, []);
	const w = wire ? M.wire : undefined;
	const limb = (mat: THREE.Material[]) => <Box size={[0.99, 2, 1]} pos={[0, -1, 0]} mat={mat} wire={w} />;

	const hairOf = (side: number) =>
		HAIR_BOXES.filter((b) => Math.sign(b[3]) === side).map((b, i) => <Box key={i} size={[b[0], b[1], b[2]]} pos={[b[3], b[4] - 0.1, b[5]]} mat={M.hair} wire={w} />);

	const head =
		slice <= 0 ? (
			<group>
				<Box size={[1.2, HEAD_H, 1.2]} mat={M.head[faceKey]} wire={w} />
				{hairOf(-1)}
				{hairOf(1)}
			</group>
		) : (
			<group>
				{[-1, 1].map((s) => (
					<group key={s} position={[s * slice, 0, 0]} rotation={[0, 0, -s * slice * 0.15]}>
						<Box size={[0.6, HEAD_H, 1.2]} pos={[s * 0.3, 0, 0]} mat={M.headHalf[faceKey][s < 0 ? 0 : 1]} />
						{hairOf(s)}
					</group>
				))}
				{/* The labelled part */}
				<Box size={[0.62, 0.46, 0.8]} pos={[0, 0.28, -0.05]} mat={M.brain} />
			</group>
		);

	return (
		<group position={[p.x, p.y, p.z]} rotation={[0, p.rotY, 0]}>
			<group position={[-0.5, 2, 0]} rotation={[p.legRX, 0, 0]}>
				{limb(M.leg)}
			</group>
			<group position={[0.5, 2, 0]} rotation={[p.legLX, 0, 0]}>
				{limb(M.leg)}
			</group>
			<group position={[0, 2, 0]} rotation={[p.lean, p.twist, p.side]}>
				<Box size={[2, 2, 1]} pos={[0, 1, 0]} mat={M.torso} wire={w} />
				<group position={[-1.5, 1.75, 0]} rotation={[p.armRX, 0, p.armRZ]}>
					<group position={[0, 0.25, 0]}>
						{limb(M.arm)}
						{holdR ? <group position={[0, -2.05, 0.1]}>{holdR}</group> : null}
					</group>
				</group>
				<group position={[1.5, 1.75, 0]} rotation={[p.armLX, 0, p.armLZ]}>
					<group position={[0, 0.25, 0]}>
						{limb(M.arm)}
						{holdL ? <group position={[0, -2.05, 0.1]}>{holdL}</group> : null}
					</group>
				</group>
				<group position={[0, 2, 0]} rotation={[p.headX, p.headY, p.headZ]}>
					<group position={[0, HEAD_H / 2 + 0.02, 0]}>{head}</group>
				</group>
			</group>
		</group>
	);
};
