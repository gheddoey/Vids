import React from 'react';
import {Composition, Still} from 'remotion';
import {Lineup} from './Lineup';
import {LAST_SLICE_FRAMES, LastSlice} from './LastSlice';
import {ICED_TEA_FRAMES, IcedTea} from './IcedTea';
import {LeBronShort} from './lebron/LeBronShort';
import {MESSI_FRAMES, MessiShort} from './messi/MessiShort';
import {TOTAL as LEBRON_FRAMES} from './lebron/common';
import {PS1_FRAMES, PS1Short} from './ps1/PS1Short';
import {FxTest} from './lab/FxTest';
import {FilterTest} from './lebron2/FilterTest';
import {Lineup2} from './lebron2/Lineup2';
import {LEBRON2_FRAMES, LeBron2} from './lebron2/LeBron2';
import {CoverPreview} from './covers/Covers';

export const Root: React.FC = () => (
	<>
		<Composition id="PS1Test" component={PS1Short} durationInFrames={PS1_FRAMES} fps={30} width={1080} height={1920} />
		<Composition id="FxTest" component={FxTest} durationInFrames={60} fps={30} width={1080} height={1920} />
		<Composition id="FilterTest" component={FilterTest} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{mode: 'on' as const}} />
		<Composition id="LeBron2" component={LeBron2} durationInFrames={LEBRON2_FRAMES} fps={30} width={1080} height={1920} />
		<Composition id="MessiShort" component={MessiShort} durationInFrames={MESSI_FRAMES} fps={30} width={1080} height={1920} />
		<Composition id="LeBronShort" component={LeBronShort} durationInFrames={LEBRON_FRAMES} fps={30} width={1080} height={1920} />
		<Composition id="IcedTea" component={IcedTea} durationInFrames={ICED_TEA_FRAMES} fps={24} width={1920} height={1080} />
		<Composition id="LastSlice" component={LastSlice} durationInFrames={LAST_SLICE_FRAMES} fps={24} width={1920} height={1080} />
		<Still id="Cast2" component={Lineup2} width={1920} height={1080} defaultProps={{row: 0 as const}} />
		<Still id="CoverRecreation" component={CoverPreview} width={1080} height={1920} defaultProps={{view: 'recreation' as const}} />
		<Still id="CoverPixel" component={CoverPreview} width={1080} height={1920} defaultProps={{view: 'pixel' as const}} />
		<Still id="GroupA" component={Lineup} width={1920} height={1080} defaultProps={{view: 'groupA' as const}} />
		<Still id="GroupB" component={Lineup} width={1920} height={1080} defaultProps={{view: 'groupB' as const}} />
		<Still id="Base" component={Lineup} width={1920} height={1080} defaultProps={{view: 'base' as const}} />
		<Still id="Heads" component={Lineup} width={1920} height={1080} defaultProps={{view: 'heads' as const}} />
	</>
);
