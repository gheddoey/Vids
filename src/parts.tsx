import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

type V3 = [number, number, number];

// Rounded box: the basic building block for hair chunks and hat parts.
export const RBox: React.FC<{
	size: V3;
	pos?: V3;
	rot?: V3;
	color: string;
	r?: number;
	rough?: number;
	emissive?: string;
}> = ({size, pos = [0, 0, 0], rot = [0, 0, 0], color, r = 0.06, rough = 0.75, emissive}) => {
	const geo = useMemo(() => {
		// Hard-edged look: only a hairline bevel so edges catch a little light.
		const radius = Math.min(r * 0.15, 0.012, Math.min(...size) / 2 - 0.002);
		return new RoundedBoxGeometry(size[0], size[1], size[2], 1, radius);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [size.join(','), r]);
	return (
		<mesh position={pos} rotation={rot} geometry={geo} castShadow receiveShadow>
			<meshStandardMaterial color={color} roughness={rough} emissive={emissive ?? '#000000'} flatShading />
		</mesh>
	);
};

// Small seeded random so "messy" styles look the same on every frame.
export const seeded = (seed: number) => () => {
	seed = (seed * 16807) % 2147483647;
	return (seed - 1) / 2147483646;
};

export const shade = (hex: string, amt: number) => {
	const c = new THREE.Color(hex);
	const hsl = {h: 0, s: 0, l: 0};
	c.getHSL(hsl);
	c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt)));
	return '#' + c.getHexString();
};
