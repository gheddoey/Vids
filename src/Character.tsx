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

const drawFace = (skin: string, face: FaceType, eyeColor = '#8e2f8a') => {
	const c = document.createElement('canvas');
	c.width = c.height = 512;
	const g = c.getContext('2d')!;
	g.fillStyle = skin;
	g.fillRect(0, 0, 512, 512);
	g.strokeStyle = INK;
	g.fillStyle = INK;
	g.lineCap = 'round';
	g.lineJoin = 'round';
	const eyeY = 232;
	const eyes = [256 - 78, 256 + 78];
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

	if (face === 'smile' || face === 'serious') {
		// Small square-ish dots
		for (const x of eyes) g.fillRect(x - 11, eyeY - 13, 22, 26);
	}
	if (face === 'serious') {
		line(8, [[eyes[0] - 30, eyeY - 52], [eyes[0] + 22, eyeY - 38]]);
		line(8, [[eyes[1] + 30, eyeY - 52], [eyes[1] - 22, eyeY - 38]]);
		line(7, [[228, 326], [284, 326]]);
	}
	if (face === 'smile') {
		curve(7, 220, 314, 256, 342, 292, 314);
	}
	if (face === 'mustache') {
		for (const [i, x] of eyes.entries()) {
			const inner = i === 0 ? 1 : -1; // iris sits toward the nose
			g.fillStyle = '#f4f1ea';
			g.fillRect(x - 44, eyeY - 24, 88, 52);
			g.fillStyle = eyeColor;
			g.fillRect(x + inner * 14 - 15, eyeY - 18, 30, 40);
			g.fillStyle = INK;
			g.fillRect(x + inner * 14 - 6, eyeY - 8, 12, 18);
			g.lineWidth = 5;
			g.strokeRect(x - 44, eyeY - 24, 88, 52);
			line(11, [[x - 46, eyeY - 24], [x + 46, eyeY - 24]]); // heavy upper lid
		}
		// Thick brows angled down toward the nose
		g.strokeStyle = '#3a3a3a';
		line(15, [[eyes[0] - 48, eyeY - 70], [eyes[0] + 44, eyeY - 42]]);
		line(15, [[eyes[1] + 48, eyeY - 70], [eyes[1] - 44, eyeY - 42]]);
		g.strokeStyle = INK;
		// Drooping grey mustache
		g.fillStyle = '#8f8f8f';
		g.beginPath();
		g.moveTo(256, 292);
		g.quadraticCurveTo(300, 280, 326, 318);
		g.quadraticCurveTo(296, 306, 256, 312);
		g.quadraticCurveTo(216, 306, 186, 318);
		g.quadraticCurveTo(212, 280, 256, 292);
		g.fill();
		curve(6, 236, 346, 256, 338, 276, 346);
	}
	if (face === 'grin') {
		for (const x of eyes) {
			g.lineWidth = 8;
			g.beginPath();
			g.arc(x, eyeY + 8, 22, Math.PI * 1.1, Math.PI * 1.9);
			g.stroke();
		}
		curve(7, 206, 306, 256, 352, 306, 306);
	}
	if (face === 'calm') {
		for (const [i, x] of eyes.entries()) {
			curve(7, x - 28, eyeY, x, eyeY + 6, x + 28, eyeY);
			const out = i === 0 ? -1 : 1;
			line(5, [[x + out * 28, eyeY], [x + out * 36, eyeY + 8]]); // lash tick
		}
		line(6, [[238, 326], [274, 326]]);
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
	hair,
	hat,
	position = [0, 0, 0],
	rotY = 0,
}) => {
	const torso = useMemo(() => faceMaterials(img, TORSO, skin), [img, skin]);
	const rArm = useMemo(() => faceMaterials(img, RIGHT_ARM, skin), [img, skin]);
	const lArm = useMemo(() => faceMaterials(img, LEFT_ARM, skin), [img, skin]);
	const headGeo = useMemo(() => new RoundedBoxGeometry(1.2, 1.2, 1.2, 1, 0.04), []);
	const headMats = useMemo(() => {
		const plain = new THREE.MeshStandardMaterial({color: skin, roughness: 0.7});
		const front = new THREE.MeshStandardMaterial({map: drawFace(skin, face, eyeColor), roughness: 0.7});
		return [plain, plain, plain, plain, front, plain];
	}, [skin, face, eyeColor]);

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
			<group position={[0, 4.62, 0]}>
				<mesh geometry={headGeo} material={headMats} castShadow receiveShadow />
				{hair ? <Hair {...hair} /> : null}
				{hat ? <Hat {...hat} /> : null}
			</group>
		</group>
	);
};
