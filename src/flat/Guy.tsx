import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BG, HEAD, INK, LW, Line, Shape} from './Flat';

// "Guy": an explainer/storytelling stickman in the flat doodle style.
// Readable silhouette at small sizes: big round head, soft bean body, simple line arms that end
// in a round nub, short tube legs with rounded shoes. Faces carry the acting (brows + eyes + mouth).

type P2 = [number, number];
const circ = (cx: number, cy: number, rx: number, ry: number, n = 14): P2[] => Array.from({length: n}, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry]);

export type GuyLook = {
	shirt: string;
	pants?: string;
	shoes?: string;
	hair?: 'side' | 'crop' | 'curly' | 'long' | 'bun' | 'spike' | 'bald' | 'cap';
	hairCol?: string;
	glasses?: boolean;
	tie?: string;
	w?: number; // body width factor
	h?: number; // overall scale
};
export type Expr = 'neutral' | 'happy' | 'talk' | 'shock' | 'angry' | 'sad' | 'smug' | 'think' | 'laugh' | 'worried';
export type GuyPose = {
	armL: [number, number]; // [shoulder, elbow], + = outward/up on its own side
	armR: [number, number];
	legL: number;
	legR: number;
	lean: number;
	tilt: number; // head tilt
	turn: number; // 0 = front, 1 = full side (facing right)
	hop: number;
	sit?: boolean;
};
export const REST: GuyPose = {armL: [0.18, 0.1], armR: [0.18, 0.1], legL: 0, legR: 0, lean: 0, tilt: 0, turn: 0, hop: 0};

export const Guy: React.FC<{look: GuyLook; expr?: Expr; pose?: Partial<GuyPose>; x: number; y: number; s?: number; f?: number; seed?: number; headOnly?: boolean}> = ({look, expr = 'neutral', pose = {}, x, y, s = 1, f = 0, seed = 1, headOnly}) => {
	const P = {...REST, ...pose};
	const k = look.h ?? 1;
	const W = 112 * (look.w ?? 1); // half body width
	const BH = 230; // body height
	const LL = 92; // leg length
	const R = 112; // head radius
	const t = P.turn;
	const ground = 0;
	const hip = ground - LL;
	const neck = hip - BH;
	const hcY = neck - R + 30;
	const hcX = t * 18;

	// Body: soft bean, slightly narrower when turned.
	const bw = W * (1 - t * 0.18);
	const body: P2[] = [
		[-bw * 0.52, neck + 8],
		[-bw * 0.86, neck + BH * 0.3],
		[-bw * 0.95, neck + BH * 0.72],
		[-bw * 0.72, neck + BH * 0.98],
		[0, neck + BH * 1.03],
		[bw * 0.72, neck + BH * 0.98],
		[bw * 0.95, neck + BH * 0.72],
		[bw * 0.86, neck + BH * 0.3],
		[bw * 0.52, neck + 8],
		[0, neck - 2],
	].map(([px, py]) => [px + t * 10, py] as P2);

	const legX = bw * 0.38;
	const leg = (side: -1 | 1, swing: number) => {
		const x0 = side * legX * (1 - t * 0.6) + t * 10;
		const ex = x0 + Math.sin(swing) * LL;
		const ey = hip + Math.cos(swing) * LL;
		const toe = t > 0.3 ? 1 : side;
		return (
			<g key={side}>
				<Shape pts={[[x0 - 26, hip - 24], [x0 + 26, hip - 24], [ex + 23, ey - 8], [ex - 23, ey - 8]]} fill={look.pants ?? '#4b4f60'} f={f} seed={seed + 40 + side} amt={0.8} />
				<Shape pts={[[ex - 26, ey - 22], [ex + 20 + toe * 18, ey - 18], [ex + 26 + toe * 22, ey + 2], [ex - 28, ey + 4]]} fill={look.shoes ?? INK} f={f} seed={seed + 44 + side} w={LW * 0.8} amt={0.6} />
			</g>
		);
	};

	const shY = neck + 40;
	const arm = (side: -1 | 1, [a, e]: [number, number]) => {
		const ox = side * bw * 0.7 + t * 10;
		const L1 = 108;
		const L2 = 100;
		const th1 = Math.PI / 2 - a * side;
		const ex = ox + Math.cos(th1) * L1;
		const ey = shY + Math.sin(th1) * L1;
		const th2 = th1 - e * side;
		const hx = ex + Math.cos(th2) * L2;
		const hy = ey + Math.sin(th2) * L2;
		return (
			<g key={side}>
				<Line pts={[[ox, shY], [ex, ey], [hx, hy]]} f={f} seed={seed + 60 + side} w={LW * 1.2} amt={1} />
				<Shape pts={circ(hx + Math.cos(th2) * 8, hy + Math.sin(th2) * 8, 19, 18, 8)} fill={HEAD} f={f} seed={seed + 64 + side} w={LW * 0.8} amt={0.4} />
			</g>
		);
	};

	// Face: features slide toward the facing side; far eye squashes when turned.
	const fx = hcX + t * R * 0.55;
	const eyeY = hcY - 4;
	const eSep = 40 * (1 - t * 0.5);
	const E: Record<Expr, {eye: 'dot' | 'happy' | 'wide' | 'closed' | 'half'; brow: number; browY?: number; mouth: 'flat' | 'smile' | 'open' | 'o' | 'frown' | 'smirk' | 'grin' | 'wavy'}> = {
		neutral: {eye: 'dot', brow: 0, mouth: 'flat'},
		happy: {eye: 'happy', brow: -0.3, mouth: 'smile'},
		talk: {eye: 'dot', brow: -0.2, mouth: 'open'},
		shock: {eye: 'wide', brow: -1, browY: -12, mouth: 'o'},
		angry: {eye: 'dot', brow: 1.1, mouth: 'frown'},
		sad: {eye: 'dot', brow: -1.1, mouth: 'frown'},
		smug: {eye: 'half', brow: 0.4, mouth: 'smirk'},
		think: {eye: 'dot', brow: 0.6, mouth: 'wavy'},
		laugh: {eye: 'closed', brow: -0.5, mouth: 'grin'},
		worried: {eye: 'dot', brow: -0.9, mouth: 'wavy'},
	};
	const ex = E[expr];
	const eye = (side: -1 | 1) => {
		const cx = fx + side * eSep;
		const far = t > 0.2 && side < 0 ? 1 - t * 0.5 : 1;
		switch (ex.eye) {
			case 'happy':
				return <Line key={side} pts={[[cx - 16 * far, eyeY + 6], [cx, eyeY - 8], [cx + 16 * far, eyeY + 6]]} f={f} seed={seed + 70 + side} w={LW * 0.85} amt={0.4} />;
			case 'closed':
				return <Line key={side} pts={[[cx - 16 * far, eyeY - 4], [cx, eyeY + 8], [cx + 16 * far, eyeY - 4]]} f={f} seed={seed + 72 + side} w={LW * 0.85} amt={0.4} />;
			case 'wide':
				return (
					<g key={side}>
						<ellipse cx={cx} cy={eyeY} rx={20 * far} ry={22} fill="#ffffff" stroke={INK} strokeWidth={LW * 0.7} />
						<circle cx={cx + t * 6} cy={eyeY + 1} r={8} fill={INK} />
					</g>
				);
			case 'half':
				return (
					<g key={side}>
						<Line pts={[[cx - 17 * far, eyeY - 3], [cx + 17 * far, eyeY - 3]]} f={f} seed={seed + 74 + side} w={LW * 0.8} amt={0.3} />
						<ellipse cx={cx + 2} cy={eyeY + 6} rx={8 * far} ry={7} fill={INK} />
					</g>
				);
			default:
				return <ellipse key={side} cx={cx + t * 4} cy={eyeY} rx={12 * far} ry={15} fill={INK} />;
		}
	};
	const brow = (side: -1 | 1) => {
		const cx = fx + side * eSep;
		const by = eyeY - 32 + (ex.browY ?? 0);
		const b = ex.brow; // + angry (inner end down), - worried (inner end up)
		const inner = cx - side * 18;
		const outer = cx + side * 18;
		return <Line key={`b${side}`} pts={[[inner, by + b * 10], [outer, by - b * 6]]} f={f} seed={seed + 76 + side} w={LW * 1.05} amt={0.3} />;
	};
	const my = hcY + 48;
	const mx = fx + 4;
	const mouth = (() => {
		switch (ex.mouth) {
			case 'smile':
				return <Line pts={[[mx - 24, my - 4], [mx, my + 10], [mx + 24, my - 4]]} f={f} seed={seed + 80} w={LW * 0.85} amt={0.4} />;
			case 'open':
				return <Shape pts={[[mx - 20, my - 6], [mx + 20, my - 6], [mx + 12, my + 14], [mx - 12, my + 14]]} fill="#7a3a30" f={f} seed={seed + 81} w={LW * 0.8} amt={0.5} />;
			case 'o':
				return <Shape pts={circ(mx, my + 4, 13, 17, 8)} fill="#7a3a30" f={f} seed={seed + 82} w={LW * 0.8} amt={0.4} />;
			case 'frown':
				return <Line pts={[[mx - 20, my + 8], [mx, my - 4], [mx + 20, my + 8]]} f={f} seed={seed + 83} w={LW * 0.85} amt={0.4} />;
			case 'smirk':
				return <Line pts={[[mx - 22, my + 2], [mx + 4, my + 4], [mx + 22, my - 8]]} f={f} seed={seed + 84} w={LW * 0.85} amt={0.4} />;
			case 'grin':
				return <Shape pts={[[mx - 30, my - 8], [mx + 30, my - 8], [mx + 16, my + 20], [mx - 16, my + 20]]} fill="#7a3a30" f={f} seed={seed + 85} w={LW * 0.8} amt={0.5} />;
			case 'wavy':
				return <Line pts={[[mx - 22, my + 2], [mx - 8, my - 4], [mx + 6, my + 4], [mx + 22, my - 2]]} f={f} seed={seed + 86} w={LW * 0.8} amt={0.4} />;
			default:
				return <Line pts={[[mx - 18, my], [mx + 18, my + 1]]} f={f} seed={seed + 87} w={LW * 0.85} amt={0.4} />;
		}
	})();

	const hc = look.hairCol ?? '#4a2e20';
	const T = (dx: number, dy: number): P2 => [hcX + dx, hcY + dy];
	const hair = (() => {
		switch (look.hair) {
			case 'side':
				return <Shape pts={[T(-R * 0.99, R * 0.05), T(-R * 0.95, -R * 0.5), T(-R * 0.45, -R * 1.06), T(R * 0.35, -R * 1.06), T(R * 0.93, -R * 0.52), T(R * 0.99, -R * 0.12), T(R * 0.62, -R * 0.62), T(R * 0.05, -R * 0.7), T(-R * 0.55, -R * 0.6), T(-R * 0.85, -R * 0.2)]} fill={hc} f={f} seed={seed + 90} amt={0.8} />;
			case 'crop':
				return <Shape pts={[T(-R * 0.98, -R * 0.12), T(-R * 0.85, -R * 0.6), T(-R * 0.3, -R * 1.02), T(R * 0.3, -R * 1.02), T(R * 0.85, -R * 0.6), T(R * 0.98, -R * 0.16), T(R * 0.6, -R * 0.62), T(0, -R * 0.72), T(-R * 0.6, -R * 0.62)]} fill={hc} f={f} seed={seed + 91} amt={0.8} />;
			case 'curly':
				return (
					<g>
						{Array.from({length: 9}).map((_, i) => {
							const a = Math.PI + (i / 8) * Math.PI;
							return <Shape key={i} pts={circ(hcX + Math.cos(a) * R * 0.9, hcY + Math.sin(a) * R * 0.9 - 4, R * 0.28, R * 0.26, 8)} fill={hc} f={f} seed={seed + 100 + i} w={LW * 0.85} amt={0.6} />;
						})}
					</g>
				);
			case 'long':
				return <Shape pts={[T(-R * 1.08, R * 0.95), T(-R * 1.12, -R * 0.3), T(-R * 0.55, -R * 1.08), T(R * 0.55, -R * 1.08), T(R * 1.12, -R * 0.3), T(R * 1.08, R * 0.95), T(R * 0.84, R * 0.95), T(R * 0.86, -R * 0.2), T(R * 0.2, -R * 0.5), T(-R * 0.5, -R * 0.3), T(-R * 0.86, -R * 0.1), T(-R * 0.84, R * 0.95)]} fill={hc} f={f} seed={seed + 110} amt={0.8} />;
			case 'bun':
				return (
					<g>
						<Shape pts={circ(hcX, hcY - R * 1.1, R * 0.34, R * 0.3, 10)} fill={hc} f={f} seed={seed + 120} amt={0.6} />
						<Shape pts={[T(-R * 0.98, -R * 0.05), T(-R * 0.85, -R * 0.6), T(0, -R * 1.03), T(R * 0.85, -R * 0.6), T(R * 0.98, -R * 0.1), T(R * 0.6, -R * 0.6), T(0, -R * 0.68), T(-R * 0.6, -R * 0.6)]} fill={hc} f={f} seed={seed + 121} amt={0.8} />
					</g>
				);
			case 'spike':
				return <Shape pts={[T(-R * 0.98, -R * 0.1), T(-R * 1.08, -R * 0.75), T(-R * 0.55, -R * 0.95), T(-R * 0.35, -R * 1.32), T(0, -R * 1.02), T(R * 0.3, -R * 1.36), T(R * 0.5, -R * 0.98), T(R * 1.0, -R * 1.1), T(R * 0.98, -R * 0.1), T(R * 0.5, -R * 0.45), T(-R * 0.4, -R * 0.42)]} fill={hc} f={f} seed={seed + 130} amt={0.8} />;
			case 'cap':
				return (
					<g>
						<Shape pts={[T(-R * 0.99, -R * 0.2), T(-R * 0.85, -R * 0.75), T(0, -R * 1.05), T(R * 0.85, -R * 0.75), T(R * 0.99, -R * 0.2)]} fill={hc} f={f} seed={seed + 140} amt={0.6} />
						<Shape pts={[T(R * 0.1 + t * 30, -R * 0.26), T(R * 1.4 + t * 30, -R * 0.18), T(R * 1.38 + t * 30, -R * 0.02), T(R * 0.1 + t * 30, -R * 0.08)]} fill={hc} f={f} seed={seed + 141} w={LW * 0.85} amt={0.4} />
					</g>
				);
			default:
				return null;
		}
	})();
	const specs = look.glasses ? (
		<g>
			{([-1, 1] as const).map((sd) => (
				<Shape key={sd} pts={circ(fx + sd * eSep, eyeY, 27 * (t > 0.2 && sd < 0 ? 1 - t * 0.5 : 1), 24, 10)} fill="none" f={f} seed={seed + 150 + sd} w={LW * 0.75} amt={0.4} />
			))}
			<Line pts={[[fx - eSep + 26, eyeY - 6], [fx + eSep - 26, eyeY - 6]]} f={f} seed={seed + 153} w={LW * 0.7} amt={0.2} />
		</g>
	) : null;
	const tie = look.tie ? (
		<g>
			<Shape pts={[[-bw * 0.3 + t * 10, neck + 4], [t * 10, neck + 70], [bw * 0.3 + t * 10, neck + 4]]} fill="#ececec" f={f} seed={seed + 160} w={LW * 0.8} amt={0.4} />
			<Shape pts={[[t * 10 - 10, neck + 16], [t * 10 + 10, neck + 16], [t * 10 + 15, neck + 82], [t * 10, neck + 100], [t * 10 - 15, neck + 82]]} fill={look.tie} f={f} seed={seed + 161} w={LW * 0.7} amt={0.4} />
		</g>
	) : null;

	const head = (
		<g transform={`rotate(${(P.tilt * 180) / Math.PI} ${hcX} ${neck})`}>
			<Shape pts={circ(hcX, hcY, R, R * 0.97, 16)} fill={HEAD} f={f} seed={seed + 20} amt={1.2} />
			{look.hair === 'long' ? null : hair}
			{([-1, 1] as const).map(eye)}
			{([-1, 1] as const).map(brow)}
			{specs}
			{mouth}
			{look.hair === 'long' ? hair : null}
		</g>
	);
	// long hair goes behind the face: draw it, then redraw the face plate on top
	const headLong =
		look.hair === 'long' ? (
			<g transform={`rotate(${(P.tilt * 180) / Math.PI} ${hcX} ${neck})`}>
				{hair}
				<Shape pts={circ(hcX, hcY + 6, R * 0.84, R * 0.86, 14)} fill={HEAD} f={f} seed={seed + 21} amt={0.8} w={0} />
				<Shape pts={[T(-R * 0.86, -R * 0.1), T(-R * 0.5, -R * 0.36), T(R * 0.2, -R * 0.46), T(R * 0.86, -R * 0.2), T(R * 0.8, -R * 0.6), T(0, -R * 0.98), T(-R * 0.8, -R * 0.6)]} fill={hc} f={f} seed={seed + 22} amt={0.6} />
				{([-1, 1] as const).map(eye)}
				{([-1, 1] as const).map(brow)}
				{specs}
				{mouth}
			</g>
		) : null;

	if (headOnly)
		return (
			<g transform={`translate(${x} ${y}) scale(${s * k})`}>
				<g transform={`translate(0 ${-hcY})`}>{headLong ?? head}</g>
			</g>
		);

	return (
		<g transform={`translate(${x} ${y - P.hop}) scale(${s * k})`}>
			<g transform={`rotate(${(P.lean * 180) / Math.PI} 0 ${hip})`}>
				{t > 0.5 ? arm(-1, P.armL) : null}
			</g>
			{leg(-1, P.legL)}
			{leg(1, P.legR)}
			<g transform={`rotate(${(P.lean * 180) / Math.PI} 0 ${hip})`}>
				<Shape pts={body} fill={look.shirt} f={f} seed={seed + 10} />
				{tie}
				{headLong ?? head}
				{t > 0.5 ? null : arm(-1, P.armL)}
				{arm(1, P.armR)}
			</g>
		</g>
	);
};

// ---------------- Model sheet ----------------
const HERO: GuyLook = {shirt: '#5b7096', pants: '#3e4252', hair: 'side', hairCol: '#4a2e20'};
const POSES: [string, Expr, Partial<GuyPose>][] = [
	['explain', 'talk', {armR: [1.0, 1.1], armL: [0.2, 0.1], tilt: 0.06}],
	['point', 'smug', {armR: [1.55, 0.05], lean: 0.05}],
	['think', 'think', {armR: [-0.35, -2.5], armL: [-0.4, -1.3], tilt: -0.1}],
	['shrug', 'worried', {armL: [0.9, 1.5], armR: [0.9, 1.5], tilt: 0.12}],
	['walk', 'neutral', {armL: [0.45, 0.2], armR: [-0.35, -0.1], legL: -0.4, legR: 0.35, turn: 1}],
	['cheer', 'laugh', {armL: [2.6, 0.2], armR: [2.6, 0.2], hop: 30}],
];
const CAST: GuyLook[] = [
	{shirt: '#a8483a', pants: '#3a3030', hair: 'curly', hairCol: '#2a1c18'},
	{shirt: '#e6dcc4', pants: '#e6dcc4', hair: 'crop', hairCol: '#cfcfcf', tie: '#a8483a', w: 1.15, h: 1.05},
	{shirt: '#b884a8', pants: '#4b4f60', hair: 'long', hairCol: '#8a4a2a', h: 0.95},
	{shirt: '#7a8a5a', pants: '#5a4a3a', hair: 'cap', hairCol: '#2e5a8a', glasses: true, h: 0.9},
	{shirt: '#d0a43a', pants: '#3e4252', hair: 'bun', hairCol: '#2a1c18', w: 0.9},
	{shirt: '#3a3a42', pants: '#2a2a30', hair: 'spike', hairCol: '#c4602a', h: 0.7},
];

export const GuySheet: React.FC = () => (
	<AbsoluteFill style={{background: BG}}>
		<svg width={1080} height={1920} viewBox="0 0 1080 1920">
			<rect width={1080} height={1920} fill={BG} />
			{/* turnaround: front, three-quarter, side */}
			{[0, 0.5, 1].map((turn, i) => (
				<Guy key={i} look={HERO} expr={i === 0 ? 'happy' : 'neutral'} pose={{turn}} x={190 + i * 350} y={540} s={0.82} seed={1} />
			))}
			{/* expressions */}
			{(['neutral', 'happy', 'talk', 'laugh', 'shock', 'angry', 'sad', 'smug', 'think', 'worried'] as Expr[]).map((e, i) => (
				<Guy key={e} look={HERO} expr={e} x={108 + (i % 5) * 216} y={680 + Math.floor(i / 5) * 230} s={0.72} headOnly seed={1} />
			))}
			{/* poses */}
			{POSES.map(([, e, p], i) => (
				<Guy key={i} look={HERO} expr={e} pose={p} x={180 + (i % 3) * 360} y={1440 + Math.floor(i / 3) * 0} s={0.55} seed={1} />
			)).slice(0, 3)}
			{POSES.slice(3).map(([, e, p], i) => (
				<Guy key={i} look={HERO} expr={e} pose={p} x={180 + i * 360} y={1860} s={0.55} seed={1} />
			))}
		</svg>
	</AbsoluteFill>
);

export const GuyCast: React.FC = () => (
	<AbsoluteFill style={{background: BG}}>
		<svg width={1080} height={1920} viewBox="0 0 1080 1920">
			<rect width={1080} height={1920} fill={BG} />
			{CAST.map((c, i) => (
				<Guy key={i} look={c} expr={(['happy', 'smug', 'talk', 'neutral', 'laugh', 'shock'] as Expr[])[i]} pose={i === 5 ? {armL: [2.4, 0.3], armR: [2.4, 0.3]} : i === 1 ? {armL: [0.7, -2.0], armR: [0.7, -2.0]} : {}} x={190 + (i % 3) * 350} y={860 + Math.floor(i / 3) * 900} s={0.82} seed={i * 17 + 3} />
			))}
		</svg>
	</AbsoluteFill>
);
