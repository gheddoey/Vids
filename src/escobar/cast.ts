import type {Look} from '../lowpoly/Rig';

// Escobar cast: six-rules rigs; facial hair both hand-drawn (paint) and 3D, as the user asked.
const SKIN = '#cf9a72';
const EYE = '#3a2416';
const HAIR = '#1a1410';
export type Person = {look: Look; h: number};

export const P: Record<string, Person> = {
	boy: {h: 0.66, look: {skin: SKIN, eye: EYE, hair: {style: 'short', color: HAIR}, top: {kind: 'tee', base: '#e8d8b0', icon: 'plaid', sleeves: 'short'}, pants: '#6a5a40', shoes: '#5a3a22'}},
	teen: {h: 0.82, look: {skin: SKIN, eye: EYE, hair: {style: 'short', color: HAIR}, top: {kind: 'tee', base: '#d8b84a', icon: 'plaid', sleeves: 'short'}, pants: '#8a7a5a', shoes: '#6a4a2a', stubble: {color: '#2a1d14', mode: 'paint'}}},
	pablo70: {h: 0.98, look: {skin: SKIN, eye: EYE, hair: {style: 'curls', color: HAIR}, top: {kind: 'tee', base: '#ece2c8', icon: 'floral', sleeves: 'long'}, pants: '#5a4a3a', shoes: '#3a2a1a', stubble: {color: '#2a1d14', mode: '3d'}}},
	pablo80: {h: 1.0, look: {skin: SKIN, eye: EYE, hair: {style: 'curls', color: HAIR}, top: {kind: 'tee', base: '#ece8de', sleeves: 'short'}, pants: '#3a3a44', shoes: '#f2f2f2', mustache3d: '#1a1410', stubble: {color: '#2a1d14', mode: 'paint'}, belly: true, watch: '#e8c040'}},
	pabloSuit: {h: 1.0, look: {skin: SKIN, eye: EYE, hair: {style: 'curls', color: HAIR}, top: {kind: 'suit', base: '#2a3048', accent: '#f2f2f2', trim: '#8a2a3a'}, pants: '#2a3048', shoes: '#141414', mustache3d: '#1a1410', stubble: {color: '#2a1d14', mode: 'paint'}, belly: true, watch: '#e8c040'}},
	pablo93: {h: 1.0, look: {skin: SKIN, eye: EYE, hair: {style: 'curls', color: HAIR}, top: {kind: 'tee', base: '#5a7ab0', sleeves: 'long'}, pants: '#3a4a6a', shoes: SKIN, beard3d: '#1d1612', belly: true}},
	mother: {h: 0.9, look: {skin: '#c89a74', eye: '#5a3418', hair: {style: 'greybun', color: '#6a625a'}, top: {kind: 'cardigan', base: '#7a4a5a', trim: '#e8dcc4', accent: '#f0e8d8'}, pants: '#3a3030', shoes: '#2a1a10', glasses: '#5a3a22', earrings: '#e8e0d0'}},
	father: {h: 1.0, look: {skin: '#b07a54', eye: '#1a1410', hair: {style: 'short', color: '#2a221a'}, hat: {type: 'straw', color: '#d8c080', accent: '#5a3a22'}, top: {kind: 'tee', base: '#f2efe6', sleeves: 'long'}, pants: '#5a4a3a', shoes: '#3a2a1a', mustache: '#2a221a'}},
	roberto: {h: 0.97, look: {skin: '#c8946c', eye: '#5a4a2a', hair: {style: 'short', color: '#2a2018'}, top: {kind: 'vest', base: '#5a6a5a', accent: '#e8e4da'}, pants: '#4a4a52', shoes: '#3a2a1a', glasses: '#2a2a2a', stubble: {color: '#2a2018', mode: '3d'}, wrist: '#d8a23a'}},
	pilot: {h: 1.02, look: {skin: '#d0a07a', eye: '#4a6a7a', hair: {style: 'short', color: '#4a3a28'}, hat: {type: 'cap', color: '#3a4a3a', accent: '#2a2a2a'}, top: {kind: 'jacket', base: '#6a5a3a', accent: '#e8e0d0'}, pants: '#4a4a3a', shoes: '#2a1a10', glasses: '#141414', stubble: {color: '#4a3a28', mode: '3d'}}},
	politico1: {h: 1.04, look: {skin: '#e0b48a', eye: '#4a6a8a', hair: {style: 'bald', color: '#8a8478'}, top: {kind: 'suit', base: '#3a3a40', accent: '#e8e8f0', trim: '#2a4a8a'}, pants: '#3a3a40', shoes: '#141414', glasses: '#9a9aa0'}},
	politico2: {h: 0.96, look: {skin: '#c89a74', eye: '#3a2416', hair: {style: 'short', color: '#8a8a88'}, top: {kind: 'suit', base: '#4a3a2a', accent: '#f2f2f2', trim: '#c8a23a'}, pants: '#4a3a2a', shoes: '#141414', mustache: '#8a8a88'}},
	cop1: {h: 1.02, look: {skin: '#c08a64', eye: '#2a1a10', hair: {style: 'short', color: HAIR}, hat: {type: 'police', color: '#1e2a3a', accent: '#141414'}, top: {kind: 'jacket', base: '#26324a', accent: '#1e2a3a'}, pants: '#1e2a3a', shoes: '#141414', stubble: {color: '#1a1410', mode: '3d'}}},
	cop2: {h: 0.98, look: {skin: '#a87a58', eye: '#3a2416', hair: {style: 'short', color: HAIR}, hat: {type: 'police', color: '#1e2a3a', accent: '#141414'}, top: {kind: 'jacket', base: '#26324a', accent: '#1e2a3a'}, pants: '#1e2a3a', shoes: '#141414', mustache: '#1a1410'}},
};
