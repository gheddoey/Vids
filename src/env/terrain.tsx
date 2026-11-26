import React, {useMemo} from 'react';
import * as THREE from 'three';
import {lambert} from '../ps1/ps1';
import {rnd} from './materials';

// Low-poly TERRAIN: a flat-shaded heightfield with per-face colours (grass on the flats, mud/rock on
// slopes and at the waterline), so ground has relief instead of being a single plane or box.
type V3 = [number, number, number];
export type HeightFn = (x: number, z: number) => number;
export type ColorFn = (x: number, y: number, z: number, slope: number, r: number) => string;

// Value noise (cheap, deterministic) for terrain and scatter.
export const vnoise = (seed = 1) => {
	const h = (i: number, j: number) => {
		const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
		return s - Math.floor(s);
	};
	return (x: number, z: number) => {
		const i = Math.floor(x);
		const j = Math.floor(z);
		const fx = x - i;
		const fz = z - j;
		const u = fx * fx * (3 - 2 * fx);
		const v = fz * fz * (3 - 2 * fz);
		return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
	};
};

export const Terrain: React.FC<{w: number; d: number; nx?: number; nz?: number; pos?: V3; height: HeightFn; color: ColorFn; seed?: number; shadow?: boolean}> = ({
	w,
	d,
	nx = 40,
	nz = 30,
	pos = [0, 0, 0],
	height,
	color,
	seed = 3,
	shadow = true,
}) => {
	const geo = useMemo(() => {
		const g = new THREE.PlaneGeometry(w, d, nx, nz).toNonIndexed();
		g.rotateX(-Math.PI / 2);
		const p = g.attributes.position;
		for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i) + pos[0], p.getZ(i) + pos[2]));
		g.computeVertexNormals();
		const r = rnd(seed);
		const col: number[] = [];
		const c = new THREE.Color();
		for (let i = 0; i < p.count; i += 3) {
			const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
			const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
			const z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
			const a = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
			const b = new THREE.Vector3(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1));
			const e = new THREE.Vector3(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
			const n = b.sub(a).cross(e.sub(a)).normalize();
			c.set(color(x + pos[0], y, z + pos[2], 1 - Math.abs(n.y), r()));
			for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
		}
		g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
		return g;
	}, [w, d, nx, nz, height, color, seed, pos]);
	const m = useMemo(() => lambert({vertexColors: true}), []);
	return <mesh geometry={geo} material={m} position={pos} castShadow={shadow} receiveShadow />;
};

// Distant mountain RIDGE: a jagged silhouette band, flat-shaded, coloured toward the haze with
// distance (atmospheric perspective). Stack 2-4 at increasing z for depth.
export const Ridge: React.FC<{z: number; w?: number; h?: number; base?: number; color: string; seed?: number; n?: number; x?: number}> = ({z, w = 400, h = 30, base = -2, color, seed = 1, n = 28, x = 0}) => {
	const geo = useMemo(() => {
		const nz = vnoise(seed);
		const pts: number[] = [];
		const idx: number[] = [];
		for (let i = 0; i <= n; i++) {
			const u = i / n;
			const xx = (u - 0.5) * w;
			const top = base + h * (0.35 + 0.65 * nz(u * 6, 0.5)) * (0.6 + 0.4 * nz(u * 17, 3.1));
			pts.push(xx, base - 10, 0, xx, top, -4 - nz(u * 9, 7) * 8);
		}
		for (let i = 0; i < n; i++) {
			const a = i * 2;
			idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
		g.setIndex(idx);
		const ng = g.toNonIndexed();
		ng.computeVertexNormals();
		return ng;
	}, [w, h, base, seed, n]);
	const m = useMemo(() => lambert({color, side: THREE.DoubleSide}), [color]);
	return <mesh geometry={geo} material={m} position={[x, 0, z]} />;
};
