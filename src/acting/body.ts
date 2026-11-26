import {Easing} from 'remotion';
import {Key, sample} from '../anim';
import type {Pose} from '../Character';
import type {Extra} from '../lowpoly/Rig';

// BODY PERFORMANCE: pose-to-pose keys, then animation principles layered on top:
//  - overlapping action + follow-through: every joint chases its keyed target through a damped
//    spring with its own stiffness (head/arms lag and overshoot the torso), simulated deterministically
//  - variable cadence: ones for fast action, twos by default, threes for stylised holds
//  - squash & stretch impulses, arcs for travel, anticipation helpers

export type BodyPose = Partial<Pose> & Extra & {face?: string};
export type BKey = Key & Extra;

// Spring response of each joint (k = stiffness, c = damping per frame). Lower k = more lag.
export type Springs = Partial<Record<string, {k: number; c: number}>>;
const DEFAULT_SPRINGS: Springs = {
	lean: {k: 0.25, c: 0.55},
	twist: {k: 0.22, c: 0.55},
	side: {k: 0.22, c: 0.55},
	headX: {k: 0.16, c: 0.45},
	headY: {k: 0.14, c: 0.42},
	headZ: {k: 0.14, c: 0.42},
	armLX: {k: 0.18, c: 0.38},
	armRX: {k: 0.18, c: 0.38},
	armLZ: {k: 0.17, c: 0.4},
	armRZ: {k: 0.17, c: 0.4},
	armLY: {k: 0.2, c: 0.5},
	armRY: {k: 0.2, c: 0.5},
	shrug: {k: 0.3, c: 0.5},
	shrugL: {k: 0.3, c: 0.5},
	shrugR: {k: 0.3, c: 0.5},
	sq: {k: 0.35, c: 0.3},
};
const RIGID = new Set(['x', 'y', 'z', 'rotY', 'legLX', 'legRX', 'legLZ', 'legRZ']);

// Sample keys, then run each joint through its spring from the first key to frame f.
// `loose` scales the lag (0 = rigid, 1 = default, 1.6 = floppy/cartoony).
export const perform = (keys: BKey[], f: number, loose = 1, springs: Springs = {}): BodyPose => {
	const raw = sample(keys as Key[], f) as Record<string, number | string>;
	if (loose <= 0) return raw as BodyPose;
	const start = Math.min(...keys.map((k) => k.f));
	const out: Record<string, number | string> = {...raw};
	for (const prop of Object.keys(raw)) {
		if (prop === 'face' || RIGID.has(prop) || typeof raw[prop] !== 'number') continue;
		const sp = springs[prop] ?? DEFAULT_SPRINGS[prop] ?? {k: 0.25, c: 0.5};
		const k = Math.min(1, sp.k / loose);
		const c = sp.c;
		let x = (sample(keys as Key[], start) as Record<string, number>)[prop] ?? 0;
		let v = 0;
		for (let t = start + 1; t <= f; t++) {
			const target = (sample(keys as Key[], t) as Record<string, number>)[prop] ?? 0;
			v = v * (1 - c) + (target - x) * k;
			x += v;
		}
		out[prop] = x;
	}
	return out as BodyPose;
};

// Variable cadence: map a frame to the drawing it shows. segs: [{from, n}] (n = 1 ones, 2 twos, 3 threes).
export const cadence = (f: number, segs: {from: number; n: number}[] = [{from: -9999, n: 2}]) => {
	const s = [...segs].sort((a, b) => a.from - b.from).filter((x) => x.from <= f).pop() ?? {from: 0, n: 2};
	return s.from + Math.floor((f - s.from) / s.n) * s.n;
};

// Squash/stretch impulse at frame `at` (positive = stretch first), decaying wobble.
export const squash = (f: number, at: number, amt = 0.12, len = 14) => {
	const t = f - at;
	if (t < 0 || t > len) return 0;
	return amt * Math.cos((t / len) * Math.PI * 2.5) * (1 - t / len);
};

// Travel along an ARC (a hop/lunge/step): returns [x, y, z] between p0 and p1 with a lift.
export const arc = (f: number, f0: number, f1: number, p0: [number, number, number], p1: [number, number, number], lift = 0.5, ease = Easing.inOut(Easing.cubic)) => {
	const t = ease(Math.min(1, Math.max(0, (f - f0) / (f1 - f0))));
	return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t + Math.sin(t * Math.PI) * lift, p0[2] + (p1[2] - p0[2]) * t] as [number, number, number];
};

// Merge pose layers (numbers add, later strings win).
export const layer = (...ps: BodyPose[]): BodyPose => {
	const out: Record<string, unknown> = {};
	for (const p of ps)
		for (const [k, v] of Object.entries(p)) {
			if (typeof v === 'number') out[k] = ((out[k] as number | undefined) ?? 0) + v;
			else if (v !== undefined) out[k] = v;
		}
	return out as BodyPose;
};
