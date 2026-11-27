import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character, CharacterProps, Pose, REST} from '../Character';
import {Key, add, breathe, onTwos, sample} from '../anim';
import {RBox} from '../parts';
import timing from './timing.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const PI = Math.PI;
export const T = timing as {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};
export const sec = (s: number) => Math.round(s * FPS);
export const TOTAL = sec(T.duration + 0.35);

// ---------- Cast ----------

const LBJ_SKIN = '#6b4430';
const hairBlack = {type: 'short' as const, color: '#141110'};
export const CAST: Record<string, CharacterProps> = {
	kid: {shirt: 'ts_kid', skin: LBJ_SKIN, pants: '#2b2f3a', hair: hairBlack, eyeColor: '#5a3418', face: 'smile'},
	mom: {shirt: 'ts_mom', skin: '#7a5038', pants: '#2a2a33', hair: {type: 'bun', color: '#141110', accent: '#d8a23a'}, eyeColor: '#6a4024', face: 'smile', mark: 'blush'},
	coach: {shirt: 'ts_coach', skin: '#5c3c28', pants: '#1f2c4a', hat: {type: 'cap', color: '#1f2c4a', accent: '#f2f2f2'}, eyeColor: '#3a2416', face: 'smile', browColor: '#1a1310'},
	teen: {shirt: 'ts_hs23', skin: LBJ_SKIN, pants: '#1f6a3a', hair: hairBlack, eyeColor: '#5a3418', face: 'serious'},
	draft: {shirt: 'ts_suitwhite', skin: LBJ_SKIN, pants: '#f0eee8', hair: hairBlack, eyeColor: '#5a3418', face: 'smile'},
	finals: {shirt: 'ts_wine23', skin: LBJ_SKIN, pants: '#6f263d', hair: hairBlack, hat: {type: 'headband', color: '#f4f4f4', accent: '#e8e8e8'}, beard: '#141110', eyeColor: '#5a3418', face: 'serious'},
	record: {shirt: 'ts_purple6', skin: LBJ_SKIN, pants: '#552583', hair: hairBlack, hat: {type: 'headband', color: '#f4f4f4', accent: '#e8e8e8'}, beard: '#141110', eyeColor: '#5a3418', face: 'serious'},
	dad: {shirt: 'ts_purple23', skin: LBJ_SKIN, pants: '#552583', hair: hairBlack, hat: {type: 'headband', color: '#f4f4f4', accent: '#e8e8e8'}, beard: '#141110', eyeColor: '#5a3418', face: 'smile'},
	son: {shirt: 'ts_purple9', skin: '#70482f', pants: '#552583', hair: {type: 'short', color: '#17120f'}, eyeColor: '#4a2c18', face: 'smile'},
	opp1: {shirt: 'ts_blue4', skin: '#e3bb92', pants: '#1d428a', hair: {type: 'swept', color: '#3a2a1c'}, eyeColor: '#3a6fb0', face: 'squint'},
	opp2: {shirt: 'ts_blue8', skin: '#8a5a3c', pants: '#1d428a', hair: {type: 'short', color: '#141110'}, eyeColor: '#4a2c18', face: 'squint'},
};
export const SHIRTS = Array.from(new Set(Object.values(CAST).map((c) => c.shirt)));

// ---------- Actors ----------

const m4 = (pos: number[], rot: number[]) =>
	new THREE.Matrix4().compose(new THREE.Vector3(pos[0], pos[1], pos[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])), new THREE.Vector3(1, 1, 1));

// World position of a hand, for an actor placed at `at` with `scale`.
export const handOf = (pose: Partial<Pose>, side: 'L' | 'R', at: [number, number, number] = [0, 0, 0], scale = 1) => {
	const p = {...REST, ...pose};
	const s = side === 'L' ? 1 : -1;
	const m = new THREE.Matrix4()
		.makeTranslation(at[0], at[1], at[2])
		.multiply(new THREE.Matrix4().makeScale(scale, scale, scale))
		.multiply(m4([p.x, p.y, p.z], [0, p.rotY, 0]))
		.multiply(m4([0, 2, 0], [p.lean, p.twist, p.side]))
		.multiply(m4([s * 1.5, 1.75, 0], [side === 'L' ? p.armLX : p.armRX, 0, side === 'L' ? p.armLZ : p.armRZ]))
		.multiply(m4([0, 0.25, 0], [0, 0, 0]));
	return new THREE.Vector3(0, -2.0, 0.15).applyMatrix4(m);
};

export const poseAt = (keys: Key[], frame: number, phase = 0) => add(sample(keys, onTwos(frame)), breathe(onTwos(frame), phase));

export const Actor: React.FC<{
	c: CharacterProps;
	img: HTMLImageElement | null;
	pose: Partial<Pose>;
	at?: [number, number, number];
	scale?: number;
}> = ({c, img, pose, at = [0, 0, 0], scale = 1}) => (
	<group position={at} scale={scale}>
		<Character {...c} img={img} pose={pose} />
	</group>
);

// ---------- Camera ----------

export type CamMove = {p0: number[]; p1: number[]; t0: number[]; t1: number[]; fov?: number; shake?: {at: number; amp: number; len?: number}};

export const Cam: React.FC<CamMove & {frame: number; dur: number}> = ({p0, p1, t0, t1, fov = 40, frame, dur, shake}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	const t = interpolate(frame, [0, Math.max(1, dur)], [0, 1], {easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const L = (a: number[], b: number[]) => a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];
	const pos = L(p0, p1);
	if (shake && frame >= shake.at && frame < shake.at + (shake.len ?? 10)) {
		const k = 1 - (frame - shake.at) / (shake.len ?? 10);
		pos[0] += Math.sin(frame * 2.3) * shake.amp * k;
		pos[1] += Math.cos(frame * 3.1) * shake.amp * 0.7 * k;
	}
	camera.position.set(...pos);
	camera.fov = fov;
	camera.near = 0.1;
	camera.far = 400;
	camera.lookAt(...L(t0, t1));
	camera.updateProjectionMatrix();
	return null;
};

// ---------- Props ----------

export const Ball: React.FC<{r?: number}> = ({r = 0.36}) => (
	<group>
		<mesh castShadow>
			<sphereGeometry args={[r, 20, 14]} />
			<meshStandardMaterial color="#d8692a" roughness={0.65} />
		</mesh>
		{[0, PI / 2].map((a) => (
			<mesh key={a} rotation={[0, a, 0]}>
				<torusGeometry args={[r * 1.002, 0.015, 4, 32]} />
				<meshStandardMaterial color="#2a1a10" />
			</mesh>
		))}
		<mesh rotation={[PI / 2, 0, 0]}>
			<torusGeometry args={[r * 1.002, 0.015, 4, 32]} />
			<meshStandardMaterial color="#2a1a10" />
		</mesh>
	</group>
);

export const Football: React.FC = () => (
	<group>
		<mesh scale={[0.32, 0.32, 0.55]} castShadow>
			<sphereGeometry args={[1, 16, 12]} />
			<meshStandardMaterial color="#7a4524" roughness={0.6} />
		</mesh>
		<RBox size={[0.04, 0.03, 0.4]} pos={[0, 0.32, 0]} color="#f2f2f2" />
	</group>
);

// Hoop facing +z, rim centre at (0, 10, 0) by default (scaled R6 world: rim ~ 2x a player's height).
export const Hoop: React.FC<{rimY?: number}> = ({rimY = 10}) => (
	<group>
		<mesh position={[0, rimY / 2, -2.6]} castShadow>
			<boxGeometry args={[0.5, rimY + 1.5, 0.5]} />
			<meshStandardMaterial color="#2c2f36" metalness={0.4} roughness={0.5} />
		</mesh>
		<RBox size={[0.3, 0.3, 2.4]} pos={[0, rimY + 1.2, -1.4]} color="#2c2f36" />
		{/* Backboard */}
		<RBox size={[5.4, 3.4, 0.14]} pos={[0, rimY + 1.3, -0.3]} color="#f3f6f8" rough={0.2} />
		<RBox size={[1.9, 1.4, 0.16]} pos={[0, rimY + 0.85, -0.29]} color="#d8382b" />
		<RBox size={[1.6, 1.1, 0.18]} pos={[0, rimY + 0.85, -0.28]} color="#f3f6f8" rough={0.2} />
		{/* Rim and net */}
		<mesh position={[0, rimY, 0.7]} rotation={[PI / 2, 0, 0]}>
			<torusGeometry args={[0.75, 0.06, 8, 24]} />
			<meshStandardMaterial color="#e2541c" metalness={0.5} roughness={0.35} />
		</mesh>
		<mesh position={[0, rimY - 0.65, 0.7]}>
			<cylinderGeometry args={[0.74, 0.45, 1.25, 12, 3, true]} />
			<meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.85} />
		</mesh>
	</group>
);

// Flat sign/screen whose texture is drawn with canvas code; redrawn only when `k` changes.
export const Canvas2D: React.FC<{
	w: number;
	h: number;
	px?: number;
	k: string;
	draw: (g: CanvasRenderingContext2D, W: number, H: number) => void;
	emissive?: number;
}> = ({w, h, px = 160, k, draw, emissive = 0}) => {
	const tex = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = Math.round(w * px);
		c.height = Math.round(h * px);
		draw(c.getContext('2d')!, c.width, c.height);
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 8;
		return t;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [k, w, h, px]);
	return (
		<mesh>
			<planeGeometry args={[w, h]} />
			<meshStandardMaterial map={tex} emissiveMap={emissive ? tex : null} emissive={emissive ? '#ffffff' : '#000000'} emissiveIntensity={emissive} roughness={0.6} />
		</mesh>
	);
};

export const font = (px: number, weight = 900) => `${weight} ${px}px "Inter Display", "Inter", sans-serif`;

// Deterministic confetti falling through a box of space.
export const Confetti: React.FC<{frame: number; n?: number; area?: [number, number, number]; y0?: number; cols?: string[]}> = ({frame, n = 90, area = [16, 14, 8], y0 = 16, cols: colsIn}) => {
	const bits = useMemo(() => {
		let s = 11;
		const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
		const cols = colsIn ?? ['#ffb81c', '#ffffff', '#6f263d', '#ffd84a', '#c8102e'];
		return Array.from({length: n}, () => ({x: (r() - 0.5) * area[0], z: (r() - 0.5) * area[2], d: r() * area[1], v: 0.05 + r() * 0.05, s: r() * 6, c: cols[Math.floor(r() * cols.length)]}));
	}, [n, area]);
	const f = onTwos(frame);
	return (
		<group>
			{bits.map((b, i) => (
				<mesh key={i} position={[b.x + Math.sin(f * 0.1 + b.s) * 0.3, y0 - ((b.d + f * b.v * 2) % area[1]), b.z]} rotation={[f * 0.2 + b.s, f * 0.15, b.s]}>
					<planeGeometry args={[0.22, 0.12]} />
					<meshStandardMaterial color={b.c} side={THREE.DoubleSide} emissive={b.c} emissiveIntensity={0.25} />
				</mesh>
			))}
		</group>
	);
};

// ---------- Captions ----------

type Timing = {duration: number; lines: {text: string; s: number; e: number; words: {w: string; s: number; e: number}[]}[]};

const GOLD = new Set(['lebron', 'james', 'chosen', 'lionel', 'messi', 'pablo', 'escobar', 'cassius', 'clay', 'muhammad', 'ali']);

// One word on screen at a time, held until the next word starts (no flicker in pauses).
export const CaptionsFor: React.FC<{timing: Timing; top?: number}> = ({timing, top = 1180}) => {
	const words = React.useMemo(() => {
		const all = timing.lines.flatMap((l) => l.words.map((w) => ({...w})));
		all.forEach((w, i) => (w.e = Math.max(w.e, (all[i + 1]?.s ?? w.e + 0.6) - 0.01)));
		return all;
	}, [timing]);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const w = words.find((k) => t >= k.s && t < k.e);
	if (!w) return null;
	const pop = spring({frame: frame - Math.round(w.s * fps), fps, config: {damping: 14, stiffness: 260, mass: 0.5}});
	const word = w.w.replace(/["]/g, '');
	const key = word.replace(/[.,?!]/g, '').toLowerCase();
	const gold = GOLD.has(key);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', top}}>
			<div
				style={{
					transform: `scale(${0.86 + 0.14 * pop})`,
					fontFamily: '"Inter", sans-serif',
					fontWeight: 700,
					fontSize: gold ? 134 : 118,
					letterSpacing: -1.5,
					lineHeight: 1,
					color: gold ? '#ffc72c' : '#ffffff',
					WebkitTextStroke: '10px #000',
					paintOrder: 'stroke fill',
					textShadow: '0 6px 18px rgba(0,0,0,0.55)',
					whiteSpace: 'nowrap',
				}}
			>
				{word}
			</div>
		</AbsoluteFill>
	);
};

export const Captions: React.FC = () => <CaptionsFor timing={T} />;
