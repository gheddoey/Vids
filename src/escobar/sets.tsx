import React, {useMemo} from 'react';
import * as THREE from 'three';
import {BlockText} from '../BlockText';
import {lambert, px, speckle, tex64} from '../ps1/ps1';
import {B, Cyl, SkyDome} from '../ps1/sets';
import {Rig4} from '../lebron2/sets';
import {SunDisc} from '../cine/Cine';

// Escobar sets: six rules (boxes, 64-px textures painted by code) + cinematic light.
// Every set is lived-in: layered props in the foreground, middle and background.

const PI = Math.PI;
type V3 = [number, number, number];

const rep = (t: THREE.Texture, x: number, y: number) => {
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(x, y);
	return t;
};
const useTex = (fn: () => THREE.Texture, rx = 1, ry = 1, extra: THREE.MeshLambertMaterialParameters = {}) =>
	useMemo(() => lambert({map: rep(fn(), rx, ry), ...extra}), []); // eslint-disable-line react-hooks/exhaustive-deps
const rnd = (seed: number) => {
	let s = seed;
	return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
};

// ---------- textures ----------
export const TX = {
	water: (a = '#5a6a4a', b = '#6e7e58') => () =>
		tex64((g) => {
			px(g, a, 0, 0, 64, 64);
			const r = rnd(4);
			for (let i = 0; i < 70; i++) px(g, b, Math.floor(r() * 64), Math.floor(r() * 64), 3 + Math.floor(r() * 6), 1);
			for (let i = 0; i < 25; i++) px(g, '#c8c8a0', Math.floor(r() * 64), Math.floor(r() * 64), 2, 1);
		}),
	mud: () => tex64((g) => (px(g, '#6a5236', 0, 0, 64, 64), speckle(g, 64, 64, ['#5a4228', '#7a6244', '#4a3a22'], 300, 3))),
	grass: (a = '#4a7a2e', b = '#5a8a36') => () => tex64((g) => (px(g, a, 0, 0, 64, 64), speckle(g, 64, 64, [b, '#3a6a24', '#6a9a3e'], 320, 7))),
	dirt: () => tex64((g) => (px(g, '#9a7a52', 0, 0, 64, 64), speckle(g, 64, 64, ['#8a6a44', '#aa8a62', '#7a5a3a'], 300, 2), px(g, '#b8986a', 28, 0, 8, 64))),
	tile: () =>
		tex64((g) => {
			for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? -4 : 0; x < 64; x += 8) (px(g, ['#a84a2a', '#b8563a', '#984224'][((x + y) / 8) & 1 ? 1 : (x / 8) % 3 === 0 ? 2 : 0], x, y, 8, 8), px(g, '#6a2a14', x, y + 7, 8, 1), px(g, '#c8704a', x + 1, y + 1, 5, 1));
		}),
	plaster: (c = '#e8d8b8') => () => tex64((g) => (px(g, c, 0, 0, 64, 64), speckle(g, 64, 64, ['#00000012', '#ffffff18'], 160, 5), px(g, '#00000022', 0, 52, 64, 12))),
	brick: (c = '#a85a3a') => () =>
		tex64((g) => {
			px(g, '#c8b49a', 0, 0, 64, 64);
			for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? -8 : 0; x < 64; x += 16) px(g, ['#9a4a30', c, '#8a4028', '#b0603e'][((x + y) / 8) & 3], x + 1, y + 1, 14, 6);
			speckle(g, 64, 64, ['#00000022'], 70, 4);
		}),
	corrugated: (c = '#6a7078') => () => tex64((g) => {
		px(g, c, 0, 0, 64, 64);
		for (let x = 0; x < 64; x += 4) (px(g, '#00000033', x, 0, 1, 64), px(g, '#ffffff22', x + 2, 0, 1, 64));
		speckle(g, 64, 64, ['#8a5a3a88', '#00000022'], 120, 6);
	}),
	cash: () =>
		tex64((g) => {
			px(g, '#8aa878', 0, 0, 32, 16);
			px(g, '#6a8a5a', 1, 1, 30, 14);
			px(g, '#a8c498', 3, 3, 26, 10);
			px(g, '#5a7a4a', 12, 4, 8, 8);
			px(g, '#2a3a2a', 4, 5, 3, 1);
			px(g, '#2a3a2a', 25, 10, 3, 1);
		}, 32, 16),
	cashSide: () => tex64((g) => {
		for (let y = 0; y < 32; y += 2) px(g, y % 4 ? '#e8e4d4' : '#a8c498', 0, y, 32, 2);
	}, 32, 32),
	wood: (c = '#7a5232') => () => tex64((g) => {
		px(g, c, 0, 0, 64, 64);
		for (let y = 0; y < 64; y += 4) px(g, '#00000018', 0, y, 64, 1);
		speckle(g, 64, 64, ['#00000022', '#ffffff14'], 120, 9);
	}),
	carpet: (a: string, b: string) => () => tex64((g) => {
		px(g, a, 0, 0, 64, 64);
		for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 64; x += 8) px(g, b, x, y, 2, 2);
	}),
	stripes: (a: string, b: string, n = 8) => () => tex64((g) => {
		for (let x = 0; x < 64; x += n) (px(g, a, x, 0, n / 2, 64), px(g, b, x + n / 2, 0, n / 2, 64));
	}),
	zebra: () => tex64((g) => {
		px(g, '#f2f0e8', 0, 0, 64, 64);
		for (let x = 0; x < 64; x += 8) for (let y = 0; y < 64; y++) px(g, '#141414', x + Math.round(Math.sin(y * 0.2 + x) * 2), y, 3, 1);
	}),
	giraffe: () => tex64((g) => {
		px(g, '#f0d8a0', 0, 0, 64, 64);
		const r = rnd(8);
		for (let y = 0; y < 64; y += 10) for (let x = (y / 10) % 2 ? 5 : 0; x < 64; x += 11) px(g, '#b06a2a', x + Math.floor(r() * 2), y + Math.floor(r() * 2), 8, 7);
	}),
	hippo: () => tex64((g) => (px(g, '#7a6a72', 0, 0, 32, 32), speckle(g, 32, 32, ['#6a5a62', '#8a7a82', '#9a7a7a'], 90, 6)), 32, 32),
	map: () =>
		// crude 64-px painted mask of the Americas (land = green, sea = blue): north at top
		tex64((g) => {
			px(g, '#1a3a6a', 0, 0, 64, 64);
			const land = '#4a8a3a';
			const N: [number, number, number][] = [[2, 6, 26], [3, 4, 30], [4, 4, 34], [5, 6, 34], [6, 8, 33], [7, 10, 33], [8, 12, 32], [9, 14, 31], [10, 15, 30], [11, 16, 29], [12, 17, 28], [13, 18, 27], [14, 19, 26], [15, 20, 25], [16, 21, 24], [17, 22, 24], [18, 23, 24], [19, 24, 25], [20, 25, 26], [21, 26, 27], [22, 27, 28], [23, 28, 29], [24, 29, 30], [25, 30, 31], [26, 31, 32], [27, 31, 33], [28, 30, 38], [29, 29, 41], [30, 29, 44], [31, 29, 46], [32, 29, 47], [33, 30, 48], [34, 31, 48], [35, 32, 47], [36, 33, 46], [37, 34, 45], [38, 34, 44], [39, 34, 43], [40, 35, 42], [41, 35, 41], [42, 35, 41], [43, 35, 40], [44, 35, 40], [45, 35, 39], [46, 35, 38], [47, 35, 38], [48, 35, 37], [49, 35, 37], [50, 35, 36]];
			for (const [y, x0, x1] of N) px(g, land, x0, y + 4, x1 - x0, 1);
			for (const [y, x0, x1] of [[2, 22, 30], [3, 20, 32], [4, 22, 31], [5, 24, 30]] as [number, number, number][]) px(g, '#e8eef2', x0, y + 4, x1 - x0, 1); // ice up north
			px(g, '#c8a23a', 30, 32, 2, 2); // Colombia marker
		}),
	night: () => tex64((g) => {
		px(g, '#0a0f24', 0, 0, 64, 64);
		speckle(g, 64, 36, ['#ffffff', '#9cb0ff'], 26, 8);
		for (let x = 0; x < 64; x += 6) px(g, '#121830', x, 36 + ((x * 13) % 12), 6, 30);
		for (let i = 0; i < 60; i++) px(g, '#f0c060', (i * 37) % 62, 40 + ((i * 17) % 22), 1, 1);
	}),
	bulbs: () => tex64((g) => (px(g, '#1a1410', 0, 0, 64, 64), speckle(g, 64, 64, ['#ffcf7a', '#ffe0a0', '#ff9a4a'], 260, 11))),
	cork: () => tex64((g) => (px(g, '#b8885a', 0, 0, 64, 64), speckle(g, 64, 64, ['#a87a4a', '#c8986a', '#8a6a3a'], 300, 5))),
};

// ---------- props & animals ----------
export const Hippo: React.FC<{pos?: V3; rot?: number; s?: number; sub?: number; jaw?: number}> = ({pos = [0, 0, 0], rot = 0, s = 1, sub = 0, jaw = 0}) => {
	const m = useMemo(() => lambert({map: TX.hippo()}), []);
	const pink = useMemo(() => lambert({color: '#d88a8a'}), []);
	const dark = useMemo(() => lambert({color: '#2a1e22'}), []);
	return (
		<group position={[pos[0], pos[1] - sub, pos[2]]} rotation={[0, rot, 0]} scale={s}>
			<B size={[1.8, 1.5, 3.2]} pos={[0, 1.4, 0]} mat={m} />
			<B size={[1.6, 0.4, 3.0]} pos={[0, 2.2, 0]} mat={m} />
			{[-0.6, 0.6].map((x) => [-1.0, 1.0].map((z) => <B key={`${x}${z}`} size={[0.5, 0.8, 0.5]} pos={[x, 0.4, z]} mat={m} />))}
			<group position={[0, 1.7, 1.9]}>
				<B size={[1.3, 0.9, 1.0]} mat={m} />
				{/* upper snout + jaw (opens for the yawn) */}
				<B size={[1.4, 0.5, 1.1]} pos={[0, 0.05, 0.95]} mat={m} />
				<group position={[0, -0.25, 0.4]} rotation={[jaw, 0, 0]}>
					<B size={[1.3, 0.35, 1.0]} pos={[0, -0.12, 0.55]} mat={m} />
					<B size={[1.1, 0.06, 0.9]} pos={[0, 0.06, 0.55]} mat={pink} />
					{jaw > 0.3 ? [-0.45, 0.45].map((x) => <B key={x} size={[0.12, 0.3, 0.12]} pos={[x, 0.2, 0.95]} color="#f2ead8" />) : null}
				</group>
				{[-0.3, 0.3].map((x) => (
					<group key={x}>
						<B size={[0.22, 0.22, 0.12]} pos={[x * 1.7, 0.5, -0.2]} mat={m} />
						<B size={[0.18, 0.18, 0.1]} pos={[x * 1.3, 0.42, 0.45]} color="#f2ead8" />
						<B size={[0.1, 0.1, 0.11]} pos={[x * 1.3, 0.42, 0.47]} mat={dark} />
						<B size={[0.12, 0.08, 0.06]} pos={[x, 0.31, 1.5]} mat={dark} />
					</group>
				))}
			</group>
		</group>
	);
};

export const Giraffe: React.FC<{pos?: V3; rot?: number}> = ({pos = [0, 0, 0], rot = 0}) => {
	const m = useMemo(() => lambert({map: TX.giraffe()}), []);
	return (
		<group position={pos} rotation={[0, rot, 0]}>
			{[-0.4, 0.4].map((x) => [-0.8, 0.8].map((z) => <B key={`${x}${z}`} size={[0.25, 3.2, 0.25]} pos={[x, 1.6, z]} mat={m} />))}
			<B size={[1.2, 1.2, 2.4]} pos={[0, 3.6, 0]} mat={m} />
			<B size={[0.45, 3.4, 0.45]} pos={[0, 5.4, 1.2]} rot={[0.35, 0, 0]} mat={m} />
			<B size={[0.6, 0.55, 1.0]} pos={[0, 7.0, 1.95]} mat={m} />
			{[-0.15, 0.15].map((x) => <B key={x} size={[0.08, 0.3, 0.08]} pos={[x, 7.4, 1.7]} color="#6a3a1a" />)}
		</group>
	);
};

export const Zebra: React.FC<{pos?: V3; rot?: number}> = ({pos = [0, 0, 0], rot = 0}) => {
	const m = useMemo(() => lambert({map: TX.zebra()}), []);
	return (
		<group position={pos} rotation={[0, rot, 0]}>
			{[-0.35, 0.35].map((x) => [-0.7, 0.7].map((z) => <B key={`${x}${z}`} size={[0.22, 1.3, 0.22]} pos={[x, 0.65, z]} mat={m} />))}
			<B size={[0.9, 0.9, 2.0]} pos={[0, 1.7, 0]} mat={m} />
			<B size={[0.4, 1.1, 0.5]} pos={[0, 2.4, 1.0]} rot={[0.5, 0, 0]} mat={m} />
			<B size={[0.45, 0.45, 0.9]} pos={[0, 2.85, 1.45]} mat={m} />
			<B size={[0.12, 0.7, 0.4]} pos={[0, 2.6, 0.9]} rot={[0.5, 0, 0]} color="#141414" />
		</group>
	);
};

export const Egret: React.FC<{pos: V3; rot?: number}> = ({pos, rot = 0}) => (
	<group position={pos} rotation={[0, rot, 0]}>
		<B size={[0.3, 0.3, 0.6]} pos={[0, 0.7, 0]} color="#f8f8f2" />
		<B size={[0.1, 0.5, 0.1]} pos={[0, 1.0, 0.25]} color="#f8f8f2" />
		<B size={[0.08, 0.06, 0.3]} pos={[0, 1.22, 0.4]} color="#e8c040" />
		{[-0.08, 0.08].map((x) => <B key={x} size={[0.04, 0.55, 0.04]} pos={[x, 0.28, 0]} color="#2a2a2a" />)}
	</group>
);

const Chicken: React.FC<{pos: V3; rot?: number; c?: string}> = ({pos, rot = 0, c = '#f2ead8'}) => (
	<group position={pos} rotation={[0, rot, 0]}>
		<B size={[0.4, 0.35, 0.55]} pos={[0, 0.4, 0]} color={c} />
		<B size={[0.22, 0.25, 0.22]} pos={[0, 0.68, 0.25]} color={c} />
		<B size={[0.08, 0.12, 0.1]} pos={[0, 0.84, 0.25]} color="#c83a2a" />
		<B size={[0.08, 0.06, 0.12]} pos={[0, 0.66, 0.4]} color="#e8a83a" />
		{[-0.1, 0.1].map((x) => <B key={x} size={[0.04, 0.22, 0.04]} pos={[x, 0.11, 0]} color="#e8a83a" />)}
	</group>
);

export const Tree: React.FC<{pos: V3; s?: number; c?: string; trunk?: string}> = ({pos, s = 1, c = '#3a7a2e', trunk = '#5a3a22'}) => (
	<group position={pos} scale={s}>
		<B size={[0.5, 3, 0.5]} pos={[0, 1.5, 0]} color={trunk} />
		<mesh position={[0, 3.8, 0]} castShadow>
			<icosahedronGeometry args={[1.8, 0]} />
			<meshLambertMaterial color={c} flatShading />
		</mesh>
		<mesh position={[0.8, 3.2, 0.4]} castShadow>
			<icosahedronGeometry args={[1.1, 0]} />
			<meshLambertMaterial color={c} flatShading />
		</mesh>
	</group>
);

export const Palm: React.FC<{pos: V3; s?: number}> = ({pos, s = 1}) => (
	<group position={pos} scale={s}>
		{[0, 1, 2, 3].map((i) => <B key={i} size={[0.4, 1.6, 0.4]} pos={[i * 0.12, 0.8 + i * 1.5, 0]} rot={[0, 0, -0.08]} color="#7a6040" />)}
		{[0, 1, 2, 3, 4].map((i) => (
			<B key={i} size={[0.4, 0.08, 2.6]} pos={[0.4 + Math.sin((i / 5) * PI * 2) * 0.9, 6.0, Math.cos((i / 5) * PI * 2) * 0.9]} rot={[0.35, (i / 5) * PI * 2, 0]} color="#3a8a3a" />
		))}
	</group>
);

export const Plane: React.FC<{prop?: number; c?: string; stripe?: string}> = ({prop = 0, c = '#f2f0e8', stripe = '#2a4a8a'}) => (
	<group>
		<B size={[1.2, 1.2, 6]} pos={[0, 1.6, 0]} color={c} />
		<B size={[1.0, 0.9, 1.4]} pos={[0, 1.6, 3.4]} color={c} />
		<B size={[1.22, 0.25, 6.02]} pos={[0, 1.5, 0]} color={stripe} />
		<B size={[9, 0.15, 1.5]} pos={[0, 2.25, 0.8]} color={c} />
		<B size={[3, 0.12, 0.9]} pos={[0, 1.9, -2.8]} color={c} />
		<B size={[0.12, 1.4, 1.0]} pos={[0, 2.6, -2.8]} color={stripe} />
		<B size={[1.02, 0.4, 1.2]} pos={[0, 2.05, 1.6]} color="#6a9ac8" />
		<group position={[0, 1.6, 4.15]} rotation={[0, 0, prop]}>
			<B size={[0.12, 2.6, 0.08]} color="#2a2a2a" shadow={false} />
		</group>
		{[-1.2, 1.2].map((x) => <B key={x} size={[0.12, 0.8, 0.12]} pos={[x, 0.6, 0.8]} color="#3a3a3a" />)}
		{[-1.2, 1.2].map((x) => <Cyl key={x} r={0.3} h={0.2} seg={8} pos={[x, 0.3, 0.8]} rot={[0, 0, PI / 2]} color="#141414" />)}
	</group>
);

export const CashBrick: React.FC<{pos?: V3; rot?: V3; half?: -1 | 1; open?: number; band?: boolean}> = ({pos = [0, 0, 0], rot = [0, 0, 0], half, open = 0, band = true}) => {
	const top = useMemo(() => lambert({map: TX.cash()}), []);
	const side = useMemo(() => lambert({map: TX.cashSide()}), []);
	const mats = [side, side, top, top, side, side];
	const w = half ? 0.5 : 1;
	return (
		<group position={pos} rotation={rot}>
			<group position={[half ? half * (0.25 + open) : 0, 0, 0]}>
				<mesh material={mats} castShadow receiveShadow>
					<boxGeometry args={[1.6 * w, 0.5, 0.75]} />
				</mesh>
				{band
					? [-0.42, 0.42]
							.filter((x) => !half || Math.sign(x) === half)
							.map((x) => <B key={x} size={[0.12, 0.52, 0.77]} pos={[half ? x - half * 0.4 : x, 0, 0]} color="#c8963a" shadow={false} />)
					: null}
			</group>
		</group>
	);
};

const Candle: React.FC<{pos: V3; f: number; i: number}> = ({pos, f, i}) => {
	const fl = 0.85 + 0.15 * Math.sin(f * 0.9 + i * 2.1);
	return (
		<group position={pos}>
			<Cyl r={0.12} h={0.5 + (i % 3) * 0.15} seg={6} pos={[0, 0.25, 0]} color="#f2ead8" />
			<B size={[0.08, 0.16 * fl, 0.08]} pos={[0, 0.6 + (i % 3) * 0.15, 0]} color="#ffb84a" glow={4 * fl} shadow={false} />
		</group>
	);
};

const Ground: React.FC<{mat: THREE.Material; size?: number; y?: number}> = ({mat, size = 200, y = 0}) => (
	<mesh rotation={[-PI / 2, 0, 0]} position={[0, y, 0]} material={mat} receiveShadow>
		<planeGeometry args={[size, size]} />
	</mesh>
);

const Mountains: React.FC<{c?: string; z?: number}> = ({c = '#4a6a5a', z = -90}) => (
	<group>
		{[-70, -35, 0, 35, 70].map((x, i) => (
			<mesh key={x} position={[x, 0, z - (i % 2) * 15]} castShadow={false}>
				<coneGeometry args={[30 + (i % 3) * 8, 34 + (i % 2) * 14, 6]} />
				<meshLambertMaterial color={c} flatShading />
			</mesh>
		))}
	</group>
);

// ===================================================================================
// River (hook + callback). `ruin` = the ranch gate in ruins for the final shot.
export const River: React.FC<{f: number; gate?: boolean; ruin?: boolean}> = ({f, gate, ruin}) => {
	const water = useTex(TX.water(), 16, 16);
	const mud = useTex(TX.mud, 10, 10);
	const ripple = Math.sin(f * 0.15) * 0.05;
	const r = useMemo(() => rnd(21), []);
	const reeds = useMemo(() => Array.from({length: 40}, () => [(r() - 0.5) * 50, -6 - r() * 6, 1.2 + r() * 1.6] as V3), [r]);
	return (
		<>
			<SkyDome top="#3a6aa8" bottom="#f8c890" fog="#e8c0a0" near={40} far={140} />
			<SunDisc pos={[-60, 18, -120]} color="#ffc880" r={8} i={5} />
			<Rig4 sky="#a8c8ff" ground="#5a4a30" key="#ffc87a" keyI={2.0} keyPos={[-16, 7, -8]} rim="#ffd8a0" rimI={2.2} span={30} />
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, ripple, 0]} material={water} receiveShadow>
				<planeGeometry args={[220, 220]} />
			</mesh>
			{/* far bank: mud, reeds, trees, palms */}
			<mesh position={[0, 0.3, -16]} material={mud} receiveShadow>
				<boxGeometry args={[220, 1, 14]} />
			</mesh>
			{reeds.map((p, i) => <B key={i} size={[0.08, p[2], 0.08]} pos={[p[0], 0.8 + p[2] / 2, p[1]]} rot={[0, 0, (i % 5) * 0.06 - 0.12]} color={i % 3 ? '#6a8a3a' : '#8a9a4a'} shadow={false} />)}
			{[-30, -18, -6, 8, 20, 34].map((x, i) => (i % 2 ? <Palm key={x} pos={[x, 0.8, -19 - (i % 3) * 3]} s={1.4} /> : <Tree key={x} pos={[x, 0.8, -20 - (i % 3) * 2]} s={1.6} c={['#3a7a2e', '#4a8a36', '#2e6a2a'][i % 3]} />))}
			<Mountains c="#5a7a8a" z={-100} />
			{/* egrets, canoe, warning sign */}
			{[
				[-7, -10.2],
				[-5.5, -10.6],
				[9, -10.4],
			].map(([x, z], i) => <Egret key={i} pos={[x, 0.8, z]} rot={i * 0.8} />)}
			<group position={[7, 0.15, -3]} rotation={[0, 0.4, 0]}>
				<B size={[1.2, 0.5, 6]} color="#5a3a22" />
				<B size={[1.0, 0.1, 5.6]} pos={[0, 0.2, 0]} color="#3a2414" />
				<B size={[0.1, 0.1, 3]} pos={[0.5, 0.5, 0.5]} rot={[0.5, 0, 0]} color="#8a6a44" />
			</group>
			<group position={[-9, 0.8, -9.5]} rotation={[0, 0.3, 0]}>
				<B size={[0.25, 4, 0.25]} pos={[0, 2, 0]} color="#6a5a44" />
				<B size={[3.6, 1.8, 0.15]} pos={[0, 3.6, 0]} color="#f2d040" />
				<B size={[3.3, 1.5, 0.17]} pos={[0, 3.6, 0]} color="#141414" />
				<B size={[3.1, 1.3, 0.19]} pos={[0, 3.6, 0]} color="#f2d040" />
				<BlockText text="PELIGRO" size={0.42} depth={0.06} color="#c8201a" position={[0, 3.85, 0.12]} />
				<BlockText text="HIPOPOTAMOS" size={0.24} depth={0.05} color="#141414" position={[0, 3.3, 0.12]} />
			</group>
			{gate || ruin ? (
				<group position={[14, 0.8, -12]} rotation={[0, -0.5, 0]}>
					{[-2.6, 2.6].map((x) => <B key={x} size={[0.8, ruin ? (x < 0 ? 3.5 : 5.5) : 6, 0.8]} pos={[x, ruin ? (x < 0 ? 1.75 : 2.75) : 3, 0]} color={ruin ? '#b8b0a0' : '#f2f0e8'} />)}
					{!ruin ? <B size={[6.4, 0.6, 0.8]} pos={[0, 6.1, 0]} color="#f2f0e8" /> : <B size={[3.4, 0.5, 0.8]} pos={[0.6, 0.3, 1.4]} rot={[0, 0.4, 0.15]} color="#b8b0a0" />}
					<B size={[2.4, 3, 0.1]} pos={[ruin ? -1.0 : -1.2, 1.6, 0.2]} rot={[0, ruin ? 0.9 : 0, ruin ? 0.25 : 0]} color="#6a4a2a" />
					{ruin ? <mesh position={[2.6, 5.8, 0]}><icosahedronGeometry args={[1.2, 0]} /><meshLambertMaterial color="#3a7a2e" flatShading /></mesh> : null}
				</group>
			) : null}
		</>
	);
};

// 1950s Medellín hillside home
export const Hillside: React.FC = () => {
	const grass = useTex(TX.grass('#5a8a36', '#6a9a3e'), 12, 12);
	const wall = useTex(TX.plaster('#f0e2c0'), 2, 1);
	const tin = useTex(TX.corrugated('#8a8a88'), 3, 1);
	return (
		<>
			<SkyDome top="#4a80c8" bottom="#f8e0b0" fog="#d8e0e8" near={40} far={140} />
			<SunDisc pos={[60, 30, -110]} color="#fff0c8" r={7} i={5} />
			<Rig4 sky="#c8dcff" ground="#4a6a2a" key="#ffe0a8" keyI={2.0} keyPos={[12, 9, 4]} rim="#ffe8c0" span={24} />
			<Ground mat={grass} />
			<Mountains c="#3a6a4a" z={-80} />
			{/* house: plaster walls, tin roof, blue door, window with plants */}
			<group position={[0, 0, -8]}>
				<mesh material={wall} position={[0, 2.5, 0]} castShadow receiveShadow>
					<boxGeometry args={[9, 5, 6]} />
				</mesh>
				<mesh material={tin} position={[0, 5.5, 0.4]} rotation={[0.18, 0, 0]} castShadow>
					<boxGeometry args={[10.5, 0.2, 7.5]} />
				</mesh>
				<B size={[1.6, 3, 0.1]} pos={[-1.5, 1.5, 3.02]} color="#2a6aa8" />
				<B size={[1.8, 1.4, 0.1]} pos={[2.2, 2.8, 3.02]} color="#2a2a3a" />
				<B size={[2.2, 0.3, 0.6]} pos={[2.2, 2.0, 3.2]} color="#a85a3a" />
				{[1.5, 2.2, 2.9].map((x) => <B key={x} size={[0.4, 0.5, 0.4]} pos={[x, 2.45, 3.2]} color="#c83a5a" />)}
			</group>
			{/* laundry line, coffee bushes, chickens, path, water barrel, slate */}
			<B size={[0.15, 3.4, 0.15]} pos={[-7, 1.7, -3]} color="#6a4a2a" />
			<B size={[0.15, 3.4, 0.15]} pos={[-2, 1.7, -1]} color="#6a4a2a" />
			<B size={[5.4, 0.03, 0.03]} pos={[-4.5, 3.3, -2]} rot={[0, 0.38, 0]} color="#e8e8e8" shadow={false} />
			{['#f2f2f2', '#c84a3a', '#4a6aa8', '#e8c84a'].map((c, i) => <B key={c} size={[0.8, 1.1, 0.05]} pos={[-6.2 + i * 1.2, 2.7, -2.6 + i * 0.45]} rot={[0, 0.38, 0]} color={c} />)}
			{[-9, -10.5, 8, 9.5, 11].map((x, i) => (
				<mesh key={x} position={[x, 0.9, -4 + (i % 2) * 2]} castShadow>
					<icosahedronGeometry args={[1.1, 0]} />
					<meshLambertMaterial color="#2e6a2a" flatShading />
				</mesh>
			))}
			{[
				[3, 1],
				[4.2, 2.2],
				[-3.5, 2.6],
			].map(([x, z], i) => <Chicken key={i} pos={[x, 0, z]} rot={i * 1.3} c={i === 1 ? '#a85a2a' : '#f2ead8'} />)}
			<Cyl r={0.6} h={1.4} seg={8} pos={[5.2, 0.7, -4.4]} color="#4a6a8a" />
			<mesh rotation={[-PI / 2, 0, 0]} position={[-1.5, 0.02, 1]}>
				<planeGeometry args={[1.8, 12]} />
				<meshLambertMaterial color="#b89a6a" />
			</mesh>
		</>
	);
};

// Street market (lottery tickets, contraband cigarettes)
export const Market: React.FC = () => {
	const ground = useTex(TX.dirt, 8, 8);
	const wall = useTex(TX.plaster('#e8c8a0'), 4, 1);
	const awnA = useTex(TX.stripes('#c83a3a', '#f2ead8'), 2, 1);
	const awnB = useTex(TX.stripes('#2a6aa8', '#f2ead8'), 2, 1);
	return (
		<>
			<SkyDome top="#3a7ac8" bottom="#f0e8d0" />
			<SunDisc pos={[40, 60, -100]} color="#fff4d8" r={6} i={5} />
			<Rig4 sky="#d0e4ff" ground="#6a5a40" key="#fff0d0" keyI={2.2} keyPos={[8, 14, 6]} rim="#ffe0b0" span={22} />
			<Ground mat={ground} />
			<mesh material={wall} position={[0, 5, -9]} receiveShadow>
				<boxGeometry args={[40, 10, 1]} />
			</mesh>
			{[-8, -2.5, 3, 8.5].map((x, i) => (
				<group key={x} position={[x, 0, -5]}>
					<B size={[4.4, 2.2, 2]} pos={[0, 1.1, 0]} color="#8a6a44" />
					<mesh material={i % 2 ? awnB : awnA} position={[0, 4.6, 0.4]} rotation={[0.25, 0, 0]} castShadow>
						<boxGeometry args={[4.8, 0.12, 3]} />
					</mesh>
					{[-2.1, 2.1].map((xx) => <B key={xx} size={[0.12, 4.4, 0.12]} pos={[xx, 2.2, 1.3]} color="#5a4a3a" />)}
					{Array.from({length: 8}, (_, k) => (
						<B key={k} size={[0.42, 0.42, 0.42]} pos={[-1.6 + (k % 4) * 1.05, 2.45 + Math.floor(k / 4) * 0.45, 0.4 - Math.floor(k / 4) * 0.5]} color={[['#e8a83a', '#c83a2a', '#3a8a3a', '#f2d040'], ['#e86a2a', '#7a3a8a', '#f2f2a0', '#3aa84a']][i % 2][k % 4]} />
					))}
				</group>
			))}
			{/* radio stand, crate of cigarette cartons, a ticket board */}
			<group position={[4.4, 0, 0.6]}>
				<B size={[2.6, 1.2, 1.6]} pos={[0, 0.6, 0]} color="#6a4a2a" />
				{Array.from({length: 6}, (_, k) => <B key={k} size={[0.7, 0.3, 0.45]} pos={[-0.85 + (k % 3) * 0.85, 1.36 + Math.floor(k / 3) * 0.31, 0]} color={k % 2 ? '#f2f2f2' : '#c83a3a'} />)}
			</group>
			<group position={[-5.2, 0, 0]}>
				<B size={[0.12, 3.6, 0.12]} pos={[0, 1.8, 0]} color="#3a3a3a" />
				<B size={[2.6, 1.8, 0.1]} pos={[0, 3.6, 0]} color="#f2ead8" />
				{Array.from({length: 8}, (_, k) => <B key={k} size={[0.5, 0.7, 0.04]} pos={[-0.9 + (k % 4) * 0.6, 3.95 - Math.floor(k / 4) * 0.8, 0.07]} color={['#e8c84a', '#f2a0a0', '#a0c8f2', '#c8f2a0'][k % 4]} shadow={false} />)}
				<BlockText text="LOTERIA" size={0.32} depth={0.05} color="#c83a2a" position={[0, 4.75, 0.06]} />
			</group>
			<B size={[0.4, 0.5, 0.3]} pos={[-8.5, 2.45, -4.6]} color="#2a2a2a" />
			{[-12, 12].map((x) => <B key={x} size={[0.3, 0.3, 0.3]} pos={[x * 0.5, 6.6, -2]} color="#ffd88a" glow={1.5} shadow={false} />)}
		</>
	);
};

// Night alley / warehouse door
export const Alley: React.FC<{door: number}> = ({door}) => {
	const ground = useTex(TX.mud, 8, 8);
	const corr = useTex(TX.corrugated('#5a6068'), 6, 2);
	const brick = useTex(TX.brick('#7a4a3a'), 6, 3);
	return (
		<>
			<SkyDome top="#04060e" bottom="#101828" fog="#101828" near={18} far={60} />
			<Rig4 sky="#3a4a7a" ground="#1a1410" hemi={0.5} key="#ff9a4a" keyI={1.6} keyPos={[8, 9, 4]} rim="#4a7aff" rimI={2.4} fill={0.3} />
			<Ground mat={ground} />
			<mesh material={corr} position={[2, 5, -6]} receiveShadow>
				<boxGeometry args={[18, 10, 1]} />
			</mesh>
			<mesh material={brick} position={[-7, 5, 0]} rotation={[0, PI / 2, 0]} receiveShadow>
				<boxGeometry args={[20, 10, 1]} />
			</mesh>
			{/* sliding door, crates, drums, puddles, sodium lamp */}
			<B size={[5, 6, 0.3]} pos={[2 + door * 5, 3, -5.3]} color="#7a8088" />
			<B size={[5.2, 6.2, 0.1]} pos={[2, 3, -5.45]} color="#05050a" />
			{[
				[-4, 0.7, -3.5],
				[-4, 2.1, -3.6],
				[-2.6, 0.7, -4.2],
			].map((p, i) => <B key={i} size={[1.4, 1.4, 1.4]} pos={p as V3} rot={[0, i * 0.3, 0]} color="#7a5a3a" />)}
			{[6.5, 7.6].map((x) => <Cyl key={x} r={0.55} h={1.6} seg={8} pos={[x, 0.8, -4]} color="#3a5a3a" />)}
			{[
				[0, 1.2],
				[3.4, 3],
			].map(([x, z], i) => (
				<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[x, 0.02, z]}>
					<circleGeometry args={[1.2 + i * 0.4, 8]} />
					<meshLambertMaterial color="#1a2a4a" emissive="#ff8a3a" emissiveIntensity={0.25} />
				</mesh>
			))}
			<group position={[6, 0, -4.8]}>
				<B size={[0.2, 9, 0.2]} pos={[0, 4.5, 0]} color="#2a2a2a" />
				<B size={[0.8, 0.3, 0.5]} pos={[-0.5, 8.9, 0.2]} color="#ffb060" glow={3} shadow={false} />
				<pointLight position={[-0.5, 8.3, 0.6]} color="#ff9a4a" intensity={10} distance={16} decay={1.3} />
			</group>
		</>
	);
};

// Police records room: the real 1976 mugshot (64-px decal) pinned to a cork board
export const Records: React.FC<{mug: THREE.Texture | null}> = ({mug}) => {
	const floor = useTex(TX.carpet('#4a4a52', '#3a3a42'), 6, 6);
	const wall = useTex(TX.plaster('#c8c8b0'), 4, 2);
	const cork = useTex(TX.cork, 2, 1);
	const mugMat = useMemo(() => (mug ? lambert({map: mug}) : lambert({color: '#888'})), [mug]);
	return (
		<>
			<SkyDome top="#101010" bottom="#202020" />
			<Rig4 sky="#c8d8ff" ground="#3a3430" hemi={0.6} key="#ffe0b0" keyI={1.4} keyPos={[4, 10, 8]} rim="#8ab0ff" fill={0.4} />
			<Ground mat={floor} />
			<mesh material={wall} position={[0, 6, -4]} receiveShadow>
				<boxGeometry args={[24, 12, 1]} />
			</mesh>
			<mesh material={cork} position={[0, 5.4, -3.45]}>
				<boxGeometry args={[7, 4.4, 0.15]} />
			</mesh>
			<B size={[7.4, 4.8, 0.1]} pos={[0, 5.4, -3.52]} color="#6a4a2a" />
			{/* the real mugshot, pinned */}
			<mesh material={mugMat} position={[-0.6, 5.5, -3.3]} rotation={[0, 0, -0.04]}>
				<boxGeometry args={[1.85, 2.6, 0.04]} />
			</mesh>
			<B size={[0.12, 0.12, 0.1]} pos={[-0.6, 6.75, -3.25]} color="#c83a3a" />
			{/* other papers, string, a 1976 label */}
			{[
				[1.9, 6.4, 0.1],
				[2.4, 4.6, -0.12],
				[-2.6, 4.4, 0.08],
				[-2.7, 6.5, -0.05],
			].map(([x, y, r], i) => <B key={i} size={[1.3, 1.6, 0.03]} pos={[x, y, -3.32]} rot={[0, 0, r]} color={i % 2 ? '#f2ead8' : '#e8e0c0'} shadow={false} />)}
			<B size={[3.2, 0.03, 0.03]} pos={[0.6, 5.9, -3.28]} rot={[0, 0, -0.3]} color="#c83a3a" shadow={false} />
			<BlockText text="MEDELLIN 1976" size={0.26} depth={0.04} color="#2a2a2a" position={[-0.6, 3.95, -3.28]} />
			{/* desk, typewriter, lamp, files, filing cabinet */}
			<B size={[5, 0.2, 2.2]} pos={[1.5, 2.6, -1.4]} color="#6a4a2a" />
			{[-0.8, 3.8].map((x) => <B key={x} size={[0.2, 2.6, 2]} pos={[x, 1.3, -1.4]} color="#5a3a22" />)}
			<B size={[1.4, 0.5, 1]} pos={[2.2, 2.95, -1.3]} color="#2a2a2a" />
			<B size={[1.2, 0.1, 0.2]} pos={[2.2, 3.25, -1.7]} color="#f2f2f2" />
			{[0, 1, 2].map((i) => <B key={i} size={[1.1, 0.12, 0.8]} pos={[0.2, 2.76 + i * 0.13, -1.2]} rot={[0, i * 0.15, 0]} color={['#e8c88a', '#d8b87a', '#c8a86a'][i]} />)}
			<B size={[1.6, 4, 1.4]} pos={[-5, 2, -2.8]} color="#7a8088" />
			<Cyl r={0.4} r2={0.15} h={0.4} seg={6} pos={[3.6, 3.6, -1.6]} color="#2a6a3a" glow={0.3} />
			<pointLight position={[3.4, 3.4, -1.2]} color="#ffd890" intensity={4} distance={8} />
		</>
	);
};

// Jungle airstrip
export const Airstrip: React.FC<{planeZ: number; planeY: number; prop: number}> = ({planeZ, planeY, prop}) => {
	const grass = useTex(TX.grass('#4a7a2e', '#5a8a36'), 14, 14);
	const strip = useTex(TX.dirt, 2, 14);
	return (
		<>
			<SkyDome top="#2a4a8a" bottom="#f8a060" fog="#e89070" near={40} far={160} />
			<SunDisc pos={[50, 10, -140]} color="#ffa060" r={10} i={5} />
			<Rig4 sky="#a8b8ff" ground="#4a5a2a" key="#ffa868" keyI={2.2} keyPos={[14, 5, -10]} rim="#ffc890" rimI={2.4} span={30} />
			<Ground mat={grass} />
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.02, -20]} material={strip} receiveShadow>
				<planeGeometry args={[7, 120]} />
			</mesh>
			{Array.from({length: 18}, (_, i) => (i % 2 ? <Palm key={i} pos={[(i % 4 < 2 ? -1 : 1) * (8 + (i % 3) * 3), 0, -i * 7 + 10]} s={1.3} /> : <Tree key={i} pos={[(i % 4 < 2 ? -1 : 1) * (9 + (i % 3) * 3), 0, -i * 7 + 10]} s={1.7} c={['#2e6a2a', '#3a7a2e'][i % 2]} />))}
			<Mountains c="#3a5a4a" z={-150} />
			{/* windsock, fuel drums, crates, shed */}
			<group position={[5.5, 0, 2]}>
				<B size={[0.15, 5, 0.15]} pos={[0, 2.5, 0]} color="#c8c8c8" />
				<B size={[0.5, 0.5, 1.8]} pos={[0, 4.9, 0.9]} rot={[0.15, 0.4, 0]} color="#ff7a2a" />
			</group>
			{[
				[-5, 0, 3],
				[-5.9, 0, 3.4],
				[-5.4, 1.2, 3.2],
			].map((p, i) => <Cyl key={i} r={0.45} h={1.2} seg={8} pos={[p[0], p[1] + 0.6, p[2]]} color={i === 2 ? '#c83a3a' : '#2a5a8a'} />)}
			{[0, 1, 2].map((i) => <B key={i} size={[1.2, 1, 1.2]} pos={[4.6 + i * 1.3, 0.5, 6]} rot={[0, i * 0.3, 0]} color="#8a6a44" />)}
			<group position={[-9, 0, -4]}>
				<B size={[5, 3.4, 4]} pos={[0, 1.7, 0]} color="#7a6a5a" />
				<B size={[5.8, 0.2, 4.8]} pos={[0, 3.6, 0]} rot={[0.12, 0, 0]} color="#8a8a88" />
			</group>
			<group position={[0, planeY, planeZ]} rotation={[-Math.min(0.25, planeY * 0.05), PI, 0]}>
				<Plane prop={prop} />
			</group>
		</>
	);
};

// Blocky map of the Americas with flight lines north
export const MapAmericas: React.FC<{progress: number}> = ({progress}) => {
	const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
	const mats = useMemo(() => ({land: lambert({color: '#ffffff'})}), []);
	const cells = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = c.height = 64;
		const g = c.getContext('2d')!;
		const t = TX.map();
		g.drawImage(t.image as HTMLCanvasElement, 0, 0);
		const d = g.getImageData(0, 0, 64, 64).data;
		const out: {x: number; y: number; h: number; ice: boolean}[] = [];
		for (let y = 0; y < 64; y++)
			for (let x = 0; x < 64; x++) {
				const i = (y * 64 + x) * 4;
				const land = d[i + 1] > 120 && d[i + 2] < 120;
				const ice = d[i] > 200 && d[i + 2] > 200;
				if (land || ice) out.push({x, y, h: 0.6 + ((x * 7 + y * 13) % 5) * 0.25, ice});
			}
		return out;
	}, []);
	const ref = React.useRef<THREE.InstancedMesh>(null);
	React.useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		const col = new THREE.Color();
		cells.forEach((c, i) => {
			m.compose(new THREE.Vector3((c.x - 32) * 0.5, c.h * 0.25, (c.y - 32) * 0.5), new THREE.Quaternion(), new THREE.Vector3(0.5, c.h * 0.5, 0.5));
			ref.current!.setMatrixAt(i, m);
			ref.current!.setColorAt(i, col.set(c.ice ? '#e8eef2' : c.h > 1.2 ? '#7a8a4a' : '#4a8a3a'));
		});
		ref.current!.instanceMatrix.needsUpdate = true;
		if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
	}, [cells]);
	// Colombia (≈ x 30, y 36) → US (≈ x 22, y 18)
	const from = new THREE.Vector3((30 - 32) * 0.5, 0.8, (36 - 32) * 0.5);
	const tos = [new THREE.Vector3((20 - 32) * 0.5, 0.8, (17 - 32) * 0.5), new THREE.Vector3((26 - 32) * 0.5, 0.8, (15 - 32) * 0.5), new THREE.Vector3((30 - 32) * 0.5, 0.8, (19 - 32) * 0.5)];
	return (
		<>
			<SkyDome top="#04060e" bottom="#0e1a30" />
			<Rig4 sky="#6a8aff" ground="#0a1020" hemi={0.8} key="#ffe0b0" keyI={1.8} keyPos={[-6, 14, 8]} rim="#4a8aff" span={20} />
			<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[60, 60]} />
				<meshLambertMaterial color="#123a6a" />
			</mesh>
			<instancedMesh ref={ref} args={[geo, mats.land, cells.length]} castShadow receiveShadow />
			{tos.map((to, k) =>
				Array.from({length: 14}, (_, i) => {
					const t = i / 13;
					if (t > progress * 1.15 - k * 0.08) return null;
					const p = from.clone().lerp(to, t);
					p.y += Math.sin(t * PI) * 2.2;
					return <B key={`${k}-${i}`} size={[0.22, 0.22, 0.22]} pos={[p.x, p.y, p.z]} color="#ff3a3a" glow={3} shadow={false} />;
				}),
			)}
			<B size={[0.6, 1.4, 0.6]} pos={[from.x, 1.2, from.z]} color="#ffd84a" glow={2} />
		</>
	);
};

// The rich list (hand-crafted, generic masthead): 7 issues 1987–1993 + an open page
export const RichList: React.FC<{shown: number}> = ({shown}) => {
	const floor = useTex(TX.wood('#5a3a22'), 3, 3);
	return (
		<>
			<SkyDome top="#1a1410" bottom="#2a2018" />
			<Rig4 sky="#ffe8c8" ground="#3a2a1a" hemi={0.7} key="#ffd8a0" keyI={1.8} keyPos={[-6, 12, 10]} rim="#ffb060" fill={0.4} />
			<mesh rotation={[-PI / 2, 0, 0]} material={floor} receiveShadow>
				<planeGeometry args={[40, 40]} />
			</mesh>
			{Array.from({length: 7}, (_, i) =>
				i < shown ? (
					<group key={i} position={[-4.5 + i * 1.5, 0.1 + i * 0.002, -1 + (i % 2) * 0.3]} rotation={[-PI / 2, 0, (i % 3) * 0.06 - 0.06]}>
						<B size={[1.4, 1.9, 0.08]} color={['#c83a2a', '#1a1a1a', '#2a4a8a', '#c8a23a', '#3a6a3a', '#6a2a5a', '#c83a2a'][i]} />
						<B size={[1.3, 0.3, 0.09]} pos={[0, 0.72, 0]} color="#f2f2f2" />
						<BlockText text={`${1987 + i}`} size={0.26} depth={0.03} color="#f2f2f2" position={[0, -0.6, 0.05]} />
						<BlockText text="BILLIONAIRES" size={0.11} depth={0.02} color="#c83a2a" position={[0, 0.72, 0.06]} />
					</group>
				) : null,
			)}
			{/* the open page with his line highlighted */}
			<group position={[0, 0.15, 2.6]} rotation={[-PI / 2 + 0.25, 0, 0]}>
				<B size={[6.2, 4.2, 0.06]} color="#f4f0e4" />
				<BlockText text="THE WORLD'S BILLIONAIRES" size={0.26} depth={0.03} color="#1a1a1a" position={[0, 1.65, 0.05]} />
				{Array.from({length: 6}, (_, k) => (k === 3 ? null : <B key={k} size={[5.2, 0.14, 0.07]} pos={[0, 1.1 - k * 0.45, 0]} color="#b8b4a8" shadow={false} />))}
				<B size={[5.6, 0.42, 0.07]} pos={[0, -0.25, 0]} color="#f2d84a" shadow={false} />
				<BlockText text="ESCOBAR, PABLO  ·  COLOMBIA" size={0.2} depth={0.03} color="#1a1a1a" position={[0, -0.27, 0.06]} />
			</group>
			<Cyl r={0.5} r2={0.2} h={0.6} seg={6} pos={[5.5, 3.5, -2]} color="#2a6a3a" glow={0.4} />
			<pointLight position={[5, 3, -1]} color="#ffd890" intensity={5} distance={10} />
		</>
	);
};

// Counting room: cash to the ceiling
export const CountingRoom: React.FC<{f: number}> = ({f}) => {
	const floor = useTex(TX.carpet('#5a2a2a', '#4a2020'), 6, 6);
	const wall = useTex(TX.plaster('#d8c8a0'), 4, 2);
	const stacks = useMemo(() => {
		const r = rnd(33);
		return Array.from({length: 26}, (_, i) => ({x: -7 + (i % 13) * 1.15, z: -3.8 - Math.floor(i / 13) * 1.0, h: 3 + Math.floor(r() * 9)}));
	}, []);
	return (
		<>
			<SkyDome top="#101010" bottom="#1a1410" />
			<Rig4 sky="#d8ffd8" ground="#3a2a1a" hemi={0.55} key="#fff0c8" keyI={1.4} keyPos={[2, 12, 6]} rim="#8aff9a" rimI={1.2} fill={0.35} />
			<mesh rotation={[-PI / 2, 0, 0]} material={floor} receiveShadow>
				<planeGeometry args={[40, 40]} />
			</mesh>
			<mesh material={wall} position={[0, 6, -5.2]}>
				<boxGeometry args={[30, 12, 1]} />
			</mesh>
			{stacks.map((s, i) => Array.from({length: s.h}, (_, k) => <CashBrick key={`${i}-${k}`} pos={[s.x, 0.25 + k * 0.5, s.z]} rot={[0, (k % 2) * 0.05, 0]} band={k % 3 === 0} />))}
			{/* table with counting machines, ledger, bankers lamp, rubber bands box */}
			<B size={[6.5, 0.25, 2.6]} pos={[0, 2.6, 0]} color="#6a4528" />
			{[-3, 3].map((x) => <B key={x} size={[0.25, 2.6, 2.4]} pos={[x, 1.3, 0]} color="#5a3a22" />)}
			{[-1.9, 1.9].map((x, i) => (
				<group key={x} position={[x, 2.75, -0.4]}>
					<B size={[1.1, 0.6, 0.9]} pos={[0, 0.3, 0]} color="#c8c4b8" />
					<B size={[0.9, 0.1, 0.5]} pos={[0, 0.62, 0.1]} color="#2a2a2a" />
					<B size={[0.5, 0.12, 0.08]} pos={[0, 0.4, 0.46]} color="#5aff8a" glow={2} shadow={false} />
					<group position={[0, 0.75 + ((f + i * 3) % 6) * 0.02, 0.1]}>
						<B size={[0.6, 0.04, 0.3]} color="#8aa878" />
					</group>
				</group>
			))}
			<B size={[1.4, 0.15, 1]} pos={[0.2, 2.8, 0.5]} color="#3a1a14" />
			<B size={[0.6, 0.35, 0.5]} pos={[2.3, 2.9, 0.6]} color="#c8963a" />
			<B size={[0.1, 0.8, 0.1]} pos={[-0.3, 3.1, -0.8]} color="#c8a23a" />
			<B size={[1.0, 0.35, 0.45]} pos={[-0.3, 3.6, -0.7]} color="#2a7a3a" glow={0.4} />
			<pointLight position={[-0.3, 3.3, 0]} color="#ffe8a0" intensity={7} distance={10} decay={1.4} />
		</>
	);
};

// Hacienda Nápoles: the gate with the small plane on top, pond, animals
export const Napoles: React.FC<{show: number}> = ({show}) => {
	const grass = useTex(TX.grass('#5a8a36', '#6a9a3e'), 14, 14);
	const water = useTex(TX.water('#4a6a6a', '#5a7a7a'), 6, 6);
	return (
		<>
			<SkyDome top="#3a70c0" bottom="#f8d8a8" fog="#e8d0b0" near={50} far={160} />
			<SunDisc pos={[-70, 22, -110]} color="#ffd090" r={8} i={5} />
			<Rig4 sky="#b8d0ff" ground="#4a6a2a" key="#ffd090" keyI={2.2} keyPos={[-14, 8, 4]} rim="#ffe0b0" rimI={2} span={30} />
			<Ground mat={grass} />
			<Mountains c="#4a7a5a" z={-110} />
			{/* the gate: white pillars, cross beam, small plane on top */}
			<group position={[0, 0, -14]}>
				{[-4, 4].map((x) => <B key={x} size={[1.2, 7, 1.2]} pos={[x, 3.5, 0]} color="#f2f0e8" />)}
				<B size={[9.4, 1.0, 1.3]} pos={[0, 7.4, 0]} color="#f2f0e8" />
				<BlockText text="NAPOLES" size={0.7} depth={0.15} color="#1a1a1a" position={[0, 7.4, 0.7]} />
				<group position={[0, 7.9, 0]} rotation={[0, 0.3, 0]} scale={0.7}>
					<Plane c="#f2f2f2" stripe="#2a4a8a" />
				</group>
				{[-12, -8, 8, 12].map((x) => <B key={x} size={[4, 1.2, 0.2]} pos={[x, 1.2, 0]} color="#e8e0d0" />)}
			</group>
			<mesh rotation={[-PI / 2, 0, 0]} position={[4, 0.03, -4]} material={water}>
				<circleGeometry args={[5, 10]} />
			</mesh>
			{show > 0 ? <Giraffe pos={[-6, 0, -6]} rot={0.6} /> : null}
			{show > 1 ? (
				<>
					<Zebra pos={[-2.5, 0, -2]} rot={-0.5} />
					<Zebra pos={[-0.8, 0, -4]} rot={-0.8} />
				</>
			) : null}
			{show > 2
				? [
						[3, -3, 0.3, 0.6, 0.9],
						[5.5, -5, -0.6, 0.6, 1.0],
						[6, -1.8, 0.9, 0.5, 0.8],
						[2, -6, -0.2, 0.5, 0.7],
					].map(([x, z, r, sub, s], i) => <Hippo key={i} pos={[x, 0, z]} rot={r} sub={sub} s={s * 0.8} />)
				: null}
			{[-14, -10, 12, 16].map((x, i) => <Palm key={x} pos={[x, 0, -10 - (i % 2) * 4]} s={1.4} />)}
		</>
	);
};

// Congress chamber
export const Congress: React.FC = () => {
	const floor = useTex(TX.carpet('#6a2a2a', '#5a2020'), 8, 8);
	const wood = useTex(TX.wood('#6a4528'), 4, 2);
	return (
		<>
			<SkyDome top="#1a1410" bottom="#2a2018" />
			<Rig4 sky="#ffe8c8" ground="#3a2018" hemi={0.75} key="#fff0d0" keyI={1.8} keyPos={[4, 14, 10]} rim="#ffd08a" rimI={1.8} fill={0.5} />
			<mesh rotation={[-PI / 2, 0, 0]} material={floor} receiveShadow>
				<planeGeometry args={[60, 60]} />
			</mesh>
			<mesh material={wood} position={[0, 7, -12]}>
				<boxGeometry args={[40, 14, 1]} />
			</mesh>
			{/* curved rows of desks */}
			{[0, 1, 2].map((row) =>
				Array.from({length: 9}, (_, i) => {
					const a = (i - 4) * 0.17;
					const rad = 9 + row * 2.6;
					return (
						<group key={`${row}-${i}`} position={[Math.sin(a) * rad, row * 0.6, -Math.cos(a) * rad + 4]} rotation={[0, -a, 0]}>
							<B size={[2.1, 1.6, 1]} pos={[0, 0.8, 0]} color="#5a3a22" />
							<B size={[2.2, 0.1, 1.1]} pos={[0, 1.65, 0]} color="#7a5232" />
							<B size={[0.05, 0.7, 0.05]} pos={[0.4, 2.0, 0.2]} rot={[0.4, 0, 0]} color="#2a2a2a" />
							<B size={[0.14, 0.14, 0.2]} pos={[0.4, 2.35, 0.35]} color="#1a1a1a" />
						</group>
					);
				}),
			)}
			{/* flags in national colours (no emblem), podium, chandeliers */}
			{[-8, 8].map((x) => (
				<group key={x} position={[x, 0, -11]}>
					<B size={[0.15, 8, 0.15]} pos={[0, 4, 0]} color="#c8a23a" />
					<B size={[2.6, 0.9, 0.05]} pos={[1.35, 7.1, 0]} color="#f2d040" />
					<B size={[2.6, 0.45, 0.05]} pos={[1.35, 6.45, 0]} color="#2a4aa8" />
					<B size={[2.6, 0.45, 0.05]} pos={[1.35, 6.0, 0]} color="#c8201a" />
				</group>
			))}
			<B size={[4, 2.6, 1.6]} pos={[0, 1.3, -9]} color="#4a2a18" />
			{[-6, 0, 6].map((x) => (
				<group key={x} position={[x, 12, -3]}>
					<B size={[0.06, 2, 0.06]} pos={[0, 1, 0]} color="#c8a23a" />
					<B size={[1.4, 0.5, 1.4]} color="#ffe8b0" glow={1.6} shadow={false} />
					<pointLight color="#ffe0a0" intensity={4} distance={14} />
				</group>
			))}
		</>
	);
};

// Night city: smoke, sirens; empty seats; candles (no gore — the cost, not the act)
export const NightCity: React.FC<{f: number; mode: 'smoke' | 'seats' | 'candles'}> = ({f, mode}) => {
	const ground = useTex(TX.plaster('#3a3a40'), 8, 8);
	const city = useMemo(() => new THREE.MeshBasicMaterial({map: rep(TX.night(), 3, 1)}), []);
	const siren = Math.floor(f / 6) % 2;
	return (
		<>
			<SkyDome top="#020308" bottom="#0e1222" fog="#0e1222" near={30} far={120} />
			<Rig4 sky="#3a4a8a" ground="#0a0a10" hemi={0.45} key="#8aa8ff" keyI={1.0} keyPos={[-8, 12, 6]} rim={siren ? '#ff3a3a' : '#3a6aff'} rimI={2.4} fill={0.3} />
			<mesh rotation={[-PI / 2, 0, 0]} material={ground} receiveShadow>
				<planeGeometry args={[100, 100]} />
			</mesh>
			<mesh material={city} position={[0, 14, -60]}>
				<planeGeometry args={[160, 40]} />
			</mesh>
			{mode === 'smoke'
				? Array.from({length: 16}, (_, i) => {
						const y = ((i * 1.4 + f * 0.05) % 22) + 1;
						return (
							<mesh key={i} position={[Math.sin(i * 1.7) * (1 + y * 0.18) - 4, y, -30 + Math.cos(i) * 2]} scale={1 + y * 0.16}>
								<icosahedronGeometry args={[1.6, 0]} />
								<meshLambertMaterial color={i < 4 ? '#a85a3a' : '#6a6068'} emissive={i < 4 ? '#ff5a1a' : '#2a1a14'} emissiveIntensity={i < 4 ? 0.8 : 0.3} flatShading transparent opacity={0.9} />
							</mesh>
						);
					})
				: null}
			{mode === 'smoke' ? (
				<>
					<pointLight position={[-4, 3, -26]} color="#ff7a2a" intensity={40} distance={40} decay={1.2} />
					<B size={[6, 1.2, 3]} pos={[-4, 0.6, -30]} color="#ff6a1a" glow={3} shadow={false} />
				</>
			) : null}
			{mode === 'seats'
				? Array.from({length: 4}, (_, row) =>
						Array.from({length: 6}, (_, k) => (
							<group key={`${row}-${k}`} position={[-3.2 + k * 1.15 + (k > 2 ? 0.7 : 0), 0, -row * 1.7]}>
								<B size={[1.0, 0.25, 1.0]} pos={[0, 1.1, 0]} color="#2a4a8a" />
								<B size={[1.0, 1.6, 0.2]} pos={[0, 2.0, -0.45]} color="#2a4a8a" />
								<B size={[0.9, 0.35, 0.22]} pos={[0, 2.75, -0.45]} color="#f2f2f2" />
								<B size={[0.1, 1.1, 0.1]} pos={[0, 0.55, 0]} color="#5a5a5a" />
							</group>
						)),
					)
				: null}
			{mode === 'seats' ? (
				<>
					<B size={[0.4, 8, 30]} pos={[-5, 4, -6]} color="#8a8a90" />
					{[-1, -5, -9].map((z) => <B key={z} size={[0.5, 0.15, 0.5]} pos={[0, 5.5, z]} color="#fff4dc" glow={3} shadow={false} />)}
					<pointLight position={[0, 5, -3]} color="#ffe8c8" intensity={10} distance={16} />
				</>
			) : null}
			{mode === 'candles'
				? Array.from({length: 40}, (_, i) => <Candle key={i} pos={[-4 + (i % 10) * 0.9 + (Math.floor(i / 10) % 2) * 0.45, 0, -Math.floor(i / 10) * 0.9]} f={f} i={i} />)
				: null}
			{mode === 'candles' ? <pointLight position={[0, 1.5, -1]} color="#ffa84a" intensity={8} distance={10} /> : null}
		</>
	);
};

// La Catedral: hilltop "prison" with comforts, city lights below
export const Catedral: React.FC<{night?: boolean}> = ({night}) => {
	const grass = useTex(TX.grass('#4a7a2e', '#5a8a36'), 12, 12);
	const brick = useTex(TX.brick('#a85a3a'), 4, 2);
	const city = useMemo(() => new THREE.MeshBasicMaterial({map: rep(TX.bulbs(), 6, 2)}), []);
	return (
		<>
			<SkyDome top={night ? '#04060e' : '#3a6ab0'} bottom={night ? '#1a1a30' : '#f8b880'} fog={night ? '#1a1a30' : '#e8b090'} near={40} far={150} />
			{night ? null : <SunDisc pos={[60, 10, -120]} color="#ffb070" r={9} i={5} />}
			<Rig4 sky={night ? '#5a6aa8' : '#ffd0a8'} ground="#3a4a2a" hemi={night ? 0.5 : 0.8} key={night ? '#9ab0ff' : '#ffb070'} keyI={night ? 1 : 2} keyPos={[12, 6, -8]} rim={night ? '#6a8aff' : '#ffd0a0'} span={26} />
			<Ground mat={grass} />
			<mesh material={city} rotation={[-PI / 2, 0, 0]} position={[0, -12, -70]}>
				<planeGeometry args={[200, 60]} />
			</mesh>
			{/* main building, guard tower, fence, football pitch, bar sign */}
			<mesh material={brick} position={[0, 3, -10]} castShadow receiveShadow>
				<boxGeometry args={[14, 6, 6]} />
			</mesh>
			<B size={[15, 0.4, 7]} pos={[0, 6.2, -10]} color="#7a3a2a" />
			{[-5, -2, 1, 4].map((x) => <B key={x} size={[1.6, 1.4, 0.1]} pos={[x, 3.6, -6.96]} color={night ? '#ffd27a' : '#3a4a6a'} glow={night ? 1.5 : 0} shadow={false} />)}
			<group position={[-10, 0, -6]}>
				{[-0.8, 0.8].map((x) => [-0.8, 0.8].map((z) => <B key={`${x}${z}`} size={[0.2, 7, 0.2]} pos={[x, 3.5, z]} color="#6a6a6a" />))}
				<B size={[2.4, 1.6, 2.4]} pos={[0, 7.6, 0]} color="#8a8a8a" />
				<B size={[2.8, 0.2, 2.8]} pos={[0, 8.5, 0]} color="#6a6a6a" />
			</group>
			{Array.from({length: 12}, (_, i) => <B key={i} size={[0.12, 3, 0.12]} pos={[-14 + i * 2.6, 1.5, 4]} color="#8a8a8a" />)}
			<B size={[30, 0.05, 0.05]} pos={[0.5, 2.8, 4]} color="#a8a8a8" shadow={false} />
			<B size={[30, 0.05, 0.05]} pos={[0.5, 1.8, 4]} color="#a8a8a8" shadow={false} />
			<mesh rotation={[-PI / 2, 0, 0]} position={[10, 0.03, -2]}>
				<planeGeometry args={[8, 5]} />
				<meshLambertMaterial color="#3a8a3a" />
			</mesh>
			{[6.2, 13.8].map((x) => <B key={x} size={[0.1, 1.2, 2]} pos={[x, 0.6, -2]} color="#f2f2f2" />)}
			<BlockText text="BAR" size={0.6} depth={0.1} color="#ff4a8a" emissive={2.5} position={[4.5, 5.2, -6.8]} />
			{/* gate (open at night = the escape) */}
			<B size={[4, 3, 0.2]} pos={[night ? -3.5 : 0, 1.5, 4]} rot={[0, night ? 1.2 : 0, 0]} color="#4a4a4a" />
		</>
	);
};

// Medellín rooftops at dusk
export const Rooftops: React.FC<{f: number}> = ({f}) => {
	const tile = useTex(TX.tile, 4, 4);
	const wall = useTex(TX.plaster('#d8b890'), 2, 1);
	const heliX = 20 - f * 0.06;
	return (
		<>
			<SkyDome top="#2a3a6a" bottom="#f8905a" fog="#d88a6a" near={40} far={140} />
			<SunDisc pos={[-60, 8, -120]} color="#ff9050" r={10} i={5} />
			<Rig4 sky="#8aa0e0" ground="#4a2a1a" key="#ff9a5a" keyI={2.3} keyPos={[-16, 5, -6]} rim="#ffb880" rimI={2.6} span={30} />
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, -6, 0]}>
				<planeGeometry args={[200, 200]} />
				<meshLambertMaterial color="#3a3030" />
			</mesh>
			{/* rows of houses with tiled roofs, water tanks, antennas, laundry */}
			{Array.from({length: 14}, (_, i) => {
				const x = -24 + (i % 7) * 8;
				const z = -6 - Math.floor(i / 7) * 12 - (i % 2) * 2;
				const h = 4 + (i % 3);
				return (
					<group key={i} position={[x, -6, z]}>
						<mesh material={wall} position={[0, h / 2, 0]} castShadow receiveShadow>
							<boxGeometry args={[7, h, 8]} />
						</mesh>
						<mesh material={tile} position={[0, h + 0.6, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
							<boxGeometry args={[7.6, 1.2, 8.6]} />
						</mesh>
						{i % 3 === 0 ? <Cyl r={0.6} h={1.2} seg={8} pos={[2, h + 1.8, 1]} color="#3a3a3a" /> : null}
						{i % 4 === 1 ? <B size={[0.06, 2.4, 0.06]} pos={[-2, h + 2.4, -1]} color="#2a2a2a" /> : null}
					</group>
				);
			})}
			{/* the roof he is on (foreground), with tiles + a low wall */}
			<group position={[0, -6, 2]}>
				<mesh material={wall} position={[0, 2.5, 0]} castShadow receiveShadow>
					<boxGeometry args={[12, 5, 10]} />
				</mesh>
				<mesh material={tile} position={[0, 5.5, 0]} castShadow receiveShadow>
					<boxGeometry args={[12.6, 1, 10.6]} />
				</mesh>
				<B size={[12.6, 0.8, 0.4]} pos={[0, 6.4, -5]} color="#c8a880" />
				<B size={[1.2, 0.8, 1.2]} pos={[4.5, 6.4, 2.5]} color="#8a8a8a" />
			</group>
			{/* police helicopter */}
			<group position={[heliX, 16, -22]}>
				<B size={[3, 1.6, 1.6]} color="#2a3a4a" />
				<B size={[3.4, 0.4, 0.4]} pos={[-3, 0.2, 0]} color="#2a3a4a" />
				<group rotation={[0, f * 0.9, 0]} position={[0, 1.0, 0]}>
					<B size={[8, 0.06, 0.4]} color="#1a1a1a" shadow={false} />
				</group>
				<B size={[0.6, 0.4, 0.4]} pos={[1.6, -0.6, 0]} color="#ffffff" glow={4} shadow={false} />
			</group>
		</>
	);
};

// Void with a single bulb (name reveal)
export const Void: React.FC<{f: number}> = ({f}) => (
	<>
		<SkyDome top="#000000" bottom="#020202" />
		<ambientLight intensity={0.05} />
		<group position={[Math.sin(f * 0.08) * 0.4, 9, 0]} rotation={[0, 0, Math.sin(f * 0.08) * 0.05]}>
			<B size={[0.04, 3, 0.04]} pos={[0, 1.5, 0]} color="#1a1a1a" shadow={false} />
			<B size={[0.35, 0.45, 0.35]} color="#ffd27a" glow={5} shadow={false} />
			<pointLight color="#ffc870" intensity={14} distance={22} decay={1.4} castShadow />
		</group>
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[60, 60]} />
			<meshLambertMaterial color="#1a1612" />
		</mesh>
	</>
);
