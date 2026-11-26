import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {lambert, px, speckle, tex64} from './ps1';

const PI = Math.PI;
type V3 = [number, number, number];

// Low-poly box with a (shared) material or plain colour.
export const B: React.FC<{size: V3; pos?: V3; rot?: V3; color?: string; mat?: THREE.Material | THREE.Material[]; glow?: number; shadow?: boolean}> = ({
	size,
	pos = [0, 0, 0],
	rot = [0, 0, 0],
	color = '#888',
	mat,
	glow = 0,
	shadow = true,
}) => {
	const m = useMemo(() => mat ?? lambert({color, emissive: glow ? color : '#000000', emissiveIntensity: glow}), [mat, color, glow]);
	return (
		<mesh position={pos} rotation={rot} material={m} castShadow={shadow} receiveShadow>
			<boxGeometry args={size} />
		</mesh>
	);
};

// Low-segment cylinder (6-8 sides keeps the triangle budget).
export const Cyl: React.FC<{r: number; h: number; seg?: number; pos?: V3; rot?: V3; color: string; r2?: number; glow?: number}> = ({r, h, seg = 6, pos = [0, 0, 0], rot = [0, 0, 0], color, r2, glow = 0}) => {
	const m = useMemo(() => lambert({color, emissive: glow ? color : '#000000', emissiveIntensity: glow}), [color, glow]);
	return (
		<mesh position={pos} rotation={rot} material={m} castShadow receiveShadow>
			<cylinderGeometry args={[r2 ?? r, r, h, seg]} />
		</mesh>
	);
};

// Gradient sky dome (12x6 segments). It goes through the dither too, which is where the
// banding/dither pattern shows best.
export const SkyDome: React.FC<{top: string; bottom: string; fog?: string; near?: number; far?: number}> = ({top, bottom, fog, near = 25, far = 70}) => {
	const scene = useThree((s) => s.scene);
	scene.background = new THREE.Color(bottom);
	scene.fog = fog ? new THREE.Fog(fog, near, far) : null;
	const geo = useMemo(() => {
		const g = new THREE.SphereGeometry(90, 12, 8);
		const a = new THREE.Color(top);
		const b = new THREE.Color(bottom);
		const pos = g.attributes.position;
		const col: number[] = [];
		for (let i = 0; i < pos.count; i++) {
			const t = THREE.MathUtils.clamp((pos.getY(i) / 90) * 1.4 + 0.25, 0, 1);
			const c = b.clone().lerp(a, t);
			col.push(c.r, c.g, c.b);
		}
		g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
		return g;
	}, [top, bottom]);
	const mat = useMemo(() => new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide, fog: false}), []);
	return <mesh geometry={geo} material={mat} />;
};

// Light rig: hemisphere fill + shadow-casting key + rim from behind + soft front fill.
export const Lights: React.FC<{keyCol?: string; keyPos?: V3; keyI?: number; rim?: string; rimI?: number; fill?: number; sky?: string; ground?: string; hemiI?: number}> = ({
	keyPos = [6, 12, 7],
	keyI = 2.2,
	rim = '#7fb4ff',
	rimI = 1.6,
	fill = 0.6,
	sky = '#c9d8ff',
	ground = '#3a2a22',
	hemiI = 0.9,
	keyCol = '#fff1dc',
}) => {
	return (
		<>
			<hemisphereLight args={[sky, ground, hemiI]} />
			<directionalLight
				position={keyPos}
				intensity={keyI}
				color={keyCol}
				castShadow
				shadow-mapSize={[1024, 1024]}
				shadow-bias={-0.002}
				shadow-camera-left={-12}
				shadow-camera-right={12}
				shadow-camera-top={12}
				shadow-camera-bottom={-12}
			/>
			<directionalLight position={[-5, 8, -10]} intensity={rimI} color={rim} />
			<directionalLight position={[0, 4, 14]} intensity={fill} color="#ffffff" />
		</>
	);
};

// ---------- Textures (all 64 px or smaller, painted by code) ----------

const repeat = (t: THREE.Texture, x: number, y: number) => {
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(x, y);
	return t;
};

const gridTex = (base: string, line: string) =>
	tex64((g) => {
		px(g, base, 0, 0, 64, 64);
		speckle(g, 64, 64, [line + '33'], 40, 12);
		px(g, line, 0, 0, 64, 2);
		px(g, line, 0, 0, 2, 64);
		px(g, line + '88', 32, 0, 1, 64);
		px(g, line + '88', 0, 32, 64, 1);
	});

const planks = () =>
	tex64((g) => {
		const cols = ['#8a5a36', '#7d5030', '#946240', '#83552f'];
		for (let i = 0; i < 4; i++) {
			px(g, cols[i], 0, i * 16, 64, 16);
			px(g, '#4e3019', 0, i * 16 + 15, 64, 1);
			px(g, '#4e3019', (i * 23) % 64, i * 16, 1, 15);
		}
		speckle(g, 64, 64, ['#5e3b20', '#a2704a'], 140, 21);
	});

const wallpaper = () =>
	tex64((g) => {
		px(g, '#3b4a7a', 0, 0, 64, 64);
		for (let x = 0; x < 64; x += 16) px(g, '#33406b', x, 0, 8, 64);
		for (let y = 6; y < 64; y += 16) for (let x = 3; x < 64; x += 16) (px(g, '#e8c84a', x, y, 2, 2), px(g, '#e8c84a', x + 8, y + 8, 2, 2));
		speckle(g, 64, 64, ['#2c375c'], 60, 5);
	});

const quilt = () =>
	tex64((g) => {
		for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) px(g, (x + y) % 16 ? '#c84a4a' : '#f0e2c8', x, y, 8, 8);
		speckle(g, 64, 64, ['#00000022'], 80, 2);
	});

const rugTex = () =>
	tex64((g) => {
		px(g, '#6b2f5e', 0, 0, 64, 64);
		px(g, '#e8c84a', 4, 4, 56, 56);
		px(g, '#6b2f5e', 6, 6, 52, 52);
		for (let i = 0; i < 4; i++) px(g, '#2fa39a', 14 + i * 9, 14 + i * 9, 36 - i * 18 > 0 ? 36 - i * 18 : 2, 36 - i * 18 > 0 ? 36 - i * 18 : 2);
	});

export const crateTex = (rows = 64) =>
	tex64((g) => {
		px(g, '#2a2a2a', 0, 0, 64, 64);
		const draw = (gg: CanvasRenderingContext2D) => {
			px(gg, '#b07a3e', 0, 0, 64, 64);
			for (let y = 0; y < 64; y += 8) px(gg, '#9a6732', 0, y, 64, 1);
			speckle(gg, 64, 64, ['#8a5a2a', '#c48c4c'], 160, 33);
			px(gg, '#6e4520', 0, 0, 64, 6);
			px(gg, '#6e4520', 0, 58, 64, 6);
			px(gg, '#6e4520', 0, 0, 6, 64);
			px(gg, '#6e4520', 58, 0, 6, 64);
			for (let i = 0; i < 52; i++) px(gg, '#6e4520', 6 + i, 6 + i, 4, 1);
			for (const [x, y] of [[2, 2], [60, 2], [2, 60], [60, 60]]) px(gg, '#d8d0c0', x, y, 2, 2);
		};
		const c = document.createElement('canvas');
		c.width = c.height = 64;
		draw(c.getContext('2d')!);
		g.drawImage(c, 0, 0, 64, rows, 0, 0, 64, rows);
		// the code "brush": a bright scanline where the painting is up to
		if (rows < 64) px(g, '#7dff5a', 0, rows, 64, 1);
	});

const staticTex = (seed: number) =>
	tex64((g) => {
		px(g, '#1a3a5a', 0, 0, 64, 48);
		speckle(g, 64, 48, ['#5aa0d8', '#9cd0ff', '#2a5a8a'], 500, seed);
		for (let y = 0; y < 48; y += 3) px(g, '#0a1a2a88', 0, y, 64, 1);
		// a tiny blocky "game" on the screen
		px(g, '#e8c84a', 26, 20, 8, 8);
		px(g, '#3fa34a', 0, 36, 64, 12);
	}, 64, 48);

// ---------- Sets ----------

const FloorGrid: React.FC<{base: string; line: string}> = ({base, line}) => {
	const m = useMemo(() => lambert({map: repeat(gridTex(base, line), 12, 12)}), [base, line]);
	return (
		<mesh rotation={[-PI / 2, 0, 0]} material={m} receiveShadow>
			<planeGeometry args={[48, 48]} />
		</mesh>
	);
};

// "Studio": a 3D-viewport stage, recoloured per rule.
export const Studio: React.FC<{top: string; bottom: string; base: string; line: string; rim?: string}> = ({top, bottom, base, line, rim}) => (
	<>
		<SkyDome top={top} bottom={bottom} fog={bottom} near={22} far={60} />
		<Lights rim={rim} />
		<FloorGrid base={base} line={line} />
		{/* Viewport axis gizmo in the corner of the stage */}
		<group position={[-7, 0.05, -8]}>
			<B size={[3, 0.15, 0.15]} pos={[1.5, 0, 0]} color="#e04848" glow={0.4} />
			<B size={[0.15, 3, 0.15]} pos={[0, 1.5, 0]} color="#3fa34a" glow={0.4} />
			<B size={[0.15, 0.15, 3]} pos={[0, 0, 1.5]} color="#4870e0" glow={0.4} />
		</group>
	</>
);

export const CRT: React.FC<{frame: number; pos?: V3; rot?: V3}> = ({frame, pos = [0, 0, 0], rot = [0, 0, 0]}) => {
	const seed = Math.floor(frame / 4) + 1;
	const screen = useMemo(() => {
		const t = staticTex(seed);
		return new THREE.MeshBasicMaterial({map: t});
	}, [seed]);
	return (
		<group position={pos} rotation={rot}>
			<B size={[2.6, 2.2, 2.2]} pos={[0, 1.1, 0]} color="#c8c0ae" />
			<B size={[2.0, 1.7, 1.2]} pos={[0, 1.1, -1.4]} color="#b4ac9a" />
			<B size={[2.2, 1.7, 0.08]} pos={[0, 1.2, 1.1]} color="#4a463e" />
			<mesh position={[0, 1.2, 1.15]} material={screen}>
				<planeGeometry args={[1.9, 1.45]} />
			</mesh>
			<B size={[0.2, 0.2, 0.06]} pos={[0.95, 0.22, 1.12]} color="#e04848" glow={0.8} />
			<B size={[0.08, 0.9, 0.08]} pos={[-0.5, 2.6, -0.3]} rot={[0, 0, 0.4]} color="#888" />
			<B size={[0.08, 0.9, 0.08]} pos={[0.5, 2.6, -0.3]} rot={[0, 0, -0.4]} color="#888" />
			<pointLight position={[0, 1.2, 2.4]} color="#6fb6ff" intensity={6} distance={9} decay={1.5} />
		</group>
	);
};

export const Controller: React.FC<{pos?: V3; rot?: V3}> = ({pos = [0, 0, 0], rot = [0, 0, 0]}) => (
	<group position={pos} rotation={rot}>
		<B size={[0.9, 0.16, 0.4]} color="#9a9a96" />
		<B size={[0.3, 0.16, 0.45]} pos={[-0.4, 0, 0.12]} color="#9a9a96" />
		<B size={[0.3, 0.16, 0.45]} pos={[0.4, 0, 0.12]} color="#9a9a96" />
		<B size={[0.08, 0.04, 0.08]} pos={[0.3, 0.1, -0.05]} color="#e04848" />
		<B size={[0.08, 0.04, 0.08]} pos={[0.42, 0.1, 0.03]} color="#4870e0" />
		<B size={[0.16, 0.04, 0.05]} pos={[-0.32, 0.1, 0]} color="#333" />
		<B size={[0.05, 0.04, 0.16]} pos={[-0.32, 0.1, 0]} color="#333" />
	</group>
);

// The kid's bedroom at night: CRT glow, moon through the window, desk lamp.
export const Bedroom: React.FC<{frame: number}> = ({frame}) => {
	const M = useMemo(
		() => ({
			floor: lambert({map: repeat(planks(), 6, 6)}),
			wall: lambert({map: repeat(wallpaper(), 6, 3)}),
			quilt: lambert({map: quilt()}),
			rug: lambert({map: rugTex()}),
			night: new THREE.MeshBasicMaterial({
				map: tex64((g) => {
					px(g, '#0d1430', 0, 0, 64, 64);
					speckle(g, 64, 64, ['#ffffff', '#9cb0ff'], 30, 8);
					px(g, '#f3ead2', 40, 10, 12, 12);
					px(g, '#0d1430', 44, 8, 10, 10);
					px(g, '#141a2e', 0, 48, 64, 16);
					for (let x = 2; x < 64; x += 9) px(g, '#e8c84a', x, 52, 2, 3);
				}),
			}),
		}),
		[],
	);
	return (
		<>
			<SkyDome top="#05070f" bottom="#141a2e" />
			<hemisphereLight args={['#8fa2ff', '#4a2f22', 0.9]} />
			<directionalLight position={[5, 11, 9]} intensity={1.6} color="#ffd9a8" castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.002} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
			<directionalLight position={[-3, 7, -12]} intensity={1.8} color="#7f9cff" />
			<directionalLight position={[0, 4, 14]} intensity={0.55} color="#ffffff" />
			{/* room */}
			<mesh rotation={[-PI / 2, 0, 0]} material={M.floor} receiveShadow>
				<planeGeometry args={[20, 20]} />
			</mesh>
			<mesh position={[0, 6, -6]} material={M.wall} receiveShadow>
				<planeGeometry args={[20, 12]} />
			</mesh>
			<mesh position={[-8, 6, 2]} rotation={[0, PI / 2, 0]} material={M.wall} receiveShadow>
				<planeGeometry args={[16, 12]} />
			</mesh>
			<B size={[20, 0.4, 0.2]} pos={[0, 0.2, -5.9]} color="#e8dcc4" />
			{/* window with the night outside */}
			<group position={[-3.6, 6.6, -5.9]}>
				<mesh material={M.night} position={[0, 0, 0.02]}>
					<planeGeometry args={[3.2, 3]} />
				</mesh>
				<B size={[3.6, 0.25, 0.3]} pos={[0, 1.6, 0.1]} color="#e8dcc4" />
				<B size={[3.8, 0.3, 0.6]} pos={[0, -1.6, 0.2]} color="#e8dcc4" />
				<B size={[0.25, 3.2, 0.3]} pos={[-1.7, 0, 0.1]} color="#e8dcc4" />
				<B size={[0.25, 3.2, 0.3]} pos={[1.7, 0, 0.1]} color="#e8dcc4" />
				<B size={[0.12, 3, 0.2]} pos={[0, 0, 0.1]} color="#e8dcc4" />
				<Cyl r={0.25} h={0.5} pos={[1.1, -1.2, 0.3]} color="#c45a3a" />
				<B size={[0.5, 0.5, 0.5]} pos={[1.1, -0.7, 0.3]} rot={[0.3, 0.6, 0.2]} color="#3fa34a" />
			</group>
			{/* desk + CRT + console */}
			<group position={[3.2, 0, -4.4]}>
				<B size={[5, 0.3, 2.4]} pos={[0, 3, 0]} color="#7a5232" />
				{[-2.2, 2.2].map((x) => (
					<B key={x} size={[0.3, 3, 2.2]} pos={[x, 1.5, 0]} color="#6a4528" />
				))}
				<CRT frame={frame} pos={[-0.4, 3.15, 0]} rot={[0, -0.15, 0]} />
				<B size={[1.3, 0.3, 1]} pos={[1.7, 3.3, 0.4]} color="#8c8c88" />
				<B size={[0.6, 0.06, 0.4]} pos={[1.6, 3.48, 0.4]} color="#5a5a58" />
				<B size={[0.12, 0.08, 0.12]} pos={[2.15, 3.48, 0.75]} color="#3fa34a" glow={1} />
				{/* cartridges stack */}
				{['#e04848', '#4870e0', '#e8c84a', '#3fa34a'].map((c, i) => (
					<B key={c} size={[0.7, 0.14, 0.9]} pos={[1.6, 3.22 + i * 0.15, -0.6]} rot={[0, i * 0.2, 0]} color={c} />
				))}
				{/* desk lamp (practical) */}
				<group position={[-2.1, 3.15, -0.6]}>
					<B size={[0.6, 0.12, 0.6]} pos={[0, 0.06, 0]} color="#2a2a2a" />
					<B size={[0.1, 1.4, 0.1]} pos={[0, 0.8, 0]} rot={[0, 0, 0.3]} color="#2a2a2a" />
					<Cyl r={0.45} r2={0.15} h={0.5} seg={6} pos={[0.35, 1.5, 0.1]} rot={[0.4, 0, -0.6]} color="#f2c84a" glow={0.6} />
					<pointLight position={[0.6, 1.1, 0.5]} color="#ffc278" intensity={5} distance={8} decay={1.5} />
				</group>
			</group>
			{/* bed */}
			<group position={[-5.6, 0, -1.6]}>
				<B size={[3.4, 1.2, 6]} pos={[0, 0.6, 0]} color="#6a4528" />
				<B size={[3.2, 0.5, 5.8]} pos={[0, 1.45, 0]} color="#f0e8d8" />
				<B size={[3.3, 0.3, 4]} pos={[0, 1.8, 0.9]} mat={M.quilt} />
				<B size={[2, 0.5, 1]} pos={[0, 1.95, -2.2]} color="#f8f4ea" />
				<B size={[3.4, 2.6, 0.3]} pos={[0, 1.3, -3.0]} color="#6a4528" />
			</group>
			{/* shelf with boxes */}
			<group position={[-7.8, 6.2, 1.5]}>
				<B size={[0.6, 0.15, 3.2]} color="#7a5232" />
				{['#e04848', '#4870e0', '#e8c84a'].map((c, i) => (
					<B key={c} size={[0.5, 0.9, 0.25]} pos={[0, 0.5, -1 + i * 0.35]} color={c} />
				))}
				<B size={[0.5, 0.6, 0.6]} pos={[0, 0.38, 0.8]} rot={[0, 0.3, 0]} color="#c8c0ae" />
			</group>
			{/* rug, beanbag, pizza box, soda can, controller */}
			<mesh rotation={[-PI / 2, 0, 0]} position={[0.5, 0.01, 0.6]} material={M.rug} receiveShadow>
				<planeGeometry args={[6, 4.4]} />
			</mesh>
			<group position={[1.4, 0, 1.6]}>
				<mesh position={[0, 0.7, 0]} scale={[1.6, 0.75, 1.5]} castShadow receiveShadow>
					<icosahedronGeometry args={[1, 0]} />
					<meshLambertMaterial color="#2fa39a" flatShading />
				</mesh>
			</group>
			<group position={[3.9, 0.08, 1.8]} rotation={[0, 0.4, 0]}>
				<B size={[1.6, 0.16, 1.6]} color="#d8c49a" />
				<B size={[0.5, 0.02, 0.5]} pos={[0.3, 0.09, 0.2]} color="#c45a3a" />
			</group>
			<Cyl r={0.15} h={0.42} seg={6} pos={[-2.2, 0.21, 2.6]} color="#e04848" />
			<Controller pos={[-0.8, 0.09, 2.3]} rot={[0, 0.5, 0]} />
		</>
	);
};

// Low-poly showcase props for rule one.
export const LowPolyProps: React.FC<{frame: number}> = ({frame}) => (
	<group>
		<mesh position={[-4.2, 1.1, -1]} rotation={[0.3, frame * 0.02, 0]} castShadow>
			<icosahedronGeometry args={[1.1, 0]} />
			<meshLambertMaterial color="#9a948a" flatShading />
		</mesh>
		<group position={[4.4, 0, -1.5]}>
			<Cyl r={0.22} h={1.2} pos={[0, 0.6, 0]} color="#6a4528" />
			<mesh position={[0, 2.3, 0]} castShadow>
				<coneGeometry args={[1.2, 2.4, 6]} />
				<meshLambertMaterial color="#3a8a3a" flatShading />
			</mesh>
			<mesh position={[0, 3.4, 0]} castShadow>
				<coneGeometry args={[0.9, 1.8, 6]} />
				<meshLambertMaterial color="#4aa04a" flatShading />
			</mesh>
		</group>
		<mesh position={[3.4, 0.6, 2]} castShadow>
			<octahedronGeometry args={[0.6, 0]} />
			<meshLambertMaterial color="#e8c84a" flatShading emissive="#6a5010" />
		</mesh>
	</group>
);
