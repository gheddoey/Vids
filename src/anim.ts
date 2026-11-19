import {Easing} from 'remotion';
import type {Pose} from './Character';

export type Ease = 'inOut' | 'out' | 'in' | 'linear' | 'back' | 'snap';
export type Key = Partial<Pose> & {f: number; ease?: Ease};

const EASE: Record<Ease, (t: number) => number> = {
	inOut: Easing.inOut(Easing.cubic),
	out: Easing.out(Easing.cubic),
	in: Easing.in(Easing.cubic),
	linear: (t) => t,
	back: Easing.out(Easing.back(1.7)),
	snap: Easing.out(Easing.exp),
};

// Characters are animated "on twos": a new pose every 2 frames, like the stepped
// motion in Into the Spider-Verse, while the camera still moves on every frame.
export const onTwos = (frame: number) => Math.floor(frame / 2) * 2;

// Sample a keyframe track. Each property interpolates between the keys that set it,
// using the ease of the key it is heading into. The face switches instantly.
export const sample = (keys: Key[], f: number): Partial<Pose> => {
	const sorted = [...keys].sort((a, b) => a.f - b.f);
	const props = new Set<string>();
	for (const k of sorted) for (const p of Object.keys(k)) if (p !== 'f' && p !== 'ease') props.add(p);
	const out: Record<string, unknown> = {};
	for (const prop of props) {
		const ks = sorted.filter((k) => (k as Record<string, unknown>)[prop] !== undefined);
		const val = (k: Key) => (k as Record<string, unknown>)[prop];
		if (prop === 'face') {
			const last = [...ks].reverse().find((k) => k.f <= f) ?? ks[0];
			out[prop] = val(last);
			continue;
		}
		if (f <= ks[0].f) {
			out[prop] = val(ks[0]);
			continue;
		}
		if (f >= ks[ks.length - 1].f) {
			out[prop] = val(ks[ks.length - 1]);
			continue;
		}
		const i = ks.findIndex((k, j) => k.f <= f && ks[j + 1].f > f);
		const a = ks[i];
		const b = ks[i + 1];
		const t = EASE[b.ease ?? 'inOut']((f - a.f) / (b.f - a.f));
		const av = val(a) as number;
		const bv = val(b) as number;
		out[prop] = av + (bv - av) * t;
	}
	return out as Partial<Pose>;
};

// Walk cycle keys: root slides linearly while legs and arms swing in opposition.
export const walk = (f0: number, f1: number, from: [number, number], to: [number, number], stride = 8): Key[] => {
	const keys: Key[] = [
		{f: f0, x: from[0], z: from[1]},
		{f: f1, x: to[0], z: to[1], ease: 'linear'},
	];
	let side = 1;
	for (let f = f0; f <= f1; f += stride) {
		const end = f + stride > f1;
		const swing = end ? 0 : 0.6 * side;
		keys.push({
			f,
			legLX: -swing,
			legRX: swing,
			armLX: swing * 0.75,
			armRX: -swing * 0.75,
			y: end ? 0 : 0,
		});
		keys.push({f: Math.min(f + stride / 2, f1), y: end ? 0 : 0.18});
		side *= -1;
	}
	return keys;
};

// Gentle breathing so held poses never look frozen.
export const breathe = (f: number, phase: number): Partial<Pose> => {
	const s = Math.sin((f / 48) * Math.PI * 2 + phase);
	return {lean: 0.015 * s, armLZ: 0.03 * s, armRZ: -0.03 * s, headX: -0.012 * s};
};

export const add = (a: Partial<Pose>, b: Partial<Pose>): Partial<Pose> => {
	const out: Record<string, unknown> = {...a};
	for (const [k, v] of Object.entries(b)) {
		if (typeof v === 'number') out[k] = ((out[k] as number | undefined) ?? 0) + v;
	}
	return out as Partial<Pose>;
};
