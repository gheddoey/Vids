import * as THREE from 'three';
import {lambert, px, tex64} from '../ps1/ps1';

// Shared environment MATERIAL library (six rules: every texture is 64 px or smaller, painted by code,
// nearest-filtered). Each painter adds wear: grain, stains, chips, dirt at the bottom, colour
// variation per board/brick/tile, so no two surfaces read the same.
//   mat('planks', {base:'#8a5a36'}, 4, 2)  -> cached MeshLambertMaterial with that texture repeated.

export const rnd = (seed: number) => {
	let s = seed % 2147483647 || 1;
	return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
};
const C = (hex: string) => new THREE.Color(hex);
// Shift a colour lighter (k>0) or darker (k<0); `hue` nudges toward warm (+) or cool (-).
export const tint = (hex: string, k: number, hue = 0) => {
	const c = C(hex);
	if (k < 0) c.lerp(C('#000000'), -k);
	else c.lerp(C('#ffffff'), k);
	if (hue) c.lerp(C(hue > 0 ? '#ff8a3a' : '#3a6aff'), Math.abs(hue));
	return '#' + c.getHexString();
};
type G = CanvasRenderingContext2D;
const noise = (g: G, w: number, h: number, base: string, n: number, amt: number, seed: number) => {
	const r = rnd(seed);
	for (let i = 0; i < n; i++) px(g, tint(base, (r() - 0.5) * amt * 2), Math.floor(r() * w), Math.floor(r() * h), r() < 0.3 ? 2 : 1, 1);
};
// Grime: darker blotches + a dirty band at the bottom (where walls meet floors).
const grime = (g: G, w: number, h: number, base: string, seed: number, band = 0.18) => {
	const r = rnd(seed + 99);
	for (let i = 0; i < 6; i++) {
		const x = Math.floor(r() * w);
		const y = Math.floor(r() * h);
		for (let k = 0; k < 14; k++) px(g, tint(base, -0.12 - r() * 0.1), x + Math.floor((r() - 0.5) * 8), y + Math.floor((r() - 0.5) * 8), 2, 2);
	}
	for (let y = Math.floor(h * (1 - band)); y < h; y++) for (let x = 0; x < w; x++) if (r() < (y / h - (1 - band)) / band) px(g, tint(base, -0.25 - r() * 0.1), x, y);
};

export type Opts = {base?: string; alt?: string; seed?: number; wear?: number};
const P: Record<string, (g: G, o: Required<Opts>) => void> = {
	// wood planks: per-board tone, grain lines, knots, nail heads, dark gaps
	planks: (g, {base, seed, wear}) => {
		const r = rnd(seed);
		for (let i = 0; i < 4; i++) {
			const b = tint(base, (r() - 0.5) * 0.22, (r() - 0.5) * 0.08);
			px(g, b, 0, i * 16, 64, 16);
			for (let k = 0; k < 7; k++) px(g, tint(b, -0.12), Math.floor(r() * 30), i * 16 + 2 + Math.floor(r() * 12), 10 + Math.floor(r() * 30), 1);
			for (let k = 0; k < 3; k++) px(g, tint(b, 0.1), Math.floor(r() * 40), i * 16 + 2 + Math.floor(r() * 12), 8 + Math.floor(r() * 16), 1);
			if (r() < 0.7) px(g, tint(b, -0.35), Math.floor(r() * 58), i * 16 + 6, 3, 2);
			px(g, tint(base, -0.55), 0, i * 16 + 15, 64, 1);
			const joint = Math.floor(r() * 60);
			px(g, tint(base, -0.5), joint, i * 16, 1, 15);
			px(g, '#2a2420', joint + 2, i * 16 + 3, 1, 1);
			px(g, '#2a2420', joint + 2, i * 16 + 11, 1, 1);
		}
		if (wear) noise(g, 64, 64, tint(base, -0.1), 120 * wear, 0.2, seed);
	},
	// vertical weathered boards (shacks, fences): grey-silvered tops, darker bottoms
	boards: (g, {base, seed, wear}) => {
		const r = rnd(seed);
		for (let i = 0; i < 8; i++) {
			const b = tint(base, (r() - 0.5) * 0.3, (r() - 0.4) * 0.1);
			px(g, b, i * 8, 0, 8, 64);
			for (let k = 0; k < 5; k++) px(g, tint(b, -0.14), i * 8 + 1 + Math.floor(r() * 6), Math.floor(r() * 50), 1, 6 + Math.floor(r() * 14));
			px(g, tint(base, -0.55), i * 8 + 7, 0, 1, 64);
			px(g, '#3a3430', i * 8 + 3, 8, 1, 1);
			px(g, '#3a3430', i * 8 + 3, 54, 1, 1);
		}
		grime(g, 64, 64, base, seed, 0.25 * (wear + 0.5));
	},
	bark: (g, {base, seed}) => {
		px(g, base, 0, 0, 64, 64);
		const r = rnd(seed);
		for (let x = 0; x < 64; x += 3 + Math.floor(r() * 3)) px(g, tint(base, -0.3), x, 0, 1, 64);
		for (let i = 0; i < 40; i++) px(g, tint(base, 0.15), Math.floor(r() * 64), Math.floor(r() * 64), 2, 3 + Math.floor(r() * 6));
		for (let i = 0; i < 25; i++) px(g, '#5a7a3a', Math.floor(r() * 64), Math.floor(r() * 64), 2, 2); // moss
	},
	// guadua bamboo: green-yellow with darker nodes and dry streaks
	bamboo: (g, {base, seed}) => {
		px(g, base, 0, 0, 32, 64);
		const r = rnd(seed);
		for (let i = 0; i < 16; i++) px(g, tint(base, 0.18), Math.floor(r() * 32), Math.floor(r() * 64), 1, 6 + Math.floor(r() * 10));
		for (let y = 0; y < 64; y += 21) (px(g, tint(base, -0.4), 0, y, 32, 2), px(g, '#e8e0b0', 0, y + 2, 32, 1));
	},
	// bricks with per-brick variation, chipped corners, mortar, a few replaced bricks
	brick: (g, {base, alt, seed, wear}) => {
		px(g, alt, 0, 0, 64, 64);
		const r = rnd(seed);
		for (let y = 0; y < 64; y += 8)
			for (let x = (y / 8) % 2 ? -8 : 0; x < 64; x += 16) {
				const b = r() < 0.08 ? tint(base, 0.25, 0.1) : tint(base, (r() - 0.5) * 0.3, (r() - 0.5) * 0.1);
				px(g, b, x + 1, y + 1, 14, 6);
				px(g, tint(b, 0.12), x + 1, y + 1, 14, 1);
				if (r() < 0.3) px(g, alt, x + 1 + (r() < 0.5 ? 0 : 13), y + 1, 1, 1);
			}
		if (wear) grime(g, 64, 64, base, seed, 0.2 * wear);
	},
	// stone / cobbles: irregular rounded stones in a dark matrix
	stone: (g, {base, alt, seed}) => {
		px(g, alt, 0, 0, 64, 64);
		const r = rnd(seed);
		for (let y = 0; y < 64; y += 10)
			for (let x = (y / 10) % 2 ? -6 : 0; x < 64; x += 12) {
				const b = tint(base, (r() - 0.5) * 0.3);
				const w = 9 + Math.floor(r() * 3);
				px(g, b, x + 1, y + 2, w, 7);
				px(g, b, x + 2, y + 1, w - 2, 9);
				px(g, tint(b, 0.15), x + 2, y + 2, w - 3, 1);
			}
	},
	// concrete: mottled, form-board lines, cracks, water stains running down
	concrete: (g, {base, seed, wear}) => {
		px(g, base, 0, 0, 64, 64);
		noise(g, 64, 64, base, 500, 0.08, seed);
		const r = rnd(seed);
		for (let y = 16; y < 64; y += 16) px(g, tint(base, -0.08), 0, y, 64, 1);
		for (let i = 0; i < 3 * wear; i++) {
			let x = Math.floor(r() * 64);
			for (let y = Math.floor(r() * 30); y < 64; y++) (px(g, tint(base, -0.12), x, y, 2, 1), r() < 0.2 && (x += r() < 0.5 ? -1 : 1));
		}
		let cx = Math.floor(r() * 64);
		for (let y = 0; y < 30; y++) (px(g, tint(base, -0.4), cx, 10 + y), r() < 0.4 && (cx += r() < 0.5 ? -1 : 1));
	},
	plaster: (g, {base, alt, seed, wear}) => {
		px(g, base, 0, 0, 64, 64);
		noise(g, 64, 64, base, 260, 0.06, seed);
		const r = rnd(seed);
		// chipped patches showing the brick underneath
		for (let i = 0; i < 2 * wear; i++) {
			const x = Math.floor(r() * 54);
			const y = Math.floor(r() * 50);
			px(g, tint(base, -0.2), x - 1, y - 1, 10, 7);
			px(g, alt, x, y, 8, 5);
			px(g, tint(alt, -0.3), x, y + 2, 8, 1);
		}
		grime(g, 64, 64, base, seed, 0.22 * wear);
	},
	// corrugated tin, rusting in streaks
	tin: (g, {base, seed, wear}) => {
		px(g, base, 0, 0, 64, 64);
		for (let x = 0; x < 64; x += 4) (px(g, tint(base, -0.25), x, 0, 1, 64), px(g, tint(base, 0.2), x + 2, 0, 1, 64));
		const r = rnd(seed);
		for (let i = 0; i < 10 * wear; i++) {
			const x = Math.floor(r() * 64);
			const y = Math.floor(r() * 40);
			px(g, r() < 0.5 ? '#8a4a24' : '#a8602a', x, y, 2, 6 + Math.floor(r() * 18));
		}
		px(g, '#6a3a1a', 0, 62, 64, 2);
	},
	// clay roof tiles (barrel rows)
	rooftile: (g, {base, seed}) => {
		const r = rnd(seed);
		for (let y = 0; y < 64; y += 8)
			for (let x = 0; x < 64; x += 8) {
				const b = tint(base, (r() - 0.5) * 0.25, (r() - 0.5) * 0.1);
				px(g, b, x, y, 8, 8);
				px(g, tint(b, 0.18), x + 2, y, 3, 7);
				px(g, tint(b, -0.35), x, y + 7, 8, 1);
				if (r() < 0.12) px(g, '#4a5a2a', x + 1, y + 5, 3, 2); // moss
			}
	},
	thatch: (g, {base, seed}) => {
		px(g, base, 0, 0, 64, 64);
		const r = rnd(seed);
		for (let i = 0; i < 260; i++) px(g, tint(base, (r() - 0.5) * 0.5), Math.floor(r() * 64), Math.floor(r() * 64), 1, 3 + Math.floor(r() * 5));
		for (let y = 0; y < 64; y += 12) px(g, tint(base, -0.35), 0, y + 11, 64, 1);
	},
	fabric: (g, {base, alt, seed}) => {
		px(g, base, 0, 0, 32, 32);
		for (let y = 0; y < 32; y += 2) for (let x = (y / 2) % 2; x < 32; x += 2) px(g, tint(base, -0.06), x, y);
		const r = rnd(seed);
		for (let i = 0; i < 6; i++) px(g, alt, 0, Math.floor(r() * 32), 32, 1);
	},
	grass: (g, {base, seed}) => {
		px(g, base, 0, 0, 64, 64);
		const r = rnd(seed);
		for (let i = 0; i < 520; i++) px(g, tint(base, (r() - 0.5) * 0.36, (r() - 0.5) * 0.12), Math.floor(r() * 64), Math.floor(r() * 64), 1, 2);
		for (let i = 0; i < 14; i++) px(g, '#8a7a4a', Math.floor(r() * 64), Math.floor(r() * 64), 2, 2); // bare dirt
	},
	mud: (g, {base, seed}) => {
		px(g, base, 0, 0, 64, 64);
		noise(g, 64, 64, base, 600, 0.16, seed);
		const r = rnd(seed);
		for (let i = 0; i < 10; i++) px(g, tint(base, 0.2), Math.floor(r() * 60), Math.floor(r() * 60), 4, 1); // wet sheen
		for (let i = 0; i < 18; i++) px(g, '#8a8070', Math.floor(r() * 62), Math.floor(r() * 62), 2, 2); // pebbles
	},
	dirt: (g, {base, seed}) => {
		px(g, base, 0, 0, 64, 64);
		noise(g, 64, 64, base, 700, 0.14, seed);
		const r = rnd(seed);
		for (let i = 0; i < 4; i++) px(g, tint(base, -0.12), 0, Math.floor(r() * 64), 64, 2); // tyre ruts
	},
	asphalt: (g, {base, seed, wear}) => {
		px(g, base, 0, 0, 64, 64);
		noise(g, 64, 64, base, 800, 0.12, seed);
		const r = rnd(seed);
		for (let i = 0; i < 3 * wear; i++) {
			const x = Math.floor(r() * 50);
			const y = Math.floor(r() * 50);
			px(g, tint(base, -0.2), x, y, 10 + Math.floor(r() * 8), 6);
		}
	},
	tiles: (g, {base, alt, seed}) => {
		const r = rnd(seed);
		for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) px(g, ((x + y) / 16) % 2 ? tint(base, (r() - 0.5) * 0.1) : tint(alt, (r() - 0.5) * 0.1), x, y, 16, 16);
		for (let i = 0; i < 64; i += 16) (px(g, '#00000030', i, 0, 1, 64), px(g, '#00000030', 0, i, 64, 1));
		noise(g, 64, 64, base, 120, 0.1, seed);
	},
	leaves: (g, {base, seed}) => {
		px(g, base, 0, 0, 32, 32);
		const r = rnd(seed);
		for (let i = 0; i < 160; i++) px(g, tint(base, (r() - 0.45) * 0.5, (r() - 0.5) * 0.15), Math.floor(r() * 32), Math.floor(r() * 32), 2, 1);
	},
	water: (g, {base, alt, seed}) => {
		px(g, base, 0, 0, 64, 64);
		const r = rnd(seed);
		for (let i = 0; i < 110; i++) px(g, tint(base, (r() - 0.4) * 0.25), Math.floor(r() * 64), Math.floor(r() * 64), 4 + Math.floor(r() * 10), 1);
		for (let i = 0; i < 26; i++) px(g, alt, Math.floor(r() * 64), Math.floor(r() * 64), 2 + Math.floor(r() * 3), 1);
	},
};

const cache = new Map<string, THREE.MeshLambertMaterial>();
// Cached material: same painter + options + repeat = same material object (cheap to reuse everywhere).
export const mat = (kind: keyof typeof P | string, o: Opts = {}, rx = 1, ry = 1, extra: THREE.MeshLambertMaterialParameters = {}) => {
	const key = `${kind}|${o.base}|${o.alt}|${o.seed}|${o.wear}|${rx}|${ry}|${JSON.stringify(extra)}`;
	let m = cache.get(key);
	if (!m) {
		const small = kind === 'fabric' || kind === 'leaves' || kind === 'bamboo';
		const full: Required<Opts> = {base: o.base ?? '#8a7a6a', alt: o.alt ?? '#c8b8a0', seed: o.seed ?? 7, wear: o.wear ?? 1};
		const t = tex64((g) => P[kind](g, full), small ? 32 : 64, small && kind !== 'bamboo' ? 32 : 64);
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set(rx, ry);
		m = lambert({map: t, ...extra});
		cache.set(key, m);
	}
	return m;
};
// Flat-colour material, cached (for small parts).
export const flat = (color: string, extra: THREE.MeshLambertMaterialParameters = {}) => {
	const key = `flat|${color}|${JSON.stringify(extra)}`;
	let m = cache.get(key);
	if (!m) cache.set(key, (m = lambert({color, ...extra})));
	return m;
};
// Emissive, tone-map-free glow (window light, bulbs, embers) that blooms through CineGrade.
const glowCache = new Map<string, THREE.MeshBasicMaterial>();
export const glow = (color: string, k = 2.5) => {
	const key = `${color}|${k}`;
	let m = glowCache.get(key);
	if (!m) glowCache.set(key, (m = new THREE.MeshBasicMaterial({color: C(color).multiplyScalar(k), toneMapped: false})));
	return m;
};
