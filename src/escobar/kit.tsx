import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {onTwos} from '../anim';
import {lambert, px, speckle, tex64} from '../ps1/ps1';
import {B, Cyl} from '../ps1/sets';

// Escobar v2 production kit: the AMBIENT layer (clouds, birds, motes, fireflies, steam, water) and
// improved hero assets (hippo v2, Piper Super Cub, Medellín brick hillsides) + character life helpers.

const PI = Math.PI;
type V3 = [number, number, number];
const rnd = (seed: number) => {
	let s = seed;
	return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
};

// ---------- character life: blinks + idle weight shifts ----------
const OPEN_FACES = new Set(['smile', 'serious', 'talkA', 'talkB', 'shock', 'proud', 'sad']);
export const blink = (face: string | undefined, f: number, phase = 0) => {
	const t = (onTwos(f) + Math.round(phase * 37)) % 92;
	return face && OPEN_FACES.has(face) && t < 4 ? 'closed' : face;
};
export const life = <T extends {face?: string}>(p: T, f: number, phase = 0, amount = 1): T => {
	const ff = onTwos(f);
	const out = {...p} as T & Record<string, number | string | undefined>;
	const add = (k: string, v: number) => (out[k] = ((out[k] as number | undefined) ?? 0) + v);
	add('side', Math.sin(ff / 41 + phase) * 0.035 * amount); // weight shift
	add('headY', Math.sin(ff / 57 + phase * 2) * 0.12 * amount); // look around
	add('headX', Math.sin(ff / 33 + phase) * 0.03 * amount);
	add('armRZ', Math.sin(ff / 41 + phase) * 0.03 * amount);
	add('armLZ', -Math.sin(ff / 41 + phase) * 0.03 * amount);
	out.face = blink(p.face, f, phase);
	return out;
};

// ---------- ambient layer ----------
export const Clouds: React.FC<{f: number; n?: number; y?: number; z?: number; spread?: number; color?: string; speed?: number}> = ({f, n = 8, y = 26, z = -70, spread = 120, color = '#fff4e8', speed = 0.03}) => {
	const cl = useMemo(() => {
		const r = rnd(5);
		return Array.from({length: n}, () => ({x: (r() - 0.5) * spread, y: y + r() * 10, z: z - r() * 30, s: 3 + r() * 4}));
	}, [n, y, z, spread]);
	const mat = useMemo(() => new THREE.MeshLambertMaterial({color, flatShading: true, emissive: color, emissiveIntensity: 0.35}), [color]);
	return (
		<group>
			{cl.map((c, i) => (
				<group key={i} position={[((c.x + f * speed * (1 + (i % 3) * 0.4) + spread / 2) % spread) - spread / 2, c.y, c.z]} scale={c.s}>
					{[[0, 0, 0, 1.4], [1.3, -0.2, 0.2, 1.0], [-1.2, -0.3, -0.1, 0.9], [0.4, 0.5, 0, 0.9]].map(([x, yy, zz, r], k) => (
						<mesh key={k} position={[x, yy, zz]} material={mat}>
							<icosahedronGeometry args={[r, 0]} />
						</mesh>
					))}
				</group>
			))}
		</group>
	);
};

export const Birds: React.FC<{f: number; n?: number; from?: V3; dir?: V3; color?: string; start?: number}> = ({f, n = 7, from = [-30, 14, -40], dir = [0.25, 0.02, 0.05], color = '#1a1a1a', start = 0}) => {
	const t = Math.max(0, f - start);
	return (
		<group position={[from[0] + dir[0] * t, from[1] + dir[1] * t, from[2] + dir[2] * t]}>
			{Array.from({length: n}, (_, i) => {
				const flap = Math.sin(onTwos(f) * 0.9 + i) * 0.6;
				const off: V3 = [-Math.abs(i - n / 2) * 0.9, Math.sin(i * 1.7) * 0.4, (i - n / 2) * 0.9];
				return (
					<group key={i} position={off}>
						<B size={[0.6, 0.08, 0.12]} pos={[-0.25, 0, 0]} rot={[0, 0, flap]} color={color} shadow={false} />
						<B size={[0.6, 0.08, 0.12]} pos={[0.25, 0, 0]} rot={[0, 0, -flap]} color={color} shadow={false} />
					</group>
				);
			})}
		</group>
	);
};

// Instanced drifting particles: dust motes in light beams, pollen, embers or fireflies.
export const Motes: React.FC<{f: number; n?: number; center?: V3; size?: V3; color?: string; glow?: number; s?: number; rise?: number; seed?: number}> = ({
	f,
	n = 120,
	center = [0, 3, 0],
	size = [10, 6, 6],
	color = '#fff0c8',
	glow = 2,
	s = 0.05,
	rise = 0.004,
	seed = 7,
}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => new THREE.BoxGeometry(s, s, s), [s]);
	const mat = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color(color).multiplyScalar(glow), toneMapped: false}), [color, glow]);
	const pts = useMemo(() => {
		const r = rnd(seed);
		return Array.from({length: n}, () => [r(), r(), r(), r() * 6.28]);
	}, [n, seed]);
	const ff = onTwos(f);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		pts.forEach(([a, b, c, ph], i) => {
			const y = (b * size[1] + ff * rise * 30 * (0.5 + a)) % size[1];
			m.makeTranslation(center[0] + (a - 0.5) * size[0] + Math.sin(ff * 0.03 + ph) * 0.4, center[1] - size[1] / 2 + y, center[2] + (c - 0.5) * size[2] + Math.cos(ff * 0.025 + ph) * 0.4);
			ref.current!.setMatrixAt(i, m);
		});
		ref.current!.instanceMatrix.needsUpdate = true;
	});
	return <instancedMesh ref={ref} args={[geo, mat, n]} />;
};

// Rising smoke/steam column from low-poly puffs.
export const Smoke: React.FC<{f: number; pos: V3; n?: number; h?: number; color?: string; ember?: boolean; spread?: number; scale?: number}> = ({f, pos, n = 14, h = 20, color = '#5a5660', ember, spread = 0.2, scale = 1}) => (
	<group position={pos}>
		{Array.from({length: n}, (_, i) => {
			const y = ((i * (h / n) + f * 0.06 * scale) % h) + 0.5;
			const k = y / h;
			return (
				<mesh key={i} position={[Math.sin(i * 1.7 + f * 0.01) * (0.5 + y * spread), y, Math.cos(i * 2.3) * (0.4 + y * spread * 0.6)]} scale={(0.8 + y * 0.12) * scale} rotation={[i, f * 0.004 * (i % 2 ? 1 : -1), 0]}>
					<icosahedronGeometry args={[1.3, 0]} />
					<meshLambertMaterial color={ember && k < 0.18 ? '#c8642a' : color} emissive={ember && k < 0.25 ? '#ff5a1a' : '#000000'} emissiveIntensity={ember ? Math.max(0, 1 - k * 4) * 1.5 : 0} flatShading transparent opacity={0.95 - k * 0.55} />
				</mesh>
			);
		})}
	</group>
);

// ---------- living water ----------
const waterTex = (deep: string, mid: string, hi: string) =>
	tex64((g) => {
		px(g, deep, 0, 0, 64, 64);
		const r = rnd(4);
		for (let i = 0; i < 90; i++) px(g, mid, Math.floor(r() * 64), Math.floor(r() * 64), 4 + Math.floor(r() * 8), 1);
		for (let i = 0; i < 30; i++) px(g, hi, Math.floor(r() * 64), Math.floor(r() * 64), 2 + Math.floor(r() * 3), 1);
	});
export const Water: React.FC<{f: number; size?: number; y?: number; deep?: string; mid?: string; hi?: string; flow?: [number, number]}> = ({f, size = 240, y = 0, deep = '#4a4a34', mid = '#5e5c40', hi = '#e8d8a8', flow = [0.0, 0.004]}) => {
	const {mat, glint} = useMemo(() => {
		const t = waterTex(deep, mid, hi);
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set(size / 6, size / 6);
		const gl = waterTex('#000000', '#000000', '#ffffff');
		gl.wrapS = gl.wrapT = THREE.RepeatWrapping;
		gl.repeat.set(size / 9, size / 9);
		return {mat: lambert({map: t}), glint: new THREE.MeshBasicMaterial({map: gl, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.55, depthWrite: false})};
	}, [deep, mid, hi, size]);
	const ff = onTwos(f);
	(mat.map as THREE.Texture).offset.set(ff * flow[0], ff * flow[1]);
	(glint.map as THREE.Texture).offset.set(-ff * flow[0] * 0.7, ff * flow[1] * 1.6);
	return (
		<group position={[0, y, 0]}>
			<mesh rotation={[-PI / 2, 0, 0]} material={mat} receiveShadow>
				<planeGeometry args={[size, size]} />
			</mesh>
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.02, 0]} material={glint}>
				<planeGeometry args={[size, size]} />
			</mesh>
		</group>
	);
};

// Expanding ripple rings (for anything sitting in the water).
export const Ripples: React.FC<{f: number; pos: V3; r?: number; n?: number}> = ({f, pos, r = 2, n = 3}) => {
	const ff = onTwos(f);
	return (
		<group position={[pos[0], pos[1] + 0.04, pos[2]]}>
			{Array.from({length: n}, (_, i) => {
				const k = ((ff / 40 + i / n) % 1 + 1) % 1;
				return (
					<mesh key={i} rotation={[-PI / 2, 0, 0]} scale={r * (0.6 + k * 1.2)}>
						<ringGeometry args={[0.92, 1, 16]} />
						<meshBasicMaterial color="#e8dcc0" transparent opacity={(1 - k) * 0.5} depthWrite={false} />
					</mesh>
				);
			})}
		</group>
	);
};

// ---------- hippo v2 ----------
// real hippo skin: grey-brown with pinkish undertones, wet sheen speckles, pink belly/creases
const hippoTex = (base: string) => tex64((g) => (px(g, base, 0, 0, 32, 32), speckle(g, 32, 32, ['#5c4a44', '#7e6a60', '#94786a', '#a8948a'], 110, 6)), 32, 32);
export const HippoV2: React.FC<{f: number; pos?: V3; rot?: number; s?: number; sub?: number; jaw?: number; walk?: boolean; phase?: number}> = ({f, pos = [0, 0, 0], rot = 0, s = 1, sub = 0, jaw = 0, walk, phase = 0}) => {
	const m = useMemo(() => lambert({map: hippoTex('#7e6a60')}), []);
	const pink = useMemo(() => lambert({color: '#d89a94'}), []);
	const dark = useMemo(() => lambert({color: '#1e1418'}), []);
	const cream = useMemo(() => lambert({color: '#f2ead8'}), []);
	const gum = useMemo(() => lambert({color: '#c0606a'}), []);
	const tongue = useMemo(() => lambert({color: '#b04a58'}), []);
	const throat = useMemo(() => lambert({color: '#3a1418'}), []);
	const ff = onTwos(f);
	const breathe = Math.sin(ff / 18 + phase) * 0.04;
	const ear = Math.sin(ff * 0.7 + phase) > 0.85 ? 0.5 : 0;
	const step = walk ? Math.sin(ff * 0.35 + phase) : 0;
	return (
		<group position={[pos[0], pos[1] - sub + (walk ? Math.abs(step) * 0.08 : Math.sin(ff / 25 + phase) * 0.05), pos[2]]} rotation={[0, rot, walk ? step * 0.03 : 0]} scale={s}>
			{/* barrel body: stacked boxes for a rounder silhouette */}
			<B size={[2.0, 1.5 + breathe, 3.4]} pos={[0, 1.45, 0]} mat={m} />
			<B size={[1.7, 0.4, 3.0]} pos={[0, 2.3, -0.1]} mat={m} />
			<B size={[2.2, 1.0, 2.8]} pos={[0, 1.3, 0]} mat={m} />
			<B size={[1.4, 1.2, 0.6]} pos={[0, 1.5, -1.9]} mat={m} />
			{[-0.65, 0.65].map((x, i) =>
				[-1.1, 1.1].map((z, j) => <B key={`${x}${z}`} size={[0.6, 0.9, 0.6]} pos={[x, 0.45, z]} rot={[((i + j) % 2 ? 1 : -1) * step * 0.35, 0, 0]} mat={m} />),
			)}
			{/* head: wide box skull, eyes/ears/nostrils raised on top */}
			<group position={[0, 1.85, 2.0]} rotation={[-jaw * 0.25, 0, 0]}>
				<B size={[1.5, 1.0, 1.0]} mat={m} />
				<B size={[1.7, 0.75, 1.3]} pos={[0, -0.05, 1.05]} mat={m} />
				<B size={[1.8, 0.4, 0.5]} pos={[0, 0.12, 1.55]} mat={m} />
				{[-0.5, 0.5].map((x) => (
					<group key={x}>
						<B size={[0.38, 0.3, 0.38]} pos={[x, 0.55, -0.05]} mat={m} />
						<B size={[0.26, 0.2, 0.06]} pos={[x, 0.6, 0.15]} mat={cream} />
						<B size={[0.14, 0.14, 0.07]} pos={[x, 0.6, 0.17]} mat={dark} />
						<B size={[0.22, 0.28, 0.12]} pos={[x * 1.15, 0.72, -0.45]} rot={[ear, 0, x * 0.4]} mat={m} />
						<B size={[0.2, 0.12, 0.2]} pos={[x * 0.55, 0.38, 1.65]} mat={dark} />
					</group>
				))}
				{/* lower jaw opens for the yawn */}
				<group position={[0, -0.4, 0.5]} rotation={[jaw * 1.1, 0, 0]}>
					<B size={[1.6, 0.4, 1.4]} pos={[0, -0.15, 0.7]} mat={m} />
					<B size={[1.4, 0.06, 1.25]} pos={[0, 0.07, 0.7]} mat={pink} />
					{/* raised gum rims, tongue, big lower canines (tusks) and forward incisors */}
					{[-0.66, 0.66].map((x) => <B key={x} size={[0.14, 0.12, 1.2]} pos={[x, 0.1, 0.7]} mat={gum} />)}
					<B size={[0.8, 0.2, 0.85]} pos={[0, 0.16, 0.5]} mat={tongue} />
					{/* teeth only show once the mouth opens (closed hippos hide them) */}
					{jaw > 0.1 ? [-0.6, 0.6].map((x) => <B key={x} size={[0.2, 0.6, 0.2]} pos={[x, 0.34, 1.22]} rot={[0.15, 0, x * 0.25]} mat={cream} />) : null}
					{jaw > 0.1 ? [-0.3, -0.1, 0.1, 0.3].map((x) => <B key={x} size={[0.1, 0.1, 0.3]} pos={[x, 0.08, 1.42]} rot={[-0.3, 0, 0]} mat={cream} />) : null}
				</group>
				{jaw > 0.15 ? (
					<>
						<B size={[1.5, 0.05, 1.25]} pos={[0, -0.44, 1.05]} mat={pink} />
						<B size={[1.3, 0.7, 0.1]} pos={[0, -0.6, 0.42]} mat={throat} />
						{[-0.6, 0.6].map((x) => <B key={x} size={[0.13, 0.28, 0.13]} pos={[x, -0.55, 1.45]} mat={cream} />)}
					</>
				) : null}
			</group>
			<B size={[0.12, 0.5, 0.12]} pos={[0, 1.6, -2.2]} rot={[0.6 + Math.sin(ff * 0.5) * 0.3, 0, 0]} mat={m} />
		</group>
	);
};

// ---------- Piper PA-18 Super Cub (high wing taildragger) ----------
export const SuperCub: React.FC<{prop?: number; c?: string; trim?: string}> = ({prop = 0, c = '#f2d040', trim = '#1a1a1a'}) => (
	<group>
		{/* fuselage tapers to the tail */}
		<B size={[1.0, 1.1, 2.4]} pos={[0, 1.7, 1.2]} color={c} />
		<B size={[0.8, 0.85, 1.8]} pos={[0, 1.75, -0.8]} color={c} />
		<B size={[0.5, 0.55, 1.6]} pos={[0, 1.85, -2.4]} color={c} />
		<B size={[1.02, 0.12, 5.6]} pos={[0, 1.45, -0.6]} color={trim} />
		{/* cabin windows + high wing on struts */}
		<B size={[1.04, 0.5, 1.1]} pos={[0, 2.05, 0.9]} color="#7aa8d0" />
		<B size={[10, 0.14, 1.4]} pos={[0, 2.4, 0.9]} color={c} />
		{[-1.6, 1.6].map((x) => <B key={x} size={[0.06, 0.9, 0.06]} pos={[x, 1.95, 0.9]} rot={[0, 0, x > 0 ? -0.6 : 0.6]} color="#3a3a3a" />)}
		{/* tail */}
		<B size={[2.6, 0.08, 0.7]} pos={[0, 1.9, -3.1]} color={c} />
		<B size={[0.08, 1.0, 0.8]} pos={[0, 2.4, -3.15]} color={c} />
		<B size={[0.1, 0.3, 0.4]} pos={[0, 2.85, -3.2]} color={trim} />
		{/* engine cowl + spinning prop */}
		<B size={[0.9, 0.9, 0.5]} pos={[0, 1.65, 2.6]} color="#2a2a2a" />
		<group position={[0, 1.65, 2.9]} rotation={[0, 0, prop]}>
			<B size={[0.1, 2.0, 0.06]} color="#3a3a3a" shadow={false} />
		</group>
		{/* gear: two mains + tail wheel */}
		{[-0.7, 0.7].map((x) => (
			<group key={x}>
				<B size={[0.08, 1.0, 0.08]} pos={[x, 0.75, 1.5]} rot={[0, 0, x > 0 ? -0.3 : 0.3]} color="#2a2a2a" />
				<Cyl r={0.3} h={0.18} seg={8} pos={[x * 1.2, 0.3, 1.5]} rot={[0, 0, PI / 2]} color="#141414" />
			</group>
		))}
		<Cyl r={0.12} h={0.1} seg={6} pos={[0, 1.2, -3.2]} rot={[0, 0, PI / 2]} color="#141414" />
	</group>
);

// ---------- Medellín: red-brick houses climbing the slopes ----------
export const BrickHillside: React.FC<{center?: V3; w?: number; rows?: number; slope?: number; night?: number; seed?: number; rot?: number}> = ({center = [0, 0, -60], w = 140, rows = 9, slope = 3.2, night = 0, seed = 3, rot = 0}) => {
	const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
	const mat = useMemo(() => new THREE.MeshLambertMaterial({color: '#ffffff', flatShading: true}), []);
	const win = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color('#ffc870').multiplyScalar(2.5), toneMapped: false}), []);
	const houses = useMemo(() => {
		const r = rnd(seed);
		const out: {p: V3; s: V3; c: string; roof: string; lit: boolean}[] = [];
		for (let row = 0; row < rows; row++)
			for (let x = -w / 2; x < w / 2; x += 3.4 + r() * 1.6) {
				const h = 2.4 + r() * 3;
				out.push({
					p: [x, row * slope + h / 2, -row * 5 - r() * 2],
					s: [2.6 + r() * 1.4, h, 2.6 + r() * 1.2],
					c: ['#a8543a', '#b8664a', '#9a4a30', '#c8784a', '#e8d8c0', '#d8a878'][Math.floor(r() * 6)],
					roof: r() < 0.6 ? '#8a3a24' : '#8a8a88',
					lit: r() < 0.45,
				});
			}
		return out;
	}, [w, rows, slope, seed]);
	const ref = useRef<THREE.InstancedMesh>(null);
	const roofRef = useRef<THREE.InstancedMesh>(null);
	const winRef = useRef<THREE.InstancedMesh>(null);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		const c = new THREE.Color();
		let k = 0;
		houses.forEach((h, i) => {
			m.compose(new THREE.Vector3(...h.p), new THREE.Quaternion(), new THREE.Vector3(...h.s));
			ref.current!.setMatrixAt(i, m);
			ref.current!.setColorAt(i, c.set(h.c));
			m.compose(new THREE.Vector3(h.p[0], h.p[1] + h.s[1] / 2 + 0.15, h.p[2]), new THREE.Quaternion(), new THREE.Vector3(h.s[0] + 0.3, 0.3, h.s[2] + 0.3));
			roofRef.current!.setMatrixAt(i, m);
			roofRef.current!.setColorAt(i, c.set(h.roof));
			if (h.lit && night > 0) {
				m.compose(new THREE.Vector3(h.p[0], h.p[1], h.p[2] + h.s[2] / 2 + 0.02), new THREE.Quaternion(), new THREE.Vector3(0.6, 0.6, 0.05));
				winRef.current!.setMatrixAt(k++, m);
			}
		});
		ref.current!.instanceMatrix.needsUpdate = true;
		roofRef.current!.instanceMatrix.needsUpdate = true;
		if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
		if (roofRef.current!.instanceColor) roofRef.current!.instanceColor.needsUpdate = true;
		winRef.current!.count = k;
		winRef.current!.instanceMatrix.needsUpdate = true;
	}, [houses, night]);
	return (
		<group position={center} rotation={[0, rot, 0]}>
			<instancedMesh ref={ref} args={[geo, mat, houses.length]} castShadow receiveShadow />
			<instancedMesh ref={roofRef} args={[geo, mat, houses.length]} />
			<instancedMesh ref={winRef} args={[geo, win, houses.length]} />
			{/* the slope itself */}
			<mesh position={[0, rows * slope * 0.5 - 1, -rows * 2.5]} rotation={[Math.atan2(slope, 5), 0, 0]}>
				<boxGeometry args={[w + 20, 1, rows * 6.5]} />
				<meshLambertMaterial color="#5a6a3a" flatShading />
			</mesh>
		</group>
	);
};

