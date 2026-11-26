import {Easing} from 'remotion';
import {FaceCtl, Mouth, NEUTRAL} from '../lowpoly/LiveFace';

// FACIAL PERFORMANCE: expression presets, blended transitions (never a one-frame swap unless asked),
// natural blinks, gaze with darts, and lip sync from word timings.

export type Expr =
	| 'neutral' | 'happy' | 'beam' | 'smirk' | 'smug' | 'angry' | 'furious' | 'sad' | 'worried' | 'scared' | 'surprised' | 'shock'
	| 'confused' | 'skeptical' | 'frustrated' | 'focused' | 'thinking' | 'proud' | 'tired' | 'disgust' | 'calm';

// Each preset is deliberately ASYMMETRIC where the emotion is (smirk, skeptical, confused).
export const EXPR: Record<Expr, Partial<FaceCtl>> = {
	neutral: {},
	calm: {lidL: 0.3, lidR: 0.3, browL: -0.1, browR: -0.1, mouth: 'rest'},
	happy: {browL: 0.35, browR: 0.35, lowL: 0.25, lowR: 0.25, mouth: 'smile', lidL: 0.05, lidR: 0.05},
	beam: {browL: 0.6, browR: 0.6, lowL: 0.45, lowR: 0.45, mouth: 'grin', lidL: 0.15, lidR: 0.15},
	smirk: {browL: 0.45, browR: -0.15, tiltR: 0.3, lidL: 0.25, lidR: 0.35, mouth: 'smirk', mTilt: 0.5, mX: 0.25},
	smug: {browL: 0.25, browR: 0.05, lidL: 0.45, lidR: 0.5, lowL: 0.15, lowR: 0.15, mouth: 'smirk', mTilt: 0.35, mX: 0.2},
	angry: {browL: -0.55, browR: -0.55, tiltL: 1, tiltR: 1, lidTilt: 0.8, lidL: 0.3, lidR: 0.3, lowL: 0.2, lowR: 0.2, mouth: 'frown'},
	furious: {browL: -0.8, browR: -0.8, tiltL: 1.2, tiltR: 1.2, lidTilt: 1, lidL: 0.25, lidR: 0.25, lowL: 0.25, lowR: 0.25, mouth: 'grit', pupil: 0.85},
	sad: {browL: 0.25, browR: 0.25, tiltL: -1, tiltR: -1, lidTilt: -0.8, lidL: 0.4, lidR: 0.4, mouth: 'frown', gy: -0.5},
	worried: {browL: 0.45, browR: 0.5, tiltL: -0.9, tiltR: -1, lidTilt: -0.4, lidL: 0.05, lidR: 0.05, mouth: 'worried'},
	scared: {browL: 0.8, browR: 0.8, tiltL: -0.8, tiltR: -0.8, wide: 0.6, pupil: 0.72, lidL: 0, lidR: 0, mouth: 'sadopen'},
	surprised: {browL: 0.9, browR: 0.9, wide: 0.55, pupil: 0.85, lidL: 0, lidR: 0, mouth: 'oh'},
	shock: {browL: 1, browR: 1, wide: 1, pupil: 0.7, lidL: 0, lidR: 0, mouth: 'shock'},
	confused: {browL: 0.7, browR: -0.35, tiltR: 0.6, lidR: 0.3, lidL: 0.05, mouth: 'worried', mTilt: -0.4, mX: -0.2},
	skeptical: {browL: 0.75, browR: -0.3, tiltR: 0.5, lidL: 0.1, lidR: 0.5, lowR: 0.25, mouth: 'rest', mTilt: -0.35, mX: -0.15},
	frustrated: {browL: -0.4, browR: -0.4, tiltL: 0.9, tiltR: 0.9, lidL: 0.45, lidR: 0.45, lidTilt: 0.5, mouth: 'grit', mTilt: 0.2},
	focused: {browL: -0.3, browR: -0.3, tiltL: 0.55, tiltR: 0.55, lidL: 0.35, lidR: 0.35, lowL: 0.2, lowR: 0.2, mouth: 'mbp'},
	thinking: {browL: 0.5, browR: -0.15, tiltR: 0.3, lidL: 0.2, lidR: 0.3, gx: 0.6, gy: 0.6, mouth: 'pucker', mX: 0.3},
	proud: {browL: 0.2, browR: 0.2, lidL: 0.4, lidR: 0.4, mouth: 'smile', mTilt: 0.15},
	tired: {lidL: 0.6, lidR: 0.55, browL: 0.1, browR: 0.1, tiltL: -0.3, tiltR: -0.3, mouth: 'rest', gy: -0.3},
	disgust: {browL: -0.4, browR: 0.1, tiltL: 0.6, lidL: 0.45, lowL: 0.45, lidR: 0.2, mouth: 'frown', mTilt: -0.6, mX: -0.3},
};

const NUM_KEYS = Object.keys(NEUTRAL).filter((k) => k !== 'mouth') as (keyof FaceCtl)[];
export const face = (e: Expr | Partial<FaceCtl>, extra: Partial<FaceCtl> = {}): FaceCtl => ({...NEUTRAL, ...(typeof e === 'string' ? EXPR[e] : e), ...extra});
export const mixFace = (a: FaceCtl, b: FaceCtl, t: number): FaceCtl => {
	const o = {...a} as Record<string, number | string>;
	for (const k of NUM_KEYS) o[k] = (a[k] as number) + ((b[k] as number) - (a[k] as number)) * t;
	o.mouth = t < 0.5 ? a.mouth : b.mouth;
	return o as FaceCtl;
};

// Expression track: each key blends in over `in` frames (default 6) with an ease; `snap` for hits.
export type FaceKey = {f: number; e: Expr | Partial<FaceCtl>; x?: Partial<FaceCtl>; in?: number};
export const faceAt = (keys: FaceKey[], f: number): FaceCtl => {
	const ks = [...keys].sort((a, b) => a.f - b.f);
	let cur = face(ks[0]?.e ?? 'neutral', ks[0]?.x);
	for (let i = 1; i < ks.length; i++) {
		const k = ks[i];
		if (f < k.f) break;
		const d = k.in ?? 6;
		const t = d <= 0 ? 1 : Math.min(1, (f - k.f) / d);
		cur = mixFace(cur, face(k.e, k.x), Easing.inOut(Easing.cubic)(t));
	}
	return cur;
};

// ---------- blinks ----------
const hash = (n: number) => {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};
// Deterministic natural blinking: irregular intervals (rate = mean frames between blinks), some
// double blinks, plus forced blinks (e.g. on head turns). Returns extra lid closure 0..1.
export const blinkAt = (f: number, seed: number, rate = 95, forced: number[] = []) => {
	const curve = (d: number) => (d < 0 || d > 6 ? 0 : [0.55, 1, 1, 0.7, 0.35, 0.1, 0][d]);
	let t = Math.floor(hash(seed) * rate);
	let c = 0;
	let i = 0;
	while (t <= f + 6 && i < 400) {
		c = Math.max(c, curve(f - t));
		if (hash(seed + i * 7.3) < 0.18) c = Math.max(c, curve(f - t - 8)); // double blink
		t += Math.round(rate * (0.45 + hash(seed + i * 3.1) * 1.1));
		i++;
	}
	for (const b of forced) c = Math.max(c, curve(f - b));
	return c;
};

// ---------- gaze ----------
// Gaze key: where the eyes look (gx, gy in -1..1 eye space, or 'cam'), held until the next key.
// Eyes jump (saccade) in 2 frames; idle micro-darts by `jitter`; the head follows separately.
export type GazeKey = {f: number; g: [number, number]};
export const gazeAt = (keys: GazeKey[], f: number, seed = 1, jitter = 0.15, dartEvery = 40): [number, number] => {
	const ks = [...keys].sort((a, b) => a.f - b.f);
	let prev: [number, number] = ks[0]?.g ?? [0, 0];
	let cur = prev;
	for (const k of ks) {
		if (k.f > f) break;
		prev = cur;
		const t = Math.min(1, (f - k.f) / 2);
		cur = [prev[0] + (k.g[0] - prev[0]) * t, prev[1] + (k.g[1] - prev[1]) * t];
		if (t >= 1) prev = cur;
	}
	// micro-darts: short glances off and back (anxious characters: high jitter, short interval)
	const slot = Math.floor(f / dartEvery);
	const local = f - slot * dartEvery;
	const on = local > dartEvery * 0.55 && local < dartEvery * 0.55 + 6 + hash(seed + slot) * 8;
	const dx = on ? (hash(seed + slot * 2.7) - 0.5) * 2 * jitter : 0;
	const dy = on ? (hash(seed + slot * 5.1) - 0.5) * jitter : 0;
	return [cur[0] + dx, cur[1] + dy];
};

// ---------- lip sync ----------
export type Word = {w: string; s: number; e: number};
type Vis = {m: Mouth; jaw: number; dur: number};
// Grapheme -> viseme approximation (English). Vowels carry the jaw; consonants are short shapes.
const graph = (word: string): Vis[] => {
	const w = word.toLowerCase().replace(/[^a-z']/g, '');
	const out: Vis[] = [];
	for (let i = 0; i < w.length; i++) {
		const two = w.slice(i, i + 2);
		if (two === 'th') (out.push({m: 'lth', jaw: 0.2, dur: 1}), i++);
		else if (two === 'sh' || two === 'ch') (out.push({m: 'pucker', jaw: 0.1, dur: 1}), i++);
		else if (two === 'oo' || two === 'ou' || two === 'ew') (out.push({m: 'oo', jaw: 0.25, dur: 1.4}), i++);
		else if (two === 'ee' || two === 'ea') (out.push({m: 'ee', jaw: 0.25, dur: 1.4}), i++);
		else {
			const c = w[i];
			if ('a'.includes(c)) out.push({m: 'aa', jaw: 0.8, dur: 1.3});
			else if ('ei'.includes(c)) out.push({m: 'ee', jaw: 0.35, dur: 1.1});
			else if (c === 'o') out.push({m: 'oh', jaw: 0.6, dur: 1.3});
			else if (c === 'u') out.push({m: 'oh', jaw: 0.4, dur: 1});
			else if (c === 'y') out.push({m: 'ee', jaw: 0.2, dur: 0.8});
			else if ('mbp'.includes(c)) out.push({m: 'mbp', jaw: 0, dur: 0.9});
			else if ('fv'.includes(c)) out.push({m: 'fv', jaw: 0.05, dur: 0.9});
			else if ('w'.includes(c)) out.push({m: 'oo', jaw: 0.15, dur: 0.8});
			else if ('ltdn'.includes(c)) out.push({m: 'lth', jaw: 0.25, dur: 0.6});
			else if ("'h".includes(c)) continue;
			else out.push({m: 'ee', jaw: 0.15, dur: 0.5}); // s z c k g r x q j
		}
	}
	// drop doubled shapes so the mouth doesn't flap on every letter
	return out.filter((v, i) => i === 0 || v.m !== out[i - 1].m);
};
// Mouth + jaw for frame f (fps 30) from word timings; null between words (use the expression mouth).
export const lipAt = (words: Word[], f: number, fps = 30, energy = 1): {m: Mouth; jaw: number} | null => {
	const t = f / fps;
	const w = words.find((x) => t >= x.s - 0.03 && t <= x.e + 0.02);
	if (!w) {
		// short gap inside a phrase: relaxed, slightly open; long pause: let the expression show
		const next = words.find((x) => x.s > t);
		const prev = [...words].reverse().find((x) => x.e < t);
		if (next && prev && next.s - prev.e < 0.25) return {m: 'rest', jaw: 0.05};
		return null;
	}
	const vis = graph(w.w);
	if (!vis.length) return {m: 'rest', jaw: 0};
	const total = vis.reduce((a, v) => a + v.dur, 0);
	let u = ((t - w.s) / Math.max(0.05, w.e - w.s)) * total;
	for (let i = 0; i < vis.length; i++) {
		if (u <= vis[i].dur || i === vis.length - 1) {
			// co-articulation: jaw eases toward the next shape instead of snapping
			const nx = vis[Math.min(i + 1, vis.length - 1)];
			const k = Math.min(1, Math.max(0, u / vis[i].dur));
			return {m: vis[i].m, jaw: (vis[i].jaw + (nx.jaw - vis[i].jaw) * k * 0.4) * energy};
		}
		u -= vis[i].dur;
	}
	return {m: 'rest', jaw: 0};
};
