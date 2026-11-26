import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill} from 'remotion';
import {useThree} from '@react-three/fiber';
import {Who} from '../lowpoly/Rig';
import {PS1Pass} from '../ps1/ps1';
import {SkyDome} from '../ps1/sets';
import {Rig4} from '../lebron2/sets';
import {CineGrade} from '../cine/Cine';
import {P} from './cast';

const Look: React.FC<{p: [number, number, number]; t: [number, number, number]}> = ({p, t}) => {
	const cam = useThree((s) => s.camera);
	cam.position.set(...p);
	cam.lookAt(...t);
	return null;
};

// Cast check: full bodies (row 0) or head close-ups to judge facial hair (row 1).
export const EscobarCast: React.FC<{heads?: boolean}> = ({heads}) => {
	const keys = Object.keys(P);
	return (
		<AbsoluteFill>
			<ThreeCanvas width={1920} height={1080} shadows="soft" camera={{fov: 30}}>
				{heads ? <Look p={[0, 5.0, 26]} t={[0, 4.6, 0]} /> : <Look p={[0, 4, 46]} t={[0, 2.8, 0]} />}
				<SkyDome top="#2a3a6a" bottom="#e8a070" />
				<Rig4 sky="#ffd8b0" ground="#5a4030" key="#ffcf8a" keyPos={[-10, 7, 9]} rim="#7aa0ff" span={30} />
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					<planeGeometry args={[120, 40]} />
					<meshLambertMaterial color="#8a7a6a" />
				</mesh>
				{keys.map((k, i) => (
					<Who key={k} look={P[k].look} h={heads ? 1 : P[k].h} at={[(i - (keys.length - 1) / 2) * (heads ? 1.75 : 3.2), 0, 0]} pose={{face: i % 2 ? 'smile' : 'serious', rotY: 0.2}} />
				))}
				<PS1Pass />
				<CineGrade preset="golden" />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
