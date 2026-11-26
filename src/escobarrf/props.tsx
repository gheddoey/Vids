import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {BlockText} from '../BlockText';
import {onTwos} from '../anim';
import {px, tex64} from '../ps1/ps1';
import {Bx, Window, flat, glow, mat, rnd, tint} from '../env';
import type {Look} from '../lowpoly/Rig';

// EscobarRF shared props: Medellín downtown towers, helicopter, 1980s car, street facades, extras.
type V3 = [number, number, number];
const PI = Math.PI;

// ---------- downtown towers (instanced), windows glow at dusk/night ----------
const towerTex = (lit: number) =>
	tex64((g) => {
		px(g, '#8a8478', 0, 0, 32, 64);
		const r = rnd(7);
		for (let y = 2; y < 64; y += 4)
			for (let x = 2; x < 32; x += 4) px(g, r() < lit ? (r() < 0.5 ? '#ffd890' : '#fff0c0') : '#3a4250', x, y, 2, 2);
	}, 32, 64);
export const Towers: React.FC<{center: V3; n?: number; spread?: [number, number]; lit?: number; seed?: number; h?: [number, number]}> = ({center, n = 60, spread = [120, 50], lit = 0.35, seed = 3, h = [10, 45]}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
	const m = useMemo(() => {
		const t = towerTex(lit);
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		return new THREE.MeshLambertMaterial({map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: lit > 0.2 ? 0.55 : 0.0, flatShading: true});
	}, [lit]);
	const items = useMemo(() => {
		const r = rnd(seed);
		return Array.from({length: n}, () => {
			const hh = h[0] + Math.pow(r(), 2) * (h[1] - h[0]);
			const w = 5 + r() * 6;
			return {p: [(r() - 0.5) * spread[0], hh / 2, (r() - 0.5) * spread[1]] as V3, s: [w, hh, w * (0.7 + r() * 0.5)] as V3};
		});
	}, [n, spread, seed, h]);
	useLayoutEffect(() => {
		const o = new THREE.Object3D();
		items.forEach((t, i) => {
			o.position.set(...t.p);
			o.scale.set(...t.s);
			o.updateMatrix();
			ref.current!.setMatrixAt(i, o.matrix);
		});
		ref.current!.instanceMatrix.needsUpdate = true;
	}, [items]);
	return (
		<group position={center}>
			<instancedMesh ref={ref} args={[geo, m, items.length]} />
		</group>
	);
};

// ---------- helicopter (generic utility helicopter, police/army green or white) ----------
export const Helicopter: React.FC<{f: number; color?: string; stripe?: string; s?: number}> = ({f, color = '#3a4a3a', stripe = '#e8e0c8', s = 1}) => {
	const ff = onTwos(f);
	const body = flat(color);
	return (
		<group scale={s}>
			<Bx s={[1.8, 1.7, 3.4]} p={[0, 1.6, 0]} m={body} />
			<Bx s={[1.6, 1.3, 1.2]} p={[0, 1.5, 2.1]} m={flat('#6a8aa8', {transparent: true, opacity: 0.85})} />
			<Bx s={[1.82, 0.25, 3.42]} p={[0, 1.3, 0]} m={flat(stripe)} />
			<Bx s={[0.5, 0.5, 4.5]} p={[0, 2.0, -3.8]} m={body} />
			<Bx s={[0.12, 1.3, 0.8]} p={[0, 2.6, -5.9]} m={body} />
			<Bx s={[1.6, 0.1, 0.5]} p={[0, 2.1, -5.6]} m={body} />
			<Bx s={[0.9, 0.5, 1.2]} p={[0, 2.65, -0.2]} m={flat('#2a2a2a')} />
			{[-0.9, 0.9].map((x) => (
				<group key={x}>
					<Bx s={[0.12, 0.12, 3.6]} p={[x, 0.3, 0.2]} m={flat('#2a2a2a')} />
					{[-0.8, 1.0].map((z) => <Bx key={z} s={[0.08, 0.6, 0.08]} p={[x * 0.85, 0.6, z]} m={flat('#2a2a2a')} />)}
				</group>
			))}
			{/* main rotor: spun on ones and blurred into a faint disc */}
			<group position={[0, 3.0, -0.2]} rotation={[0, f * 1.1, 0]}>
				<Bx s={[11, 0.06, 0.4]} m={flat('#1a1a1a')} cast={false} />
				<Bx s={[0.4, 0.06, 11]} m={flat('#1a1a1a')} cast={false} />
			</group>
			<mesh position={[0, 2.98, -0.2]} rotation={[-PI / 2, 0, 0]}>
				<circleGeometry args={[5.5, 16]} />
				<meshBasicMaterial color="#1a1a1a" transparent opacity={0.12} depthWrite={false} />
			</mesh>
			<group position={[0.15, 2.6, -5.9]} rotation={[ff * 1.3, 0, 0]}>
				<Bx s={[0.05, 1.6, 0.15]} m={flat('#1a1a1a')} cast={false} />
			</group>
		</group>
	);
};

// ---------- 1980s Colombian sedan (Renault 18 / Mazda 323 silhouette) ----------
export const Car80: React.FC<{p?: V3; r?: number; color?: string; lights?: boolean; burnt?: boolean}> = ({p = [0, 0, 0], r = 0, color = '#c8b890', lights, burnt}) => {
	const body = burnt ? mat('concrete', {base: '#2a2420', seed: 4, wear: 3}, 1, 1) : flat(color);
	const glass = burnt ? flat('#0a0808') : flat('#2a3440');
	return (
		<group position={p} rotation={[0, r, 0]}>
			<Bx s={[2.2, 0.8, 5.0]} p={[0, 0.85, 0]} m={body} />
			<Bx s={[2.0, 0.75, 2.6]} p={[0, 1.6, -0.2]} m={body} />
			<Bx s={[2.02, 0.55, 2.3]} p={[0, 1.62, -0.2]} m={glass} />
			<Bx s={[2.24, 0.12, 5.04]} p={[0, 0.7, 0]} m={flat(burnt ? '#1a1410' : '#2a2a2a')} />
			{[-1.6, 1.6].flatMap((z) =>
				[-1, 1].map((x) => (
					<mesh key={`${z}${x}`} position={[x * 1.05, 0.42, z]} rotation={[0, 0, PI / 2]} material={flat('#141414')} castShadow>
						<cylinderGeometry args={[0.42, 0.42, 0.3, 8]} />
					</mesh>
				)),
			)}
			{[-0.7, 0.7].map((x) => (
				<group key={x}>
					<Bx s={[0.45, 0.25, 0.06]} p={[x, 0.95, 2.52]} m={lights ? glow('#fff0c8', 3) : flat('#e8e8d8')} cast={false} />
					<Bx s={[0.45, 0.22, 0.06]} p={[x, 0.95, -2.52]} m={lights ? glow('#ff3a2a', 2) : flat('#8a2a2a')} cast={false} />
				</group>
			))}
			<Bx s={[1.4, 0.15, 0.08]} p={[0, 0.62, 2.54]} m={flat('#c8c8c8')} />
		</group>
	);
};

// ---------- street facade: shop + upper floors with windows, balcony, awning, 3D sign ----------
export const Facade: React.FC<{p: V3; r?: number; w?: number; floors?: number; color?: string; sign?: string; signCol?: string; awning?: string; seed?: number; lit?: boolean}> = ({
	p,
	r = 0,
	w = 8,
	floors = 3,
	color = '#d8c8a0',
	sign,
	signCol = '#c83a2a',
	awning = '#2a6a4a',
	seed = 1,
	lit,
}) => {
	const R = rnd(seed);
	const FH = 3.6;
	const wall = mat('plaster', {base: color, alt: '#9a5a3a', seed, wear: 1.2}, w / 4, floors);
	const base = mat('plaster', {base: tint(color, -0.15), alt: '#7a4a2a', seed: seed + 1, wear: 2}, w / 4, 1);
	return (
		<group position={p} rotation={[0, r, 0]}>
			{/* body */}
			<Bx s={[w, FH * floors, 6]} p={[0, (FH * floors) / 2, -3]} m={wall} />
			<Bx s={[w + 0.02, 1.1, 6.02]} p={[0, 0.55, -3]} m={base} />
			<Bx s={[w + 0.4, 0.35, 6.4]} p={[0, FH * floors + 0.18, -3]} m={flat(tint(color, -0.25))} />
			{/* shop front: dark opening, shutter half up, awning, sign */}
			<Bx s={[w * 0.7, 2.6, 0.1]} p={[0, 1.4, 0.02]} m={lit ? glow('#ffc878', 0.9) : flat('#1e1a16')} cast={false} />
			<Bx s={[w * 0.72, 0.8, 0.14]} p={[0, 2.5, 0.06]} m={mat('tin', {base: '#8a8a88', seed: seed + 3, wear: 1}, 2, 1)} />
			<group position={[0, 3.0, 0.9]} rotation={[0.35, 0, 0]}>
				<Bx s={[w * 0.8, 0.08, 1.8]} m={mat('fabric', {base: awning, alt: '#e8e0d0', seed}, 4, 1)} />
			</group>
			{sign ? (
				<group position={[0, 3.55, 0.25]}>
					<Bx s={[Math.min(w * 0.8, sign.length * 0.55 + 0.8), 0.7, 0.12]} m={flat('#efe6d0')} />
					<BlockText text={sign} size={0.38} depth={0.06} color={signCol} position={[0, -0.18, 0.08]} />
				</group>
			) : null}
			{/* upper floors: windows with shutters, a balcony on one */}
			{Array.from({length: floors - 1}, (_, k) => {
				const y = FH * (k + 1) + 0.9;
				const n = Math.max(1, Math.floor(w / 3.2));
				const glowIt = lit && R() < 0.6;
				return (
					<group key={k}>
						{Array.from({length: n}, (_, j) => (
							<Window key={j} w={1.3} h={1.7} p={[(j - (n - 1) / 2) * (w / n), y, 0.05]} frame="#e8e0d0" shutters={['#3a6a5a', '#7a3a2a', '#4a5a8a'][(seed + j) % 3]} open={1.2 + R() * 0.3} lit={glowIt && j % 2 === 0 ? '#ffc070' : undefined} glass="#2a3038" />
						))}
						{k === 0 && seed % 2 === 0 ? (
							<group position={[0, y - 0.15, 0.7]}>
								<Bx s={[w * 0.6, 0.15, 1.3]} m={flat('#b8b0a0')} />
								{Array.from({length: 9}, (_, i) => <Bx key={i} s={[0.06, 1.0, 0.06]} p={[(i / 8 - 0.5) * w * 0.6, 0.5, 0.6]} m={flat('#2a2a2a')} />)}
								<Bx s={[w * 0.6, 0.08, 0.08]} p={[0, 1.0, 0.6]} m={flat('#2a2a2a')} />
								<mesh position={[w * 0.2, 0.4, 0.1]} material={flat('#a8542a')} castShadow>
									<cylinderGeometry args={[0.25, 0.2, 0.5, 6]} />
								</mesh>
								<Bx s={[0.6, 0.5, 0.6]} p={[w * 0.2, 0.85, 0.1]} m={flat('#3a7a2e')} />
							</group>
						) : null}
					</group>
				);
			})}
		</group>
	);
};

// ---------- extras: varied looks generated from palettes (different heights, features) ----------
const SKINS = ['#c89a74', '#a87a58', '#d8a882', '#b07a54', '#8a5a3a', '#e0b48a'];
const TOPS = ['#c84a3a', '#3a6aa8', '#e8d8b0', '#4a8a5a', '#e8a0b8', '#f2efe6', '#7a5a3a', '#2a2c34', '#d8b84a'];
const HAIR = ['#1a1410', '#2a2018', '#4a3a28', '#6a625a', '#1a1410'];
export const extraLook = (i: number): {look: Look; h: number} => {
	const r = rnd(i * 13 + 7);
	const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
	const female = r() < 0.45;
	const look: Look = {
		skin: pick(SKINS),
		eye: pick(['#3a2416', '#2a1a10', '#4a6a3a', '#5a3418']),
		hair: {style: female ? pick(['bun', 'curls', 'puffs'] as const) : pick(['short', 'curls', 'bald', 'flattop'] as const), color: pick(HAIR)},
		top: {kind: r() < 0.3 ? 'shirt' : 'tee', base: pick(TOPS), sleeves: r() < 0.5 ? 'short' : 'long', icon: r() < 0.15 ? 'plaid' : undefined},
		pants: pick(['#3a3a44', '#5a4a3a', '#2a3048', '#6a5a40', '#3a2a2a']),
		shoes: pick(['#2a1a10', '#3a2a1a', '#141414', '#f2f2f2']),
		...(r() < 0.25 ? {hat: {type: r() < 0.5 ? ('cap' as const) : ('straw' as const), color: pick(['#d8c080', '#b8463a', '#2a3a5a'])}} : {}),
		...(!female && r() < 0.35 ? {mustache3d: '#1a1410'} : {}),
		...(!female && r() < 0.3 ? {stubble: {color: '#2a1d14', mode: r() < 0.5 ? ('paint' as const) : ('3d' as const)}} : {}),
		...(female && r() < 0.5 ? {earrings: '#e8c040'} : {}),
		...(r() < 0.15 ? {glasses: '#2a2a2a'} : {}),
	};
	return {look, h: 0.86 + r() * 0.18};
};

// ---------- Medellín comuna: thousands of brick houses stepping down a slope (instanced) ----------
// `y(x, z)` gives the ground height; houses snap to it. Unplastered brick walls, tin/tile roofs,
// dark window holes, a few painted fronts, black water tanks and trees between them.
export const Comuna: React.FC<{x: [number, number]; z: [number, number]; y: (x: number, z: number) => number; step?: number; seed?: number; night?: number}> = ({x, z, y, step = 7, seed = 2, night = 0}) => {
	const wallRef = useRef<THREE.InstancedMesh>(null);
	const roofRef = useRef<THREE.InstancedMesh>(null);
	const winRef = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
	const wallMat = useMemo(() => {
		const t = tex64((g) => {
			px(g, '#b8a088', 0, 0, 32, 32);
			const r = rnd(4);
			for (let yy = 0; yy < 32; yy += 4) for (let xx = (yy / 4) % 2 ? -4 : 0; xx < 32; xx += 8) px(g, tint('#a8583a', (r() - 0.5) * 0.3), xx + 1, yy + 1, 6, 2);
			px(g, '#2a1a14', 6, 10, 6, 6);
			px(g, '#2a1a14', 20, 10, 6, 6);
		}, 32, 32);
		return new THREE.MeshLambertMaterial({map: t, flatShading: true});
	}, []);
	const plain = useMemo(() => new THREE.MeshLambertMaterial({color: '#ffffff', flatShading: true}), []);
	const winMat = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color('#ffc870').multiplyScalar(2.2), toneMapped: false}), []);
	const items = useMemo(() => {
		const r = rnd(seed);
		const out: {p: V3; s: V3; roof: string; tint: string; lit: boolean}[] = [];
		for (let zz = z[0]; zz < z[1]; zz += step * (0.8 + r() * 0.3))
			for (let xx = x[0]; xx < x[1]; xx += step * (0.75 + r() * 0.4)) {
				if (r() < 0.08) continue;
				const w = step * (0.6 + r() * 0.3);
				const d = step * (0.6 + r() * 0.3);
				const h = step * (0.45 + r() * 0.7);
				const gy = y(xx, zz);
				out.push({
					p: [xx + (r() - 0.5) * 1.5, gy + h / 2 - 0.5, zz + (r() - 0.5) * 1.5],
					s: [w, h, d],
					roof: r() < 0.55 ? tint('#8a8a88', (r() - 0.5) * 0.3) : r() < 0.5 ? '#9a4a2a' : '#6a6a68',
					tint: r() < 0.12 ? ['#e8d8b0', '#c8d8c0', '#e8b8a8', '#d0c8e0'][Math.floor(r() * 4)] : tint('#ffffff', -(r() * 0.2)),
					lit: r() < 0.5,
				});
			}
		return out;
	}, [x, z, y, step, seed]);
	useLayoutEffect(() => {
		const o = new THREE.Object3D();
		const c = new THREE.Color();
		let k = 0;
		items.forEach((h, i) => {
			o.position.set(...h.p);
			o.scale.set(...h.s);
			o.rotation.set(0, 0, 0);
			o.updateMatrix();
			wallRef.current!.setMatrixAt(i, o.matrix);
			wallRef.current!.setColorAt(i, c.set(h.tint));
			o.position.set(h.p[0], h.p[1] + h.s[1] / 2 + 0.15, h.p[2]);
			o.scale.set(h.s[0] + 0.6, 0.3, h.s[2] + 0.6);
			o.rotation.set(0.06, 0, 0);
			o.updateMatrix();
			roofRef.current!.setMatrixAt(i, o.matrix);
			roofRef.current!.setColorAt(i, c.set(h.roof));
			if (night > 0 && h.lit) {
				o.position.set(h.p[0] - h.s[0] * 0.2, h.p[1], h.p[2] + h.s[2] / 2 + 0.05);
				o.scale.set(1.0, 1.0, 0.1);
				o.rotation.set(0, 0, 0);
				o.updateMatrix();
				winRef.current!.setMatrixAt(k++, o.matrix);
			}
		});
		wallRef.current!.instanceMatrix.needsUpdate = true;
		roofRef.current!.instanceMatrix.needsUpdate = true;
		if (wallRef.current!.instanceColor) wallRef.current!.instanceColor.needsUpdate = true;
		if (roofRef.current!.instanceColor) roofRef.current!.instanceColor.needsUpdate = true;
		winRef.current!.count = k;
		winRef.current!.instanceMatrix.needsUpdate = true;
	}, [items, night]);
	return (
		<group>
			<instancedMesh ref={wallRef} args={[geo, wallMat, items.length]} castShadow receiveShadow />
			<instancedMesh ref={roofRef} args={[geo, plain, items.length]} castShadow receiveShadow />
			<instancedMesh ref={winRef} args={[geo, winMat, items.length]} />
		</group>
	);
};
