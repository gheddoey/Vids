import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

// Low-poly style test: a sunset city street. Faceted, flat-shaded geometry, bold gradient sky,
// neon accents, long shadows. All original designs.

type V3 = [number, number, number];
const PI = Math.PI;

const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
// Hash a position so shared vertices move together (keeps faceted meshes watertight).
const h3 = (x: number, y: number, z: number) => {
	const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
	return s - Math.floor(s);
};
const jitter = (g: THREE.BufferGeometry, amt: number, yOnly = false) => {
	const p = g.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < p.count; i++) {
		const x = p.getX(i);
		const y = p.getY(i);
		const z = p.getZ(i);
		const k = (o: number) => (h3(x + o, y - o, z + o * 2) - 0.5) * 2 * amt;
		if (yOnly) p.setY(i, y + k(1));
		else p.setXYZ(i, x + k(1), y + k(2), z + k(3));
	}
	g.computeVertexNormals();
	return g;
};

const M = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({color, flatShading: true, roughness: 0.85, ...extra});
const Glow = (color: string, i = 2.5) => new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: i, toneMapped: false});

// ---------- sky dome with vertex-colour gradient + sun ----------
export const Sky: React.FC = () => {
	const {scene} = useThree();
	useMemo(() => {
		scene.background = new THREE.Color('#2a1640');
		scene.fog = new THREE.Fog('#ff8a6a', 60, 230);
	}, [scene]);
	const geo = useMemo(() => {
		const g = new THREE.SphereGeometry(400, 24, 16);
		const c = new Float32Array(g.attributes.position.count * 3);
		const stops: [number, THREE.Color][] = [
			[-0.1, new THREE.Color('#ff9a5a')],
			[0.02, new THREE.Color('#ff7a6a')],
			[0.12, new THREE.Color('#d9508a')],
			[0.3, new THREE.Color('#6a3a9a')],
			[0.7, new THREE.Color('#24164a')],
		];
		for (let i = 0; i < g.attributes.position.count; i++) {
			const y = g.attributes.position.getY(i) / 400;
			let col = stops[stops.length - 1][1];
			for (let s = 0; s < stops.length - 1; s++) {
				if (y >= stops[s][0] && y < stops[s + 1][0]) {
					col = stops[s][1].clone().lerp(stops[s + 1][1], (y - stops[s][0]) / (stops[s + 1][0] - stops[s][0]));
					break;
				}
				if (y < stops[0][0]) col = stops[0][1];
			}
			c.set([col.r, col.g, col.b], i * 3);
		}
		g.setAttribute('color', new THREE.BufferAttribute(c, 3));
		return g;
	}, []);
	return (
		<group>
			<mesh geometry={geo}>
				<meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
			</mesh>
			{/* low-poly sun with bands */}
			<mesh position={[0, 34, -330]}>
				<circleGeometry args={[46, 9]} />
				<meshBasicMaterial color="#ffd36a" fog={false} toneMapped={false} />
			</mesh>
			{[0, 1, 2, 3].map((i) => (
				<mesh key={i} position={[0, 20 - i * 7, -329]}>
					<planeGeometry args={[100, 2 + i * 1.2]} />
					<meshBasicMaterial color="#ff7a6a" fog={false} />
				</mesh>
			))}
		</group>
	);
};

// ---------- terrain pieces ----------
export const Mountains: React.FC = () => {
	const items = useMemo(() => {
		const r = rnd(5);
		return Array.from({length: 14}, (_, i) => ({x: (i < 7 ? -1 : 1) * (55 + (i % 7) * 30 + r() * 12), z: -210 - r() * 60, h: 40 + r() * 70, w: 40 + r() * 30, col: ['#5a3a7a', '#6a3a80', '#4a2e6a', '#7a4a8a'][i % 4], seg: 5 + Math.floor(r() * 3)}));
	}, []);
	return (
		<group>
			{items.map((m, i) => {
				const g = jitter(new THREE.ConeGeometry(m.w, m.h, m.seg, 2), 4);
				return <mesh key={i} geometry={g} material={M(m.col)} position={[m.x, m.h / 2 - 2, m.z]} />;
			})}
		</group>
	);
};

export const Ground: React.FC = () => {
	const g = useMemo(() => {
		const geo = new THREE.PlaneGeometry(420, 420, 36, 36);
		geo.rotateX(-PI / 2);
		const p = geo.attributes.position;
		for (let i = 0; i < p.count; i++) {
			const x = p.getX(i);
			const z = p.getZ(i);
			const far = Math.max(0, Math.abs(x) - 40) / 60;
			p.setY(i, (h3(x, 0, z) - 0.5) * 1.2 + Math.min(1, far) * h3(z, x, 1) * 9);
		}
		geo.computeVertexNormals();
		return geo;
	}, []);
	return <mesh geometry={g} material={M('#8a5a6a')} position={[0, -0.6, -60]} receiveShadow />;
};

// ---------- props ----------
const Palm: React.FC<{p: V3; h?: number; lean?: number; s?: number}> = ({p, h = 9, lean = 0.12, s = 1}) => {
	const segs = 6;
	return (
		<group position={p} rotation={[0, 0, lean]} scale={s}>
			{Array.from({length: segs}).map((_, i) => (
				<mesh key={i} position={[Math.sin(i * 0.45) * 0.25, (i + 0.5) * (h / segs), 0]} material={M(i % 2 ? '#8a5a3a' : '#6a4228')} castShadow>
					<cylinderGeometry args={[0.32 - i * 0.025, 0.4 - i * 0.025, h / segs, 5]} />
				</mesh>
			))}
			{Array.from({length: 7}).map((_, i) => (
				<group key={i} position={[Math.sin(segs * 0.45) * 0.25, h, 0]} rotation={[0, (i / 7) * PI * 2, 0]}>
					<mesh position={[1.9, -0.5, 0]} rotation={[0, 0, -0.45]} material={M(i % 2 ? '#2e8a5a' : '#3aa060')} castShadow>
						<coneGeometry args={[0.7, 4.4, 3]} />
					</mesh>
				</group>
			))}
		</group>
	);
};

const Building: React.FC<{p: V3; w: number; d: number; h: number; col: string; seed: number; neon?: string; roof?: 'flat' | 'pyramid' | 'tank'}> = ({p, w, d, h, col, seed, neon, roof = 'flat'}) => {
	const r = rnd(seed);
	const rows = Math.max(2, Math.floor(h / 3));
	const cols = Math.max(2, Math.floor(w / 2.4));
	return (
		<group position={p}>
			<mesh position={[0, h / 2, 0]} material={M(col)} castShadow receiveShadow>
				<boxGeometry args={[w, h, d]} />
			</mesh>
			<mesh position={[0, h + 0.3, 0]} material={M('#3a2a4a')}>
				<boxGeometry args={[w + 0.6, 0.6, d + 0.6]} />
			</mesh>
			{roof === 'pyramid' ? (
				<mesh position={[0, h + 2.6, 0]} rotation={[0, PI / 4, 0]} material={M('#4a3a5a')}>
					<coneGeometry args={[Math.min(w, d) * 0.6, 4.4, 4]} />
				</mesh>
			) : null}
			{roof === 'tank' ? (
				<group position={[w * 0.2, h + 0.6, 0]}>
					<mesh position={[0, 1.6, 0]} material={M('#6a4a3a')}>
						<cylinderGeometry args={[1.2, 1.2, 2.4, 6]} />
					</mesh>
					<mesh position={[0, 3.2, 0]} material={M('#4a3a2a')}>
						<coneGeometry args={[1.4, 1, 6]} />
					</mesh>
				</group>
			) : null}
			{/* windows on the street side (+x faces) */}
			{[1, -1].map((side) =>
				Array.from({length: rows}).map((_, i) =>
					Array.from({length: cols}).map((_, j) => {
						const lit = r() < 0.55;
						return (
							<mesh key={`${side}-${i}-${j}`} position={[side * (w / 2 + 0.02), 2 + i * ((h - 3) / rows), -d / 2 + (j + 0.5) * (d / cols)]} material={lit ? Glow(['#ffd27a', '#ffb070', '#9ae0ff'][j % 3], 1.6) : M('#2a2238')}>
								<boxGeometry args={[0.06, 1.3, (d / cols) * 0.55]} />
							</mesh>
						);
					}),
				),
			)}
			{neon ? (
				<mesh position={[-w / 2 - 0.1, h * 0.55, 0]} material={Glow(neon, 3)}>
					<boxGeometry args={[0.2, 0.35, d * 0.8]} />
				</mesh>
			) : null}
		</group>
	);
};

const Car: React.FC<{p: V3; rot?: number; col: string; cop?: boolean; f: number}> = ({p, rot = 0, col, cop, f}) => {
	const cabin = useMemo(() => {
		const g = new THREE.CylinderGeometry(1.0, 1.45, 1.1, 4, 1);
		g.rotateY(PI / 4);
		g.scale(1.3, 1, 0.82);
		return g;
	}, []);
	const on = Math.floor(f / 4) % 2;
	return (
		<group position={p} rotation={[0, rot, 0]}>
			<mesh position={[0, 0.9, 0]} material={M(cop ? '#f2f2f2' : col, {roughness: 0.4})} castShadow>
				<boxGeometry args={[4.6, 0.9, 2.1]} />
			</mesh>
			<mesh position={[-0.3, 1.9, 0]} geometry={cabin} material={M(cop ? '#1a1a22' : col, {roughness: 0.4})} castShadow />
			<mesh position={[-0.3, 1.92, 0]} scale={[1.02, 0.7, 1.04]} geometry={cabin} material={M('#2a3a5a', {roughness: 0.1, metalness: 0.3})} />
			{cop ? (
				<>
					<mesh position={[0, 0.92, 0]} material={M('#1a1a22')}>
						<boxGeometry args={[1.8, 0.92, 2.12]} />
					</mesh>
					<mesh position={[-0.3, 2.55, -0.4]} material={Glow('#ff2a3a', on ? 6 : 0.3)}>
						<boxGeometry args={[0.4, 0.22, 0.7]} />
					</mesh>
					<mesh position={[-0.3, 2.55, 0.4]} material={Glow('#2a6aff', on ? 0.3 : 6)}>
						<boxGeometry args={[0.4, 0.22, 0.7]} />
					</mesh>
					<pointLight position={[-0.3, 3.2, on ? -1 : 1]} color={on ? '#ff2a3a' : '#2a6aff'} intensity={30} distance={12} />
				</>
			) : null}
			{[
				[1.5, 1],
				[-1.5, 1],
				[1.5, -1],
				[-1.5, -1],
			].map(([x, z], i) => (
				<mesh key={i} position={[x, 0.5, z * 1.0]} rotation={[PI / 2, 0, 0]} material={M('#1a1a1e')}>
					<cylinderGeometry args={[0.5, 0.5, 0.4, 7]} />
				</mesh>
			))}
			{[-0.65, 0.65].map((z) => (
				<React.Fragment key={z}>
					<mesh position={[2.31, 1.0, z]} material={Glow('#fff2c0', 3)}>
						<boxGeometry args={[0.05, 0.25, 0.4]} />
					</mesh>
					<mesh position={[-2.31, 1.0, z]} material={Glow('#ff3030', 2)}>
						<boxGeometry args={[0.05, 0.22, 0.4]} />
					</mesh>
				</React.Fragment>
			))}
		</group>
	);
};

// Original low-poly character: faceted head, hoodie, cap.
const Dude: React.FC<{p: V3; rot?: number; f: number; hoodie?: string; cap?: string; skin?: string}> = ({p, rot = 0, f, hoodie = '#2ea0a0', cap = '#ff5a6a', skin = '#c98a62'}) => {
	const head = useMemo(() => jitter(new THREE.IcosahedronGeometry(0.62, 0), 0.04), []);
	const sw = Math.sin(f * 0.25) * 0.5;
	const limb = (pos: V3, rx: number, col: string, len: number, w: number) => (
		<group position={pos} rotation={[rx, 0, 0]}>
			<mesh position={[0, -len / 2, 0]} material={M(col)} castShadow>
				<cylinderGeometry args={[w, w * 0.85, len, 5]} />
			</mesh>
		</group>
	);
	return (
		<group position={p} rotation={[0, rot, 0]}>
			{limb([-0.32, 1.9, 0], sw, '#2a3a5a', 1.9, 0.26)}
			{limb([0.32, 1.9, 0], -sw, '#2a3a5a', 1.9, 0.26)}
			<mesh position={[-0.32, 0.12 + 0, Math.sin(sw) * 0.9 + 0.15]} material={M('#f2f2f2')}>
				<boxGeometry args={[0.45, 0.3, 0.8]} />
			</mesh>
			<mesh position={[0.32, 0.12, -Math.sin(sw) * 0.9 + 0.15]} material={M('#f2f2f2')}>
				<boxGeometry args={[0.45, 0.3, 0.8]} />
			</mesh>
			<mesh position={[0, 2.85, 0]} material={M(hoodie)} castShadow>
				<cylinderGeometry args={[0.62, 0.72, 2.0, 6]} />
			</mesh>
			<mesh position={[0, 3.75, -0.35]} material={M(hoodie)}>
				<sphereGeometry args={[0.55, 6, 4]} />
			</mesh>
			{limb([-0.85, 3.6, 0], -sw * 0.8, hoodie, 1.8, 0.2)}
			{limb([0.85, 3.6, 0], sw * 0.8, hoodie, 1.8, 0.2)}
			<mesh position={[0, 4.35, 0]} geometry={head} material={M(skin)} castShadow />
			<mesh position={[0, 4.75, 0]} material={M(cap)}>
				<cylinderGeometry args={[0.62, 0.66, 0.4, 7]} />
			</mesh>
			<mesh position={[0, 4.6, 0.55]} material={M(cap)}>
				<boxGeometry args={[0.9, 0.08, 0.6]} />
			</mesh>
			{[-0.22, 0.22].map((x) => (
				<mesh key={x} position={[x, 4.42, 0.56]} material={M('#1a1a1a')}>
					<boxGeometry args={[0.12, 0.16, 0.05]} />
				</mesh>
			))}
		</group>
	);
};

const Lamp: React.FC<{p: V3; rot?: number}> = ({p, rot = 0}) => (
	<group position={p} rotation={[0, rot, 0]}>
		<mesh position={[0, 4, 0]} material={M('#2a2438')}>
			<cylinderGeometry args={[0.12, 0.18, 8, 5]} />
		</mesh>
		<mesh position={[0.9, 7.9, 0]} rotation={[0, 0, PI / 2]} material={M('#2a2438')}>
			<cylinderGeometry args={[0.1, 0.1, 1.8, 4]} />
		</mesh>
		<mesh position={[1.7, 7.7, 0]} material={Glow('#ffcf80', 4)}>
			<coneGeometry args={[0.45, 0.5, 5]} />
		</mesh>
		<pointLight position={[1.7, 7, 0]} color="#ffb870" intensity={40} distance={16} />
	</group>
);

const Rock: React.FC<{p: V3; s: number; col?: string; seed?: number}> = ({p, s, col = '#7a5a7a', seed = 1}) => {
	const g = useMemo(() => jitter(new THREE.DodecahedronGeometry(1, 0), 0.18 + (seed % 3) * 0.02), [seed]);
	return <mesh geometry={g} material={M(col)} position={p} scale={[s * 1.3, s * 0.8, s]} castShadow />;
};

export const Street: React.FC<{f: number}> = ({f}) => {
	const blocks = useMemo(() => {
		const r = rnd(21);
		const cols = ['#e86a7a', '#f2a65a', '#5ab0c8', '#8a6ad0', '#f2d06a', '#5ac08a', '#e88ab0'];
		const out: {x: number; z: number; w: number; d: number; h: number; col: string; neon?: string; roof: 'flat' | 'pyramid' | 'tank'}[] = [];
		for (const side of [-1, 1])
			for (let i = 0; i < 9; i++)
				out.push({x: side * (15 + r() * 3), z: 10 - i * 16, w: 10 + r() * 4, d: 12 + r() * 2, h: 10 + r() * (i > 4 ? 38 : 22), col: cols[Math.floor(r() * cols.length)], neon: r() < 0.5 ? ['#ff4fd8', '#2ae6ff', '#ffe04a'][i % 3] : undefined, roof: r() < 0.25 ? 'pyramid' : r() < 0.35 ? 'tank' : 'flat'});
		return out;
	}, []);
	return (
		<group>
			{/* road + sidewalks */}
			<mesh position={[0, 0.01, -50]} rotation={[-PI / 2, 0, 0]} material={M('#3a3048')} receiveShadow>
				<planeGeometry args={[16, 200]} />
			</mesh>
			{Array.from({length: 22}).map((_, i) => (
				<mesh key={i} position={[0, 0.03, 10 - i * 8]} rotation={[-PI / 2, 0, 0]} material={M('#ffd36a')}>
					<planeGeometry args={[0.35, 3.2]} />
				</mesh>
			))}
			{[-1, 1].map((s) => (
				<mesh key={s} position={[s * 9.5, 0.2, -50]} material={M('#b88a9a')} receiveShadow>
					<boxGeometry args={[3, 0.4, 200]} />
				</mesh>
			))}
			{blocks.map((b, i) => (
				<Building key={i} p={[b.x * (b.x < 0 ? 1 : 1) + (b.x > 0 ? b.w / 2 - 5 : -b.w / 2 + 5), 0, b.z]} w={b.w} d={b.d} h={b.h} col={b.col} seed={i + 3} neon={b.neon} roof={b.roof} />
			))}
			{[6, -14, -34, -54].map((z, i) => (
				<React.Fragment key={z}>
					<Palm p={[-9.6, 0.4, z]} h={9 + (i % 2) * 2} lean={0.1} />
					<Palm p={[9.6, 0.4, z - 8]} h={10 - (i % 2)} lean={-0.12} />
				</React.Fragment>
			))}
			{[0, -24, -48].map((z) => (
				<React.Fragment key={z}>
					<Lamp p={[-8.6, 0.4, z - 4]} />
					<Lamp p={[8.6, 0.4, z - 16]} rot={PI} />
				</React.Fragment>
			))}
			{/* hydrant, bins, rocks */}
			<mesh position={[-8.8, 0.9, 1.2]} material={M('#e84a4a')}>
				<cylinderGeometry args={[0.3, 0.36, 1.0, 6]} />
			</mesh>
			<Rock p={[-11, 0.6, 14]} s={1.2} seed={2} />
			<Rock p={[12, 0.5, 12]} s={0.9} seed={5} col="#9a6a7a" />
			{/* traffic */}
			<Car p={[3.4, 0, -8 - ((f * 0.35) % 40)]} rot={PI / 2} col="#ff5a6a" f={f} />
			<Car p={[-3.4, 0, -60 + ((f * 0.5) % 70)]} rot={-PI / 2} col="#ffd36a" f={f} />
			<Car p={[3.4, 0, -40]} rot={PI / 2} col="#fff" cop f={f} />
			{/* giant neon billboard */}
			<group position={[-13, 22, -30]} rotation={[0, 0.5, 0]}>
				<mesh material={M('#2a1e3a')}>
					<boxGeometry args={[0.6, 7, 14]} />
				</mesh>
				<mesh position={[0.35, 0, 0]} material={Glow('#ff4fd8', 2.2)}>
					<boxGeometry args={[0.1, 5.6, 12.6]} />
				</mesh>
				<mesh position={[0.45, 0, 0]} material={Glow('#2ae6ff', 3)}>
					<boxGeometry args={[0.1, 2.2, 8]} />
				</mesh>
				<pointLight position={[3, 0, 0]} color="#ff4fd8" intensity={60} distance={30} />
			</group>
		</group>
	);
};

const Shot: React.FC<{f: number; dur: number}> = ({f, dur}) => {
	const {camera} = useThree();
	const t = Easing.inOut(Easing.sin)(interpolate(f, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	camera.position.set(interpolate(t, [0, 1], [4.5, -2.5]), interpolate(t, [0, 1], [2.2, 5.5]), interpolate(t, [0, 1], [26, 17]));
	camera.lookAt(0, interpolate(t, [0, 1], [5.5, 7]), -40);
	(camera as THREE.PerspectiveCamera).fov = 50;
	(camera as THREE.PerspectiveCamera).far = 1000;
	camera.updateProjectionMatrix();
	return null;
};

export const LOWPOLY_FRAMES = 120;
export const LowPolyTest: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#2a1640'}}>
			<ThreeCanvas width={1080} height={1920} shadows gl={{toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05}}>
				<Shot f={f} dur={LOWPOLY_FRAMES} />
				<Sky />
				<hemisphereLight args={['#ffb0c8', '#3a2a5a', 0.9]} />
				<directionalLight position={[10, 18, -60]} color="#ffb070" intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-camera-far={160} shadow-bias={-0.0005} />
				<directionalLight position={[-20, 12, 30]} color="#7a8aff" intensity={0.9} />
				<Ground />
				<Mountains />
				<Street f={f} />
				<Dude p={[-2.2, 0, 7 - f * 0.04]} rot={PI} f={f} />
				<Dude p={[7.6, 0.4, 6]} rot={-PI / 2 - 0.3} f={0} hoodie="#ffb04a" cap="#2a6aff" skin="#e8b890" />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
