import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Rig} from '../lowpoly/Rig';
import {MOUTHS, NEUTRAL} from '../lowpoly/LiveFace';
import {EXPR, Expr, face} from './face';
import {P} from '../escobar/cast';
import {PS1Pass} from '../ps1/ps1';

// QC sheet: every expression (or viseme) on one character, front 3/4 view.
const Cam: React.FC = () => {
	const cam = useThree((s) => s.camera);
	cam.position.set(0, 0, 30);
	cam.lookAt(0, 0, 0);
	(cam as unknown as {fov: number}).fov = 30;
	cam.updateProjectionMatrix();
	return null;
};
export const FaceSheet: React.FC<{mode: 'expr' | 'mouth'; who: string}> = ({mode, who}) => {
	const items: {label: string; fc: ReturnType<typeof face>}[] =
		mode === 'expr' ? (Object.keys(EXPR) as Expr[]).map((e) => ({label: e, fc: face(e)})) : MOUTHS.map((m) => ({label: m, fc: {...NEUTRAL, mouth: m, jaw: 0.3}}));
	const cols = 4;
	const pos = (i: number): [number, number] => [((i % cols) - (cols - 1) / 2) * 2.0, (2.5 - Math.floor(i / cols)) * 2.45];
	return (
		<AbsoluteFill style={{background: '#20242c'}}>
			<ThreeCanvas width={1080} height={1920}>
				<Cam />
				<ambientLight intensity={1.2} />
				<directionalLight position={[4, 6, 10]} intensity={2} />
				{items.map((it, i) => {
					const [x, y] = pos(i);
					return (
						<group key={i} position={[x, y, 0]} rotation={[0, -0.2, 0]}>
							<Rig look={P[who].look} headOnly pose={{fc: it.fc}} />
						</group>
					);
				})}
				<PS1Pass levels={24} />
			</ThreeCanvas>
			{items.map((it, i) => {
				const [x, y] = pos(i);
				const sx = 540 + x * 119.4;
				const sy = 960 - y * 119.4 + 92;
				return (
					<div key={i} style={{position: 'absolute', left: sx - 120, width: 240, top: sy, textAlign: 'center', color: '#fff', font: '700 28px Inter'}}>
						{it.label}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
