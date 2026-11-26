import React, {useMemo} from 'react';
import * as THREE from 'three';

// GRAPHIC ACCENTS (use sparingly, only on story beats): 3D impact bursts, speed lines, and a smear
// ghost for very fast limbs. All boxes, glowing slightly so the grade blooms them.
type V3 = [number, number, number];

// Impact frame: radiating spikes around a point for `len` frames after `at` (on ones).
export const Impact: React.FC<{f: number; at: number; pos: V3; color?: string; n?: number; r?: number; len?: number}> = ({f, at, pos, color = '#fff2c0', n = 12, r = 1.2, len = 6}) => {
	const t = f - at;
	const m = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color(color).multiplyScalar(2), toneMapped: false}), [color]);
	if (t < 0 || t >= len) return null;
	const k = t / len;
	return (
		<group position={pos}>
			{Array.from({length: n}, (_, i) => {
				const a = (i / n) * Math.PI * 2 + (i % 2) * 0.12;
				const d = r * (0.6 + k * 1.2) * (i % 2 ? 0.75 : 1);
				return (
					<mesh key={i} position={[Math.cos(a) * d, Math.sin(a) * d, 0]} rotation={[0, 0, a]} material={m} scale={[1 - k * 0.6, 1, 1]}>
						<boxGeometry args={[0.6 * (1 - k * 0.5), 0.06, 0.02]} />
					</mesh>
				);
			})}
		</group>
	);
};

// Speed lines streaming past a moving subject (direction `dir` in local space).
export const SpeedLines: React.FC<{f: number; pos: V3; dir?: number; n?: number; w?: number; h?: number; color?: string; op?: number}> = ({f, pos, dir = 0, n = 14, w = 6, h = 4, color = '#ffffff', op = 0.6}) => {
	const m = useMemo(() => new THREE.MeshBasicMaterial({color, transparent: true, opacity: op, depthWrite: false}), [color, op]);
	return (
		<group position={pos} rotation={[0, 0, dir]}>
			{Array.from({length: n}, (_, i) => {
				const y = ((i * 0.618) % 1 - 0.5) * h;
				const x = ((((i * 0.37 + f * 0.25) % 1) + 1) % 1 - 0.5) * w;
				return (
					<mesh key={i} position={[x, y, 0]} material={m}>
						<boxGeometry args={[0.8 + (i % 3) * 0.5, 0.04, 0.01]} />
					</mesh>
				);
			})}
		</group>
	);
};
