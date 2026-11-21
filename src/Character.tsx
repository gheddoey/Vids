import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {Hair, HairType} from './Hair';
import {Hat, HatType} from './Hats';
import {RBox, shade} from './parts';

// Roblox classic shirt template (585x559) regions: [x, y, w, h].
// Box face order in three.js: +x, -x, +y, -y, +z (front), -z (back).
type Rect = [number, number, number, number];
const TORSO: Rect[] = [
	[361, 74, 64, 128], // left side
	[165, 74, 64, 128], // right side
	[231, 8, 128, 64], // top
	[231, 204, 128, 64], // bottom
	[231, 74, 128, 128], // front
	[427, 74, 128, 128], // back
];
const RIGHT_ARM: Rect[] = [
	[151, 355, 64, 128],
	[19, 355, 64, 128],
	[217, 289, 64, 64],
	[217, 485, 64, 64],
	[85, 355, 64, 128],
	[217, 355, 64, 128],
];
const LEFT_ARM: Rect[] = [
	[440, 355, 64, 128],
	[308, 355, 64, 128],
	[308, 289, 64, 64],
	[308, 485, 64, 64],
	[374, 355, 64, 128],
	[506, 355, 64, 128],
];

const faceMaterials = (img: HTMLImageElement | null, rects: Rect[], skin: string) =>
	rects.map(([x, y, w, h]) => {
		const c = document.createElement('canvas');
		c.width = w * 2;
		c.height = h * 2;
		const ctx = c.getContext('2d')!;
		ctx.fillStyle = skin; // transparent parts of the shirt show skin, like in Roblox
		ctx.fillRect(0, 0, c.width, c.height);
		if (img) ctx.drawImage(img, x, y, w, h, 0, 0, c.width, c.height);
		const tex = new THREE.CanvasTexture(c);
		tex.colorSpace = THREE.SRGBColorSpace;
		tex.anisotropy = 4;
		return new THREE.MeshStandardMaterial({map: tex, roughness: 0.85});
	});

// Face styles taken from the reference screenshots:
// smile    - tiny square dot eyes, small thin smile (green-hair character)
// serious  - dot eyes with slanted brows, flat mouth
// mustache - white eyes with coloured iris, heavy angled brows, grey mustache
// grin     - closed happy arches, wide smile (card character)
// calm     - closed eyes as thin lines with lash ticks, small flat mouth
// ouch     - squeezed > < eyes, open wavy mouth (impact)
// dizzy    - spiral eyes, wobbly mouth (after the bonk)
// chewA/B  - happy closed eyes, mouth puffed / open (eating)
// smug     - half-lidded eyes, one raised brow, side smirk
// talkA/B  - neutral eyes, mouth open / closed (speaking)
// squint   - suspicious narrowed eyes, flat brows, tight mouth
export type FaceType = 'smile' | 'serious' | 'mustache' | 'grin' | 'calm' | 'ouch' | 'dizzy' | 'chewA' | 'chewB' | 'smug' | 'talkA' | 'talkB' | 'squint' | 'shock';

const INK = '#1b1b1b';

// Elongated head, taller than it is wide, like the reference characters.
export const HEAD_H = 1.4;

// Optional per-character face mark.
export type FaceMark = 'scar' | 'freckles' | 'blush' | 'drop' | 'mole';

const drawFace = (skin: string, face: FaceType, eyeColor = '#8e2f8a', mark?: FaceMark, browColor = '#6c665b') => {
	const c = document.createElement('canvas');
	c.width = c.height = 512;
	const g = c.getContext('2d')!;
	g.fillStyle = skin;
	g.fillRect(0, 0, 512, 512);
	// Shift features down so hair fringes don't cover the brows.
	g.translate(0, 34);
	g.strokeStyle = INK;
	g.fillStyle = INK;
	g.lineCap = 'round';
	g.lineJoin = 'round';
	const eyeY = 226;
	const eyes = [256 - 100, 256 + 100];
	const line = (w: number, pts: number[][]) => {
		g.lineWidth = w;
		g.beginPath();
		g.moveTo(pts[0][0], pts[0][1]);
		for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
		g.stroke();
	};
	const curve = (w: number, x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) => {
		g.lineWidth = w;
		g.beginPath();
		g.moveTo(x1, y1);
		g.quadraticCurveTo(cx, cy, x2, y2);
		g.stroke();
	};
	const ellipse = (x: number, y: number, rx: number, ry: number, color: string) => {
		g.fillStyle = color;
		g.beginPath();
		g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
		g.fill();
	};
	const shine = (x: number, y: number, s: number) => {
		g.fillStyle = '#ffffff';
		g.fillRect(x, y, s, s);
	};

	// Blush / freckles go under the line work.
	if (mark === 'blush' || face === 'grin') {
		ellipse(eyes[0] - 6, eyeY + 78, 40, 18, 'rgba(226, 110, 110, 0.32)');
		ellipse(eyes[1] + 6, eyeY + 78, 40, 18, 'rgba(226, 110, 110, 0.32)');
	}
	if (mark === 'freckles') {
		for (const side of [-1, 1]) {
			for (const [dx, dy] of [[-22, 70], [0, 82], [22, 70], [-10, 94], [14, 98]]) {
				ellipse(256 + side * 92 + dx, eyeY + dy, 4.5, 4.5, 'rgba(140, 80, 40, 0.55)');
			}
		}
	}

	// Hint of a nose: a soft hooked shadow line.
	g.strokeStyle = 'rgba(80, 45, 20, 0.35)';
	curve(6, 266, 262, 274, 296, 252, 300);
	g.strokeStyle = INK;

	// ---- Eyes in the reference style: a cream block with a thin border and soft shadow,
	// a small square pupil, and a thick slab brow resting on top. ----
	type EyeOpts = {
		look?: [number, number]; // pupil offset, -1..1
		lid?: number; // 0..1 of the eye covered from the top
		closed?: boolean;
		chevron?: boolean;
		spiral?: boolean;
		brow?: number; // + angry (inner ends down), - worried (inner ends up)
		raise?: [number, number]; // brow lift in px, per eye
		pupil?: number; // pupil size in px
	};
	const EW = 122;
	const EH = 82;
	const drawEyes = (o: EyeOpts = {}) => {
		for (const [i, x] of eyes.entries()) {
			const inner = i === 0 ? 1 : -1; // direction toward the nose
			const left = x - EW / 2;
			const top = eyeY - EH / 2;
			// Soft shadow and outer rim
			g.save();
			g.shadowColor = 'rgba(40, 25, 10, 0.35)';
			g.shadowBlur = 14;
			g.shadowOffsetY = 4;
			g.fillStyle = '#d6ccb7';
			g.fillRect(left - 4, top - 4, EW + 8, EH + 8);
			g.restore();
			// Whites with a lighter inner panel
			g.fillStyle = '#ece5d6';
			g.fillRect(left, top, EW, EH);
			g.fillStyle = '#f7f3ec';
			g.fillRect(left + 9, top + 9, EW - 18, EH - 22);
			if (o.closed) {
				g.fillStyle = '#3d3833';
				g.fillRect(left + 12, eyeY - 2, EW - 24, 10);
			} else if (o.chevron) {
				g.strokeStyle = '#4a453e';
				line(10, [
					[x - inner * 20, eyeY - 22],
					[x + inner * 18, eyeY],
					[x - inner * 20, eyeY + 22],
				]);
				g.strokeStyle = INK;
			} else if (o.spiral) {
				g.strokeStyle = eyeColor;
				g.lineWidth = 5;
				g.beginPath();
				for (let t = 0; t <= Math.PI * 4.5; t += 0.15) {
					const r = 3 + t * 2.1;
					const a2 = inner * t;
					const px = x + Math.cos(a2) * r;
					const py = eyeY + Math.sin(a2) * r * 0.8;
					if (t === 0) g.moveTo(px, py);
					else g.lineTo(px, py);
				}
				g.stroke();
				g.strokeStyle = INK;
			} else {
				const ps = o.pupil ?? 27;
				const px = x + (o.look?.[0] ?? 0) * 30;
				const py = eyeY + (o.look?.[1] ?? 0) * 14;
				g.fillStyle = eyeColor;
				g.fillRect(px - ps / 2, py - ps / 2, ps, ps);
				g.fillStyle = 'rgba(255, 255, 255, 0.35)';
				g.fillRect(px - ps / 2 + 3, py - ps / 2 + 3, ps / 3, ps / 3);
			}
			// Upper lid sliding down
			if (o.lid) {
				const lh = EH * o.lid;
				g.fillStyle = '#e0d6c2';
				g.fillRect(left, top, EW, lh);
				g.fillStyle = '#b5aa93';
				g.fillRect(left, top + lh - 3, EW, 4);
			}
			g.strokeStyle = '#c8bca3';
			g.lineWidth = 3;
			g.strokeRect(left, top, EW, EH);
			g.strokeStyle = INK;
			// Slab brow, tilted around its centre
			const lift = o.raise?.[i] ?? 0;
			const bw = EW + 22;
			const bt = 28;
			const tilt = (o.brow ?? 0) * inner * 0.22;
			g.save();
			g.translate(x, top - 6 - lift - (o.lid ? -EH * o.lid * 0.35 : 0));
			g.rotate(tilt);
			g.shadowColor = 'rgba(30, 20, 10, 0.35)';
			g.shadowBlur = 10;
			g.shadowOffsetY = 5;
			g.fillStyle = browColor;
			g.beginPath();
			g.moveTo(-bw / 2, -bt / 2 + 3);
			g.lineTo(-bw / 2 + 8, -bt / 2);
			g.lineTo(bw / 2 - 8, -bt / 2);
			g.lineTo(bw / 2, -bt / 2 + 3);
			g.lineTo(bw / 2 - 4, bt / 2);
			g.lineTo(-bw / 2 + 4, bt / 2);
			g.closePath();
			g.fill();
			g.shadowColor = 'transparent';
			g.fillStyle = shade(browColor, 0.08);
			g.fillRect(-bw / 2 + 8, -bt / 2, bw - 16, 7);
			g.fillStyle = shade(browColor, -0.08);
			g.fillRect(-bw / 2 + 4, bt / 2 - 5, bw - 8, 5);
			g.restore();
		}
	};

	const EYES: Record<FaceType, EyeOpts> = {
		smile: {},
		serious: {brow: 0.6, lid: 0.12},
		mustache: {brow: 1.0, lid: 0.2},
		grin: {closed: true, raise: [8, 8], brow: -0.3},
		calm: {closed: true, brow: -0.2},
		ouch: {chevron: true, brow: 0.8},
		dizzy: {spiral: true, brow: -0.7, raise: [6, 6]},
		chewA: {closed: true, raise: [6, 6], brow: -0.2},
		chewB: {closed: true, raise: [6, 6], brow: -0.2},
		smug: {lid: 0.45, look: [0.5, 0.2], raise: [0, 16], brow: 0.15},
		talkA: {brow: 0.2},
		talkB: {brow: 0.2},
		squint: {lid: 0.5, brow: 0.7},
		shock: {pupil: 15, raise: [16, 16], brow: -0.5},
	};
	drawEyes(EYES[face]);

	// ---- Mouths ----
	if (face === 'smile') {
		curve(8, 214, 326, 256, 358, 298, 326);
		line(5, [[210, 320], [216, 330]]);
		line(5, [[302, 320], [296, 330]]);
	}
	if (face === 'serious') {
		line(8, [[224, 338], [288, 338]]);
		line(5, [[236, 356], [276, 356]]);
	}
	if (face === 'mustache') {
		g.fillStyle = '#8f8f8f';
		g.beginPath();
		g.moveTo(256, 300);
		g.quadraticCurveTo(306, 286, 336, 332);
		g.quadraticCurveTo(300, 318, 256, 322);
		g.quadraticCurveTo(212, 318, 176, 332);
		g.quadraticCurveTo(206, 286, 256, 300);
		g.fill();
		g.strokeStyle = '#6c6c6c';
		for (const dx of [-40, -20, 20, 40]) line(3, [[256 + dx, 304], [256 + dx * 1.15, 318]]);
		g.strokeStyle = INK;
		curve(7, 230, 362, 256, 350, 282, 362);
	}
	if (face === 'grin') {
		g.fillStyle = INK;
		g.beginPath();
		g.moveTo(196, 316);
		g.quadraticCurveTo(256, 392, 316, 316);
		g.closePath();
		g.fill();
		g.fillStyle = '#ffffff';
		g.fillRect(212, 318, 88, 14);
	}
	if (face === 'calm') line(7, [[234, 336], [278, 336]]);
	if (face === 'ouch') {
		g.fillStyle = INK;
		g.beginPath();
		g.moveTo(206, 318);
		g.quadraticCurveTo(232, 300, 256, 318);
		g.quadraticCurveTo(280, 300, 306, 318);
		g.quadraticCurveTo(300, 372, 256, 374);
		g.quadraticCurveTo(212, 372, 206, 318);
		g.fill();
		g.fillStyle = '#c4545a';
		g.fillRect(236, 352, 40, 14);
	}
	if (face === 'dizzy') {
		g.lineWidth = 7;
		g.beginPath();
		g.moveTo(214, 330);
		for (let x = 214; x <= 298; x += 6) g.lineTo(x, 330 + Math.sin((x - 214) / 7) * 7);
		g.stroke();
	}
	if (face === 'chewA' || face === 'chewB') {
		g.strokeStyle = 'rgba(80, 45, 20, 0.45)';
		curve(6, 150, 300, 136, 330, 156, 356);
		curve(6, 362, 300, 376, 330, 356, 356);
		g.strokeStyle = INK;
		if (face === 'chewA') {
			g.lineWidth = 7;
			g.beginPath();
			g.moveTo(222, 334);
			g.quadraticCurveTo(239, 346, 256, 334);
			g.quadraticCurveTo(273, 346, 290, 334);
			g.stroke();
		} else {
			ellipse(256, 340, 22, 16, INK);
			ellipse(256, 346, 12, 7, '#c4545a');
		}
	}
	if (face === 'smug') curve(8, 226, 336, 270, 344, 300, 316);
	if (face === 'talkA') {
		ellipse(256, 338, 34, 22, INK);
		ellipse(256, 348, 18, 9, '#c4545a');
	}
	if (face === 'talkB') line(8, [[226, 336], [286, 336]]);
	if (face === 'squint') line(8, [[232, 340], [282, 336]]);
	if (face === 'shock') {
		ellipse(256, 346, 26, 34, INK);
		ellipse(256, 360, 14, 10, '#c4545a');
	}

	// Marks drawn over the top.
	if (mark === 'scar') {
		g.strokeStyle = '#9b5a4a';
		line(6, [[eyes[1] + 10, eyeY + 50], [eyes[1] + 50, eyeY + 110]]);
		for (const t of [0.3, 0.6]) {
			const x = eyes[1] + 10 + 40 * t;
			const y = eyeY + 50 + 60 * t;
			line(4, [[x - 12, y + 6], [x + 12, y - 6]]);
		}
		g.strokeStyle = INK;
	}
	if (mark === 'drop') {
		// Small teardrop mark under the left eye, like the reference.
		g.fillStyle = '#3d8fd1';
		g.beginPath();
		g.moveTo(eyes[0] + 4, eyeY + 52);
		g.quadraticCurveTo(eyes[0] + 20, eyeY + 82, eyes[0] + 4, eyeY + 90);
		g.quadraticCurveTo(eyes[0] - 12, eyeY + 82, eyes[0] + 4, eyeY + 52);
		g.fill();
	}
	if (mark === 'mole') {
		ellipse(300, 360, 6, 6, '#3a2418');
	}
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
};

// Joint angles (radians) and root placement. Positive lean tips the upper body forward;
// negative armX / legX swings a limb forward; armZ swings it out to the side
// (right arm outward is negative, left arm outward is positive); positive headX looks down.
export type Pose = {
	x: number;
	y: number;
	z: number;
	rotY: number;
	lean: number;
	twist: number;
	side: number;
	headX: number;
	headY: number;
	headZ: number;
	armLX: number;
	armLZ: number;
	armRX: number;
	armRZ: number;
	legLX: number;
	legRX: number;
	face?: FaceType;
};

export const REST: Pose = {
	x: 0,
	y: 0,
	z: 0,
	rotY: 0,
	lean: 0,
	twist: 0,
	side: 0,
	headX: 0,
	headY: 0,
	headZ: 0,
	armLX: 0,
	armLZ: 0,
	armRX: 0,
	armRZ: 0,
	legLX: 0,
	legRX: 0,
};

const FACES: FaceType[] = ['smile', 'serious', 'mustache', 'grin', 'calm', 'ouch', 'dizzy', 'chewA', 'chewB', 'smug', 'talkA', 'talkB', 'squint', 'shock'];

export type CharacterProps = {
	shirt: string;
	img?: HTMLImageElement | null;
	headOnly?: boolean;
	skin?: string;
	pants?: string;
	face?: FaceType;
	eyeColor?: string;
	// Brow colour; defaults to the hair colour, then the beard, then a dark brown.
	browColor?: string;
	mark?: FaceMark;
	hair?: {type: HairType; color: string; accent?: string};
	hat?: {type: HatType; color: string; accent?: string};
	// Facial hair block and sunglasses, worn on the head.
	beard?: string;
	shades?: boolean;
	// Unique features: glasses (frame colour), mustache (colour), earrings (colour).
	glasses?: string;
	mustache?: string;
	earrings?: string;
	position?: [number, number, number];
	rotY?: number;
	pose?: Partial<Pose>;
	// Something held in a hand (rendered at the hand, pointing forward).
	holdL?: React.ReactNode;
	holdR?: React.ReactNode;
};

const Limb: React.FC<{material: THREE.Material | THREE.Material[]}> = ({material}) => (
	<mesh position={[0, -1, 0]} material={material} castShadow receiveShadow>
		<boxGeometry args={[0.99, 2, 1]} />
	</mesh>
);

// R6-style blocky body, in studs: legs 1x2x1, torso 2x2x1, arms 1x2x1, elongated head.
// Limbs pivot at the shoulders/hips, the upper body pivots at the waist, the head at the neck.
export const Character: React.FC<CharacterProps> = ({
	img = null,
	headOnly = false,
	skin = '#f3c98f',
	pants = '#2a2c33',
	face = 'smile',
	eyeColor,
	browColor,
	mark,
	hair,
	hat,
	beard,
	shades,
	glasses,
	mustache,
	earrings,
	position = [0, 0, 0],
	rotY = 0,
	pose = {},
	holdL,
	holdR,
}) => {
	const p: Pose = {...REST, x: position[0], y: position[1], z: position[2], rotY, ...pose};
	const torso = useMemo(() => faceMaterials(img, TORSO, skin), [img, skin]);
	const rArm = useMemo(() => faceMaterials(img, RIGHT_ARM, skin), [img, skin]);
	const lArm = useMemo(() => faceMaterials(img, LEFT_ARM, skin), [img, skin]);
	const legMat = useMemo(() => new THREE.MeshStandardMaterial({color: pants, roughness: 0.85}), [pants]);
	const headGeo = useMemo(() => new RoundedBoxGeometry(1.2, HEAD_H, 1.2, 1, 0.04), []);
	// Every expression is drawn once up front so faces can swap instantly mid-animation.
	const brow = browColor ?? hair?.color ?? beard ?? '#3a2a20';
	const headMats = useMemo(() => {
		const plain = new THREE.MeshStandardMaterial({color: skin, roughness: 0.7});
		return Object.fromEntries(
			FACES.map((f) => {
				const front = new THREE.MeshStandardMaterial({map: drawFace(skin, f, eyeColor, mark, brow), roughness: 0.7});
				return [f, [plain, plain, plain, plain, front, plain]];
			}),
		) as Record<FaceType, THREE.Material[]>;
	}, [skin, eyeColor, mark, brow]);

	const head = (
		<group position={[0, HEAD_H / 2 + 0.02, 0]}>
			<mesh geometry={headGeo} material={headMats[p.face ?? face]} castShadow receiveShadow />
			{beard ? (
				<group>
					<RBox size={[1.26, 0.42, 0.34]} pos={[0, -0.52, 0.48]} color={beard} />
					<RBox size={[0.16, 0.8, 0.9]} pos={[-0.62, -0.3, 0.1]} color={beard} />
					<RBox size={[0.16, 0.8, 0.9]} pos={[0.62, -0.3, 0.1]} color={beard} />
					<RBox size={[0.7, 0.12, 0.08]} pos={[0, -0.2, 0.63]} color={beard} />
				</group>
			) : null}
			{glasses ? (
				<group>
					{[-0.24, 0.24].map((x) => (
						<group key={x} position={[x, -0.01, 0.625]}>
							<RBox size={[0.38, 0.045, 0.04]} pos={[0, 0.15, 0]} color={glasses} rough={0.3} />
							<RBox size={[0.38, 0.045, 0.04]} pos={[0, -0.15, 0]} color={glasses} rough={0.3} />
							<RBox size={[0.045, 0.3, 0.04]} pos={[-0.17, 0, 0]} color={glasses} rough={0.3} />
							<RBox size={[0.045, 0.3, 0.04]} pos={[0.17, 0, 0]} color={glasses} rough={0.3} />
							<mesh position={[0, 0, -0.005]}>
								<planeGeometry args={[0.32, 0.26]} />
								<meshStandardMaterial color="#dff2ff" transparent opacity={0.18} roughness={0.05} />
							</mesh>
						</group>
					))}
					<RBox size={[0.12, 0.04, 0.04]} pos={[0, 0.06, 0.625]} color={glasses} rough={0.3} />
					<RBox size={[0.035, 0.045, 0.78]} pos={[-0.62, 0.08, 0.24]} color={glasses} rough={0.3} />
					<RBox size={[0.035, 0.045, 0.78]} pos={[0.62, 0.08, 0.24]} color={glasses} rough={0.3} />
				</group>
			) : null}
			{mustache ? (
				<group>
					<RBox size={[0.56, 0.11, 0.07]} pos={[0, -0.215, 0.62]} color={mustache} />
					<RBox size={[0.12, 0.14, 0.07]} pos={[-0.26, -0.27, 0.62]} color={mustache} />
					<RBox size={[0.12, 0.14, 0.07]} pos={[0.26, -0.27, 0.62]} color={mustache} />
				</group>
			) : null}
			{earrings ? (
				<group>
					<RBox size={[0.06, 0.12, 0.06]} pos={[-0.63, -0.3, 0.12]} color={earrings} rough={0.2} />
					<RBox size={[0.06, 0.12, 0.06]} pos={[0.63, -0.3, 0.12]} color={earrings} rough={0.2} />
				</group>
			) : null}
			{shades ? (
				<group position={[0, 0.0, 0]}>
					{[-0.27, 0.27].map((x) => (
						<RBox key={x} size={[0.46, 0.24, 0.05]} pos={[x, 0, 0.625]} color="#141418" rough={0.15} />
					))}
					<RBox size={[0.14, 0.05, 0.04]} pos={[0, 0.06, 0.625]} color="#141418" rough={0.15} />
					<RBox size={[0.04, 0.06, 0.8]} pos={[-0.62, 0.05, 0.22]} color="#141418" rough={0.15} />
					<RBox size={[0.04, 0.06, 0.8]} pos={[0.62, 0.05, 0.22]} color="#141418" rough={0.15} />
				</group>
			) : null}
			{/* Hair and hats are modelled for a 1.2-tall head; lift them to the taller head's top */}
			<group position={[0, HEAD_H / 2 - 0.6, 0]}>
				{hair ? <Hair {...hair} /> : null}
				{hat ? <Hat {...hat} /> : null}
			</group>
		</group>
	);

	if (headOnly) {
		return (
			<group position={[p.x, p.y + 4, p.z]} rotation={[0, p.rotY, 0]}>
				{head}
			</group>
		);
	}

	return (
		<group position={[p.x, p.y, p.z]} rotation={[0, p.rotY, 0]}>
			{/* Legs, pivoting at the hips */}
			<group position={[-0.5, 2, 0]} rotation={[p.legRX, 0, 0]}>
				<Limb material={legMat} />
			</group>
			<group position={[0.5, 2, 0]} rotation={[p.legLX, 0, 0]}>
				<Limb material={legMat} />
			</group>
			{/* Upper body, pivoting at the waist */}
			<group position={[0, 2, 0]} rotation={[p.lean, p.twist, p.side]}>
				<mesh position={[0, 1, 0]} material={torso} castShadow receiveShadow>
					<boxGeometry args={[2, 2, 1]} />
				</mesh>
				{/* Arms, pivoting at the shoulders (character's right arm is on -x) */}
				<group position={[-1.5, 1.75, 0]} rotation={[p.armRX, 0, p.armRZ]}>
					<group position={[0, 0.25, 0]}>
						<Limb material={rArm} />
						{holdR ? <group position={[0, -2.05, 0.1]}>{holdR}</group> : null}
					</group>
				</group>
				<group position={[1.5, 1.75, 0]} rotation={[p.armLX, 0, p.armLZ]}>
					<group position={[0, 0.25, 0]}>
						<Limb material={lArm} />
						{holdL ? <group position={[0, -2.05, 0.1]}>{holdL}</group> : null}
					</group>
				</group>
				{/* Head, pivoting at the neck */}
				<group position={[0, 2, 0]} rotation={[p.headX, p.headY, p.headZ]}>
					{head}
				</group>
			</group>
		</group>
	);
};
