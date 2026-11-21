import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CharacterProps} from '../Character';
import {useShirts} from '../Lineup';
import {Actor, Cam, poseAt} from '../lebron/common';
import {Shadowed} from '../lebron/sets';

// GTA origins cast: every person has a height (rig scale) and something unique.
// Real people are drawn in our blocky style; in-game moments use the generic "player".
export type Person = CharacterProps & {h: number};

export const P: Record<string, Person> = {
	david: {h: 1.0, shirt: 'ts_g_jumper', skin: '#efc8a4', pants: '#4a4238', hair: {type: 'swept', color: '#2e2018'}, glasses: '#3a3a40', eyeColor: '#6a86a8', face: 'smile'},
	mike: {h: 0.98, shirt: 'ts_g_band', skin: '#f0cfae', pants: '#2c3444', hair: {type: 'short', color: '#5a3a22'}, beard: '#5a3a22', hat: {type: 'headphones', color: '#2a2a2e', accent: '#d8402a'}, eyeColor: '#3f8a4a', face: 'smile'},
	ali: {h: 0.9, shirt: 'ts_g_rugby', skin: '#e8b890', pants: '#3a3a44', hat: {type: 'beanie', color: '#2a4a8a', accent: '#f2c43a'}, browColor: '#8a4a22', mark: 'freckles', eyeColor: '#7a4a22', face: 'grin'},
	fi: {h: 0.88, shirt: 'ts_g_denim', skin: '#c88e66', pants: '#1e1e24', hair: {type: 'bob', color: '#1a1412'}, earrings: '#f2c43a', eyeColor: '#8a6a3a', face: 'smug'},
	rab: {h: 1.05, shirt: 'ts_g_flannel', skin: '#f4d0b4', pants: '#3c4a5a', hair: {type: 'spiky', color: '#c4561e'}, eyeColor: '#3a7ac0', mark: 'blush', face: 'grin'},
	exec: {h: 1.08, shirt: 'ts_g_exec', skin: '#e8c0a0', pants: '#4a4e56', hair: {type: 'pompadour', color: '#141414'}, mark: 'mole', eyeColor: '#1e1e1e', face: 'squint'},
	publicist: {h: 1.02, shirt: 'ts_g_cream', skin: '#d8955e', pants: '#e4d8bc', hair: {type: 'wavy', color: '#d4d4d4'}, shades: true, eyeColor: '#c08a2a', face: 'smug'},
	politician: {h: 1.06, shirt: 'ts_g_pol', skin: '#f0c8b0', pants: '#2a2a32', hair: {type: 'receding', color: '#e8e8e8'}, mustache: '#f4f4f4', eyeColor: '#a8b0b8', face: 'squint'},
	mum: {h: 0.96, shirt: 'ts_g_housecoat', skin: '#f0cfb4', pants: '#5a8ab0', hair: {type: 'curly', color: '#a83a5a'}, glasses: '#c8326a', eyeColor: '#4a7ab0', face: 'shock'},
	grandad: {h: 1.0, shirt: 'ts_g_tweed', skin: '#e8c4a4', pants: '#5a4a34', hat: {type: 'schoolcap', color: '#6a5a40', accent: '#5a4a34'}, mustache: '#bcbcbc', browColor: '#bcbcbc', eyeColor: '#7a5a3a', face: 'shock'},
	sam: {h: 1.02, shirt: 'ts_g_bomber', skin: '#ecc6a2', pants: '#2a2c34', hat: {type: 'cap', color: '#1a1a1a', accent: '#e8742a'}, beard: '#3a2a20', browColor: '#3a2a20', eyeColor: '#4a3020', face: 'smile'},
	dan: {h: 1.0, shirt: 'ts_g_cord', skin: '#ecc6a2', pants: '#3a3428', hair: {type: 'curly', color: '#3a2618'}, glasses: '#8a6a3a', eyeColor: '#5a7a6a', face: 'smile'},
	player: {h: 1.0, shirt: 'ts_g_hoodie', skin: '#d4a07a', pants: '#3a4a66', hat: {type: 'beanie', color: '#6a6e76', accent: '#6a6e76'}, browColor: '#2a1a12', eyeColor: '#e8e8e8', face: 'serious'},
	clerk: {h: 0.95, shirt: 'ts_g_polo', skin: '#b47a52', pants: '#2a2a30', hair: {type: 'bun', color: '#1a1210', accent: '#23a19c'}, earrings: '#c8c8d0', eyeColor: '#8a4ab0', face: 'smile'},
	fanA: {h: 0.98, shirt: 'ts_g_fan1', skin: '#f0d0b0', pants: '#3a4a66', hair: {type: 'mop', color: '#e2c060'}, eyeColor: '#3a8ab0', face: 'grin'},
	fanB: {h: 0.92, shirt: 'ts_g_fan2', skin: '#8a5a3c', pants: '#1e1e24', hair: {type: 'braids', color: '#141110'}, eyeColor: '#c06a2a', face: 'grin'},
	fanKid: {h: 0.64, shirt: 'ts_g_kid', skin: '#e8c29c', pants: '#2a4a8a', hair: {type: 'flattop', color: '#4a2a14'}, eyeColor: '#2a8a6a', face: 'grin'},
	fanDad: {h: 1.1, shirt: 'ts_g_dadcheck', skin: '#e8c29c', pants: '#3a3a40', hair: {type: 'receding', color: '#4a2a14'}, beard: '#4a2a14', eyeColor: '#2a8a6a', face: 'smile'},
	fanPj: {h: 1.0, shirt: 'ts_g_onesie', skin: '#c48f68', pants: '#2a6ad0', hair: {type: 'long', color: '#2a1a10'}, eyeColor: '#5a3a8a', face: 'grin'},
};

export const SHIRTS = Array.from(new Set(Object.values(P).map((c) => c.shirt)));

// Line-up still for checking the designs.
const ROW1 = ['david', 'mike', 'ali', 'fi', 'rab', 'exec', 'publicist', 'politician', 'mum', 'grandad'];
const ROW2 = ['sam', 'dan', 'player', 'clerk', 'fanA', 'fanB', 'fanKid', 'fanDad', 'fanPj'];

export const GtaCast: React.FC = () => {
	const imgs = useShirts(SHIRTS);
	if (!imgs) return null;
	const row = (ids: string[], z: number) =>
		ids.map((id, i) => <Actor key={id} c={P[id]} img={imgs[P[id].shirt]} pose={poseAt([{f: 0, face: P[id].face, armLZ: 0.15, armRZ: -0.15}], 0, i)} at={[(i - (ids.length - 1) / 2) * 4.2 + (z < 0 ? 0 : 0), 0, z]} scale={P[id].h} />);
	return (
		<AbsoluteFill style={{background: '#20242c'}}>
			<ThreeCanvas width={1920} height={1080} shadows>
				<Cam frame={0} dur={1} p0={[0, 26, 34]} p1={[0, 26, 34]} t0={[0, 2.5, -5]} t1={[0, 2.5, -5]} fov={44} />
				<hemisphereLight args={['#dfe8ff', '#4a3a30', 0.9]} />
				<Shadowed pos={[-10, 20, 16]} color="#fff2dc" intensity={2.2} size={30} />
				<directionalLight position={[0, 6, 20]} intensity={0.7} />
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<planeGeometry args={[100, 60]} />
					<meshStandardMaterial color="#5a5e66" />
				</mesh>
				{row(ROW1, 0)}
				{row(ROW2, -12)}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
