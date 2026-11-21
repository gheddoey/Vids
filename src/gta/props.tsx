import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {RBox, seeded} from '../parts';
import {BlockText} from '../BlockText';
import {Shadowed} from '../lebron/sets';

// Props for the GTA origins short. All new designs.
type V3 = [number, number, number];

// ---------- Lighting rig: hemi fill + shadowed key + rim + camera-side fill ----------
export const Rig: React.FC<{
	hemi: [string, string, number];
	key_: {pos: V3; color: string; i: number; size?: number};
	rim: {pos: V3; color: string; i: number};
	fill?: {pos: V3; color?: string; i: number};
}> = ({hemi, key_, rim, fill}) => (
	<>
		<hemisphereLight args={hemi} />
		<Shadowed pos={key_.pos} color={key_.color} intensity={key_.i} size={key_.size ?? 14} />
		<directionalLight position={rim.pos} color={rim.color} intensity={rim.i} />
		{fill ? <directionalLight position={fill.pos} color={fill.color ?? '#ffffff'} intensity={fill.i} /> : null}
	</>
);

export const Glow: React.FC<{size: V3; pos?: V3; rot?: V3; color: string; i?: number}> = ({size, pos, rot, color, i = 2}) => (
	<mesh position={pos} rotation={rot}>
		<boxGeometry args={size} />
		<meshStandardMaterial color={color} emissive={color} emissiveIntensity={i} toneMapped={false} />
	</mesh>
);

// ---------- Cars (unit car is 4.4 long along +x, 2 wide; scale per scene) ----------
export type CarKind = 'player' | 'cop' | 'taxi' | 'convertible' | 'lowrider' | 'hatch' | 'sedan';
const CAR_COL: Record<CarKind, string> = {player: '#8e949c', cop: '#f4f4f0', taxi: '#f2c21a', convertible: '#f29ac0', lowrider: '#6a2a9a', hatch: '#b8402a', sedan: '#2a6ab0'};

export const Wheel: React.FC<{pos: V3; spin?: number; chrome?: boolean}> = ({pos, spin = 0, chrome}) => (
	<group position={pos} rotation={[Math.PI / 2, 0, 0]}>
		<group rotation={[0, spin, 0]}>
			<mesh castShadow>
				<cylinderGeometry args={[0.42, 0.42, 0.34, 10]} />
				<meshStandardMaterial color="#18181a" roughness={0.9} flatShading />
			</mesh>
			<mesh position={[0, 0.0, 0]}>
				<cylinderGeometry args={[0.24, 0.24, 0.36, 6]} />
				<meshStandardMaterial color={chrome ? '#e8e8f0' : '#8a8e96'} metalness={chrome ? 0.9 : 0.3} roughness={0.3} flatShading />
			</mesh>
		</group>
	</group>
);

export const Car: React.FC<{kind?: CarKind; color?: string; pos?: V3; rotY?: number; roll?: number; pitch?: number; spin?: number; siren?: number; lights?: boolean; dent?: number; hop?: number; scale?: number}> = ({
	kind = 'sedan',
	color,
	pos = [0, 0, 0],
	rotY = 0,
	roll = 0,
	pitch = 0,
	spin = 0,
	siren = 0,
	lights = true,
	dent = 0,
	hop = 0,
	scale = 1,
}) => {
	const c = color ?? CAR_COL[kind];
	const low = kind === 'lowrider';
	const open = kind === 'convertible';
	const body = low ? [5.2, 0.62, 2.0] : kind === 'hatch' ? [3.8, 0.8, 1.9] : [4.4, 0.78, 2.0];
	const L = body[0];
	const by = low ? 0.62 : 0.78;
	return (
		<group position={pos} rotation={[0, rotY, 0]} scale={scale}>
			{[
				[L * 0.32, 1.05],
				[-L * 0.32, -1.05],
				[L * 0.32, -1.05],
				[-L * 0.32, 1.05],
			].map(([x, z], i) => (
				<Wheel key={i} pos={[x, 0.42, z * 0.98]} spin={spin} chrome={low || open} />
			))}
			<group position={[0, hop, 0]} rotation={[roll, 0, pitch]}>
				{/* body with a crumple on the nose when dented */}
				<RBox size={[L - dent * 0.6, body[1], body[2]]} pos={[-dent * 0.3, by, 0]} color={c} rough={0.35} />
				{kind === 'cop' ? (
					<>
						<RBox size={[L * 0.42, body[1] + 0.02, body[2] + 0.02]} pos={[0, by, 0]} color="#16161a" rough={0.35} />
						<BlockText text="POLICE" size={0.26} depth={0.04} color="#f4f4f0" position={[0, by + 0.04, body[2] / 2 + 0.03]} />
						<BlockText text="POLICE" size={0.26} depth={0.04} color="#f4f4f0" position={[0, by + 0.04, -body[2] / 2 - 0.03]} rotation={[0, Math.PI, 0]} />
					</>
				) : null}
				{kind === 'taxi' ? <RBox size={[L, 0.12, body[2] + 0.02]} pos={[0, by + 0.1, 0]} color="#1a1a1a" /> : null}
				{low ? <RBox size={[L + 0.04, 0.06, body[2] + 0.04]} pos={[0, by - 0.18, 0]} color="#e8e8f0" rough={0.15} /> : null}
				{/* cabin */}
				{open ? (
					<>
						<RBox size={[0.08, 0.5, 1.7]} pos={[0.5, by + 0.62, 0]} rot={[0, 0, -0.35]} color="#bfe6f8" rough={0.1} />
						<RBox size={[1.2, 0.3, 1.6]} pos={[-0.7, by + 0.5, 0]} color="#f4ecd8" />
					</>
				) : (
					<group position={[kind === 'hatch' ? -0.3 : -0.25, by + 0.72, 0]}>
						<RBox size={[low ? 2.0 : 2.3, 0.66, 1.78]} color={kind === 'cop' ? '#16161a' : c} rough={0.35} />
						<RBox size={[low ? 2.02 : 2.32, 0.42, 1.6]} pos={[0, 0.02, 0]} color="#22303a" rough={0.1} />
						<RBox size={[low ? 1.8 : 2.1, 0.44, 1.8]} pos={[0, 0.02, 0]} color="#2a3a48" rough={0.1} />
					</group>
				)}
				{kind === 'taxi' ? (
					<group position={[-0.25, by + 1.2, 0]}>
						<RBox size={[0.7, 0.28, 0.4]} color="#f8f4e0" emissive="#3a3410" />
					</group>
				) : null}
				{kind === 'cop' ? (
					<group position={[-0.25, by + 1.12, 0]}>
						<Glow size={[0.36, 0.18, 1.2]} pos={[0, 0, -0.32]} color="#ff2a2a" i={siren > 0.5 ? 6 : 0.5} />
						<Glow size={[0.36, 0.18, 1.2]} pos={[0, 0, 0.32]} color="#2a5aff" i={siren > 0.5 ? 0.5 : 6} />
						<pointLight position={[0, 0.4, siren > 0.5 ? -1 : 1]} color={siren > 0.5 ? '#ff2a2a' : '#2a5aff'} intensity={lights ? 14 * scale * scale : 0} distance={10 * scale} />
					</group>
				) : null}
				{/* headlights / taillights */}
				{[-0.62, 0.62].map((z) => (
					<React.Fragment key={z}>
						<Glow size={[0.06, 0.18, 0.4]} pos={[L / 2 - dent * 0.6 + 0.01, by + 0.08, z]} color="#fff4d0" i={lights ? 3 : 0.3} />
						<Glow size={[0.06, 0.16, 0.36]} pos={[-L / 2 - 0.01, by + 0.08, z]} color="#ff3030" i={lights ? 2 : 0.4} />
					</React.Fragment>
				))}
				<RBox size={[0.1, 0.2, body[2] + 0.04]} pos={[L / 2 - dent * 0.6, by - 0.3, 0]} color="#3a3a3e" />
				<RBox size={[0.1, 0.2, body[2] + 0.04]} pos={[-L / 2, by - 0.3, 0]} color="#3a3a3e" />
			</group>
		</group>
	);
};

// ---------- Buildings with window grids ----------
export const Building: React.FC<{w: number; d: number; h: number; pos: V3; color: string; win?: string; lit?: number; rows?: number; cols?: number; seed?: number; trim?: string; rotY?: number}> = ({
	w,
	d,
	h,
	pos,
	color,
	win = '#ffd890',
	lit = 0.5,
	rows,
	cols,
	seed = 1,
	trim,
	rotY = 0,
}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const R = rows ?? Math.max(1, Math.floor(h / 1.4));
	const C = cols ?? Math.max(1, Math.floor(w / 1.2));
	const n = R * C * 2;
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const r = seeded(seed * 97 + 13);
		const o = new THREE.Object3D();
		const col = new THREE.Color();
		let k = 0;
		for (const side of [1, -1]) {
			for (let i = 0; i < R; i++) {
				for (let j = 0; j < C; j++) {
					o.position.set(-w / 2 + (j + 0.5) * (w / C), 0.9 + i * ((h - 1.2) / R), (side * d) / 2 + side * 0.02);
					o.scale.set((w / C) * 0.55, 0.7, 0.05);
					o.updateMatrix();
					m.setMatrixAt(k, o.matrix);
					const on = r() < lit;
					m.setColorAt(k, col.set(on ? win : '#20242c'));
					k++;
				}
			}
		}
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	}, [w, d, h, R, C, lit, seed, win]);
	return (
		<group position={pos} rotation={[0, rotY, 0]}>
			<RBox size={[w, h, d]} pos={[0, h / 2, 0]} color={color} />
			{trim ? <RBox size={[w + 0.2, 0.3, d + 0.2]} pos={[0, h, 0]} color={trim} /> : null}
			<instancedMesh ref={ref} args={[undefined, undefined, n]}>
				<boxGeometry args={[1, 1, 1]} />
				<meshBasicMaterial toneMapped={false} />
			</instancedMesh>
		</group>
	);
};

export const StreetLamp: React.FC<{pos: V3; h?: number; color?: string; on?: boolean; rotY?: number; light?: number}> = ({pos, h = 6, color = '#ffb460', on = true, rotY = 0, light = 10}) => (
	<group position={pos} rotation={[0, rotY, 0]}>
		<RBox size={[0.22, h, 0.22]} pos={[0, h / 2, 0]} color="#2c2e33" />
		<RBox size={[1.4, 0.16, 0.24]} pos={[0.6, h, 0]} color="#2c2e33" />
		<Glow size={[0.6, 0.12, 0.34]} pos={[1.1, h - 0.1, 0]} color={color} i={on ? 3 : 0.2} />
		{on ? <pointLight position={[1.1, h - 0.6, 0]} color={color} intensity={light} distance={h * 2.2} /> : null}
	</group>
);

export const Palm: React.FC<{pos: V3; h?: number; lean?: number; dark?: boolean}> = ({pos, h = 7, lean = 0.12, dark}) => {
	const trunk = dark ? '#2a1a2a' : '#8a6a44';
	const leaf = dark ? '#1a1024' : '#3f9a4a';
	return (
		<group position={pos} rotation={[0, 0, lean]}>
			{Array.from({length: 7}).map((_, i) => (
				<RBox key={i} size={[0.46 - i * 0.02, h / 7 + 0.05, 0.46 - i * 0.02]} pos={[Math.sin(i * 0.4) * 0.15, (i + 0.5) * (h / 7), 0]} color={i % 2 ? trunk : dark ? trunk : '#7a5a38'} />
			))}
			{Array.from({length: 7}).map((_, i) => (
				<group key={i} position={[0, h, 0]} rotation={[0, (i / 7) * Math.PI * 2, 0]}>
					<RBox size={[2.6, 0.08, 0.55]} pos={[1.2, -0.35, 0]} rot={[0, 0, -0.38]} color={leaf} />
				</group>
			))}
			<RBox size={[0.5, 0.4, 0.5]} pos={[0, h - 0.2, 0]} color={dark ? trunk : '#6a4a2a'} />
		</group>
	);
};

// ---------- Tiny walker critters (our own design: orange hard hat, white overalls) ----------
export const Critter: React.FC<{pos: V3; step?: number; rotY?: number; s?: number; fall?: number}> = ({pos, step = 0, rotY = 0, s = 1, fall = 0}) => {
	const sw = Math.sin(step) * 0.6;
	return (
		<group position={pos} rotation={[fall * 2.4, rotY, fall * 1.3]} scale={s}>
			<RBox size={[0.12, 0.2, 0.12]} pos={[-0.07, 0.1, 0]} rot={[sw, 0, 0]} color="#3a3a44" />
			<RBox size={[0.12, 0.2, 0.12]} pos={[0.07, 0.1, 0]} rot={[-sw, 0, 0]} color="#3a3a44" />
			<RBox size={[0.3, 0.3, 0.2]} pos={[0, 0.34, 0]} color="#f4f4ee" />
			<RBox size={[0.26, 0.24, 0.22]} pos={[0, 0.62, 0]} color="#f2c8a0" />
			<RBox size={[0.34, 0.12, 0.3]} pos={[0, 0.79, 0]} color="#ff8a1a" />
			<RBox size={[0.04, 0.06, 0.02]} pos={[-0.06, 0.64, 0.115]} color="#1a1a1a" />
			<RBox size={[0.04, 0.06, 0.02]} pos={[0.06, 0.64, 0.115]} color="#1a1a1a" />
		</group>
	);
};

// ---------- Office bits ----------
export const Crt: React.FC<{pos: V3; rotY?: number; screen?: string; glow?: number; children?: React.ReactNode; s?: number}> = ({pos, rotY = 0, screen = '#3aff8a', glow = 1, children, s = 1}) => (
	<group position={pos} rotation={[0, rotY, 0]} scale={s}>
		<RBox size={[1.6, 1.35, 1.4]} pos={[0, 0.75, -0.25]} color="#d8cfb8" />
		<RBox size={[1.3, 1.0, 0.6]} pos={[0, 0.8, -1.1]} color="#cbc2aa" />
		<RBox size={[1.32, 1.06, 0.06]} pos={[0, 0.78, 0.46]} color="#2a2a2a" />
		<Glow size={[1.16, 0.9, 0.04]} pos={[0, 0.78, 0.49]} color={screen} i={glow} />
		<RBox size={[0.3, 0.06, 0.04]} pos={[0.5, 0.15, 0.46]} color="#8a8270" />
		<RBox size={[1.0, 0.12, 0.8]} pos={[0, 0.06, -0.1]} color="#cbc2aa" />
		{glow > 0.2 ? <pointLight position={[0, 0.8, 1.2]} color={screen} intensity={1.5 * glow} distance={4} /> : null}
		<group position={[0, 0.78, 0.52]}>{children}</group>
	</group>
);

export const Keyboard: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
	<group position={pos} rotation={[0, rotY, 0]}>
		<RBox size={[1.5, 0.1, 0.55]} pos={[0, 0.05, 0]} color="#d4ccb4" />
		{Array.from({length: 4}).map((_, r) =>
			Array.from({length: 12}).map((_, c) => <RBox key={`${r}-${c}`} size={[0.09, 0.05, 0.09]} pos={[-0.6 + c * 0.11, 0.12, -0.18 + r * 0.12]} color={r === 3 && c > 3 && c < 9 ? '#c8c0a8' : '#efe8d4'} />),
		)}
	</group>
);

export const Mug: React.FC<{pos: V3; color?: string; steam?: number}> = ({pos, color = '#c8402a', steam = 0}) => (
	<group position={pos}>
		<mesh castShadow>
			<cylinderGeometry args={[0.14, 0.13, 0.3, 10]} />
			<meshStandardMaterial color={color} roughness={0.5} flatShading />
		</mesh>
		<mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
			<circleGeometry args={[0.12, 10]} />
			<meshStandardMaterial color="#6a3a1a" />
		</mesh>
		<RBox size={[0.05, 0.16, 0.12]} pos={[0.17, 0, 0]} color={color} />
		{steam > 0
			? [0, 1, 2].map((i) => (
					<mesh key={i} position={[Math.sin(steam + i) * 0.05, 0.3 + ((steam * 0.3 + i * 0.25) % 0.7), 0]}>
						<boxGeometry args={[0.06, 0.06, 0.06]} />
						<meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
					</mesh>
			  ))
			: null}
	</group>
);

export const FloppyStack: React.FC<{pos: V3; n?: number; seed?: number}> = ({pos, n = 6, seed = 3}) => {
	const r = seeded(seed);
	const cols = ['#1a1a1a', '#2a4a8a', '#a82a2a', '#2a7a4a', '#d8c040'];
	return (
		<group position={pos}>
			{Array.from({length: n}).map((_, i) => (
				<group key={i} position={[(r() - 0.5) * 0.06, 0.03 + i * 0.05, (r() - 0.5) * 0.06]} rotation={[0, (r() - 0.5) * 0.4, 0]}>
					<RBox size={[0.5, 0.04, 0.5]} color={cols[i % cols.length]} />
					<RBox size={[0.3, 0.045, 0.14]} pos={[0, 0, -0.17]} color="#b8bcc2" />
				</group>
			))}
		</group>
	);
};

export const PizzaBoxStack: React.FC<{pos: V3; n?: number; rotY?: number}> = ({pos, n = 3, rotY = 0}) => (
	<group position={pos} rotation={[0, rotY, 0]}>
		{Array.from({length: n}).map((_, i) => (
			<group key={i} position={[Math.sin(i * 2) * 0.08, 0.08 + i * 0.17, 0]} rotation={[0, Math.sin(i * 3) * 0.12, 0]}>
				<RBox size={[1.3, 0.15, 1.3]} color="#d8b884" />
				<RBox size={[0.6, 0.01, 0.6]} pos={[0, 0.08, 0]} color="#c8402a" />
			</group>
		))}
	</group>
);

// Flip-number counter (each digit a block tile that flips when it changes).
export const FlipCounter: React.FC<{value: string; pos: V3; size?: number; color?: string; tile?: string; flip?: number}> = ({value, pos, size = 0.9, color = '#f4f4ee', tile = '#1a1a1e', flip = 0}) => (
	<group position={pos}>
		{value.split('').map((ch, i) => {
			const x = (i - (value.length - 1) / 2) * size * 0.78;
			const isSep = ch === ',' || ch === '$';
			return (
				<group key={i} position={[x, 0, 0]} rotation={[isSep ? 0 : flip * ((i * 7) % 3 === 0 ? 1 : 0), 0, 0]}>
					{!isSep ? <RBox size={[size * 0.7, size, size * 0.3]} color={tile} /> : null}
					<BlockText text={ch} size={size * (isSep ? 0.6 : 0.62)} depth={0.06} color={ch === '$' ? '#3fbf6a' : color} position={[0, 0, size * 0.18]} />
				</group>
			);
		})}
	</group>
);

// Game box (our own cover: block cop car + road stripe), used in shop and launch night.
export const GameBox: React.FC<{pos?: V3; rot?: V3; s?: number; tint?: string; label?: string}> = ({pos, rot, s = 1, tint = '#1a1a1e', label = 'GTA'}) => (
	<group position={pos} rotation={rot} scale={s}>
		<RBox size={[1.0, 1.36, 0.16]} color={tint} />
		<RBox size={[0.86, 0.5, 0.02]} pos={[0, -0.18, 0.09]} color="#3a3d46" />
		<RBox size={[0.86, 0.04, 0.02]} pos={[0, -0.24, 0.1]} color="#f2c21a" />
		<RBox size={[0.4, 0.14, 0.03]} pos={[0, -0.1, 0.1]} color="#f4f4f0" />
		<RBox size={[0.18, 0.06, 0.03]} pos={[0, -0.0, 0.1]} color="#2a5aff" />
		<BlockText text={label} size={0.22} depth={0.03} color="#f4f4f0" position={[0, 0.38, 0.1]} />
		<RBox size={[0.86, 0.04, 0.02]} pos={[0, 0.22, 0.09]} color="#3fbf6a" />
	</group>
);

// Rain streaks (instanced), animated by frame.
export const Rain: React.FC<{frame: number; n?: number; area?: V3; center?: V3; color?: string; speed?: number}> = ({frame, n = 400, area = [30, 20, 20], center = [0, 0, 0], color = '#a8b8d0', speed = 0.9}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const drops = useMemo(() => {
		const r = seeded(77);
		return Array.from({length: n}, () => [r() * area[0] - area[0] / 2, r() * area[1], r() * area[2] - area[2] / 2]);
	}, [n, area[0], area[1], area[2]]);
	useLayoutEffect(() => {
		const m = ref.current!;
		const o = new THREE.Object3D();
		drops.forEach(([x, y0, z], i) => {
			const y = (((y0 - frame * speed) % area[1]) + area[1]) % area[1];
			o.position.set(center[0] + x, center[1] + y, center[2] + z);
			o.scale.set(0.03, 0.5, 0.03);
			o.rotation.z = 0.12;
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
	}, [frame, drops]);
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, n]}>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color={color} transparent opacity={0.45} emissive={color} emissiveIntensity={0.3} />
		</instancedMesh>
	);
};

// A sticky note with block text.
export const Sticky: React.FC<{pos: V3; rot?: V3; text: string; color?: string; size?: number}> = ({pos, rot, text, color = '#f8e26a', size = 0.18}) => (
	<group position={pos} rotation={rot}>
		<RBox size={[size * 5.2, size * 3.4, 0.03]} color={color} />
		<BlockText text={text} size={size} depth={0.02} color="#2a2a30" position={[0, 0, 0.03]} />
	</group>
);

// Voxel "bug" glitch: a cluster of bright cubes bursting out.
export const GlitchBurst: React.FC<{pos: V3; t: number; n?: number; spread?: number; seed?: number}> = ({pos, t, n = 26, spread = 1.4, seed = 5}) => {
	const bits = useMemo(() => {
		const r = seeded(seed);
		const cols = ['#ff2a6a', '#2aff9a', '#2a8aff', '#ffffff', '#ff2a2a'];
		return Array.from({length: n}, () => ({d: [r() - 0.5, r() * 0.8 + 0.1, r() - 0.5], s: 0.08 + r() * 0.16, c: cols[Math.floor(r() * cols.length)]}));
	}, [n, seed]);
	if (t <= 0 || t >= 1.2) return null;
	return (
		<group position={pos}>
			{bits.map((b, i) => {
				const k = t * spread * (0.5 + (i % 5) * 0.2);
				return (
					<mesh key={i} position={[b.d[0] * k * 2, b.d[1] * k * 1.6 - t * t * 0.6, b.d[2] * k * 2]} scale={b.s * (1.2 - t)}>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial color={b.c} emissive={b.c} emissiveIntensity={2} toneMapped={false} />
					</mesh>
				);
			})}
		</group>
	);
};

// Sparks burst on impact.
export const Sparks: React.FC<{pos: V3; t: number; n?: number}> = ({pos, t, n = 18}) => {
	const bits = useMemo(() => {
		const r = seeded(31);
		return Array.from({length: n}, () => [r() - 0.5, r() * 0.9, r() - 0.5, 0.6 + r()]);
	}, [n]);
	if (t <= 0 || t > 1) return null;
	return (
		<group position={pos}>
			{bits.map(([x, y, z, v], i) => (
				<mesh key={i} position={[x * t * 3 * v, y * t * 2.4 * v - t * t * 1.4, z * t * 3 * v]} scale={0.07 * (1 - t) + 0.02}>
					<boxGeometry args={[1, 1, 1]} />
					<meshStandardMaterial color="#ffd070" emissive="#ffb040" emissiveIntensity={4} toneMapped={false} />
				</mesh>
			))}
		</group>
	);
};

// Soft puffs of dust / smoke.
export const Puffs: React.FC<{pos: V3; t: number; n?: number; color?: string; r?: number}> = ({pos, t, n = 8, color = '#c8c0b0', r = 1.6}) => {
	if (t <= 0 || t > 1.4) return null;
	return (
		<group position={pos}>
			{Array.from({length: n}).map((_, i) => {
				const a = (i / n) * Math.PI * 2;
				return (
					<mesh key={i} position={[Math.cos(a) * r * Math.min(1, t * 1.5), 0.2 + t * 0.5 + (i % 3) * 0.15, Math.sin(a) * r * Math.min(1, t * 1.5)]} scale={0.35 + t * 0.4}>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial color={color} transparent opacity={Math.max(0, 0.7 - t * 0.5)} />
					</mesh>
				);
			})}
		</group>
	);
};
