import {useLayoutEffect} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';

// The six-rule retro look, as code:
// 1 low poly + flat shading     -> plain boxes (12 tris each), flatShading forced on every material
// 2 64-px textures by code      -> tex64() canvases, nearest filtering, no mipmaps
// 3 HD, but never smooth a pixel -> renders a clean 1080x1920 frame; the retro grain comes from
//                                  the chunky textures, the snap grid and the dither, not low res
// 4 snap vertices + dither      -> vertex shader snaps clip-space xy to a virtual 360x640 grid
//                                  (PS1 wobble); fragment shader quantises colour with a 4x4 Bayer
//                                  matrix in 3x3-px cells, so the pattern reads at HD
export const RES = {w: 1080, h: 1920};
export const GRID = {w: 360, h: 640};

// Shared uniforms so a shot can exaggerate the effect (e.g. coarse snapping to show it off).
export const U = {
	snap: {value: new THREE.Vector2(GRID.w / 2, GRID.h / 2)},
	levels: {value: 16},
	cell: {value: RES.w / GRID.w},
};

const FRAG_HEAD = /* glsl */ `
uniform float uLevels;
uniform float uCell;
float ps1Bayer(vec2 p) {
	int x = int(mod(p.x, 4.0));
	int y = int(mod(p.y, 4.0));
	float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
	return (m[x + y * 4] + 0.5) / 16.0;
}
`;

const patched = new WeakSet<THREE.Material>();
const TEX_KEYS = ['map', 'emissiveMap', 'alphaMap'] as const;

export const nearest = (t: THREE.Texture) => {
	t.magFilter = THREE.NearestFilter;
	t.minFilter = THREE.NearestFilter;
	t.generateMipmaps = false;
	t.anisotropy = 1;
	return t;
};

export const ps1Patch = (m: THREE.Material) => {
	if (patched.has(m)) return;
	patched.add(m);
	const mm = m as THREE.Material & Record<string, unknown>;
	if (!(m instanceof THREE.MeshBasicMaterial) && 'flatShading' in mm) mm.flatShading = true;
	for (const k of TEX_KEYS) {
		const t = mm[k];
		if (t instanceof THREE.Texture) {
			nearest(t);
			t.needsUpdate = true;
		}
	}
	m.onBeforeCompile = (sh) => {
		sh.uniforms.uSnap = U.snap;
		sh.uniforms.uLevels = U.levels;
		sh.uniforms.uCell = U.cell;
		sh.vertexShader = sh.vertexShader.replace('void main() {', 'uniform vec2 uSnap;\nvoid main() {').replace(
			'#include <project_vertex>',
			`#include <project_vertex>
			gl_Position.xy = floor(gl_Position.xy / gl_Position.w * uSnap + 0.5) / uSnap * gl_Position.w;`,
		);
		if (sh.fragmentShader.includes('#include <dithering_fragment>')) {
			sh.fragmentShader = sh.fragmentShader
				.replace('void main() {', FRAG_HEAD + 'void main() {')
				.replace('#include <dithering_fragment>', 'gl_FragColor.rgb = floor(gl_FragColor.rgb * uLevels + ps1Bayer(floor(gl_FragCoord.xy / uCell))) / uLevels;');
		}
	};
	m.customProgramCacheKey = () => 'ps1';
	m.needsUpdate = true;
};

// Put inside each ThreeCanvas: patches every material in the scene before the frame renders.
export const PS1Pass: React.FC<{snap?: number; levels?: number}> = ({snap = 1, levels = 16}) => {
	const scene = useThree((s) => s.scene);
	U.snap.value.set(GRID.w / 2 / snap, GRID.h / 2 / snap);
	U.levels.value = levels;
	useLayoutEffect(() => {
		scene.traverse((o) => {
			const m = (o as THREE.Mesh).material;
			if (m) (Array.isArray(m) ? m : [m]).forEach(ps1Patch);
		});
	});
	return null;
};

// A 64-px (or smaller) texture painted by code.
export const tex64 = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 64, h = 64) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const g = c.getContext('2d')!;
	g.imageSmoothingEnabled = false;
	draw(g, w, h);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	return nearest(t);
};

// Pixel helpers for painting.
export const px = (g: CanvasRenderingContext2D, c: string, x: number, y: number, w = 1, h = 1) => {
	g.fillStyle = c;
	g.fillRect(x, y, w, h);
};

// Seeded noise speckle, so code-painted surfaces have grain.
export const speckle = (g: CanvasRenderingContext2D, w: number, h: number, cols: string[], n: number, seed = 3) => {
	let s = seed;
	const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
	for (let i = 0; i < n; i++) px(g, cols[Math.floor(r() * cols.length)], Math.floor(r() * w), Math.floor(r() * h));
};

export const lambert = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial({flatShading: true, ...o});
