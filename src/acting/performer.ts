import type {FaceCtl} from '../lowpoly/LiveFace';
import {onTwos} from '../anim';
import {BKey, BodyPose, cadence, layer, perform} from './body';
import {Expr, FaceKey, GazeKey, Word, blinkAt, faceAt, gazeAt, lipAt} from './face';

// CHARACTER PERFORMANCE = profile (who they are) + direction (what they do in this shot).
// The profile supplies posture, idle rhythm, blink/gaze habits, how loose the body is, cadence and
// mannerisms; the shot supplies key poses, expression keys, gaze keys and dialogue words.

export type Profile = {
	name: string;
	posture: BodyPose; // added to every pose (slouch, chest out, head forward…)
	idle: {sway: number; period: number; head: number}; // weight-shift amount/period, head drift
	blink: number; // mean frames between blinks
	gaze: {jitter: number; every: number}; // eye darts: amount, interval (anxious = big + often)
	loose: number; // follow-through/overlap amount (0.7 stiff … 1.5 loose)
	cadence: 1 | 2 | 3; // default drawing rate
	expr: Expr; // resting expression
	talk: {gesture: number; nod: number; brow: number}; // speaking energy: hands, head beats, brow lifts
	mannerism?: (f: number) => BodyPose; // signature fidget (scheduled inside the profile)
	seed: number;
};

export type Direction = {
	keys: BKey[]; // pose-to-pose keys (body)
	faces?: FaceKey[]; // expression changes
	gaze?: GazeKey[]; // what they look at
	words?: Word[]; // their own dialogue (seconds) -> lip sync + speech beats
	listen?: Word[]; // someone else's dialogue -> listening nods/reactions
	cadence?: {from: number; n: number}[]; // override drawing rate per section (impact = ones)
	headFollow?: number; // how much the head turns with the gaze (default 0.35)
	mannerism?: boolean; // false when the shot keys the mannerism itself
};

const hash = (n: number) => {
	const s = Math.sin(n * 91.7 + 17.3) * 43758.5453;
	return s - Math.floor(s);
};

export const act = (P: Profile, D: Direction, frame: number, fps = 30): BodyPose & {fc: FaceCtl} => {
	const f = cadence(frame, D.cadence ?? [{from: -9999, n: P.cadence}]);
	// body: keys -> springs (overlap/follow-through) -> posture -> idle -> mannerism
	const body = perform(D.keys, f, P.loose);
	const ph = P.seed * 1.7;
	const idle: BodyPose = {
		side: Math.sin(f / P.idle.period + ph) * P.idle.sway,
		lean: Math.sin(f / (P.idle.period * 1.3) + ph) * P.idle.sway * 0.4,
		headZ: Math.sin(f / (P.idle.period * 0.9) + ph * 2) * P.idle.head * 0.5,
		headX: Math.sin(f / (P.idle.period * 0.7) + ph) * P.idle.head * 0.3,
		armLZ: -Math.sin(f / P.idle.period + ph) * P.idle.sway * 0.6,
		armRZ: Math.sin(f / P.idle.period + ph) * P.idle.sway * 0.6,
	};
	// gaze: eyes lead, head follows ~5 frames later with part of the angle (anticipation)
	const g = gazeAt(D.gaze ?? [{f: 0, g: [0, 0]}], f, P.seed, P.gaze.jitter, P.gaze.every);
	const gLag = gazeAt(D.gaze ?? [{f: 0, g: [0, 0]}], f - 5, P.seed, 0, 999);
	const hf = D.headFollow ?? 0.35;
	const look: BodyPose = {headY: -gLag[0] * hf, headX: -gLag[1] * hf * 0.5};
	// speech beats: on longer words a head nod + brow lift + hand beat (each character differently)
	const t = f / fps;
	let beat = 0;
	for (const w of D.words ?? []) {
		if (w.w.replace(/[^a-z]/gi, '').length < 5) continue;
		const d = t - w.s;
		if (d > -0.05 && d < 0.45) beat = Math.max(beat, Math.sin(Math.min(1, (d + 0.05) / 0.5) * Math.PI));
	}
	const speech: BodyPose = {headX: beat * 0.12 * P.talk.nod, armRX: -beat * 0.35 * P.talk.gesture, armRZ: -beat * 0.15 * P.talk.gesture, lean: beat * 0.04 * P.talk.nod};
	// listening: slow nods while the other speaks + occasional small brow lift
	let nod = 0;
	for (const w of D.listen ?? []) {
		if (w.w.replace(/[^a-z]/gi, '').length < 6) continue;
		const d = t - w.e;
		if (d > 0 && d < 0.5) nod = Math.max(nod, Math.sin((d / 0.5) * Math.PI));
	}
	const listening: BodyPose = {headX: nod * 0.09};
	const pose = layer(body, P.posture, idle, look, speech, listening, P.mannerism && D.mannerism !== false ? P.mannerism(f) : {});
	// face: expression track -> gaze -> blinks (forced on big gaze shifts) -> lip sync on top
	const fc = {...faceAt(D.faces ?? [{f: 0, e: P.expr}], f)};
	fc.gx += g[0];
	fc.gy += g[1];
	const turns = (D.gaze ?? []).filter((k, i, a) => i > 0 && Math.abs(k.g[0] - a[i - 1].g[0]) > 0.8).map((k) => k.f);
	const bl = blinkAt(f, P.seed, P.blink, turns);
	fc.lidL = Math.max(fc.lidL, bl);
	fc.lidR = Math.max(fc.lidR, bl);
	fc.browL += beat * 0.25 * P.talk.brow + nod * 0.1;
	fc.browR += beat * 0.2 * P.talk.brow + nod * 0.1;
	if (D.words) {
		const lip = lipAt(D.words, f, fps);
		if (lip) {
			fc.mouth = lip.m;
			fc.jaw = Math.max(fc.jaw, lip.jaw);
		}
	}
	return {...pose, fc};
};

// A few frames of a fidget, repeating every `every` frames with a seeded offset.
export const every = (f: number, period: number, len: number, seed: number, fn: (u: number) => BodyPose): BodyPose => {
	const off = Math.floor(hash(seed) * period);
	const local = (((f - off) % period) + period) % period;
	return local < len ? fn(local / len) : {};
};
export const bump = (u: number) => Math.sin(Math.min(1, Math.max(0, u)) * Math.PI);
export {onTwos};
