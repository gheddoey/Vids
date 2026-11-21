import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useShirts} from '../Lineup';
import {Pose} from '../Character';
import {RBox} from '../parts';
import {useBlockFont} from '../BlockText';
import {Key, onTwos, walk} from '../anim';
import {Actor, Ball, Cam, CaptionsFor, Confetti, PI, handOf, poseAt} from '../lebron/common';
import {P, Person, SHIRTS} from './cast';
import {
	Bedroom,
	Boardroom,
	Cafe,
	Cup,
	DoctorOffice,
	FOOT,
	Kitchen,
	LockerRoom,
	Medal,
	NeighbourhoodPitch,
	Ocean,
	Office,
	Pen,
	Plane,
	Stadium,
	SteelMill,
	TrainingGround,
	TrophyRoom,
} from './sets';
import timing from './timing.json';

const FPS = 30;
const W = 1080;
const H = 1920;
const T = timing as {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};
const sec = (s: number) => Math.round(s * FPS);
export const MESSI_FRAMES = sec(T.duration + 0.4);

type Imgs = Record<string, HTMLImageElement>;
type ShotProps = {f: number; d: number; imgs: Imgs};

const L = (i: number) => T.lines[i];
const word = (i: number, w: number) => L(i).words[w];

// Place a person (scale = their height) with a pose.
const Who: React.FC<{p: Person; imgs: Imgs; pose: Partial<Pose>; at: [number, number, number]}> = ({p, imgs, pose, at}) => (
	<Actor c={p} img={imgs[p.shirt]} pose={pose} at={at} scale={p.h} />
);
const hand = (p: Person, pose: Partial<Pose>, side: 'L' | 'R', at: [number, number, number]) => handOf(pose, side, at, p.h);
const headTop = (p: Person) => p.h * 5.42;

const ARMS_CROSSED = {armLX: -0.9, armRX: -0.9, armLZ: -0.5, armRZ: 0.5};
const SIT = (p: Person, seat: number) => ({y: seat / p.h - 2, legLX: -PI / 2, legRX: -PI / 2});

// ---------------- 1. Hook: the height chart ----------------
const Hook: React.FC<ShotProps> = ({f, d, imgs}) => {
	const kidAt: [number, number, number] = [0, 0, -2.1];
	const marker = interpolate(onTwos(f), [4, 30], [4.7, headTop(P.leo11) + 0.06], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const kid = poseAt([{f: 0, face: 'serious', headX: 0}, {f: 26, headX: -0.25}, {f: 40, headX: 0.15, face: 'serious'}], f);
	const doc = poseAt([{f: 0, rotY: -1.0, armRX: -1.9, armRZ: 0.25, face: 'serious', headY: 0.2}, {f: 36, armRX: 0, armRZ: 0}, {f: 50, headY: -0.3, headX: 0.1}], f, 1);
	const dad = poseAt([{f: 0, rotY: 0.55, face: 'serious', ...ARMS_CROSSED}, {f: 50, headY: 0}, {f: 58, headY: 0.55, ease: 'snap'}], f, 2);
	const mom = poseAt([{f: 0, rotY: 0.2, face: 'serious', armLX: -0.6, armRX: -0.6, armLZ: -0.4, armRZ: 0.4}, {f: 52, headY: 0}, {f: 60, headY: -0.55, ease: 'snap'}], f, 3);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.2, 3.45, 1.4]} p1={[-0.4, 5.0, 15.5]} t0={[0, 3.2, -2.1]} t1={[-0.8, 3.6, -1]} fov={40} />
			<DoctorOffice marker={marker} />
			<Who p={P.leo11} imgs={imgs} pose={kid} at={kidAt} />
			<Who p={P.doctor} imgs={imgs} pose={doc} at={[2.9, 0, -1.9]} />
			<Who p={P.dad} imgs={imgs} pose={dad} at={[-4.6, 0, -0.6]} />
			<Who p={P.mom} imgs={imgs} pose={mom} at={[-3.0, 0, 1.4]} />
		</>
	);
};

// ---------------- 2. The line-up: everyone taller ----------------
const LineUp: React.FC<ShotProps> = ({f, d, imgs}) => {
	const row: [Person, number, Partial<Pose>][] = [
		[P.kidC, -6.5, {...ARMS_CROSSED, face: 'smile'}],
		[P.kidA, -3.9, {armLZ: 0.3, armRZ: -0.3, face: 'grin'}],
		[P.kidE, -1.3, {...ARMS_CROSSED, face: 'serious'}],
		[P.kidB, 1.3, {armRX: -0.4, face: 'grin'}],
		[P.kidD, 3.9, {...ARMS_CROSSED, face: 'smile'}],
	];
	const leo = poseAt([{f: 0, face: 'serious', headX: 0.15, armLX: -0.25, armRX: -0.25}, {f: d - 30, headX: 0.15}, {f: d - 20, headX: -0.25, face: 'smile', ease: 'snap'}], f);
	return (
		<>
			<Cam frame={f} dur={d} p0={[-5.6, 4.6, 15]} p1={[5.6, 3.4, 10.5]} t0={[-5.6, 3.8, 0]} t1={[5.9, 2.8, 0]} fov={40} />
			<NeighbourhoodPitch />
			{row.map(([p, x, base], i) => (
				<Who key={i} p={p} imgs={imgs} pose={poseAt([{f: 0, ...base, headY: x < 0 ? 0.1 : -0.1}], f, i)} at={[x, 0, 0]} />
			))}
			<Who p={P.leo11} imgs={imgs} pose={leo} at={[6.5, 0, 0.2]} />
			<group position={[7.6, 0.3, 1.2]}>
				<Ball r={0.3} />
			</group>
		</>
	);
};

// ---------------- 3. Not enough growth hormone: the bar chart ----------------
const Chart: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam frame={f} dur={d} p0={[1.6, 5.0, 8.2]} p1={[2.6, 4.3, 6.2]} t0={[3.6, 3.2, 0.4]} t1={[3.9, 3.0, 0.6]} fov={36} />
		<DoctorOffice marker={3.4} />
	</>
);

// ---------------- 4. The price of treatment ----------------
const Price: React.FC<ShotProps> = ({f, d, imgs}) => {
	const coins = Math.min(9, Math.floor(onTwos(f) / 6));
	const count = (k: number) => (onTwos(f) % 12 < 6 ? k : -k);
	const mom = poseAt([{f: 0, face: 'serious', armLX: -1.05 + count(0.08), armRX: -0.9, armLZ: -0.2, armRZ: 0.2, headX: 0.45, lean: 0.15}], f, 1);
	const leo = poseAt([{f: 0, rotY: 1.1, face: 'serious', headX: 0.35, armLX: -0.3, armRX: -0.3}], f, 2);
	return (
		<>
			<Cam frame={f} dur={d} p0={[1.4, 5.6, 12.0]} p1={[0.8, 4.9, 9.4]} t0={[-0.2, 3.3, 0.2]} t1={[0, 3.2, 0.4]} fov={40} />
			<Kitchen lamp={1} tag coins={coins} />
			<Who p={P.mom} imgs={imgs} pose={mom} at={[0.6, 0, -1.4]} />
			<Who p={P.leo11} imgs={imgs} pose={leo} at={[-3.3, 0, 1.0]} />
		</>
	);
};

// ---------------- 5. Dad at the steel mill ----------------
const Mill: React.FC<ShotProps> = ({f, d, imgs}) => {
	const dad = poseAt(
		[
			{f: 0, rotY: -0.35, face: 'serious', armRX: -0.2, headX: 0.05},
			{f: 10, armRX: -0.2, armRZ: 0},
			{f: 20, armRX: -2.5, armRZ: 0.75, headX: -0.1, face: 'calm', ease: 'out'},
			{f: 34, armRX: -2.4, armRZ: 0.7},
			{f: 44, armRX: -0.3, armRZ: 0.05, face: 'serious'},
		],
		f,
		1,
	);
	return (
		<>
			<Cam frame={f} dur={d} p0={[2.6, 4.8, 13.5]} p1={[2.0, 5.0, 11.4]} t0={[0.4, 4.2, -1]} t1={[0.6, 4.5, -1]} fov={42} />
			<SteelMill frame={f} />
			<Who p={P.dadWork} imgs={imgs} pose={dad} at={[1.4, 0, 0.8]} />
		</>
	);
};

// ---------------- 6. They couldn't afford it ----------------
const CantAfford: React.FC<ShotProps> = ({f, d, imgs}) => {
	const dad = poseAt([{f: 0, face: 'serious', headX: 0.15, lean: 0.05}, {f: 8, lean: 0.32, headX: 0.5, armLX: -2.05, armRX: -2.05, armLZ: -0.5, armRZ: 0.5, face: 'calm', ease: 'out'}], f, 1);
	const mom = poseAt([{f: 0, rotY: -0.85, face: 'serious', headX: 0.2, armRX: -0.2}, {f: 10, armRX: -1.35, armRZ: 0.15, ease: 'out'}], f, 2);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.4, 5.6, 12.4]} p1={[0.2, 5.3, 11.2]} t0={[-0.4, 3.6, -0.6]} t1={[-0.4, 3.6, -0.6]} fov={40} />
			<Kitchen lamp={0.75} coins={9} />
			<Who p={P.dad} imgs={imgs} pose={dad} at={[-1.5, 0, -1.4]} />
			<Who p={P.mom} imgs={imgs} pose={mom} at={[1.7, 0, -1.2]} />
		</>
	);
};

// ---------------- 7. Every night, the injection ----------------
const Injection: React.FC<ShotProps & {moon?: 'full' | 'half' | 'crescent'; clock?: string; cam?: number}> = ({f, d, imgs, moon = 'crescent', clock = '9:00', cam = 0}) => {
	const at: [number, number, number] = [0.3, 0, 0.75];
	const p = P.leoPj;
	const keys: Key[] = [
		{f: 0, ...SIT(p, 1.72), face: 'serious', lean: 0.1, headX: 0.25, armRX: -0.7, armRZ: 0.25, armLX: -0.4},
		{f: 10, lean: 0.3, headX: 0.5, armRX: -0.35, armRZ: 0.35, ease: 'out'},
		{f: 16, face: 'squint'},
		{f: 30, face: 'squint'},
		{f: 34, face: 'serious', lean: 0.2, armRX: -0.5},
	];
	const pose = poseAt(keys, f);
	const h = hand(p, pose, 'R', at);
	const cams = [
		{p0: [2.4, 3.6, 8.4], p1: [1.6, 3.3, 7.0], t0: [0.2, 3.0, 0.7], t1: [0.2, 3.0, 0.7], fov: 40},
		{p0: [-3.6, 3.0, 6.0], p1: [-3.2, 2.9, 5.4], t0: [0.3, 2.9, 0.7], t1: [0.3, 2.9, 0.7], fov: 36},
		{p0: [3.8, 2.4, 5.0], p1: [3.4, 2.4, 4.6], t0: [0.3, 2.8, 0.7], t1: [0.3, 2.8, 0.7], fov: 34},
		{p0: [0.4, 4.6, 7.0], p1: [0.4, 4.3, 6.2], t0: [0.3, 2.9, 0.7], t1: [0.3, 2.9, 0.7], fov: 38},
	][cam];
	return (
		<>
			<Cam frame={f} dur={d} {...cams} />
			<Bedroom moon={moon} clock={clock} />
			<Who p={p} imgs={imgs} pose={pose} at={at} />
			<group position={[h.x, h.y - 0.15, h.z + 0.1]} rotation={[0.3, 0, 0.2]} scale={0.8}>
				<Pen />
			</group>
		</>
	);
};

// ---------------- 9a. His club stopped paying ----------------
const ClubOffice: React.FC<ShotProps> = ({f, d, imgs}) => {
	const mgr = poseAt(
		[
			{f: 0, face: 'serious', armLX: -1.0, armRX: -1.0, armLZ: -0.2, armRZ: 0.2, lean: 0.15},
			{f: 10, armLX: -1.2, armLZ: -0.5, ease: 'out'},
			{f: 16, armLX: -1.0, armLZ: -0.2, ease: 'snap'},
			{f: 22, headY: 0},
			{f: 28, headY: 0.35},
			{f: 34, headY: -0.35},
			{f: 40, headY: 0.2},
			{f: 46, headY: 0},
		],
		f,
		1,
	);
	return (
		<>
			<Cam frame={f} dur={d} p0={[1.2, 6.0, 13.0]} p1={[0.9, 5.6, 11.0]} t0={[0, 3.8, -1]} t1={[0, 3.9, -1]} fov={42} />
			<Office />
			<Who p={P.manager} imgs={imgs} pose={mgr} at={[0, 0, -2.4]} />
			<Who p={P.dad} imgs={imgs} pose={poseAt([{f: 0, rotY: PI + 0.15, face: 'serious', headX: 0.1}], f, 2)} at={[-2.0, 0, 2.6]} />
			<Who p={P.leo11} imgs={imgs} pose={poseAt([{f: 0, rotY: PI - 0.2, face: 'serious', headX: -0.1}], f, 3)} at={[0.6, 0, 2.4]} />
		</>
	);
};

// ---------------- 9b. The big clubs wouldn't take the risk ----------------
const Scouts: React.FC<ShotProps> = ({f, d, imgs}) => {
	const turn = Math.round(d * 0.5);
	const scout = (p: Person, x: number, ph: number, delay: number, z: number) => (
		<Who
			p={p}
			imgs={imgs}
			pose={poseAt(
				[
					{f: 0, rotY: 0, ...ARMS_CROSSED},
					{f: 4 + delay, headY: 0},
					{f: 9 + delay, headY: 0.35},
					{f: 14 + delay, headY: -0.35},
					{f: 19 + delay, headY: 0},
					{f: turn + delay, rotY: 0},
					{f: turn + delay + 10, rotY: PI, ease: 'inOut'},
				],
				f,
				ph,
			)}
			at={[x, 0, z]}
		/>
	);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 5.2, 19]} p1={[0, 5.0, 16.5]} t0={[0, 4.4, 0]} t1={[0, 4.4, 0]} fov={44} />
			<Boardroom />
			{scout(P.scout1, -2.7, 1, 0, 0.0)}
			{scout(P.scout3, 2.7, 3, 6, 0.0)}
			{scout(P.scout2, 0, 2, 3, 2.4)}
		</>
	);
};

// ---------------- 10a. Across the ocean ----------------
const Flight: React.FC<ShotProps> = ({f, d}) => {
	const x = interpolate(f, [0, d], [-11, 9]);
	return (
		<>
			<Cam frame={f} dur={d} p0={[-3, 7, 34]} p1={[3, 6.6, 34]} t0={[-3, 3.0, 0]} t1={[3, 3.2, 0]} fov={42} />
			<Ocean frame={f} />
			<group position={[x, 4 + Math.sin(f * 0.08) * 0.2, 0]} rotation={[0.12, 0, 0.05]}>
				<Plane />
			</group>
		</>
	);
};

// ---------------- 10b. Arrival at the academy ----------------
const Arrival: React.FC<ShotProps> = ({f, d, imgs}) => {
	const leoK: Key[] = [{f: 0, face: 'smile', headX: -0.2}, ...walk(0, d, [-1.6 / 0.7, -8.5 / 0.7], [-1.6 / 0.7, -3.5 / 0.7], 8), {f: 10, headY: 0.4}, {f: 26, headY: -0.4}, {f: 42, headY: 0}];
	const dadK: Key[] = [{f: 0, face: 'smile'}, ...walk(0, d, [1.0 / 1.08, -9.0 / 1.08], [1.0 / 1.08, -4.0 / 1.08], 10, false), {f: 0, armLX: -0.2}];
	const leo = poseAt(leoK, f, 1);
	const lx = (leo.x ?? 0) * 0.7;
	const lz = (leo.z ?? 0) * 0.7;
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.6, 4.6, 11.5]} p1={[0.4, 4.2, 9.6]} t0={[0, 3.4, -5]} t1={[0, 3.2, -3]} fov={46} />
			<TrainingGround gate />
			<Who p={P.leo13} imgs={imgs} pose={leo} at={[0, 0, 0]} />
			<RBox size={[1.2, 1.4, 0.6]} pos={[lx, 3.0 * 0.7 + (leo.y ?? 0) * 0.7, lz - 0.6]} color="#c8102e" />
			<Who p={P.dad} imgs={imgs} pose={poseAt(dadK, f, 2)} at={[0, 0, 0]} />
		</>
	);
};

// ---------------- 11a. Leo dribbles through the trialists ----------------
const Dribble: React.FC<ShotProps> = ({f, d, imgs}) => {
	const p = P.leoBib;
	const k: Key[] = [{f: 0, rotY: PI / 2, face: 'serious', lean: 0.25}, ...walk(0, d, [-7 / p.h, 0], [7 / p.h, 0], 6)];
	const leo = poseAt(k, f);
	const lx = (leo.x ?? 0) * p.h;
	const ball = new THREE.Vector3(lx + 0.8, 0.3 + Math.abs(Math.sin(onTwos(f) * 0.5)) * 0.25, 0.3);
	const teen = (q: Person, x: number, z: number, ph: number) => {
		const passed = lx > x - 0.6;
		return (
			<Who
				p={q}
				imgs={imgs}
				pose={poseAt([{f: 0, rotY: -PI / 2, face: passed ? 'shock' : 'serious', lean: passed ? 0.6 : 0.2, side: passed ? (z > 0 ? 0.3 : -0.3) : 0, legLX: passed ? -0.5 : 0, armLZ: 0.5, armRZ: -0.5}], f, ph)}
				at={[x, 0, z]}
			/>
		);
	};
	return (
		<>
			<Cam frame={f} dur={d} p0={[-4, 5.4, 19]} p1={[4, 5.2, 19]} t0={[-3.5, 2.6, 0]} t1={[3.5, 2.6, 0]} fov={40} />
			<TrainingGround />
			{teen(P.teenA, -3, 1.2, 1)}
			{teen(P.teenB, 0.5, -1.2, 2)}
			{teen(P.teenC, 3.8, 1.0, 3)}
			<Who p={p} imgs={imgs} pose={leo} at={[0, 0, 0.3]} />
			<group position={ball}>
				<Ball r={0.3} />
			</group>
		</>
	);
};

// ---------------- 11b. The coaches' jaws drop ----------------
const Coaches: React.FC<ShotProps> = ({f, d, imgs}) => {
	const react = (ph: number, extra: Partial<Pose>) =>
		poseAt([{f: 0, face: 'serious', ...ARMS_CROSSED, ...extra}, {f: 8, face: 'serious'}, {f: 10, face: 'shock', armLX: 0, armRX: 0, armLZ: 0.25, armRZ: -0.25, headX: -0.1, ease: 'snap'}], f, ph);
	const old = poseAt(
		[
			{f: 0, face: 'serious', ...ARMS_CROSSED, rotY: 0.2},
			{f: 10, face: 'shock', armLX: 0, armRX: 0, armLZ: 0.2, armRZ: -0.2, ease: 'snap'},
			{f: d - 30, face: 'shock'},
			{f: d - 22, face: 'smile', armRX: -1.2, armRZ: 0.2, ease: 'back'},
		],
		f,
		1,
	);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.4, 5.2, 13.5]} p1={[0.3, 5.1, 11.5]} t0={[0, 4.4, 0]} t1={[0, 4.5, 0]} fov={42} />
			<TrainingGround />
			<Who p={P.coachOld} imgs={imgs} pose={old} at={[-1.9, 0, 0]} />
			<Who p={P.coachAsst} imgs={imgs} pose={react(2, {rotY: -0.25})} at={[2.0, 0, -0.4]} />
		</>
	);
};

// ---------------- 12. Signed on a napkin ----------------
const Napkin: React.FC<ShotProps> = ({f, d, imgs}) => {
	const shake = Math.round(d * 0.55);
	const coach = poseAt(
		[
			{f: 0, rotY: PI / 2, face: 'smile', lean: 0.35, armRX: -0.9, armRZ: 0.25, headX: 0.35},
			{f: 4, armRX: -0.8},
			{f: 8, armRX: -0.95},
			{f: 12, armRX: -0.8},
			{f: shake - 8, lean: 0.35, armRX: -0.9, headX: 0.3},
			{f: shake, lean: 0.1, armRX: -1.5, armRZ: 0, headX: 0, ease: 'out'},
		],
		f,
		1,
	);
	const dad = poseAt([{f: 0, rotY: -PI / 2, face: 'serious', headX: 0.3}, {f: shake - 8, armRX: 0}, {f: shake, armRX: -1.5, armRZ: 0, face: 'smile', headX: 0, ease: 'out'}], f, 2);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.4, 4.1, 2.9]} p1={[0.6, 5.0, 9.0]} t0={[0, 2.4, 0.55]} t1={[0, 3.4, 0]} fov={42} />
			<Cafe signed={f > 12} />
			<Who p={P.coachOld} imgs={imgs} pose={coach} at={[-2.5, 0, 0.3]} />
			<Who p={P.dad} imgs={imgs} pose={dad} at={[2.6, 0, 0.3]} />
			<Who p={P.leo13} imgs={imgs} pose={poseAt([{f: 0, rotY: -0.9, face: 'smile', headY: -0.3}], f, 3)} at={[3.9, 0, 2.2]} />
			<Who p={P.waiter} imgs={imgs} pose={poseAt([{f: 0, rotY: 0.3, face: 'smile', armLX: -1.2, armLZ: 0.2}], f, 4)} at={[-4.2, 0, -2.4]} />
		</>
	);
};

// ---------------- 13. Seventeen, under the lights ----------------
const BigClub: React.FC<ShotProps> = ({f, d, imgs}) => {
	const p = P.leo17;
	const run = Math.round(d * 0.6);
	const k: Key[] = [{f: 0, rotY: 0, face: 'serious', lean: 0.2}, ...walk(0, run, [0, -14 / p.h], [0, -2.5 / p.h], 6), {f: run, armLZ: 0, armRZ: 0, face: 'serious'}, {f: run + 8, armLZ: 1.35, armRZ: -1.35, face: 'grin', lean: -0.1, headX: -0.2, ease: 'back'}];
	const leo = poseAt(k, f);
	const lz = (leo.z ?? 0) * p.h;
	const ball = f < run ? new THREE.Vector3(0.5, 0.3 + Math.abs(Math.sin(onTwos(f) * 0.5)) * 0.2, lz + 0.9) : new THREE.Vector3(0.5, 0.3, -2.5 + 0.9);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.6, 3.4, 11.5]} p1={[0.4, 3.8, 9.0]} t0={[0, 3.2, -6]} t1={[0, 3.6, -2]} fov={48} />
			<Stadium mode="club" frame={f} />
			<Who p={p} imgs={imgs} pose={leo} at={[0, 0, 0]} />
			<group position={ball}>
				<Ball r={0.32} />
			</group>
		</>
	);
};

// ---------------- 14. Heartbreak in the rain ----------------
const Rain: React.FC<ShotProps> = ({f, d, imgs}) => (
	<>
		<Cam frame={f} dur={d} p0={[0.4, 4.6, 13]} p1={[0.2, 4.6, 10.5]} t0={[0, 3.8, 0]} t1={[0, 4.1, 0]} fov={42} />
		<Stadium mode="rain" frame={f} />
		<Who p={P.messiLong} imgs={imgs} pose={poseAt([{f: 0, face: 'calm', headX: 0.45, lean: 0.1, armLX: 0.1, armRX: 0.1}], f)} at={[0, 0, 0]} />
	</>
);

// ---------------- 15. Walking past the World Cup ----------------
const WalkPast: React.FC<ShotProps> = ({f, d, imgs}) => {
	const p = P.messiLong;
	const k: Key[] = [{f: 0, rotY: -PI / 2, face: 'calm', headX: 0.35}, ...walk(0, d, [5.5 / p.h, 1.8 / p.h], [-5.5 / p.h, 1.8 / p.h], 10)];
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.8, 4.0, 16]} p1={[-0.6, 4.0, 15]} t0={[0, 3.0, 0]} t1={[0, 3.0, 0]} fov={42} />
			<Stadium mode="sad" frame={f} spot />
			<RBox size={[1.8, 2.2, 1.8]} pos={[0, 1.1, -0.4]} color="#1a1c22" />
			<group position={[0, 2.2, -0.4]} scale={1.15}>
				<Cup shine={0.4} />
			</group>
			<Who p={p} imgs={imgs} pose={poseAt(k, f)} at={[0, 0, 0]} />
		</>
	);
};

// ---------------- 16. Two more finals ----------------
const Finals: React.FC<ShotProps> = ({f, d, imgs}) => {
	const m = P.messiLong;
	const swing = (ph: number, delay: number) => Math.sin((f - delay) * 0.18 + ph) * Math.max(0, 0.6 - (f - delay) * 0.01) * (f > delay ? 1 : 0);
	const drop = (delay: number) => interpolate(f, [delay, delay + 8], [3, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<>
			<Cam frame={f} dur={d} p0={[1.0, 3.8, 11.0]} p1={[0.8, 3.6, 9.8]} t0={[0.4, 2.4, 0]} t1={[0.4, 2.4, 0]} fov={44} />
			<Stadium mode="sad" frame={f} />
			<Who p={m} imgs={imgs} pose={poseAt([{f: 0, ...SIT(m, 0), lean: 0.55, headX: 0.5, armLX: -2.3, armRX: -2.3, armLZ: -0.45, armRZ: 0.45, face: 'calm'}], f)} at={[0, 0, 0]} />
			<Who p={P.mate11} imgs={imgs} pose={poseAt([{f: 0, rotY: -0.9, face: 'serious', lean: 0.45, armLX: -1.3, armLZ: -0.2, headX: 0.3, ...SIT(P.mate11, 0.9)}], f, 2)} at={[2.1, 0, -0.6]} />
			{/* Two silver medals swing into the foreground */}
			<group position={[-1.4, 4.6 + drop(4), 3.2]} rotation={[0, 0, swing(0, 4)]}>
				<group position={[0, -1.2, 0]}>
					<Medal />
				</group>
			</group>
			<group position={[1.3, 5.0 + drop(14), 2.8]} rotation={[0, 0, swing(1.5, 14)]}>
				<group position={[0, -1.2, 0]}>
					<Medal />
				</group>
			</group>
		</>
	);
};

// ---------------- 17. Three years in a row ----------------
const Medals: React.FC<ShotProps> = ({f, d}) => {
	const n = f < 8 ? 1 : f < 18 ? 2 : 3;
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 7.6, 14.5]} p1={[0, 7.5, 13.0]} t0={[0, 7.4, -1.7]} t1={[0, 7.4, -1.7]} fov={44} />
			<LockerRoom light={0.75} door={0} shirt={false} medals={n} />
		</>
	);
};

// ---------------- 18/19. Quits, then comes back ----------------
const Quit: React.FC<ShotProps> = ({f, d, imgs}) => {
	const p = P.messiLong;
	const hang = 12;
	const k: Key[] = [
		{f: 0, rotY: PI, face: 'calm', headX: 0.2, armRX: -1.5, armLX: -1.5},
		{f: hang, armRX: -2.0, armLX: -2.0},
		{f: hang + 4, armRX: 0, armLX: 0, rotY: PI},
		{f: hang + 10, rotY: PI / 2},
		...walk(hang + 10, d, [3.6 / p.h, -0.4 / p.h], [7.5 / p.h, 0.4 / p.h], 9),
	];
	const light = interpolate(f, [d - 8, d - 4], [1, 0.12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<>
			<Cam frame={f} dur={d} p0={[-1.6, 5.2, 13.5]} p1={[-1.2, 5.0, 12.2]} t0={[2.4, 4.0, -1]} t1={[2.8, 4.0, -1]} fov={44} />
			<LockerRoom light={light} door={0} shirt={f >= hang} />
			<Who p={p} imgs={imgs} pose={poseAt([{f: 0, x: 3.6 / p.h, z: -0.4 / p.h}, ...k], f)} at={[0, 0, 0]} />
		</>
	);
};

const Return: React.FC<ShotProps> = ({f, d, imgs}) => {
	const p = P.messiLong;
	const door = interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
	const k: Key[] = [
		{f: 0, rotY: -PI / 2, face: 'serious'},
		...walk(4, 22, [8.4 / p.h, 0.6 / p.h], [4.2 / p.h, -0.3 / p.h], 8),
		{f: 22, rotY: -PI / 2},
		{f: 28, rotY: PI, armRX: -0.2},
		{f: 34, armRX: -2.2, armRZ: 0.1, ease: 'back'},
	];
	return (
		<>
			<Cam frame={f} dur={d} p0={[-1.0, 5.0, 13]} p1={[-0.4, 5.0, 11.8]} t0={[3.2, 4.0, -1]} t1={[3.4, 4.2, -1]} fov={44} />
			<LockerRoom light={0.25} door={door} shirt={f < d - 2} />
			<Who p={p} imgs={imgs} pose={poseAt(k, f)} at={[0, 0, 0]} />
		</>
	);
};

// ---------------- 20. Thirty-five: he lifts the World Cup ----------------
const Lift: React.FC<ShotProps> = ({f, d, imgs}) => {
	const m = P.messiRobe;
	const pose = poseAt(
		[
			{f: 0, face: 'smile', armLX: -1.1, armRX: -1.1, armLZ: -0.3, armRZ: 0.3},
			{f: 10, face: 'grin', armLX: -2.95, armRX: -2.95, armLZ: -0.12, armRZ: 0.12, headX: -0.25, y: 0.1, ease: 'back'},
		],
		f,
	);
	const cupAt = hand(m, pose, 'L', [0, 0, 0]).add(hand(m, pose, 'R', [0, 0, 0])).multiplyScalar(0.5);
	const jumper = (p: Person, x: number, z: number, ph: number) => (
		<Who
			p={p}
			imgs={imgs}
			pose={poseAt([{f: 0, rotY: x > 0 ? -0.4 : 0.4, face: 'grin', armLX: -2.7, armRX: -2.7, armLZ: 0.3, armRZ: -0.3, y: Math.abs(Math.sin(onTwos(f) * 0.25 + ph)) * 0.9}], f, ph)}
			at={[x, 0, z]}
		/>
	);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 3.0, 15.5]} p1={[0, 2.9, 13.6]} t0={[0, 6.0, 0]} t1={[0, 6.2, 0]} fov={50} shake={{at: 10, amp: 0.14, len: 8}} />
			<Stadium mode="final" frame={f} />
			{jumper(P.mate7, -3.4, -0.6, 0.5)}
			{jumper(P.mate11, 3.5, -0.4, 1.7)}
			{jumper(P.mate23, -1.6, -3.0, 2.6)}
			<Who p={m} imgs={imgs} pose={pose} at={[0, 0, 0]} />
			<group position={[cupAt.x, cupAt.y - 0.2, cupAt.z]} scale={0.9}>
				<Cup shine={0.3} />
			</group>
			<Confetti frame={f + 30} cols={['#ffd84a', '#ffffff', '#7cc3ee', '#ffb81c']} n={110} />
		</>
	);
};

// ---------------- 21. Eight Ballon d'Ors ----------------
const Trophies: React.FC<ShotProps & {beatF: number}> = ({f, d, imgs, beatF}) => {
	const count = Math.min(8, Math.max(0, Math.floor((onTwos(f) - 2) / Math.max(2, beatF / 8)) + 1));
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.4, 7.0, 23]} p1={[0.8, 6.4, 19.5]} t0={[0.6, 4.8, -0.5]} t1={[0.9, 4.6, -0.5]} fov={44} />
			<TrophyRoom count={count} />
			<Who p={P.messi} imgs={imgs} pose={poseAt([{f: 0, rotY: -0.35, face: 'smile', ...ARMS_CROSSED}, {f: beatF + 6, face: 'smug'}], f)} at={[3.6, 0, 2.8]} />
		</>
	);
};

// ---------------- 22/23/24. The callback, the reveal, five foot seven ----------------
const KidAgain: React.FC<ShotProps> = ({f, d, imgs}) => (
	<>
		<Cam frame={f} dur={d} p0={[0.2, 3.6, 3.6]} p1={[0.1, 3.5, 3.0]} t0={[0, 3.1, -2.1]} t1={[0, 3.1, -2.1]} fov={40} />
		<DoctorOffice marker={headTop(P.leo11) + 0.06} />
		<Who p={P.leo11} imgs={imgs} pose={poseAt([{f: 0, face: 'serious', headX: 0.3}, {f: 10, headX: 0.3}, {f: 18, headX: 0, ease: 'snap'}], f)} at={[0, 0, -2.1]} />
	</>
);

const Reveal: React.FC<ShotProps & {nameF: number}> = ({f, d, imgs, nameF}) => {
	if (f < nameF) return <KidAgain f={f + 30} d={d + 30} imgs={imgs} />;
	const g = f - nameF;
	const marker = interpolate(onTwos(g), [0, 12], [headTop(P.leo11) + 0.06, (5 + 7 / 12) * FOOT + 0.06], {extrapolateRight: 'clamp'});
	return (
		<>
			<Cam frame={g} dur={d - nameF} p0={[0.25, 4.85, 4.6]} p1={[0.2, 4.8, 3.9]} t0={[0, 4.3, -2.1]} t1={[0, 4.35, -2.1]} fov={40} shake={{at: 0, amp: 0.1, len: 8}} />
			<DoctorOffice marker={marker} warm={0.4} />
			<Who p={P.messi} imgs={imgs} pose={poseAt([{f: 0, face: 'serious', headX: 0.1}, {f: 8, face: 'smile', headX: 0, ease: 'snap'}], g)} at={[0, 0, -2.1]} />
		</>
	);
};

const FiveSeven: React.FC<ShotProps> = ({f, d, imgs}) => {
	const juggle = f > 30;
	const pose = poseAt(
		[
			{f: 0, face: 'smile', armLZ: 0, armRZ: 0},
			{f: 8, armLZ: 0.55, armRZ: -0.55, headZ: 0.15, face: 'grin', ease: 'back'},
			{f: 22, armLZ: 0.55, armRZ: -0.55, headZ: 0.15},
			{f: 30, armLZ: 0.1, armRZ: -0.1, headZ: 0, face: 'smile'},
		],
		f,
	);
	const kickPhase = juggle ? Math.abs(Math.sin((onTwos(f) - 30) * 0.32)) : 0;
	const legPose = juggle ? {...pose, legRX: -0.6 * kickPhase} : pose;
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.4, 4.8, 9.5]} p1={[0.6, 5.0, 14.5]} t0={[0, 4.0, -2.1]} t1={[0.2, 3.7, -1]} fov={44} />
			<DoctorOffice marker={(5 + 7 / 12) * FOOT + 0.06} warm={0.4} />
			<Who p={P.messi} imgs={imgs} pose={legPose} at={[0, 0, -2.1]} />
			<Who p={P.doctor} imgs={imgs} pose={poseAt([{f: 0, rotY: -0.7, face: 'smile', headX: 0.15, headY: -0.3}], f, 1)} at={[2.3, 0, -1.4]} />
			<Who p={P.dad} imgs={imgs} pose={poseAt([{f: 0, rotY: 0.6, face: 'smile', ...ARMS_CROSSED}], f, 2)} at={[-2.6, 0, -0.8]} />
			{juggle ? (
				<group position={[-0.5, 0.9 + kickPhase * 1.6, -1.2]}>
					<Ball r={0.3} />
				</group>
			) : null}
		</>
	);
};

// ---------------- Edit ----------------

const cut = (t: number) => Math.max(0, sec(t) - 2);
type ShotDef = {from: number; C: React.FC<any>; props?: (from: number) => Record<string, unknown>};

const SHOTS: ShotDef[] = [
	{from: 0, C: Hook},
	{from: cut(L(1).s), C: LineUp},
	{from: cut(L(2).s), C: Chart},
	{from: cut(L(3).s), C: Price},
	{from: cut(L(4).s), C: Mill},
	{from: cut(L(5).s), C: CantAfford},
	{from: cut(L(6).s), C: Injection, props: () => ({moon: 'crescent', clock: 'MON', cam: 0})},
	{from: cut(word(7, 0).s), C: Injection, props: () => ({moon: 'full', clock: 'TUE', cam: 1})},
	{from: cut(word(7, 1).s), C: Injection, props: () => ({moon: 'half', clock: 'WED', cam: 2})},
	{from: cut(word(7, 2).s), C: Injection, props: () => ({moon: 'crescent', clock: 'THU', cam: 3})},
	{from: cut(L(8).s), C: ClubOffice},
	{from: cut(word(8, 4).s), C: Scouts},
	{from: cut(L(9).s), C: Flight},
	{from: cut(word(9, 7).s), C: Arrival},
	{from: cut(L(10).s), C: Dribble},
	{from: cut(word(10, 5).s), C: Coaches},
	{from: cut(L(11).s), C: Napkin},
	{from: cut(L(12).s), C: BigClub},
	{from: cut(L(13).s), C: Rain},
	{from: cut(L(14).s), C: WalkPast},
	{from: cut(L(15).s), C: Finals},
	{from: cut(L(16).s), C: Medals},
	{from: cut(L(17).s), C: Quit},
	{from: cut(L(18).s), C: Return},
	{from: cut(L(19).s), C: Lift},
	{from: cut(L(20).s), C: Trophies, props: (from) => ({beatF: sec(word(20, 2).e) - from})},
	{from: cut(L(21).s), C: KidAgain},
	{from: cut(L(22).s), C: Reveal, props: (from) => ({nameF: sec(word(22, 3).s) - from})},
	{from: cut(L(23).s), C: FiveSeven},
];

const ShotCanvas: React.FC<{def: ShotDef; dur: number; imgs: Imgs}> = ({def, dur, imgs}) => {
	const f = useCurrentFrame();
	const C = def.C;
	return (
		<ThreeCanvas width={W} height={H} shadows>
			<C f={f} d={dur} imgs={imgs} {...(def.props ? def.props(def.from) : {})} />
		</ThreeCanvas>
	);
};

// ---------------- Sound ----------------

type Cue = {t: number; file: string; vol?: number};
const at = (i: number, dt = 0) => L(i).s + dt;
const CUES: Cue[] = [
	{t: 0, file: 'bed_messi', vol: 0.3},
	...SHOTS.slice(1).map((s) => ({t: s.from / FPS, file: 'swish', vol: 0.1})),
	...[0.1, 0.6, 1.1, 1.6, 2.1, 2.6].map((x) => ({t: x, file: 'tick', vol: 0.35})),
	{t: at(1, 0.1), file: 'crowd', vol: 0.12},
	{t: at(1, 0.3), file: 'whistle', vol: 0.25},
	{t: at(2, 0.2), file: 'ding', vol: 0.18},
	...[0.2, 0.6, 1.0, 1.4, 1.8, 2.2].map((x) => ({t: at(3, x), file: 'coins', vol: 0.25})),
	{t: at(4, 0.0), file: 'clang', vol: 0.45},
	{t: at(4, 0.7), file: 'clang', vol: 0.3},
	{t: at(5, 0.25), file: 'thud', vol: 0.4},
	{t: at(6, 0), file: 'crickets', vol: 0.35},
	{t: at(6, 0.4), file: 'click', vol: 0.5},
	...[0, 1, 2].map((i) => ({t: word(7, i).s, file: 'click', vol: 0.6})),
	{t: at(8, 0.5), file: 'thud', vol: 0.45},
	{t: word(8, 4).s + 0.7, file: 'whoosh', vol: 0.25},
	{t: at(9, 0), file: 'engine', vol: 0.4},
	{t: word(9, 7).s, file: 'ambience', vol: 0.3},
	...[0.2, 0.5, 0.8, 1.1, 1.4].map((x) => ({t: at(10, x), file: 'kick', vol: 0.4})),
	{t: at(10, 0.05), file: 'whistle', vol: 0.3},
	{t: word(10, 5).s + 0.3, file: 'notice', vol: 0.35},
	{t: at(11, 0.2), file: 'scribble', vol: 0.5},
	{t: at(11, 1.2), file: 'glass', vol: 0.35},
	{t: at(12, 0), file: 'crowd', vol: 0.5},
	{t: at(12, 2.2), file: 'crowd', vol: 0.45},
	{t: at(13, 0), file: 'rain', vol: 0.45},
	{t: at(13, 0), file: 'tension', vol: 0.3},
	{t: at(14, 0.3), file: 'hit', vol: 0.45},
	{t: at(15, 0.2), file: 'hit', vol: 0.35},
	{t: at(15, 0.55), file: 'hit', vol: 0.35},
	...[0, 0.3, 0.6].map((x) => ({t: at(16, x + 0.05), file: 'glass', vol: 0.4})),
	{t: at(17, 0.4), file: 'clang', vol: 0.35},
	{t: at(17, 1.1), file: 'click', vol: 0.5},
	{t: at(18, -0.4), file: 'riser', vol: 0.35},
	{t: at(18, 0.05), file: 'thud', vol: 0.35},
	{t: at(19, 0.25), file: 'firework', vol: 0.5},
	{t: at(19, 0.3), file: 'crowd', vol: 0.6},
	{t: at(19, 1.4), file: 'firework', vol: 0.4},
	...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({t: at(20, 0.05 + i * 0.13), file: 'ding', vol: 0.3})),
	{t: word(22, 3).s, file: 'boom', vol: 0.75},
	...[1.1, 1.45, 1.8, 2.15].map((x) => ({t: at(23, x), file: 'kick', vol: 0.3})),
];

export const MessiShort: React.FC = () => {
	const imgs = useShirts(SHIRTS) as Imgs | null;
	// Load the 3D font before any scene mounts, so block text is there on the first frame.
	const font = useBlockFont();
	if (!imgs || !font) return null;
	return (
		<AbsoluteFill style={{backgroundColor: '#000', filter: 'saturate(1.06) contrast(1.05)'}}>
			{SHOTS.map((s, i) => {
				const to = SHOTS[i + 1]?.from ?? MESSI_FRAMES;
				return (
					<Sequence key={i} from={s.from} durationInFrames={to - s.from}>
						<ShotCanvas def={s} dur={to - s.from} imgs={imgs} />
					</Sequence>
				);
			})}
			<CaptionsFor timing={T} />
			<Audio src={staticFile('vo/messi.wav')} />
			{CUES.map((c, i) => (
				<Sequence key={`a${i}`} from={Math.max(0, Math.round(c.t * FPS))} layout="none">
					<Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol ?? 1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
