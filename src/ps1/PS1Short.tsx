import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Pose} from '../Character';
import {BlockText, useBlockFont} from '../BlockText';
import {Key, onTwos} from '../anim';
import {Cam, CaptionsFor, poseAt} from '../lebron/common';
import {PS1Pass, RES} from './ps1';
import {Pix} from './Pix';
import {B, Bedroom, Controller, Cyl, LowPolyProps, Studio, crateTex} from './sets';
import {lambert} from './ps1';
import timing from './timing.json';

// Test short for the six-rule retro look, rendered in HD (1080x1920). The retro feel comes
// from low-poly boxes, 64-px nearest-filtered textures, vertex snapping and ordered dither.

const FPS = 30;
const PI = Math.PI;
const T = timing as {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};
const sec = (s: number) => Math.round(s * FPS);
export const PS1_FRAMES = sec(T.duration + 0.25);
const L = (i: number) => T.lines[i];
const word = (i: number, w: number) => L(i).words[w];
const cut = (s: number) => Math.max(0, sec(s) - 2);

type ShotProps = {f: number; d: number; g: number};
type K = Omit<Key, 'face'> & {face?: string};

// Mouth flaps on the words being spoken (global time), otherwise the pose's own face.
const talking = (g: number) => {
	const t = g / FPS;
	const w = T.lines.flatMap((l) => l.words).find((k) => t >= k.s && t < k.e - 0.04);
	return w ? (Math.floor(g / 3) % 2 ? 'talkA' : 'talkB') : null;
};
const P = (keys: K[], f: number, g: number, phase = 0, talk = true) => {
	const p = poseAt(keys as Key[], f, phase) as Partial<Pose> & {face?: string};
	const tf = talk ? talking(onTwos(g)) : null;
	if (tf && (p.face === undefined || p.face === 'talk')) p.face = tf;
	if (p.face === 'talk') p.face = 'smile';
	return p;
};
const pop = (f: number, at: number) => spring({frame: onTwos(f) - at, fps: FPS, config: {damping: 11, stiffness: 180, mass: 0.6}});

// ---------------- 0. Hook: bedroom, spins from the CRT to camera ----------------
const Hook: React.FC<ShotProps> = ({f, d, g}) => {
	const p = P(
		[
			{f: 0, rotY: PI * 0.85, face: 'talk', armRX: 0, headY: 0},
			{f: 8, rotY: -0.1, ease: 'back'},
			{f: 4, armRX: 0.3, lean: -0.1},
			{f: 12, armRX: -1.55, armRZ: 0.15, lean: 0.06, ease: 'back'},
			{f: 40, armRX: -1.5, headZ: 0},
			{f: 50, headZ: 0.12, armRX: -1.0},
			{f: 90, headZ: 0.1},
		],
		f,
		g,
	);
	const s = pop(f, 18);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.6, 5.2, 15.5]} p1={[0, 4.6, 11]} t0={[0.2, 3.6, -1.5]} t1={[0, 3.6, -1]} fov={42} />
			<Bedroom frame={g} />
			<Pix pose={{...p, x: 0, z: -0.6}} />
			<group position={[0, 8.2, -2]} scale={Math.max(0.001, s)}>
				<BlockText text="6 RULES" size={1.05} depth={0.45} color="#e8c84a" side="#a86a1a" />
			</group>
		</>
	);
};

// ---------------- 1. Low poly: T-pose turntable with the triangle wireframe ----------------
const LowPoly: React.FC<ShotProps & {wireOn: number; wireOff: number; numAt: number}> = ({f, d, g, wireOn, wireOff, numAt}) => {
	const p = P([{f: 0, armRZ: -0.2, armLZ: 0.2, face: 'talk'}, {f: 6, armRZ: -PI / 2, armLZ: PI / 2, ease: 'back'}], f, g);
	const spin = onTwos(f) * 0.03 - 0.5;
	const s = pop(f, numAt);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0, 5.4, 16]} p1={[0, 5.0, 14.5]} t0={[0, 4.4, 0]} t1={[0, 4.2, 0]} fov={42} />
			<Studio top="#0e2a33" bottom="#2a6a6a" base="#22424a" line="#7dff5a" rim="#7dff5a" />
			<group rotation={[0, spin, 0]}>
				<Pix pose={p} wire={f >= wireOn && f < wireOff} />
			</group>
			<LowPolyProps frame={onTwos(f)} />
			<group position={[0, 8.6, -1]} scale={Math.max(0.001, s)}>
				<BlockText text="300" size={1.0} depth={0.4} color="#7dff5a" side="#2a7a2a" />
				<BlockText text="TRIS" size={0.45} depth={0.2} color="#f3ead2" side="#888" position={[0, -0.95, 0]} />
			</group>
		</>
	);
};

// ---------------- 2. 64-px textures, painted by code ----------------
const Paint: React.FC<ShotProps> = ({f, d, g}) => {
	const rows = Math.min(64, Math.floor(interpolate(onTwos(f), [6, d - 14], [0, 64], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) / 4) * 4);
	const mat = React.useMemo(() => lambert({map: crateTex(rows)}), [rows]);
	const p = P(
		[
			{f: 0, rotY: -0.5, face: 'talk', armRX: -1.2, armRZ: 0.2},
			...[10, 22, 34, 46, 58, 70].map((k, i) => ({f: k, armRX: i % 2 ? -1.0 : -1.7, armRZ: i % 2 ? 0.1 : 0.35})),
		],
		f,
		g,
	);
	const s = pop(f, 10);
	return (
		<>
			<Cam frame={f} dur={d} p0={[-0.6, 5.2, 15]} p1={[-0.4, 4.8, 13.6]} t0={[-0.8, 3.6, -0.5]} t1={[-0.8, 3.4, -0.5]} fov={42} />
			<Studio top="#3a1a0e" bottom="#a8602a" base="#5a3a22" line="#e8c84a" rim="#ffb060" />
			<Pix
				pose={{...p, x: 1.4, z: 0.4}}
				holdR={
					<group rotation={[PI / 2, 0, 0]}>
						<B size={[0.14, 1.4, 0.14]} pos={[0, 0.5, 0]} color="#c84a4a" />
						<B size={[0.24, 0.4, 0.24]} pos={[0, 1.3, 0]} color="#7dff5a" glow={0.6} />
					</group>
				}
			/>
			<mesh position={[-2.6, 1.75, -1.2]} rotation={[0, 0.35, 0]} material={mat} castShadow receiveShadow>
				<boxGeometry args={[3.5, 3.5, 3.5]} />
			</mesh>
			<group position={[-2.4, 5.0, -1.2]} scale={Math.max(0.001, s)}>
				<BlockText text="64px" size={0.9} depth={0.35} color="#e8c84a" side="#8a5a1a" />
			</group>
			<Cyl r={0.4} h={0.7} seg={8} pos={[3.8, 0.35, 1.8]} color="#e04848" />
			<Cyl r={0.35} h={0.6} seg={8} pos={[4.6, 0.3, 0.8]} color="#4870e0" />
			<B size={[0.6, 0.06, 0.6]} pos={[3.8, 0.73, 1.8]} color="#ff8a8a" />
		</>
	);
};

// ---------------- 3. HD, but never smooth a pixel: macro on the 64-px face ----------------
const Tiny: React.FC<ShotProps & {numAt: number}> = ({f, d, g, numAt}) => {
	const p = P([{f: 0, face: 'talk', armRX: -0.2, armLX: 0}, {f: 6, armRX: -2.6, armRZ: -0.55, lean: -0.05, headZ: -0.08, ease: 'back'}, {f: 30, armRX: -2.4, armLX: -0.3, armLZ: 0.2}], f, g);
	const s = pop(f, numAt);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.3, 5.6, 9.5]} p1={[0.1, 5.3, 6.8]} t0={[0, 5.0, 0]} t1={[0, 4.85, 0]} fov={42} />
			<Studio top="#1e0e3a" bottom="#6a3aa8" base="#2e2250" line="#c08aff" rim="#c08aff" />
			<Pix pose={p} />
			<group position={[0, 6.95, -1.5]} scale={Math.max(0.001, s)}>
				<BlockText text="HD" size={1.1} depth={0.35} color="#f3ead2" side="#6a3aa8" />
			</group>
			<Controller pos={[3, 0.09, 1.5]} rot={[0, -0.6, 0]} />
		</>
	);
};

const NoSmooth: React.FC<ShotProps> = ({f, d, g}) => {
	const p = P(
		[
			{f: 0, face: 'smug', armRX: -0.3, armLX: -0.3, armRZ: 0.2, armLZ: -0.2, headY: 0},
			{f: 6, headY: -0.35},
			{f: 12, headY: 0.35},
			{f: 18, headY: -0.3},
			{f: 24, headY: 0},
		],
		f,
		g,
		0,
		false,
	);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.4, 5.3, 6.6]} p1={[0.2, 5.1, 6.0]} t0={[0, 4.8, 0]} t1={[0, 4.8, 0]} fov={42} />
			<Studio top="#1e0e3a" bottom="#6a3aa8" base="#2e2250" line="#c08aff" rim="#c08aff" />
			<Pix pose={p} />
		</>
	);
};

// ---------------- 4. Snap + dither (exaggerated so it reads) ----------------
const Snap: React.FC<ShotProps> = ({f, d, g}) => {
	const p = P(
		[
			{f: 0, face: 'talk', armRZ: -1.2, armLZ: 1.2},
			...[8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112].map((k, i) => ({f: k, side: i % 2 ? 0.12 : -0.12, armRZ: i % 2 ? -1.4 : -1.0, armLZ: i % 2 ? 1.0 : 1.4, ease: 'snap' as const})),
		],
		f,
		g,
	);
	const a = onTwos(f) * 0.012;
	return (
		<>
			<Cam frame={f} dur={d} p0={[Math.sin(a) * 12, 5.4, Math.cos(a) * 12]} p1={[Math.sin(a) * 12, 5.4, Math.cos(a) * 12]} t0={[0, 3.6, 0]} t1={[0, 3.6, 0]} fov={42} />
			<Studio top="#2a0e3a" bottom="#f08a3a" base="#3a2440" line="#ffb060" rim="#ff8ad8" />
			<Pix pose={p} />
			{Array.from({length: 5}, (_, i) =>
				Array.from({length: 2}, (_, j) => (
					<B key={`${i}-${j}`} size={[0.8, 0.8 + ((i * 3 + j) % 4) * 0.5, 0.8]} pos={[-6 + i * 3, 0.4 + ((i * 3 + j) % 4) * 0.25, -4 - j * 3]} color={['#ff8ad8', '#e8c84a', '#7dff5a', '#6fb6ff'][(i + j) % 4]} />
				)),
			)}
		</>
	);
};

// ---------------- 5. Slice it open, label one part ----------------
const Slice: React.FC<ShotProps & {cutAt: number; openAt: number; labelAt: number}> = ({f, d, g, cutAt, openAt, labelAt}) => {
	const p = P([{f: 0, face: 'talk', armRX: -0.4, armRZ: 0.3}, {f: openAt, face: 'shock'}, {f: labelAt + 6, face: 'smug'}], f, g, 0, false);
	const ff = onTwos(f);
	const laserY = interpolate(ff, [cutAt - 6, cutAt + 4], [6.4, 3.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const open = interpolate(ff, [openAt, openAt + 8], [0, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => 1 - Math.pow(1 - t, 3) * Math.cos(t * 4)});
	const s = pop(f, labelAt);
	const from = [1.15, 6.95];
	const to = [0.25, 5.1];
	const len = Math.hypot(from[0] - to[0], from[1] - to[1]);
	const ang = Math.atan2(from[1] - to[1], from[0] - to[0]);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.6, 6.4, 12.5]} p1={[0.5, 6.2, 11.4]} t0={[0.5, 5.4, 0]} t1={[0.5, 5.4, 0]} fov={42} />
			<Studio top="#060a1e" bottom="#1e3a7a" base="#141e3a" line="#6fb6ff" rim="#ff4a4a" />
			<Pix pose={p} slice={open} />
			{ff >= cutAt - 6 && ff < openAt + 4 ? (
				<group position={[0, laserY, 0]}>
					<B size={[0.03, 0.03, 3]} color="#ff2a2a" glow={3} shadow={false} />
					<B size={[0.03, 2.4, 0.03]} pos={[0, 1.2, 1.5]} color="#ff2a2a" glow={3} shadow={false} />
					<pointLight color="#ff3a3a" intensity={5} distance={4} />
				</group>
			) : null}
			{ff >= labelAt ? (
				<group>
					<group position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0.2]} rotation={[0, 0, ang]} scale={[Math.max(0.001, s), 1, 1]}>
						<B size={[len, 0.07, 0.07]} color="#f3ead2" glow={0.6} />
					</group>
					<group position={[1.3, 7.3, 0.2]} scale={Math.max(0.001, s)}>
						<BlockText text="BRAIN" size={0.42} depth={0.22} color="#f08aa0" side="#8a3a50" />
					</group>
				</group>
			) : null}
		</>
	);
};

// ---------------- 6-9. A new pose on every sentence ----------------
const POSES: K[] = [
	{face: 'smile', armRX: 0.25, armLX: 0.25, armRZ: 0.75, armLZ: -0.75, lean: -0.08, headX: -0.1}, // hands on hips
	{face: 'grin', armRX: -PI * 0.95, armRZ: -0.15, armLX: 0.3, armLZ: -0.7, side: -0.1, legRX: 0.2}, // fist to the sky
	{face: 'wink', armRX: -2.4, armLX: -2.4, armRZ: -0.6, armLZ: 0.6, legLX: -1.3, lean: -0.1, headZ: 0.15}, // crane
	{face: 'smug', armRX: -2.2, armRZ: -0.9, armLX: -1.7, armLZ: -1.0, headX: 0.45, headY: 0.35, lean: 0.1, side: 0.12}, // dab
];
const STAGES = [
	{top: '#1a1a1a', bottom: '#5a5a5a', base: '#2a2a2a', line: '#e8c84a', rim: '#e8c84a', cam: [[0, 2.4, 10.5], [0, 2.8, 11.2]], t: [0, 4.2, 0]},
	{top: '#3a0e0e', bottom: '#e04848', base: '#4a1a1a', line: '#ffb060', rim: '#ffd060', cam: [[-5, 6.5, 9.5], [-4.6, 6.3, 9.8]], t: [0, 4.0, 0]},
	{top: '#0e1e3a', bottom: '#4870e0', base: '#18284a', line: '#6fb6ff', rim: '#ffffff', cam: [[5.5, 3.5, 10], [5.8, 3.6, 10.2]], t: [0, 4.0, 0]},
	{top: '#0e3a1a', bottom: '#3fa34a', base: '#183a20', line: '#7dff5a', rim: '#e8ffb0', cam: [[1.5, 6, 8.2], [1.4, 5.8, 8.6]], t: [0, 4.4, 0]},
];

const PoseShot: React.FC<ShotProps & {i: number}> = ({f, d, g, i}) => {
	const prev = i ? POSES[i - 1] : {face: 'talk', armRZ: 0, armLZ: 0};
	const p = P([{f: 0, ...prev}, {f: 6, ...POSES[i], ease: 'back'}], f, g, i, i === 0);
	const st = STAGES[i];
	return (
		<>
			<Cam frame={f} dur={d} p0={st.cam[0]} p1={st.cam[1]} t0={st.t} t1={st.t} fov={42} />
			<Studio top={st.top} bottom={st.bottom} base={st.base} line={st.line} rim={st.rim} />
			<Pix pose={p} />
			{/* spotlight disc under the pose */}
			<Cyl r={2.6} h={0.06} seg={8} pos={[0, 0.03, 0]} color={st.rim} glow={0.35} />
		</>
	);
};

// ---------------- 10. Callback: back in the bedroom, plays the game ----------------
const End: React.FC<ShotProps> = ({f, d, g}) => {
	const seat = 1.35;
	const p = P(
		[
			{f: 0, rotY: -0.25, y: seat - 2, legLX: -PI / 2 + 0.15, legRX: -PI / 2 - 0.1, armRX: -1.0, armLX: -1.0, armRZ: 0.35, armLZ: -0.35, face: 'talk', headY: 0.5, lean: 0.1},
			{f: 6, headY: 0, lean: -0.05, ease: 'back'},
			{f: 12, armRX: -1.6, armRZ: -0.1, headZ: 0.1, face: 'talk', ease: 'back'},
			{f: 34, face: 'grin'},
		],
		f,
		g,
	);
	return (
		<>
			<Cam frame={f} dur={d} p0={[0.4, 5.2, 15]} p1={[0.6, 4.8, 13.8]} t0={[1.6, 3.4, -1.5]} t1={[1.6, 3.3, -1.5]} fov={42} />
			<Bedroom frame={g} />
			<Pix pose={{...p, x: 1.4, z: 1.6}} holdL={<Controller pos={[0.4, 0, 0.3]} rot={[0, 0, PI / 2]} />} />
		</>
	);
};

// ---------------- Shot list ----------------

type ShotDef = {from: number; C: React.FC<ShotProps & Record<string, number>>; props?: (from: number) => Record<string, number>};
const rel = (from: number, t: number) => sec(t) - from;
const SHOTS: ShotDef[] = [
	{from: 0, C: Hook},
	{from: cut(L(1).s), C: LowPoly as ShotDef['C'], props: (fr) => ({wireOn: rel(fr, word(1, 1).s), wireOff: rel(fr, word(1, 6).s), numAt: rel(fr, word(1, 3).s)})},
	{from: cut(L(2).s), C: Paint},
	{from: cut(L(3).s), C: Tiny as ShotDef['C'], props: (fr) => ({numAt: rel(fr, word(3, 4).s)})},
	{from: cut(word(3, 6).s), C: NoSmooth},
	{from: cut(L(4).s), C: Snap},
	{from: cut(L(5).s), C: Slice as ShotDef['C'], props: (fr) => ({cutAt: rel(fr, word(5, 1).s), openAt: rel(fr, word(5, 3).s), labelAt: rel(fr, word(5, 5).s)})},
	{from: cut(L(6).s), C: (p) => <PoseShot {...p} i={0} />},
	{from: cut(L(7).s), C: (p) => <PoseShot {...p} i={1} />},
	{from: cut(L(8).s), C: (p) => <PoseShot {...p} i={2} />},
	{from: cut(L(9).s), C: (p) => <PoseShot {...p} i={3} />},
	{from: cut(L(10).s), C: End},
];

// Exaggerated vertex snap (in pixels) and colour levels per shot, so rule 4 reads on a phone.
const fxFor = (def: ShotDef, f: number) => {
	if (def.C !== Snap) return {snap: 1, levels: 16};
	const g = def.from + f;
	const ditherAt = sec(word(4, 8).s);
	return {snap: g < ditherAt ? 4 : 2, levels: g < ditherAt ? 12 : 5};
};

const ShotCanvas: React.FC<{def: ShotDef; dur: number}> = ({def, dur}) => {
	const f = useCurrentFrame();
	const C = def.C;
	const fx = fxFor(def, f);
	return (
		<AbsoluteFill>
			<ThreeCanvas width={RES.w} height={RES.h} shadows="basic" dpr={1} gl={{antialias: true}}>
				<C f={f} d={dur} g={def.from + f} {...(def.props ? def.props(def.from) : {})} />
				<PS1Pass snap={fx.snap} levels={fx.levels} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};

// ---------------- Sound ----------------

type Cue = {t: number; file: string; vol?: number};
const at = (i: number, dt = 0) => L(i).s + dt;
const CUES: Cue[] = [
	{t: 0, file: 'bed_ps1', vol: 0.32},
	...SHOTS.slice(1).map((s) => ({t: s.from / FPS, file: 'swish', vol: 0.1})),
	{t: 0.05, file: 'whoosh', vol: 0.3},
	{t: 18 / FPS, file: 'blip', vol: 0.5},
	{t: word(1, 1).s, file: 'glitch', vol: 0.35},
	{t: word(1, 3).s, file: 'blip', vol: 0.4},
	{t: at(2, 0.2), file: 'scribble', vol: 0.45},
	{t: at(2, 1.0), file: 'scribble', vol: 0.4},
	{t: at(2, 1.8), file: 'scribble', vol: 0.35},
	{t: word(3, 1).s, file: 'whoosh', vol: 0.3},
	{t: word(3, 4).s, file: 'blip', vol: 0.4},
	{t: word(3, 6).s, file: 'click', vol: 0.5},
	{t: word(4, 1).s, file: 'glitch', vol: 0.45},
	{t: word(4, 8).s, file: 'glitch', vol: 0.35},
	{t: word(5, 1).s - 0.2, file: 'laser', vol: 0.5},
	{t: word(5, 3).s, file: 'thud', vol: 0.4},
	{t: word(5, 5).s, file: 'ding', vol: 0.3},
	...[6, 7, 8, 9].map((i, k) => ({t: at(i, 0.12), file: 'blip', vol: 0.4 + k * 0.05})),
	{t: at(10, 0.1), file: 'thud', vol: 0.3},
	{t: at(10, 0.5), file: 'coins', vol: 0.25},
];

export const PS1Short: React.FC = () => {
	const font = useBlockFont();
	if (!font) return null;
	return (
		<AbsoluteFill style={{backgroundColor: '#000', filter: 'saturate(1.05) contrast(1.05)'}}>
			{SHOTS.map((s, i) => {
				const to = SHOTS[i + 1]?.from ?? PS1_FRAMES;
				return (
					<Sequence key={i} from={s.from} durationInFrames={to - s.from}>
						<ShotCanvas def={s} dur={to - s.from} />
					</Sequence>
				);
			})}
			{/* Soft vignette, like an old TV's falloff */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
			<CaptionsFor timing={T} />
			{CUES.map((c, i) => (
				<Sequence key={`a${i}`} from={Math.max(0, Math.round(c.t * FPS))} layout="none">
					<Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol ?? 1} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
