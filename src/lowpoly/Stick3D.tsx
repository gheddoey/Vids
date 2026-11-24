import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Ground, Mountains, Sky, Street} from './LowPoly';

// Stick characters rebuilt for low-poly worlds: faceted round head with a doodle face,
// soft bean torso, thin ink-coloured limbs, mitten hands, chunky shoes, and an
// ink outline (inverted hull) so they keep the hand-drawn look inside 3D.

const INK = '#45231f';
const SKIN = '#ececec';
type V3 = [number, number, number];
const PI = Math.PI;

const flat = (color: string) => new THREE.MeshStandardMaterial({color, flatShading: true, roughness: 0.8});
const inkMat = new THREE.MeshBasicMaterial({color: INK, side: THREE.BackSide});

// A mesh plus its outline shell.
const Inked: React.FC<{geo: THREE.BufferGeometry; mat: THREE.Material; pos?: V3; rot?: V3; scale?: V3 | number; line?: number}> = ({geo, mat, pos, rot, scale, line = 0.06}) => {
	const sc = typeof scale === 'number' ? [scale, scale, scale] : scale ?? [1, 1, 1];
	return (
		<group position={pos} rotation={rot} scale={sc as V3}>
			<mesh geometry={geo} material={mat} castShadow />
			<mesh geometry={geo} material={inkMat} scale={[1 + line / Math.max(0.2, sc[0] * 0 + 1), 1 + line, 1 + line]} />
		</group>
	);
};

export type Expr3 = 'happy' | 'talk' | 'shock' | 'sly' | 'neutral' | 'laugh';
// Face drawn on a canvas in the doodle style, mapped onto the front of the head.
const faceTex = (expr: Expr3) => {
	const c = document.createElement('canvas');
	c.width = c.height = 512;
	const g = c.getContext('2d')!;
	g.clearRect(0, 0, 512, 512);
	g.lineCap = 'round';
	g.lineJoin = 'round';
	g.strokeStyle = INK;
	g.fillStyle = INK;
	const eye = (x: number, y: number) => {
		if (expr === 'laugh' || expr === 'happy') {
			g.lineWidth = 16;
			g.beginPath();
			g.moveTo(x - 30, y + 10);
			g.quadraticCurveTo(x, y - 34, x + 30, y + 10);
			g.stroke();
			return;
		}
		const ry = expr === 'shock' ? 56 : expr === 'sly' ? 30 : 48;
		g.fillStyle = '#ffffff';
		g.lineWidth = 11;
		g.beginPath();
		g.ellipse(x, y + (expr === 'sly' ? 12 : 0), 38, ry, 0, 0, PI * 2);
		g.fill();
		g.stroke();
		g.fillStyle = INK;
		g.beginPath();
		g.arc(x + (expr === 'sly' ? 12 : 4), y + 10, expr === 'shock' ? 13 : 20, 0, PI * 2);
		g.fill();
		g.fillStyle = '#ffffff';
		g.beginPath();
		g.arc(x + 12, y, 7, 0, PI * 2);
		g.fill();
		if (expr === 'sly') {
			g.lineWidth = 13;
			g.beginPath();
			g.moveTo(x - 40, y - 8);
			g.lineTo(x + 40, y - 8);
			g.stroke();
		}
	};
	const brow = (x: number, y: number, side: number) => {
		const b = expr === 'sly' ? 1 : expr === 'shock' ? -1 : expr === 'neutral' ? 0 : -0.4;
		g.lineWidth = 18;
		g.beginPath();
		g.moveTo(x - side * 36, y + b * 18);
		g.quadraticCurveTo(x, y - 12, x + side * 36, y - b * 10);
		g.stroke();
	};
	eye(186, 236);
	eye(326, 236);
	brow(186, 160 - (expr === 'shock' ? 16 : 0), -1);
	brow(326, 160 - (expr === 'shock' ? 16 : 0), 1);
	// blush
	if (expr !== 'sly' && expr !== 'neutral') {
		g.fillStyle = 'rgba(240,138,138,0.5)';
		for (const x of [140, 372]) {
			g.beginPath();
			g.ellipse(x, 316, 34, 18, 0, 0, PI * 2);
			g.fill();
		}
	}
	// mouth
	g.lineWidth = 15;
	g.fillStyle = '#7a3a30';
	const my = 344;
	if (expr === 'laugh' || expr === 'talk') {
		g.beginPath();
		g.moveTo(206, my - 10);
		g.lineTo(306, my - 10);
		g.lineTo(284, my + (expr === 'laugh' ? 46 : 30));
		g.lineTo(228, my + (expr === 'laugh' ? 46 : 30));
		g.closePath();
		g.fill();
		g.stroke();
	} else if (expr === 'shock') {
		g.beginPath();
		g.ellipse(256, my + 10, 22, 30, 0, 0, PI * 2);
		g.fill();
		g.stroke();
	} else if (expr === 'sly') {
		g.beginPath();
		g.moveTo(210, my + 6);
		g.lineTo(262, my + 10);
		g.lineTo(304, my - 14);
		g.stroke();
	} else if (expr === 'happy') {
		g.beginPath();
		g.moveTo(214, my - 4);
		g.quadraticCurveTo(256, my + 34, 298, my - 4);
		g.stroke();
	} else {
		g.beginPath();
		g.moveTo(226, my);
		g.lineTo(286, my);
		g.stroke();
	}
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	return tex;
};

export type Look3 = {shirt: string; pants?: string; shoes?: string; hair?: 'tufts' | 'swoop' | 'cap' | 'bun'; hairCol?: string};
export type Pose3 = {armL: [number, number]; armR: [number, number]; legL: number; legR: number; lean: number; tilt: number; hop: number};
const REST3: Pose3 = {armL: [0.15, 0.1], armR: [0.15, 0.1], legL: 0, legR: 0, lean: 0, tilt: 0, hop: 0};

// One limb: two thin ink segments from a joint, with given swing (outward, z-axis) and forward (x-axis) angles.
const Limb: React.FC<{at: V3; out: number; fwd: number; bend: number; side: number; len: [number, number]; end: React.ReactNode; thick?: number; col?: string}> = ({at, out, fwd, bend, side, len, end, thick = 0.09, col = INK}) => {
	const m = useMemo(() => new THREE.MeshStandardMaterial({color: col, flatShading: true, roughness: 0.7}), [col]);
	const seg = (l: number) => (
		<mesh position={[0, -l / 2, 0]} material={m} castShadow>
			<cylinderGeometry args={[thick, thick * 1.05, l, 5]} />
		</mesh>
	);
	return (
		<group position={at} rotation={[fwd, 0, out * side]}>
			{seg(len[0])}
			<group position={[0, -len[0], 0]} rotation={[0, 0, bend * side]}>
				{seg(len[1])}
				<group position={[0, -len[1], 0]}>{end}</group>
			</group>
		</group>
	);
};

export const Stick3: React.FC<{look: Look3; expr?: Expr3; pose?: Partial<Pose3>; at: V3; rotY?: number; s?: number; walkF?: number}> = ({look, expr = 'happy', pose = {}, at, rotY = 0, s = 1, walkF}) => {
	const P = {...REST3, ...pose};
	const head = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
	const face = useMemo(() => faceTex(expr), [expr]);
	const faceGeo = useMemo(() => new THREE.SphereGeometry(1.012, 24, 16, PI * 0.5 - 0.95, 1.9, PI * 0.22, PI * 0.56), []);
	const torso = useMemo(() => {
		const pts = [
			[0.0, 0],
			[0.42, 0.04],
			[0.52, 0.3],
			[0.5, 0.75],
			[0.4, 1.05],
			[0.0, 1.12],
		].map(([x, y]) => new THREE.Vector2(x, y));
		return new THREE.LatheGeometry(pts, 8);
	}, []);
	const shoe = useMemo(() => {
		const g = new THREE.BoxGeometry(0.42, 0.26, 0.62, 1, 1, 1);
		return g;
	}, []);
	const mitt = useMemo(() => new THREE.IcosahedronGeometry(0.17, 0), []);
	const shirt = useMemo(() => flat(look.shirt), [look.shirt]);
	const skin = useMemo(() => new THREE.MeshStandardMaterial({color: SKIN, flatShading: true, roughness: 0.8, emissive: '#3a3438', emissiveIntensity: 0.35}), []);
	const shoeM = useMemo(() => flat(look.shoes ?? '#2a1a18'), [look.shoes]);
	const hairM = useMemo(() => flat(look.hairCol ?? INK), [look.hairCol]);

	const w = walkF !== undefined ? Math.sin(walkF * 0.35) : 0;
	const legL = P.legL + w * 0.5;
	const legR = P.legR - w * 0.5;
	const bob = walkF !== undefined ? Math.abs(Math.cos(walkF * 0.35)) * 0.08 : 0;
	const hipY = 1.25 + bob + P.hop;

	const shoeNode = <Inked geo={shoe} mat={shoeM} pos={[0, -0.05, 0.12]} line={0.12} />;
	const hand = <Inked geo={mitt} mat={skin} line={0.16} />;
	const tufts = useMemo(() => {
		if (look.hair !== 'tufts') return [];
		return [-0.35, 0, 0.35].map((x, i) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(x * 0.6, 0.9, 0), new THREE.Vector3(x * 0.9, 1.28, 0.05), new THREE.Vector3(x * 0.9 + (i - 1) * 0.25 + 0.15, 1.42, 0.02)]), 8, 0.05, 5));
	}, [look.hair]);

	return (
		<group position={at} rotation={[0, rotY, 0]} scale={s}>
			{/* ground shadow */}
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.02, 0]}>
				<circleGeometry args={[0.7, 10]} />
				<meshBasicMaterial color="#000" transparent opacity={0.22} />
			</mesh>
			{/* legs */}
			<Limb at={[-0.2, hipY, 0]} out={0.05} fwd={-legL} bend={0} side={-1} len={[0.62, 0.6]} end={shoeNode} />
			<Limb at={[0.2, hipY, 0]} out={0.05} fwd={-legR} bend={0} side={1} len={[0.62, 0.6]} end={shoeNode} />
			<group position={[0, hipY, 0]} rotation={[P.lean, 0, 0]}>
				{/* torso */}
				<Inked geo={torso} mat={shirt} pos={[0, -0.05, 0]} line={0.07} />
				{/* arms */}
				<Limb at={[-0.42, 0.92, 0]} out={P.armL[0]} fwd={-w * 0.6} bend={P.armL[1]} side={-1} len={[0.55, 0.52]} end={hand} />
				<Limb at={[0.42, 0.92, 0]} out={P.armR[0]} fwd={w * 0.6} bend={P.armR[1]} side={1} len={[0.55, 0.52]} end={hand} />
				{/* head */}
				<group position={[0, 1.95, 0]} rotation={[0, 0, P.tilt]}>
					<mesh geometry={head} material={skin} castShadow />
					<mesh geometry={head} material={inkMat} scale={1.06} />
					<mesh geometry={faceGeo}>
						<meshStandardMaterial map={face} transparent roughness={0.8} />
					</mesh>
					{tufts.map((g, i) => (
						<mesh key={i} geometry={g} material={hairM} />
					))}
					{look.hair === 'swoop' ? <Inked geo={useMemo(() => new THREE.SphereGeometry(1.03, 9, 6, 0, PI * 2, 0, PI * 0.33), [])} mat={hairM} rot={[-0.25, 0, 0.1]} line={0.03} /> : null}
					{look.hair === 'cap' ? (
						<group>
							<Inked geo={useMemo(() => new THREE.SphereGeometry(1.04, 9, 6, 0, PI * 2, 0, PI * 0.36), [])} mat={hairM} rot={[-0.1, 0, 0]} line={0.03} />
							<Inked geo={useMemo(() => new THREE.BoxGeometry(1.1, 0.08, 0.7), [])} mat={hairM} pos={[0, 0.58, 0.95]} rot={[0.15, 0, 0]} line={0.1} />
						</group>
					) : null}
					{look.hair === 'bun' ? (
						<group>
							<Inked geo={useMemo(() => new THREE.SphereGeometry(1.03, 9, 6, 0, PI * 2, 0, PI * 0.38), [])} mat={hairM} rot={[-0.3, 0, 0]} line={0.03} />
							<Inked geo={useMemo(() => new THREE.IcosahedronGeometry(0.38, 0), [])} mat={hairM} pos={[0, 1.05, -0.25]} line={0.08} />
						</group>
					) : null}
				</group>
			</group>
		</group>
	);
};

// ---------- mixed test scene ----------
const Cam: React.FC<{f: number; dur: number}> = ({f, dur}) => {
	const {camera} = useThree();
	const t = Easing.inOut(Easing.sin)(interpolate(f, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	camera.position.set(interpolate(t, [0, 1], [3.0, 0.6]), interpolate(t, [0, 1], [3.0, 4.0]), interpolate(t, [0, 1], [27, 22.5]));
	camera.lookAt(interpolate(t, [0, 1], [0.8, 0.4]), 3.6, 0);
	(camera as THREE.PerspectiveCamera).fov = 46;
	(camera as THREE.PerspectiveCamera).far = 1000;
	camera.updateProjectionMatrix();
	return null;
};

export const MIX_FRAMES = 120;
export const LowPolyMix: React.FC = () => {
	const f = useCurrentFrame();
	const wave = Math.sin(f * 0.4) * 0.35;
	return (
		<AbsoluteFill style={{background: '#2a1640'}}>
			<ThreeCanvas width={1080} height={1920} shadows gl={{toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05}}>
				<Cam f={f} dur={MIX_FRAMES} />
				<Sky />
				<hemisphereLight args={['#ffb0c8', '#3a2a5a', 1.0]} />
				<directionalLight position={[10, 18, -60]} color="#ffb070" intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-camera-far={160} shadow-bias={-0.0005} />
				<directionalLight position={[0, 6, 30]} color="#ffe8f0" intensity={1.0} />
				<directionalLight position={[-20, 12, 30]} color="#7a8aff" intensity={0.6} />
				<Ground />
				<Mountains />
				<Street f={f} />
				{/* hero waves at camera */}
				<Stick3 look={{shirt: '#5b7096', hair: 'tufts'}} expr={f % 60 < 30 ? 'happy' : 'talk'} pose={{armR: [1.9 + wave * 0.5, 0.9], armL: [0.2, 0.1], tilt: wave * 0.12}} at={[1.0, 0, 11]} s={1.55} />
				{/* friend strolling */}
				<Stick3 look={{shirt: '#e86a7a', hair: 'cap', hairCol: '#2e5a8a'}} expr="laugh" at={[-3.8, 0, 7 - f * 0.03]} rotY={0.3} s={1.45} walkF={f} />
				{/* sly one leaning by the lamp */}
				<Stick3 look={{shirt: '#f2d06a', hair: 'bun', hairCol: '#5a3a28'}} expr="sly" pose={{armL: [0.7, -1.9], armR: [0.7, -1.9], tilt: -0.1}} at={[6.6, 0.4, 6]} rotY={-0.5} s={1.4} />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
