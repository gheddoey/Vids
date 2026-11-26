import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {onTwos} from '../anim';
import {flat, glow, mat, rnd, tint} from './materials';

// VEGETATION library: instanced grass/reeds that sway, guadua bamboo clumps, a buttressed ceiba,
// palms with drooping fronds, bushes, a far treeline, floating water hyacinth. All boxes /
// low icosahedra, flat-shaded, 64-px textures. Pass `f` to animate (wind on twos).
type V3 = [number, number, number];
const PI = Math.PI;

// ---------- instanced blades (grass, reeds, cattails) ----------
export type Blade = {p: V3; h: number; w?: number; lean?: number; rot?: number; c: string};
export const Blades: React.FC<{items: Blade[]; f?: number; wind?: number; shadow?: boolean}> = ({items, f = 0, wind = 1, shadow = false}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => {
		const g = new THREE.BoxGeometry(1, 1, 1);
		g.translate(0, 0.5, 0);
		// taper: pinch the top vertices so blades read as leaves, not sticks
		const p = g.attributes.position;
		for (let i = 0; i < p.count; i++) if (p.getY(i) > 0.9) (p.setX(i, p.getX(i) * 0.25), p.setZ(i, p.getZ(i) * 0.25));
		g.computeVertexNormals();
		return g;
	}, []);
	const m = useMemo(() => new THREE.MeshLambertMaterial({color: '#ffffff', flatShading: true}), []);
	const ff = onTwos(f);
	useLayoutEffect(() => {
		const o = new THREE.Object3D();
		const c = new THREE.Color();
		items.forEach((b, i) => {
			const sway = Math.sin(ff * 0.09 + b.p[0] * 0.35 + b.p[2] * 0.2) * 0.07 * wind + Math.sin(ff * 0.23 + i) * 0.02 * wind;
			o.position.set(...b.p);
			o.rotation.set(0, b.rot ?? 0, (b.lean ?? 0) + sway);
			o.scale.set(b.w ?? 0.08, b.h, b.w ?? 0.08);
			o.updateMatrix();
			ref.current!.setMatrixAt(i, o.matrix);
			ref.current!.setColorAt(i, c.set(b.c));
		});
		ref.current!.instanceMatrix.needsUpdate = true;
		if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
	});
	return <instancedMesh ref={ref} args={[geo, m, items.length]} castShadow={shadow} receiveShadow />;
};

// Scatter helper: n blades inside a box region, optional height map y(x,z) and keep-out test.
export const scatter = (
	n: number,
	area: {x: [number, number]; z: [number, number]},
	o: {seed?: number; h?: [number, number]; w?: [number, number]; cols: string[]; y?: (x: number, z: number) => number; keep?: (x: number, z: number) => boolean; lean?: number},
): Blade[] => {
	const r = rnd(o.seed ?? 11);
	const out: Blade[] = [];
	let guard = 0;
	while (out.length < n && guard++ < n * 6) {
		const x = area.x[0] + r() * (area.x[1] - area.x[0]);
		const z = area.z[0] + r() * (area.z[1] - area.z[0]);
		if (o.keep && !o.keep(x, z)) continue;
		const h = (o.h ?? [0.6, 1.4])[0] + r() * ((o.h ?? [0.6, 1.4])[1] - (o.h ?? [0.6, 1.4])[0]);
		out.push({p: [x, o.y ? o.y(x, z) : 0, z], h, w: (o.w ?? [0.06, 0.12])[0] + r() * ((o.w ?? [0.06, 0.12])[1] - (o.w ?? [0.06, 0.12])[0]), lean: (r() - 0.5) * (o.lean ?? 0.4), rot: r() * PI, c: o.cols[Math.floor(r() * o.cols.length)]});
	}
	return out;
};

// Grass tuft cluster: a fan of blades (use for foreground framing).
export const tuft = (at: V3, n: number, h: number, cols: string[], seed = 3, spread = 0.5, fan = 0.9): Blade[] => {
	const r = rnd(seed);
	return Array.from({length: n}, (_, i) => ({
		p: [at[0] + (r() - 0.5) * spread, at[1], at[2] + (r() - 0.5) * spread] as V3,
		h: h * (0.6 + r() * 0.6),
		w: 0.06 + r() * 0.08,
		lean: ((i / n) - 0.5) * fan + (r() - 0.5) * 0.2,
		rot: (i / n) * PI + r() * 0.3,
		c: cols[Math.floor(r() * cols.length)],
	}));
};

// ---------- guadua bamboo clump (Colombian riverbanks) ----------
export const Bamboo: React.FC<{pos: V3; n?: number; h?: number; seed?: number; f?: number; s?: number}> = ({pos, n = 9, h = 11, seed = 4, f = 0, s = 1}) => {
	const culm = mat('bamboo', {base: '#7a9a3a', seed}, 1, 3);
	const dry = mat('bamboo', {base: '#a89a4a', seed: seed + 1}, 1, 3);
	const leaf = mat('leaves', {base: '#4a7a2a', seed}, 1, 1);
	const leaf2 = mat('leaves', {base: '#6a8a32', seed: seed + 2}, 1, 1);
	const ff = onTwos(f);
	const stems = useMemo(() => {
		const r = rnd(seed);
		return Array.from({length: n}, (_, i) => ({a: (i / n) * PI * 2 + r() * 0.6, lean: 0.12 + r() * 0.28, h: h * (0.7 + r() * 0.45), dry: r() < 0.25, ph: r() * 6}));
	}, [n, h, seed]);
	return (
		<group position={pos} scale={s}>
			{stems.map((st, i) => {
				const sway = Math.sin(ff * 0.06 + st.ph) * 0.025;
				return (
					<group key={i} rotation={[Math.cos(st.a) * (st.lean + sway), 0, -Math.sin(st.a) * (st.lean + sway)]} position={[Math.cos(st.a) * 0.4, 0, Math.sin(st.a) * 0.4]}>
						<mesh position={[0, st.h / 2, 0]} material={st.dry ? dry : culm} castShadow>
							<boxGeometry args={[0.22, st.h, 0.22]} />
						</mesh>
						{/* feathery leaf sprays bending out near the top */}
						{[0.55, 0.7, 0.85, 1].map((k, j) => (
							<mesh key={j} position={[Math.cos(st.a + j) * 0.6, st.h * k, Math.sin(st.a + j) * 0.6]} rotation={[0.3 * j, st.a + j, 0.5]} material={j % 2 ? leaf : leaf2} castShadow>
								<boxGeometry args={[1.8 - k * 0.6, 0.12, 0.7]} />
							</mesh>
						))}
					</group>
				);
			})}
		</group>
	);
};

// ---------- big broadleaf tree (ceiba / samán): buttress roots, forked limbs, layered canopy ----------
export const BigTree: React.FC<{pos: V3; s?: number; seed?: number; f?: number; leaf?: string; trunk?: string; flowers?: string}> = ({pos, s = 1, seed = 2, f = 0, leaf = '#3e6e2a', trunk = '#8a7a66', flowers}) => {
	const bark = mat('bark', {base: trunk, seed}, 1, 3);
	const ff = onTwos(f);
	const blobs = useMemo(() => {
		const r = rnd(seed);
		return Array.from({length: 11}, (_, i) => ({p: [(r() - 0.5) * 9, 9.5 + r() * 3 + (i < 4 ? 2 : 0), (r() - 0.5) * 7] as V3, r: 1.8 + r() * 1.8, c: tint(leaf, (r() - 0.5) * 0.3, (r() - 0.5) * 0.1), sy: 0.55 + r() * 0.2}));
	}, [seed, leaf]);
	const sway = Math.sin(ff * 0.04 + seed) * 0.08;
	return (
		<group position={pos} scale={s}>
			<mesh position={[0, 4.5, 0]} material={bark} castShadow>
				<boxGeometry args={[1.3, 9, 1.3]} />
			</mesh>
			{[0, 1, 2, 3].map((i) => (
				<mesh key={i} position={[Math.cos((i * PI) / 2 + 0.4) * 0.9, 0.9, Math.sin((i * PI) / 2 + 0.4) * 0.9]} rotation={[0, -(i * PI) / 2 - 0.4, 0.35]} material={bark} castShadow>
					<boxGeometry args={[1.6, 2.2, 0.3]} />
				</mesh>
			))}
			{[-1, 1].map((k) => (
				<mesh key={k} position={[k * 1.8, 9.2, k * 0.4]} rotation={[0, 0, -k * 0.9]} material={bark} castShadow>
					<boxGeometry args={[0.6, 5, 0.6]} />
				</mesh>
			))}
			<group position={[sway, 0, 0]}>
				{blobs.map((b, i) => (
					<mesh key={i} position={b.p} scale={[1, b.sy, 1]} material={flat(b.c)} castShadow>
						<icosahedronGeometry args={[b.r, 0]} />
					</mesh>
				))}
				{flowers
					? blobs.slice(0, 6).map((b, i) => (
							<mesh key={`f${i}`} position={[b.p[0], b.p[1] + b.r * b.sy * 0.8, b.p[2]]} material={flat(flowers)}>
								<boxGeometry args={[0.5, 0.3, 0.5]} />
							</mesh>
						))
					: null}
			</group>
		</group>
	);
};

// ---------- palm with a curved trunk and drooping 3-segment fronds ----------
export const Palm2: React.FC<{pos: V3; s?: number; seed?: number; f?: number; bend?: number; h?: number}> = ({pos, s = 1, seed = 1, f = 0, bend = 0.12, h = 8}) => {
	const bark = mat('bark', {base: '#8a7a5a', seed: seed + 5}, 1, 2);
	const ff = onTwos(f);
	const segs = 6;
	let x = 0;
	let y = 0;
	const parts = Array.from({length: segs}, (_, i) => {
		const a = bend * i;
		const sh = h / segs;
		const p: V3 = [x + Math.sin(a) * sh * 0.5, y + Math.cos(a) * sh * 0.5, 0];
		x += Math.sin(a) * sh;
		y += Math.cos(a) * sh;
		return {p, a, w: 0.5 - i * 0.03};
	});
	const top: V3 = [x, y, 0];
	return (
		<group position={pos} scale={s} rotation={[0, (seed * 1.7) % (PI * 2), 0]}>
			{parts.map((q, i) => (
				<mesh key={i} position={q.p} rotation={[0, 0, -q.a]} material={bark} castShadow>
					<boxGeometry args={[q.w, h / segs + 0.05, q.w]} />
				</mesh>
			))}
			<group position={top}>
				{Array.from({length: 7}, (_, i) => {
					const a = (i / 7) * PI * 2;
					const w = Math.sin(ff * 0.08 + i * 1.3 + seed) * 0.06;
					return (
						<group key={i} rotation={[0, a, 0]}>
							{[0, 1, 2].map((k) => (
								<mesh key={k} position={[0, 0.2 - k * k * 0.35, 0.8 + k * 1.3]} rotation={[0.15 + k * 0.42 + w, 0, 0]} material={flat(k === 2 ? '#5a8a2a' : '#3e7a2a')} castShadow>
									<boxGeometry args={[0.9 - k * 0.2, 0.08, 1.5]} />
								</mesh>
							))}
						</group>
					);
				})}
				{[0, 1, 2].map((k) => (
					<mesh key={`c${k}`} position={[Math.cos(k * 2) * 0.25, -0.3, Math.sin(k * 2) * 0.25]} material={flat('#6a5a2a')}>
						<boxGeometry args={[0.3, 0.3, 0.3]} />
					</mesh>
				))}
			</group>
		</group>
	);
};

export const Bush: React.FC<{pos: V3; s?: number; c?: string; seed?: number}> = ({pos, s = 1, c = '#4a7a2e', seed = 1}) => {
	const r = rnd(seed);
	return (
		<group position={pos} scale={s}>
			{[0, 1, 2, 3].map((i) => (
				<mesh key={i} position={[(r() - 0.5) * 1.6, 0.5 + r() * 0.4, (r() - 0.5) * 1.2]} scale={[1, 0.75, 1]} material={flat(tint(c, (r() - 0.5) * 0.25))} castShadow receiveShadow>
					<icosahedronGeometry args={[0.7 + r() * 0.4, 0]} />
				</mesh>
			))}
		</group>
	);
};

// Far treeline: instanced canopy blobs on trunks along a line (cheap background forest).
export const Treeline: React.FC<{z: number; x?: [number, number]; y?: number; n?: number; seed?: number; cols?: string[]; h?: [number, number]; depth?: number}> = ({
	z,
	x = [-120, 120],
	y = 0,
	n = 80,
	seed = 9,
	cols = ['#3a6a2a', '#466e2e', '#2e5a26'],
	h = [6, 11],
	depth = 10,
}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
	const m = useMemo(() => new THREE.MeshLambertMaterial({color: '#ffffff', flatShading: true}), []);
	const items = useMemo(() => {
		const r = rnd(seed);
		return Array.from({length: n}, () => {
			const hh = h[0] + r() * (h[1] - h[0]);
			return {p: [x[0] + r() * (x[1] - x[0]), y + hh * 0.75, z - r() * depth] as V3, s: [2.5 + r() * 2.5, hh * 0.45, 2.5 + r() * 2.5] as V3, c: cols[Math.floor(r() * cols.length)]};
		});
	}, [z, x, y, n, seed, cols, h, depth]);
	useLayoutEffect(() => {
		const o = new THREE.Object3D();
		const c = new THREE.Color();
		items.forEach((t, i) => {
			o.position.set(...t.p);
			o.scale.set(...t.s);
			o.rotation.set(0, i, 0);
			o.updateMatrix();
			ref.current!.setMatrixAt(i, o.matrix);
			ref.current!.setColorAt(i, c.set(t.c));
		});
		ref.current!.instanceMatrix.needsUpdate = true;
		if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
	}, [items]);
	return <instancedMesh ref={ref} args={[geo, m, items.length]} />;
};

// Floating water hyacinth (buchón): leaf rosettes with lilac flowers, drifting with the current.
export const Hyacinth: React.FC<{pts: V3[]; f?: number; drift?: [number, number]}> = ({pts, f = 0, drift = [0.004, 0]}) => {
	const ff = onTwos(f);
	const lf = flat('#3e7a2c');
	const lf2 = flat('#52883a');
	const fl = flat('#b89ae0');
	return (
		<group>
			{pts.map((p, i) => (
				<group key={i} position={[p[0] + ff * drift[0] * 30, p[1] + Math.sin(ff * 0.1 + i) * 0.02, p[2] + ff * drift[1] * 30]} rotation={[0, i * 1.3, 0]}>
					{[0, 1, 2, 3, 4].map((k) => (
						<mesh key={k} position={[Math.cos(k * 1.26) * 0.25, 0.08, Math.sin(k * 1.26) * 0.25]} rotation={[0.45, k * 1.26, 0]} material={k % 2 ? lf : lf2}>
							<boxGeometry args={[0.32, 0.08, 0.26]} />
						</mesh>
					))}
					{i % 2 === 0 && p[2] < 2 ? (
						<mesh position={[0, 0.35, 0]} material={fl}>
							<boxGeometry args={[0.12, 0.2, 0.12]} />
						</mesh>
					) : null}
				</group>
			))}
		</group>
	);
};

// Fireflies / embers that glow (instanced, blinking).
export const Glimmers: React.FC<{pts: V3[]; f: number; color?: string}> = ({pts, f, color = '#ffe68a'}) => {
	const m = glow(color, 3);
	const ff = onTwos(f);
	return (
		<group>
			{pts.map((p, i) => (Math.sin(ff * 0.2 + i * 2.3) > 0.2 ? (
				<mesh key={i} position={[p[0] + Math.sin(ff * 0.03 + i) * 0.5, p[1] + Math.sin(ff * 0.05 + i * 2) * 0.3, p[2]]} material={m}>
					<boxGeometry args={[0.06, 0.06, 0.06]} />
				</mesh>
			) : null))}
		</group>
	);
};

// Living WATER surface: flowing 64-px texture (optionally see-through so a mirrored copy of the bank
// shows as a reflection), plus an additive glint layer that drifts the other way.
export const WaterSurface: React.FC<{f: number; size?: number; y?: number; base?: string; alt?: string; flow?: [number, number]; opacity?: number; rep?: number}> = ({
	f,
	size = 400,
	y = 0,
	base = '#5a4a34',
	alt = '#f0d8a0',
	flow = [0.004, 0.0],
	opacity = 1,
	rep = 6,
}) => {
	const {m, g} = useMemo(() => {
		const mm = mat('water', {base, alt, seed: 4}, size / rep, size / rep, opacity < 1 ? {transparent: true, opacity, depthWrite: false} : {}).clone();
		mm.map = mm.map!.clone();
		mm.map.needsUpdate = true;
		const gm = mat('water', {base: '#000000', alt: '#ffffff', seed: 9}, size / (rep * 1.5), size / (rep * 1.5)).map!.clone();
		gm.needsUpdate = true;
		return {m: mm, g: new THREE.MeshBasicMaterial({map: gm, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.2, depthWrite: false})};
	}, [base, alt, size, opacity, rep]);
	const ff = onTwos(f);
	m.map!.offset.set(ff * flow[0], ff * flow[1]);
	g.map!.offset.set(-ff * flow[0] * 0.6 + 0.3, ff * flow[1] * 1.4 + 0.2);
	return (
		<group position={[0, y, 0]}>
			<mesh rotation={[-PI / 2, 0, 0]} material={m} receiveShadow renderOrder={1}>
				<planeGeometry args={[size, size]} />
			</mesh>
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.015, 0]} material={g} renderOrder={2}>
				<planeGeometry args={[size, size]} />
			</mesh>
		</group>
	);
};

// Mirror its children below a water plane at height y (pair with a see-through WaterSurface).
export const Reflection: React.FC<{y?: number; children: React.ReactNode}> = ({y = 0, children}) => (
	<group position={[0, 2 * y, 0]} scale={[1, -1, 1]}>
		{children}
	</group>
);
