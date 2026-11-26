import {Profile, bump, every} from './performer';

// ESCOBAR cast: one animation identity per recurring character (see docs/ANIMATION-SYSTEM.md).
// Behaviour, not just looks, should make each one recognisable.

export const PROFILES: Record<string, Profile> = {
	// Adult Pablo: controlled, unhurried, owns the room. Chest out, chin slightly up, slow blinks,
	// steady eye contact, small deliberate gestures; mannerism: smooths his mustache with a knuckle.
	pablo: {
		name: 'Pablo',
		posture: {lean: -0.05, headX: -0.06, armLZ: 0.12, armRZ: -0.12},
		idle: {sway: 0.025, period: 34, head: 0.04},
		blink: 130,
		gaze: {jitter: 0.06, every: 90},
		loose: 0.9,
		cadence: 2,
		expr: 'smug',
		talk: {gesture: 0.7, nod: 0.6, brow: 0.4},
		mannerism: (f) => every(f, 170, 36, 3, (u) => ({armRX: -2.2 * bump(u), armRZ: 0.35 * bump(u), headX: 0.08 * bump(u)})),
		seed: 11,
	},
	// Teen Pablo: restless hustler. Bouncy weight shifts, quick look-arounds, cocky head tilt.
	teen: {
		name: 'Teen Pablo',
		posture: {headZ: 0.08, side: 0.04},
		idle: {sway: 0.06, period: 16, head: 0.1},
		blink: 80,
		gaze: {jitter: 0.5, every: 28},
		loose: 1.3,
		cadence: 2,
		expr: 'smirk',
		talk: {gesture: 1.2, nod: 1, brow: 0.8},
		mannerism: (f) => every(f, 60, 12, 5, (u) => ({y: 0.12 * bump(u), sq: -0.04 * bump(u)})),
		seed: 23,
	},
	// Roberto (the accountant): anxious, precise. Hunched shoulders, head forward, fast blinks,
	// eyes dart away from contact; mannerism: pushes his glasses up with a finger.
	roberto: {
		name: 'Roberto',
		posture: {lean: 0.1, headX: 0.08, shrug: 0.18, armLZ: 0.04, armRZ: -0.04},
		idle: {sway: 0.035, period: 22, head: 0.06},
		blink: 55,
		gaze: {jitter: 0.45, every: 26},
		loose: 1.1,
		cadence: 2,
		expr: 'worried',
		talk: {gesture: 0.5, nod: 0.9, brow: 1.1},
		mannerism: (f) => every(f, 110, 20, 7, (u) => ({armLX: -2.6 * bump(u), armLZ: -0.5 * bump(u), headX: -0.05 * bump(u)})),
		seed: 37,
	},
	// Father: weary farmer, slow and heavy. Stooped, long holds (threes), wipes his brow.
	father: {
		name: 'Father',
		posture: {lean: 0.12, headX: 0.04},
		idle: {sway: 0.02, period: 48, head: 0.03},
		blink: 110,
		gaze: {jitter: 0.08, every: 120},
		loose: 0.8,
		cadence: 3,
		expr: 'tired',
		talk: {gesture: 0.4, nod: 0.5, brow: 0.3},
		mannerism: (f) => every(f, 150, 30, 9, (u) => ({armRX: -2.4 * bump(u), armRZ: 0.5 * bump(u), headX: -0.1 * bump(u)})),
		seed: 41,
	},
	// Mother: schoolteacher, upright and warm, expressive brows, points/explains with her hand.
	mother: {
		name: 'Mother',
		posture: {lean: -0.03, headZ: -0.04},
		idle: {sway: 0.025, period: 30, head: 0.05},
		blink: 90,
		gaze: {jitter: 0.12, every: 60},
		loose: 1,
		cadence: 2,
		expr: 'happy',
		talk: {gesture: 1, nod: 0.8, brow: 1.2},
		seed: 53,
	},
	// Police: tense, alert, minimal idle, eyes scanning.
	cop: {
		name: 'Police',
		posture: {lean: 0.05, armLZ: 0.05, armRZ: -0.05},
		idle: {sway: 0.012, period: 40, head: 0.02},
		blink: 120,
		gaze: {jitter: 0.35, every: 34},
		loose: 0.75,
		cadence: 2,
		expr: 'focused',
		talk: {gesture: 0.5, nod: 0.4, brow: 0.3},
		seed: 61,
	},
	// Fisherman: relaxed, slow, content.
	fisher: {
		name: 'Fisherman',
		posture: {lean: 0.08, headZ: 0.05},
		idle: {sway: 0.02, period: 52, head: 0.04},
		blink: 140,
		gaze: {jitter: 0.1, every: 100},
		loose: 1.2,
		cadence: 3,
		expr: 'calm',
		talk: {gesture: 0.3, nod: 0.3, brow: 0.3},
		seed: 71,
	},
};
