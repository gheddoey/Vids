import {CharacterProps} from '../Character';

// Every character has a height (rig scale) and something that makes them recognisable.
export type Person = CharacterProps & {h: number};

const LEO_SKIN = '#e8c29c';
const LEO_EYES = '#6a4a2a';

export const P: Record<string, Person> = {
	leo11: {h: 0.62, shirt: 'ts_leo11', skin: LEO_SKIN, pants: '#161616', hair: {type: 'wavy', color: '#5a3a22'}, eyeColor: LEO_EYES, face: 'smile'},
	leoPj: {h: 0.62, shirt: 'ts_leo_pj', skin: LEO_SKIN, pants: '#8ec5ea', hair: {type: 'wavy', color: '#5a3a22'}, eyeColor: LEO_EYES, face: 'serious'},
	leo13: {h: 0.7, shirt: 'ts_leo13', skin: LEO_SKIN, pants: '#3a3f48', hair: {type: 'wavy', color: '#5a3a22'}, eyeColor: LEO_EYES, face: 'smile'},
	leoBib: {h: 0.7, shirt: 'ts_bib_o', skin: LEO_SKIN, pants: '#22262e', hair: {type: 'wavy', color: '#5a3a22'}, eyeColor: LEO_EYES, face: 'serious'},
	leo17: {h: 0.9, shirt: 'ts_barca30', skin: LEO_SKIN, pants: '#1a3a8a', hair: {type: 'swept', color: '#5a3a22'}, eyeColor: LEO_EYES, face: 'smile'},
	messiLong: {h: 0.95, shirt: 'ts_arg10', skin: LEO_SKIN, pants: '#1a2a4a', hair: {type: 'long', color: '#4a3020'}, beard: '#4a3020', eyeColor: LEO_EYES, face: 'serious'},
	messi: {h: 0.95, shirt: 'ts_arg10', skin: LEO_SKIN, pants: '#1a2a4a', hair: {type: 'short', color: '#3a2618'}, beard: '#3a2618', eyeColor: LEO_EYES, face: 'smile'},
	messiRobe: {h: 0.95, shirt: 'ts_bisht', skin: LEO_SKIN, pants: '#1a2a4a', hair: {type: 'short', color: '#3a2618'}, beard: '#3a2618', eyeColor: LEO_EYES, face: 'grin'},

	dad: {h: 1.08, shirt: 'ts_flannel', skin: '#e2b48c', pants: '#3a3530', hair: {type: 'short', color: '#3a2a20'}, beard: '#3a2a20', eyeColor: '#4a6a3a', face: 'serious'},
	dadWork: {h: 1.08, shirt: 'ts_coverall', skin: '#e2b48c', pants: '#d8601a', hat: {type: 'hardhat', color: '#f2c230', accent: '#dcdcdc'}, beard: '#3a2a20', browColor: '#3a2a20', eyeColor: '#4a6a3a', face: 'serious'},
	mom: {h: 1.0, shirt: 'ts_cardigan', skin: '#e6b996', pants: '#3a3040', hair: {type: 'curly', color: '#2a1a14'}, earrings: '#e2c04a', eyeColor: '#5a3a22', mark: 'blush', face: 'serious'},
	doctor: {h: 1.04, shirt: 'ts_doctor', skin: '#f0caa6', pants: '#4a4e58', hair: {type: 'receding', color: '#c4c4c4'}, glasses: '#2a2a2e', mustache: '#cfcfcf', eyeColor: '#3a6fb0', face: 'serious'},
	manager: {h: 1.0, shirt: 'ts_track_red', skin: '#d8a880', pants: '#b81e2a', glasses: '#1a1a1a', browColor: '#3a2a20', eyeColor: '#4a3a2a', face: 'serious'},
	scout1: {h: 1.1, shirt: 'suit', skin: '#c99a76', pants: '#24325a', browColor: '#2a1a12', eyeColor: '#3a2a1a', face: 'squint'},
	scout2: {h: 0.98, shirt: 'suit', skin: '#6e4632', pants: '#24325a', hair: {type: 'short', color: '#141110'}, shades: true, eyeColor: '#3a2416', face: 'serious'},
	scout3: {h: 1.06, shirt: 'suit', skin: '#f0d0b0', pants: '#24325a', hair: {type: 'pompadour', color: '#1a1a1a'}, mustache: '#1a1a1a', eyeColor: '#2a4a6a', face: 'squint'},
	coachOld: {h: 1.02, shirt: 'ts_sweater', skin: '#f0cba8', pants: '#5a5e66', hair: {type: 'receding', color: '#dadada'}, glasses: '#5a3a22', eyeColor: '#4a6a8a', face: 'serious'},
	coachAsst: {h: 1.06, shirt: 'ts_track_navy', skin: '#c48f68', pants: '#1c2a50', hat: {type: 'cap', color: '#1c2a50', accent: '#c8102e'}, browColor: '#1a120c', eyeColor: '#3a2a1a', face: 'serious'},
	waiter: {h: 0.98, shirt: 'ts_barkeep', skin: '#e8c0a0', pants: '#1a1a1a', hair: {type: 'pompadour', color: '#2a1a10'}, mustache: '#2a1a10', eyeColor: '#3a2a1a', face: 'smile'},

	// Kids on the neighbourhood pitch
	kidA: {h: 0.8, shirt: 'jersey05', skin: '#b07a55', pants: '#d8d8d8', hair: {type: 'curly', color: '#141110'}, eyeColor: '#3a2416', face: 'smile'},
	kidB: {h: 0.76, shirt: 'baseball', skin: '#f0d0b0', pants: '#1f2a44', hair: {type: 'spiky', color: '#c8a050'}, eyeColor: '#3a6fb0', face: 'grin'},
	kidC: {h: 0.82, shirt: 'scifi', skin: '#8a5a3c', pants: '#3a3d48', hair: {type: 'short', color: '#141110'}, eyeColor: '#4a2c18', face: 'smile', mark: 'freckles'},
	kidD: {h: 0.74, shirt: 'bluejacket', skin: '#e8c29c', pants: '#2b2d33', hair: {type: 'mop', color: '#7a3a1a'}, eyeColor: '#3f7a3a', face: 'smile'},
	kidE: {h: 0.79, shirt: 'plaid', skin: '#d6a47a', pants: '#3d5675', hair: {type: 'swept', color: '#2a1a10'}, eyeColor: '#5a3418', face: 'serious'},

	// Teens at the tryout
	teenA: {h: 0.9, shirt: 'ts_bib_y', skin: '#f0d0b0', pants: '#22262e', hair: {type: 'spiky', color: '#2a1a10'}, eyeColor: '#2a6a8a', face: 'serious'},
	teenB: {h: 0.86, shirt: 'ts_bib_g', skin: '#8a5a3c', pants: '#22262e', hair: {type: 'braids', color: '#141110'}, eyeColor: '#4a2c18', face: 'serious'},
	teenC: {h: 0.92, shirt: 'ts_bib_y', skin: '#d8a880', pants: '#22262e', hair: {type: 'bun', color: '#3a2a1c', accent: '#2a2a2a'}, eyeColor: '#5a3418', face: 'serious'},

	// 2022 teammates
	mate7: {h: 1.0, shirt: 'ts_arg7', skin: '#b07a55', pants: '#1a2a4a', hair: {type: 'curly', color: '#141110'}, eyeColor: '#3a2416', face: 'grin'},
	mate11: {h: 1.05, shirt: 'ts_arg11', skin: '#e0b48e', pants: '#1a2a4a', hair: {type: 'swept', color: '#2a1a10'}, beard: '#2a1a10', eyeColor: '#3f7a3a', face: 'grin'},
	mate23: {h: 1.08, shirt: 'ts_arg23', skin: '#e8c29c', pants: '#1a2a4a', hair: {type: 'mop', color: '#3a2a1c'}, eyeColor: '#2a5a8a', face: 'grin'},
};

export const SHIRTS = Array.from(new Set(Object.values(P).map((c) => c.shirt)));
