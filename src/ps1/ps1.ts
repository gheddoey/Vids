import {useLayoutEffect} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';

// The six-rule retro look, as code:
// 1 low poly + flat shading     -> plain boxes (12 tris each), flatShading forced on every material
// 2 64-px textures by code      -> tex64() canvases, nearest filtering, no mipmaps
// 3 render at 270x480           -> the composition IS 270x480, no antialias, upscaled 4x with
//                                  nearest-neighbour by ffmpeg (no smoothing anywhere)
// 4 snap vertices + dither      -> vertex shader snaps clip-space xy to a pixel grid;
//                                  fragment shader quantises colour with a 4x4 Bayer matrix
export const RES = {w: 270, h: 480};

// Shared uniforms so a shot can exaggerate the effect (e.g. coarse snapping to show it off).
export const U = {
	snap: {value: new THREE.Vector2(RES.w / 2, RES.h / 2)},
	levels: {value: 15},
};

const FRAG_HEAD = /* glsl */ `
uniform float uLevels;
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
		sh.vertexShader = sh.vertexShader.replace('void main() {', 'uniform vec2 uSnap;\nvoid main() {').replace(
			'#include <project_vertex>',
			`#include <project_vertex>
			gl_Position.xy = floor(gl_Position.xy / gl_Position.w * uSnap + 0.5) / uSnap * gl_Position.w;`,
		);
		if (sh.fragmentShader.includes('#include <dithering_fragment>')) {
			sh.fragmentShader = sh.fragmentShader
				.replace('void main() {', FRAG_HEAD + 'void main() {')
				.replace('#include <dithering_fragment>', 'gl_FragColor.rgb = floor(gl_FragColor.rgb * uLevels + ps1Bayer(gl_FragCoord.xy)) / uLevels;');
		}
	};
	m.customProgramCacheKey = () => 'ps1';
	m.needsUpdate = true;
};

// Put inside each ThreeCanvas: patches every material in the scene before the frame renders.
export const PS1Pass: React.FC<{snap?: number; levels?: number; pixel?: number}> = ({snap = 1, levels = 15, pixel = 1}) => {
	const scene = useThree((s) => s.scene);
	const gl = useThree((s) => s.gl);
	// Draw fewer pixels than the frame (the canvas CSS has image-rendering: pixelated).
	if (gl.getPixelRatio() !== 1 / pixel) gl.setPixelRatio(1 / pixel);
	U.snap.value.set(RES.w / 2 / snap, RES.h / 2 / snap);
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
