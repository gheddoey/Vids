import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RBox, shade} from './parts';

const PI = Math.PI;

// Tall glass of iced tea. `fill` 0..1 is how full it is.
export const Glass: React.FC<{fill?: number}> = ({fill = 0}) => {
	const h = 0.56;
	const liquid = Math.max(0, Math.min(1, fill)) * (h - 0.06);
	return (
		<group>
			{/* Tea */}
			{liquid > 0.01 ? (
				<mesh position={[0, 0.04 + liquid / 2, 0]}>
					<cylinderGeometry args={[0.175, 0.16, liquid, 14]} />
					<meshStandardMaterial color="#b8682b" roughness={0.2} transparent opacity={0.88} emissive="#5a2a0c" emissiveIntensity={0.25} />
				</mesh>
			) : null}
			{/* Ice cubes floating at the top (or resting at the bottom when empty) */}
			{[
				[-0.06, 0.03, 0.2],
				[0.07, -0.04, -0.3],
				[0.0, 0.07, 0.7],
			].map(([x, z, r], i) => (
				<mesh key={i} position={[x, Math.max(0.1, 0.04 + liquid - 0.03) + i * 0.05, z]} rotation={[r, r * 2, r]}>
					<boxGeometry args={[0.11, 0.11, 0.11]} />
					<meshStandardMaterial color="#eef8fb" roughness={0.1} transparent opacity={0.75} />
				</mesh>
			))}
			{/* Glass walls and base */}
			<mesh position={[0, h / 2, 0]}>
				<cylinderGeometry args={[0.2, 0.18, h, 16, 1, true]} />
				<meshStandardMaterial color="#f4fbff" roughness={0.05} metalness={0.1} transparent opacity={0.28} side={THREE.DoubleSide} />
			</mesh>
			<mesh position={[0, 0.02, 0]}>
				<cylinderGeometry args={[0.18, 0.18, 0.04, 16]} />
				<meshStandardMaterial color="#e8f4f8" roughness={0.05} transparent opacity={0.5} />
			</mesh>
		</group>
	);
};

// White ceramic pitcher. Spout on -x, handle on +x. Origin at the base centre.
export const Pitcher: React.FC = () => {
	const c = '#ece6d2';
	return (
		<group>
			<mesh position={[0, 0.38, 0]} castShadow receiveShadow>
				<cylinderGeometry args={[0.3, 0.36, 0.76, 16]} />
				<meshStandardMaterial color={c} roughness={0.35} />
			</mesh>
			<mesh position={[0, 0.8, 0]} castShadow>
				<cylinderGeometry args={[0.27, 0.3, 0.08, 16]} />
				<meshStandardMaterial color={shade(c, -0.05)} roughness={0.35} />
			</mesh>
			<mesh position={[0, 0.88, 0]} castShadow>
				<cylinderGeometry args={[0.06, 0.1, 0.1, 10]} />
				<meshStandardMaterial color={shade(c, -0.05)} roughness={0.35} />
			</mesh>
			{/* Spout */}
			<mesh position={[-0.36, 0.72, 0]} rotation={[0, 0, PI / 2 + 0.5]} castShadow>
				<coneGeometry args={[0.1, 0.26, 10, 1, true]} />
				<meshStandardMaterial color={c} roughness={0.35} side={THREE.DoubleSide} />
			</mesh>
			{/* Handle */}
			<mesh position={[0.36, 0.42, 0]} rotation={[0, 0, -PI / 2]} castShadow>
				<torusGeometry args={[0.2, 0.05, 8, 16, PI]} />
				<meshStandardMaterial color={c} roughness={0.35} />
			</mesh>
			<RBox size={[0.5, 0.06, 0.02]} pos={[0, 0.24, 0.35]} color="#6e8fae" />
		</group>
	);
};

export const Coins: React.FC = () => (
	<group>
		{[
			[0, 0, 0],
			[0.2, 0.0, 0.08],
			[0.1, 0.0, -0.17],
		].map(([x, y, z], i) => (
			<mesh key={i} position={[x, y + 0.015, z]} castShadow>
				<cylinderGeometry args={[0.1, 0.1, 0.03, 14]} />
				<meshStandardMaterial color="#c56b35" metalness={0.6} roughness={0.35} />
			</mesh>
		))}
	</group>
);

// The photo lying on the counter.
export const Photo: React.FC = () => {
	const tex = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 128;
		c.height = 96;
		const g = c.getContext('2d')!;
		g.fillStyle = '#f4f2ea';
		g.fillRect(0, 0, 128, 96);
		const grad = g.createLinearGradient(0, 8, 0, 88);
		grad.addColorStop(0, '#3e7fb8');
		grad.addColorStop(1, '#a9d4ea');
		g.fillStyle = grad;
		g.fillRect(8, 8, 112, 80);
		g.fillStyle = '#e8e2cc';
		g.fillRect(30, 40, 70, 22);
		g.fillStyle = '#7a705a';
		g.fillRect(36, 44, 6, 14);
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	}, []);
	return (
		<mesh rotation={[-PI / 2, 0, 0.35]} position={[0, 0.006, 0]} receiveShadow>
			<planeGeometry args={[0.56, 0.42]} />
			<meshStandardMaterial map={tex} roughness={0.5} />
		</mesh>
	);
};

const Bottle: React.FC<{color: string; h: number; pos: [number, number, number]}> = ({color, h, pos}) => (
	<group position={pos}>
		<mesh position={[0, h / 2, 0]} castShadow>
			<cylinderGeometry args={[0.18, 0.2, h, 10]} />
			<meshStandardMaterial color={color} roughness={0.15} metalness={0.1} transparent opacity={0.85} />
		</mesh>
		<mesh position={[0, h + 0.18, 0]}>
			<cylinderGeometry args={[0.06, 0.12, 0.36, 8]} />
			<meshStandardMaterial color={color} roughness={0.15} transparent opacity={0.85} />
		</mesh>
	</group>
);

// Blue glass water pipe, like the ones lining the back shelves.
const Hookah: React.FC<{pos: [number, number, number]}> = ({pos}) => {
	const blue = '#2a4fa8';
	const metal = '#c9ccd2';
	return (
		<group position={pos}>
			<mesh position={[0, 0.32, 0]} castShadow>
				<sphereGeometry args={[0.32, 12, 10]} />
				<meshStandardMaterial color={blue} roughness={0.15} metalness={0.2} />
			</mesh>
			<mesh position={[0, 0.3, 0]}>
				<torusGeometry args={[0.31, 0.03, 6, 16]} />
				<meshStandardMaterial color="#e2e6ee" metalness={0.5} roughness={0.3} />
			</mesh>
			<mesh position={[0, 0.95, 0]} castShadow>
				<cylinderGeometry args={[0.05, 0.07, 0.8, 8]} />
				<meshStandardMaterial color={metal} metalness={0.7} roughness={0.3} />
			</mesh>
			<mesh position={[0, 1.15, 0]}>
				<cylinderGeometry args={[0.2, 0.2, 0.04, 12]} />
				<meshStandardMaterial color={metal} metalness={0.7} roughness={0.3} />
			</mesh>
			<mesh position={[0, 1.42, 0]} castShadow>
				<cylinderGeometry args={[0.1, 0.06, 0.24, 10]} />
				<meshStandardMaterial color={blue} roughness={0.2} />
			</mesh>
		</group>
	);
};

const Palm: React.FC<{pos: [number, number, number]; h?: number}> = ({pos, h = 9}) => (
	<group position={pos}>
		{Array.from({length: 8}, (_, i) => (
			<mesh key={i} position={[Math.sin(i * 0.4) * 0.25, (i + 0.5) * (h / 8), 0]} rotation={[0, 0, Math.sin(i * 0.4) * 0.05]} castShadow>
				<cylinderGeometry args={[0.32 - i * 0.015, 0.36 - i * 0.015, h / 8, 7]} />
				<meshStandardMaterial color={i % 2 ? '#8a6a45' : '#7a5c3a'} roughness={1} flatShading />
			</mesh>
		))}
		{Array.from({length: 7}, (_, i) => {
			const a = (i / 7) * PI * 2;
			return (
				<group key={i} position={[0, h, 0]} rotation={[0, a, 0]}>
					<RBox size={[0.7, 0.08, 3.2]} pos={[0, -0.5, 1.5]} rot={[0.45, 0, 0]} color={i % 2 ? '#3f8a3a' : '#4f9c45'} />
				</group>
			);
		})}
	</group>
);

// The whole bar: back shelves, counter, walls with a bright doorway, desert outside.
export const Bar: React.FC = () => {
	const wall = '#6f5e45';
	const wood = '#4a3626';
	const bottles = ['#4f6b3a', '#6a4a2a', '#5a4a6e', '#7a8a3a', '#3e5a4a', '#8a5a2a', '#4a3f5a', '#6b7a4a'];
	return (
		<group>
			{/* Floor */}
			<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[30, 16]} />
				<meshStandardMaterial color="#6b5a44" roughness={0.9} />
			</mesh>
			{Array.from({length: 15}, (_, i) => (
				<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[-14 + i * 2, 0.005, 1]}>
					<planeGeometry args={[0.04, 14]} />
					<meshStandardMaterial color="#54473a" roughness={1} />
				</mesh>
			))}
			{/* Counter: dark stone top over a wood front */}
			<RBox size={[18, 0.16, 1.7]} pos={[0, 2.37, 0]} color="#4b4c40" rough={0.35} />
			<RBox size={[18, 2.3, 1.4]} pos={[0, 1.15, 0]} color={wood} />
			{Array.from({length: 9}, (_, i) => (
				<RBox key={i} size={[1.7, 1.6, 0.06]} pos={[-8 + i * 2, 1.2, 0.72]} color={shade(wood, 0.04)} />
			))}
			{/* Back wall with shelves of bottles and blue water pipes */}
			<RBox size={[24, 10, 0.4]} pos={[0, 5, -4.6]} color={shade(wall, -0.08)} />
			{[2.2, 4.4, 6.6].map((y) => (
				<RBox key={y} size={[19, 0.14, 1.1]} pos={[0, y, -3.9]} color={wood} />
			))}
			{[-9.5, -3.2, 3.2, 9.5].map((x) => (
				<RBox key={x} size={[0.2, 6.8, 1.1]} pos={[x, 3.4, -3.9]} color={shade(wood, -0.05)} />
			))}
			{[-8.8, -7.9, -7.0, -6.1, -5.2, -4.3, 4.3, 5.2, 6.1, 7.0, 7.9, 8.8].map((x, i) => (
				<Bottle key={x} color={bottles[i % bottles.length]} h={0.9 + (i % 3) * 0.2} pos={[x, 4.47, -3.9]} />
			))}
			{[-8.6, -7.4, -6.2, -5.0, -3.8, 3.8, 5.0, 6.2, 7.4, 8.6].map((x, i) => (
				<Bottle key={x} color={bottles[(i + 3) % bottles.length]} h={1.0 + (i % 2) * 0.25} pos={[x, 6.67, -3.9]} />
			))}
			{[-2.4, -1.2, 0, 1.2, 2.4].map((x) => (
				<Hookah key={x} pos={[x, 4.47, -3.9]} />
			))}
			{[-2.2, -0.8, 0.8, 2.2].map((x) => (
				<Hookah key={x} pos={[x, 2.27, -3.9]} />
			))}
			{[-8, -6, 6, 8].map((x) => (
				<Hookah key={x} pos={[x, 2.27, -3.9]} />
			))}
			{/* Side walls and ceiling */}
			<RBox size={[0.4, 10, 12]} pos={[-12, 5, 1]} color={wall} />
			<RBox size={[0.4, 10, 12]} pos={[12, 5, 1]} color={wall} />
			<RBox size={[24.4, 0.4, 12]} pos={[0, 10, 1]} color={shade(wall, -0.12)} />
			{/* Ceiling beams */}
			{[-1.5, 1.5, 4.5].map((z) => (
				<RBox key={z} size={[24, 0.5, 0.5]} pos={[0, 9.6, z]} color={wood} />
			))}
			{/* Front wall with a wide arched doorway */}
			<RBox size={[8, 10, 0.5]} pos={[-8, 5, 7]} color={wall} />
			<RBox size={[8, 10, 0.5]} pos={[8, 5, 7]} color={wall} />
			<RBox size={[8, 2.6, 0.5]} pos={[0, 8.7, 7]} color={wall} />
			{Array.from({length: 7}, (_, i) => {
				// Stepped arch corners
				const s = (3 - Math.abs(i - 3)) * 0.0;
				const w = 0.9;
				const x = -3.6 + i * 1.2;
				const drop = 0.9 - Math.cos(((i - 3) / 3.4) * (PI / 2)) * 0.9 + s;
				return <RBox key={i} size={[w + 0.3, drop + 0.05, 0.5]} pos={[x, 7.4 - drop / 2, 7]} color={wall} />;
			})}
			{/* Outside: sand, a low wall, palms, sky */}
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.01, 40]} receiveShadow>
				<planeGeometry args={[160, 66]} />
				<meshStandardMaterial color="#e3c98f" roughness={1} />
			</mesh>
			<RBox size={[40, 2.2, 1.2]} pos={[4, 1.1, 24]} color="#d9b980" />
			<Palm pos={[-7, 0, 21]} h={9} />
			<Palm pos={[9, 0, 30]} h={11} />
			<Palm pos={[-15, 0, 34]} h={10} />
			<Palm pos={[2, 0, 40]} h={12} />
			{[
				[-10, 14, 60],
				[12, 17, 70],
				[0, 20, 80],
			].map(([x, y, z]) => (
				<group key={x} position={[x, y, z]}>
					<RBox size={[6, 1.2, 2]} color="#ffffff" />
					<RBox size={[3.5, 1.4, 2]} pos={[1, 0.8, 0]} color="#ffffff" />
				</group>
			))}
		</group>
	);
};
