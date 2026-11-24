import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BG, HEAD, INK, LW, Line, Shape} from './Flat';

// A sheet of numbered full-body "bean bag" stickman variants in the flat doodle style.
type P2 = [number, number];
const circ = (cx: number, cy: number, rx: number, ry: number, n = 14): P2[] => Array.from({length: n}, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry]);

// Body silhouettes, drawn from the neck (0,0) down to the seat (0,h). w = half width at the widest point.
type BodyKind = 'bean' | 'pear' | 'egg' | 'sack' | 'tallbean' | 'chubby' | 'peanut' | 'gumdrop' | 'potato' | 'pill' | 'tri' | 'barrel' | 'tear' | 'lumpy' | 'hourglass' | 'wedge' | 'blob' | 'noodle' | 'mushroom' | 'cloud';
const bodyPts = (k: BodyKind, w: number, h: number): P2[] => {
	switch (k) {
		case 'pear':
			return [[-w * 0.45, 4], [-w * 0.62, h * 0.3], [-w * 1.0, h * 0.75], [-w * 0.8, h * 0.98], [0, h * 1.03], [w * 0.8, h * 0.98], [w * 1.0, h * 0.75], [w * 0.62, h * 0.3], [w * 0.45, 4], [0, -4]];
		case 'egg':
			return [[-w * 0.6, h * 0.06], [-w * 0.95, h * 0.4], [-w * 0.9, h * 0.8], [-w * 0.5, h * 1.0], [0, h * 1.04], [w * 0.5, h * 1.0], [w * 0.9, h * 0.8], [w * 0.95, h * 0.4], [w * 0.6, h * 0.06], [0, -6]];
		case 'sack':
			return [[-w * 0.55, 2], [-w * 0.8, h * 0.35], [-w * 0.95, h * 0.8], [-w * 0.92, h * 0.98], [0, h * 1.0], [w * 0.92, h * 0.98], [w * 0.95, h * 0.8], [w * 0.8, h * 0.35], [w * 0.55, 2], [0, -2]];
		case 'tallbean':
			return [[-w * 0.5, 4], [-w * 0.75, h * 0.25], [-w * 0.8, h * 0.7], [-w * 0.6, h * 0.98], [0, h * 1.03], [w * 0.6, h * 0.98], [w * 0.8, h * 0.7], [w * 0.75, h * 0.25], [w * 0.5, 4], [0, -4]];
		case 'chubby':
			return [[-w * 0.7, h * 0.05], [-w * 1.02, h * 0.4], [-w * 0.98, h * 0.78], [-w * 0.6, h * 1.0], [0, h * 1.05], [w * 0.6, h * 1.0], [w * 0.98, h * 0.78], [w * 1.02, h * 0.4], [w * 0.7, h * 0.05], [0, -8]];
		case 'peanut':
			return [[-w * 0.6, 4], [-w * 0.85, h * 0.22], [-w * 0.7, h * 0.48], [-w * 0.95, h * 0.78], [-w * 0.6, h * 1.0], [0, h * 1.03], [w * 0.6, h * 1.0], [w * 0.95, h * 0.78], [w * 0.7, h * 0.48], [w * 0.85, h * 0.22], [w * 0.6, 4], [0, -4]];
		case 'gumdrop':
			return [[-w * 0.3, 2], [-w * 0.7, h * 0.4], [-w * 1.0, h * 0.95], [0, h * 1.0], [w * 1.0, h * 0.95], [w * 0.7, h * 0.4], [w * 0.3, 2], [0, -4]];
		case 'potato':
			return [[-w * 0.55, 6], [-w * 0.9, h * 0.2], [-w * 0.78, h * 0.5], [-w * 1.0, h * 0.82], [-w * 0.5, h * 1.02], [w * 0.2, h * 0.98], [w * 0.85, h * 1.0], [w * 0.95, h * 0.62], [w * 0.8, h * 0.3], [w * 0.6, 2], [0, -6]];
		case 'pill':
			return [[-w * 0.7, h * 0.12], [-w * 0.72, h * 0.5], [-w * 0.7, h * 0.88], [-w * 0.4, h * 1.02], [0, h * 1.04], [w * 0.4, h * 1.02], [w * 0.7, h * 0.88], [w * 0.72, h * 0.5], [w * 0.7, h * 0.12], [w * 0.4, -4], [0, -8], [-w * 0.4, -4]];
		case 'tri':
			return [[-w * 0.25, 0], [-w * 0.6, h * 0.45], [-w * 1.05, h * 0.98], [0, h * 1.02], [w * 1.05, h * 0.98], [w * 0.6, h * 0.45], [w * 0.25, 0], [0, -4]];
		case 'barrel':
			return [[-w * 0.75, 0], [-w * 0.95, h * 0.25], [-w * 1.0, h * 0.55], [-w * 0.92, h * 0.88], [-w * 0.7, h * 1.0], [0, h * 1.02], [w * 0.7, h * 1.0], [w * 0.92, h * 0.88], [w * 1.0, h * 0.55], [w * 0.95, h * 0.25], [w * 0.75, 0], [0, -2]];
		case 'tear':
			return [[-w * 0.2, 0], [-w * 0.55, h * 0.3], [-w * 0.95, h * 0.72], [-w * 0.6, h * 1.0], [0, h * 1.05], [w * 0.6, h * 1.0], [w * 0.95, h * 0.72], [w * 0.55, h * 0.3], [w * 0.2, 0], [0, -6]];
		case 'lumpy':
			return [[-w * 0.5, 4], [-w * 0.95, h * 0.18], [-w * 0.72, h * 0.38], [-w * 1.0, h * 0.6], [-w * 0.78, h * 0.82], [-w * 0.6, h * 1.0], [0, h * 0.96], [w * 0.6, h * 1.02], [w * 0.9, h * 0.8], [w * 0.75, h * 0.6], [w * 0.98, h * 0.38], [w * 0.7, h * 0.15], [w * 0.5, 2], [0, -4]];
		case 'hourglass':
			return [[-w * 0.75, 2], [-w * 0.85, h * 0.2], [-w * 0.5, h * 0.5], [-w * 0.95, h * 0.85], [-w * 0.6, h * 1.02], [0, h * 1.04], [w * 0.6, h * 1.02], [w * 0.95, h * 0.85], [w * 0.5, h * 0.5], [w * 0.85, h * 0.2], [w * 0.75, 2], [0, -2]];
		case 'wedge':
			return [[-w * 1.0, 0], [-w * 0.95, h * 0.3], [-w * 0.6, h * 0.8], [-w * 0.35, h * 1.02], [0, h * 1.04], [w * 0.35, h * 1.02], [w * 0.6, h * 0.8], [w * 0.95, h * 0.3], [w * 1.0, 0], [0, -4]];
		case 'blob':
			return [[-w * 0.6, h * 0.06], [-w * 1.1, h * 0.32], [-w * 0.95, h * 0.7], [-w * 1.15, h * 0.95], [-w * 0.3, h * 1.05], [w * 0.4, h * 0.98], [w * 1.1, h * 1.02], [w * 0.98, h * 0.6], [w * 1.08, h * 0.25], [w * 0.55, h * 0.02], [0, -10]];
		case 'noodle':
			return [[-w * 0.4, 0], [-w * 0.48, h * 0.5], [-w * 0.42, h * 1.0], [0, h * 1.04], [w * 0.42, h * 1.0], [w * 0.48, h * 0.5], [w * 0.4, 0], [0, -4]];
		case 'mushroom':
			return [[-w * 0.95, 0], [-w * 1.1, h * 0.2], [-w * 0.85, h * 0.36], [-w * 0.5, h * 0.42], [-w * 0.55, h * 0.95], [0, h * 1.02], [w * 0.55, h * 0.95], [w * 0.5, h * 0.42], [w * 0.85, h * 0.36], [w * 1.1, h * 0.2], [w * 0.95, 0], [0, -6]];
		case 'cloud':
			return [[-w * 0.5, 2], [-w * 0.95, h * 0.2], [-w * 1.1, h * 0.5], [-w * 0.9, h * 0.75], [-w * 1.05, h * 0.95], [-w * 0.4, h * 1.08], [w * 0.0, h * 0.98], [w * 0.45, h * 1.08], [w * 1.05, h * 0.95], [w * 0.9, h * 0.75], [w * 1.1, h * 0.5], [w * 0.95, h * 0.2], [w * 0.5, 2], [0, -4]];
		case 'bean':
		default:
			return [[-w * 0.5, 4], [-w * 0.82, h * 0.3], [-w * 0.9, h * 0.72], [-w * 0.65, h * 0.98], [0, h * 1.04], [w * 0.65, h * 0.98], [w * 0.9, h * 0.72], [w * 0.82, h * 0.3], [w * 0.5, 4], [0, -4]];
	}
};

type LegKind = 'stick' | 'stub' | 'tube' | 'noodle' | 'boots' | 'pants';
type ArmKind = 'line' | 'noodle' | 'tube' | 'mitten';
type HandKind = 'open' | 'point' | 'thumb' | 'peace' | 'fist' | 'relaxed' | 'claw' | 'ok';
type V = {
	n: number;
	body: BodyKind;
	bw: number;
	bh: number;
	headR: number;
	neck: number; // head overlap into body (+ = head sits lower)
	legs: LegKind;
	legLen: number;
	arms: ArmKind;
	col: string;
	pants?: string;
	shoe?: string;
	hair?: 'swoop' | 'spiky' | 'curly' | 'bun' | 'messy' | 'bob' | 'tuft' | 'cap';
	hairCol?: string;
	eyes: 'dot' | 'lid' | 'wide' | 'happy' | 'flat';
	mouth: 'smirk' | 'flat' | 'grin' | 'o' | 'frown';
	pose: 'idle' | 'wave' | 'walk' | 'hips' | 'shrug' | 'point' | 'cheer' | 'think' | 'thumbs' | 'peace' | 'jazz' | 'flex';
	hands?: [HandKind, HandKind];
	sc?: number;
	extra?: 'tie' | 'collar' | 'stripe' | 'scarf' | 'glasses' | 'shades' | 'belt' | 'pocket';
};


// Hand with drawn fingers. (x, y) = wrist, dir = forearm direction (radians), side mirrors the thumb.
const Hand: React.FC<{x: number; y: number; dir: number; side: number; kind: HandKind; seed: number; skin?: string}> = ({x, y, dir, side, kind, seed, skin = HEAD}) => {
	const f = 0;
	const pr = 27;
	const px = x + Math.cos(dir) * pr * 0.8;
	const py = y + Math.sin(dir) * pr * 0.8;
	const fing = (ang: number, len0: number, k: number, curl = 0) => {
		const len = len0 * 1.3;
		const a = dir + ang;
		const sx = px + Math.cos(a) * pr * 0.85;
		const sy = py + Math.sin(a) * pr * 0.85;
		const mx = sx + Math.cos(a) * len * 0.55;
		const my = sy + Math.sin(a) * len * 0.55;
		const a2 = a + curl * side;
		return <Line key={k} pts={[[sx, sy], [mx, my], [mx + Math.cos(a2) * len * 0.45, my + Math.sin(a2) * len * 0.45]]} f={f} seed={seed + k} w={LW * 0.75} amt={0.5} />;
	};
	const up = -Math.PI / 2;
	let fingers: React.ReactNode[] = [];
	switch (kind) {
		case 'open':
			fingers = [-0.6, -0.2, 0.2, 0.6].map((a, i) => fing(a, 34, i)).concat(fing(1.35 * side, 26, 9));
			break;
		case 'point':
			fingers = [fing(0, 46, 0), fing(0.5 * side, 16, 1, 1.4), fing(0.9 * side, 14, 2, 1.4), fing(-1.2 * side, 22, 3)];
			break;
		case 'thumb': {
			const tx = px + Math.cos(up) * 10;
			fingers = [<Line key="t" pts={[[tx, py - 12], [tx + 2, py - 40], [tx - 2, py - 56]]} f={f} seed={seed + 5} w={LW * 0.8} amt={0.5} />, ...[0, 1, 2].map((i) => <Line key={i} pts={[[px - 14 + i * 12, py + 4], [px - 14 + i * 12, py + 14]]} f={f} seed={seed + 10 + i} w={LW * 0.55} amt={0.3} />)];
			break;
		}
		case 'peace':
			fingers = [fing(-0.3, 42, 0), fing(0.3, 42, 1), fing(0.8 * side, 14, 2, 1.5), fing(-1.3 * side, 18, 3, 1)];
			break;
		case 'fist':
			fingers = [0, 1, 2].map((i) => <Line key={i} pts={[[px - 12 + i * 12, py - 6], [px - 12 + i * 12, py + 8]]} f={f} seed={seed + 10 + i} w={LW * 0.55} amt={0.3} />);
			break;
		case 'claw':
			fingers = [-0.7, -0.25, 0.2, 0.65].map((a, i) => fing(a, 34, i, 1.2)).concat(fing(1.3 * side, 24, 9, 1));
			break;
		case 'ok':
			fingers = [fing(-0.5, 34, 0), fing(-0.1, 36, 1), fing(0.3, 32, 2), <circle key="o" cx={px + Math.cos(dir + 0.9 * side) * 30} cy={py + Math.sin(dir + 0.9 * side) * 30} r={13} fill="none" stroke={INK} strokeWidth={LW * 0.7} />];
			break;
		case 'relaxed':
		default:
			fingers = [-0.35, 0, 0.35].map((a, i) => fing(a, 24, i, 0.6)).concat(fing(1.2 * side, 18, 9));
	}
	return (
		<g>
			{fingers}
			<Shape pts={circ(px, py, pr, pr * 0.9, 9)} fill={skin} f={f} seed={seed + 30} w={LW * 0.8} amt={0.6} />
		</g>
	);
};

const Figure: React.FC<{v: V; x: number; y: number}> = ({v, x, y}) => {
	const f = 0;
	const s = v.n * 31;
	const {bw, bh, headR: R, legLen: L} = v;
	// layout from the ground up: feet at 0, seat at -L, neck at -L-bh
	const seat = -L;
	const neck = seat - bh;
	const hcY = neck - R + v.neck;
	const walk = v.pose === 'walk';
	const legSpread = bw * 0.38;
	const legs = (() => {
		const lx = [-legSpread, legSpread];
		const swing = walk ? [-0.45, 0.35] : [0, 0];
		const foot = (fx: number, side: number) => <Shape pts={circ(fx + side * 14, -6, 30, 16, 10)} fill={v.shoe ?? INK} f={f} seed={s + 50 + side} w={LW * 0.8} amt={0.8} />;
		return lx.map((x0, i) => {
			const side = i === 0 ? -1 : 1;
			const ex = x0 + Math.sin(swing[i]) * L;
			const ey = seat + Math.cos(swing[i]) * L;
			switch (v.legs) {
				case 'stub':
					return (
						<g key={i}>
							<Shape pts={[[x0 - 24, seat - 10], [x0 + 24, seat - 10], [ex + 26, ey + 2], [ex - 26, ey + 2]]} fill={v.pants ?? v.col} f={f} seed={s + 40 + i} amt={1} />
							{foot(ex, side)}
						</g>
					);
				case 'tube':
				case 'pants':
					return (
						<g key={i}>
							<Shape pts={[[x0 - 30, seat - 20], [x0 + 30, seat - 20], [ex + 24, ey], [ex - 24, ey]]} fill={v.pants ?? '#5a6278'} f={f} seed={s + 40 + i} amt={1} />
							{foot(ex, side)}
						</g>
					);
				case 'boots':
					return (
						<g key={i}>
							<Line pts={[[x0, seat], [ex, ey - 40]]} f={f} seed={s + 40 + i} />
							<Shape pts={[[ex - 24, ey - 54], [ex + 20, ey - 54], [ex + 22, ey - 14], [ex + side * 50, ey - 12], [ex + side * 50, ey + 4], [ex - 26, ey + 4]]} fill={v.shoe ?? '#6a4a30'} f={f} seed={s + 44 + i} w={LW * 0.85} amt={0.8} />
						</g>
					);
				case 'noodle':
					return (
						<g key={i}>
							<Line pts={[[x0, seat], [x0 + side * 18, seat + L * 0.45], [ex - side * 6, ey]]} f={f} seed={s + 40 + i} />
							{foot(ex, side)}
						</g>
					);
				case 'stick':
				default:
					return (
						<g key={i}>
							<Line pts={[[x0, seat], [ex, ey]]} f={f} seed={s + 40 + i} />
							{foot(ex, side)}
						</g>
					);
			}
		});
	})();

	// arm poses: [shoulder angle from straight down, elbow bend], + = outward/up, per side [L, R]
	const P: Record<V['pose'], [[number, number], [number, number]]> = {
		idle: [[0.25, 0.15], [0.25, 0.15]],
		wave: [[0.25, 0.1], [2.3, 0.7]],
		walk: [[0.55, 0.3], [-0.45, -0.2]],
		hips: [[0.7, -2.1], [0.7, -2.1]],
		shrug: [[1.0, 1.5], [1.0, 1.5]],
		point: [[0.2, 0.1], [1.55, 0.0]],
		cheer: [[2.5, 0.3], [2.5, 0.3]],
		think: [[-0.6, -1.4], [-0.9, -2.3]],
		thumbs: [[0.25, 0.15], [0.9, 1.1]],
		peace: [[0.3, 0.2], [2.0, 0.9]],
		jazz: [[1.6, 0.6], [1.6, 0.6]],
		flex: [[1.5, 1.6], [1.5, 1.6]],
	};
	const shY = neck + 34;
	const shX = bw * 0.62;
	const arm = (side: 1 | -1, [a, e]: [number, number]) => {
		const L1 = bh * 0.42;
		const L2 = bh * 0.4;
		const ox = side * shX;
		const th1 = Math.PI / 2 - a * side;
		const ex = ox + Math.cos(th1) * L1;
		const ey = shY + Math.sin(th1) * L1;
		const th2 = th1 - e * side;
		const hx = ex + Math.cos(th2) * L2;
		const hy = ey + Math.sin(th2) * L2;
		const hk = v.hands ? v.hands[side < 0 ? 0 : 1] : null;
		const H = hk ? <Hand x={hx} y={hy} dir={th2} side={side} kind={hk} seed={s + 300 + (side > 0 ? 20 : 0)} /> : null;
		if (H && v.arms !== 'tube')
			return (
				<g>
					{v.arms === 'noodle' ? <Line pts={[[ox, shY], [(ox + ex) / 2 + side * 14, (shY + ey) / 2], [ex, ey], [hx, hy]]} f={f} seed={s + 60 + side} /> : <Line pts={[[ox, shY], [ex, ey], [hx, hy]]} f={f} seed={s + 60 + side} />}
					{H}
				</g>
			);
		if (v.arms === 'tube') {
			const nx = (a2: number) => [Math.cos(a2 + Math.PI / 2) * 18, Math.sin(a2 + Math.PI / 2) * 18];
			const n1 = nx(th1);
			const n2 = nx(th2);
			return (
				<g>
					<Shape pts={[[ox + n1[0], shY + n1[1]], [ex + n1[0], ey + n1[1]], [hx + n2[0], hy + n2[1]], [hx - n2[0], hy - n2[1]], [ex - n1[0], ey - n1[1]], [ox - n1[0], shY - n1[1]]]} fill={v.col} f={f} seed={s + 60 + side} w={LW * 0.85} amt={1} />
					{H}
				</g>
			);
		}
		if (v.arms === 'mitten')
			return (
				<g>
					<Line pts={[[ox, shY], [ex, ey], [hx, hy]]} f={f} seed={s + 60 + side} />
					<Shape pts={circ(hx, hy, 20, 20, 8)} fill={HEAD} f={f} seed={s + 64 + side} w={LW * 0.8} amt={0.8} />
				</g>
			);
		if (v.arms === 'noodle') {
			const mx = (ox + ex) / 2 + side * 14;
			const my = (shY + ey) / 2;
			return <Line pts={[[ox, shY], [mx, my], [ex, ey], [hx, hy]]} f={f} seed={s + 60 + side} />;
		}
		return <Line pts={[[ox, shY], [ex, ey], [hx, hy]]} f={f} seed={s + 60 + side} />;
	};

	const hc = v.hairCol ?? '#5a3a28';
	const top = (dx: number, dy: number): P2 => [dx, hcY + dy];
	const hair = (() => {
		switch (v.hair) {
			case 'swoop':
				return <Shape pts={[top(-R * 0.98, 10), top(-R * 0.9, -R * 0.5), top(-R * 0.4, -R * 1.08), top(R * 0.35, -R * 1.06), top(R * 0.95, -R * 0.42), top(R, 0), top(R * 0.55, -R * 0.4), top(-R * 0.1, -R * 0.3), top(-R * 0.7, -8)]} fill={hc} f={f} seed={s + 90} />;
			case 'spiky':
				return <Shape pts={[top(-R, -8), top(-R * 1.15, -R * 0.8), top(-R * 0.6, -R * 0.95), top(-R * 0.45, -R * 1.42), top(-R * 0.05, -R * 1.05), top(R * 0.2, -R * 1.5), top(R * 0.45, -R * 1.02), top(R * 0.95, -R * 1.25), top(R * 0.9, -R * 0.5), top(R, -6), top(R * 0.4, -R * 0.44), top(-R * 0.3, -R * 0.38)]} fill={hc} f={f} seed={s + 91} amt={1.4} />;
			case 'curly':
				return (
					<g>
						{Array.from({length: 9}).map((_, i) => {
							const a = Math.PI + (i / 8) * Math.PI;
							return <Shape key={i} pts={circ(Math.cos(a) * R * 0.92, hcY + Math.sin(a) * R * 0.92 - 6, R * 0.3, R * 0.28, 8)} fill={hc} f={f} seed={s + 100 + i} w={LW * 0.85} amt={1} />;
						})}
					</g>
				);
			case 'bun':
				return (
					<g>
						<Shape pts={circ(6, hcY - R * 1.12, R * 0.38, R * 0.33, 10)} fill={hc} f={f} seed={s + 110} />
						<Shape pts={[top(-R * 0.98, 6), top(-R * 0.85, -R * 0.6), top(0, -R * 1.04), top(R * 0.85, -R * 0.6), top(R * 0.98, 6), top(R * 0.6, -R * 0.34), top(0, -R * 0.44), top(-R * 0.6, -R * 0.34)]} fill={hc} f={f} seed={s + 111} />
					</g>
				);
			case 'messy':
				return <Shape pts={[top(-R * 1.02, 0), top(-R * 1.1, -R * 0.6), top(-R * 0.7, -R * 1.1), top(-R * 0.25, -R * 1.22), top(R * 0.2, -R * 1.12), top(R * 0.7, -R * 1.18), top(R * 1.08, -R * 0.6), top(R * 1.02, 4), top(R * 0.75, -R * 0.25), top(R * 0.45, -R * 0.48), top(R * 0.05, -R * 0.3), top(-R * 0.35, -R * 0.5), top(-R * 0.7, -R * 0.22)]} fill={hc} f={f} seed={s + 120} amt={1.6} />;
			case 'bob':
				return <Shape pts={[top(-R * 1.08, R * 0.6), top(-R * 1.1, -R * 0.34), top(-R * 0.5, -R * 1.1), top(R * 0.5, -R * 1.1), top(R * 1.1, -R * 0.34), top(R * 1.08, R * 0.6), top(R * 0.86, R * 0.6), top(R * 0.84, -R * 0.26), top(0, -R * 0.4), top(-R * 0.84, -R * 0.26), top(-R * 0.86, R * 0.6)]} fill={hc} f={f} seed={s + 140} />;
			case 'tuft':
				return <Shape pts={[top(-R * 0.4, -R * 0.92), top(-R * 0.2, -R * 1.25), top(0, -R * 1.05), top(R * 0.25, -R * 1.3), top(R * 0.4, -R * 0.94), top(0, -R * 0.98)]} fill={hc} f={f} seed={s + 150} w={LW * 0.8} amt={1} />;
			case 'cap':
				return (
					<g>
						<Shape pts={[top(-R * 0.98, -R * 0.15), top(-R * 0.85, -R * 0.75), top(0, -R * 1.06), top(R * 0.85, -R * 0.75), top(R * 0.98, -R * 0.15)]} fill={hc} f={f} seed={s + 160} />
						<Shape pts={[top(R * 0.2, -R * 0.2), top(R * 1.55, -R * 0.12), top(R * 1.5, R * 0.02), top(R * 0.2, -R * 0.04)]} fill={hc} f={f} seed={s + 161} w={LW * 0.85} amt={0.6} />
					</g>
				);
			default:
				return null;
		}
	})();

	const ey = hcY - R * 0.06;
	const ex = R * 0.38;
	const eye = (side: number) => {
		const cx = side * ex;
		switch (v.eyes) {
			case 'lid':
				return (
					<g key={side}>
						<Line pts={[[cx - 22, ey - 4], [cx + 22, ey - 4]]} f={f} seed={s + 170 + side} w={LW * 0.9} amt={0.5} />
						<circle cx={cx + 3} cy={ey + 7} r={8} fill={INK} />
					</g>
				);
			case 'wide':
				return (
					<g key={side}>
						<circle cx={cx} cy={ey} r={22} fill="#fff" stroke={INK} strokeWidth={LW * 0.7} />
						<circle cx={cx} cy={ey + 2} r={8} fill={INK} />
					</g>
				);
			case 'happy':
				return <Line key={side} pts={[[cx - 20, ey + 6], [cx, ey - 9], [cx + 20, ey + 6]]} f={f} seed={s + 172 + side} w={LW * 0.9} amt={0.5} />;
			case 'flat':
				return <Line key={side} pts={[[cx - 22, ey], [cx + 22, ey + 1]]} f={f} seed={s + 174 + side} amt={0.5} />;
			default:
				return <circle key={side} cx={cx} cy={ey} r={10} fill={INK} />;
		}
	};
	const my = hcY + R * 0.42;
	const mouth = (() => {
		switch (v.mouth) {
			case 'smirk':
				return <Line pts={[[-24, my + 4], [6, my + 6], [26, my - 8]]} f={f} seed={s + 190} amt={0.5} />;
			case 'grin':
				return <Shape pts={[[-34, my - 6], [34, my - 6], [18, my + 20], [-18, my + 20]]} fill="#7a3a30" f={f} seed={s + 191} w={LW * 0.85} amt={0.6} />;
			case 'o':
				return <Shape pts={circ(4, my + 2, 12, 14, 8)} fill="#7a3a30" f={f} seed={s + 192} w={LW * 0.8} amt={0.4} />;
			case 'frown':
				return <Line pts={[[-20, my + 8], [0, my - 4], [20, my + 8]]} f={f} seed={s + 193} amt={0.5} />;
			default:
				return <Line pts={[[-20, my], [20, my + 1]]} f={f} seed={s + 194} amt={0.5} />;
		}
	})();
	const extra = (() => {
		switch (v.extra) {
			case 'tie':
				return (
					<g>
						<Shape pts={[[-bw * 0.28, neck + 2], [0, neck + bh * 0.34], [bw * 0.28, neck + 2]]} fill="#ececec" f={f} seed={s + 200} w={LW * 0.8} amt={0.6} />
						<Shape pts={[[-11, neck + 14], [11, neck + 14], [16, neck + bh * 0.34], [0, neck + bh * 0.42], [-16, neck + bh * 0.34]]} fill="#a8483a" f={f} seed={s + 201} w={LW * 0.7} amt={0.6} />
					</g>
				);
			case 'collar':
				return <Shape pts={[[-bw * 0.36, neck + 2], [-6, neck + 40], [-bw * 0.1, neck + 52], [0, neck + 26], [bw * 0.1, neck + 52], [6, neck + 40], [bw * 0.36, neck + 2]]} fill="#ececec" f={f} seed={s + 202} w={LW * 0.8} amt={0.6} />;
			case 'stripe':
				return (
					<g>
						{[0.35, 0.55, 0.75].map((t, i) => (
							<Line key={i} pts={[[-bw * 0.85, neck + bh * t], [bw * 0.85, neck + bh * t]]} color="#e6d8b4" f={f} seed={s + 203 + i} w={20} amt={0.6} />
						))}
					</g>
				);
			case 'scarf':
				return <Shape pts={[[-bw * 0.55, neck + 2], [bw * 0.55, neck + 2], [bw * 0.5, neck + 34], [bw * 0.2, neck + 38], [bw * 0.28, neck + bh * 0.5], [bw * 0.05, neck + bh * 0.5], [bw * 0.02, neck + 38], [-bw * 0.5, neck + 34]]} fill="#d0a43a" f={f} seed={s + 206} w={LW * 0.8} amt={0.6} />;
			case 'belt':
				return <Line pts={[[-bw * 0.9, seat - bh * 0.18], [bw * 0.9, seat - bh * 0.18]]} color="#3a2a20" f={f} seed={s + 207} w={22} amt={0.6} />;
			case 'pocket':
				return <Shape pts={[[bw * 0.15, neck + bh * 0.45], [bw * 0.5, neck + bh * 0.45], [bw * 0.48, neck + bh * 0.68], [bw * 0.17, neck + bh * 0.68]]} fill="none" f={f} seed={s + 208} w={LW * 0.7} amt={0.6} />;
			default:
				return null;
		}
	})();
	const specs =
		v.extra === 'glasses' || v.extra === 'shades' ? (
			<g>
				{[-1, 1].map((sd) => (
					<Shape key={sd} pts={v.extra === 'shades' ? [[sd * ex - 34, ey - 20], [sd * ex + 34, ey - 20], [sd * ex + 30, ey + 16], [sd * ex - 30, ey + 18]] : circ(sd * ex, ey, 28, 24, 10)} fill={v.extra === 'shades' ? '#4a2c22' : 'none'} f={f} seed={s + 210 + sd} w={LW * 0.8} amt={0.6} />
				))}
				<Line pts={[[-ex + 30, ey - 12], [ex - 30, ey - 12]]} f={f} seed={s + 213} w={LW * 0.7} amt={0.3} />
			</g>
		) : null;
	const P2 = P[v.pose];
	const thinkHand = v.pose === 'think';
	return (
		<g transform={`translate(${x} ${y}) scale(${v.sc ?? 0.62})`}>
			{legs}
			<Shape pts={bodyPts(v.body, bw, bh).map(([px, py]) => [px, neck + py] as P2)} fill={v.col} f={f} seed={s + 10} />
			{extra}
			<Shape pts={circ(0, hcY, R, R * 0.98, 16)} fill={HEAD} f={f} seed={s + 20} amt={1.4} />
			{hair}
			{v.extra === 'shades' ? null : [-1, 1].map(eye)}
			{specs}
			{mouth}
			{arm(-1, P2[0])}
			{arm(1, thinkHand ? [-0.2, -2.6] : P2[1])}
		</g>
	);
};

const VARIANTS: V[] = [
	{n: 1, body: 'bean', bw: 130, bh: 250, headR: 105, neck: 22, legs: 'stick', legLen: 110, arms: 'line', col: '#a3876b', hair: 'swoop', hairCol: '#4a2e20', eyes: 'dot', mouth: 'smirk', pose: 'idle', extra: 'tie'},
	{n: 2, body: 'pear', bw: 140, bh: 240, headR: 100, neck: 20, legs: 'stub', legLen: 80, arms: 'line', col: '#b884a8', pants: '#8a5a80', hair: 'curly', hairCol: '#8a3a4a', eyes: 'wide', mouth: 'o', pose: 'shrug', extra: 'glasses'},
	{n: 3, body: 'egg', bw: 135, bh: 230, headR: 112, neck: 26, legs: 'tube', legLen: 120, arms: 'tube', col: '#5e7a52', pants: '#4a4e5e', hair: 'spiky', hairCol: '#c4602a', eyes: 'happy', mouth: 'grin', pose: 'cheer'},
	{n: 4, body: 'sack', bw: 140, bh: 260, headR: 100, neck: 18, legs: 'pants', legLen: 130, arms: 'line', col: '#3d4f7a', pants: '#2e2e34', shoe: '#6a4a30', hair: 'messy', hairCol: '#6a4128', eyes: 'lid', mouth: 'flat', pose: 'walk', extra: 'stripe'},
	{n: 5, body: 'tallbean', bw: 115, bh: 300, headR: 95, neck: 16, legs: 'stick', legLen: 140, arms: 'noodle', col: '#e6dcc4', hair: 'bun', hairCol: '#2a1c18', eyes: 'dot', mouth: 'smirk', pose: 'wave', extra: 'shades'},
	{n: 6, body: 'chubby', bw: 155, bh: 230, headR: 110, neck: 30, legs: 'stub', legLen: 70, arms: 'mitten', col: '#a8483a', pants: '#5a3a2a', hair: 'tuft', hairCol: '#2a1c18', eyes: 'happy', mouth: 'grin', pose: 'hips'},
	{n: 7, body: 'peanut', bw: 130, bh: 270, headR: 104, neck: 20, legs: 'boots', legLen: 120, arms: 'line', col: '#7a7e86', shoe: '#3a2a20', hair: 'cap', hairCol: '#2e5a8a', eyes: 'dot', mouth: 'flat', pose: 'point', extra: 'belt'},
	{n: 8, body: 'gumdrop', bw: 150, bh: 250, headR: 108, neck: 24, legs: 'noodle', legLen: 110, arms: 'noodle', col: '#d0a43a', hair: 'bob', hairCol: '#2a1c18', eyes: 'lid', mouth: 'smirk', pose: 'think', extra: 'collar'},
	{n: 9, body: 'bean', bw: 140, bh: 240, headR: 118, neck: 30, legs: 'tube', legLen: 100, arms: 'tube', col: '#5b7096', pants: '#3a3a44', shoe: '#ececec', hair: 'swoop', hairCol: '#c8a060', eyes: 'wide', mouth: 'frown', pose: 'shrug', extra: 'scarf'},
	{n: 10, body: 'pear', bw: 150, bh: 260, headR: 96, neck: 14, legs: 'pants', legLen: 120, arms: 'mitten', col: '#2e2e34', pants: '#2e2e34', hair: 'tuft', hairCol: '#2a1c18', eyes: 'flat', mouth: 'flat', pose: 'idle', extra: 'tie'},
	{n: 11, body: 'egg', bw: 128, bh: 250, headR: 105, neck: 22, legs: 'stick', legLen: 125, arms: 'line', col: '#9aa86a', hair: 'messy', hairCol: '#e0c060', eyes: 'dot', mouth: 'grin', pose: 'walk', extra: 'pocket'},
	{n: 12, body: 'sack', bw: 145, bh: 240, headR: 110, neck: 26, legs: 'boots', legLen: 100, arms: 'tube', col: '#6a4a8a', shoe: '#2a1c18', hair: 'curly', hairCol: '#2a1c18', eyes: 'happy', mouth: 'smirk', pose: 'wave', extra: 'glasses'},
];

export const Variants: React.FC = () => (
	<AbsoluteFill style={{background: BG}}>
		<svg width={1080} height={1920} viewBox="0 0 1080 1920">
			<rect width={1080} height={1920} fill={BG} />
			{VARIANTS.map((v, i) => {
				const col = i % 3;
				const row = Math.floor(i / 3);
				const cx = 180 + col * 360;
				const base = 450 + row * 470;
				return (
					<g key={v.n}>
						<Figure v={v} x={cx} y={base} />
						<circle cx={cx - 140} cy={base - 390} r={30} fill={INK} />
						<text x={cx - 140} y={base - 380} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={32} fill="#ececec">
							{v.n}
						</text>
					</g>
				);
			})}
		</svg>
	</AbsoluteFill>
);

// Second sheet: 16 more body types, all with drawn fingers.
const MORE: V[] = [
	{n: 13, body: 'potato', bw: 140, bh: 250, headR: 104, neck: 22, legs: 'stick', legLen: 110, arms: 'line', col: '#b89a6a', hair: 'messy', hairCol: '#5a3a28', eyes: 'dot', mouth: 'grin', pose: 'wave', hands: ['relaxed', 'open']},
	{n: 14, body: 'pill', bw: 120, bh: 280, headR: 98, neck: 18, legs: 'pants', legLen: 120, pants: '#2e3a52', arms: 'line', col: '#e8e2d2', hair: 'swoop', hairCol: '#1a1a1a', eyes: 'lid', mouth: 'smirk', pose: 'point', hands: ['relaxed', 'point'], extra: 'tie'},
	{n: 15, body: 'tri', bw: 150, bh: 260, headR: 100, neck: 16, legs: 'noodle', legLen: 110, arms: 'noodle', col: '#d06a5a', hair: 'bun', hairCol: '#e0b060', eyes: 'happy', mouth: 'grin', pose: 'jazz', hands: ['open', 'open']},
	{n: 16, body: 'barrel', bw: 150, bh: 240, headR: 104, neck: 26, legs: 'stub', legLen: 80, pants: '#4a3a2a', arms: 'tube', col: '#6a8a9a', hair: 'tuft', hairCol: '#2a1c18', eyes: 'dot', mouth: 'flat', pose: 'thumbs', hands: ['fist', 'thumb'], extra: 'belt'},
	{n: 17, body: 'tear', bw: 135, bh: 260, headR: 106, neck: 20, legs: 'stick', legLen: 120, arms: 'line', col: '#8a6ab0', hair: 'curly', hairCol: '#2a1c18', eyes: 'wide', mouth: 'o', pose: 'peace', hands: ['relaxed', 'peace'], extra: 'glasses'},
	{n: 18, body: 'lumpy', bw: 140, bh: 250, headR: 100, neck: 20, legs: 'boots', legLen: 110, shoe: '#3a2a20', arms: 'line', col: '#7a8a5a', hair: 'spiky', hairCol: '#e0d040', eyes: 'flat', mouth: 'frown', pose: 'hips', hands: ['fist', 'fist']},
	{n: 19, body: 'hourglass', bw: 130, bh: 270, headR: 100, neck: 18, legs: 'stick', legLen: 125, arms: 'noodle', col: '#c86a8a', hair: 'bob', hairCol: '#8a3a2a', eyes: 'dot', mouth: 'smirk', pose: 'shrug', hands: ['open', 'open'], extra: 'scarf'},
	{n: 20, body: 'wedge', bw: 150, bh: 260, headR: 98, neck: 16, legs: 'pants', legLen: 130, pants: '#3a3a44', arms: 'tube', col: '#4a6aa0', hair: 'cap', hairCol: '#c84a3a', eyes: 'lid', mouth: 'grin', pose: 'flex', hands: ['fist', 'fist']},
	{n: 21, body: 'blob', bw: 135, bh: 240, headR: 110, neck: 28, legs: 'stub', legLen: 75, pants: '#6a5a4a', arms: 'line', col: '#9ac0a0', hair: 'messy', hairCol: '#a8a8a8', eyes: 'happy', mouth: 'grin', pose: 'cheer', hands: ['claw', 'claw']},
	{n: 22, body: 'noodle', bw: 110, bh: 320, headR: 92, neck: 14, legs: 'stick', legLen: 150, arms: 'noodle', col: '#d8b84a', hair: 'swoop', hairCol: '#2a1c18', eyes: 'dot', mouth: 'flat', pose: 'think', hands: ['relaxed', 'ok']},
	{n: 23, body: 'mushroom', bw: 140, bh: 260, headR: 100, neck: 18, legs: 'tube', legLen: 110, pants: '#5a4a3a', arms: 'line', col: '#b8483a', hair: 'tuft', hairCol: '#2a1c18', eyes: 'wide', mouth: 'grin', pose: 'wave', hands: ['relaxed', 'open'], extra: 'collar'},
	{n: 24, body: 'cloud', bw: 140, bh: 240, headR: 108, neck: 26, legs: 'noodle', legLen: 100, arms: 'noodle', col: '#e8e8f0', hair: 'curly', hairCol: '#c8a070', eyes: 'happy', mouth: 'smirk', pose: 'jazz', hands: ['open', 'peace']},
	{n: 25, body: 'egg', bw: 135, bh: 240, headR: 112, neck: 24, legs: 'boots', legLen: 100, shoe: '#6a4a30', arms: 'line', col: '#3a5a4a', hair: 'bun', hairCol: '#5a3a28', eyes: 'lid', mouth: 'smirk', pose: 'point', hands: ['fist', 'point'], extra: 'pocket'},
	{n: 26, body: 'pear', bw: 145, bh: 250, headR: 100, neck: 20, legs: 'stick', legLen: 115, arms: 'tube', col: '#a3876b', hair: 'swoop', hairCol: '#c4602a', eyes: 'dot', mouth: 'grin', pose: 'thumbs', hands: ['relaxed', 'thumb'], extra: 'tie'},
	{n: 27, body: 'potato', bw: 150, bh: 230, headR: 115, neck: 30, legs: 'stub', legLen: 70, pants: '#3a3a44', arms: 'line', col: '#5a6278', hair: 'spiky', hairCol: '#2a1c18', eyes: 'wide', mouth: 'frown', pose: 'shrug', hands: ['claw', 'claw'], extra: 'stripe'},
	{n: 28, body: 'tallbean', bw: 118, bh: 300, headR: 96, neck: 16, legs: 'pants', legLen: 135, pants: '#e6dcc4', shoe: '#a8483a', arms: 'line', col: '#e6dcc4', hair: 'cap', hairCol: '#2a2a2e', eyes: 'dot', mouth: 'smirk', pose: 'peace', hands: ['relaxed', 'peace'], extra: 'shades'},
];

export const Variants2: React.FC = () => (
	<AbsoluteFill style={{background: BG}}>
		<svg width={1080} height={1920} viewBox="0 0 1080 1920">
			<rect width={1080} height={1920} fill={BG} />
			{MORE.map((v, i) => {
				const col = i % 4;
				const row = Math.floor(i / 4);
				const cx = 128 + col * 268;
				const base = 440 + row * 465;
				return (
					<g key={v.n}>
						<Figure v={{...v, sc: 0.5}} x={cx} y={base} />
						<circle cx={cx - 100} cy={base - 390} r={26} fill={INK} />
						<text x={cx - 100} y={base - 381} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={26} fill="#ececec">
							{v.n}
						</text>
					</g>
				);
			})}
		</svg>
	</AbsoluteFill>
);
