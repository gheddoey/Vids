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
export type FaceType = 'smile' | 'serious' | 'mustache' | 'grin' | 'calm';

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
};

// R6-style blocky body, in studs: legs 1x2x1, torso 2x2x1, arms 1x2x1, head ~1.2 cube.
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
}) => {
	const torso = useMemo(() => faceMaterials(img, TORSO, skin), [img, skin]);
	const rArm = useMemo(() => faceMaterials(img, RIGHT_ARM, skin), [img, skin]);
	const lArm = useMemo(() => faceMaterials(img, LEFT_ARM, skin), [img, skin]);
	const headGeo = useMemo(() => new RoundedBoxGeometry(1.2, HEAD_H, 1.2, 1, 0.04), []);
	const headMats = useMemo(() => {
		const plain = new THREE.MeshStandardMaterial({color: skin, roughness: 0.7});
		const front = new THREE.MeshStandardMaterial({map: drawFace(skin, face, eyeColor, mark), roughness: 0.7});
		return [plain, plain, plain, plain, front, plain];
	}, [skin, face, eyeColor, mark]);

	return (
		<group position={position} rotation={[0, rotY, 0]}>
			{headOnly ? null : (
			<>
			{/* Legs */}
			{[-0.5, 0.5].map((x) => (
				<mesh key={x} position={[x, 1, 0]} castShadow receiveShadow>
					<boxGeometry args={[0.99, 2, 1]} />
					<meshStandardMaterial color={pants} roughness={0.85} />
				</mesh>
			))}
			{/* Torso */}
			<mesh position={[0, 3, 0]} material={torso} castShadow receiveShadow>
				<boxGeometry args={[2, 2, 1]} />
			</mesh>
			{/* Arms (character's right arm is on -x) */}
			<mesh position={[-1.5, 3, 0]} material={rArm} castShadow receiveShadow>
				<boxGeometry args={[0.99, 2, 1]} />
			</mesh>
			<mesh position={[1.5, 3, 0]} material={lArm} castShadow receiveShadow>
				<boxGeometry args={[0.99, 2, 1]} />
			</mesh>
			</>
			)}
			{/* Head, hair and head object */}
			<group position={[0, 4 + HEAD_H / 2 + 0.02, 0]}>
				<mesh geometry={headGeo} material={headMats} castShadow receiveShadow />
				{/* Hair and hats are modelled for a 1.2-tall head; lift them to the taller head's top */}
				<group position={[0, HEAD_H / 2 - 0.6, 0]}>
					{hair ? <Hair {...hair} /> : null}
					{hat ? <Hat {...hat} /> : null}
				</group>
			</group>
		</group>
	);
};
