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

export type FaceType = 'smile' | 'serious' | 'mustache' | 'grin';

const drawFace = (skin: string, face: FaceType) => {
	const c = document.createElement('canvas');
	c.width = c.height = 256;
	const g = c.getContext('2d')!;
	g.fillStyle = skin;
	g.fillRect(0, 0, 256, 256);
	g.fillStyle = '#1c1c1c';
	// Eyes: simple dark blocks, like the classic faces
	g.fillRect(78, 96, 16, 26);
	g.fillRect(162, 96, 16, 26);
	g.strokeStyle = '#1c1c1c';
	g.lineWidth = 7;
	g.lineCap = 'round';
	g.beginPath();
	if (face === 'smile') {
		g.moveTo(96, 160);
		g.quadraticCurveTo(128, 182, 160, 160);
	} else if (face === 'grin') {
		g.moveTo(88, 154);
		g.quadraticCurveTo(128, 196, 168, 154);
		g.closePath();
		g.fillStyle = '#ffffff';
		g.fill();
	} else {
		g.moveTo(102, 170);
		g.lineTo(154, 170);
	}
	g.stroke();
	if (face === 'serious' || face === 'mustache') {
		g.lineWidth = 6;
		g.beginPath();
		g.moveTo(70, 82);
		g.lineTo(100, 90);
		g.moveTo(186, 82);
		g.lineTo(156, 90);
		g.stroke();
	}
	if (face === 'mustache') {
		g.fillStyle = '#8b8b8b';
		g.beginPath();
		g.moveTo(90, 160);
		g.quadraticCurveTo(128, 138, 166, 160);
		g.quadraticCurveTo(128, 152, 90, 160);
		g.fill();
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
		const front = new THREE.MeshStandardMaterial({map: drawFace(skin, face), roughness: 0.7});
		return [plain, plain, plain, plain, front, plain];
	}, [skin, face]);

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
