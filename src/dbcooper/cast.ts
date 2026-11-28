import type {Look} from '../lowpoly/Rig';

// D.B. Cooper cast (1971): six-rules rigs, a different height, pupil colour and feature set per person.
// Facial hair mixes hand-drawn (paint) and 3D, as the user asked.
export type Person = {look: Look; h: number};

export const P: Record<string, Person> = {
	cooper: {h: 1.0, look: {skin: '#c99a76', eye: '#4a3020', brow: '#2a1e16', hair: {style: 'short', color: '#2a1e16'}, top: {kind: 'suit', base: '#3a2e26', accent: '#f2efe6', trim: '#141414'}, pants: '#3a2e26', shoes: '#8a5228', glasses: '#141414', shades: '#1a1c22'}},
	flo: {h: 0.88, look: {skin: '#e8c0a0', eye: '#3a7a4a', hair: {style: 'bun', color: '#8a3a1e'}, hat: {type: 'pillbox', color: '#1e5a6a', accent: '#e8c040'}, top: {kind: 'jacket', base: '#1e5a6a', accent: '#f2efe6'}, pants: '#1e5a6a', shoes: '#141414', earrings: '#e8c040', blush: true}},
	tina: {h: 0.86, look: {skin: '#dcae8a', eye: '#7a5a2a', hair: {style: 'curls', color: '#2a1a12'}, hat: {type: 'pillbox', color: '#2a6a7a', accent: '#e8c040'}, top: {kind: 'jacket', base: '#2a6a7a', accent: '#f2efe6'}, pants: '#2a6a7a', shoes: '#141414', blush: true}},
	agent: {h: 0.95, look: {skin: '#e0b896', eye: '#6a6a70', hair: {style: 'short', color: '#8a8478'}, top: {kind: 'suit', base: '#6a2430', accent: '#f2efe6', trim: '#e8c040'}, pants: '#2a2a30', shoes: '#141414', mustache: '#6a645a'}},
	captain: {h: 1.05, look: {skin: '#e4b890', eye: '#3a6aa8', hair: {style: 'short', color: '#b8b4a8'}, hat: {type: 'pilot', color: '#1a2238', accent: '#0e1424'}, top: {kind: 'suit', base: '#1a2238', accent: '#f2efe6', trim: '#1a2238'}, pants: '#1a2238', shoes: '#141414', mustache: '#9a968a', earrings: undefined}},
	fbi1: {h: 1.02, look: {skin: '#d8ac88', eye: '#5a4a32', hair: {style: 'short', color: '#3a2a1e'}, hat: {type: 'fedora', color: '#4a4a48', accent: '#1e1e1e'}, top: {kind: 'suit', base: '#5a5c60', accent: '#f2efe6', trim: '#2a3a5a'}, pants: '#5a5c60', shoes: '#141414', glasses: '#2a2a2a', stubble: {color: '#3a2a1e', mode: '3d'}}},
	fbi2: {h: 0.97, look: {skin: '#b8876a', eye: '#3a2416', hair: {style: 'bald', color: '#4a3a2a'}, top: {kind: 'vest', base: '#6a5a3a', accent: '#e8e4da'}, pants: '#3a3a40', shoes: '#2a1a10', mustache3d: '#2a1e16'}},
	reporter: {h: 0.94, look: {skin: '#e8c4a4', eye: '#2a5a7a', hair: {style: 'flattop', color: '#6a4a2a'}, top: {kind: 'vest', base: '#8a7a5a', accent: '#f2efe6'}, pants: '#4a4a3a', shoes: '#3a2a1a', glasses: '#7a5a2a', stubble: {color: '#6a4a2a', mode: 'paint'}}},
	search1: {h: 1.04, look: {skin: '#d0a07a', eye: '#4a6a3a', hair: {style: 'short', color: '#4a3a28'}, hat: {type: 'police', color: '#5a4a2a', accent: '#3a2e1a'}, top: {kind: 'windbreaker', base: '#d8b02a', accent: '#3a3a3a'}, pants: '#3a3a2a', shoes: '#2a1a10', beard3d: '#4a3a28'}},
	search2: {h: 0.96, look: {skin: '#a87a58', eye: '#2a1a10', hair: {style: 'short', color: '#1a1410'}, hat: {type: 'police', color: '#5a4a2a', accent: '#3a2e1a'}, top: {kind: 'windbreaker', base: '#d8b02a', accent: '#3a3a3a'}, pants: '#3a3a2a', shoes: '#2a1a10', stubble: {color: '#1a1410', mode: 'paint'}}},
	search3: {h: 1.0, look: {skin: '#e8c0a0', eye: '#5a7aa0', hair: {style: 'short', color: '#c89a4a'}, hat: {type: 'beanie', color: '#3a5a3a', accent: '#2a4a2a'}, top: {kind: 'windbreaker', base: '#c8462a', accent: '#3a3a3a'}, pants: '#3a3a44', shoes: '#2a1a10', mustache: '#c89a4a'}},
	boy: {h: 0.62, look: {skin: '#efcaa8', eye: '#4a7aa8', hair: {style: 'short', color: '#8a5a2a'}, hat: {type: 'beanie', color: '#2a4a8a', accent: '#e8e4da'}, top: {kind: 'windbreaker', base: '#c8302a', accent: '#f2efe6'}, pants: '#3a4a6a', shoes: '#6a4a2a', freckles: true}},
	dad: {h: 1.04, look: {skin: '#dcae8a', eye: '#5a4a2a', hair: {style: 'short', color: '#5a3a22'}, hat: {type: 'cap', color: '#3a5a3a', accent: '#2a3a2a'}, top: {kind: 'tee', base: '#8a2a24', icon: 'plaid', sleeves: 'long'}, pants: '#4a5a7a', shoes: '#5a3a22', beard3d: '#5a3a22'}},
	pass1: {h: 0.92, look: {skin: '#e8c0a0', eye: '#7a4a2a', hair: {style: 'curls', color: '#c89a4a'}, top: {kind: 'tee', base: '#c87a2a', sleeves: 'long'}, pants: '#6a4a2a', shoes: '#3a2a1a', earrings: '#e8e0d0'}},
	pass2: {h: 1.03, look: {skin: '#8a5a3e', eye: '#2a1a10', hair: {style: 'puffs', color: '#1a1410'}, top: {kind: 'jacket', base: '#6a4a2a', accent: '#e8d8b0'}, pants: '#8a7a5a', shoes: '#2a1a10', mustache3d: '#1a1410'}},
	pass3: {h: 0.98, look: {skin: '#dcae8a', eye: '#3a5a7a', hair: {style: 'short', color: '#4a3a28'}, top: {kind: 'tee', base: '#4a7a5a', icon: 'plaid', sleeves: 'long'}, pants: '#3a3a44', shoes: '#141414', glasses: '#8a6a3a', stubble: {color: '#4a3a28', mode: '3d'}}},
	pass4: {h: 0.9, look: {skin: '#f0d0b0', eye: '#6a8a3a', hair: {style: 'greybun', color: '#a8a49a'}, top: {kind: 'cardigan', base: '#a84a5a', trim: '#e8dcc4', accent: '#f0e8d8'}, pants: '#4a3a3a', shoes: '#2a1a10', glasses: '#c8a23a'}},
	pass5: {h: 1.0, look: {skin: '#c08a64', eye: '#3a2416', hair: {style: 'flattop', color: '#2a1e16'}, top: {kind: 'jacket', base: '#2a4a6a', accent: '#e8c84a'}, pants: '#2a2a30', shoes: '#3a2a1a', stubble: {color: '#2a1e16', mode: 'paint'}}},
};
