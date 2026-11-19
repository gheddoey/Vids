import React from 'react';
import {Still} from 'remotion';
import {Lineup} from './Lineup';

export const Root: React.FC = () => (
	<>
		<Still id="GroupA" component={Lineup} width={1920} height={1080} defaultProps={{view: 'groupA' as const}} />
		<Still id="GroupB" component={Lineup} width={1920} height={1080} defaultProps={{view: 'groupB' as const}} />
		<Still id="Heads" component={Lineup} width={1920} height={1080} defaultProps={{view: 'heads' as const}} />
	</>
);
