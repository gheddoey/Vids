import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, Sequence, staticFile} from 'remotion';
import {useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Who} from '../lowpoly/Rig';
import {PS1Pass} from '../ps1/ps1';
import {B} from '../ps1/sets';
import {CineGrade} from '../cine/Cine';
import {CaptionsFor} from '../lebron/common';
import {P} from '../escobar/cast';
import {CountingRoom} from '../escobar/sets';
import {Motes} from '../escobar/kit';
import {BKey, FaceKey, GazeKey, Impact, PROFILES, Word, act, squash} from '../acting';
import {Window, Wall, mat} from '../env';
import timing from './timing.json';

// ACTING TEST (animation directive): a 7-second dialogue scene to prove the performance system.
// Roberto (anxious accountant) reports the rubber-band bill; Pablo (unbothered boss) shrugs it off;
// Roberto explodes and slams the ledger; Pablo flinches, then smirks. Scratch voice (Piper).

const FPS = 30;
const PI = Math.PI;
const T = timing as {duration: number; lines: {who: string; text: string; s: number; e: number; words: Word[]}[]};
export const ACTING_FRAMES = Math.round((T.duration + 0.45) * FPS);
const wordsOf = (who: string) => T.lines.filter((l) => l.who === who).flatMap((l) => l.words);
const RW = wordsOf('roberto');
const PW = wordsOf('pablo');
const SLAM = 196;
type V3 = [number, number, number];

// ---------- direction: Roberto ----------
const R_AT: V3 = [-4.0, 0, 1.8];
const rKeys: BKey[] = [
	{f: 0, rotY: 1.25, armLX: -1.0, armLZ: -0.15, armRX: -0.3, armRZ: -0.05, headX: 0.25, lean: 0.05, shrug: 0.05, sq: 0},
	{f: 4, headX: -0.05, shrug: 0.18, sq: 0.03, ease: 'out'}, // inhale, look up: "Pablo,"
	{f: 14, shrug: 0.25, sq: 0},
	{f: 34, armRX: -0.6},
	{f: 38, armRX: -1.15, ease: 'back'}, // taps the ledger: "thousand"
	{f: 42, armRX: -0.75},
	{f: 46, armRX: -1.15, ease: 'back'},
	{f: 52, armRX: -0.6},
	{f: 66, lean: 0.16},
	{f: 76, armRX: -0.5, armRZ: 0.05},
	{f: 84, armRX: -2.05, armRZ: 0.25, armRY: 0.3, headX: -0.08, ease: 'back'}, // holds a band up: "rubber"
	{f: 102, lean: 0.22, armRX: -1.9},
	{f: 118, lean: 0.06, headZ: 0.14, shrug: 0.1, ease: 'out'}, // "Buy…?" freezes, head tilt
	{f: 140, headZ: 0.24, armRX: -1.55},
	{f: 160, armRX: -0.35, armRZ: -0.05, armRY: 0, lean: -0.02, headZ: 0.0, headY: -0.35, shrug: 0.05}, // looks away, seething
	{f: 174, lean: -0.2, armLX: -2.5, armLZ: -0.2, shrug: 0.42, sq: 0.07, headY: 0, headX: -0.12, ease: 'inOut'}, // winds up
	{f: 190, lean: -0.24, armLX: -2.95, sq: 0.08},
	{f: SLAM, lean: 0.42, armLX: -0.55, armLZ: -0.05, shrug: -0.05, sq: -0.1, headX: -0.32, ease: 'snap'}, // SLAM — body down, eyes up on Pablo
	{f: 202, lean: 0.36, sq: 0, shrug: 0.25, headX: -0.28},
	{f: 208, shrug: 0.08},
	{f: 214, shrug: 0.26},
	{f: 220, shrug: 0.1},
];
const rFaces: FaceKey[] = [
	{f: 0, e: 'worried'},
	{f: 4, e: 'worried', x: {browL: 0.75, browR: 0.8}, in: 4},
	{f: 30, e: 'worried'},
	{f: 82, e: 'worried', x: {browL: 0.9, browR: 0.6, tiltL: -1.2, wide: 0.25}, in: 5},
	{f: 104, e: 'worried', x: {lidL: 0, lidR: 0}},
	{f: 118, e: 'confused', in: 6},
	{f: 138, e: 'confused', x: {wide: 0.35, browL: 0.95}, in: 8},
	{f: 160, e: 'frustrated', in: 10},
	{f: 174, e: 'furious', in: 3},
	{f: 202, e: 'furious', x: {mouth: 'sadopen', jaw: 0.3}, in: 4},
];
const rGaze: GazeKey[] = [
	{f: 0, g: [0.3, -0.9]},
	{f: 3, g: [0, 0.1]},
	{f: 38, g: [0.3, -0.9]},
	{f: 52, g: [0, 0.1]},
	{f: 84, g: [-0.2, 0.3]}, // glances at the band in his hand
	{f: 94, g: [0, 0.1]},
	{f: 160, g: [-0.8, -0.4]}, // eyes away, building up
	{f: 172, g: [0, 0.1]},
];

// ---------- direction: Pablo ----------
const P_AT: V3 = [4.6, 0, 2.3];
const folded = {armRX: -1.25, armRZ: 0.7, armLX: -1.25, armLZ: -0.7, armRY: 0, armLY: 0};
const pKeys: BKey[] = [
	{f: 0, rotY: -1.15, ...folded, lean: -0.06, headZ: -0.05, shrug: 0, sq: 0},
	{f: 36, headZ: 0.1}, // tilt on "thousand"
	{f: 100, headZ: 0.06},
	{f: 106, shrug: -0.12, lean: 0.03, ease: 'inOut'}, // anticipation before the shrug
	{f: 112, shrug: 0.75, armRX: -0.45, armRZ: -0.95, armLX: -0.45, armLZ: 0.95, armRY: -0.7, armLY: 0.7, headZ: 0.2, sq: 0.05, lean: -0.08, ease: 'back'}, // "So?"
	{f: 122, shrug: 0.15, sq: 0, armLX: -0.25, armLZ: 0.18, armLY: 0, armRX: -1.3, armRZ: -0.3, armRY: -0.2, headZ: 0.05}, // open hand to Roberto: "Buy"
	{f: 134, armRX: -1.5, armRZ: -0.12},
	{f: 145, armRX: -0.55, armRZ: -1.05, headY: 0.45, ease: 'snap'}, // dismissive flick: "bands"
	{f: 153, armRX: -0.35, armRZ: -0.15},
	{f: 164, armRX: -2.25, armRZ: 0.45, headX: 0.08, ease: 'inOut'}, // smooths the mustache
	{f: 172, armRZ: 0.25},
	{f: 180, armRZ: 0.45},
	{f: 190, ...folded, headX: 0, headY: 0.1},
	{f: SLAM, lean: -0.06, shrug: 0, sq: 0},
	{f: SLAM + 1, lean: -0.16, shrug: 0.35, sq: -0.06, ease: 'snap'}, // flinch
	{f: SLAM + 8, lean: -0.06, shrug: 0, sq: 0, headY: 0},
];
const pFaces: FaceKey[] = [
	{f: 0, e: 'smug'},
	{f: 34, e: 'skeptical', in: 8},
	{f: 60, e: 'smug', in: 8},
	{f: 88, e: 'smirk', in: 6},
	{f: 104, e: 'calm', in: 4},
	{f: 110, e: 'surprised', x: {wide: 0.1, pupil: 1}, in: 3}, // "So?" (feigned)
	{f: 120, e: 'smug', in: 6},
	{f: 146, e: 'smirk', in: 4},
	{f: SLAM + 1, e: 'shock', in: 0},
	{f: SLAM + 6, e: 'smirk', in: 8},
	{f: 212, e: 'skeptical', in: 6},
];
const pGaze: GazeKey[] = [
	{f: 0, g: [0, 0]},
	{f: 86, g: [0.25, -0.5]}, // looks at the band
	{f: 96, g: [0, 0]},
	{f: 104, g: [-0.6, 0.7]}, // eye-roll up and away
	{f: 112, g: [0, 0]},
	{f: 145, g: [0.85, 0.15]}, // looks away, done with it
	{f: SLAM + 1, g: [0, 0.05]}, // snaps back
];

// Close the counting room (side walls with a shuttered window, ceiling with beams) for these angles.
const RoomShell: React.FC = () => {
	const wall = mat('plaster', {base: '#cdbb94', alt: '#9a5a3a', seed: 4, wear: 1.4}, 4, 2);
	const ceil = mat('planks', {base: '#5a3a24', seed: 6}, 6, 6);
	return (
		<group>
			<Wall w={20} h={11} m={wall} p={[-10, 0, 4.8]} r={PI / 2} holes={[{x: 2.5, y: 3.2, w: 3, h: 3}]} />
			<Window w={3} h={3} p={[-9.85, 3.2, 2.3]} r={PI / 2} frame="#5a3a24" shutters="#3a5a4a" open={0.25} glass="#1a2430" bars />
			<Wall w={20} h={11} m={mat('boards', {base: '#4a3424', seed: 8, wear: 0.6}, 6, 2)} p={[10, 0, 4.8]} r={-PI / 2} />
			<mesh position={[0, 11, 3]} material={ceil}>
				<boxGeometry args={[22, 0.3, 18]} />
			</mesh>
			{[-6, -2, 2, 6].map((x) => (
				<mesh key={x} position={[x, 10.6, 3]} material={ceil} castShadow>
					<boxGeometry args={[0.5, 0.6, 18]} />
				</mesh>
			))}
		</group>
	);
};

// Rubber band (tan loop) + ledger (book) props held in the hands.
const Band: React.FC = () => (
	<group position={[0, -0.15, 0.25]} rotation={[PI / 2, 0, 0]}>
		{[0, 1, 2, 3].map((i) => (
			<B key={i} size={[0.36, 0.05, 0.05]} pos={[Math.cos((i * PI) / 2) * 0.16, Math.sin((i * PI) / 2) * 0.16, 0]} rot={[0, 0, (i * PI) / 2 + PI / 2]} color="#c89a4a" shadow={false} />
		))}
	</group>
);
const Ledger: React.FC = () => (
	<group position={[0, -0.05, 0.2]} rotation={[0.2, 0, 0]}>
		<B size={[1.0, 0.18, 1.3]} color="#3a1a14" />
		<B size={[0.92, 0.2, 1.22]} pos={[0.05, 0, 0]} color="#e8e0c8" />
	</group>
);

// Camera: four set-ups (cuts) with gentle moves; shake on the slam.
type Shot = {from: number; p0: V3; p1: V3; t0: V3; t1: V3; fov?: number};
const SHOTS: Shot[] = [
	{from: 0, p0: [7.4, 5.6, 5.6], p1: [6.6, 5.4, 5.0], t0: [-3.6, 3.9, 1.2], t1: [-3.7, 4.1, 1.4], fov: 36}, // OTS past Pablo onto Roberto
	{from: 108, p0: [-3.0, 4.7, 8.6], p1: [-2.4, 4.6, 8.0], t0: [4.4, 3.7, 2.2], t1: [4.4, 3.8, 2.2], fov: 38}, // Pablo medium (waist-up: the shrug reads)
	{from: 158, p0: [2.2, 4.8, 11.5], p1: [1.0, 4.4, 9.4], t0: [-3.2, 3.6, 1.4], t1: [-2.8, 3.4, 1.4], fov: 40}, // Roberto medium, pushing in
	{from: 203, p0: [-0.6, 5.0, 7.0], p1: [-0.3, 5.0, 6.6], t0: [4.4, 4.2, 2.2], t1: [4.4, 4.3, 2.2], fov: 34}, // Pablo's reaction (close)
];
const Cam: React.FC<{f: number}> = ({f}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	const i = SHOTS.filter((s) => s.from <= f).length - 1;
	const s = SHOTS[Math.max(0, i)];
	const end = SHOTS[i + 1]?.from ?? ACTING_FRAMES;
	const u = Easing.inOut(Easing.sin)(Math.min(1, (f - s.from) / (end - s.from)));
	const u2 = i === 2 ? Easing.in(Easing.cubic)(Math.min(1, (f - s.from) / (SLAM - s.from))) : u;
	const mix = (a: V3, b: V3, k: number) => a.map((v, j) => v + (b[j] - v) * k) as V3;
	const p = mix(s.p0, s.p1, u2);
	const sh = f >= SLAM && f < SLAM + 10 ? (1 - (f - SLAM) / 10) * 0.18 : 0;
	camera.position.set(p[0] + Math.sin(f * 2.1) * sh, p[1] + Math.cos(f * 2.9) * sh, p[2]);
	camera.fov = s.fov ?? 40;
	camera.near = 0.1;
	camera.far = 200;
	camera.lookAt(...mix(s.t0, s.t1, u2));
	camera.updateProjectionMatrix();
	return null;
};

export const ActingTest: React.FC = () => {
	const f = useCurrentFrame();
	const rob = act(PROFILES.roberto, {keys: rKeys, faces: rFaces, gaze: rGaze, words: RW, listen: PW, cadence: [{from: -999, n: 2}, {from: 186, n: 1}, {from: 204, n: 2}], mannerism: false}, f);
	const pab = act(PROFILES.pablo, {keys: pKeys, faces: pFaces, gaze: pGaze, words: PW, listen: RW, cadence: [{from: -999, n: 2}, {from: SLAM, n: 1}, {from: SLAM + 8, n: 2}], mannerism: false}, f);
	rob.sq = (rob.sq ?? 0) + squash(f, SLAM, -0.08, 12);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<ThreeCanvas width={1080} height={1920} shadows="soft" dpr={1}>
				<Cam f={f} />
				<CountingRoom f={f} />
				<RoomShell />
				<Motes f={f} n={60} center={[0, 4, 1]} size={[10, 4, 5]} color="#e8ffd8" glow={1.2} s={0.05} />
				<Who look={P.roberto.look} h={P.roberto.h} at={R_AT} pose={rob} holdL={<Ledger />} holdR={f >= 78 && f < 162 ? <Band /> : null} />
				<Who look={P.pablo80.look} h={P.pablo80.h} at={P_AT} pose={pab} />
				<Impact f={f} at={SLAM} pos={[-2.4, 2.9, 1.3]} color="#fff0b0" r={1.1} len={5} />
				<PS1Pass levels={24} />
				<CineGrade preset="interior" frame={f} />
			</ThreeCanvas>
			<CaptionsFor timing={T} />
			<Audio src={staticFile('vo/actingtest.wav')} />
			<Sequence from={SLAM - 1} layout="none">
				<Audio src={staticFile('sfx/slam.wav')} volume={0.7} />
			</Sequence>
			{[108, 158, 203].map((c) => (
				<Sequence key={c} from={c} layout="none">
					<Audio src={staticFile('sfx/swish.wav')} volume={0.08} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
