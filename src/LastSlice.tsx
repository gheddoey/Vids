import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Character, CharacterProps} from './Character';
import {CAST, useShirts} from './Lineup';
import {Fence, PizzaBox, Slice, Table} from './Props';
import {Key, add, breathe, onTwos, sample, walk} from './anim';

// "The Last Slice": four friends, one slice left, a standoff, a dive, a bonk,
// and a calm passer-by who walks off with the prize.
export const LAST_SLICE_FRAMES = 384; // 16 s at 24 fps

const PI = Math.PI;
const TABLE_TOP = 2.29;

const byShirt = (s: string) => CAST.find((c) => c.shirt === s)!;
const A = byShirt('pilot');
const B = byShirt('plaid');
const C = byShirt('varsity');
const D = byShirt('wings');
const E = byShirt('bluejacket');

// Standing spots around the table.
const SPOT = {
	A: {x: -4.6, z: 0, rotY: PI / 2},
	B: {x: 4.6, z: 0, rotY: -PI / 2},
	C: {x: -2.4, z: -3.6, rotY: 0.3},
	D: {x: 2.4, z: -3.6, rotY: -0.3},
};
const LYING = {y: -1.5, lean: -PI / 2, legLX: -PI / 2, legRX: -PI / 2, armLZ: 0.5, armRZ: -0.5, armLX: 0, armRX: 0};
const SITTING = {y: -1.5, lean: 0.05, legLX: -PI / 2, legRX: -PI / 2, armLX: -0.3, armRX: -0.3, armLZ: 0.15, armRZ: -0.15};

// Dive -> bonk -> fly back -> lie dazed -> sit up and glare at the thief.
const diveKeys = (s: {x: number; z: number}, dive: {x: number; z: number}, out: {x: number; z: number}, look: number): Key[] => [
	// Hold the spot until the jump
	{f: 202, x: s.x, z: s.z},
	// Anticipation: sink and lean back
	{f: 192, y: 0, lean: 0.22, legLX: 0, legRX: 0},
	{f: 202, y: -0.25, lean: -0.15, armLX: 0.5, armRX: 0.5, armLZ: 0.2, armRZ: -0.2, ease: 'out'},
	// Dive
	{f: 222, x: dive.x, z: dive.z, y: 1.3, lean: 1.3, armLX: -2.9, armRX: -2.9, armLZ: 0.1, armRZ: -0.1, legLX: 0.6, legRX: 0.4, headX: -0.5, ease: 'out'},
	// Bonk
	{f: 226, x: dive.x, z: dive.z, face: 'calm', ease: 'linear'},
	// Fly back, flailing
	{f: 236, x: (s.x + out.x) / 2, z: (s.z + out.z) / 2, y: 1.8, lean: -0.8, armLX: -1.2, armRX: -2.2, armLZ: 2.2, armRZ: -2.0, legLX: -0.6, legRX: 0.3, headX: -0.3, ease: 'snap'},
	// Land on their backs
	{f: 250, x: out.x, z: out.z, ...LYING, headX: 0, ease: 'in'},
	{f: 254, y: -1.35, ease: 'out'},
	{f: 258, y: -1.5, ease: 'in'},
	// Sit up, then glare at the thief
	{f: 318, ...LYING, face: 'calm'},
	{f: 334, ...SITTING, face: 'serious', ease: 'back'},
	{f: 346, headY: look, headX: 0.05},
];

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
		{f: 81, face: 'serious', headX: 0.4},
		// Standoff: lean in, hands ready at the sides
		{f: 136, lean: 0, armLZ: 0, armRZ: 0, armLX: 0, armRX: 0},
		{f: 150, lean: 0.22, armLZ: 0.4, armRZ: -0.4, armLX: -0.25, armRX: -0.25, headX: 0.2},
		// Twitchy fingers
		{f: 160, armRZ: -0.45},
		{f: 164, armRZ: -0.38},
		{f: 168, armRZ: -0.46},
		{f: 172, armRZ: -0.4},
		...diveKeys(SPOT.A, {x: -2.3, z: 0}, {x: -7.2, z: 0.4}, 0.9),
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
		{f: 95, face: 'serious', headX: 0.4},
		{f: 136, lean: 0, armLZ: 0, armRZ: 0, armLX: 0, armRX: 0},
		{f: 150, lean: 0.25, armLZ: 0.45, armRZ: -0.35, armLX: -0.3, armRX: -0.2, headX: 0.2},
		// Narrows in, head tilt
		{f: 176, headZ: 0},
		{f: 182, headZ: 0.12, ease: 'snap'},
		...diveKeys(SPOT.B, {x: 2.3, z: 0}, {x: 7.2, z: 0.6}, -0.9),
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
		{f: 109, face: 'serious', headX: 0.42},
		{f: 136, lean: 0, armLZ: 0, armRZ: 0, armLX: 0, armRX: 0},
		{f: 150, lean: 0.2, armLZ: 0.35, armRZ: -0.35, armLX: -0.3, armRX: -0.3, headX: 0.2},
		...diveKeys(SPOT.C, {x: -1.0, z: -1.6}, {x: -4.0, z: -7.0}, 0.35),
	],
	D: [
		{f: 0, ...SPOT.D, face: 'mustache', headY: -0.6},
		// Arms crossed-ish, listening
		{f: 0, armLX: -0.9, armRX: -0.9, armLZ: -0.5, armRZ: 0.5},
		{f: 44, armLX: -0.9, armRX: -0.9, armLZ: -0.5, armRZ: 0.5, headY: -0.6},
		{f: 52, headY: 0.35, headX: 0.35, ease: 'snap'},
		// The glare tightens
		{f: 122, headX: 0.35},
		{f: 126, headX: 0.5, ease: 'snap'},
		{f: 136, armLX: -0.9, armRX: -0.9, armLZ: -0.5, armRZ: 0.5, lean: 0},
		{f: 150, lean: 0.22, armLZ: 0.4, armRZ: -0.4, armLX: -0.3, armRX: -0.3, headX: 0.25},
		...diveKeys(SPOT.D, {x: 1.0, z: -1.6}, {x: 4.0, z: -7.0}, -0.35),
	],
	E: [
		{f: 0, x: 13, z: 3.0, rotY: -PI / 2, face: 'calm'},
		...walk(258, 292, [13, 3.0], [0.5, 3.0], 8),
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
		// Bite
		{f: 344, armLX: -1.1, armLZ: -0.2},
		{f: 354, armLX: -2.1, armLZ: -0.5, headX: -0.05, ease: 'back'},
		{f: 357, face: 'smile'},
		{f: 366, armLX: -1.2, armLZ: -0.25, headX: 0},
	],
};

const GRAB = 312;
const BITE = 356;

// ---------- Camera ----------

type Shot = {from: number; to: number; p0: number[]; p1: number[]; t0: number[]; t1: number[]; fov: number};

// Close-up in front of a character's face.
const faceCam = (s: {x: number; z: number; rotY: number}, d: number, side: number, y = 4.45) => {
	const dx = Math.sin(s.rotY);
	const dz = Math.cos(s.rotY);
	return [s.x + dx * d + dz * side, y, s.z + dz * d - dx * side];
};
const headOf = (s: {x: number; z: number}) => [s.x, 4.55, s.z];

const E_END = {x: 0.5, z: 3.0, rotY: -1.78 * PI}; // where the thief ends up facing after the turn

const SHOTS: Shot[] = [
	// Wide establishing push-in
	{from: 0, to: 72, p0: [0, 8.5, 28], p1: [0, 7.0, 21], t0: [0, 2.8, -1], t1: [0, 3.0, -1], fov: 32},
	// Quick close-ups as each one locks onto the slice
	{from: 72, to: 87, p0: faceCam(SPOT.A, 4.4, 0.8), p1: faceCam(SPOT.A, 3.7, 0.7), t0: headOf(SPOT.A), t1: headOf(SPOT.A), fov: 30},
	{from: 87, to: 102, p0: faceCam(SPOT.B, 4.4, -0.8), p1: faceCam(SPOT.B, 3.7, -0.7), t0: headOf(SPOT.B), t1: headOf(SPOT.B), fov: 30},
	{from: 102, to: 117, p0: faceCam(SPOT.C, 4.4, 0.6), p1: faceCam(SPOT.C, 3.7, 0.5), t0: headOf(SPOT.C), t1: headOf(SPOT.C), fov: 30},
	{from: 117, to: 132, p0: faceCam(SPOT.D, 4.4, -0.6), p1: faceCam(SPOT.D, 3.7, -0.5), t0: headOf(SPOT.D), t1: headOf(SPOT.D), fov: 30},
	// Low standoff orbit around the box
	{from: 132, to: 204, p0: [9, 3.3, 10.5], p1: [-9, 3.3, 10.5], t0: [0, 3.3, -1], t1: [0, 3.3, -1], fov: 34},
	// The dive, from above the front
	{from: 204, to: 252, p0: [0, 10, 19], p1: [0, 8.5, 15], t0: [0, 2.6, -1.2], t1: [0, 2.8, -1.2], fov: 38},
	// The thief walks in
	{from: 252, to: 340, p0: [11, 5.2, 6.5], p1: [8.5, 5.0, 5.0], t0: [1.5, 3.0, 0.2], t1: [0.3, 3.3, 1.0], fov: 36},
	// Close on the bite, the others glaring behind
	{from: 340, to: 384, p0: faceCam(E_END, 6.0, -2.0, 4.8), p1: faceCam(E_END, 5.2, -1.7, 4.8), t0: [0.5, 4.4, 3.0], t1: [0.5, 4.5, 3.0], fov: 32},
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
	camera.position.set(...lerp(shot.p0, shot.p1));
	camera.fov = shot.fov;
	camera.lookAt(...lerp(shot.t0, shot.t1));
	camera.updateProjectionMatrix();
	return null;
};

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
			shadow-camera-left={-18}
			shadow-camera-right={18}
			shadow-camera-top={18}
			shadow-camera-bottom={-12}
			shadow-camera-near={1}
			shadow-camera-far={60}
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
	const bitten = f2 >= BITE;
	const held = (
		<group position={[-0.15, 0.1, 0.35]} rotation={[0.35, -PI / 2, 0]} scale={0.8}>
			<Slice bitten={bitten} />
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
