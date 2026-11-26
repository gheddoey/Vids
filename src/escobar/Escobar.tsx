import React, {useEffect, useState} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, Easing, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {BlockText, useBlockFont} from '../BlockText';
import {onTwos, walk} from '../anim';
import {CaptionsFor, handOf} from '../lebron/common';
import {PS1Pass, nearest} from '../ps1/ps1';
import {B, Cyl} from '../ps1/sets';
import {Who} from '../lowpoly/Rig';
import {CineGrade, CinePreset} from '../cine/Cine';
import {Cam2, K, pop, pose} from '../lebron2/LeBron2';
import {P, Person} from './cast';
import {Alley, Cabin, CashBrick, Catedral, Congress, CountingRoom, Hillside, MapAmericas, Market, Napoles, NightCity, Records, RichList, River, Rooftops2, Void, Warehouse, Airstrip} from './sets';
import {Birds, HippoV2, Motes, Ripples, Smoke, SuperCub, life} from './kit';
import {RiverV3} from './river';
import timing from './timing.json';

// Pablo Escobar v2 — production-system rework: living environments (ambient layer in every shot),
// characters with life (blinks, weight shifts, look-arounds), intentional cameras, smooth transitions.
// Factual, never glamorous: violence is only implied.

const FPS = 30;
const PI = Math.PI;
const T = timing as {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};
const sec = (s: number) => Math.round(s * FPS);
export const ESCOBAR_FRAMES = sec(T.duration + 0.4);
const L = (i: number) => T.lines[i];
const W = (i: number, w: number) => L(i).words[w];
type V3 = [number, number, number];
type ShotProps = {f: number; d: number; a: Record<string, number>; g: number};

// A character with LIFE: blinks + idle weight shifts on top of its key poses.
const Man: React.FC<{p: Person; pose: object; at: V3; f: number; ph?: number; calm?: number; holdR?: React.ReactNode; holdL?: React.ReactNode}> = ({p, pose: ps, at, f, ph = 0, calm = 1, holdR, holdL}) => (
	<Who look={p.look} h={p.h} pose={life(ps as {face?: string}, f, ph, calm)} at={at} holdR={holdR} holdL={holdL} />
);
const hand = (p: Person, ps: object, side: 'L' | 'R', at: V3) => handOf(ps, side, at, p.h);
const sit = (p: Person, seat: number) => ({y: seat / p.h - 2, legLX: -PI / 2, legRX: -PI / 2});

// The real 1976 mugshot as a 64-px texture (loaded before any canvas mounts).
let mugTex: THREE.Texture | null = null;
const useMug = () => {
	const [ok, setOk] = useState(!!mugTex);
	const [h] = useState(() => (mugTex ? null : delayRender('mugshot')));
	useEffect(() => {
		if (mugTex) return;
		new THREE.TextureLoader().load(staticFile('covers/escobar_mugshot_1976.png'), (t) => {
			t.colorSpace = THREE.SRGBColorSpace;
			mugTex = nearest(t);
			setOk(true);
			if (h !== null) continueRender(h);
		});
	}, [h]);
	return ok;
};

// ---------------- shots ----------------

// 1  Hook: waterline push-in; hippos surface one by one; "200+"
const Hook: React.FC<ShotProps> = ({f, d, a}) => {
	const up = (i: number) => interpolate(onTwos(f), [2 + i * 9, 14 + i * 9], [2.4, 0.95], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.3))});
	const s = pop(f, a.two);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.8, 0.85, 14], t: [0, 2.2, -2]}, {f: d, p: [0.4, 1.0, 11.5], t: [0, 2.4, -2]}]} />
			<RiverV3 f={f} cam={[0.6, 0.9, 13]} fg="hook" />
			<HippoV2 f={f} pos={[-1.4, 0, -0.5]} rot={0.35} sub={up(0)} />
			<HippoV2 f={f} pos={[3, 0, -4]} rot={-0.5} sub={up(1)} s={0.85} phase={2} />
			<HippoV2 f={f} pos={[-4.5, 0, -7]} rot={0.9} sub={up(2)} s={0.75} phase={4} />
			{[[-1.4, -0.5], [3, -4], [-4.5, -7]].map(([x, z], i) => (onTwos(f) > 6 + i * 9 ? <Ripples key={i} f={f + i * 13} pos={[x, 0, z + 1.5]} r={2.2 - i * 0.3} /> : null))}
			<Motes f={f} n={70} center={[0, 3, -4]} size={[16, 5, 10]} color="#fff0c0" glow={1.6} s={0.06} />
			<group position={[0, 6.4, -4]} scale={s}>
				<BlockText text="200+" size={1.2} depth={0.45} color="#f2d040" side="#8a6a10" />
			</group>
		</>
	);
};

// 2  "And one man put them there." High wide over the Nápoles gate; two hippos lumber out
const Gate: React.FC<ShotProps> = ({f, d}) => {
	const z = (k: number) => interpolate(f, [0, d], [-16 + k * 1.5, -9 + k * 1.5]);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3, 14, 16], t: [0, 6, -12]}, {f: d, p: [2.4, 9, 14], t: [0, 5, -12]}]} />
			<Napoles show={0} f={f} />
			<HippoV2 f={f} pos={[-1.2, 0, z(0)]} rot={0.15} s={0.8} walk />
			<HippoV2 f={f} pos={[1.8, 0, z(-2)]} rot={-0.1} s={0.7} walk phase={1.5} />
		</>
	);
};

// 3  Medellín hillside: crane down to the family; father hoes coffee, mother with the slate, boy runs
const Family: React.FC<ShotProps> = ({f, d, a}) => {
	const hoe = [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96].map((k, i) => ({f: k, armRX: i % 2 ? -0.8 : -2.3, lean: i % 2 ? 0.25 : 0.05}));
	const dad = pose([{f: 0, rotY: 0.6, face: 'serious', armRX: -0.8}, ...hoe], f);
	const mom = pose([{f: 0, rotY: -0.3, face: 'smile', armLX: -0.3}, {f: a.teacher - 4, armLX: -1.6, armLZ: 0.25, face: 'proud', ease: 'back'}], f, 1);
	const boy = pose([...(walk(0, d, [-1.6, 1.8], [1.2, 1.2], 6) as K[]), {f: 0, rotY: PI / 2 - 0.3, face: 'smile'}, {f: a.teacher, headY: 0.7}], f, 2);
	const dadAt: V3 = [-3.2, 0, -1.4];
	const momAt: V3 = [2.6, 0, -3.6];
	const hd = hand(P.father, dad, 'R', dadAt);
	const hm = hand(P.mother, mom, 'L', momAt);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [1, 12, 22], t: [0, 0, -20]}, {f: Math.round(d * 0.45), p: [0.4, 5, 15], t: [0, 2.8, -2]}, {f: d, p: [0.2, 4.6, 13.5], t: [0, 3, -2]}]} />
			<Hillside />
			<Smoke f={f} pos={[3.6, 6, -9]} n={7} h={8} color="#d8d4cc" spread={0.12} scale={0.35} />
			<Birds f={f} from={[-30, 14, -30]} dir={[0.26, 0.01, 0.02]} />
			<Man p={P.father} pose={dad} at={dadAt} f={f} />
			<Man p={P.mother} pose={mom} at={momAt} f={f} ph={1} />
			<Man p={P.boy} pose={boy} at={[0, 0, 0]} f={f} ph={2} calm={0.5} />
			<group position={[hd.x, hd.y + 0.6, hd.z]} rotation={[dad.armRX ? -(dad.armRX as number) * 0.3 : 0, 0, 0]}>
				<B size={[0.1, 3, 0.1]} color="#6a4a2a" />
				<B size={[0.7, 0.25, 0.12]} pos={[0, 1.5, 0.12]} color="#8a8a88" />
			</group>
			<group position={[hm.x, hm.y + 0.3, hm.z + 0.2]}>
				<B size={[1.2, 0.9, 0.08]} color="#2a3a32" />
				<B size={[1.3, 1.0, 0.06]} pos={[0, 0, -0.02]} color="#8a6a44" />
				<BlockText text="A B C" size={0.18} depth={0.02} color="#f2f2e8" position={[0, 0.05, 0.05]} />
			</group>
		</>
	);
};

// 4  Market: tracking dolly; teen fans tickets, glances both ways, slips a carton under the stall
const Hustle: React.FC<ShotProps> = ({f, d, a}) => {
	const p = pose(
		[
			{f: 0, rotY: 0.3, face: 'smug', armRX: -0.4},
			{f: a.sold - 4, armRX: -1.9, armRZ: -0.4, ease: 'back'},
			{f: a.smug - 12, headY: 0.8, armRX: -1.2},
			{f: a.smug - 6, headY: -0.8},
			{f: a.smug - 2, armRX: -0.6, armLX: -1.1, armLZ: 0.3, rotY: -0.4, headY: 0, face: 'serious', ease: 'snap'},
		],
		f,
	);
	const at: V3 = [-0.6, 0, 1.2];
	const hR = hand(P.teen, p, 'R', at);
	const hL = hand(P.teen, p, 'L', at);
	const cartons = onTwos(f) >= a.smug - 2;
	const s1 = pose([...(walk(0, d, [-9, -1.5], [7, -1.8], 8) as K[]), {f: 0, rotY: PI / 2, face: 'smile'}], f, 3);
	const s2 = pose([...(walk(0, d, [8, -2.6], [-6, -2.4], 9) as K[]), {f: 0, rotY: -PI / 2, face: 'serious'}], f, 4);
	const v = pose([{f: 0, rotY: 0.2, face: 'talkA', armRX: -1.0}, ...[6, 12, 18, 24, 30].map((k, i) => ({f: k, armRX: i % 2 ? -1.4 : -0.9, face: i % 2 ? 'talkB' : 'talkA'}))], f, 5);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3.2, 4.2, 13], t: [0.6, 2.8, -1]}, {f: a.smug + 6, p: [0.6, 3.6, 11], t: [-0.4, 2.6, 0]}, {f: d, p: [0.4, 3.5, 10.5], t: [-0.4, 2.5, 0]}]} />
			<Market />
			<Motes f={f} n={80} center={[0, 2, -1]} size={[16, 4, 6]} color="#e8c890" glow={1.2} s={0.06} />
			<Man p={P.vendor} pose={v} at={[4.6, 0, -2.8]} f={f} ph={5} />
			<Man p={P.shopper1} pose={s1} at={[0, 0, 0]} f={f} ph={3} calm={0.4} />
			<Man p={P.shopper2} pose={s2} at={[0, 0, 0]} f={f} ph={4} calm={0.4} />
			<Man p={P.teen} pose={p} at={at} f={f} />
			{!cartons ? (
				<group position={[hR.x, hR.y + 0.3, hR.z + 0.2]}>
					{[-0.3, -0.1, 0.1, 0.3].map((r, i) => <B key={i} size={[0.4, 0.6, 0.02]} pos={[0, 0.25, i * 0.01]} rot={[0, 0, r]} color={['#e8c84a', '#f2a0a0', '#a0c8f2', '#c8f2a0'][i]} shadow={false} />)}
				</group>
			) : (
				<group position={[hL.x, hL.y + 0.2, hL.z + 0.2]}>
					<B size={[1.0, 0.45, 0.6]} color="#c83a3a" />
					<B size={[1.02, 0.14, 0.62]} pos={[0, 0.08, 0]} color="#f2f2f2" />
				</group>
			)}
		</>
	);
};

// 5  "By his twenties, he was…" low tracking behind 1970s Pablo; he looks back
const IntoAlley: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([...(walk(0, d + 6, [-2.5, 3], [1.2, -2.6], 8) as K[]), {f: 0, rotY: PI * 0.8, face: 'serious'}, {f: d - 14, headY: 0}, {f: d - 6, headY: 1.0, face: 'smug'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-3.2, 2.6, 12], t: [0, 3.2, -3]}, {f: d, p: [-2, 2.8, 10.5], t: [1, 3.3, -4]}]} />
			<Alley door={0.9} />
			<Smoke f={f} pos={[-3, 0, 1]} n={8} h={6} color="#8a8a92" spread={0.15} scale={0.45} />
			<Motes f={f} n={40} center={[5.5, 8.2, -4.4]} size={[2.4, 1.6, 2]} color="#ffe0a0" glow={2.5} s={0.08} rise={0} />
			<Man p={P.pablo70} pose={p} at={[0, 0, 0]} f={f} calm={0.4} />
		</>
	);
};

// 6  "…something far worse." The real 1976 mugshot; dust in the lamp beam, a turning fan
const Mugshot: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [-0.4, 5.4, 4.8], t: [-0.5, 5.3, -3.4]}, {f: d, p: [-0.55, 5.45, 2.5], t: [-0.6, 5.4, -3.4]}]} />
		<Records mug={mugTex} />
		<Motes f={f} n={90} center={[1, 4.5, -1]} size={[6, 4, 4]} color="#fff0c8" glow={1.4} s={0.05} />
		<group position={[3.6, 9, -1]} rotation={[0, onTwos(f) * 0.35, 0]}>
			<B size={[3.2, 0.06, 0.35]} color="#3a3a3a" />
			<B size={[0.35, 0.06, 3.2]} color="#3a3a3a" />
		</group>
	</>
);

// 7  "Cocaine." Loaders lift a crate of taped packages into the truck; the roll-up door slams
const Slam: React.FC<ShotProps> = ({f, d}) => {
	const door = interpolate(onTwos(f), [d - 10, d - 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
	const l1 = pose([{f: 0, rotY: -0.8, armRX: -1.6, armLX: -1.6, lean: 0.3, face: 'serious'}, {f: 8, lean: 0.05, armRX: -2.2, armLX: -2.2}], f, 1);
	const l2 = pose([{f: 0, rotY: 0.9, face: 'serious', armRX: -0.4, headY: 0.4}, {f: d - 12, armRX: -2.8, ease: 'back'}, {f: d - 4, armRX: -1.6}], f, 2);
	const at1: V3 = [-1.2, 0, 1.6];
	const h1 = hand(P.loader1, l1, 'R', at1);
	const h2 = hand(P.loader1, l1, 'L', at1);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-3, 4.6, 15], t: [1.4, 2.6, -2]}, {f: d, p: [-2.4, 4.4, 14], t: [1.8, 2.8, -2]}]} shake={{at: d - 4, amp: 0.12}} />
			<Warehouse f={f} door={door} />
			<Man p={P.loader1} pose={l1} at={at1} f={f} calm={0.3} />
			<Man p={P.loader2} pose={l2} at={[4.6, 0, 1.4]} f={f} ph={2} calm={0.3} />
			<group position={[(h1.x + h2.x) / 2, (h1.y + h2.y) / 2 + 0.4, (h1.z + h2.z) / 2]} rotation={[0, -0.8, 0]}>
				<B size={[1.2, 0.9, 1.2]} color="#7a5a3a" />
			</group>
		</>
	);
};

// 8  "By the planeload." The Super Cub takes off over a waving loader
const Planeload: React.FC<ShotProps> = ({f, d}) => {
	const z = interpolate(f, [0, d], [-24, 8]);
	const y = interpolate(f, [d * 0.4, d], [0, 5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
	const w = pose([{f: 0, rotY: -0.4, face: 'smile', armRX: -2.8, armRZ: -0.3}, ...[4, 8, 12, 16, 20, 24, 28, 32].map((k, i) => ({f: k, armRZ: i % 2 ? -0.7 : 0.1}))], f, 3);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [4, 1.4, 11], t: [0, 2, -12]}, {f: d, p: [3.6, 1.2, 11], t: [0, 5, 4]}]} />
			<Airstrip planeZ={-200} planeY={0} prop={0} />
			<group position={[0, y, z]} rotation={[-Math.min(0.25, y * 0.06), PI, 0]}>
				<SuperCub prop={f * 1.4} />
			</group>
			<Motes f={f} n={60} center={[0, 0.6, z + 3]} size={[6, 1.2, 4]} color="#c8a070" glow={0.9} s={0.14} rise={0.01} />
			<Man p={P.loader2} pose={w} at={[-4.4, 0, 3]} f={f} ph={3} />
			<Birds f={f} from={[-30, 12, -40]} dir={[0.3, 0.02, 0.05]} />
		</>
	);
};

// 9  The map: high angle, slow orbit; flight lines north; "80%"
const Map80: React.FC<ShotProps> = ({f, d, a}) => {
	const prog = interpolate(onTwos(f), [0, a.eighty], [0, 1], {extrapolateRight: 'clamp'});
	const s = pop(f, a.eighty);
	const ang = interpolate(f, [0, d], [-0.15, 0.15]);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [Math.sin(ang) * 18 - 2, 17, Math.cos(ang) * 18 + 2], t: [-3, 0, -2]}, {f: d, p: [Math.sin(ang) * 16 - 2, 15, Math.cos(ang) * 16 + 2], t: [-3, 0, -3]}]} />
			<MapAmericas progress={prog} />
			<group position={[-4, 6, -3]} rotation={[-0.7, 0, 0]} scale={s}>
				<BlockText text="80%" size={2.2} depth={0.5} color="#ff4a3a" side="#7a1a10" emissive={0.6} />
			</group>
		</>
	);
};

// 10  The billionaires list: 7 issues drop one per beat, 1987→1993
const Rich: React.FC<ShotProps> = ({f, d, a}) => {
	const shown = Math.min(7, Math.max(0, Math.floor((onTwos(f) - a.list) / 4) + 1));
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 8, 7.5], t: [0, 0, 0.5]}, {f: d, p: [0.5, 7, 6.6], t: [0.2, 0, 0.3]}]} />
			<RichList shown={shown} />
			<Motes f={f} n={50} center={[2, 2.5, -1]} size={[8, 3, 4]} color="#fff0c8" glow={1.2} s={0.05} />
		</>
	);
};

// 11  Counting room: Roberto writes in the ledger, pushes up his glasses; a worker stacks bricks
const Counting: React.FC<ShotProps> = ({f, d}) => {
	const seat = 1.6;
	const rob = pose(
		[
			{f: 0, ...sit(P.roberto, seat), armRX: -1.3, armLX: -1.2, face: 'serious', headX: 0.4},
			...[4, 8, 12, 16, 20, 24].map((k, i) => ({f: k, armRZ: i % 2 ? 0.1 : -0.1})),
			{f: 30, armLX: -2.6, armLZ: -0.4, headX: 0.1, ease: 'back'},
			{f: 40, armLX: -1.2, armLZ: 0, headX: 0.4},
		],
		f,
	);
	const wk = pose([{f: 0, rotY: -PI / 2, face: 'serious', armRX: -1.3, armLX: -1.3}, ...[10, 20, 30, 40, 50, 60, 70, 80].map((k, i) => ({f: k, lean: i % 2 ? 0.4 : 0, armRX: i % 2 ? -0.9 : -1.4, armLX: i % 2 ? -0.9 : -1.4}))], f, 3);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3.4, 5.2, 14.5], t: [0, 3.4, -2]}, {f: d, p: [1.6, 4.4, 10.5], t: [0, 3.2, 0]}]} />
			<CountingRoom f={f} />
			<Motes f={f} n={60} center={[0, 4, 0]} size={[8, 4, 4]} color="#e8ffd8" glow={1.2} s={0.05} />
			<Man p={P.roberto} pose={rob} at={[0, 0, 2.0]} f={f} calm={0.4} />
			<Man p={P.loader1} pose={wk} at={[5.4, 0, -1.6]} f={f} ph={3} calm={0.3} />
		</>
	);
};

// 12  SLICE IT OPEN (rule 5): macro on a cash brick; laser cut; the rubber bands labelled
const Slice: React.FC<ShotProps> = ({f, d, a}) => {
	const ff = onTwos(f);
	const laser = interpolate(ff, [a.cut - 8, a.cut], [1.2, -0.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const open = interpolate(ff, [a.cut, a.cut + 8], [0, 0.45], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
	const s = pop(f, a.label);
	const at: V3 = [0, 3.0, 0.6];
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.5, 4.5, 5.6], t: [0.1, 3.4, 0.4]}, {f: d, p: [0.3, 4.3, 4.6], t: [0.1, 3.5, 0.4]}]} shake={{at: a.cut, amp: 0.05, len: 6}} />
			<CountingRoom f={f} />
			<Motes f={f} n={50} center={[0, 3.6, 0.6]} size={[3, 2, 2]} color="#fff4d8" glow={1.6} s={0.035} />
			{open > 0 ? (
				<>
					<CashBrick pos={at} half={-1} open={open} />
					<CashBrick pos={at} half={1} open={open} />
				</>
			) : (
				<CashBrick pos={at} />
			)}
			{ff >= a.cut - 8 && ff < a.cut + 4 ? (
				<group position={[at[0], at[1] + laser, at[2] + 0.5]}>
					<B size={[0.03, 0.03, 1.6]} pos={[0, 0, -0.5]} color="#ff2a2a" glow={4} shadow={false} />
					<pointLight color="#ff3a3a" intensity={4} distance={3} />
				</group>
			) : null}
			{ff >= a.label ? (
				<group>
					<group position={[0.55, 3.55, 0.75]} rotation={[0, 0, 1.25]} scale={[s, 1, 1]}>
						<B size={[0.8, 0.04, 0.04]} color="#f8f4e8" glow={0.6} shadow={false} />
					</group>
					<group position={[0.05, 4.15, 0.6]} scale={s * 0.78}>
						<BlockText text="RUBBER BANDS" size={0.2} depth={0.06} color="#f2d040" side="#8a6a10" />
						<BlockText text="$2,500 / MONTH" size={0.2} depth={0.06} color="#ffffff" side="#5a5a5a" position={[0, -0.3, 0]} />
					</group>
				</group>
			) : null}
		</>
	);
};

// 13  "He built a ranch with a private zoo." Low wide; Pablo presents the gate with an arm sweep
const Ranch: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([{f: 0, rotY: 0.3, face: 'smile', armLX: 0}, {f: 6, armLX: -1.4, armLZ: 1.1, rotY: 0.55, headY: 0.6, face: 'grin', ease: 'back'}, {f: 26, armLZ: 0.6, armLX: -1.1, headY: 0}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-2, 2.6, 18], t: [0, 5.6, -12]}, {f: d, p: [-1.4, 2.4, 16], t: [0, 5.8, -12]}]} />
			<Napoles show={0} f={f} />
			<Man p={P.pablo80} pose={p} at={[-1.4, 0, 2]} f={f} />
		</>
	);
};

// 14  "Giraffes, zebras, and four hippos." One camera beat per word; animals alive
const Zoo: React.FC<ShotProps> = ({f, d, a}) => {
	const ff = onTwos(f);
	const show = ff >= a.hippos ? 3 : ff >= a.zebras ? 2 : 1;
	const surf = (i: number) => interpolate(ff, [a.hippos + i * 3, a.hippos + 8 + i * 3], [2.2, 0.75], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4))});
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-3.6, 5, 9], t: [-5.6, 4.6, -6]}, {f: a.zebras - 6, p: [-3.4, 5.2, 8.4], t: [-5.4, 4.8, -6]}, {f: a.zebras, p: [-0.6, 3.6, 7], t: [-1.6, 1.8, -3]}, {f: a.hippos - 6, p: [-0.4, 3.6, 6.6], t: [-1.6, 1.8, -3]}, {f: a.hippos, p: [4.4, 3.6, 7], t: [4, 0.9, -4]}, {f: d, p: [4.6, 3.4, 6.2], t: [4, 0.9, -4]}]} />
			<Napoles show={Math.min(show, 2)} f={f} />
			{show > 2
				? [
						[3, -3, 0.3, 0.9],
						[5.5, -5, -0.6, 1.0],
						[6, -1.8, 0.9, 0.8],
						[2, -6, -0.2, 0.7],
					].map(([x, z, r, s], i) => (
						<group key={i}>
							<HippoV2 f={f} pos={[x, 0, z]} rot={r} sub={surf(i)} s={s * 0.75} phase={i} />
							<Ripples f={f + i * 9} pos={[x, 0, z + 1]} r={1.4} />
						</group>
					))
				: null}
		</>
	);
};

// 15  Elected to Congress: push-in from the gallery; neighbours turn their heads
const Elected: React.FC<ShotProps> = ({f, a}) => {
	const p = pose([{f: 0, face: 'serious', rotY: 0}, {f: a.elected - 4, armRX: -2.9, armRZ: -0.1, face: 'smug', ease: 'back'}], f);
	const p1 = pose([{f: 0, rotY: -0.3, face: 'serious'}, {f: a.elected, headY: -0.9, face: 'shock', ease: 'snap'}], f, 1);
	const p2 = pose([{f: 0, rotY: 0.3, face: 'serious'}, {f: a.elected + 2, headY: 0.9, face: 'sad', ease: 'snap'}], f, 2);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 5.4, 4.5], t: [0, 3.6, -9]}, {f: a.elected + 10, p: [0, 4.8, 2.4], t: [0, 3.8, -9]}]} />
			<Congress />
			<Motes f={f} n={50} center={[0, 6, -6]} size={[12, 4, 6]} color="#fff0d0" glow={1.2} s={0.05} />
			<Man p={P.pabloSuit} pose={p} at={[0, 1.2, -7]} f={f} />
			<Man p={P.politico1} pose={p1} at={[-3.4, 1.2, -6.6]} f={f} ph={1} />
			<Man p={P.politico2} pose={p2} at={[3.4, 1.2, -6.6]} f={f} ph={2} />
		</>
	);
};

// 16  "But it was all built on blood." Wide night: smoke column over the brick hillsides, sirens
const Blood: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [4, 3.4, 12], t: [-3, 8, -28]}, {f: d, p: [3.4, 3.2, 10.5], t: [-3, 9, -28]}]} />
		<NightCity f={f} mode="smoke" />
	</>
);
// 17  "Bombings." Handheld in the street: smoke, sparks, emergency lights
const Bombings: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [-1, 2.4, -14], t: [-4, 6, -30]}, {f: d, p: [-1.2, 2.6, -15], t: [-4, 7, -30]}]} shake={{at: 0, amp: 0.3, len: 14}} />
		<NightCity f={f + 40} mode="smoke" />
		<Motes f={f} n={80} center={[-4, 3, -27]} size={[8, 6, 6]} color="#ffa040" glow={3} s={0.08} rise={0.02} />
		<B size={[0.6, 0.4, 0.4]} pos={[2, 0.8, -22]} color={Math.floor(f / 4) % 2 ? '#ff2a2a' : '#2a5aff'} glow={5} shadow={false} />
	</>
);
// 18  "A passenger plane…" slow dolly down an empty 727 aisle
const Seats: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [0, 4.2, 6], t: [0, 3, -16]}, {f: d, p: [0, 4.0, 2.5], t: [0, 3, -18]}]} />
		<Cabin f={f} />
	</>
);
// 19  "Thousands dead." Candles, low push-in
const Candles: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [0.4, 2.2, 5], t: [0, 0.6, -1.5]}, {f: d, p: [0.3, 1.8, 3.8], t: [0, 0.6, -1.5]}]} />
		<NightCity f={f} mode="candles" />
		<Motes f={f} n={40} center={[0, 1.4, -1.5]} size={[8, 2, 4]} color="#ffb060" glow={2} s={0.04} rise={0.008} />
	</>
);

// 20  La Catedral (day): walks in past saluting guards; the city far below
const Surrender: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([...(walk(0, d, [0, 7], [0, 2.5], 8) as K[]), {f: 0, rotY: PI, face: 'smug'}, {f: d - 10, headY: 0}, {f: d - 4, headY: 0.8}], f);
	const g = (i: number) => pose([{f: 0, rotY: i ? -2.2 : 2.2, face: 'serious'}, {f: 10 + i * 4, armRX: -2.6, armRZ: i ? 0.9 : -0.9, ease: 'back'}], f, i + 4);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [5, 9, 25], t: [0, 2, -4]}, {f: d, p: [3, 6, 21], t: [0, 3.4, -2]}]} />
			<Catedral f={f} />
			<Man p={P.guard} pose={g(0)} at={[-2.6, 0, 5]} f={f} ph={4} calm={0.3} />
			<Man p={P.guard} pose={g(1)} at={[2.6, 0, 5]} f={f} ph={5} calm={0.3} />
			<Man p={P.pablo80} pose={p} at={[0, 0, 0]} f={f} calm={0.3} />
		</>
	);
};
// 21  …"then walked right out of it." Night, low outside the fence; fireflies
const Escape: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([...(walk(0, d, [-1, 3], [-4, 9], 7) as K[]), {f: 0, rotY: -0.45, face: 'smug'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [2.4, 2.6, 16], t: [-2, 3, 3]}, {f: d, p: [1.6, 2.8, 17], t: [-3.5, 3, 7]}]} />
			<Catedral night f={f} />
			<Man p={P.pablo80} pose={p} at={[0, 0, 0]} f={f} calm={0.3} />
		</>
	);
};

// 22  1993 rooftop: phone call → he looks up at the police → runs with El Limón
const Roof: React.FC<ShotProps> = ({f, d, a}) => {
	const run = a.police + 8;
	const p = pose(
		[
			{f: 0, rotY: 0.5, face: 'talkA', armRX: -2.2, armRZ: -0.6, headY: -0.5, headZ: 0.2},
			...[4, 8, 12, 16, 20, 24, 28, 32].map((k, i) => ({f: k, face: i % 2 ? 'talkB' : 'talkA'})),
			{f: a.police - 4, face: 'serious'},
			{f: a.police, headY: 0.8, headX: -0.3, face: 'shock', armRX: -0.6, ease: 'snap'},
			...(walk(run, d + 20, [0, 1.5], [-6, -1], 5) as K[]),
			{f: run, rotY: -1.7, headY: 0, headX: 0, armRX: -0.3},
		],
		f,
	);
	const lim = pose([{f: 0, rotY: 0.9, face: 'serious', headY: -0.6}, {f: a.police + 2, headY: 0.6, face: 'shock', ease: 'snap'}, ...(walk(run - 2, d + 20, [3, 0.5], [-3, -1.5], 5) as K[]), {f: run - 2, rotY: -1.7}], f, 1);
	const cop = (i: number) => pose([{f: 0, rotY: 0.6 + i * 0.3, face: 'serious', armRX: -1.4, armLX: -1.4, armRZ: 0.3, armLZ: -0.3}], f, i + 3);
	const phone = onTwos(f) < a.police + 4;
	const atP: V3 = [-0.8, 0.4, 1.5];
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-3, 4, 15], t: [0, 2.6, 0]}, {f: a.police, p: [-2.6, 3.8, 14], t: [-0.4, 2.8, 0]}, {f: d, p: [-5, 4.6, 17], t: [-3, 2.4, -1]}]} />
			<Rooftops2 f={f} />
			<Man p={P.pablo93} pose={p} at={atP} f={f} calm={0.3} holdR={phone ? <B size={[0.25, 0.5, 0.12]} pos={[0, 0.1, 0.2]} color="#1a1a1a" /> : undefined} />
			<Man p={P.limon} pose={lim} at={[0, 0.4, 0]} f={f} ph={1} calm={0.3} />
			<Man p={P.cop1} pose={cop(0)} at={[-9, 0, -10]} f={f} ph={3} />
			<Man p={P.cop2} pose={cop(1)} at={[-5.5, 0, -12]} f={f} ph={4} />
		</>
	);
};

// 23  "…killed one day after his forty-fourth birthday." The cake's candles go out
const Cake: React.FC<ShotProps> = ({f, d, a}) => {
	const out = onTwos(f) >= a.killed;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 4.6, 6], t: [0, 2.6, 0]}, {f: d, p: [0, 4.2, 4.6], t: [0, 2.8, 0]}]} />
			<Void f={f} />
			<B size={[4, 0.2, 2.6]} pos={[0, 2.2, 0]} color="#5a3a22" />
			{[-1.7, 1.7].map((x) => <B key={x} size={[0.2, 2.2, 2.2]} pos={[x, 1.1, 0]} color="#4a2a18" />)}
			<Cyl r={0.9} h={0.7} seg={10} pos={[0, 2.65, 0]} color="#f2e4d0" />
			<Cyl r={0.92} h={0.1} seg={10} pos={[0, 2.95, 0]} color="#c84a6a" />
			<group position={[0, 3.5, 0]}>
				<BlockText text="44" size={0.6} depth={0.15} color="#f2d040" side="#8a6a10" emissive={out ? 0.2 : 1.2} />
			</group>
			{[-0.5, 0, 0.5].map((x, i) => (
				<group key={x} position={[x, 3.05, 0.5]}>
					<B size={[0.08, 0.35, 0.08]} pos={[0, 0.17, 0]} color="#f2f2f2" />
					{!out ? <B size={[0.07, 0.14, 0.07]} pos={[0, 0.42, 0]} color="#ffb84a" glow={4} shadow={false} /> : null}
				</group>
			))}
			{out ? [-0.5, 0, 0.5].map((x, i) => <Smoke key={x} f={f - a.killed + i * 5} pos={[x, 3.5, 0.5]} n={5} h={2.5} color="#a8a4a0" spread={0.1} scale={0.08} />) : null}
			{!out ? <pointLight position={[0, 3.6, 0.6]} color="#ffb060" intensity={4} distance={6} /> : null}
		</>
	);
};

// 24  The name in the dark — sits ABOVE the caption band
const Name: React.FC<ShotProps> = ({f, d, a}) => {
	const drop = interpolate(onTwos(f), [a.name - 2, a.name + 4], [8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 6.2, 12], t: [0, 5.0, 0]}, {f: d, p: [0, 6.0, 11], t: [0, 5.2, 0]}]} shake={{at: a.name + 4, amp: 0.25, len: 12}} />
			<Void f={f} />
			{onTwos(f) >= a.name - 2 ? (
				<group position={[0, 7.4 + drop, 0]}>
					<BlockText text="PABLO" size={0.95} depth={0.45} color="#f2f2f2" side="#5a5a5a" emissive={0.7} />
					<BlockText text="ESCOBAR" size={0.95} depth={0.45} color="#ffc72c" side="#8a6a10" emissive={0.9} position={[0, -1.25, 0]} />
					<pointLight position={[0, 1, 4]} color="#fff0d0" intensity={8} distance={12} />
				</group>
			) : null}
		</>
	);
};

// 25  "His empire died with him." Slow pull-back from the overgrown gate; a hippo walks past
const Ruins: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [0.6, 3.6, 8], t: [0, 4.6, -14]}, {f: d, p: [0.8, 4.2, 13], t: [0, 4.6, -14]}]} />
		<Napoles show={0} f={f} ruin />
		<HippoV2 f={f} pos={[interpolate(f, [0, d], [-7, -2]), 0, -6]} rot={PI / 2} s={0.8} walk />
	</>
);

// 26  "The hippos didn't." Waterline; a hippo yawns at us
const Yawn: React.FC<ShotProps> = ({f, d}) => {
	const jaw = interpolate(onTwos(f), [2, 12, d - 2], [0, 1.0, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.3))});
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-4.4, 2.3, 10.5], t: [-0.6, 1.4, 1.4]}, {f: d, p: [-4.0, 2.2, 9.6], t: [-0.6, 1.5, 1.4]}]} />
			<RiverV3 f={f} cam={[-4.2, 2.2, 10]} fg="yawn" />
			<HippoV2 f={f} pos={[0, 0, -1]} rot={-0.22} sub={0.75} jaw={jaw} />
			<Ripples f={f} pos={[0, 0, 1]} r={2.6} />
			<HippoV2 f={f} pos={[4.5, 0, -7]} rot={-0.6} sub={0.9} s={0.8} phase={2} />
			<HippoV2 f={f} pos={[9, 0, -10]} rot={-1.2} sub={0.9} s={0.7} phase={4} />
		</>
	);
};

// ---------------- edit: shots, grades, transitions ----------------

type Tr = 'cut' | 'fade' | 'whip' | 'zoom' | 'dip' | 'flash';
type ShotDef = {at: number; C: React.FC<ShotProps>; a?: (from: number) => Record<string, number>; look: CinePreset; tr: Tr};
const rel = (from: number, t: number) => sec(t) - from;
const cut = (s: number) => Math.max(0, sec(s) - 2);
const SHOTS: ShotDef[] = [
	{at: 0, C: Hook, look: 'golden', tr: 'cut', a: (fr) => ({two: rel(fr, W(0, 3).s)})},
	{at: cut(L(1).s), C: Gate, look: 'golden', tr: 'zoom'},
	{at: cut(L(2).s), C: Family, look: 'golden', tr: 'fade', a: (fr) => ({farmer: rel(fr, W(2, 9).s), teacher: rel(fr, W(2, 12).s)})},
	{at: cut(L(3).s), C: Hustle, look: 'noon', tr: 'whip', a: (fr) => ({sold: rel(fr, W(3, 4).s), smug: rel(fr, W(3, 9).s)})},
	{at: cut(L(4).s), C: IntoAlley, look: 'night', tr: 'dip'},
	{at: cut(W(4, 6).s), C: Mugshot, look: 'interior', tr: 'flash'},
	{at: cut(L(5).s), C: Slam, look: 'night', tr: 'cut'},
	{at: cut(L(6).s), C: Planeload, look: 'golden', tr: 'whip'},
	{at: cut(L(7).s), C: Map80, look: 'night', tr: 'zoom', a: (fr) => ({eighty: rel(fr, W(7, 5).s)})},
	{at: cut(L(8).s), C: Rich, look: 'interior', tr: 'whip', a: (fr) => ({list: rel(fr, W(8, 5).s)})},
	{at: cut(L(9).s), C: Counting, look: 'interior', tr: 'whip'},
	{at: cut(W(9, 13).s), C: Slice, look: 'interior', tr: 'zoom', a: (fr) => ({cut: rel(fr, W(9, 14).s), label: rel(fr, W(9, 15).s)})},
	{at: cut(L(10).s), C: Ranch, look: 'golden', tr: 'fade'},
	{at: cut(L(11).s), C: Zoo, look: 'golden', tr: 'whip', a: (fr) => ({zebras: rel(fr, W(11, 1).s), hippos: rel(fr, W(11, 4).s)})},
	{at: cut(L(12).s), C: Elected, look: 'interior', tr: 'whip', a: (fr) => ({elected: rel(fr, W(12, 3).s)})},
	{at: cut(L(13).s), C: Blood, look: 'night', tr: 'dip'},
	{at: cut(L(14).s), C: Bombings, look: 'night', tr: 'cut'},
	{at: cut(L(15).s), C: Seats, look: 'night', tr: 'dip'},
	{at: cut(L(16).s), C: Candles, look: 'night', tr: 'fade'},
	{at: cut(L(17).s), C: Surrender, look: 'golden', tr: 'fade'},
	{at: cut(W(17, 9).s), C: Escape, look: 'night', tr: 'dip'},
	{at: cut(L(18).s), C: Roof, look: 'golden', tr: 'whip', a: (fr) => ({police: rel(fr, W(18, 2).s)})},
	{at: cut(L(19).s), C: Cake, look: 'interior', tr: 'dip', a: (fr) => ({killed: rel(fr, W(19, 2).s)})},
	{at: cut(L(20).s), C: Name, look: 'night', tr: 'dip', a: (fr) => ({name: rel(fr, W(20, 3).s)})},
	{at: cut(L(21).s), C: Ruins, look: 'golden', tr: 'fade'},
	{at: cut(L(22).s), C: Yawn, look: 'golden', tr: 'zoom'},
];
const TLEN: Record<Tr, number> = {cut: 0, fade: 10, whip: 8, zoom: 8, dip: 12, flash: 6};

// Style for a shot layer during its in/out transitions (global frame g).
const layerStyle = (i: number, g: number): React.CSSProperties => {
	const s = SHOTS[i];
	const next = SHOTS[i + 1];
	const st: React.CSSProperties = {};
	const filters: string[] = [];
	let tx = 0;
	let sc = 1;
	let op = 1;
	// incoming
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
	// outgoing
	if (next && TLEN[next.tr] && g > next.at - TLEN[next.tr] / 2) {
		const q = Math.min(1, Math.max(0, (g - (next.at - TLEN[next.tr] / 2)) / TLEN[next.tr]));
		const e = Easing.inOut(Easing.cubic)(q);
		if (next.tr === 'whip') ((tx = -e * 100), filters.push(`blur(${e * 18}px)`));
		if (next.tr === 'zoom') ((sc = 1 + 0.5 * e), filters.push(`blur(${e * 10}px)`));
		if (next.tr === 'dip') filters.push(`brightness(${Math.max(0, 1 - q * 2)})`);
		if (next.tr === 'flash') filters.push(`brightness(${1 + q * 4})`);
	}
	st.opacity = op;
	st.transform = `translateX(${tx}%) scale(${sc})`;
	if (filters.length) st.filter = filters.join(' ');
	return st;
};

const ShotLayer: React.FC<{i: number; start: number}> = ({i, start}) => {
	const lf = useCurrentFrame();
	const g = start + lf;
	const def = SHOTS[i];
	const to = SHOTS[i + 1]?.at ?? ESCOBAR_FRAMES;
	const C = def.C;
	const f = g - def.at; // shot time is anchored to its nominal cut (negative while it fades in)
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
const nameT = W(20, 3).s;
const CUES: Cue[] = [
	{t: 0, file: 'bed_escobar', vol: 0.36},
	...SHOTS.slice(1).map((s) => ({t: s.at / FPS, file: s.tr === 'whip' ? 'whoosh' : 'swish', vol: s.tr === 'whip' ? 0.22 : 0.08})),
	{t: 0, file: 'river', vol: 0.4},
	...[0.15, 0.42, 0.7].map((x, i) => ({t: x + i * 0.12, file: 'grunt', vol: 0.3})),
	{t: L(1).s + 0.2, file: 'creak', vol: 0.35},
	{t: L(2).s + 0.1, file: 'rooster', vol: 0.3},
	{t: L(3).s, file: 'crowd', vol: 0.18},
	{t: W(4, 6).s, file: 'shutter', vol: 0.5},
	{t: L(5).s - 0.1, file: 'thud', vol: 0.35},
	{t: L(6).s - 0.2, file: 'slam', vol: 0.6},
	{t: L(6).s - 0.05, file: 'prop', vol: 0.45},
	{t: L(2).s + 0.6, file: 'thud', vol: 0.15},
	{t: L(3).s, file: 'river', vol: 0.0},
	{t: L(21).s + 0.3, file: 'grunt', vol: 0.3},
	{t: L(21).s, file: 'wind', vol: 0.25},
	{t: L(4).s, file: 'step', vol: 0.25},
	{t: L(4).s + 0.27, file: 'step', vol: 0.25},
	{t: L(4).s + 0.54, file: 'step', vol: 0.25},
	...[0, 0.25, 0.5, 0.75].map((x) => ({t: L(7).s + 0.3 + x, file: 'tick', vol: 0.3})),
	{t: W(7, 5).s, file: 'boom', vol: 0.3},
	...[0, 1, 2, 3, 4, 5, 6].map((k) => ({t: W(8, 5).s + k * (5 / FPS) * 2, file: 'flip', vol: 0.35})),
	{t: L(9).s, file: 'whirr', vol: 0.35},
	{t: W(9, 14).s - 0.25, file: 'laser', vol: 0.45},
	{t: W(9, 15).s, file: 'ding', vol: 0.3},
	{t: L(10).s, file: 'river', vol: 0.2},
	{t: W(11, 0).s, file: 'pop', vol: 0.4},
	{t: W(11, 1).s, file: 'pop', vol: 0.4},
	{t: W(11, 4).s, file: 'grunt', vol: 0.4},
	{t: W(12, 3).s, file: 'gavel', vol: 0.5},
	{t: L(13).s, file: 'siren', vol: 0.3},
	{t: L(14).s, file: 'boom', vol: 0.45},
	{t: L(15).s, file: 'wind', vol: 0.25},
	{t: L(17).s, file: 'creak', vol: 0.3},
	{t: W(17, 9).s, file: 'crickets', vol: 0.3},
	{t: L(18).s, file: 'heli', vol: 0.35},
	{t: W(19, 2).s, file: 'blow', vol: 0.4},
	{t: nameT, file: 'boom', vol: 0.85},
	{t: L(22).s + 0.2, file: 'grunt', vol: 0.6},
];

export const Escobar: React.FC = () => {
	const font = useBlockFont();
	const mug = useMug();
	if (!font || !mug) return null;
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			{SHOTS.map((s, i) => {
				const start = Math.max(0, s.at - TLEN[s.tr] / 2);
				const next = SHOTS[i + 1];
				const end = next ? next.at + TLEN[next.tr] / 2 : ESCOBAR_FRAMES;
				return (
					<Sequence key={i} from={start} durationInFrames={Math.max(1, Math.round(end - start))}>
						<ShotLayer i={i} start={start} />
					</Sequence>
				);
			})}
			<CaptionsFor timing={T} />
			<Audio src={staticFile('vo/escobar.wav')} />
			{CUES.map((c, i) => (
				<Sequence key={`a${i}`} from={Math.max(0, Math.round(c.t * FPS))} layout="none">
					<Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol ?? 1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
