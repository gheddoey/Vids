import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {BlockText, useBlockFont} from '../BlockText';
import {onTwos, walk} from '../anim';
import {CaptionsFor, handOf} from '../lebron/common';
import {PS1Pass} from '../ps1/ps1';
import {B, Cyl} from '../ps1/sets';
import {Who} from '../lowpoly/Rig';
import {CineGrade, CinePreset} from '../cine/Cine';
import {Cam2, K, pop, pose} from '../lebron2/LeBron2';
import {life} from '../escobar/kit';
import {P, Person} from './cast';
import {Briefcase, Bundle, CloudDeck, Jet727, PI, Rain, Tie, V3, flashAt, tx} from './kit';
import {Apron, Cabin727, Cockpit, EvidenceTable, FbiOffice, Forest, Newsroom, StormSky, Tarmac, TenaBar, TicketHall} from './sets';
import timing from './timing.json';

// D.B. Cooper (Nov 24, 1971): six rules, 1971 jet-age noir, living sets, smooth transitions.
// Facts: docs/dbcooper/02-research.md. Nobody was hurt; the bomb is shown as it was described.

const FPS = 30;
const T = timing as {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};
const sec = (s: number) => Math.round(s * FPS);
export const DBCOOPER_FRAMES = sec(T.duration + 0.5);
const L = (i: number) => T.lines[i];
const W = (i: number, w: number) => L(i).words[w];
type ShotProps = {f: number; d: number; a: Record<string, number>; g: number};

const Man: React.FC<{p: Person; pose: object; at: V3; f: number; ph?: number; calm?: number; holdR?: React.ReactNode; holdL?: React.ReactNode; half?: -1 | 1}> = ({p, pose: ps, at, f, ph = 0, calm = 1, holdR, holdL, half}) => (
	<Who look={p.look} h={p.h} pose={life(ps as {face?: string}, f, ph, calm)} at={at} holdR={holdR} holdL={holdL} half={half} />
);
const hand = (p: Person, ps: object, side: 'L' | 'R', at: V3) => handOf(ps, side, at, p.h);
const sit = (p: Person, seat: number) => ({y: seat / p.h - 2, legLX: -PI / 2, legRX: -PI / 2});
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// The jet in flight, with the aft airstair; Cooper's stair position (distance d down the stair).
const STAIR_HINGE: V3 = [0, -3.8, -31];
const onStair = (d: number, stair = 1): V3 => {
	const a = -stair * 0.95;
	return [0, STAIR_HINGE[1] + Math.sin(a) * d + 0.35, STAIR_HINGE[2] - Math.cos(a) * d];
};
const MoneyBag: React.FC = () => (
	<group>
		<B size={[0.9, 1.1, 0.7]} pos={[0, 0, 0]} color="#8a7a5a" />
		<B size={[0.7, 0.3, 0.5]} pos={[0, 0.65, 0]} color="#7a6a4a" />
		<B size={[0.15, 0.15, 0.6]} pos={[0, 0.96, 0]} color="#3a2a1e" />
	</group>
);

// ---------------- shots ----------------

// 1  Cold open: the aft stairs at 10,000 ft, in a storm. He steps off on "dollars".
const Hook: React.FC<ShotProps> = ({f, d, a}) => {
	const at = onStair(9.2);
	const jumped = onTwos(f) >= a.jump;
	const fall = Math.max(0, onTwos(f) - a.jump);
	const p = pose(
		[
			{f: 0, rotY: PI, face: 'serious', armRX: -0.6, armRZ: -0.5, armLX: -0.4, headX: 0.3},
			{f: a.storm - 6, headY: 0.5, headX: 0.1},
			{f: a.jump - 6, lean: 0.25, armRX: -0.2, armLX: -0.2, headY: 0, headX: 0.4, ease: 'inOut'},
			{f: a.jump, lean: 0.6, armRX: -2.4, armLX: -2.4, armRZ: -0.8, armLZ: 0.8, legLX: -0.5, ease: 'back'},
		],
		f,
	);
	const pos: V3 = [at[0], at[1] - fall * fall * 0.04, at[2] - fall * 0.5];
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [26, -18, -70], t: [0, -4, -36], fov: 46}, {f: a.jump, p: [15, -14, -56], t: [0, -9, -38], fov: 42}, {f: d, p: [14, -15, -55], t: [0, -13, -40], fov: 42}]} shake={{at: 0, amp: 0.12, len: d}} />
			<StormSky f={f} strikes={[a.storm]} />
			<Jet727 f={f} stair={1} />
			<Man p={P.cooper} pose={p} at={pos} f={f} calm={0.2} holdL={jumped ? undefined : <group position={[0, -0.6, 0.5]} rotation={[0.3, 0, 0]}><MoneyBag /></group>} />
			<Rain f={f} n={350} center={[6, -10, -50]} size={[40, 30, 50]} wind={[0, -0.5, 3.2]} len={1.8} op={0.3} />
		</>
	);
};

// 2  "He was never seen again." Straight down off the end of the stair: the figure sinks into cloud.
const Down: React.FC<ShotProps> = ({f, d}) => {
	const y = interpolate(f, [0, d], [-22, -60], clamp);
	const s = interpolate(f, [0, d], [1, 0.6], clamp);
	const p = pose([{f: 0, rotY: 0.3, lean: 0.4, face: 'serious', armRX: -2.6, armLX: -2.6, armRZ: -1.0, armLZ: 1.0, legLX: -0.3, legRX: 0.2}, {f: d, rotY: 1.2, side: 0.4}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.5, -13, -40], t: [0, -60, -44], fov: 46}, {f: d, p: [0.4, -14, -40], t: [0, -60, -44], fov: 44}]} shake={{at: 0, amp: 0.12, len: d}} />
			<StormSky f={f} />
			<group scale={s}>
				<Man p={P.cooper} pose={p} at={[0, y / s, -44 / s]} f={f} calm={0} />
			</group>
			<CloudDeck f={f} y={-64} speed={1.2} n={30} color="#22303e" glow={0.08} span={[120, 8, 160]} seed={5} />
			<Rain f={f} n={500} center={[0, -40, -42]} size={[30, 50, 30]} wind={[0, -2.0, -0.6]} len={2} op={0.4} />
		</>
	);
};

// 3  "November, 1971." Crane down over the wet PDX apron at dusk.
const Apron71: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [18, 16, 44], t: [-8, 9, -24], fov: 44}, {f: d, p: [16, 7, 38], t: [-8, 7, -24], fov: 44}]} />
		<Apron f={f + 200} />
	</>
);

// 4  The ticket counter: OTS from behind the agent; tilt to the clip-on tie
const Counter: React.FC<ShotProps> = ({f, d, a}) => {
	const coop = pose([{f: 0, rotY: PI, face: 'serious', armRX: -0.3, headX: 0.1}, {f: 8, armRX: -1.5, armRZ: 0.2, ease: 'back'}, {f: 22, armRX: -0.4}, {f: a.tie - 8, headX: 0.25}, {f: a.boards, rotY: PI - 0.5, headY: -0.4}], f);
	const ag = pose([{f: 0, rotY: 0, face: 'smile', armRX: -1.2, armLX: -1.0}, ...[14, 18, 22, 26].map((k, i) => ({f: k, armRX: i % 2 ? -1.6 : -1.1})), {f: 30, face: 'talkA'}, {f: 36, face: 'smile'}], f, 1);
	const cAt: V3 = [0.6, 0, 1.6];
	const hc = hand(P.cooper, coop, 'R', cAt);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-1.6, 5.8, -9.6], t: [0.4, 4.6, 1.6], fov: 40}, {f: a.tie - 6, p: [-1.0, 5.4, -7.4], t: [0.5, 4.5, 1.6], fov: 36}, {f: a.tie + 2, p: [0.6, 3.6, -0.9], t: [0.6, 3.3, 1.1], fov: 34}, {f: d, p: [0.6, 3.55, -0.7], t: [0.6, 3.25, 1.1], fov: 34}]} />
			<TicketHall f={f} flip={onTwos(f) > 10 ? 1 : 0} />
			<Man p={P.agent} pose={ag} at={[2.4, 0, -4.4]} f={f} ph={1} />
			<Man p={P.cooper} pose={coop} at={cAt} f={f} calm={0.3} />
			<group position={[cAt[0] + 0.02, 3.92, cAt[2] - 0.53]} rotation={[0, PI, 0]} scale={0.55}>
				<Tie />
			</group>
			{onTwos(f) >= 8 && onTwos(f) < 24 ? (
				<group position={[hc.x, hc.y + 0.1, hc.z - 0.3]}>
					{[0, 1].map((k) => (
						<mesh key={k} position={[k * 0.06, k * 0.02, 0]} rotation={[0, 0.2 * k, 0]}>
							<boxGeometry args={[0.9, 0.02, 0.4]} />
							<meshLambertMaterial map={tx('bill')} flatShading />
						</mesh>
					))}
				</group>
			) : null}
			{/* his attaché case on the floor beside him */}
			<group position={[2.4, 0, 2.2]} rotation={[PI / 2, 0, 0.1]}>
				<Briefcase inner={false} s={1.1} />
			</group>
		</>
	);
};

// Seat/actors in the cabin (row 18, aisle seat starboard)
const SEAT = 1.72;
const COOPER_SEAT: V3 = [1.55, 0, 0.1];

// 5  "He orders a bourbon." Low from the aisle: Flo sets the drink; smoke curls from his cigarette.
const Bourbon: React.FC<ShotProps> = ({f, d}) => {
	const coop = pose([{f: 0, ...sit(P.cooper, SEAT), face: 'serious', armRX: -1.2, armRZ: 0.25, headY: -0.5}, {f: 10, armLX: -1.5, armLZ: -0.2}], f);
	const flo = pose([{f: 0, rotY: PI / 2 - 0.3, face: 'smile', armRX: -1.3, armRZ: 0.3, lean: 0.25}, {f: 10, armRX: -0.9, lean: 0.35}, {f: 20, armRX: -0.3, lean: 0.1}], f, 1);
	const flAt: V3 = [-0.5, 0, 1.6];
	const hf = hand(P.flo, flo, 'R', flAt);
	const placed = onTwos(f) >= 12;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3.6, 4.8, 7.6], t: [0.4, 3.8, 0.8], fov: 44}, {f: d, p: [3.4, 4.7, 7.0], t: [0.4, 3.8, 0.8], fov: 44}]} />
			<Cabin727 f={f} hideRow />
			<Man p={P.cooper} pose={coop} at={COOPER_SEAT} f={f} calm={0.2} />
			<Man p={P.flo} pose={flo} at={flAt} f={f} ph={1} />
			<group position={placed ? [2.1, 2.08, 0.7] : [hf.x, hf.y + 0.2, hf.z + 0.2]}>
				<Cyl r={0.2} r2={0.24} h={0.45} seg={8} pos={[0, 0.22, 0]} color="#d8a050" />
				<B size={[0.14, 0.14, 0.14]} pos={[0.05, 0.38, 0]} color="#e8f0f8" />
			</group>
			{/* other passengers' heads above the seat backs, rows ahead */}
			<Man p={P.pass3} pose={{...sit(P.pass3, SEAT), face: 'serious', headY: 0.3}} at={[-2.6, 0, 5.3]} f={f} ph={3} />
			<Man p={P.pass1} pose={{...sit(P.pass1, SEAT), face: 'smile'}} at={[2.6, 0, 7.9]} f={f} ph={4} />
		</>
	);
};

// 6  "Then he hands the flight attendant a note." Two-shot: the folded note crosses the aisle.
const NoteSlide: React.FC<ShotProps> = ({f, d}) => {
	const coop = pose([{f: 0, ...sit(P.cooper, SEAT), face: 'serious', headY: -0.5, armRX: -0.4}, {f: 8, armRX: -1.35, armRZ: -0.45, ease: 'out'}, {f: 26, armRX: -1.2, armRZ: -0.55}], f);
	const flo = pose([{f: 0, rotY: PI / 2 - 0.3, face: 'smile', armRX: -0.3}, {f: 14, armRX: -1.1, armRZ: -0.3, lean: 0.1, ease: 'out'}], f, 1);
	const took = onTwos(f) >= 24;
	const flAt: V3 = [-0.5, 0, 1.6];
	const hf = hand(P.flo, flo, 'R', flAt);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.7, 5.2, 7.6], t: [0.6, 3.3, 0.9], fov: 44}, {f: d, p: [0.7, 5.1, 6.8], t: [0.6, 3.3, 0.9], fov: 42}]} />
			<Cabin727 f={f} hideRow />
			<Man p={P.cooper} pose={coop} at={COOPER_SEAT} f={f} calm={0.2} holdR={!took ? <group position={[0, -0.15, 0.25]} rotation={[0.2, 0.3, 0]}><B size={[0.6, 0.03, 0.42]} color="#f2eee0" /></group> : undefined} />
			<Man p={P.flo} pose={flo} at={flAt} f={f} ph={1} />
			{took ? (
				<group position={[hf.x, hf.y + 0.1, hf.z + 0.15]} rotation={[0.2, 0.3, 0]}>
					<B size={[0.6, 0.03, 0.42]} color="#f2eee0" />
				</group>
			) : null}
			<group position={[2.1, 2.08, 0.7]}>
				<Cyl r={0.2} r2={0.24} h={0.45} seg={8} pos={[0, 0.22, 0]} color="#d8a050" />
			</group>
		</>
	);
};

// 7  "She thinks he's hitting on her." She smirks, pockets it unread, turns to go.
const Smirk: React.FC<ShotProps> = ({f, d}) => {
	const flo = pose([{f: 0, rotY: PI / 2 - 0.4, face: 'smile', armRX: -1.0, headY: 0.3}, {f: 8, face: 'smug', headY: 0.3, headZ: 0.15, ease: 'back'}, {f: 16, armRX: -0.2, armRZ: 0.4}, {f: d - 4, rotY: 0.3, headY: 0.5}], f, 1);
	const coop = pose([{f: 0, ...sit(P.cooper, SEAT), face: 'serious', headY: -0.7}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3.2, 5.0, 7.4], t: [-0.4, 4.0, 1.4], fov: 40}, {f: d, p: [3.0, 5.0, 6.8], t: [-0.4, 4.0, 1.4], fov: 40}]} />
			<Cabin727 f={f} hideRow />
			<Man p={P.flo} pose={flo} at={[-0.4, 0, 1.4]} f={f} ph={1} />
			<Man p={P.cooper} pose={coop} at={COOPER_SEAT} f={f} calm={0.2} />
		</>
	);
};

// 8  "He leans in." Close on Cooper; the reading light rims his shades.
const Lean: React.FC<ShotProps> = ({f, d}) => {
	const coop = pose([{f: 0, ...sit(P.cooper, SEAT), face: 'serious', headY: -0.4}, {f: 6, lean: 0.35, side: -0.25, headY: -0.7, headX: -0.05, ease: 'out'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-0.3, 4.7, 8.4], t: [1.0, 4.2, 0.8], fov: 44}, {f: d, p: [-0.2, 4.65, 7.6], t: [1.0, 4.2, 0.8], fov: 42}]} />
			<Cabin727 f={f} hideRow />
			<Man p={P.cooper} pose={coop} at={COOPER_SEAT} f={f} calm={0.1} />
		</>
	);
};

// 9  "Miss, you'd better look at that note. I have a bomb." OTS onto Flo; snap zoom on "bomb".
const Bomb: React.FC<ShotProps> = ({f, d, a}) => {
	const flo = pose([{f: 0, rotY: PI / 2 - 0.15, face: 'smile', headX: 0.15}, {f: a.bomb - 2, face: 'smile'}, {f: a.bomb, face: 'shock', headX: -0.1, lean: -0.15, armRX: -0.6, armLX: -0.5, ease: 'snap'}], f, 1);
	const coop = pose([{f: 0, ...sit(P.cooper, SEAT), lean: 0.35, side: -0.25, headY: -0.9, face: 'talkA'}, ...[4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60].map((k, i) => ({f: k, face: i % 2 ? 'talkB' : 'talkA'})), {f: a.bomb + 4, face: 'serious'}], f);
	const flick = Math.floor(f / 2) % 11 === 0 && f > a.bomb ? 0.4 : 1;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [2.8, 5.0, -0.2], t: [-0.6, 4.1, 1.6], fov: 40}, {f: a.bomb - 2, p: [2.6, 5.0, -0.1], t: [-0.6, 4.1, 1.6], fov: 38}, {f: a.bomb + 3, p: [2.3, 4.8, 0.2], t: [-0.6, 4.2, 1.6], fov: 28}, {f: d, p: [2.3, 4.8, 0.2], t: [-0.6, 4.2, 1.6], fov: 28}]} shake={{at: a.bomb, amp: 0.06, len: 8}} />
			<Cabin727 f={f} flicker={flick} hideRow />
			<Man p={P.flo} pose={flo} at={[-0.6, 0, 1.6]} f={f} ph={1} calm={0.4} />
			<Man p={P.cooper} pose={coop} at={COOPER_SEAT} f={f} calm={0.1} />
		</>
	);
};

// 10  SLICE IT OPEN (rule 5): "Red sticks. Wires. A battery." — one camera beat per phrase; label.
const Case: React.FC<ShotProps> = ({f, d, a}) => {
	const ff = onTwos(f);
	const open = interpolate(ff, [0, 8], [0.25, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
	const split = interpolate(ff, [a.wires - 4, a.wires + 4], [0, 0.55], {...clamp, easing: Easing.out(Easing.cubic)});
	const s = pop(f, a.battery);
	const at: V3 = [2.6, 1.72, 0.2];
	return (
		<>
			<Cam2
				f={f}
				k={[
					{f: 0, p: [2.6, 5.0, 2.1], t: [2.6, 1.9, 0.15], fov: 38},
					{f: a.wires - 2, p: [2.6, 4.9, 1.9], t: [2.6, 1.9, 0.15], fov: 38},
					{f: a.wires + 2, p: [0.4, 3.4, 2.2], t: [2.6, 2.0, 0.1], fov: 36},
					{f: a.battery - 2, p: [0.5, 3.4, 2.1], t: [2.6, 2.0, 0.1], fov: 36},
					{f: a.battery + 2, p: [1.7, 3.9, 3.4], t: [3.5, 2.9, 0], fov: 38},
					{f: d, p: [1.7, 3.85, 3.2], t: [3.5, 2.9, 0], fov: 38},
				]}
				shake={{at: a.wires, amp: 0.04, len: 6}}
			/>
			<Cabin727 f={f} flicker={0.8} hideRow />
			<group position={at} rotation={[0, 0, 0]}>
				{split > 0 ? (
					<>
						<group position={[-split, 0, 0]}>
							<Briefcase open={open} half={-1} />
						</group>
						<group position={[split, 0, 0]}>
							<Briefcase open={open} half={1} />
						</group>
					</>
				) : (
					<Briefcase open={open} />
				)}
			</group>
			{ff >= a.battery ? (
				<group>
					<group position={[at[0] + 0.55 + split, at[1] + 1.0, at[2] - 0.2]} rotation={[0, 0, -1.1]} scale={[s, 1, 1]}>
						<B size={[0.7, 0.035, 0.035]} color="#f8f4e8" glow={0.6} shadow={false} />
					</group>
					<group position={[at[0] + 0.05 + split, at[1] + 1.55, at[2] - 0.2]} scale={s * 0.8}>
						<BlockText text="BATTERY" size={0.26} depth={0.07} color="#f2d040" side="#8a6a10" />
					</group>
				</group>
			) : null}
			<pointLight position={[2.6, 4.6, 1]} color="#e8f0ff" intensity={8} distance={8} />
		</>
	);
};

// 11  The demands: cockpit at night, the Captain reads the note; the city slides by below.
const Demands: React.FC<ShotProps> = ({f, d, a}) => {
	const cap = pose([{f: 0, ...sit(P.captain, 1.8), rotY: 0.5, face: 'serious', armRX: -1.6, armLX: -1.3, armLZ: -0.3, headX: 0.3, headY: 0.3}, {f: a.four, headX: 0.15, face: 'shock', ease: 'snap'}, {f: a.four + 10, face: 'serious', armLX: -2.6, armLZ: 0.6, ease: 'back'}], f);
	const cAt: V3 = [-2.4, 0, -1.2];
	const hc = hand(P.captain, cap, 'R', cAt);
	const s1 = pop(f, 4);
	const s2 = pop(f, a.four);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [2.0, 6.2, -8.8], t: [-1.2, 4.0, 3.0], fov: 46}, {f: d, p: [1.6, 6.0, -7.8], t: [-1.2, 4.0, 3.0], fov: 44}]} />
			<group rotation={[0, 0, interpolate(f, [0, d], [0.06, 0.1])]}>
				<Cockpit f={f} />
			</group>
			<Man p={P.captain} pose={cap} at={cAt} f={f} calm={0.3} />
			{/* the note, held up to the light: felt-tip block capitals */}
			<group position={[hc.x + 1.4, hc.y + 1.6, hc.z - 0.6]} rotation={[0.15, 2.76, 0.05]}>
				<B size={[2.6, 1.7, 0.03]} color="#f2eee0" />
				<group position={[0, 0.35, 0.04]} scale={s1}>
					<BlockText text="$200,000" size={0.42} depth={0.05} color="#1a2a6a" />
				</group>
				<group position={[0, -0.35, 0.04]} scale={s2}>
					<BlockText text="4 PARACHUTES" size={0.27} depth={0.05} color="#1a2a6a" />
				</group>
			</group>
		</>
	);
};

// 12  "The FBI pays." Low at desk height: the canvas bag thumps down.
const Pays: React.FC<ShotProps> = ({f, d}) => {
	const drop = interpolate(onTwos(f), [0, 6], [2.4, 0], {...clamp, easing: Easing.in(Easing.quad)});
	const ag = pose([{f: 0, rotY: 0.2, face: 'serious', armRX: -1.6, armLX: -1.6, lean: 0.2}, {f: 6, armRX: -0.9, armLX: -0.9, lean: 0.3}, {f: 14, armRX: -0.3, armLX: -0.2, lean: 0, headX: 0.25}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-3.0, 3.6, 8.4], t: [-6, 4.0, -2], fov: 42}, {f: d, p: [-3.4, 3.5, 7.6], t: [-6, 4.1, -2], fov: 42}]} shake={{at: 6, amp: 0.08, len: 8}} />
			<FbiOffice f={f} />
			<Man p={P.fbi1} pose={ag} at={[-6.3, 0, -4.4]} f={f} calm={0.3} />
			<group position={[-5.4, 3.5 + drop, -1.6]} rotation={[0, 0.3, 0]}>
				<B size={[1.7, 1.1, 1.1]} color="#a8987a" />
				<B size={[1.3, 0.35, 0.8]} pos={[0, 0.7, 0]} color="#98886a" />
				<B size={[0.5, 0.3, 0.5]} pos={[0, 1.0, 0]} color="#887858" />
				<B size={[0.6, 0.12, 0.6]} pos={[0, 0.9, 0]} color="#3a2a1e" />
				<BlockText text="BANK" size={0.2} depth={0.03} color="#4a3a22" position={[0, -0.1, 0.57]} />
			</group>
		</>
	);
};

// 13  "…photograph every single bill." Microfilm stand: flash pops; ECU on a serial number.
const Microfilm: React.FC<ShotProps> = ({f, d, a}) => {
	const ff = onTwos(f);
	const flashes = [6, 16, 26, 36, 46, 56, 66];
	const fl = flashAt(ff, flashes, 4);
	const ag = pose([{f: 0, rotY: PI, face: 'serious', armRX: -1.2, armLX: -1.2, lean: 0.25, headX: 0.35}, ...flashes.map((k, i) => ({f: k - 2, armRX: i % 2 ? -1.2 : -1.0, armLX: i % 2 ? -1.0 : -1.3}))], f, 2);
	const billSlide = (ff % 10) / 10;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [11.5, 6.6, 10.5], t: [6, 3.6, 4], fov: 40}, {f: a.bill - 4, p: [9.4, 5.8, 8.2], t: [6, 3.2, 4], fov: 38}, {f: a.bill + 6, p: [6.2, 4.4, 5.6], t: [6, 2.9, 4.2], fov: 30}, {f: d, p: [6.1, 4.2, 5.3], t: [6, 2.9, 4.2], fov: 28}]} />
			<FbiOffice f={f} />
			<Man p={P.fbi2} pose={ag} at={[6, 0, 6.9]} f={f} ph={2} calm={0.3} />
			{/* the bill under the lens, a stack waiting, the photographed pile */}
			<group position={[6, 2.86, 4.2 - billSlide * 0.2]}>
				<mesh>
					<boxGeometry args={[1.56, 0.02, 0.66]} />
					<meshLambertMaterial map={tx('bill')} flatShading />
				</mesh>
				<BlockText text="L 0 7 5 2 9 1 3 8 B" size={0.05} depth={0.005} color="#2a4a2a" rotation={[-PI / 2, 0, 0]} position={[0.35, 0.02, -0.18]} />
			</group>
			<group position={[4.6, 2.9, 3.6]}>
				<Bundle />
			</group>
			<group position={[7.5, 2.9, 3.8]} rotation={[0, 0.3, 0]}>
				<Bundle band={false} />
				<group position={[0.1, 0.3, 0.05]} rotation={[0, -0.2, 0]}>
					<Bundle band={false} />
				</group>
			</group>
			{fl > 0 ? <pointLight position={[6, 5.4, 4.4]} color="#ffffff" intensity={35 * fl} distance={12} /> : null}
			{[-1.6, 1.6].map((x) => (
				<B key={x} size={[0.9, 0.1, 0.9]} pos={[6 + x, 4.85, 4.3]} color="#ffffff" glow={0.4 + fl * 3} shadow={false} />
			))}
		</>
	);
};

// 14  "In Seattle, he lets the passengers go, and sends the jet back into the night."
const Seattle: React.FC<ShotProps> = ({f, d, a}) => {
	const rollZ = interpolate(onTwos(f), [a.sends, d + 20], [0, 26], {...clamp, easing: Easing.in(Easing.quad)});
	const walkers = [P.pass1, P.pass2, P.pass3, P.pass4, P.pass5];
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-44, 26, 82], t: [-6, 3, 32], fov: 42}, {f: d, p: [-40, 22, 76], t: [-4, 4, 34], fov: 42}]} />
			<Tarmac f={f} jetZ={rollZ} stairs={rollZ < 2} />
			{walkers.map((p, i) => {
				const t0 = i * 9;
				const x0 = -12;
				const ps = pose([...(walk(t0, d + 30, [x0 / p.h, (44 - i * 0.6) / p.h], [(x0 - 26) / p.h, (52 + i * 1.2) / p.h], 8) as K[]), {f: 0, rotY: -PI / 2 + 0.3, face: 'serious'}], f, i + 2);
				return onTwos(f) >= t0 ? <Man key={i} p={p} pose={ps} at={[0, 0, 0]} f={f} ph={i} calm={0.3} /> : null;
			})}
		</>
	);
};

// 15  "Over the forests of Washington, he lowers the rear stairs." Low under the tail.
const Lower: React.FC<ShotProps> = ({f, d, a}) => {
	const st = interpolate(onTwos(f), [a.lowers - 4, d], [0, 0.85], {...clamp, easing: Easing.inOut(Easing.cubic)});
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [9, -15, -12], t: [0, -4, -34], fov: 44}, {f: d, p: [8, -16, -14], t: [0, -7, -36], fov: 44}]} shake={{at: 0, amp: 0.12, len: d}} />
			<StormSky f={f + 90} below />
			<Jet727 f={f} stair={st} />
			<group position={[0, -90, 0]}>
				<CloudDeck f={f} y={20} speed={2.4} n={20} color="#1a2630" glow={0.06} span={[200, 6, 220]} seed={23} />
			</group>
			<Rain f={f} n={600} center={[4, -8, -26]} size={[40, 30, 60]} wind={[0, -0.4, -3.2]} len={2.4} op={0.4} />
		</>
	);
};

// 16  "And he's gone." Locked-off in the cabin: he looks back from the stair door, then steps down.
const Gone: React.FC<ShotProps> = ({f, d}) => {
	const ff = onTwos(f);
	const step = interpolate(ff, [8, 16], [0, 1], clamp);
	const p = pose([{f: 0, rotY: 0.3, face: 'serious', headY: 0.5, armRX: -0.3}, {f: 6, rotY: PI, headY: 0, ease: 'inOut'}, {f: 12, legLX: -0.6, lean: 0.2}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.6, 4.4, 9.5], t: [0, 3.6, -3], fov: 40}, {f: d, p: [0.6, 4.4, 9.3], t: [0, 3.6, -3], fov: 40}]} />
			<Cabin727 f={f} door={1} flicker={0.6} />
			{step < 1 ? <Man p={P.cooper} pose={p} at={[0, -step * 3, -2.0 - step * 2]} f={f} calm={0} holdL={<group position={[0, -0.6, 0.5]}><MoneyBag /></group>} /> : null}
			{/* storm visible through the open door: rain blowing past */}
			<Rain f={f} n={160} center={[0, 3, -4]} size={[3, 6, 2]} wind={[0.2, -0.3, -3]} len={1.4} op={0.6} />
			<B size={[2.4, 5.6, 0.1]} pos={[0, 2.9, -3.6]} color="#0a1424" glow={0.15} />
		</>
	);
};

// 17  "Into freezing rain." Falling POV over the dark firs.
const IntoRain: React.FC<ShotProps> = ({f, d}) => {
	const y = interpolate(f, [0, d], [44, 26]);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 44, 10], t: [0, 0, -12], fov: 50}, {f: d, p: [0, 26, 6], t: [0, 0, -14], fov: 50}]} />
			<Forest f={f} mode="night" />
			<hemisphereLight args={['#8aa0c0', '#101810', 0.6 + flashAt(f, [6], 10) * 3]} />
			<Rain f={f} n={700} center={[0, y - 12, -6]} size={[30, 26, 30]} wind={[0, -2.6, -0.4]} len={2.2} op={0.45} />
		</>
	);
};

// 18  "In loafers." Close on his feet against the storm (we fall with him).
const Loafers: React.FC<ShotProps> = ({f, d}) => {
	const y = -f * 0.4;
	const p = pose([{f: 0, rotY: 0.4, lean: 0.25, face: 'serious', armRX: -2.6, armLX: -2.6, legLX: -0.35, legRX: 0.25}, {f: 10, legLX: 0.2, legRX: -0.3}, {f: 20, legLX: -0.3, legRX: 0.2}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3.6, y - 0.2, 3.6], t: [0, y + 0.5, 0], fov: 40}, {f: d, p: [3.4, y - 0.2, 3.4], t: [0, y + 0.5, 0], fov: 40}]} shake={{at: 0, amp: 0.05, len: d}} />
			<StormSky f={f + 30} strikes={[8]} below={false} />
			<Man p={P.cooper} pose={p} at={[0, y, 0]} f={f} calm={0} />
			<pointLight position={[2.4, y + 2.5, 2.4]} color="#b8d0f0" intensity={30} distance={10} />
			<pointLight position={[-2, y + 1, -2]} color="#6a8ad0" intensity={20} distance={8} />
			<Rain f={f} n={260} center={[0, y, -4]} size={[14, 16, 8]} wind={[0, 3.0, 0.3]} len={1.2} op={0.35} />
		</>
	);
};

// 19  "A reporter got his name wrong." ECU of the keys striking, the page reads D.B. COOPER.
const Typing: React.FC<ShotProps> = ({f, d}) => {
	const text = 'D.B. COOPER';
	const n = Math.min(text.length, Math.floor(onTwos(f) / 3));
	const rep = pose([{f: 0, ...sit(P.reporter, 2.4), face: 'serious', armRX: -1.3, armLX: -1.3, headX: 0.3}, ...[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33].map((k, i) => ({f: k, armRX: i % 2 ? -1.15 : -1.35, armLX: i % 2 ? -1.35 : -1.15})), {f: 36, face: 'smug', armRX: -0.6, armRZ: -0.4, headX: 0, ease: 'back'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-6.2, 5.0, -1.0], t: [-8, 3.8, -4.3], fov: 32}, {f: d, p: [-6.6, 5.4, 0.2], t: [-8, 4.2, -4.6], fov: 36}]} />
			<Newsroom f={f} />
			<Man p={P.reporter} pose={rep} at={[-8, 0, -6.4]} f={f} calm={0.3} />
			<group position={[-8, 4.1, -4.45]} rotation={[-0.15, 0, 0]}>
				<BlockText text={text.slice(0, n) || ' '} size={0.16} depth={0.015} color="#1a1a1a" align="left" position={[-0.6, 0, 0]} />
			</group>
		</>
	);
};

// 20  "The legend became D.B. Cooper." The paper spins in; gold headline lands on "Cooper".
const Paper: React.FC<ShotProps> = ({f, d, a}) => {
	const sp = interpolate(onTwos(f), [0, 14], [PI * 3, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	const sc = interpolate(onTwos(f), [0, 14], [0.2, 1], {...clamp, easing: Easing.out(Easing.back(1.2))});
	const gold = onTwos(f) >= a.cooper;
	const news = tx('newsprint');
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 6.8, 14], t: [0, 6.8, 0], fov: 40}, {f: d, p: [0, 6.8, 12.8], t: [0, 6.8, 0], fov: 40}]} shake={{at: a.cooper, amp: 0.12, len: 10}} />
			<Newsroom f={f} />
			<group position={[0, 6.6, 2]} rotation={[0, 0, sp]} scale={sc}>
				<mesh>
					<boxGeometry args={[5.4, 7.0, 0.08]} />
					<meshLambertMaterial map={news} flatShading />
				</mesh>
				<BlockText text="NORTHWEST CHRONICLE" size={0.32} depth={0.04} color="#1a1a1a" position={[0, 3.0, 0.05]} />
				<B size={[5, 0.05, 0.02]} pos={[0, 2.75, 0.05]} color="#1a1a1a" />
				<BlockText text="HIJACKER JUMPS WITH $200,000" size={0.22} depth={0.04} color="#1a1a1a" position={[0, 2.25, 0.05]} />
				<group position={[0, 1.25, 0.06]} scale={gold ? pop(f, a.cooper) * 0.25 + 0.75 : 0.75}>
					<BlockText text="'D.B. COOPER'" size={0.62} depth={0.12} color={gold ? '#ffc72c' : '#1a1a1a'} side={gold ? '#8a6a10' : '#3a3a3a'} emissive={gold ? 0.6 : 0} />
				</group>
				<BlockText text="NOV. 25, 1971" size={0.16} depth={0.03} color="#3a3a3a" position={[1.6, 3.35, 0.05]} />
			</group>
			<pointLight position={[0, 8, 6]} color="#fff0d8" intensity={30} distance={16} />
		</>
	);
};

// 21  "The manhunt found nothing." Dawn: searchers in a loose line through the ferns; a chopper.
const Search: React.FC<ShotProps> = ({f, d}) => {
	const crew = [P.search1, P.search2, P.search3];
	const heliX = interpolate(f, [0, d], [-40, 10]);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3, 2.4, 22], t: [-1, 3.4, -4], fov: 42}, {f: d, p: [2.4, 2.6, 20], t: [-1, 3.6, -4], fov: 42}]} />
			<Forest f={f} mode="dawn" />
			{crew.map((p, i) => {
				const x = -7 + i * 7;
				const ps = pose([...(walk(0, d + 10, [x / p.h, (-6 - i * 2) / p.h], [x / p.h, (2 - i * 2) / p.h], 9) as K[]), {f: 0, rotY: 0.15 - i * 0.1, face: 'serious', headX: 0.35}, {f: 20 + i * 6, headY: i % 2 ? 0.6 : -0.6}], f, i);
				return <Man key={i} p={p} pose={ps} at={[0, 0, 0]} f={f} ph={i} calm={0.3} />;
			})}
			{/* tracking dog ahead of the line */}
			<group position={[2, 0, interpolate(f, [0, d], [0, 4])]}>
				<B size={[0.8, 0.8, 2]} pos={[0, 1.2, 0]} color="#6a4a2a" />
				<B size={[0.7, 0.7, 0.8]} pos={[0, 1.7, 1.2]} color="#6a4a2a" />
				{[-0.3, 0.3].map((x) => [-0.7, 0.7].map((z) => <B key={`${x}${z}`} size={[0.2, 0.9, 0.2]} pos={[x, 0.45, z]} rot={[Math.sin(onTwos(f) * 0.6 + x + z) * 0.4, 0, 0]} color="#5a3a1e" />))}
			</group>
			<group position={[heliX, 26, -30]}>
				<B size={[4, 2.4, 2.4]} color="#2a3a2a" />
				<B size={[5, 0.4, 0.4]} pos={[-4, 0.4, 0]} color="#2a3a2a" />
				<group rotation={[0, f * 0.9, 0]} position={[0, 1.6, 0]}>
					<B size={[11, 0.08, 0.5]} color="#1a1a1a" shadow={false} />
				</group>
			</group>
		</>
	);
};

// 22  "No body. No parachute." Two close beats on the forest floor.
const Nothing: React.FC<ShotProps> = ({f, d, a}) => {
	const second = onTwos(f) >= a.chute;
	const pole = interpolate(onTwos(f), [a.chute, a.chute + 10], [0.8, 0], clamp);
	const boot = interpolate(onTwos(f), [0, 10], [1.4, 0.3], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<>
			<Cam2 f={f} k={second ? [{f: a.chute, p: [-2.6, 1.6, 6.8], t: [-3, 0.4, 2], fov: 36}, {f: d, p: [-2.6, 1.5, 6.4], t: [-3, 0.4, 2], fov: 36}] : [{f: 0, p: [6.4, 1.8, 12.6], t: [5, 0.6, 8], fov: 38}, {f: a.chute, p: [6.2, 1.7, 12.2], t: [5, 0.6, 8], fov: 38}]} />
			<Forest f={f} mode="dawn" />
			{!second ? (
				<group position={[5, boot, 8]}>
					<B size={[0.9, 0.7, 1.5]} pos={[0, 0.35, 0]} color="#3a2a1a" />
					<B size={[0.9, 2.2, 0.9]} pos={[0, 1.8, -0.3]} color="#3a3a2a" />
				</group>
			) : (
				<group position={[-3, 0.4 + pole, 2]} rotation={[0.3, 0, 0.1]}>
					<B size={[0.12, 5, 0.12]} pos={[0, 2.5, 0]} color="#8a6a3a" />
				</group>
			)}
		</>
	);
};

// 23  "For nine years." The office calendar flips 1972 → 1980; window light cycles.
const Years: React.FC<ShotProps> = ({f, d}) => {
	const k = Math.min(8, Math.floor(interpolate(onTwos(f), [0, d - 4], [0, 8.99], clamp)));
	const year = String(1972 + k);
	const fl = (onTwos(f) % 4) / 4;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [4, 8.4, -4.0], t: [4, 8.2, -9.7], fov: 38}, {f: d, p: [4, 8.4, -4.6], t: [4, 8.2, -9.7], fov: 38}]} />
			<FbiOffice f={f} year={year} flip={k < 8 ? fl : 0} lamp={k % 2 ? 0.6 : 1} />
		</>
	);
};

// 24  1980, Tena Bar: the boy digs; a rotting bundle comes up on "bundles".
const Riverbank: React.FC<ShotProps> = ({f, d, a}) => {
	const dig = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84].map((k, i) => ({f: k, armRX: i % 2 ? -0.8 : -1.5, lean: i % 2 ? 0.45 : 0.25}));
	const found = onTwos(f) >= a.bundles;
	const boy = pose([{f: 0, rotY: -0.7, face: 'serious', headX: 0.5, armLX: -0.8}, ...dig.filter((k) => k.f < a.bundles - 6), {f: a.bundles - 4, lean: 0.1, armRX: -2.0, armLX: -2.0, face: 'shock', headX: 0.2, ease: 'back'}, {f: a.bundles + 10, rotY: -0.2, headY: 0.5}], f);
	const bAt: V3 = [0, 0, 3];
	const hb = hand(P.boy, boy, 'R', bAt);
	const hl = hand(P.boy, boy, 'L', bAt);
	const dad = pose([{f: 0, rotY: -0.9, face: 'smile', armRX: -1.4, armRZ: 0.2}, {f: a.bundles + 6, face: 'shock', headY: -0.6, ease: 'snap'}, {f: a.bundles + 14, rotY: -1.6, armRX: -0.3}], f, 1);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-7, 2.6, 13], t: [1.5, 2.2, 0], fov: 44}, {f: a.bundles, p: [-5.6, 2.4, 11], t: [0.6, 2.2, 2], fov: 40}, {f: d, p: [-5.0, 2.4, 10], t: [0.3, 2.4, 2.4], fov: 38}]} />
			<TenaBar f={f} />
			<Man p={P.boy} pose={boy} at={bAt} f={f} calm={0.4} holdR={!found ? <group position={[0, -0.3, 0.2]} rotation={[0.6, 0, 0]}><B size={[0.12, 2.4, 0.12]} pos={[0, -1, 0]} color="#8a7a5a" /></group> : undefined} />
			<Man p={P.dad} pose={dad} at={[9.6, 0, 0.6]} f={f} ph={1} holdR={<group position={[0, -0.3, 0.3]}><Cyl r={0.2} h={0.4} seg={8} color="#e8e4da" /></group>} />
			{/* the dig: a scooped hollow; the bundle rises in his hands */}
			<B size={[1.6, 0.06, 1.2]} pos={[-0.9, 0.15, 4.0]} color="#5a5446" />
			<group position={found ? [(hb.x + hl.x) / 2, (hb.y + hl.y) / 2 + 0.25, (hb.z + hl.z) / 2] : [-0.9, 0.05, 4.0]} rotation={[0.2, 0.4, 0]} scale={0.7}>
				<Bundle rotten />
				<group position={[0.3, 0.3, 0.1]} rotation={[0, 0.5, 0.1]}>
					<Bundle rotten />
				</group>
			</group>
		</>
	);
};

// 25  "The serial numbers matched." Rotten bill vs microfilm frame slide together; MATCH.
const Match: React.FC<ShotProps> = ({f, d}) => {
	const x = interpolate(onTwos(f), [0, 14], [2.2, 0.95], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const ok = onTwos(f) >= 16;
	const s = pop(f, 16);
	const serial = 'L 0 7 5 2 9 1 3 8 B';
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 9.4, 3.0], t: [0, 2.7, -0.3], fov: 40}, {f: d, p: [0, 8.8, 2.7], t: [0, 2.7, -0.3], fov: 40}]} />
			<EvidenceTable f={f} />
			{/* the 1980 bill (rotten) */}
			<group position={[-x * 1.6 + 1.52, 2.75, -0.85]}>
				<mesh>
					<boxGeometry args={[2.6, 0.03, 1.1]} />
					<meshLambertMaterial map={tx('rotten')} flatShading />
				</mesh>
				<BlockText text={serial} size={0.11} depth={0.01} color="#1a2a1a" rotation={[-PI / 2, 0, 0]} position={[0, 0.03, 0.62]} />
			</group>
			{/* the 1971 microfilm frame (negative on film stock) */}
			<group position={[x * 1.6 - 1.52, 2.75, 0.85]}>
				<B size={[2.8, 0.03, 1.4]} color="#1a1410" />
				{Array.from({length: 8}, (_, i) => (
					<B key={i} size={[0.14, 0.035, 0.1]} pos={[-1.2 + i * 0.34, 0, 0.6]} color="#3a3026" shadow={false} />
				))}
				<B size={[2.5, 0.035, 0.95]} pos={[0, 0.005, -0.05]} color="#5a6a8a" glow={0.4} />
				<BlockText text={serial} size={0.11} depth={0.01} color="#e8f0ff" emissive={0.6} rotation={[-PI / 2, 0, 0]} position={[0, 0.03, 0.62]} />
			</group>
			{ok ? (
				<group position={[0, 3.2, -2.3]} rotation={[-0.9, 0, 0]} scale={s}>
					<BlockText text="MATCH" size={0.5} depth={0.12} color="#5ae87a" side="#1a6a2a" emissive={0.8} />
				</group>
			) : null}
		</>
	);
};

// 26  "How they got there, no one knows. The rest of the money has never turned up." River aerial.
const River: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [10, 34, 40], t: [-6, 0, -50], fov: 46}, {f: d, p: [-8, 40, 14], t: [-24, 0, -100], fov: 46}]} />
		<TenaBar f={f + 120} />
	</>
);

// 27  "In 2016, the FBI closed the case." The NORJAK box slides onto the shelf; the light clicks off.
const Closed: React.FC<ShotProps> = ({f, d}) => {
	const z = interpolate(onTwos(f), [4, 22], [2.2, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	const lamp = onTwos(f) >= d - 10 ? 0.12 : 1;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [14.6, 6.0, 0.6], t: [10.4, 4.8, -9.2], fov: 44}, {f: d, p: [14.2, 5.8, -0.4], t: [10.4, 4.8, -9.2], fov: 44}]} />
			<FbiOffice f={f} lamp={lamp} />
			<group position={[12.4, 4.45, -9.2 + z]}>
				<B size={[1.4, 1.5, 1.4]} color="#b8945a" />
				<B size={[1.5, 0.2, 1.5]} pos={[0, 0.8, 0]} color="#a8844a" />
				<B size={[1.0, 0.4, 0.02]} pos={[0, 0.1, 0.71]} color="#f2efe6" />
				<BlockText text="NORJAK" size={0.14} depth={0.02} color="#1a1a1a" position={[0, 0.04, 0.73]} />
			</group>
		</>
	);
};

// 28  "The only unsolved hijacking in American history." Callback: the empty stairs in the storm.
const Empty: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [15, -14, -56], t: [0, -9, -38], fov: 42}, {f: d, p: [30, -20, -84], t: [0, -2, -30], fov: 46}]} shake={{at: 0, amp: 0.1, len: d}} />
		<StormSky f={f + 60} strikes={[Math.round(d * 0.5)]} />
		<Jet727 f={f} stair={1} />
		<Rain f={f} n={350} center={[6, -10, -50]} size={[40, 30, 50]} wind={[0, -0.5, 3.2]} len={1.8} op={0.3} />
	</>
);

// 29  "And all he left behind was that clip-on tie." Evidence bag under one hard lamp; slow push.
const LastTie: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [0.6, 7.4, 4.4], t: [0, 2.7, -0.2], fov: 40}, {f: d, p: [0.3, 5.4, 2.6], t: [0, 2.7, -0.3], fov: 38}]} />
		<EvidenceTable f={f} />
		<group position={[0.2, 2.8, 1.3]} rotation={[-PI / 2, 0, PI + 0.25]}>
			<Tie />
		</group>
		{/* clear evidence bag with a red seal strip */}
		<mesh position={[0.1, 2.85, -0.4]} rotation={[0, 0.25, 0]}>
			<boxGeometry args={[1.8, 0.1, 3.6]} />
			<meshLambertMaterial color="#e8f0ff" transparent opacity={0.16} depthWrite={false} />
		</mesh>
		<B size={[1.8, 0.11, 0.2]} pos={[-0.3, 2.86, -2.1]} rot={[0, 0.25, 0]} color="#c82a1e" />
	</>
);

// ---------------- edit: shots, grades, transitions ----------------
type Tr = 'cut' | 'fade' | 'whip' | 'zoom' | 'dip' | 'flash';
type ShotDef = {at: number; C: React.FC<ShotProps>; a?: (from: number) => Record<string, number>; look: CinePreset; tr: Tr};
const rel = (from: number, t: number) => sec(t) - from;
const cut = (s: number) => Math.max(0, sec(s) - 2);
const SHOTS: ShotDef[] = [
	{at: 0, C: Hook, look: 'night', tr: 'cut', a: (fr) => ({storm: rel(fr, W(0, 11).s), jump: rel(fr, W(0, 16).s)})},
	{at: cut(L(1).s), C: Down, look: 'night', tr: 'cut'},
	{at: cut(L(2).s), C: Apron71, look: 'night', tr: 'dip'},
	{at: cut(L(3).s), C: Counter, look: 'interior', tr: 'fade', a: (fr) => ({tie: rel(fr, W(3, 9).s), boards: rel(fr, W(3, 11).s)})},
	{at: cut(L(4).s), C: Bourbon, look: 'interior', tr: 'whip'},
	{at: cut(L(5).s), C: NoteSlide, look: 'interior', tr: 'cut'},
	{at: cut(L(6).s), C: Smirk, look: 'interior', tr: 'cut'},
	{at: cut(L(7).s), C: Lean, look: 'interior', tr: 'cut'},
	{at: cut(L(8).s), C: Bomb, look: 'interior', tr: 'cut', a: (fr) => ({bomb: rel(fr, W(8, 10).s)})},
	{at: cut(L(9).s), C: Case, look: 'interior', tr: 'flash', a: (fr) => ({wires: rel(fr, L(10).s), battery: rel(fr, W(11, 1).s)})},
	{at: cut(L(12).s), C: Demands, look: 'night', tr: 'whip', a: (fr) => ({four: rel(fr, W(12, 9).s)})},
	{at: cut(L(13).s), C: Pays, look: 'interior', tr: 'cut'},
	{at: cut(L(14).s), C: Microfilm, look: 'interior', tr: 'whip', a: (fr) => ({bill: rel(fr, W(14, 5).s)})},
	{at: cut(L(15).s), C: Seattle, look: 'night', tr: 'dip', a: (fr) => ({sends: rel(fr, W(15, 9).s)})},
	{at: cut(L(16).s), C: Lower, look: 'night', tr: 'whip', a: (fr) => ({lowers: rel(fr, W(16, 6).s)})},
	{at: cut(L(17).s), C: Gone, look: 'night', tr: 'cut'},
	{at: cut(L(18).s), C: IntoRain, look: 'night', tr: 'dip'},
	{at: cut(L(19).s), C: Loafers, look: 'night', tr: 'cut'},
	{at: cut(L(20).s), C: Typing, look: 'interior', tr: 'whip'},
	{at: cut(L(21).s), C: Paper, look: 'interior', tr: 'zoom', a: (fr) => ({cooper: rel(fr, W(21, 4).s)})},
	{at: cut(L(22).s), C: Search, look: 'golden', tr: 'fade'},
	{at: cut(L(23).s), C: Nothing, look: 'golden', tr: 'cut', a: (fr) => ({chute: rel(fr, L(24).s)})},
	{at: cut(L(25).s), C: Years, look: 'interior', tr: 'whip'},
	{at: cut(L(26).s), C: Riverbank, look: 'noon', tr: 'fade', a: (fr) => ({bundles: rel(fr, W(26, 9).s)})},
	{at: cut(L(27).s), C: Match, look: 'interior', tr: 'flash'},
	{at: cut(L(28).s), C: River, look: 'noon', tr: 'fade'},
	{at: cut(L(30).s), C: Closed, look: 'interior', tr: 'dip'},
	{at: cut(L(31).s), C: Empty, look: 'night', tr: 'dip'},
	{at: cut(L(32).s), C: LastTie, look: 'interior', tr: 'dip'},
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
	const st: React.CSSProperties = {opacity: op, transform: `translateX(${tx}%) scale(${sc})`};
	if (filters.length) st.filter = filters.join(' ');
	return st;
};

const ShotLayer: React.FC<{i: number; start: number}> = ({i, start}) => {
	const lf = useCurrentFrame();
	const g = start + lf;
	const def = SHOTS[i];
	const to = SHOTS[i + 1]?.at ?? DBCOOPER_FRAMES;
	const C = def.C;
	const f = g - def.at;
	return (
		<AbsoluteFill style={layerStyle(i, g)}>
			<ThreeCanvas width={1080} height={1920} shadows="soft" dpr={1}>
				<C f={f} d={to - def.at} a={def.a ? def.a(def.at) : {}} g={g} />
				<PS1Pass levels={24} />
				<CineGrade preset={def.look} frame={g} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------- sound ----------------
type Cue = {t: number; file: string; vol?: number};
const CUES: Cue[] = [
	// cold open: storm only, then the noir bed from the airport
	{t: 0, file: 'storm', vol: 0.55},
	{t: 0, file: 'jet', vol: 0.35},
	{t: W(0, 11).s, file: 'thunder', vol: 0.6},
	{t: W(0, 16).s, file: 'gust', vol: 0.5},
	{t: L(2).s - 0.3, file: 'bed_cooper', vol: 0.34},
	...SHOTS.slice(1).map((s) => ({t: s.at / FPS, file: s.tr === 'whip' ? 'whoosh' : 'swish', vol: s.tr === 'whip' ? 0.2 : 0.07})),
	{t: L(2).s, file: 'rain', vol: 0.35},
	{t: L(2).s + 0.4, file: 'chime', vol: 0.25},
	{t: L(3).s + 0.3, file: 'flip', vol: 0.3},
	{t: W(3, 9).s, file: 'stamp', vol: 0.4},
	{t: L(4).s, file: 'cabin', vol: 0.4},
	{t: L(4).s + 0.4, file: 'ice', vol: 0.45},
	{t: L(5).s + 0.2, file: 'paper', vol: 0.5},
	{t: L(7).s, file: 'creak', vol: 0.3},
	{t: W(8, 10).s, file: 'sting', vol: 0.6},
	{t: L(9).s, file: 'click', vol: 0.5},
	{t: L(10).s, file: 'twang', vol: 0.4},
	{t: W(11, 1).s, file: 'ding', vol: 0.35},
	{t: L(12).s, file: 'radio', vol: 0.35},
	...[0, 0.5, 1, 1.5, 2, 2.5, 3].map((x) => ({t: L(12).s + x, file: 'tick', vol: 0.22})),
	{t: L(13).s + 0.18, file: 'thud', vol: 0.55},
	...[6, 16, 26, 36, 46, 56, 66].map((k) => ({t: L(14).s - 0.07 + k / FPS, file: 'shutter', vol: 0.4})),
	{t: L(15).s, file: 'rain', vol: 0.3},
	{t: W(15, 9).s, file: 'spool', vol: 0.5},
	{t: L(16).s, file: 'storm', vol: 0.5},
	{t: W(16, 6).s, file: 'hydraulic', vol: 0.5},
	{t: L(17).s + 0.3, file: 'gust', vol: 0.6},
	{t: L(18).s, file: 'rain', vol: 0.5},
	{t: L(19).s + 0.1, file: 'plunk', vol: 0.4},
	...[0, 0.12, 0.24, 0.36, 0.5, 0.62, 0.74, 0.86, 1.0, 1.12].map((x) => ({t: L(20).s + x, file: 'type', vol: 0.4})),
	{t: L(20).s + 1.25, file: 'bell', vol: 0.35},
	{t: W(21, 4).s, file: 'boom', vol: 0.6},
	{t: L(22).s, file: 'heli', vol: 0.3},
	{t: L(22).s, file: 'birds', vol: 0.3},
	{t: L(23).s, file: 'rustle', vol: 0.45},
	{t: L(24).s, file: 'rustle', vol: 0.45},
	...[0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84].map((x) => ({t: L(25).s + x, file: 'flip', vol: 0.25})),
	{t: L(26).s, file: 'river', vol: 0.4},
	{t: L(26).s + 0.4, file: 'gulls', vol: 0.3},
	{t: W(26, 9).s, file: 'piano', vol: 0.6},
	{t: L(27).s + 0.5, file: 'match', vol: 0.5},
	{t: L(28).s, file: 'wind', vol: 0.3},
	{t: L(30).s + 0.5, file: 'slide', vol: 0.5},
	{t: L(31).s - 0.4, file: 'click', vol: 0.4},
	{t: L(31).s, file: 'storm', vol: 0.4},
	{t: L(32).s + 0.2, file: 'lowtone', vol: 0.6},
];

export const DBCooper: React.FC = () => {
	const font = useBlockFont();
	if (!font) return null;
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			{SHOTS.map((s, i) => {
				const start = Math.max(0, s.at - TLEN[s.tr] / 2);
				const next = SHOTS[i + 1];
				const end = next ? next.at + TLEN[next.tr] / 2 : DBCOOPER_FRAMES;
				return (
					<Sequence key={i} from={start} durationInFrames={Math.max(1, Math.round(end - start))}>
						<ShotLayer i={i} start={start} />
					</Sequence>
				);
			})}
			<CaptionsFor timing={T} />
			<Audio src={staticFile('vo/dbcooper.wav')} />
			{CUES.map((c, i) => (
				<Sequence key={`a${i}`} from={Math.max(0, Math.round(c.t * FPS))} layout="none">
					<Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol ?? 1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
