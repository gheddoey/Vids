import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RBox, shade} from '../parts';
import {BlockText} from '../BlockText';
import {Fence} from '../Props';
import {Canvas2D, PI, font} from '../lebron/common';
import {Shadowed} from '../lebron/sets';

const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// ---------- Shared bits ----------

// Sets the scene background (and optional fog) directly on the scene.
export const Sky: React.FC<{color: string; fog?: [number, number]}> = ({color, fog}) => {
	const scene = useThree((st) => st.scene);
	scene.background = new THREE.Color(color);
	scene.fog = fog ? new THREE.Fog(color, fog[0], fog[1]) : null;
	return null;
}

// 1 foot in world units, so a 0.95-scale adult reads exactly 5'7" on the height chart.
export const FOOT = (5.4 * 0.95) / (5 + 7 / 12);

const Plant: React.FC<{pos: [number, number, number]; h?: number}> = ({pos, h = 1.6}) => (
	<group position={pos}>
		<RBox size={[0.9, 0.8, 0.9]} pos={[0, 0.4, 0]} color="#b5653a" />
		{[0, 1, 2, 3, 4].map((i) => (
			<RBox key={i} size={[0.25, h * (0.7 + (i % 3) * 0.15), 0.12]} pos={[Math.sin(i * 1.3) * 0.2, 0.8 + h * 0.4, Math.cos(i * 1.3) * 0.2]} rot={[Math.sin(i) * 0.4, i * 1.2, Math.cos(i * 2) * 0.35]} color={i % 2 ? '#3f8a3a' : '#4f9c45'} />
		))}
	</group>
);

const Frame: React.FC<{pos: [number, number, number]; w: number; h: number; inner: string; children?: React.ReactNode; rot?: [number, number, number]}> = ({pos, w, h, inner, children, rot}) => (
	<group position={pos} rotation={rot}>
		<RBox size={[w, h, 0.12]} color="#5a3a24" />
		<RBox size={[w - 0.24, h - 0.24, 0.13]} color={inner} />
		<group position={[0, 0, 0.1]}>{children}</group>
	</group>
);

// Instanced crowd: thousands of blocky fans for very little cost.
export const Crowd: React.FC<{rows?: number; cols?: number; z0?: number; colors: string[]; width?: number; bounce?: number; frame?: number; rise?: number}> = ({
	rows = 8,
	cols = 34,
	z0 = -16,
	colors,
	width = 70,
	bounce = 0,
	frame = 0,
	rise = 1.7,
}) => {
	const body = useRef<THREE.InstancedMesh>(null);
	const head = useRef<THREE.InstancedMesh>(null);
	const n = rows * cols;
	const data = useMemo(() => {
		const r = rnd(9);
		return Array.from({length: n}, (_, i) => ({
			x: -width / 2 + (i % cols) * (width / cols) + (Math.floor(i / cols) % 2) * 0.9,
			y: 1.2 + Math.floor(i / cols) * rise,
			z: z0 - Math.floor(i / cols) * 1.9,
			c: colors[Math.floor(r() * colors.length)],
			s: r() * 6,
			h: 0.9 + r() * 0.3,
			skin: ['#e8c29c', '#c99a76', '#8a5a3c', '#f0d0b0'][Math.floor(r() * 4)],
		}));
	}, [n, cols, width, z0, colors, rise]);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		const c = new THREE.Color();
		data.forEach((p, i) => {
			const jump = bounce ? Math.max(0, Math.sin(frame * 0.5 + p.s)) * bounce : 0;
			m.makeScale(1, p.h, 1).setPosition(p.x, p.y + 0.55 * p.h + jump, p.z);
			body.current!.setMatrixAt(i, m);
			body.current!.setColorAt(i, c.set(p.c));
			m.makeScale(1, 1, 1).setPosition(p.x, p.y + 1.45 * p.h + jump, p.z);
			head.current!.setMatrixAt(i, m);
			head.current!.setColorAt(i, c.set(p.skin));
		});
		body.current!.instanceMatrix.needsUpdate = true;
		head.current!.instanceMatrix.needsUpdate = true;
		if (body.current!.instanceColor) body.current!.instanceColor.needsUpdate = true;
		if (head.current!.instanceColor) head.current!.instanceColor.needsUpdate = true;
	}, [data, bounce, frame]);
	return (
		<group>
			<instancedMesh ref={body} args={[undefined, undefined, n]}>
				<boxGeometry args={[1.3, 1.1, 0.8]} />
				<meshStandardMaterial roughness={0.9} />
			</instancedMesh>
			<instancedMesh ref={head} args={[undefined, undefined, n]}>
				<boxGeometry args={[0.66, 0.66, 0.66]} />
				<meshStandardMaterial roughness={0.9} />
			</instancedMesh>
			{Array.from({length: rows}, (_, r) => (
				<RBox key={r} size={[width + 4, 1.7, 2]} pos={[0, 0.4 + r * rise, z0 - r * 1.9]} color="#24262c" />
			))}
		</group>
	);
};

// ---------- 1. Doctor's office (with the height chart) ----------

export const DoctorOffice: React.FC<{marker: number; warm?: number}> = ({marker, warm = 0}) => (
	<group>
		<Sky color={'#cfe6d8'} />
		<hemisphereLight args={['#f2fff8', '#6a7a6a', 0.75 + warm * 0.2]} />
		{/* Afternoon sun through the blinds: striped light across the room */}
		<Shadowed pos={[-18, 10, 6]} color="#ffe2b0" intensity={2.6 + warm} size={12} />
		<pointLight position={[0, 9, 2]} intensity={28} color="#f4fff8" distance={20} decay={2} />
		<directionalLight position={[2, 6, 16]} intensity={0.7} color="#fff6ea" />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[30, 30]} />
			<meshStandardMaterial color="#c9c2b0" roughness={0.8} />
		</mesh>
		{Array.from({length: 12}, (_, i) => (
			<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[-11 + i * 2, 0.005, 0]}>
				<planeGeometry args={[0.03, 30]} />
				<meshStandardMaterial color="#b0a896" />
			</mesh>
		))}
		<RBox size={[24, 11, 0.4]} pos={[0, 5.5, -3]} color="#a8d4c0" />
		<RBox size={[24, 1.2, 0.5]} pos={[0, 0.6, -2.95]} color="#7fb8a2" />
		<RBox size={[0.4, 11, 14]} pos={[-6.5, 5.5, 3]} color="#9cccb6" />
		{/* Window with blinds (they cast the striped light) */}
		<group position={[-6.3, 5.4, 0.6]}>
			<RBox size={[0.2, 4.6, 3.8]} color="#ffffff" />
			<mesh position={[0.12, 0, 0]} rotation={[0, PI / 2, 0]}>
				<planeGeometry args={[3.4, 4.2]} />
				<meshStandardMaterial color="#e8f6ff" emissive="#dff2ff" emissiveIntensity={0.9} />
			</mesh>
			{Array.from({length: 11}, (_, i) => (
				<RBox key={i} size={[0.35, 0.12, 3.5]} pos={[0.3, -2 + i * 0.4, 0]} rot={[0, 0, 0.5]} color="#f2f2ee" />
			))}
		</group>
		{/* Height chart */}
		<group position={[0, 0, -2.72]}>
			<RBox size={[1.6, 7.0, 0.12]} pos={[0, 3.6, 0]} color="#e8c48a" />
			{Array.from({length: 15}, (_, i) => {
				const y = (i * FOOT) / 2;
				const major = i % 2 === 0;
				return <RBox key={i} size={[major ? 0.9 : 0.45, 0.05, 0.06]} pos={[major ? -0.3 : -0.52, y, 0.08]} color="#3a2a1a" />;
			})}
			{[3, 4, 5, 6].map((ft) => (
				<BlockText key={ft} text={`${ft}'`} size={0.26} depth={0.05} color="#3a2a1a" position={[0.42, ft * FOOT, 0.1]} />
			))}
			<RBox size={[0.35, 0.05, 0.06]} pos={[0.45, (5 + 7 / 12) * FOOT, 0.08]} color="#c0392b" />
			{/* Sliding marker tab */}
			<group position={[0, marker, 0.18]}>
				<RBox size={[2.1, 0.12, 0.3]} color="#c0392b" />
				<RBox size={[0.24, 0.3, 0.32]} pos={[1.05, 0, 0]} color="#a02a1e" />
			</group>
		</group>
		{/* Diplomas */}
		<Frame pos={[-3.2, 6.2, -2.76]} w={2} h={1.5} inner="#f6f0dc">
			<RBox size={[1.2, 0.08, 0.02]} pos={[0, 0.3, 0]} color="#3a3a3a" />
			<RBox size={[0.9, 0.06, 0.02]} pos={[0, 0.05, 0]} color="#8a8a8a" />
			<mesh position={[0.45, -0.35, 0]}>
				<circleGeometry args={[0.18, 12]} />
				<meshStandardMaterial color="#c0392b" />
			</mesh>
		</Frame>
		<Frame pos={[3.2, 6.6, -2.76]} w={1.6} h={1.2} inner="#f6f0dc">
			<RBox size={[1.0, 0.07, 0.02]} pos={[0, 0.2, 0]} color="#3a3a3a" />
			<RBox size={[0.7, 0.05, 0.02]} pos={[0, -0.05, 0]} color="#8a8a8a" />
		</Frame>
		{/* Exam bed with paper roll */}
		<group position={[-4, 0, -1.2]}>
			<RBox size={[2.4, 2.0, 4.4]} pos={[0, 1.0, 0]} color="#5a7a8a" />
			<RBox size={[2.2, 0.3, 4.2]} pos={[0, 2.15, 0]} color="#3a5260" />
			<RBox size={[1.3, 0.04, 4.3]} pos={[0, 2.32, 0]} color="#fbfbf6" />
			<mesh position={[0, 2.45, -2.1]} rotation={[0, 0, PI / 2]}>
				<cylinderGeometry args={[0.22, 0.22, 1.4, 12]} />
				<meshStandardMaterial color="#fbfbf6" />
			</mesh>
		</group>
		<DoctorDesk />
		<Plant pos={[5.0, 0, -2.0]} h={2.2} />
	</group>
);

// Desk with the X-ray lightbox and a 3D bar chart of heights (Leo's bar short and red).
export const DoctorDesk: React.FC<{pulse?: number}> = ({pulse = 0}) => (
	<group position={[3.4, 0, 0.4]}>
		<RBox size={[4.2, 0.2, 2.4]} pos={[0, 2.4, 0]} color="#8a6440" />
		<RBox size={[0.2, 2.3, 2.2]} pos={[-1.9, 1.15, 0]} color="#7a5634" />
		<RBox size={[1.3, 2.3, 2.2]} pos={[1.35, 1.15, 0]} color="#7a5634" />
		{[0.5, 1.2, 1.9].map((y) => (
			<RBox key={y} size={[1.1, 0.04, 0.02]} pos={[1.35, y, 1.11]} color="#5a3a20" />
		))}
		{/* Lightbox with a hand X-ray, the bones built as raised blocks */}
		<group position={[-0.9, 3.55, -0.9]}>
			<RBox size={[1.9, 1.9, 0.2]} color="#dcdcdc" />
			<RBox size={[1.7, 1.7, 0.06]} pos={[0, 0, 0.1]} color="#1a2a3a" emissive="#0a1a2a" />
			<pointLight position={[0, 0, 0.6]} intensity={4} color="#bfe6ff" distance={3} decay={2} />
			{(() => {
				const bone = '#dff2ff';
				const glow = '#5a8aa8';
				const parts: [number, number, number, number, number][] = [
					[0, -0.42, 0.62, 0.5, 0],
					[-0.27, 0.0, 0.13, 0.38, 0.05],
					[-0.09, 0.08, 0.13, 0.42, 0],
					[0.09, 0.06, 0.13, 0.42, 0],
					[0.27, 0.0, 0.13, 0.36, -0.05],
					[-0.3, 0.45, 0.11, 0.3, 0.06],
					[-0.1, 0.52, 0.11, 0.32, 0],
					[0.1, 0.5, 0.11, 0.32, 0],
					[0.29, 0.43, 0.11, 0.28, -0.06],
					[0.47, -0.18, 0.14, 0.34, -0.6],
					[0.62, 0.05, 0.11, 0.26, -0.5],
				];
				return parts.map(([x, y, w, h, r], k) => <RBox key={k} size={[w, h, 0.06]} pos={[x, y, 0.15]} rot={[0, 0, r]} color={bone} emissive={glow} />);
			})()}
		</group>
		{/* Bar chart of heights: four tall bars and Leo's short red one */}
		<group position={[0.4, 2.5, 0.3]}>
			<RBox size={[2.6, 0.08, 1.0]} color="#f2f2ee" />
			{[1.1, 1.3, 1.0, 1.2].map((h, i) => (
				<RBox key={i} size={[0.36, h, 0.36]} pos={[-1.0 + i * 0.46, h / 2 + 0.04, 0]} color="#4a7ab0" />
			))}
			<RBox size={[0.36, 0.42 + pulse * 0.05, 0.36]} pos={[0.85, 0.25, 0]} color="#d0352a" emissive="#5a0a06" />
		</group>
		{/* Lollipop jar, clipboard, pen */}
		<group position={[-1.5, 2.5, 0.6]}>
			<mesh position={[0, 0.4, 0]}>
				<cylinderGeometry args={[0.32, 0.32, 0.8, 14, 1, true]} />
				<meshStandardMaterial color="#e6f4ff" transparent opacity={0.35} side={THREE.DoubleSide} />
			</mesh>
			{['#e84a5f', '#f6c445', '#4ac0e8', '#7ad86a'].map((c, i) => (
				<group key={c} position={[Math.sin(i * 1.6) * 0.14, 0.75, Math.cos(i * 1.6) * 0.14]} rotation={[Math.sin(i) * 0.3, 0, Math.cos(i) * 0.3]}>
					<mesh position={[0, 0.25, 0]}>
						<sphereGeometry args={[0.12, 10, 8]} />
						<meshStandardMaterial color={c} roughness={0.2} />
					</mesh>
					<mesh>
						<cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
						<meshStandardMaterial color="#ffffff" />
					</mesh>
				</group>
			))}
		</group>
		<RBox size={[0.9, 0.05, 1.2]} pos={[1.0, 2.53, 0.6]} rot={[0, 0.3, 0]} color="#a8723e" />
		<RBox size={[0.75, 0.02, 1.0]} pos={[1.0, 2.56, 0.62]} rot={[0, 0.3, 0]} color="#fbfbf6" />
		<RBox size={[0.6, 0.06, 0.06]} pos={[0.9, 2.6, 0.9]} rot={[0, 0.9, 0]} color="#2f6fd0" />
	</group>
);

// ---------- 2. Neighbourhood pitch ----------

export const NeighbourhoodPitch: React.FC = () => {
	const r = rnd(4);
	const houses = ['#e8c38a', '#d98a6a', '#a8c8d8', '#e6e0c8', '#c8a0c8', '#f0d070'];
	return (
		<group>
			<Sky color={'#f2c48a'} fog={[40, 110]} />
			<hemisphereLight args={['#ffe6c0', '#5a6a3a', 0.65]} />
			<Shadowed pos={[-20, 9, 14]} color="#ffc070" intensity={2.6} size={20} />
			<directionalLight position={[3, 6, 20]} intensity={0.8} color="#ffe0c0" />
			<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[160, 160]} />
				<meshStandardMaterial color="#8aa055" roughness={1} />
			</mesh>
			{/* Bald dirt patches */}
			{Array.from({length: 14}, (_, i) => (
				<mesh key={i} rotation={[-PI / 2, 0, r() * 3]} position={[(r() - 0.5) * 30, 0.01, (r() - 0.5) * 16]} receiveShadow>
					<circleGeometry args={[1 + r() * 2.2, 7]} />
					<meshStandardMaterial color="#b38a5a" roughness={1} />
				</mesh>
			))}
			{/* Small goal behind */}
			<group position={[0, 0, -9]}>
				<RBox size={[0.25, 4, 0.25]} pos={[-4, 2, 0]} color="#f4f4f0" />
				<RBox size={[0.25, 4, 0.25]} pos={[4, 2, 0]} color="#f4f4f0" />
				<RBox size={[8.25, 0.25, 0.25]} pos={[0, 4, 0]} color="#f4f4f0" />
				<mesh position={[0, 2, -1.2]}>
					<boxGeometry args={[8, 4, 2.4, 16, 8, 4]} />
					<meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.5} />
				</mesh>
			</group>
			{/* Painted wall with a mural stripe */}
			<RBox size={[60, 4, 0.6]} pos={[0, 2, -14]} color="#e8e0d0" />
			{['#2e7dd8', '#f4f4f0', '#2e7dd8'].map((c, i) => (
				<RBox key={i} size={[60, 0.5, 0.62]} pos={[0, 2.6 - i * 0.5, -14]} color={c} />
			))}
			<Fence z={-12.5} from={-30} to={30} />
			{/* Low houses with flat roofs and water tanks */}
			{Array.from({length: 9}, (_, i) => {
				const h = 5 + (i % 3) * 1.6;
				return (
					<group key={i} position={[-32 + i * 8, 0, -20 - (i % 2) * 2]}>
						<RBox size={[7.4, h, 6]} pos={[0, h / 2, 0]} color={houses[i % houses.length]} />
						<RBox size={[7.6, 0.4, 6.2]} pos={[0, h, 0]} color={shade(houses[i % houses.length], -0.12)} />
						<RBox size={[1.6, 1.4, 1.6]} pos={[1.8, h + 0.9, 0]} color="#2a3a5a" />
						<RBox size={[1.4, 1.6, 0.1]} pos={[-1.6, h * 0.45, 3.01]} color="#4a6a8a" />
						<RBox size={[1.6, 2.6, 0.1]} pos={[1.6, 1.3, 3.01]} color={shade(houses[i % houses.length], -0.3)} />
					</group>
				);
			})}
			{/* Laundry line */}
			<mesh position={[-8, 6.4, -16]} rotation={[0, 0, PI / 2]}>
				<cylinderGeometry args={[0.02, 0.02, 12, 4]} />
				<meshStandardMaterial color="#444444" />
			</mesh>
			{['#e84a5f', '#f6f6f2', '#4a8ad8', '#f6c445', '#7ad86a'].map((c, i) => (
				<RBox key={c} size={[1.1, 1.3, 0.04]} pos={[-12.5 + i * 2.2, 5.75, -16]} rot={[0, 0, (i % 2 ? 0.05 : -0.04)]} color={c} />
			))}
		</group>
	);
};

// ---------- 4/6. Kitchen at night ----------

// Checked tablecloth made of thin tiles (not a printed texture).
const ClothCheck: React.FC<{w: number; d: number; c?: string}> = ({w, d, c = '#d84a3a'}) => {
	const n = 10;
	const m = Math.round((d / w) * n);
	const sw = w / n;
	const sd = d / m;
	return (
		<group>
			<RBox size={[w, 0.03, d]} color="#f6f2ea" />
			{Array.from({length: n * m}, (_, k) => {
				const i = k % n;
				const j = Math.floor(k / n);
				if ((i + j) % 2) return null;
				return <RBox key={k} size={[sw, 0.035, sd]} pos={[-w / 2 + sw * (i + 0.5), 0.003, -d / 2 + sd * (j + 0.5)]} color={c} />;
			})}
		</group>
	);
};

export const Kitchen: React.FC<{lamp?: number; tag?: boolean; coins?: number}> = ({lamp = 1, tag, coins = 0}) => (
	<group>
		<Sky color={'#141826'} />
		<hemisphereLight args={['#8a90b8', '#3a2a22', 0.45]} />
		<pointLight position={[0, 6.4, 0.4]} intensity={70 * lamp} color="#ffc07a" distance={16} decay={2} castShadow shadow-mapSize={[1024, 1024]} />
		<directionalLight position={[2, 5, 14]} intensity={0.55} color="#ffd8a8" />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[30, 30]} />
			<meshStandardMaterial color="#8a6a4e" roughness={0.9} />
		</mesh>
		<RBox size={[20, 10, 0.4]} pos={[0, 5, -3.5]} color="#e8d08a" />
		{/* Tiled backsplash */}
		{Array.from({length: 40}, (_, i) => (
			<RBox key={i} size={[0.9, 0.9, 0.06]} pos={[-4.5 + (i % 10) * 1.0, 3.2 + Math.floor(i / 10) * 1.0, -3.28]} color={(i + Math.floor(i / 10)) % 2 ? '#f2ecde' : '#cfe0e8'} />
		))}
		{/* Counter, stove, fridge with magnets */}
		<RBox size={[10, 2.6, 1.6]} pos={[0, 1.3, -2.6]} color="#7a5a40" />
		<RBox size={[10, 0.2, 1.7]} pos={[0, 2.7, -2.6]} color="#d8d0c0" />
		{[-1.2, 0.2].map((x) => (
			<mesh key={x} position={[x, 2.82, -2.6]}>
				<cylinderGeometry args={[0.4, 0.4, 0.05, 16]} />
				<meshStandardMaterial color="#2a2a2a" />
			</mesh>
		))}
		<group position={[6.2, 0, -2.4]}>
			<RBox size={[2.2, 6, 2]} pos={[0, 3, 0]} color="#e8eef2" rough={0.3} />
			<RBox size={[0.1, 1.6, 0.1]} pos={[-0.9, 4.2, 1.02]} color="#9aa0a8" />
			{['#e84a5f', '#f6c445', '#4ac0e8'].map((c, i) => (
				<RBox key={c} size={[0.3, 0.3, 0.06]} pos={[0.2 + i * 0.4, 4.8 - i * 0.5, 1.02]} color={c} />
			))}
			<RBox size={[0.8, 1.0, 0.03]} pos={[0.3, 3.2, 1.02]} color="#fbfbf6" />
		</group>
		{/* Night window */}
		<group position={[-6.5, 5.2, -3.28]}>
			<RBox size={[3.0, 2.6, 0.1]} color="#5a3a24" />
			<mesh position={[0, 0, 0.06]}>
				<planeGeometry args={[2.6, 2.2]} />
				<meshStandardMaterial color="#1e2a4e" emissive="#2a3a6a" emissiveIntensity={0.7} />
			</mesh>
		</group>
		{/* Pendant lamp */}
		<group position={[0, 7.6, 0.4]}>
			<mesh>
				<cylinderGeometry args={[0.02, 0.02, 2, 6]} />
				<meshStandardMaterial color="#222" />
			</mesh>
			<mesh position={[0, -1.1, 0]}>
				<coneGeometry args={[0.8, 0.6, 14, 1, true]} />
				<meshStandardMaterial color="#2e5a4a" side={THREE.DoubleSide} />
			</mesh>
			<mesh position={[0, -1.25, 0]}>
				<sphereGeometry args={[0.18, 10, 8]} />
				<meshStandardMaterial color="#fff0c8" emissive="#ffc070" emissiveIntensity={3 * lamp} />
			</mesh>
		</group>
		{/* Table with checked cloth */}
		<group position={[0, 0, 0.4]}>
			<RBox size={[5.0, 0.2, 3.0]} pos={[0, 2.2, 0]} color="#6a4a30" />
			{[-2.2, 2.2].map((x) => [-1.2, 1.2].map((z) => <RBox key={`${x}${z}`} size={[0.2, 2.2, 0.2]} pos={[x, 1.1, z]} color="#5a3a24" />))}
			<group position={[0, 2.31, 0]}>
				<ClothCheck w={4.4} d={2.6} />
			</group>
			{/* Medicine box with a hanging price tag */}
			<group position={[-0.6, 2.32, 0.1]}>
				<RBox size={[1.0, 0.7, 0.6]} pos={[0, 0.35, 0]} color="#f6f6f2" />
				<RBox size={[1.0, 0.18, 0.61]} pos={[0, 0.5, 0]} color="#2a7ad0" />
				<RBox size={[0.18, 0.4, 0.62]} pos={[-0.25, 0.35, 0]} color="#d83a3a" />
				<RBox size={[0.4, 0.14, 0.63]} pos={[-0.25, 0.35, 0]} color="#d83a3a" />
				{tag ? (
					<group position={[0.9, 1.0, 0.3]} rotation={[0, -0.25, -0.12]}>
						<mesh position={[-0.6, 0.1, 0]} rotation={[0, 0, PI / 2 - 0.35]}>
							<cylinderGeometry args={[0.012, 0.012, 0.6, 4]} />
							<meshStandardMaterial color="#8a6a3a" />
						</mesh>
						<RBox size={[1.8, 0.9, 0.08]} color="#f2e2a8" />
						<BlockText text="$1,000" size={0.32} depth={0.06} color="#c0392b" position={[0, 0.12, 0.08]} />
						<BlockText text="/ MONTH" size={0.16} depth={0.04} color="#3a2a1a" position={[0, -0.24, 0.08]} />
					</group>
				) : null}
			</group>
			{/* Bills, calculator, piggy bank, mate */}
			{[0, 1, 2, 3].map((i) => (
				<RBox key={i} size={[1.0, 0.02, 0.7]} pos={[1.2, 2.33 + i * 0.025, -0.4]} rot={[0, i * 0.08 - 0.1, 0]} color={i % 2 ? '#fbfbf6' : '#e8f0f8'} />
			))}
			<group position={[1.4, 2.33, 0.5]} rotation={[0, -0.3, 0]}>
				<RBox size={[0.5, 0.08, 0.7]} color="#2a2a2e" />
				<RBox size={[0.4, 0.02, 0.16]} pos={[0, 0.05, -0.2]} color="#a8c8a0" />
			</group>
			<group position={[-1.8, 2.32, -0.5]}>
				<RBox size={[0.8, 0.6, 0.55]} pos={[0, 0.35, 0]} color="#f2a0b8" />
				<RBox size={[0.2, 0.2, 0.15]} pos={[0.45, 0.35, 0]} color="#e888a8" />
				{[-0.25, 0.25].map((x) => (
					<RBox key={x} size={[0.1, 0.12, 0.1]} pos={[x, 0.02, 0.15]} color="#e888a8" />
				))}
				<RBox size={[0.3, 0.03, 0.05]} pos={[0, 0.66, 0]} color="#3a2a2a" />
			</group>
			<group position={[0.4, 2.32, -0.8]}>
				<mesh position={[0, 0.25, 0]}>
					<sphereGeometry args={[0.25, 10, 8]} />
					<meshStandardMaterial color="#6a4a2a" roughness={0.7} />
				</mesh>
				<mesh position={[0.06, 0.55, 0]} rotation={[0, 0, -0.2]}>
					<cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
					<meshStandardMaterial color="#c8ccd2" metalness={0.7} roughness={0.3} />
				</mesh>
			</group>
			{/* A small pile of coins */}
			{Array.from({length: coins}, (_, i) => (
				<mesh key={i} position={[0.3 + (i % 3) * 0.08, 2.34 + Math.floor(i / 3) * 0.035, 0.6 + (i % 2) * 0.05]}>
					<cylinderGeometry args={[0.09, 0.09, 0.03, 12]} />
					<meshStandardMaterial color={i % 2 ? '#c8a040' : '#b8b8c0'} metalness={0.7} roughness={0.3} />
				</mesh>
			))}
		</group>
		{/* Chairs */}
		{[-1.4, 1.4].map((x) => (
			<group key={x} position={[x, 0, 2.6]}>
				<RBox size={[1.3, 0.14, 1.2]} pos={[0, 1.4, 0]} color="#8a6a4a" />
				<RBox size={[1.3, 1.6, 0.14]} pos={[0, 2.2, 0.55]} color="#8a6a4a" />
				{[-0.5, 0.5].map((xx) => [-0.45, 0.45].map((zz) => <RBox key={`${xx}${zz}`} size={[0.1, 1.4, 0.1]} pos={[xx, 0.7, zz]} color="#6a4a32" />))}
			</group>
		))}
	</group>
);

// ---------- 5. Steel mill ----------

export const SteelMill: React.FC<{frame: number}> = ({frame}) => {
	const sparks = useMemo(() => {
		const r = rnd(21);
		return Array.from({length: 46}, () => ({vx: (r() - 0.3) * 0.35, vy: 0.2 + r() * 0.25, vz: (r() - 0.5) * 0.2, t0: r() * 24}));
	}, []);
	return (
		<group>
			<Sky color={'#0c0a0c'} fog={[14, 46]} />
			<hemisphereLight args={['#7a8aa8', '#2a1a14', 0.35]} />
			{/* Furnace glow is the key light */}
			<pointLight position={[-3.5, 3.5, -2]} intensity={260} color="#ff7a20" distance={30} decay={2} castShadow shadow-mapSize={[1024, 1024]} />
			<directionalLight position={[10, 10, 8]} intensity={0.8} color="#8ab0e0" />
			<directionalLight position={[2, 5, 16]} intensity={0.55} color="#ffc8a0" />
			<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[60, 60]} />
				<meshStandardMaterial color="#3a3a3e" roughness={0.6} metalness={0.4} />
			</mesh>
			{Array.from({length: 10}, (_, i) => (
				<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[-15 + i * 3, 0.01, 0]}>
					<planeGeometry args={[0.04, 40]} />
					<meshStandardMaterial color="#26262a" />
				</mesh>
			))}
			{/* Furnace */}
			<group position={[-4.5, 0, -4]}>
				<RBox size={[5, 7, 3]} pos={[0, 3.5, 0]} color="#3a3236" />
				<RBox size={[3, 2.2, 0.2]} pos={[0, 2.4, 1.5]} color="#ff8a2a" emissive="#ff5a00" />
				<RBox size={[2.6, 1.8, 0.24]} pos={[0, 2.4, 1.52]} color="#ffd080" emissive="#ffa040" />
				<RBox size={[5.4, 0.4, 3.4]} pos={[0, 7.2, 0]} color="#2a2428" />
				<mesh position={[1.2, 10, 0]}>
					<cylinderGeometry args={[0.6, 0.7, 6, 10]} />
					<meshStandardMaterial color="#2a2428" />
				</mesh>
			</group>
			{/* Conveyor with glowing bars */}
			<group position={[2, 0, -2.2]}>
				<RBox size={[12, 1.4, 1.6]} pos={[0, 0.7, 0]} color="#2a2a2e" />
				{Array.from({length: 6}, (_, i) => {
					const x = ((i * 2.2 + frame * 0.05) % 13) - 6.5;
					return <RBox key={i} size={[1.6, 0.3, 0.6]} pos={[x, 1.55, 0]} color="#ff9a3a" emissive="#ff6a10" />;
				})}
			</group>
			{/* Girders and hanging chains */}
			{[-9, -3, 3, 9].map((x) => (
				<group key={x}>
					<RBox size={[0.6, 14, 0.6]} pos={[x, 7, -7]} color="#4a4a52" />
					<RBox size={[0.6, 14, 0.6]} pos={[x, 7, 5]} color="#4a4a52" />
				</group>
			))}
			<RBox size={[20, 0.7, 0.6]} pos={[0, 12, -7]} color="#4a4a52" />
			<RBox size={[0.6, 0.7, 12]} pos={[-3, 12, -1]} color="#4a4a52" />
			{[1.5, 4.5].map((x) =>
				Array.from({length: 10}, (_, j) => <RBox key={`${x}${j}`} size={[0.16, 0.36, 0.16]} pos={[x, 11.6 - j * 0.38, 0.5]} rot={[0, j % 2 ? 0 : PI / 2, 0]} color="#6a6a72" />),
			)}
			{/* Sparks spraying from the furnace mouth */}
			{sparks.map((s, i) => {
				const t = (frame + s.t0) % 24;
				return (
					<mesh key={i} position={[-4.5 + 1.2 + s.vx * t * 3, 2.4 + s.vy * t - 0.012 * t * t, -2.3 + s.vz * t * 3]}>
						<boxGeometry args={[0.06, 0.06, 0.06]} />
						<meshStandardMaterial color="#ffd27a" emissive="#ffb040" emissiveIntensity={3} />
					</mesh>
				);
			})}
		</group>
	);
};

// ---------- 7/8. Leo's bedroom ----------

export const Bedroom: React.FC<{moon: 'full' | 'half' | 'crescent'; clock: string; lamp?: number}> = ({moon, clock, lamp = 1}) => (
	<group>
		<Sky color={'#0c1022'} />
		<hemisphereLight args={['#8a98d8', '#3a3040', 0.85]} />
		{/* Moonlight */}
		<Shadowed pos={[-12, 10, 8]} color="#9fb4ff" intensity={1.3} size={10} />
		{/* Small warm bedside lamp */}
		<pointLight position={[2.4, 3.6, -0.6]} intensity={48 * lamp} color="#ffc27a" distance={14} decay={2} />
		<directionalLight position={[2, 5, 14]} intensity={0.9} color="#c8d0ff" />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[30, 30]} />
			<meshStandardMaterial color="#6a5040" roughness={0.9} />
		</mesh>
		<RBox size={[20, 10, 0.4]} pos={[0, 5, -3]} color="#3a5a8a" />
		<RBox size={[0.4, 10, 14]} pos={[-6, 5, 3]} color="#35527e" />
		{/* Window with the moon */}
		<group position={[-5.78, 5.6, 0.6]} rotation={[0, PI / 2, 0]}>
			<RBox size={[3.0, 3.0, 0.1]} color="#e8e2d0" />
			<mesh position={[0, 0, 0.06]}>
				<planeGeometry args={[2.6, 2.6]} />
				<meshStandardMaterial color="#131a3a" emissive="#1a2450" emissiveIntensity={0.6} />
			</mesh>
			<group position={[0.4, 0.4, 0.08]}>
				<mesh>
					<circleGeometry args={[0.45, 24]} />
					<meshStandardMaterial color="#f6f0d8" emissive="#f6f0d8" emissiveIntensity={1.2} />
				</mesh>
				{moon !== 'full' ? (
					<mesh position={[moon === 'half' ? 0.45 : 0.22, 0.04, 0.01]}>
						<circleGeometry args={[0.47, 24]} />
						<meshStandardMaterial color="#131a3a" />
					</mesh>
				) : null}
			</group>
			{[[-0.8, -0.7], [0.9, -0.5], [-0.3, 0.9], [-1.0, 0.3]].map(([x, y]) => (
				<mesh key={`${x}${y}`} position={[x, y, 0.08]}>
					<planeGeometry args={[0.06, 0.06]} />
					<meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
				</mesh>
			))}
			<RBox size={[0.1, 2.6, 0.12]} pos={[0, 0, 0.08]} color="#e8e2d0" />
		</group>
		{/* Framed posters, built in 3D: a ball and a boot */}
		<Frame pos={[-2.2, 6.2, -2.76]} w={2.2} h={2.8} inner="#c8102e">
			<group position={[0, 0.2, 0.2]}>
				<SoccerBall r={0.55} spin={0.4} />
			</group>
			<RBox size={[1.5, 0.3, 0.05]} pos={[0, -0.85, 0.05]} color="#161616" />
		</Frame>
		<Frame pos={[1.2, 6.4, -2.76]} w={2.2} h={1.8} inner="#7cc3ee">
			<RBox size={[1.2, 0.45, 0.2]} pos={[0, -0.05, 0.08]} color="#161616" />
			<RBox size={[0.5, 0.35, 0.2]} pos={[-0.35, 0.3, 0.08]} color="#161616" />
			{[-0.4, 0, 0.4].map((x) => (
				<RBox key={x} size={[0.08, 0.14, 0.1]} pos={[x, -0.32, 0.12]} color="#f6f6f2" />
			))}
		</Frame>
		{/* Shelf with little trophies */}
		<RBox size={[3.4, 0.16, 0.8]} pos={[4.0, 5.2, -2.5]} color="#8a6440" />
		{[3.0, 3.8, 4.6].map((x, i) => (
			<group key={x} position={[x, 5.3, -2.5]}>
				<RBox size={[0.4, 0.2, 0.4]} pos={[0, 0.1, 0]} color="#3a2a1a" />
				<mesh position={[0, 0.5 + i * 0.05, 0]}>
					<cylinderGeometry args={[0.18, 0.08, 0.5 + i * 0.1, 10]} />
					<meshStandardMaterial color="#e2b84a" metalness={0.8} roughness={0.25} />
				</mesh>
			</group>
		))}
		{/* Bed with a striped blanket */}
		<group position={[-0.6, 0, -0.4]}>
			<RBox size={[5.4, 1.2, 3.0]} pos={[0, 0.6, 0]} color="#5a4030" />
			<RBox size={[5.2, 0.5, 2.8]} pos={[0, 1.45, 0]} color="#ecece6" />
			{[0, 1, 2, 3, 4, 5].map((i) => (
				<RBox key={i} size={[0.5, 0.36, 2.9]} pos={[-0.3 + i * 0.5, 1.75, 0]} color={i % 2 ? '#c8102e' : '#1a1a1a'} />
			))}
			<RBox size={[1.1, 0.4, 2.0]} pos={[-2.1, 1.9, 0]} color="#fafaf6" />
			<RBox size={[0.3, 2.6, 3.0]} pos={[-2.75, 1.3, 0]} color="#5a4030" />
		</group>
		{/* Nightstand, lamp and alarm clock */}
		<group position={[2.6, 0, -1.4]}>
			<RBox size={[1.4, 1.8, 1.2]} pos={[0, 0.9, 0]} color="#6a4a30" />
			<RBox size={[0.3, 0.8, 0.3]} pos={[-0.3, 2.2, 0]} color="#3a3a3a" />
			<mesh position={[-0.3, 2.8, 0]}>
				<cylinderGeometry args={[0.3, 0.45, 0.5, 12, 1, true]} />
				<meshStandardMaterial color="#f2e2c0" emissive="#ffc27a" emissiveIntensity={lamp} side={THREE.DoubleSide} />
			</mesh>
			<group position={[0.35, 2.05, 0.25]}>
				<RBox size={[0.7, 0.45, 0.3]} color="#c8102e" />
				<BlockText text={clock} size={0.18} depth={0.03} color="#ff5040" emissive={1.2} position={[0, 0, 0.16]} />
			</group>
		</group>
		{/* Football on the floor */}
		<group position={[1.4, 0.35, 1.6]}>
			<SoccerBall r={0.35} spin={0.8} />
		</group>
	</group>
);

// The injection pen.
export const Pen: React.FC = () => (
	<group rotation={[0, 0, 0]}>
		<RBox size={[0.12, 0.6, 0.12]} color="#f6f6f2" />
		<RBox size={[0.13, 0.18, 0.13]} pos={[0, 0.3, 0]} color="#2a7ad0" />
		<RBox size={[0.04, 0.12, 0.04]} pos={[0, -0.36, 0]} color="#c8ccd2" />
	</group>
);

// ---------- 9. Club office and big-club boardroom ----------

export const Office: React.FC = () => (
	<group>
		<Sky color={'#d8dde2'} />
		<hemisphereLight args={['#f4f8ff', '#5a5a5a', 0.8]} />
		<pointLight position={[0, 8, 2]} intensity={60} color="#eef6ff" distance={20} decay={2} />
		<Shadowed pos={[8, 12, 10]} color="#f4f8ff" intensity={1.4} size={10} />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[30, 30]} />
			<meshStandardMaterial color="#6a6e78" roughness={0.9} />
		</mesh>
		<RBox size={[20, 10, 0.4]} pos={[0, 5, -3]} color="#d8d2c4" />
		{/* Fluorescent panel */}
		<RBox size={[4, 0.1, 1.2]} pos={[0, 8.6, 0]} color="#ffffff" emissive="#dfefff" />
		{/* Trophy shelf, pennant, filing cabinet */}
		<RBox size={[5, 0.16, 0.8]} pos={[-2.5, 5.4, -2.6]} color="#7a5634" />
		{[-4.2, -3.2, -2.2, -1.2].map((x, i) => (
			<mesh key={x} position={[x, 5.85, -2.6]}>
				<cylinderGeometry args={[0.2, 0.1, 0.7 + (i % 2) * 0.2, 10]} />
				<meshStandardMaterial color={i % 2 ? '#c0c4ca' : '#d8b04a'} metalness={0.8} roughness={0.25} />
			</mesh>
		))}
		<group position={[2.6, 6.2, -2.76]}>
			<mesh rotation={[0, 0, -PI / 2]}>
				<coneGeometry args={[0.7, 2.6, 3]} />
				<meshStandardMaterial color="#c8102e" />
			</mesh>
		</group>
		<RBox size={[1.6, 4, 1.4]} pos={[5, 2, -2.2]} color="#8a9098" />
		{[1, 2.3, 3.6].map((y) => (
			<RBox key={y} size={[0.6, 0.1, 0.05]} pos={[5, y, -1.48]} color="#5a6068" />
		))}
		{/* Desk with the folder */}
		<RBox size={[4.6, 0.2, 2.2]} pos={[0, 2.4, -0.6]} color="#5a4030" />
		<RBox size={[4.4, 2.3, 0.2]} pos={[0, 1.15, -1.6]} color="#4a3424" />
		<RBox size={[1.0, 0.5, 0.4]} pos={[-1.4, 2.75, -1.1]} color="#2a2a2e" />
		<RBox size={[0.9, 0.04, 1.2]} pos={[0.6, 2.53, -0.4]} color="#e8c84a" />
	</group>
);

export const Boardroom: React.FC = () => (
	<group>
		<Sky color={'#0a1224'} />
		<hemisphereLight args={['#9ab8ff', '#3a3a44', 0.85]} />
		<directionalLight position={[0, 10, -20]} intensity={1.8} color="#8ab4ff" />
		<directionalLight position={[2, 7, 18]} intensity={1.3} color="#eef2ff" />
		<pointLight position={[0, 8, 2]} intensity={30} color="#e8eeff" distance={18} decay={2} />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[40, 40]} />
			<meshStandardMaterial color="#2a2c34" roughness={0.4} metalness={0.2} />
		</mesh>
		{/* Glass wall looking onto a lit stadium */}
		<group position={[0, 0, -6]}>
			{[-9, -4.5, 0, 4.5, 9].map((x) => (
				<RBox key={x} size={[0.2, 12, 0.3]} pos={[x, 6, 0]} color="#1a1c22" />
			))}
			<mesh position={[0, 6, -0.1]}>
				<planeGeometry args={[20, 12]} />
				<meshStandardMaterial color="#9ac0ff" transparent opacity={0.12} />
			</mesh>
			<group position={[0, -3, -30]}>
				<mesh rotation={[-PI / 2, 0, 0]}>
					<planeGeometry args={[40, 24]} />
					<meshStandardMaterial color="#2f7a3a" emissive="#1a5a24" emissiveIntensity={0.5} />
				</mesh>
				{[-1, 1].map((s) => (
					<RBox key={s} size={[44, 8, 3]} pos={[0, 4, s * 14]} rot={[s * 0.4, 0, 0]} color="#3a2a4a" />
				))}
				{[-18, -6, 6, 18].map((x) => (
					<group key={x} position={[x, 14, -12]}>
						<RBox size={[3, 1.4, 0.3]} color="#ffffff" emissive="#ffffff" />
					</group>
				))}
			</group>
		</group>
		{/* Long table and chairs */}
		<RBox size={[12, 0.25, 3.2]} pos={[0, 2.4, -1.2]} color="#1c1a1a" rough={0.2} />
		{[-5, 5].map((x) => (
			<RBox key={x} size={[0.4, 2.3, 2.6]} pos={[x, 1.15, -1.2]} color="#141212" />
		))}
		{[-4, -1.5, 1, 3.5].map((x) => (
			<group key={x} position={[x, 0, -3.4]}>
				<RBox size={[1.4, 0.2, 1.3]} pos={[0, 1.5, 0]} color="#3a2a2a" />
				<RBox size={[1.4, 2.6, 0.2]} pos={[0, 2.8, -0.6]} color="#3a2a2a" />
			</group>
		))}
		<RBox size={[1.0, 0.06, 1.4]} pos={[0.5, 2.56, -0.6]} rot={[0, 0.2, 0]} color="#e8c84a" />
	</group>
);

// ---------- 10. Over the ocean ----------

export const Ocean: React.FC<{frame: number}> = ({frame}) => (
	<group>
		<Sky color={'#7cc4ee'} fog={[40, 160]} />
		<hemisphereLight args={['#ffffff', '#2a5a8a', 0.9]} />
		<Shadowed pos={[10, 20, 10]} color="#fff8e8" intensity={2.4} size={20} />
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, -8, 0]}>
			<planeGeometry args={[400, 400]} />
			<meshStandardMaterial color="#1f6aa8" roughness={0.3} metalness={0.2} />
		</mesh>
		{Array.from({length: 70}, (_, i) => {
			const r = rnd(i + 3);
			const x = (r() - 0.5) * 120 - ((frame * 0.25) % 8);
			return <RBox key={i} size={[2 + r() * 3, 0.15, 0.4]} pos={[x, -7.9 + Math.sin(frame * 0.2 + i) * 0.08, -10 - r() * 80]} color="#e8f6ff" />;
		})}
		{Array.from({length: 7}, (_, i) => {
			const r = rnd(i + 30);
			return (
				<group key={i} position={[(r() - 0.5) * 60 - frame * 0.08, 6 + r() * 10, -20 - r() * 40]}>
					<RBox size={[6, 1.6, 3]} color="#ffffff" />
					<RBox size={[3.4, 1.6, 2.6]} pos={[1, 1.1, 0]} color="#ffffff" />
				</group>
			);
		})}
	</group>
);

export const Plane: React.FC = () => (
	<group>
		<RBox size={[9, 1.6, 1.6]} color="#f6f6f2" rough={0.3} />
		<RBox size={[1.6, 1.0, 1.4]} pos={[4.6, 0.1, 0]} color="#f6f6f2" rough={0.3} />
		<RBox size={[1.4, 0.4, 1.5]} pos={[5.1, 0.35, 0]} color="#2a3a5a" />
		<RBox size={[2.6, 0.2, 9]} pos={[0.4, -0.2, 0]} color="#e8e8e4" />
		<RBox size={[1.4, 2.2, 0.2]} pos={[-4.2, 1.6, 0]} color="#2e6ad8" />
		<RBox size={[1.2, 0.18, 3.6]} pos={[-4.0, 0.4, 0]} color="#e8e8e4" />
		{[-2.6, -1.6, -0.6, 0.4, 1.4, 2.4, 3.4].map((x) => (
			<RBox key={x} size={[0.4, 0.4, 1.62]} pos={[x, 0.3, 0]} color="#2a3a5a" />
		))}
		<RBox size={[9.02, 0.18, 1.62]} pos={[0, -0.25, 0]} color="#2e6ad8" />
		{[-2.4, 2.4].map((z) => (
			<mesh key={z} position={[0.9, -0.7, z]} rotation={[0, 0, PI / 2]}>
				<cylinderGeometry args={[0.45, 0.45, 1.6, 12]} />
				<meshStandardMaterial color="#c8ccd2" metalness={0.5} roughness={0.3} />
			</mesh>
		))}
	</group>
);

// ---------- 10/11. Training ground in Spain ----------

const Palm: React.FC<{pos: [number, number, number]; h?: number}> = ({pos, h = 9}) => (
	<group position={pos}>
		{Array.from({length: 8}, (_, i) => (
			<mesh key={i} position={[Math.sin(i * 0.4) * 0.25, (i + 0.5) * (h / 8), 0]} castShadow>
				<cylinderGeometry args={[0.3 - i * 0.015, 0.34 - i * 0.015, h / 8, 7]} />
				<meshStandardMaterial color={i % 2 ? '#8a6a45' : '#7a5c3a'} roughness={1} flatShading />
			</mesh>
		))}
		{Array.from({length: 7}, (_, i) => (
			<group key={i} position={[0, h, 0]} rotation={[0, (i / 7) * PI * 2, 0]}>
				<RBox size={[0.7, 0.08, 3.2]} pos={[0, -0.5, 1.5]} rot={[0.45, 0, 0]} color={i % 2 ? '#3f8a3a' : '#4f9c45'} />
			</group>
		))}
	</group>
);

const Cone: React.FC<{pos: [number, number, number]}> = ({pos}) => (
	<group position={pos}>
		<mesh position={[0, 0.35, 0]} castShadow>
			<coneGeometry args={[0.3, 0.7, 8]} />
			<meshStandardMaterial color="#ff7a1a" />
		</mesh>
		<RBox size={[0.7, 0.06, 0.7]} pos={[0, 0.03, 0]} color="#ff7a1a" />
	</group>
);

export const TrainingGround: React.FC<{gate?: boolean}> = ({gate}) => (
	<group>
		<Sky color={'#8ccdf2'} fog={[50, 140]} />
		<hemisphereLight args={['#ffffff', '#5a7a3a', 0.8]} />
		<Shadowed pos={[14, 20, 12]} color="#fff2d8" intensity={2.6} size={22} />
		<directionalLight position={[0, 6, 20]} intensity={0.6} color="#fff6ea" />
		{Array.from({length: 12}, (_, i) => (
			<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[0, 0, -40 + i * 6]} receiveShadow>
				<planeGeometry args={[120, 6]} />
				<meshStandardMaterial color={i % 2 ? '#4f9a44' : '#58a64c'} roughness={0.9} />
			</mesh>
		))}
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.01, -4]}>
			<ringGeometry args={[5.8, 6.0, 48]} />
			<meshStandardMaterial color="#f4f4f0" />
		</mesh>
		{[[-3, 0, 2], [-1, 0, -1], [1, 0, 2.5], [3, 0, -0.5], [5, 0, 1.6], [-5, 0, -1.4]].map((p, i) => (
			<Cone key={i} pos={p as [number, number, number]} />
		))}
		{/* Mini goals */}
		{[-8, 8].map((x) => (
			<group key={x} position={[x, 0, -6]} rotation={[0, x > 0 ? -0.4 : 0.4, 0]}>
				<RBox size={[0.16, 2, 0.16]} pos={[-1.6, 1, 0]} color="#f4f4f0" />
				<RBox size={[0.16, 2, 0.16]} pos={[1.6, 1, 0]} color="#f4f4f0" />
				<RBox size={[3.36, 0.16, 0.16]} pos={[0, 2, 0]} color="#f4f4f0" />
				<mesh position={[0, 1, -0.6]}>
					<boxGeometry args={[3.2, 2, 1.2, 8, 5, 3]} />
					<meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.5} />
				</mesh>
			</group>
		))}
		{/* Bench and ball bag */}
		<group position={[-9, 0, 4]} rotation={[0, 0.6, 0]}>
			<RBox size={[5, 0.3, 1.2]} pos={[0, 1.4, 0]} color="#3a6ad8" />
			<RBox size={[5, 2, 0.2]} pos={[0, 2.4, -0.6]} color="#2a4aa8" />
			{[-2.2, 2.2].map((x) => (
				<RBox key={x} size={[0.2, 1.4, 1]} pos={[x, 0.7, 0]} color="#5a5e66" />
			))}
		</group>
		<group position={[7.5, 0, 4]}>
			{[[0, 0.4, 0], [0.7, 0.4, 0.2], [-0.6, 0.4, 0.3], [0.1, 1.05, 0.1], [0.3, 0.4, -0.6]].map(([x, y, z], i) => (
				<group key={i} position={[x, y, z]}>
					<SoccerBall r={0.35} spin={i * 1.3} />
				</group>
			))}
		</group>
		<Fence z={-14} from={-40} to={40} />
		{/* Terracotta-roofed buildings and palms */}
		{Array.from({length: 7}, (_, i) => (
			<group key={i} position={[-30 + i * 10, 0, -26]}>
				<RBox size={[8.6, 6 + (i % 2) * 2, 6]} pos={[0, 3 + (i % 2), 0]} color={i % 2 ? '#f2e6cc' : '#e8d8b8'} />
				<mesh position={[0, 6.6 + (i % 2) * 2, 0]} rotation={[0, PI / 4, 0]}>
					<coneGeometry args={[6.6, 2.2, 4]} />
					<meshStandardMaterial color="#c8582e" flatShading />
				</mesh>
				{[-2.4, 0, 2.4].map((x) => (
					<RBox key={x} size={[1.2, 1.6, 0.1]} pos={[x, 3.2, 3.01]} color="#3a6a8a" />
				))}
			</group>
		))}
		<Palm pos={[-14, 0, -18]} h={10} />
		<Palm pos={[12, 0, -19]} h={11} />
		<Palm pos={[22, 0, -12]} h={9} />
		{gate ? (
			<group position={[0, 0, -9]}>
				<RBox size={[0.8, 7, 0.8]} pos={[-5, 3.5, 0]} color="#8a2a3a" />
				<RBox size={[0.8, 7, 0.8]} pos={[5, 3.5, 0]} color="#8a2a3a" />
				<RBox size={[11.2, 1.6, 0.8]} pos={[0, 7.4, 0]} color="#1a3a8a" />
				<BlockText text="ACADEMY" size={0.8} depth={0.2} color="#f2c94c" position={[0, 7.4, 0.5]} />
			</group>
		) : null}
	</group>
);

// ---------- 12. Café terrace ----------

// Ink signature as a thin 3D stroke.
const Signature: React.FC = () => {
	const geo = useMemo(() => {
		const pts = [
			[-0.55, -0.35],
			[-0.4, -0.15],
			[-0.3, -0.42],
			[-0.15, -0.18],
			[0.0, -0.4],
			[0.15, -0.2],
			[0.3, -0.38],
			[0.5, -0.22],
		].map(([x, z]) => new THREE.Vector3(x, 0.03, -z));
		return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.018, 5, false);
	}, []);
	return (
		<mesh geometry={geo}>
			<meshStandardMaterial color="#1e3a8a" roughness={0.4} />
		</mesh>
	);
};

export const Cafe: React.FC<{signed: boolean}> = ({signed}) => (
	<group>
		<Sky color={'#f0b07a'} />
		<hemisphereLight args={['#ffe6c8', '#6a5040', 0.7]} />
		<Shadowed pos={[-16, 8, 10]} color="#ffb870" intensity={2.4} size={12} />
		<directionalLight position={[2, 6, 16]} intensity={0.7} color="#ffe2c4" />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[40, 40]} />
			<meshStandardMaterial color="#c8b8a0" roughness={0.9} />
		</mesh>
		{Array.from({length: 20}, (_, i) => (
			<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[-10 + i, 0.005, 0]}>
				<planeGeometry args={[0.03, 40]} />
				<meshStandardMaterial color="#a89880" />
			</mesh>
		))}
		{/* Facade with a striped awning */}
		<RBox size={[24, 11, 0.5]} pos={[0, 5.5, -4.5]} color="#f2e2c4" />
		{[-6, -2, 2, 6].map((x) => (
			<group key={x} position={[x, 3.4, -4.2]}>
				<RBox size={[2.6, 3.4, 0.12]} color="#5a3a24" />
				<mesh position={[0, 0, 0.07]}>
					<planeGeometry args={[2.2, 3.0]} />
					<meshStandardMaterial color="#3a2a1a" emissive="#ffb060" emissiveIntensity={0.4} />
				</mesh>
			</group>
		))}
		{Array.from({length: 12}, (_, i) => (
			<RBox key={i} size={[2, 0.2, 2.6]} pos={[-11 + i * 2, 7.2, -3.0]} rot={[0.35, 0, 0]} color={i % 2 ? '#c8102e' : '#f6f2ea'} />
		))}
		<Plant pos={[-7.5, 0, -2.5]} h={2.4} />
		<Plant pos={[7.5, 0, -2.5]} h={2.0} />
		{/* Round table */}
		<group position={[0, 0, 0]}>
			<mesh position={[0, 2.3, 0]} castShadow receiveShadow>
				<cylinderGeometry args={[1.8, 1.8, 0.16, 24]} />
				<meshStandardMaterial color="#f6f2ea" />
			</mesh>
			<mesh position={[0, 1.15, 0]}>
				<cylinderGeometry args={[0.12, 0.12, 2.3, 8]} />
				<meshStandardMaterial color="#2a2a2a" metalness={0.5} />
			</mesh>
			{/* Two coffees, sugar bowl, napkin holder */}
			{[-0.9, 0.9].map((x) => (
				<group key={x} position={[x, 2.38, -0.4]}>
					<mesh>
						<cylinderGeometry args={[0.32, 0.32, 0.03, 14]} />
						<meshStandardMaterial color="#ffffff" />
					</mesh>
					<mesh position={[0, 0.17, 0]}>
						<cylinderGeometry args={[0.18, 0.15, 0.3, 14]} />
						<meshStandardMaterial color="#ffffff" />
					</mesh>
					<mesh position={[0, 0.31, 0]} rotation={[-PI / 2, 0, 0]}>
						<circleGeometry args={[0.15, 14]} />
						<meshStandardMaterial color="#5a3018" />
					</mesh>
					<mesh position={[0.22, 0.18, 0]} rotation={[0, 0, PI / 2]}>
						<torusGeometry args={[0.08, 0.025, 6, 10, PI]} />
						<meshStandardMaterial color="#ffffff" />
					</mesh>
				</group>
			))}
			<mesh position={[0, 2.52, -0.9]}>
				<cylinderGeometry args={[0.2, 0.16, 0.3, 12]} />
				<meshStandardMaterial color="#d8e8f0" />
			</mesh>
			<group position={[0.6, 2.38, -1.0]}>
				<RBox size={[0.5, 0.06, 0.3]} color="#c8ccd2" />
				<RBox size={[0.42, 0.4, 0.04]} pos={[0, 0.2, 0]} color="#fbfbf6" />
			</group>
			{/* The napkin contract: a folded napkin with raised ink and a 3D signature */}
			<group position={[0, 2.39, 0.55]} rotation={[0, signed ? -0.15 : 0.1, 0]}>
				<RBox size={[1.5, 0.03, 1.5]} color="#fbfaf4" />
				<RBox size={[1.5, 0.006, 0.02]} pos={[0, 0.018, 0]} color="#e2ddcc" />
				<RBox size={[0.02, 0.006, 1.5]} pos={[0, 0.018, 0]} color="#e2ddcc" />
				<group rotation={[-PI / 2, 0, 0]} position={[0, 0.03, 0]}>
					<BlockText text="LEO WILL SIGN" size={0.11} depth={0.01} color="#1e3a8a" position={[-0.02, 0.48, 0]} />
					<BlockText text="FOR THE CLUB" size={0.11} depth={0.01} color="#1e3a8a" position={[-0.02, 0.3, 0]} />
					<BlockText text="DEC 2000" size={0.08} depth={0.01} color="#1e3a8a" position={[-0.28, 0.12, 0]} />
				</group>
				{signed ? <Signature /> : null}
			</group>
		</group>
		{[-2.6, 2.6].map((x) => (
			<group key={x} position={[x, 0, 0.6]} rotation={[0, x > 0 ? -PI / 2 : PI / 2, 0]}>
				<RBox size={[1.3, 0.14, 1.2]} pos={[0, 1.4, 0]} color="#2a2a2a" />
				<RBox size={[1.3, 1.6, 0.14]} pos={[0, 2.2, -0.55]} color="#2a2a2a" />
			</group>
		))}
	</group>
);

// ---------- Soccer pieces ----------

const LINE = '#f4f4f0';
const Line: React.FC<{x: number; z: number; w: number; d: number}> = ({x, z, w, d}) => (
	<mesh rotation={[-PI / 2, 0, 0]} position={[x, 0.012, z]}>
		<planeGeometry args={[w, d]} />
		<meshStandardMaterial color={LINE} roughness={0.9} />
	</mesh>
);

// Halfway line, centre circle and spot, penalty and six-yard boxes, penalty arc.
export const PitchMarkings: React.FC = () => (
	<group>
		<Line x={0} z={-2} w={64} d={0.25} />
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.012, -2]}>
			<ringGeometry args={[7.0, 7.25, 64]} />
			<meshStandardMaterial color={LINE} />
		</mesh>
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.013, -2]}>
			<circleGeometry args={[0.3, 16]} />
			<meshStandardMaterial color={LINE} />
		</mesh>
		{/* Side lines and goal line */}
		<Line x={-30} z={-19} w={0.25} d={70} />
		<Line x={30} z={-19} w={0.25} d={70} />
		<Line x={0} z={-36} w={60.25} d={0.25} />
		{/* Penalty box */}
		<Line x={0} z={-26} w={30} d={0.25} />
		<Line x={-15} z={-31} w={0.25} d={10} />
		<Line x={15} z={-31} w={0.25} d={10} />
		{/* Six-yard box */}
		<Line x={0} z={-32.6} w={12} d={0.25} />
		<Line x={-6} z={-34.3} w={0.25} d={3.4} />
		<Line x={6} z={-34.3} w={0.25} d={3.4} />
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.013, -28.5]}>
			<circleGeometry args={[0.25, 12]} />
			<meshStandardMaterial color={LINE} />
		</mesh>
		<mesh rotation={[-PI / 2, 0, PI]} position={[0, 0.012, -28.5]}>
			<ringGeometry args={[6.6, 6.85, 40, 1, PI * 0.25, PI * 0.5]} />
			<meshStandardMaterial color={LINE} />
		</mesh>
	</group>
);

export const Goal: React.FC<{z: number}> = ({z}) => (
	<group position={[0, 0, z]}>
		<RBox size={[0.3, 5, 0.3]} pos={[-7.3, 2.5, 0]} color="#f8f8f6" />
		<RBox size={[0.3, 5, 0.3]} pos={[7.3, 2.5, 0]} color="#f8f8f6" />
		<RBox size={[14.9, 0.3, 0.3]} pos={[0, 5, 0]} color="#f8f8f6" />
		<mesh position={[0, 2.5, -1.6]}>
			<boxGeometry args={[14.6, 5, 3.2, 28, 10, 6]} />
			<meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.45} />
		</mesh>
	</group>
);

const CornerFlag: React.FC<{pos: [number, number, number]}> = ({pos}) => (
	<group position={pos}>
		<mesh position={[0, 1.6, 0]}>
			<cylinderGeometry args={[0.05, 0.05, 3.2, 6]} />
			<meshStandardMaterial color="#f2f2f2" />
		</mesh>
		<RBox size={[0.04, 0.6, 0.9]} pos={[0, 2.9, 0.45]} color="#ff4a2a" />
	</group>
);

// A proper football: white with black pentagon panels at the 12 icosahedron points.
const ICO = (() => {
	const t = (1 + Math.sqrt(5)) / 2;
	const v = [
		[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
		[0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
		[t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
	];
	return v.map((p) => new THREE.Vector3(p[0], p[1], p[2]).normalize());
})();

export const SoccerBall: React.FC<{r?: number; spin?: number}> = ({r = 0.32, spin = 0}) => (
	<group rotation={[spin, spin * 0.7, 0]}>
		<mesh castShadow>
			<icosahedronGeometry args={[r, 2]} />
			<meshStandardMaterial color="#f8f8f6" roughness={0.5} flatShading />
		</mesh>
		{ICO.map((n, i) => {
			const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
			return (
				<mesh key={i} position={n.clone().multiplyScalar(r * 0.985)} quaternion={q}>
					<circleGeometry args={[r * 0.36, 5]} />
					<meshStandardMaterial color="#161616" roughness={0.5} side={THREE.DoubleSide} />
				</mesh>
			);
		})}
	</group>
);

// ---------- 13-20. Stadium at night (club, rain, final) ----------

export const Stadium: React.FC<{mode: 'club' | 'rain' | 'final' | 'sad'; frame: number; spot?: boolean}> = ({mode, frame, spot}) => {
	const dim = mode === 'rain' || mode === 'sad';
	const rain = useMemo(() => {
		const r = rnd(77);
		return Array.from({length: 160}, () => ({x: (r() - 0.5) * 24, z: (r() - 0.5) * 16 + 2, o: r() * 20}));
	}, []);
	const fireworks = useMemo(() => {
		const r = rnd(5);
		return Array.from({length: 5}, (_, i) => ({x: (r() - 0.5) * 40, y: 22 + r() * 8, z: -30 - r() * 10, t0: i * 7, c: ['#ffd84a', '#7cc3ee', '#ffffff', '#ffb81c', '#ff6a6a'][i]}));
	}, []);
	return (
		<group>
			<Sky color={dim ? '#070a12' : '#0b1430'} fog={[40, 120]} />
			<hemisphereLight args={[dim ? '#6a7a98' : '#c8d0ff', '#1a1410', dim ? 0.3 : 0.4]} />
			<Shadowed pos={[6, 30, 12]} color={dim ? '#b8c8e8' : '#fff2dc'} intensity={dim ? 1.2 : 2.6} size={22} far={90} />
			<directionalLight position={[0, 7, 22]} intensity={dim ? 0.45 : 0.9} color="#fff2e2" />
			<directionalLight position={[-18, 8, -10]} intensity={1.4} color={mode === 'club' ? '#a3123a' : '#7cc3ee'} />
			<directionalLight position={[18, 8, -10]} intensity={1.1} color={mode === 'club' ? '#2a5ad8' : mode === 'final' ? '#ffd27a' : '#6a8ab8'} />
			{spot ? <spotLight position={[0, 18, 4]} angle={0.22} penumbra={0.5} intensity={700} distance={50} decay={2} color="#fff4dc" castShadow /> : null}
			{/* The background is the pitch itself: stripes, full markings, a goal, corner flags */}
			{Array.from({length: 22}, (_, i) => (
				<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[0, 0, -86 + i * 6]} receiveShadow>
					<planeGeometry args={[140, 6]} />
					<meshStandardMaterial color={dim ? (i % 2 ? '#2f5a34' : '#355f3a') : i % 2 ? '#3f8a3e' : '#479644'} roughness={dim ? 0.3 : 0.85} metalness={dim ? 0.1 : 0} />
				</mesh>
			))}
			<PitchMarkings />
			<Goal z={-36} />
			{[-30, 30].map((x) => (
				<CornerFlag key={x} pos={[x, 0, -36]} />
			))}
			{/* Floodlight towers far behind the goal line */}
			{[-40, 40].map((x) => (
				<group key={x} position={[x, 0, -52]}>
					<RBox size={[1.2, 40, 1.2]} pos={[0, 20, 0]} color="#3a3a42" />
					<RBox size={[8, 4, 0.8]} pos={[0, 40, 0.8]} color="#ffffff" emissive="#ffffff" />
					{Array.from({length: 6}, (_, k) => (
						<RBox key={k} size={[1.1, 1.1, 0.2]} pos={[-3 + (k % 3) * 3, 39 + Math.floor(k / 3) * 2, 1.25]} color="#fffbe8" emissive="#fff4c8" />
					))}
				</group>
			))}
			{mode === 'rain'
				? rain.map((d, i) => {
						const y = 14 - ((frame * 0.9 + d.o) % 16);
						return (
							<mesh key={i} position={[d.x, y, d.z]}>
								<boxGeometry args={[0.025, 0.7, 0.025]} />
								<meshStandardMaterial color="#c8d8f0" transparent opacity={0.55} />
							</mesh>
						);
					})
				: null}
			{mode === 'final'
				? fireworks.map((fw, i) => {
						const t = (frame - fw.t0) % 34;
						if (t < 0 || t > 22) return null;
						const rad = t * 0.4;
						return (
							<group key={i} position={[fw.x, fw.y, fw.z]}>
								{Array.from({length: 14}, (_, k) => {
									const a = (k / 14) * PI * 2;
									return (
										<mesh key={k} position={[Math.cos(a) * rad, Math.sin(a) * rad - t * t * 0.01, 0]}>
											<boxGeometry args={[0.35, 0.35, 0.35]} />
											<meshStandardMaterial color={fw.c} emissive={fw.c} emissiveIntensity={2.5 * (1 - t / 22)} />
										</mesh>
									);
								})}
							</group>
						);
					})
				: null}
		</group>
	);
};

// A golden, blocky world-cup-style trophy.
export const Cup: React.FC<{shine?: number}> = ({shine = 0}) => {
	const gold = <meshStandardMaterial color="#e8b83a" metalness={0.85} roughness={0.2} emissive="#5a3a08" emissiveIntensity={0.3 + shine} />;
	return (
		<group>
			<mesh position={[0, 0.2, 0]}>
				<cylinderGeometry args={[0.55, 0.62, 0.4, 16]} />
				{gold}
			</mesh>
			{[0.48, 0.68].map((y) => (
				<mesh key={y} position={[0, y, 0]}>
					<cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
					<meshStandardMaterial color="#2a6a3a" roughness={0.4} />
				</mesh>
			))}
			<mesh position={[0, 0.58, 0]}>
				<cylinderGeometry args={[0.47, 0.47, 0.1, 16]} />
				{gold}
			</mesh>
			{[0, 1, 2].map((i) => (
				<mesh key={i} position={[Math.sin(i * 2.1) * 0.18, 1.35, Math.cos(i * 2.1) * 0.18]} rotation={[Math.cos(i * 2.1) * 0.25, 0, -Math.sin(i * 2.1) * 0.25]}>
					<cylinderGeometry args={[0.1, 0.18, 1.3, 8]} />
					{gold}
				</mesh>
			))}
			<mesh position={[0, 2.3, 0]}>
				<sphereGeometry args={[0.5, 16, 12]} />
				{gold}
			</mesh>
		</group>
	);
};

export const Medal: React.FC<{year?: string}> = ({year}) => (
	<group>
		<RBox size={[0.18, 1.2, 0.04]} pos={[-0.12, 0.6, 0]} rot={[0, 0, 0.18]} color="#7cc3ee" />
		<RBox size={[0.18, 1.2, 0.04]} pos={[0.12, 0.6, 0]} rot={[0, 0, -0.18]} color="#f6f6f2" />
		<mesh rotation={[PI / 2, 0, 0]}>
			<cylinderGeometry args={[0.42, 0.42, 0.1, 20]} />
			<meshStandardMaterial color="#c8ccd2" metalness={0.85} roughness={0.25} />
		</mesh>
		<mesh rotation={[PI / 2, 0, 0]} position={[0, 0, 0.03]}>
			<cylinderGeometry args={[0.3, 0.3, 0.06, 20]} />
			<meshStandardMaterial color="#a8acb4" metalness={0.85} roughness={0.3} />
		</mesh>
		{year ? <BlockText text={year} size={0.13} depth={0.03} color="#5a5e66" position={[0, 0, 0.08]} /> : null}
	</group>
);

// ---------- 17-19. Locker room ----------

export const LockerRoom: React.FC<{light: number; door: number; shirt: boolean; medals?: number}> = ({light, door, shirt, medals = 0}) => (
	<group>
		<Sky color={'#05060a'} />
		<hemisphereLight args={['#c8d8e8', '#2a2a2a', 0.15 + light * 0.4]} />
		<pointLight position={[0, 8, 1]} intensity={70 * light} color="#e8f4ff" distance={18} decay={2} castShadow shadow-mapSize={[1024, 1024]} />
		<directionalLight position={[2, 5, 14]} intensity={0.25 + light * 0.35} color="#e8eef8" />
		{/* Light flooding through the door */}
		<spotLight position={[6.5, 5, 6]} angle={0.6} penumbra={0.5} intensity={500 * door} distance={30} decay={2} color="#ffd8a0" castShadow />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[30, 30]} />
			<meshStandardMaterial color="#4a5058" roughness={0.6} />
		</mesh>
		<RBox size={[20, 10, 0.4]} pos={[0, 5, -3]} color="#d8dce2" />
		{Array.from({length: 60}, (_, i) => (
			<RBox key={i} size={[0.9, 0.9, 0.05]} pos={[-7 + (i % 15) * 1.0, 6.2 + Math.floor(i / 15) * 1.0, -2.78]} color={i % 2 ? '#e6eaee' : '#d0d6dc'} />
		))}
		{/* Lockers */}
		{Array.from({length: 7}, (_, i) => (
			<group key={i} position={[-6 + i * 1.6, 0, -2.4]}>
				<RBox size={[1.5, 5.6, 1.0]} pos={[0, 2.8, 0]} color={i % 2 ? '#4a7ab0' : '#4472a8'} rough={0.4} />
				{[0, 1, 2, 3].map((v) => (
					<RBox key={v} size={[0.8, 0.06, 0.04]} pos={[0, 4.8 - v * 0.2, 0.52]} color="#2a4a7a" />
				))}
				<RBox size={[0.08, 0.5, 0.06]} pos={[0.5, 2.8, 0.52]} color="#c8ccd2" />
			</group>
		))}
		{/* Bench, towel, boots */}
		<RBox size={[9, 0.3, 1.2]} pos={[-1, 1.4, 0.4]} color="#8a6440" />
		{[-4.5, 2.5].map((x) => (
			<RBox key={x} size={[0.3, 1.4, 1.0]} pos={[x, 0.7, 0.4]} color="#5a5e66" />
		))}
		<RBox size={[1.4, 0.2, 1.0]} pos={[-3.2, 1.65, 0.4]} rot={[0, 0.2, 0]} color="#f6f6f2" />
		{[-1.6, -1.1].map((x) => (
			<RBox key={x} size={[0.4, 0.4, 1.0]} pos={[x, 0.2, 1.8]} rot={[0, 0.3, 0]} color="#161616" />
		))}
		{/* Hook with the number 10 shirt */}
		<group position={[3.6, 5.2, -1.86]}>
			<RBox size={[0.12, 0.4, 0.4]} color="#c8ccd2" />
			{shirt ? (
				<group position={[0, -1.3, 0.2]}>
					{[0, 1, 2, 3, 4].map((i) => (
						<RBox key={i} size={[0.36, 2.2, 0.1]} pos={[-0.8 + i * 0.4, 0, 0]} color={i % 2 ? '#ffffff' : '#7cc3ee'} />
					))}
					<RBox size={[2.8, 0.7, 0.1]} pos={[0, 0.8, 0]} color="#ffffff" />
					<BlockText text="10" size={0.7} depth={0.06} color="#1a2a4a" position={[0, -0.1, 0.1]} />
				</group>
			) : null}
		</group>
		{/* Three silver medals on hooks under their years */}
		{medals > 0
			? ['2014', '2015', '2016'].slice(0, medals).map((y, i) => (
					<group key={y} position={[-2.2 + i * 2.2, 7.4, -1.7]}>
						<BlockText text={y} size={0.36} depth={0.1} color="#e8eef4" side="#8a96a4" position={[0, 1.3, 0]} />
						<RBox size={[0.1, 0.3, 0.3]} pos={[0, 0.4, 0]} color="#8a8e96" />
						<group position={[0, -1.0, 0.25]}>
							<Medal />
						</group>
					</group>
				))
			: null}
		{/* Door on the right */}
		<group position={[6.8, 0, 1]}>
			<RBox size={[0.3, 7, 3.2]} pos={[0, 3.5, 0]} color="#2a2a30" />
			<group position={[0, 0, -1.4]} rotation={[0, -door * 1.3, 0]}>
				<RBox size={[0.2, 6.4, 2.8]} pos={[0, 3.2, 1.4]} color="#6a7078" />
			</group>
		</group>
		{/* Fluorescent tubes */}
		{[-3, 3].map((x) => (
			<RBox key={x} size={[3, 0.12, 0.3]} pos={[x, 9, 0]} color="#ffffff" emissive={light > 0.5 ? '#dfefff' : '#000000'} />
		))}
	</group>
);

// ---------- 21. Trophy room: eight golden balls ----------

export const TrophyRoom: React.FC<{count: number}> = ({count}) => (
	<group>
		<Sky color={'#0a0806'} />
		<hemisphereLight args={['#ffe8c0', '#2a1a10', 0.35]} />
		<directionalLight position={[0, 6, 18]} intensity={0.7} color="#ffe8c8" />
		<spotLight position={[0, 14, 6]} angle={0.7} penumbra={0.6} intensity={500} distance={40} decay={2} color="#ffe2a8" castShadow />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[40, 40]} />
			<meshStandardMaterial color="#3a2618" roughness={0.4} />
		</mesh>
		<RBox size={[24, 14, 0.4]} pos={[0, 7, -4]} color="#4a2e1a" />
		{Array.from({length: 11}, (_, i) => (
			<RBox key={i} size={[0.12, 14, 0.42]} pos={[-10 + i * 2, 7, -3.9]} color="#3a2214" />
		))}
		<BlockText text="8" size={6.5} depth={1.2} color="#e8b83a" side="#8a5a10" emissive={0.15} position={[0, 7.4, -3.2]} />
		{Array.from({length: 8}, (_, i) => {
			const row = Math.floor(i / 4);
			const x = -4.5 + (i % 4) * 3;
			const y = row === 0 ? 0 : 3.4;
			const z = row === 0 ? 0.6 : -1.6;
			const on = i < count;
			return (
				<group key={i} position={[x, y, z]}>
					<RBox size={[1.6, 1.8, 1.6]} pos={[0, 0.9, 0]} color="#1c1410" />
					{on ? (
						<group position={[0, 1.8, 0]}>
							<RBox size={[0.9, 0.3, 0.9]} pos={[0, 0.15, 0]} color="#2a1a10" />
							<mesh position={[0, 0.55, 0]}>
								<cylinderGeometry args={[0.18, 0.3, 0.5, 10]} />
								<meshStandardMaterial color="#e8b83a" metalness={0.85} roughness={0.2} />
							</mesh>
							<mesh position={[0, 1.15, 0]} castShadow>
								<sphereGeometry args={[0.55, 18, 14]} />
								<meshStandardMaterial color="#f2c44a" metalness={0.9} roughness={0.15} emissive="#5a3a08" emissiveIntensity={0.35} />
							</mesh>
							<pointLight position={[0, 2.4, 0.8]} intensity={10} color="#ffd88a" distance={4} decay={2} />
						</group>
					) : null}
				</group>
			);
		})}
	</group>
);

export {font};
