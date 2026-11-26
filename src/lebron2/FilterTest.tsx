import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EffectComposer, ToneMapping} from '@react-three/postprocessing';
import {ToneMappingMode} from 'postprocessing';
import {useShirts} from '../Lineup';
import {Actor, CAST, Cam, SHIRTS} from '../lebron/common';
import {Arena, Street} from '../lebron/sets';
import {Redraw} from '../fx';
import {RetroHD} from '../retro/RetroHD';

// Test bed for the RetroHD filter on an existing LeBron set.
export const FilterTest: React.FC<{mode?: 'off' | 'on' | 'all'; set?: 'street' | 'arena'}> = ({mode = 'on', set = 'arena'}) => {
	const imgs = useShirts(SHIRTS) as Record<string, HTMLImageElement> | null;
	const f = useCurrentFrame();
	if (!imgs) return null;
	return (
		<AbsoluteFill>
			<ThreeCanvas width={1080} height={1920} shadows>
				<Cam frame={f} dur={60} p0={[1.5, 4.8, 13]} p1={[1.5, 4.8, 13]} t0={[0, 3.4, -2]} t1={[0, 3.4, -2]} fov={42} />
				{set === 'street' ? <Street time="dusk" /> : <Arena />}
				<Actor c={CAST.kid} img={imgs[CAST.kid.shirt]} pose={{face: 'serious'}} at={[0.6, 0, 0]} scale={0.72} />
				<Actor c={CAST.mom} img={imgs[CAST.mom.shirt]} pose={{face: 'smile', rotY: 0.3}} at={[-2.6, 0, -1.5]} scale={0.98} />
				{mode !== 'off' ? (
					<EffectComposer multisampling={0}>
						<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
						<RetroHD splitNear={15} splitFar={18} pixelAll={mode === 'all' ? 1 : 0} />
					</EffectComposer>
				) : null}
				<Redraw />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
