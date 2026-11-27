import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {BlockText, useBlockFont} from '../BlockText';
import {walk} from '../anim';
import {CaptionsFor, handOf} from '../lebron/common';
import {PS1Pass} from '../ps1/ps1';
import {Who} from '../lowpoly/Rig';
import {CineGrade, CinePreset} from '../cine/Cine';
import {pop} from '../lebron2/LeBron2';
import {BKey, Direction, FaceKey, Impact, Profile, act, squash} from '../acting';
import {Bx, flat, glow} from '../env';
import {extraLook} from '../escobarrf/props';
import {C, PR, Person} from './cast';
import {Arena, Atlanta, Court, Gavel, Gym, Induction, Louisville, PressRoom, Rome} from './sets';
import {Glove} from './props';
import timing from './timing.json';

// MUHAMMAD ALI — 58 s. Script: docs/ali/01-brief-script.md (the man who'd fight anyone, and the one
// fight he refused). Every character performed with src/acting; boxing hits shown with weight
// (impact frames on ones, squash, camera shake) per docs/CREATIVE-FREEDOM.md.

const FPS = 30;
const PI = Math.PI;
const T = timing as {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};
export const ALI_FRAMES = Math.round((T.duration + 0.45) * FPS);
const W = (l: number, w: number) => Math.round(T.lines[l].words[w].s * FPS);
type V3 = [number, number, number];
type ShotProps = {f: number; d: number; o: number}; // o = global frame of the shot's cut
const CANVAS = 2.4; // ring canvas height

// ---------- camera ----------
type CK = {f: number; p: V3; t: V3; fov?: number};
const Cam: React.FC<{f: number; k: CK[]; shake?: {at: number; amp: number; len?: number}[]}> = ({f, k, shake = []}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	let i = 0;
	while (i < k.length - 1 && f >= k[i + 1].f) i++;
	const a = k[i];
	const b = k[Math.min(i + 1, k.length - 1)];
	const u = b.f === a.f ? 1 : Easing.inOut(Easing.sin)(Math.min(1, Math.max(0, (f - a.f) / (b.f - a.f))));
	const mix = (x: V3, y: V3) => x.map((v, j) => v + (y[j] - v) * u) as V3;
	const p = mix(a.p, b.p);
	for (const s of shake)
		if (f >= s.at && f < s.at + (s.len ?? 10)) {
			const k2 = 1 - (f - s.at) / (s.len ?? 10);
			p[0] += Math.sin(f * 2.3) * s.amp * k2;
			p[1] += Math.cos(f * 3.1) * s.amp * 0.7 * k2;
		}
	camera.position.set(...p);
	camera.fov = (a.fov ?? 40) + ((b.fov ?? 40) - (a.fov ?? 40)) * u;
	camera.near = 0.1;
	camera.far = 900;
	camera.lookAt(...mix(a.t, b.t));
	camera.updateProjectionMatrix();
	return null;
};

const Actor: React.FC<{p: Person; prof: Profile; d: Direction; f: number; at: V3; holdL?: React.ReactNode; holdR?: React.ReactNode; gloves?: string}> = ({p, prof, d, f, at, holdL, holdR, gloves}) => (
	<Who look={p.look} h={p.h} at={at} pose={act(prof, d, f)} holdL={gloves ? <group position={[0, 0.2, 0]}><Glove color={gloves} s={0.62} /></group> : holdL} holdR={gloves ? <group position={[0, 0.2, 0]}><Glove color={gloves} s={0.62} /></group> : holdR} />
);
const N = (p: Profile, seed: number): Profile => ({...p, seed});
// Boxer guard + punch helpers (forward = negative armX)
const GUARD = {armLX: -1.9, armLZ: -0.35, armRX: -1.7, armRZ: 0.35, lean: 0.1};
const jab = (f: number, side: 'L' | 'R', len = 5): BKey[] => [
	{f: f - 2, ...(side === 'L' ? {armLX: -1.6, armLZ: -0.2} : {armRX: -1.5, armRZ: 0.25, twist: 0.15})},
	{f, ...(side === 'L' ? {armLX: -1.55, armLZ: 0.05, twist: -0.25} : {armRX: -1.6, armRZ: -0.05, twist: 0.35}), lean: 0.22, ease: 'snap'},
	{f: f + len, ...(side === 'L' ? {armLX: -1.9, armLZ: -0.35} : {armRX: -1.7, armRZ: 0.35}), twist: 0, lean: 0.1},
];

// ===================== 1  LOUISVILLE, 1954 =====================
const S1: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam f={f} k={[{f: 0, p: [10, 16, 22], t: [0, 7, -9], fov: 44}, {f: d, p: [8, 4.5, 11], t: [2.5, 2.4, -4.6], fov: 42}]} />
		<Louisville f={f} />
		<Actor p={C.kid} prof={PR.kid} f={f} at={[0, 0.3, 0]} d={{keys: [...walk(0, 50, [4.6, -2.2], [0.4, -7.4], 8), {f: 0, rotY: PI + 0.7}, {f: 50, rotY: PI}], faces: [{f: 0, e: 'happy'}], gaze: [{f: 0, g: [0, 0]}], mannerism: false}} />
	</>
);
// 2  "Someone steals a twelve-year-old's bike": the thief rides off down the street
const S2: React.FC<ShotProps> = ({f, d}) => {
	const ride = Math.max(0, f - 12);
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [9, 3.0, 4], t: [2.5, 2.2, -4.4], fov: 40}, {f: d, p: [6, 3.2, 8], t: [-8, 2.6, 2], fov: 42}]} />
			<Louisville f={f + 76} bike={f < 12} thief={ride} />
			{f < 12 ? (
				<Actor p={C.thief} prof={N(PR.kid, 51)} f={f} at={[3.2, 0.3, -3.2]} d={{keys: [{f: 0, rotY: PI, lean: 0.3, armLX: -1.2, armRX: -1.2}], faces: [{f: 0, e: 'smirk'}], gaze: [{f: 0, g: [0.8, 0]}], mannerism: false}} />
			) : (
				<Actor p={C.thief} prof={N(PR.kid, 51)} f={f} at={[-6 - ride * 0.4, 0.3, 2.2]} d={{keys: [{f: 0, rotY: -PI / 2, y: 0.9, lean: 0.25, legLX: -0.9, legRX: -0.5, armLX: -1.3, armRX: -1.3}], faces: [{f: 0, e: 'smirk'}], gaze: [{f: 0, g: [-0.8, 0]}], cadence: [{from: -999, n: 1}], mannerism: false}} />
			)}
		</>
	);
};
// 3  "and he tells a cop he's going to whup the thief": the kid finds the empty rack, storms to the cop
const S3: React.FC<ShotProps> = ({f, d, o}) => {
	const whup = W(0, 15) - o;
	const kid: BKey[] = [
		{f: 0, x: 1.8, z: -3.6, rotY: PI / 2, headY: 0.3},
		{f: 6, headY: 0.9},
		{f: 14, headY: 0, sq: 0.06, shrug: 0.4, ease: 'snap'}, // the bike's gone
		{f: 20, rotY: -0.4, sq: 0, shrug: 0.2},
		...walk(22, 40, [1.8, -3.6], [-1.6, -1.6], 6),
		{f: 22, rotY: -1.0},
		{f: whup - 6, ...{armRX: -0.4, armLX: -0.4, shrug: 0.1, lean: -0.08}, ease: 'inOut'},
		{f: whup, armRX: -1.8, armRZ: 0.3, armLX: -1.1, armLZ: -0.4, lean: 0.25, sq: -0.06, twist: 0.4, ease: 'snap'}, // "whup": a punch at the air
		{f: whup + 8, armRX: -1.5, armLX: -1.5, armRZ: 0.35, armLZ: -0.35, lean: 0.1, sq: 0, twist: 0},
		{f: whup + 16, twist: -0.3, armLX: -1.8},
		{f: whup + 22, twist: 0.1},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [5.6, 4.0, 6], t: [0.6, 2.6, -3.2], fov: 42}, {f: whup - 4, p: [3.0, 3.6, 5.2], t: [-1.8, 2.8, -1.6], fov: 40}, {f: d, p: [2.2, 3.3, 3.8], t: [-1.9, 2.9, -1.6], fov: 38}]} shake={[{at: whup, amp: 0.06, len: 8}]} />
			<Louisville f={f + 150} bike={false} />
			<Actor p={C.kid} prof={PR.kid} f={f} at={[0, 0.3, 0]} d={{keys: kid, faces: [{f: 0, e: 'happy'}, {f: 12, e: 'shock', in: 0}, {f: 22, e: 'angry', in: 4}, {f: whup - 2, e: 'furious', in: 2}], gaze: [{f: 0, g: [0, -0.2]}, {f: 10, g: [-0.3, -0.5]}, {f: 24, g: [-0.6, 0.4]}], cadence: [{from: -999, n: 2}, {from: whup - 2, n: 1}, {from: whup + 6, n: 2}], mannerism: false}} />
			<Actor p={C.martin} prof={PR.martin} f={f} at={[-4.0, 0.3, -0.2]} d={{keys: [{f: 0, rotY: 1.1, armLZ: 0.3, armRZ: -0.3, armLX: 0.2, armRX: 0.2}, {f: whup + 4, headZ: -0.12, headX: 0.1}], faces: [{f: 0, e: 'calm'}, {f: 28, e: 'skeptical', in: 8}, {f: whup + 4, e: 'happy', in: 8}], gaze: [{f: 0, g: [0.6, 0]}, {f: 26, g: [0.3, -0.5]}], mannerism: false}} />
		</>
	);
};
// 4-5  The gym: Martin brings the kid in; holds out gloves ("Learn to fight first")
const S4: React.FC<ShotProps> = ({f, d, o}) => {
	const learn = W(1, 6) - o;
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [2, 7, 16], t: [-2, 3.5, -4], fov: 44}, {f: learn, p: [-1.5, 4.8, 13], t: [4.2, 3.2, 2.6], fov: 40}, {f: d, p: [-0.6, 4.7, 11.5], t: [4.3, 3.3, 2.6], fov: 38}]} />
			<Gym f={f} />
			<Actor p={C.kid} prof={PR.kid} f={f} at={[0, 0, 0]} d={{keys: [...walk(0, 36, [-3, 6], [2.8, 3.4], 7), {f: 0, rotY: 2.0}, {f: 36, rotY: 1.2}, {f: learn, headX: -0.05}], faces: [{f: 0, e: 'angry'}, {f: 30, e: 'skeptical', in: 8}, {f: learn + 10, e: 'focused', in: 8}], gaze: [{f: 0, g: [0.4, 0]}, {f: 20, g: [-0.6, 0.2]}, {f: learn, g: [0.6, 0.3]}], mannerism: false}} />
			<Actor
				p={C.martin}
				prof={PR.martin}
				f={f}
				at={[5.8, 0, 2.4]}
				holdR={f > learn - 6 ? <group position={[0, 0.2, 0.3]}><Glove s={0.5} /></group> : null}
				d={{keys: [{f: 0, rotY: -1.6, armRX: 0.1}, {f: learn - 4, armRX: -0.2}, {f: learn + 4, armRX: -1.4, armRZ: 0.2, lean: 0.08, ease: 'back'}], faces: [{f: 0, e: 'calm'}, {f: learn, e: 'smirk', in: 6}], gaze: [{f: 0, g: [0, -0.3]}], words: T.lines[1].words.slice(6), mannerism: false}}
			/>
			{/* kids training in the BG: one on the heavy bag, one skipping */}
			<Actor p={{look: extraLook(201).look, h: 0.8}} prof={N(PR.kid, 61)} f={f} at={[-9.2, 0, 3.6]} gloves="#8a2a2a" d={{keys: [{f: 0, rotY: -PI / 2 + 0.3, ...GUARD}, ...[10, 22, 34, 46, 58].flatMap((t, i) => jab(t, i % 2 ? 'R' : 'L'))], faces: [{f: 0, e: 'focused'}], mannerism: false}} />
			<Actor p={{look: extraLook(202).look, h: 0.76}} prof={N(PR.kid, 62)} f={f} at={[-2, 0, -2]} d={{keys: [{f: 0, rotY: 0.4, armLZ: 0.5, armRZ: -0.5}, ...Array.from({length: 12}, (_, i) => ({f: i * 8, y: i % 2 ? 0.35 : 0}))], faces: [{f: 0, e: 'happy'}], mannerism: false}} />
		</>
	);
};
// 5b  SLICE IT OPEN: macro on the glove; it splits; label HORSEHAIR
const S5: React.FC<ShotProps> = ({f, d}) => {
	const cut = interpolate(f, [4, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [10.4, 3.8, 9.6], t: [7.6, 2.6, 4], fov: 38}, {f: d, p: [11.2, 5.2, 11.4], t: [7.6, 3.4, 4], fov: 42}]} />
			<Gym f={f + 48} sliced={cut} />
			<Bx s={[0.02, 2, 2]} p={[7.6 + (cut < 1 ? 0 : 99), 2.0 + 1.5 - cut * 3, 4]} r={[0, -0.4, 0]} m={glow('#ff3a2a', 4)} cast={false} />
		</>
	);
};

// ===================== 2  ROME 1960 → MIAMI 1964 =====================
const S6: React.FC<ShotProps> = ({f, d, o}) => {
	const clay = W(2, 3) - o;
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [4, 7, 22], t: [0, 7, -2], fov: 40}, {f: d, p: [2.4, 7.4, 17], t: [0, 7.4, -2], fov: 38}]} />
			<Rome f={f} />
			<Actor p={C.clay18} prof={PR.ali} f={f} at={[0, CANVAS + 1.8, -2]} holdR={null} d={{keys: [{f: 0, armLZ: 0.1, armRZ: -0.1}, {f: clay - 4, shrug: -0.1}, {f: clay + 4, armLX: -2.5, armRX: -2.5, armLZ: 0.75, armRZ: -0.75, sq: 0.05, ease: 'back'}, {f: clay + 30, armLX: -2.3, armRX: -2.3, armLZ: 0.7, armRZ: -0.7, sq: 0}], faces: [{f: 0, e: 'proud'}, {f: clay, e: 'beam', in: 4}], gaze: [{f: 0, g: [0, 0.2]}, {f: clay + 30, g: [-0.6, 0.4]}], mannerism: false}} />
			{/* the medal on his chest */}
			<Bx s={[0.5, 0.5, 0.1]} p={[0, CANVAS + 1.8 + 2.6, -1.4]} m={glow('#f2c040', 1.4)} cast={false} />
			{[[-3.2, 1.2], [3.2, 0.9]].map(([x, h], i) => (
				<Who key={i} look={extraLook(210 + i).look} h={0.95} at={[x, CANVAS + h, -2]} pose={act(N(PR.officer, 70 + i), {keys: [{f: 0, armLZ: 0.1, armRZ: -0.1}], faces: [{f: 0, e: i ? 'calm' : 'proud'}], mannerism: false}, f)} />
			))}
		</>
	);
};
// Miami 1964: Liston's glare (feared) → Liston on his stool, Clay runs to the ropes shouting
const S7: React.FC<ShotProps> = ({f, d, o}) => {
	const feared = W(2, 19) - o;
	const quit = W(2, 15) - o; // "title"
	const winner: BKey[] = [
		{f: 0, x: 2, z: 2, rotY: -2.4, ...GUARD},
		...Array.from({length: 8}, (_, i) => ({f: i * 7, x: 2 + Math.sin(i * 1.7) * 0.8, y: i % 2 ? 0.25 : 0})),
		{f: quit + 20, x: 6.5, z: 5.5, rotY: 0.6, y: 0, armLX: -3.0, armRX: -3.0, armLZ: 0.4, armRZ: -0.4, lean: -0.15, sq: 0.05, ease: 'back'},
		{f: d, x: 6.8, z: 6.0},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [-4, 7.2, 13], t: [-2, 6.4, -2], fov: 40}, {f: feared - 18, p: [-2.4, 7.6, 0.4], t: [-7.4, 6.6, -7.4], fov: 36}, {f: feared + 6, p: [-3.2, 7.4, -0.8], t: [-7.4, 6.7, -7.4], fov: 34}, {f: feared + 8, p: [10, 6.5, 16], t: [4, 6, 3], fov: 42}, {f: d, p: [9, 6.2, 14], t: [5.5, 6.4, 4.5], fov: 40}]} />
			<Arena f={f} kind="miami" cheer={f > feared + 8 ? 1 : 0} />
			<pointLight position={[-3.5, 8.5, -2.5]} intensity={f < feared + 8 ? 40 : 0} distance={12} decay={1.4} color="#ffe8c8" />
			<Actor p={C.ali} prof={PR.ali} f={f} at={[0, CANVAS, 0]} gloves="#b82a2a" d={{keys: winner, faces: [{f: 0, e: 'smirk'}, {f: feared + 8, e: 'beam', x: {mouth: 'aa', jaw: 0.7}, in: 3}], gaze: [{f: 0, g: [-0.3, 0]}, {f: feared + 10, g: [0, 0.6]}], cadence: [{from: -999, n: 2}, {from: feared + 8, n: 1}, {from: feared + 20, n: 2}], mannerism: false}} />
			<Actor p={C.liston} prof={PR.liston} f={f} at={[-7.4, 0, -7.4]} gloves="#2a2a30" d={{keys: [{f: 0, rotY: 0.75, y: (CANVAS + 1.75) / C.liston.h - 2, legLX: -PI / 2, legRX: -PI / 2, armLZ: 0.5, armRZ: -0.5, armLX: -0.6, armRX: -0.6, lean: 0.15, headX: 0.12}, {f: feared + 12, headX: 0.35, lean: 0.3, shrug: 0.2}], faces: [{f: 0, e: 'furious', x: {mouth: 'rest'}}, {f: feared + 12, e: 'tired', in: 10}], gaze: [{f: 0, g: [0.2, 0.3]}, {f: feared + 12, g: [0, -0.8]}], mannerism: false}} />
		</>
	);
};

// ===================== 3  THE NAME, THE DRAFT =====================
const S8: React.FC<ShotProps> = ({f, d, o}) => {
	const name = W(3, 6) - o;
	const s = pop(f, name - 2);
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [2.2, 5.0, 8.5], t: [0, 4.4, -2.4], fov: 38}, {f: d, p: [1.4, 4.9, 6.8], t: [0, 4.6, -2.4], fov: 36}]} />
			<PressRoom f={f} />
			<Actor p={C.aliSuit} prof={PR.ali} f={f} at={[0, 0, -3.4]} d={{keys: [{f: 0, y: 2.4 / C.aliSuit.h - 2, legLX: -PI / 2, legRX: -PI / 2, armLX: -1.2, armRX: -1.2, armLZ: -0.1, armRZ: 0.1}, {f: name - 6, headX: 0.05}, {f: name + 4, headX: -0.1, shrug: 0.1, ease: 'back'}], faces: [{f: 0, e: 'calm'}, {f: name, e: 'proud', in: 6}], gaze: [{f: 0, g: [0.5, 0]}, {f: name - 4, g: [0, 0.1]}], words: [{w: 'my', s: (o + 4) / FPS, e: (o + 9) / FPS}, {w: 'name', s: (o + 10) / FPS, e: (o + 18) / FPS}, {w: 'is', s: (o + 19) / FPS, e: (o + 23) / FPS}, {w: 'Muhammad', s: (o + name) / FPS, e: (o + name + 12) / FPS}, {w: 'Ali', s: (o + name + 13) / FPS, e: (o + name + 22) / FPS}], mannerism: false}} />
			<group position={[-0.5, 7.4, -5.5]} rotation={[0, 0.2, 0]} scale={s}>
				<BlockText text="MUHAMMAD ALI" size={0.42} depth={0.22} color="#f2d040" side="#6a5010" />
			</group>
		</>
	);
};
// The line on the floor: the others step forward; he doesn't
const ROW = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5];
const S9: React.FC<ShotProps> = ({f, d, o}) => {
	const step = W(3, 19) - o;
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [-4.2, 6.4, -8.3], t: [0.5, 4.0, 1.2], fov: 46}, {f: step, p: [-3.4, 6.0, -8.2], t: [1.2, 4.2, 1.2], fov: 42}, {f: d, p: [-2.4, 5.8, -7.0], t: [1.5, 4.6, 1.2], fov: 36}]} />
			<Induction f={f} />
			{ROW.map((x, i) => {
				const isAli = i === 3;
				const p = isAli ? C.aliSuit : {look: extraLook(230 + i).look, h: 0.92 + (i % 3) * 0.05};
				const keys: BKey[] = isAli
					? [{f: 0, z: 1.2, rotY: PI, armLZ: 0.06, armRZ: -0.06}, {f: step + 6, headX: -0.06, shrug: 0.05}]
					: [{f: 0, z: 1.2, rotY: PI, armLZ: 0.06, armRZ: -0.06}, ...walk(step - 2 + i, step + 10 + i, [0, 1.2], [0, -1.0], 6, false), {f: step + 14, headY: i < 3 ? 0.6 : -0.6}];
				return (
					<Actor
						key={i}
						p={p}
						prof={isAli ? PR.ali : N(PR.officer, 80 + i)}
						f={f}
						at={[x, 0, 0]}
						d={{keys, faces: isAli ? [{f: 0, e: 'calm'}, {f: step, e: 'focused', in: 10}] : [{f: 0, e: (['neutral', 'worried', 'tired', 'neutral', 'worried', 'calm'] as const)[i]}, {f: step + 14, e: 'surprised', in: 6}], gaze: isAli ? [{f: 0, g: [0, 0.1]}] : [{f: 0, g: [0, 0]}, {f: step + 14, g: [i < 3 ? 0.9 : -0.9, 0]}], mannerism: false}}
					/>
				);
			})}
			<Actor p={C.officer} prof={PR.officer} f={f} at={[1.4, 0, -7.4]} d={{keys: [{f: 0, rotY: 0, armLX: -1.3, armRX: -1.3}, {f: step + 10, headY: 0.2, headX: -0.05}], faces: [{f: 0, e: 'focused'}, {f: step + 12, e: 'skeptical', in: 6}], gaze: [{f: 0, g: [0, -0.4]}, {f: step + 8, g: [0.15, 0]}], mannerism: false}} />
		</>
	);
};

// ===================== 4  THE COST =====================
// belt taken away, licence torn in two, gavel: "five years"
const Belt: React.FC = () => (
	<group>
		<Bx s={[4.8, 0.15, 0.8]} m={flat('#2a1a14')} />
		<Bx s={[1.6, 0.25, 1.3]} m={glow('#e8b830', 0.6)} />
		<group position={[0, 0.14, 0.2]} rotation={[-PI / 2, 0, 0]}>
			<BlockText text="CHAMPION" size={0.2} depth={0.04} color="#5a3a10" />
		</group>
		{[-1, 1].map((x) => <Bx key={x} s={[0.6, 0.22, 0.8]} p={[x * 1.05, 0, 0]} m={flat('#c8a23a')} />)}
	</group>
);
const S10: React.FC<ShotProps> = ({f, d, o}) => {
	const license = W(4, 4) - o;
	const five = W(4, 11) - o;
	const tear = interpolate(f, [license + 4, license + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const lift = f < five - 8 ? -0.2 : f < five ? interpolate(f, [five - 8, five - 2], [-0.2, -1.3]) : interpolate(f, [five, five + 3], [-1.3, 0.05], {extrapolateRight: 'clamp'});
	if (f < license)
		return (
			<>
				<Cam f={f} k={[{f: 0, p: [0.6, 7.0, 5.4], t: [-0.6, 2.3, 0], fov: 40}, {f: license, p: [0.2, 6.6, 4.8], t: [-1.2, 2.3, 0], fov: 38}]} />
				<Court f={f} />
				<Bx s={[6, 2.2, 3]} p={[0, 1.1, 0]} m={flat('#5a3420')} />
				<group position={[interpolate(f, [10, 40], [0, -4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)}), 2.3, 0]}>
					<Belt />
				</group>
				<Bx s={[1.2, 0.5, 2.0]} p={[interpolate(f, [10, 40], [1.6, -2.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)}), 2.6, 0.4]} m={flat('#2a2c34')} />
			</>
		);
	if (f < five - 26)
		return (
			<>
				<Cam f={f} k={[{f: license, p: [0, 3.6, 9.0], t: [0, 3.3, 0], fov: 38}, {f: five, p: [0, 3.6, 8.2], t: [0, 3.3, 0], fov: 36}]} />
				<Court f={f} />
				<Bx s={[6, 2.2, 3]} p={[0, 1.1, 0]} m={flat('#5a3420')} />
				{[-1, 1].map((k) => (
					<group key={k} position={[k * (0.62 + tear * 0.7), 3.4 - tear * 0.4, 0.6]} rotation={[0, 0, k * tear * 0.5]}>
						<Bx s={[1.24, 1.6, 0.05]} m={flat('#f2ead2')} />
						<Bx s={[1.1, 0.3, 0.06]} p={[0, 0.55, 0]} m={flat('#2a4a8a')} />
						<BlockText text={k < 0 ? 'BOX' : 'ING'} size={0.32} depth={0.04} color="#1a1a1a" position={[k < 0 ? 0.1 : -0.1, -0.1, 0.04]} />
					</group>
				))}
			</>
		);
	return (
		<>
			<Cam f={f} k={[{f: five - 26, p: [-3.0, 5.4, 9], t: [0, 4.6, -6], fov: 40}, {f: d, p: [-2.4, 5.4, 7.6], t: [0, 4.8, -6], fov: 38}]} shake={[{at: five, amp: 0.1, len: 8}]} />
			<Court f={f} />
			<Actor p={C.justice} prof={N(PR.liston, 91)} f={f} at={[0, 1.6, -7.2]} d={{keys: [{f: 0, rotY: 0, armRX: -1.2}], faces: [{f: 0, e: 'focused'}], mannerism: false}} />
			<group position={[1.2, 3.9, -5.4]}>
				<Gavel lift={lift} />
			</group>
			<Actor p={C.aliSuit} prof={PR.ali} f={f} at={[-3.0, 0, 3.2]} d={{keys: [{f: 0, rotY: PI + 0.25, armLZ: 0.06, armRZ: -0.06}], faces: [{f: 0, e: 'focused'}], gaze: [{f: 0, g: [0, 0.2]}], mannerism: false}} />
		</>
	);
};
// The exile years: alone in the empty gym at night, shadowboxing; the years fall away; he stops
const S11: React.FC<ShotProps> = ({f, d, o}) => {
	const refused = W(4, 29) - o; // "one"
	const years = Math.min(3, Math.floor(Math.max(0, f - 10) / 26));
	const keys: BKey[] = [
		{f: 0, x: 2, z: -7, rotY: 0.3, ...GUARD},
		...[8, 20, 30, 44, 56, 70, 82, 96].flatMap((t, i) => jab(t, i % 2 ? 'R' : 'L', 6)),
		...Array.from({length: 14}, (_, i) => ({f: i * 8, x: 2 + Math.sin(i * 1.3) * 0.8, y: i % 2 ? 0.18 : 0})),
		{f: refused - 4, ...GUARD},
		{f: refused + 6, armLX: -0.2, armRX: -0.2, armLZ: 0.08, armRZ: -0.08, lean: 0.05, shrug: 0.2, headX: 0.15, ease: 'inOut'},
		{f: refused + 30, shrug: 0.1, headX: 0.2},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [-6, 6.5, 10], t: [1.5, 4.0, -7], fov: 40}, {f: refused, p: [-1.0, 5.6, 1.5], t: [2, 5.0, -7], fov: 36}, {f: d, p: [0.4, 5.6, -1.4], t: [2, 5.4, -7], fov: 32}]} />
			<Gym f={f} empty />
			<Actor p={{look: {...C.aliSuit.look, top: {kind: 'shirt', base: '#f2f0e8', sleeves: 'short'}}, h: 1}} prof={PR.ali} f={f} at={[0, 0.9, 0]} d={{keys, faces: [{f: 0, e: 'focused'}, {f: refused + 4, e: 'sad', in: 12}], gaze: [{f: 0, g: [0, 0]}, {f: refused + 6, g: [0.2, -0.7]}], mannerism: false}} />
			{/* the wall calendar: the years flip past */}
			<group position={[-6, 5.2, -13.5]}>
				<Bx s={[3, 3.4, 0.2]} m={flat('#f2ead2')} />
				<Bx s={[3, 0.8, 0.22]} p={[0, 1.3, 0]} m={flat('#b8262a')} />
				<BlockText text={String(1967 + years)} size={0.6} depth={0.1} color="#1a1a1a" position={[0, -0.6, 0.12]} />
			</group>
		</>
	);
};

// ===================== 5  FRAZIER 1971 / SUPREME COURT =====================
const S12: React.FC<ShotProps> = ({f, d, o}) => {
	const hook = W(5, 10) - o; // "first"
	const ali: BKey[] = [
		{f: 0, x: 1.6, z: 0, rotY: -PI / 2, ...GUARD},
		...[10, 24].flatMap((t, i) => jab(t, i ? 'R' : 'L')),
		{f: hook - 2, lean: 0.05, headX: 0},
		{f: hook + 2, lean: -0.6, headX: -0.5, headY: 0.4, twist: -0.5, armLX: -0.6, armRX: -0.4, armLZ: 0.7, armRZ: -0.7, sq: -0.08, ease: 'snap'}, // the hook lands
		{f: hook + 8, y: -1.5, lean: -1.2, legLX: -1.2, legRX: -0.8, sq: 0.05}, // on the canvas
		{f: hook + 20, y: -1.35, lean: -1.0},
	];
	const fz: BKey[] = [
		{f: 0, x: -1.8, z: 0.2, rotY: PI / 2, ...GUARD, lean: 0.28},
		...Array.from({length: 8}, (_, i) => ({f: i * 6, side: i % 2 ? 0.12 : -0.12, y: i % 2 ? -0.2 : 0})),
		{f: hook - 7, armLX: -1.2, armLZ: 0.5, twist: 0.5, lean: 0.35, sq: -0.06}, // loads the left hook
		{f: hook, armLX: -1.6, armLZ: -0.6, twist: -0.6, lean: 0.4, sq: 0.04, ease: 'snap'},
		{f: hook + 10, ...GUARD, twist: 0, lean: 0.2, sq: 0},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [1, 6.5, 17], t: [0, 5.2, 0], fov: 40}, {f: hook - 2, p: [2.2, 6.0, 13.5], t: [0.4, 5.2, 0], fov: 38}, {f: hook + 4, p: [5.5, 4.6, 11], t: [1.6, 3.6, 0], fov: 42}, {f: d, p: [5.0, 4.6, 11.5], t: [2.0, 3.4, 0], fov: 42}]} shake={[{at: hook, amp: 0.22, len: 12}]} />
			<Arena f={f} kind="msg" cheer={f > hook ? 0.8 : 0.2} />
			<Actor p={C.ali} prof={PR.ali} f={f} at={[0, CANVAS, 0]} gloves="#b82a2a" d={{keys: ali, faces: [{f: 0, e: 'focused'}, {f: hook + 1, e: 'shock', x: {lidL: 0.3, lidR: 0.5}, in: 0}, {f: hook + 10, e: 'tired', x: {mouth: 'sadopen', jaw: 0.4}, in: 4}], gaze: [{f: 0, g: [0, 0]}, {f: hook + 2, g: [0.6, 0.8]}], cadence: [{from: -999, n: 2}, {from: hook - 2, n: 1}, {from: hook + 12, n: 2}], mannerism: false}} />
			<Actor p={C.frazier} prof={PR.frazier} f={f} at={[0, CANVAS, 0]} gloves="#2a6a3a" d={{keys: fz, faces: [{f: 0, e: 'focused'}, {f: hook, e: 'furious', in: 0}, {f: hook + 10, e: 'focused', in: 6}], gaze: [{f: 0, g: [0, 0.1]}, {f: hook + 4, g: [0, -0.6]}], cadence: [{from: -999, n: 2}, {from: hook - 2, n: 1}, {from: hook + 12, n: 2}], mannerism: false}} />
			<Impact f={f} at={hook} pos={[0.3, CANVAS + 4.7, 0.4]} r={1.3} len={4} />
		</>
	);
};
const S13: React.FC<ShotProps> = ({f, d, o}) => {
	const eight = W(5, 19) - o;
	const s = pop(f, eight - 2);
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [0, 6, 18], t: [0, 5.2, -7], fov: 44}, {f: d, p: [0, 5.8, 13], t: [0, 5.6, -7], fov: 42}]} />
			<Court f={f} supreme />
			{Array.from({length: 9}, (_, i) =>
				i === 6 ? null : (
					<Actor key={i} p={{look: {...C.justice.look, hair: {style: i % 3 ? 'short' : 'bald', color: ['#c8c4bc', '#6a625a', '#3a3430'][i % 3]}, skin: ['#e0b48a', '#d8a882', '#8a5a3a'][i % 3 === 2 && i === 5 ? 2 : i % 2]}, h: 0.95 + (i % 3) * 0.04}} prof={N(PR.liston, 100 + i)} f={f} at={[-11 + i * 2.75, 1.6, -7.2]} d={{keys: [{f: 0, y: 2.0 - 2, legLX: -PI / 2, legRX: -PI / 2, armLX: -1.3, armRX: -1.3}], faces: [{f: 0, e: (['focused', 'calm', 'neutral', 'tired'] as const)[i % 4]}], mannerism: false}} />
				),
			)}
			<group position={[0, 10, -4]} scale={s}>
				<BlockText text="8 - 0" size={1.3} depth={0.35} color="#f2d040" side="#6a5010" />
			</group>
		</>
	);
};

// ===================== 6  KINSHASA 1974 =====================
const S14: React.FC<ShotProps> = ({f, d, o}) => {
	const ropes = W(6, 6) - o;
	const out = W(6, 12) - o;
	const fm: BKey[] = [
		{f: 0, x: 4.2, z: 4.0, rotY: 0, ...GUARD},
		...[ropes - 10, ropes, ropes + 8, ropes + 18, ropes + 30, ropes + 44, out - 6].flatMap((t, i) => [
			{f: t - 4, armRX: -1.2, armRZ: 0.6, twist: 0.5, lean: 0.25, sq: -0.04},
			{f: t, armRX: -1.6, armRZ: -0.3, twist: -0.4, lean: 0.4 - i * 0.03, sq: 0.03, ease: 'snap' as const},
			{f: t + 4, ...GUARD, twist: 0, sq: 0},
		]),
		{f: out + 4, lean: 0.35, shrug: 0.4, headX: 0.2, armLX: -1.2, armRX: -1.2}, // arm-weary, gasping
	];
	const al: BKey[] = [
		{f: 0, x: 4.2, z: 7.6, rotY: PI, ...GUARD, lean: -0.35, headX: 0.1}, // back on the ropes
		{f: ropes, lean: -0.5},
		...[ropes + 14, ropes + 40].map((t) => ({f: t, headZ: 0.15, headX: -0.1})),
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [-30, 30, 50], t: [0, 8, 0], fov: 46}, {f: ropes - 20, p: [-10, 9, 24], t: [3, 5, 5], fov: 40}, {f: ropes - 19, p: [-15, 8.6, 6.2], t: [4.6, 5.4, 6.2], fov: 44}, {f: d, p: [-13, 8.2, 6.0], t: [4.6, 5.4, 6.0], fov: 42}]} shake={[ropes, ropes + 8, ropes + 18, ropes + 30].map((at) => ({at, amp: 0.06, len: 5}))} />
			<Arena f={f} kind="kinshasa" ropeBow={f > ropes - 20 ? 0.6 + Math.sin(f * 0.6) * 0.15 : 0} cheer={0.4} />
			<Actor p={C.foreman} prof={PR.foreman} f={f} at={[0, CANVAS, 0]} gloves="#b8262a" d={{keys: fm, faces: [{f: 0, e: 'furious'}, {f: out, e: 'tired', x: {mouth: 'sadopen', jaw: 0.5}, in: 8}], gaze: [{f: 0, g: [0, 0]}], mannerism: false}} />
			<Actor p={C.ali} prof={PR.ali} f={f} at={[0, CANVAS, 0]} gloves="#f2f0e8" d={{keys: al, faces: [{f: 0, e: 'focused'}, {f: ropes + 14, e: 'smirk', in: 6}], gaze: [{f: 0, g: [0, 0.2]}], words: [{w: 'that', s: (o + ropes + 16) / FPS, e: (o + ropes + 22) / FPS}, {w: 'all', s: (o + ropes + 23) / FPS, e: (o + ropes + 30) / FPS}, {w: 'you', s: (o + ropes + 31) / FPS, e: (o + ropes + 36) / FPS}, {w: 'got', s: (o + ropes + 37) / FPS, e: (o + ropes + 44) / FPS}], mannerism: false}} />
		</>
	);
};
const S15: React.FC<ShotProps> = ({f, d, o}) => {
	const knock = W(6, 14) - o;
	const down = W(6, 16) - o;
	const champ = W(6, 20) - o;
	const al: BKey[] = [
		{f: 0, x: 4.0, z: 6.6, rotY: PI + 0.1, ...GUARD, lean: -0.1},
		{f: knock - 8, x: 4.0, z: 5.4, lean: 0.1}, // off the ropes
		...jab(knock - 4, 'L', 3),
		{f: knock - 1, armRX: -1.2, armRZ: 0.6, twist: 0.6, lean: 0.1, sq: -0.05},
		{f: knock + 1, armRX: -1.65, armRZ: -0.1, twist: -0.6, lean: 0.4, sq: 0.06, ease: 'snap'}, // the right hand
		{f: knock + 10, ...GUARD, twist: 0, sq: 0},
		{f: champ - 4, x: 2, z: 2, rotY: 0.3, shrug: -0.1},
		{f: champ + 4, armLX: -3.0, armRX: -3.0, armLZ: 0.45, armRZ: -0.45, lean: -0.15, sq: 0.06, shrug: 0.3, ease: 'back'},
	];
	const fm: BKey[] = [
		{f: 0, x: 4.0, z: 2.4, rotY: 0.1, ...GUARD, lean: 0.3, shrug: 0.3},
		{f: knock + 1, headY: 0.7, headX: -0.4, twist: 0.6, lean: 0.1, ease: 'snap'},
		{f: down, rotY: 1.6, lean: 0.6, y: -0.6, side: 0.4, sq: -0.06}, // spinning down
		{f: down + 10, y: -1.6, lean: 1.4, rotY: 2.2, side: 0.2, legLX: -0.6, legRX: -1.2, armLX: -2.6, armRX: -0.4},
	];
	return (
		<>
			<Cam f={f} k={[{f: 0, p: [-15, 8.4, 4.6], t: [4.5, 5.2, 4.6], fov: 44}, {f: down + 2, p: [-7.6, 6.4, -3.4], t: [4.5, 3.4, 3.4], fov: 44}, {f: champ - 6, p: [-6, 6.2, 9], t: [3.2, 4.8, 3.2], fov: 44}, {f: champ - 5, p: [0.6, 4.4, 14], t: [2.4, 6.4, 2.4], fov: 44}, {f: d, p: [1.0, 3.8, 12.2], t: [2.4, 7.0, 2.4], fov: 46}]} shake={[{at: knock + 1, amp: 0.18, len: 10}, {at: down + 8, amp: 0.25, len: 12}]} />
			<Arena f={f} kind="kinshasa" cheer={f > down ? 1 : 0.4} />
			<Actor p={C.ali} prof={PR.ali} f={f} at={[0, CANVAS, 0]} gloves="#f2f0e8" d={{keys: al, faces: [{f: 0, e: 'focused'}, {f: knock - 2, e: 'furious', in: 0}, {f: champ, e: 'beam', x: {mouth: 'aa', jaw: 0.8}, in: 3}], gaze: [{f: 0, g: [0, 0]}, {f: champ, g: [0, 0.8]}], cadence: [{from: -999, n: 2}, {from: knock - 6, n: 1}, {from: down + 14, n: 2}], mannerism: false}} />
			<Actor p={C.foreman} prof={PR.foreman} f={f} at={[0, CANVAS, 0]} gloves="#b8262a" d={{keys: fm, faces: [{f: 0, e: 'tired'}, {f: knock + 1, e: 'shock', x: {lidL: 0.4, lidR: 0.6}, in: 0}, {f: down + 4, e: 'tired', x: {lidL: 0.8, lidR: 0.8}, in: 4}], gaze: [{f: 0, g: [0, 0]}, {f: knock + 2, g: [-0.8, 0.6]}], cadence: [{from: -999, n: 2}, {from: knock - 6, n: 1}, {from: down + 14, n: 2}], mannerism: false}} />
			<Impact f={f} at={knock + 1} pos={[4.2, CANVAS + 5.2, 3.0]} r={1.5} len={5} />
		</>
	);
};

// ===================== 7  ATLANTA 1996 =====================
const S16: React.FC<ShotProps> = ({f, d, o}) => {
	const shake = W(7, 5) - o;
	const lights = W(7, 10) - o;
	const lit = interpolate(f, [lights + 6, lights + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
	const tremor = (k: number) => Math.sin(f * 1.7 + k) * 0.05 + Math.sin(f * 2.9 + k) * 0.03;
	const keys: BKey[] = [{f: 0, rotY: PI, armRX: -1.6, armRZ: 0.2, armLX: -0.3, lean: 0.05, headX: 0.05}, {f: lights - 6, armRX: -2.2}, {f: lights + 6, armRX: -1.5, ease: 'back'}];
	const pose = act(PR.martin, {keys, faces: [{f: 0, e: 'calm'}, {f: lights + 12, e: 'proud', in: 12}], gaze: [{f: 0, g: [0, 0.4]}, {f: lights + 8, g: [0, 0.9]}], mannerism: false}, f);
	pose.armRX = (pose.armRX ?? 0) + tremor(0);
	pose.armRZ = (pose.armRZ ?? 0) + tremor(2);
	pose.armLX = (pose.armLX ?? 0) + tremor(4) * 0.6;
	pose.headZ = (pose.headZ ?? 0) + tremor(6) * 0.3;
	const h = handOf(pose, 'R', [0, 0, 0], 1);
	const close = f >= shake - 4 && f < lights - 2;
	return (
		<>
			<Cam
				f={f}
				k={close ? [{f: shake - 4, p: [3.8, 10.8, -7.8], t: [0.4, 9.8, -2.2], fov: 36}, {f: lights - 2, p: [3.4, 10.8, -7.2], t: [0.4, 9.9, -2.2], fov: 36}] : f < shake ? [{f: 0, p: [5, 11, -11], t: [0, 10, -1], fov: 40}, {f: shake, p: [4, 10.8, -9], t: [0, 10.2, -1], fov: 38}] : [{f: lights - 2, p: [8, 7, 18], t: [0, 18, -24], fov: 48}, {f: d, p: [10, 5, 22], t: [0, 28, -26], fov: 50}]}
			/>
			<Atlanta f={f} lit={lit} />
			<group position={[0, 6, -1]}>
				<Who look={C.ali96.look} h={1} pose={pose} />
				<group position={[h.x, h.y, h.z]} rotation={[0.4, 0, 0]}>
					<Bx s={[0.3, 1.4, 0.3]} p={[0, 0.5, 0]} m={flat('#c8a23a')} />
					<Bx s={[0.5, 0.5, 0.5]} p={[0, 1.3, 0]} r={[f * 0.4, f * 0.3, 0]} m={glow('#ffb040', 4)} cast={false} />
				</group>
			</group>
		</>
	);
};

// ===================== 8  THE EMPTY BIKE RACK =====================
const S17: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam f={f} k={[{f: 0, p: [9, 3.8, 6], t: [2.6, 2.4, -5], fov: 42}, {f: d, p: [7.6, 3.4, 3.6], t: [2.8, 1.9, -4.8], fov: 38}]} />
		<Louisville f={f + 400} bike={false} dusk />
	</>
);

// ---------------- edit ----------------
type Tr = 'cut' | 'fade' | 'whip' | 'zoom' | 'dip' | 'flash';
type ShotDef = {at: number; C: React.FC<ShotProps>; look: CinePreset; tr: Tr};
const SHOTS: ShotDef[] = [
	{at: 0, C: S1, look: 'golden', tr: 'cut'},
	{at: W(0, 2) - 2, C: S2, look: 'golden', tr: 'cut'},
	{at: W(0, 7) - 2, C: S3, look: 'golden', tr: 'cut'},
	{at: W(1, 0) - 2, C: S4, look: 'interior', tr: 'whip'},
	{at: W(1, 9) - 2, C: S5, look: 'interior', tr: 'zoom'},
	{at: W(2, 0) - 2, C: S6, look: 'arena', tr: 'fade'},
	{at: W(2, 9) - 2, C: S7, look: 'arena', tr: 'whip'},
	{at: W(3, 0) - 2, C: S8, look: 'interior', tr: 'flash'},
	{at: W(3, 8) - 2, C: S9, look: 'noon', tr: 'cut'},
	{at: W(4, 0) - 2, C: S10, look: 'interior', tr: 'dip'},
	{at: W(4, 13) - 2, C: S11, look: 'night', tr: 'dip'},
	{at: W(5, 0) - 2, C: S12, look: 'arena', tr: 'whip'},
	{at: W(5, 12) - 2, C: S13, look: 'interior', tr: 'flash'},
	{at: W(6, 0) - 2, C: S14, look: 'night', tr: 'zoom'},
	{at: W(6, 13) - 6, C: S15, look: 'night', tr: 'cut'},
	{at: W(7, 0) - 2, C: S16, look: 'night', tr: 'dip'},
	{at: W(8, 0) - 2, C: S17, look: 'golden', tr: 'fade'},
];
const TLEN: Record<Tr, number> = {cut: 0, fade: 12, whip: 8, zoom: 8, dip: 12, flash: 6};

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
	const to = SHOTS[i + 1]?.at ?? ALI_FRAMES;
	const Comp = def.C;
	return (
		<AbsoluteFill style={layerStyle(i, g)}>
			<ThreeCanvas width={1080} height={1920} shadows="soft" dpr={1}>
				<Comp f={g - def.at} d={to - def.at} o={def.at} />
				<PS1Pass levels={24} />
				<CineGrade preset={def.look} frame={g} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------- sound ----------------
type Cue = {t: number; file: string; vol?: number};
const sw = (l: number, w: number) => W(l, w) / FPS;
const CUES: Cue[] = [
	{t: 0, file: 'bed_ali', vol: 0.38},
	...SHOTS.slice(1).map((s) => ({t: s.at / FPS, file: s.tr === 'whip' ? 'whoosh' : 'swish', vol: s.tr === 'whip' ? 0.2 : 0.07})),
	{t: 0, file: 'ambience', vol: 0.2},
	{t: sw(0, 6) - 0.3, file: 'bell', vol: 0.25},
	{t: sw(0, 15), file: 'hit', vol: 0.3},
	{t: sw(1, 0), file: 'bounce', vol: 0.15},
	{t: sw(1, 9) + 0.1, file: 'laser', vol: 0.35},
	{t: sw(1, 9) + 0.6, file: 'ding', vol: 0.3},
	{t: sw(2, 0), file: 'crowd', vol: 0.3},
	{t: sw(2, 9), file: 'bell', vol: 0.4},
	{t: sw(2, 19), file: 'crowd', vol: 0.45},
	{t: sw(3, 6), file: 'boom', vol: 0.5},
	...[0.2, 0.9, 1.6].map((x) => ({t: sw(3, 0) + x, file: 'shutter', vol: 0.18})),
	{t: sw(3, 19), file: 'tension', vol: 0.3},
	{t: sw(4, 1), file: 'swish', vol: 0.25},
	{t: sw(4, 4) + 0.3, file: 'crunch', vol: 0.3},
	{t: sw(4, 11), file: 'gavel', vol: 0.7},
	...[0, 1, 2, 3, 4, 5].map((k) => ({t: sw(4, 13) + 0.3 + k * 0.45, file: 'hit', vol: 0.12})),
	{t: sw(5, 0), file: 'crowd', vol: 0.4},
	{t: sw(5, 10), file: 'thud', vol: 0.8},
	{t: sw(5, 10) + 0.25, file: 'boom', vol: 0.4},
	{t: sw(5, 19), file: 'gavel', vol: 0.5},
	{t: sw(6, 0), file: 'crowd', vol: 0.5},
	...[0, 0.27, 0.55, 0.9, 1.3, 1.6].map((x) => ({t: sw(6, 6) + x, file: 'hit', vol: 0.35})),
	{t: sw(6, 14) + 0.03, file: 'thud', vol: 0.8},
	{t: sw(6, 16) + 0.3, file: 'boom', vol: 0.55},
	{t: sw(6, 20), file: 'crowd', vol: 0.7},
	{t: sw(7, 0), file: 'crowd', vol: 0.3},
	{t: sw(7, 10) + 0.2, file: 'riser', vol: 0.4},
	{t: sw(7, 13), file: 'firework', vol: 0.4},
	{t: sw(8, 0), file: 'wind', vol: 0.25},
];

export const Ali: React.FC = () => {
	const font = useBlockFont();
	if (!font) return null;
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			{SHOTS.map((s, i) => {
				const start = Math.max(0, s.at - TLEN[s.tr] / 2);
				const next = SHOTS[i + 1];
				const end = next ? next.at + TLEN[next.tr] / 2 : ALI_FRAMES;
				return (
					<Sequence key={i} from={start} durationInFrames={Math.max(1, Math.round(end - start))}>
						<ShotLayer i={i} start={start} />
					</Sequence>
				);
			})}
			<CaptionsFor timing={T} />
			<Audio src={staticFile('vo/ali.wav')} />
			{CUES.map((c, i) => (
				<Sequence key={`a${i}`} from={Math.max(0, Math.round(c.t * FPS))} layout="none">
					<Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol ?? 1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
