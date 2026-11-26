import React, {forwardRef, useMemo} from 'react';
import * as THREE from 'three';
import {BlendFunction, Effect, ToneMappingMode} from 'postprocessing';
import {Bloom, EffectComposer, ToneMapping} from '@react-three/postprocessing';
import {Redraw} from '../fx';

// Cinematic look ("GTA-like"): a strong warm key with deep shadows, teal shadows and orange
// highlights, an S-curve, a little extra saturation, glowing lights (bloom), haze, vignette and
// fine film grain. Put <CineGrade preset=".." /> as the LAST child of every ThreeCanvas.

export type CinePreset = 'golden' | 'night' | 'interior' | 'noon' | 'arena';

const P: Record<CinePreset, {split: number; contrast: number; sat: number; warm: number; vig: number; bloom: number; thresh: number; lift: number}> = {
	golden: {split: 1.2, contrast: 0.6, sat: 1.32, warm: 0.045, vig: 0.3, bloom: 0.9, thresh: 0.75, lift: 0.012},
	noon: {split: 0.8, contrast: 0.55, sat: 1.28, warm: 0.02, vig: 0.26, bloom: 0.6, thresh: 0.85, lift: 0.01},
	night: {split: 1.3, contrast: 0.5, sat: 1.25, warm: -0.01, vig: 0.36, bloom: 1.4, thresh: 0.6, lift: 0.03},
	interior: {split: 1.0, contrast: 0.55, sat: 1.25, warm: 0.035, vig: 0.32, bloom: 1.0, thresh: 0.7, lift: 0.02},
	arena: {split: 1.0, contrast: 0.6, sat: 1.3, warm: 0.02, vig: 0.32, bloom: 1.2, thresh: 0.7, lift: 0.02},
};

const frag = /* glsl */ `
uniform float split;
uniform float contrast;
uniform float sat;
uniform float warm;
uniform float vig;
uniform float lift;
uniform float seed;
uniform float expo;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	vec3 g = pow(max(inputColor.rgb * expo, 0.0), vec3(1.0 / 2.2));
	float l = dot(g, vec3(0.299, 0.587, 0.114));
	// teal shadows / orange highlights
	vec3 shadowTint = vec3(-0.035, 0.012, 0.05);
	vec3 highTint = vec3(0.06, 0.018, -0.045);
	g += split * mix(shadowTint * (1.0 - l), highTint * l, smoothstep(0.25, 0.75, l));
	g += vec3(warm, warm * 0.4, -warm);
	// lifted blacks (film), then S-curve contrast
	g = lift + g * (1.0 - lift);
	vec3 s = g * g * (3.0 - 2.0 * g);
	g = mix(g, s, contrast);
	// saturation
	float l2 = dot(g, vec3(0.299, 0.587, 0.114));
	g = mix(vec3(l2), g, sat);
	// vignette (oval, for 9:16)
	vec2 v = (uv - 0.5) * vec2(1.0, 0.78);
	g *= 1.0 - vig * smoothstep(0.2, 0.72, length(v));
	// fine grain
	g += (hash(uv * 1000.0) - 0.5) * 0.025;
	outputColor = vec4(pow(clamp(g, 0.0, 1.0), vec3(2.2)), inputColor.a);
}
`;

class GradeEffect extends Effect {
	constructor() {
		super('CineGrade', frag, {
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map<string, THREE.Uniform>([
				['split', new THREE.Uniform(1)],
				['contrast', new THREE.Uniform(0.5)],
				['sat', new THREE.Uniform(1.15)],
				['warm', new THREE.Uniform(0.03)],
				['vig', new THREE.Uniform(0.4)],
				['lift', new THREE.Uniform(0.02)],
				['seed', new THREE.Uniform(0)],
				['expo', new THREE.Uniform(1.25)],
			]),
		});
	}
}

const Grade = forwardRef<GradeEffect, {preset: CinePreset; seed: number}>(({preset, seed}, ref) => {
	const e = useMemo(() => new GradeEffect(), []);
	const p = P[preset];
	for (const k of ['split', 'contrast', 'sat', 'warm', 'vig', 'lift'] as const) e.uniforms.get(k)!.value = p[k];
	e.uniforms.get('seed')!.value = seed;
	return <primitive ref={ref} object={e} dispose={null} />;
});
Grade.displayName = 'Grade';

// Bloom (HDR) -> ACES tone mapping -> grade. Includes the Redraw fix for Remotion renders.
export const CineGrade: React.FC<{preset?: CinePreset; frame?: number}> = ({preset = 'golden', frame = 0}) => {
	const p = P[preset];
	return (
		<>
			<EffectComposer multisampling={4}>
				<Bloom intensity={p.bloom} luminanceThreshold={p.thresh} luminanceSmoothing={0.2} mipmapBlur />
				<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
				<Grade preset={preset} seed={(frame % 97) * 0.37} />
			</EffectComposer>
			<Redraw />
		</>
	);
};

// Glowing sun / moon disc that blooms (place it far behind the set, toward the key light).
export const SunDisc: React.FC<{pos: [number, number, number]; color?: string; r?: number; i?: number}> = ({pos, color = '#ffd8a0', r = 4, i = 6}) => (
	<mesh position={pos}>
		<sphereGeometry args={[r, 10, 8]} />
		<meshBasicMaterial color={new THREE.Color(color).multiplyScalar(i)} toneMapped={false} fog={false} />
	</mesh>
);
