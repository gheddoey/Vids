import React, {useMemo} from 'react';
import {BlockText} from '../BlockText';
import {onTwos} from '../anim';
import {SunDisc} from '../cine/Cine';
import {BigTree, Bx, Door, GableRoof, LampPost, Mist, Palm2, Pole, Ridge, Road, Shafts, Sky3, SunRig, Treeline, Wall, Window, Wires, flat, glow, mat, rnd, tint} from '../env';
import {Birds, Clouds, Motes, Smoke} from '../escobar/kit';
import {Facade} from '../escobarrf/props';
import {ArenaCrowd, Bicycle, Car50, Glove, Ring, Sign3D} from './props';

// Muhammad Ali locations. Each: full set (FG/MG/BG), story light, ambient motion.
type V3 = [number, number, number];
const PI = Math.PI;

// ===== A. LOUISVILLE 1954: outside the Columbia Auditorium (autumn) =====
// Auditorium front faces +z along z = -8; bike rack at (3, 0.3, -4.5); street runs along x at z ~ +3.
export const Louisville: React.FC<{f: number; bike?: boolean; dusk?: boolean; thief?: number}> = ({f, bike = true, dusk, thief}) => {
	const brick = mat('brick', {base: '#9a4a30', alt: '#c8b49a', seed: 3, wear: 1}, 8, 4);
	const stone = mat('stone', {base: '#c8bca8', alt: '#8a8478', seed: 4}, 6, 1);
	const ff = onTwos(f);
	const leaves = useMemo(() => {
		const r = rnd(9);
		return Array.from({length: 40}, () => [(r() - 0.5) * 30, r() * 9, (r() - 0.5) * 14, r() * 6.28] as [number, number, number, number]);
	}, []);
	return (
		<>
			{dusk ? (
				<Sky3 top="#2a3058" mid="#a8708a" horizon="#f0a070" fog="#a87a78" near={40} far={260} sunDir={[-0.8, 0.05, -0.6]} glowCol="#ffb070" />
			) : (
				<Sky3 top="#5a7aa8" mid="#b8c8d8" horizon="#f0d8b0" fog="#d8c8b0" near={40} far={260} sunDir={[-0.7, 0.3, -0.6]} />
			)}
			<SunRig sun={dusk ? [-0.8, 0.12, -0.4] : [-0.7, 0.45, 0.3]} key={dusk ? '#ff9a5a' : '#ffd8a8'} keyI={dusk ? 2.4 : 2.8} sky={dusk ? '#6a6aa8' : '#a8c0e0'} ground="#5a4a3a" hemi={0.9} rim="#ffd8b0" rimI={1.2} fill={0.6} span={30} />
			<Road len={120} w={9} walk={4} p={[0, 0, 3.5]} r={PI / 2} />
			{/* the auditorium: three storeys of brick, stone base + cornice, arched entrance, marquee */}
			<group position={[0, 0.28, -9]}>
				<Bx s={[26, 14, 10]} p={[0, 7, -5]} m={brick} />
				<Bx s={[26.4, 2.2, 10.4]} p={[0, 1.1, -5]} m={stone} />
				<Bx s={[27, 0.9, 11]} p={[0, 14.2, -5]} m={stone} />
				{[-9, -4.5, 4.5, 9].map((x) => [5.2, 9.4].map((y) => <Window key={`${x}${y}`} w={2} h={2.8} p={[x, y, 0.05]} frame="#e8e0d0" glass="#2a3440" lit={dusk ? '#ffc878' : undefined} />))}
				<Bx s={[6.4, 5.2, 0.5]} p={[0, 2.6, 0.1]} m={stone} />
				<Bx s={[5.2, 4.4, 0.3]} p={[0, 2.2, 0.3]} m={dusk ? glow('#ffc070', 0.8) : flat('#2a2420')} cast={false} />
				<Door p={[-1.2, 0.0, 0.5]} w={2.2} h={3.8} color="#5a3a22" frame="#3a2a1a" />
				<Door p={[1.2, 0.0, 0.5]} w={2.2} h={3.8} color="#5a3a22" frame="#3a2a1a" open={0.5} />
				<Sign3D text="COLUMBIA AUDITORIUM" p={[0, 6.0, 0.6]} size={0.5} color="#1a2a4a" bg="#f2ead2" lit={dusk} />
				<Sign3D text="HOME SHOW TODAY" p={[0, 7.4, 0.6]} size={0.36} color="#c8262a" bg="#f2ead2" w={7} />
				{/* flags-free bunting along the cornice */}
				{Array.from({length: 18}, (_, i) => <Bx key={i} s={[0.6, 0.6, 0.05]} p={[-12 + i * 1.42, 13.2 + Math.sin(i) * 0.1, 0.4]} r={[0, 0, PI / 4]} m={flat(['#c8262a', '#f2f0e8', '#2a4a8a'][i % 3])} cast={false} />)}
			</group>
			{/* neighbours down the block (BG) */}
			<Facade p={[-20, 0.28, -9]} w={12} floors={2} color="#c8b090" sign="DRUG STORE" signCol="#2a4a8a" awning="#c8262a" seed={2} lit={dusk} />
			<Facade p={[20, 0.28, -9]} w={12} floors={3} color="#b8c0a8" sign="DINER" signCol="#c8262a" awning="#2a6a4a" seed={4} lit={dusk} />
			<Facade p={[-14, 0.28, 18]} r={PI} w={12} floors={2} color="#d8c8a0" sign="HARDWARE" seed={6} lit={dusk} />
			<Facade p={[2, 0.28, 18]} r={PI} w={14} floors={3} color="#c8a890" sign="BARBER" signCol="#c8262a" awning="#c8262a" seed={8} lit={dusk} />
			{/* the bike rack (empty after the theft), the bike, street furniture */}
			<group position={[3.2, 0.3, -4.6]}>
				{Array.from({length: 6}, (_, i) => <Bx key={i} s={[0.08, 1.2, 1.0]} p={[i * 0.55 - 1.4, 0.6, 0]} m={flat('#6a6a6a')} />)}
				<Bx s={[3.4, 0.1, 0.1]} p={[0, 1.2, 0]} m={flat('#6a6a6a')} />
			</group>
			{bike ? <Bicycle p={[3.0, 0.3, -4.6]} r={PI / 2} /> : (
				// the cut chain still hanging from the rack
				<group position={[3.0, 1.2, -4.4]}>
					{Array.from({length: 5}, (_, i) => <Bx key={i} s={[0.12, 0.2, 0.06]} p={[0.05 * (i % 2), -i * 0.18, 0.05]} r={[0, 0, (i % 2) * 0.6]} m={flat('#9a9a98')} />)}
				</group>
			)}
			{thief !== undefined ? <Bicycle p={[-6 - thief * 0.4, 0.3, 2.2]} r={-PI / 2} spin={-thief * 0.3} lean={0.08} /> : null}
			<Car50 p={[-9, 0.1, 5.5]} r={PI / 2} color="#3a6a8a" />
			<Car50 p={[12, 0.1, 5.5]} r={PI / 2} color="#c8a23a" roof="#f2f0e8" />
			{[-12, 10].map((x) => <LampPost key={x} p={[x, 0.28, -3]} r={PI} h={7} on={!!dusk} />)}
			<Pole p={[-17, 0.28, 0.5]} h={10} />
			<Pole p={[16, 0.28, 0.5]} h={10} />
			<Wires pts={[[-17, 9.7, 0.5], [16, 9.7, 0.5]] as V3[]} offsets={[-0.9, 0.9]} sag={1.0} />
			<BigTree pos={[-7, 0.28, -1.5]} s={0.8} seed={4} f={f} leaf="#c8762a" flowers="#e8a03a" />
			<BigTree pos={[14, 0.28, -2]} s={0.75} seed={6} f={f} leaf="#b8562a" />
			{/* falling autumn leaves */}
			{leaves.map(([x, y, z, ph], i) => (
				<Bx key={i} s={[0.18, 0.02, 0.14]} p={[x + Math.sin(ff * 0.04 + ph) * 0.8, ((y - ff * 0.03) % 9 + 9) % 9 + 0.3, z]} r={[ff * 0.1 + ph, ph, 0]} m={flat(i % 2 ? '#c8762a' : '#a8422a')} cast={false} />
			))}
			<Treeline z={-40} y={0} n={40} seed={5} x={[-120, 120]} h={[10, 16]} cols={['#a8622a', '#8a7a3a', '#6a7a3a']} />
			{!dusk ? <Clouds f={f} y={50} z={-150} spread={300} n={10} color="#ffffff" speed={0.03} /> : null}
			<Birds f={f} from={[-40, 22, -40]} dir={[0.3, 0, 0.05]} n={6} />
		</>
	);
};

// ===== B. THE GYM: Joe Martin's basement gym (and the empty gym of the exile years) =====
// Ring at the back (z -8), bags along the left, benches + lockers right; camera usually from +z.
export const Gym: React.FC<{f: number; empty?: boolean; sliced?: number}> = ({f, empty, sliced = 0}) => {
	const brick = mat('brick', {base: '#8a4a34', alt: '#b8a890', seed: 11, wear: 1.6}, 10, 3);
	const floor = mat('planks', {base: '#7a5a3a', seed: 12, wear: 1}, 8, 8);
	const ff = onTwos(f);
	return (
		<>
			<Sky3 top="#1a1612" mid="#1a1612" horizon="#1a1612" />
			<hemisphereLight args={['#ffe8c8', '#2a1a10', empty ? 0.35 : 0.6]} />
			{[-6, 0, 6].map((x, i) => (
				<group key={x}>
					<pointLight position={[x, 9.4, -2]} intensity={empty && i !== 1 ? 0 : 26} distance={22} decay={1.4} color="#ffd8a0" castShadow={i === 1} />
					<Bx s={[0.05, 1.2, 0.05]} p={[x, 10.6, -2]} m={flat('#1a1a1a')} />
					<Bx s={[0.5, 0.5, 0.5]} p={[x, 9.9, -2]} m={empty && i !== 1 ? flat('#3a3430') : glow('#ffe8b0', 3)} cast={false} />
				</group>
			))}
			<directionalLight position={[-12, 9, 12]} intensity={empty ? 0.5 : 0.9} color="#a8c0ff" />
			{/* basement room: brick walls, low ceiling with pipes, high little windows at street level */}
			<Bx s={[30, 0.2, 30]} p={[0, -0.1, 0]} m={floor} />
			<Wall w={30} h={11} m={brick} p={[0, 0, -14]} holes={[{x: -8, y: 8.6, w: 4, h: 1.6}, {x: 8, y: 8.6, w: 4, h: 1.6}]} />
			{[-8, 8].map((x) => <Bx key={x} s={[4, 1.6, 0.1]} p={[x, 9.4, -13.9]} m={glow(empty ? '#6a7aa8' : '#d8e8ff', empty ? 0.6 : 1.2)} cast={false} />)}
			<Wall w={30} h={11} m={brick} p={[-15, 0, 0]} r={PI / 2} />
			<Wall w={30} h={11} m={brick} p={[15, 0, 0]} r={-PI / 2} />
			<Bx s={[30, 0.3, 30]} p={[0, 11.1, 0]} m={mat('concrete', {base: '#6a625a', seed: 13, wear: 2}, 6, 6)} />
			{[-10, -3, 4].map((z) => <Bx key={z} s={[30, 0.4, 0.4]} p={[0, 10.5, z]} m={flat('#5a5a58')} />)}
			<Shafts from={[-8, 9.4, -13.8]} dir={[0.25, -0.5, 1]} n={3} len={14} spread={0.3} w={1.4} op={empty ? 0.05 : 0.08} color="#e8f0ff" f={f} />
			<group position={[2, 0, -7]} scale={0.6}>
				<Ring f={f} size={18} lights={false} />
			</group>
			{/* heavy bags on chains, swinging; a speed bag platform */}
			{[[-11, 2], [-11, -3.5]].map(([x, z], i) => {
				const sw = empty ? 0 : Math.sin(ff * 0.12 + i * 2) * 0.12;
				return (
					<group key={i} position={[x, 10.3, z]} rotation={[sw, 0, sw * 0.5]}>
						<Bx s={[0.08, 2.6, 0.08]} p={[0, -1.3, 0]} m={flat('#3a3a3a')} />
						<mesh position={[0, -4.4, 0]} material={mat('fabric', {base: i ? '#8a2a2a' : '#3a2a20', alt: '#2a1a14', seed: i}, 1, 2)} castShadow>
							<cylinderGeometry args={[0.8, 0.8, 3.8, 8]} />
						</mesh>
					</group>
				);
			})}
			<group position={[-8, 0, -12.5]}>
				<Bx s={[3, 0.3, 1.6]} p={[0, 6.2, 0.6]} m={flat('#5a3a22')} />
				<Bx s={[0.6, 0.8, 0.6]} p={[0, 5.5, 0.9 + (empty ? 0 : Math.sin(ff * 1.3) * 0.15)]} m={flat('#b8862a')} />
			</group>
			{/* benches, lockers, a jump rope, the fight-card sign, gloves on a bench (one sliced open) */}
			<Bx s={[5, 0.3, 1.2]} p={[9, 1.4, 4]} m={flat('#6a4a2a')} />
			{[-2, 2].map((x) => <Bx key={x} s={[0.3, 1.3, 1.0]} p={[9 + x, 0.65, 4]} m={flat('#6a4a2a')} />)}
			{Array.from({length: 5}, (_, i) => (
				<group key={i} position={[14.5, 0, -6 + i * 2.2]}>
					<Bx s={[0.9, 6, 2.0]} p={[0, 3, 0]} m={mat('tin', {base: '#5a6a5a', seed: 20 + i, wear: 1}, 1, 2)} />
					<Bx s={[0.1, 0.3, 0.3]} p={[-0.5, 3.6, 0.5]} m={flat('#c8c8c8')} />
				</group>
			))}
			<Sign3D text="BOXING TUESDAY 7PM" p={[0, 6.5, -13.6]} size={0.4} color="#c8262a" />
			<group position={[7.6, 1.95, 4]} rotation={[0, sliced > 0 ? -1.03 : -0.4, 0]}>
				<Glove half={sliced > 0} color="#b82a2a" s={sliced > 0 ? 1.5 : 0.9} />
			</group>
			<group position={[10.4, 1.95, 4.2]} rotation={[0, 0.5, 0]}>
				<Glove color="#8a2a2a" s={0.9} />
			</group>
			{sliced > 0.3 ? (
				<group position={[7.6, 5.4, 4]} scale={Math.min(1, (sliced - 0.3) * 2)}>
					<Bx s={[0.05, 1.4, 0.05]} p={[0, -1.0, 0]} m={glow('#ffe8a0', 2)} cast={false} />
					<Bx s={[3.6, 0.8, 0.2]} m={flat('#141414')} />
					<BlockText text="HORSEHAIR" size={0.38} depth={0.08} color="#f2d040" side="#6a5010" position={[0, -0.18, 0.12]} />
				</group>
			) : null}
			<Motes f={f} n={80} center={[-4, 5, -6]} size={[16, 8, 12]} color="#ffe8c0" glow={1.3} s={0.05} />
		</>
	);
};

// ===== C. ROME 1960: the Palazzetto-style domed arena, medal podium on the ring =====
export const Rome: React.FC<{f: number}> = ({f}) => (
	<>
		<Sky3 top="#14100c" mid="#14100c" horizon="#14100c" />
		<hemisphereLight args={['#fff0d8', '#2a2018', 0.6]} />
		<directionalLight position={[6, 30, 14]} intensity={2.0} color="#fff4e0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
		<directionalLight position={[-8, 8, -18]} intensity={1.3} color="#ffd8a0" />
		<directionalLight position={[0, 6, 20]} intensity={0.6} color="#dfe8ff" />
		<Ring f={f} size={20} corner={['#2a4a9a', '#c8262a']} />
		{/* the podium on the canvas: 1-2-3 blocks */}
		{[[0, 1.8, '1'], [-3.2, 1.2, '2'], [3.2, 0.9, '3']].map(([x, h, n], i) => (
			<group key={i} position={[x as number, 2.4, -2]}>
				<Bx s={[2.8, h as number, 2.4]} p={[0, (h as number) / 2, 0]} m={flat('#f2f0e8')} />
				<BlockText text={n as string} size={0.6} depth={0.1} color="#c8a23a" position={[0, (h as number) / 2 - 0.3, 1.25]} />
			</group>
		))}
		<ArenaCrowd f={f} inner={17} rows={16} rise={1.5} step={2.2} seed={7} flash={0.03} cols={['#e8e0cc', '#2a2c34', '#5a4a3a', '#f2f0e8', '#3a4a6a']} />
		{/* the ribbed concrete dome */}
		{Array.from({length: 24}, (_, i) => {
			const a = (i / 24) * PI * 2;
			return <Bx key={i} s={[1.0, 0.8, 40]} p={[Math.cos(a) * 20, 34, Math.sin(a) * 20]} r={[0.55, -a + PI / 2, 0]} m={flat('#c8c0b0')} cast={false} />;
		})}
		<Bx s={[100, 0.5, 100]} p={[0, 46, 0]} m={flat('#1a1612')} cast={false} />
		<Motes f={f} n={100} center={[0, 12, 0]} size={[30, 20, 30]} color="#fff0d0" glow={1.3} s={0.06} />
	</>
);

// ===== D. ARENAS around the ring: Miami 1964 / Madison Square Garden 1971 / Kinshasa 1974 =====
export const Arena: React.FC<{f: number; kind: 'miami' | 'msg' | 'kinshasa'; cheer?: number; ropeBow?: number}> = ({f, kind, cheer = 0, ropeBow = 0}) => {
	const night = kind === 'kinshasa';
	return (
		<>
			{night ? <Sky3 top="#02040c" mid="#0a1020" horizon="#1a2030" fog="#101828" near={60} far={300} /> : <Sky3 top="#0c0a08" mid="#0c0a08" horizon="#0c0a08" fog="#1a1410" near={50} far={200} />}
			<hemisphereLight args={[night ? '#5a6a9a' : '#ffe8c8', '#2a2018', 0.8]} />
			<directionalLight position={[3, 40, 5]} intensity={2.6} color={kind === 'msg' ? '#f0f4ff' : '#fff0d8'} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
			<directionalLight position={[-14, 10, -16]} intensity={1.6} color={night ? '#6a8aff' : '#ffc890'} />
			<directionalLight position={[0, 8, 22]} intensity={1.0} color="#dfe8ff" />
			<directionalLight position={[20, 7, 6]} intensity={0.8} color="#ffe8d0" />
			<Ring f={f} size={20} corner={kind === 'kinshasa' ? ['#b8262a', '#2a4a9a'] : ['#2a2a2a', '#c8262a']} ropeBow={ropeBow} bowSide={0} />
			{/* press row: tables + typewriters at the apron */}
			{[-1, 1].map((sd) => (
				<group key={sd} position={[0, 0, sd * 13.5]}>
					<Bx s={[24, 1.6, 1.4]} p={[0, 0.8, 0]} m={flat('#3a2a1e')} />
					{Array.from({length: 8}, (_, i) => <Bx key={i} s={[0.9, 0.4, 0.7]} p={[-10 + i * 2.8, 1.8, 0]} m={flat('#2a2a2a')} />)}
				</group>
			))}
			<ArenaCrowd f={f} inner={kind === 'kinshasa' ? 22 : 16} rows={kind === 'msg' ? 20 : kind === 'kinshasa' ? 24 : 12} rise={kind === 'msg' ? 1.9 : 1.4} step={2.3} seed={kind === 'msg' ? 11 : kind === 'kinshasa' ? 13 : 5} flash={kind === 'msg' ? 0.05 : 0.03} cheer={cheer} />
			{kind === 'kinshasa' ? (
				<>
					{/* open-air stadium: floodlight towers, palms beyond the stands, humid haze, storm clouds */}
					{[[-50, -50], [50, -50], [-50, 50], [50, 50]].map(([x, z], i) => (
						<group key={i} position={[x, 0, z]}>
							<Bx s={[1.2, 50, 1.2]} p={[0, 25, 0]} m={flat('#4a4a4a')} />
							<Bx s={[7, 4, 1]} p={[0, 50, 0]} r={[0, Math.atan2(-x, -z), 0]} m={glow('#fff4d8', 3)} cast={false} />
						</group>
					))}
					{Array.from({length: 14}, (_, i) => <Palm2 key={i} pos={[-90 + i * 14, 26, -95 - (i % 3) * 8]} s={2.2} seed={i} f={f} />)}
					<Mist f={f} bands={[{y: 18, z: -30, w: 200, d: 60, op: 0.25}]} color="#a8b8d8" speed={0.2} />
					<Clouds f={f} y={90} z={-200} spread={500} n={10} color="#3a4060" speed={0.02} />
				</>
			) : (
				// indoor: a dark roof with the lighting truss, cigar smoke in the beams
				<>
					<Bx s={[140, 1, 140]} p={[0, 48, 0]} m={flat('#0a0806')} cast={false} />
					<Smoke f={f} pos={[-8, 10, -6]} n={8} h={20} color="#5a5048" spread={0.3} />
					<Smoke f={f} pos={[10, 10, 8]} n={8} h={20} color="#5a5048" spread={0.3} />
				</>
			)}
			<Shafts from={[0, 19, 0]} dir={[0, -1, 0.001]} n={5} len={17} spread={0.9} w={4} op={0.05} color="#fff4e0" f={f} />
			<Motes f={f} n={120} center={[0, 10, 0]} size={[22, 16, 22]} color="#fff0d0" glow={1.4} s={0.06} />
		</>
	);
};

// ===== E. PRESS ROOM 1964: microphones on a table, flashbulbs =====
export const PressRoom: React.FC<{f: number}> = ({f}) => {
	const ff = onTwos(f);
	return (
		<>
			<Sky3 top="#1a1410" mid="#1a1410" horizon="#1a1410" />
			<hemisphereLight args={['#ffe8c8', '#2a1a10', 0.6]} />
			<directionalLight position={[-8, 10, 10]} intensity={2.0} color="#fff0d8" castShadow />
			<directionalLight position={[6, 6, -10]} intensity={1.4} color="#ffd0a0" />
			<pointLight position={[3, 5, 6]} intensity={(ff % 23) < 2 ? 60 : 0} distance={20} color="#ffffff" />
			<pointLight position={[-4, 5, 7]} intensity={(ff % 31) < 2 ? 50 : 0} distance={20} color="#ffffff" />
			<Bx s={[24, 0.2, 20]} p={[0, -0.1, 0]} m={mat('tiles', {base: '#8a7a6a', alt: '#6a5a4a', seed: 3}, 8, 8)} />
			<Wall w={24} h={11} m={mat('planks', {base: '#6a4a2c', seed: 5}, 6, 3)} p={[0, 0, -6]} holes={[{x: -6, y: 3, w: 3, h: 5}]} />
			<Window w={3} h={5} p={[-6, 3, -5.95]} frame="#e8e0d0" glass="#c8d8e8" />
			<Shafts from={[-6, 6, -6]} dir={[0.4, -0.5, 1]} n={3} len={14} spread={0.3} w={1.5} op={0.07} f={f} />
			{/* the table, a tablecloth, a dozen microphones of the era, a water jug */}
			<Bx s={[10, 2.4, 2.4]} p={[0, 1.2, -1.5]} m={mat('fabric', {base: '#e8e0cc', alt: '#d0c8b4', seed: 7}, 3, 1)} />
			{Array.from({length: 11}, (_, i) => (
				<group key={i} position={[-2.5 + i * 0.5, 2.4, -0.6 + (i % 3) * 0.15]} rotation={[-0.3, (i - 5) * 0.08, 0]}>
					<Bx s={[0.06, 1.2 + (i % 4) * 0.2, 0.06]} p={[0, 0.6, 0]} m={flat('#1a1a1a')} />
					<Bx s={[0.24, 0.35, 0.24]} p={[0, 1.3 + (i % 4) * 0.2, 0]} m={flat(['#c8c8c8', '#1a1a1a', '#2a4a8a', '#8a8a8a'][i % 4])} />
				</group>
			))}
			<Bx s={[0.5, 0.8, 0.5]} p={[3.6, 2.8, -1.5]} m={flat('#c8d8e8', {transparent: true, opacity: 0.7})} />
			{/* reporters' backs in the FG (instanced simple figures) */}
			<group position={[0, 0, 4]}>
				<ArenaCrowd f={f} inner={3} rows={2} rise={0.2} step={1.8} seed={21} flash={0.08} sides={[2]} cols={['#2a2c34', '#5a4a3a', '#3a3a44', '#6a5a48']} />
			</group>
			<Motes f={f} n={60} center={[0, 5, 0]} size={[14, 6, 10]} color="#ffe8c8" glow={1.2} s={0.05} />
		</>
	);
};

// ===== F. INDUCTION CENTER, Houston 1967: institutional room, a line on the floor =====
export const Induction: React.FC<{f: number}> = ({f}) => (
	<>
		<Sky3 top="#d8d8d0" mid="#d8d8d0" horizon="#d8d8d0" />
		<hemisphereLight args={['#f0f0e8', '#3a3a30', 0.8]} />
		<directionalLight position={[-14, 12, 4]} intensity={2.2} color="#fff8e8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
		<directionalLight position={[8, 6, 16]} intensity={0.6} color="#e8f0ff" />
		<Bx s={[34, 0.2, 26]} p={[0, -0.1, 0]} m={mat('tiles', {base: '#a8a89a', alt: '#8a8a7c', seed: 6}, 12, 10)} />
		<Wall w={34} h={11} m={mat('concrete', {base: '#c8ccc0', seed: 7, wear: 1}, 8, 3)} p={[0, 0, -9]} />
		<Wall w={26} h={11} m={mat('concrete', {base: '#c8ccc0', seed: 8, wear: 1}, 8, 3)} p={[-17, 0, 4]} r={PI / 2} holes={[-6, 1, 8].map((x) => ({x, y: 3.5, w: 3.4, h: 5}))} />
		{[-6, 1, 8].map((x) => (
			<group key={x}>
				<Window w={3.4} h={5} p={[-16.9, 3.5, 4 - x]} r={PI / 2} frame="#d8d8c8" glass="#f0f4e8" />
				{/* venetian blinds: striped light */}
				{Array.from({length: 8}, (_, k) => <Bx key={k} s={[0.06, 0.12, 3.4]} p={[-16.6, 3.8 + k * 0.6, 4 - x]} m={flat('#d8d8c8')} />)}
			</group>
		))}
		<Bx s={[34, 0.3, 26]} p={[0, 11.1, 0]} m={flat('#e8e8e0')} />
		{[-8, 0, 8].map((x) => <Bx key={x} s={[1.2, 0.2, 6]} p={[x, 10.9, 0]} m={glow('#f8fff0', 1.4)} cast={false} />)}
		{/* the yellow line on the floor, the officer's lectern, a flag on a pole, a clock, chairs */}
		<Bx s={[26, 0.03, 0.3]} p={[0, 0.02, 0]} m={flat('#e8c030')} cast={false} />
		<Bx s={[2.4, 3.2, 1.4]} p={[0, 1.6, -6.4]} m={mat('planks', {base: '#6a4a2c', seed: 9}, 1, 2)} />
		<group position={[-6, 0, -8]}>
			<Bx s={[0.12, 8, 0.12]} p={[0, 4, 0]} m={flat('#c8a23a')} />
			{Array.from({length: 7}, (_, i) => <Bx key={i} s={[2.6, 0.24, 0.05]} p={[1.35, 7.6 - i * 0.24, 0]} m={flat(i % 2 ? '#f2f0e8' : '#b8262a')} />)}
			<Bx s={[1.1, 0.96, 0.06]} p={[0.6, 7.25, 0.01]} m={flat('#2a3a7a')} />
		</group>
		<group position={[6, 7.5, -8.8]}>
			<mesh rotation={[PI / 2, 0, 0]} material={flat('#f2f0e8')}>
				<cylinderGeometry args={[0.8, 0.8, 0.15, 12]} />
			</mesh>
			<Bx s={[0.06, 0.6, 0.05]} p={[0, 0.25, 0.1]} m={flat('#1a1a1a')} />
		</group>
		{Array.from({length: 8}, (_, i) => <Bx key={i} s={[1.0, 0.15, 1.0]} p={[-10 + i * 2.6, 1.6, 7]} m={flat('#5a6a7a')} />)}
		<Motes f={f} n={50} center={[-8, 5, 2]} size={[10, 6, 10]} color="#ffffff" glow={1.1} s={0.04} />
	</>
);

// ===== G. COURTROOM (Houston 1967) and the SUPREME COURT (1971) =====
export const Court: React.FC<{f: number; supreme?: boolean}> = ({f, supreme}) => {
	const wood = mat('planks', {base: supreme ? '#5a2e1c' : '#6a4428', seed: 14}, 6, 2);
	return (
		<>
			<Sky3 top="#1a1410" mid="#1a1410" horizon="#1a1410" />
			<hemisphereLight args={['#fff0d8', '#2a1a10', 0.7]} />
			<directionalLight position={[-10, 14, 12]} intensity={2.0} color="#fff0d8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
			<directionalLight position={[6, 8, -16]} intensity={1.0} color="#ffd8a0" />
			<directionalLight position={[0, 6, 20]} intensity={0.5} color="#e0e8ff" />
			<Bx s={[34, 0.2, 30]} p={[0, -0.1, 0]} m={supreme ? mat('stone', {base: '#d8d0c0', alt: '#a8a090', seed: 3}, 8, 8) : mat('tiles', {base: '#7a2a2a', alt: '#6a2424', seed: 4}, 8, 8)} />
			<Wall w={34} h={14} m={supreme ? mat('fabric', {base: '#7a1a1a', alt: '#5a1010', seed: 6}, 6, 3) : wood} p={[0, 0, -10]} />
			{supreme
				? Array.from({length: 6}, (_, i) => (
						<group key={i} position={[-13 + i * 5.2, 0, -8.6]}>
							<Bx s={[1.2, 13, 1.2]} p={[0, 6.5, 0]} m={mat('stone', {base: '#e8e0d0', alt: '#c8c0b0', seed: 10 + i}, 1, 4)} />
							<Bx s={[1.6, 0.6, 1.6]} p={[0, 13, 0]} m={flat('#e8e0d0')} />
						</group>
					))
				: null}
			{/* the bench: long and raised; supreme = nine chairs, one empty (Marshall recused) */}
			<Bx s={[supreme ? 26 : 8, 3.6, 2.6]} p={[0, 1.8, -6]} m={wood} />
			<Bx s={[supreme ? 26.4 : 8.4, 0.25, 3]} p={[0, 3.7, -6]} m={flat('#3a1e10')} />
			{supreme
				? Array.from({length: 9}, (_, i) => <Bx key={i} s={[1.6, 4.2, 0.8]} p={[-11 + i * 2.75, 3.6, -7.6]} m={flat('#2a1a14')} />)
				: <Bx s={[1.8, 4.6, 0.8]} p={[0, 3.8, -7.6]} m={flat('#2a1a14')} />}
			{!supreme ? (
				<>
					<group position={[-7, 0, -8]}>
						<Bx s={[0.12, 8, 0.12]} p={[0, 4, 0]} m={flat('#c8a23a')} />
						{Array.from({length: 7}, (_, i) => <Bx key={i} s={[2.6, 0.24, 0.05]} p={[1.35, 7.6 - i * 0.24, 0]} m={flat(i % 2 ? '#f2f0e8' : '#b8262a')} />)}
						<Bx s={[1.1, 0.96, 0.06]} p={[0.6, 7.25, 0.01]} m={flat('#2a3a7a')} />
					</group>
					{/* jury box (right), counsel tables (FG) */}
					<Bx s={[2, 2.4, 10]} p={[12, 1.2, -1]} m={wood} />
					{[-5, 5].map((x) => <Bx key={x} s={[6, 2.2, 2.2]} p={[x, 1.1, 4]} m={wood} />)}
				</>
			) : null}
			<Motes f={f} n={60} center={[0, 6, -2]} size={[20, 8, 10]} color="#ffe8c8" glow={1.2} s={0.05} />
		</>
	);
};

// Gavel (for the sentencing), animated by the shot.
export const Gavel: React.FC<{lift: number}> = ({lift}) => (
	<group>
		<Bx s={[1.2, 0.3, 1.2]} m={flat('#3a1e10')} />
		<group position={[0.9, 0.3, 0]} rotation={[0, 0, lift]}>
			<Bx s={[1.8, 0.12, 0.12]} p={[-0.9, 0, 0]} m={flat('#5a3420')} />
			<mesh position={[-1.8, 0, 0]} rotation={[PI / 2, 0, 0]} material={flat('#4a2a18')}>
				<cylinderGeometry args={[0.28, 0.28, 0.9, 8]} />
			</mesh>
		</group>
	</group>
);

// ===== H. ATLANTA 1996: the Olympic stadium at night, the cauldron tower =====
export const Atlanta: React.FC<{f: number; lit?: number}> = ({f, lit = 0}) => {
	const ff = onTwos(f);
	return (
		<>
			<Sky3 top="#02040e" mid="#0a1024" horizon="#1a2038" fog="#0a1024" near={80} far={400} />
			<hemisphereLight args={['#4a5a9a', '#0a0a10', 0.4]} />
			<directionalLight position={[10, 30, 20]} intensity={1.4} color="#e0e8ff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
			<directionalLight position={[-14, 8, -10]} intensity={1.2} color="#8aa8ff" />
			{/* the torch light on his face + a soft key from the stage lights */}
			<pointLight position={[1.2, 11.5, -4.0]} intensity={26} distance={12} decay={1.5} color="#ffb060" />
			<directionalLight position={[8, 14, -14]} intensity={1.2} color="#e8eeff" />
			{/* platform where he stands; the cauldron tower behind, fire climbing up the line */}
			<Bx s={[10, 6, 8]} p={[0, 3, 0]} m={mat('concrete', {base: '#8a8a90', seed: 3}, 3, 2)} />
			<group position={[0, 0, -26]}>
				{[[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]].map(([x, z], i) => <Bx key={i} s={[0.6, 44, 0.6]} p={[x * (1 - 0.0), 22, z]} m={flat('#c8c8c8')} />)}
				{Array.from({length: 10}, (_, i) => <Bx key={i} s={[5.6, 0.3, 5.6]} p={[0, 4 + i * 4.2, 0]} m={flat('#a8a8a8')} />)}
				<mesh position={[0, 46, 0]} material={flat('#c8a23a')}>
					<cylinderGeometry args={[6, 2, 4, 12]} />
				</mesh>
				{lit > 0 ? (
					<>
						<Bx s={[1.2, 44 * lit, 1.2]} p={[0, (44 * lit) / 2 + 2, 3.2]} m={glow('#ffb040', 3)} cast={false} />
						<Bx s={[2.2, 2.2, 2.2]} p={[0, 44 * lit + 2, 3.2]} r={[ff, ff, 0]} m={glow('#ffd070', 4)} cast={false} />
						<pointLight position={[0, 44 * lit + 2, 6]} intensity={80} distance={60} decay={1.4} color="#ffa040" />
					</>
				) : null}
				{lit >= 1 ? <Smoke f={f} pos={[0, 47, 0]} n={14} h={22} color="#ff8a2a" ember spread={0.15} scale={1.4} /> : null}
			</group>
			<group position={[0, -12, 0]}>
				<ArenaCrowd f={f} inner={40} rows={22} rise={2.2} step={2.6} seed={17} flash={0.12} cheer={lit > 0 ? 0.5 : 0} />
			</group>
			<Motes f={f} n={120} center={[0, 10, -10]} size={[60, 30, 40]} color="#ffffff" glow={2} s={0.08} />
		</>
	);
};

export {GableRoof, Ridge, SunDisc, Smoke};
