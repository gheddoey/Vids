import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Pose} from '../Character';
import {BlockText, useBlockFont} from '../BlockText';
import {Key, add, breathe, onTwos, sample, walk} from '../anim';
import {CaptionsFor, Confetti, handOf} from '../lebron/common';
import {PS1Pass} from '../ps1/ps1';
import {B, Cyl} from '../ps1/sets';
import {Who} from '../lowpoly/Rig';
import {P, Person} from './cast';
import {
	AkronStreet,
	Arena,
	Backpack,
	Baby,
	Ball,
	Breakfast,
	Car,
	Classroom,
	Cover,
	DraftStage,
	Field,
	Football,
	Hospital,
	Kitchen,
	Locker,
	NewRoom,
	Newsstand,
	PhotoGym,
	Rooftop,
	SchoolSteps,
	Stairwell,
	Trophy,
	Tunnel,
} from './sets';
import timing from '../lebron/timing.json';

// LeBron remake, six rules: low-poly 64-px rigs, dense sets, PS1-HD look (vertex snap on a
// 360x640 grid, 3-px Bayer dither, vignette), a slice-open reveal, a new pose every sentence.

const FPS = 30;
const PI = Math.PI;
const T = timing as {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};
const sec = (s: number) => Math.round(s * FPS);
export const LEBRON2_FRAMES = sec(T.duration + 0.3);
const L = (i: number) => T.lines[i];
const W = (i: number, w: number) => L(i).words[w];
const cut = (s: number) => Math.max(0, sec(s) - 2);

type V3 = [number, number, number];
type ShotProps = {f: number; d: number; a: Record<string, number>};
type K = Omit<Key, 'face'> & {face?: string};

const pose = (keys: K[], f: number, phase = 0) => add(sample(keys as Key[], onTwos(f)), breathe(onTwos(f), phase)) as Partial<Pose> & {face?: string};
const pop = (f: number, at: number, stiff = 180) => Math.max(0.001, spring({frame: onTwos(f) - at, fps: FPS, config: {damping: 11, stiffness: stiff, mass: 0.6}}));
const flashAt = (f: number, hits: number[]) => Math.max(0, ...hits.map((h) => (f >= h && f < h + 6 ? 1 - (f - h) / 6 : 0)));
const hand = (p: Person, ps: Partial<Pose>, side: 'L' | 'R', at: V3) => handOf(ps, side, at, p.h);
const Man: React.FC<{p: Person; pose: Partial<Pose> & {face?: string}; at: V3; half?: -1 | 1}> = ({p, pose: ps, at, half}) => <Who look={p.look} h={p.h} pose={ps} at={at} half={half} />;

// Keyframed camera (moves on ones): [{f, p, t, fov}], eased in-out; optional decaying shake.
type CK = {f: number; p: V3; t: V3; fov?: number};
const Cam2: React.FC<{f: number; k: CK[]; shake?: {at: number; amp: number; len?: number}}> = ({f, k, shake}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	let i = 0;
	while (i < k.length - 1 && f >= k[i + 1].f) i++;
	const a = k[i];
	const b = k[Math.min(i + 1, k.length - 1)];
	const u = b.f === a.f ? 1 : Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, (f - a.f) / (b.f - a.f))));
	const mix = (x: V3, y: V3) => x.map((v, j) => v + (y[j] - v) * u) as V3;
	const pos = mix(a.p, b.p);
	if (shake && f >= shake.at && f < shake.at + (shake.len ?? 10)) {
		const s = 1 - (f - shake.at) / (shake.len ?? 10);
		pos[0] += Math.sin(f * 2.3) * shake.amp * s;
		pos[1] += Math.cos(f * 3.1) * shake.amp * 0.7 * s;
	}
	camera.position.set(...pos);
	camera.fov = (a.fov ?? 42) + ((b.fov ?? 42) - (a.fov ?? 42)) * u;
	camera.near = 0.1;
	camera.far = 300;
	camera.lookAt(...mix(a.t, b.t));
	camera.updateProjectionMatrix();
	return null;
};

// Falling snow (instanced little cubes, on twos).
const Snow: React.FC<{f: number; n?: number; area?: V3; center?: V3}> = ({f, n = 220, area = [24, 14, 14], center = [0, 0, -4]}) => {
	const geo = useMemo(() => new THREE.BoxGeometry(0.09, 0.09, 0.09), []);
	const mat = useMemo(() => new THREE.MeshBasicMaterial({color: '#f4f8ff'}), []);
	const seeds = useMemo(() => {
		let s = 3;
		const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
		return Array.from({length: n}, () => [r(), r(), r(), 0.04 + r() * 0.05]);
	}, [n]);
	const ref = React.useRef<THREE.InstancedMesh>(null);
	const ff = onTwos(f);
	React.useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		seeds.forEach(([a, b, c, v], i) => {
			const y = area[1] - ((b * area[1] + ff * v) % area[1]);
			m.makeTranslation(center[0] + (a - 0.5) * area[0] + Math.sin(ff * 0.05 + i) * 0.3, center[1] + y, center[2] + (c - 0.5) * area[2]);
			ref.current!.setMatrixAt(i, m);
		});
		ref.current!.instanceMatrix.needsUpdate = true;
	});
	return <instancedMesh ref={ref} args={[geo, mat, n]} />;
};

// ===================================================================================
// 0a  Calendar crossing off days, "80+" pops on "eighty"
const Attendance: React.FC<ShotProps> = ({f, a}) => {
	const crossed = Math.min(20, Math.floor(onTwos(f) / 2.2));
	const s = pop(f, a.eighty);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-3.6, 6.8, 1.2], t: [-4.8, 6.5, -6.9]}, {f: a.eighty + 6, p: [-3.4, 6.9, 0.4], t: [-4.6, 6.8, -6.9]}, {f: a.eighty + 20, p: [0.2, 5.2, 9.4], t: [0.4, 3.4, -1]}]} />
			<Classroom crossed={crossed} />
			<group position={[-4.6, 8.6, -6.2]} scale={s}>
				<BlockText text="80+" size={1.2} depth={0.35} color="#c83a3a" side="#7a1a1a" />
			</group>
		</>
	);
};

// 0b  The kid outside in the snow, looking up at us
const KidSnow: React.FC<ShotProps> = ({f}) => {
	const p = pose([{f: 0, face: 'sad', headX: 0.35, armRX: 0.1, armLX: 0.1}, {f: 8, headX: -0.15, face: 'serious', ease: 'back'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.4, 3.4, 3.2], t: [0, 2.8, -4]}, {f: 40, p: [0.2, 3.3, 2.4], t: [0, 2.9, -4]}]} />
			<AkronStreet lamps={0.2} />
			<Snow f={f} center={[0, 0, -4]} area={[10, 8, 8]} />
			<Man p={P.kid} pose={p} at={[0, 0, -4]} />
		</>
	);
};

// 1  Gloria (16) with baby LeBron, 1984
const Mom: React.FC<ShotProps> = ({f}) => {
	const seat = 2.05;
	const sit = {y: seat / P.mom.h - 2, legLX: -PI / 2, legRX: -PI / 2};
	const p = pose([{f: 0, ...sit, armRX: -1.15, armLX: -1.15, armRZ: 0.42, armLZ: -0.42, headX: 0.45, face: 'smile'}, {f: 22, headX: 0.4}, {f: 30, headX: -0.05, face: 'proud', ease: 'back'}], f);
	const at: V3 = [1.2, 0, 0.3];
	const hR = hand(P.mom, p, 'R', at);
	const hL = hand(P.mom, p, 'L', at);
	const nurse = pose([{f: 0, rotY: -2.2, armRX: -1.4, armRZ: 0.2, face: 'smile', headX: -0.1}, {f: 30, armRX: -1.1}], f, 2);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3.8, 5.0, 12.5], t: [1.8, 3.2, -0.6]}, {f: 60, p: [3.2, 4.6, 11], t: [1.6, 3.0, -0.4]}]} />
			<Hospital beep={f % 15 < 3 ? 1 : 0} />
			<Man p={P.mom} pose={p} at={at} />
			<group position={[(hR.x + hL.x) / 2, (hR.y + hL.y) / 2 + 0.25, (hR.z + hL.z) / 2]} rotation={[0, PI / 2, 0]} scale={0.75}>
				<Baby />
			</group>
			<Man p={P.nurse} pose={nurse} at={[5.2, 0, -1.4]} />
		</>
	);
};

// 2  "No dad." Kid alone at the table, looks at the empty chair
const NoDad: React.FC<ShotProps> = ({f}) => {
	const seat = 1.45;
	const p = pose([{f: 0, rotY: PI / 2, y: seat / P.kid.h - 2, legLX: -PI / 2, legRX: -PI / 2, armRX: -1.3, armLX: -1.3, headY: 0, face: 'serious'}, {f: 6, headY: 0.05, headX: 0.2, face: 'sad'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [4.4, 4.0, 9.5], t: [-0.2, 2.4, -0.6]}, {f: 24, p: [3.8, 3.8, 8.4], t: [-0.4, 2.4, -0.6]}]} />
			<Kitchen />
			<Man p={P.kid} pose={p} at={[-1.6, 0, -0.6]} />
		</>
	);
};

// 3  "No stable home." Kid carries a box bigger than him
const Boxes: React.FC<ShotProps> = ({f}) => {
	const p = pose([...(walk(0, 40, [-3, 0.4], [0.6, 0.4], 8, false) as K[]), {f: 0, armRX: -1.25, armLX: -1.25, armRZ: 0.25, armLZ: -0.25, lean: -0.08, face: 'serious', rotY: PI / 2 - 0.3}], f);
	const at: V3 = [0, 0, 0];
	const hR = hand(P.kid, p, 'R', at);
	const hL = hand(P.kid, p, 'L', at);
	const flick = [2, 3, 9, 14, 15, 30, 31].includes(Math.floor(f / 2)) ? 0.15 : 1;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-0.8, 4.2, 10.5], t: [-1, 2.4, 0]}, {f: 40, p: [0.2, 4.0, 9.8], t: [0.4, 2.4, 0]}]} />
			<Stairwell flicker={flick} />
			<Man p={P.kid} pose={p} at={at} />
			<group position={[(hR.x + hL.x) / 2 + 0.2, (hR.y + hL.y) / 2 + 0.55, (hR.z + hL.z) / 2]} rotation={[0, p.rotY ?? 0, 0]}>
				<B size={[1.5, 1.2, 1.3]} color="#c89a5a" />
				<B size={[1.52, 0.12, 0.3]} pos={[0, 0.6, 0]} color="#d8c8a0" shadow={false} />
			</group>
		</>
	);
};

// 4a  "They kept moving" — car loaded with boxes drives past at dusk
const Moving: React.FC<ShotProps> = ({f, d}) => {
	const x = interpolate(f, [0, d], [-16, 16]);
	const kid = pose([{f: 0, face: 'sad', y: -0.4, headY: -0.6}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-6, 3.0, 13], t: [-4, 2.4, 0]}, {f: d, p: [6, 3.0, 13], t: [4, 2.4, 0]}]} />
			<AkronStreet lamps={interpolate(f, [0, d], [0, 0.6])} />
			<group position={[x, 0, 0]}>
				<Car c="#4a6a8a" boxes />
				<group position={[-1.0, 0.7, -0.4]} scale={0.6}>
					<Who look={P.kid.look} h={1} pose={kid} />
				</group>
			</group>
		</>
	);
};

// 4b  "nobody expected anything from him" — neighbours turn their backs
const Nobody: React.FC<ShotProps> = ({f, d}) => {
	const kid = pose([{f: 0, face: 'serious', rotY: PI, headY: 0}, {f: 14, headY: 0.4}, {f: 26, rotY: PI - 0.3, headY: -0.3, face: 'sad'}], f);
	const nb = (i: number) => pose([{f: 0, rotY: 0, face: 'serious'}, {f: 6 + i * 4, rotY: PI, ease: 'snap'}], f, i);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3.6, 3.4, 5], t: [0, 3.4, -11]}, {f: d, p: [3.3, 3.5, 4.2], t: [0, 3.6, -11]}]} />
			<AkronStreet lamps={0.7} />
			<Man p={P.kid} pose={kid} at={[2.5, 0, -4.8]} />
			<Man p={P.teacher} pose={nb(0)} at={[-8, 0.4, -11.4]} />
			<Man p={P.photog} pose={nb(1)} at={[-0.8, 0.4, -11.4]} />
			<Man p={P.nurse} pose={nb(2)} at={[7.4, 0.4, -11.4]} />
		</>
	);
};

// 5  Coach Walker kneels and hands him a football
const Coach: React.FC<ShotProps> = ({f, d, a}) => {
	const coachAt: V3 = [1.7, 0, 0];
	const kidAt: V3 = [-1.3, 0, 0.6];
	const coach = pose([{f: 0, rotY: -0.7, face: 'smile', y: 0}, {f: 6, y: -0.95, legRX: -PI / 2, legLX: 0.25, lean: 0.15, armRX: -0.3, ease: 'back'}, {f: a.take - 6, armRX: -1.35, armRZ: 0.1}, {f: a.take + 6, armRX: -0.4, face: 'grin'}], f);
	const kid = pose([{f: 0, rotY: 0.7, face: 'serious', armRX: 0, headX: 0.15}, {f: a.take - 4, armRX: 0}, {f: a.take + 2, armRX: -1.3, armRZ: -0.2, ease: 'snap'}, {f: a.take + 8, face: 'grin', headX: -0.05}, {f: a.take + 14, armRX: -0.9}], f, 1);
	const taken = onTwos(f) >= a.take + 2;
	const h = taken ? hand(P.kid, kid, 'R', kidAt) : hand(P.coach, coach, 'R', coachAt);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.4, 4.2, 13.5], t: [0.2, 2.8, 0]}, {f: d, p: [0.2, 3.8, 12], t: [0, 2.6, 0]}]} />
			<Field />
			<Man p={P.coach} pose={coach} at={coachAt} />
			<Man p={P.kid} pose={kid} at={kidAt} />
			<group position={[h.x, h.y + 0.15, h.z + 0.15]} rotation={[0.3, 0.6, 0]}>
				<Football />
			</group>
		</>
	);
};

// 6a  "Gave him a room," — drops the backpack, looks around
const Room: React.FC<ShotProps> = ({f}) => {
	const p = pose([{f: 0, face: 'shock', armRX: -0.3, armRZ: 0.3, headY: -0.4}, {f: 8, armRX: 0.2, armRZ: 0.6, ease: 'snap'}, {f: 14, headY: 0.4, face: 'grin'}], f);
	const at: V3 = [-0.6, 0, 0.4];
	const hR = hand(P.kid, p, 'R', at);
	const dropped = onTwos(f) >= 8;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-1.4, 4.6, 11], t: [0.4, 2.6, -1.4]}, {f: 30, p: [-1.0, 4.4, 10], t: [0.4, 2.6, -1.4]}]} />
			<NewRoom />
			<Man p={P.kid} pose={p} at={at} />
			{dropped ? <Backpack pos={[-1.9, 0, 0.8]} c="#2a5aa8" rot={0.6} /> : <Backpack pos={[hR.x, hR.y - 1.0, hR.z - 0.2]} c="#2a5aa8" />}
		</>
	);
};

// 6b  "a routine," — breakfast at the Walkers', star on the calendar
const Routine: React.FC<ShotProps> = ({f}) => {
	const sit = (p: Person, seat: number) => ({y: seat / p.h - 2, legLX: -PI / 2, legRX: -PI / 2});
	const kid = pose([{f: 0, rotY: PI / 2, ...sit(P.kid, 1.45), armRX: -1.6, face: 'grin', headX: 0.2}, ...[4, 8, 12, 16].map((k, i) => ({f: k, armRX: i % 2 ? -1.6 : -2.2}))], f);
	const wk = pose([{f: 0, rotY: -PI / 2, ...sit(P.walkerKid, 1.45), armRX: -1.2, armLX: -1.2, face: 'smile'}], f, 2);
	const pam = pose([{f: 0, face: 'smile', armRX: -1.3, armRZ: 0.2, lean: 0.15, headX: 0.25}], f, 1);
	const pamAt: V3 = [0.2, 0, -3.8];
	const h = hand(P.pam, pam, 'R', pamAt);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 5.4, 11], t: [0, 3, -1.4]}, {f: 20, p: [0.4, 5.2, 10.2], t: [0, 3, -1.4]}]} />
			<Breakfast />
			<Man p={P.kid} pose={kid} at={[-3.6, 0, -1.4]} />
			<Man p={P.walkerKid} pose={wk} at={[3.6, 0, -1.4]} />
			<Man p={P.pam} pose={pam} at={pamAt} />
			<group position={[h.x, h.y + 0.4, h.z + 0.2]}>
				<Cyl r={0.3} h={0.9} seg={6} color="#ffa83a" rot={[0.6, 0, 0]} />
			</group>
		</>
	);
};

// 6c  "and a reason to show up." — off the bus, first up the steps
const ShowUp: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([...(walk(4, d, [1.5, 1], [0.4, -8.2], 6) as K[]), {f: 0, rotY: PI, face: 'grin'}, {f: d - 8, headY: 0}, {f: d - 2, headY: 0.9}], f);
	const busX = interpolate(f, [0, 10], [-20, -9.5], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [6, 4.4, 9], t: [0.4, 2.6, -3]}, {f: d, p: [5, 5, 7.6], t: [0.2, 3.2, -6]}]} />
			<SchoolSteps busX={busX} />
			<Man p={P.kid} pose={{...p, y: (p.y ?? 0) + Math.max(0, Math.min(2, (-(p.z ?? 0) - 6.4) * 0.42))}} at={[0, 0, 0]} />
		</>
	);
};

// 7  Photo shoot: a new pose on every flash
const Shoot: React.FC<ShotProps> = ({f, a}) => {
	const hits = [a.f1, a.f2, a.f3];
	const p = pose(
		[
			{f: 0, face: 'serious', armRX: -0.6, armLX: -0.6, armRZ: 0.3, armLZ: -0.3},
			{f: a.f1 - 2, armRX: -2.6, armRZ: -0.2, armLX: 0, armLZ: 0.2, ease: 'snap'},
			{f: a.f2 - 2, armRX: -1.4, armRZ: 0.6, armLX: -1.4, armLZ: -0.6, face: 'smug', headX: 0.1, ease: 'snap'},
			{f: a.f3 - 2, armRX: -0.3, armRZ: -0.3, armLX: -2.9, armLZ: 0.3, face: 'proud', headY: 0.25, ease: 'snap'},
		],
		f,
	);
	const at: V3 = [0, 0, -2];
	const ballHand = onTwos(f) >= a.f3 - 2 ? 'L' : 'R';
	const h = hand(P.teen, p, ballHand, at);
	const fl = flashAt(onTwos(f), hits);
	const ph = pose([{f: 0, rotY: PI - 0.5, armRX: -1.6, armLX: -1.6, headX: 0.1, face: 'serious'}], f, 2);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-2.4, 4.6, 11], t: [0, 3.4, -2]}, {f: a.f3 + 10, p: [-1.6, 4.4, 9.4], t: [0, 3.6, -2]}]} shake={{at: a.f1, amp: 0.05, len: 6}} />
			<PhotoGym flash={fl} />
			<Man p={P.teen} pose={p} at={at} />
			<group position={[h.x, h.y + (ballHand === 'R' && onTwos(f) >= a.f1 - 2 && onTwos(f) < a.f2 - 2 ? 0.5 : 0.05), h.z + 0.2]}>
				<Ball r={0.42} />
			</group>
			<Man p={P.photog} pose={ph} at={[3.6, 0, 4.4]} />
		</>
	);
};

// 8  Newsstand: push into the cover, "THE CHOSEN ONE" lands
const Chosen: React.FC<ShotProps> = ({f, d, a}) => {
	const chosen = onTwos(f) >= a.chosen;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.6, 4.6, 7], t: [0, 4.4, -4.6]}, {f: a.chosen, p: [0.1, 4.45, -1.6], t: [0, 4.4, -4.6]}, {f: d, p: [0, 4.42, -2.0], t: [0, 4.38, -4.6]}]} shake={{at: a.chosen, amp: 0.04, len: 8}} />
			<Newsstand />
			<group position={[0, 4.4, -4.6]} rotation={[-0.2, 0, 0]}>
				<Cover chosen={chosen} />
			</group>
		</>
	);
};

// 9  "Eighteen." Draft night: stands up from the table in the white suit
const Eighteen: React.FC<ShotProps> = ({f}) => {
	const seat = 1.6;
	const p = pose([{f: 0, y: seat / P.draft.h - 2, legLX: -PI / 2, legRX: -PI / 2, armRX: -1.2, armLX: -1.2, face: 'serious', lean: 0.1}, {f: 4, lean: 0.35, ease: 'in'}, {f: 10, y: 0, legLX: 0, legRX: 0, lean: -0.05, armRX: 0.1, armLX: 0.1, face: 'shock', ease: 'back'}], f);
	const mom = pose([{f: 0, y: seat / P.mom.h - 2, legLX: -PI / 2, legRX: -PI / 2, rotY: 0.6, armRX: -1.5, armLX: -1.5, face: 'grin'}, {f: 10, armRX: -2.6, armLX: -2.6, ease: 'back'}], f, 2);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-11.6, 3.8, 12], t: [-12.6, 3.0, 0]}, {f: 20, p: [-11.8, 4.6, 12.6], t: [-12.6, 4.0, 0]}]} />
			<DraftStage flash={0} pick={false} />
			<Man p={P.draft} pose={p} at={[-11.6, 0, 1.6]} />
			<Man p={P.mom} pose={mom} at={[-14.4, 0, 0.6]} />
		</>
	);
};

// 10  "First pick in the NBA Draft." Handshake on stage, #1, flashes
const Pick: React.FC<ShotProps> = ({f, a}) => {
	const hits = [a.pick, a.pick + 6, a.pick + 14, a.pick + 20];
	const p = pose([{f: 0, rotY: 0.5, armRX: -1.3, armRZ: 0.1, face: 'grin'}, {f: a.pick, rotY: 0.2, armLX: -2.4, armLZ: 0.2, ease: 'back'}], f);
	const o = pose([{f: 0, rotY: -0.5, armRX: -1.3, armRZ: -0.1, face: 'smile'}], f, 1);
	const pAt: V3 = [-1.2, 1, -3.0];
	const hL = hand(P.draft, p, 'L', pAt);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.6, 6.2, 13], t: [0, 5, -3]}, {f: 50, p: [0.2, 5.4, 11], t: [0, 5.6, -4]}]} shake={{at: a.pick, amp: 0.08}} />
			<DraftStage flash={flashAt(onTwos(f), hits)} pick={onTwos(f) >= a.pick} />
			<Man p={P.draft} pose={p} at={pAt} />
			<Man p={P.official} pose={o} at={[1.3, 1, -3.0]} />
			{/* wine-and-gold cap (no logo) held up */}
			<group position={[hL.x, hL.y + 0.3, hL.z]}>
				<B size={[0.8, 0.4, 0.8]} color="#6f263d" />
				<B size={[0.7, 0.06, 0.4]} pos={[0, -0.18, 0.5]} color="#ffb81c" />
			</group>
		</>
	);
};

const Board: React.FC<{big: string; small?: string; color: string; sub?: string}> = ({big, small, color, sub}) => (
	<group>
		{small ? <BlockText text={small} size={0.5} depth={0.08} color="#e8e8f0" emissive={1} position={[0, 1.5, 0.1]} /> : null}
		<BlockText text={big} size={1.5} depth={0.2} color={color} emissive={1.4} position={[0, -0.1, 0.1]} />
		{sub ? <BlockText text={sub} size={0.4} depth={0.06} color="#e8e8f0" emissive={1} position={[0, -1.6, 0.1]} /> : null}
	</group>
);

// 11a  Down 3-1: locker room, head down
const Down: React.FC<ShotProps> = ({f}) => {
	const seat = 1.75;
	const p = pose([{f: 0, y: seat / P.finals.h - 2, legLX: -PI / 2 + 0.2, legRX: -PI / 2 + 0.2, lean: 0.45, armRX: -0.9, armLX: -0.9, armRZ: 0.25, armLZ: -0.25, headX: 0.55, face: 'sad'}, {f: 40, headX: 0.65}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [1.2, 4.2, 11], t: [0, 2.8, -1.6]}, {f: 44, p: [0.8, 3.8, 9.6], t: [0, 2.8, -1.6]}]} />
			<Locker />
			<Man p={P.finals} pose={p} at={[0, 0, -1.3]} />
		</>
	);
};

// 11b  "...against a seventy-three-win team." Looks up at the 3-1 board; they celebrate
const ThreeOne: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([{f: 0, headX: 0.3, face: 'sad', armRX: 0.05}, {f: 8, headX: -0.55, face: 'serious', ease: 'out'}], f);
	const o = (i: number) => pose([{f: 0, rotY: 0.3 * (i ? -1 : 1), armRX: -2.8, armLX: -2.8, armRZ: -0.3, armLZ: 0.3, face: 'grin'}, ...[6, 12, 18].map((k) => ({f: k + i * 3, y: k % 12 ? 0.6 : 0}))], f, i);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [2.4, 2.6, 14], t: [0, 7.5, -6]}, {f: d, p: [1.8, 2.4, 12.6], t: [0, 9.5, -7]}]} />
			<Arena cols={['#1d428a', '#ffc72c']} floorC="#1d428a" banner="73-9" board={<Board small="SERIES" big="3-1" color="#ffc72c" sub="FINALS" />} />
			<Man p={P.opp1} pose={o(0)} at={[-3.6, 0, -6]} />
			<Man p={P.opp2} pose={o(1)} at={[4, 0, -7.5]} />
			<Man p={P.finals} pose={p} at={[0, 0, 2]} />
		</>
	);
};

// 12  "He won." Arms up, confetti, the trophy
const Won: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([{f: 0, face: 'shock', armRX: -0.5, armLX: -0.5}, {f: 4, y: 0.7, armRX: -3.0, armLX: -3.0, armRZ: -0.3, armLZ: 0.3, face: 'grin', ease: 'back'}, {f: 12, y: 0}, {f: 20, headX: -0.3}], f);
	const a = onTwos(f) * 0.02;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [Math.sin(-0.3) * 13.5, 4.4, Math.cos(-0.3) * 13.5], t: [1, 4.0, 0]}, {f: d, p: [Math.sin(0.4) * 12.5, 4.2, Math.cos(0.4) * 12.5], t: [1, 4.2, 0]}]} shake={{at: 4, amp: 0.12, len: 12}} />
			<Arena cols={['#6f263d', '#ffb81c']} floorC="#6f263d" flash={a > 0 ? 0.3 : 0} board={<Board small="CHAMPIONS" big="4-3" color="#ffb81c" />} />
			<Confetti frame={f} n={140} area={[18, 16, 10]} y0={16} cols={['#ffb81c', '#ffffff', '#6f263d', '#ffd84a']} />
			<Man p={P.finals} pose={p} at={[0, 0, 0]} />
			<group position={[3.2, 0, -1.4]}>
				<B size={[1.4, 1.8, 1.4]} pos={[0, 0.9, 0]} color="#1a1a22" />
				<group position={[0, 1.8, 0]} scale={1.1}>
					<Trophy />
				</group>
			</group>
		</>
	);
};

// 13a  "Twenty years later…" the counter rolls toward 38,388
const Count: React.FC<ShotProps> = ({f, d, a}) => {
	const n = Math.round(interpolate(onTwos(f), [0, a.lead], [38100, 38388], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
	const txt = `${Math.floor(n / 1000)},${String(n % 1000).padStart(3, '0')}`;
	const p = pose([{f: 0, face: 'serious', armRX: -0.3, armLX: -0.3, headX: -0.35, rotY: PI}, {f: a.lead, face: 'proud'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 4, 6], t: [0, 15, -6]}, {f: d, p: [0, 5, 3], t: [0, 16.5, -7]}]} />
			<Arena cols={['#552583', '#fdb927']} floorC="#552583" board={<Board small="ALL-TIME" big={txt} color="#fdb927" sub="POINTS" />} />
			<Man p={P.record} pose={p} at={[0.6, 0, -2]} />
		</>
	);
};

// 13b  "…leading scorer in NBA history." Fadeaway, swish
const Fadeaway: React.FC<ShotProps> = ({f, d}) => {
	const rel = 6;
	const p = pose(
		[
			{f: 0, rotY: PI + 0.3, armRX: -1.2, armLX: -1.2, face: 'serious'},
			{f: 3, y: -0.3, lean: 0.15, ease: 'in'},
			{f: rel, y: 1.2, lean: -0.35, armRX: -2.9, armLX: -2.6, legRX: -0.4, ease: 'out'},
			{f: rel + 10, y: 0, lean: 0, armRX: -2.2, armLX: -0.4, legRX: 0, face: 'proud', ease: 'in'},
		],
		f,
	);
	const at: V3 = [1.2, 0, -5];
	const h0 = hand(P.record, pose([{f: 0, rotY: PI + 0.3, y: 1.2, lean: -0.35, armRX: -2.9, armLX: -2.6}], rel), 'R', at);
	const t = Math.min(1, Math.max(0, (onTwos(f) - rel) / 16));
	const hoop = new THREE.Vector3(0, 10, -17.6);
	const ballPos = onTwos(f) < rel ? hand(P.record, p, 'R', at) : new THREE.Vector3(h0.x + (hoop.x - h0.x) * t, h0.y + (hoop.y - h0.y) * t + Math.sin(t * PI) * 4, h0.z + (hoop.z - h0.z) * t);
	if (t >= 1) ballPos.y = 10 - Math.min(3, (onTwos(f) - rel - 16) * 0.35);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [7.5, 4.2, 8], t: [0.6, 5.5, -10]}, {f: d, p: [6.4, 4.6, 6.4], t: [0.2, 7, -12]}]} shake={{at: rel + 16, amp: 0.1}} />
			<Arena cols={['#552583', '#fdb927']} floorC="#552583" flash={t >= 1 ? 0.4 : 0} board={<Board small="ALL-TIME" big="38,388" color="#fdb927" sub="POINTS" />} />
			<Man p={P.record} pose={p} at={at} />
			<group position={[ballPos.x, ballPos.y, ballPos.z]}>
				<Ball r={0.42} />
			</group>
		</>
	);
};

// 14  "Then he played alongside his own son." Side by side, fist bump on "son"
const Son: React.FC<ShotProps> = ({f, a}) => {
	const dad = pose([{f: 0, face: 'smile', rotY: 0.25, armRX: 0}, {f: a.son - 4, armRX: -1.4, armRZ: -0.55, rotY: 0.45, ease: 'back'}, {f: a.son + 6, face: 'grin'}], f);
	const kid = pose([{f: 0, face: 'smile', rotY: -0.25, armLX: 0}, {f: a.son - 4, armLX: -1.4, armLZ: 0.55, rotY: -0.45, ease: 'back'}, {f: a.son + 6, face: 'grin'}], f, 1);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 4.6, 12.5], t: [0, 3.6, 0]}, {f: a.son + 10, p: [0, 4.4, 10.5], t: [0, 3.8, 0]}]} shake={{at: a.son, amp: 0.05, len: 6}} />
			<Arena cols={['#552583', '#fdb927']} floorC="#552583" board={<Board big="23-9" color="#fdb927" sub="FATHER + SON" />} />
			<Man p={P.record} pose={dad} at={[-1.55, 0, 0]} />
			<Man p={P.bronny} pose={kid} at={[1.55, 0, 0]} />
		</>
	);
};

// 15  SLICE IT OPEN (rule 5): the man splits like a nesting doll; the kid is inside
const Slice: React.FC<ShotProps> = ({f, d, a}) => {
	const ff = onTwos(f);
	const at: V3 = [1, 0, 2.4];
	const laser = interpolate(ff, [a.cut - 8, a.cut], [6.6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const open = interpolate(ff, [a.open, a.open + 8], [0, 1.25], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
	const man = pose([{f: 0, face: 'serious', armRX: 0, armLX: 0}, {f: a.open, face: 'shock'}], f);
	const kid = pose([{f: 0, face: 'serious'}, {f: a.open + 6, face: 'grin', armRX: -2.6, armRZ: -0.2, ease: 'back'}], f, 1);
	const s = pop(f, a.label);
	const from = [3.0, 6.4];
	const to = [1.3, 3.3];
	const len = Math.hypot(from[0] - to[0], from[1] - to[1]);
	const ang = Math.atan2(from[1] - to[1], from[0] - to[0]);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [1.6, 4.6, 16], t: [1.4, 3.8, 2.4]}, {f: d, p: [1.5, 4.6, 17.5], t: [1.6, 4.2, 2.4]}]} shake={{at: a.open, amp: 0.1}} />
			<Classroom crossed={20} />
			{open > 0 ? (
				<>
					<group position={[at[0] - open, at[1], at[2]]} rotation={[0, 0, open * 0.06]}>
						<Who look={P.record.look} h={P.record.h} pose={man} half={-1} />
					</group>
					<group position={[at[0] + open, at[1], at[2]]} rotation={[0, 0, -open * 0.06]}>
						<Who look={P.record.look} h={P.record.h} pose={man} half={1} />
					</group>
					<Man p={P.kid} pose={kid} at={at} />
				</>
			) : (
				<Man p={P.record} pose={man} at={at} />
			)}
			{ff >= a.cut - 8 && ff < a.open + 2 ? (
				<group position={[at[0], 0, at[2] + 0.7]}>
					<B size={[0.05, 6.8 - laser, 0.05]} pos={[0, laser + (6.8 - laser) / 2, 0]} color="#ff2a2a" glow={4} shadow={false} />
					<B size={[0.4, 0.4, 0.4]} pos={[0, laser, 0]} color="#ff6a6a" glow={4} shadow={false} />
					<pointLight position={[0, laser, 0.5]} color="#ff3a3a" intensity={6} distance={5} />
				</group>
			) : null}
			{ff >= a.label ? (
				<group>
					<group position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, at[2] + 0.4]} rotation={[0, 0, ang]} scale={[s, 1, 1]}>
						<B size={[len, 0.08, 0.08]} color="#f8f4e8" glow={0.6} shadow={false} />
					</group>
					<group position={[2.6, 7.3, at[2] + 0.4]} scale={s}>
						<BlockText text="THE KID" size={0.5} depth={0.14} color="#ffd84a" side="#a8781a" />
						<BlockText text="FROM AKRON" size={0.5} depth={0.14} color="#ffd84a" side="#a8781a" position={[0, -0.65, 0]} />
					</group>
				</group>
			) : null}
		</>
	);
};

// 16  Rooftop over the street: silence, then the name lands
const Name: React.FC<ShotProps> = ({f, d, a}) => {
	const kid = pose([{f: 0, face: 'serious', rotY: 0.2, headY: 0.3}, {f: a.name, face: 'grin', headY: 0, armRX: -0.3, ease: 'snap'}], f, 1);
	const man = pose([{f: 0, face: 'proud', rotY: -0.2, headY: -0.3, armRX: 0}, {f: a.name, headY: 0, armRX: -0.5, armRZ: 0.6, ease: 'snap'}], f);
	const drop = interpolate(onTwos(f), [a.name - 2, a.name + 4], [9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.4, 13.6, 18.5], t: [0, 13.4, 3]}, {f: d, p: [0.2, 13.8, 17.2], t: [0, 13.8, 3]}]} shake={{at: a.name + 4, amp: 0.25, len: 12}} />
			<Rooftop />
			<Man p={P.kid} pose={kid} at={[-1.7, 9, 4.6]} />
			<Man p={P.record} pose={man} at={[1.5, 9, 4.6]} />
			{onTwos(f) >= a.name - 2 ? (
				<group position={[0, 17.4 + drop, 3.4]}>
					<BlockText text="LEBRON" size={1.0} depth={0.4} color="#ffc72c" side="#a8781a" />
					<BlockText text="JAMES" size={1.0} depth={0.4} color="#ffc72c" side="#a8781a" position={[0, -1.3, 0]} />
				</group>
			) : null}
		</>
	);
};

// 17  "And he's still not done." Walks to the light, looks back
const NotDone: React.FC<ShotProps> = ({f, d, a}) => {
	const p = pose([...(walk(0, d, [0, 0], [0, -6], 8) as K[]), {f: 0, rotY: PI, face: 'serious'}, {f: a.look - 4, headY: 0}, {f: a.look + 2, headY: -1.1, twist: -0.4, face: 'smug', ease: 'back'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.9, 4.8, 9], t: [0, 3.8, -8]}, {f: d, p: [0.5, 4.4, 5.5], t: [0, 3.8, -12]}]} />
			<Tunnel />
			<Man p={P.record} pose={p} at={[0, 0, 0]} />
		</>
	);
};

// ---------------- Shot list ----------------

type ShotDef = {from: number; C: React.FC<ShotProps>; a?: (from: number) => Record<string, number>; fx?: {snap?: number; levels?: number}};
const rel = (from: number, t: number) => sec(t) - from;
const SHOTS: ShotDef[] = [
	{from: 0, C: Attendance, a: (fr) => ({eighty: rel(fr, W(0, 5).s)})},
	{from: cut(W(0, 8).s), C: KidSnow},
	{from: cut(L(1).s), C: Mom},
	{from: cut(L(2).s), C: NoDad},
	{from: cut(L(3).s), C: Boxes},
	{from: cut(L(4).s), C: Moving},
	{from: cut(W(4, 4).s), C: Nobody},
	{from: cut(L(5).s), C: Coach, a: (fr) => ({take: rel(fr, W(5, 5).s)})},
	{from: cut(L(6).s), C: Room},
	{from: cut(W(6, 4).s), C: Routine},
	{from: cut(W(6, 6).s), C: ShowUp},
	{from: cut(L(7).s), C: Shoot, a: (fr) => ({f1: rel(fr, W(7, 2).s), f2: rel(fr, W(7, 6).s), f3: rel(fr, W(7, 8).s)})},
	{from: cut(L(8).s), C: Chosen, a: (fr) => ({chosen: rel(fr, W(8, 1).s)})},
	{from: cut(L(9).s), C: Eighteen},
	{from: cut(L(10).s), C: Pick, a: (fr) => ({pick: rel(fr, W(10, 1).s)})},
	{from: cut(L(11).s), C: Down},
	{from: cut(W(11, 5).s), C: ThreeOne},
	{from: cut(L(12).s), C: Won},
	{from: cut(L(13).s), C: Count, a: (fr) => ({lead: rel(fr, W(13, 6).s)})},
	{from: cut(W(13, 6).s), C: Fadeaway},
	{from: cut(L(14).s), C: Son, a: (fr) => ({son: rel(fr, W(14, 6).s)})},
	{from: cut(L(15).s), C: Slice, a: (fr) => ({cut: rel(fr, W(15, 1).s), open: rel(fr, W(15, 3).s), label: rel(fr, W(15, 4).s)})},
	{from: cut(L(16).s), C: Name, a: (fr) => ({name: rel(fr, W(16, 3).s)})},
	{from: cut(L(17).s), C: NotDone, a: (fr) => ({look: rel(fr, W(17, 3).s)})},
];

const ShotCanvas: React.FC<{def: ShotDef; dur: number}> = ({def, dur}) => {
	const f = useCurrentFrame();
	const C = def.C;
	return (
		<ThreeCanvas width={1080} height={1920} shadows="basic" dpr={1} gl={{antialias: true}}>
			<C f={f} d={dur} a={def.a ? def.a(def.from) : {}} />
			<PS1Pass snap={def.fx?.snap ?? 1} levels={def.fx?.levels ?? 16} />
		</ThreeCanvas>
	);
};

// ---------------- Sound ----------------

type Cue = {t: number; file: string; vol?: number};
const nameT = W(16, 3).s;
const CUES: Cue[] = [
	{t: 0, file: 'bed_lebron2', vol: 0.34},
	...SHOTS.slice(1).map((s) => ({t: s.from / FPS, file: 'swish', vol: 0.1})),
	...[0.1, 0.35, 0.6, 0.85, 1.1, 1.35].map((x) => ({t: x, file: 'scribble', vol: 0.18})),
	{t: W(0, 5).s, file: 'ding', vol: 0.25},
	{t: W(0, 8).s, file: 'wind', vol: 0.35},
	...[0, 0.5, 1.0, 1.5].map((x) => ({t: L(1).s + 0.05 + x, file: 'beep', vol: 0.22})),
	{t: L(2).s, file: 'hum', vol: 0.35},
	{t: L(3).s, file: 'buzz', vol: 0.3},
	...[0.15, 0.42, 0.69].map((x) => ({t: L(3).s + x, file: 'step', vol: 0.3})),
	{t: L(4).s, file: 'engine', vol: 0.35},
	{t: W(4, 4).s, file: 'wind', vol: 0.3},
	{t: L(5).s + 0.05, file: 'whistle', vol: 0.25},
	{t: W(5, 5).s, file: 'thud', vol: 0.3},
	{t: L(6).s + 0.3, file: 'thud', vol: 0.35},
	{t: W(6, 4).s + 0.05, file: 'pour', vol: 0.3},
	{t: W(6, 6).s, file: 'brakes', vol: 0.35},
	{t: W(6, 8).s, file: 'bell', vol: 0.3},
	...[2, 6, 8].map((w) => ({t: W(7, w).s, file: 'shutter', vol: 0.45})),
	{t: W(8, 1).s, file: 'boom', vol: 0.35},
	{t: L(9).s, file: 'crowd', vol: 0.2},
	{t: W(10, 1).s, file: 'crowd', vol: 0.45},
	...[0, 0.2, 0.47, 0.67].map((x) => ({t: W(10, 1).s + x, file: 'shutter', vol: 0.35})),
	{t: L(11).s, file: 'tension', vol: 0.3},
	{t: W(11, 5).s, file: 'crowd', vol: 0.3},
	{t: L(12).s - 0.05, file: 'buzzer', vol: 0.45},
	{t: L(12).s + 0.05, file: 'crowd', vol: 0.6},
	{t: L(12).s + 0.2, file: 'firework', vol: 0.4},
	...[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((x) => ({t: L(13).s + 0.1 + x, file: 'tick', vol: 0.3})),
	{t: W(13, 6).s + 0.3, file: 'whoosh', vol: 0.3},
	{t: W(13, 6).s + 0.8, file: 'netswish', vol: 0.65},
	{t: W(13, 6).s + 0.85, file: 'crowd', vol: 0.55},
	{t: W(14, 6).s - 0.1, file: 'hit', vol: 0.35},
	{t: L(14).s, file: 'crowd', vol: 0.25},
	{t: W(15, 1).s - 0.3, file: 'laser', vol: 0.45},
	{t: W(15, 3).s, file: 'thud', vol: 0.45},
	{t: W(15, 4).s, file: 'ding', vol: 0.3},
	{t: nameT - 1.0, file: 'riser', vol: 0.3},
	{t: nameT, file: 'boom', vol: 0.85},
	{t: L(17).s, file: 'crowd', vol: 0.3},
	...[0.1, 0.37, 0.64, 0.91].map((x) => ({t: L(17).s + x, file: 'step', vol: 0.25})),
];

export const LeBron2: React.FC = () => {
	const font = useBlockFont();
	if (!font) return null;
	return (
		<AbsoluteFill style={{backgroundColor: '#000', filter: 'saturate(1.06) contrast(1.05)'}}>
			{SHOTS.map((s, i) => {
				const to = SHOTS[i + 1]?.from ?? LEBRON2_FRAMES;
				return (
					<Sequence key={i} from={s.from} durationInFrames={to - s.from}>
						<ShotCanvas def={s} dur={to - s.from} />
					</Sequence>
				);
			})}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
			<CaptionsFor timing={T} />
			<Audio src={staticFile('vo/lebron.wav')} />
			{CUES.map((c, i) => (
				<Sequence key={`a${i}`} from={Math.max(0, Math.round(c.t * FPS))} layout="none">
					<Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol ?? 1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
