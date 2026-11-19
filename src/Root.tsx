import React from 'react';
import {Composition, Still} from 'remotion';
import {Lineup} from './Lineup';
import {LAST_SLICE_FRAMES, LastSlice} from './LastSlice';

export const Root: React.FC = () => (
	<>
		<Composition id="LastSlice" component={LastSlice} durationInFrames={LAST_SLICE_FRAMES} fps={24} width={1920} height={1080} />
		<Still id="GroupA" component={Lineup} width={1920} height={1080} defaultProps={{view: 'groupA' as const}} />
		<Still id="GroupB" component={Lineup} width={1920} height={1080} defaultProps={{view: 'groupB' as const}} />
		<Still id="Base" component={Lineup} width={1920} height={1080} defaultProps={{view: 'base' as const}} />
		<Still id="Heads" component={Lineup} width={1920} height={1080} defaultProps={{view: 'heads' as const}} />
	</>
);
