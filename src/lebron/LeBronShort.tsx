import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useShirts} from '../Lineup';
import {Hat} from '../Hats';
import {RBox} from '../parts';
import {Key, onTwos, walk} from '../anim';
import {Actor, Ball, CAST, Cam, Captions, Confetti, Football, H, PI, SHIRTS, T, TOTAL, W, handOf, poseAt, sec} from './common';
import {Arena, Classroom, CoverStudio, DraftStage, Gym, Room, Scoreboard, Street} from './sets';

type Imgs = Record<string, HTMLImageElement>;
type ShotProps = {f: number; d: number; imgs: Imgs};

const L = (i: number) => T.lines[i];
const KID = 0.72;
const flashAt = (f: number, hits: number[]) => Math.max(0, ...hits.map((h) => (f >= h && f < h + 5 ? 1 - (f - h) / 5 : 0)));
// Ball bouncing between the floor and a hand, on twos.
const dribble = (f: number, hand: THREE.Vector3, period = 12) => {
	const ph = (onTwos(f) % period) / period;
	const y = 0.36 + (hand.y - 0.5 - 0.36) * Math.abs(Math.cos(ph * PI));
	return new THREE.Vector3(hand.x, y, hand.z + 0.15);
};

// ---------------- Shots ----------------

// "This kid…" — the hook: a kid at dusk looks up at us.
const KidClose: React.FC<ShotProps & {look?: boolean}> = ({f, d, imgs}) => {
	const pose = poseAt([{f: 0, headX: 0.35, face: 'serious'}, {f: 6, headX: 0, ease: 'snap'}], f);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.45, 3.85, 3.4]} p1={[0.3, 3.75, 2.7]} t0={[0, 3.4, -1]} t1={[0, 3.45, -1]} fov={40} />
			<Street time="dusk" />
			<Actor c={CAST.kid} img={imgs[CAST.kid.shirt]} pose={pose} at={[0, 0.25, -1]} scale={KID} />
		</>
	);
};

// "…missed more than eighty days of school…" — an empty desk, the calendar filling with X's.
const EmptyDesk: React.FC<ShotProps> = ({f, d}) => {
	const crossed = Math.floor(interpolate(onTwos(f), [4, d - 6], [0, 35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.4, 3.6, 8]} p1={[1.8, 4.6, 3.6]} t0={[0.4, 2.6, 0]} t1={[2.9, 4.9, -2.7]} fov={46} />
			<Classroom crossed={crossed} />
		</>
	);
};

// "His mom was sixteen when she had him."
const Mom: React.FC<ShotProps> = ({f, d, imgs}) => {
	const keys: Key[] = [
		{f: 0, armLX: -1.25, armRX: -1.25, armLZ: -0.35, armRZ: 0.35, headX: 0.38, rotY: 0.2, face: 'smile'},
		{f: 24, headX: 0.38},
		{f: 34, headX: 0.05, ease: 'out'},
	];
	const pose = poseAt(keys, f, 1);
	const at: [number, number, number] = [0.4, 0, 0.6];
	const hL = handOf(pose, 'L', at, 0.95);
	const hR = handOf(pose, 'R', at, 0.95);
	const mid = hL.clone().add(hR).multiplyScalar(0.5);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.9, 4.6, 7.6]} p1={[0.6, 4.4, 6.2]} t0={[0.4, 3.6, 0.6]} t1={[0.4, 3.7, 0.6]} fov={40} />
			<Room lamp={1} />
			<Actor c={CAST.mom} img={imgs[CAST.mom.shirt]} pose={pose} at={at} scale={0.95} />
			{/* Baby in a blanket */}
			<group position={[mid.x, mid.y + 0.02, mid.z + 0.25]} rotation={[0, 0.2, 0]}>
				<RBox size={[1.0, 0.55, 0.6]} color="#f2c8d8" />
				<RBox size={[0.42, 0.42, 0.42]} pos={[0.55, 0.12, 0]} color="#6b4430" />
				<RBox size={[0.5, 0.2, 0.5]} pos={[0.6, 0.38, 0]} color="#f2c8d8" />
			</group>
		</>
	);
};

// "No dad." — the empty chair.
const NoDad: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam frame={f} dur={d} p0={[3.0, 3.8, 6.8]} p1={[2.3, 3.4, 5.4]} t0={[0.6, 2.2, 1.3]} t1={[0.6, 2.2, 1.3]} fov={38} />
		<Room lamp={0.55} table />
	</>
);

// "No stable home." — packed boxes, the kid holding one.
const Boxes: React.FC<ShotProps> = ({f, d, imgs}) => {
	const pose = poseAt([{f: 0, armLX: -1.2, armRX: -1.2, armLZ: -0.25, armRZ: 0.25, headX: 0.3, face: 'serious', rotY: -0.2}], f, 2);
	const at: [number, number, number] = [1.2, 0, 1.2];
	const mid = handOf(pose, 'L', at, KID).add(handOf(pose, 'R', at, KID)).multiplyScalar(0.5);
	return (
		<>
			<Cam frame={f} dur={d} p0={[2.0, 3.4, 7.0]} p1={[1.5, 3.1, 5.6]} t0={[0.2, 2.0, 0]} t1={[0.4, 2.1, 0]} fov={42} />
			<Room lamp={0.6} boxes />
			<Actor c={CAST.kid} img={imgs[CAST.kid.shirt]} pose={pose} at={at} scale={KID} />
			<RBox size={[0.9, 0.7, 0.7]} pos={[mid.x, mid.y + 0.25, mid.z + 0.15]} color="#c79c66" />
		</>
	);
};

// "They kept moving, and nobody expected anything from him."
const Moving: React.FC<ShotProps> = ({f, d, imgs}) => {
	const carry = {armLX: -1.25, armRX: -1.25, armLZ: -0.3, armRZ: 0.3};
	const momKeys: Key[] = [{f: 0, rotY: -PI / 2, face: 'serious', headX: 0.1, ...carry}, ...walk(0, d, [6 / 0.95, 0], [-6 / 0.95, 0], 10, false)];
	const kidKeys: Key[] = [{f: 0, rotY: -PI / 2, face: 'serious', headX: 0.25, ...carry}, ...walk(0, d, [4.4 / KID, 0], [-6.6 / KID, 0], 8, false)];
	const momP = poseAt(momKeys, f, 1);
	const kidP = poseAt(kidKeys, f, 2);
	const momAt: [number, number, number] = [0, 0.25, -2.0];
	const kidAt: [number, number, number] = [0, 0.25, 0.2];
	const box = (p: typeof momP, at: [number, number, number], s: number) => {
		const m = handOf(p, 'L', at, s).add(handOf(p, 'R', at, s)).multiplyScalar(0.5);
		return <RBox size={[1.1 * s, 0.9 * s, 1.1 * s]} pos={[m.x, m.y + 0.3 * s, m.z]} color="#c79c66" />;
	};
	return (
		<>
			<Cam frame={f} dur={d} p0={[3.4, 4.0, 10]} p1={[-3.6, 3.8, 10]} t0={[3.0, 2.8, -1]} t1={[-3.4, 2.8, -1]} fov={42} />
			<Street time="dusk" />
			<Actor c={CAST.mom} img={imgs[CAST.mom.shirt]} pose={momP} at={momAt} scale={0.95} />
			{box(momP, momAt, 0.95)}
			<Actor c={CAST.kid} img={imgs[CAST.kid.shirt]} pose={kidP} at={kidAt} scale={KID} />
			{box(kidP, kidAt, KID)}
		</>
	);
};

// "Then a youth football coach took him in."
const Coach: React.FC<ShotProps> = ({f, d, imgs}) => {
	const coachKeys: Key[] = [
		{f: 0, rotY: PI / 2, face: 'smile', armLX: 0, armLZ: 0, armRX: -0.5},
		...walk(0, 20, [-6.5, 0.2], [-2.7, 0.2], 8, false),
		{f: 20, rotY: PI / 2},
		{f: 28, rotY: 0.55, ease: 'out'},
		{f: 30, armLX: 0, armLZ: 0},
		{f: 40, armLX: -0.55, armLZ: 0.55, headX: 0.15, ease: 'back'},
	];
	const kidKeys: Key[] = [
		{f: 0, rotY: -0.3, face: 'serious', headX: 0.25, headY: 0},
		{f: 22, headX: 0.25, headY: 0},
		{f: 30, headX: -0.3, headY: -0.6, ease: 'snap'},
		{f: 42, face: 'serious'},
		{f: 43, face: 'smile'},
	];
	const cP = poseAt(coachKeys, f, 3);
	const kP = poseAt(kidKeys, f, 2);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.2, 3.8, 9.5]} p1={[0.3, 3.5, 8.0]} t0={[-0.6, 3.0, -1]} t1={[-0.4, 3.0, -1]} fov={42} />
			<Street time="dusk" />
			<group position={[0, 0.25, -1]}>
				<group>
					<Actor c={{...CAST.coach}} img={imgs[CAST.coach.shirt]} pose={cP} />
				</group>
			</group>
			<group position={[0, 0.25, -1]}>
				{/* Football in the coach's right hand */}
				{(() => {
					const h = handOf(cP, 'R');
					return (
						<group position={[h.x, h.y - 0.1, h.z + 0.1]}>
							<Football />
						</group>
					);
				})()}
			</group>
			<Actor c={CAST.kid} img={imgs[CAST.kid.shirt]} pose={kP} at={[0.6, 0.25, -0.6]} scale={KID} />
		</>
	);
};

// "Gave him a room,"
const NewRoom: React.FC<ShotProps> = ({f, d, imgs}) => {
	const lamp = interpolate(onTwos(f), [2, 8], [0.15, 1.1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const pose = poseAt([{f: 0, face: 'serious', armLZ: 0, armRZ: 0, rotY: 0.3}, {f: 8, face: 'smile', armLZ: 0.45, armRZ: -0.45, ease: 'back'}], f, 1);
	return (
		<>
			<Cam frame={f} dur={d} p0={[1.4, 3.8, 8.6]} p1={[1.1, 3.6, 7.4]} t0={[0.2, 2.7, 0.6]} t1={[0.2, 2.8, 0.6]} fov={44} />
			<Room lamp={lamp} bed />
			<Actor c={CAST.kid} img={imgs[CAST.kid.shirt]} pose={pose} at={[0.9, 0, 1.6]} scale={KID} />
		</>
	);
};

// "a routine," — morning, backpack on, off to school.
const Routine: React.FC<ShotProps> = ({f, d, imgs}) => {
	const keys: Key[] = [{f: 0, rotY: PI / 2, face: 'smile'}, ...walk(0, d, [-3.5 / KID, 0], [3.5 / KID, 0], 8)];
	const pose = poseAt(keys, f, 2);
	const x = (pose.x ?? 0) * KID;
	return (
		<>
			<Cam frame={f} dur={d} p0={[-2.2, 3.4, 7.5]} p1={[2.2, 3.4, 7.5]} t0={[-2.0, 2.4, -1]} t1={[2.0, 2.4, -1]} fov={42} />
			<Street time="morning" />
			<Actor c={CAST.kid} img={imgs[CAST.kid.shirt]} pose={pose} at={[0, 0.25 + (pose.y ?? 0) * 0, -0.6]} scale={KID} />
			{/* Backpack */}
			<RBox size={[0.55, 1.0, 1.3]} pos={[x - 0.62, 0.25 + 2.9 * KID + (pose.y ?? 0) * KID, -0.6]} color="#c0392b" />
		</>
	);
};

// "and a reason to show up." — dribbling in the gym.
const GymDribble: React.FC<ShotProps> = ({f, d, imgs}) => {
	const pose = poseAt([{f: 0, face: 'serious', lean: 0.18, armRX: -0.5, armRZ: -0.15, legLX: -0.2, legRX: 0.2, rotY: 0.15}], f, 1);
	const at: [number, number, number] = [0, 0, 0];
	const ball = dribble(f, handOf(pose, 'R', at, 0.82), 12);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.8, 3.0, 7.4]} p1={[0.5, 2.8, 6.0]} t0={[0, 3.6, -1.5]} t1={[0, 3.8, -1.5]} fov={46} />
			<Gym />
			<Actor c={CAST.kid} img={imgs[CAST.kid.shirt]} pose={pose} at={at} scale={0.82} />
			<group position={ball}>
				<Ball r={0.3} />
			</group>
		</>
	);
};

// "At sixteen, he was on the cover…" — "The Chosen One."
const Cover: React.FC<ShotProps & {chosenF: number}> = ({f, d, imgs, chosenF}) => {
	const keys: Key[] = [
		{f: 0, face: 'serious', armLX: -0.7, armLZ: 0.45, armRX: -0.15, armRZ: -0.55, headY: 0.25, rotY: -0.15},
		{f: 18, headY: 0.25},
		{f: 24, headY: 0, ease: 'snap'},
		{f: chosenF - 4, armRX: -0.15, armRZ: -0.55},
		{f: chosenF + 2, armRX: -2.95, armRZ: -0.15, face: 'smug', headX: -0.12, ease: 'back'},
	];
	const pose = poseAt(keys, f, 1);
	const hL = handOf(pose, 'L');
	const flash = flashAt(f, [4, 16, 34, 52, 70, 90, chosenF, chosenF + 6, chosenF + 14]);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 6.6, 16]} p1={[0, 6.0, 12.2]} t0={[0, 6.2, 0]} t1={[0, 5.8, 0]} fov={44} shake={{at: chosenF, amp: 0.18, len: 8}} />
			<CoverStudio chosen={f >= chosenF} flash={flash} />
			<Actor c={CAST.teen} img={imgs[CAST.teen.shirt]} pose={pose} />
			<group position={[hL.x + 0.1, hL.y + 0.15, hL.z + 0.2]}>
				<Ball />
			</group>
		</>
	);
};

// "Eighteen. First pick in the NBA Draft."
const Draft: React.FC<ShotProps & {pickF: number}> = ({f, d, imgs, pickF}) => {
	const keys: Key[] = [
		{f: 0, rotY: PI / 2, face: 'smile', armRX: 0},
		...walk(0, 22, [-4.5, 0], [-0.4, 0], 8),
		{f: 22, rotY: PI / 2},
		{f: 30, rotY: 0.1, ease: 'out'},
		{f: pickF - 4, armRX: 0, armRZ: 0},
		{f: pickF + 4, armRX: -2.9, armRZ: -0.25, face: 'grin', ease: 'back'},
	];
	const pose = poseAt(keys, f, 2);
	const at: [number, number, number] = [0, 0.82, 0];
	const hR = handOf(pose, 'R', at);
	const showCap = f >= pickF - 4;
	const flash = flashAt(f, [pickF, pickF + 5, pickF + 12, pickF + 20, pickF + 30, pickF + 44]);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 5.6, 15.5]} p1={[0, 5.2, 12.0]} t0={[0, 5.4, 0]} t1={[0, 5.6, 0]} fov={44} />
			<DraftStage pick={f >= pickF} flash={flash} />
			<Actor c={CAST.draft} img={imgs[CAST.draft.shirt]} pose={pose} at={at} />
			{showCap ? (
				<group position={[hR.x, hR.y - 0.3, hR.z]} scale={0.85}>
					<Hat type="cap" color="#1c2a4a" accent="#ffffff" />
				</group>
			) : null}
		</>
	);
};

// "Down three games to one in the Finals, against a seventy-three-win team."
const Finals: React.FC<ShotProps> = ({f, d, imgs}) => {
	const pose = poseAt([{f: 0, face: 'serious', lean: 0.2, armRX: -0.55, armRZ: -0.2, armLX: -0.5, armLZ: 0.5, legLX: -0.25, legRX: 0.25, headX: -0.05}], f, 1);
	const ball = dribble(f, handOf(pose, 'R'), 14);
	const opp = (sign: number, c: typeof CAST.opp1) => (
		<Actor c={c} img={imgs[c.shirt]} pose={poseAt([{f: 0, rotY: PI, lean: 0.15, armLZ: sign * 0.7, armRZ: -sign * 0.7, face: 'squint'}], f, sign)} at={[sign * 3.9, 0, 4.6]} />
	);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.3, 3.8, 13]} p1={[0.2, 3.7, 11]} t0={[0, 5.6, 0]} t1={[0, 5.4, 0]} fov={52} />
			<Arena team="#6f263d" board={<Scoreboard top="THE FINALS" big="1 – 3" sub="vs. A 73–9 TEAM" />} />
			<Actor c={CAST.finals} img={imgs[CAST.finals.shirt]} pose={pose} />
			<group position={ball}>
				<Ball />
			</group>
			{/* Defenders, seen from behind */}
			<group>{opp(-1, {...CAST.opp1})}</group>
			<group>{opp(1, {...CAST.opp2})}</group>
		</>
	);
};

// "He won."
const Won: React.FC<ShotProps> = ({f, d, imgs}) => {
	const pose = poseAt(
		[
			{f: 0, face: 'serious', armLX: 0, armRX: 0, y: 0, lean: 0.1},
			{f: 6, face: 'grin', armLX: -2.9, armRX: -2.9, armLZ: 0.35, armRZ: -0.35, y: 0.8, lean: -0.15, headX: -0.25, ease: 'back'},
			{f: 18, y: 0.3},
		],
		f,
		1,
	);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 2.8, 11]} p1={[0, 2.7, 9.6]} t0={[0, 5.8, 0]} t1={[0, 6.0, 0]} fov={52} shake={{at: 4, amp: 0.15, len: 8}} />
			<Arena team="#ffb81c" flash={flashAt(f, [4, 10])} board={<Scoreboard top="THE FINALS" big="4 – 3" sub="CHAMPIONS" />} />
			<Actor c={CAST.finals} img={imgs[CAST.finals.shirt]} pose={pose} />
			<Confetti frame={f + 20} />
		</>
	);
};

// "Twenty years later, he became the leading scorer in NBA history."
const Record: React.FC<ShotProps & {scoreF: number}> = ({f, d, imgs, scoreF}) => {
	const at: [number, number, number] = [2.2, 0, 1.5];
	const releaseF = scoreF - 18;
	const keys: Key[] = [
		{f: 0, rotY: -2.87, face: 'serious', armLX: -1.1, armRX: -1.1, armLZ: -0.3, armRZ: 0.3, y: 0, lean: 0.1},
		{f: releaseF - 14, y: 0, lean: 0.1},
		{f: releaseF - 6, y: -0.35, lean: 0.25, legLX: -0.3, legRX: 0.3, ease: 'out'},
		{f: releaseF, y: 1.1, lean: -0.25, armLX: -2.9, armRX: -2.9, armLZ: -0.1, armRZ: 0.1, legLX: 0.2, legRX: -0.1, headX: -0.2, ease: 'out'},
		{f: releaseF + 14, y: 0, lean: 0, legLX: 0, legRX: 0, ease: 'in'},
		{f: scoreF, face: 'serious'},
		{f: scoreF + 2, face: 'grin', armLX: -1.5, armRX: -0.3, armLZ: 0.6, headX: 0, ease: 'back'},
	];
	const pose = poseAt(keys, f, 1);
	const hands = handOf(pose, 'L', at).add(handOf(pose, 'R', at)).multiplyScalar(0.5);
	const rim = new THREE.Vector3(0, 10, -6.5);
	let ball: THREE.Vector3;
	const ff = onTwos(f);
	if (ff < releaseF) ball = hands.clone().add(new THREE.Vector3(0, 0.35, 0));
	else if (ff < scoreF) {
		const relHand = (() => {
			const p = poseAt(keys, releaseF, 1);
			return handOf(p, 'L', at).add(handOf(p, 'R', at)).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.4, 0));
		})();
		const u = (ff - releaseF) / (scoreF - releaseF);
		ball = relHand.clone().lerp(rim.clone().add(new THREE.Vector3(0, 0.4, 0)), u);
		ball.y += Math.sin(u * PI) * 4.2;
	} else {
		const u = Math.min(1, (ff - scoreF) / 14);
		ball = new THREE.Vector3(0, 10.2 - u * u * 9.8, -6.5 + u * 1.2);
	}
	const points = ff >= scoreF ? '38,388' : '38,384';
	return (
		<>
			<Cam frame={f} dur={d} p0={[1.8, 4.2, 11.5]} p1={[1.6, 4.6, 10.0]} t0={[1.2, 6.0, -2.2]} t1={[1.0, 6.6, -2.4]} fov={58} />
			<Arena
				team="#552583"
				flash={flashAt(f, [scoreF, scoreF + 6])}
				board={<Scoreboard top="ALL-TIME POINTS" big={points} sub={ff >= scoreF ? 'NEW ALL-TIME LEADER' : ''} accent="#fdb927" />}
			/>
			<Actor c={CAST.record} img={imgs[CAST.record.shirt]} pose={pose} at={at} />
			<group position={ball}>
				<Ball />
			</group>
		</>
	);
};

// "Then he played alongside his own son."
const Son: React.FC<ShotProps> = ({f, d, imgs}) => {
	const bump = Math.round(d * 0.6);
	const dadKeys: Key[] = [{f: 0, face: 'smile'}, ...walk(0, bump - 4, [-1.9, -5], [-1.9, 0.5], 10), {f: bump - 6, armLX: 0, armLZ: 0}, {f: bump, armLX: -1.0, armLZ: -0.75, headY: 0.4, ease: 'back'}];
	const sonKeys: Key[] = [{f: 0, face: 'smile'}, ...walk(0, bump - 4, [1.9, -5], [1.9, 0.5], 10), {f: bump - 6, armRX: 0, armRZ: 0}, {f: bump, armRX: -1.0, armRZ: 0.75, headY: -0.4, ease: 'back'}];
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 5.4, 16]} p1={[0, 5.2, 13]} t0={[0, 4.8, -2]} t1={[0, 4.8, 0]} fov={50} />
			<Arena team="#552583" board={<Scoreboard top="FIRST TIME EVER" big="FATHER & SON" accent="#fdb927" />} />
			<Actor c={CAST.dad} img={imgs[CAST.dad.shirt]} pose={poseAt(dadKeys, f, 1)} />
			<Actor c={CAST.son} img={imgs[CAST.son.shirt]} pose={poseAt(sonKeys, f, 2)} scale={0.97} />
		</>
	);
};

// "His name is… LeBron James." — the kid, then the man, in the same framing.
const Reveal: React.FC<ShotProps & {nameF: number}> = ({f, d, imgs, nameF}) => {
	if (f < nameF) {
		const pose = poseAt([{f: 0, headX: 0.3, face: 'serious'}, {f: nameF - 10, headX: 0.3}, {f: nameF - 2, headX: 0, ease: 'snap'}], f);
		return (
			<>
				<Cam frame={f} dur={nameF} p0={[0.25, 3.7, 1.9]} p1={[0.15, 3.68, 1.55]} t0={[0, 3.6, -1]} t1={[0, 3.6, -1]} fov={40} />
				<Street time="dusk" />
				<Actor c={CAST.kid} img={imgs[CAST.kid.shirt]} pose={pose} at={[0, 0.25, -1]} scale={KID} />
			</>
		);
	}
	const g = f - nameF;
	const pose = poseAt([{f: 0, headY: 0.5, face: 'serious'}, {f: 6, headY: 0, face: 'smug', ease: 'snap'}], g);
	return (
		<>
			<Cam frame={g} dur={d - nameF} p0={[0.45, 4.95, 4.8]} p1={[0.3, 4.9, 4.0]} t0={[0, 4.55, 0]} t1={[0, 4.6, 0]} fov={40} shake={{at: 0, amp: 0.12, len: 10}} />
			<Arena team="#552583" flash={flashAt(g, [0])} />
			<Actor c={CAST.dad} img={imgs[CAST.dad.shirt]} pose={pose} />
		</>
	);
};

// "And he's still not done." — walks toward us, ball under his arm.
const NotDone: React.FC<ShotProps> = ({f, d, imgs}) => {
	const keys: Key[] = [{f: 0, face: 'smug', armRX: -0.5, armRZ: 0.35, armLX: 0}, ...walk(0, d, [0, -6], [0, 1.0], 10, false)];
	const pose = poseAt(keys, f, 1);
	const hR = handOf(pose, 'R');
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.6, 4.4, 9.5]} p1={[0.3, 4.6, 8.0]} t0={[0, 4.2, -2]} t1={[0, 4.6, 0]} fov={44} />
			<Arena team="#552583" board={<Scoreboard top="SEASON" big="23" sub="AND COUNTING" accent="#fdb927" />} />
			<Actor c={CAST.dad} img={imgs[CAST.dad.shirt]} pose={pose} />
			<group position={[hR.x - 0.2, hR.y + 0.45, hR.z]}>
				<Ball />
			</group>
		</>
	);
};

// ---------------- Edit ----------------

const cut = (t: number) => Math.max(0, sec(t) - 2);
const roomEnd = L(6).words[3].e;
const routineEnd = L(6).words[5].e;
const kidEnd = L(0).words[1].e;
const nameT = L(16).words.find((w) => /LeBron/.test(w.w))!.s;

type ShotDef = {from: number; C: React.FC<any>; extra?: (from: number) => Record<string, number>};
const SHOTS: ShotDef[] = [
	{from: 0, C: KidClose},
	{from: cut(kidEnd + 0.05), C: EmptyDesk},
	{from: cut(L(1).s), C: Mom},
	{from: cut(L(2).s), C: NoDad},
	{from: cut(L(3).s), C: Boxes},
	{from: cut(L(4).s), C: Moving},
	{from: cut(L(5).s), C: Coach},
	{from: cut(L(6).s), C: NewRoom},
	{from: cut(roomEnd + 0.1), C: Routine},
	{from: cut(routineEnd + 0.1), C: GymDribble},
	{from: cut(L(7).s), C: Cover, extra: (from) => ({chosenF: sec(L(8).s) - from})},
	{from: cut(L(9).s), C: Draft, extra: (from) => ({pickF: sec(L(10).s) - from})},
	{from: cut(L(11).s), C: Finals},
	{from: cut(L(12).s), C: Won},
	{from: cut(L(13).s), C: Record, extra: (from) => ({scoreF: sec(L(13).words[6].s) - from})},
	{from: cut(L(14).s), C: Son},
	{from: cut(L(15).s), C: KidClose},
	{from: cut(L(16).s), C: Reveal, extra: (from) => ({nameF: sec(nameT) - from})},
	{from: cut(L(17).s), C: NotDone},
];

const ShotCanvas: React.FC<{def: ShotDef; dur: number; imgs: Imgs}> = ({def, dur, imgs}) => {
	const f = useCurrentFrame();
	const C = def.C;
	return (
		<ThreeCanvas width={W} height={H} shadows>
			<C f={f} d={dur} imgs={imgs} {...(def.extra ? def.extra(def.from) : {})} />
		</ThreeCanvas>
	);
};

// ---------------- Sound ----------------

type Cue = {t: number; file: string; vol?: number; src?: string};
const CUES: Cue[] = [
	{t: 0, file: 'bed', vol: 0.32},
	...SHOTS.slice(1).map((s) => ({t: s.from / 30, file: 'swish', vol: 0.12})),
	{t: L(2).s, file: 'hit', vol: 0.5},
	{t: L(3).s + 0.2, file: 'thud', vol: 0.5},
	...[0, 0.33, 0.66, 1.0, 1.33, 1.66, 2.0, 2.33].map((x) => ({t: L(4).s + x, file: 'step', vol: 0.3})),
	{t: L(6).s + 0.12, file: 'click', vol: 0.5},
	{t: roomEnd + 0.08, file: 'alarm', vol: 0.3},
	...[0.15, 0.55, 0.95].map((x) => ({t: routineEnd + 0.06 + x, file: 'bounce', vol: 0.45})),
	...[0.13, 0.53, 1.13, 1.73, 2.33, 3.0].map((x) => ({t: L(7).s + x, file: 'shutter', vol: 0.4})),
	{t: L(8).s, file: 'notice', vol: 0.6},
	{t: L(10).s, file: 'crowd', vol: 0.35},
	...[0, 0.17, 0.4, 0.67].map((x) => ({t: L(10).s + x, file: 'shutter', vol: 0.35})),
	{t: L(11).s, file: 'tension', vol: 0.3},
	...[0.1, 0.57, 1.03, 1.5, 1.97, 2.43, 2.9, 3.37].map((x) => ({t: L(11).s + x, file: 'bounce', vol: 0.4})),
	{t: L(12).s - 0.05, file: 'buzzer', vol: 0.45},
	{t: L(12).s + 0.05, file: 'crowd', vol: 0.55},
	{t: L(13).words[6].s - 0.6, file: 'whoosh', vol: 0.35},
	{t: L(13).words[6].s, file: 'netswish', vol: 0.7},
	{t: L(13).words[6].s + 0.05, file: 'crowd', vol: 0.5},
	{t: L(14).s, file: 'crowd', vol: 0.25},
	{t: nameT - 1.3, file: 'riser', vol: 0.35},
	{t: nameT, file: 'boom', vol: 0.8},
	{t: L(17).s + 0.2, file: 'bounce', vol: 0.35},
];

export const LeBronShort: React.FC = () => {
	const imgs = useShirts(SHIRTS) as Imgs | null;
	if (!imgs) return null;
	return (
		<AbsoluteFill style={{backgroundColor: '#000', filter: 'saturate(1.06) contrast(1.05)'}}>
			{SHOTS.map((s, i) => {
				const to = SHOTS[i + 1]?.from ?? TOTAL;
				return (
					<Sequence key={i} from={s.from} durationInFrames={to - s.from}>
						<ShotCanvas def={s} dur={to - s.from} imgs={imgs} />
					</Sequence>
				);
			})}
			<Captions />
			<Audio src={staticFile('vo/lebron.wav')} />
			{CUES.map((c, i) => (
				<Sequence key={`a${i}`} from={Math.max(0, Math.round(c.t * 30))} layout="none">
					<Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol ?? 1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
