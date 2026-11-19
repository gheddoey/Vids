import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Character, CharacterProps, FaceType, Pose, REST} from './Character';
import {useShirts} from './Lineup';
import {Bar, Coins, Glass, Photo, Pitcher} from './BarProps';
import {Key, add, breathe, onTwos, sample} from './anim';

// Blocky homage to the iced-tea scene: a desert bar, a barkeeper, four thirsty
// and very suspicious travellers. Long holds trimmed so there is no dead air.
export const ICED_TEA_FRAMES = 528; // 22 s at 24 fps

const PI = Math.PI;
const TOP = 2.45; // counter top

type Who = 'BK' | 'JT' | 'AV' | 'JS' | 'PN';

const CAST: Record<Who, CharacterProps> = {
	BK: {shirt: 'ts_barkeep', skin: '#6e4a33', pants: '#3b302a', face: 'talkB'},
	JT: {
		shirt: 'ts_jotaro',
		skin: '#e8bf93',
		pants: '#1b1c22',
		face: 'squint',
		hair: {type: 'short', color: '#15161a'},
		hat: {type: 'schoolcap', color: '#1d1f26', accent: '#d8b24a'},
	},
	AV: {
		shirt: 'ts_avdol',
		skin: '#7a4e33',
		pants: '#d9c9a6',
		face: 'squint',
		hair: {type: 'braids', color: '#1a1412'},
		hat: {type: 'headband', color: '#f0ebe0', accent: '#e2cf9e'},
		shades: true,
	},
	JS: {
		shirt: 'ts_joseph',
		skin: '#e9c39a',
		pants: '#4a4438',
		face: 'serious',
		hair: {type: 'short', color: '#b9b9b9'},
		hat: {type: 'safari', color: '#a89668', accent: '#5a4a30'},
		beard: '#c9c9c9',
	},
	PN: {shirt: 'ts_polnareff', skin: '#f0d0b0', pants: '#c3c6cc', face: 'squint', hair: {type: 'flattop', color: '#d7dbe2'}},
};

// Customers stand in a row facing the counter (-z). Seen from behind the bar,
// left to right: tall one, fortune teller, old man, flat-top.
const SPOT: Record<Exclude<Who, 'BK'>, number> = {JT: 6, AV: 2, JS: -2, PN: -6};
const CUST_Z = 1.75;
const BK_SPOT = {x: 0, z: -1.8}; // in the gap between the old man and the fortune teller

// ---------- Forward kinematics: where a hand is in the world ----------

const m4 = (pos: number[], rot: number[]) =>
	new THREE.Matrix4().compose(
		new THREE.Vector3(pos[0], pos[1], pos[2]),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])),
		new THREE.Vector3(1, 1, 1),
	);
const handOf = (pose: Partial<Pose>, side: 'L' | 'R') => {
	const p = {...REST, ...pose};
	const s = side === 'L' ? 1 : -1;
	const ax = side === 'L' ? p.armLX : p.armRX;
	const az = side === 'L' ? p.armLZ : p.armRZ;
	const m = m4([p.x, p.y, p.z], [0, p.rotY, 0])
		.multiply(m4([0, 2, 0], [p.lean, p.twist, p.side]))
		.multiply(m4([s * 1.5, 1.75, 0], [ax, 0, az]))
		.multiply(m4([0, 0.25, 0], [0, 0, 0]));
	return new THREE.Vector3(0, -2.0, 0.15).applyMatrix4(m);
};

// ---------- Key helpers ----------

const talk = (f0: number, f1: number, step = 4): Key[] => {
	const k: Key[] = [];
	for (let f = f0, i = 0; f < f1; f += step, i++) k.push({f, face: (i % 2 ? 'talkB' : 'talkA') as FaceType});
	k.push({f: f1, face: 'talkB'});
	return k;
};

// Barkeeper's pour poses: one per glass. Glasses are placed under the pitcher from these.
const POUR = [0.78, 0.44, 0.1, -0.24].map((armLZ) => ({lean: 0.22, armLX: -1.72, armLZ, twist: 0}));
const POUR_F = [206, 220, 234, 248]; // pour start per glass (each pour lasts 10 frames)
const bkBase = {x: BK_SPOT.x, z: BK_SPOT.z, rotY: 0};
const pitcherOffset = new THREE.Vector3(-0.42, -0.55, 0);
const GLASS_ON_COUNTER = POUR.map((p) => {
	const h = handOf({...bkBase, ...p}, 'L');
	// Spout sits ~0.85 to the -x side of the pitcher's origin when tipped to pour.
	return new THREE.Vector3(h.x + pitcherOffset.x - 0.85, TOP, h.z);
});

// Customers' grab pose (right hand) and where their glass waits on the counter.
const GRAB_POSE = {lean: 0.28, armRX: -1.15, armRZ: 0.05};
const custBase = (w: Exclude<Who, 'BK'>) => ({x: SPOT[w], z: CUST_Z, rotY: PI});
const GLASS_AT = (w: Exclude<Who, 'BK'>) => {
	const h = handOf({...custBase(w), ...GRAB_POSE}, 'R');
	return new THREE.Vector3(h.x, TOP, h.z);
};

// Drinking: staggered starts, tall one first.
const DRINK: Record<Exclude<Who, 'BK'>, number> = {JT: 470, AV: 478, JS: 484, PN: 490};

const customer = (w: Exclude<Who, 'BK'>, extra: Key[]): Key[] => {
	const d = DRINK[w];
	return [
		{f: 0, ...custBase(w), lean: 0.05, headX: 0.05},
		...extra,
		// Suspicious stare
		{f: 262, face: 'squint'},
		// Eyes dart: glance at each other
		{f: 396, headY: 0},
		{f: 402, headY: w === 'JT' || w === 'AV' ? 0.3 : -0.3, ease: 'snap'},
		{f: 412, headY: 0, ease: 'snap'},
		// Reach for the glass
		{f: 424, lean: 0.05, armRX: 0, armRZ: 0},
		{f: 436, ...GRAB_POSE, ease: 'out'},
		{f: 446, lean: 0.05, armRX: -1.4, armRZ: 0.1},
		// Drink: glass up, head back, then hold
		{f: d, armRX: -1.4, armRZ: 0.1, headX: 0.05, lean: 0.05, face: 'squint'},
		{f: d + 10, armRX: -2.15, armRZ: 0.55, headX: -0.4, lean: -0.1, face: 'calm', ease: 'out'},
		{f: d + 30, armRX: -2.3, armRZ: 0.55, headX: -0.5, lean: -0.12},
	];
};

const tracks: Record<Who, Key[]> = {
	BK: [
		{f: 0, ...bkBase, lean: 0.28, armLX: -1.0, armRX: -1.0, armLZ: 0.1, armRZ: -0.1, headX: -0.05},
		...talk(0, 34),
		// Thumb over the shoulder: "the man you're after went that way"
		{f: 34, armRX: -1.0, armRZ: -0.1, headY: 0, lean: 0.28},
		{f: 44, armRX: 0.5, armRZ: -2.0, headY: -0.35, lean: 0.1, ease: 'back'},
		...talk(46, 58),
		{f: 60, armRX: -1.0, armRZ: -0.1, headY: 0, lean: 0.28},
		// Straightens up when the old man stops him
		{f: 100, lean: 0.28},
		{f: 110, lean: 0.05, armLX: 0, armRX: 0, armLZ: 0, armRZ: 0},
		// Pour into each glass
		{f: 192, lean: 0.05, armLX: 0, armLZ: 0, twist: 0},
		{f: 202, ...POUR[0], ease: 'out'},
		...POUR.flatMap((p, i) => [
			{f: POUR_F[i], ...p},
			{f: POUR_F[i] + 10, ...p},
		]),
		{f: 262, lean: 0.05, armLX: 0, armLZ: 0, twist: 0},
		// Gestures at the drinks, then turns his back on them
		{f: 336, face: 'talkB', armLX: 0, armLZ: 0, headY: 0},
		{f: 344, armLX: -1.3, armLZ: 0.35, ease: 'back'},
		...talk(344, 362),
		{f: 366, armLX: 0, armLZ: 0, rotY: 0, x: BK_SPOT.x, z: BK_SPOT.z},
		{f: 380, rotY: PI, z: BK_SPOT.z - 0.7, ease: 'inOut'},
		{f: 390, headX: 0.1},
		// Wanders off along the shelves
		{f: 392, x: BK_SPOT.x, z: BK_SPOT.z - 0.7},
		{f: 424, x: 9.6, z: -3.2, rotY: PI / 2},
	],
	JT: customer('JT', [{f: 0, face: 'serious'}]),
	AV: customer('AV', [{f: 0, face: 'serious'}]),
	JS: customer('JS', [
		{f: 0, face: 'serious'},
		// "Hold on." Raises a hand
		{f: 66, armLX: 0, armLZ: 0, headX: 0.05},
		{f: 76, armLX: -2.35, armLZ: 0.4, headX: -0.05, face: 'squint', ease: 'back'},
		{f: 98, armLX: -2.25, armLZ: 0.4},
		{f: 110, armLX: 0, armLZ: 0, face: 'serious'},
		// Slides the coins across
		{f: 140, lean: 0.05, armRX: 0, armRZ: 0},
		{f: 152, lean: 0.35, armRX: -1.3, armRZ: 0.05, ease: 'out'},
		{f: 164, lean: 0.38, armRX: -1.42, armRZ: 0.0},
		{f: 178, lean: 0.05, armRX: 0, armRZ: 0, ease: 'inOut'},
	]),
	PN: customer('PN', [{f: 0, face: 'serious'}]),
};

const COINS_DOWN = 164;
const coinHand = handOf({...custBase('JS'), lean: 0.38, armRX: -1.42, armRZ: 0.0}, 'R');

// ---------- Camera ----------

type Shot = {from: number; to: number; p0: number[]; p1: number[]; t0: number[]; t1: number[]; fov: number};

const SHOTS: Shot[] = [
	// Barkeeper over the old man's shoulder
	{from: 0, to: 60, p0: [0.1, 6.4, 6.4], p1: [0.0, 6.2, 5.7], t0: [0, 4.3, -1.8], t1: [0, 4.3, -1.8], fov: 32},
	// The old man: "hold on"
	{from: 60, to: 104, p0: [-3.6, 4.85, -1.1], p1: [-3.4, 4.8, -0.8], t0: [-2, 4.7, CUST_Z], t1: [-2, 4.7, CUST_Z], fov: 34},
	// Wide from the back corner: everyone, and the bright doorway
	{from: 104, to: 140, p0: [-11, 7.4, -3.6], p1: [-10.6, 7.2, -3.4], t0: [0, 3.4, 2.4], t1: [0.4, 3.4, 2.4], fov: 46},
	// Coins slid across the counter
	{from: 140, to: 188, p0: [-3.9, 3.5, -1.3], p1: [-3.6, 3.4, -1.1], t0: [coinHand.x, 2.6, coinHand.z + 0.3], t1: [coinHand.x, 2.6, coinHand.z + 0.3], fov: 34},
	// The pour
	{from: 188, to: 262, p0: [0.2, 9.3, 4.4], p1: [0.2, 9.1, 4.0], t0: [0.7, 2.9, -0.1], t1: [0.7, 2.9, -0.1], fov: 34},
	// Four suspicious faces, staggered down the row
	{from: 262, to: 302, p0: [11.0, 5.0, -0.9], p1: [10.4, 4.95, -0.7], t0: [-2, 4.6, CUST_Z], t1: [-2, 4.6, CUST_Z], fov: 30},
	// The glasses against the bright doorway
	{from: 302, to: 336, p0: [2.7, 2.95, -0.95], p1: [2.5, 2.9, -0.85], t0: [0.4, 2.8, 0.5], t1: [0.4, 2.8, 0.5], fov: 36},
	// Barkeeper gestures and turns his back
	{from: 336, to: 392, p0: [0.3, 6.4, 6.2], p1: [0.2, 6.3, 5.6], t0: [0, 4.2, -2.0], t1: [0, 4.2, -2.4], fov: 32},
	// The faces again: eyes dart
	{from: 392, to: 424, p0: [10.4, 4.95, -0.7], p1: [10.0, 4.9, -0.5], t0: [-2, 4.6, CUST_Z], t1: [-2, 4.6, CUST_Z], fov: 30},
	// Hands go for the glasses
	{from: 424, to: 452, p0: [-3.4, 4.4, -2.9], p1: [-3.2, 4.3, -2.7], t0: [0.8, 3.0, 0.4], t1: [0.8, 3.1, 0.4], fov: 46},
	// Low angle: everyone drinks
	{from: 452, to: 490, p0: [4.0, 4.3, -3.7], p1: [4.0, 4.2, -3.5], t0: [4.0, 4.9, CUST_Z], t1: [4.0, 5.0, CUST_Z], fov: 42},
	{from: 490, to: 528, p0: [-4.0, 4.3, -3.7], p1: [-4.0, 4.2, -3.5], t0: [-4.0, 4.9, CUST_Z], t1: [-4.0, 5.0, CUST_Z], fov: 42},
];

const CameraRig: React.FC<{frame: number}> = ({frame}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	const shot = SHOTS.find((s) => frame >= s.from && frame < s.to) ?? SHOTS[SHOTS.length - 1];
	const t = interpolate(frame, [shot.from, shot.to], [0, 1], {easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const lerp = (a: number[], b: number[]) => a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];
	camera.position.set(...lerp(shot.p0, shot.p1));
	camera.fov = shot.fov;
	camera.near = 0.1;
	camera.lookAt(...lerp(shot.t0, shot.t1));
	camera.updateProjectionMatrix();
	return null;
};

// ---------- Lighting ----------

const Lights: React.FC = () => (
	<>
		<color attach="background" args={['#9fd6ea']} />
		{/* Low, warm-brown ambient so the interior stays moody */}
		<hemisphereLight args={['#d9e6ea', '#4a3a2a', 0.45]} />
		{/* Hard desert sun pouring in through the doorway: rim-lights the row and lays shadows across the floor */}
		<directionalLight
			position={[7, 16, 34]}
			intensity={3.2}
			color="#fff0cf"
			castShadow
			shadow-mapSize={[2048, 2048]}
			shadow-bias={-0.0004}
			shadow-normalBias={0.03}
			shadow-camera-left={-22}
			shadow-camera-right={22}
			shadow-camera-top={22}
			shadow-camera-bottom={-10}
			shadow-camera-near={1}
			shadow-camera-far={90}
		/>
		{/* Warm hanging lamps over the counter */}
		<pointLight position={[-3, 8.6, -0.6]} intensity={55} color="#ffc27a" distance={18} decay={2} />
		<pointLight position={[4, 8.6, -0.6]} intensity={45} color="#ffc27a" distance={18} decay={2} />
		{/* Cool bounce from the bright doorway onto faces at the counter */}
		<pointLight position={[0, 5, 5.5]} intensity={22} color="#bfe2ff" distance={16} decay={2} />
		{/* Soft glow behind the bar so the shelves and bottles read */}
		<pointLight position={[0, 5.5, -2.8]} intensity={18} color="#8fb6c4" distance={12} decay={2} />
		{/* Lamp fixtures */}
		{[-3, 4].map((x) => (
			<group key={x} position={[x, 8.9, -0.6]}>
				<mesh>
					<cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
					<meshStandardMaterial color="#2a2a2a" />
				</mesh>
				<mesh position={[0, -0.6, 0]}>
					<coneGeometry args={[0.5, 0.4, 12, 1, true]} />
					<meshStandardMaterial color="#3a3226" side={THREE.DoubleSide} />
				</mesh>
				<mesh position={[0, -0.7, 0]}>
					<sphereGeometry args={[0.14, 10, 8]} />
					<meshStandardMaterial color="#fff2c8" emissive="#ffd38a" emissiveIntensity={2.5} />
				</mesh>
			</group>
		))}
	</>
);

// ---------- Sound ----------

type Cue = {f: number; file: string; vol?: number};
const CUES: Cue[] = [
	{f: 0, file: 'bar_ambience', vol: 0.5},
	{f: 44, file: 'swish', vol: 0.3},
	{f: 76, file: 'swish', vol: 0.35},
	{f: 160, file: 'coins', vol: 0.9},
	{f: 202, file: 'swish', vol: 0.2},
	...POUR_F.map((f) => ({f, file: 'pour', vol: 0.8})),
	...POUR_F.map((f) => ({f: f + 3, file: 'ice', vol: 0.5})),
	{f: 262, file: 'tension', vol: 0.35},
	{f: 344, file: 'swish', vol: 0.25},
	{f: 368, file: 'swish', vol: 0.35},
	{f: 392, file: 'tension', vol: 0.3},
	...[436, 437, 438, 439].map((f) => ({f, file: 'glass', vol: 0.7})),
	...Object.values(DRINK).flatMap((d) => [
		{f: d + 14, file: 'gulp', vol: 0.75},
		{f: d + 24, file: 'gulp', vol: 0.6},
		{f: d + 12, file: 'ice', vol: 0.3},
	]),
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

// ---------- Scene ----------

const GLASS_UP = 188; // glasses appear on the counter for the pour
const GLASS_MOVE = 424; // cheat across the cut: each glass now waits in front of its drinker
const GRAB = 436;

export const IcedTea: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const imgs = useShirts(Object.values(CAST).map((c) => c.shirt));
	if (!imgs) return null;

	const f2 = onTwos(frame);
	const phase: Record<Who, number> = {BK: 0, JT: 1.1, AV: 2.3, JS: 3.1, PN: 4.2};
	const poses = Object.fromEntries((Object.keys(tracks) as Who[]).map((w) => [w, add(sample(tracks[w], f2), breathe(f2, phase[w]))])) as Record<
		Who,
		Partial<Pose>
	>;

	// Pitcher: rests on the counter, rides in the barkeeper's left hand while pouring.
	const pouring = f2 >= 200 && f2 < 262;
	const bkHand = handOf(poses.BK, 'L');
	const pourIdx = POUR_F.findIndex((f) => f2 >= f && f2 < f + 10);
	const tiltTarget = pourIdx >= 0 ? interpolate(f2 - POUR_F[pourIdx], [0, 3, 8, 10], [0, 1.05, 1.05, 0.2]) : 0;
	const pitcherPos = pouring ? bkHand.clone().add(pitcherOffset) : new THREE.Vector3(2.6, TOP, -0.35);
	const pitcherTilt = pouring ? tiltTarget : 0;

	// Fill levels for the four glasses.
	const fillOf = (i: number) => interpolate(f2, [POUR_F[i] + 2, POUR_F[i] + 9], [0, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const drinkers: Exclude<Who, 'BK'>[] = ['JT', 'AV', 'JS', 'PN'];
	const drinkFill = (w: Exclude<Who, 'BK'>) =>
		interpolate(f2, [DRINK[w] + 10, DRINK[w] + 32], [0.85, 0.12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	const glasses = drinkers.map((w, i) => {
		if (f2 < GLASS_UP) return null;
		if (f2 < GLASS_MOVE) {
			const at = GLASS_ON_COUNTER[i];
			return (
				<group key={w} position={at}>
					<Glass fill={fillOf(i)} />
				</group>
			);
		}
		if (f2 < GRAB) {
			return (
				<group key={w} position={GLASS_AT(w)}>
					<Glass fill={0.85} />
				</group>
			);
		}
		// Held: follows the right hand, tipping toward the face as the arm rises.
		const p = poses[w];
		const h = handOf(p, 'R');
		const tip = Math.max(0, -((p.armRX ?? 0) + PI / 2)) * 0.95;
		return (
			<group key={w} position={[h.x, h.y - 0.28, h.z]} rotation={[0, p.rotY ?? PI, 0]}>
				<group rotation={[tip, 0, 0]}>
					<Glass fill={drinkFill(w)} />
				</group>
			</group>
		);
	});

	// Stream of tea from the spout while pouring.
	const spout = new THREE.Vector3(-0.42, 0.74, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), pitcherTilt).add(pitcherPos);
	const showStream = pourIdx >= 0 && f2 - POUR_F[pourIdx] >= 2 && f2 - POUR_F[pourIdx] < 9;
	const streamTop = spout.y;
	const streamBottom = TOP + 0.25;

	const coinsPos = f2 < COINS_DOWN ? handOf(poses.JS, 'R') : new THREE.Vector3(coinHand.x, TOP, coinHand.z);
	const showCoins = f2 >= 148;

	return (
		<AbsoluteFill style={{filter: 'saturate(1.05) contrast(1.06)'}}>
			<Sound />
			<ThreeCanvas width={width} height={height} shadows>
				<CameraRig frame={frame} />
				<Lights />
				<Bar />
				<group position={[1.3, TOP, 0.25]}>
					<Photo />
				</group>
				<group position={pitcherPos} rotation={[0, 0, pitcherTilt]}>
					<Pitcher />
				</group>
				{showStream ? (
					<mesh position={[spout.x, (streamTop + streamBottom) / 2, spout.z]}>
						<cylinderGeometry args={[0.035, 0.045, Math.max(0.05, streamTop - streamBottom), 8]} />
						<meshStandardMaterial color="#b8682b" transparent opacity={0.85} roughness={0.2} />
					</mesh>
				) : null}
				{showCoins ? (
					<group position={[coinsPos.x, f2 < COINS_DOWN ? coinsPos.y - 0.1 : TOP, coinsPos.z]}>
						<Coins />
					</group>
				) : null}
				{glasses}
				{(Object.keys(CAST) as Who[]).map((w) => (
					<Character key={w} {...CAST[w]} img={imgs[CAST[w].shirt]} pose={poses[w]} />
				))}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
