import type {Look} from '../lowpoly/Rig';

// LeBron remake cast: six-rules rigs, 64-px painted, each with unique features and height.
const LBJ_SKIN = '#7a4a32';
const LBJ_EYE = '#4a2a16';
export type Person = {look: Look; h: number};

export const P: Record<string, Person> = {
	kid: {h: 0.68, look: {skin: LBJ_SKIN, eye: LBJ_EYE, hair: {style: 'flattop', color: '#16110e'}, top: {kind: 'tee', base: '#b8443a', icon: 'ball', sleeves: 'short'}, pants: '#4a5a86', shoes: '#e8e4da', shoeAccent: '#b83a3a', cuffs: true, tapeToe: true}},
	mom: {h: 0.88, look: {skin: '#86563a', eye: '#8a6a2a', hair: {style: 'bun', color: '#1a1410', accent: '#e8c84a'}, top: {kind: 'jacket', base: '#6d8fc0', accent: '#f08ab0'}, pants: '#2e3448', shoes: '#f2f2f2', earrings: '#f0c040', blush: true}},
	coach: {h: 1.1, look: {skin: '#5e3b27', eye: '#1a1410', brow: '#141010', hair: {style: 'short', color: '#141010'}, hat: {type: 'cap', color: '#1d2f5a', accent: '#d8a23a'}, top: {kind: 'windbreaker', base: '#1d2f5a', trim: '#d8a23a', accent: '#f2f2f2'}, pants: '#2a2c33', shoes: '#1a1a1a', mustache: '#141010', whistle: true}},
	pam: {h: 0.98, look: {skin: '#6e4630', eye: '#7a4a22', hair: {style: 'curls', color: '#2a1d14'}, top: {kind: 'cardigan', base: '#8a3a4a', trim: '#f0e2c8', accent: '#f0e2c8'}, pants: '#3a3a44', shoes: '#4a2a1a', glasses: '#c83a3a', earrings: '#f4f0e8'}},
	walkerKid: {h: 0.62, look: {skin: '#6e4630', eye: '#5a3418', hair: {style: 'puffs', color: '#1a1410', accent: '#f08ab0'}, top: {kind: 'overalls', base: '#4a6aa8', accent: '#f2d84a'}, pants: '#4a6aa8', shoes: '#f08ab0', freckles: true}},
	teacher: {h: 1.0, look: {skin: '#e8c4a0', eye: '#4a7ab8', hair: {style: 'greybun', color: '#a8a49c'}, top: {kind: 'cardigan', base: '#6a7a4a', trim: '#e8dcc4', accent: '#f0e8d8', icon: 'plaid'}, pants: '#4a4038', shoes: '#3a2a1a', glasses: '#7a5a2a', blush: true}},
	nurse: {h: 0.96, look: {skin: '#d8a882', eye: '#3a6a5a', hair: {style: 'short', color: '#5a3a22'}, top: {kind: 'tee', base: '#7ab8b0', sleeves: 'short'}, pants: '#7ab8b0', shoes: '#f2f2f2', freckles: true}},
	teen: {h: 0.98, look: {skin: LBJ_SKIN, eye: LBJ_EYE, hair: {style: 'short', color: '#16110e'}, hat: {type: 'headband', color: '#f4f4f4'}, top: {kind: 'jersey', base: '#1f6a3a', trim: '#e8c84a', num: '23', numColor: '#e8c84a'}, pants: '#1f6a3a', shoes: '#f2f2f2', shoeAccent: '#1f6a3a', wrist: '#e8c84a'}},
	photog: {h: 0.95, look: {skin: '#c89a74', eye: '#7a7a7a', hair: {style: 'short', color: '#3a3028'}, hat: {type: 'beanie', color: '#c84a3a', accent: '#8a2a20'}, top: {kind: 'vest', base: '#6a6a4a', accent: '#2a2a2a'}, pants: '#3a3a3a', shoes: '#5a3a22', beard: '#3a3028'}},
	draft: {h: 1.04, look: {skin: LBJ_SKIN, eye: LBJ_EYE, hair: {style: 'short', color: '#16110e'}, top: {kind: 'suit', base: '#f4f2ec', accent: '#ffffff', trim: '#d8b23a'}, pants: '#f4f2ec', shoes: '#f4f2ec', shoeAccent: '#d8d4cc'}},
	official: {h: 0.96, look: {skin: '#e0bc98', eye: '#5a6a7a', hair: {style: 'bald', color: '#8a8478'}, top: {kind: 'suit', base: '#2a2c36', accent: '#e8e8f0', trim: '#8a2a3a'}, pants: '#2a2c36', shoes: '#141414', glasses: '#9a9aa0'}},
	finals: {h: 1.06, look: {skin: LBJ_SKIN, eye: LBJ_EYE, hair: {style: 'short', color: '#16110e'}, hat: {type: 'headband', color: '#f4f4f4'}, top: {kind: 'jersey', base: '#6f263d', trim: '#ffb81c', num: '23', numColor: '#ffb81c'}, pants: '#6f263d', shoes: '#ffffff', shoeAccent: '#6f263d', beard: '#16110e', wrist: '#ffffff'}},
	opp1: {h: 0.95, look: {skin: '#e0b48a', eye: '#4a7a3a', hair: {style: 'short', color: '#4a3020'}, top: {kind: 'jersey', base: '#1d428a', trim: '#ffc72c', num: '30', numColor: '#ffc72c'}, pants: '#1d428a', shoes: '#ffffff', shoeAccent: '#1d428a'}},
	opp2: {h: 1.0, look: {skin: '#8a5a3c', eye: '#3a2416', hair: {style: 'twists', color: '#16110e'}, top: {kind: 'jersey', base: '#1d428a', trim: '#ffc72c', num: '11', numColor: '#ffc72c'}, pants: '#1d428a', shoes: '#ffc72c', beard: '#16110e'}},
	record: {h: 1.06, look: {skin: LBJ_SKIN, eye: LBJ_EYE, hair: {style: 'short', color: '#16110e'}, hat: {type: 'headband', color: '#f4f4f4'}, top: {kind: 'jersey', base: '#552583', trim: '#fdb927', num: '6', numColor: '#fdb927'}, pants: '#552583', shoes: '#fdb927', shoeAccent: '#552583', beard: '#4a4440', wrist: '#ffffff'}},
	bronny: {h: 0.98, look: {skin: '#80503a', eye: '#5a3418', hair: {style: 'twists', color: '#16110e'}, top: {kind: 'jersey', base: '#552583', trim: '#fdb927', num: '9', numColor: '#fdb927'}, pants: '#552583', shoes: '#ffffff', shoeAccent: '#552583'}},
};
