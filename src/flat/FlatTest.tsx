import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {onTwos} from '../anim';
import {BG, Doodle, FChar, Face, FPose, FREST, INK, LW, Line, Shape} from './Flat';

// Style test: our own cast in the flat doodle look, with hair and lively poses.
export const CAST: Record<string, FChar> = {
	david: {body: '#3d4f7a', lapel: undefined, shirt: '#ececec', hair: 'swoop', hairColor: '#4a2e20', glasses: 'square', stripe: '#d8c8a0'},
	publicist: {body: '#e6dcc4', lapel: '#c9b892', shirt: '#a8483a', hair: 'slick', hairColor: '#cfcfcf', glasses: 'aviator', shadeColor: '#4a2c22', shape: 'coat', w: 1.08},
	mike: {body: '#a8483a', shape: 'tee', hair: 'messy', hairColor: '#6a4128', beard: '#6a4128'},
	rab: {body: '#5e7a52', shirt: '#ececec', hair: 'spiky', hairColor: '#c4602a', shape: 'tee', h: 1.05},
	fi: {body: '#5b7096', hair: 'bob', hairColor: '#2a1c18', shirt: '#d8b84a', h: 0.92},
	exec: {body: '#7a7e86', lapel: '#5a5e66', shirt: '#ececec', tie: '#a8483a', hair: 'slick', hairColor: '#2a1c18', h: 1.08, shape: 'coat'},
	mum: {body: '#b884a8', hair: 'curly', hairColor: '#8a3a4a', glasses: 'round', h: 0.95},
	sam: {body: '#2e2e34', shirt: '#ececec', hair: 'tuft', hairColor: '#2a1c18', beard: '#3a2a20', shape: 'tee'},
};

const ease = (t: number) => Easing.inOut(Easing.cubic)(Math.max(0, Math.min(1, t)));
const k = (f: number, a: number, b: number) => ease((f - a) / (b - a));
const lerpPose = (a: Partial<FPose>, b: Partial<FPose>, t: number): Partial<FPose> => {
	const out: Record<string, unknown> = {...FREST, ...a};
	for (const key of Object.keys(b) as (keyof FPose)[]) {
		const va = (a[key] ?? FREST[key]) as number | [number, number];
		const vb = b[key] as number | [number, number];
		if (Array.isArray(vb)) {
			const aa = (Array.isArray(va) ? va : [0, 0]) as [number, number];
			out[key] = [aa[0] + (vb[0] - aa[0]) * t, aa[1] + (vb[1] - aa[1]) * t];
		} else out[key] = (va as number) + (vb - (va as number)) * t;
	}
	return out as Partial<FPose>;
};

// Flat props
const Desk: React.FC<{f: number}> = ({f}) => (
	<g>
		<Shape pts={[[-260, 0], [260, 0], [260, 40], [-260, 40]]} fill="#a3876b" f={f} seed={300} />
		<Line pts={[[-220, 40], [-220, 230]]} f={f} seed={301} />
		<Line pts={[[220, 40], [220, 230]]} f={f} seed={302} />
	</g>
);
const Crt: React.FC<{f: number; glow?: string}> = ({f, glow = '#7fd49a'}) => (
	<g>
		<Shape pts={[[-130, -230], [130, -230], [140, 0], [-140, 0]]} fill="#d8cdb4" f={f} seed={310} />
		<Shape pts={[[-100, -200], [100, -200], [104, -40], [-104, -40]]} fill={glow} f={f} seed={311} w={LW * 0.8} />
		{[0, 1, 2].map((i) => (
			<Line key={i} pts={[[-70 + i * 50 + ((onTwos(f) * 3) % 50), -70], [-70 + i * 50 + ((onTwos(f) * 3) % 50), -90]]} f={f} seed={312 + i} w={LW * 0.7} />
		))}
	</g>
);
const Phone: React.FC<{f: number}> = ({f}) => (
	<g transform="rotate(-20)">
		<Shape pts={[[-18, -70], [18, -70], [20, 20], [-20, 20]]} fill="#3a3a3e" f={f} seed={320} w={LW * 0.8} />
		<Line pts={[[8, -70], [8, -110]]} f={f} seed={321} w={LW * 0.7} />
		<Shape pts={[[-10, -55], [10, -55], [10, -38], [-10, -38]]} fill="#9ad08a" f={f} seed={322} w={LW * 0.5} />
	</g>
);
const Mug: React.FC<{f: number}> = ({f}) => (
	<g>
		<Shape pts={[[-26, -60], [26, -60], [24, 0], [-24, 0]]} fill="#a8483a" f={f} seed={330} w={LW * 0.8} />
		<Line pts={[[26, -46], [44, -40], [44, -20], [24, -14]]} f={f} seed={331} w={LW * 0.7} />
		{[0, 1].map((i) => (
			<Line key={i} pts={[[-8 + i * 16, -78], [-14 + i * 16, -98], [-6 + i * 16, -118]]} f={f} seed={332 + i + onTwos(f)} w={LW * 0.5} amt={2} />
		))}
	</g>
);

// Scene 1 (0–59): David types, then whips round and snaps his fingers with a grin.
const Scene1: React.FC<{f: number}> = ({f}) => {
	const typ = Math.floor(onTwos(f) / 2) % 2;
	const turn = k(f, 26, 34);
	const pose = lerpPose(
		{lean: 0.08, armL: [-1.0, -0.5 - typ * 0.25], armR: [1.15, 0.4 + (1 - typ) * 0.25], headTilt: 0.06},
		{lean: -0.12, armL: [0.3, 0.3], armR: [2.6, 0.5], headTilt: -0.15, squash: 1.04, hop: 10},
		turn,
	);
	const face: Face = turn < 0.5 ? {eyes: 'dot', mouth: 'flat', lookX: 0.6, brow: 0.6} : {eyes: 'happy', mouth: 'grin', brow: -0.6};
	const snap = f >= 34 && f < 40;
	return (
		<g>
			<g transform="translate(700 1240)">
				<Desk f={f} />
				<g transform="translate(40 0)">
					<Crt f={f} />
				</g>
				<g transform="translate(-180 0)">
					<Mug f={f} />
				</g>
			</g>
			<Doodle c={{...CAST.david, h: 1.25}} pose={pose} face={face} x={360} y={1480} f={f} seed={11} />
			{snap ? (
				<g transform="translate(250 760)">
					{[0, 1, 2, 3, 4].map((i) => (
						<Line key={i} pts={[[Math.cos(i * 1.25) * 40, Math.sin(i * 1.25) * 40], [Math.cos(i * 1.25) * 80, Math.sin(i * 1.25) * 80]]} f={f} seed={340 + i} w={LW * 0.8} />
					))}
				</g>
			) : null}
		</g>
	);
};

// Scene 2 (60–119): the publicist leans back on the phone, then jabs a finger at the camera.
const Scene2: React.FC<{f: number}> = ({f}) => {
	const g = f - 60;
	const jab = k(g, 26, 31);
	const bob = Math.sin(onTwos(g) * 0.3) * 0.04;
	const pose = lerpPose(
		{lean: -0.14 + bob, armL: [2.6, 1.6], armR: [0.3, 0.2], headTilt: -0.12},
		{lean: 0.16, armL: [2.6, 1.6], armR: [1.5, -0.1], headTilt: 0.1, squash: 0.96},
		jab,
	);
	const face: Face = jab < 0.5 ? {eyes: 'dot', mouth: 'smirk'} : {eyes: 'dot', mouth: 'grin', brow: 0.5};
	return (
		<g>
			{/* framed window panels behind, mauve wall */}
			<rect x={0} y={0} width={1080} height={1920} fill="#b884a8" />
			<Shape pts={[[160, 520], [540, 518], [920, 520], [921, 1010], [920, 1500], [540, 1502], [160, 1500], [159, 1010]]} fill={BG} f={g} seed={400} w={LW * 1.4} amt={0.6} />
			<Doodle c={{...CAST.publicist, h: 1.45}} pose={pose} face={face} x={540} y={1500} f={g} seed={21} holdL={<Phone f={g} />} />
		</g>
	);
};

// Scene 3 (120–179): line-up of the cast with different hair, bouncing in on twos.
const Scene3: React.FC<{f: number}> = ({f}) => {
	const g = f - 120;
	const row: [string, number, number, Face, Partial<FPose>][] = [
		['mike', 170, 1020, {eyes: 'closed', mouth: 'grin'}, {armL: [1.2, 0.8], armR: [1.2, 0.8]}],
		['rab', 540, 1000, {eyes: 'wide', mouth: 'o'}, {armR: [2.7, 0.2], armL: [0.3, 0.2]}],
		['fi', 910, 1020, {eyes: 'lid', mouth: 'smirk'}, {armL: [-0.5, -1.6], armR: [-0.5, -1.6]}],
		['exec', 170, 1720, {eyes: 'squint', mouth: 'frown', brow: 1}, {armL: [0.6, -2.0], armR: [0.6, -2.0]}],
		['mum', 540, 1720, {eyes: 'wide', mouth: 'open', brow: -0.8}, {armL: [2.4, 0.4], armR: [2.4, 0.4]}],
		['sam', 910, 1720, {eyes: 'dot', mouth: 'smirk'}, {armR: [1.6, 1.2], armL: [0.2, 0.2]}],
	];
	return (
		<g>
			{row.map(([id, x, y, face, pose], i) => {
				const t = k(g, i * 4, i * 4 + 8);
				const hop = Math.sin(Math.min(1, t) * Math.PI) * 60;
				return <Doodle key={id} c={CAST[id]} pose={{...pose, hop, squash: 1 + (t < 1 ? 0.08 * Math.sin(t * Math.PI * 2) : 0)}} face={face} x={x} y={y} f={g} seed={50 + i * 13} />;
			})}
		</g>
	);
};

export const FlatTest: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: BG}}>
			<svg width={1080} height={1920} viewBox="0 0 1080 1920">
				<rect x={0} y={0} width={1080} height={1920} fill={BG} />
				{f < 60 ? <Scene1 f={f} /> : f < 120 ? <Scene2 f={f} /> : <Scene3 f={f} />}
			</svg>
		</AbsoluteFill>
	);
};
export {interpolate, INK};
