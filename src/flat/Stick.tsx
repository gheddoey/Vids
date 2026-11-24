import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BG, HEAD, INK, LW, Line, Shape} from './Flat';

// "Stick": a lanky, expressive stickman in the flat doodle style.
// Round head with acting brows, slim filled torso, thin two-joint limbs,
// mitten hands with a thumb, rounded shoes. Built for explainers and storytelling.

type P2 = [number, number];
const circ = (cx: number, cy: number, rx: number, ry: number, n = 14, rot = 0): P2[] =>
	Array.from({length: n}, (_, i) => {
		const a = (i / n) * Math.PI * 2;
		const x = Math.cos(a) * rx;
		const y = Math.sin(a) * ry;
		return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
	});

export type StickLook = {
	shirt: string;
	pants?: string; // if set, legs get thicker trouser strokes in this colour
	shoes?: string;
	hair?: 'tufts' | 'swoop' | 'messy' | 'curly' | 'bun' | 'buzz' | 'ponytail' | 'none';
	hairCol?: string;
	glasses?: boolean;
	tie?: string;
	scarf?: string;
	h?: number;
};
export type SExpr = 'neutral' | 'happy' | 'talk' | 'unsure' | 'shock' | 'angry' | 'sly' | 'sad' | 'laugh' | 'determined' | 'bored' | 'scared';
export type SPose = {
	armL: [number, number];
	armR: [number, number];
	legL: [number, number]; // [hip swing, knee bend]
	legR: [number, number];
	lean: number;
	tilt: number;
	turn: number; // 0 front … 1 side (facing right)
	hop: number;
	crouch: number; // 0..1 lowers the hips
	handL?: 'mitt' | 'fist' | 'open';
	handR?: 'mitt' | 'fist' | 'open';
};
export const SREST: SPose = {armL: [0.12, 0.08], armR: [0.12, 0.08], legL: [0.06, 0], legR: [0.06, 0], lean: 0, tilt: 0, turn: 0, hop: 0, crouch: 0};

export const Stick: React.FC<{look: StickLook; expr?: SExpr; pose?: Partial<SPose>; x: number; y: number; s?: number; f?: number; seed?: number; headOnly?: boolean}> = ({look, expr = 'neutral', pose = {}, x, y, s = 1, f = 0, seed = 1, headOnly}) => {
	const P = {...SREST, ...pose};
	const k = look.h ?? 1;
	const t = P.turn;
	const THIGH = 118;
	const SHIN = 112;
	const TORSO = 210;
	const TW = 46 * (1 - t * 0.25); // half torso width
	const R = 96;
	const hipY = -(THIGH + SHIN) * (1 - P.crouch * 0.35);
	const neck = hipY - TORSO;
	const hcX = t * 16;
	const hcY = neck - R - 6;

	// ---------- legs ----------
	const leg = (side: -1 | 1, [a, kn]: [number, number]) => {
		const x0 = side * TW * 0.45 * (1 - t * 0.7);
		const th1 = Math.PI / 2 - a * side; // + swings out
		const kx = x0 + Math.cos(th1) * THIGH;
		const ky = hipY + Math.sin(th1) * THIGH;
		const th2 = th1 + kn * (t > 0.5 ? -1 : side); // knee bends backward when side-on
		const fx = kx + Math.cos(th2) * SHIN;
		const fy = ky + Math.sin(th2) * SHIN;
		const toe = t > 0.3 ? 1 : side;
		const w = look.pants ? LW * 2.2 : LW;
		return (
			<g key={side}>
				{look.pants ? <Line pts={[[x0, hipY], [kx, ky], [fx, fy]]} f={f} seed={seed + 30 + side} w={w + LW * 1.1} amt={0.6} /> : null}
				<Line pts={[[x0, hipY], [kx, ky], [fx, fy]]} f={f} seed={seed + 30 + side} w={look.pants ? w : LW} color={look.pants ?? INK} amt={0.6} />
				<Shape pts={[[fx - toe * 18, fy - 12], [fx + toe * 26, fy - 14], [fx + toe * 40, fy + 2], [fx + toe * 30, fy + 9], [fx - toe * 20, fy + 8]]} fill={look.shoes ?? INK} f={f} seed={seed + 34 + side} w={LW * 0.8} amt={0.5} />
			</g>
		);
	};

	// ---------- arms + mitten hands ----------
	const shY = neck + 20;
	const arm = (side: -1 | 1, [a, e]: [number, number], hand: 'mitt' | 'fist' | 'open') => {
		const ox = side * TW * 0.85 * (1 - t * 0.5) + t * 6;
		const L1 = 110;
		const L2 = 104;
		const th1 = Math.PI / 2 - a * side;
		const ex = ox + Math.cos(th1) * L1;
		const ey = shY + Math.sin(th1) * L1;
		const th2 = th1 - e * side;
		const hx = ex + Math.cos(th2) * L2;
		const hy = ey + Math.sin(th2) * L2;
		const c = Math.cos(th2);
		const sn = Math.sin(th2);
		const px = hx + c * 14;
		const py = hy + sn * 14;
		// thumb sits on the side facing the body's front
		const thumbA = th2 - 1.1 * side;
		const H =
			hand === 'fist' ? (
				<Shape pts={circ(px, py, 18, 16, 9, th2)} fill={HEAD} f={f} seed={seed + 50 + side} w={LW * 0.8} amt={0.3} />
			) : (
				<g>
					<Shape pts={circ(px + c * (hand === 'open' ? 8 : 4), py + sn * (hand === 'open' ? 8 : 4), hand === 'open' ? 26 : 22, 15, 10, th2)} fill={HEAD} f={f} seed={seed + 52 + side} w={LW * 0.8} amt={0.3} />
					<Shape pts={circ(px + Math.cos(thumbA) * 16, py + Math.sin(thumbA) * 16, 11, 7, 8, thumbA)} fill={HEAD} f={f} seed={seed + 54 + side} w={LW * 0.7} amt={0.2} />
				</g>
			);
		return (
			<g key={side}>
				<Line pts={[[ox, shY], [ex, ey], [hx, hy]]} f={f} seed={seed + 40 + side} amt={0.6} />
				{H}
			</g>
		);
	};

	// ---------- torso ----------
	const torso: P2[] = [
		[-TW, neck + 6],
		[-TW * 1.02, neck + TORSO * 0.5],
		[-TW * 0.96, hipY + 4],
		[TW * 0.96, hipY + 4],
		[TW * 1.02, neck + TORSO * 0.5],
		[TW, neck + 6],
		[0, neck],
	].map(([px, py]) => [px + t * 6, py] as P2);

	// ---------- face ----------
	const fx = hcX + t * R * 0.5;
	const eyeY = hcY - 2;
	const sep = 30 * (1 - t * 0.5);
	type EyeK = 'oval' | 'dot' | 'happy' | 'closed' | 'half' | 'wide' | 'tiny';
	const EX: Record<SExpr, {eye: EyeK; brow: number; browUp?: number; mouth: 'flat' | 'smile' | 'open' | 'wobble' | 'o' | 'frown' | 'grin' | 'smirk' | 'teeth'; look?: number}> = {
		neutral: {eye: 'oval', brow: 0, mouth: 'flat'},
		happy: {eye: 'happy', brow: -0.3, mouth: 'smile'},
		talk: {eye: 'oval', brow: -0.2, mouth: 'open'},
		unsure: {eye: 'oval', brow: -0.9, mouth: 'wobble', look: -0.6},
		shock: {eye: 'wide', brow: -1, browUp: -10, mouth: 'o'},
		angry: {eye: 'oval', brow: 1.2, mouth: 'teeth'},
		sly: {eye: 'half', brow: 1.0, mouth: 'smirk', look: 0.7},
		sad: {eye: 'oval', brow: -1.2, mouth: 'frown', look: 0.3},
		laugh: {eye: 'closed', brow: -0.6, mouth: 'grin'},
		determined: {eye: 'half', brow: 0.8, mouth: 'flat'},
		bored: {eye: 'half', brow: 0, mouth: 'flat', look: -0.4},
		scared: {eye: 'tiny', brow: -1.2, browUp: -6, mouth: 'wobble'},
	};
	const E = EX[expr];
	const lk = (E.look ?? 0) * 6 + t * 6;
	const eye = (side: -1 | 1) => {
		const cx = fx + side * sep;
		const far = t > 0.2 && side < 0 ? 1 - t * 0.45 : 1;
		switch (E.eye) {
			case 'happy':
				return <Line key={side} pts={[[cx - 14 * far, eyeY + 6], [cx, eyeY - 8], [cx + 14 * far, eyeY + 6]]} f={f} seed={seed + 60 + side} w={LW * 0.8} amt={0.3} />;
			case 'closed':
				return <Line key={side} pts={[[cx - 14 * far, eyeY - 4], [cx, eyeY + 7], [cx + 14 * far, eyeY - 4]]} f={f} seed={seed + 62 + side} w={LW * 0.8} amt={0.3} />;
			case 'tiny':
				return (
					<g key={side}>
						<ellipse cx={cx} cy={eyeY} rx={17 * far} ry={21} fill="#fff" stroke={INK} strokeWidth={LW * 0.6} />
						<circle cx={cx} cy={eyeY + 2} r={4} fill={INK} />
					</g>
				);
			case 'wide':
				return (
					<g key={side}>
						<ellipse cx={cx} cy={eyeY - 2} rx={20 * far} ry={25} fill="#fff" stroke={INK} strokeWidth={LW * 0.6} />
						<circle cx={cx + lk * 0.3} cy={eyeY} r={7} fill={INK} />
					</g>
				);
			case 'half':
				return (
					<g key={side}>
						<ellipse cx={cx} cy={eyeY + 2} rx={15 * far} ry={13} fill="#fff" stroke={INK} strokeWidth={LW * 0.6} />
						<circle cx={cx + lk} cy={eyeY + 5} r={6} fill={INK} />
						<Line pts={[[cx - 17 * far, eyeY - 4], [cx + 17 * far, eyeY - 4]]} f={f} seed={seed + 64 + side} w={LW * 0.8} amt={0.2} />
					</g>
				);
			case 'dot':
				return <ellipse key={side} cx={cx} cy={eyeY} rx={8 * far} ry={10} fill={INK} />;
			case 'oval':
			default:
				return (
					<g key={side}>
						<ellipse cx={cx} cy={eyeY} rx={15 * far} ry={19} fill="#fff" stroke={INK} strokeWidth={LW * 0.6} />
						<circle cx={cx + lk} cy={eyeY + 3} r={7} fill={INK} />
					</g>
				);
		}
	};
	const brow = (side: -1 | 1) => {
		const cx = fx + side * sep;
		const by = eyeY - 30 + (E.browUp ?? 0);
		const b = E.brow; // + angry: inner end down
		return <Line key={`b${side}`} pts={[[cx - side * 18, by + b * 11], [cx, by - 3 - Math.abs(b) * 1.5], [cx + side * 18, by - b * 5]]} f={f} seed={seed + 66 + side} w={LW * 1.1} amt={0.3} />;
	};
	const my = hcY + 44;
	const mx = fx + 4;
	const mouth = (() => {
		switch (E.mouth) {
			case 'smile':
				return <Line pts={[[mx - 22, my - 4], [mx, my + 9], [mx + 22, my - 4]]} f={f} seed={seed + 70} w={LW * 0.8} amt={0.3} />;
			case 'open':
				return <Shape pts={[[mx - 16, my - 5], [mx + 16, my - 5], [mx + 10, my + 12], [mx - 10, my + 12]]} fill="#7a3a30" f={f} seed={seed + 71} w={LW * 0.7} amt={0.3} />;
			case 'wobble':
				return <Line pts={[[mx - 20, my + 4], [mx - 8, my - 2], [mx + 4, my + 4], [mx + 18, my - 1]]} f={f} seed={seed + 72} w={LW * 0.8} amt={0.3} />;
			case 'o':
				return <Shape pts={circ(mx, my + 4, 11, 15, 8)} fill="#7a3a30" f={f} seed={seed + 73} w={LW * 0.7} amt={0.3} />;
			case 'frown':
				return <Line pts={[[mx - 18, my + 8], [mx, my - 3], [mx + 18, my + 8]]} f={f} seed={seed + 74} w={LW * 0.8} amt={0.3} />;
			case 'grin':
				return <Shape pts={[[mx - 26, my - 8], [mx + 26, my - 8], [mx + 14, my + 18], [mx - 14, my + 18]]} fill="#7a3a30" f={f} seed={seed + 75} w={LW * 0.7} amt={0.3} />;
			case 'smirk':
				return <Line pts={[[mx - 22, my + 2], [mx + 6, my + 4], [mx + 22, my - 10]]} f={f} seed={seed + 76} w={LW * 0.8} amt={0.3} />;
			case 'teeth':
				return (
					<g>
						<Shape pts={[[mx - 22, my - 4], [mx + 22, my - 4], [mx + 18, my + 10], [mx - 18, my + 10]]} fill="#ffffff" f={f} seed={seed + 77} w={LW * 0.7} amt={0.3} />
						<Line pts={[[mx - 18, my + 3], [mx + 18, my + 3]]} f={f} seed={seed + 78} w={LW * 0.4} amt={0.2} />
					</g>
				);
			default:
				return <Line pts={[[mx - 16, my], [mx + 16, my + 1]]} f={f} seed={seed + 79} w={LW * 0.8} amt={0.3} />;
		}
	})();

	// ---------- hair ----------
	const hc = look.hairCol ?? INK;
	const T = (dx: number, dy: number): P2 => [hcX + dx, hcY + dy];
	const hair = (() => {
		switch (look.hair) {
			case 'tufts':
				return (
					<g>
						{[
							[-0.35, -1.0, -0.6, -1.35, -0.2, -1.4],
							[-0.05, -1.02, -0.1, -1.45, 0.2, -1.38],
							[0.25, -0.98, 0.45, -1.32, 0.62, -1.18],
						].map(([a, b, c, d, e2, g], i) => (
							<Line key={i} pts={[T(R * a, R * b), T(R * c, R * d), T(R * e2, R * g)]} f={f} seed={seed + 80 + i} w={LW * 0.9} color={hc} amt={1} />
						))}
					</g>
				);
			case 'swoop':
				return <Shape pts={[T(-R * 0.98, -R * 0.15), T(-R * 0.9, -R * 0.62), T(-R * 0.4, -R * 1.06), T(R * 0.4, -R * 1.05), T(R * 0.95, -R * 0.5), T(R, -R * 0.15), T(R * 0.55, -R * 0.56), T(-R * 0.1, -R * 0.66), T(-R * 0.65, -R * 0.5)]} fill={hc} f={f} seed={seed + 84} amt={0.8} />;
			case 'messy':
				return <Shape pts={[T(-R, -R * 0.1), T(-R * 1.12, -R * 0.62), T(-R * 0.72, -R * 1.12), T(-R * 0.2, -R * 1.25), T(R * 0.25, -R * 1.12), T(R * 0.75, -R * 1.2), T(R * 1.1, -R * 0.62), T(R, -R * 0.1), T(R * 0.7, -R * 0.5), T(R * 0.35, -R * 0.66), T(-R * 0.1, -R * 0.5), T(-R * 0.5, -R * 0.68), T(-R * 0.78, -R * 0.4)]} fill={hc} f={f} seed={seed + 85} amt={1.2} />;
			case 'curly':
				return (
					<g>
						{Array.from({length: 9}).map((_, i) => {
							const a = Math.PI + (i / 8) * Math.PI;
							return <Shape key={i} pts={circ(hcX + Math.cos(a) * R * 0.92, hcY + Math.sin(a) * R * 0.92 - 6, R * 0.27, R * 0.25, 8)} fill={hc} f={f} seed={seed + 86 + i} w={LW * 0.8} amt={0.6} />;
						})}
					</g>
				);
			case 'bun':
				return (
					<g>
						<Shape pts={circ(hcX + 4, hcY - R * 1.1, R * 0.32, R * 0.28, 10)} fill={hc} f={f} seed={seed + 96} amt={0.5} />
						<Shape pts={[T(-R * 0.98, -R * 0.1), T(-R * 0.85, -R * 0.62), T(0, -R * 1.03), T(R * 0.85, -R * 0.62), T(R * 0.98, -R * 0.1), T(R * 0.6, -R * 0.6), T(0, -R * 0.7), T(-R * 0.6, -R * 0.6)]} fill={hc} f={f} seed={seed + 97} amt={0.7} />
					</g>
				);
			case 'buzz':
				return <Shape pts={[T(-R * 0.97, -R * 0.25), T(-R * 0.85, -R * 0.66), T(0, -R * 1.02), T(R * 0.85, -R * 0.66), T(R * 0.97, -R * 0.25), T(R * 0.6, -R * 0.66), T(0, -R * 0.78), T(-R * 0.6, -R * 0.66)]} fill={hc} f={f} seed={seed + 98} amt={0.6} />;
			case 'ponytail':
				return (
					<g>
						<Shape pts={[T(-R * 0.7, -R * 0.6), T(-R * 1.35, -R * 0.3), T(-R * 1.45, R * 0.4), T(-R * 1.15, R * 0.2), T(-R * 0.95, -R * 0.2)]} fill={hc} f={f} seed={seed + 99} amt={0.8} />
						<Shape pts={[T(-R * 0.98, -R * 0.1), T(-R * 0.85, -R * 0.62), T(0, -R * 1.03), T(R * 0.85, -R * 0.62), T(R * 0.98, -R * 0.1), T(R * 0.55, -R * 0.58), T(0, -R * 0.66), T(-R * 0.6, -R * 0.6)]} fill={hc} f={f} seed={seed + 100} amt={0.7} />
					</g>
				);
			default:
				return null;
		}
	})();
	const specs = look.glasses ? (
		<g>
			{([-1, 1] as const).map((sd) => (
				<Shape key={sd} pts={circ(fx + sd * sep, eyeY, 25 * (t > 0.2 && sd < 0 ? 1 - t * 0.45 : 1), 25, 10)} fill="none" f={f} seed={seed + 102 + sd} w={LW * 0.7} amt={0.3} />
			))}
			<Line pts={[[fx - sep + 24, eyeY - 4], [fx + sep - 24, eyeY - 4]]} f={f} seed={seed + 105} w={LW * 0.6} amt={0.2} />
		</g>
	) : null;

	const head = (
		<g transform={`rotate(${(P.tilt * 180) / Math.PI} ${hcX} ${neck})`}>
			<Shape pts={circ(hcX, hcY, R, R * 0.97, 16)} fill={HEAD} f={f} seed={seed + 10} amt={1} />
			{hair}
			{([-1, 1] as const).map(eye)}
			{([-1, 1] as const).map(brow)}
			{specs}
			{mouth}
		</g>
	);
	if (headOnly)
		return (
			<g transform={`translate(${x} ${y}) scale(${s * k}) translate(0 ${-hcY})`}>
				{head}
			</g>
		);

	const extras = (
		<g>
			{look.tie ? <Shape pts={[[t * 6 - 9, neck + 8], [t * 6 + 9, neck + 8], [t * 6 + 13, neck + 90], [t * 6, neck + 106], [t * 6 - 13, neck + 90]]} fill={look.tie} f={f} seed={seed + 110} w={LW * 0.65} amt={0.3} /> : null}
			{look.scarf ? <Shape pts={[[-TW * 1.15, neck - 2], [TW * 1.15, neck - 2], [TW * 1.1, neck + 26], [TW * 0.3, neck + 30], [TW * 0.55, neck + 110], [TW * 0.05, neck + 110], [-TW * 0.1, neck + 30], [-TW * 1.1, neck + 26]]} fill={look.scarf} f={f} seed={seed + 111} w={LW * 0.75} amt={0.4} /> : null}
		</g>
	);

	return (
		<g transform={`translate(${x} ${y - P.hop}) scale(${s * k})`}>
			{t > 0.5 ? (
				<g transform={`rotate(${(P.lean * 180) / Math.PI} 0 ${hipY})`}>{arm(-1, P.armL, P.handL ?? 'mitt')}</g>
			) : null}
			{leg(-1, P.legL)}
			{leg(1, P.legR)}
			<g transform={`rotate(${(P.lean * 180) / Math.PI} 0 ${hipY})`}>
				<Shape pts={torso} fill={look.shirt} f={f} seed={seed + 20} amt={0.7} />
				{extras}
				{head}
				{t > 0.5 ? null : arm(-1, P.armL, P.handL ?? 'mitt')}
				{arm(1, P.armR, P.handR ?? 'mitt')}
			</g>
		</g>
	);
};

// ---------------- Sheets ----------------
const HERO: StickLook = {shirt: '#5b7096', hair: 'tufts'};
const POSES: [SExpr, Partial<SPose>][] = [
	['unsure', {armR: [-0.4, -2.55], armL: [0.18, -0.3], legL: [0.1, 0], legR: [-0.06, 0.1], tilt: 0.1}],
	['sly', {turn: 1, armL: [0.5, 0.3], armR: [-0.5, -0.4], legL: [-0.55, 0.2], legR: [0.45, 0.5], lean: 0.08}],
	['talk', {armR: [1.1, 1.0], armL: [0.18, 0.1], handR: 'open', tilt: -0.06}],
	['determined', {armR: [1.55, 0.02], armL: [0.2, 0.1], handR: 'fist', legL: [0.12, 0], legR: [0.18, 0.05], lean: 0.04}],
	['shock', {armL: [1.4, 1.2], armR: [1.4, 1.2], handL: 'open', handR: 'open', legL: [0.2, 0], legR: [0.2, 0], hop: 18}],
	['happy', {armL: [0.7, -2.0], armR: [1.55, 0.05], legL: [0.12, 0], legR: [0.12, 0]}],
	['angry', {armL: [0.6, -2.1], armR: [0.6, -2.1], handL: 'fist', handR: 'fist', lean: 0.06, legL: [0.15, 0], legR: [0.15, 0]}],
	['laugh', {armL: [2.5, 0.3], armR: [2.5, 0.3], handL: 'open', handR: 'open', hop: 30, legL: [0.2, 0.3], legR: [0.2, 0.3]}],
	['bored', {armL: [0.05, 0.05], armR: [0.05, 0.05], tilt: 0.2, lean: -0.05, crouch: 0.1}],
];

export const StickSheet: React.FC = () => (
	<AbsoluteFill style={{background: BG}}>
		<svg width={1080} height={1920} viewBox="0 0 1080 1920">
			<rect width={1080} height={1920} fill={BG} />
			{[0, 0.5, 1].map((turn, i) => (
				<Stick key={i} look={HERO} expr={i === 0 ? 'happy' : 'neutral'} pose={{turn}} x={190 + i * 350} y={560} s={0.8} seed={3} />
			))}
			{(['neutral', 'happy', 'talk', 'laugh', 'unsure', 'shock', 'angry', 'sly', 'sad', 'scared', 'determined', 'bored'] as SExpr[]).map((e, i) => (
				<Stick key={e} look={HERO} expr={e} x={135 + (i % 6) * 162} y={690 + Math.floor(i / 6) * 175} s={0.58} headOnly seed={3} />
			))}
			{POSES.map(([e, p], i) => (
				<Stick key={i} look={HERO} expr={e} pose={p} x={180 + (i % 3) * 360} y={1250} s={0.47} seed={3} />
			)).slice(0, 3)}
			{POSES.slice(3, 6).map(([e, p], i) => (
				<Stick key={i} look={HERO} expr={e} pose={p} x={180 + i * 360} y={1570} s={0.47} seed={3} />
			))}
			{POSES.slice(6, 9).map(([e, p], i) => (
				<Stick key={i} look={HERO} expr={e} pose={p} x={180 + i * 360} y={1890} s={0.47} seed={3} />
			))}
		</svg>
	</AbsoluteFill>
);

const CAST: [StickLook, SExpr, Partial<SPose>][] = [
	[{shirt: '#3d4f7a', hair: 'swoop', hairCol: '#4a2e20', glasses: true}, 'talk', {armR: [1.1, 1.0], handR: 'open'}],
	[{shirt: '#e6dcc4', pants: '#e6dcc4', shoes: '#6a4a30', hair: 'buzz', hairCol: '#bdbdbd', tie: '#a8483a', h: 1.06}, 'sly', {armL: [0.6, -2.1], armR: [0.6, -2.1]}],
	[{shirt: '#b884a8', hair: 'ponytail', hairCol: '#8a4a2a', h: 0.96}, 'happy', {armR: [2.3, 0.6], handR: 'open'}],
	[{shirt: '#a8483a', hair: 'messy', hairCol: '#6a4128', scarf: '#d0a43a'}, 'laugh', {armL: [0.9, 1.4], armR: [0.9, 1.4]}],
	[{shirt: '#5e7a52', pants: '#3e4252', hair: 'curly', hairCol: '#2a1c18', h: 0.92}, 'unsure', {armR: [-0.4, -2.55]}],
	[{shirt: '#d0a43a', hair: 'tufts', hairCol: '#c4602a', h: 0.72}, 'shock', {armL: [2.4, 0.3], armR: [2.4, 0.3], handL: 'open', handR: 'open'}],
];

export const StickCast: React.FC = () => (
	<AbsoluteFill style={{background: BG}}>
		<svg width={1080} height={1920} viewBox="0 0 1080 1920">
			<rect width={1080} height={1920} fill={BG} />
			{CAST.map(([c, e, p], i) => (
				<Stick key={i} look={c} expr={e} pose={p} x={190 + (i % 3) * 350} y={880 + Math.floor(i / 3) * 900} s={0.85} seed={i * 17 + 5} />
			))}
		</svg>
	</AbsoluteFill>
);
