import React, {useMemo} from 'react';
import * as THREE from 'three';
import {BlockText} from '../BlockText';
import {lambert, px, speckle, tex64} from '../ps1/ps1';
import {B, Cyl, SkyDome} from '../ps1/sets';
import {SunDisc} from '../cine/Cine';

// LeBron remake sets. Six rules: boxes + low-segment cylinders, 64-px code-painted textures,
// and every room lived-in (layers of story props). Each set brings its own light rig:
// hemisphere fill + shadow key + rim + front fill + practicals.

const PI = Math.PI;
type V3 = [number, number, number];

// ---------- shared lights ----------
export const Rig4: React.FC<{sky: string; ground: string; hemi?: number; key: string; keyI?: number; keyPos?: V3; rim: string; rimI?: number; fill?: number; span?: number}> = ({
	sky,
	ground,
	hemi = 0.9,
	key,
	keyI = 1.8,
	keyPos = [6, 12, 8],
	rim,
	rimI = 1.4,
	fill = 0.5,
	span = 14,
}) => (
	// Cinematic balance (GTA-like): low ambient, a strong warm key that rakes from the side with long
	// shadows, a hot rim to separate people from the background, very little flat front fill.
	<>
		<hemisphereLight args={[sky, ground, hemi * 0.7]} />
		<directionalLight
			position={[keyPos[0] * 1.3, keyPos[1] * 0.7, keyPos[2]]}
			intensity={keyI * 1.7}
			color={key}
			castShadow
			shadow-mapSize={[2048, 2048]}
			shadow-bias={-0.002}
			shadow-camera-left={-span}
			shadow-camera-right={span}
			shadow-camera-top={span}
			shadow-camera-bottom={-span}
			shadow-camera-far={80}
		/>
		<directionalLight position={[-4, 7, -12]} intensity={rimI * 1.6} color={rim} />
		<directionalLight position={[0, 5, 16]} intensity={fill * 0.9 + 0.25} color="#dfe8ff" />
	</>
);

// ---------- 64-px textures ----------
const rep = (t: THREE.Texture, x: number, y: number) => {
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(x, y);
	return t;
};
const useMat = (fn: () => THREE.Texture, rx = 1, ry = 1, extra: THREE.MeshLambertMaterialParameters = {}) =>
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useMemo(() => lambert({map: rep(fn(), rx, ry), ...extra}), []);

const T = {
	tiles: (a: string, b: string) => () => tex64((g) => {
		for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) px(g, (x + y) % 32 ? a : b, x, y, 16, 16);
		speckle(g, 64, 64, ['#00000018', '#ffffff18'], 120, 5);
		for (let i = 0; i < 64; i += 16) (px(g, '#00000022', i, 0, 1, 64), px(g, '#00000022', 0, i, 64, 1));
	}),
	planks: (c = '#8a5a36') => () => tex64((g) => {
		const cols = [c, '#7d5030', '#946240', '#83552f'];
		for (let i = 0; i < 4; i++) (px(g, cols[i], 0, i * 16, 64, 16), px(g, '#4e3019', 0, i * 16 + 15, 64, 1), px(g, '#4e3019', (i * 23) % 64, i * 16, 1, 15));
		speckle(g, 64, 64, ['#5e3b20', '#a2704a'], 90, 21);
	}),
	court: () => tex64((g) => {
		for (let i = 0; i < 8; i++) px(g, i % 2 ? '#d9a868' : '#cf9c5c', 0, i * 8, 64, 8);
		for (let i = 0; i < 8; i++) px(g, '#b8844a', (i * 19) % 64, i * 8, 1, 8);
		speckle(g, 64, 64, ['#e6b878', '#c08850'], 60, 3);
	}),
	wall: (base: string, stripe: string, dot?: string) => () => tex64((g) => {
		px(g, base, 0, 0, 64, 64);
		for (let x = 0; x < 64; x += 16) px(g, stripe, x, 0, 6, 64);
		if (dot) for (let y = 6; y < 64; y += 16) for (let x = 9; x < 64; x += 16) px(g, dot, x, y, 2, 2);
		speckle(g, 64, 64, ['#00000014'], 60, 5);
	}),
	brick: (c = '#9a4a34') => () => tex64((g) => {
		px(g, '#c8b8a0', 0, 0, 64, 64);
		for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? -8 : 0; x < 64; x += 16) px(g, ['#9a4a34', c, '#8a4030', '#a85a40'][((x + y) / 8) & 3], x + 1, y + 1, 14, 6);
		speckle(g, 64, 64, ['#00000022'], 80, 7);
	}),
	concrete: (c = '#8a8a86') => () => tex64((g) => (px(g, c, 0, 0, 64, 64), speckle(g, 64, 64, ['#00000020', '#ffffff18'], 260, 11), px(g, '#00000022', 0, 31, 64, 1))),
	carpet: (a: string, b: string) => () => tex64((g) => {
		px(g, a, 0, 0, 64, 64);
		for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 64; x += 8) px(g, b, x, y, 2, 2);
		speckle(g, 64, 64, ['#00000018'], 120, 9);
	}),
	grass: () => tex64((g) => {
		for (let i = 0; i < 4; i++) px(g, i % 2 ? '#3f8a3a' : '#4a9a42', 0, i * 16, 64, 16);
		speckle(g, 64, 64, ['#2f7030', '#5aaa4a'], 260, 13);
		px(g, '#f2f2f2', 0, 0, 64, 2);
	}),
	chalk: () => tex64((g) => {
		px(g, '#2f4a3a', 0, 0, 64, 64);
		speckle(g, 64, 64, ['#4a6a5a', '#3a5a4a'], 160, 4);
		const w = '#e8f0e8';
		// ATTENDANCE-like scribble lines + a date
		for (let y = 8; y < 60; y += 9) for (let x = 6; x < 58; x += 3) if (((x * 7 + y * 3) % 11) < 7) px(g, w + 'cc', x, y, 2, 1);
	}),
	night: () => tex64((g) => {
		px(g, '#0b1026', 0, 0, 64, 64);
		speckle(g, 64, 40, ['#ffffff', '#9cb0ff'], 30, 8);
		px(g, '#f3ead2', 44, 8, 10, 10);
		px(g, '#0b1026', 47, 6, 9, 9);
		for (let x = 0; x < 64; x += 8) px(g, '#141a30', x, 40 + ((x * 13) % 14), 8, 30);
		for (let i = 0; i < 40; i++) px(g, '#f0c060', (i * 37) % 62, 44 + ((i * 17) % 18), 1, 1);
	}),
	snow: () => tex64((g) => {
		px(g, '#a8b8d0', 0, 0, 64, 64);
		for (let x = 0; x < 64; x += 10) px(g, '#3a4a5a', x, 34, 6, 20);
		px(g, '#eef2f8', 0, 50, 64, 14);
		speckle(g, 64, 50, ['#ffffff'], 70, 3);
	}),
	day: () => tex64((g) => {
		px(g, '#9ccbe8', 0, 0, 64, 40);
		px(g, '#ffffff', 10, 8, 16, 4);
		px(g, '#ffffff', 36, 14, 12, 3);
		px(g, '#5a7a4a', 0, 40, 64, 8);
		px(g, '#8a8a86', 0, 48, 64, 16);
		for (let x = 2; x < 64; x += 14) (px(g, '#3a5a8a', x, 50, 10, 5), px(g, '#2a2a2a', x + 1, 55, 2, 2), px(g, '#2a2a2a', x + 7, 55, 2, 2));
	}),
	locker: (c: string) => () => tex64((g) => {
		px(g, c, 0, 0, 64, 64);
		for (let x = 0; x < 64; x += 16) (px(g, '#00000040', x, 0, 1, 64), px(g, '#ffffff30', x + 1, 0, 1, 64));
		for (let x = 3; x < 64; x += 16) for (const y of [8, 11, 14]) px(g, '#00000050', x, y, 10, 1);
		for (let x = 12; x < 64; x += 16) px(g, '#d8d8d8', x, 30, 2, 4);
	}),
	crowd: (cols: string[], seed = 5) => () => tex64((g) => {
		px(g, '#121218', 0, 0, 64, 64);
		let s = seed;
		const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
		for (let y = 2; y < 64; y += 8)
			for (let x = (y / 8) % 2 ? 2 : 6; x < 64; x += 8) {
				px(g, cols[Math.floor(r() * cols.length)], x, y + 3, 6, 5);
				px(g, ['#7a4a32', '#e0b48a', '#5e3b27', '#c89a74'][Math.floor(r() * 4)], x + 1, y, 4, 3);
				if (r() < 0.08) px(g, '#ffffff', x + 4, y - 1, 2, 2); // phone glow
			}
	}),
	magazine: (base: string, band: string) => () => tex64((g) => {
		px(g, base, 0, 0, 48, 64);
		px(g, band, 0, 0, 48, 10);
		px(g, '#ffffff', 4, 3, 26, 4);
		px(g, '#ffffffaa', 4, 52, 30, 2);
		px(g, '#ffffffaa', 4, 56, 22, 2);
		speckle(g, 48, 64, ['#00000020'], 40, 6);
	}, 48, 64),
	monitor: () => tex64((g) => {
		px(g, '#0a1a12', 0, 0, 64, 48);
		for (let x = 0; x < 64; x++) px(g, '#5aff8a', x, 24 + Math.round(Math.sin(x * 0.6) * (x % 16 < 4 ? 10 : 1)), 1, 1);
		px(g, '#5aff8a', 46, 4, 14, 6);
	}, 64, 48),
	blinds: () => tex64((g) => {
		for (let y = 0; y < 64; y += 6) (px(g, '#f2e8d0', 0, y, 64, 4), px(g, '#c8b898', 0, y + 4, 64, 2));
	}),
};

// ---------- small props ----------
export const Window: React.FC<{pos: V3; rot?: V3; w?: number; h?: number; view: 'night' | 'snow' | 'day'; frame?: string; blinds?: boolean}> = ({pos, rot = [0, 0, 0], w = 3, h = 2.6, view, frame = '#e8dcc4', blinds}) => {
	const m = useMemo(() => new THREE.MeshBasicMaterial({map: T[view]()}), [view]);
	const bl = useMemo(() => (blinds ? lambert({map: T.blinds(), transparent: true, opacity: 0.92}) : null), [blinds]);
	return (
		<group position={pos} rotation={rot}>
			<mesh material={m} position={[0, 0, 0.02]}>
				<planeGeometry args={[w, h]} />
			</mesh>
			{bl ? (
				<mesh material={bl} position={[0, 0.2, 0.1]}>
					<planeGeometry args={[w, h * 0.7]} />
				</mesh>
			) : null}
			<B size={[w + 0.4, 0.2, 0.3]} pos={[0, h / 2 + 0.1, 0.1]} color={frame} />
			<B size={[w + 0.6, 0.25, 0.6]} pos={[0, -h / 2 - 0.1, 0.2]} color={frame} />
			<B size={[0.2, h, 0.3]} pos={[-w / 2 - 0.1, 0, 0.1]} color={frame} />
			<B size={[0.2, h, 0.3]} pos={[w / 2 + 0.1, 0, 0.1]} color={frame} />
			<B size={[0.1, h, 0.2]} pos={[0, 0, 0.1]} color={frame} />
		</group>
	);
};

const Floor: React.FC<{mat: THREE.Material; w?: number; d?: number}> = ({mat, w = 30, d = 30}) => (
	<mesh rotation={[-PI / 2, 0, 0]} material={mat} receiveShadow>
		<planeGeometry args={[w, d]} />
	</mesh>
);
const Wall: React.FC<{mat: THREE.Material; pos: V3; rot?: V3; w?: number; h?: number}> = ({mat, pos, rot = [0, 0, 0], w = 30, h = 14}) => (
	<mesh position={pos} rotation={rot} material={mat} receiveShadow>
		<planeGeometry args={[w, h]} />
	</mesh>
);
export const Bulb: React.FC<{pos: V3; color?: string; i?: number; d?: number}> = ({pos, color = '#ffd08a', i = 6, d = 12}) => (
	<group position={pos}>
		<B size={[0.3, 0.3, 0.3]} color={color} glow={2} shadow={false} />
		<pointLight color={color} intensity={i} distance={d} decay={1.4} />
	</group>
);
const Book: React.FC<{pos: V3; c: string; rot?: number}> = ({pos, c, rot = 0}) => <B size={[0.7, 0.14, 0.5]} pos={pos} rot={[0, rot, 0]} color={c} />;
const Chair: React.FC<{pos: V3; rot?: number; c?: string}> = ({pos, rot = 0, c = '#4a6aa8'}) => (
	<group position={pos} rotation={[0, rot, 0]}>
		<B size={[1.3, 0.12, 1.2]} pos={[0, 1.4, 0]} color={c} />
		<B size={[1.3, 1.3, 0.12]} pos={[0, 2.1, -0.55]} color={c} />
		{[-0.55, 0.55].map((x) => [-0.5, 0.5].map((z) => <B key={`${x}${z}`} size={[0.08, 1.4, 0.08]} pos={[x, 0.7, z]} color="#5a5a5a" />))}
	</group>
);
export const Backpack: React.FC<{pos: V3; c: string; rot?: number}> = ({pos, c, rot = 0}) => (
	<group position={pos} rotation={[0, rot, 0]}>
		<B size={[0.9, 1.1, 0.5]} pos={[0, 0.55, 0]} color={c} />
		<B size={[0.7, 0.5, 0.15]} pos={[0, 0.4, 0.3]} color={c} />
		<B size={[0.5, 0.06, 0.1]} pos={[0, 0.62, 0.38]} color="#d8d8d8" />
	</group>
);
export const Football: React.FC = () => (
	<group>
		<mesh scale={[0.28, 0.28, 0.46]} castShadow>
			<octahedronGeometry args={[1, 1]} />
			<meshLambertMaterial color="#7a4524" flatShading />
		</mesh>
		<B size={[0.04, 0.03, 0.34]} pos={[0, 0.27, 0]} color="#f2f2f2" shadow={false} />
	</group>
);
export const Ball: React.FC<{r?: number}> = ({r = 0.42}) => (
	<group>
		<mesh castShadow>
			<icosahedronGeometry args={[r, 1]} />
			<meshLambertMaterial color="#d8692a" flatShading />
		</mesh>
		<B size={[r * 2.04, 0.04, 0.04]} color="#2a1a10" shadow={false} />
		<B size={[0.04, r * 2.04, 0.04]} color="#2a1a10" shadow={false} />
	</group>
);
export const Baby: React.FC = () => (
	<group>
		<B size={[0.8, 0.6, 1.3]} color="#bfe0f0" />
		<B size={[0.6, 0.6, 0.55]} pos={[0, 0.12, 0.5]} color="#7a4a32" />
		<B size={[0.66, 0.3, 0.62]} pos={[0, 0.4, 0.5]} color="#bfe0f0" />
	</group>
);
export const Trophy: React.FC = () => (
	<group>
		<B size={[0.7, 0.3, 0.7]} color="#3a2a1a" />
		<Cyl r={0.12} h={1.0} pos={[0, 0.65, 0]} color="#e8c040" glow={0.4} />
		<mesh position={[0, 1.6, 0]} castShadow>
			<sphereGeometry args={[0.5, 8, 6]} />
			<meshLambertMaterial color="#f0c84a" emissive="#a87a10" emissiveIntensity={0.5} flatShading />
		</mesh>
	</group>
);
const Crowd: React.FC<{cols: string[]; pos: V3; rot?: V3; w?: number; h?: number; seed?: number}> = ({cols, pos, rot = [0, 0, 0], w = 40, h = 10, seed}) => {
	const m = useMemo(() => new THREE.MeshLambertMaterial({map: rep(T.crowd(cols, seed)(), w / 6, h / 6)}), []); // eslint-disable-line react-hooks/exhaustive-deps
	return (
		<group position={pos} rotation={rot}>
			{Array.from({length: 5}, (_, i) => (
				<mesh key={i} material={m} position={[0, i * (h / 5) + h / 10, -i * 1.6]}>
					<boxGeometry args={[w, h / 5, 1.6]} />
				</mesh>
			))}
		</group>
	);
};

// ===================================================================================
// 0 / 15  Akron classroom, winter
export const Classroom: React.FC<{crossed?: number}> = ({crossed = 0}) => {
	const floor = useMat(T.tiles('#d8d0bc', '#b8b0a0'), 8, 8);
	const wall = useMat(T.wall('#e8dcb8', '#e0d2ac'), 4, 2);
	const board = useMat(T.chalk);
	return (
		<>
			<SkyDome top="#c8d4e8" bottom="#e8eef8" />
			<Rig4 sky="#dde8ff" ground="#8a7a60" hemi={1.0} key="#eaf2ff" keyPos={[-8, 12, 4]} rim="#ffd8a0" fill={0.6} />
			<Floor mat={floor} />
			<Wall mat={wall} pos={[0, 7, -7]} />
			<Wall mat={wall} pos={[-9, 7, 4]} rot={[0, PI / 2, 0]} />
			{/* chalkboard + ledge + chalk + clock */}
			<mesh material={board} position={[2, 6.2, -6.9]}>
				<planeGeometry args={[9, 3.6]} />
			</mesh>
			<B size={[9.4, 0.25, 0.4]} pos={[2, 4.3, -6.8]} color="#8a6a48" />
			<B size={[0.4, 0.1, 0.1]} pos={[0, 4.48, -6.7]} color="#f2f2f2" />
			<B size={[0.6, 0.2, 0.3]} pos={[3, 4.52, -6.7]} color="#6a6a6a" />
			<BlockText text="ATTENDANCE" size={0.42} depth={0.05} color="#eef6ee" position={[2, 7.4, -6.85]} />
			<group position={[-4.5, 9.4, -6.9]}>
				<Cyl r={0.7} h={0.15} seg={10} rot={[PI / 2, 0, 0]} color="#f2f2f2" />
				<B size={[0.06, 0.5, 0.05]} pos={[0, 0.2, 0.1]} color="#1a1a1a" shadow={false} />
				<B size={[0.4, 0.06, 0.05]} pos={[0.18, 0, 0.1]} color="#1a1a1a" shadow={false} />
			</group>
			{/* calendar: days crossed off */}
			<group position={[-4.8, 6.6, -6.85]}>
				<B size={[2.6, 2.4, 0.08]} color="#f8f4e8" />
				<B size={[2.6, 0.5, 0.1]} pos={[0, 1, 0]} color="#c83a3a" />
				{Array.from({length: 20}, (_, i) => (
					<group key={i} position={[-1.05 + (i % 5) * 0.52, 0.45 - Math.floor(i / 5) * 0.42, 0.06]}>
						{i < crossed ? (
							<>
								<B size={[0.36, 0.06, 0.04]} rot={[0, 0, 0.7]} color="#c83a3a" shadow={false} />
								<B size={[0.36, 0.06, 0.04]} rot={[0, 0, -0.7]} color="#c83a3a" shadow={false} />
							</>
						) : (
							<B size={[0.12, 0.12, 0.03]} color="#b8b0a0" shadow={false} />
						)}
					</group>
				))}
			</group>
			{/* snowy window + heater */}
			<Window pos={[-8.9, 6.2, 1]} rot={[0, PI / 2, 0]} w={4} h={3} view="snow" />
			<B size={[0.6, 1.2, 4]} pos={[-8.6, 1.2, 1]} color="#c8c0b0" />
			{/* desks (one empty, in front) */}
			{[
				[-3.2, -3.2],
				[1, -3.2],
				[5, -3.2],
				[-3.2, 0.6],
				[5, 0.6],
			].map(([x, z], i) => (
				<group key={i} position={[x, 0, z]}>
					<B size={[2.2, 0.15, 1.5]} pos={[0, 2.3, 0]} color="#b89a6a" />
					<B size={[2.0, 0.08, 1.3]} pos={[0, 1.4, 0]} color="#8a8a8a" />
					{[-0.95, 0.95].map((xx) => <B key={xx} size={[0.1, 2.3, 0.1]} pos={[xx, 1.15, 0]} color="#6a6a6a" />)}
					<Chair pos={[0, 0, 1.2]} rot={PI} c={['#4a6aa8', '#c84a3a', '#3a8a4a', '#e8a83a', '#6a4aa8'][i]} />
					<Book pos={[0.3, 2.45, 0.1]} c={['#c83a3a', '#3a6ac8', '#e8c84a', '#3aa86a', '#8a4ac8'][i]} rot={0.3} />
				</group>
			))}
			{/* THE empty desk: front row centre, dusty book, name tag */}
			<group position={[1, 0, 0.6]}>
				<B size={[2.2, 0.15, 1.5]} pos={[0, 2.3, 0]} color="#b89a6a" />
				<B size={[2.0, 0.08, 1.3]} pos={[0, 1.4, 0]} color="#8a8a8a" />
				{[-0.95, 0.95].map((xx) => <B key={xx} size={[0.1, 2.3, 0.1]} pos={[xx, 1.15, 0]} color="#6a6a6a" />)}
				<Chair pos={[0, 0, 1.2]} rot={PI} c="#e07a2a" />
				<Book pos={[-0.3, 2.45, 0]} c="#7a8a9a" rot={-0.2} />
				<B size={[0.8, 0.25, 0.04]} pos={[0, 2.5, 0.72]} color="#f8f4e8" />
			</group>
			{/* coat hooks with backpacks, globe, sharpener, bookshelf */}
			<B size={[0.2, 0.2, 7]} pos={[-8.8, 4.6, 2.5]} color="#8a6a48" />
			{['#c84a3a', '#3a6ac8', '#e8c84a', '#3a8a4a'].map((c, i) => <Backpack key={c} pos={[-8.3, 3.2, -0.2 + i * 1.6]} c={c} rot={PI / 2} />)}
			<group position={[7.2, 0, -5.6]}>
				<B size={[3, 5, 1]} pos={[0, 2.5, 0]} color="#8a6a48" />
				{[1.2, 2.6, 4].map((y) => ['#c83a3a', '#3a6ac8', '#e8c84a', '#3aa86a', '#8a4ac8'].map((c, i) => <B key={c + y} size={[0.4, 0.9, 0.7]} pos={[-1.1 + i * 0.5, y, 0.2]} color={c} />))}
				<mesh position={[0, 5.9, 0]} castShadow>
					<icosahedronGeometry args={[0.7, 1]} />
					<meshLambertMaterial color="#3a8ac8" flatShading />
				</mesh>
				<B size={[0.1, 0.6, 0.1]} pos={[0, 5.2, 0]} color="#8a6a2a" />
			</group>
			<B size={[0.4, 0.3, 0.5]} pos={[5.5, 4.6, -6.8]} color="#6a6a6a" />
			<Bulb pos={[2, 11, -2]} color="#fff4dc" i={4} d={18} />
		</>
	);
};

// 1  1984 hospital room
export const Hospital: React.FC<{beep: number}> = ({beep}) => {
	const floor = useMat(T.tiles('#d8e4e0', '#c0ccc8'), 8, 8);
	const wall = useMat(T.wall('#cfe0d8', '#c4d6ce'), 4, 2);
	const mon = useMemo(() => new THREE.MeshBasicMaterial({map: T.monitor()}), []);
	return (
		<>
			<SkyDome top="#9ab8c0" bottom="#d0e0e0" />
			<Rig4 sky="#e0f0ff" ground="#7a8a80" key="#fff4e0" keyPos={[-7, 10, 6]} rim="#a8d8ff" />
			<Floor mat={floor} />
			<Wall mat={wall} pos={[0, 7, -6]} />
			<Wall mat={wall} pos={[8, 7, 2]} rot={[0, -PI / 2, 0]} />
			<Window pos={[-3.5, 6, -5.9]} w={3.4} h={2.8} view="day" blinds />
			{/* bed with striped blanket */}
			<group position={[1.2, 0, -2.4]}>
				<B size={[3.2, 1.6, 6]} pos={[0, 0.8, 0]} color="#d8d8d8" />
				<B size={[3.0, 0.5, 5.8]} pos={[0, 1.85, 0]} color="#f4f4f4" />
				<B size={[3.1, 0.25, 3.4]} pos={[0, 2.2, 0.9]} color="#8ab0d8" />
				<B size={[3.12, 0.26, 0.3]} pos={[0, 2.21, 0.2]} color="#f4f4f4" />
				<B size={[3.12, 0.26, 0.3]} pos={[0, 2.21, 1.4]} color="#f4f4f4" />
				<B size={[2, 0.5, 1]} pos={[0, 2.3, -2.3]} color="#ffffff" />
				<B size={[3.3, 3.2, 0.25]} pos={[0, 1.6, -3]} color="#b8c0c8" />
				<B size={[0.12, 1.2, 4]} pos={[1.7, 2.6, 0.5]} color="#c8c8c8" />
			</group>
			{/* monitor on a stand (glows), IV pole, flowers, crib, wall TV */}
			<group position={[4.4, 0, -3.8]}>
				<B size={[0.2, 4.4, 0.2]} pos={[0, 2.2, 0]} color="#8a8a8a" />
				<B size={[1.6, 1.3, 1.1]} pos={[0, 4.8, 0]} color="#d8d4c8" />
				<mesh material={mon} position={[0, 4.85, 0.56]}>
					<planeGeometry args={[1.3, 1.0]} />
				</mesh>
				<B size={[0.16, 0.16, 0.05]} pos={[0.6, 4.3, 0.56]} color="#ff4a4a" glow={beep * 3} shadow={false} />
				<pointLight position={[0, 4.8, 1.3]} color="#5aff8a" intensity={2} distance={5} />
			</group>
			<group position={[-1.6, 0, -4.2]}>
				<B size={[0.1, 5, 0.1]} pos={[0, 2.5, 0]} color="#c8c8c8" />
				<B size={[0.5, 0.8, 0.2]} pos={[0.25, 4.6, 0]} color="#e8f4ff" />
			</group>
			<group position={[-4.8, 0, -2]}>
				<B size={[1.6, 2.2, 1.4]} pos={[0, 1.1, 0]} color="#e8e0d0" />
				<Cyl r={0.25} h={0.7} seg={6} pos={[0, 2.55, 0]} color="#a8d8e8" />
				{['#f05a7a', '#f0c040', '#e86a3a'].map((c, i) => <B key={c} size={[0.3, 0.3, 0.3]} pos={[-0.2 + i * 0.2, 3.1 + (i % 2) * 0.2, 0]} color={c} />)}
				<B size={[0.08, 0.5, 0.08]} pos={[0, 2.9, 0]} color="#3a8a3a" />
			</group>
			<group position={[-5.4, 0, 1.6]}>
				<B size={[1.6, 0.2, 2.4]} pos={[0, 1.6, 0]} color="#e8e8f0" />
				{[-0.75, 0.75].map((x) => <B key={x} size={[0.1, 0.9, 2.4]} pos={[x, 2.1, 0]} color="#dfe8f4" />)}
				<B size={[0.1, 1.6, 0.1]} pos={[0, 0.8, 0]} color="#a8a8a8" />
			</group>
			<group position={[7.6, 8.2, -2]} rotation={[0, -PI / 2, 0]}>
				<B size={[2.2, 1.7, 1.4]} color="#3a3a3a" />
				<B size={[1.8, 1.3, 0.05]} pos={[0, 0, 0.72]} color="#4a7a9a" glow={0.6} shadow={false} />
			</group>
			<Bulb pos={[0, 11, 0]} color="#f4fff8" i={3} d={16} />
		</>
	);
};

// 2  Apartment kitchen at night
export const Kitchen: React.FC = () => {
	const floor = useMat(T.tiles('#b8a888', '#8a7a62'), 8, 8);
	const wall = useMat(T.wall('#c8b47a', '#bca86e', '#8a7a4a'), 4, 2);
	return (
		<>
			<SkyDome top="#05070f" bottom="#121830" />
			<Rig4 sky="#5a6aa8" ground="#2a1a10" hemi={0.55} key="#ffd28a" keyI={1.0} keyPos={[1, 12, 2]} rim="#6a8aff" rimI={1.6} fill={0.3} />
			<Floor mat={floor} />
			<Wall mat={wall} pos={[0, 7, -6]} />
			<Window pos={[4.6, 6.2, -5.9]} w={2.8} h={2.4} view="night" />
			{/* fridge with magnets, counter, sink, stacked bills */}
			<group position={[-5.2, 0, -4.8]}>
				<B size={[2.4, 6, 2]} pos={[0, 3, 0]} color="#e8e4d8" />
				<B size={[0.1, 1.2, 0.1]} pos={[1, 4.2, 1.02]} color="#a8a8a8" />
				{['#e04848', '#4870e0', '#e8c84a', '#3fa34a'].map((c, i) => <B key={c} size={[0.25, 0.25, 0.06]} pos={[-0.6 + i * 0.4, 4.8 - (i % 2) * 0.5, 1.02]} color={c} shadow={false} />)}
				<B size={[0.9, 1.1, 0.04]} pos={[0, 3.6, 1.02]} color="#f8f8f0" shadow={false} />
			</group>
			<group position={[-0.6, 0, -5]}>
				<B size={[6, 3, 1.8]} pos={[0, 1.5, 0]} color="#8a6a48" />
				<B size={[6.2, 0.2, 2]} pos={[0, 3.1, 0]} color="#d8d0c0" />
				<B size={[1.6, 0.1, 1.0]} pos={[1, 3.21, 0]} color="#9aa4aa" />
				<B size={[0.12, 0.8, 0.12]} pos={[1, 3.6, -0.6]} color="#9aa4aa" />
				{[0, 1, 2, 3].map((i) => <B key={i} size={[0.9, 0.04, 0.6]} pos={[-2.2, 3.25 + i * 0.05, 0.2]} rot={[0, i * 0.15, 0]} color={i === 3 ? '#f4c8c8' : '#f4f0e4'} />)}
				<Cyl r={0.25} h={0.5} seg={6} pos={[-1, 3.45, -0.2]} color="#c84a3a" />
			</group>
			{/* small table: one plate, two chairs (one empty, pulled out) */}
			<group position={[0.6, 0, -0.6]}>
				<B size={[3.4, 0.2, 2.4]} pos={[0, 2.6, 0]} color="#a87a50" />
				{[-1.5, 1.5].map((x) => [-1, 1].map((z) => <B key={`${x}${z}`} size={[0.15, 2.6, 0.15]} pos={[x, 1.3, z]} color="#7a5232" />))}
				<Cyl r={0.5} h={0.06} seg={8} pos={[-0.8, 2.74, 0]} color="#f4f4f0" />
				<Cyl r={0.15} h={0.4} seg={6} pos={[-0.2, 2.9, 0.3]} color="#e8f4ff" />
				<Chair pos={[-2.4, 0, 0]} rot={PI / 2} c="#7a5232" />
				<Chair pos={[2.6, 0, 0.5]} rot={-PI / 2 - 0.3} c="#7a5232" />
			</group>
			{/* single bare bulb on a cord */}
			<B size={[0.04, 3, 0.04]} pos={[0.6, 10.5, -0.6]} color="#1a1a1a" shadow={false} />
			<Bulb pos={[0.6, 8.9, -0.6]} color="#ffcf7a" i={9} d={14} />
		</>
	);
};

// 3  Apartment stairwell with moving boxes
export const Stairwell: React.FC<{flicker: number}> = ({flicker}) => {
	const floor = useMat(T.concrete('#7a7670'), 6, 6);
	const wall = useMat(T.brick('#8a5a4a'), 5, 3);
	return (
		<>
			<SkyDome top="#0a0a10" bottom="#1a1a22" />
			<Rig4 sky="#8a9ab8" ground="#2a2420" hemi={0.45 + 0.25 * flicker} key="#e8f0ff" keyI={0.6 + 1.0 * flicker} keyPos={[2, 12, 3]} rim="#ffb070" rimI={1.2} fill={0.35} />
			<Floor mat={floor} />
			<Wall mat={wall} pos={[0, 7, -5]} />
			<Wall mat={wall} pos={[-7, 7, 2]} rot={[0, PI / 2, 0]} />
			{/* stairs going up on the right with a rail */}
			{Array.from({length: 8}, (_, i) => <B key={i} size={[4, 0.6 * (i + 1), 1]} pos={[5.5, 0.3 * (i + 1), 2.4 - i * 0.9]} color="#8a8680" />)}
			<B size={[0.12, 0.12, 8]} pos={[3.5, 3.6, -1]} rot={[0.55, 0, 0]} color="#3a3a3a" />
			{/* mailboxes */}
			<group position={[-6.9, 4, -1]} rotation={[0, PI / 2, 0]}>
				<B size={[3.2, 2, 0.4]} color="#9aa0a8" />
				{Array.from({length: 8}, (_, i) => <B key={i} size={[0.7, 0.8, 0.06]} pos={[-1.2 + (i % 4) * 0.8, 0.45 - Math.floor(i / 4) * 0.9, 0.22]} color="#b8bec4" shadow={false} />)}
			</group>
			{/* boxes, mattress on the wall, lamp, trash bag */}
			{[
				[-3.2, 0.6, -3.6, 1.6, 1.2, 1.4, 0.1],
				[-3.0, 1.75, -3.6, 1.3, 1.1, 1.2, -0.2],
				[-1.4, 0.5, -3.8, 1.2, 1.0, 1.0, 0.3],
				[-4.6, 0.55, -1.6, 1.4, 1.1, 1.3, -0.4],
			].map((b, i) => (
				<group key={i} position={[b[0], b[1], b[2]]} rotation={[0, b[6], 0]}>
					<B size={[b[3], b[4], b[5]]} color="#c89a5a" />
					<B size={[b[3] + 0.02, 0.12, 0.3]} pos={[0, b[4] / 2, 0]} color="#d8c8a0" shadow={false} />
				</group>
			))}
			<BlockText text="KITCHEN" size={0.22} depth={0.03} color="#2a1a10" position={[-3.2, 0.7, -2.88]} />
			<B size={[3, 5, 0.5]} pos={[1.2, 2.5, -4.6]} rot={[0.12, 0, 0]} color="#e8e0ec" />
			<B size={[3, 0.3, 0.52]} pos={[1.2, 3.5, -4.52]} rot={[0.12, 0, 0]} color="#c8b0d8" />
			<group position={[-5.6, 0, 1.6]}>
				<Cyl r={0.5} h={0.2} seg={6} pos={[0, 0.1, 0]} color="#2a2a2a" />
				<B size={[0.1, 3, 0.1]} pos={[0, 1.6, 0]} color="#2a2a2a" />
				<Cyl r={0.6} r2={0.3} h={0.7} seg={6} pos={[0, 3.3, 0]} color="#e8d8a8" />
			</group>
			<mesh position={[2.6, 0.7, 0.8]} scale={[0.9, 0.75, 0.8]} castShadow>
				<icosahedronGeometry args={[1, 0]} />
				<meshLambertMaterial color="#1a1a1a" flatShading />
			</mesh>
			{/* flickering tube */}
			<B size={[3, 0.2, 0.4]} pos={[0, 11, -1]} color="#e8f4ff" glow={0.4 + 2.5 * flicker} shadow={false} />
			<pointLight position={[0, 10.4, -1]} color="#e8f4ff" intensity={1 + 7 * flicker} distance={16} decay={1.3} />
		</>
	);
};

// 4 / 16  Akron street at dusk (and rooftop view at night)
export const House: React.FC<{pos: V3; c: string; roof: string; lit?: number; rot?: number}> = ({pos, c, roof, lit = 0, rot = 0}) => (
	<group position={pos} rotation={[0, rot, 0]}>
		<B size={[6, 6, 6]} pos={[0, 3, 0]} color={c} />
		<B size={[6.6, 0.6, 6.6]} pos={[0, 6.3, 0]} color={roof} />
		<B size={[4.8, 1.8, 5]} pos={[0, 7.4, 0]} color={roof} />
		<B size={[6.4, 0.3, 2]} pos={[0, 3.2, 3.6]} color="#e8e0d0" />
		{[-2.6, 2.6].map((x) => <B key={x} size={[0.25, 3.1, 0.25]} pos={[x, 1.6, 4.4]} color="#e8e0d0" />)}
		<B size={[6, 0.4, 2]} pos={[0, 0.2, 3.6]} color="#8a8680" />
		<B size={[1.2, 2.2, 0.1]} pos={[0, 1.5, 3.02]} color="#5a3a22" />
		{[-1.8, 1.8].map((x) => (
			<B key={x} size={[1.2, 1.2, 0.1]} pos={[x, 4.6, 3.02]} color={lit ? '#ffd27a' : '#3a4a6a'} glow={lit ? 1.4 : 0} shadow={false} />
		))}
		<B size={[1.2, 1.2, 0.1]} pos={[1.8, 1.8, 3.02]} color={lit ? '#ffc86a' : '#3a4a6a'} glow={lit ? 1.0 : 0} shadow={false} />
	</group>
);
export const Car: React.FC<{c: string; boxes?: boolean}> = ({c, boxes}) => (
	<group>
		<B size={[5, 1.2, 2.4]} pos={[0, 0.9, 0]} color={c} />
		<B size={[3, 1.0, 2.2]} pos={[-0.3, 2, 0]} color={c} />
		<B size={[2.8, 0.8, 2.25]} pos={[-0.3, 2, 0]} color="#8ab0d0" />
		{[-1.7, 1.7].map((x) => [-1.15, 1.15].map((z) => <Cyl key={`${x}${z}`} r={0.45} h={0.3} seg={8} pos={[x, 0.45, z]} rot={[PI / 2, 0, 0]} color="#1a1a1a" />))}
		<B size={[0.1, 0.3, 0.5]} pos={[2.52, 1.0, 0.7]} color="#fff4c8" glow={1.5} shadow={false} />
		<B size={[0.1, 0.3, 0.5]} pos={[2.52, 1.0, -0.7]} color="#fff4c8" glow={1.5} shadow={false} />
		{boxes ? (
			<>
				<B size={[1.2, 0.8, 1.2]} pos={[-0.6, 3.0, 0]} color="#c89a5a" />
				<B size={[1.4, 0.3, 1.8]} pos={[0.4, 2.65, 0]} color="#d8d0c0" />
				<B size={[0.9, 0.6, 0.9]} pos={[0.5, 3.1, 0.2]} rot={[0, 0.4, 0]} color="#b88a4a" />
			</>
		) : null}
	</group>
);
const StreetLamp: React.FC<{pos: V3; on: number}> = ({pos, on}) => (
	<group position={pos}>
		<B size={[0.25, 8, 0.25]} pos={[0, 4, 0]} color="#3a3a3a" />
		<B size={[1.6, 0.2, 0.3]} pos={[0.7, 8, 0]} color="#3a3a3a" />
		<B size={[0.7, 0.3, 0.5]} pos={[1.4, 7.8, 0]} color="#ffd890" glow={on * 3} shadow={false} />
		{on > 0 ? <pointLight position={[1.4, 7.2, 0]} color="#ffc070" intensity={8 * on} distance={14} decay={1.4} /> : null}
	</group>
);
export const AkronStreet: React.FC<{lamps: number; night?: boolean}> = ({lamps, night}) => {
	const road = useMat(T.concrete('#4a4a50'), 8, 8);
	const walk = useMat(T.concrete('#9a968e'), 10, 2);
	return (
		<>
			<SkyDome top={night ? '#05070f' : '#3a3a6a'} bottom={night ? '#1a1a30' : '#f08a5a'} fog={night ? '#1a1a30' : '#c87a6a'} near={40} far={120} />
			{night ? <SunDisc pos={[-50, 45, -85]} color="#dfe8ff" r={3} i={3} /> : <SunDisc pos={[-75, 14, -80]} color="#ffb070" r={7} i={5} />}
			<Rig4 sky={night ? '#5a6aa8' : '#ffb080'} ground="#3a2a2a" hemi={night ? 0.5 : 0.8} key={night ? '#9ab0ff' : '#ff9a5a'} keyI={night ? 0.8 : 1.8} keyPos={[-14, 8, 4]} rim={night ? '#6a8aff' : '#ffd0a0'} span={24} />
			<mesh rotation={[-PI / 2, 0, 0]} material={road} receiveShadow>
				<planeGeometry args={[120, 120]} />
			</mesh>
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.03, -7]} material={walk} receiveShadow>
				<planeGeometry args={[120, 5]} />
			</mesh>
			{Array.from({length: 14}, (_, i) => <B key={i} size={[2, 0.03, 0.25]} pos={[-40 + i * 6, 0.02, 1.5]} color="#e8c84a" shadow={false} />)}
			{[
				[-24, '#b07a5a', '#3a2a2a'],
				[-16, '#8a9aa8', '#2a2a3a'],
				[-8, '#c8b89a', '#4a2a2a'],
				[0, '#9a5a44', '#2a2a2a'],
				[8, '#7a8a6a', '#3a2a22'],
				[16, '#c8a07a', '#2a2a3a'],
				[24, '#8a7a9a', '#3a2a2a'],
			].map(([x, c, r], i) => (
				<House key={i} pos={[x as number, 0, -15]} c={c as string} roof={r as string} lit={night || (lamps > 0.5 && i % 2 === 0) ? 1 : 0} />
			))}
			{[-20, -4, 12].map((x, i) => <StreetLamp key={x} pos={[x, 0, -5.4]} on={Math.max(0, Math.min(1, lamps * 3 - i))} />)}
			{/* power line poles + wires */}
			{[-28, -6, 16].map((x) => <B key={x} size={[0.3, 12, 0.3]} pos={[x, 6, -9]} color="#5a4030" />)}
			<B size={[60, 0.05, 0.05]} pos={[0, 11, -9]} color="#1a1a1a" shadow={false} />
			<B size={[60, 0.05, 0.05]} pos={[0, 10.4, -9]} color="#1a1a1a" shadow={false} />
			{/* snow piles, hydrant, mailbox, parked car, trash cans */}
			{[-18, -9, 5, 20].map((x, i) => (
				<mesh key={x} position={[x, 0.4, -5.8]} scale={[1.6 + (i % 2), 0.6, 1]} receiveShadow>
					<icosahedronGeometry args={[1, 0]} />
					<meshLambertMaterial color="#eef2f8" flatShading />
				</mesh>
			))}
			<group position={[3, 0, -6]}>
				<Cyl r={0.35} h={1.2} seg={6} pos={[0, 0.6, 0]} color="#c83a3a" />
				<B size={[0.9, 0.2, 0.25]} pos={[0, 0.8, 0]} color="#c83a3a" />
			</group>
			<group position={[-12, 0, -6]}>
				<B size={[0.2, 2.2, 0.2]} pos={[0, 1.1, 0]} color="#3a3a3a" />
				<B size={[0.8, 0.7, 1.2]} pos={[0, 2.5, 0]} color="#2a4a8a" />
			</group>
			{[9, 10].map((x) => <Cyl key={x} r={0.45} h={1.4} seg={8} pos={[x, 0.7, -6.4]} color="#4a5a4a" />)}
			<group position={[-26, 0, -4]}>
				<Car c="#6a3a3a" />
			</group>
		</>
	);
};

// 5  Youth football field
export const Field: React.FC = () => {
	const grass = useMat(T.grass, 10, 10);
	return (
		<>
			<SkyDome top="#3a6ab0" bottom="#f0c890" />
			<Rig4 sky="#c8e0ff" ground="#3a6a2a" hemi={0.9} key="#ffc878" keyI={2.0} keyPos={[-12, 6, 6]} rim="#ffe0a0" rimI={1.8} span={20} />
			<mesh rotation={[-PI / 2, 0, 0]} material={grass} receiveShadow>
				<planeGeometry args={[120, 120]} />
			</mesh>
			{/* yard line numbers */}
			<BlockText text="20" size={1.2} depth={0.05} color="#f2f2f2" position={[-6, 0.05, -4]} rotation={[-PI / 2, 0, 0]} />
			{/* goalpost */}
			<group position={[6, 0, -14]}>
				<B size={[0.4, 5, 0.4]} pos={[0, 2.5, 0]} color="#f0d84a" />
				<B size={[7, 0.35, 0.35]} pos={[0, 5, 0]} color="#f0d84a" />
				{[-3.4, 3.4].map((x) => <B key={x} size={[0.3, 6, 0.3]} pos={[x, 8, 0]} color="#f0d84a" />)}
			</group>
			{/* bleachers with parents */}
			<group position={[-8, 0, -12]}>
				{[0, 1, 2, 3].map((i) => <B key={i} size={[14, 0.3, 1.4]} pos={[0, 0.8 + i * 0.9, -i * 1.4]} color="#b8bcc4" />)}
				{Array.from({length: 9}, (_, i) => (
					<group key={i} position={[-6 + i * 1.5, 1.6 + (i % 4) * 0.9, -(i % 4) * 1.4]}>
						<B size={[0.9, 1.1, 0.6]} color={['#c84a3a', '#3a6ac8', '#e8c84a', '#3a8a4a', '#f2f2f2'][i % 5]} />
						<B size={[0.6, 0.6, 0.6]} pos={[0, 0.9, 0]} color={['#7a4a32', '#e0b48a', '#5e3b27'][i % 3]} />
					</group>
				))}
			</group>
			{/* kids in pads practising in the back */}
			{[
				[7, -7, '#c83a3a'],
				[10, -9, '#1d2f5a'],
				[4, -10, '#c83a3a'],
			].map(([x, z, c], i) => (
				<group key={i} position={[x as number, 0, z as number]}>
					<B size={[0.7, 1.3, 0.7]} pos={[0, 0.65, 0]} color="#f2f2f2" />
					<B size={[1.5, 1.3, 0.9]} pos={[0, 2, 0]} color={c as string} />
					<B size={[0.9, 0.9, 0.9]} pos={[0, 3.1, 0]} color={c as string} />
					<B size={[0.7, 0.12, 0.1]} pos={[0, 3.0, 0.5]} color="#cccccc" />
				</group>
			))}
			{/* chain markers, cones, water cooler, bag of balls */}
			{[-1.5, 6.5].map((x) => (
				<group key={x} position={[x, 0, -5]}>
					<B size={[0.14, 4, 0.14]} pos={[0, 2, 0]} color="#3a3a3a" />
					<B size={[0.7, 0.5, 0.15]} pos={[0, 4, 0]} color="#ff7a2a" />
				</group>
			))}
			<B size={[8, 0.04, 0.04]} pos={[2.5, 0.3, -5]} color="#3a3a3a" shadow={false} />
			{[-4, -2.5, 8.5, 10].map((x, i) => (
				<mesh key={x} position={[x, 0.4, -2 - i]} castShadow>
					<coneGeometry args={[0.4, 0.8, 6]} />
					<meshLambertMaterial color="#ff7a2a" flatShading />
				</mesh>
			))}
			<group position={[-5.5, 0, 1.5]}>
				<Cyl r={0.7} h={1.4} seg={8} pos={[0, 0.7, 0]} color="#e85a2a" />
				<Cyl r={0.72} h={0.3} seg={8} pos={[0, 1.5, 0]} color="#f2f2f2" />
			</group>
			<group position={[5.5, 0, 2]}>
				<B size={[1.6, 1, 1.2]} pos={[0, 0.5, 0]} color="#3a3a3a" />
				<group position={[0, 1.2, 0]} rotation={[0, 0.5, 0.3]}>
					<Football />
				</group>
			</group>
			{/* floodlight tower (rim) */}
			<group position={[14, 0, -18]}>
				<B size={[0.6, 18, 0.6]} pos={[0, 9, 0]} color="#7a7a7a" />
				<B size={[4, 2, 0.6]} pos={[0, 18, 0]} color="#fff8e0" glow={1.2} shadow={false} />
			</group>
		</>
	);
};

// 6a  Walker house, kid's new bedroom
export const NewRoom: React.FC = () => {
	const floor = useMat(T.carpet('#6a7aa0', '#7a8ab0'), 6, 6);
	const wall = useMat(T.wall('#e8d8a8', '#e0cc98'), 4, 2);
	return (
		<>
			<SkyDome top="#1a1a2a" bottom="#2a2a3a" />
			<Rig4 sky="#ffe8c8" ground="#4a3a2a" hemi={0.7} key="#ffd8a0" keyI={1.2} keyPos={[-5, 11, 6]} rim="#a0b8ff" fill={0.4} />
			<Floor mat={floor} />
			<Wall mat={wall} pos={[0, 7, -5]} />
			<Wall mat={wall} pos={[-7, 7, 2]} rot={[0, PI / 2, 0]} />
			<Window pos={[-6.9, 6, 0]} rot={[0, PI / 2, 0]} w={3} h={2.6} view="night" />
			{/* made bed */}
			<group position={[2.4, 0, -2.4]}>
				<B size={[3.6, 1.4, 5.6]} pos={[0, 0.7, 0]} color="#6a4528" />
				<B size={[3.4, 0.5, 5.4]} pos={[0, 1.6, 0]} color="#f4f0e4" />
				<B size={[3.5, 0.3, 3.8]} pos={[0, 1.95, 0.8]} color="#2a5aa8" />
				<B size={[3.52, 0.31, 0.4]} pos={[0, 1.96, -0.8]} color="#e8c84a" />
				<B size={[2, 0.5, 1]} pos={[0, 2.1, -2]} color="#ffffff" />
				<B size={[3.6, 3, 0.3]} pos={[0, 1.5, -2.9]} color="#6a4528" />
			</group>
			{/* nightstand + glowing alarm clock 6:00 */}
			<group position={[-0.4, 0, -4]}>
				<B size={[1.6, 2, 1.4]} pos={[0, 1, 0]} color="#8a6a48" />
				<B size={[0.9, 0.5, 0.5]} pos={[0, 2.25, 0.2]} color="#1a1a1a" />
				<BlockText text="6:00" size={0.22} depth={0.03} color="#ff3a3a" emissive={2} position={[0, 2.27, 0.47]} />
			</group>
			{/* desk with lamp and books, framed posters (3D frames), shoes lined up, trophy shelf */}
			<group position={[-4.6, 0, -3.8]}>
				<B size={[3.2, 0.2, 1.8]} pos={[0, 2.6, 0]} color="#a87a50" />
				{[-1.4, 1.4].map((x) => <B key={x} size={[0.2, 2.6, 1.6]} pos={[x, 1.3, 0]} color="#8a6a48" />)}
				<Book pos={[-0.8, 2.8, 0]} c="#c83a3a" />
				<Book pos={[-0.8, 2.95, 0]} c="#3a6ac8" rot={0.2} />
				<B size={[0.1, 1.2, 0.1]} pos={[0.8, 3.3, -0.4]} rot={[0, 0, 0.3]} color="#2a2a2a" />
				<Cyl r={0.4} r2={0.15} h={0.4} seg={6} pos={[1.0, 3.9, -0.3]} color="#e8c84a" glow={0.6} />
				<pointLight position={[1, 3.6, 0]} color="#ffc878" intensity={5} distance={8} />
			</group>
			{[
				[-3.6, '#c83a3a'],
				[0.8, '#1d2f5a'],
			].map(([x, c]) => (
				<group key={x} position={[x as number, 7, -4.9]}>
					<B size={[2.2, 2.8, 0.12]} color="#2a2a2a" />
					<B size={[1.9, 2.5, 0.14]} color={c as string} />
					<mesh position={[0, 0.2, 0.1]}>
						<icosahedronGeometry args={[0.5, 0]} />
						<meshLambertMaterial color="#e07a2a" flatShading />
					</mesh>
				</group>
			))}
			{[0, 1, 2].map((i) => <B key={i} size={[0.5, 0.35, 0.9]} pos={[5.4 + (i % 2) * 0.6, 0.18, 0.5 - i * 1.1]} color={['#f2f2f2', '#1a1a1a', '#c83a3a'][i]} />)}
			<B size={[3, 0.15, 0.8]} pos={[3, 5.6, -4.6]} color="#8a6a48" />
			<group position={[2.4, 5.7, -4.6]} scale={0.5}>
				<Trophy />
			</group>
		</>
	);
};

// 6b  Walker kitchen, morning (sun through blinds)
export const Breakfast: React.FC = () => {
	const floor = useMat(T.tiles('#f0e8d8', '#c8b898'), 8, 8);
	const wall = useMat(T.wall('#f4e8c8', '#ecdcb4'), 4, 2);
	return (
		<>
			<SkyDome top="#9ac8f0" bottom="#fff0d0" />
			<Rig4 sky="#fff4e0" ground="#a88a60" hemi={1.0} key="#fff0c8" keyI={2.4} keyPos={[-10, 9, -6]} rim="#ffffff" fill={0.6} />
			<Floor mat={floor} />
			<Wall mat={wall} pos={[0, 7, -6]} />
			<Window pos={[-2, 6.4, -5.9]} w={4} h={3} view="day" blinds />
			{/* table with cereal boxes, juice, bowls */}
			<group position={[0, 0, -1.4]}>
				<B size={[6, 0.25, 3]} pos={[0, 2.6, 0]} color="#c89a6a" />
				{[-2.7, 2.7].map((x) => [-1.3, 1.3].map((z) => <B key={`${x}${z}`} size={[0.2, 2.6, 0.2]} pos={[x, 1.3, z]} color="#8a6a48" />))}
				<B size={[0.9, 1.3, 0.35]} pos={[-1.6, 3.4, -0.7]} color="#e8c84a" />
				<B size={[0.9, 1.3, 0.35]} pos={[-0.5, 3.4, -0.8]} rot={[0, 0.2, 0]} color="#c83a3a" />
				<Cyl r={0.3} h={1.0} seg={6} pos={[0.8, 3.2, -0.6]} color="#ffa83a" />
				{[-1.2, 0.6, 2].map((x) => <Cyl key={x} r={0.45} r2={0.3} h={0.3} seg={8} pos={[x, 2.88, 0.6]} color="#f4f4f0" />)}
			</group>
			{/* fridge calendar with gold stars, counter with toaster + plant */}
			<group position={[5, 0, -5]}>
				<B size={[2.4, 6, 1.8]} pos={[0, 3, 0]} color="#f4f0e4" />
				<B size={[1.6, 1.8, 0.05]} pos={[0, 4.2, 0.92]} color="#ffffff" />
				{Array.from({length: 12}, (_, i) => <B key={i} size={[0.18, 0.18, 0.05]} pos={[-0.55 + (i % 4) * 0.36, 4.7 - Math.floor(i / 4) * 0.45, 0.96]} color="#f0c020" glow={0.5} shadow={false} />)}
			</group>
			<group position={[-5.2, 0, -5]}>
				<B size={[4, 3, 1.8]} pos={[0, 1.5, 0]} color="#7aa0b8" />
				<B size={[4.2, 0.2, 2]} pos={[0, 3.1, 0]} color="#f0ece0" />
				<B size={[1.2, 0.8, 0.8]} pos={[-0.8, 3.6, 0]} color="#c8c8c8" />
				<Cyl r={0.35} h={0.6} seg={6} pos={[1.2, 3.5, 0]} color="#c86a3a" />
				<B size={[0.8, 0.8, 0.8]} pos={[1.2, 4.2, 0]} rot={[0.3, 0.5, 0]} color="#3a8a3a" />
			</group>
			{[-3.6, 3.6].map((x) => <Chair key={x} pos={[x, 0, -1.4]} rot={x < 0 ? PI / 2 : -PI / 2} c="#c84a3a" />)}
		</>
	);
};

// 6c  School front steps, bus pulling up
export const SchoolSteps: React.FC<{busX: number}> = ({busX}) => {
	const walk = useMat(T.concrete('#a8a49c'), 10, 10);
	const brick = useMat(T.brick('#a84a34'), 8, 4);
	return (
		<>
			<SkyDome top="#5a9ae0" bottom="#d8ecff" />
			<Rig4 sky="#e0f0ff" ground="#6a6a5a" key="#fff4dc" keyI={2.2} keyPos={[-8, 14, 10]} rim="#ffffff" span={22} />
			<mesh rotation={[-PI / 2, 0, 0]} material={walk} receiveShadow>
				<planeGeometry args={[100, 100]} />
			</mesh>
			<mesh material={brick} position={[0, 8, -12]}>
				<boxGeometry args={[40, 16, 1]} />
			</mesh>
			{/* steps + doors + school name block + flagpole */}
			{[0, 1, 2, 3].map((i) => <B key={i} size={[10 - i, 0.5, 1.2]} pos={[0, 0.25 + i * 0.5, -7 - i * 1.2]} color="#c8c4bc" />)}
			<B size={[4, 4.6, 0.3]} pos={[0, 4.4, -11.4]} color="#5a3a22" />
			<B size={[0.1, 4.6, 0.35]} pos={[0, 4.4, -11.35]} color="#2a1a10" />
			<BlockText text="ELEMENTARY" size={0.8} depth={0.2} color="#f2ead8" position={[0, 8, -11.3]} />
			<group position={[-9, 0, -8]}>
				<B size={[0.2, 14, 0.2]} pos={[0, 7, 0]} color="#c8c8c8" />
				<B size={[2.6, 1.6, 0.05]} pos={[1.4, 12.8, 0]} color="#c83a3a" />
				<B size={[1.1, 0.8, 0.06]} pos={[0.6, 13.2, 0]} color="#2a4a8a" />
			</group>
			{[-14, 12].map((x) => (
				<group key={x} position={[x, 0, -6]}>
					<Cyl r={0.5} h={4} seg={6} pos={[0, 2, 0]} color="#6a4a2a" />
					<mesh position={[0, 5.2, 0]} castShadow>
						<icosahedronGeometry args={[2.6, 0]} />
						<meshLambertMaterial color="#3a8a3a" flatShading />
					</mesh>
				</group>
			))}
			{/* bike rack */}
			<group position={[7, 0, -5]}>
				{[0, 1, 2, 3].map((i) => <B key={i} size={[0.1, 1.2, 1.2]} pos={[i * 0.8, 0.6, 0]} color="#8a8a8a" />)}
				<B size={[0.2, 1.2, 1.8]} pos={[0.4, 0.8, 0.4]} color="#c83a3a" />
			</group>
			{/* yellow bus */}
			<group position={[busX, 0, 2.5]}>
				<B size={[14, 4, 3.4]} pos={[0, 2.6, 0]} color="#f2b81c" />
				<B size={[13.6, 1.2, 3.45]} pos={[0, 3.4, 0]} color="#3a4a5a" />
				{Array.from({length: 6}, (_, i) => <B key={i} size={[0.2, 1.2, 3.5]} pos={[-5.5 + i * 2.2, 3.4, 0]} color="#f2b81c" shadow={false} />)}
				<B size={[14, 0.3, 3.5]} pos={[0, 1.6, 0]} color="#1a1a1a" />
				{[-4.5, 4.5].map((x) => [-1.7, 1.7].map((z) => <Cyl key={`${x}${z}`} r={0.7} h={0.4} seg={8} pos={[x, 0.7, z]} rot={[PI / 2, 0, 0]} color="#1a1a1a" />))}
				<B size={[0.6, 0.6, 0.1]} pos={[-7.02, 3.6, -1.2]} rot={[0, PI / 2, 0]} color="#c83a3a" />
			</group>
		</>
	);
};

// 7  High-school gym photo shoot
export const PhotoGym: React.FC<{flash: number}> = ({flash}) => {
	const court = useMat(T.court, 6, 6);
	const wall = useMat(T.wall('#1f6a3a', '#1a5a32'), 6, 2);
	return (
		<>
			<SkyDome top="#0a140e" bottom="#1a2a20" />
			<Rig4 sky="#d8ffe8" ground="#5a4a2a" hemi={0.7 + flash} key="#ffffff" keyI={1.4 + flash * 3} keyPos={[4, 9, 10]} rim="#e8c84a" rimI={2} />
			<Floor mat={court} />
			<Wall mat={wall} pos={[0, 8, -9]} w={40} h={16} />
			{/* championship banners (3D) */}
			{[-6, -2, 2, 6].map((x, i) => (
				<group key={x} position={[x, 11.5, -8.8]}>
					<B size={[2.4, 3, 0.1]} color="#e8c84a" />
					<B size={[2.1, 2.6, 0.12]} color="#1f6a3a" />
					<BlockText text={`'0${i}`} size={0.6} depth={0.05} color="#e8c84a" position={[0, 0, 0.1]} />
				</group>
			))}
			{/* folded bleachers */}
			{[0, 1, 2].map((i) => <B key={i} size={[30, 0.9, 1]} pos={[0, 0.45 + i * 0.9, -8.4 + i * -0.1]} color="#8a6a48" />)}
			{/* photo backdrop paper, softboxes, umbrella flash */}
			<B size={[9, 9, 0.1]} pos={[0, 4.5, -4]} color="#e8e4dc" />
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.02, -1.5]}>
				<planeGeometry args={[9, 5]} />
				<meshLambertMaterial color="#e8e4dc" />
			</mesh>
			{[-5.5, 5.5].map((x, i) => (
				<group key={x} position={[x, 0, 0]} rotation={[0, x < 0 ? 0.6 : -0.6, 0]}>
					<B size={[0.12, 5, 0.12]} pos={[0, 2.5, 0]} color="#2a2a2a" />
					<B size={[2, 2.4, 0.8]} pos={[0, 5.6, 0]} color="#1a1a1a" />
					<B size={[1.8, 2.2, 0.05]} pos={[0, 5.6, 0.42]} color="#ffffff" glow={0.6 + flash * 4} shadow={false} />
					{i === 0 ? <pointLight position={[0, 5.6, 1.5]} color="#ffffff" intensity={3 + flash * 30} distance={14} /> : null}
				</group>
			))}
			{/* ball rack */}
			<group position={[7.4, 0, -3]}>
				<B size={[3, 0.15, 1]} pos={[0, 1, 0]} color="#8a8a8a" />
				<B size={[3, 0.15, 1]} pos={[0, 2.2, 0]} color="#8a8a8a" />
				{[0, 1, 2].map((i) => (
					<group key={i} position={[-1 + i, 1.5, 0]}>
						<Ball r={0.4} />
					</group>
				))}
			</group>
			{/* hoop on the wall */}
			<group position={[-9, 9, -8.6]}>
				<B size={[4, 2.6, 0.15]} color="#f4f4f4" />
				<Cyl r={0.6} h={0.08} seg={10} pos={[0, -1.3, 0.8]} color="#e2541c" />
			</group>
		</>
	);
};

// 8  Street newsstand with the cover
export const Newsstand: React.FC = () => {
	const walk = useMat(T.concrete('#8a8680'), 8, 8);
	const mags = useMemo(
		() =>
			[
				['#3a6ac8', '#c83a3a'],
				['#e8c84a', '#2a2a2a'],
				['#c83a3a', '#f2f2f2'],
				['#3aa86a', '#1a1a1a'],
				['#8a4ac8', '#e8c84a'],
				['#f2f2f2', '#c83a3a'],
			].map(([a, b]) => new THREE.MeshLambertMaterial({map: T.magazine(a, b)()})),
		[],
	);
	return (
		<>
			<SkyDome top="#1a1a3a" bottom="#5a4a6a" />
			<Rig4 sky="#c8c8ff" ground="#3a3030" hemi={0.8} key="#ffe0b0" keyI={1.4} keyPos={[3, 10, 10]} rim="#ff5aa8" rimI={1.8} />
			<mesh rotation={[-PI / 2, 0, 0]} material={walk} receiveShadow>
				<planeGeometry args={[60, 60]} />
			</mesh>
			{/* kiosk */}
			<B size={[12, 0.4, 4]} pos={[0, 9.4, -3]} color="#2a5a3a" />
			<B size={[12, 9, 0.3]} pos={[0, 4.5, -5]} color="#3a3a3a" />
			<BlockText text="NEWS" size={1.0} depth={0.25} color="#ff4aa8" emissive={2.5} position={[0, 10.3, -1.2]} />
			{/* rows of magazines on slanted racks */}
			{[2.2, 4.4, 6.6].map((y, r) =>
				Array.from({length: 7}, (_, i) =>
					r === 1 && i === 3 ? null : (
						<mesh key={`${r}${i}`} material={mags[(i + r * 2) % mags.length]} position={[-4.5 + i * 1.5, y, -4.6]} rotation={[-0.2, 0, 0]}>
							<boxGeometry args={[1.3, 1.75, 0.06]} />
						</mesh>
					),
				),
			)}
			{[2.2, 4.4, 6.6].map((y) => <B key={y} size={[11, 0.15, 0.6]} pos={[0, y - 1, -4.4]} color="#5a5a5a" />)}
			{/* newspapers stack + crate, counter */}
			<B size={[2.4, 1, 1.6]} pos={[-4, 0.5, -1]} color="#e8e4d8" />
			<B size={[2.6, 0.06, 1.7]} pos={[-4, 1.03, -1]} color="#2a2a2a" />
			<B size={[3, 3, 2]} pos={[4.5, 1.5, -2]} color="#2a5a3a" />
			<Cyl r={0.15} h={0.4} seg={6} pos={[4, 3.2, -2]} color="#c83a3a" />
			<group position={[-9, 0, -1]}>
				<B size={[0.25, 8, 0.25]} pos={[0, 4, 0]} color="#3a3a3a" />
				<B size={[0.7, 0.4, 0.5]} pos={[0, 8, 0]} color="#ffd890" glow={2} />
			</group>
		</>
	);
};

// The cover itself (3D): sits in the middle rack slot, or held up close.
export const Cover: React.FC<{chosen: boolean}> = ({chosen}) => (
	<group>
		<B size={[1.3, 1.75, 0.08]} color="#c83a3a" />
		<B size={[1.24, 0.3, 0.1]} pos={[0, 0.7, 0]} color="#f2f2f2" />
		<BlockText text="SPORTS WEEKLY" size={0.1} depth={0.02} color="#c83a3a" position={[0, 0.7, 0.07]} />
		<B size={[0.7, 0.9, 0.09]} pos={[0.15, -0.1, 0]} color="#1f6a3a" />
		<B size={[0.36, 0.38, 0.1]} pos={[0.15, 0.48, 0]} color="#7a4a32" />
		<BlockText text="23" size={0.22} depth={0.02} color="#e8c84a" position={[0.15, -0.05, 0.06]} />
		{chosen ? <BlockText text="THE CHOSEN ONE" size={0.11} depth={0.03} color="#ffffff" position={[0, -0.72, 0.08]} /> : null}
	</group>
);

// 9/10  Draft green room + stage
export const DraftStage: React.FC<{flash: number; pick: boolean}> = ({flash, pick}) => {
	const carpet = useMat(T.carpet('#1a1a3a', '#2a2a5a'), 8, 8);
	return (
		<>
			<SkyDome top="#05050a" bottom="#101020" />
			<Rig4 sky="#a8b8ff" ground="#1a1020" hemi={0.6} key="#ffffff" keyI={1.8 + flash * 2} keyPos={[0, 14, 10]} rim="#4a7aff" rimI={2.4} />
			<Floor mat={carpet} />
			{/* stage + podium + big 3D #1 + screens */}
			<B size={[20, 1, 8]} pos={[0, 0.5, -6]} color="#1a1a2a" />
			<B size={[20, 0.1, 0.2]} pos={[0, 1.02, -2.05]} color="#4a7aff" glow={2} shadow={false} />
			<group position={[3.2, 1, -3.6]}>
				<B size={[1.8, 3.6, 1.2]} pos={[0, 1.8, 0]} color="#2a2a3a" />
				<B size={[1.9, 0.2, 1.4]} pos={[0, 3.7, 0.1]} color="#4a4a5a" />
				<B size={[0.06, 0.6, 0.06]} pos={[0, 4, 0.4]} rot={[0.4, 0, 0]} color="#1a1a1a" />
			</group>
			{pick ? (
				<group position={[0, 10, -9]}>
					<BlockText text="#1" size={3.2} depth={0.8} color="#ffd84a" side="#a8781a" emissive={0.4} />
				</group>
			) : null}
			{[-8, 8].map((x) => (
				<group key={x} position={[x, 7, -9.6]}>
					<B size={[5.2, 3.4, 0.3]} color="#1a1a1a" />
					<B size={[4.8, 3, 0.32]} color="#2a4a9a" glow={0.6 + flash} shadow={false} />
				</group>
			))}
			{/* camera crews and flash wall */}
			{[-7, 7].map((x, i) => (
				<group key={x} position={[x, 0, 5]} rotation={[0, i ? -0.5 : 0.5, 0]}>
					{[-0.5, 0, 0.5].map((dx) => <B key={dx} size={[0.08, 3, 0.08]} pos={[dx, 1.5, 0]} rot={[0, 0, dx]} color="#2a2a2a" />)}
					<B size={[1.4, 1, 2]} pos={[0, 3.4, 0]} color="#2a2a2a" />
					<Cyl r={0.35} h={0.8} seg={8} pos={[0, 3.4, -1.2]} rot={[PI / 2, 0, 0]} color="#1a1a1a" />
				</group>
			))}
			<Crowd cols={['#1a1a1a', '#2a2a3a', '#f2f2f2', '#6f263d', '#ffb81c']} pos={[0, 0, 12]} rot={[0, PI, 0]} w={36} h={8} />
			{/* green room tables (left) */}
			{[-12, -16].map((x, i) => (
				<group key={x} position={[x, 0, -1 - i * 3]}>
					<Cyl r={1.6} h={0.15} seg={10} pos={[0, 2.6, 0]} color="#f4f0e8" />
					<Cyl r={0.2} h={2.6} seg={6} pos={[0, 1.3, 0]} color="#3a3a3a" />
					<Cyl r={0.12} h={0.5} seg={6} pos={[0.5, 2.9, 0.3]} color="#c8e8ff" />
				</group>
			))}
			{flash > 0 ? <pointLight position={[0, 5, 6]} color="#ffffff" intensity={flash * 40} distance={20} /> : null}
		</>
	);
};

// 11a  Locker room (down 3-1)
export const Locker: React.FC = () => {
	const floor = useMat(T.tiles('#5a5a62', '#4a4a52'), 8, 8);
	const lockers = useMat(T.locker('#6f263d'), 3, 1);
	return (
		<>
			<SkyDome top="#0a0a10" bottom="#16161e" />
			<Rig4 sky="#a8b8d8" ground="#3a3a40" hemi={0.8} key="#d8e8ff" keyI={1.8} keyPos={[2, 12, 6]} rim="#ffb81c" rimI={1.6} fill={0.6} />
			<Floor mat={floor} />
			<mesh material={lockers} position={[0, 4, -4.5]}>
				<boxGeometry args={[20, 8, 1]} />
			</mesh>
			<B size={[20, 0.6, 1.6]} pos={[0, 8.3, -4]} color="#2a2a30" />
			{/* bench, towels, shoes, water bottles, whiteboard with plays, tape roll */}
			<B size={[12, 0.3, 1.4]} pos={[0, 1.6, -1.6]} color="#a87a50" />
			{[-5, 0, 5].map((x) => <B key={x} size={[0.3, 1.6, 1.2]} pos={[x, 0.8, -1.6]} color="#3a3a3a" />)}
			{[-4, 3.6].map((x, i) => <B key={x} size={[1.2, 0.2, 0.9]} pos={[x, 1.85, -1.6]} rot={[0, i * 0.4, 0]} color="#f2f2f2" />)}
			{[-2.6, -2.2].map((x) => <B key={x} size={[0.4, 0.3, 0.8]} pos={[x, 0.15, 0]} color="#f2f2f2" />)}
			{[4, 4.5, 5].map((x) => <Cyl key={x} r={0.18} h={0.7} seg={6} pos={[x, 2.1, -1.4]} color="#ffb81c" />)}
			<group position={[-6.5, 5.2, -3.9]}>
				<B size={[4, 2.8, 0.15]} color="#f4f4f4" />
				{[
					[-1, 0.5],
					[0.5, -0.2],
					[1.2, 0.8],
				].map(([x, y], i) => <B key={i} size={[0.3, 0.3, 0.05]} pos={[x, y, 0.1]} color="#2a4ac8" shadow={false} />)}
				<B size={[1.8, 0.06, 0.04]} pos={[-0.2, 0.15, 0.1]} rot={[0, 0, -0.45]} color="#c83a3a" shadow={false} />
				<B size={[1.0, 0.06, 0.04]} pos={[0.85, 0.3, 0.1]} rot={[0, 0, 1.2]} color="#c83a3a" shadow={false} />
			</group>
			<Cyl r={0.3} h={0.25} seg={8} pos={[1.4, 1.88, -1.4]} color="#f2f2f2" />
			<Bulb pos={[0, 10.5, -1]} color="#e8f0ff" i={3} d={14} />
		</>
	);
};

// 11b/12/13/14/17  Arena (team colours, 3D scoreboard text, crowd, confetti handled in shots)
export const Arena: React.FC<{cols: string[]; floorC: string; board?: React.ReactNode; flash?: number; banner?: string}> = ({cols, floorC, board, flash = 0, banner}) => {
	const court = useMat(T.court, 8, 8);
	return (
		<>
			<SkyDome top="#020204" bottom="#0a0a12" fog="#0a0a12" near={30} far={90} />
			<Rig4 sky="#a8b0d0" ground="#2a1a10" hemi={0.7} key="#fff4e0" keyI={2.0 + flash} keyPos={[2, 18, 8]} rim={cols[1]} rimI={2.2} span={20} />
			<mesh rotation={[-PI / 2, 0, 0]} material={court} receiveShadow>
				<planeGeometry args={[40, 40]} />
			</mesh>
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.02, 0]}>
				<circleGeometry args={[3, 12]} />
				<meshLambertMaterial color={floorC} />
			</mesh>
			<B size={[40, 0.03, 0.2]} pos={[0, 0.03, 0]} color="#f2f2f2" shadow={false} />
			{/* paint + hoop at the far end */}
			<B size={[8, 0.03, 9]} pos={[0, 0.025, -14]} color={floorC} shadow={false} />
			<group position={[0, 0, -18.5]}>
				<B size={[0.6, 10, 0.6]} pos={[0, 5, -1.5]} color="#2a2a30" />
				<B size={[6, 3.6, 0.2]} pos={[0, 11.2, 0]} color="#f4f8fa" />
				<B size={[2, 1.4, 0.22]} pos={[0, 10.8, 0]} color="#d8382b" />
				<Cyl r={0.8} h={0.1} seg={12} pos={[0, 10, 0.9]} color="#e2541c" />
			</group>
			{/* crowd stands both sides + far */}
			<Crowd cols={cols.concat(['#f2f2f2', '#1a1a1a'])} pos={[0, 0, -24]} w={60} h={14} />
			<Crowd cols={cols.concat(['#f2f2f2', '#1a1a1a'])} pos={[-22, 0, 0]} rot={[0, PI / 2, 0]} w={50} h={12} seed={9} />
			<Crowd cols={cols.concat(['#f2f2f2', '#1a1a1a'])} pos={[22, 0, 0]} rot={[0, -PI / 2, 0]} w={50} h={12} seed={13} />
			{/* courtside: scorer's table with lights, chairs, photographers' row */}
			<group position={[0, 0, 12]} rotation={[0, PI, 0]}>
				<B size={[16, 2.4, 1.4]} pos={[0, 1.2, 0]} color="#1a1a22" />
				<B size={[15.6, 0.6, 0.05]} pos={[0, 1.6, 0.72]} color={cols[1]} glow={1.2} shadow={false} />
			</group>
			{/* hanging scoreboard */}
			<group position={[0, 17, -8]}>
				<B size={[9, 5, 4]} color="#1a1a22" />
				<B size={[8.4, 4.4, 0.1]} pos={[0, 0, 2.02]} color="#05050a" />
				<B size={[9, 0.3, 4.1]} pos={[0, -2.6, 0]} color={cols[1]} glow={1.5} shadow={false} />
				{board ? <group position={[0, 0, 2.1]}>{board}</group> : null}
			</group>
			{banner ? (
				<group position={[-10, 13, -20]}>
					<B size={[5, 3.2, 0.2]} color={cols[0]} />
					<BlockText text={banner} size={0.8} depth={0.1} color={cols[1]} position={[0, 0, 0.15]} />
				</group>
			) : null}
			{/* light rig + bloom-y flashes */}
			{[-10, 10].map((x) => <B key={x} size={[4, 0.5, 2]} pos={[x, 22, -4]} color="#ffffff" glow={2} shadow={false} />)}
			{flash > 0 ? <pointLight position={[0, 8, 8]} color="#ffffff" intensity={flash * 25} distance={30} /> : null}
		</>
	);
};

// 16  Rooftop above the Akron street, night
export const Rooftop: React.FC = () => {
	const roof = useMat(T.concrete('#5a5a60'), 6, 6);
	return (
		<>
			<AkronStreet lamps={1} night />
			<directionalLight position={[-6, 20, 16]} intensity={1.4} color="#b8c8ff" />
			<pointLight position={[0, 14, 10]} color="#ffd8a0" intensity={6} distance={14} />
			<group position={[0, 9, 4]}>
				<mesh rotation={[-PI / 2, 0, 0]} material={roof} receiveShadow>
					<planeGeometry args={[24, 14]} />
				</mesh>
				<B size={[24, 1, 0.5]} pos={[0, 0.5, -6.8]} color="#6a6a70" />
				<B size={[2, 2.4, 2]} pos={[-7, 1.2, 2]} color="#7a7a80" />
				<Cyl r={0.4} h={2} seg={6} pos={[-7, 3.2, 2]} color="#5a5a60" />
				<B size={[3, 1.6, 2]} pos={[7, 0.8, 3]} color="#8a8a90" />
				{[-3, 0, 3].map((x) => <B key={x} size={[0.06, 0.06, 0.06]} pos={[x, 2.5, -6.8]} color="#ffd890" glow={3} shadow={false} />)}
				<B size={[10, 0.03, 0.03]} pos={[0, 2.5, -6.8]} color="#2a2a2a" shadow={false} />
			</group>
		</>
	);
};

// 17  Arena tunnel toward the light
export const Tunnel: React.FC = () => {
	const floor = useMat(T.concrete('#3a3a40'), 4, 10);
	const wall = useMat(T.brick('#3a3a48'), 10, 3);
	return (
		<>
			<SkyDome top="#000000" bottom="#05050a" />
			<Rig4 sky="#8a8aff" ground="#1a1a20" hemi={0.35} key="#fff0d0" keyI={1.4} keyPos={[0, 6, -20]} rim="#fdb927" rimI={3} fill={0.25} />
			<mesh rotation={[-PI / 2, 0, 0]} material={floor} receiveShadow>
				<planeGeometry args={[10, 50]} />
			</mesh>
			{[-5, 5].map((x) => <Wall key={x} mat={wall} pos={[x, 4, -10]} rot={[0, x < 0 ? PI / 2 : -PI / 2, 0]} w={50} h={8} />)}
			<B size={[10, 0.4, 50]} pos={[0, 8, -10]} color="#1a1a20" />
			{Array.from({length: 6}, (_, i) => <B key={i} size={[2, 0.15, 0.5]} pos={[0, 7.7, 4 - i * 6]} color="#e8f0ff" glow={1.5} shadow={false} />)}
			{/* the light at the end */}
			<B size={[10, 8, 0.2]} pos={[0, 4, -34]} color="#fff4dc" glow={4} shadow={false} />
			<pointLight position={[0, 4, -30]} color="#fff0c8" intensity={30} distance={40} decay={1.2} />
			{/* rolling ball cart, banner */}
			<group position={[3.4, 0, -6]}>
				<B size={[1.6, 0.2, 3]} pos={[0, 1, 0]} color="#3a3a3a" />
				{[-0.9, 0, 0.9].map((z) => (
					<group key={z} position={[0, 1.6, z]}>
						<Ball r={0.4} />
					</group>
				))}
			</group>
		</>
	);
};
