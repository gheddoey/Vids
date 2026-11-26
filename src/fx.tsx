import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {continueRender, delayRender, useCurrentFrame} from 'remotion';

// Put <Redraw /> as the LAST child of a ThreeCanvas that uses an <EffectComposer>
// (@react-three/postprocessing). Remotion advances R3F before the composer is ready, which
// renders a blank frame; this waits a moment and draws again before the frame is captured.
export const Redraw: React.FC<{ms?: number}> = ({ms = 60}) => {
	const advance = useThree((s) => s.advance);
	const f = useCurrentFrame();
	useEffect(() => {
		const h = delayRender('postprocessing redraw');
		advance(performance.now());
		const t = setTimeout(() => {
			advance(performance.now());
			continueRender(h);
		}, ms);
		return () => clearTimeout(t);
	}, [f, advance, ms]);
	return null;
};

// Cartoon outline for blocky parts ("inverted hull"): a slightly bigger box drawn inside-out
// in black. drei's <Outlines> and the postprocessing Outline effect don't show in our renders.
const hullMats = new Map<string, THREE.MeshBasicMaterial>();
export const HullBox: React.FC<{size: [number, number, number]; width?: number; color?: string}> = ({size, width = 0.04, color = '#000000'}) => {
	const mat = useMemo(() => {
		if (!hullMats.has(color)) hullMats.set(color, new THREE.MeshBasicMaterial({color, side: THREE.BackSide}));
		return hullMats.get(color)!;
	}, [color]);
	return (
		<mesh material={mat}>
			<boxGeometry args={[size[0] + width * 2, size[1] + width * 2, size[2] + width * 2]} />
		</mesh>
	);
};
