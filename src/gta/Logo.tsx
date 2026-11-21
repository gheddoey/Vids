import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {AbsoluteFill} from 'remotion';
import {useBlockFont} from '../BlockText';
import {RBox} from '../parts';
import {Shadowed} from '../lebron/sets';

// Our own title design for the GTA origins short: chrome-faced block letters on an asphalt slab
// with a yellow road-stripe underline. Deliberately not the real logo's font or boxed layout.

const W = 1080;
const H = 1920;

const Env: React.FC = () => {
	const {gl, scene} = useThree();
	useMemo(() => {
		const pm = new THREE.PMREMGenerator(gl);
		scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.background = new THREE.Color('#07080c');
		scene.fog = new THREE.Fog('#07080c', 18, 40);
	}, [gl, scene]);
	return null;
};

const chrome = new THREE.MeshStandardMaterial({color: '#f2f5f8', metalness: 1, roughness: 0.12, flatShading: true});
const edge = new THREE.MeshStandardMaterial({color: '#1a1b1f', metalness: 0.6, roughness: 0.35, flatShading: true});
const gold = new THREE.MeshStandardMaterial({color: '#ffc21a', metalness: 0.85, roughness: 0.25, flatShading: true});

export const Word: React.FC<{text: string; size: number; y: number; face?: THREE.Material; tilt?: number}> = ({text, size, y, face = chrome, tilt = 0}) => {
	const font = useBlockFont();
	const geo = useMemo(() => {
		if (!font) return null;
		const g = new TextGeometry(text, {font, size, depth: size * 0.42, curveSegments: 2, bevelEnabled: true, bevelThickness: size * 0.07, bevelSize: size * 0.045, bevelSegments: 2});
		g.computeBoundingBox();
		const b = g.boundingBox!;
		g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -size * 0.21);
		return g;
	}, [font, text, size]);
	if (!geo) return null;
	return <mesh geometry={geo} material={[face, edge]} position={[0, y, 0]} rotation={[0, 0, tilt]} castShadow receiveShadow />;
};

// Road stripe underline: dashed yellow bars with a thin chrome kerb.
const Stripe: React.FC<{y: number; w: number}> = ({y, w}) => {
	const n = 5;
	const gap = 0.18;
	const seg = (w - gap * (n - 1)) / n;
	return (
		<group position={[0, y, 0]}>
			<RBox size={[w + 0.4, 0.5, 0.5]} pos={[0, 0, -0.12]} color="#16171a" />
			{Array.from({length: n}).map((_, i) => (
				<mesh key={i} position={[-w / 2 + seg / 2 + i * (seg + gap), 0, 0.16]} material={gold} castShadow>
					<boxGeometry args={[seg, 0.24, 0.16]} />
				</mesh>
			))}
		</group>
	);
};

// Speckled aggregate so the slab reads as asphalt, not painted board.
const Gravel: React.FC = () => {
	const ref = React.useRef<THREE.InstancedMesh>(null);
	React.useLayoutEffect(() => {
		const m = ref.current!;
		let seed = 7;
		const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
		const o = new THREE.Object3D();
		const c = new THREE.Color();
		for (let i = 0; i < 900; i++) {
			o.position.set((r() - 0.5) * 9.4, (r() - 0.5) * 8.2 + 0.1, -0.44);
			const k = 0.03 + r() * 0.06;
			o.scale.set(k, k, 0.02);
			o.rotation.z = r() * 3;
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
			m.setColorAt(i, c.set(r() > 0.5 ? '#3a3b40' : '#26272c'));
		}
		m.instanceMatrix.needsUpdate = true;
	}, []);
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, 900]}>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial roughness={1} />
		</instancedMesh>
	);
};

export const LogoBlock: React.FC = () => (
	<group>
		{/* asphalt slab behind the letters, with chipped corners */}
		<RBox size={[9.6, 8.4, 0.5]} pos={[0, 0.1, -0.7]} color="#141519" rough={0.95} />
		<Gravel />
		<RBox size={[9.9, 0.35, 0.6]} pos={[0, 4.35, -0.65]} color="#2a2b30" />
		<RBox size={[9.9, 0.35, 0.6]} pos={[0, -4.15, -0.65]} color="#2a2b30" />
		<Word text="GRAND" size={1.85} y={2.6} />
		<Word text="THEFT" size={1.85} y={0.15} />
		<Word text="AUTO" size={2.35} y={-2.55} face={gold} />
		<Stripe y={-4.2 + 0.05} w={8.6} />
	</group>
);

const Scene: React.FC = () => (
	<>
		<Env />
		<hemisphereLight args={['#5a6a90', '#1a1410', 0.5]} />
		{/* streetlamp key from top-left, warm sodium */}
		<Shadowed pos={[-6, 12, 9]} color="#ffb768" intensity={2.4} size={10} />
		{/* cool rim from behind */}
		<directionalLight position={[6, 4, -8]} color="#6fb6ff" intensity={2.2} />
		{/* soft camera-side fill */}
		<directionalLight position={[0, 1, 12]} color="#ffffff" intensity={0.25} />
		{/* headlight sweep catching the right side */}
		<pointLight position={[7, -2, 4]} color="#fff4d6" intensity={40} distance={18} />
		<group rotation={[-0.08, -0.12, 0]}>
			<LogoBlock />
		</group>
		{/* streetlamp at left edge */}
		<RBox size={[0.35, 16, 0.35]} pos={[-7.2, 2.8, -3]} color="#2c2e33" />
		<RBox size={[2.2, 0.3, 0.4]} pos={[-6.2, 10.7, -3]} color="#2c2e33" />
		<mesh position={[-5.3, 10.45, -3]}><boxGeometry args={[0.8, 0.2, 0.5]} /><meshStandardMaterial color="#ffd49a" emissive="#ffb460" emissiveIntensity={3} /></mesh>
		<pointLight position={[-5.3, 9.8, -2]} color="#ffb460" intensity={30} distance={16} />
		{/* asphalt ground with lane paint */}
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.2, 0]} receiveShadow>
			<planeGeometry args={[60, 60]} />
			<meshStandardMaterial color="#121316" roughness={0.9} />
		</mesh>
		{[-12, -6, 6, 12].map((z) => (
			<RBox key={z} size={[0.3, 0.03, 2.2]} pos={[-7.5, -5.18, z * 0.5 + 2]} color="#e6e2d4" />
		))}
	</>
);

const CamSet: React.FC = () => {
	const {camera} = useThree();
	camera.position.set(0.8, -1.2, 27);
	camera.lookAt(0, -0.2, 0);
	(camera as THREE.PerspectiveCamera).fov = 42;
	(camera as THREE.PerspectiveCamera).updateProjectionMatrix();
	return null;
};

export const GtaLogoStill: React.FC = () => {
	const font = useBlockFont();
	if (!font) return null;
	return (
		<AbsoluteFill style={{background: '#07080c', filter: 'saturate(1.05) contrast(1.05)'}}>
			<ThreeCanvas width={W} height={H} shadows gl={{toneMapping: THREE.ACESFilmicToneMapping}}>
				<CamSet />
				<Scene />
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
