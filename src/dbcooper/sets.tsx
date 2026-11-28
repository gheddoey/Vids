import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {onTwos} from '../anim';
import {BlockText} from '../BlockText';
import {lambert} from '../ps1/ps1';
import {B, Cyl, SkyDome as SkyDome90} from '../ps1/sets';
import {Rig4} from '../lebron2/sets';
import {Smoke, Water} from '../escobar/kit';
import {Ashtray, Bundle, Cabinet, Calendar, CloudDeck, DeskLamp, Fern, Fog, Jet727, PI, Phone, Pines, Puddle, Rain, SodiumLamp, Typewriter, TX, V3, flashAt, rnd, useTex} from './kit';

// D.B. Cooper sets: complete 1971 locations, foreground / midground / background, story lighting.

// ---------- shared ----------
// The base dome has a 90-unit radius; scale it so distant set pieces (far banks, city lights) stay in front.
const SkyDome: React.FC<React.ComponentProps<typeof SkyDome90>> = (p) => (
	<group scale={3}>
		<SkyDome90 {...p} />
	</group>
);
const Ground: React.FC<{mat: THREE.Material; size?: number; y?: number}> = ({mat, size = 400, y = 0}) => (
	<mesh rotation={[-PI / 2, 0, 0]} position={[0, y, 0]} material={mat} receiveShadow>
		<planeGeometry args={[size, size]} />
	</mesh>
);
// City lights far below / far away: instanced warm + cool dots.
export const CityLights: React.FC<{center: V3; size: [number, number]; n?: number; seed?: number; y?: number}> = ({center, size, n = 600, seed = 4}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => new THREE.BoxGeometry(0.6, 0.6, 0.6), []);
	const mat = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffffff', toneMapped: false, fog: false}), []);
	useLayoutEffect(() => {
		const r = rnd(seed);
		const m = new THREE.Matrix4();
		const c = new THREE.Color();
		for (let i = 0; i < n; i++) {
			// streets: points cluster on a grid
			const gx = Math.round((r() - 0.5) * 20) / 20;
			const onX = r() < 0.5;
			const x = (onX ? gx : r() - 0.5) * size[0];
			const z = (onX ? r() - 0.5 : gx) * size[1];
			m.makeTranslation(center[0] + x, center[1], center[2] + z);
			ref.current!.setMatrixAt(i, m);
			ref.current!.setColorAt(i, c.set(r() < 0.7 ? '#ffb050' : r() < 0.5 ? '#e8f0ff' : '#ff6a3a').multiplyScalar(1.5 + r() * 2));
		}
		ref.current!.instanceMatrix.needsUpdate = true;
		if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
	}, [center, size, n, seed]);
	return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} />;
};

// ---------- 1  The storm at 10,000 ft (night, freezing rain) ----------
export const StormSky: React.FC<{f: number; strikes?: number[]; below?: boolean; dir?: 'side' | 'down' | 'up'}> = ({f, strikes = [], below = true}) => {
	const fl = flashAt(f, strikes, 10);
	return (
		<>
			<SkyDome top={fl > 0.3 ? '#6a7a90' : '#070c14'} bottom={fl > 0.3 ? '#8a9ab0' : '#141e2a'} fog={fl > 0.3 ? '#5a6a80' : '#101820'} near={30} far={220} />
			<Rig4 sky="#7a90b8" ground="#141a24" hemi={1.1 + fl * 2} key="#b8d0f0" keyI={1.5 + fl * 4} keyPos={[20, 30, -10]} rim="#6a8ad0" rimI={2.2} fill={0.7} span={70} />
			{fl > 0 ? <pointLight position={[-60, 40, -40]} color="#e0e8ff" intensity={600 * fl} distance={400} decay={1} /> : null}
			{below ? <CloudDeck f={f} y={-34} speed={2.2} n={46} color="#1e2a38" glow={0.1 + fl * 0.8} /> : null}
			<CloudDeck f={f + 50} y={34} speed={1.6} n={28} color="#141c26" glow={0.06 + fl * 0.5} seed={17} />
			{/* lightning bolt in the far clouds */}
			{fl > 0.3 ? (
				<group position={[-70, 10, -120]}>
					{[0, 1, 2, 3, 4].map((k) => (
						<B key={k} size={[0.8, 12, 0.8]} pos={[(k % 2 ? 3 : -2) + k, 40 - k * 11, 0]} rot={[0, 0, (k % 2 ? 1 : -1) * 0.35]} color="#e8f0ff" glow={10} shadow={false} />
					))}
				</group>
			) : null}
		</>
	);
};

// ---------- 2  PDX apron at dusk, rain ----------
export const Apron: React.FC<{f: number}> = ({f}) => {
	const tarmac = useTex(TX.tarmac, 40, 40);
	const glass = useMemo(() => lambert({color: '#ffd8a0', emissive: '#ffb860', emissiveIntensity: 0.9}), []);
	const concrete = useTex(TX.plaster('#a8a49a'), 6, 1);
	return (
		<>
			<SkyDome top="#141c30" bottom="#c86a4a" fog="#5a5060" near={40} far={260} />
			<Rig4 sky="#7a88b0" ground="#2a2228" hemi={0.9} key="#ffb070" keyI={1.0} keyPos={[30, 12, -40]} rim="#8aa0e0" rimI={1.4} fill={0.6} span={60} />
			<Ground mat={tarmac} />
			{/* terminal: long low concourse, glass curtain wall lit from inside, deep roof overhang */}
			<group position={[0, 0, -40]}>
				<mesh material={concrete} position={[0, 6, 0]} castShadow receiveShadow>
					<boxGeometry args={[160, 12, 14]} />
				</mesh>
				<B size={[164, 1.6, 18]} pos={[0, 12.8, 1.5]} color="#5a5a56" />
				{Array.from({length: 40}, (_, i) => (
					<group key={i}>
						<mesh material={glass} position={[-78 + i * 4, 6.2, 7.05]}>
							<boxGeometry args={[3.4, 8, 0.1]} />
						</mesh>
						<B size={[0.5, 9, 0.4]} pos={[-80 + i * 4, 6, 7.2]} color="#3a3a3a" />
					</group>
				))}
				{/* silhouettes of travellers behind the glass */}
				{[-30, -26, -12, -9, 4, 18, 22, 36].map((x, i) => (
					<group key={x} position={[x, 0, 6]}>
						<B size={[1.4, 3.2, 0.6]} pos={[0, 3.6, 0]} color="#2a1e18" />
						<B size={[0.9, 1.0, 0.6]} pos={[0, 5.8, 0]} color="#2a1e18" />
						{i % 3 === 0 ? <B size={[1.0, 1.2, 0.5]} pos={[0.9, 2.6, 0]} color="#2a1e18" /> : null}
					</group>
				))}
				{/* the terminal sign: steel truss on the roof, individual box letters, floodlit */}
				<group position={[-20, 13.6, 4]}>
					{[-12, 0, 12].map((x) => (
						<B key={x} size={[0.4, 4, 0.4]} pos={[x, 2, -0.6]} color="#4a4e54" />
					))}
					<B size={[30, 0.4, 0.4]} pos={[0, 0.8, -0.6]} color="#4a4e54" />
					<B size={[30, 0.4, 0.4]} pos={[0, 3.8, -0.6]} color="#4a4e54" />
					<BlockText text="PORTLAND" size={2.6} depth={0.7} color="#f2ead8" side="#8a6a3a" emissive={0.5} position={[0, 1.2, 0]} />
					<pointLight position={[0, 0, 4]} color="#ffe0b0" intensity={30} distance={20} />
				</group>
				{/* control tower */}
				<group position={[48, 0, -14]}>
					<B size={[5, 30, 5]} pos={[0, 15, 0]} color="#8a8a84" />
					<B size={[9, 4, 9]} pos={[0, 32, 0]} color="#3a4a5a" />
					<B size={[9.4, 2.6, 9.4]} pos={[0, 32.4, 0]} color="#ffe0a0" glow={1.2} shadow={false} />
					<B size={[10, 0.6, 10]} pos={[0, 34.6, 0]} color="#4a4a48" />
					<B size={[0.2, 4, 0.2]} pos={[0, 37, 0]} color="#8a8a84" />
					<B size={[0.5, 0.5, 0.5]} pos={[0, 39.2, 0]} color="#ff2a1a" glow={onTwos(f) % 40 < 20 ? 6 : 0.5} shadow={false} />
				</group>
				{/* far hills, Mt Hood-ish silhouette in the dusk */}
				<B size={[300, 18, 4]} pos={[0, 2, -60]} color="#2a2a3a" />
				<mesh position={[60, 10, -120]}>
					<coneGeometry args={[40, 46, 6]} />
					<meshBasicMaterial color="#4a4a62" fog={false} />
				</mesh>
			</group>
			{/* 727 at the gate (nose in) */}
			<group position={[-14, 7.5, -14]} rotation={[0, PI - 0.2, 0]} scale={0.8}>
				<Jet727 f={f} gear stair={0} cabinLit={1} />
			</group>
			{/* ground clutter: baggage train, tug, chocks, cones, lamp posts, puddles */}
			<group position={[10, 0, -4]} rotation={[0, -0.4, 0]}>
				<B size={[3, 2, 4]} pos={[0, 1.4, 0]} color="#d8a02a" />
				<B size={[2.6, 1.2, 1.6]} pos={[0, 2.8, -0.8]} color="#2a2a2a" />
				{[0, 1, 2].map((k) => (
					<group key={k} position={[0, 0, -6 - k * 5.4]}>
						<B size={[3.2, 0.3, 4.6]} pos={[0, 1.1, 0]} color="#5a5e64" />
						<B size={[3.0, 2.2, 0.1]} pos={[0, 2.3, 2.2]} color="#3a3e44" />
						{[[-0.8, 1.8, 0.4, '#5a3a22'], [0.6, 1.7, -0.6, '#2a4a6a'], [-0.2, 2.6, 0.5, '#8a2a24']].map(([x, y, z, c], j) => (
							<B key={j} size={[1.3, 0.9, 1.8]} pos={[x as number, y as number, z as number]} color={c as string} />
						))}
						{[-1.4, 1.4].map((x) => [-1.8, 1.8].map((z) => <Cyl key={`${x}${z}`} r={0.4} h={0.3} seg={6} pos={[x, 0.4, z]} rot={[0, 0, PI / 2]} color="#141414" />))}
					</group>
				))}
			</group>
			{[[-28, 6], [22, 10], [40, -8], [-48, -6]].map(([x, z], i) => (
				<SodiumLamp key={i} pos={[x, 0, z]} rot={i * 1.3} />
			))}
			{[[6, 10, '#ffb24a'], [-4, 4, '#ffd0a0'], [18, 2, '#ffb24a'], [-20, 12, '#ff9a4a']].map(([x, z, c], i) => (
				<Puddle key={i} pos={[x as number, 0, z as number]} s={[3 + i, 1.6 + i * 0.4]} glint={c as string} />
			))}
			{[[0, 14], [2, 15], [-3, 16]].map(([x, z], i) => (
				<group key={i} position={[x, 0, z]}>
					<Cyl r={0.4} r2={0.05} h={1.2} seg={6} pos={[0, 0.6, 0]} color="#ff6a1a" />
					<B size={[0.9, 0.1, 0.9]} pos={[0, 0.05, 0]} color="#ff6a1a" />
				</group>
			))}
			<Rain f={f} n={700} center={[0, 10, 0]} size={[60, 24, 50]} wind={[0.15, -1.4, 0.1]} len={1.3} op={0.4} />
		</>
	);
};

// ---------- 3  Ticket hall (1971): teak counter, flip board, terrazzo ----------
export const TicketHall: React.FC<{f: number; flip?: number}> = ({f, flip = 1}) => {
	const floor = useTex(TX.terrazzo, 10, 10);
	const teak = useTex(TX.teak('#7a4a28'), 6, 1);
	const wall = useTex(TX.wallpaper70, 6, 2);
	const orange = useMemo(() => lambert({color: '#d8742a'}), []);
	const rows = ['305  SEATTLE    2:50', '471  BOISE      3:10', '622  CHICAGO    3:35', '118  SPOKANE    4:05'];
	return (
		<>
			<SkyDome top="#2a2a30" bottom="#2a2a30" />
			<Rig4 sky="#e8f0ff" ground="#4a3a2a" hemi={1.1} key="#fff0d8" keyI={1.4} keyPos={[6, 12, 8]} rim="#ffb870" rimI={1.6} fill={0.7} />
			<Ground mat={floor} size={80} />
			{/* ceiling: fluorescent troffers */}
			<B size={[60, 0.4, 40]} pos={[0, 13, -6]} color="#d8d4c8" />
			{[-12, 0, 12].map((x) => [-10, 0, 8].map((z) => <B key={`${x}${z}`} size={[6, 0.1, 1.4]} pos={[x, 12.75, z]} color="#f0f4ff" glow={2.5} shadow={false} />))}
			{/* back wall: wallpaper, route-map relief, clock */}
			<mesh material={wall} position={[0, 6.5, -12]} receiveShadow>
				<boxGeometry args={[60, 13, 0.4]} />
			</mesh>
			<group position={[-10, 8.2, -11.7]}>
				<B size={[9, 4.6, 0.2]} color="#2a3a5a" />
				<B size={[9.4, 5, 0.1]} pos={[0, 0, -0.06]} color="#c8a23a" />
				{[[-3, 1], [-1, -0.6], [1.5, 0.8], [3.2, -1.2], [0, 1.6]].map(([x, y], i) => (
					<B key={i} size={[0.3, 0.3, 0.25]} pos={[x, y, 0.1]} color="#ffd040" glow={1.5} shadow={false} />
				))}
				<B size={[6.4, 0.08, 0.2]} pos={[-0.2, 0.3, 0.1]} rot={[0, 0, 0.3]} color="#e8e4da" shadow={false} />
			</group>
			<group position={[9, 9.6, -11.6]}>
				<Cyl r={1.1} h={0.2} seg={10} rot={[PI / 2, 0, 0]} color="#f2efe6" />
				<B size={[0.1, 0.8, 0.05]} pos={[0, 0.35, 0.15]} rot={[0, 0, -1.0]} color="#1a1a1a" />
				<B size={[0.1, 0.55, 0.05]} pos={[0, 0.25, 0.17]} rot={[0, 0, 2.2]} color="#1a1a1a" />
			</group>
			{/* flip departures board hanging on rods */}
			<group position={[4, 10, -8]}>
				{[-5, 5].map((x) => (
					<B key={x} size={[0.12, 3, 0.12]} pos={[x, 2.2, 0]} color="#8a8e94" />
				))}
				<B size={[13, 5.2, 0.6]} pos={[0, 0, 0]} color="#141414" />
				<B size={[13.4, 0.5, 0.7]} pos={[0, 2.5, 0]} color="#c8a23a" />
				<BlockText text="DEPARTURES" size={0.34} depth={0.05} color="#141414" position={[0, 2.36, 0.36]} />
				{rows.map((t, i) => (
					<group key={i} position={[0, 1.3 - i * 1.05, 0.32]}>
						{Array.from({length: 20}, (_, k) => (
							<B key={k} size={[0.55, 0.85, 0.04]} pos={[-5.9 + k * 0.62, 0, 0]} color="#22252a" shadow={false} />
						))}
						<BlockText text={i === 0 && flip < 1 ? '###  ######    #:##' : t} size={0.42} depth={0.04} color={i === 0 ? '#ffd040' : '#f2efe6'} emissive={i === 0 ? 0.8 : 0.3} position={[0, -0.2, 0.04]} />
					</group>
				))}
			</group>
			{/* the counter: teak front with an orange band, chrome top edge, baggage scale */}
			<group position={[0, -0.6, -2]}>
				<mesh material={teak} position={[0, 1.9, 0]} castShadow receiveShadow>
					<boxGeometry args={[22, 3.8, 2]} />
				</mesh>
				<mesh material={orange} position={[0, 3.0, 1.02]}>
					<boxGeometry args={[22, 0.6, 0.04]} />
				</mesh>
				<B size={[22.2, 0.2, 2.4]} pos={[0, 3.9, 0]} color="#c8ccd0" />
				<B size={[3, 0.5, 2.4]} pos={[-7, 0.25, 2]} color="#8a8e94" />
				<B size={[1.2, 1, 0.3]} pos={[-7, 1.0, 3.2]} color="#e8e4da" />
				{/* ticket printer, stamp, cash tray, little desk sign */}
				<B size={[1.6, 0.9, 1.2]} pos={[2.6, 4.45, -0.2]} color="#5a5e64" />
				<B size={[1.0, 0.06, 0.8]} pos={[2.6, 4.92, 0.2]} color="#f2efe6" />
				<B size={[0.4, 0.5, 0.4]} pos={[-1.2, 4.25, 0.3]} color="#8a2a24" />
				<B size={[1.6, 0.6, 0.1]} pos={[5.6, 4.3, 0.8]} rot={[-0.3, 0, 0]} color="#2a2a2a" />
				<BlockText text="TICKETS" size={0.22} depth={0.03} color="#f2ead8" position={[5.6, 4.22, 0.88]} rotation={[-0.3, 0, 0]} />
			</group>
			{/* queue stanchions + rope, ashtray stand, potted rubber plant, bench with luggage */}
			{[-4, 0, 4].map((x) => (
				<group key={x} position={[x - 6, 0, 6]}>
					<Cyl r={0.5} h={0.15} seg={8} pos={[0, 0.07, 0]} color="#c8a23a" />
					<Cyl r={0.12} h={3} seg={6} pos={[0, 1.5, 0]} color="#c8a23a" />
				</group>
			))}
			{[-8, -4].map((x) => (
				<B key={x} size={[4, 0.18, 0.18]} pos={[x, 2.6, 6]} color="#8a1a24" />
			))}
			<group position={[9, 0, 4]}>
				<Cyl r={0.7} h={0.3} seg={8} pos={[0, 0.15, 0]} color="#3a3a3a" />
				<Cyl r={0.2} h={3} seg={6} pos={[0, 1.6, 0]} color="#c8ccd0" />
				<Cyl r={0.7} h={0.3} seg={8} pos={[0, 3.2, 0]} color="#c8ccd0" />
				<Smoke f={f} pos={[0.1, 3.3, 0]} n={5} h={3} color="#c8c4bc" spread={0.06} scale={0.07} />
			</group>
			<group position={[-15, 0, -6]}>
				<B size={[2.2, 2, 2.2]} pos={[0, 1, 0]} color="#c8742a" />
				{[0, 1, 2, 3, 4].map((k) => (
					<B key={k} size={[0.4, 1.6, 1.6]} pos={[Math.sin(k) * 0.6, 3 + k * 0.7, Math.cos(k * 1.3) * 0.5]} rot={[k * 0.6, k, 0.4]} color="#2a5a2a" />
				))}
			</group>
			{/* travellers in the background on their own paths */}
			{[0, 1, 2].map((i) => {
				const x = ((f * (0.06 + i * 0.02) + i * 14) % 40) - 20;
				return (
					<group key={i} position={[i % 2 ? -x : x, 0, -9 + i * 1.2]}>
						<B size={[1.6, 4, 0.9]} pos={[0, 3, 0]} color={['#5a3a6a', '#3a5a4a', '#7a5a2a'][i]} />
						<B size={[1.0, 1.1, 1.0]} pos={[0, 5.6, 0]} color="#d8a882" />
						<B size={[1.2, 0.8, 0.5]} pos={[0.9, 1.6, 0]} color="#3a2a1e" />
					</group>
				);
			})}
		</>
	);
};

// ---------- 4  The 727 aft cabin: last rows, aft bulkhead with the stair door ----------
export const Cabin727: React.FC<{f: number; flicker?: number; door?: number; rows?: number; hideRow?: boolean}> = ({f, flicker = 1, door = 0, rows = 9, hideRow}) => {
	const seat = useTex(TX.seat(), 1, 1);
	const seatB = useTex(TX.seat('#8a4a22', '#743e1c'), 1, 1);
	const carpet = useTex(TX.carpet, 2, 12);
	const panel = useTex(TX.panelCream, 4, 1);
	const teak = useTex(TX.teak('#6a4426'), 2, 1);
	const L = flicker;
	return (
		<>
			<SkyDome top="#05070c" bottom="#0a0e16" />
			<Rig4 sky="#ffe8c8" ground="#3a2416" hemi={0.85} key="#ffd8a0" keyI={0.9 * L} keyPos={[2, 10, 6]} rim="#6a8ad0" rimI={1.2} fill={0.7} />
			<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0, 12]} material={carpet} receiveShadow>
				<planeGeometry args={[9.4, 34]} />
			</mesh>
			{[-1, 1].map((s) => (
				<group key={s}>
					{/* hull: lower wall, sloped upper wall, window reveals (black night outside) */}
					<mesh material={panel} position={[s * 4.7, 2.4, 12]} receiveShadow>
						<boxGeometry args={[0.3, 4.8, 34]} />
					</mesh>
					<mesh material={panel} position={[s * 4.1, 5.9, 12]} rotation={[0, 0, s * 0.5]} receiveShadow>
						<boxGeometry args={[0.3, 2.8, 34]} />
					</mesh>
					{Array.from({length: 12}, (_, i) => (
						<group key={i} position={[s * 4.52, 3.4, 26 - i * 2.6]}>
							<B size={[0.1, 1.0, 0.8]} color="#060a14" glow={0.1} shadow={false} />
							<B size={[0.14, 0.3, 0.86]} pos={[0, 0.62, 0]} color="#d8d0bc" />
						</group>
					))}
					{/* open hat rack + passenger service unit with reading lights */}
					<B size={[1.8, 0.12, 34]} pos={[s * 3.5, 5.5, 12]} color="#d8d0bc" />
					<B size={[0.1, 0.5, 34]} pos={[s * 2.6, 5.7, 12]} color="#c8ccd0" />
					{Array.from({length: rows}, (_, r) =>
						[0, 1, 2].map((k) => {
							const x = s * (1.55 + k * 1.05);
							const z = r * 2.6;
							if (hideRow && s === 1 && r === 1) return null;
							return (
								<group key={`${r}-${k}`} position={[x, 0, z]}>
									<mesh material={(r + k) % 4 ? seat : seatB} position={[0, 1.45, 0.1]} castShadow receiveShadow>
										<boxGeometry args={[1.0, 0.45, 1.15]} />
									</mesh>
									<mesh material={(r + k) % 4 ? seat : seatB} position={[0, 2.95, -0.55]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
										<boxGeometry args={[1.0, 2.6, 0.32]} />
									</mesh>
									<B size={[0.9, 0.5, 0.06]} pos={[0, 3.95, -0.36]} rot={[-0.1, 0, 0]} color="#f2efe6" shadow={false} />
									<B size={[0.12, 0.45, 1.1]} pos={[0.53, 1.85, 0.05]} color="#5a5e64" />
									<B size={[0.6, 1.1, 0.1]} pos={[0, 0.7, 0.55]} color="#2a2c30" />
									<B size={[0.14, 0.05, 0.14]} pos={[0, 5.42, 0.3]} color="#fff0c0" glow={r === 0 ? 4 * L : 0.8 * L} shadow={false} />
								</group>
							);
						}),
					)}
				</group>
			))}
			{/* reading-light pools on the last rows + a warm cove line */}
			<pointLight position={[1.6, 5.2, 0.3]} color="#ffd090" intensity={14 * L} distance={9} />
			<pointLight position={[-2.6, 5.2, 0.3]} color="#ffd090" intensity={6 * L} distance={8} />
			<pointLight position={[0, 6.2, 12]} color="#fff0d8" intensity={12 * L} distance={22} />
			{[-1, 1].map((s) => (
				<B key={s} size={[0.08, 0.08, 34]} pos={[s * 2.1, 6.7, 12]} color="#fff0d0" glow={2.4 * L} shadow={false} />
			))}
			<B size={[4.4, 0.25, 34]} pos={[0, 7.0, 12]} color="#e8e0cc" />
			{/* AFT BULKHEAD: galley + lav doors left/right, the stair door in the middle, EXIT sign */}
			<group position={[0, 0, -2.4]}>
				<mesh material={panel} position={[0, 3.6, 0]} receiveShadow>
					<boxGeometry args={[9.4, 7.2, 0.3]} />
				</mesh>
				<mesh material={teak} position={[-3, 2.9, 0.2]}>
					<boxGeometry args={[2.4, 5.6, 0.1]} />
				</mesh>
				<mesh material={teak} position={[3, 2.9, 0.2]}>
					<boxGeometry args={[2.4, 5.6, 0.1]} />
				</mesh>
				<B size={[0.4, 0.25, 0.1]} pos={[3, 4.6, 0.3]} color="#e8c040" glow={0.8} />
				<BlockText text="LAV" size={0.18} depth={0.02} color="#1a1a1a" position={[3, 4.53, 0.36]} />
				{/* centre door frame (stair door slides up: door 0..1) */}
				<B size={[2.6, 5.8, 0.2]} pos={[0, 2.9, 0.12]} color="#0a0e16" />
				<group position={[0, 2.9 + door * 5, 0.25]}>
					<B size={[2.4, 5.6, 0.14]} color="#c8c0aa" />
					<B size={[0.8, 0.8, 0.1]} pos={[0, 1.2, 0.08]} color="#0a1424" />
					<B size={[0.9, 0.18, 0.1]} pos={[0.6, -0.4, 0.1]} color="#8a8e94" />
				</group>
				{door > 0.1 ? <pointLight position={[0, 2, -2]} color="#6a8ad0" intensity={10 * door} distance={10} /> : null}
				<B size={[1.4, 0.45, 0.2]} pos={[0, 6.3, 0.25]} color="#c82a1e" glow={2.2} shadow={false} />
				<BlockText text="EXIT" size={0.26} depth={0.04} color="#ffffff" emissive={0.8} position={[0, 6.2, 0.38]} />
				{/* folding jump seat */}
				<B size={[1.4, 0.2, 0.8]} pos={[-3, 1.8, 0.6]} color="#3a3a3e" />
			</group>
			{/* cabin haze: drifting cigarette smoke */}
			<Fog f={f} n={8} center={[0, 5, 6]} size={[8, 2, 16]} color="#d8c8a8" op={0.06} />
		</>
	);
};

// ---------- 5  Cockpit over Seattle at night ----------
export const Cockpit: React.FC<{f: number}> = ({f}) => {
	const gauges = useMemo(() => lambert({map: TX.gauge(), emissive: '#ffffff', emissiveMap: TX.gauge(), emissiveIntensity: 0.9}), []);
	const panel = useMemo(() => lambert({color: '#2a2e34'}), []);
	const seat = useTex(TX.seat('#3a3a40', '#2e2e34'));
	return (
		<>
			<SkyDome top="#04060c" bottom="#0c1424" />
			<Rig4 sky="#6a7aa0" ground="#100c08" hemi={0.6} key="#ffd8a0" keyI={0.7} keyPos={[3, 8, -6]} rim="#5a7ad0" rimI={1.6} fill={0.5} />
			<CityLights center={[0, -60, 60]} size={[260, 200]} n={1400} />
			{/* windscreen frames + rain */}
			<group position={[0, 0, 5]}>
				{[-4.6, -1.6, 1.6, 4.6].map((x) => (
					<B key={x} size={[0.5, 4, 0.5]} pos={[x, 6, 0]} rot={[0.3, 0, x * 0.06]} color="#1a1c20" />
				))}
				<B size={[10, 0.6, 1]} pos={[0, 8, -0.6]} color="#1a1c20" />
				<B size={[10, 0.4, 0.6]} pos={[0, 4.1, 0.6]} color="#1a1c20" />
				<Rain f={f} n={140} center={[0, 6, 0.4]} size={[9, 4, 0.2]} wind={[0.05, -0.2, 0]} len={0.35} op={0.5} color="#b8c8e0" />
			</group>
			{/* glare shield + main panel with glowing gauges */}
			<B size={[10, 0.6, 1.6]} pos={[0, 4.2, 3.6]} color="#141414" />
			<mesh material={[panel, panel, panel, panel, gauges, panel]} position={[0, 2.6, 3.2]} rotation={[-0.25, 0, 0]}>
				<boxGeometry args={[9.4, 2.8, 0.4]} />
			</mesh>
			<B size={[1.6, 2.6, 3]} pos={[0, 1.3, 1.6]} color="#2a2e34" />
			{[-0.4, -0.1, 0.2, 0.5].map((x, i) => (
				<B key={x} size={[0.18, 0.7, 0.18]} pos={[x, 2.9, 1.2 - i * 0.05]} rot={[-0.4 + i * 0.05, 0, 0]} color="#c8ccd0" />
			))}
			{/* yokes */}
			{[-2.4, 2.4].map((x) => (
				<group key={x} position={[x, 1.6, 2.4]}>
					<B size={[0.3, 1.8, 0.3]} pos={[0, 0, 0]} color="#1a1a1a" />
					<B size={[1.6, 0.25, 0.25]} pos={[0, 0.9, 0]} color="#2a2a2a" />
					<B size={[0.25, 0.6, 0.25]} pos={[-0.7, 1.1, 0]} color="#2a2a2a" />
					<B size={[0.25, 0.6, 0.25]} pos={[0.7, 1.1, 0]} color="#2a2a2a" />
				</group>
			))}
			{/* overhead panel */}
			<mesh material={[panel, panel, panel, gauges, panel, panel]} position={[0, 8.6, 1]} rotation={[0.5, 0, 0]}>
				<boxGeometry args={[6, 0.3, 3]} />
			</mesh>
			{/* seats (sheepskin-less 70s fabric), flight engineer panel on the right wall */}
			{[-2.4, 2.4].map((x) => (
				<group key={x} position={[x, 0, -1.4]}>
					<mesh material={seat} position={[0, 1.5, 0]}>
						<boxGeometry args={[2, 0.5, 2]} />
					</mesh>
					<mesh material={seat} position={[0, 3.4, -1.0]}>
						<boxGeometry args={[2, 3.4, 0.4]} />
					</mesh>
				</group>
			))}
			<mesh material={[panel, gauges, panel, panel, panel, panel]} position={[5, 3.6, -2]}>
				<boxGeometry args={[0.4, 3.4, 4]} />
			</mesh>
			<B size={[11, 0.4, 12]} pos={[0, 9.6, 0]} color="#1e2024" />
			<B size={[11, 0.3, 12]} pos={[0, 0, 0]} color="#1e2024" />
			<pointLight position={[0, 3.6, 2]} color="#ffb060" intensity={4} distance={6} />
		</>
	);
};

// ---------- 6  FBI Seattle field office, night (also microfilm stand, archive shelf, evidence table) ----------
export const FbiOffice: React.FC<{f: number; lamp?: number; archive?: boolean; year?: string; flip?: number}> = ({f, lamp = 1, year = '1971', flip = 0}) => {
	const floor = useTex(TX.linoleum, 8, 8);
	const wall = useTex(TX.plaster('#c8bfa6'), 6, 2);
	const wood = useTex(TX.teak('#5a3a22'), 6, 1);
	const desk = useTex(TX.teak('#6a4a2e'), 2, 1);
	const blinds = useTex(TX.blinds('#ffc070'), 2, 1);
	const box = useTex(TX.cardboard);
	const tube = Math.floor(f / 5) % 19 === 0 ? 0.4 : 1;
	return (
		<>
			<SkyDome top="#1a1a1e" bottom="#1a1a1e" />
			<Rig4 sky="#d8e0f0" ground="#3a2a1a" hemi={0.8 * lamp} key="#ffe0b0" keyI={1.2 * lamp} keyPos={[-8, 12, 6]} rim="#7a9ad8" rimI={1.4} fill={0.6 * lamp + 0.1} />
			<Ground mat={floor} size={60} />
			{/* walls: plaster over a teak dado; back wall holds the map and the archive shelves */}
			{[
				[0, -10, 40, 0],
				[-14, 0, 24, PI / 2],
			].map(([x, z, w, r], i) => (
				<group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
					<mesh material={wall} position={[0, 7, 0]} receiveShadow>
						<boxGeometry args={[w, 14, 0.4]} />
					</mesh>
					<mesh material={wood} position={[0, 1.8, 0.25]} receiveShadow>
						<boxGeometry args={[w, 3.6, 0.1]} />
					</mesh>
				</group>
			))}
			<B size={[40, 0.4, 30]} pos={[0, 14, 2]} color="#d8d4c8" />
			{[-6, 6].map((x) => (
				<group key={x}>
					<B size={[2, 0.2, 8]} pos={[x, 13.7, 0]} color="#f0f4ff" glow={2.4 * tube * lamp} shadow={false} />
					<pointLight position={[x, 12, 0]} color="#e8f0ff" intensity={18 * tube * lamp} distance={20} />
				</group>
			))}
			{/* window with blinds on the left wall: rain + city glow */}
			<group position={[-13.7, 7, -2]} rotation={[0, PI / 2, 0]}>
				<B size={[8, 6, 0.1]} color="#0a0e18" />
				<mesh material={blinds} position={[0, 0, 0.15]}>
					<boxGeometry args={[7.6, 5.6, 0.05]} />
				</mesh>
				<B size={[8.4, 0.4, 0.6]} pos={[0, -3.1, 0.2]} color="#8a7a5a" />
			</group>
			{/* map of SW Washington with pins and red yarn (search grid) */}
			<group position={[-4, 8, -9.7]}>
				<B size={[9, 6, 0.2]} color="#c8b88a" />
				<B size={[9.4, 6.4, 0.1]} pos={[0, 0, -0.06]} color="#5a3a22" />
				<B size={[3, 6, 0.22]} pos={[2.6, 0, 0]} rot={[0, 0, 0.15]} color="#6a8aa8" />
				{[[-2, 1], [-1, -0.5], [0, 1.6], [1.2, 0.2], [-2.8, -1.8], [0.5, -2]].map(([x, y], i) => (
					<B key={i} size={[0.2, 0.2, 0.3]} pos={[x, y, 0.2]} color="#c82a1e" />
				))}
				<B size={[4.2, 0.05, 0.05]} pos={[-1, 0.6, 0.25]} rot={[0, 0, -0.4]} color="#c82a1e" shadow={false} />
				<B size={[3.2, 0.05, 0.05]} pos={[-0.8, -1.0, 0.25]} rot={[0, 0, 0.5]} color="#c82a1e" shadow={false} />
				<BlockText text="NORJAK" size={0.4} depth={0.05} color="#1a1a1a" position={[-2.2, 2.4, 0.15]} />
			</group>
			<Calendar pos={[4, 8.4, -9.7]} year={year} flip={flip} />
			{/* desks with phones, typewriter, lamps, ashtrays, coffee, paper */}
			{[
				[-6, -2, 0.1],
				[5, -3, -0.1],
			].map(([x, z, r], i) => (
				<group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
					<mesh material={desk} position={[0, 2.6, 0]} castShadow receiveShadow>
						<boxGeometry args={[6, 0.3, 3]} />
					</mesh>
					<B size={[1.8, 2.4, 2.8]} pos={[-2, 1.2, 0]} color="#5a3a22" />
					<B size={[0.2, 2.4, 2.8]} pos={[2.9, 1.2, 0]} color="#5a3a22" />
					<Phone pos={[1.8, 2.75, 0.4]} rot={-0.3} c={i ? '#1a1a1a' : '#8a2a24'} />
					<DeskLamp pos={[-2.2, 2.75, -0.8]} rot={0.4} on={lamp} />
					<Ashtray pos={[0.4, 2.75, 0.8]} />
					<Cyl r={0.22} h={0.45} seg={8} pos={[-0.8, 3.0, 0.9]} color="#f2efe6" />
					{[0, 1, 2].map((k) => (
						<B key={k} size={[1.2, 0.04, 1.5]} pos={[0.2 + k * 0.1, 2.78 + k * 0.04, -0.4]} rot={[0, k * 0.2, 0]} color="#f2efe6" shadow={false} />
					))}
					{i ? <Typewriter pos={[-0.4, 2.75, 0.2]} c="#4a4e5a" /> : null}
				</group>
			))}
			{/* teletype on a stand, chattering paper */}
			<group position={[10, 0, -7]}>
				<B size={[3, 3, 2.4]} pos={[0, 1.5, 0]} color="#7a7a6e" />
				<B size={[2.8, 1, 2.2]} pos={[0, 3.5, 0]} color="#8a8a7e" />
				<B size={[2, 1.6 + (onTwos(f) % 20) * 0.02, 0.04]} pos={[0, 4.6, -0.3]} color="#f2efe6" />
			</group>
			<Cabinet pos={[-11, 0, -8]} />
			<Cabinet pos={[-9, 0, -8]} c="#5a605a" />
			{/* coat rack with a fedora and a raincoat */}
			<group position={[12, 0, 2]}>
				<Cyl r={0.12} h={6} seg={6} pos={[0, 3, 0]} color="#5a3a22" />
				<B size={[1.6, 2.6, 0.6]} pos={[0.2, 4.3, 0.3]} color="#8a7a5a" />
				<B size={[1.2, 0.5, 1.2]} pos={[0, 6.2, 0]} color="#4a4a48" />
				<B size={[1.8, 0.08, 1.8]} pos={[0, 6.0, 0]} color="#4a4a48" />
			</group>
			{/* microfilm copy stand: column, camera head, two reflector lamps */}
			<group position={[6, 0, 4]}>
				<B size={[4.6, 0.3, 3.2]} pos={[0, 2.6, 0]} color="#3a3e44" />
				{[-1.8, 1.8].map((x) => (
					<B key={x} size={[0.3, 2.6, 0.3]} pos={[x, 1.3, 0]} color="#2a2c30" />
				))}
				<B size={[3, 0.1, 2]} pos={[0, 2.8, 0.2]} color="#e8e4da" />
				<B size={[0.3, 5, 0.3]} pos={[0, 5.2, -1.2]} color="#8a8e94" />
				<B size={[1.2, 1, 1.4]} pos={[0, 6.6, -0.5]} color="#1a1a1a" />
				<Cyl r={0.3} h={0.5} seg={8} pos={[0, 6.0, -0.4]} color="#2a2a2a" />
				{[-1.6, 1.6].map((x) => (
					<group key={x} position={[x, 5.2, 0.2]} rotation={[0, 0, x > 0 ? 0.6 : -0.6]}>
						<B size={[0.1, 2, 0.1]} pos={[0, -1, 0]} color="#8a8e94" />
						<Cyl r={0.7} r2={0.3} h={0.6} seg={8} color="#c8ccd0" />
					</group>
				))}
			</group>
			{/* archive shelving at the back (NORJAK boxes) */}
			<group position={[10, 0, -9.2]}>
				{[0, 1, 2, 3].map((k) => (
					<B key={k} size={[7, 0.15, 1.6]} pos={[0, 1 + k * 2.6, 0]} color="#7a7e84" />
				))}
				{[-3.4, 3.4].map((x) => (
					<B key={x} size={[0.15, 10.4, 1.6]} pos={[x, 5.2, 0]} color="#5a5e64" />
				))}
				{Array.from({length: 12}, (_, i) => (
					<mesh key={i} material={box} position={[-2.4 + (i % 4) * 1.6, 1.85 + Math.floor(i / 4) * 2.6, 0]}>
						<boxGeometry args={[1.4, 1.5, 1.4]} />
					</mesh>
				))}
			</group>
			<Rain f={f} n={120} center={[-14.2, 7, -2]} size={[0.3, 6, 8]} wind={[0, -1.4, 0.1]} len={0.4} op={0.25} />
			<Fog f={f} n={6} center={[0, 9, 0]} size={[24, 3, 14]} color="#d8d0c0" op={0.05} />
		</>
	);
};

// ---------- 7  Sea-Tac remote stand, night: floodlights, fuel truck, stair truck ----------
export const Tarmac: React.FC<{f: number; jetZ?: number; stairs?: boolean}> = ({f, jetZ = 0, stairs = true}) => {
	const tarmac = useTex(TX.tarmac, 50, 50);
	const tl = useMemo(() => {
		const r = rnd(8);
		return Array.from({length: 40}, (_, i) => [-120 + i * 6, r() < 0.5 ? -40 : 40]);
	}, []);
	return (
		<>
			<SkyDome top="#05080e" bottom="#1a2232" fog="#141c28" near={50} far={300} />
			<Rig4 sky="#5a6a90" ground="#0a0a0c" hemi={0.6} key="#fff0d0" keyI={1.4} keyPos={[30, 30, 30]} rim="#6a8ad0" rimI={1.8} fill={0.4} span={70} />
			<Ground mat={tarmac} />
			{/* floodlight towers with banks of lamps */}
			{[[-50, 40], [50, 50], [10, -60]].map(([x, z], i) => (
				<group key={i} position={[x, 0, z]}>
					<B size={[1, 34, 1]} pos={[0, 17, 0]} color="#5a5e64" />
					<B size={[6, 3, 1]} pos={[0, 34, 0]} color="#3a3a3a" />
					{[-2, 0, 2].map((dx) => (
						<B key={dx} size={[1.4, 1.2, 0.3]} pos={[dx, 34, 0.6 * (z > 0 ? -1 : 1)]} color="#fff4d8" glow={8} shadow={false} />
					))}
					<pointLight position={[0, 30, z > 0 ? -4 : 4]} color="#fff0d0" intensity={300} distance={120} decay={1.4} />
				</group>
			))}
			{/* blue taxiway edge lights */}
			{tl.map(([x, z], i) => (
				<B key={i} size={[0.5, 0.6, 0.5]} pos={[x, 0.3, z]} color="#3a6aff" glow={5} shadow={false} />
			))}
			<CityLights center={[0, 2, -220]} size={[400, 30]} n={500} />
			<group position={[0, 7.5, jetZ]} scale={0.9}>
				<Jet727 f={f} gear stair={0} cabinLit={1} />
			</group>
			{/* stair truck at the forward door */}
			{stairs ? (
				<group position={[-8.6, 0, 46]} rotation={[0, PI / 2, 0]}>
					<B size={[4, 3, 8]} pos={[0, 2, 0]} color="#e8e4da" />
					<B size={[3.6, 2, 3]} pos={[0, 4.4, 3]} color="#2a3a5a" />
					{Array.from({length: 9}, (_, i) => (
						<B key={i} size={[3, 0.25, 0.9]} pos={[0, 3.6 + i * 0.6, -2 - i * 0.55 + 6]} color="#8a8e94" />
					))}
					<B size={[0.15, 0.15, 7]} pos={[1.6, 7.4, 1.4]} rot={[0.8, 0, 0]} color="#c8ccd0" />
					<B size={[0.15, 0.15, 7]} pos={[-1.6, 7.4, 1.4]} rot={[0.8, 0, 0]} color="#c8ccd0" />
				</group>
			) : null}
			{/* fuel truck under the wing, hose to the aircraft */}
			<group position={[16, 0, 18]} rotation={[0, -0.3, 0]}>
				<B size={[4, 4.4, 14]} pos={[0, 3.2, 0]} color="#c8c8c0" />
				<B size={[4.2, 0.6, 14.2]} pos={[0, 2.2, 0]} color="#c82a1e" />
				<B size={[4, 3.6, 4]} pos={[0, 2.8, 9]} color="#c82a1e" />
				<B size={[3.6, 1.4, 0.2]} pos={[0, 3.8, 11.05]} color="#1a2030" glow={0.2} />
				{[-5, 0, 8].map((z) => [-2, 2].map((x) => <Cyl key={`${x}${z}`} r={1} h={0.8} seg={8} pos={[x, 1, z]} rot={[0, 0, PI / 2]} color="#141414" />))}
				<B size={[0.3, 0.3, 9]} pos={[-4, 1, -2]} rot={[0, 0.6, 0]} color="#1a1a1a" />
				<B size={[0.6, 0.6, 0.6]} pos={[0, 5.6, 9]} color="#ffb030" glow={onTwos(f) % 16 < 8 ? 6 : 0.4} shadow={false} />
			</group>
			{/* lone police car parked well back */}
			<group position={[-34, 0, 20]} rotation={[0, 0.8, 0]}>
				<B size={[4.2, 1.6, 9]} pos={[0, 1.4, 0]} color="#e8e4da" />
				<B size={[3.8, 1.3, 4.6]} pos={[0, 2.8, -0.4]} color="#1a1a1a" />
				<B size={[2, 0.4, 0.6]} pos={[0, 3.6, -0.4]} color={onTwos(f) % 12 < 6 ? '#ff2a2a' : '#2a5aff'} glow={6} shadow={false} />
				{[-3, 3].map((z) => [-2, 2].map((x) => <Cyl key={`${x}${z}`} r={0.8} h={0.6} seg={8} pos={[x, 0.8, z]} rot={[0, 0, PI / 2]} color="#141414" />))}
			</group>
			{[[-6, 30], [10, 40], [-20, 0], [24, -10]].map(([x, z], i) => (
				<Puddle key={i} pos={[x, 0, z]} s={[4 + i, 2 + i * 0.5]} glint={i % 2 ? '#fff0d0' : '#ff9a4a'} />
			))}
			<Rain f={f} n={800} center={[0, 12, 20]} size={[80, 26, 80]} wind={[0.2, -1.4, 0]} len={1.4} op={0.35} />
		</>
	);
};

// ---------- 8  SW Washington forest (night from above, or dawn search) ----------
export const Forest: React.FC<{f: number; mode: 'night' | 'dawn'}> = ({f, mode}) => {
	const moss = useTex(TX.moss, 30, 30);
	const night = mode === 'night';
	return (
		<>
			<SkyDome top={night ? '#04070a' : '#6a7a88'} bottom={night ? '#0a1014' : '#d8c8a8'} fog={night ? '#0a1014' : '#a8acaa'} near={night ? 70 : 18} far={night ? 260 : 110} />
			<Rig4 sky={night ? '#3a5060' : '#c8d8e8'} ground="#1a2014" hemi={night ? 0.5 : 0.9} key={night ? '#8aa8d0' : '#ffd8a0'} keyI={night ? 1.3 : 1.6} keyPos={[-30, 14, -40]} rim={night ? '#3a5a7a' : '#ffe8c0'} rimI={night ? 1 : 2.2} fill={0.5} span={50} />
			<Ground mat={moss} />
			<Pines area={[-90, 90, -140, 30]} n={night ? 520 : 380} s={[1.6, 3.2]} dark={night ? 0.2 : 0} avoid={night ? undefined : (x, z) => Math.abs(x) < 10 && z > -20} />
			{/* clearing details for the search: fallen logs, rocks, ferns, stumps */}
			{!night ? (
				<>
					{[[-6, -6, 0.4], [7, -12, -0.8], [2, 6, 1.2]].map(([x, z, r], i) => (
						<Cyl key={i} r={0.7} h={9} seg={6} pos={[x, 0.6, z]} rot={[0, r, PI / 2]} color="#4a3a2a" />
					))}
					{[[-9, 2], [10, 4], [-3, -14], [12, -4], [-12, -10]].map(([x, z], i) => (
						<mesh key={i} position={[x, 0.6, z]} rotation={[i, i * 2, 0]}>
							<dodecahedronGeometry args={[0.9 + (i % 3) * 0.4, 0]} />
							<meshLambertMaterial color="#6a6a62" flatShading />
						</mesh>
					))}
					{Array.from({length: 26}, (_, i) => {
						const r = rnd(40 + i);
						return <Fern key={i} pos={[(r() - 0.5) * 30, 0, 12 - r() * 34]} s={0.8 + r() * 0.8} rot={r() * 6} sway={f * 0.05 + i} c={i % 3 ? '#3a6a2a' : '#4a7a32'} />;
					})}
					<Fog f={f} n={14} center={[0, 2, -20]} size={[60, 3, 50]} color="#d8dcd8" op={0.18} />
					{/* dawn god-rays through the canopy */}
					{[-8, 2, 10].map((x, i) => (
						<mesh key={x} position={[x, 14, -24]} rotation={[0, 0, 0.5]}>
							<boxGeometry args={[2.4 + i, 40, 0.1]} />
							<meshBasicMaterial color="#fff0c8" transparent opacity={0.07} depthWrite={false} />
						</mesh>
					))}
				</>
			) : (
				<Rain f={f} n={900} center={[0, 30, -20]} size={[80, 60, 80]} wind={[0.1, -1.6, -0.3]} len={1.6} op={0.4} />
			)}
		</>
	);
};

// ---------- 9  Newsroom, 1971 night shift ----------
export const Newsroom: React.FC<{f: number}> = ({f}) => {
	const floor = useTex(TX.linoleum, 8, 8);
	const wall = useTex(TX.brick, 6, 2);
	const desk = useTex(TX.teak('#5a4a3a'), 2, 1);
	return (
		<>
			<SkyDome top="#141418" bottom="#141418" />
			<Rig4 sky="#e0e8f0" ground="#3a2a1a" hemi={0.8} key="#ffe0b0" keyI={1.2} keyPos={[8, 12, 6]} rim="#7a9ad8" rimI={1.6} fill={0.6} />
			<Ground mat={floor} size={60} />
			<mesh material={wall} position={[0, 7, -10]} receiveShadow>
				<boxGeometry args={[44, 14, 0.4]} />
			</mesh>
			{/* tall windows to the wet city */}
			{[-12, -4, 4, 12].map((x) => (
				<group key={x} position={[x, 7.5, -9.7]}>
					<B size={[5, 8, 0.1]} color="#0a1020" />
					<CityLights center={[0, -2, -0.2]} size={[4.6, 0.01]} n={30} seed={x + 50} />
					<B size={[5.4, 0.3, 0.5]} pos={[0, -4.1, 0.2]} color="#5a4a3a" />
					<B size={[0.2, 8, 0.3]} pos={[0, 0, 0.1]} color="#2a2a2a" />
				</group>
			))}
			<B size={[44, 0.4, 30]} pos={[0, 14, 2]} color="#c8c4b8" />
			{/* ceiling fan + hanging lamps */}
			<group position={[0, 13, 0]} rotation={[0, onTwos(f) * 0.25, 0]}>
				<B size={[7, 0.08, 0.6]} color="#3a2a1a" />
				<B size={[0.6, 0.08, 7]} color="#3a2a1a" />
			</group>
			{[-8, 0, 8].map((x) => (
				<group key={x} position={[x, 11, -2]}>
					<B size={[0.06, 2.4, 0.06]} pos={[0, 1.2, 0]} color="#1a1a1a" />
					<Cyl r={1} r2={0.3} h={0.8} seg={8} color="#2a5a3a" />
					<pointLight position={[0, -0.8, 0]} color="#ffd890" intensity={12} distance={14} />
				</group>
			))}
			{/* rows of desks, typewriters, phones, spikes, paper drifts */}
			{[
				[-8, -4],
				[8, -4],
				[-8, 4],
				[8, 4],
			].map(([x, z], i) => (
				<group key={i} position={[x, 0, z]}>
					<mesh material={desk} position={[0, 2.6, 0]} castShadow receiveShadow>
						<boxGeometry args={[6, 0.3, 3.2]} />
					</mesh>
					<B size={[0.3, 2.5, 3]} pos={[-2.8, 1.25, 0]} color="#3a2e24" />
					<B size={[0.3, 2.5, 3]} pos={[2.8, 1.25, 0]} color="#3a2e24" />
					<Typewriter pos={[0, 2.75, 0]} c={['#3a4a3a', '#5a4a3a', '#2a3a5a', '#4a4a4a'][i]} keys={onTwos(f) / 2 + i} />
					<Phone pos={[2.1, 2.75, 0.6]} rot={0.4} />
					<B size={[0.08, 0.8, 0.08]} pos={[-2.2, 3.15, 0.8]} color="#c8ccd0" />
					{[0, 1, 2].map((k) => (
						<B key={k} size={[1.1, 0.04, 1.4]} pos={[-2.2, 2.9 + k * 0.05, -0.6]} rot={[0, k * 0.3, 0]} color="#e8e4da" shadow={false} />
					))}
					<Ashtray pos={[1.6, 2.75, -0.9]} />
				</group>
			))}
			{/* wall clock showing 2 a.m. and a cork board */}
			<group position={[14, 10, -9.7]}>
				<Cyl r={1.2} h={0.2} seg={10} rot={[PI / 2, 0, 0]} color="#f2efe6" />
				<B size={[0.1, 0.8, 0.05]} pos={[0.3, 0.3, 0.15]} rot={[0, 0, -0.9]} color="#1a1a1a" />
			</group>
			<group position={[-15, 9, -9.7]}>
				<B size={[6, 4, 0.2]} color="#a87a4a" />
				{[[-2, 1], [0, 0.6], [1.6, -0.8], [-1, -1]].map(([x, y], i) => (
					<B key={i} size={[1.4, 1.6, 0.05]} pos={[x, y, 0.15]} rot={[0, 0, (i - 1.5) * 0.1]} color="#f2efe6" />
				))}
			</group>
			<Fog f={f} n={8} center={[0, 9, 0]} size={[30, 3, 14]} color="#d8d0c0" op={0.07} />
		</>
	);
};

// ---------- 10  Tena Bar, Columbia River, February 1980 ----------
export const TenaBar: React.FC<{f: number}> = ({f}) => {
	const sand = useTex(TX.sand, 30, 30);
	return (
		<>
			<SkyDome top="#6a7a8a" bottom="#b8bcb8" fog="#a8aeb0" near={50} far={240} />
			<Rig4 sky="#c8d4e0" ground="#5a5446" hemi={1.1} key="#f0e8d8" keyI={1.2} keyPos={[-20, 18, -10]} rim="#d8e0f0" rimI={1.4} fill={0.6} span={40} />
			{/* the sand bar slopes into the river */}
			<mesh rotation={[-PI / 2 - 0.03, 0, 0]} position={[0, 0.2, 10]} material={sand} receiveShadow>
				<planeGeometry args={[200, 80]} />
			</mesh>
			<Water f={f} size={300} y={-0.8} deep="#4a5a5e" mid="#5a6a6c" hi="#c8d4d4" flow={[0.003, 0.0]} />
			{/* far bank: firs, a pulp mill with a steam plume, power poles */}
			<group position={[0, 0, -110]}>
				<B size={[300, 6, 20]} pos={[0, 2, 0]} color="#3a4436" />
				<Pines area={[-140, 140, -10, 6]} n={160} s={[1.4, 2.4]} seed={9} />
				<group position={[40, 4, 2]}>
					<B size={[24, 10, 10]} pos={[0, 5, 0]} color="#8a8a84" />
					<Cyl r={1.4} h={22} seg={8} pos={[8, 11, 0]} color="#6a6a64" />
					<Smoke f={f} pos={[8, 22, 0]} n={10} h={18} color="#e8e8e4" spread={0.3} scale={0.6} />
				</group>
			</group>
			{/* barge + tug far out on the river */}
			<group position={[-40 + f * 0.05, -0.4, -60]}>
				<B size={[30, 2, 8]} pos={[0, 0.6, 0]} color="#5a4a3a" />
				<B size={[26, 2.6, 7]} pos={[0, 2.6, 0]} color="#8a7a5a" />
				<group position={[18, 0, 0]}>
					<B size={[6, 2.4, 5]} pos={[0, 0.8, 0]} color="#c82a1e" />
					<B size={[3, 2.4, 3]} pos={[0, 3, 0]} color="#e8e4da" />
				</group>
			</group>
			{/* driftwood, a rusted can, the family's picnic: blanket, thermos, cooler, fire */}
			{[[-8, 4, 0.3, 7], [10, -2, -0.5, 9], [-16, -4, 1.1, 6]].map(([x, z, r, l], i) => (
				<Cyl key={i} r={0.45} h={l} seg={6} pos={[x, 0.35, z]} rot={[0, r, PI / 2]} color={['#a8a090', '#8a8272', '#b8ae9a'][i]} />
			))}
			<group position={[7, 0, 6]}>
				<B size={[5, 0.06, 4]} pos={[0, 0.04, 0]} color="#8a2a24" />
				{[-1.5, 0, 1.5].map((x) => (
					<B key={x} size={[0.2, 0.07, 4]} pos={[x, 0.05, 0]} color="#e8d8b8" />
				))}
				<Cyl r={0.3} h={1.2} seg={8} pos={[-1.2, 0.65, -1]} color="#2a5a8a" />
				<B size={[2, 1.4, 1.2]} pos={[1.3, 0.75, -1.2]} color="#c8302a" />
				<B size={[2.1, 0.3, 1.3]} pos={[1.3, 1.55, -1.2]} color="#f2efe6" />
			</group>
			<group position={[12, 0, 1]}>
				{[0, 1, 2, 3, 4, 5].map((k) => (
					<mesh key={k} position={[Math.cos(k) * 1.1, 0.3, Math.sin(k) * 1.1]}>
						<dodecahedronGeometry args={[0.45, 0]} />
						<meshLambertMaterial color="#6a6660" flatShading />
					</mesh>
				))}
				{[0, 1, 2].map((k) => (
					<B key={k} size={[0.25, 0.25, 2]} pos={[0, 0.3, 0]} rot={[0, k * 1.05, 0.15]} color="#4a3626" />
				))}
				<B size={[0.6, 0.8 + Math.sin(onTwos(f) * 0.7) * 0.2, 0.6]} pos={[0, 0.8, 0]} color="#ff8a2a" glow={5} shadow={false} />
				<pointLight position={[0, 1.4, 0]} color="#ff9a4a" intensity={10} distance={10} />
				<Smoke f={f} pos={[0, 1.2, 0]} n={8} h={8} color="#c8c4bc" spread={0.15} scale={0.25} />
			</group>
			{/* 1970s station wagon on the track behind */}
			<group position={[-22, 0, 22]} rotation={[0, 0.5, 0]}>
				<B size={[4.4, 1.6, 10]} pos={[0, 1.6, 0]} color="#8a6a3a" />
				<B size={[4.6, 0.5, 10.2]} pos={[0, 1.4, 0]} color="#5a3a22" />
				<B size={[4.0, 1.4, 6]} pos={[0, 3.0, -1]} color="#2a3038" />
				{[-3.4, 3.2].map((z) => [-2.2, 2.2].map((x) => <Cyl key={`${x}${z}`} r={0.8} h={0.6} seg={8} pos={[x, 0.8, z]} rot={[0, 0, PI / 2]} color="#141414" />))}
			</group>
			{/* gulls wheeling */}
			{[0, 1, 2, 3].map((i) => {
				const a = f * 0.02 + i * 1.6;
				const fl = Math.sin(onTwos(f) * 0.8 + i) * 0.5;
				return (
					<group key={i} position={[Math.cos(a) * (14 + i * 4), 12 + i * 2, -20 + Math.sin(a) * 10]} rotation={[0, -a, 0]}>
						<B size={[0.8, 0.1, 0.25]} pos={[-0.4, 0, 0]} rot={[0, 0, fl]} color="#f2efe6" shadow={false} />
						<B size={[0.8, 0.1, 0.25]} pos={[0.4, 0, 0]} rot={[0, 0, -fl]} color="#f2efe6" shadow={false} />
						<B size={[0.25, 0.25, 0.6]} color="#e8e4da" shadow={false} />
					</group>
				);
			})}
			<Fog f={f} n={10} center={[0, 1.5, -50]} size={[120, 2, 40]} color="#e0e4e0" op={0.08} />
		</>
	);
};

// ---------- 11  Evidence table / tie (shares the FBI office) and the void for the name ----------
export const EvidenceTable: React.FC<{f: number}> = () => {
	const felt = useMemo(() => lambert({color: '#6a7a6a'}), []);
	return (
		<>
			<SkyDome top="#000000" bottom="#050505" />
			<hemisphereLight args={['#3a4050', '#000000', 0.3]} />
			<spotLight position={[0, 12, 2]} angle={0.45} penumbra={0.6} intensity={140} distance={40} color="#ffe8c8" castShadow />
			<mesh material={felt} position={[0, 2.5, 0]} receiveShadow>
				<boxGeometry args={[12, 0.4, 8]} />
			</mesh>
			<B size={[12.4, 0.2, 8.4]} pos={[0, 2.25, 0]} color="#3a2a1e" />
			{/* evidence tag, ruler */}
			<group position={[2.6, 2.75, 1.4]} rotation={[0, -0.3, 0]}>
				<B size={[1.6, 0.04, 0.9]} color="#e8d8a8" />
				<B size={[0.12, 0.06, 0.12]} pos={[-0.65, 0.03, 0]} color="#8a8e94" />
			</group>
			<group position={[-3, 2.73, 2.4]} rotation={[0, 0.1, 0]}>
				<B size={[4, 0.03, 0.4]} color="#e8e4da" />
				{Array.from({length: 13}, (_, i) => (
					<B key={i} size={[0.03, 0.035, i % 4 ? 0.12 : 0.25]} pos={[-1.9 + i * 0.32, 0.01, -0.12]} color="#1a1a1a" shadow={false} />
				))}
			</group>
		</>
	);
};

export {Bundle};
