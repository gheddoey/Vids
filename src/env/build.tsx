import React, {useMemo} from 'react';
import * as THREE from 'three';
import {onTwos} from '../anim';
import {flat, glow, mat, rnd} from './materials';

// ARCHITECTURE + set dressing library: walls with real openings, framed windows/doors, rooms with
// floors AND ceilings (beams, baseboards), gable/shed roofs, a riverside stilt house, jetty, canoe,
// power lines, fences, laundry, roads and street lamps. Box-built (six rules), textured by code.
type V3 = [number, number, number];
const PI = Math.PI;

// Box with a material (castShadow + receiveShadow on by default).
export const Bx: React.FC<{s: V3; p?: V3; r?: V3; m: THREE.Material | THREE.Material[]; cast?: boolean}> = ({s, p = [0, 0, 0], r = [0, 0, 0], m, cast = true}) => (
	<mesh position={p} rotation={r} material={m} castShadow={cast} receiveShadow>
		<boxGeometry args={s} />
	</mesh>
);

// ---------- walls with openings ----------
export type Opening = {x: number; y: number; w: number; h: number}; // centre x along the wall, bottom y
// A wall of width w (along local X), height h, thickness t, split into boxes around rectangular holes.
export const Wall: React.FC<{w: number; h: number; t?: number; m: THREE.Material; holes?: Opening[]; p?: V3; r?: number}> = ({w, h, t = 0.3, m, holes = [], p = [0, 0, 0], r = 0}) => {
	const parts = useMemo(() => {
		const out: {s: V3; p: V3}[] = [];
		const xs = [-w / 2, ...holes.flatMap((o) => [o.x - o.w / 2, o.x + o.w / 2]), w / 2].sort((a, b) => a - b);
		for (let i = 0; i < xs.length - 1; i++) {
			const a = xs[i];
			const b = xs[i + 1];
			if (b - a < 1e-3) continue;
			const mid = (a + b) / 2;
			const hole = holes.find((o) => mid > o.x - o.w / 2 && mid < o.x + o.w / 2);
			if (!hole) out.push({s: [b - a, h, t], p: [mid, h / 2, 0]});
			else {
				if (hole.y > 0) out.push({s: [b - a, hole.y, t], p: [mid, hole.y / 2, 0]});
				const top = hole.y + hole.h;
				if (top < h) out.push({s: [b - a, h - top, t], p: [mid, top + (h - top) / 2, 0]});
			}
		}
		return out;
	}, [w, h, t, holes]);
	return (
		<group position={p} rotation={[0, r, 0]}>
			{parts.map((q, i) => (
				<Bx key={i} s={q.s} p={q.p} m={m} />
			))}
		</group>
	);
};

// Framed window: frame, sill, mullions, glass (lit at night if `lit`), optional open shutters.
export const Window: React.FC<{w: number; h: number; p?: V3; r?: number; frame?: string; glass?: string; lit?: string; shutters?: string; open?: number; bars?: boolean}> = ({
	w,
	h,
	p = [0, 0, 0],
	r = 0,
	frame = '#e8e0d0',
	glass = '#6a8aa0',
	lit,
	shutters,
	open = 1.2,
	bars,
}) => {
	const fm = flat(frame);
	const gm = lit ? glow(lit, 1.8) : flat(glass, {transparent: true, opacity: 0.55});
	return (
		<group position={p} rotation={[0, r, 0]}>
			<Bx s={[w, h, 0.04]} p={[0, h / 2, 0]} m={gm} cast={false} />
			<Bx s={[w + 0.2, 0.12, 0.36]} p={[0, h + 0.06, 0]} m={fm} />
			<Bx s={[w + 0.4, 0.12, 0.5]} p={[0, -0.06, 0.08]} m={fm} />
			{[-1, 1].map((k) => (
				<Bx key={k} s={[0.12, h, 0.36]} p={[(k * (w + 0.12)) / 2, h / 2, 0]} m={fm} />
			))}
			<Bx s={[0.07, h, 0.1]} p={[0, h / 2, 0.03]} m={fm} />
			<Bx s={[w, 0.07, 0.1]} p={[0, h * 0.55, 0.03]} m={fm} />
			{bars ? [-0.3, 0, 0.3].map((k) => <Bx key={k} s={[0.05, h, 0.05]} p={[k * w, h / 2, 0.12]} m={flat('#2a2a2a')} />) : null}
			{shutters
				? [-1, 1].map((k) => (
						<group key={`s${k}`} position={[(k * (w + 0.2)) / 2, 0, 0.1]} rotation={[0, k * open, 0]}>
							<Bx s={[w / 2, h, 0.08]} p={[(k * w) / 4, h / 2, 0]} m={mat('boards', {base: shutters, seed: 3 + k}, 0.5, 1)} />
						</group>
					))
				: null}
		</group>
	);
};

export const Door: React.FC<{w?: number; h?: number; p?: V3; r?: number; color?: string; frame?: string; open?: number}> = ({w = 1.3, h = 2.6, p = [0, 0, 0], r = 0, color = '#6a4a2a', frame = '#4a3a2a', open = 0}) => (
	<group position={p} rotation={[0, r, 0]}>
		{[-1, 1].map((k) => (
			<Bx key={k} s={[0.14, h + 0.1, 0.4]} p={[(k * (w + 0.14)) / 2, h / 2, 0]} m={flat(frame)} />
		))}
		<Bx s={[w + 0.42, 0.16, 0.4]} p={[0, h + 0.08, 0]} m={flat(frame)} />
		<group position={[-w / 2, 0, 0]} rotation={[0, -open, 0]}>
			<Bx s={[w, h, 0.1]} p={[w / 2, h / 2, 0]} m={mat('boards', {base: color, seed: 21}, 0.4, 1)} />
			<Bx s={[0.1, 0.1, 0.16]} p={[w - 0.18, h * 0.47, 0.06]} m={flat('#c8a23a')} />
		</group>
	</group>
);

// A complete ROOM: floor + walls (with openings) + CEILING with beams + baseboards/crown.
// Origin at the floor centre; the camera usually looks in from +z, so `open` drops walls.
export const Room: React.FC<{
	w: number;
	d: number;
	h: number;
	floor: THREE.Material;
	wall: THREE.Material;
	ceil?: THREE.Material;
	beams?: string;
	trim?: string;
	holes?: {back?: Opening[]; left?: Opening[]; right?: Opening[]; front?: Opening[]};
	open?: ('front' | 'left' | 'right')[];
	children?: React.ReactNode;
}> = ({w, d, h, floor, wall, ceil, beams, trim = '#5a4030', holes = {}, open = ['front'], children}) => (
	<group>
		<Bx s={[w, 0.2, d]} p={[0, -0.1, 0]} m={floor} />
		<Wall w={w} h={h} m={wall} holes={holes.back} p={[0, 0, -d / 2]} />
		{!open.includes('left') ? <Wall w={d} h={h} m={wall} holes={holes.left} p={[-w / 2, 0, 0]} r={PI / 2} /> : null}
		{!open.includes('right') ? <Wall w={d} h={h} m={wall} holes={holes.right} p={[w / 2, 0, 0]} r={-PI / 2} /> : null}
		{!open.includes('front') ? <Wall w={w} h={h} m={wall} holes={holes.front} p={[0, 0, d / 2]} r={PI} /> : null}
		{ceil ? <Bx s={[w, 0.2, d]} p={[0, h + 0.1, 0]} m={ceil} /> : null}
		{beams ? Array.from({length: Math.floor(w / 2.2)}, (_, i) => <Bx key={i} s={[0.3, 0.4, d]} p={[-w / 2 + 1.1 + i * 2.2, h - 0.2, 0]} m={mat('planks', {base: beams, seed: i}, 1, 2)} />) : null}
		<Bx s={[w, 0.25, 0.08]} p={[0, 0.125, -d / 2 + 0.19]} m={flat(trim)} />
		<Bx s={[w, 0.18, 0.12]} p={[0, h - 0.09, -d / 2 + 0.2]} m={flat(trim)} />
		{children}
	</group>
);

// ---------- roofs ----------
// Gable roof over a w x d footprint: two sloped slabs + ridge cap + barge boards.
export const GableRoof: React.FC<{w: number; d: number; rise: number; m: THREE.Material; p?: V3; over?: number; edge?: string}> = ({w, d, rise, m, p = [0, 0, 0], over = 0.5, edge = '#5a3a22'}) => {
	const half = w / 2 + over;
	const len = Math.hypot(half, rise);
	const a = Math.atan2(rise, half);
	return (
		<group position={p}>
			{[-1, 1].map((k) => (
				<Bx key={k} s={[len, 0.16, d + over * 2]} p={[(k * half) / 2, rise / 2, 0]} r={[0, 0, -k * a]} m={m} />
			))}
			<Bx s={[0.3, 0.2, d + over * 2 + 0.05]} p={[0, rise + 0.05, 0]} m={flat(edge)} />
		</group>
	);
};
// Single-pitch (shed) roof of corrugated tin, the most common roof on river shacks.
export const ShedRoof: React.FC<{w: number; d: number; drop: number; m: THREE.Material; p?: V3}> = ({w, d, drop, m, p = [0, 0, 0]}) => (
	<Bx s={[w, 0.08, Math.hypot(d, drop)]} p={p} r={[Math.atan2(drop, d), 0, 0]} m={m} />
);

// ---------- riverside stilt house (palafito) ----------
export const StiltHouse: React.FC<{p?: V3; r?: number; f?: number; lit?: boolean; seed?: number; wall?: string; smoke?: boolean}> = ({p = [0, 0, 0], r = 0, f = 0, lit = false, seed = 1, wall = '#8a6a4a'}) => {
	const boards = mat('boards', {base: wall, seed, wear: 1.2}, 2, 1);
	const deck = mat('planks', {base: '#7a5a3a', seed: seed + 3}, 2, 2);
	const tin = mat('tin', {base: '#8a9098', seed: seed + 5, wear: 1.5}, 3, 2);
	const post = mat('bark', {base: '#5a4a3a', seed: seed + 7}, 1, 2);
	const ff = onTwos(f);
	const R = rnd(seed);
	const W = 5.2;
	const D = 4;
	const H = 2.8;
	const deckY = 1.6;
	return (
		<group position={p} rotation={[0, r, 0]}>
			{/* stilts down into the water/mud, cross braces */}
			{[-2.4, 0, 2.4].flatMap((x) => [-2.6, -0.2, 1.8].map((z) => <Bx key={`${x}${z}`} s={[0.22, deckY + 2, 0.22]} p={[x, deckY / 2 - 1, z]} r={[0, 0, (R() - 0.5) * 0.06]} m={post} />))}
			<Bx s={[0.12, 0.12, 4.6]} p={[-2.4, 0.6, -0.4]} r={[0.5, 0, 0]} m={post} />
			<Bx s={[0.12, 0.12, 4.6]} p={[2.4, 0.6, -0.4]} r={[-0.5, 0, 0]} m={post} />
			{/* deck + porch */}
			<Bx s={[W + 0.4, 0.2, D + 2.4]} p={[0, deckY, -0.4 + 0.6]} m={deck} />
			{/* walls with a door and a shuttered window */}
			<group position={[0, deckY + 0.1, -0.8]}>
				<Wall w={W} h={H} t={0.14} m={boards} p={[0, 0, D / 2 - 0.4]} holes={[{x: -1.2, y: 0, w: 1.0, h: 2.1}, {x: 1.1, y: 0.9, w: 1.3, h: 1.0}]} />
				<Wall w={W} h={H} t={0.14} m={boards} p={[0, 0, -D / 2 + 0.4]} />
				<Wall w={D - 0.8} h={H} t={0.14} m={boards} p={[-W / 2, 0, 0]} r={PI / 2} holes={[{x: 0, y: 1.0, w: 0.9, h: 0.8}]} />
				<Wall w={D - 0.8} h={H} t={0.14} m={boards} p={[W / 2, 0, 0]} r={PI / 2} />
				<Window w={1.3} h={1.0} p={[1.1, 0.9, D / 2 - 0.4]} frame="#c8b890" shutters="#3a7a8a" open={1.3} lit={lit ? '#ffb860' : undefined} glass="#2a2a24" />
				<Bx s={[1.0, 2.1, 0.05]} p={[-1.2, 1.05, D / 2 - 0.45]} m={lit ? glow('#ffa850', 0.9) : flat('#1a1410')} cast={false} />
				{/* interior hint: a table + pot visible through the door */}
				<Bx s={[1.2, 0.8, 0.7]} p={[-1.0, 0.4, 0.2]} m={flat('#5a3a22')} />
				<Bx s={[0.4, 0.3, 0.4]} p={[-1.0, 0.95, 0.2]} m={flat('#3a3a3a')} />
			</group>
			{/* tin shed roof with overhang over the porch */}
			<ShedRoof w={W + 1} d={D + 2.6} drop={0.9} m={tin} p={[0, deckY + H + 0.55, 0]} />
			{/* porch railing, hammock, ladder down to the water, laundry line */}
			{[-2.5, -1.3, 0.2, 1.4, 2.5].map((x) => <Bx key={x} s={[0.1, 0.9, 0.1]} p={[x, deckY + 0.55, 2.3]} m={post} />)}
			<Bx s={[W + 0.2, 0.08, 0.1]} p={[0, deckY + 1.0, 2.3]} m={post} />
			<group position={[0.9, deckY + 1.3, 1.6]} rotation={[0, 0, Math.sin(ff * 0.05) * 0.06]}>
				<Bx s={[2.4, 0.08, 0.6]} p={[0, -0.6, 0]} r={[0, 0, 0]} m={mat('fabric', {base: '#c8463a', alt: '#e8c84a', seed: 4}, 2, 1)} />
				{[-1.2, 1.2].map((x) => <Bx key={x} s={[0.04, 0.7, 0.04]} p={[x, -0.3, 0]} r={[0, 0, x > 0 ? 0.4 : -0.4]} m={flat('#d8c8a0')} cast={false} />)}
			</group>
			{[0, 1, 2, 3].map((i) => <Bx key={i} s={[0.7, 0.08, 0.12]} p={[-2.0, deckY - 0.4 - i * 0.45, 3.0]} m={post} />)}
			{[-2.35, -1.65].map((x) => <Bx key={x} s={[0.1, 2.2, 0.1]} p={[x, deckY - 1.0, 3.0]} m={post} />)}
			<Laundry a={[-2.6, deckY + 2.2, 2.4]} b={[-0.2, deckY + 2.2, 2.4]} f={f} seed={seed} n={3} />
			{/* water barrel, net, gas bottle */}
			<mesh position={[2.0, deckY + 0.5, 1.3]} material={flat('#2a5a8a')} castShadow>
				<cylinderGeometry args={[0.35, 0.35, 0.8, 8]} />
			</mesh>
			<Bx s={[1.4, 0.25, 0.9]} p={[-0.2, deckY + 0.22, 1.9]} r={[0, 0.3, 0]} m={mat('fabric', {base: '#4a6a5a', alt: '#2a3a30', seed: 8}, 2, 2)} />
		</group>
	);
};

// Laundry line between two points, a few garments that sway.
export const Laundry: React.FC<{a: V3; b: V3; f?: number; seed?: number; n?: number}> = ({a, b, f = 0, seed = 1, n = 4}) => {
	const ff = onTwos(f);
	const R = rnd(seed + 40);
	const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
	const ang = Math.atan2(b[2] - a[2], b[0] - a[0]);
	const cols = ['#e8e4da', '#c84a3a', '#3a6aa8', '#e8c84a', '#4a8a5a', '#f2a0b0'];
	return (
		<group position={a} rotation={[0, -ang, 0]}>
			<Bx s={[len, 0.03, 0.03]} p={[len / 2, 0, 0]} m={flat('#e8e0d0')} cast={false} />
			{Array.from({length: n}, (_, i) => {
				const x = ((i + 0.7) / (n + 0.4)) * len;
				const c = cols[Math.floor(R() * cols.length)];
				return (
					<group key={i} position={[x, 0, 0]} rotation={[Math.sin(ff * 0.11 + i * 1.7) * 0.18, 0, 0]}>
						<Bx s={[0.5 + R() * 0.3, 0.6 + R() * 0.4, 0.03]} p={[0, -0.4, 0]} m={flat(c)} />
					</group>
				);
			})}
		</group>
	);
};

// Wooden jetty: planks with gaps on posts, a mooring cleat + rope.
export const Jetty: React.FC<{p?: V3; r?: number; len?: number; w?: number; y?: number; seed?: number}> = ({p = [0, 0, 0], r = 0, len = 8, w = 1.6, y = 0.6, seed = 2}) => {
	const post = mat('bark', {base: '#5a4a3a', seed}, 1, 2);
	const R = rnd(seed);
	const n = Math.floor(len / 0.42);
	return (
		<group position={p} rotation={[0, r, 0]}>
			{Array.from({length: n}, (_, i) => (
				<Bx key={i} s={[w + (R() - 0.5) * 0.2, 0.1, 0.36]} p={[(R() - 0.5) * 0.08, y, i * 0.42]} r={[0, (R() - 0.5) * 0.05, (R() - 0.5) * 0.03]} m={mat('planks', {base: '#8a6a4a', seed: seed + (i % 4)}, 0.5, 0.25)} />
			))}
			{Array.from({length: Math.ceil(len / 2.2)}, (_, i) =>
				[-1, 1].map((k) => <Bx key={`${i}${k}`} s={[0.2, y + 1.6 + (k > 0 ? 0.3 : 0), 0.2]} p={[(k * w) / 2, (y - 1.6) / 2 + 0.4, i * 2.2]} m={post} />),
			)}
			<Bx s={[w + 0.2, 0.12, 0.14]} p={[0, y - 0.12, 0]} m={post} />
		</group>
	);
};

// Colombian river canoe (chalupa / canoa): tapered hull, ribs, a thwart seat, a paddle.
export const Canoe: React.FC<{p?: V3; r?: number; color?: string; trim?: string; len?: number; rock?: number; paddle?: boolean}> = ({p = [0, 0, 0], r = 0, color = '#3a6a8a', trim = '#e8d8b0', len = 6, rock = 0, paddle = true}) => {
	const wood = mat('planks', {base: '#6a4a2a', seed: 31}, 1, 2);
	const paint = mat('planks', {base: color, seed: 33}, 1, 2);
	return (
		<group position={p} rotation={[rock * 0.05, r, rock * 0.08]}>
			<Bx s={[1.1, 0.5, len * 0.7]} p={[0, 0.1, 0]} m={paint} />
			{[-1, 1].map((k) => (
				<Bx key={k} s={[0.7, 0.45, len * 0.2]} p={[0, 0.15, (k * len * 0.42)]} r={[k * -0.18, 0, 0]} m={paint} />
			))}
			{[-1, 1].map((k) => (
				<Bx key={`p${k}`} s={[0.32, 0.5, 0.3]} p={[0, 0.25, k * len * 0.52]} m={paint} />
			))}
			<Bx s={[1.12, 0.08, len * 0.7]} p={[0, 0.36, 0]} m={flat(trim)} />
			<Bx s={[0.9, 0.1, len * 0.66]} p={[0, 0.25, 0]} m={wood} />
			{[-1.2, 0.6].map((z) => <Bx key={z} s={[1.0, 0.08, 0.35]} p={[0, 0.38, z]} m={wood} />)}
			{paddle ? (
				<group position={[0.3, 0.45, -0.6]} rotation={[0.05, 0.2, -0.15]}>
					<Bx s={[0.07, 0.07, 2.2]} p={[0, 0, 0]} m={wood} />
					<Bx s={[0.3, 0.05, 0.6]} p={[0, 0, 1.3]} m={wood} />
				</group>
			) : null}
		</group>
	);
};

// Wooden power pole with a crossarm; `Wires` hangs sagging spans between poles.
export const Pole: React.FC<{p: V3; h?: number; r?: number; lean?: number}> = ({p, h = 8, r = 0, lean = 0}) => {
	const m = mat('bark', {base: '#6a5a48', seed: 13}, 1, 3);
	return (
		<group position={p} rotation={[0, r, lean]}>
			<Bx s={[0.26, h, 0.26]} p={[0, h / 2, 0]} m={m} />
			<Bx s={[2.2, 0.16, 0.16]} p={[0, h - 0.5, 0]} m={m} />
			{[-0.9, 0, 0.9].map((x) => <Bx key={x} s={[0.1, 0.18, 0.1]} p={[x, h - 0.33, 0]} m={flat('#e8e8e0')} />)}
		</group>
	);
};
export const Wires: React.FC<{pts: V3[]; sag?: number; offsets?: number[]; color?: string}> = ({pts, sag = 0.8, offsets = [-0.9, 0, 0.9], color = '#1a1a1a'}) => {
	const m = flat(color);
	const segs: {p: V3; s: V3; r: V3}[] = [];
	for (let k = 0; k < pts.length - 1; k++)
		for (const o of offsets) {
			const a = pts[k];
			const b = pts[k + 1];
			const N = 6;
			const q = (t: number): V3 => [a[0] + (b[0] - a[0]) * t + o, a[1] + (b[1] - a[1]) * t - Math.sin(t * PI) * sag, a[2] + (b[2] - a[2]) * t];
			for (let i = 0; i < N; i++) {
				const u = q(i / N);
				const v = q((i + 1) / N);
				const dx = v[0] - u[0];
				const dy = v[1] - u[1];
				const dz = v[2] - u[2];
				const L = Math.hypot(dx, dy, dz);
				const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(dx, dy, dz).normalize()));
				segs.push({p: [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2, (u[2] + v[2]) / 2], s: [0.035, 0.035, L], r: [e.x, e.y, e.z]});
			}
		}
	return (
		<group>
			{segs.map((s, i) => (
				<mesh key={i} position={s.p} rotation={s.r} material={m}>
					<boxGeometry args={s.s} />
				</mesh>
			))}
		</group>
	);
};

// Post-and-wire fence along a line.
export const Fence: React.FC<{a: V3; b: V3; n?: number; h?: number; wire?: boolean}> = ({a, b, n = 6, h = 1.3, wire = true}) => {
	const m = mat('bark', {base: '#6a5a44', seed: 17}, 1, 1);
	const L = Math.hypot(b[0] - a[0], b[2] - a[2]);
	const ang = Math.atan2(b[2] - a[2], b[0] - a[0]);
	return (
		<group position={a} rotation={[0, -ang, 0]}>
			{Array.from({length: n + 1}, (_, i) => <Bx key={i} s={[0.14, h, 0.14]} p={[(i / n) * L, h / 2, 0]} r={[0, 0, ((i * 7) % 5 - 2) * 0.03]} m={m} />)}
			{wire ? [0.45, 0.8, 1.15].map((y) => <Bx key={y} s={[L, 0.025, 0.025]} p={[L / 2, y * (h / 1.3), 0]} m={flat('#4a4a48')} cast={false} />) : null}
		</group>
	);
};

// Road strip with kerbs, sidewalks and dashed centre line (along local Z).
export const Road: React.FC<{len: number; w?: number; walk?: number; p?: V3; r?: number}> = ({len, w = 7, walk = 2, p = [0, 0, 0], r = 0}) => (
	<group position={p} rotation={[0, r, 0]}>
		<Bx s={[w, 0.1, len]} p={[0, 0.05, 0]} m={mat('asphalt', {base: '#3a3a3c', seed: 5, wear: 2}, w / 4, len / 4)} />
		{Array.from({length: Math.floor(len / 4)}, (_, i) => <Bx key={i} s={[0.15, 0.02, 1.6]} p={[0, 0.11, -len / 2 + 2 + i * 4]} m={flat('#e8d8a0')} cast={false} />)}
		{[-1, 1].map((k) => (
			<group key={k}>
				<Bx s={[0.25, 0.3, len]} p={[k * (w / 2 + 0.12), 0.15, 0]} m={flat('#9a968c')} />
				<Bx s={[walk, 0.28, len]} p={[k * (w / 2 + 0.25 + walk / 2), 0.14, 0]} m={mat('tiles', {base: '#a8a094', alt: '#8a8478', seed: 3}, walk / 2, len / 2)} />
			</group>
		))}
	</group>
);

// Street lamp (sodium) with a glowing head; add a pointLight yourself where it matters.
export const LampPost: React.FC<{p: V3; r?: number; h?: number; color?: string; on?: boolean}> = ({p, r = 0, h = 6, color = '#ffb060', on = true}) => (
	<group position={p} rotation={[0, r, 0]}>
		<Bx s={[0.18, h, 0.18]} p={[0, h / 2, 0]} m={flat('#3a3c40')} />
		<Bx s={[0.12, 0.12, 1.4]} p={[0, h - 0.1, 0.6]} m={flat('#3a3c40')} />
		<Bx s={[0.5, 0.2, 0.7]} p={[0, h - 0.2, 1.2]} m={flat('#2a2c30')} />
		<Bx s={[0.4, 0.06, 0.55]} p={[0, h - 0.32, 1.2]} m={on ? glow(color, 3) : flat('#8a8a80')} cast={false} />
	</group>
);
