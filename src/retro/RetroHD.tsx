import React, {forwardRef, useMemo} from 'react';
import * as THREE from 'three';
import {BlendFunction, Effect, EffectAttribute} from 'postprocessing';

// RetroHD: our custom filter that combines a 1080x1920 frame with a 270x480 one.
//
// - Near the camera (the characters) the image stays HD: crisp edges, fine 2x2 dither.
// - With distance it dissolves, through a dithered threshold, into a true 270x480 image:
//   4-tap point-sampled cells, quantised colour with a 4x4 Bayer matrix per low-res cell.
// - Depth-edge outlines (HD, 2 px) on the near layer so blocky characters pop on a phone.
// - Small finish: warm/cool split grade and a vignette.
//
// Uniforms can change per shot (split distance follows the subject).

const frag = /* glsl */ `
uniform vec2 lowRes;
uniform float splitNear;
uniform float splitFar;
uniform float levelsLo;
uniform float levelsHi;
uniform float edgeAmt;
uniform float vignette;
uniform float pixelAll;

float bayer4(vec2 p) {
	int x = int(mod(p.x, 4.0));
	int y = int(mod(p.y, 4.0));
	int i = x + y * 4;
	float m = 0.0;
	if (i == 0) m = 0.0; else if (i == 1) m = 8.0; else if (i == 2) m = 2.0; else if (i == 3) m = 10.0;
	else if (i == 4) m = 12.0; else if (i == 5) m = 4.0; else if (i == 6) m = 14.0; else if (i == 7) m = 6.0;
	else if (i == 8) m = 3.0; else if (i == 9) m = 11.0; else if (i == 10) m = 1.0; else if (i == 11) m = 9.0;
	else if (i == 12) m = 15.0; else if (i == 13) m = 7.0; else if (i == 14) m = 13.0; else m = 5.0;
	return (m + 0.5) / 16.0;
}

vec3 toGamma(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
vec3 toLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }

float viewDist(vec2 p) { return -getViewZ(readDepth(p)); }

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
	// ---- low-res layer (270x480) ----
	vec2 cell = floor(uv * lowRes);
	vec2 cuv = (cell + 0.5) / lowRes;
	vec2 q = 0.25 / lowRes;
	vec3 lo = 0.25 * (texture2D(inputBuffer, cuv + vec2(-q.x, -q.y)).rgb + texture2D(inputBuffer, cuv + vec2(q.x, -q.y)).rgb
		+ texture2D(inputBuffer, cuv + vec2(-q.x, q.y)).rgb + texture2D(inputBuffer, cuv + vec2(q.x, q.y)).rgb);
	float thLo = bayer4(cell);
	lo = toGamma(lo);
	lo = floor(lo * levelsLo + thLo) / levelsLo;
	lo = toLinear(lo);

	// ---- HD layer (fine 2x2-px dither) ----
	vec2 hcell = floor(uv * resolution / 2.0);
	vec3 hi = toLinear(floor(toGamma(inputColor.rgb) * levelsHi + bayer4(hcell)) / levelsHi);

	// ---- depth split: far = low-res, near = HD, dithered (per low-res cell) in between ----
	float zc = viewDist(cuv);
	float m = smoothstep(splitNear, splitFar, zc);
	m = max(m, pixelAll);
	float useLo = step(thLo, m);

	// ---- HD outlines from depth discontinuities on the near layer ----
	float z = viewDist(uv);
	vec2 px = texelSize * 2.0;
	float dz = max(max(abs(viewDist(uv + vec2(px.x, 0.0)) - z), abs(viewDist(uv - vec2(px.x, 0.0)) - z)),
		max(abs(viewDist(uv + vec2(0.0, px.y)) - z), abs(viewDist(uv - vec2(0.0, px.y)) - z)));
	float edge = smoothstep(0.04, 0.1, dz / max(z, 0.5)) * (1.0 - useLo) * edgeAmt;
	hi = mix(hi, hi * 0.12, edge);

	vec3 col = mix(hi, lo, useLo);

	// ---- grade: warm highlights, cool shadows, vignette ----
	float l = dot(col, vec3(0.299, 0.587, 0.114));
	col *= mix(vec3(0.96, 0.99, 1.06), vec3(1.05, 1.0, 0.95), smoothstep(0.05, 0.6, l));
	vec2 v = uv - 0.5;
	col *= 1.0 - vignette * smoothstep(0.25, 0.85, length(v * vec2(1.0, 0.8)));
	outputColor = vec4(col, inputColor.a);
}
`;

export type RetroOpts = {lowRes?: [number, number]; splitNear?: number; splitFar?: number; levelsLo?: number; levelsHi?: number; edge?: number; vignette?: number; pixelAll?: number};

export class RetroHDEffect extends Effect {
	constructor({lowRes = [270, 480], splitNear = 14, splitFar = 22, levelsLo = 18, levelsHi = 48, edge = 1, vignette = 0.35, pixelAll = 0}: RetroOpts = {}) {
		super('RetroHD', frag, {
			attributes: EffectAttribute.DEPTH,
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map<string, THREE.Uniform>([
				['lowRes', new THREE.Uniform(new THREE.Vector2(...lowRes))],
				['splitNear', new THREE.Uniform(splitNear)],
				['splitFar', new THREE.Uniform(splitFar)],
				['levelsLo', new THREE.Uniform(levelsLo)],
				['levelsHi', new THREE.Uniform(levelsHi)],
				['edgeAmt', new THREE.Uniform(edge)],
				['vignette', new THREE.Uniform(vignette)],
				['pixelAll', new THREE.Uniform(pixelAll)],
			]),
		});
	}
	set(o: RetroOpts) {
		const u = this.uniforms;
		if (o.lowRes) (u.get('lowRes')!.value as THREE.Vector2).set(...o.lowRes);
		if (o.splitNear !== undefined) u.get('splitNear')!.value = o.splitNear;
		if (o.splitFar !== undefined) u.get('splitFar')!.value = o.splitFar;
		if (o.levelsLo !== undefined) u.get('levelsLo')!.value = o.levelsLo;
		if (o.levelsHi !== undefined) u.get('levelsHi')!.value = o.levelsHi;
		if (o.edge !== undefined) u.get('edgeAmt')!.value = o.edge;
		if (o.vignette !== undefined) u.get('vignette')!.value = o.vignette;
		if (o.pixelAll !== undefined) u.get('pixelAll')!.value = o.pixelAll;
	}
}

// React wrapper: <RetroHD splitNear={..} /> inside <EffectComposer>.
export const RetroHD = forwardRef<RetroHDEffect, RetroOpts>((props, ref) => {
	const effect = useMemo(() => new RetroHDEffect(props), []); // eslint-disable-line react-hooks/exhaustive-deps
	effect.set(props);
	return <primitive ref={ref} object={effect} dispose={null} />;
});
RetroHD.displayName = 'RetroHD';
