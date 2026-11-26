import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {BlockText, useBlockFont} from '../BlockText';
import {walk} from '../anim';
import {CaptionsFor} from '../lebron/common';
import {PS1Pass} from '../ps1/ps1';
import {Who} from '../lowpoly/Rig';
import {CineGrade, CinePreset} from '../cine/Cine';
import {pop} from '../lebron2/LeBron2';
import {P, Person} from '../escobar/cast';
import {BKey, Direction, FaceKey, GazeKey, PROFILES, Profile, act} from '../acting';
import {Mirador, Street} from './sets';
import {Catedral, Congress, Funeral, Hideout, Napoles, Portrait, Rooftops} from './sets2';
import {Bx, flat} from '../env';
import {extraLook} from './props';
import timing from './timing.json';

// PABLO ESCOBAR: THE RISE AND FALL — 60 s, the user's 9-beat guide (docs/escobar-rf/01-brief-storyboard.md).
// Every character is performed with src/acting (live faces, gaze, profiles, springs, cadence).

const FPS = 30;
const PI = Math.PI;
const T = timing as {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};
export const RF_FRAMES = 1800;
const W = (l: number, w: number) => Math.round(T.lines[l].words[w].s * FPS);
type V3 = [number, number, number];
type ShotProps = {f: number; d: number; g: number};

// ---------- camera: keyed moves on ones, eased; optional shake ----------
type CK = {f: number; p: V3; t: V3; fov?: number};
const Cam: React.FC<{f: number; k: CK[]; shake?: {at: number; amp: number; len?: number}; ease?: (t: number) => number}> = ({f, k, shake, ease = Easing.inOut(Easing.sin)}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	let i = 0;
	while (i < k.length - 1 && f >= k[i + 1].f) i++;
	const a = k[i];
	const b = k[Math.min(i + 1, k.length - 1)];
	const u = b.f === a.f ? 1 : ease(Math.min(1, Math.max(0, (f - a.f) / (b.f - a.f))));
	const mix = (x: V3, y: V3) => x.map((v, j) => v + (y[j] - v) * u) as V3;
	const p = mix(a.p, b.p);
	if (shake && f >= shake.at && f < shake.at + (shake.len ?? 10)) {
		const s = 1 - (f - shake.at) / (shake.len ?? 10);
		p[0] += Math.sin(f * 2.3) * shake.amp * s;
		p[1] += Math.cos(f * 3.1) * shake.amp * 0.7 * s;
	}
	camera.position.set(...p);
	camera.fov = (a.fov ?? 40) + ((b.fov ?? 40) - (a.fov ?? 40)) * u;
	camera.near = 0.1;
	camera.far = 900;
	camera.lookAt(...mix(a.t, b.t));
	camera.updateProjectionMatrix();
	return null;
};

// A performed character: profile + direction -> pose with a live face.
const Actor: React.FC<{p: Person; prof: Profile; d: Direction; f: number; at: V3; holdL?: React.ReactNode; holdR?: React.ReactNode}> = ({p, prof, d, f, at, holdL, holdR}) => (
	<Who look={p.look} h={p.h} at={at} pose={act(prof, d, f)} holdL={holdL} holdR={holdR} />
);
// Extras get a profile variant (seeded) so no two idle the same.
const extraProf = (i: number): Profile => ({...PROFILES[['fisher', 'mother', 'teen', 'cop'][i % 4]], seed: 100 + i * 7, mannerism: undefined});

// ================= BEAT 1: THE HOOK =================
// 1a  crane down over the barrio rooftops toward the valley at sunset
const Hook1: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam f={f} k={[{f: 0, p: [6, 9, 14], t: [-4, -22, -220], fov: 44}, {f: d, p: [2.6, 5.4, 9.5], t: [-1, -14, -200], fov: 42}]} />
		<Mirador f={f} />
		<Actor p={P.pabloRF} prof={PROFILES.pablo} f={f} at={[0, 0, -1.3]} d={{keys: [{f: 0, rotY: PI, armLZ: 0.1, armRZ: -0.1, armLX: -0.15, armRX: 0.05}], gaze: [{f: 0, g: [0, -0.2]}], mannerism: false}} />
	</>
);
// 1b  behind Pablo at the parapet; he surveys the city, then turns his head toward us on "empire"
const Hook2: React.FC<ShotProps> = ({f, d, g}) => {
	const turn = W(0, 7) - (g - f); // "empire" in shot time
	const keys: BKey[] = [
		{f: 0, rotY: PI, armLZ: 0.1, armRZ: -0.1, armLX: -0.15, armRX: 0.05, headY: 0, headX: 0.05},
		{f: turn - 6, headY: -0.1, shrug: 0.08},
		{f: turn + 6, headY: 0.75, headX: 0.02, shrug: 0, ease: 'inOut'},
		{f: turn + 30, headY: 0.65},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [1.8, 3.4, 10.5], t: [-0.3, 3.6, -30], fov: 40}, {f: d, p: [1.2, 3.5, 8.6], t: [-0.4, 3.7, -30], fov: 40}]} />
			<Mirador f={f + 84} />
			<Actor p={P.pabloRF} prof={PROFILES.pablo} f={f} at={[0, 0, -1.3]} d={{keys, faces: [{f: 0, e: 'calm'}, {f: turn + 4, e: 'smug', in: 10}], gaze: [{f: 0, g: [0, -0.1]}, {f: turn, g: [-0.7, 0]}], mannerism: false}} />
		</>
	);
};

// ================= BEAT 2: THE RISE (name reveal) =================
const CROWD: {at: V3; rot: number}[] = [
	[-5.3, 6], [-5.6, 2.5], [-5.0, -3], [-5.8, -8], [-5.2, -13], [5.4, 7.5], [5.0, 3.0], [5.8, -1.5], [5.2, -6], [5.6, -11], [-4.6, -18], [4.8, -17],
].map(([x, z]) => ({at: [x, 0.28, z] as V3, rot: x < 0 ? PI / 2 - 0.3 : -PI / 2 + 0.3}));
// Extras on the sidewalks: each glances at Pablo as he passes (head turn timed by distance).
const Crowd: React.FC<{f: number; pz: number}> = ({f, pz}) => (
	<>
		{CROWD.map((c, i) => {
			const x = extraLook(i);
			const look = Math.max(-1, Math.min(1, (pz - c.at[2]) / 6));
			const prof = extraProf(i);
			return (
				<Who
					key={i}
					look={x.look}
					h={x.h}
					at={c.at}
					pose={act(prof, {keys: [{f: 0, rotY: c.rot, armLZ: 0.08, armRZ: -0.08}], faces: [{f: 0, e: ['neutral', 'surprised', 'worried', 'skeptical'][i % 4] as never}], gaze: [{f: 0, g: [c.at[0] < 0 ? look * 0.6 : -look * 0.6, 0]}], headFollow: 0.6, mannerism: false}, f + i * 11)}
				/>
			);
		})}
	</>
);
const Bodyguards: React.FC<{f: number; z: number; walking?: boolean}> = ({f, z, walking}) => (
	<>
		<Actor p={P.guard1} prof={PROFILES.cop} f={f} at={[-3.6, 0.28, z - 3.4]} d={{keys: walking ? walk(0, 60, [0, 0], [0, 4], 10) : [{f: 0, armLZ: 0.1, armRZ: -0.1}], gaze: [{f: 0, g: [0.4, 0]}, {f: 20, g: [-0.6, 0]}], mannerism: false}} />
		<Actor p={P.guard2} prof={PROFILES.cop} f={f + 9} at={[1.4, 0.28, z - 3.4]} d={{keys: walking ? walk(0, 60, [0, 0], [0, 4], 10) : [{f: 0, armLZ: 0.1, armRZ: -0.1}], gaze: [{f: 0, g: [-0.5, 0]}, {f: 26, g: [0.6, 0]}], mannerism: false}} />
	</>
);
// 2a  low backward dolly: Pablo walks through the parting crowd
const Rise1: React.FC<ShotProps> = ({f, d}) => {
	const z = interpolate(f, [0, d], [-9, -5.5]);
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [2.6, 2.4, 1.0], t: [-2.4, 4.4, -14], fov: 44}, {f: d, p: [2.4, 2.5, 3.4], t: [-2.2, 4.5, -11], fov: 44}]} />
			<Street f={f} />
			<Actor p={P.pabloRF} prof={PROFILES.pablo} f={f} at={[-0.8, 0.28, 0]} d={{keys: [...walk(0, 60, [0, -9], [0, -4.5], 12), {f: 0, rotY: 0, lean: -0.04}], faces: [{f: 0, e: 'smug'}], gaze: [{f: 0, g: [0.5, 0]}, {f: 16, g: [-0.4, 0]}], mannerism: false}} />
			<Bodyguards f={f} z={-9} walking />
			<Crowd f={f} pz={z} />
		</>
	);
};
// 2b  he stops; "His name was" eyes off-frame; on "Pablo" eyes slide to us; on "Escobar" the smirk
const Rise2: React.FC<ShotProps> = ({f, d, g}) => {
	const o = g - f;
	const pablo = W(1, 3) - o;
	const name = W(1, 4) - o;
	const s = pop(f, name - 2);
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [-2.9, 4.0, 3.4], t: [-0.8, 5.0, -5.2], fov: 36}, {f: name, p: [-2.2, 4.2, 1.6], t: [-0.8, 5.3, -5.2], fov: 34}, {f: d, p: [-2.0, 4.25, 1.2], t: [-0.8, 5.35, -5.2], fov: 34}]} />
			<Street f={f + 32} />
			<Actor
				p={P.pabloRF}
				prof={PROFILES.pablo}
				f={f}
				at={[-0.8, 0.28, -5.2]}
				d={{
					keys: [
						{f: 0, rotY: 0.2, headY: -0.5, lean: -0.04, armLZ: 0.12, armRZ: -0.12},
						{f: pablo - 8, headY: -0.45},
						{f: pablo + 4, headY: -0.2, headZ: 0.06, ease: 'inOut'},
						{f: name, headX: -0.08, headZ: 0.1, shrug: 0.05},
						{f: name + 20, headX: -0.04, headZ: 0.08, shrug: 0},
					],
					faces: [{f: 0, e: 'calm'}, {f: pablo, e: 'neutral', in: 4}, {f: name, e: 'smug', in: 12}, {f: name + 26, e: 'smirk', in: 10}],
					gaze: [{f: 0, g: [0.8, 0.1]}, {f: pablo - 2, g: [-0.35, 0.05]}],
					mannerism: false,
				}}
			/>
			<Bodyguards f={f + 40} z={-5.2} />
			<Crowd f={f + 40} pz={-5.2} />
			<group position={[0.6, 9.2, -12]} rotation={[0, -0.2, 0]} scale={s}>
				<BlockText text="PABLO ESCOBAR" size={0.42} depth={0.22} color="#f2efe6" side="#3a3430" />
				<group position={[0, -0.55, 0]}>
					<BlockText text="THE RISE AND FALL" size={0.22} depth={0.12} color="#d8241e" side="#5a0a08" />
				</group>
			</group>
		</>
	);
};


// ================= BEAT 3: THE EMPIRE (Hacienda Nápoles) =================
// 3a  aerial drift over the hacienda; a helicopter crosses toward the helipad
const Empire1: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam f={f} k={[{f: 0, p: [-34, 30, 40], t: [2, 2, -10], fov: 44}, {f: d, p: [-22, 22, 34], t: [4, 3, -10], fov: 42}]} />
		<Napoles f={f} heli={[-30 + f * 0.45, 14 - f * 0.03, -2 + f * 0.02]} />
		<Actor p={P.pabloRF} prof={PROFILES.pablo} f={f} at={[0, 0.25, -4.2]} d={{keys: [{f: 0, rotY: 0.3, armLZ: 0.15, armRZ: -0.15}], gaze: [{f: 0, g: [0.3, 0.6]}]}} />
		<Actor p={P.guard1} prof={PROFILES.cop} f={f} at={[3.5, 0.25, -6.4]} d={{keys: [{f: 0, rotY: -0.3}], mannerism: false}} />
	</>
);
// 3b  on the pool terrace: on "leader" he spreads his arms (proud); on "Cartel" the wing wall slices open
const Empire2: React.FC<ShotProps> = ({f, d, g}) => {
	const o = g - f;
	const leader = W(2, 8) - o;
	const cartel = W(2, 12) - o;
	const cut = interpolate(f, [cartel + 6, cartel + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2))});
	const keys: BKey[] = [
		{f: 0, rotY: 0.15, armLZ: 0.15, armRZ: -0.15, lean: -0.02},
		{f: leader - 6, armLZ: 0.05, armRZ: -0.05, shrug: -0.08, lean: 0.04, ease: 'inOut'}, // anticipation
		{f: leader + 4, armLZ: 1.35, armRZ: -1.35, armLX: -0.4, armRX: -0.4, shrug: 0.2, lean: -0.1, headX: -0.12, sq: 0.04, ease: 'back'}, // the sweep
		{f: leader + 30, armLZ: 1.2, armRZ: -1.2, sq: 0},
		{f: cartel + 8, armLZ: 0.2, armRZ: -0.2, armLX: 0, armRX: 0, shrug: 0, lean: -0.04, headX: 0, rotY: 0.6, headY: 0.4},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [-3.5, 4.4, 10.5], t: [0, 4.2, -4.2], fov: 42}, {f: cartel + 2, p: [-2.5, 4.5, 11.5], t: [0.5, 4.2, -4.2], fov: 42}, {f: cartel + 20, p: [8.6, 4.8, 3.0], t: [16, 3.0, -10], fov: 42}, {f: d, p: [9.6, 4.9, 1.4], t: [16, 3.2, -10], fov: 40}]} />
			<Napoles f={f + 84} cut={cut} />
			<Actor p={P.pabloRF} prof={PROFILES.pablo} f={f} at={[0, 0.25, -4.2]} d={{keys, faces: [{f: 0, e: 'smug'}, {f: leader, e: 'beam', in: 6}, {f: leader + 34, e: 'proud', in: 10}, {f: cartel + 6, e: 'smirk', in: 8}], gaze: [{f: 0, g: [0, 0]}, {f: cartel + 4, g: [0.7, 0.1]}], mannerism: false}} />
			<Actor p={P.guard1} prof={PROFILES.cop} f={f} at={[4.6, 0.25, -6.6]} d={{keys: [{f: 0, rotY: -0.5, armLZ: 0.1, armRZ: -0.1}], gaze: [{f: 0, g: [-0.6, 0]}, {f: 40, g: [0.5, 0]}], mannerism: false}} />
			<Actor p={P.guard2} prof={PROFILES.cop} f={f + 17} at={[-5.0, 0.25, -7.0]} d={{keys: [{f: 0, rotY: 0.4}], gaze: [{f: 0, g: [0.4, 0]}], mannerism: false}} />
		</>
	);
};

// ================= BEAT 4: POLITICS (Congress) =================
// silent speech for Pablo (his own mouth acts; the narrator carries the audio)
const SPEECH = (o: number) =>
	['Colombia', 'needs', 'jobs', 'and', 'homes', 'for', 'the', 'poor', 'of', 'Medellín'].map((w, i) => ({w, s: (o + i * 9) / FPS, e: (o + i * 9 + 7) / FPS}));
const MEMBERS: {p: Person; at: V3; prof: string}[] = [
	{p: P.politico1, at: [-4.2, 0, 2.4], prof: 'roberto'},
	{p: P.politico2, at: [-1.8, 0, 2.4], prof: 'father'},
	{p: P.politico3, at: [4.2, 0, 2.4], prof: 'cop'},
	{p: {look: extraLook(31).look, h: 1}, at: [7.2, 0.8, 6.2], prof: 'fisher'},
	{p: {look: extraLook(32).look, h: 1}, at: [-7.6, 0.8, 6.2], prof: 'mother'},
	{p: {look: extraLook(33).look, h: 1}, at: [-3.0, 1.6, 10.0], prof: 'teen'},
	{p: {look: extraLook(34).look, h: 1}, at: [5.0, 1.6, 10.0], prof: 'fisher'},
];
const seated = (h: number, extra: BKey = {f: 0}): BKey => ({rotY: PI, y: 1.55 / h - 2, legLX: -PI / 2, legRX: -PI / 2, armLX: -1.2, armRX: -1.2, ...extra, f: extra.f});
const Members: React.FC<{f: number; whisper?: number; react?: number}> = ({f, whisper = 9999, react = 9999}) => (
	<>
		{MEMBERS.map((m, i) => {
			const w = i < 2 && f > whisper;
			const keys: BKey[] = [seated(m.p.h, {f: 0}), ...(w ? [{f: whisper, ...(i === 0 ? {lean: 0.2, side: -0.25, headY: -0.6} : {lean: 0.1, headY: 0.45, headZ: 0.1})}] : [])];
			const faces: FaceKey[] = [{f: 0, e: (['neutral', 'calm', 'skeptical', 'neutral', 'thinking', 'neutral', 'calm'] as const)[i]}, ...(w ? [{f: whisper, e: i === 0 ? ('worried' as const) : ('skeptical' as const), in: 6}] : []), ...(i === 2 && f > react ? [{f: react, e: 'disgust' as const, in: 8}] : [])];
			const gaze: GazeKey[] = [{f: 0, g: [0, 0.15]}, ...(w ? [{f: whisper, g: [i === 0 ? -0.8 : 0.8, 0] as [number, number]}] : [])];
			return <Actor key={i} p={m.p} prof={{...PROFILES[m.prof], seed: 300 + i * 9}} f={f + i * 13} at={m.at} d={{keys, faces, gaze, mannerism: false}} />;
		})}
	</>
);
// 4a  low angle through the microphones: Pablo addresses the chamber
const Politics1: React.FC<ShotProps> = ({f, d}) => {
	const keys: BKey[] = [
		{f: 0, armLX: -0.9, armRX: -0.9, armLZ: -0.2, armRZ: 0.2},
		{f: 14, armRX: -1.5, armRZ: -0.3, armRY: -0.4, ease: 'back'}, // open-hand gesture
		{f: 30, armRX: -1.0, armRZ: 0.15},
		{f: 44, armLX: -1.6, armLZ: 0.35, ease: 'back'},
		{f: 60, armLX: -0.9, armLZ: -0.2, headX: -0.06},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [1.2, 3.3, 3.2], t: [0, 5.0, -6], fov: 44}, {f: d, p: [0.8, 3.4, 1.6], t: [0, 5.1, -6], fov: 42}]} />
			<Congress f={f} flash={f % 37 < 3 ? 1 : 0} />
			<Actor p={P.pabloSuitRF} prof={PROFILES.pablo} f={f} at={[0, 0, -7.0]} d={{keys, faces: [{f: 0, e: 'proud'}, {f: 40, e: 'smug', in: 8}], gaze: [{f: 0, g: [0.3, 0]}, {f: 30, g: [-0.4, 0]}, {f: 56, g: [0, 0]}], words: SPEECH(6), mannerism: false}} />
		</>
	);
};
// 4b  over the members' shoulders: two whisper, one turns in disgust; Pablo notices
const Politics2: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam f={f} k={[{f: 0, p: [3.4, 6.9, -11.2], t: [-2.8, 3.2, 2.4], fov: 42}, {f: d, p: [3.0, 6.8, -10.6], t: [-2.9, 3.3, 2.4], fov: 40}]} />
		<Congress f={f + 84} flash={f % 41 < 3 ? 1 : 0} />
		<Actor p={P.pabloSuitRF} prof={PROFILES.pablo} f={f} at={[0, 0, -7.0]} d={{keys: [{f: 0, armLX: -0.9, armRX: -0.9, armLZ: -0.2, armRZ: 0.2}], faces: [{f: 0, e: 'smug'}], gaze: [{f: 0, g: [0, 0]}], words: SPEECH(0), mannerism: false}} />
		<Members f={f} whisper={10} react={34} />
	</>
);
// 4c  close on Pablo: he sees them; the smile drops into a cold stare
const Politics3: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam f={f} k={[{f: 0, p: [1.6, 5.2, -1.6], t: [0, 5.0, -7.0], fov: 34}, {f: d, p: [1.2, 5.15, -2.4], t: [0, 5.0, -7.0], fov: 34}]} />
		<Congress f={f + 160} />
		<Actor p={P.pabloSuitRF} prof={PROFILES.pablo} f={f} at={[0, 0, -7.0]} d={{keys: [{f: 0, armLX: -0.9, armRX: -0.9, armLZ: -0.2, armRZ: 0.2}, {f: 14, headY: -0.25, headX: 0.05}, {f: 34, headY: -0.1}], faces: [{f: 0, e: 'smug'}, {f: 10, e: 'neutral', in: 8}, {f: 22, e: 'focused', in: 10}], gaze: [{f: 0, g: [0, 0]}, {f: 8, g: [-0.85, -0.1]}], mannerism: false}} />
	</>
);

// ================= BEAT 5: TERROR =================
// 5a  the burning car; police lights down the street; two dark figures walk away into the smoke
const Terror1: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam f={f} k={[{f: 0, p: [-2.2, 2.2, 6], t: [2, 2.6, -16], fov: 44}, {f: d, p: [-1.6, 2.3, 2.6], t: [2.2, 2.9, -16], fov: 42}]} shake={{at: 2, amp: 0.12, len: 18}} />
		<Street f={f} night fire />
		{[0, 1].map((i) => {
			const x = extraLook(60 + i);
			return <Who key={i} look={{...x.look, top: {kind: 'jacket', base: '#141418', accent: '#2a2a2e'}, pants: '#141418'}} h={1} at={[-2.2 + i * 1.4, 0.1, -19 - i]} pose={act({...PROFILES.cop, seed: 400 + i}, {keys: [...walk(0, 120, [0, 0], [0, -6], 14), {f: 0, rotY: PI}], mannerism: false}, f)} />;
		})}
	</>
);
// 5b  on the dark sidewalk across from the fire: firelight on Pablo's face; a cold stare, then he looks away
const Terror2: React.FC<ShotProps> = ({f, d}) => {
	const keys: BKey[] = [{f: 0, rotY: 2.6, armLZ: 0.08, armRZ: -0.08, headY: 0.2, lean: -0.03}, {f: 40, headY: 0.25}, {f: 70, headY: -0.45, ease: 'inOut'}, {f: 110, headY: -0.5, headX: 0.08}];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [-0.4, 4.4, -9.4], t: [-4.4, 4.2, -2.0], fov: 38}, {f: d, p: [-0.9, 4.4, -8.4], t: [-4.4, 4.3, -2.0], fov: 36}]} />
			<Street f={f + 108} night fire />
			<Actor p={P.pabloRF} prof={PROFILES.pablo} f={f} at={[-4.4, 0.28, -2.0]} d={{keys, faces: [{f: 0, e: 'focused'}, {f: 62, e: 'calm', in: 10}, {f: 96, e: 'focused', x: {lidL: 0.45, lidR: 0.45}, in: 10}], gaze: [{f: 0, g: [0.3, 0]}, {f: 64, g: [-0.6, -0.1]}], mannerism: false}} />
		</>
	);
};

// ================= BEAT 6: THE ESCAPE (La Catedral) =================
const Escape1: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam f={f} k={[{f: 0, p: [-30, 12, 34], t: [6, -2, -30], fov: 42}, {f: d, p: [-24, 10, 30], t: [8, -2, -30], fov: 42}]} />
		<Catedral f={f} heli={[-40 + f * 0.5, 22, 10 - f * 0.05]} />
		{[[-4, 9], [10, 0]].map(([x, z], i) => <Who key={i} look={P.guard.look} h={P.guard.h} at={[x + (i ? -f * 0.02 : f * 0.02), 0, z]} pose={act({...PROFILES.cop, seed: 500 + i}, {keys: [...walk(0, 120, [0, 0], [0, 0], 14, false), {f: 0, rotY: i ? -PI / 2 : PI / 2}], mannerism: false}, f)} />)}
	</>
);
// 6b  night: he squeezes through the cut in the back fence, glances back, runs into the dark
const Escape2: React.FC<ShotProps> = ({f, d}) => {
	const keys: BKey[] = [
		{f: 0, x: 2.1, z: -11.5, rotY: PI, lean: 0.35, sq: -0.05, armLX: -0.6, armRX: -0.6},
		{f: 16, z: -13.6, lean: 0.5, sq: -0.08, ease: 'inOut'}, // ducks through the gap
		{f: 26, z: -15, lean: 0.15, sq: 0, headY: 0},
		{f: 32, headY: 1.3, rotY: PI - 0.3, ease: 'out'}, // looks back
		{f: 50, headY: 1.1},
		{f: 56, headY: 0, rotY: PI, ease: 'snap'},
		...walk(58, d + 30, [2.1, -15], [14, -19], 6),
		{f: 58, rotY: PI / 2 + 0.6},
		{f: 58, lean: 0.3},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [-4.5, 3.0, -25], t: [2.0, 3.4, -13], fov: 42}, {f: d, p: [-3.5, 3.2, -26], t: [7, 3.4, -17], fov: 42}]} />
			<Catedral f={f} night />
			<Actor p={P.pabloRF} prof={{...PROFILES.pablo, loose: 1.2}} f={f} at={[0, 0, 0]} d={{keys, faces: [{f: 0, e: 'focused'}, {f: 30, e: 'scared', in: 4}, {f: 56, e: 'frustrated', in: 6}], gaze: [{f: 0, g: [0, -0.3]}, {f: 30, g: [0.9, 0.1]}, {f: 56, g: [0, 0]}], cadence: [{from: -999, n: 2}, {from: 56, n: 1}], mannerism: false}} />
		</>
	);
};

// ================= BEAT 7: THE DOWNFALL (fugitive) =================
const Down1: React.FC<ShotProps> = ({f, d, g}) => {
	const o = g - f;
	const heli = W(6, 6) - o; // "collapsing"
	const keys: BKey[] = [
		{f: 0, rotY: 0.4, lean: 0.12, shrug: 0.12, armLZ: 0.05, armRZ: -0.05, headY: 0},
		{f: 20, headY: 0.9, rotY: 0.2, ease: 'inOut'}, // looks over his shoulder
		{f: 42, headY: 0.1},
		{f: heli - 4, shrug: 0.45, lean: 0.24, sq: -0.05, headX: -0.25, ease: 'snap'}, // flinches at the rotor
		{f: heli + 16, shrug: 0.2, sq: 0, headY: -0.5, headX: -0.3},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [3.4, 7.0, 11], t: [0.2, 3.6, 0], fov: 42}, {f: d, p: [2.8, 6.8, 9.6], t: [0.2, 3.8, 0], fov: 40}]} shake={{at: heli, amp: 0.08, len: 30}} />
			<Hideout f={f} heli={[30 - Math.max(0, f - heli + 30) * 0.5, 16, -30]} />
			<Actor p={P.pabloFug} prof={{...PROFILES.pablo, blink: 70, gaze: {jitter: 0.4, every: 30}}} f={f} at={[0.4, 0.25, 1]} d={{keys, faces: [{f: 0, e: 'worried'}, {f: 20, e: 'scared', x: {wide: 0.2}, in: 6}, {f: 42, e: 'tired', in: 8}, {f: heli - 4, e: 'shock', in: 0}, {f: heli + 10, e: 'worried', in: 8}], gaze: [{f: 0, g: [0, -0.2]}, {f: 18, g: [0.9, 0.2]}, {f: 42, g: [-0.2, -0.3]}, {f: heli - 4, g: [0.2, 0.9]}], cadence: [{from: -999, n: 2}, {from: heli - 4, n: 1}, {from: heli + 8, n: 2}], mannerism: false}} />
		</>
	);
};
const Phone: React.FC = () => (
	<group position={[0, -0.2, 0.3]} rotation={[0.3, 0, 0]}>
		<Bx s={[0.35, 0.8, 0.2]} m={flat('#2a2a2a')} />
		<Bx s={[0.08, 0.4, 0.08]} p={[0.1, 0.55, 0]} m={flat('#1a1a1a')} />
	</group>
);
// 7b  close-up: tired eyes, slow blinks, the phone in his hand
const Down2: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam f={f} k={[{f: 0, p: [1.9, 5.0, 7.2], t: [0.3, 5.0, 1], fov: 34}, {f: d, p: [1.5, 5.0, 6.2], t: [0.3, 5.05, 1], fov: 34}]} />
		<Hideout f={f + 114} />
		<Actor p={P.pabloFug} prof={{...PROFILES.pablo, blink: 60}} f={f} at={[0.4, 0.25, 1]} holdR={<Phone />} d={{keys: [{f: 0, rotY: 0.25, lean: 0.06, shrug: 0.12, armRX: -1.5, armRZ: 0.25, headX: 0.08}, {f: 50, headX: 0.14}, {f: 90, headX: 0.04, headY: 0.25}], faces: [{f: 0, e: 'tired'}, {f: 40, e: 'sad', in: 14}, {f: 86, e: 'worried', in: 10}], gaze: [{f: 0, g: [0.2, -0.8]}, {f: 86, g: [0.8, 0.1]}], mannerism: false}} />
	</>
);

// ================= BEAT 8: THE DEATH (Los Olivos rooftops) — nothing violent is shown =================
const Death1: React.FC<ShotProps> = ({f, d}) => {
	const keys: BKey[] = [
		{f: 0, x: 0, y: 7.6, z: 2.5, rotY: PI, lean: 0.4, sq: -0.06, armLX: -1.8, armRX: -1.8}, // climbing onto the roof
		{f: 18, y: 8.6, z: 1.6, lean: 0.25, sq: 0, armLX: -0.8, armRX: -0.8, ease: 'out'},
		{f: 30, lean: 0.2, rotY: PI + 0.3, headY: -1.1},
		{f: 52, headY: -0.9},
		{f: 62, headY: 0, rotY: PI, ease: 'snap'},
		...walk(64, d + 20, [0, 1.6], [-4.6, -1.0], 7),
		{f: 64, lean: 0.25},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [4, 16, 18], t: [-1.5, 9.4, 1], fov: 40}, {f: d, p: [3, 15.5, 16.5], t: [-2.6, 9.5, 0.5], fov: 40}]} />
			<Rooftops f={f} heli={[-40 + f * 0.25, 26 + f * 0.02, -30]} />
			<Actor p={P.pabloFug} prof={{...PROFILES.pablo, loose: 1.2}} f={f} at={[0, 0, 0]} d={{keys, faces: [{f: 0, e: 'focused'}, {f: 30, e: 'scared', in: 4}, {f: 62, e: 'frustrated', in: 4}], gaze: [{f: 0, g: [0, 0.4]}, {f: 30, g: [-0.9, 0]}, {f: 62, g: [0, 0]}], cadence: [{from: -999, n: 2}, {from: 60, n: 1}], mannerism: false}} />
		</>
	);
};
// 8b  police on the next roof, the helicopter; on "killed" a hard cut to black; after: the empty roof
const Death2: React.FC<ShotProps> = ({f, g}) => {
	const killed = W(7, 7) - (g - f);
	if (f >= killed && f < killed + 10) return null;
	if (f >= killed + 10)
		return (
			<>
				<Cam f={f} k={[{f: killed, p: [12, 11, 22], t: [-4, 13, -10], fov: 40}, {f: killed + 100, p: [11, 11.5, 24], t: [-4, 14, -10], fov: 42}]} />
				<Rooftops f={f + 102} heli={[-6, 20 + Math.sin(f * 0.05) * 0.5, -12]} />
				<group position={[-4.6, 8.75, -1.0]} rotation={[-0.22, 0.6, 0]}>
					<Phone />
				</group>
			</>
		);
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [26, 12, 18], t: [-2, 9, -2], fov: 36}, {f: killed, p: [24, 12, 16], t: [-2, 9, -2], fov: 34}]} />
			<Rooftops f={f + 102} heli={[-14 + f * 0.1, 24, -22]} />
			<Actor p={P.pabloFug} prof={PROFILES.pablo} f={f} at={[0, 0, 0]} d={{keys: [{f: 0, x: -4.6, y: 8.6, z: -1.0, rotY: PI - 0.4, lean: 0.2, headY: 0.8}], faces: [{f: 0, e: 'scared'}], gaze: [{f: 0, g: [0.8, 0.2]}], mannerism: false}} />
			{[0, 1].map((i) => (
				<Actor key={i} p={i ? P.cop2 : P.cop1} prof={{...PROFILES.cop, seed: 600 + i}} f={f} at={[10 + i * 3, 9.4, 1 - i]} d={{keys: [{f: 0, rotY: -PI / 2 - 0.2, lean: 0.15, armLX: -1.3, armRX: -1.2}], faces: [{f: 0, e: 'focused'}], gaze: [{f: 0, g: [0, 0]}], mannerism: false}} />
			))}
		</>
	);
};

// ================= BEAT 9: THE AFTERMATH (funeral) =================
const FUN: V3[] = Array.from({length: 26}, (_, i) => [(-9 + (i % 9) * 2.3 + ((i * 7) % 3) * 0.4) * 1.0, 0, -2 - Math.floor(i / 9) * 2.6 - (i % 2) * 0.8]);
const Aftermath: React.FC<ShotProps> = ({f, d, g}) => {
	const o = g - f;
	const gone = W(8, 3) - o;
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [3.5, 4.6, 12], t: [0, 4.4, -4], fov: 40}, {f: gone + 10, p: [3.0, 6, 14], t: [0, 4.6, -6], fov: 42}, {f: d, p: [2, 20, 30], t: [0, -24, -160], fov: 46}]} />
			<Funeral f={f} />
			{FUN.map((at, i) => {
				const x = extraLook(80 + i);
				const prof = extraProf(i + 40);
				const mourn = (['sad', 'worried', 'tired', 'sad', 'angry', 'calm'] as const)[i % 6];
				return <Who key={i} look={x.look} h={x.h} at={at} pose={act(prof, {keys: [{f: 0, rotY: PI + ((i % 5) - 2) * 0.12, headX: 0.15, armLZ: 0.05, armRZ: -0.05}], faces: [{f: 0, e: mourn}], gaze: [{f: 0, g: [0, -0.4]}], mannerism: false}, f + i * 7)} />;
			})}
			<group position={[0.4, 5.6, -4.4]} rotation={[0, 0.1, Math.sin(f * 0.05) * 0.03]}>
				<Portrait />
			</group>
			{[[-1.6, -4.6], [2.4, -4.0]].map(([x, z], i) => <Bx key={i} s={[1.2, 1.2, 1.2]} p={[x, 0.6, z]} m={flat(i ? '#f2f0e8' : '#c83a3a')} />)}
		</>
	);
};

// ---------------- edit: shots, grades, transitions ----------------
type Tr = 'cut' | 'fade' | 'whip' | 'zoom' | 'dip' | 'flash';
type ShotDef = {at: number; C: React.FC<ShotProps>; look: CinePreset; tr: Tr};
const SHOTS: ShotDef[] = [
	{at: 0, C: Hook1, look: 'golden', tr: 'cut'},
	{at: 84, C: Hook2, look: 'golden', tr: 'fade'},
	{at: 168, C: Rise1, look: 'noon', tr: 'whip'},
	{at: W(1, 0) - 2, C: Rise2, look: 'golden', tr: 'cut'},
	{at: 336, C: Empire1, look: 'noon', tr: 'fade'},
	{at: W(2, 8) - 8, C: Empire2, look: 'golden', tr: 'cut'},
	{at: 546, C: Politics1, look: 'interior', tr: 'flash'},
	{at: W(3, 4) - 2, C: Politics2, look: 'interior', tr: 'cut'},
	{at: W(3, 8) + 10, C: Politics3, look: 'interior', tr: 'cut'},
	{at: 762, C: Terror1, look: 'night', tr: 'dip'},
	{at: 870, C: Terror2, look: 'night', tr: 'cut'},
	{at: 996, C: Escape1, look: 'golden', tr: 'dip'},
	{at: W(5, 5) - 2, C: Escape2, look: 'night', tr: 'cut'},
	{at: 1212, C: Down1, look: 'noon', tr: 'fade'},
	{at: 1326, C: Down2, look: 'noon', tr: 'cut'},
	{at: 1446, C: Death1, look: 'golden', tr: 'dip'},
	{at: 1530, C: Death2, look: 'golden', tr: 'cut'},
	{at: 1650, C: Aftermath, look: 'golden', tr: 'dip'},
];
const TLEN: Record<Tr, number> = {cut: 0, fade: 10, whip: 8, zoom: 8, dip: 12, flash: 6};

const layerStyle = (i: number, g: number): React.CSSProperties => {
	const s = SHOTS[i];
	const next = SHOTS[i + 1];
	const filters: string[] = [];
	let tx = 0;
	let sc = 1;
	let op = 1;
	const tin = TLEN[s.tr];
	if (tin && g < s.at + tin / 2) {
		const p = Math.min(1, Math.max(0, (g - (s.at - tin / 2)) / tin));
		const e = Easing.inOut(Easing.cubic)(p);
		if (s.tr === 'fade') op = e;
		if (s.tr === 'whip') ((tx = (1 - e) * 100), filters.push(`blur(${(1 - e) * 18}px)`));
		if (s.tr === 'zoom') ((sc = 0.75 + 0.25 * e), (op = e), filters.push(`blur(${(1 - e) * 10}px)`));
		if (s.tr === 'dip') ((op = p > 0.5 ? 1 : 0), filters.push(`brightness(${Math.max(0, p * 2 - 1)})`));
		if (s.tr === 'flash') filters.push(`brightness(${1 + (1 - p) * 4})`);
	}
	if (next && TLEN[next.tr] && g > next.at - TLEN[next.tr] / 2) {
		const q = Math.min(1, Math.max(0, (g - (next.at - TLEN[next.tr] / 2)) / TLEN[next.tr]));
		const e = Easing.inOut(Easing.cubic)(q);
		if (next.tr === 'whip') ((tx = -e * 100), filters.push(`blur(${e * 18}px)`));
		if (next.tr === 'zoom') ((sc = 1 + 0.5 * e), filters.push(`blur(${e * 10}px)`));
		if (next.tr === 'dip') filters.push(`brightness(${Math.max(0, 1 - q * 2)})`);
		if (next.tr === 'flash') filters.push(`brightness(${1 + q * 4})`);
	}
	return {opacity: op, transform: `translateX(${tx}%) scale(${sc})`, ...(filters.length ? {filter: filters.join(' ')} : {})};
};

const ShotLayer: React.FC<{i: number; start: number}> = ({i, start}) => {
	const lf = useCurrentFrame();
	const g = start + lf;
	const def = SHOTS[i];
	const to = SHOTS[i + 1]?.at ?? RF_FRAMES;
	const C = def.C;
	const f = g - def.at;
	return (
		<AbsoluteFill style={layerStyle(i, g)}>
			<ThreeCanvas width={1080} height={1920} shadows="soft" dpr={1}>
				<C f={f} d={to - def.at} g={g} />
				<PS1Pass levels={24} />
				<CineGrade preset={def.look} frame={g} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

type Cue = {t: number; file: string; vol?: number};
const CUES: Cue[] = [
	{t: 0, file: 'bed_rf', vol: 0.4},
	{t: 0, file: 'wind', vol: 0.18},
	...SHOTS.slice(1).map((s) => ({t: s.at / FPS, file: s.tr === 'whip' ? 'whoosh' : 'swish', vol: s.tr === 'whip' ? 0.2 : 0.07})),
	{t: 5.6, file: 'crowd', vol: 0.16},
	{t: W(1, 4) / FPS, file: 'boom', vol: 0.5},
	{t: 11.2, file: 'heli', vol: 0.22},
	{t: W(2, 12) / FPS + 0.3, file: 'ding', vol: 0.3},
	{t: 18.2, file: 'crowd', vol: 0.1},
	...[18.4, 19.6, 21.0, 22.4].map((t) => ({t, file: 'shutter', vol: 0.18})),
	{t: 25.4, file: 'siren', vol: 0.25},
	{t: 25.4, file: 'fire', vol: 0.35},
	{t: 29.0, file: 'heartbeat', vol: 0.5},
	{t: 33.2, file: 'heli', vol: 0.2},
	{t: 36.8, file: 'crickets', vol: 0.3},
	...[38.8, 39.1, 39.4, 39.7, 40.0].map((t) => ({t, file: 'step', vol: 0.25})),
	{t: 40.4, file: 'wind', vol: 0.3},
	{t: W(6, 6) / FPS - 0.3, file: 'heli', vol: 0.4},
	{t: 48.2, file: 'heli', vol: 0.3},
	{t: 51.0, file: 'heli', vol: 0.3},
	{t: 55.0, file: 'wind', vol: 0.18},
	{t: 55.0, file: 'crowd', vol: 0.08},
];

export const EscobarRF: React.FC = () => {
	const font = useBlockFont();
	if (!font) return null;
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			{SHOTS.map((s, i) => {
				const start = Math.max(0, s.at - TLEN[s.tr] / 2);
				const next = SHOTS[i + 1];
				const end = next ? next.at + TLEN[next.tr] / 2 : RF_FRAMES;
				return (
					<Sequence key={i} from={start} durationInFrames={Math.max(1, Math.round(end - start))}>
						<ShotLayer i={i} start={start} />
					</Sequence>
				);
			})}
			<CaptionsFor timing={T} />
			<Audio src={staticFile('vo/escobarrf.wav')} />
			{CUES.map((c, i) => (
				<Sequence key={`a${i}`} from={Math.max(0, Math.round(c.t * FPS))} layout="none">
					<Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol ?? 1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
