import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {onTwos} from '../anim';
import {tex64} from '../ps1/ps1';
import {rnd} from './materials';

// ATMOSPHERE library: sky gradient + distance fog (atmospheric perspective), drifting mist bands,
// a sun-glint path on water, volumetric-looking light shafts, and a story light rig
// (sun key + sky fill + hot rim + camera-side fill) with shadow frustum sized to the set.
type V3 = [number, number, number];

// Sky dome with 3 colour stops (zenith / mid / horizon) + optional sun-side warm glow.
export const Sky3: React.FC<{top: string; mid: string; horizon: string; below?: string; fog?: string; near?: number; far?: number; sunDir?: V3; glowCol?: string}> = ({top, mid, horizon, below, fog, near = 40, far = 220, sunDir, glowCol = '#ffd8a0'}) => {
	const scene = useThree((s) => s.scene);
	scene.background = new THREE.Color(horizon);
	scene.fog = fog ? new THREE.Fog(fog, near, far) : null;
	const geo = useMemo(() => {
		const g = new THREE.SphereGeometry(260, 24, 12);
		const T = new THREE.Color(top);
		const M = new THREE.Color(mid);
		const H = new THREE.Color(horizon);
		const G = new THREE.Color(glowCol);
		const B = new THREE.Color(below ?? '#' + H.clone().multiplyScalar(0.45).getHexString());
		const sd = sunDir ? new THREE.Vector3(...sunDir).normalize() : null;
		const p = g.attributes.position;
		const col: number[] = [];
		const v = new THREE.Vector3();
		for (let i = 0; i < p.count; i++) {
			v.set(p.getX(i), p.getY(i), p.getZ(i)).normalize();
			const y = Math.max(0, v.y);
			// below the horizon (seen through/reflected in water): darker, so water doesn't glow
			const c = v.y < -0.02 ? H.clone().lerp(B, Math.min(1, -v.y * 4)) : y < 0.18 ? H.clone().lerp(M, y / 0.18) : M.clone().lerp(T, Math.min(1, (y - 0.18) / 0.6));
			if (sd) c.lerp(G, Math.pow(Math.max(0, v.dot(sd)), 6) * 0.8);
			col.push(c.r, c.g, c.b);
		}
		g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
		return g;
	}, [top, mid, horizon, below, glowCol, sunDir]);
	const m = useMemo(() => new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false}), []);
	return <mesh geometry={geo} material={m} renderOrder={-10} />;
};

// Soft-edged 64-px alpha texture for mist (blotchy, dithered by the PS1 pass).
const mistTex = (seed: number) =>
	tex64((g) => {
		const r = rnd(seed);
		g.clearRect(0, 0, 64, 64);
		for (let i = 0; i < 260; i++) {
			const x = r() * 64;
			const y = 20 + (r() - 0.5) * 30 * r();
			const a = 0.05 + r() * 0.12;
			g.fillStyle = `rgba(255,255,255,${a})`;
			g.fillRect(Math.floor(x), Math.floor(y), 6 + Math.floor(r() * 10), 2 + Math.floor(r() * 4));
		}
	});

// Horizontal mist bands drifting over water/fields.
export const Mist: React.FC<{f: number; bands: {y: number; z: number; w?: number; d?: number; op?: number}[]; color?: string; speed?: number; seed?: number}> = ({f, bands, color = '#ffe8d0', speed = 0.01, seed = 3}) => {
	const mats = useMemo(
		() =>
			bands.map((b, i) => {
				const t = mistTex(seed + i);
				t.wrapS = t.wrapT = THREE.RepeatWrapping;
				t.repeat.set(2, 1);
				return new THREE.MeshBasicMaterial({map: t, color, transparent: true, opacity: b.op ?? 0.8, depthWrite: false, side: THREE.DoubleSide});
			}),
		[bands, color, seed],
	);
	const ff = onTwos(f);
	mats.forEach((m, i) => (m.map!.offset.x = ff * speed * (i % 2 ? 0.6 : 1) * 0.1 + i * 0.3));
	return (
		<group>
			{bands.map((b, i) => (
				<mesh key={i} position={[0, b.y, b.z]} rotation={[-Math.PI / 2 + 0.25, 0, 0]} material={mats[i]}>
					<planeGeometry args={[b.w ?? 160, b.d ?? 10]} />
				</mesh>
			))}
		</group>
	);
};

// Glittering sun path on water: an additive strip from the horizon under the sun toward the camera.
export const SunPath: React.FC<{f: number; from: V3; to: V3; w?: number; color?: string; y?: number; op?: number}> = ({f, from, to, w = 6, color = '#ffd890', y = 0.03, op = 0.9}) => {
	const m = useMemo(() => {
		const t = tex64((g) => {
			g.clearRect(0, 0, 32, 64);
			const r = rnd(12);
			for (let i = 0; i < 90; i++) {
				const x = Math.floor(16 + (r() - 0.5) * 30 * r());
				g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`;
				g.fillRect(x, Math.floor(r() * 64), 2 + Math.floor(r() * 4), 1);
			}
		}, 32, 64);
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set(1, 6);
		return new THREE.MeshBasicMaterial({map: t, color: new THREE.Color(color).multiplyScalar(2.2), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});
	}, [color, op]);
	const ff = onTwos(f);
	m.map!.offset.y = (ff * 0.013) % 1;
	const dx = to[0] - from[0];
	const dz = to[2] - from[2];
	const L = Math.hypot(dx, dz);
	return (
		<mesh position={[(from[0] + to[0]) / 2, y, (from[2] + to[2]) / 2]} rotation={[-Math.PI / 2, 0, Math.atan2(dx, dz) + Math.PI]} material={m}>
			<planeGeometry args={[w, L]} />
		</mesh>
	);
};

// Light shafts: thin additive boxes fanning from a source (sun through trees, window beams).
export const Shafts: React.FC<{from: V3; dir: V3; n?: number; len?: number; spread?: number; w?: number; color?: string; op?: number; f?: number}> = ({from, dir, n = 5, len = 30, spread = 0.25, w = 1.2, color = '#ffe0a8', op = 0.12, f = 0}) => {
	const m = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color(color), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false}), [color, op]);
	const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...dir).normalize()), [dir]);
	const e = new THREE.Euler().setFromQuaternion(q);
	const ff = onTwos(f);
	return (
		<group position={from} rotation={e}>
			{Array.from({length: n}, (_, i) => {
				const a = (i / Math.max(1, n - 1) - 0.5) * spread;
				return (
					<mesh key={i} position={[Math.sin(a) * len * 0.5, Math.sin(a * 1.7) * len * 0.3, len / 2]} rotation={[a * 0.5, a, 0]} material={m} scale={[1, 1, 1 + Math.sin(ff * 0.02 + i) * 0.05]}>
						<boxGeometry args={[w * (0.6 + (i % 3) * 0.3), w * 0.4, len]} />
					</mesh>
				);
			})}
		</group>
	);
};

// Story light rig. `sun` = direction TO the sun (key comes from there, casting long shadows);
// (aims at the world origin, so keep the action near it) sky fill (hemisphere), hot rim from behind the subject, soft fill from the camera side.
export const SunRig: React.FC<{sun: V3; key?: string; keyI?: number; sky: string; ground: string; hemi?: number; rim?: string; rimI?: number; rimDir?: V3; fill?: number; fillDir?: V3; fillCol?: string; span?: number; center?: V3}> = ({
	sun,
	key: keyCol = '#ffc890',
	keyI = 3,
	sky,
	ground,
	hemi = 0.5,
	rim = '#ffd8a0',
	rimI = 1.5,
	rimDir = [-4, 6, -12],
	fill = 0.35,
	fillDir = [0, 4, 16],
	fillCol = '#cfe0ff',
	span = 30,
	center = [0, 0, 0],
}) => {
	const d = new THREE.Vector3(...sun).normalize().multiplyScalar(60);
	return (
		<>
			<hemisphereLight args={[sky, ground, hemi]} />
			<directionalLight
				position={[center[0] + d.x, center[1] + d.y, center[2] + d.z]}
				intensity={keyI}
				color={keyCol}
				castShadow
				shadow-mapSize={[2048, 2048]}
				shadow-bias={-0.0015}
				shadow-normalBias={0.02}
				shadow-camera-left={-span}
				shadow-camera-right={span}
				shadow-camera-top={span}
				shadow-camera-bottom={-span}
				shadow-camera-near={1}
				shadow-camera-far={140}
			/>
			<directionalLight position={rimDir} intensity={rimI} color={rim} />
			<directionalLight position={fillDir} intensity={fill} color={fillCol} />
		</>
	);
};
