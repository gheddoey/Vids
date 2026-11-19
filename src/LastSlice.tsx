import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Character, CharacterProps, FaceType} from './Character';
import {CAST, useShirts} from './Lineup';
import {Fence, PizzaBox, Slice, Table} from './Props';
import {Key, add, breathe, onTwos, sample, stepFrames, walk} from './anim';

// "The Last Slice": four friends, one slice left, a standoff, a dive, a bonk,
// and a calm passer-by who eats the prize right in front of them.
export const LAST_SLICE_FRAMES = 528; // 22 s at 24 fps

const PI = Math.PI;
const TABLE_TOP = 2.29;

const byShirt = (s: string) => CAST.find((c) => c.shirt === s)!;
const A = byShirt('pilot');
const B = byShirt('plaid');
const C = byShirt('varsity');
const D = byShirt('wings');
const E = byShirt('bluejacket');

type Spot = {x: number; z: number; rotY: number};

// Standing spots around the table.
const SPOT: Record<'A' | 'B' | 'C' | 'D', Spot> = {
	A: {x: -4.6, z: 0, rotY: PI / 2},
	B: {x: 4.6, z: 0, rotY: -PI / 2},
	C: {x: -2.4, z: -3.6, rotY: 0.3},
	D: {x: 2.4, z: -3.6, rotY: -0.3},
};

// Where the four heads meet above the table.
const P = {x: 0, y: 4.4, z: -0.4};

const LYING = {y: -1.5, lean: -PI / 2, legLX: -PI / 2, legRX: -PI / 2, armLZ: 0.5, armRZ: -0.5, armLX: 0, armRX: 0};
const SITTING = {y: -1.5, lean: 0.05, legLX: -PI / 2, legRX: -PI / 2, armLX: -0.3, armRX: -0.3, armLZ: 0.15, armRZ: -0.15};

// The thief's path, for head tracking.
const E_SPOT = {x: 0.5, z: 3.0};
const E_EXIT = {x: -17, z: 4.0};

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
// Head yaw needed for someone at `from` (facing rotY) to look at `to`.
const lookYaw = (from: {x: number; z: number}, rotY: number, to: {x: number; z: number}) =>
	clamp(wrap(Math.atan2(to.x - from.x, to.z - from.z) - rotY), -1.2, 1.2);

// Alternating faces (chewing) every `step` frames, with a little head bob.
const alternate = (f0: number, f1: number, a: FaceType, b: FaceType, step = 4, bob = 0.05): Key[] => {
	const keys: Key[] = [];
	let i = 0;
	for (let f = f0; f < f1; f += step, i++) {
		keys.push(bob ? {f, face: i % 2 ? b : a, headX: i % 2 ? -bob / 2 : bob, ease: 'out'} : {f, face: i % 2 ? b : a});
	}
	return keys;
};

// Dive -> head-first bonk -> fly back -> bounce -> lie dizzy -> sit up and glare.
const diver = (s: Spot) => {
	const len = Math.hypot(P.x - s.x, P.z - s.z);
	const dir = {x: (P.x - s.x) / len, z: (P.z - s.z) / len};
	const rotD = Math.atan2(dir.x, dir.z);
	const L = 1.35;
	// Body from hip to forehead is ~3.4 long; stop so the foreheads just touch at P.
	const reach = 3.4 * Math.sin(L) + 0.5;
	const hit = {x: P.x - dir.x * reach, z: P.z - dir.z * reach};
	const hitY = P.y - 3.4 * Math.cos(L) - 2;
	const back = {x: s.x - dir.x * 0.7, z: s.z - dir.z * 0.7};
	const out = {x: s.x - dir.x * 2.8, z: s.z - dir.z * 2.8};
	const keys: Key[] = [
		{f: 192, x: s.x, z: s.z, y: 0, rotY: s.rotY, lean: 0.22, legLX: 0, legRX: 0, headY: 0},
		// Anticipation: step back, crouch, arms swing back
		{f: 200, x: back.x, z: back.z, y: -0.35, rotY: rotD, lean: -0.2, armLX: 0.7, armRX: 0.7, armLZ: 0.25, armRZ: -0.25, legLX: -0.3, legRX: 0.3, headX: -0.1, face: 'serious', ease: 'out'},
		{f: 206, y: -0.42, lean: -0.25},
		// Launch: head-first, arms swept back
		{f: 216, x: (back.x + hit.x) / 2, z: (back.z + hit.z) / 2, y: hitY + 0.6, lean: 1.0, legLX: 0.9, legRX: 1.1, armLX: 0.5, armRX: 0.5, headX: -0.6, ease: 'out'},
		{f: 224, x: hit.x, z: hit.z, y: hitY, lean: L, legLX: 1.3, legRX: 1.3, armLX: 0.6, armRX: 0.6, armLZ: 0.35, armRZ: -0.35, headX: -0.7, ease: 'in'},
		// BONK: hold the impact
		{f: 225, face: 'ouch'},
		{f: 230, x: hit.x, z: hit.z, y: hitY, lean: L, headX: -0.8, armLZ: 0.6, armRZ: -0.6},
		// Fly back, flailing
		{f: 240, x: (s.x + out.x) / 2, z: (s.z + out.z) / 2, y: 2.2, lean: -0.9, armLX: -1.2, armRX: -2.2, armLZ: 2.2, armRZ: -2.0, legLX: -0.6, legRX: 0.3, headX: -0.3, ease: 'snap'},
		{f: 244, face: 'dizzy'},
		// Land, bounce, limbs settle a beat later
		{f: 252, x: out.x, z: out.z, ...LYING, headX: 0, ease: 'in'},
		{f: 256, y: -1.25, armLZ: 1.0, armRZ: -1.0, legLX: -1.3, ease: 'out'},
		{f: 260, y: -1.5, armLZ: 0.5, armRZ: -0.5, legLX: -PI / 2, ease: 'in'},
		// Head lolling while dizzy
		{f: 260, headZ: 0},
		{f: 268, headZ: 0.3},
		{f: 278, headZ: -0.25},
		{f: 288, headZ: 0.2},
		{f: 298, headZ: -0.15},
		{f: 308, headZ: 0.1},
		{f: 316, headZ: 0},
		// Sit up and glare at the thief
		{f: 318, ...LYING},
		{f: 334, ...SITTING, face: 'serious', ease: 'back'},
		{f: 346, headY: lookYaw(out, rotD, E_SPOT), headX: 0.05},
		// Track the thief as he walks off
		{f: 452, headY: lookYaw(out, rotD, E_SPOT)},
		{f: 476, headY: lookYaw(out, rotD, {x: -8, z: 3.5}), ease: 'linear'},
		{f: 496, headY: lookYaw(out, rotD, E_EXIT), ease: 'linear'},
		// Defeat
		{f: 498, lean: 0.05, headX: 0.05, headZ: 0},
		{f: 508, lean: 0.4, headX: 0.5, headY: 0, face: 'calm', ease: 'inOut'},
	];
	return {keys, out, rotD};
};

const dA = diver(SPOT.A);
const dB = diver(SPOT.B);
const dC = diver(SPOT.C);
const dD = diver(SPOT.D);

const GRAB = 312;
const BITE1 = 356;
const BITE2 = 398;

const tracks: Record<'A' | 'B' | 'C' | 'D' | 'E', Key[]> = {
	A: [
		{f: 0, ...SPOT.A, face: 'smile', headY: -0.5},
		// Talking with a hand gesture
		{f: 10, armRX: 0},
		{f: 22, armRX: -1.0, armRZ: -0.3, headX: -0.08, ease: 'back'},
		{f: 34, armRX: -0.7, armRZ: -0.2, headX: 0.04},
		{f: 44, armRX: 0, armRZ: 0, headY: -0.5},
		// Everyone notices the last slice
		{f: 52, headY: 0, headX: 0.35, ease: 'snap'},
		{f: 80, face: 'smile'},
		{f: 81, face: 'serious', headX: 0.25},
		// Standoff: lean in, hands ready at the sides
		{f: 136, lean: 0, armLZ: 0, armRZ: 0, armLX: 0, armRX: 0},
		{f: 150, lean: 0.22, armLZ: 0.4, armRZ: -0.4, armLX: -0.25, armRX: -0.25, headX: 0.2},
		// Twitchy fingers
		{f: 160, armRZ: -0.45},
		{f: 164, armRZ: -0.38},
		{f: 168, armRZ: -0.46},
		{f: 172, armRZ: -0.4},
		...dA.keys,
		// Gasps at the second bite
		{f: 398, face: 'serious'},
		{f: 400, face: 'ouch'},
		{f: 412, face: 'serious'},
		// Shakes his head at the end
		{f: 510, headY: -0.3},
		{f: 515, headY: 0.3},
		{f: 520, headY: -0.25},
		{f: 525, headY: 0.1},
	],
	B: [
		{f: 0, ...SPOT.B, face: 'grin', headY: 0.4},
		// Laughing
		{f: 14, headX: 0, lean: 0},
		{f: 20, headX: -0.25, lean: -0.08, ease: 'out'},
		{f: 28, headX: 0.05, lean: 0.03},
		{f: 34, headX: -0.2, lean: -0.06},
		{f: 44, headX: 0, lean: 0},
		{f: 52, headY: 0, headX: 0.35, ease: 'snap'},
		{f: 94, face: 'grin'},
		{f: 95, face: 'serious', headX: 0.25},
		{f: 136, lean: 0, armLZ: 0, armRZ: 0, armLX: 0, armRX: 0},
		{f: 150, lean: 0.25, armLZ: 0.45, armRZ: -0.35, armLX: -0.3, armRX: -0.2, headX: 0.2},
		// Narrows in, head tilt
		{f: 176, headZ: 0},
		{f: 182, headZ: 0.12, ease: 'snap'},
		// Skips the shared slump: he flops onto his back instead
		...dB.keys.filter((k) => k.f < 498),
		// Shakes a fist at the first bite
		{f: 356, armRX: -0.3, armRZ: -0.15},
		{f: 360, armRX: -1.7, armRZ: -0.25, ease: 'back'},
		{f: 364, armRX: -1.35},
		{f: 368, armRX: -1.7},
		{f: 372, armRX: -1.35},
		{f: 376, armRX: -1.7},
		{f: 386, armRX: -0.3, armRZ: -0.15},
		// Gives up and flops onto his back
		{f: 498, y: -1.5, lean: 0.05},
		{f: 504, ...LYING, face: 'calm', ease: 'in'},
		{f: 508, y: -1.4, ease: 'out'},
		{f: 512, y: -1.5, ease: 'in'},
	],
	C: [
		{f: 0, ...SPOT.C, face: 'smile', headY: 0.6},
		// Nodding along
		{f: 12, headX: 0},
		{f: 18, headX: 0.18},
		{f: 24, headX: 0},
		{f: 30, headX: 0.18},
		{f: 36, headX: 0},
		{f: 52, headY: -0.35, headX: 0.35, ease: 'snap'},
		{f: 108, face: 'smile'},
		{f: 109, face: 'serious', headX: 0.22},
		{f: 136, lean: 0, armLZ: 0, armRZ: 0, armLX: 0, armRX: 0},
		{f: 150, lean: 0.2, armLZ: 0.35, armRZ: -0.35, armLX: -0.3, armRX: -0.3, headX: 0.2},
		...dC.keys,
		// Head tilt of disbelief at the shrug
		{f: 434, headZ: 0},
		{f: 440, headZ: 0.25, ease: 'back'},
		{f: 452, headZ: 0},
	],
	D: [
		{f: 0, ...SPOT.D, face: 'mustache', headY: -0.6},
		// Arms crossed-ish, listening
		{f: 0, armLX: -0.9, armRX: -0.9, armLZ: -0.5, armRZ: 0.5},
		{f: 44, armLX: -0.9, armRX: -0.9, armLZ: -0.5, armRZ: 0.5, headY: -0.6},
		{f: 52, headY: 0.35, headX: 0.35, ease: 'snap'},
		// The glare tightens
		{f: 122, headX: 0.25},
		{f: 126, headX: 0.4, ease: 'snap'},
		{f: 136, armLX: -0.9, armRX: -0.9, armLZ: -0.5, armRZ: 0.5, lean: 0},
		{f: 150, lean: 0.22, armLZ: 0.4, armRZ: -0.4, armLX: -0.3, armRX: -0.3, headX: 0.25},
		...dD.keys,
		// Keeps his own glaring face through the dive and sit-up
		{f: 201, face: 'mustache'},
		{f: 333, face: 'serious'},
		{f: 334, face: 'mustache'},
		// Leans in angrily at the shrug
		{f: 434, lean: 0.05},
		{f: 440, lean: 0.3, ease: 'snap'},
		{f: 452, lean: 0.05},
		// Facepalm
		{f: 500, armRX: -0.3, armRZ: -0.15},
		{f: 508, armRX: -2.35, armRZ: 0.75, ease: 'back'},
	],
	E: [
		{f: 0, x: 45, z: 3.0, rotY: -PI / 2, face: 'calm'},
		...walk(258, 292, [15, 3.0], [E_SPOT.x, E_SPOT.z], 8),
		// Turn to the table
		{f: 292, rotY: -PI / 2},
		{f: 300, rotY: -PI, headX: 0.35},
		// Reach in and take it
		{f: 300, lean: 0, armLX: 0, armLZ: 0},
		{f: 312, lean: 0.55, armLX: -1.45, armLZ: -0.15, headX: 0.45, ease: 'out'},
		// Straighten up, admire it
		{f: 324, lean: 0, armLX: -1.1, armLZ: -0.2, headX: 0.3},
		// Turn to camera
		{f: 328, rotY: -PI},
		{f: 342, rotY: -1.78 * PI, headX: 0.1, face: 'calm'},
		// First bite
		{f: 344, armLX: -1.1, armLZ: -0.2},
		{f: 354, armLX: -2.1, armLZ: -0.5, headX: -0.05, ease: 'back'},
		...alternate(BITE1, 382, 'chewA', 'chewB'),
		{f: 362, armLX: -1.35, armLZ: -0.3},
		// Happy little bounce while chewing
		{f: 362, y: 0},
		{f: 366, y: 0.07},
		{f: 370, y: 0},
		{f: 374, y: 0.07},
		{f: 378, y: 0},
		// Gulp
		{f: 382, face: 'smile', headX: 0.02},
		{f: 385, headX: -0.18, ease: 'snap'},
		{f: 389, headX: 0.04},
		// Second bite
		{f: 390, armLX: -1.35, armLZ: -0.3},
		{f: 397, armLX: -2.1, armLZ: -0.5, headX: -0.05, ease: 'back'},
		...alternate(BITE2, 420, 'chewA', 'chewB'),
		{f: 404, armLX: -1.3, armLZ: -0.25},
		// Turn round to the friends, smug
		{f: 420, rotY: -1.78 * PI},
		{f: 430, rotY: -PI, headX: 0.05},
		{f: 428, face: 'smug'},
		// Shrug
		{f: 432, armRZ: 0, armRX: 0, lean: 0, headZ: 0, y: 0},
		{f: 437, armRZ: -0.75, armRX: -0.2, lean: -0.06, headZ: 0.18, y: 0.08, ease: 'back'},
		{f: 442, armRZ: -0.75, armRX: -0.2, lean: -0.06, headZ: 0.18, y: 0.08},
		{f: 446, armRZ: 0, armRX: 0, lean: 0, headZ: 0, y: 0},
		// Walk off chewing, waving at the camera
		{f: 446, rotY: -PI},
		{f: 452, rotY: -PI / 2, headY: 0, armLX: -1.3},
		{f: 456, headY: 0.7, armLX: -0.9, armLZ: -0.1},
		...walk(452, 500, [E_SPOT.x, E_SPOT.z], [E_EXIT.x, E_EXIT.z], 8, false),
		{f: 452, armRX: 0, armRZ: 0},
		{f: 458, armRX: -2.9, armRZ: -0.3, ease: 'back'},
		...[464, 470, 476, 482, 488, 494].map((f, i): Key => ({f, armRZ: i % 2 ? -0.05 : -0.6})),
		...alternate(452, 500, 'chewA', 'chewB', 6, 0),
	],
};

// ---------- Camera ----------

type Shot = {from: number; to: number; p0: number[]; p1: number[]; t0: number[]; t1: number[]; fov: number};

// Close-up in front of a character's face.
const faceCam = (s: Spot, d: number, side: number, y = 4.45) => {
	const dx = Math.sin(s.rotY);
	const dz = Math.cos(s.rotY);
	return [s.x + dx * d + dz * side, y, s.z + dz * d - dx * side];
};
const headOf = (s: {x: number; z: number}) => [s.x, 4.55, s.z];

const E_END: Spot = {...E_SPOT, rotY: -1.78 * PI};
const IMPACT = 224;

const SHOTS: Shot[] = [
	// Wide establishing push-in
	{from: 0, to: 72, p0: [0, 8.5, 28], p1: [0, 7.0, 21], t0: [0, 2.8, -1], t1: [0, 3.0, -1], fov: 32},
	// Quick close-ups as each one locks onto the slice
	{from: 72, to: 87, p0: faceCam(SPOT.A, 4.4, 0.8), p1: faceCam(SPOT.A, 3.7, 0.7), t0: headOf(SPOT.A), t1: headOf(SPOT.A), fov: 30},
	{from: 87, to: 102, p0: faceCam(SPOT.B, 4.4, -0.8), p1: faceCam(SPOT.B, 3.7, -0.7), t0: headOf(SPOT.B), t1: headOf(SPOT.B), fov: 30},
	{from: 102, to: 117, p0: faceCam(SPOT.C, 4.4, 0.6), p1: faceCam(SPOT.C, 3.7, 0.5), t0: headOf(SPOT.C), t1: headOf(SPOT.C), fov: 30},
	{from: 117, to: 132, p0: faceCam(SPOT.D, 4.4, -0.6), p1: faceCam(SPOT.D, 3.7, -0.5), t0: headOf(SPOT.D), t1: headOf(SPOT.D), fov: 30},
	// Low standoff orbit around the box
	{from: 132, to: 204, p0: [8, 3.4, 12.5], p1: [-7, 3.4, 12.5], t0: [0, 3.3, -1], t1: [0, 3.3, -1], fov: 34},
	// Crouch and launch
	{from: 204, to: 219, p0: [0, 9, 19], p1: [0, 8.4, 16.5], t0: [0, 3.0, -1], t1: [0, 3.4, -1], fov: 36},
	// Tight on the heads as they meet
	{from: 219, to: 238, p0: [0, P.y + 0.3, 9.0], p1: [0, P.y + 0.1, 7.6], t0: [P.x, P.y, P.z], t1: [P.x, P.y, P.z], fov: 32},
	// High wide as they fly back and land
	{from: 238, to: 256, p0: [0, 11, 20], p1: [0, 10, 18], t0: [0, 2, -2], t1: [0, 1.8, -2], fov: 40},
	// The thief walks in and takes it
	{from: 256, to: 340, p0: [13, 6.2, 14], p1: [8.5, 5.4, 9.5], t0: [3, 3.0, 1.0], t1: [0.4, 3.3, 1.2], fov: 36},
	// Close on the eating, the others glaring behind
	{from: 340, to: 420, p0: faceCam(E_END, 6.0, -2.0, 4.8), p1: faceCam(E_END, 4.9, -1.5, 4.8), t0: [0.5, 4.4, 3.0], t1: [0.5, 4.5, 3.0], fov: 32},
	// Over the friends' shoulders: the smug shrug
	{from: 420, to: 450, p0: [0.8, 5.4, -12.5], p1: [0.8, 5.2, -10.5], t0: [0.5, 4.3, 3.0], t1: [0.5, 4.4, 3.0], fov: 30},
	// Walking off, waving
	{from: 450, to: 498, p0: [0, 7, 24], p1: [-4, 6.8, 22], t0: [0, 3, 0], t1: [-6, 3, 0], fov: 34},
	// Defeat
	{from: 498, to: 528, p0: [6, 8.8, 18], p1: [5, 8.0, 15.5], t0: [1.5, 1.6, -3.0], t1: [1.5, 1.6, -3.0], fov: 42},
];

const CameraRig: React.FC<{frame: number}> = ({frame}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	const shot = SHOTS.find((s) => frame >= s.from && frame < s.to) ?? SHOTS[SHOTS.length - 1];
	const t = interpolate(frame, [shot.from, shot.to], [0, 1], {
		easing: Easing.inOut(Easing.sin),
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const lerp = (a: number[], b: number[]) => a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];
	const pos = lerp(shot.p0, shot.p1);
	const target = lerp(shot.t0, shot.t1);
	// Short, decaying camera shake on the bonk
	if (frame >= IMPACT && frame < IMPACT + 12) {
		const k = 1 - (frame - IMPACT) / 12;
		pos[0] += Math.sin(frame * 2.1) * 0.22 * k;
		pos[1] += Math.cos(frame * 2.9) * 0.16 * k;
	}
	camera.position.set(...pos);
	camera.fov = shot.fov;
	camera.lookAt(...target);
	camera.updateProjectionMatrix();
	return null;
};

// ---------- Sound ----------

type Cue = {f: number; file: string; vol?: number};
const sfx = (file: string, frames: number[], vol = 1): Cue[] => frames.map((f) => ({f, file, vol}));

const CUES: Cue[] = [
	{f: 0, file: 'ambience', vol: 0.45},
	{f: 50, file: 'notice', vol: 0.9},
	...sfx('hit', [81, 95, 109, 126], 0.8),
	{f: 132, file: 'tension', vol: 0.5},
	...sfx('click', [160, 164, 168, 172], 0.6),
	{f: 180, file: 'swish', vol: 0.35},
	...sfx('rustle', [198], 0.4),
	{f: 207, file: 'whoosh', vol: 0.9},
	{f: IMPACT, file: 'bonk', vol: 1},
	{f: IMPACT + 3, file: 'ring', vol: 0.55},
	{f: 236, file: 'whoosh', vol: 0.5},
	...sfx('thud', [251, 252, 253], 0.85),
	...sfx('thud', [257], 0.4),
	...sfx('step', stepFrames(258, 292), 0.7),
	...sfx('rustle', [304, 311], 0.6),
	{f: 332, file: 'swish', vol: 0.3},
	{f: BITE1, file: 'crunch', vol: 1},
	...sfx('munch', [362, 370, 378], 0.75),
	{f: 384, file: 'gulp', vol: 0.9},
	{f: BITE2, file: 'crunch', vol: 1},
	...sfx('munch', [404, 412], 0.75),
	{f: 434, file: 'swish', vol: 0.35},
	...sfx('step', stepFrames(452, 500), 0.55),
	...sfx('munch', [458, 470, 482], 0.4),
	{f: 500, file: 'sadtrombone', vol: 0.8},
	...sfx('thud', [505], 0.6),
];

const Sound: React.FC = () => (
	<>
		{CUES.map((c, i) => (
			<Sequence key={i} from={c.f} layout="none">
				<Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol ?? 1} />
			</Sequence>
		))}
	</>
);

// ---------- Environment & lighting ----------

const Environment: React.FC = () => (
	<>
		<color attach="background" args={['#e3d9a6']} />
		<fog attach="fog" args={['#e3d9a6', 34, 90]} />
		{/* Sky/ground fill: warm from above, grassy bounce from below */}
		<hemisphereLight args={['#fff1d0', '#6f8550', 0.75]} />
		{/* Warm late-afternoon key light with soft shadows */}
		<directionalLight
			position={[14, 20, 12]}
			intensity={2.3}
			color="#ffe0ad"
			castShadow
			shadow-mapSize={[2048, 2048]}
			shadow-bias={-0.0004}
			shadow-normalBias={0.03}
			shadow-camera-left={-20}
			shadow-camera-right={20}
			shadow-camera-top={18}
			shadow-camera-bottom={-14}
			shadow-camera-near={1}
			shadow-camera-far={70}
		/>
		{/* Cool rim light from behind to separate the blocky silhouettes */}
		<directionalLight position={[-10, 9, -16]} intensity={1.1} color="#b9d4ff" />
		{/* Soft front fill so faces never go muddy */}
		<directionalLight position={[0, 6, 20]} intensity={0.35} color="#fff6e6" />

		{/* Grass court with painted lines */}
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[300, 300]} />
			<meshStandardMaterial color="#7da563" roughness={1} />
		</mesh>
		{[
			[0, -9, 40, 0.15],
			[-14, 0, 0.15, 30],
			[14, 0, 0.15, 30],
		].map(([x, z, w, d]) => (
			<mesh key={`${x}${z}`} position={[x, 0.01, z]} rotation={[-PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[w, d]} />
				<meshStandardMaterial color="#e9ecdf" roughness={1} />
			</mesh>
		))}
		<Fence z={-13} from={-36} to={36} />
		{/* Buildings beyond the fence */}
		{[
			{x: -22, w: 16, h: 13, c: '#e8dcb7'},
			{x: -3, w: 14, h: 18, c: '#d8a27a'},
			{x: 16, w: 18, h: 12, c: '#eadfc0'},
			{x: 34, w: 12, h: 15, c: '#cfb48e'},
		].map((b) => (
			<group key={b.x} position={[b.x, b.h / 2, -34]}>
				<mesh receiveShadow castShadow>
					<boxGeometry args={[b.w, b.h, 9]} />
					<meshStandardMaterial color={b.c} roughness={0.95} />
				</mesh>
				{Array.from({length: Math.floor(b.h / 3.5)}, (_, i) => (
					<group key={i}>
						<mesh position={[0, -b.h / 2 + 2.5 + i * 3.5, 4.51]}>
							<planeGeometry args={[b.w - 2, 1.3]} />
							<meshStandardMaterial color="#7f7a62" roughness={0.4} metalness={0.2} />
						</mesh>
						<mesh position={[0, -b.h / 2 + 1.6 + i * 3.5, 4.6]}>
							<boxGeometry args={[b.w, 0.18, 0.3]} />
							<meshStandardMaterial color="#f4ecd4" roughness={0.9} />
						</mesh>
					</group>
				))}
			</group>
		))}
	</>
);

// ---------- Scene ----------

export const LastSlice: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const imgs = useShirts([A, B, C, D, E].map((c) => c.shirt));
	if (!imgs) return null;

	const f2 = onTwos(frame);
	const poseOf = (who: keyof typeof tracks, phase: number) => add(sample(tracks[who], f2), breathe(f2, phase));
	const grabbed = f2 >= GRAB;
	const stage = f2 >= BITE2 ? 2 : f2 >= BITE1 ? 1 : 0;
	const held = (
		<group position={[-0.15, 0.1, 0.35]} rotation={[0.35, -PI / 2, 0]} scale={0.8}>
			<Slice stage={stage} />
		</group>
	);
	const cast: {props: CharacterProps; pose: ReturnType<typeof poseOf>; hold?: React.ReactNode}[] = [
		{props: A, pose: poseOf('A', 0)},
		{props: B, pose: poseOf('B', 1.3)},
		{props: C, pose: poseOf('C', 2.1)},
		{props: D, pose: poseOf('D', 3.4)},
		{props: E, pose: poseOf('E', 0.7), hold: grabbed ? held : undefined},
	];

	return (
		<AbsoluteFill style={{filter: 'sepia(0.14) saturate(1.02) contrast(1.04)'}}>
			<Sound />
			<ThreeCanvas width={width} height={height} shadows>
				<CameraRig frame={frame} />
				<Environment />
				<Table />
				<group position={[0, TABLE_TOP, 0]}>
					<PizzaBox>
						{grabbed ? null : (
							<group position={[0.15, 0.05, 0.05]} rotation={[0, 0.5, 0]} scale={0.8}>
								<Slice />
							</group>
						)}
					</PizzaBox>
				</group>
				{cast.map(({props, pose, hold}) => (
					<Character key={props.shirt} {...props} img={imgs[props.shirt]} pose={pose} holdL={hold} />
				))}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
