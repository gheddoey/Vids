import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useShirts} from '../Lineup';
import {Pose} from '../Character';
import {RBox} from '../parts';
import {BlockText, useBlockFont} from '../BlockText';
import {Key, onTwos, walk} from '../anim';
import {Actor, Cam, CaptionsFor, Confetti, handOf, poseAt} from '../lebron/common';
import {P, Person, SHIRTS} from './cast';
import {Boardroom, Chamber, City3D, Dawn, DioCar, DioRoomLights, Diorama, Dundee, LaunchNight, Loft, Newsstand, PubOffice, Shop97, Studio, ViceCoast, Void, WestCoast} from './sets';
import {Car, Critter, FlipCounter, GameBox, GlitchBurst, Glow, Mug, Puffs, Sparks, Sticky} from './props';
import {LogoBlock} from './Logo';
import timing from './timing.json';

const FPS = 30;
const W = 1080;
const H = 1920;
const PI = Math.PI;
const T = timing as {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};
const sec = (s: number) => Math.round(s * FPS);
export const GTA_FRAMES = sec(T.duration + 0.4);

type Imgs = Record<string, HTMLImageElement>;
type ShotProps = {f: number; d: number; imgs: Imgs; [k: string]: unknown};
const L = (i: number) => T.lines[i];
const word = (i: number, w: number) => L(i).words[w];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ramp = (f: number, a: number, b: number) => clamp01((f - a) / Math.max(1, b - a));
const ease = (t: number) => Easing.inOut(Easing.cubic)(clamp01(t));
const easeOut = (t: number) => Easing.out(Easing.cubic)(clamp01(t));

const Who: React.FC<{p: Person; imgs: Imgs; pose: Partial<Pose>; at: [number, number, number]}> = ({p, imgs, pose, at}) => <Actor c={p} img={imgs[p.shirt]} pose={pose} at={at} scale={p.h} />;
const SIT = (p: Person, seat: number) => ({y: seat / p.h - 2, legLX: -PI / 2, legRX: -PI / 2});

// ---------- New move library for this video ----------
// Typing: forearms forward, hands alternate on twos.
const typing = (f: number, k = 1): Partial<Pose> => {
	const a = Math.floor(onTwos(f) / 2) % 2 ? 0.12 : -0.12;
	return {armLX: -1.25 + a * k, armRX: -1.25 - a * k, armLZ: -0.12, armRZ: 0.12, lean: 0.18, headX: 0.18};
};
// Belly laugh: head thrown back, shoulders bounce.
const laugh = (f: number, ph = 0): Partial<Pose> => {
	const b = Math.sin(onTwos(f) * 0.9 + ph);
	return {lean: -0.25 + b * 0.06, headX: -0.4 + b * 0.08, armLX: -0.5, armRX: -0.5, armLZ: -0.5 + b * 0.1, armRZ: 0.5 - b * 0.1, face: 'grin'};
};
// Doubled over laughing, slapping knee.
const doubleOver = (f: number, ph = 0): Partial<Pose> => {
	const b = Math.sin(onTwos(f) * 1.1 + ph);
	return {lean: 0.55 + b * 0.06, headX: -0.3, armRX: -0.6 + b * 0.35, armLX: -0.2, face: 'grin'};
};
const yawn = (f: number): Partial<Pose> => ({headX: -0.35, armLX: -2.6, armRX: -2.6, armLZ: -0.3, armRZ: 0.3, lean: -0.1, face: 'shock'});
const paperShake = (f: number): Partial<Pose> => {
	const b = Math.floor(onTwos(f) / 2) % 2 ? 0.08 : -0.08;
	return {armLX: -1.35 + b, armRX: -1.35 - b, armLZ: -0.3, armRZ: 0.3, headX: 0.1};
};
const pound = (f: number, every = 10): Partial<Pose> => {
	const ph = (onTwos(f) % every) / every;
	const down = ph < 0.4 ? -2.2 + ph * 3.6 : -0.8 - (ph - 0.4) * 2.3;
	return {armRX: down, armRZ: 0.1, lean: 0.12, face: 'shock'};
};

// ---------- Diorama car tracks ----------
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// =========================================================
// SHOTS
// =========================================================

// 0a. Hook: top-down diorama, a cop car rams the player car.
const HookTop: React.FC<ShotProps> = ({f, d}) => {
	const hit = 30;
	const t = f / hit;
	const pAfter = ramp(f, hit, hit + 18);
	const player: DioCar = f < hit ? {kind: 'player', x: lerp(-10, 0.2, t), z: 0.45, rot: 0} : {kind: 'player', x: lerp(0.2, 2.8, easeOut(pAfter)), z: lerp(0.45, 2.1, easeOut(pAfter)), rot: -easeOut(pAfter) * 2.2, roll: Math.sin(pAfter * PI) * 0.4};
	const cop: DioCar = f < hit ? {kind: 'cop', x: -0.45, z: lerp(-10, -0.9, t), rot: -PI / 2, siren: Math.floor(f / 3) % 2} : {kind: 'cop', x: lerp(-0.45, 0.6, easeOut(pAfter)), z: lerp(-0.9, 0.2, easeOut(pAfter)), rot: -PI / 2 + easeOut(pAfter) * 0.5, siren: Math.floor(f / 3) % 2, dent: 0.5};
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.3, 17, 6]} p1={[0.6, 11, 4.4]} t0={[0, 0, -0.6]} t1={[0.8, 0, 0.6]} fov={44} shake={{at: hit, amp: 0.5, len: 14}} />
			<DioRoomLights />
			<Diorama cars={[player, cop, {kind: 'taxi', x: 6.45, z: lerp(8, -4, f / d), rot: PI / 2}, {kind: 'sedan', x: lerp(10, -2, f / d), z: 6.45, rot: PI}]} />
			<Sparks pos={[0.4, 0.3, 0.1]} t={(f - hit) / 14} n={22} />
			<Puffs pos={[0.6, 0, 0.3]} t={(f - hit) / 20} n={6} r={0.8} />
		</>
	);
};

// 0b. Low angle on the wreck; a voxel "bug" bursts out on the word bug.
const HookLow: React.FC<ShotProps> = ({f, d, bugF}) => {
	const b = (f - (bugF as number)) / 18;
	return (
		<>
			<Cam frame={f} dur={d} p0={[5.6, 0.8, 0.9]} p1={[4.4, 0.7, 0.7]} t0={[1.4, 0.3, 1.0]} t1={[1.2, 0.45, 0.9]} fov={44} shake={{at: bugF as number, amp: 0.06, len: 10}} />
			<DioRoomLights />
			<Diorama cars={[{kind: 'player', x: 2.8, z: 2.1, rot: -2.2}, {kind: 'cop', x: 0.6, z: 0.2, rot: -PI / 2 + 0.5, siren: Math.floor(f / 3) % 2, dent: 0.5}]} />
			{/* steam from the crumpled bonnet */}
			{[0, 1, 2].map((k) => {
				const tt = (f * 0.03 + k * 0.33) % 1;
				return (
					<mesh key={k} position={[0.75 + Math.sin(tt * 5) * 0.05, 0.4 + tt * 0.9, 0.55]} scale={0.08 + tt * 0.16}>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial color="#e0e4ea" transparent opacity={0.5 * (1 - tt)} />
					</mesh>
				);
			})}
			<GlitchBurst pos={[0.8, 0.45, 0.5]} t={b} spread={1.3} />
		</>
	);
};

// 1. Dundee, Scotland, 1988.
const DundeeShot: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam frame={f} dur={d} p0={[2, 16, 22]} p1={[1.5, 3.6, 17]} t0={[1, 6, -6]} t1={[1.5, 2.4, 0]} fov={46} />
		<Dundee frame={f} />
	</>
);

// 2a. David at the keyboard.
const Typing: React.FC<ShotProps> = ({f, d, imgs}) => {
	const dav = poseAt([{f: 0, rotY: PI - 0.15, ...SIT(P.david, 1.5), face: 'serious'}], f);
	const pose = {...dav, ...typing(f), ...(f > d - 24 ? {headY: 0.5, headX: 0, face: 'smile' as const} : {})};
	return (
		<>
			<Cam frame={f} dur={d} p0={[-10.4, 6.6, -6.6]} p1={[-9.0, 5.8, -5.4]} t0={[-3, 3.9, 2.2]} t1={[-3, 3.8, 2.2]} fov={40} />
			<Studio frame={f} />
			<Who p={P.david} imgs={imgs} pose={pose} at={[-3, 0, 2.6]} />
		</>
	);
};

// 2b. Plaque screwed on, Mike walks in with two teas.
const Plaque: React.FC<ShotProps> = ({f, d, imgs}) => {
	const scale = easeOut(ramp(f, 2, 12));
	const walkKeys: Key[] = [...walk(0, d, [-7.5, 6.5], [-5.2, 3.6], 8, false), {f: 0, rotY: PI * 0.78, armLX: -1.1, armRX: -1.1, armLZ: -0.1, armRZ: 0.1, face: 'grin'}];
	const mk = poseAt(walkKeys, f);
	const hl = handOf(mk, 'L', [0, 0, 0], P.mike.h);
	const hr = handOf(mk, 'R', [0, 0, 0], P.mike.h);
	return (
		<>
			<Cam frame={f} dur={d} p0={[-0.6, 7.2, 18.5]} p1={[-1.4, 6.8, 17]} t0={[-8.6, 5.4, 4]} t1={[-8.4, 5.2, 4]} fov={48} />
			<Studio frame={f} plaque={scale} />
			<Who p={P.mike} imgs={imgs} pose={mk} at={[0, 0, 0]} />
			<Mug pos={[hl.x, hl.y + 0.1, hl.z]} color="#f2c21a" steam={f * 0.15} />
			<Mug pos={[hr.x, hr.y + 0.1, hr.z]} color="#2a8a4a" steam={f * 0.15 + 1} />
			{/* screwdriver glint */}
			{f < 14 ? <Glow size={[0.08, 0.6, 0.08]} pos={[-12.4, 6.6, 1.4 - f * 0.02]} rot={[0, 0, 0.6]} color="#ffffff" i={2} /> : null}
		</>
	);
};

// 3. On the CRT: our tiny walkers march.
const ScreenWalkers: React.FC<{f: number; off?: number}> = ({f, off = 0}) => (
	<group>
		<RBox size={[1.1, 0.25, 0.05]} pos={[-0.05, -0.3, 0.01]} color="#3a8a3a" />
		<RBox size={[0.4, 0.4, 0.05]} pos={[-0.35, -0.05, 0.01]} color="#6a4a2a" />
		{Array.from({length: 6}).map((_, i) => {
			const x = ((f * 0.012 + i * 0.16 + off) % 1.0) - 0.5;
			const falling = x > 0.42;
			return <Critter key={i} pos={[x, falling ? -0.18 - (x - 0.42) * 3 : -0.17, 0.04]} step={f * 0.6 + i} rotY={PI / 2} s={0.18} fall={falling ? 0.5 : 0} />;
		})}
	</group>
);

const Lemmings: React.FC<ShotProps> = ({f, d, imgs}) => {
	const dav = {...poseAt([{f: 0, rotY: PI - 0.15, ...SIT(P.david, 1.5)}], f), ...typing(f, 0.5)};
	return (
		<>
			<Cam frame={f} dur={d} p0={[-0.6, 5.3, 4.8]} p1={[-1.6, 4.2, 1.0]} t0={[-3.1, 3.3, -3.2]} t1={[-3.0, 3.25, -2.8]} fov={38} />
			<Studio frame={f} screenKids={<ScreenWalkers f={f} />} />
			<Who p={P.david} imgs={imgs} pose={dav} at={[-3, 0, 2.6]} />
		</>
	);
};

// 4. Millions: the walkers pour off the desk into a box; a counter rolls up.
const Millions: React.FC<ShotProps> = ({f, d, imgs}) => {
	const n = Math.floor(onTwos(f) * 0.9);
	const crit = Array.from({length: 26}).map((_, i) => {
		const t = (f - i * 3) / 26;
		if (t < 0) return null;
		const onDesk = t < 0.55;
		const x = onDesk ? lerp(-5, 1.2, t / 0.55) : 1.2 + (t - 0.55) * 1.2;
		const y = onDesk ? 2.45 : Math.max(0.9, 2.45 - (t - 0.55) * (t - 0.55) * 22);
		return <Critter key={i} pos={[x, y, -1.2 + (i % 4) * 0.4]} step={f * 0.7 + i} rotY={PI / 2} s={0.9} fall={onDesk ? 0 : Math.min(1, (t - 0.55) * 4)} />;
	});
	const value = String(Math.min(9, Math.floor(n / 6) + 1)) + ',000,000';
	const hi = poseAt([{f: 0, rotY: PI * 0.9, ...SIT(P.david, 1.5), face: 'grin', armRX: -2.4, armRZ: -0.3}, {f: d - 30, armRX: -2.4}, {f: d - 22, armRX: -2.7, ease: 'snap'}], f);
	const mk = poseAt([{f: 0, rotY: -PI * 0.85, face: 'grin', armLX: -2.4, armLZ: 0.3}, {f: d - 22, armLX: -2.7, ease: 'snap'}], f, 2);
	return (
		<>
			<Cam frame={f} dur={d} p0={[7.5, 6.6, 12.5]} p1={[6.2, 6.0, 11.0]} t0={[0.2, 4.6, -2.4]} t1={[0, 4.8, -2]} fov={46} />
			<Studio frame={f} screenKids={<ScreenWalkers f={f} />} />
			{/* cardboard box catching them */}
			<group position={[2.6, 0, -1.2]}>
				<RBox size={[2.4, 1.6, 2.4]} pos={[0, 0.8, 0]} color="#c8a070" />
				<RBox size={[2.4, 0.06, 1.2]} pos={[0, 1.62, 1.6]} rot={[-0.6, 0, 0]} color="#b89060" />
				<BlockText text="SOLD" size={0.36} depth={0.05} color="#5a3a1a" position={[0, 0.9, 1.22]} />
			</group>
			{crit}
			<FlipCounter value={value} pos={[-1.5, 8.8, -8.4]} size={1.0} />
			<BlockText text="COPIES" size={0.5} depth={0.1} color="#f2c84a" position={[-1.5, 7.7, -8.3]} />
			<Who p={P.david} imgs={imgs} pose={hi} at={[-3, 0, 2.6]} />
			<Who p={P.mike} imgs={imgs} pose={mk} at={[-0.6, 0, 3.2]} />
		</>
	);
};

// 5. Something new: David snaps his fingers, the whiteboard gets a new plan.
const NewIdea: React.FC<ShotProps> = ({f, d, imgs}) => {
	const snap = 14;
	const dav = poseAt([{f: 0, rotY: 0.7, face: 'serious', armRX: -0.3, headY: -0.3}, {f: snap - 6, armRX: -2.0, armRZ: -0.4, face: 'serious'}, {f: snap, armRX: -2.3, armRZ: -0.2, face: 'grin', ease: 'snap'}, {f: snap + 10, armRX: -1.2, armRZ: 0.2, headY: 0.4}], f);
	return (
		<>
			<Cam frame={f} dur={d} p0={[4, 5.6, 9]} p1={[6.4, 6.4, 5.4]} t0={[8.6, 5.2, -6]} t1={[10, 6.2, -7.4]} fov={42} />
			<Studio frame={f} boardText={f > snap ? 'NEW IDEA' : undefined} />
			<Who p={P.david} imgs={imgs} pose={dav} at={[6.6, 0, -4.6]} />
			{f >= snap && f < snap + 6 ? <Glow size={[0.3, 0.3, 0.3]} pos={[5.6, 6.4, -4.2]} color="#ffffff" i={5} /> : null}
		</>
	);
};

// Diorama on the playtest table, with the testers around it.
const TABLE_Y = 2.3;
const TABLE_S = 0.27;
const DioTable: React.FC<{cars: DioCar[]; frame: number; chaos?: number}> = ({cars, frame, chaos}) => (
	<group>
		<group position={[0, TABLE_Y, 0]} scale={TABLE_S}>
			<Diorama cars={cars} frame={frame} chaos={chaos} />
		</group>
		{[
			[-3.2, -3.2],
			[3.2, -3.2],
			[-3.2, 3.2],
			[3.2, 3.2],
		].map(([x, z], i) => (
			<RBox key={i} size={[0.4, TABLE_Y - 0.2, 0.4]} pos={[x, (TABLE_Y - 0.2) / 2, z]} color="#4a3220" />
		))}
	</group>
);
const loopCar = (f: number, speed = 0.12): DioCar => {
	// drive a square around the centre block
	const per = 4 * 12;
	const s = ((f * speed * 10) % per) / 12;
	const side = Math.floor(s);
	const u = s - side;
	const pts = [
		[-6, -6],
		[6, -6],
		[6, 6],
		[-6, 6],
	];
	const a = pts[side % 4];
	const b = pts[(side + 1) % 4];
	return {kind: 'player', x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), rot: [0, -PI / 2, PI, PI / 2][side % 4] * -1 + (side % 2 ? 0 : 0)};
};
const Testers: React.FC<{imgs: Imgs; f: number; mood: 'watch' | 'bored' | 'snap' | 'laugh' | 'lean'; snapF?: number}> = ({imgs, f, mood, snapF = 0}) => {
	const look = mood === 'snap' && f >= snapF;
	const ctrl = {armLX: -1.0, armRX: -1.0, armLZ: -0.25, armRZ: 0.25};
	const base = (rotY: number, ph: number, extra: Partial<Pose> = {}) => poseAt([{f: 0, rotY, headX: 0.35, ...ctrl, ...extra}], f, ph);
	const moodPose = (p: Partial<Pose>, who: 'ali' | 'fi' | 'rab' | 'dav'): Partial<Pose> => {
		if (mood === 'bored') {
			if (who === 'rab') return {...p, ...yawn(f)};
			if (who === 'fi') return {...p, headX: 0.1, headZ: 0.25, armRX: -2.2, armRZ: 0.5, face: 'squint'};
			if (who === 'ali') return {...p, lean: 0.9, headX: 0.4, armLX: -1.6, armRX: -1.6, face: 'calm'};
			return {...p, face: 'squint'};
		}
		if (mood === 'snap') return look ? {...p, headX: -0.15, face: 'shock', lean: -0.08} : {...p, headX: 0.45, face: 'calm'};
		if (mood === 'laugh') return {...p, ...(who === 'ali' || who === 'rab' ? doubleOver(f, who.length) : laugh(f, who.length))};
		if (mood === 'lean') return {...p, lean: 0.4, headX: -0.1, face: 'smug', armLX: -0.9, armRX: -0.9};
		return {...p, face: 'serious'};
	};
	return (
		<>
			<Who p={P.ali} imgs={imgs} pose={moodPose(base(PI, 0), 'ali')} at={[-1.6, 0, 4.4]} />
			<Who p={P.fi} imgs={imgs} pose={moodPose(base(PI / 2, 1), 'fi')} at={[-4.6, 0, 0.4]} />
			<Who p={P.rab} imgs={imgs} pose={moodPose(base(-PI / 2, 2), 'rab')} at={[4.6, 0, 0.0]} />
			<Who p={P.david} imgs={imgs} pose={moodPose(base(0, 3, {...ctrl, armLX: -0.4, armRX: -0.4}), 'dav')} at={[0.6, 0, -4.4]} />
		</>
	);
};

// 6. Race'n'Chase: the table city, the testers, a sticky-note title.
const RaceTable: React.FC<ShotProps> = ({f, d, imgs, titleF}) => {
	const pop = easeOut(ramp(f, titleF as number, (titleF as number) + 8));
	const a = 0.6 + (f / d) * 0.9;
	const r = 13;
	return (
		<>
			<Cam frame={f} dur={1} p0={[Math.sin(a) * r, 11, Math.cos(a) * r]} p1={[Math.sin(a) * r, 11, Math.cos(a) * r]} t0={[0, 2.2, 0]} t1={[0, 2.2, 0]} fov={44} />
			<Studio frame={f} />
			<DioTable frame={f} cars={[loopCar(f), {kind: 'cop', x: -0.45, z: lerp(8, -8, (f % 60) / 60), rot: PI / 2, siren: Math.floor(f / 4) % 2}, {kind: 'taxi', x: lerp(-9, 9, (f % 80) / 80), z: 5.55, rot: 0}]} />
			<Testers imgs={imgs} f={f} mood="watch" />
			<group position={[0, TABLE_Y + 0.6 * pop, 3.9]} scale={pop} rotation={[-0.5, 0, 0.05]}>
				<Sticky pos={[0, 0, 0]} text="RACE'N'CHASE" size={0.26} />
			</group>
		</>
	);
};

// 7. One problem: blank faces, locked camera.
const OneProblem: React.FC<ShotProps> = ({f, d, imgs}) => (
	<>
		<Cam frame={f} dur={d} p0={[-1.6, 6.2, 12.4]} p1={[-1.6, 6.2, 12.0]} t0={[-1.6, 4.6, 0]} t1={[-1.6, 4.6, 0]} fov={40} />
		<Studio frame={f} />
		<DioTable frame={f} cars={[loopCar(f, 0.06)]} />
		<Testers imgs={imgs} f={f} mood="watch" />
	</>
);

// 8. It's boring: yawns, a nap on a pizza box, the car does slow laps.
const Boring: React.FC<ShotProps> = ({f, d, imgs}) => (
	<>
		<Cam frame={f} dur={d} p0={[9, 7.5, 9]} p1={[8.2, 6.8, 8.2]} t0={[0, 2.8, 0]} t1={[0, 3.0, 0]} fov={44} />
		<Studio frame={f} />
		<DioTable frame={f} cars={[loopCar(f, 0.05)]} />
		<Testers imgs={imgs} f={f} mood="bored" />
		<PizzaBoxStackOnTable />
		{/* sleep Zs as block letters */}
		{[0, 1, 2].map((k) => {
			const t = ((f * 0.03 + k * 0.33) % 1) as number;
			return <BlockText key={k} text="Z" size={0.35 + k * 0.08} depth={0.08} color="#f4f4ee" position={[-1.4 + t * 0.8, 5.2 + t * 1.6, 4.4]} />;
		})}
	</>
);
const PizzaBoxStackOnTable: React.FC = () => (
	<group position={[-1.6, TABLE_Y + 0.05, 3.2]}>
		<RBox size={[1.4, 0.16, 1.4]} color="#d8b884" />
	</group>
);

// 9. The bug: screen glitches, heads snap up.
const BugShot: React.FC<ShotProps> = ({f, d, imgs, bugF}) => {
	const g = f >= (bugF as number) ? 1 : 0;
	return (
		<>
			<Cam frame={f} dur={d} p0={[2.6, 5.4, 10]} p1={[2.2, 4.8, 8]} t0={[0, 3.4, 0]} t1={[0, 3.4, 0]} fov={46} shake={{at: bugF as number, amp: 0.25, len: 12}} />
			<Studio frame={f} glitch={g} />
			<DioTable frame={f} chaos={g} cars={[loopCar(f, 0.05), {kind: 'cop', x: 5.55, z: -6, rot: PI / 2, siren: g ? Math.floor(f / 2) % 2 : 0}]} />
			<GlitchBurst pos={[0, TABLE_Y + 0.4, 0]} t={(f - (bugF as number)) / 16} spread={2.4} n={34} />
			<Testers imgs={imgs} f={f} mood="snap" snapF={bugF as number} />
		</>
	);
};

// 10. Cops go crazy: chase through the table city, the player car is rammed off the road.
const Chase: React.FC<ShotProps> = ({f, d, rammF}) => {
	const R = rammF as number;
	const px = lerp(-10, 6, f / d);
	const off = ramp(f, R, R + 14);
	const player: DioCar = {kind: 'player', x: px, z: 0.45 + easeOut(off) * 2.6, rot: -easeOut(off) * 0.9, roll: off > 0 && off < 1 ? Math.sin(off * PI) * 0.5 : 0};
	const cops: DioCar[] = [0, 1, 2].map((k) => ({kind: 'cop', x: px - 2.2 - k * 1.8 + (k === 0 ? easeOut(ramp(f, R - 6, R)) * 1.6 : 0), z: 0.45 + Math.sin(f * 0.3 + k) * 0.35 - (k === 0 ? 0.3 : 0), rot: Math.sin(f * 0.3 + k) * 0.25, siren: Math.floor(f / 3 + k) % 2}));
	cops.push({kind: 'cop', x: 6.45 - 0.9, z: lerp(-10, 0.5, ramp(f, 0, R)), rot: -PI / 2, siren: Math.floor(f / 3) % 2});
	return (
		<>
			<Cam frame={f} dur={1} p0={[px - 7.5, 1.7, 1.1]} p1={[px - 7.5, 1.7, 1.1]} t0={[px + 0.6, 0.3, 0.9]} t1={[px + 0.6, 0.3, 0.9]} fov={46} shake={{at: R, amp: 0.2, len: 12}} />
			<DioRoomLights />
			<Diorama cars={[player, ...cops]} />
			<Sparks pos={[px - 0.6, 0.3, 0.6]} t={(f - R) / 12} />
			<Puffs pos={[px, 0, 2.4]} t={(f - R - 6) / 18} n={6} r={0.7} color="#7a9a5a" />
		</>
	);
};

// 11. The team should fix it: David reaches for the FIX note.
const FixIt: React.FC<ShotProps> = ({f, d, imgs}) => {
	const dav = poseAt([{f: 0, rotY: PI - 0.15, ...SIT(P.david, 1.5), face: 'serious', armRX: -0.6}, {f: 14, armRX: -1.5, armRZ: 0.25, lean: 0.25}, {f: d - 4, armRX: -1.55, face: 'squint', headY: 0.5}], f);
	const h = handOf(dav, 'R', [-3, 0, 2.6], P.david.h);
	return (
		<>
			<Cam frame={f} dur={d} p0={[-10.0, 6.6, -6.4]} p1={[-8.6, 5.8, -5.0]} t0={[-2.4, 3.4, 1.2]} t1={[-2.2, 3.2, 0.6]} fov={40} />
			<Studio frame={f} glitch={1} />
			<Who p={P.david} imgs={imgs} pose={dav} at={[-3, 0, 2.6]} />
			<Sticky pos={[-1.6, 2.48, -1.2]} rot={[-PI / 2, 0, 0.2]} text="FIX" size={0.22} />
			<Glow size={[0.05, 0.05, 0.05]} pos={[h.x, h.y, h.z]} color="#ffffff" i={0} />
		</>
	);
};

// 12. Instead they laugh and keep it: the note is crumpled and binned.
const Laugh: React.FC<ShotProps> = ({f, d, imgs, keepF}) => {
	const K = keepF as number;
	const toss = ramp(f, K, K + 14);
	const dav = poseAt([{f: 0, rotY: 0.4, ...laugh(f, 0)}, {f: K - 4, armRX: -1.4}, {f: K, armRX: -2.8, armRZ: -0.2, ease: 'snap'}, {f: K + 8, armRX: -0.6}], f, 3);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 7.4, 14]} p1={[0.4, 6.4, 11.2]} t0={[0, 3.6, 0]} t1={[0.2, 3.6, 0.4]} fov={44} />
			<Studio frame={f} glitch={1} />
			<DioTable frame={f} chaos={1} cars={[loopCar(f, 0.05)]} />
			<Testers imgs={imgs} f={f} mood="laugh" />
			<Who p={P.mike} imgs={imgs} pose={poseAt([{f: 0, rotY: -0.6, ...laugh(f, 2)}], f, 4)} at={[3.6, 0, 4.0]} />
			<Who p={P.david} imgs={imgs} pose={{...dav, face: 'grin', ...laugh(f, 1), armRX: dav.armRX}} at={[0.6, 0, -4.4]} />
			{/* crumpled ball arcs into the bin */}
			{toss > 0 && toss < 1 ? <RBox size={[0.4, 0.4, 0.4]} pos={[lerp(0.2, 7.2, toss), 5.6 + Math.sin(toss * PI) * 3 - toss * 3.6, lerp(-4, 1.8, toss)]} rot={[toss * 8, toss * 5, 0]} color="#f8e26a" /> : null}
			{/* energy-drink spray from Rab */}
			{[0, 1, 2, 3, 4].map((k) => {
				const t = ((f * 0.05 + k * 0.2) % 1) as number;
				return <Glow key={k} size={[0.1, 0.1, 0.1]} pos={[4.6 - t * 2, 4.6 + Math.sin(t * PI) * 0.6, 0.6 + t]} color="#bfff4a" i={1} />;
			})}
		</>
	);
};

// 13. Chaos becomes the game: the camera spins over a city in chaos.
const Chaos: React.FC<ShotProps> = ({f, d}) => {
	const a = (f / d) * 1.4;
	const cars: DioCar[] = Array.from({length: 7}).map((_, i) => {
		const t = (f + i * 9) / 40;
		return {kind: i % 2 ? 'cop' : (['player', 'taxi', 'sedan'] as const)[i % 3], x: Math.sin(t + i) * 7, z: Math.cos(t * 1.3 + i * 2) * 7, rot: t * 2 + i, siren: Math.floor(f / 3 + i) % 2, flip: i % 3 === 0 ? ((f + i * 10) % 40) / 40 : 0};
	});
	return (
		<>
			<Cam frame={f} dur={1} p0={[Math.sin(a) * 9, 9, Math.cos(a) * 9]} p1={[Math.sin(a) * 9, 9, Math.cos(a) * 9]} t0={[0, 0, 0]} t1={[0, 0, 0]} fov={50} />
			<DioRoomLights />
			<Diorama cars={cars} chaos={1} frame={f} />
			{/* hydrant fountain */}
			{Array.from({length: 8}).map((_, k) => {
				const t = ((f * 0.06 + k / 8) % 1) as number;
				return <Glow key={k} size={[0.1, 0.1, 0.1]} pos={[1.4 + Math.sin(k) * t * 0.6, 0.3 + Math.sin(t * PI) * 2.2, 1.4 + Math.cos(k) * t * 0.6]} color="#9ad8ff" i={0.8} />;
			})}
			{[0, 1, 2].map((k) => (
				<Puffs key={k} pos={[-6 + k * 6, 0, 6 - k * 6]} t={((f + k * 12) % 36) / 26} n={6} r={0.6} color="#ffb060" />
			))}
		</>
	);
};

// 14a. The project drags on: calendar flies, pizza stacks grow, the clock spins.
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DragsOn: React.FC<ShotProps> = ({f, d, imgs}) => {
	const m = Math.floor(onTwos(f) / 3);
	const dav = poseAt([{f: 0, rotY: PI - 0.15, ...SIT(P.david, 1.5), face: 'calm', headX: 0.4, lean: 0.4, armLX: -1.4, armRX: -1.4}], f);
	return (
		<>
			<Cam frame={f} dur={d} p0={[-2.2, 7.6, 7.2]} p1={[-3.2, 7.2, 5.6]} t0={[-4.0, 7.4, -8.6]} t1={[-4.0, 7.0, -8.6]} fov={50} />
			<Studio frame={f} lamp={0.8} />
			{/* wall calendar */}
			<group position={[-1, 8.6, -8.6]}>
				<RBox size={[2.4, 3, 0.1]} color="#f4f4ee" />
				<RBox size={[2.4, 0.7, 0.12]} pos={[0, 1.15, 0.02]} color="#c41e1e" />
				<BlockText text={MONTHS[m % 12]} size={0.42} depth={0.06} color="#1a1a1a" position={[0, 0.1, 0.1]} />
				<BlockText text={String(1993 + Math.floor(m / 12))} size={0.28} depth={0.04} color="#f4f4ee" position={[0, 1.15, 0.12]} />
				{/* flying torn pages */}
				{[0, 1, 2].map((k) => {
					const t = ((f * 0.08 + k * 0.33) % 1) as number;
					return <RBox key={k} size={[2.2, 2.2, 0.03]} pos={[t * 6, -t * 4 + Math.sin(t * 6) * 0.3, 0.4 + t * 3]} rot={[t * 3, t * 4, t * 2]} color="#f4f4ee" />;
				})}
			</group>
			{/* growing pizza tower */}
			<group position={[-6.4, 0, -6.6]}>
				{Array.from({length: Math.min(14, 2 + Math.floor(f / 5))}).map((_, i) => (
					<RBox key={i} size={[1.3, 0.15, 1.3]} pos={[Math.sin(i * 2) * 0.1, 0.08 + i * 0.17, 0]} rot={[0, Math.sin(i * 3) * 0.2, 0]} color="#d8b884" />
				))}
			</group>
			{/* wall clock, hands spinning */}
			<group position={[-7.4, 11.4, -8.7]}>
				<mesh rotation={[PI / 2, 0, 0]}>
					<cylinderGeometry args={[1, 1, 0.15, 16]} />
					<meshStandardMaterial color="#f4f4ee" />
				</mesh>
				<RBox size={[0.08, 0.8, 0.04]} pos={[0, 0, 0.12]} rot={[0, 0, -f * 0.6]} color="#1a1a1a" />
				<RBox size={[0.08, 0.5, 0.04]} pos={[0, 0, 0.13]} rot={[0, 0, -f * 0.05]} color="#c41e1e" />
			</group>
			<Who p={P.david} imgs={imgs} pose={dav} at={[-3, 0, 2.6]} />
		</>
	);
};

// 14b. The publisher almost pulls the plug.
const Plug: React.FC<ShotProps> = ({f, d, imgs, pullF}) => {
	const pull = easeOut(ramp(f, pullF as number, (pullF as number) + 6));
	const ex = poseAt([{f: 0, rotY: -PI / 2 + 0.3, face: 'squint', lean: 0.3, armRX: -1.3, armLX: -1.3, armLZ: -0.1, armRZ: 0.1}, {f: (pullF as number) - 3, lean: 0.35}, {f: (pullF as number) + 3, lean: -0.3, armRX: -1.9, armLX: -1.9, ease: 'snap', face: 'smug'}], f);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.6, 5.4, 16]} p1={[2.2, 4.8, 13.6]} t0={[7.6, 3.0, 1.6]} t1={[8.0, 2.6, 1.4]} fov={42} shake={{at: pullF as number, amp: 0.2, len: 8}} />
			<Boardroom frame={f} plug={pull} lights={1 - pull * 0.35} />
			<Who p={P.exec} imgs={imgs} pose={ex} at={[6.6, 0, 2.8]} />
			{pull > 0 ? <Sparks pos={[9.8, 1.7, 1]} t={(f - (pullF as number)) / 10} n={10} /> : null}
		</>
	);
};

// 15. So they lean into it: lights flick back on, the team leans in, sly grins.
const LeanIn: React.FC<ShotProps> = ({f, d, imgs}) => {
	const on = f > 8 ? 1 : f > 4 ? (f % 2 ? 1 : 0.1) : 0.1;
	const lean = (ph: number, rotY: number) => poseAt([{f: 0, rotY, lean: 0, face: 'serious'}, {f: 10, lean: 0.55, headX: -0.25, face: 'smug', ease: 'back'}], f, ph);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.6, 5.6, 12.4]} p1={[0.6, 5.2, 10]} t0={[0.4, 4.4, 0]} t1={[0.4, 4.6, 0]} fov={42} />
			<Studio frame={f} lamp={on} dim={1 - on} />
			<DioTable frame={f} cars={[{kind: 'cop', x: 0, z: 0, rot: PI / 2, siren: Math.floor(f / 3) % 2}]} />
			<Who p={P.david} imgs={imgs} pose={lean(0, 0)} at={[0.6, 0, -4.4]} />
			<Who p={P.mike} imgs={imgs} pose={lean(1, 0.5)} at={[-3.2, 0, -3.2]} />
			<Who p={P.rab} imgs={imgs} pose={lean(2, -PI / 2)} at={[4.6, 0, 0.0]} />
			<Who p={P.fi} imgs={imgs} pose={lean(3, PI / 2)} at={[-4.6, 0, 0.4]} />
		</>
	);
};

// 16. The publicist: feet on the desk, brick phone, a snap on "purpose".
const Publicist: React.FC<ShotProps> = ({f, d, imgs, snapF}) => {
	const S = snapF as number;
	const pb = poseAt(
		[
			{f: 0, rotY: 0.2, ...SIT(P.publicist, 1.65), lean: -0.35, legLX: -1.2, legRX: -1.3, armLX: -2.6, armLZ: -0.6, headZ: -0.15, face: 'smug'},
			{f: S - 5, armRX: -2.0, armRZ: -0.6},
			{f: S, armRX: -2.6, armRZ: -0.3, face: 'grin', ease: 'snap'},
			{f: S + 10, armRX: -1.2},
		],
		f,
	);
	const hl = handOf(pb, 'L', [-1, 0, -0.2], P.publicist.h);
	return (
		<>
			<Cam frame={f} dur={d} p0={[3.4, 7.0, 17.5]} p1={[2.0, 6.6, 15.5]} t0={[-0.8, 4.0, 0]} t1={[-0.9, 4.2, 0]} fov={40} />
			<PubOffice frame={f} fax={ramp(f, S, S + 24)} />
			<Who p={P.publicist} imgs={imgs} pose={pb} at={[-1, 0, -0.2]} />
			{/* brick phone in the left hand */}
			<group position={[hl.x, hl.y + 0.3, hl.z]} rotation={[0, 0, 0.2]}>
				<RBox size={[0.36, 1.1, 0.26]} color="#2a2a2e" />
				<RBox size={[0.08, 0.6, 0.08]} pos={[0.1, 0.8, 0]} color="#1a1a1a" />
				<Glow size={[0.26, 0.14, 0.02]} pos={[0, 0.25, 0.14]} color="#8aff8a" i={1} />
			</group>
			{f >= S && f < S + 5 ? <Glow size={[0.35, 0.35, 0.35]} pos={[0.6, 6.2, 0.2]} color="#ffffff" i={5} /> : null}
		</>
	);
};

// 17. Newspapers rage: a paper spins up to camera, then the readers react.
const Papers: React.FC<ShotProps> = ({f, d, imgs}) => {
	const spin = 1 - easeOut(ramp(f, 0, 12));
	const mum = poseAt([{f: 0, rotY: 0.35, face: 'shock'}], f, 1);
	const gr = poseAt([{f: 0, rotY: -0.3, face: 'shock', armRX: -1.4, armLX: -1.4, armLZ: -0.3, armRZ: 0.3}, {f: 18, headX: -0.2}, {f: 22, headX: 0.1, ease: 'snap'}], f, 2);
	const mumPose = {...mum, ...paperShake(f)};
	const hm = handOf(mumPose, 'R', [-2.6, 0, 3], P.mum.h);
	const hml = handOf(mumPose, 'L', [-2.6, 0, 3], P.mum.h);
	const pop = ramp(f, 22, 34);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.4, 5.6, 17.5]} p1={[0.2, 5.2, 15.5]} t0={[0, 4.4, 0]} t1={[0, 4.2, 0]} fov={42} />
			<Newsstand frame={f} />
			<Who p={P.mum} imgs={imgs} pose={mumPose} at={[-2.6, 0, 3]} />
			{/* mum's paper between her hands */}
			<group position={[(hm.x + hml.x) / 2, (hm.y + hml.y) / 2 + 0.6, (hm.z + hml.z) / 2 + 0.2]}>
				<RBox size={[2.4, 1.7, 0.06]} color="#f4f0e6" />
				<BlockText text="BAN IT!" size={0.34} depth={0.04} color="#c41e1e" position={[0, 0.2, 0.06]} />
			</group>
			<Who p={P.grandad} imgs={imgs} pose={gr} at={[2.8, 0, 2.6]} />
			{/* monocle pops off */}
			<group position={[2.6 + pop * 0.8, 5.3 + Math.sin(pop * PI) * 1.0 - pop * 1.4, 3.3 + pop * 0.6]} rotation={[pop * 6, 0, 0]}>
				<mesh rotation={[PI / 2, 0, 0]}>
					<torusGeometry args={[0.16, 0.03, 6, 12]} />
					<meshStandardMaterial color="#d8b048" metalness={0.8} roughness={0.3} />
				</mesh>
			</group>
			{/* spinning front page flying into camera (transition) */}
			{spin > 0.02 ? (
				<group position={[0, 4.6 + spin * 1.0, 9.6 - spin * 12]} rotation={[0, 0, spin * PI * 6]} scale={1 + (1 - spin) * 0.2}>
					<RBox size={[3.4, 4.4, 0.08]} color="#f4f0e6" />
					<RBox size={[3.2, 0.8, 0.02]} pos={[0, 1.6, 0.05]} color="#c41e1e" />
					<BlockText text="OUTRAGE!" size={0.48} depth={0.06} color="#1a1a1a" position={[0, 0.4, 0.07]} />
				</group>
			) : null}
		</>
	);
};

// 18. Politicians complain.
const Politics: React.FC<ShotProps> = ({f, d, imgs}) => {
	const pol = poseAt([{f: 0, rotY: 0, face: 'shock', headX: -0.1}], f);
	return (
		<>
			<Cam frame={f} dur={d} p0={[2.6, 5.4, 11.6]} p1={[1.6, 5.8, 9.8]} t0={[0, 4.8, 0]} t1={[0, 5.0, 0]} fov={42} shake={{at: 10, amp: 0.08, len: 6}} />
			<Chamber />
			<Who p={P.politician} imgs={imgs} pose={{...pol, ...pound(f, 12), face: f % 12 < 5 ? 'shock' : 'squint'}} at={[0, 0, 0.2]} />
		</>
	);
};

// 19. The game flies off the shelves (mum and grandad buy it anyway).
const Shelves: React.FC<ShotProps> = ({f, d, imgs, flyF}) => {
	const fly = ramp(f, flyF as number, (flyF as number) + 20);
	const mum = poseAt([{f: 0, rotY: PI - 0.3, face: 'smug', armRX: -1.2}], f, 1);
	const gr = poseAt([{f: 0, rotY: PI + 0.3, face: 'grin', armLX: -1.8, armLZ: 0.3}], f, 2);
	const h = handOf(mum, 'R', [-2.6, 0, -1.4], P.mum.h);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 6.8, 17]} p1={[0, 6.0, 14.6]} t0={[0, 4.6, -6]} t1={[0, 4.6, -5]} fov={44} />
			<Shop97 frame={f} fly={fly} />
			<Who p={P.mum} imgs={imgs} pose={mum} at={[-2.6, 0, -1.4]} />
			<GameBox pos={[h.x, h.y + 0.5, h.z + 0.2]} rot={[0, PI, 0]} s={0.9} />
			<Who p={P.grandad} imgs={imgs} pose={gr} at={[2.8, 0, -1.0]} />
		</>
	);
};

// 20. New York: the Houser brothers, a fist-bump, the sign flickers on.
const NewYork: React.FC<ShotProps> = ({f, d, imgs, signF}) => {
	const S = signF as number;
	const bump = 16;
	const sam = poseAt([{f: 0, rotY: 0.75, face: 'smile', armRX: -0.4}, {f: bump - 6, armRX: -0.6, armRZ: 0.2}, {f: bump, armRX: -1.5, armRZ: 0.35, face: 'grin', ease: 'snap'}, {f: bump + 10, armRX: -1.4}, {f: S + 4, headY: -0.6, headX: -0.3, face: 'grin'}], f, 1);
	const dan = poseAt([{f: 0, rotY: -0.75, face: 'smile', armLX: -0.4}, {f: bump - 6, armLX: -0.6, armLZ: -0.2}, {f: bump, armLX: -1.5, armLZ: -0.35, face: 'grin', ease: 'snap'}, {f: bump + 10, armLX: -1.4}, {f: S + 4, headY: 0.6, headX: -0.3, face: 'grin'}], f, 2);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 5, 15.6]} p1={[0, 6.4, 13]} t0={[0, 4.4, -2]} t1={[0, 6.4, -4]} fov={44} />
			<Loft frame={f} sign={ramp(f, S, S + 12)} />
			<Who p={P.sam} imgs={imgs} pose={sam} at={[-1.9, 0, 0.6]} />
			<Who p={P.dan} imgs={imgs} pose={dan} at={[1.9, 0, 0.6]} />
			{f >= bump && f < bump + 4 ? <Glow size={[0.4, 0.4, 0.4]} pos={[0, 4.6, 2.2]} color="#ffffff" i={4} /> : null}
		</>
	);
};

// 21. Into 3D: dive into the table city, then pop out at street level in a full city.
const Into3D: React.FC<ShotProps> = ({f, d, imgs, swapF}) => {
	const S = swapF as number;
	if (f < S) {
		const t = ease(f / S);
		return (
			<>
				<Cam frame={f} dur={S} p0={[0.2, 16, 0.6]} p1={[0.5, 0.9, 1.4]} t0={[0, 0, 0]} t1={[0.6, 0.6, -2]} fov={lerp(44, 60, t)} />
				<DioRoomLights />
				<Diorama cars={[loopCar(f), {kind: 'cop', x: -0.45, z: lerp(8, -8, f / S), rot: PI / 2, siren: Math.floor(f / 3) % 2}]} />
			</>
		);
	}
	const g = f - S;
	const pl = poseAt([{f: 0, rotY: PI, face: 'serious', headY: 0}, {f: 10, rotY: PI - 0.6, headY: -0.4}, {f: 22, rotY: PI + 0.5, headY: 0.4, face: 'shock'}, {f: 34, rotY: 0.2, headY: 0, face: 'grin'}], g);
	return (
		<>
			<Cam frame={g} dur={d - S} p0={[0.4, 2.4, 13]} p1={[2.8, 6.4, 17]} t0={[-0.4, 3.4, -2]} t1={[0, 6, -20]} fov={50} />
			<City3D frame={f} />
			<pointLight position={[1.4, 5, 7]} color="#ffd0a0" intensity={22} distance={14} />
			<Who p={P.player} imgs={imgs} pose={pl} at={[-0.6, 0.3, 2]} />
		</>
	);
};

// 22. Vice City: neon coast at sunset.
const Vice: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam frame={f} dur={d} p0={[-6, 3.4, 27]} p1={[2, 4.6, 25]} t0={[-4, 5, 0]} t1={[2, 6, -24]} fov={48} />
		<ViceCoast frame={f + 30} />
	</>
);

// 23. San Andreas: lowrider hop on a sunny street.
const WestShot: React.FC<ShotProps> = ({f, d, imgs}) => {
	const ph = (onTwos(f) % 16) / 16;
	const hop = Math.max(0, Math.sin(ph * PI * 2)) * 1.4;
	const pl = poseAt([{f: 0, rotY: -0.5, face: 'grin', armRX: -2.6, armRZ: -0.3}, {f: 10, armRX: -2.2}, {f: 20, armRX: -2.7}], f);
	return (
		<>
			<Cam frame={f} dur={d} p0={[10, 2.4, 22]} p1={[4, 3.0, 19]} t0={[-1, 2.4, 4]} t1={[-2, 2.8, 3]} fov={44} />
			<WestCoast frame={f} hop={hop} />
			<Who p={P.player} imgs={imgs} pose={pl} at={[6.4, 0.1, 9]} />
		</>
	);
};

// 24. Launch night: the shutter rises, the counter rolls to a billion.
const Launch: React.FC<ShotProps> = ({f, d, imgs, billF}) => {
	const B = billF as number;
	const r = ramp(f, 6, B);
	const v = Math.floor(Math.pow(r, 2.2) * 1000000000);
	const counter = '$' + (f >= B ? 1000000000 : v).toLocaleString('en-US');
	const queue: [Person, number, number][] = [
		[P.fanA, -9, 6.2],
		[P.fanB, -5.4, 6.6],
		[P.fanDad, -1.6, 6.2],
		[P.fanPj, 2.4, 6.8],
		[P.ali, 6.2, 6.4],
	];
	const cheer = f >= B;
	const dadPose = poseAt([{f: 0, rotY: 0.1, face: 'smile', armLX: -2.6, armRX: -2.6, armLZ: 0.4, armRZ: -0.4}], f, 3);
	const shoulders = handOf(dadPose, 'L', [-1.6, 0, 6.2], P.fanDad.h);
	return (
		<>
			<Cam frame={f} dur={d} p0={[2, 6.4, 32]} p1={[0.6, 8.8, 35]} t0={[0, 7.4, 0]} t1={[0, 9.4, -4]} fov={46} shake={{at: B, amp: 0.2, len: 10}} />
			<LaunchNight frame={f} shutter={easeOut(ramp(f, 4, 24))} counter={counter}>
				{cheer ? <Confetti frame={f - B} n={110} area={[24, 16, 10]} y0={16} cols={['#3fbf6a', '#ffffff', '#f2c21a', '#c84aff']} /> : null}
			</LaunchNight>
			{queue.map(([p, x, z], i) => (
				<Who key={i} p={p} imgs={imgs} pose={poseAt([{f: 0, rotY: PI + (i % 2 ? 0.2 : -0.2), face: cheer ? 'grin' : 'smile', ...(cheer ? {armLX: -2.8, armRX: -2.8, armLZ: 0.3, armRZ: -0.3, y: Math.abs(Math.sin(onTwos(f) * 0.4 + i)) * 0.6} : {})}], f, i)} at={[x, 0.3, z]} />
			))}
			<Who p={P.fanDad} imgs={imgs} pose={{...dadPose, rotY: PI}} at={[-1.6, 0.3, 6.2]} />
			<Who p={P.fanKid} imgs={imgs} pose={poseAt([{f: 0, rotY: PI, ...SIT(P.fanKid, 0), face: 'grin', armLX: -2.8, armRX: -2.8}], f, 6)} at={[-1.6, shoulders.y + 0.4, 6.4]} />
			<Who p={P.clerk} imgs={imgs} pose={poseAt([{f: 0, rotY: 0, face: 'grin', armRX: -2.8, armLX: -2.8}, {f: 24, armRX: -1.2, armLX: -0.4}], f, 7)} at={[0, 0.3, -2.4]} />
		</>
	);
};

// 25. Fastest launch in history: a record trophy, flashbulbs.
const Record: React.FC<ShotProps> = ({f, d, imgs}) => {
	const flash = (f % 9 < 2 ? 1 : 0) + (f % 13 < 2 ? 1 : 0);
	const sam = poseAt([{f: 0, rotY: 0.3, face: 'grin', armRX: -1.2, armLX: -1.2, armRZ: 0.3, armLZ: -0.3}], f, 1);
	const dan = poseAt([{f: 0, rotY: -0.3, face: 'grin', armLX: -2.6, armLZ: 0.2}], f, 2);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 5.6, 14]} p1={[0, 5.2, 11.4]} t0={[0, 4.6, 0]} t1={[0, 4.8, 0]} fov={42} />
			<LaunchNight frame={f} shutter={1} counter="$1,000,000,000" />
			<group position={[0, 0.3, 1]}>
				<RBox size={[3, 2.4, 2]} pos={[0, 1.2, 0]} color="#1a1a22" />
				<BlockText text="RECORD" size={0.4} depth={0.08} color="#f2c84a" position={[0, 1.4, 1.05]} />
				{/* trophy */}
				<group position={[0, 2.4, 0]}>
					<RBox size={[1.2, 0.3, 1.2]} pos={[0, 0.15, 0]} color="#d8b048" rough={0.2} />
					<RBox size={[0.3, 1.0, 0.3]} pos={[0, 0.8, 0]} color="#e8c050" rough={0.2} />
					<mesh position={[0, 1.8, 0]}>
						<cylinderGeometry args={[0.8, 0.4, 1.2, 10]} />
						<meshStandardMaterial color="#f2c84a" metalness={0.9} roughness={0.2} flatShading />
					</mesh>
					{[-1, 1].map((s) => (
						<mesh key={s} position={[s * 0.85, 1.9, 0]} rotation={[0, 0, PI / 2]}>
							<torusGeometry args={[0.3, 0.07, 6, 10, PI]} />
							<meshStandardMaterial color="#f2c84a" metalness={0.9} roughness={0.2} />
						</mesh>
					))}
				</group>
			</group>
			<Who p={P.sam} imgs={imgs} pose={sam} at={[-3.4, 0.3, 1.2]} />
			<Who p={P.dan} imgs={imgs} pose={dan} at={[3.4, 0.3, 1.2]} />
			{flash > 0 ? <pointLight position={[f % 2 ? -4 : 4, 6, 8]} color="#ffffff" intensity={60 * flash} distance={20} /> : null}
			{[0, 1, 2, 3].map((k) => ((f + k * 5) % 11 < 2 ? <Glow key={k} size={[0.5, 0.5, 0.2]} pos={[-6 + k * 4, 3 + (k % 2) * 2, 9]} color="#ffffff" i={6} /> : null))}
		</>
	);
};

// 26. "The series is called…": slow descent in the asphalt void.
const Called: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam frame={f} dur={d} p0={[3.4, 12, 20]} p1={[2.6, 4.6, 18]} t0={[-4, 6, -4]} t1={[-4, 3.4, -4]} fov={42} />
		<Void lamp={0.6} />
	</>
);

// 27. Grand Theft Auto: the logo slams down.
const LogoSlam: React.FC<ShotProps> = ({f, d}) => {
	const fall = easeOut(ramp(f, 0, 6));
	const y = lerp(16, 0, fall) + (f > 6 && f < 12 ? Math.sin((f - 6) * 1.2) * 0.12 : 0);
	const sweep = ramp(f, 10, d);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.6, 4.4, 22]} p1={[0.6, 4.0, 24]} t0={[0, 4.6, 0]} t1={[0, 4.4, 0]} fov={44} shake={{at: 6, amp: 0.6, len: 14}} />
			<Void lamp={1} />
			<group position={[0, 5.2 + y, 0]} rotation={[-0.06, -0.1, 0]}>
				<LogoBlock />
			</group>
			<Puffs pos={[0, 0, 0]} t={(f - 6) / 18} n={12} r={5} color="#5a5a60" />
			{/* headlight sweep */}
			<pointLight position={[lerp(-14, 14, sweep), 1.4, 8]} color="#fff4d6" intensity={60} distance={22} />
			<Glow size={[0.6, 0.3, 0.1]} pos={[lerp(-14, 14, sweep), 1.4, 9]} color="#fff4d6" i={4} />
		</>
	);
};

// 28. The sixth one: VI rises from a dawn lagoon.
const Sixth: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam frame={f} dur={d} p0={[-6, 2.4, 14]} p1={[0, 5, 10]} t0={[0, 3, -30]} t1={[2, 6.4, -36]} fov={48} />
		<Dawn frame={f} rise={easeOut(ramp(f, 4, d * 0.7))} />
	</>
);

// 29. Callback: the cop car rams again; the camera tilts up into the night.
const Callback: React.FC<ShotProps> = ({f, d}) => {
	const hit = 26;
	const t = Math.min(1, f / hit);
	const pA = ramp(f, hit, hit + 16);
	const player: DioCar = f < hit ? {kind: 'player', x: lerp(-9, 0.2, t), z: 0.45, rot: 0} : {kind: 'player', x: lerp(0.2, 2.6, easeOut(pA)), z: lerp(0.45, 2.2, easeOut(pA)), rot: -easeOut(pA) * 2.0};
	const cop: DioCar = f < hit ? {kind: 'cop', x: -0.45, z: lerp(-9, -0.9, t), rot: -PI / 2, siren: Math.floor(f / 3) % 2} : {kind: 'cop', x: 0.5, z: 0.1, rot: -PI / 2 + 0.5, siren: Math.floor(f / 3) % 2, dent: 0.5};
	const tilt = ease(ramp(f, hit + 10, d));
	return (
		<>
			<Cam frame={f} dur={1} p0={[0.4, 14, 5]} p1={[0.4, 14, 5]} t0={[0.4, lerp(0, 26, tilt), lerp(-0.4, -18, tilt)]} t1={[0.4, lerp(0, 26, tilt), lerp(-0.4, -18, tilt)]} fov={46} shake={{at: hit, amp: 0.45, len: 12}} />
			<DioRoomLights />
			<Diorama cars={[player, cop]} />
			<Sparks pos={[0.4, 0.3, 0.1]} t={(f - hit) / 12} />
		</>
	);
};

// =========================================================
// EDIT
// =========================================================
const cut = (t: number) => Math.max(0, sec(t) - 2);
type FX = 'glitch' | 'crt' | 'whip' | 'zoom' | 'flash' | 'pixel';
type ShotDef = {from: number; C: React.FC<any>; props?: (from: number) => Record<string, unknown>; fxIn?: FX; fxOut?: FX};

const rel = (t: number, from: number) => sec(t) - from;
const SHOTS: ShotDef[] = [
	{from: 0, C: HookTop},
	{from: cut(word(0, 6).s), C: HookLow, props: (from) => ({bugF: rel(word(0, 11).s, from)}), fxIn: 'zoom'},
	{from: cut(L(1).s), C: DundeeShot, fxIn: 'pixel'},
	{from: cut(L(2).s), C: Typing},
	{from: cut(word(2, 6).s), C: Plaque},
	{from: cut(L(3).s), C: Lemmings, fxIn: 'zoom'},
	{from: cut(L(4).s), C: Millions},
	{from: cut(L(5).s), C: NewIdea},
	{from: cut(L(6).s), C: RaceTable, props: (from) => ({titleF: rel(word(6, 7).s, from)}), fxIn: 'whip'},
	{from: cut(L(7).s), C: OneProblem},
	{from: cut(L(8).s), C: Boring},
	{from: cut(L(9).s), C: BugShot, props: (from) => ({bugF: rel(word(9, 2).s, from)}), fxIn: 'glitch'},
	{from: cut(L(10).s), C: Chase, props: (from) => ({rammF: rel(word(10, 5).s, from)}), fxIn: 'glitch'},
	{from: cut(L(11).s), C: FixIt},
	{from: cut(L(12).s), C: Laugh, props: (from) => ({keepF: rel(word(12, 4).s, from)})},
	{from: cut(L(13).s), C: Chaos, fxIn: 'whip'},
	{from: cut(L(14).s), C: DragsOn},
	{from: cut(word(14, 6).s), C: Plug, props: (from) => ({pullF: rel(word(14, 9).s, from)}), fxOut: 'crt'},
	{from: cut(L(15).s), C: LeanIn},
	{from: cut(L(16).s), C: Publicist, props: (from) => ({snapF: rel(word(16, 6).s, from)}), fxIn: 'flash'},
	{from: cut(L(17).s), C: Papers},
	{from: cut(L(18).s), C: Politics},
	{from: cut(L(19).s), C: Shelves, props: (from) => ({flyF: rel(word(19, 3).s, from)})},
	{from: cut(L(20).s), C: NewYork, props: (from) => ({signF: rel(word(20, 7).s, from)}), fxIn: 'whip'},
	{from: cut(L(21).s), C: Into3D, props: (from) => ({swapF: rel(word(21, 5).s, from)}), fxIn: 'pixel'},
	{from: cut(L(22).s), C: Vice, fxIn: 'flash', fxOut: 'whip'},
	{from: cut(L(23).s), C: WestShot, fxIn: 'whip'},
	{from: cut(L(24).s), C: Launch, props: (from) => ({billF: rel(word(24, 11).e, from)})},
	{from: cut(L(25).s), C: Record, fxIn: 'flash'},
	{from: cut(L(26).s), C: Called},
	{from: sec(word(27, 0).s) - 1, C: LogoSlam, fxIn: 'flash'},
	{from: cut(L(28).s), C: Sixth, fxIn: 'zoom'},
	{from: cut(L(29).s), C: Callback, fxIn: 'pixel'},
];

// Unique transitions, done on the frame of each shot (CSS on the canvas wrapper + small overlays).
const FX_LEN = 6;
const fxStyle = (fx: FX | undefined, k: number, dir: 'in' | 'out', f: number): React.CSSProperties => {
	if (!fx || k >= 1) return {};
	const u = 1 - k; // 1 at the cut, 0 when settled
	switch (fx) {
		case 'whip':
			return {transform: `translateX(${(dir === 'in' ? 1 : -1) * u * u * 900}px)`, filter: `blur(${u * 26}px)`};
		case 'zoom':
			return {transform: `scale(${1 + u * u * 0.6})`, filter: `blur(${u * 14}px)`};
		case 'glitch': {
			const j = (Math.floor(f / 1) % 3) - 1;
			return {transform: `translate(${j * 30 * u}px, ${-j * 12 * u}px)`, filter: `hue-rotate(${u * 160}deg) saturate(${1 + u * 2}) contrast(${1 + u})`};
		}
		case 'crt':
			return {transform: `scale(${1 + u * 0.2}, ${Math.max(0.004, 1 - u * 1.02)})`, filter: `brightness(${1 + u * 3})`};
		case 'flash':
			return {filter: `brightness(${1 + u * 3}) saturate(${1 - u * 0.6})`};
		case 'pixel':
			return {filter: `blur(${u * 6}px)`};
		default:
			return {};
	}
};

const Overlay: React.FC<{fx?: FX; k: number; f: number}> = ({fx, k, f}) => {
	if (!fx || k >= 1) return null;
	const u = 1 - k;
	if (fx === 'glitch')
		return (
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				{Array.from({length: 9}).map((_, i) => {
					const y = ((i * 211 + f * 97) % 1900) | 0;
					const hgt = 30 + ((i * 53 + f * 31) % 120);
					return <div key={i} style={{position: 'absolute', left: ((i * 37 + f * 59) % 300) - 150, top: y, width: 1300, height: hgt, background: ['#ff2a6a', '#2aff9a', '#2a8aff'][i % 3], opacity: 0.35 * u, mixBlendMode: 'screen'}} />;
				})}
			</AbsoluteFill>
		);
	if (fx === 'pixel') {
		const n = 12;
		return (
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				{Array.from({length: n * 21}).map((_, i) => {
					const cx = i % n;
					const cy = Math.floor(i / n);
					const th = ((cx * 7 + cy * 13) % 17) / 17;
					return th < u ? <div key={i} style={{position: 'absolute', left: cx * 90, top: cy * 92, width: 91, height: 93, background: '#0a0a10'}} /> : null;
				})}
			</AbsoluteFill>
		);
	}
	if (fx === 'flash') return <AbsoluteFill style={{background: '#ffffff', opacity: u * u * 0.9, pointerEvents: 'none'}} />;
	if (fx === 'crt') return <AbsoluteFill style={{background: '#000', opacity: u > 0.85 ? 1 : 0, pointerEvents: 'none'}} />;
	return null;
};

const ShotCanvas: React.FC<{def: ShotDef; dur: number; imgs: Imgs}> = ({def, dur, imgs}) => {
	const f = useCurrentFrame();
	const C = def.C;
	const kin = def.fxIn ? f / FX_LEN : 1;
	const kout = def.fxOut ? (dur - 1 - f) / FX_LEN : 1;
	const useOut = kout < kin;
	const style = useOut ? fxStyle(def.fxOut, kout, 'out', f) : fxStyle(def.fxIn, kin, 'in', f);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
			<AbsoluteFill style={style}>
				<ThreeCanvas width={W} height={H} shadows gl={{toneMapping: THREE.NeutralToneMapping}}>
					<C f={f} d={dur} imgs={imgs} {...(def.props ? def.props(def.from) : {})} />
				</ThreeCanvas>
			</AbsoluteFill>
			{useOut ? <Overlay fx={def.fxOut} k={kout} f={f} /> : <Overlay fx={def.fxIn} k={kin} f={f} />}
		</AbsoluteFill>
	);
};

// ---------------- Sound ----------------
type Cue = {t: number; file: string; vol?: number};
const at = (i: number, dt = 0) => L(i).s + dt;
const s2 = (i: number) => SHOTS[i].from / FPS;
const CUES: Cue[] = [
	{t: 0, file: 'bed_gta', vol: 0.32},
	...SHOTS.slice(1).map((s) => ({t: s.from / FPS, file: 'swish', vol: 0.09})),
	{t: 0, file: 'siren', vol: 0.4},
	{t: 1.0, file: 'crunch', vol: 0.7},
	{t: 1.0, file: 'hit', vol: 0.4},
	{t: word(0, 11).s, file: 'glitch', vol: 0.5},
	{t: at(1), file: 'rain', vol: 0.4},
	{t: at(1, 0.3), file: 'seagull', vol: 0.25},
	...[0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.6, 1.85, 2.1].map((x) => ({t: at(2, x), file: 'keys', vol: 0.35})),
	{t: word(2, 6).s + 0.1, file: 'clang', vol: 0.2},
	...[0.4, 0.9].map((x) => ({t: word(2, 6).s + x, file: 'step', vol: 0.35})),
	{t: at(3, 0.1), file: 'blip', vol: 0.3},
	...[0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1].map((x) => ({t: at(4, x), file: 'boing', vol: 0.18})),
	{t: at(4, 2.6), file: 'ding', vol: 0.3},
	{t: at(5, 0.45), file: 'snap', vol: 0.6},
	{t: word(6, 7).s, file: 'pop', vol: 0.5},
	{t: at(7, 0.1), file: 'crickets', vol: 0.35},
	{t: at(8, 0.1), file: 'yawn', vol: 0.45},
	{t: word(9, 2).s - 0.05, file: 'scratch', vol: 0.55},
	{t: word(9, 2).s, file: 'glitch', vol: 0.55},
	{t: at(10), file: 'siren', vol: 0.5},
	{t: word(10, 5).s, file: 'crunch', vol: 0.7},
	{t: word(10, 5).s + 0.05, file: 'skid', vol: 0.4},
	{t: at(11, 0.3), file: 'scribble', vol: 0.25},
	{t: at(12, 0.05), file: 'laughs', vol: 0.55},
	{t: word(12, 4).s + 0.4, file: 'clang', vol: 0.3},
	{t: at(13), file: 'siren', vol: 0.4},
	...[0.2, 0.7, 1.2].map((x) => ({t: at(13, x), file: 'crunch', vol: 0.35})),
	...[0, 0.3, 0.6, 0.9, 1.2].map((x) => ({t: at(14, x), file: 'tick', vol: 0.3})),
	{t: word(14, 9).s, file: 'unplug', vol: 0.7},
	{t: word(14, 9).s + 0.05, file: 'powerdown', vol: 0.5},
	{t: at(15, 0.15), file: 'powerup', vol: 0.4},
	{t: word(16, 6).s, file: 'snap', vol: 0.6},
	{t: word(16, 6).s + 0.2, file: 'fax', vol: 0.4},
	{t: at(17), file: 'paperspin', vol: 0.5},
	{t: at(17, 0.5), file: 'rustle', vol: 0.45},
	...[0.1, 0.5, 0.9].map((x) => ({t: at(18, x), file: 'thud', vol: 0.45})),
	{t: at(18, 0.1), file: 'murmur', vol: 0.35},
	{t: word(19, 3).s, file: 'whoosh', vol: 0.35},
	{t: word(19, 3).s + 0.4, file: 'register', vol: 0.5},
	{t: at(20, 0.1), file: 'cityamb', vol: 0.35},
	{t: at(20, 0.55), file: 'hit', vol: 0.3},
	{t: word(20, 7).s, file: 'neon', vol: 0.5},
	{t: at(21), file: 'riser', vol: 0.4},
	{t: word(21, 5).s, file: 'boom', vol: 0.45},
	{t: word(21, 5).s, file: 'cityamb', vol: 0.4},
	{t: at(22), file: 'waves', vol: 0.4},
	{t: at(23, 0.2), file: 'hydraulic', vol: 0.45},
	{t: at(23, 0.75), file: 'hydraulic', vol: 0.4},
	{t: at(24, 0.15), file: 'shutter', vol: 0.4},
	{t: at(24, 0.3), file: 'crowd', vol: 0.35},
	...Array.from({length: 14}).map((_, i) => ({t: at(24, 0.6 + i * 0.28), file: 'tick', vol: 0.25})),
	{t: word(24, 11).e, file: 'register', vol: 0.6},
	{t: word(24, 11).e, file: 'crowd', vol: 0.6},
	{t: at(25, 0.0), file: 'shutter', vol: 0.4},
	{t: at(25, 0.4), file: 'shutter', vol: 0.35},
	{t: at(25, 0.9), file: 'shutter', vol: 0.35},
	{t: at(26, 0.1), file: 'siren_far', vol: 0.25},
	{t: word(27, 0).s, file: 'boom', vol: 0.8},
	{t: word(27, 0).s + 0.25, file: 'passby', vol: 0.4},
	{t: at(28), file: 'waves', vol: 0.35},
	{t: at(28, 0.3), file: 'seagull', vol: 0.3},
	{t: at(28, 0.6), file: 'riser', vol: 0.3},
	{t: at(29), file: 'siren', vol: 0.45},
	{t: s2(32) + 26 / FPS, file: 'crunch', vol: 0.7},
	{t: s2(32) + 26 / FPS, file: 'boom', vol: 0.5},
];

const GOLD = new Set(['dundee', 'lemmings', "race'n'chase", 'rockstar', 'vice', 'san', 'andreas', 'billion', 'sixth', 'bug']);

export const GtaShort: React.FC = () => {
	const imgs = useShirts(SHIRTS) as Imgs | null;
	const font = useBlockFont();
	if (!imgs || !font) return null;
	const logoA = word(27, 0).s - 0.05;
	return (
		<AbsoluteFill style={{backgroundColor: '#000', filter: 'saturate(1.05) contrast(1.05)'}}>
			{SHOTS.map((s, i) => {
				const to = SHOTS[i + 1]?.from ?? GTA_FRAMES;
				return (
					<Sequence key={i} from={s.from} durationInFrames={to - s.from}>
						<ShotCanvas def={s} dur={to - s.from} imgs={imgs} />
					</Sequence>
				);
			})}
			<CaptionsFor timing={T} gold={GOLD} hide={[[logoA, L(27).e + 0.1]]} />
			<Audio src={staticFile('vo/gta.wav')} />
			{CUES.map((c, i) => (
				<Sequence key={`a${i}`} from={Math.max(0, Math.round(c.t * FPS))} layout="none">
					<Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol ?? 1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};

export {interpolate};
