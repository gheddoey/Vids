import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill} from 'remotion';
import {Who} from '../lowpoly/Rig';
import {PS1Pass} from '../ps1/ps1';
import {Lights, SkyDome} from '../ps1/sets';
import {P} from './cast';
import {useThree} from '@react-three/fiber';

const Look: React.FC<{p: [number, number, number]; t: [number, number, number]}> = ({p, t}) => {
	const cam = useThree((s) => s.camera);
	cam.position.set(...p);
	cam.lookAt(...t);
	return null;
};

// Contact sheet of the remake cast (two rows).
export const Lineup2: React.FC<{row?: 0 | 1}> = ({row = 0}) => {
	const keys = Object.keys(P);
	const list = row === 0 ? keys.slice(0, 8) : keys.slice(8);
	return (
		<AbsoluteFill>
			<ThreeCanvas width={1920} height={1080} shadows="basic" camera={{fov: 30}}>
				<Look p={[0, 4, 30]} t={[0, 2.8, 0]} />
				<SkyDome top="#1e2a4a" bottom="#6a7a9a" />
				<Lights />
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<planeGeometry args={[80, 30]} />
					<meshLambertMaterial color="#8a8070" />
				</mesh>
				{list.map((k, i) => (
					<Who key={k} look={P[k].look} h={P[k].h} at={[(i - (list.length - 1) / 2) * 3.4, 0, 0]} pose={{face: i % 3 === 0 ? 'smile' : i % 3 === 1 ? 'talkA' : 'proud', rotY: 0.25}} />
				))}
				<PS1Pass />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
