import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RBox, shade} from './parts';

// A single pizza slice lying flat, tip pointing toward +z, crust along x at z = 0.
// stage 0 = whole, 1 = one bite, 2 = just the crust end left.
export const Slice: React.FC<{bitten?: boolean; stage?: 0 | 1 | 2}> = ({bitten, stage = bitten ? 1 : 0}) => {
	const geo = useMemo(() => {
		const s = new THREE.Shape();
		s.moveTo(-0.45, 0);
		s.lineTo(0.45, 0);
		if (stage === 2) {
			s.lineTo(0.34, 0.22);
			s.quadraticCurveTo(0.18, 0.12, 0.06, 0.26);
			s.quadraticCurveTo(-0.08, 0.14, -0.34, 0.22);
		} else if (stage === 1) {
			s.lineTo(0.2, 0.55);
			s.quadraticCurveTo(0.08, 0.42, 0, 0.52);
			s.quadraticCurveTo(-0.08, 0.42, -0.2, 0.55);
		} else {
			s.lineTo(0, 1.0);
		}
		s.closePath();
		const g = new THREE.ExtrudeGeometry(s, {depth: 0.06, bevelEnabled: false});
		g.rotateX(Math.PI / 2);
		g.translate(0, 0.06, 0);
		return g;
	}, [stage]);
	const pepperoni: [number, number][] = stage === 2
		? [[-0.18, 0.1]]
		: stage === 1
		? [
				[-0.18, 0.18],
				[0.16, 0.26],
			]
		: [
				[-0.18, 0.18],
				[0.16, 0.26],
				[0, 0.55],
			];
	return (
		<group>
			<mesh geometry={geo} castShadow receiveShadow>
				<meshStandardMaterial color="#f2c14e" roughness={0.6} flatShading />
			</mesh>
			<RBox size={[0.96, 0.12, 0.16]} pos={[0, 0.05, 0.02]} color="#c98b3c" />
			{pepperoni.map(([x, z]) => (
				<mesh key={`${x}${z}`} position={[x, 0.075, z]} castShadow>
					<cylinderGeometry args={[0.08, 0.08, 0.03, 8]} />
					<meshStandardMaterial color="#b8352a" roughness={0.5} flatShading />
				</mesh>
			))}
		</group>
	);
};

// Open pizza box: lid hinged at the back. Children are placed inside.
export const PizzaBox: React.FC<{children?: React.ReactNode}> = ({children}) => {
	const card = '#c8a06a';
	const inside = '#e3c99c';
	return (
		<group>
			<RBox size={[1.9, 0.04, 1.9]} pos={[0, 0.02, 0]} color={inside} />
			<RBox size={[1.9, 0.22, 0.04]} pos={[0, 0.11, 0.93]} color={card} />
			<RBox size={[1.9, 0.22, 0.04]} pos={[0, 0.11, -0.93]} color={card} />
			<RBox size={[0.04, 0.22, 1.9]} pos={[0.93, 0.11, 0]} color={card} />
			<RBox size={[0.04, 0.22, 1.9]} pos={[-0.93, 0.11, 0]} color={card} />
			{/* Grease spots where the other slices were */}
			{[
				[-0.4, -0.35, 0.2],
				[0.35, 0.4, 0.16],
				[-0.3, 0.45, 0.13],
			].map(([x, z, r]) => (
				<mesh key={x} position={[x, 0.045, z]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[r, 10]} />
					<meshStandardMaterial color={shade(inside, -0.12)} roughness={1} />
				</mesh>
			))}
			{/* Lid, opened back past vertical */}
			<group position={[0, 0.22, -0.95]} rotation={[-1.95, 0, 0]}>
				<RBox size={[1.9, 0.04, 1.9]} pos={[0, 0, 0.95]} color={card} />
				<RBox size={[0.8, 0.01, 0.5]} pos={[0, -0.025, 0.95]} color="#c0392b" />
			</group>
			{children}
		</group>
	);
};

// Standing-height picnic table made of planks.
export const Table: React.FC = () => {
	const wood = '#9b6b43';
	return (
		<group>
			{[-1.4, -0.7, 0, 0.7, 1.4].map((z, i) => (
				<RBox key={z} size={[6.6, 0.18, 0.66]} pos={[0, 2.2, z]} color={i % 2 ? wood : shade(wood, 0.04)} />
			))}
			{[-2.8, 2.8].map((x) => (
				<group key={x}>
					<RBox size={[0.28, 2.1, 0.28]} pos={[x, 1.05, -1.25]} color={shade(wood, -0.08)} />
					<RBox size={[0.28, 2.1, 0.28]} pos={[x, 1.05, 1.25]} color={shade(wood, -0.08)} />
					<RBox size={[0.2, 0.2, 2.6]} pos={[x, 0.6, 0]} color={shade(wood, -0.1)} />
				</group>
			))}
		</group>
	);
};

// Chain-link fence like the reference courts: posts, top rail, see-through mesh.
export const Fence: React.FC<{z: number; from: number; to: number}> = ({z, from, to}) => {
	const tex = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = c.height = 64;
		const g = c.getContext('2d')!;
		g.strokeStyle = '#6d6f6c';
		g.lineWidth = 4;
		g.beginPath();
		g.moveTo(0, 32);
		g.lineTo(32, 0);
		g.lineTo(64, 32);
		g.lineTo(32, 64);
		g.closePath();
		g.stroke();
		const t = new THREE.CanvasTexture(c);
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set((to - from) * 2, 10);
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	}, [from, to]);
	const posts: number[] = [];
	for (let x = from; x <= to; x += 6) posts.push(x);
	return (
		<group position={[0, 0, z]}>
			<mesh position={[(from + to) / 2, 2.6, 0]}>
				<planeGeometry args={[to - from, 5.2]} />
				<meshStandardMaterial map={tex} transparent alphaTest={0.3} side={THREE.DoubleSide} roughness={0.6} metalness={0.3} />
			</mesh>
			{posts.map((x) => (
				<mesh key={x} position={[x, 2.7, 0]} castShadow>
					<cylinderGeometry args={[0.1, 0.1, 5.4, 8]} />
					<meshStandardMaterial color="#5f615e" metalness={0.4} roughness={0.5} />
				</mesh>
			))}
			<mesh position={[(from + to) / 2, 5.3, 0]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.07, 0.07, to - from, 8]} />
				<meshStandardMaterial color="#5f615e" metalness={0.4} roughness={0.5} />
			</mesh>
		</group>
	);
};
