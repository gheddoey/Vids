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
import {Cam2, K, flashAt, pop, pose} from '../lebron2/LeBron2';
import {P, Person} from './cast';
import {Airstrip, Alley, CashBrick, Catedral, Congress, CountingRoom, Hillside, Hippo, MapAmericas, Market, Napoles, NightCity, Records, RichList, River, Rooftops, Void} from './sets';
import timing from './timing.json';

// Pablo Escobar — six rules, cinematic grade, smooth transitions. Factual, never glamorous:
// violence is only ever implied (smoke, empty seats, candles, a birthday cake going dark).

const FPS = 30;
const PI = Math.PI;
const T = timing as {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};
const sec = (s: number) => Math.round(s * FPS);
export const ESCOBAR_FRAMES = sec(T.duration + 0.4);
const L = (i: number) => T.lines[i];
const W = (i: number, w: number) => L(i).words[w];
type V3 = [number, number, number];
type ShotProps = {f: number; d: number; a: Record<string, number>; g: number};

const Man: React.FC<{p: Person; pose: object; at: V3; half?: -1 | 1}> = ({p, pose: ps, at, half}) => <Who look={p.look} h={p.h} pose={ps} at={at} half={half} />;
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

// 0  Hook: hippos surface in the river; "200+"
const Hook: React.FC<ShotProps> = ({f, d, a}) => {
	const up = (i: number) => interpolate(onTwos(f), [4 + i * 8, 14 + i * 8], [2.2, 0.75], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4))});
	const s = pop(f, a.two);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [1, 3.2, 14], t: [0, 1.6, -2]}, {f: d, p: [0.6, 3.6, 12.5], t: [0, 2.0, -2]}]} />
			<River f={f} />
			<Hippo pos={[-1.2, 0, -1]} rot={0.4} sub={up(0)} />
			<Hippo pos={[2.6, 0, -4]} rot={-0.5} sub={up(1)} s={0.85} />
			<Hippo pos={[-4, 0, -6]} rot={0.9} sub={up(2)} s={0.75} />
			<group position={[0, 6.0, -3]} scale={s}>
				<BlockText text="200+" size={1.2} depth={0.45} color="#f2d040" side="#8a6a10" />
			</group>
		</>
	);
};

// 1  "And one man put them there." Pull back to the ranch gate
const Gate: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [6, 3, 6], t: [12, 3.6, -11]}, {f: d, p: [2, 4, 12], t: [12, 3.6, -11]}]} />
		<River f={f} gate />
		<Hippo pos={[6, 0, -4]} rot={-0.9} sub={0.75} s={0.9} />
	</>
);

// 2  Medellín hillside: farmer father, schoolteacher mother, little Pablo
const Family: React.FC<ShotProps> = ({f, a}) => {
	const dad = pose([{f: 0, rotY: 0.35, face: 'serious', armRX: -0.3}, {f: a.farmer - 4, armRX: -2.4, armRZ: -0.1, ease: 'back'}, {f: a.farmer + 6, armRX: -1.2}], f);
	const mom = pose([{f: 0, rotY: -0.35, face: 'smile', armLX: -0.2}, {f: a.teacher - 4, armLX: -1.5, armLZ: 0.2, face: 'proud', ease: 'back'}], f, 1);
	const boy = pose([{f: 0, face: 'smile', headY: 0.4}, {f: a.farmer, headY: 0.5}, {f: a.teacher, headY: -0.5, ease: 'snap'}], f, 2);
	const dadAt: V3 = [-2.3, 0, 0];
	const momAt: V3 = [2.3, 0, 0.2];
	const hd = hand(P.father, dad, 'R', dadAt);
	const hm = hand(P.mother, mom, 'L', momAt);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 5, 19.5], t: [0, 3, -1]}, {f: a.teacher + 10, p: [0.3, 4.8, 18.5], t: [0, 3.1, -1]}]} />
			<Hillside />
			<Man p={P.father} pose={dad} at={dadAt} />
			<Man p={P.mother} pose={mom} at={momAt} />
			<Man p={P.boy} pose={boy} at={[0, 0, 1.2]} />
			{/* hoe and slate locked to hands */}
			<group position={[hd.x, hd.y + 0.6, hd.z]}>
				<B size={[0.1, 3, 0.1]} color="#6a4a2a" />
				<B size={[0.7, 0.25, 0.1]} pos={[0, 1.5, 0.1]} color="#8a8a88" />
			</group>
			<group position={[hm.x, hm.y + 0.3, hm.z + 0.2]}>
				<B size={[1.2, 0.9, 0.08]} color="#2a3a32" />
				<B size={[1.3, 1.0, 0.06]} pos={[0, 0, -0.02]} color="#8a6a44" />
				<BlockText text="A B C" size={0.18} depth={0.02} color="#f2f2e8" position={[0, 0.05, 0.05]} />
			</group>
		</>
	);
};

// 3  Teen at the market: fans lottery tickets, slips a carton under the table
const Hustle: React.FC<ShotProps> = ({f, a}) => {
	const p = pose(
		[
			{f: 0, rotY: 0.3, face: 'smug', armRX: -0.4},
			{f: a.sold - 4, armRX: -1.9, armRZ: -0.4, ease: 'back'},
			{f: a.smug - 4, armRX: -0.6, armLX: -1.1, armLZ: 0.3, rotY: -0.4, headY: 0.6, face: 'serious', ease: 'snap'},
		],
		f,
	);
	const at: V3 = [-0.6, 0, 1.2];
	const hR = hand(P.teen, p, 'R', at);
	const hL = hand(P.teen, p, 'L', at);
	const cartons = onTwos(f) >= a.smug - 4;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [1.8, 4.2, 13], t: [0, 2.8, -1]}, {f: a.smug + 8, p: [0.8, 3.8, 11.5], t: [-0.4, 2.6, 0]}]} />
			<Market />
			<Man p={P.teen} pose={p} at={at} />
			{!cartons ? (
				<group position={[hR.x, hR.y + 0.3, hR.z + 0.2]}>
					{[-0.3, -0.1, 0.1, 0.3].map((r, i) => <B key={i} size={[0.36, 0.55, 0.02]} pos={[0, 0.25, i * 0.01]} rot={[0, 0, r]} color={['#e8c84a', '#f2a0a0', '#a0c8f2', '#c8f2a0'][i]} shadow={false} />)}
				</group>
			) : (
				<group position={[hL.x, hL.y + 0.15, hL.z + 0.2]}>
					<B size={[0.7, 0.3, 0.45]} color="#c83a3a" />
					<B size={[0.72, 0.1, 0.46]} pos={[0, 0.05, 0]} color="#f2f2f2" />
				</group>
			)}
		</>
	);
};

// 4a  "By his twenties…" 1970s Pablo walks into the warehouse alley at night
const IntoAlley: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([...(walk(0, d + 6, [-2.5, 3], [1.2, -2.6], 8) as K[]), {f: 0, rotY: PI * 0.8, face: 'serious'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-2.4, 4.2, 14], t: [0.5, 3.4, -3]}, {f: d, p: [-1.8, 4.0, 13], t: [1.2, 3.4, -4]}]} />
			<Alley door={0.9} />
			<Man p={P.pablo70} pose={p} at={[0, 0, 0]} />
		</>
	);
};

// 4b  "…something far worse." The real 1976 mugshot, pinned up
const Mugshot: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [-0.4, 5.4, 4.6], t: [-0.5, 5.3, -3.4]}, {f: d, p: [-0.55, 5.45, 2.4], t: [-0.6, 5.4, -3.4]}]} />
		<Records mug={mugTex} />
	</>
);

// 5  "Cocaine." The door slams shut
const Slam: React.FC<ShotProps> = ({f}) => {
	const door = interpolate(onTwos(f), [0, 6], [0.9, 0], {extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [5.4, 4.2, 7], t: [2.4, 3.4, -5.3]}, {f: 20, p: [5.2, 4.2, 6.4], t: [2.4, 3.4, -5.3]}]} shake={{at: 6, amp: 0.12}} />
			<Alley door={door} />
			<pointLight position={[3, 5, -2]} color="#ffa860" intensity={22} distance={14} decay={1.2} />
		</>
	);
};

// 6  "By the planeload." Takeoff over the camera
const Planeload: React.FC<ShotProps> = ({f, d}) => {
	const z = interpolate(f, [0, d], [-26, 6]);
	const y = interpolate(f, [d * 0.45, d], [0, 4.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3.4, 1.6, 10], t: [0, 2, -14]}, {f: d, p: [3.0, 1.4, 10], t: [0, 4.5, 2]}]} />
			<Airstrip planeZ={z} planeY={y} prop={f * 1.3} />
		</>
	);
};

// 7  Map: flight lines north, "80%"
const Map80: React.FC<ShotProps> = ({f, d, a}) => {
	const prog = interpolate(onTwos(f), [0, a.eighty], [0, 1], {extrapolateRight: 'clamp'});
	const s = pop(f, a.eighty);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-1, 13, 16], t: [-1, 0, -2]}, {f: d, p: [-1.4, 11, 13], t: [-2, 0, -3]}]} />
			<MapAmericas progress={prog} />
			<group position={[-2.5, 4, -4.5]} rotation={[-0.6, 0, 0]} scale={s}>
				<BlockText text="80%" size={1.8} depth={0.5} color="#ff4a3a" side="#7a1a10" emissive={0.6} />
			</group>
		</>
	);
};

// 8  The rich list: 7 issues, one per year
const Rich: React.FC<ShotProps> = ({f, d, a}) => {
	const shown = Math.min(7, Math.max(0, Math.floor((onTwos(f) - a.list) / 5) + 1));
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 7, 8], t: [0, 0, 1]}, {f: d, p: [0.4, 6, 6.8], t: [0, 0, 0.5]}]} />
			<RichList shown={shown} />
		</>
	);
};

// 9a  Counting room: brother Roberto counting
const Counting: React.FC<ShotProps> = ({f, d}) => {
	const seat = 1.6;
	const rob = pose([{f: 0, ...sit(P.roberto, seat), armRX: -1.3, armLX: -1.3, face: 'serious', headX: 0.35}, ...[6, 12, 18, 24, 30, 36].map((k, i) => ({f: k, armRX: i % 2 ? -1.3 : -1.6}))], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3, 5, 14], t: [0, 3.4, -2]}, {f: d, p: [2.2, 4.6, 12.6], t: [0, 3.4, -2]}]} />
			<CountingRoom f={f} />
			<Man p={P.roberto} pose={rob} at={[0, 0, 2.0]} />
		</>
	);
};

// 9b  SLICE IT OPEN (rule 5): a cash brick cut in half, the rubber bands labelled
const Slice: React.FC<ShotProps> = ({f, d, a}) => {
	const ff = onTwos(f);
	const laser = interpolate(ff, [a.cut - 8, a.cut], [1.2, -0.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const open = interpolate(ff, [a.cut, a.cut + 8], [0, 0.45], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
	const s = pop(f, a.label);
	const at: V3 = [0, 3.0, 0.6];
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.4, 4.4, 5.2], t: [0.1, 3.4, 0.4]}, {f: d, p: [0.3, 4.3, 4.6], t: [0.1, 3.5, 0.4]}]} shake={{at: a.cut, amp: 0.05, len: 6}} />
			<CountingRoom f={f} />
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

// 10  Hacienda Nápoles gate, Pablo (80s) proud
const Ranch: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([{f: 0, face: 'smile', armRX: 0, armLX: 0}, {f: 6, armRZ: -1.0, armLZ: 1.0, armRX: -0.3, armLX: -0.3, face: 'grin', ease: 'back'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 4.4, 17], t: [0, 4.6, -8]}, {f: d, p: [0, 4.2, 15.5], t: [0, 4.8, -8]}]} />
			<Napoles show={0} />
			<Man p={P.pablo80} pose={p} at={[0, 0, 1]} />
		</>
	);
};

// 11  Giraffes, zebras, and four hippos — each pops in on its word
const Zoo: React.FC<ShotProps> = ({f, d, a}) => {
	const ff = onTwos(f);
	const show = ff >= a.hippos ? 3 : ff >= a.zebras ? 2 : 1;
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-3.6, 5, 9], t: [-5.6, 4.2, -6]}, {f: a.zebras - 6, p: [-3.4, 5, 8.6], t: [-5.4, 4.4, -6]}, {f: a.zebras, p: [-0.6, 3.6, 7], t: [-1.6, 1.8, -3]}, {f: a.hippos - 6, p: [-0.4, 3.6, 6.6], t: [-1.6, 1.8, -3]}, {f: a.hippos, p: [4.2, 4.2, 6], t: [4, 0.9, -4]}, {f: d, p: [4.4, 4.0, 5.4], t: [4, 0.9, -4]}]} />
			<Napoles show={show} />
		</>
	);
};

// 12  Elected to Congress: hand raised in the chamber
const Elected: React.FC<ShotProps> = ({f, a}) => {
	const p = pose([{f: 0, face: 'serious', rotY: 0}, {f: a.elected - 4, armRX: -2.9, armRZ: -0.1, face: 'smug', ease: 'back'}], f);
	const p1 = pose([{f: 0, rotY: -0.6, face: 'serious', headY: -0.4}], f, 1);
	const p2 = pose([{f: 0, rotY: 0.6, face: 'shock', headY: 0.4}, {f: a.elected, headX: 0.1}], f, 2);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 5, 4], t: [0, 3.6, -9]}, {f: a.elected + 10, p: [0, 4.6, 2.6], t: [0, 3.8, -9]}]} />
			<Congress />
			<Man p={P.pabloSuit} pose={p} at={[0, 1.2, -7]} />
			<Man p={P.politico1} pose={p1} at={[-3.4, 1.2, -6.6]} />
			<Man p={P.politico2} pose={p2} at={[3.4, 1.2, -6.6]} />
		</>
	);
};

// 13/14  "built on blood. Bombings." Smoke over the city; sirens
const Blood: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [4, 3, 10], t: [-3, 8, -28]}, {f: d, p: [3.4, 3, 8.5], t: [-3, 9, -28]}]} />
		<NightCity f={f} mode="smoke" />
	</>
);
const Bombings: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [-1, 2, 2], t: [-4, 7, -28]}, {f: d, p: [-1.2, 2.2, 1], t: [-4, 8, -28]}]} shake={{at: 0, amp: 0.25, len: 14}} />
		<NightCity f={f + 40} mode="smoke" />
	</>
);
// 15  "A passenger plane…" empty seats
const Seats: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [1, 3.6, 6], t: [-0.2, 2, -2]}, {f: d, p: [0.6, 3.2, 4.5], t: [-0.2, 2, -3]}]} />
		<NightCity f={f} mode="seats" />
	</>
);
// 16  "Thousands dead." Candles
const Candles: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [0.4, 2.4, 5], t: [0, 0.6, -1.5]}, {f: d, p: [0.3, 2.0, 4], t: [0, 0.6, -1.5]}]} />
		<NightCity f={f} mode="candles" />
	</>
);

// 17a  La Catedral (day): walks in through his own gate
const Surrender: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([...(walk(0, d, [0, 7], [0, 2.5], 8) as K[]), {f: 0, rotY: PI, face: 'smug'}, {f: d - 10, headY: 0}, {f: d - 4, headY: 0.8}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [3.4, 5, 19], t: [0, 3.4, 0]}, {f: d, p: [2.8, 5.2, 17.5], t: [0, 3.6, -2]}]} />
			<Catedral />
			<Man p={P.pablo80} pose={p} at={[0, 0, 0]} />
		</>
	);
};
// 17b  …(night) "then walked right out of it."
const Escape: React.FC<ShotProps> = ({f, d}) => {
	const p = pose([...(walk(0, d, [-1, 3], [-4, 9], 7) as K[]), {f: 0, rotY: -0.45, face: 'smug'}], f);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [2.4, 4, 15], t: [-2, 3, 3]}, {f: d, p: [1.6, 4.2, 16], t: [-3.5, 3, 7]}]} />
			<Catedral night />
			<Man p={P.pablo80} pose={p} at={[0, 0, 0]} />
		</>
	);
};

// 18  1993, the rooftop: barefoot on the tiles, police on the next roof
const Roof: React.FC<ShotProps> = ({f, d, a}) => {
	const p = pose([{f: 0, face: 'serious', rotY: 0.4, headY: -0.6, lean: 0.1}, {f: a.police, headY: 0.7, face: 'shock', ease: 'snap'}, {f: a.police + 10, armRX: -0.4, lean: 0.25}], f);
	const cop = (i: number) => pose([{f: 0, rotY: 0.6 + i * 0.3, face: 'serious', armRX: -1.4, armLX: -1.4, armRZ: 0.3, armLZ: -0.3}], f, i + 3);
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [-4, 4.4, 17], t: [-1.5, 2.2, -2]}, {f: d, p: [-3.4, 4.2, 15.4], t: [-1.5, 2.4, -2]}]} />
			<Rooftops f={f} />
			<Man p={P.pablo93} pose={p} at={[-0.8, 0.4, 1.5]} />
			<Man p={P.cop1} pose={cop(0)} at={[-8, -0.4, -10]} />
			<Man p={P.cop2} pose={cop(1)} at={[-5, -0.4, -12]} />
		</>
	);
};

// 19  "killed one day after his 44th birthday" — the cake's candles go out (no violence shown)
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
					{!out ? <B size={[0.07, 0.14, 0.07]} pos={[0, 0.42, 0]} color="#ffb84a" glow={4} shadow={false} /> : <B size={[0.04, 0.5 + i * 0.1, 0.04]} pos={[0, 0.6, 0]} color="#8a8a8a" shadow={false} />}
				</group>
			))}
			{!out ? <pointLight position={[0, 3.6, 0.6]} color="#ffb060" intensity={4} distance={6} /> : null}
		</>
	);
};

// 20  The name, in the dark
const Name: React.FC<ShotProps> = ({f, d, a}) => {
	const drop = interpolate(onTwos(f), [a.name - 2, a.name + 4], [8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0, 6.2, 12], t: [0, 5.4, 0]}, {f: d, p: [0, 6.0, 11], t: [0, 5.6, 0]}]} shake={{at: a.name + 4, amp: 0.25, len: 12}} />
			<Void f={f} />
			{onTwos(f) >= a.name - 2 ? (
				<group position={[0, 6.0 + drop, 0]}>
					<BlockText text="PABLO" size={0.95} depth={0.45} color="#f2f2f2" side="#5a5a5a" emissive={0.7} />
					<BlockText text="ESCOBAR" size={0.95} depth={0.45} color="#ffc72c" side="#8a6a10" emissive={0.9} position={[0, -1.25, 0]} />
					<pointLight position={[0, 1, 4]} color="#fff0d0" intensity={8} distance={12} />
				</group>
			) : null}
		</>
	);
};

// 21  "His empire died with him." The ranch gate in ruins
const Ruins: React.FC<ShotProps> = ({f, d}) => (
	<>
		<Cam2 f={f} k={[{f: 0, p: [8, 3, 4], t: [14, 3.4, -12]}, {f: d, p: [7, 3.4, 6], t: [14, 3.4, -12]}]} />
		<River f={f} ruin />
	</>
);

// 22  "The hippos didn't." One yawns at us
const Yawn: React.FC<ShotProps> = ({f, d}) => {
	const jaw = interpolate(onTwos(f), [4, 14, d - 2], [0, 1.0, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.3))});
	return (
		<>
			<Cam2 f={f} k={[{f: 0, p: [0.6, 1.7, 7.6], t: [0, 1.5, 0]}, {f: d, p: [0.5, 1.6, 6.6], t: [0, 1.55, 0]}]} />
			<River f={f} />
			<Hippo pos={[0, 0, -1]} rot={0} sub={0.65} jaw={jaw} />
			<Hippo pos={[-4, 0, -6]} rot={0.6} sub={0.8} s={0.8} />
			<Hippo pos={[4, 0, -8]} rot={-0.4} sub={0.8} s={0.7} />
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
	{t: L(5).s + 0.15, file: 'slam', vol: 0.6},
	{t: L(6).s - 0.2, file: 'prop', vol: 0.45},
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
