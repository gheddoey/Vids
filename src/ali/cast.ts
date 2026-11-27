import type {Look} from '../lowpoly/Rig';
import type {Profile} from '../acting';
import {PROFILES, bump, every} from '../acting';

// Muhammad Ali cast: six-rules rigs, live faces. Heights by rig scale; unique features per person.
export type Person = {look: Look; h: number};
const ALI_SKIN = '#8a5a3a';
const ALI_EYE = '#3a2416';
const BLACK = '#141010';
const boxer = (skin: string, eye: string, hair: Look['hair'], trunks: Look['trunks'], extra: Partial<Look> = {}): Look => ({
	skin,
	eye,
	hair,
	top: {kind: 'bare', base: skin, trim: trunks!.trim ?? trunks!.color, sleeves: 'none'},
	pants: trunks!.color,
	trunks,
	...extra,
});

export const C: Record<string, Person> = {
	// 1954: 12-year-old Cassius (short, skinny), striped tee
	kid: {h: 0.7, look: {skin: ALI_SKIN, eye: ALI_EYE, hair: {style: 'short', color: BLACK}, top: {kind: 'tee', base: '#e8e0cc', trim: '#3a5a8a', icon: 'plaid', sleeves: 'short'}, pants: '#4a5a7a', shoes: '#3a2a1a', cuffs: true}},
	// the thief: older kid, seen mostly from behind, cap
	thief: {h: 0.8, look: {skin: '#c89a74', eye: '#2a1a10', hair: {style: 'short', color: '#4a3a28'}, hat: {type: 'cap', color: '#5a5a5a', accent: '#3a3a3a'}, top: {kind: 'jacket', base: '#6a4a3a', accent: '#d8d0c0'}, pants: '#3a3a44', shoes: '#2a1a10'}},
	// officer Joe Martin: white, grey hair, glasses, police uniform
	martin: {h: 1.04, look: {skin: '#e0b48a', eye: '#4a6a8a', hair: {style: 'short', color: '#8a8478'}, hat: {type: 'police', color: '#1e2a3a', accent: '#141414'}, top: {kind: 'jacket', base: '#26324a', accent: '#c8c0b0'}, pants: '#1e2a3a', shoes: '#141414', glasses: '#2a2a2a', mustache: '#8a8478', belly: true}},
	// 1960 Rome: Cassius at 18, warm-up jacket (team colours, no logos)
	clay18: {h: 0.96, look: {skin: ALI_SKIN, eye: ALI_EYE, hair: {style: 'short', color: BLACK}, top: {kind: 'windbreaker', base: '#f2f0e8', trim: '#c83a3a', accent: '#2a4a8a'}, pants: '#f2f0e8', shoes: '#f2f0e8'}},
	// fighting Ali: white trunks, black trim (1964-74)
	ali: {h: 1.0, look: boxer(ALI_SKIN, ALI_EYE, {style: 'short', color: BLACK}, {color: '#f2f0e8', trim: '#141414', boots: '#f2f0e8'})},
	// civilian Ali (name change, draft, exile): dark suit, thin tie
	aliSuit: {h: 1.0, look: {skin: ALI_SKIN, eye: ALI_EYE, hair: {style: 'short', color: BLACK}, top: {kind: 'suit', base: '#2a2c34', accent: '#f2f0e8', trim: '#141414'}, pants: '#2a2c34', shoes: '#141414'}},
	// Atlanta 1996: older Ali, white track jacket, greying temples
	ali96: {h: 1.0, look: {skin: ALI_SKIN, eye: ALI_EYE, hair: {style: 'short', color: '#3a3430'}, top: {kind: 'windbreaker', base: '#f2f0e8', trim: '#c8a23a', accent: '#2a2c34'}, pants: '#f2f0e8', shoes: '#f2f0e8', belly: true, stubble: {color: '#6a625a', mode: 'paint'}}},
	// Sonny Liston: bigger, heavier, scowl; dark trunks
	liston: {h: 1.1, look: boxer('#5e3c2a', '#2a1a10', {style: 'short', color: BLACK}, {color: '#2a2a30', trim: '#f2f0e8', boots: '#141414'}, {stubble: {color: '#1a1410', mode: '3d'}})},
	// Joe Frazier: shorter, stocky, thin mustache; green-and-gold trunks
	frazier: {h: 0.96, look: boxer('#5e3c2a', '#3a2a1a', {style: 'short', color: BLACK}, {color: '#2a6a3a', trim: '#e8c040', boots: '#141414'}, {mustache3d: BLACK})},
	// George Foreman 1974: big, mustache, red trunks with blue trim
	foreman: {h: 1.12, look: boxer('#563624', '#2a1a10', {style: 'short', color: BLACK}, {color: '#b8262a', trim: '#2a4a9a', boots: '#f2f0e8'}, {mustache3d: BLACK})},
	referee: {h: 0.98, look: {skin: '#d8a882', eye: '#3a5a3a', hair: {style: 'bald', color: '#6a625a'}, top: {kind: 'shirt', base: '#f2f0e8', sleeves: 'short'}, pants: '#1a1a1e', shoes: '#141414', mustache: '#6a625a'}},
	officer: {h: 1.02, look: {skin: '#d0a07a', eye: '#4a6a7a', hair: {style: 'short', color: '#4a3a28'}, hat: {type: 'cap', color: '#5a6a3a', accent: '#3a4a2a'}, top: {kind: 'jacket', base: '#5a6a3a', accent: '#e8e0c8'}, pants: '#5a6a3a', shoes: '#141414', glasses: '#141414'}},
	justice: {h: 1.0, look: {skin: '#e0b48a', eye: '#4a5a6a', hair: {style: 'bald', color: '#c8c4bc'}, top: {kind: 'gown', base: '#141418'}, pants: '#141418', shoes: '#141414', glasses: '#8a8a8a'}},
};

// Acting profiles (docs/ANIMATION-SYSTEM.md): Ali is quick, light, cocky and verbal; the others contrast.
export const PR: Record<string, Profile> = {
	// Ali: dancing weight, chin up, fast blinks when riled, big brows when talking, mischievous darts
	ali: {name: 'Ali', posture: {headX: -0.06, side: 0.03}, idle: {sway: 0.06, period: 14, head: 0.08}, blink: 85, gaze: {jitter: 0.2, every: 44}, loose: 1.3, cadence: 2, expr: 'smirk', talk: {gesture: 1.3, nod: 1.1, brow: 1.4}, mannerism: (f) => every(f, 90, 14, 3, (u) => ({y: 0.1 * bump(u), sq: -0.03 * bump(u)})), seed: 3},
	kid: {...PROFILES.teen, name: 'Kid Clay', expr: 'angry', seed: 5},
	// Joe Martin: patient, amused, slow, hands on the belt
	martin: {...PROFILES.father, name: 'Joe Martin', expr: 'calm', cadence: 2, seed: 9},
	// Liston: menace by stillness; slow blinks, a fixed stare
	liston: {name: 'Liston', posture: {lean: 0.06, headX: 0.1}, idle: {sway: 0.012, period: 60, head: 0.015}, blink: 220, gaze: {jitter: 0.02, every: 200}, loose: 0.7, cadence: 2, expr: 'angry', talk: {gesture: 0.2, nod: 0.2, brow: 0.2}, seed: 13},
	// Frazier: always moving forward, bobbing low
	frazier: {name: 'Frazier', posture: {lean: 0.18, headX: 0.05}, idle: {sway: 0.07, period: 10, head: 0.05}, blink: 120, gaze: {jitter: 0.05, every: 100}, loose: 1.0, cadence: 2, expr: 'focused', talk: {gesture: 0.3, nod: 0.3, brow: 0.3}, seed: 17},
	// Foreman: heavy, stalking, power
	foreman: {name: 'Foreman', posture: {lean: 0.08}, idle: {sway: 0.03, period: 30, head: 0.02}, blink: 160, gaze: {jitter: 0.03, every: 150}, loose: 0.8, cadence: 2, expr: 'angry', talk: {gesture: 0.3, nod: 0.3, brow: 0.3}, seed: 19},
	officer: {...PROFILES.cop, name: 'Officer', seed: 23},
	ref: {...PROFILES.cop, name: 'Referee', expr: 'focused', seed: 29},
};
