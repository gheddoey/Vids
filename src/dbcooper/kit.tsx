import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {onTwos} from '../anim';
import {BlockText} from '../BlockText';
import {lambert, px, speckle, tex64} from '../ps1/ps1';
import {B, Cyl} from '../ps1/sets';

// D.B. Cooper production kit: 1971 jet-age noir. Six rules: boxes + low-segment cylinders,
// 64-px textures painted by code, flat shading. One art department: chrome trim, mustard/brown
// fabric, teak, wet surfaces, storm teal vs amber practicals.

export const PI = Math.PI;
export type V3 = [number, number, number];
export const rnd = (seed: number) => {
	let s = seed;
	return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
};
export const rep = (t: THREE.Texture, x: number, y: number) => {
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(x, y);
	return t;
};
export const useTex = (fn: () => THREE.Texture, rx = 1, ry = 1, extra: THREE.MeshLambertMaterialParameters = {}) =>
	useMemo(() => lambert({map: rep(fn(), rx, ry), ...extra}), []); // eslint-disable-line react-hooks/exhaustive-deps
export const flashAt = (f: number, hits: number[], len = 8) => Math.max(0, ...hits.map((h) => (f >= h && f < h + len ? (1 - (f - h) / len) * (f - h < 2 ? 1 : 0.6) : 0)));

// ---------- 64-px textures ----------
export const TX = {
	seat: (a = '#a8782a', b = '#8a5e1e') => () =>
		tex64((g) => {
			px(g, a, 0, 0, 64, 64);
			for (let y = 0; y < 64; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < 64; x += 4) px(g, b, x, y, 2, 2); // woven check
			px(g, '#00000030', 0, 30, 64, 2); // tuck seam
			speckle(g, 64, 64, ['#ffffff14', '#00000018'], 90, 4);
		}),
	carpet: () =>
		tex64((g) => {
			px(g, '#5a3a22', 0, 0, 64, 64);
			for (let y = 0; y < 64; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 64; x += 16) (px(g, '#7a4a22', x, y, 8, 8), px(g, '#c87a2a', x + 3, y + 3, 2, 2));
			speckle(g, 64, 64, ['#00000022', '#8a5a32'], 160, 6);
		}),
	teak: (c = '#8a5a32') => () =>
		tex64((g) => {
			px(g, c, 0, 0, 64, 64);
			const r = rnd(9);
			for (let y = 0; y < 64; y += 2) px(g, r() < 0.5 ? '#00000014' : '#ffffff0c', 0, y, 64, 1);
			for (let i = 0; i < 8; i++) {
				const x = Math.floor(r() * 64);
				for (let y = 0; y < 64; y++) px(g, '#00000022', x + Math.round(Math.sin(y * 0.2 + i) * 2), y, 1, 1);
			}
		}),
	terrazzo: () => tex64((g) => (px(g, '#c8c0ae', 0, 0, 64, 64), speckle(g, 64, 64, ['#8a8272', '#e8e2d4', '#a89a7a', '#6a6a62'], 420, 13), px(g, '#9a9282', 0, 0, 64, 1), px(g, '#9a9282', 0, 0, 1, 64))),
	tarmac: () =>
		tex64((g) => {
			px(g, '#2a2c30', 0, 0, 64, 64);
			speckle(g, 64, 64, ['#34363a', '#222428', '#3e4044'], 500, 21);
			px(g, '#1e2024', 0, 31, 64, 2); // expansion joint
			px(g, '#1e2024', 31, 0, 2, 64);
			for (let i = 0; i < 6; i++) px(g, '#46505a', 8 + i * 9, 10 + ((i * 17) % 40), 6, 2); // wet glints
		}),
	sand: () => tex64((g) => (px(g, '#8a8270', 0, 0, 64, 64), speckle(g, 64, 64, ['#7a7260', '#9a927e', '#6a6454', '#a8a08a'], 520, 17))),
	moss: () => tex64((g) => (px(g, '#2a3a22', 0, 0, 64, 64), speckle(g, 64, 64, ['#3a4a2a', '#22301c', '#4a5a30', '#5a4a30'], 500, 5))),
	hull: () =>
		tex64((g) => {
			px(g, '#e8e8e4', 0, 0, 64, 32);
			px(g, '#a8acb0', 0, 32, 64, 32); // bare-metal belly
			px(g, '#1e3a7a', 0, 26, 64, 4); // cheatline
			px(g, '#c83a2a', 0, 30, 64, 1);
			for (let x = 2; x < 64; x += 6) px(g, '#101824', x, 22, 3, 3); // windows
			for (let x = 0; x < 64; x += 16) (px(g, '#00000014', x, 0, 1, 64)); // panel seams
			speckle(g, 64, 64, ['#00000010', '#ffffff10'], 80, 3);
			for (let x = 0; x < 64; x += 4) px(g, '#00000018', x, 40, 1, 1); // rivets
		}),
	fin: () =>
		tex64((g) => {
			px(g, '#b8281e', 0, 0, 64, 64);
			px(g, '#e8e8e4', 0, 52, 64, 12);
			px(g, '#1e3a7a', 0, 49, 64, 3);
			speckle(g, 64, 64, ['#00000016', '#ffffff10'], 70, 5);
			for (let y = 0; y < 52; y += 13) px(g, '#00000018', 0, y, 64, 1);
		}),
	metal: (c = '#8a9098') => () =>
		tex64((g) => {
			px(g, c, 0, 0, 64, 64);
			for (let x = 0; x < 64; x += 16) px(g, '#00000022', x, 0, 1, 64);
			for (let y = 0; y < 64; y += 16) px(g, '#00000022', 0, y, 64, 1);
			for (let y = 3; y < 64; y += 16) for (let x = 3; x < 64; x += 8) px(g, '#ffffff22', x, y, 1, 1);
			speckle(g, 64, 64, ['#00000014', '#ffffff10'], 60, 8);
		}),
	panelCream: () => tex64((g) => (px(g, '#e8e0cc', 0, 0, 64, 64), speckle(g, 64, 64, ['#00000010'], 60, 3), px(g, '#c8bea8', 0, 0, 64, 1), px(g, '#c8bea8', 0, 32, 64, 1))),
	plaster: (c = '#d8ccb0') => () => tex64((g) => (px(g, c, 0, 0, 64, 64), speckle(g, 64, 64, ['#00000012', '#ffffff14'], 180, 7), px(g, '#00000020', 0, 54, 64, 10))),
	wallpaper70: () =>
		tex64((g) => {
			px(g, '#8a6a3a', 0, 0, 64, 64);
			for (let y = 0; y < 64; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 64; x += 16) (px(g, '#a8823e', x + 2, y + 2, 12, 12), px(g, '#6a4e2a', x + 5, y + 5, 6, 6));
			speckle(g, 64, 64, ['#00000018'], 80, 2);
		}),
	linoleum: () =>
		tex64((g) => {
			for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) px(g, (x + y) % 32 ? '#6a6a5a' : '#8a8a72', x, y, 16, 16);
			speckle(g, 64, 64, ['#00000020', '#ffffff12'], 200, 9);
		}),
	bark: () => tex64((g) => (px(g, '#3a2a1e', 0, 0, 16, 32), speckle(g, 16, 32, ['#2a1e14', '#4a3626'], 60, 3)), 16, 32),
	bill: () =>
		tex64((g) => {
			px(g, '#d8dcc4', 0, 0, 32, 14);
			px(g, '#6a8a5a', 1, 1, 30, 12);
			px(g, '#c8d4b4', 2, 2, 28, 10);
			px(g, '#5a6a4a', 12, 3, 8, 8); // portrait oval
			px(g, '#8aa878', 14, 5, 4, 4);
			px(g, '#2a3a2a', 3, 3, 4, 2); // "20"
			px(g, '#2a3a2a', 25, 9, 4, 2);
			px(g, '#4a6a3a', 22, 3, 6, 1); // serial
		}, 32, 14),
	billEdge: () => tex64((g) => {
		for (let y = 0; y < 32; y += 2) px(g, y % 4 ? '#c8ccb4' : '#a8b490', 0, y, 32, 2);
	}, 32, 32),
	rotten: () => tex64((g) => (px(g, '#6a6a4a', 0, 0, 32, 14), speckle(g, 32, 14, ['#4a4a32', '#8a8a62', '#3a3a2a', '#7a6a4a'], 120, 3), px(g, '#4a5a3a', 12, 3, 8, 8), px(g, '#2a2a1e', 22, 3, 6, 1)), 32, 14),
	blinds: (lit = '#ffd890') => () =>
		tex64((g) => {
			px(g, '#0e1420', 0, 0, 64, 64);
			for (let y = 0; y < 64; y += 4) (px(g, '#c8c0a8', 0, y, 64, 3), px(g, lit + '55', 0, y + 1, 64, 1));
		}),
	newsprint: () =>
		tex64((g) => {
			px(g, '#e4dcc4', 0, 0, 64, 64);
			for (let c = 0; c < 4; c++) for (let y = 26; y < 62; y += 2) px(g, '#6a6458', 2 + c * 16, y, 12 - ((y * 7 + c) % 5), 1);
			px(g, '#3a3630', 4, 22, 56, 1);
			px(g, '#8a8270', 36, 28, 24, 18); // photo
			px(g, '#5a5446', 44, 32, 8, 10);
		}),
	gauge: () =>
		tex64((g) => {
			px(g, '#14161a', 0, 0, 64, 64);
			for (let y = 0; y < 64; y += 16)
				for (let x = 0; x < 64; x += 16) {
					px(g, '#2a2e34', x + 1, y + 1, 14, 14);
					px(g, '#0a0c0e', x + 3, y + 3, 10, 10);
					px(g, '#e8e4d0', x + 7, y + 4, 1, 4); // needle
					px(g, (x + y) % 32 ? '#e8b040' : '#7ae87a', x + 4, y + 11, 2, 1);
				}
		}),
	stairs: () =>
		tex64((g) => {
			px(g, '#4a4e54', 0, 0, 32, 32);
			for (let y = 0; y < 32; y += 4) (px(g, '#2a2c30', 0, y, 32, 1), px(g, '#6a7078', 0, y + 1, 32, 1));
			speckle(g, 32, 32, ['#00000022'], 30, 2);
		}, 32, 32),
	brick: () =>
		tex64((g) => {
			px(g, '#6a5a4a', 0, 0, 64, 64);
			for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? -8 : 0; x < 64; x += 16) px(g, ['#7a4a3a', '#8a5a42', '#6a3e30', '#94603e'][((x + y) / 8) & 3], x + 1, y + 1, 14, 6);
			speckle(g, 64, 64, ['#00000022'], 60, 4);
		}),
	cardboard: () => tex64((g) => (px(g, '#a88a5a', 0, 0, 32, 32), speckle(g, 32, 32, ['#9a7a4a', '#b89a6a'], 60, 3), px(g, '#8a6a3a', 0, 15, 32, 2)), 32, 32),
};

// Module-level cache so textures are painted once, not every frame.
const CACHE: Record<string, THREE.Texture> = {};
export const tx = (k: 'bill' | 'rotten' | 'newsprint' | 'billEdge') => (CACHE[k] ??= TX[k]());

// ---------- weather ----------
// Rain: instanced thin streaks, slanted by the wind; `speed` sells motion (flying = fast + flat).
export const Rain: React.FC<{f: number; n?: number; center?: V3; size?: V3; wind?: V3; len?: number; color?: string; op?: number; seed?: number}> = ({
	f,
	n = 500,
	center = [0, 6, 0],
	size = [30, 16, 30],
	wind = [0, -1.1, 0],
	len = 1.2,
	color = '#a8c0d8',
	op = 0.5,
	seed = 3,
}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => new THREE.BoxGeometry(0.035, 0.035, 1), []);
	const mat = useMemo(() => new THREE.MeshBasicMaterial({color, transparent: true, opacity: op, depthWrite: false}), [color, op]);
	const pts = useMemo(() => {
		const r = rnd(seed);
		return Array.from({length: n}, () => [r(), r(), r(), 0.7 + r() * 0.6]);
	}, [n, seed]);
	const dir = useMemo(() => new THREE.Vector3(...wind).normalize(), [wind]);
	const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir), [dir]);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		const w = new THREE.Vector3(...wind);
		const wrap = (v: number, s: number) => ((((v / s + 0.5) % 1) + 1) % 1 - 0.5) * s;
		pts.forEach(([a, b, c, sp], i) => {
			const t = f * sp;
			const p = new THREE.Vector3(wrap(a * size[0] + w.x * t, size[0]), wrap(b * size[1] + w.y * t, size[1]), wrap(c * size[2] + w.z * t, size[2]));
			m.compose(p.add(new THREE.Vector3(...center)), q, new THREE.Vector3(1, 1, len * sp));
			ref.current!.setMatrixAt(i, m);
		});
		ref.current!.instanceMatrix.needsUpdate = true;
	});
	return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} />;
};

// Racing cloud puffs (flying shots): a deck of low-poly clouds streaming past.
export const CloudDeck: React.FC<{f: number; y?: number; speed?: number; n?: number; color?: string; span?: V3; glow?: number; seed?: number}> = ({f, y = -30, speed = 1.2, n = 40, color = '#2a3a4a', span = [220, 14, 260], glow = 0.15, seed = 11}) => {
	const pts = useMemo(() => {
		const r = rnd(seed);
		return Array.from({length: n}, () => ({x: (r() - 0.5) * span[0], y: y + (r() - 0.5) * span[1], z: r() * span[2], s: 5 + r() * 9}));
	}, [n, y, span, seed]);
	const mat = useMemo(() => new THREE.MeshLambertMaterial({color, flatShading: true, emissive: color, emissiveIntensity: glow}), [color, glow]);
	return (
		<group>
			{pts.map((c, i) => {
				const z = ((c.z - f * speed) % span[2] + span[2]) % span[2] - span[2] * 0.6;
				return (
					<group key={i} position={[c.x, c.y, z]} scale={c.s}>
						{[[0, 0, 0, 1.3], [1.2, -0.2, 0.3, 1.0], [-1.1, -0.3, -0.2, 0.9], [0.3, 0.45, 0.1, 0.8]].map(([x, yy, zz, r], k) => (
							<mesh key={k} position={[x, yy, zz]} material={mat}>
								<icosahedronGeometry args={[r, 0]} />
							</mesh>
						))}
					</group>
				);
			})}
		</group>
	);
};

// Drifting fog banks (forest / river).
export const Fog: React.FC<{f: number; n?: number; center?: V3; size?: V3; color?: string; op?: number}> = ({f, n = 10, center = [0, 1, 0], size = [40, 2, 30], color = '#c8d0d4', op = 0.22}) => {
	const pts = useMemo(() => {
		const r = rnd(21);
		return Array.from({length: n}, () => [r(), r(), r(), 3 + r() * 4]);
	}, [n]);
	return (
		<group position={center}>
			{pts.map(([a, b, c, s], i) => (
				<mesh key={i} position={[((a - 0.5) * size[0] + f * 0.01 * (1 + (i % 3))) % (size[0] / 2), (b - 0.5) * size[1], (c - 0.5) * size[2]]} scale={[s * 1.8, s * 0.35, s]}>
					<icosahedronGeometry args={[1, 0]} />
					<meshLambertMaterial color={color} transparent opacity={op} depthWrite={false} flatShading />
				</mesh>
			))}
		</group>
	);
};

// ---------- vegetation ----------
// Douglas-fir forest: instanced 3-tier cones + trunk, colour-varied, for SW Washington.
export const Pines: React.FC<{area: [number, number, number, number]; n?: number; seed?: number; s?: [number, number]; dark?: number; avoid?: (x: number, z: number) => boolean}> = ({area, n = 160, seed = 5, s = [0.8, 1.6], dark = 0, avoid}) => {
	const trees = useMemo(() => {
		const r = rnd(seed);
		const out: {x: number; z: number; s: number; c: number}[] = [];
		let guard = 0;
		while (out.length < n && guard++ < n * 6) {
			const x = area[0] + r() * (area[1] - area[0]);
			const z = area[2] + r() * (area[3] - area[2]);
			if (avoid && avoid(x, z)) continue;
			out.push({x, z, s: s[0] + r() * (s[1] - s[0]), c: r()});
		}
		return out;
	}, [area, n, seed, s, avoid]);
	const tiers = [
		[0, 3.2, 2.2, 4],
		[2.4, 2.5, 1.7, 3.6],
		[4.6, 1.7, 1.1, 3.2],
	];
	const refs = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)];
	const trunk = useRef<THREE.InstancedMesh>(null);
	const geos = useMemo(() => tiers.map(([, r, , h]) => new THREE.CylinderGeometry(0, r, h, 7)), []); // eslint-disable-line react-hooks/exhaustive-deps
	const tg = useMemo(() => new THREE.CylinderGeometry(0.25, 0.35, 3, 5), []);
	const mat = useMemo(() => new THREE.MeshLambertMaterial({color: '#ffffff', flatShading: true}), []);
	const bark = useMemo(() => new THREE.MeshLambertMaterial({color: '#3a2a1e', flatShading: true}), []);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		const c = new THREE.Color();
		const cols = ['#1e3a24', '#24442a', '#2a4a2e', '#1a3220', '#30502e'];
		trees.forEach((t, i) => {
			tiers.forEach(([y0, , , h], k) => {
				m.compose(new THREE.Vector3(t.x, (2 + y0 + h / 2) * t.s, t.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.c * 6), new THREE.Vector3(t.s, t.s, t.s));
				refs[k].current!.setMatrixAt(i, m);
				c.set(cols[Math.floor(t.c * cols.length)]).multiplyScalar(1 - dark);
				refs[k].current!.setColorAt(i, c);
			});
			m.compose(new THREE.Vector3(t.x, 1.5 * t.s, t.z), new THREE.Quaternion(), new THREE.Vector3(t.s, t.s, t.s));
			trunk.current!.setMatrixAt(i, m);
		});
		refs.forEach((r) => {
			r.current!.instanceMatrix.needsUpdate = true;
			if (r.current!.instanceColor) r.current!.instanceColor.needsUpdate = true;
		});
		trunk.current!.instanceMatrix.needsUpdate = true;
	}, [trees, dark]); // eslint-disable-line react-hooks/exhaustive-deps
	return (
		<group>
			{geos.map((g, k) => (
				<instancedMesh key={k} ref={refs[k]} args={[g, mat, trees.length]} castShadow receiveShadow frustumCulled={false} />
			))}
			<instancedMesh ref={trunk} args={[tg, bark, trees.length]} castShadow frustumCulled={false} />
		</group>
	);
};

export const Fern: React.FC<{pos: V3; s?: number; rot?: number; sway?: number; c?: string}> = ({pos, s = 1, rot = 0, sway = 0, c = '#3a6a2a'}) => (
	<group position={pos} rotation={[0, rot, 0]} scale={s}>
		{[0, 1, 2, 3, 4, 5].map((i) => (
			<group key={i} rotation={[0, (i / 6) * PI * 2, 0]}>
				<B size={[0.35, 0.05, 1.6]} pos={[0, 0.4, 0.75]} rot={[-0.5 + Math.sin(sway + i) * 0.08, 0, 0]} color={i % 2 ? c : '#2e5a22'} shadow={false} />
			</group>
		))}
	</group>
);

// ---------- the Boeing 727-100 (generic 1971 livery, no airline name) ----------
// Units: ~2.6 per metre. Nose toward +z, tail toward -z, belly at y = -R. `stair` 0..1 = aft airstair down.
export const Jet727: React.FC<{stair?: number; f?: number; beacon?: boolean; gear?: boolean; lit?: number; cabinLit?: number}> = ({stair = 0, f = 0, beacon = true, gear = false, lit = 1, cabinLit = 1}) => {
	const hull = useTex(TX.hull, 6, 1);
	const fin = useTex(TX.fin, 1, 1);
	const white = useMemo(() => lambert({color: '#e8e8e4'}), []);
	const metal = useMemo(() => lambert({color: '#a8acb0'}), []);
	const dark = useMemo(() => lambert({color: '#2a2c30'}), []);
	const steps = useTex(TX.stairs, 1, 6);
	const R = 4.6;
	const blink = beacon && onTwos(f) % 30 < 4;
	const ang = -stair * 0.95;
	return (
		<group>
			{/* fuselage: octagonal tube with a tapered nose and a long tail cone */}
			<mesh rotation={[PI / 2, 0, PI / 8]} position={[0, 0, 12]} material={hull} castShadow receiveShadow>
				<cylinderGeometry args={[R, R, 84, 8, 1, true]} />
			</mesh>
			<mesh rotation={[PI / 2, 0, PI / 8]} position={[0, -0.4, 60]} material={white} castShadow>
				<cylinderGeometry args={[1.2, R, 12, 8]} />
			</mesh>
			<B size={[3.4, 1.2, 2.4]} pos={[0, 1.6, 61]} rot={[-0.5, 0, 0]} color="#141a24" />
			<mesh rotation={[PI / 2, 0, PI / 8]} position={[0, 0.6, -40]} material={white} castShadow>
				<cylinderGeometry args={[R, 1.6, 20, 8]} />
			</mesh>
			{/* cabin window glow (both sides) */}
			{[-1, 1].map((s) => (
				<B key={s} size={[0.05, 0.6, 76]} pos={[s * (R - 0.15), 1.4, 14]} color="#ffc878" glow={1.2 * cabinLit * lit} shadow={false} />
			))}
			{/* swept wings + engines-free (727 engines are all at the tail) */}
			{[-1, 1].map((s) => (
				<group key={s} position={[s * 3.5, -2.6, 16]} rotation={[0, s * 0.5, 0]}>
					<B size={[40, 0.7, 9]} pos={[s * 20, 0, 0]} mat={white} />
					<B size={[40, 0.3, 2]} pos={[s * 20, -0.2, -5]} mat={metal} />
					<B size={[0.6, 0.6, 0.6]} pos={[s * 39.5, 0.2, 2]} color={s < 0 ? '#ff2a2a' : '#2aff5a'} glow={5 * lit} shadow={false} />
				</group>
			))}
			{/* tail: swept fin (stepped boxes), T-tail stabiliser, three engines */}
			<B size={[0.9, 25, 12]} pos={[0, R + 10.5, -42]} rot={[-0.55, 0, 0]} mat={fin} />
			<B size={[1.1, 4, 18]} pos={[0, R + 1.6, -38]} mat={fin} />
			{[-1, 1].map((s) => (
				<group key={s} position={[0, R + 22.4, -50]} rotation={[0, s * 0.45, 0]}>
					<B size={[16, 0.6, 5]} pos={[s * 8, 0, 0]} mat={white} />
				</group>
			))}
			{/* centre engine: S-duct intake at the fin root + exhaust at the tail */}
			<B size={[3.2, 2.6, 6]} pos={[0, R + 1.2, -30]} mat={white} />
			<B size={[2.4, 1.8, 0.2]} pos={[0, R + 1.3, -26.9]} mat={dark} />
			<mesh rotation={[PI / 2, 0, 0]} position={[0, 2.6, -50.5]} material={dark}>
				<cylinderGeometry args={[1.5, 1.5, 1, 8]} />
			</mesh>
			{[-1, 1].map((s) => (
				<group key={s} position={[s * 7.2, 2.2, -36]}>
					<mesh rotation={[PI / 2, 0, PI / 8]} material={white} castShadow>
						<cylinderGeometry args={[2.0, 1.9, 13, 8]} />
					</mesh>
					<mesh rotation={[PI / 2, 0, PI / 8]} position={[0, 0, 6.55]} material={dark}>
						<cylinderGeometry args={[1.5, 1.5, 0.2, 8]} />
					</mesh>
					<B size={[0.12, 0.12, 13.2]} pos={[0, 1.9, 0]} mat={metal} />
					<B size={[3.4, 1.2, 6]} pos={[-s * 2.6, 0, 0]} mat={white} />
				</group>
			))}
			{/* red rotating beacons (top + belly) */}
			<B size={[0.6, 0.5, 0.9]} pos={[0, R + 0.3, 2]} color="#ff2a1a" glow={blink ? 8 : 0.6} shadow={false} />
			<B size={[0.6, 0.5, 0.9]} pos={[0, -R - 0.3, -2]} color="#ff2a1a" glow={blink ? 8 : 0.6} shadow={false} />
			{blink ? <pointLight position={[0, -R - 2, -6]} color="#ff2a1a" intensity={30} distance={40} /> : null}
			{/* landing gear (ground shots) */}
			{gear
				? [
						[0, 52],
						[-3.4, 8],
						[3.4, 8],
					].map(([x, z], i) => (
						<group key={i} position={[x, -R - 1.6, z]}>
							<B size={[0.4, 3.4, 0.4]} pos={[0, 1.2, 0]} mat={metal} />
							{[-0.6, 0.6].map((dx) => (
								<Cyl key={dx} r={0.9} h={0.6} seg={8} pos={[dx, -0.4, 0]} rot={[0, 0, PI / 2]} color="#141414" />
							))}
						</group>
					))
				: null}
			{/* AFT AIRSTAIR: hinged under the tail cone, deploys down and back into the slipstream */}
			<group position={[0, -R + 0.8, -31]} rotation={[ang, 0, 0]}>
				<B size={[2.8, 0.25, 13]} pos={[0, 0, -6.5]} mat={steps} />
				{Array.from({length: 11}, (_, i) => (
					<B key={i} size={[2.7, 0.35, 0.18]} pos={[0, 0.2, -1 - i * 1.1]} rot={[-ang, 0, 0]} color="#6a7078" />
				))}
				{[-1, 1].map((s) => (
					<group key={s}>
						<B size={[0.16, 0.7, 13]} pos={[s * 1.45, 0.4, -6.5]} color="#4a4e54" />
						<B size={[0.12, 0.12, 13]} pos={[s * 1.45, 2.6, -6.5]} color="#c8ccd0" />
						{[2, 6, 10].map((z) => (
							<B key={z} size={[0.1, 2, 0.1]} pos={[s * 1.45, 1.6, -z]} color="#c8ccd0" />
						))}
					</group>
				))}
				<B size={[2.8, 0.25, 0.4]} pos={[0, 0, -13]} color="#ffd040" glow={0.4} />
			</group>
			{/* the open stair well glows faintly from the cabin */}
			{stair > 0.05 ? (
				<>
					<B size={[2.6, 0.1, 4]} pos={[0, -R + 0.7, -33]} color="#ffcf8a" glow={1.6 * stair} shadow={false} />
					<pointLight position={[0, -R - 2, -36]} color="#ffc070" intensity={22 * stair} distance={18} decay={1.4} />
				</>
			) : null}
			{/* tail logo light washing the fin */}
			<pointLight position={[6, R + 4, -44]} color="#fff0e0" intensity={40 * lit} distance={30} decay={1.4} />
			<pointLight position={[-6, R + 4, -44]} color="#fff0e0" intensity={40 * lit} distance={30} decay={1.4} />
		</group>
	);
};

// ---------- props ----------
// Black attaché case. `half` renders one side when sliced; `open` hinges the lid; `inner` shows the "bomb".
export const Briefcase: React.FC<{open?: number; half?: -1 | 1; inner?: boolean; s?: number}> = ({open = 0, half, inner = true, s = 1}) => {
	const xs = half ? (half < 0 ? [-1.1, 0] : [0, 1.1]) : [-1.1, 1.1];
	const w = xs[1] - xs[0];
	const cx = (xs[0] + xs[1]) / 2;
	const show = (x: number) => !half || Math.sign(x) === half;
	return (
		<group scale={s}>
			<B size={[w, 0.5, 1.5]} pos={[cx, 0.25, 0]} color="#141416" />
			{[-0.74, 0.74].map((z) => <B key={z} size={[w, 0.06, 0.06]} pos={[cx, 0.5, z]} color="#8a8e94" />)}
			<B size={[w, 0.02, 1.4]} pos={[cx, 0.08, 0]} color="#5a1a1e" />
			{half ? <B size={[0.02, 0.48, 1.48]} pos={[0, 0.25, 0]} color="#3a2a1e" /> : null}
			{/* lid on a rear hinge */}
			<group position={[0, 0.5, -0.75]} rotation={[-open * 1.9, 0, 0]}>
				<B size={[w, 0.18, 1.5]} pos={[cx, 0.09, 0.75]} color="#1a1a1e" />
				{[-0.7, 0.7].filter(show).map((x) => (
					<B key={x} size={[0.25, 0.08, 0.12]} pos={[x, 0.12, 1.5]} color="#c8ccd0" />
				))}
			</group>
			{[-0.3, 0.3].filter((x) => !half || Math.sign(x) === half).map((x) => (
				<B key={x} size={[0.12, 0.12, 0.5]} pos={[x, 0.55, 0.85]} rot={[PI / 2, 0, 0]} color="#c8ccd0" />
			))}
			{inner && open > 0.2 ? (
				<group position={[0, 0.3, 0]}>
					{/* eight red sticks taped in a bundle, wires to a battery */}
					{Array.from({length: 8}, (_, i) => ({x: -0.85 + (i % 4) * 0.22, z: i < 4 ? -0.15 : 0.12})).filter((p) => show(p.x + 0.001)).map((p, i) => (
						<Cyl key={i} r={0.1} h={1.0} seg={6} pos={[p.x, 0.12, p.z]} rot={[PI / 2, 0, 0]} color="#c82a1e" />
					))}
					{show(-0.5) ? <B size={[0.95, 0.06, 0.12]} pos={[-0.52, 0.24, 0]} color="#d8d0b8" /> : null}
					{show(0.6) ? (
						<group position={[0.6, 0.1, -0.2]}>
							<B size={[0.5, 0.36, 0.7]} color="#e8c040" />
							<B size={[0.5, 0.06, 0.7]} pos={[0, 0.2, 0]} color="#141414" />
							<B size={[0.1, 0.1, 0.1]} pos={[-0.12, 0.25, -0.2]} color="#c8ccd0" />
							<B size={[0.1, 0.1, 0.1]} pos={[0.12, 0.25, -0.2]} color="#c8ccd0" />
						</group>
					) : null}
					{/* wires */}
					{[
						['#c82a1e', -0.1],
						['#1a1a1a', 0.05],
						['#e8c040', 0.2],
					].map(([c, z], i) => (
						<B key={i} size={[0.9, 0.04, 0.04]} pos={[0.05 * (half ?? 1) * 0 + 0.1, 0.3 + i * 0.02, z as number]} rot={[0, (i - 1) * 0.3, 0.1]} color={c as string} shadow={false} />
					))}
				</group>
			) : null}
		</group>
	);
};

// The folded note (felt-tip block capitals).
export const Note: React.FC<{open?: number; lines?: string[]; s?: number}> = ({open = 0, lines = [], s = 1}) => (
	<group scale={s}>
		<B size={[0.8, 0.02, 0.55]} pos={[0, 0, 0]} color="#f2eee0" />
		<group position={[0, 0.01, -0.275]} rotation={[-(1 - open) * PI * 0.98, 0, 0]}>
			<B size={[0.8, 0.02, 0.55]} pos={[0, 0, 0.275]} color="#e8e4d4" />
		</group>
		{open > 0.9
			? lines.map((t, i) => <BlockText key={i} text={t} size={0.07} depth={0.005} color="#1a1a2a" rotation={[-PI / 2, 0, 0]} position={[0, 0.02, -0.1 + i * 0.12]} />)
			: null}
	</group>
);

// Banded bundle of $20s (100 notes); `rot` for the 1980 rotten ones.
export const Bundle: React.FC<{rotten?: boolean; band?: boolean}> = ({rotten, band = true}) => {
	const face = useMemo(() => lambert({map: tx(rotten ? 'rotten' : 'bill')}), [rotten]);
	const edge = useMemo(() => lambert({map: TX.billEdge()}), []);
	const mats = useMemo(() => [edge, edge, face, edge, edge, edge], [face, edge]);
	return (
		<group>
			<mesh material={mats} castShadow receiveShadow>
				<boxGeometry args={[1.56, 0.28, 0.66]} />
			</mesh>
			{band && !rotten ? <B size={[0.25, 0.3, 0.68]} pos={[0, 0, 0]} color="#e8dcb8" /> : null}
			{rotten ? <B size={[0.5, 0.06, 0.4]} pos={[0.4, 0.15, 0.1]} rot={[0, 0.4, 0.1]} color="#5a5a3e" /> : null}
		</group>
	);
};

// Black clip-on tie with a mother-of-pearl clip (the one thing he left).
export const Tie: React.FC<{sway?: number; clip?: boolean}> = ({sway = 0, clip = true}) => (
	<group rotation={[0, 0, sway]}>
		<B size={[0.42, 0.3, 0.12]} pos={[0, 0, 0]} color="#141416" />
		<B size={[0.34, 1.4, 0.08]} pos={[0, -0.85, 0]} color="#1a1a1e" />
		<B size={[0.42, 1.0, 0.08]} pos={[0, -1.9, 0]} color="#1a1a1e" />
		<B size={[0.28, 0.28, 0.08]} pos={[0, -2.45, 0]} rot={[0, 0, PI / 4]} color="#1a1a1e" />
		<B size={[0.5, 0.1, 0.06]} pos={[0, -0.2, 0.06]} color="#c8ccd0" />
		{clip ? <B size={[0.52, 0.1, 0.06]} pos={[0, -1.0, 0.07]} color="#f2ece0" glow={0.2} /> : null}
	</group>
);

// Rotary phone, typewriter, ashtray, desk lamp, filing cabinet, teletype: 1971 office kit.
export const Phone: React.FC<{pos: V3; rot?: number; c?: string}> = ({pos, rot = 0, c = '#1a1a1a'}) => (
	<group position={pos} rotation={[0, rot, 0]}>
		<B size={[0.9, 0.35, 0.8]} pos={[0, 0.17, 0]} color={c} />
		<Cyl r={0.26} h={0.06} seg={8} pos={[0, 0.36, 0.15]} color="#e8e4da" />
		<B size={[1.0, 0.18, 0.24]} pos={[0, 0.48, -0.15]} color={c} />
		<B size={[0.22, 0.22, 0.3]} pos={[-0.42, 0.42, -0.15]} color={c} />
		<B size={[0.22, 0.22, 0.3]} pos={[0.42, 0.42, -0.15]} color={c} />
	</group>
);
export const Typewriter: React.FC<{pos: V3; rot?: number; paper?: string; c?: string; keys?: number}> = ({pos, rot = 0, paper, c = '#3a4a3a', keys = 0}) => (
	<group position={pos} rotation={[0, rot, 0]}>
		<B size={[1.8, 0.4, 1.4]} pos={[0, 0.2, 0]} color={c} />
		<B size={[1.7, 0.25, 0.7]} pos={[0, 0.45, 0.35]} rot={[0.25, 0, 0]} color="#1a1a1a" />
		{Array.from({length: 4}, (_, r) => Array.from({length: 8}, (_, k) => <B key={`${r}${k}`} size={[0.13, 0.08, 0.13]} pos={[-0.7 + k * 0.2, 0.62 - r * 0.05 + (keys && (k + r * 3 + keys) % 7 === 0 ? -0.04 : 0), 0.55 - r * 0.16]} color="#e8e4da" shadow={false} />))}
		<Cyl r={0.18} h={2.1} seg={8} pos={[0, 0.65, -0.45]} rot={[0, 0, PI / 2]} color="#1a1a1a" />
		<B size={[0.12, 0.1, 0.3]} pos={[-1.15, 0.7, -0.45]} color="#c8ccd0" />
		<B size={[1.3, 1.3, 0.02]} pos={[0, 1.35, -0.55]} rot={[-0.15, 0, 0]} color="#f2efe6" />
		{paper ? <BlockText text={paper} size={0.13} depth={0.01} color="#1a1a1a" position={[0, 1.1, -0.5]} rotation={[-0.15, 0, 0]} /> : null}
	</group>
);
export const Ashtray: React.FC<{pos: V3; smoke?: number}> = ({pos}) => (
	<group position={pos}>
		<Cyl r={0.35} h={0.12} seg={8} pos={[0, 0.06, 0]} color="#8a9098" />
		<B size={[0.35, 0.06, 0.06]} pos={[0.1, 0.15, 0]} rot={[0, 0.4, 0]} color="#f2efe6" />
		<B size={[0.06, 0.06, 0.06]} pos={[0.28, 0.15, 0.07]} color="#ff6a2a" glow={3} shadow={false} />
	</group>
);
export const DeskLamp: React.FC<{pos: V3; rot?: number; c?: string; on?: number}> = ({pos, rot = 0, c = '#2a5a3a', on = 1}) => (
	<group position={pos} rotation={[0, rot, 0]}>
		<B size={[0.6, 0.12, 0.6]} pos={[0, 0.06, 0]} color="#c8a23a" />
		<B size={[0.08, 1.2, 0.08]} pos={[0, 0.7, 0]} color="#c8a23a" />
		<B size={[1.3, 0.32, 0.5]} pos={[0, 1.4, 0.15]} color={c} />
		<B size={[1.1, 0.04, 0.3]} pos={[0, 1.22, 0.15]} color="#fff0c8" glow={4 * on} shadow={false} />
		{on ? <pointLight position={[0, 1.0, 0.2]} color="#ffd890" intensity={5 * on} distance={8} /> : null}
	</group>
);
export const Cabinet: React.FC<{pos: V3; rot?: number; c?: string; drawers?: number}> = ({pos, rot = 0, c = '#6a7068', drawers = 4}) => (
	<group position={pos} rotation={[0, rot, 0]}>
		<B size={[1.6, drawers * 1.1, 2]} pos={[0, (drawers * 1.1) / 2, 0]} color={c} />
		{Array.from({length: drawers}, (_, i) => (
			<group key={i}>
				<B size={[1.4, 0.95, 0.06]} pos={[0, 0.55 + i * 1.1, 1.02]} color="#7a8078" />
				<B size={[0.5, 0.1, 0.1]} pos={[0, 0.75 + i * 1.1, 1.08]} color="#c8ccd0" />
				<B size={[0.4, 0.18, 0.04]} pos={[0, 0.5 + i * 1.1, 1.06]} color="#f2efe6" />
			</group>
		))}
	</group>
);
// Sodium lamp post with a curved arm (airport apron / parking).
export const SodiumLamp: React.FC<{pos: V3; rot?: number; h?: number; on?: number}> = ({pos, rot = 0, h = 14, on = 1}) => (
	<group position={pos} rotation={[0, rot, 0]}>
		<B size={[0.9, 0.5, 0.9]} pos={[0, 0.25, 0]} color="#6a6a62" />
		<Cyl r={0.22} r2={0.16} h={h} seg={6} pos={[0, h / 2, 0]} color="#7a7e84" />
		<B size={[0.2, 0.2, 2.6]} pos={[0, h, 1.2]} color="#7a7e84" />
		<B size={[0.7, 0.3, 1.2]} pos={[0, h - 0.15, 2.4]} color="#4a4a48" />
		<B size={[0.5, 0.06, 0.9]} pos={[0, h - 0.33, 2.4]} color="#ffb24a" glow={6 * on} shadow={false} />
		{on ? <pointLight position={[0, h - 1, 2.4]} color="#ffa040" intensity={40 * on} distance={30} decay={1.6} /> : null}
	</group>
);
// Wet puddle: a dark glossy patch that mirrors a light colour as an emissive streak.
export const Puddle: React.FC<{pos: V3; s?: [number, number]; glint?: string}> = ({pos, s = [3, 2], glint = '#ffb24a'}) => (
	<group position={pos}>
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.015, 0]} scale={[s[0], s[1], 1]}>
			<circleGeometry args={[1, 8]} />
			<meshLambertMaterial color="#14181e" />
		</mesh>
		<B size={[s[0] * 0.15, 0.01, s[1] * 1.2]} pos={[0, 0.03, 0]} color={glint} glow={1.2} shadow={false} />
	</group>
);

// Calendar on a nail, the page flips to a given year.
export const Calendar: React.FC<{pos: V3; year: string; flip?: number}> = ({pos, year, flip = 0}) => (
	<group position={pos}>
		<B size={[0.12, 0.12, 0.3]} pos={[0, 1.55, 0.1]} color="#8a8a88" />
		<B size={[2.2, 2.9, 0.08]} pos={[0, 0, 0]} color="#f2efe6" />
		<B size={[2.2, 0.8, 0.1]} pos={[0, 1.0, 0.02]} color="#b8281e" />
		<BlockText text={year} size={0.42} depth={0.06} color="#ffffff" side="#7a1a10" position={[0, 0.8, 0.08]} />
		{Array.from({length: 5}, (_, r) => Array.from({length: 7}, (_, c) => <B key={`${r}${c}`} size={[0.2, 0.2, 0.02]} pos={[-0.84 + c * 0.28, 0.25 - r * 0.32, 0.06]} color={c === 0 ? '#c84a3a' : '#3a3a3a'} shadow={false} />))}
		{flip > 0 && flip < 1 ? (
			<group position={[0, 1.4, 0.1]} rotation={[-flip * PI * 0.9, 0, 0]}>
				<B size={[2.2, 2.8, 0.03]} pos={[0, -1.4, 0]} color="#e8e4da" />
			</group>
		) : null}
	</group>
);
