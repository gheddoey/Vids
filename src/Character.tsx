import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {Hair, HairType} from './Hair';
import {Hat, HatType} from './Hats';

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
export type FaceType = 'smile' | 'serious' | 'mustache' | 'grin' | 'calm' | 'ouch' | 'dizzy' | 'chewA' | 'chewB' | 'smug';

const INK = '#1b1b1b';

// Elongated head, taller than it is wide, like the reference characters.
export const HEAD_H = 1.4;

// Optional per-character face mark.
export type FaceMark = 'scar' | 'freckles' | 'blush' | 'drop' | 'mole';

const drawFace = (skin: string, face: FaceType, eyeColor = '#8e2f8a', mark?: FaceMark) => {
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
	const eyes = [256 - 90, 256 + 90];
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

	if (face === 'smile' || face === 'serious') {
		// Big upright block eyes with a shine, like the reference dot eyes scaled up.
		for (const x of eyes) {
			g.fillStyle = INK;
			g.fillRect(x - 24, eyeY - 34, 48, 70);
			shine(x - 15, eyeY - 25, 14);
		}
	}
	if (face === 'smile') {
		// Soft arched brows and a small upturned smile with corner ticks.
		curve(7, eyes[0] - 34, eyeY - 58, eyes[0], eyeY - 72, eyes[0] + 30, eyeY - 60);
		curve(7, eyes[1] - 30, eyeY - 60, eyes[1], eyeY - 72, eyes[1] + 34, eyeY - 58);
		curve(8, 214, 326, 256, 358, 298, 326);
		line(5, [[210, 320], [216, 330]]);
		line(5, [[302, 320], [296, 330]]);
	}
	if (face === 'serious') {
		line(11, [[eyes[0] - 40, eyeY - 72], [eyes[0] + 30, eyeY - 48]]);
		line(11, [[eyes[1] + 40, eyeY - 72], [eyes[1] - 30, eyeY - 48]]);
		line(8, [[224, 338], [288, 338]]);
		line(5, [[236, 356], [276, 356]]); // under-lip shadow
	}
	if (face === 'mustache') {
		for (const [i, x] of eyes.entries()) {
			const inner = i === 0 ? 1 : -1; // iris sits toward the nose
			g.fillStyle = '#f4f1ea';
			g.fillRect(x - 54, eyeY - 34, 108, 74);
			g.fillStyle = eyeColor;
			g.fillRect(x + inner * 16 - 21, eyeY - 28, 42, 64);
			g.fillStyle = INK;
			g.fillRect(x + inner * 16 - 9, eyeY - 14, 18, 34);
			shine(x + inner * 16 - 17, eyeY - 24, 10);
			g.lineWidth = 6;
			g.strokeRect(x - 54, eyeY - 34, 108, 74);
			line(13, [[x - 57, eyeY - 34], [x + 57, eyeY - 34]]); // heavy upper lid
			line(4, [[x - 40, eyeY + 50], [x + 30, eyeY + 50]]); // bag under the eye
		}
		// Thick brows angled down toward the nose
		g.strokeStyle = '#3a3a3a';
		line(17, [[eyes[0] - 58, eyeY - 82], [eyes[0] + 52, eyeY - 50]]);
		line(17, [[eyes[1] + 58, eyeY - 82], [eyes[1] - 52, eyeY - 50]]);
		g.strokeStyle = INK;
		// Drooping grey mustache with strand lines
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
		for (const x of eyes) {
			g.lineWidth = 11;
			g.beginPath();
			g.arc(x, eyeY + 12, 34, Math.PI * 1.08, Math.PI * 1.92);
			g.stroke();
		}
		curve(6, eyes[0] - 30, eyeY - 62, eyes[0], eyeY - 74, eyes[0] + 30, eyeY - 62);
		curve(6, eyes[1] - 30, eyeY - 62, eyes[1], eyeY - 74, eyes[1] + 30, eyeY - 62);
		// Open grin with teeth
		g.fillStyle = INK;
		g.beginPath();
		g.moveTo(196, 316);
		g.quadraticCurveTo(256, 392, 316, 316);
		g.closePath();
		g.fill();
		g.fillStyle = '#ffffff';
		g.fillRect(212, 318, 88, 14);
	}
	if (face === 'calm') {
		for (const [i, x] of eyes.entries()) {
			curve(10, x - 42, eyeY, x, eyeY + 10, x + 42, eyeY);
			const out = i === 0 ? -1 : 1;
			line(7, [[x + out * 42, eyeY], [x + out * 54, eyeY + 12]]); // lash tick
			line(5, [[x + out * 20, eyeY + 6], [x + out * 26, eyeY + 18]]);
		}
		line(6, [[eyes[0] - 34, eyeY - 60], [eyes[0] + 30, eyeY - 56]]);
		line(6, [[eyes[1] + 34, eyeY - 60], [eyes[1] - 30, eyeY - 56]]);
		line(7, [[234, 336], [278, 336]]);
	}

	if (face === 'ouch') {
		// Squeezed > < eyes
		line(10, [[eyes[0] - 30, eyeY - 26], [eyes[0] + 24, eyeY], [eyes[0] - 30, eyeY + 26]]);
		line(10, [[eyes[1] + 30, eyeY - 26], [eyes[1] - 24, eyeY], [eyes[1] + 30, eyeY + 26]]);
		line(7, [[eyes[0] - 40, eyeY - 60], [eyes[0] + 26, eyeY - 44]]);
		line(7, [[eyes[1] + 40, eyeY - 60], [eyes[1] - 26, eyeY - 44]]);
		// Open, wavy yelling mouth
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
		// Spiral eyes
		for (const [i, x] of eyes.entries()) {
			g.lineWidth = 7;
			g.beginPath();
			for (let t = 0; t <= Math.PI * 5; t += 0.15) {
				const r = 4 + t * 2.4;
				const a2 = (i === 0 ? 1 : -1) * t;
				const px = x + Math.cos(a2) * r;
				const py = eyeY + Math.sin(a2) * r;
				if (t === 0) g.moveTo(px, py);
				else g.lineTo(px, py);
			}
			g.stroke();
		}
		// Wobbly mouth
		g.lineWidth = 7;
		g.beginPath();
		g.moveTo(214, 330);
		for (let x = 214; x <= 298; x += 6) g.lineTo(x, 330 + Math.sin((x - 214) / 7) * 7);
		g.stroke();
	}
	if (face === 'chewA' || face === 'chewB') {
		// Happy closed eyes
		for (const x of eyes) {
			g.lineWidth = 10;
			g.beginPath();
			g.arc(x, eyeY + 12, 30, Math.PI * 1.1, Math.PI * 1.9);
			g.stroke();
		}
		curve(6, eyes[0] - 30, eyeY - 62, eyes[0], eyeY - 74, eyes[0] + 30, eyeY - 62);
		curve(6, eyes[1] - 30, eyeY - 62, eyes[1], eyeY - 74, eyes[1] + 30, eyeY - 62);
		// Puffed cheeks
		g.strokeStyle = 'rgba(80, 45, 20, 0.45)';
		curve(6, 150, 300, 136, 330, 156, 356);
		curve(6, 362, 300, 376, 330, 356, 356);
		g.strokeStyle = INK;
		if (face === 'chewA') {
			// Closed, munching mouth
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
	if (face === 'smug') {
		// Half-lidded eyes: block eyes with the top covered by a flat lid
		for (const x of eyes) {
			g.fillStyle = INK;
			g.fillRect(x - 24, eyeY - 4, 48, 36);
			shine(x - 15, eyeY + 2, 12);
			line(9, [[x - 32, eyeY - 6], [x + 32, eyeY - 6]]);
		}
		// One raised brow, one flat
		curve(7, eyes[0] - 34, eyeY - 52, eyes[0], eyeY - 58, eyes[0] + 30, eyeY - 50);
		curve(7, eyes[1] - 30, eyeY - 74, eyes[1], eyeY - 96, eyes[1] + 34, eyeY - 80);
		// Side smirk
		curve(8, 226, 336, 270, 344, 300, 316);
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

const FACES: FaceType[] = ['smile', 'serious', 'mustache', 'grin', 'calm', 'ouch', 'dizzy', 'chewA', 'chewB', 'smug'];

export type CharacterProps = {
	shirt: string;
	img?: HTMLImageElement | null;
	headOnly?: boolean;
	skin?: string;
	pants?: string;
	face?: FaceType;
	eyeColor?: string;
	mark?: FaceMark;
	hair?: {type: HairType; color: string; accent?: string};
	hat?: {type: HatType; color: string; accent?: string};
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
	mark,
	hair,
	hat,
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
	const headMats = useMemo(() => {
		const plain = new THREE.MeshStandardMaterial({color: skin, roughness: 0.7});
		return Object.fromEntries(
			FACES.map((f) => {
				const front = new THREE.MeshStandardMaterial({map: drawFace(skin, f, eyeColor, mark), roughness: 0.7});
				return [f, [plain, plain, plain, plain, front, plain]];
			}),
		) as Record<FaceType, THREE.Material[]>;
	}, [skin, eyeColor, mark]);

	const head = (
		<group position={[0, HEAD_H / 2 + 0.02, 0]}>
			<mesh geometry={headGeo} material={headMats[p.face ?? face]} castShadow receiveShadow />
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
