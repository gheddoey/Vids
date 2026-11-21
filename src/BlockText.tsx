import React, {useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {Font} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {continueRender, delayRender, staticFile} from 'remotion';

// Chunky extruded 3D text with a bevel, so signs and numbers sit in the blocky world
// instead of looking like flat posters.

let cached: Font | null = null;
let pending: Promise<Font> | null = null;
const loadFont = () => {
	if (cached) return Promise.resolve(cached);
	if (!pending)
		pending = fetch(staticFile('fonts/inter_black.json'))
			.then((r) => r.json())
			.then((j) => (cached = new Font(j)));
	return pending;
};

export const useBlockFont = () => {
	const [font, setFont] = useState<Font | null>(cached);
	const [handle] = useState(() => (cached ? null : delayRender('3D font')));
	useEffect(() => {
		if (cached) return;
		loadFont().then((f) => {
			setFont(f);
			if (handle !== null) continueRender(handle);
		});
	}, [handle]);
	return font;
};

export const BlockText: React.FC<{
	text: string;
	size?: number;
	depth?: number;
	color?: string;
	side?: string;
	emissive?: number;
	align?: 'center' | 'left';
	position?: [number, number, number];
	rotation?: [number, number, number];
	scale?: number;
}> = ({text, size = 1, depth = 0.3, color = '#ffffff', side, emissive = 0, align = 'center', position, rotation, scale = 1}) => {
	const font = useBlockFont();
	const geo = useMemo(() => {
		if (!font) return null;
		const g = new TextGeometry(text, {
			font,
			size,
			depth,
			curveSegments: 3,
			bevelEnabled: true,
			bevelThickness: size * 0.05,
			bevelSize: size * 0.035,
			bevelSegments: 1,
		});
		g.computeBoundingBox();
		const b = g.boundingBox!;
		g.translate(align === 'center' ? -(b.max.x + b.min.x) / 2 : -b.min.x, -(b.max.y + b.min.y) / 2, -depth / 2);
		return g;
	}, [font, text, size, depth, align]);
	if (!geo) return null;
	const front = new THREE.MeshStandardMaterial({color, roughness: 0.45, emissive: emissive ? color : '#000000', emissiveIntensity: emissive, flatShading: true});
	const sideM = new THREE.MeshStandardMaterial({color: side ?? color, roughness: 0.5, flatShading: true});
	return <mesh geometry={geo} material={[front, sideM]} position={position} rotation={rotation} scale={scale} castShadow receiveShadow />;
};
