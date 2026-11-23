import React from 'react';
import {onTwos} from '../anim';

// Flat 2D "deadpan doodle" style: thick dark-brown rounded outlines, off-white round heads,
// muted flat fills, no shading. Lines "boil" (tiny jitter) on twos so it feels hand-drawn.

export const INK = '#45231f';
export const HEAD = '#ececec';
export const BG = '#d9d9d9';
export const LW = 15; // main outline width at 1080 px wide

// Seeded wobble so each stroke boils the same way every render.
const hash = (n: number) => {
	const x = Math.sin(n * 127.1) * 43758.5453;
	return x - Math.floor(x);
};
export const wob = (frame: number, seed: number, amt = 2.2) => (hash(onTwos(frame) * 0.37 + seed) - 0.5) * 2 * amt;

// A hand-drawn-ish closed blob through points (Catmull-Rom → cubic Bézier), with boil.
export const blobPath = (pts: [number, number][], frame: number, seed: number, amt = 2.2, closed = true) => {
	const p = pts.map(([x, y], i) => [x + wob(frame, seed + i * 1.7, amt), y + wob(frame, seed + i * 2.3 + 9, amt)] as [number, number]);
	const n = p.length;
	const get = (i: number) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
	let d = `M ${p[0][0]} ${p[0][1]}`;
	const last = closed ? n : n - 1;
	for (let i = 0; i < last; i++) {
		const p0 = get(i - 1);
		const p1 = get(i);
		const p2 = get(i + 1);
		const p3 = get(i + 2);
		const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
		const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
	}
	return closed ? d + ' Z' : d;
};

export const Shape: React.FC<{pts: [number, number][]; fill?: string; f: number; seed: number; w?: number; closed?: boolean; amt?: number}> = ({pts, fill = 'none', f, seed, w = LW, closed = true, amt}) => (
	<path d={blobPath(pts, f, seed, amt, closed)} fill={closed ? fill : 'none'} stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);

export const Line: React.FC<{pts: [number, number][]; f: number; seed: number; w?: number; color?: string; amt?: number}> = ({pts, f, seed, w = LW, color = INK, amt = 1.6}) => (
	<path d={blobPath(pts, f, seed, amt, false)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);

// Circle-ish head as a wobbly blob.
const circlePts = (cx: number, cy: number, rx: number, ry: number, n = 14): [number, number][] =>
	Array.from({length: n}, (_, i) => {
		const a = (i / n) * Math.PI * 2;
		return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
	});

export type Hair = 'swoop' | 'spiky' | 'curly' | 'bun' | 'messy' | 'slick' | 'bob' | 'tuft' | 'mullet' | 'none';
export type Eyes = 'dot' | 'flat' | 'lid' | 'wide' | 'closed' | 'happy' | 'squint';
export type Mouth = 'smirk' | 'flat' | 'frown' | 'open' | 'grin' | 'o' | 'wavy';
export type Body = 'bell' | 'coat' | 'tee';

export type FPose = {
	lean: number; // body tilt, radians (+ = lean right)
	squash: number; // 1 = normal; <1 squashes, >1 stretches
	headTilt: number; // radians
	headDx: number; // head offset in px
	armL: [number, number]; // shoulder angle, elbow bend (radians); 0 = straight down
	armR: [number, number];
	legL: number; // leg swing (radians)
	legR: number;
	hop: number; // lift in px
};
// Arms: [shoulder, elbow] in radians, mirrored per side: + swings outward/up, - swings across the body.
export const FREST: FPose = {lean: 0, squash: 1, headTilt: 0, headDx: 0, armL: [0.2, 0.15], armR: [0.2, 0.15], legL: 0, legR: 0, hop: 0};

export type FChar = {
	body: string; // main clothing colour
	shape?: Body;
	lapel?: string; // lapel / jacket accent colour
	shirt?: string; // shirt colour showing in the V
	tie?: string;
	hair?: Hair;
	hairColor?: string;
	glasses?: 'round' | 'square' | 'shades' | 'aviator';
	shadeColor?: string;
	stripe?: string; // horizontal stripe colour (rugby shirts etc.)
	scarf?: string;
	beard?: string;
	h?: number; // overall scale (height)
	w?: number; // body width factor
};

export type Face = {eyes: Eyes; mouth: Mouth; brow?: number; browL?: number; lookX?: number; lookY?: number};

// One character. (x, y) = point between the feet. Everything drawn in a local 0..~560 tall space.
export const Doodle: React.FC<{c: FChar; pose?: Partial<FPose>; face?: Face; x: number; y: number; f: number; seed?: number; flip?: boolean; holdR?: React.ReactNode; holdL?: React.ReactNode}> = ({
	c,
	pose = {},
	face = {eyes: 'dot', mouth: 'flat'},
	x,
	y,
	f,
	seed = 1,
	flip,
	holdR,
	holdL,
}) => {
	const P = {...FREST, ...pose};
	const s = c.h ?? 1;
	const bw = 150 * (c.w ?? 1);
	const bodyH = 250 * P.squash;
	const legH = 70;
	const R = 118; // head radius
	const neckY = -legH - bodyH; // top of body
	const headCy = neckY - R + 26 + P.squash * 0 - (P.squash - 1) * 30;
	const shoulderY = neckY + 30;
	const sx = bw * 0.62;
	const shape = c.shape ?? 'bell';

	// Body outline (bell: narrow shoulders flaring to the hem)
	const hem = -legH + 6;
	const flare = shape === 'coat' ? 1.18 : shape === 'tee' ? 1.04 : 1.12;
	const bodyPts: [number, number][] = [
		[-bw * 0.42, neckY + 10],
		[-bw * 0.62, neckY + 70],
		[-bw * 0.7 * flare, hem - 40],
		[-bw * 0.72 * flare, hem],
		[0, hem + 6],
		[bw * 0.72 * flare, hem],
		[bw * 0.7 * flare, hem - 40],
		[bw * 0.62, neckY + 70],
		[bw * 0.42, neckY + 10],
		[0, neckY - 2],
	];

	const arm = (side: 1 | -1, [a, e]: [number, number], hold?: React.ReactNode) => {
		const L1 = 120;
		const L2 = 115;
		const ox = side * sx;
		const oy = shoulderY;
		const ang = Math.PI / 2 + a * side * -1 + (side > 0 ? -0.08 : 0.08);
		// a: positive raises the arm outward/up on its own side
		const th1 = Math.PI / 2 - a * side;
		const ex = ox + Math.cos(th1) * L1;
		const ey = oy + Math.sin(th1) * L1;
		const th2 = th1 - e * side;
		const hx = ex + Math.cos(th2) * L2;
		const hy = ey + Math.sin(th2) * L2;
		void ang;
		return (
			<g>
				<Line pts={[[ox, oy], [ex, ey], [hx, hy]]} f={f} seed={seed + (side > 0 ? 40 : 50)} w={LW} />
				{hold ? <g transform={`translate(${hx} ${hy})`}>{hold}</g> : null}
			</g>
		);
	};

	const legs = (
		<g>
			<Line pts={[[-bw * 0.28, hem - 4], [-bw * 0.28 + Math.sin(P.legL) * legH, -2 + (1 - Math.cos(P.legL)) * 10]]} f={f} seed={seed + 60} />
			<Line pts={[[bw * 0.28, hem - 4], [bw * 0.28 + Math.sin(P.legR) * legH, -2 + (1 - Math.cos(P.legR)) * 10]]} f={f} seed={seed + 61} />
		</g>
	);

	// V-neck / lapels / tie
	const vDepth = shape === 'tee' ? 40 : 150;
	const front = (
		<g>
			{c.shirt ? <Shape pts={[[-bw * 0.3, neckY + 4], [0, neckY + vDepth], [bw * 0.3, neckY + 4]]} fill={c.shirt} f={f} seed={seed + 70} w={LW * 0.8} amt={1} /> : null}
			{c.tie ? <Shape pts={[[-14, neckY + 16], [14, neckY + 16], [20, neckY + vDepth - 6], [0, neckY + vDepth + 22], [-20, neckY + vDepth - 6]]} fill={c.tie} f={f} seed={seed + 71} w={LW * 0.75} amt={1} /> : null}
			{c.lapel ? (
				<>
					<Line pts={[[-bw * 0.36, neckY + 14], [-bw * 0.28, neckY + 80], [-bw * 0.38, neckY + 92], [-8, neckY + vDepth + 40]]} f={f} seed={seed + 72} w={LW * 0.8} />
					<Line pts={[[bw * 0.36, neckY + 14], [bw * 0.28, neckY + 80], [bw * 0.38, neckY + 92], [8, neckY + vDepth + 40]]} f={f} seed={seed + 73} w={LW * 0.8} />
				</>
			) : null}
			{c.stripe
				? [0, 1, 2].map((k) => (
						<Line key={k} pts={[[-bw * 0.66, neckY + 100 + k * 50], [bw * 0.66, neckY + 100 + k * 50]]} color={c.stripe} f={f} seed={seed + 80 + k} w={22} amt={1} />
				  ))
				: null}
			{c.scarf ? <Shape pts={[[-bw * 0.46, neckY + 4], [bw * 0.46, neckY + 4], [bw * 0.4, neckY + 34], [bw * 0.1, neckY + 40], [bw * 0.16, neckY + 120], [-bw * 0.06, neckY + 120], [-bw * 0.06, neckY + 40], [-bw * 0.42, neckY + 34]]} fill={c.scarf} f={f} seed={seed + 85} w={LW * 0.8} amt={1} /> : null}
		</g>
	);

	// Hair: drawn as a filled blob hugging the top of the head.
	const hc = c.hairColor ?? '#5a3a28';
	const hx0 = P.headDx;
	const hy0 = headCy;
	const hair = (() => {
		const top = (dx: number, dy: number): [number, number] => [hx0 + dx, hy0 + dy];
		switch (c.hair) {
			case 'swoop':
				return <Shape pts={[top(-R * 0.98, 10), top(-R * 0.9, -60), top(-R * 0.4, -R * 1.08), top(R * 0.35, -R * 1.06), top(R * 0.95, -50), top(R * 1.0, 0), top(R * 0.55, -48), top(-R * 0.1, -36), top(-R * 0.7, -10)]} fill={hc} f={f} seed={seed + 90} />;
			case 'spiky':
				return <Shape pts={[top(-R * 0.98, -10), top(-R * 1.15, -95), top(-R * 0.6, -R * 0.95), top(-R * 0.45, -R * 1.42), top(-R * 0.05, -R * 1.05), top(R * 0.2, -R * 1.5), top(R * 0.45, -R * 1.02), top(R * 0.95, -R * 1.25), top(R * 0.9, -60), top(R * 1.0, -6), top(R * 0.4, -52), top(-R * 0.3, -46)]} fill={hc} f={f} seed={seed + 91} amt={1.5} />;
			case 'curly':
				return (
					<g>
						{Array.from({length: 9}).map((_, i) => {
							const a = Math.PI + (i / 8) * Math.PI;
							return <Shape key={i} pts={circlePts(hx0 + Math.cos(a) * R * 0.92, hy0 + Math.sin(a) * R * 0.92 - 6, 36, 34, 8)} fill={hc} f={f} seed={seed + 100 + i} w={LW * 0.85} amt={1.2} />;
						})}
					</g>
				);
			case 'bun':
				return (
					<g>
						<Shape pts={circlePts(hx0 + 8, hy0 - R * 1.12, 46, 40, 10)} fill={hc} f={f} seed={seed + 110} />
						<Shape pts={[top(-R * 0.98, 6), top(-R * 0.85, -70), top(0, -R * 1.04), top(R * 0.85, -70), top(R * 0.98, 6), top(R * 0.6, -40), top(0, -52), top(-R * 0.6, -40)]} fill={hc} f={f} seed={seed + 111} />
					</g>
				);
			case 'messy':
				return <Shape pts={[top(-R * 1.02, 0), top(-R * 1.1, -70), top(-R * 0.7, -R * 1.1), top(-R * 0.25, -R * 1.22), top(R * 0.2, -R * 1.12), top(R * 0.7, -R * 1.18), top(R * 1.08, -70), top(R * 1.02, 4), top(R * 0.75, -30), top(R * 0.45, -56), top(R * 0.05, -34), top(-R * 0.35, -60), top(-R * 0.7, -26)]} fill={hc} f={f} seed={seed + 120} amt={1.8} />;
			case 'slick':
				return <Shape pts={[top(-R * 0.97, -6), top(-R * 0.82, -78), top(-R * 0.2, -R * 1.06), top(R * 0.55, -R * 1.0), top(R * 0.97, -40), top(R * 0.99, -6), top(R * 0.4, -62), top(-R * 0.5, -66)]} fill={hc} f={f} seed={seed + 130} />;
			case 'bob':
				return <Shape pts={[top(-R * 1.08, 70), top(-R * 1.1, -40), top(-R * 0.5, -R * 1.1), top(R * 0.5, -R * 1.1), top(R * 1.1, -40), top(R * 1.08, 70), top(R * 0.86, 70), top(R * 0.84, -30), top(0, -46), top(-R * 0.84, -30), top(-R * 0.86, 70)]} fill={hc} f={f} seed={seed + 140} />;
			case 'tuft':
				return <Shape pts={[top(-R * 0.4, -R * 0.92), top(-R * 0.2, -R * 1.25), top(0, -R * 1.05), top(R * 0.25, -R * 1.3), top(R * 0.4, -R * 0.94), top(0, -R * 0.98)]} fill={hc} f={f} seed={seed + 150} w={LW * 0.8} amt={1} />;
			case 'mullet':
				return <Shape pts={[top(-R * 0.98, 10), top(-R * 0.9, -70), top(-R * 0.2, -R * 1.08), top(R * 0.6, -R * 1.0), top(R * 1.02, -40), top(R * 1.12, 60), top(R * 0.9, 90), top(R * 0.88, -20), top(R * 0.3, -50), top(-R * 0.6, -40)]} fill={hc} f={f} seed={seed + 160} />;
			default:
				return null;
		}
	})();

	// Face
	const ex = 44;
	const ey = hy0 - 6;
	const lx = (face.lookX ?? 0) * 10;
	const ly = (face.lookY ?? 0) * 8;
	const eye = (side: 1 | -1) => {
		const cx = hx0 + side * ex + lx;
		const cy = ey + ly;
		switch (face.eyes) {
			case 'dot':
				return <circle cx={cx} cy={cy} r={11} fill={INK} />;
			case 'wide':
				return (
					<g>
						<circle cx={cx} cy={cy} r={26} fill="#ffffff" stroke={INK} strokeWidth={LW * 0.7} />
						<circle cx={cx + lx * 0.4} cy={cy + 2} r={9} fill={INK} />
					</g>
				);
			case 'flat':
				return <Line pts={[[cx - 24, cy], [cx + 24, cy + 1]]} f={f} seed={seed + 170 + side} w={LW} amt={0.8} />;
			case 'closed':
				return <Line pts={[[cx - 24, cy - 4], [cx, cy + 8], [cx + 24, cy - 4]]} f={f} seed={seed + 172 + side} w={LW * 0.9} amt={0.6} />;
			case 'happy':
				return <Line pts={[[cx - 22, cy + 6], [cx, cy - 10], [cx + 22, cy + 6]]} f={f} seed={seed + 174 + side} w={LW * 0.9} amt={0.6} />;
			case 'squint':
				return <Line pts={[[cx - 22, cy - 6 * side], [cx + 22, cy + 6 * side]]} f={f} seed={seed + 176 + side} w={LW} amt={0.6} />;
			case 'lid':
			default:
				return (
					<g>
						<Line pts={[[cx - 26, cy - 4], [cx + 26, cy - 4]]} f={f} seed={seed + 178 + side} w={LW * 0.9} amt={0.6} />
						<circle cx={cx + 4} cy={cy + 8} r={8} fill={INK} />
					</g>
				);
		}
	};
	const brow = (side: 1 | -1) => {
		const b = (side > 0 ? face.brow : face.browL ?? face.brow) ?? null;
		if (b === null) return null;
		const cx = hx0 + side * ex;
		const cy = ey - 40;
		// + b = angry (inner ends down)
		return <Line pts={[[cx - 26 * side, cy + b * 12], [cx, cy - 10 - Math.abs(b) * 2], [cx + 26 * side, cy - b * 8]]} f={f} seed={seed + 180 + side} w={LW * 0.9} amt={0.6} />;
	};
	const my = hy0 + 52;
	const mouth = (() => {
		const cx = hx0 + 6;
		switch (face.mouth) {
			case 'smirk':
				return <Line pts={[[cx - 30, my + 4], [cx + 6, my + 6], [cx + 30, my - 10]]} f={f} seed={seed + 190} amt={0.6} />;
			case 'frown':
				return <Line pts={[[cx - 22, my + 8], [cx, my - 4], [cx + 22, my + 8]]} f={f} seed={seed + 191} amt={0.6} />;
			case 'grin':
				return <Shape pts={[[cx - 40, my - 6], [cx + 40, my - 6], [cx + 22, my + 24], [cx - 22, my + 24]]} fill="#7a3a30" f={f} seed={seed + 192} w={LW * 0.9} amt={0.8} />;
			case 'open':
				return <Shape pts={circlePts(cx, my + 6, 22, 26, 8)} fill="#7a3a30" f={f} seed={seed + 193} w={LW * 0.9} amt={0.8} />;
			case 'o':
				return <Shape pts={circlePts(cx, my + 2, 12, 14, 8)} fill="#7a3a30" f={f} seed={seed + 194} w={LW * 0.8} amt={0.5} />;
			case 'wavy':
				return <Line pts={[[cx - 30, my + 2], [cx - 15, my - 6], [cx, my + 4], [cx + 15, my - 6], [cx + 30, my + 2]]} f={f} seed={seed + 195} amt={0.6} />;
			case 'flat':
			default:
				return <Line pts={[[cx - 22, my], [cx + 22, my + 1]]} f={f} seed={seed + 196} amt={0.6} />;
		}
	})();
	const specs = (() => {
		if (!c.glasses) return null;
		const sh = c.glasses === 'shades' || c.glasses === 'aviator';
		const fill = sh ? c.shadeColor ?? '#4a2c22' : 'none';
		const lens = (side: 1 | -1): [number, number][] => {
			const cx = hx0 + side * ex;
			if (c.glasses === 'round') return circlePts(cx, ey, 34, 30, 10);
			if (c.glasses === 'aviator') return [[cx - 40, ey - 26], [cx + 40, ey - 26], [cx + 36, ey + 14], [cx + 10, ey + 36], [cx - 22, ey + 30], [cx - 40, ey + 6]];
			return [[cx - 42, ey - 24], [cx + 42, ey - 24], [cx + 40, ey + 24], [cx - 40, ey + 24]];
		};
		return (
			<g>
				<Shape pts={lens(-1)} fill={fill} f={f} seed={seed + 200} w={LW * 0.85} amt={0.8} />
				<Shape pts={lens(1)} fill={fill} f={f} seed={seed + 201} w={LW * 0.85} amt={0.8} />
				<Line pts={[[hx0 - 8, ey - 18], [hx0 + 8, ey - 18]]} f={f} seed={seed + 202} w={LW * 0.8} amt={0.4} />
				<Line pts={[[hx0 - R - 10, ey - 18], [hx0 - ex - 40, ey - 20]]} f={f} seed={seed + 203} w={LW * 0.8} amt={0.4} />
				<Line pts={[[hx0 + ex + 40, ey - 20], [hx0 + R + 10, ey - 18]]} f={f} seed={seed + 204} w={LW * 0.8} amt={0.4} />
			</g>
		);
	})();
	const beard = c.beard ? <Shape pts={[[hx0 - R * 0.86, hy0 + 30], [hx0 - R * 0.6, hy0 + R * 0.88], [hx0, hy0 + R * 1.1], [hx0 + R * 0.6, hy0 + R * 0.88], [hx0 + R * 0.86, hy0 + 30], [hx0 + 50, hy0 + 78], [hx0, hy0 + 88], [hx0 - 50, hy0 + 78]]} fill={c.beard} f={f} seed={seed + 210} amt={1.2} /> : null;

	return (
		<g transform={`translate(${x} ${y - P.hop}) scale(${flip ? -s : s} ${s})`}>
			{legs}
			<g transform={`rotate(${(P.lean * 180) / Math.PI} 0 ${-legH})`}>
				{/* back arm first when it's behind? keep both in front for the flat look */}
				<Shape pts={bodyPts} fill={c.body} f={f} seed={seed + 10} />
				{front}
				<g transform={`rotate(${(P.headTilt * 180) / Math.PI} ${hx0} ${neckY})`}>
					<Shape pts={circlePts(hx0, hy0, R, R * 0.98, 16)} fill={HEAD} f={f} seed={seed + 20} amt={1.6} />
					{beard}
					{hair}
					{specs && c.glasses !== 'round' && c.glasses !== 'square' ? null : (
						<>
							{eye(-1)}
							{eye(1)}
						</>
					)}
					{brow(-1)}
					{brow(1)}
					{specs}
					{mouth}
				</g>
				{arm(-1, P.armL, holdL)}
				{arm(1, P.armR, holdR)}
			</g>
		</g>
	);
};
