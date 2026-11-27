import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {BlockText} from '../BlockText';
import {onTwos} from '../anim';
import {Bx, flat, glow, mat, rnd, tint} from '../env';

// Ali props: bicycle, boxing glove (sliceable), ring, instanced arena crowd with flashbulbs, 1950s car.
type V3 = [number, number, number];
const PI = Math.PI;

// ---------- 1950s kid's bicycle (red + white, balloon tyres) ----------
const Wheel: React.FC<{p: V3; r?: number; spin?: number}> = ({p, r = 1.1, spin = 0}) => (
	<group position={p} rotation={[0, 0, spin]}>
		{Array.from({length: 12}, (_, i) => {
			const a = (i / 12) * PI * 2;
			return <Bx key={i} s={[0.6, 0.16, 0.16]} p={[Math.cos(a) * r, Math.sin(a) * r, 0]} r={[0, 0, a + PI / 2]} m={flat('#1a1a1a')} />;
		})}
		{[0, 1, 2].map((i) => <Bx key={`s${i}`} s={[r * 2, 0.03, 0.03]} r={[0, 0, (i / 3) * PI]} m={flat('#c8c8c8')} cast={false} />)}
	</group>
);
export const Bicycle: React.FC<{p?: V3; r?: number; spin?: number; lean?: number}> = ({p = [0, 0, 0], r = 0, spin = 0, lean = 0}) => {
	const red = flat('#c8262a');
	const white = flat('#f2f0e8');
	return (
		<group position={p} rotation={[0, r, lean]}>
			<group rotation={[0, PI / 2, 0]}>
				<Wheel p={[-1.5, 1.1, 0]} spin={spin} />
				<Wheel p={[1.6, 1.1, 0]} spin={spin} />
				<Bx s={[2.6, 0.2, 0.2]} p={[0.1, 2.1, 0]} m={red} />
				<Bx s={[2.0, 0.2, 0.2]} p={[0.0, 1.55, 0]} r={[0, 0, 0.55]} m={red} />
				<Bx s={[0.2, 1.4, 0.2]} p={[-0.6, 1.6, 0]} r={[0, 0, -0.25]} m={red} />
				<Bx s={[1.4, 0.5, 0.35]} p={[0.3, 1.75, 0]} m={white} />
				<Bx s={[0.2, 1.3, 0.2]} p={[1.5, 1.8, 0]} r={[0, 0, 0.2]} m={white} />
				<Bx s={[0.15, 0.15, 1.5]} p={[1.4, 2.5, 0]} m={flat('#c8c8c8')} />
				<Bx s={[0.9, 0.2, 0.5]} p={[-0.8, 2.4, 0]} m={flat('#3a2a1a')} />
				<Bx s={[0.5, 0.15, 1.2]} p={[-1.5, 1.6, 0]} m={white} />
				<Bx s={[0.6, 0.3, 0.3]} p={[1.9, 2.0, 0]} m={glow('#fff4d0', 0.6)} />
			</group>
		</group>
	);
};

// ---------- boxing glove: padded box, thumb, laced cuff; `half` shows the cut face (slice-open) ----------
export const Glove: React.FC<{color?: string; half?: boolean; s?: number}> = ({color = '#b82a2a', half, s = 1}) => {
	const leather = mat('fabric', {base: color, alt: tint(color, -0.2), seed: 4}, 1, 1);
	return (
		<group scale={s}>
			<Bx s={[half ? 0.55 : 1.1, 1.3, 1.25]} p={[half ? -0.275 : 0, 0, 0]} m={leather} />
			<Bx s={[0.4, 0.7, 0.5]} p={[-0.62, -0.1, 0.25]} m={leather} />
			<Bx s={[0.95, 0.6, 1.05]} p={[half ? -0.24 : 0, -0.9, 0]} m={flat(tint(color, -0.1))} />
			<Bx s={[half ? 0.5 : 0.98, 0.1, 1.07]} p={[half ? -0.25 : 0, -1.1, 0]} m={flat('#f2f0e8')} />
			{half ? (
				// the cut face: leather shell, felt liner, packed horsehair padding, the fist cavity
				<group position={[0.005, 0, 0]}>
					<Bx s={[0.02, 1.3, 1.25]} m={flat(tint(color, -0.3))} />
					<Bx s={[0.03, 1.12, 1.07]} m={flat('#e8dcc0')} />
					<Bx s={[0.04, 1.0, 0.95]} m={mat('thatch', {base: '#5a4030', seed: 9}, 1, 1)} />
					<Bx s={[0.05, 0.5, 0.45]} p={[0, -0.15, 0.05]} m={flat('#1a1210')} />
				</group>
			) : null}
		</group>
	);
};

// ---------- the ring: raised canvas, apron, posts, 4 ropes, corner pads, steps, overhead light rig ----------
export const Ring: React.FC<{f: number; size?: number; corner?: [string, string]; ropeBow?: number; bowSide?: number; lights?: boolean}> = ({f, size = 20, corner = ['#b82a2a', '#2a4a9a'], ropeBow = 0, bowSide = 0, lights = true}) => {
	const h = 2.2;
	const half = size / 2;
	const canvas = mat('fabric', {base: '#e8e0cc', alt: '#d8ceb8', seed: 3}, 6, 6);
	const ff = onTwos(f);
	return (
		<group>
			<Bx s={[size + 2, h, size + 2]} p={[0, h / 2, 0]} m={mat('fabric', {base: '#2a2a30', alt: '#1a1a20', seed: 5}, 6, 1)} />
			<Bx s={[size + 1.6, 0.2, size + 1.6]} p={[0, h + 0.1, 0]} m={canvas} />
			{[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z], i) => (
				<group key={i} position={[x * half, h, z * half]}>
					<Bx s={[0.5, 5.0, 0.5]} p={[0, 2.5, 0]} m={flat('#8a8a8a')} />
					<Bx s={[0.8, 3.6, 0.8]} p={[0, 2.2, 0]} m={flat(i === 0 ? corner[0] : i === 2 ? corner[1] : '#f2f0e8')} />
				</group>
			))}
			{/* ropes: four strands per side; one side can bow outward (rope-a-dope) */}
			{[1.3, 2.3, 3.3, 4.3].map((y, k) =>
				[0, 1, 2, 3].map((sd) => {
					const a = (sd * PI) / 2;
					const bow = sd === bowSide ? ropeBow * (1 - k * 0.15) : 0;
					return (
						<group key={`${k}-${sd}`} rotation={[0, a, 0]}>
							{[-1, 0, 1].map((seg) => (
								<Bx key={seg} s={[size / 3 + 0.1, 0.12, 0.12]} p={[seg * (size / 3), h + y, half + (seg === 0 ? bow : bow * 0.55) + Math.sin(ff * 0.2 + k) * 0.01]} r={[0, seg * -bow * 0.12, 0]} m={flat(k % 2 ? '#c82a2a' : '#f2f0e8')} cast={false} />
							))}
						</group>
					);
				}),
			)}
			{/* corner stools + water bucket, steps */}
			{[[-1, -1], [1, 1]].map(([x, z], i) => (
				<group key={`st${i}`} position={[x * (half - 1.3), h, z * (half - 1.3)]}>
					<Bx s={[1.0, 0.2, 1.0]} p={[0, 1.6, 0]} m={flat('#5a3a22')} />
					{[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([a, b], j) => <Bx key={j} s={[0.1, 1.6, 0.1]} p={[a, 0.8, b]} m={flat('#5a3a22')} />)}
				</group>
			))}
			{lights ? (
				// the classic overhead rig: a square frame of hot lamps above the canvas
				<group position={[0, h + 17, 0]}>
					{[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([x, z], i) => <Bx key={i} s={[x ? 0.3 : size, 0.3, z ? 0.3 : size]} p={[(x * size) / 2, 0, (z * size) / 2]} m={flat('#2a2a2a')} />)}
					{Array.from({length: 12}, (_, i) => {
						const t = (i / 12) * 4;
						const sd = Math.floor(t);
						const u = (t - sd - 0.5) * size;
						const pos: V3 = sd === 0 ? [u, -0.3, -size / 2] : sd === 1 ? [size / 2, -0.3, u] : sd === 2 ? [-u, -0.3, size / 2] : [-size / 2, -0.3, -u];
						return <Bx key={`l${i}`} s={[0.9, 0.5, 0.9]} p={pos} m={glow('#fff4d8', 3)} cast={false} />;
					})}
				</group>
			) : null}
		</group>
	);
};

// ---------- instanced arena crowd: tiers of little people around a rectangle, flashbulbs popping ----------
export const ArenaCrowd: React.FC<{f: number; inner?: number; rows?: number; rise?: number; step?: number; seed?: number; flash?: number; cols?: string[]; sides?: number[]; cheer?: number}> = ({
	f,
	inner = 16,
	rows = 14,
	rise = 1.6,
	step = 2.4,
	seed = 3,
	flash = 0.02,
	cols = ['#e8e0cc', '#2a2c34', '#c84a3a', '#3a5a8a', '#d8b84a', '#f2f0e8', '#5a4a3a'],
	sides = [0, 1, 2, 3],
	cheer = 0,
}) => {
	const body = useRef<THREE.InstancedMesh>(null);
	const head = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
	const m = useMemo(() => new THREE.MeshLambertMaterial({color: '#ffffff', flatShading: true}), []);
	const items = useMemo(() => {
		const r = rnd(seed);
		const out: {p: V3; c: string; skin: string; ph: number}[] = [];
		for (const sd of sides)
			for (let row = 0; row < rows; row++) {
				const d = inner + row * step;
				for (let u = -d; u < d; u += 1.5 + r() * 0.4) {
					if (r() < 0.06) continue;
					const p: V3 = sd === 0 ? [u, row * rise, -d] : sd === 1 ? [d, row * rise, u] : sd === 2 ? [-u, row * rise, d] : [-d, row * rise, -u];
					out.push({p, c: cols[Math.floor(r() * cols.length)], skin: ['#8a5a3a', '#c89a74', '#5e3c2a', '#e0b48a', '#a87a58'][Math.floor(r() * 5)], ph: r() * 6.28});
				}
			}
		return out;
	}, [inner, rows, rise, step, seed, cols, sides]);
	const ff = onTwos(f);
	useLayoutEffect(() => {
		const o = new THREE.Object3D();
		const c = new THREE.Color();
		items.forEach((t, i) => {
			const jump = cheer > 0 ? Math.max(0, Math.sin(ff * 0.5 + t.ph)) * 0.6 * cheer : Math.sin(ff * 0.05 + t.ph) * 0.05;
			o.position.set(t.p[0], t.p[1] + 1.2 + jump, t.p[2]);
			o.scale.set(1.2, 2.0, 0.8);
			o.rotation.set(0, 0, 0);
			o.updateMatrix();
			body.current!.setMatrixAt(i, o.matrix);
			body.current!.setColorAt(i, c.set(t.c));
			o.position.set(t.p[0], t.p[1] + 2.65 + jump, t.p[2]);
			o.scale.set(0.75, 0.85, 0.75);
			o.updateMatrix();
			head.current!.setMatrixAt(i, o.matrix);
			head.current!.setColorAt(i, c.set(t.skin));
		});
		body.current!.instanceMatrix.needsUpdate = true;
		head.current!.instanceMatrix.needsUpdate = true;
		if (body.current!.instanceColor) body.current!.instanceColor.needsUpdate = true;
		if (head.current!.instanceColor) head.current!.instanceColor.needsUpdate = true;
	});
	const pops = useMemo(() => items.filter((_, i) => (i * 7919) % 97 < 97 * flash * 10), [items, flash]);
	return (
		<group>
			<instancedMesh ref={body} args={[geo, m, items.length]} />
			<instancedMesh ref={head} args={[geo, m, items.length]} />
			{/* tier steps under the crowd */}
			{sides.map((sd) =>
				Array.from({length: rows}, (_, row) => {
					const d = inner + row * step;
					const pos: V3 = sd === 0 ? [0, row * rise - 0.1, -d] : sd === 1 ? [d, row * rise - 0.1, 0] : sd === 2 ? [0, row * rise - 0.1, d] : [-d, row * rise - 0.1, 0];
					return <Bx key={`${sd}-${row}`} s={sd % 2 ? [step, 0.4, d * 2 + step] : [d * 2 + step, 0.4, step]} p={pos} m={flat(tint('#3a3430', (row % 2) * 0.05))} cast={false} />;
				}),
			)}
			{pops.map((t, i) => ((ff + i * 13) % 37 < 2 ? <Bx key={`f${i}`} s={[0.5, 0.5, 0.5]} p={[t.p[0], t.p[1] + 2.4, t.p[2]]} m={glow('#ffffff', 6)} cast={false} /> : null))}
		</group>
	);
};

// ---------- 1950s rounded-fender sedan (two-tone) ----------
export const Car50: React.FC<{p?: V3; r?: number; color?: string; roof?: string}> = ({p = [0, 0, 0], r = 0, color = '#3a6a8a', roof = '#f2f0e8'}) => {
	const body = flat(color);
	return (
		<group position={p} rotation={[0, r, 0]}>
			<Bx s={[2.6, 1.0, 6.2]} p={[0, 1.0, 0]} m={body} />
			{[-1, 1].map((k) => <Bx key={k} s={[2.75, 0.8, 1.6]} p={[0, 0.95, k * 2.1]} m={body} />)}
			<Bx s={[2.3, 0.95, 2.8]} p={[0, 1.95, -0.3]} m={flat(roof)} />
			<Bx s={[2.32, 0.6, 2.5]} p={[0, 1.95, -0.3]} m={flat('#2a3440')} />
			<Bx s={[2.7, 0.25, 0.25]} p={[0, 0.65, 3.15]} m={flat('#d8d8d8')} />
			<Bx s={[2.7, 0.25, 0.25]} p={[0, 0.65, -3.15]} m={flat('#d8d8d8')} />
			{[-0.85, 0.85].map((x) => <Bx key={x} s={[0.45, 0.45, 0.1]} p={[x, 1.1, 3.12]} m={flat('#f2f0d8')} />)}
			{[-2.1, 2.1].flatMap((z) =>
				[-1, 1].map((x) => (
					<mesh key={`${z}${x}`} position={[x * 1.2, 0.45, z]} rotation={[0, 0, PI / 2]} material={flat('#141414')} castShadow>
						<cylinderGeometry args={[0.45, 0.45, 0.35, 8]} />
					</mesh>
				)),
			)}
		</group>
	);
};

// ---------- 3D sign with a frame (no flat graphics) ----------
export const Sign3D: React.FC<{text: string; p: V3; r?: number; size?: number; w?: number; color?: string; bg?: string; lit?: boolean}> = ({text, p, r = 0, size = 0.5, w, color = '#c8262a', bg = '#f2ead2', lit}) => (
	<group position={p} rotation={[0, r, 0]}>
		<Bx s={[w ?? text.length * size * 0.75 + 1, size * 2, 0.2]} m={lit ? glow(bg, 1.2) : flat(bg)} />
		<BlockText text={text} size={size} depth={0.08} color={color} position={[0, -size * 0.45, 0.12]} />
	</group>
);
