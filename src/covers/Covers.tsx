import React, {useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {BlockText, useBlockFont} from '../BlockText';
import {PS1Pass, lambert, nearest} from '../ps1/ps1';
import {B, Lights, SkyDome} from '../ps1/sets';
import {Who} from '../lowpoly/Rig';
import type {Look} from '../lowpoly/Rig';
import {handOf} from '../lebron/common';

// Magazine covers, two ways:
// 1. Faithful recreation (rule-safe): the real layout rebuilt as a 3D blocky object — same
//    composition, colours, pose, headline, cover lines and date; only the masthead name differs.
// 2. Real cover crushed to a 64-px texture (tools/pixel_cover.py) on a 3D magazine.

const PI = Math.PI;
type V3 = [number, number, number];

// ---------- 2. real covers as 64-px textures ----------
export const COVERS = ['si_2002_chosen_one', 'si_2016_cleveland_rocks', 'si_2012_sportsman', 'si_2022_chosen_sons'] as const;
const texCache: Record<string, THREE.Texture> = {};
export const useCoverTextures = (names: readonly string[]) => {
	const [ready, setReady] = useState(names.every((n) => texCache[n]));
	const [h] = useState(() => (ready ? null : delayRender('cover textures')));
	useEffect(() => {
		if (ready) return;
		const loader = new THREE.TextureLoader();
		Promise.all(
			names.map(
				(n) =>
					new Promise<void>((res) =>
						loader.load(staticFile(`covers/${n}.png`), (t) => {
							t.colorSpace = THREE.SRGBColorSpace;
							texCache[n] = nearest(t);
							res();
						}),
					),
			),
		).then(() => {
			setReady(true);
			if (h !== null) continueRender(h);
		});
	}, [h, names, ready]);
	return ready;
};

// A real magazine: thin box, the 64-px cover on the front, white pages on the edges.
export const PixelMag: React.FC<{name: string; w?: number; pos?: V3; rot?: V3}> = ({name, w = 1.5, pos = [0, 0, 0], rot = [0, 0, 0]}) => {
	const t = texCache[name];
	const mats = useMemo(() => {
		const page = lambert({color: '#f2efe6'});
		return [page, page, page, page, lambert({map: t}), lambert({color: '#d8d4ca'})];
	}, [t]);
	const h = t ? (w * t.image.height) / t.image.width : w * 1.3;
	return (
		<mesh position={pos} rotation={rot} material={mats} castShadow receiveShadow>
			<boxGeometry args={[w, h, 0.06]} />
		</mesh>
	);
};

// ---------- 1. faithful recreation: Feb 18, 2002 "The Chosen One" ----------
// Reference (real cover): black background; huge white two-line masthead (2nd line hidden behind
// his head); three tilted tan-edged grey cover-line bars top right (Winter Olympics…); LeBron at 17
// in the WHITE St. V home jersey with dark-green "IRISH 23", dark-green headband, mouth open in an
// "O", golden ball raised in his right hand by his head, left hand reaching at the camera;
// "THE / CHOSEN / ONE" in white with red rules, the dek below, and the date box bottom right.
export const TEEN_COVER: Look = {
	skin: '#7a4a32',
	eye: '#4a2a16',
	hair: {style: 'short', color: '#16110e'},
	hat: {type: 'headband', color: '#1d4a3c'},
	top: {kind: 'jersey', base: '#f2f2ec', trim: '#1d4a3c', num: '23', numColor: '#1d4a3c', chest: 'IRISH'},
	pants: '#f2f2ec',
	shoes: '#f2f2f2',
};

const CoverLine: React.FC<{y: number; lines: string[]; big?: boolean}> = ({y, lines, big}) => (
	<group position={[2.35, y, 0.5]} rotation={[0, 0, 0.42]}>
		<B size={[4.0, big ? 0.92 : 0.86, 0.1]} color="#d8a55a" />
		<B size={[3.86, big ? 0.78 : 0.72, 0.12]} color="#8a8a80" />
		{lines.map((l, i) => (
			<BlockText key={i} text={l} size={big ? 0.36 : 0.22} depth={0.04} color="#ffffff" position={[0, (lines.length - 1) * 0.14 - i * 0.28, 0.1]} />
		))}
	</group>
);

export const ChosenOneCover: React.FC = () => {
	const s = 2.3; // figure scale: head ≈ a third of the cover width, like the photo
	const zs = 0.28; // relief: depth squashed so reaching arms stay on the cover plane
	const at: V3 = [-0.1, -5.6 - 2 * s, 0.3]; // bust: torso bottom on the cover's bottom edge
	const pose = {rotY: 0.32, lean: 0.04, side: -0.04, headY: -0.25, headZ: 0.07, headX: -0.06, armRX: -1.95, armRZ: -0.42, armLX: -1.25, armLZ: 0.18, face: 'shock'};
	const h0 = handOf(pose, 'R', at, s);
	const hR = {x: h0.x, y: h0.y, z: at[2] + (h0.z - at[2]) * zs};
	return (
		<group>
			{/* black backdrop */}
			<B size={[8.5, 11.2, 0.2]} pos={[0, 0, -0.2]} color="#0b0908" />
			{/* masthead (name changed), white with a dark side, 2nd line sits behind the head */}
			<BlockText text="Sports" size={1.95} depth={0.3} color="#ffffff" side="#2a2a2a" position={[-0.15, 4.25, -0.05]} />
			<BlockText text="Weekly" size={1.55} depth={0.3} color="#ffffff" side="#2a2a2a" position={[-0.6, 2.45, -0.05]} />
			{/* cover lines, top right */}
			<CoverLine y={3.75} lines={['Winter Olympics']} big />
			<CoverLine y={2.95} lines={['WHAT MAKES THESE', 'GAMES SO SPECIAL']} />
			<CoverLine y={2.15} lines={['U.S. SNOWBOARDERS', 'RULE THE HALFPIPE']} />
			{/* the figure, cut at the bottom edge (bust) */}
			<group position={at} scale={[s, s, s * zs]}>
				<Who look={TEEN_COVER} pose={pose} bust />
			</group>
			{/* golden ball in the raised right hand */}
			<group position={[hR.x - 0.35, hR.y + 0.75, hR.z + 0.6]} scale={[1, 1, 0.5]}>
				<mesh castShadow>
					<icosahedronGeometry args={[1.2, 1]} />
					<meshLambertMaterial color="#e2cf8e" flatShading />
				</mesh>
				<B size={[2.56, 0.05, 0.05]} rot={[0, 0, 0.3]} color="#6a5a3a" shadow={false} />
				<B size={[0.05, 2.56, 0.05]} rot={[0, 0.5, 0.3]} color="#6a5a3a" shadow={false} />
			</group>
			{/* headline with red rules */}
			{[
				['THE', -0.95],
				['CHOSEN', -2.2],
				['ONE', -3.45],
			].map(([t, y]) => (
				<group key={t as string}>
					<BlockText text={t as string} size={1.0} depth={0.22} color="#ffffff" side="#3a3a3a" align="left" position={[-4.0, y as number, 2.4]} />
					<B size={[t === 'CHOSEN' ? 4.9 : t === 'THE' ? 2.6 : 3.0, 0.07, 0.05]} pos={[-4.15 + (t === "CHOSEN" ? 4.9 : t === "THE" ? 2.6 : 3.0) / 2, (y as number) - 0.62, 2.4]} color="#c8202a" shadow={false} />
				</group>
			))}
			{/* dek */}
			{[
				['High school junior', -4.45, -3.7],
				['LeBron James', -4.85, -3.2],
				['would be an NBA', -5.25, -3.4],
				['lottery pick right now', -5.6, -3.15],
			].map(([t, y, x]) => (
				<BlockText key={t as string} text={t as string} size={0.27} depth={0.04} color="#ffffff" align="left" position={[x as number, y as number, 2.4]} />
			))}
			{/* date box */}
			<group position={[2.95, -5.05, 1.4]}>
				<B size={[2.4, 0.5, 0.06]} color="#050505" />
				<BlockText text="FEBRUARY 18, 2002" size={0.16} depth={0.02} color="#e8a845" position={[0, 0.08, 0.05]} />
				<BlockText text="AOL Keyword: Sports Weekly" size={0.1} depth={0.02} color="#ffffff" position={[0, -0.12, 0.05]} />
			</group>
		</group>
	);
};

// ---------- preview stills ----------
const Look: React.FC<{p: V3; t: V3; fov?: number}> = ({p, t, fov = 40}) => {
	const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	cam.position.set(...p);
	cam.fov = fov;
	cam.lookAt(...t);
	cam.updateProjectionMatrix();
	return null;
};

export const CoverPreview: React.FC<{view: 'recreation' | 'pixel'}> = ({view}) => {
	const font = useBlockFont();
	const ready = useCoverTextures(COVERS);
	if (!font || !ready) return null;
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<ThreeCanvas width={1080} height={1920} shadows="basic">
				<SkyDome top="#1a1a2a" bottom="#3a3a4a" />
				<Lights keyPos={[4, 10, 14]} keyI={2.0} fill={0.9} rim="#a8c0ff" />
				{view === 'recreation' ? (
					<>
						<Look p={[0.2, 0, 54]} t={[0, 0, 0]} fov={17} />
						<ChosenOneCover />
					</>
				) : (
					<>
						<Look p={[0, 1.2, 9]} t={[0, 1.2, 0]} />
						{COVERS.map((n, i) => (
							<group key={n}>
								<PixelMag name={n} w={2.2} pos={[(i % 2 ? 1.25 : -1.25), i < 2 ? 3.0 : -0.4, 0]} rot={[-0.05, i % 2 ? -0.12 : 0.12, 0]} />
							</group>
						))}
						<B size={[6, 0.2, 1]} pos={[0, -2.4, 0]} color="#5a4a3a" />
					</>
				)}
				<PS1Pass />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
