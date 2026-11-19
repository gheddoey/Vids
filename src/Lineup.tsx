import React, {useEffect, useLayoutEffect, useState} from 'react';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Character, CharacterProps} from './Character';

export const CAST: CharacterProps[] = [
	{shirt: 'pilot', pants: '#1f2b47', face: 'serious', mark: 'scar', hair: {type: 'pompadour', color: '#2b1d14'}},
	{shirt: 'plaid', pants: '#3d5675', face: 'grin', mark: 'freckles', hair: {type: 'mop', color: '#9a2a22'}, hat: {type: 'goggles', color: '#5a3b22', accent: '#ffb347'}},
	{shirt: 'varsity', pants: '#d9cfb8', face: 'smile', mark: 'blush', hair: {type: 'swept', color: '#3fa34d'}, hat: {type: 'cap', color: '#6b3a24', accent: '#f2f2f2'}},
	{shirt: 'wings', pants: '#3a3a40', face: 'mustache', eyeColor: '#c0392b', skin: '#e9b98a', hair: {type: 'spiky', color: '#d9dde3'}, hat: {type: 'headphones', color: '#26282e', accent: '#e23b3b'}},
	{shirt: 'suit', pants: '#24325a', face: 'mustache', skin: '#f0c595', hair: {type: 'bob', color: '#16161a'}, hat: {type: 'fedora', color: '#6e4a2c', accent: '#2a2a2a'}},
	{shirt: 'jersey05', pants: '#d8d8d8', face: 'grin', skin: '#a8714a', hat: {type: 'beanie', color: '#e2742b', accent: '#fff3d6'}},
	{shirt: 'bluejacket', pants: '#2b2d33', face: 'calm', mark: 'drop', hair: {type: 'swept', color: '#5b3a1e'}, hat: {type: 'badgecap', color: '#f2b230', accent: '#d8382b'}},
	{shirt: 'tiedye', pants: '#5a3a8a', face: 'smile', mark: 'mole', hair: {type: 'bun', color: '#3a2318', accent: '#e04a7a'}},
];

const Backdrop: React.FC = () => (
	<>
		<color attach="background" args={['#d6cf93']} />
		<fog attach="fog" args={['#d6cf93', 30, 80]} />
		<hemisphereLight args={['#fff6d8', '#8a8a5a', 1.3]} />
		<directionalLight
			position={[10, 18, 14]}
			intensity={1.4}
			color="#fff1cf"
			castShadow
			shadow-mapSize={[2048, 2048]}
			shadow-camera-left={-20}
			shadow-camera-right={20}
			shadow-camera-top={15}
			shadow-camera-bottom={-5}
		/>
		{/* Ground */}
		<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[300, 300]} />
			<meshStandardMaterial color="#7fa865" roughness={1} />
		</mesh>
		{/* Simple buildings in the distance */}
		{[
			{x: -18, w: 14, h: 12, c: '#e8dcb7'},
			{x: -2, w: 12, h: 16, c: '#d8a27a'},
			{x: 14, w: 16, h: 11, c: '#eadfc0'},
		].map((b) => (
			<group key={b.x} position={[b.x, b.h / 2, -30]}>
				<mesh receiveShadow>
					<boxGeometry args={[b.w, b.h, 8]} />
					<meshStandardMaterial color={b.c} roughness={0.95} />
				</mesh>
				{Array.from({length: Math.floor(b.h / 3.5)}, (_, i) => (
					<mesh key={i} position={[0, -b.h / 2 + 2.5 + i * 3.5, 4.01]}>
						<planeGeometry args={[b.w - 2, 1.2]} />
						<meshStandardMaterial color="#8a8164" roughness={1} />
					</mesh>
				))}
			</group>
		))}
	</>
);

// Point the camera at a target (R3F otherwise aims it at the origin).
const CameraTarget: React.FC<{target: [number, number, number]}> = ({target}) => {
	const camera = useThree((s) => s.camera);
	useLayoutEffect(() => {
		camera.lookAt(...target);
		camera.updateProjectionMatrix();
	}, [camera, target]);
	return null;
};

export const useShirts = (names: string[]) => {
	const [imgs, setImgs] = useState<Record<string, HTMLImageElement> | null>(null);
	const [handle] = useState(() => delayRender('Loading shirts'));
	useEffect(() => {
		Promise.all(
			names.map(
				(n) =>
					new Promise<[string, HTMLImageElement]>((res, rej) => {
						const i = new Image();
						i.onload = () => res([n, i]);
						i.onerror = () => rej(new Error('Could not load shirt ' + n));
						i.src = staticFile(`shirts/${n}.png`);
					}),
			),
		)
			.then((pairs) => {
				setImgs(Object.fromEntries(pairs));
				continueRender(handle);
			})
			.catch((e) => cancelRender(e));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return imgs;
};

type View = 'groupA' | 'groupB' | 'heads' | 'base';

export const Lineup: React.FC<{view: View}> = ({view}) => {
	const {width, height} = useVideoConfig();
	const imgs = useShirts(CAST.map((c) => c.shirt));
	if (!imgs) return null;

	let cast: React.ReactNode;
	let camera: {position: [number, number, number]; fov: number};
	let target: [number, number, number];
	if (view === 'base') {
		// Plain grey avatar, 3/4 view like the reference base model.
		camera = {position: [5.5, 6.2, 12], fov: 30};
		target = [0, 2.9, 0];
		cast = <Character shirt="none" skin="#c9cbcf" pants="#c9cbcf" face="smile" rotY={0.25} />;
	} else if (view === 'heads') {
		// 2 rows of 4 heads, turned slightly so the sides of the hair show.
		camera = {position: [0, 5.35, 11.6], fov: 32};
		target = [0, 4.62, 0];
		cast = CAST.map((c, i) => {
			const row = Math.floor(i / 4);
			const col = i % 4;
			return (
				<Character
					key={i}
					{...c}
					img={imgs[c.shirt]}
					headOnly
					position={[(col - 1.5) * 2.6, row === 0 ? 1.8 : -1.8, 0]}
					rotY={0.45 - col * 0.3}
				/>
			);
		});
	} else {
		camera = {position: [0, 5.5, 19], fov: 32};
		target = [0, 3.0, 0];
		const group = view === 'groupA' ? CAST.slice(0, 4) : CAST.slice(4, 8);
		cast = group.map((c, i) => (
			<Character key={i} {...c} img={imgs[c.shirt]} position={[(i - 1.5) * 4.8, 0, 0]} rotY={0.2 - i * 0.13} />
		));
	}

	return (
		<AbsoluteFill style={{filter: 'sepia(0.22) saturate(0.95) contrast(1.03)'}}>
			<ThreeCanvas width={width} height={height} shadows camera={camera}>
				<CameraTarget target={target} />
				<Backdrop />
				{cast}
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
