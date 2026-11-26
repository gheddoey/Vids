import React, {useMemo} from 'react';
import {BlockText} from '../BlockText';
import {onTwos} from '../anim';
import {SunDisc} from '../cine/Cine';
import {
	BigTree,
	Blades,
	Bush,
	Bx,
	Fence,
	GableRoof,
	Laundry,
	Palm2,
	Pole,
	Ridge,
	Shafts,
	Sky3,
	SunRig,
	Terrain,
	Treeline,
	Wall,
	Window,
	Door,
	Wires,
	flat,
	glow,
	mat,
	scatter,
	tint,
	tuft,
	vnoise,
} from '../env';
import {Birds, Clouds, Motes, Smoke} from '../escobar/kit';
import {CashBrick} from '../escobar/sets';
import {Helicopter} from './props';
import {Valley} from './sets';

type V3 = [number, number, number];
const PI = Math.PI;
const nz = vnoise(11);

// ===== C. HACIENDA NAPOLES: white colonial mansion, pool terrace, palms, jungle hills (3a, 3b) =====
// Mansion front faces +z at z = -9; pool centred at the origin; Pablo at the pool's far edge.
export const Napoles: React.FC<{f: number; cut?: number; heli?: V3}> = ({f, cut = 0, heli}) => {
	const white = mat('plaster', {base: '#f2ede0', alt: '#c8a080', seed: 3, wear: 0.6}, 6, 2);
	const tile = mat('rooftile', {base: '#a84a2a', seed: 4}, 8, 3);
	const stone = mat('tiles', {base: '#d8c8a8', alt: '#c8b090', seed: 5}, 10, 8);
	const water = mat('water', {base: '#2a8ac0', alt: '#c8f0ff', seed: 6}, 4, 2);
	const groundY = (x: number, z: number) => (Math.abs(x) < 22 && z > -24 && z < 14 ? -0.02 : nz(x * 0.04, z * 0.04) * 4 - 0.5 + Math.max(0, -z - 40) * 0.15);
	const lawn = useMemo(() => scatter(500, {x: [-40, 40], z: [-30, 20]}, {seed: 8, h: [0.2, 0.5], cols: ['#4a8a2e', '#5a9a36', '#3a7a2a'], keep: (x, z) => !(Math.abs(x) < 15 && z > -20 && z < 6)}), []);
	const ff = onTwos(f);
	return (
		<>
			<Sky3 top="#2a5aa0" mid="#8ab8e0" horizon="#ffe0b0" fog="#e8d8b8" near={60} far={420} sunDir={[-0.6, 0.35, -0.7]} />
			<SunDisc pos={[-260, 160, -300]} color="#fff0c0" r={14} i={4} />
			<SunRig sun={[-0.7, 0.55, 0.3]} key="#ffd8a0" keyI={3.0} sky="#a8c8f0" ground="#5a7a3a" hemi={0.9} rim="#fff0d0" rimI={1.2} fill={0.6} span={34} />
			<Terrain w={240} d={200} nx={48} nz={40} pos={[0, 0, -50]} height={groundY} color={(_x, y, _z, sl, r) => (sl > 0.4 ? tint('#7a6a44', (r - 0.5) * 0.2) : tint(r < 0.5 ? '#4a8a2e' : '#56922f', (r - 0.5) * 0.15))} />
			<Blades items={lawn} f={f} wind={0.6} />
			{/* terrace + pool */}
			<Bx s={[30, 0.3, 22]} p={[0, 0.0, -2]} m={stone} />
			<Bx s={[15, 0.4, 7]} p={[0, 0.05, 0]} m={flat('#e8e4d8')} />
			<mesh position={[0, 0.27, 0]} rotation={[-PI / 2, 0, 0]} material={water}>
				<planeGeometry args={[14, 6]} />
			</mesh>
			{(water.map!.offset.set(ff * 0.003, ff * 0.002), null)}
			{[-5, -2, 1, 4].map((x, i) => (
				<group key={x} position={[x, 0.15, 5.0]} rotation={[0, (i % 2 ? 0.1 : -0.1), 0]}>
					<Bx s={[1.2, 0.3, 3.0]} p={[0, 0.5, 0]} m={flat('#f2f0ea')} />
					<Bx s={[1.2, 0.9, 0.2]} p={[0, 0.9, -1.4]} r={[-0.5, 0, 0]} m={flat('#f2f0ea')} />
					<Bx s={[1.1, 0.12, 2.6]} p={[0, 0.7, 0.1]} m={flat(['#2a6a9a', '#e8c84a', '#2a6a9a', '#c84a3a'][i])} />
				</group>
			))}
			{[[-8.5, 5], [8.5, 4]].map(([x, z], i) => (
				<group key={i} position={[x, 0.15, z]}>
					<Bx s={[0.12, 3.2, 0.12]} p={[0, 1.6, 0]} m={flat('#e8e4d8')} />
					<Bx s={[3.6, 0.3, 3.6]} p={[0, 3.2, 0]} r={[0, 0.78, 0]} m={mat('fabric', {base: i ? '#e8e0d0' : '#2a6a4a', alt: '#c84a3a', seed: i}, 2, 2)} />
				</group>
			))}
			{/* the mansion: two storeys, arcaded veranda, tile roof, shuttered windows */}
			<group position={[0, 0.15, -14]}>
				<Bx s={[24, 8, 10]} p={[0, 4, 0]} m={white} />
				<GableRoof w={24} d={10} rise={3} m={tile} p={[0, 8, 0]} over={1.0} edge="#8a3a1e" />
				{/* veranda: columns + arches + upper balcony */}
				<Bx s={[24, 0.4, 3.6]} p={[0, 3.9, 6.8]} m={white} />
				<Bx s={[24.4, 0.3, 3.8]} p={[0, 4.25, 6.8]} m={tile} />
				{Array.from({length: 9}, (_, i) => (
					<group key={i} position={[-11.5 + i * 2.875, 0, 8.4]}>
						<Bx s={[0.6, 3.7, 0.6]} p={[0, 1.85, 0]} m={white} />
						<Bx s={[0.9, 0.3, 0.9]} p={[0, 0.15, 0]} m={flat('#d8d0c0')} />
					</group>
				))}
				{Array.from({length: 8}, (_, i) => <Bx key={i} s={[2.2, 0.5, 0.5]} p={[-10.06 + i * 2.875, 3.45, 8.4]} m={white} />)}
				{Array.from({length: 23}, (_, i) => <Bx key={i} s={[0.12, 0.9, 0.12]} p={[-11.5 + i * 1.045, 4.85, 8.55]} m={flat('#3a2a1e')} />)}
				<Bx s={[24, 0.12, 0.12]} p={[0, 5.3, 8.55]} m={flat('#3a2a1e')} />
				{[-9, -5, -1, 3, 7].map((x) => <Window key={x} w={1.6} h={2.4} p={[x + 1, 5.0, 5.05]} frame="#e8e0d0" shutters="#2a5a3a" open={1.3} glass="#2a3438" />)}
				{[-8, -4, 4, 8].map((x) => <Window key={x} w={1.6} h={2.2} p={[x, 0.6, 5.05]} frame="#e8e0d0" shutters="#2a5a3a" open={1.3} glass="#2a3438" />)}
				<Door p={[0, 0, 5.06]} w={2.4} h={3.2} color="#5a3a22" frame="#3a2a1e" />
				{/* the east wing: its front wall slices open to reveal cash hidden in the wall cavity */}
				<group position={[16, 0, 1]}>
					<Bx s={[8, 5.5, 6]} p={[0, 2.75, -1]} m={white} />
					{[-1, 1].map((k) => <Bx key={k} s={[0.4, 5.5, 2.2]} p={[k * 3.8, 2.75, 3.0]} m={white} />)}
					<GableRoof w={8} d={8} rise={2.2} m={tile} p={[0, 5.5, 0]} over={0.8} edge="#8a3a1e" />
					{/* cavity behind the front wall */}
					<Bx s={[7.2, 0.3, 2.2]} p={[0, 0.15, 3.0]} m={flat('#3a3028')} />
					{[0, 0.8].flatMap((dz) => Array.from({length: 7}, (_, r) => Array.from({length: 4}, (_, c) => <group key={`${dz}-${r}-${c}`} position={[0, 0, dz]}><CashBrick key={`${r}-${c}`} pos={[-2.5 + c * 1.66, 0.6 + r * 0.6, 2.6 + (r % 2) * 0.1]} band={(r + c) % 2 === 0} /></group>)))}
					{/* the cutaway: the wall hinges down at its base and falls open toward us */}
					<group position={[0, 0, 4.05]} rotation={[cut * 1.45, 0, 0]}>
						<Bx s={[8, 5.5, 0.4]} p={[0, 2.75, 0]} m={white} />
						<Window w={1.4} h={1.8} p={[0, 2.0, 0.22]} frame="#e8e0d0" shutters="#2a5a3a" open={1.2} glass="#2a3438" />
					</group>
					{cut > 0.4 ? (
						<group position={[0, 6.6, 5.2]} scale={Math.min(1, (cut - 0.4) * 2.5)}>
							<Bx s={[0.06, 1.2, 0.06]} p={[0, -0.9, 0]} m={glow('#ffe8a0', 2)} cast={false} />
							<Bx s={[4.2, 0.9, 0.2]} m={flat('#141414')} />
							<BlockText text="HIDDEN CASH" size={0.42} depth={0.1} color="#f2d040" side="#6a5010" position={[0, -0.2, 0.12]} />
						</group>
					) : null}
				</group>
				<Bx s={[8, 4.5, 7]} p={[-15.5, 2.25, 1.5]} m={white} />
				<GableRoof w={8} d={7} rise={2} m={tile} p={[-15.5, 4.5, 1.5]} over={0.8} edge="#8a3a1e" />
			</group>
			{/* palms + bougainvillea + gardens (FG/MG), jungle hills (BG), helipad + helicopter */}
			{[[-14, 6], [13, 7.5], [-19, -4], [22, -6], [-7, 12], [9, 14]].map(([x, z], i) => <Palm2 key={i} pos={[x, 0, z]} s={1.4 + (i % 3) * 0.2} seed={i + 2} f={f} bend={0.08 + (i % 2) * 0.06} h={9} />)}
			{[[-11, -6.5], [11, -6.5], [-20, 3], [20, 4]].map(([x, z], i) => <Bush key={i} pos={[x, 0, z]} s={1.4} seed={i + 4} c={i % 2 ? '#3a7a2e' : '#4a8a36'} />)}
			{[[-11, -6.8], [11, -6.8]].map(([x, z], i) => <Bx key={`f${i}`} s={[1.6, 0.4, 0.8]} p={[x, 1.6, z + 0.3]} m={flat('#c83a7a')} />)}
			<BigTree pos={[-30, groundY(-30, -30), -30]} s={1.5} seed={3} f={f} />
			<BigTree pos={[34, groundY(34, -36), -36]} s={1.6} seed={5} f={f} flowers="#e8a03a" />
			<Treeline z={-60} y={2} n={90} seed={12} x={[-200, 200]} h={[8, 14]} />
			<Treeline z={-100} y={8} n={80} seed={13} x={[-260, 260]} h={[10, 16]} cols={['#5a7a4a', '#647e50', '#58744a']} />
			<Ridge z={-200} h={60} base={0} color="#7a9a8a" seed={4} w={800} />
			<Clouds f={f} y={80} z={-260} spread={500} n={12} color="#ffffff" speed={0.05} />
			<Birds f={f} from={[-40, 22, -30]} dir={[0.3, 0.02, 0.05]} n={8} color="#f2f0e8" />
			<group position={[30, 0.1, -2]}>
				<Bx s={[10, 0.2, 10]} m={flat('#8a8a84')} />
				<Bx s={[6, 0.05, 1]} p={[0, 0.12, 0]} m={flat('#f2f0e8')} />
			</group>
			{heli ? (
				<group position={heli} rotation={[0.08, -PI / 2 + 0.3, 0]}>
					<Helicopter f={f} color="#f2f0e8" stripe="#2a4a8a" />
				</group>
			) : null}
		</>
	);
};

// ===== D. CONGRESS: wood-panelled chamber, tiered desks, lectern with microphones (4a, 4b) =====
// Lectern at (0, 0, -6) facing +z; members' desks in tiers from z 0 to z 12 facing -z.
export const Congress: React.FC<{f: number; flash?: number}> = ({f, flash = 0}) => {
	const panel = mat('planks', {base: '#6a4428', seed: 3}, 6, 3);
	const floor = mat('tiles', {base: '#7a2a2a', alt: '#6a2424', seed: 3}, 10, 10);
	const ceil = mat('plaster', {base: '#e8dcc0', alt: '#a88a6a', seed: 4, wear: 0.3}, 6, 6);
	return (
		<>
			<Sky3 top="#d8c8a8" mid="#d8c8a8" horizon="#d8c8a8" />
			<hemisphereLight args={['#ffe8c8', '#3a2018', 0.75]} />
			<directionalLight position={[-14, 16, 4]} intensity={2.2} color="#fff0d0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
			<directionalLight position={[6, 8, 20]} intensity={0.7} color="#ffe0c0" />
			<directionalLight position={[4, 6, -20]} intensity={1.0} color="#ffd8a0" />
			{/* room: floor, panelled walls with tall windows (left), ceiling with coffers + lamps */}
			<Bx s={[34, 0.2, 34]} p={[0, -0.1, 3]} m={floor} />
			<Wall w={34} h={13} t={0.4} m={panel} p={[0, 0, -12]} />
			<Wall w={34} h={13} t={0.4} m={panel} p={[-16, 0, 3]} r={PI / 2} holes={[-10, -3, 4, 11].map((x) => ({x, y: 3.5, w: 3, h: 7}))} />
			{[-10, -3, 4, 11].map((x) => <Window key={x} w={3} h={7} p={[-15.8, 3.5, 3 - x]} r={PI / 2} frame="#e8dcc0" glass="#f8f0d8" />)}
			<Wall w={34} h={13} t={0.4} m={panel} p={[16, 0, 3]} r={-PI / 2} />
			<Wall w={34} h={13} t={0.4} m={panel} p={[0, 0, 19]} r={PI} />
			<Bx s={[34, 0.4, 34]} p={[0, 13.2, 3]} m={ceil} />
			{[-10, 0, 10].map((x) => [-6, 4, 14].map((z) => (
				<group key={`${x}${z}`} position={[x, 12.3, z]}>
					<Bx s={[0.08, 1.6, 0.08]} p={[0, 0.6, 0]} m={flat('#2a2a2a')} />
					<Bx s={[1.6, 0.4, 1.6]} m={glow('#ffe0a8', 1.6)} cast={false} />
				</group>
			)))}
			<Shafts from={[-16, 10, 0]} dir={[1, -0.55, 0.1]} n={4} len={24} spread={0.6} w={2.6} op={0.07} color="#fff0c8" f={f} />
			{/* back-wall dais: the president's bench, a clock, a plain emblem shield (no real symbols) */}
			<Bx s={[16, 2.2, 2.5]} p={[0, 1.1, -10.5]} m={mat('planks', {base: '#4a2c18', seed: 9}, 4, 1)} />
			<Bx s={[16.4, 0.2, 2.9]} p={[0, 2.3, -10.5]} m={flat('#3a2214')} />
			<Bx s={[2.6, 3.2, 0.2]} p={[0, 7.5, -11.7]} m={flat('#c8a23a')} />
			<Bx s={[2.0, 2.6, 0.24]} p={[0, 7.5, -11.6]} m={flat('#2a4a7a')} />
			{[-5, 5].map((x) => <Bx key={x} s={[3.6, 9, 0.3]} p={[x, 4.5, -11.7]} m={mat('fabric', {base: '#7a1a1a', alt: '#5a1010', seed: x > 0 ? 2 : 3}, 2, 4)} />)}
			{/* lectern + microphone cluster */}
			<group position={[0, 0, -6]}>
				<Bx s={[2.4, 3.2, 1.4]} p={[0, 1.6, 0]} m={mat('planks', {base: '#5a3420', seed: 12}, 1, 2)} />
				<Bx s={[2.6, 0.2, 1.7]} p={[0, 3.25, 0.1]} r={[0.15, 0, 0]} m={flat('#3a2214')} />
				{[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => (
					<group key={x} position={[x, 3.3, 0.9]} rotation={[-0.5 - (i % 2) * 0.15, x * 0.4, 0]}>
						<Bx s={[0.05, 0.9, 0.05]} p={[0, 0.45, 0]} m={flat('#1a1a1a')} />
						<Bx s={[0.2, 0.3, 0.2]} p={[0, 0.95, 0]} m={flat(['#1a1a1a', '#c83a2a', '#2a2a2a', '#2a5aa8', '#1a1a1a'][i])} />
					</group>
				))}
			</group>
			{/* tiered members' desks (three tiers, a centre aisle) */}
			{[0, 1, 2].map((t) => (
				<group key={t} position={[0, t * 0.8, 1 + t * 3.8]}>
					<Bx s={[30, t * 0.8 + 0.01, 3.8]} p={[0, -t * 0.4, 0.4]} m={floor} />
					{[-1, 1].map((sd) => (
						<group key={sd} position={[sd * 7.8, 0, 0]}>
							<Bx s={[12, 1.9, 0.9]} p={[0, 0.95, -0.6]} m={mat('planks', {base: '#5a3420', seed: t + sd}, 3, 1)} />
							<Bx s={[12.2, 0.15, 1.4]} p={[0, 1.95, -0.6]} m={flat('#2a4a2a')} />
							{[-4, -1.3, 1.3, 4].map((x) => <Bx key={x} s={[0.8, 0.2, 0.6]} p={[x, 2.1, -0.6]} m={flat('#e8e0c8')} />)}
						</group>
					))}
				</group>
			))}
			{/* press photographers' flash bursts */}
			{flash > 0 ? <pointLight position={[8, 4, -2]} intensity={60 * flash} distance={25} color="#ffffff" /> : null}
			<Motes f={f} n={60} center={[-4, 6, 2]} size={[14, 8, 14]} color="#fff0c8" glow={1.2} s={0.05} />
		</>
	);
};

// ===== E. CAR INTERIOR at night by the burning street (5b) =====
// Pablo sits in the driver's seat at the origin facing +z... the burning street is behind him (-z).
export const CarInterior: React.FC<{f: number}> = ({f}) => {
	const ff = onTwos(f);
	const flick = 0.75 + Math.sin(ff * 0.9) * 0.18 + Math.sin(ff * 2.3) * 0.1;
	return (
		<group>
			<pointLight position={[1.8, 4.5, -2.5]} intensity={22 * flick} distance={12} decay={1.4} color="#ff8a3a" />
			<pointLight position={[-0.6, 3.2, 3.5]} intensity={1.4} distance={6} color="#4a8aff" />
			{/* dash with glowing gauges, steering wheel, seats, roof liner, door with window opening */}
			<Bx s={[5, 1.2, 1.4]} p={[0, 2.6, 3.6]} m={flat('#1a1614')} />
			{[-1.1, -0.5].map((x) => <Bx key={x} s={[0.4, 0.3, 0.05]} p={[x, 3.0, 2.88]} m={glow('#7aff9a', 1.2)} cast={false} />)}
			<group position={[-0.8, 3.1, 2.6]} rotation={[-0.9, 0, 0]}>
				{Array.from({length: 8}, (_, i) => <Bx key={i} s={[0.45, 0.1, 0.1]} p={[Math.cos((i / 8) * PI * 2) * 0.6, Math.sin((i / 8) * PI * 2) * 0.6, 0]} r={[0, 0, (i / 8) * PI * 2 + PI / 2]} m={flat('#141414')} />)}
			</group>
			<Bx s={[1.8, 2.6, 0.5]} p={[-0.8, 2.6, -1.2]} r={[-0.1, 0, 0]} m={mat('fabric', {base: '#4a3a2a', alt: '#3a2a1a', seed: 3}, 2, 2)} />
			<Bx s={[1.8, 0.5, 1.8]} p={[-0.8, 1.5, -0.2]} m={mat('fabric', {base: '#4a3a2a', alt: '#3a2a1a', seed: 4}, 2, 2)} />
			<Bx s={[5, 0.15, 6]} p={[0, 5.9, 0.4]} m={flat('#2a2420')} />
			<Bx s={[0.2, 1.6, 6]} p={[-2.5, 2.4, 0.4]} m={flat('#2a2420')} />
			<Bx s={[0.15, 2.4, 0.2]} p={[-2.5, 4.7, 2.8]} r={[0.3, 0, 0]} m={flat('#2a2420')} />
			<Bx s={[0.15, 2.4, 0.2]} p={[-2.5, 4.7, -1.8]} m={flat('#2a2420')} />
		</group>
	);
};

// ===== F. LA CATEDRAL: hilltop prison compound above the valley (6a dusk, 6b night) =====
// Compound centred at the origin on a hill; back fence along z = -14.
export const Catedral: React.FC<{f: number; night?: boolean; heli?: V3}> = ({f, night, heli}) => {
	const white = mat('plaster', {base: '#e8e2d4', alt: '#9a8a7a', seed: 7, wear: 1.5}, 4, 1);
	const tin = mat('tin', {base: '#8a8e94', seed: 8, wear: 1.8}, 4, 2);
	const hillY = (x: number, z: number) => -Math.max(0, Math.hypot(x, z) - 26) * 0.45 + nz(x * 0.06, z * 0.06) * 1.2;
	const grass = useMemo(() => scatter(500, {x: [-30, 30], z: [-30, 26]}, {seed: 21, h: [0.3, 0.9], cols: ['#4a6a2e', '#5a7a36', '#6a7a3a'], y: hillY, keep: (x, z) => !(Math.abs(x) < 20 && z > -13 && z < 10)}), []); // eslint-disable-line react-hooks/exhaustive-deps
	return (
		<>
			{night ? <Sky3 top="#04081a" mid="#101a38" horizon="#2a2a48" fog="#141a30" near={50} far={600} /> : <Sky3 top="#2a3a7a" mid="#c08a8a" horizon="#ffa878" fog="#c89080" near={70} far={700} sunDir={[0.8, 0.1, -0.6]} glowCol="#ffc890" />}
			{night ? (
				<>
					<hemisphereLight args={['#3a4a8a', '#0a0a10', 0.45]} />
					<directionalLight position={[-20, 30, 10]} intensity={0.7} color="#9ab0ff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
					<pointLight position={[8, 9, -12]} intensity={45} distance={30} decay={1.5} color="#ffe8b0" />
				</>
			) : (
				<>
					<SunDisc pos={[330, 40, -260]} color="#ffb070" r={16} i={6} />
					<SunRig sun={[1, 0.18, -0.5]} key="#ffa060" keyI={3.0} sky="#8a9ad8" ground="#4a3a2a" hemi={0.85} rim="#ffc890" fill={0.55} span={34} />
				</>
			)}
			<group position={[0, -16, -46]}>
				<Valley f={f} night={night ? 1 : 0} dusk={!night} />
			</group>
			<Terrain w={160} d={160} nx={40} nz={40} pos={[0, 0, 0]} height={hillY} color={(_x, y, _z, sl, r) => (sl > 0.45 ? tint('#6a5a40', (r - 0.5) * 0.2) : tint(night ? '#2a3a2a' : '#4a6a2e', (r - 0.5) * 0.2))} />
			<Blades items={grass} f={f} wind={0.9} />
			{/* prison blocks (white, tin roofs), the football pitch, guard tower, floodlights */}
			{[[-10, -6, 12, 6], [6, -7, 10, 5], [-12, 4, 7, 5], [12, 5, 8, 6]].map(([x, z, w, d], i) => (
				<group key={i} position={[x, 0, z]}>
					<Bx s={[w, 3.6, d]} p={[0, 1.8, 0]} m={white} />
					<Bx s={[w + 0.8, 0.15, d + 0.8]} p={[0, 3.9, 0]} r={[0.1, 0, 0]} m={tin} />
					{Array.from({length: Math.floor(w / 2.5)}, (_, k) => <Window key={k} w={0.9} h={1.0} p={[-w / 2 + 1.4 + k * 2.5, 1.6, d / 2 + 0.02]} frame="#c8c0b0" bars lit={night && (k + i) % 3 === 0 ? '#ffd890' : undefined} glass="#1a1e24" />)}
				</group>
			))}
			<Bx s={[16, 0.06, 9]} p={[-1, 0.05, 2]} m={flat(night ? '#2a4a2a' : '#4a8a3a')} />
			{[[-1, 2, 16, 0.12], [-1, 2, 0.12, 9]].map(([x, z, w, d], i) => <Bx key={i} s={[w, 0.08, d]} p={[x, 0.08, z]} m={flat('#e8e8e0')} cast={false} />)}
			{[-8.8, 6.8].map((x) => <Bx key={x} s={[0.1, 2.2, 3]} p={[x, 1.1, 2]} m={flat('#e8e8e0')} />)}
			<group position={[16, 0, -12]}>
				{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => <Bx key={i} s={[0.3, 8, 0.3]} p={[x, 4, z]} m={mat('bark', {base: '#6a5a48', seed: 30}, 1, 3)} />)}
				<Bx s={[3.4, 2, 3.4]} p={[0, 8.8, 0]} m={mat('boards', {base: '#7a6a54', seed: 31}, 2, 1)} />
				<Bx s={[4.2, 0.2, 4.2]} p={[0, 10.0, 0]} m={tin} />
				<Bx s={[0.6, 0.4, 0.4]} p={[-1.6, 9.6, 1.8]} m={night ? glow('#fff4d0', 4) : flat('#c8c8c0')} cast={false} />
			</group>
			{[[-28, 6], [28, -4], [-26, -20], [20, 18], [-6, 18]].map(([x, z], i) => (i % 2 ? <Palm2 key={i} pos={[x, hillY(x, z), z]} s={1.2} seed={i + 30} f={f} /> : <BigTree key={i} pos={[x, hillY(x, z), z]} s={0.9} seed={i + 31} f={f} leaf="#3a5a2a" />))}
			{[[0, 9, 30, 1.6], [-8, -1, 1.6, 12]].map(([x, z, w, d], i) => <Bx key={i} s={[w, 0.08, d]} p={[x, 0.06, z]} m={mat('concrete', {base: '#b8b0a0', seed: 40 + i}, w / 4, d / 4)} />)}
			{/* perimeter fence (with a cut gap in the back fence at x 2) */}
			<Fence a={[-24, 0, -14]} b={[1, 0, -14]} n={10} h={3.6} />
			<Fence a={[3.2, 0, -14]} b={[24, 0, -14]} n={9} h={3.6} />
			<Fence a={[-24, 0, -14]} b={[-24, 0, 12]} n={10} h={3.6} />
			<Fence a={[24, 0, -14]} b={[24, 0, 12]} n={10} h={3.6} />
			{[[-20, 10], [20, 10], [-20, -12]].map(([x, z], i) => (
				<group key={i} position={[x, 0, z]}>
					<Bx s={[0.25, 9, 0.25]} p={[0, 4.5, 0]} m={flat('#5a5a5a')} />
					<Bx s={[1.6, 0.6, 0.5]} p={[0, 9, 0]} m={night ? glow('#fff4d0', 3) : flat('#d8d8d0')} cast={false} />
				</group>
			))}
			{night ? <Motes f={f} n={50} center={[0, 1.2, -16]} size={[20, 2, 8]} color="#d8ff8a" glow={3} s={0.06} rise={0.002} /> : <Birds f={f} from={[-40, 20, -40]} dir={[0.3, 0.0, 0.05]} n={6} />}
			{heli ? (
				<group position={heli} rotation={[0.1, PI / 2, 0]}>
					<Helicopter f={f} color="#3a4a3a" />
				</group>
			) : null}
		</>
	);
};

// ===== G. HILLSIDE HIDEOUT (1993): a dirt path, shack, power poles above the city, grey dusk (7a, 7b) =====
export const Hideout: React.FC<{f: number; heli?: V3}> = ({f, heli}) => {
	const slopeY = (x: number, z: number) => z * 0.25 + nz(x * 0.1, z * 0.1) * 1.2;
	const weeds = useMemo(() => scatter(700, {x: [-26, 26], z: [-24, 14]}, {seed: 31, h: [0.4, 1.4], cols: ['#5a6a3a', '#6a7a42', '#7a7a4a', '#4a5a32'], y: slopeY, keep: (x) => Math.abs(x - 0.5) > 1.6}), []); // eslint-disable-line react-hooks/exhaustive-deps
	const fgw = useMemo(() => tuft([3.4, slopeY(3.4, 6), 6], 14, 1.8, ['#5a6a3a', '#6a7a42', '#4a5a32'], 9, 0.6, 0.6), []); // eslint-disable-line react-hooks/exhaustive-deps
	return (
		<>
			<Sky3 top="#3a4250" mid="#7a8088" horizon="#c8a88a" fog="#9a9490" near={40} far={600} sunDir={[-0.5, 0.05, -1]} glowCol="#e8b080" />
			<SunRig sun={[-0.6, 0.25, -0.8]} key="#e8c0a0" keyI={1.8} sky="#8a94a8" ground="#4a4038" hemi={1.1} rim="#ffc8a0" rimI={1.4} rimDir={[-8, 6, -14]} fill={0.6} fillCol="#c8d0e0" span={26} />
			<group position={[0, -16, -44]}>
				<Valley f={f} dusk />
			</group>
			<Terrain w={120} d={80} nx={40} nz={30} pos={[0, 0, -10]} height={slopeY} color={(_x, y, _z, sl, r) => (sl > 0.4 ? tint('#6a5a40', (r - 0.5) * 0.2) : tint('#5a6a3a', (r - 0.5) * 0.2))} />
			{/* dirt path down the slope */}
			{Array.from({length: 14}, (_, i) => <Bx key={i} s={[2.6, 0.12, 3.2]} p={[0.5 + Math.sin(i * 0.5) * 0.6, slopeY(0.5, 10 - i * 3) + 0.05, 10 - i * 3]} r={[0.24, 0, 0]} m={mat('dirt', {base: '#8a7050', seed: i}, 1, 1)} />)}
			<Blades items={weeds} f={f} wind={1.4} />
			<Blades items={fgw} f={f} wind={1.6} shadow />
			{/* a tin-roofed shack, laundry, power poles marching down, banana plants */}
			<group position={[-7, slopeY(-7, -6), -6]} rotation={[0, 0.4, 0]}>
				<Bx s={[6, 4, 5]} p={[0, 2, 0]} m={mat('boards', {base: '#7a6a54', seed: 3, wear: 1.5}, 2, 1)} />
				<Bx s={[6.8, 0.15, 5.8]} p={[0, 4.2, 0]} r={[0.12, 0, 0]} m={mat('tin', {base: '#8a8a88', seed: 4, wear: 2}, 3, 2)} />
				<Door p={[1.2, 0, 2.52]} w={1.2} h={2.6} color="#3a5a6a" />
				<Window w={1.2} h={1.0} p={[-1.4, 1.6, 2.52]} frame="#c8c0b0" glass="#1a1e24" />
			</group>
			<Laundry a={[-3.5, slopeY(-3.5, -2) + 3, -2]} b={[3.5, slopeY(3.5, -4) + 3.2, -4]} f={f} seed={8} n={4} />
			{[[-3.5, -2], [3.5, -4]].map(([x, z], i) => <Bx key={i} s={[0.12, 3.2, 0.12]} p={[x, slopeY(x, z) + 1.6, z]} m={flat('#5a4a3a')} />)}
			{[[-5, 6], [-4, -14], [-3, -34]].map(([x, z], i) => <Pole key={i} p={[x, slopeY(x, z), z]} h={11} lean={0.02 * (i % 2 ? 1 : -1)} />)}
			<Wires pts={[[-5, 6], [-4, -14], [-3, -34]].map(([x, z]) => [x, slopeY(x, z) + 10.67, z] as V3)} />
			{[[6, -8], [8, -2], [-12, 2]].map(([x, z], i) => <Palm2 key={i} pos={[x, slopeY(x, z), z]} s={0.6} seed={i + 9} f={f} h={5} bend={0.2} />)}
			<Clouds f={f} y={60} z={-200} spread={500} n={14} color="#8a8a90" speed={0.06} />
			{heli ? (
				<group position={heli} rotation={[0.12, -PI / 2, 0]}>
					<Helicopter f={f} color="#2a3a2a" s={0.9} />
				</group>
			) : null}
			<Motes f={f} n={30} center={[0, 3, 0]} size={[12, 4, 10]} color="#e8e0d0" glow={1} s={0.04} />
		</>
	);
};

// ===== H. LOS OLIVOS ROOFTOPS at sunset (8a, 8b) =====
// A row of attached two-storey houses along x; tile roofs sloping toward +z (street side).
const RoofHouse: React.FC<{x: number; w: number; color: string; seed: number; h?: number}> = ({x, w, color, seed, h = 7}) => (
	<group position={[x, 0, 0]}>
		<Bx s={[w, h, 10]} p={[0, h / 2, 0]} m={mat('plaster', {base: color, alt: '#9a5a3a', seed, wear: 1.5}, w / 4, 2)} />
		<Bx s={[w + 0.1, 0.25, 11.2]} p={[0, h + 1.1, 0.2]} r={[-0.22, 0, 0]} m={mat('rooftile', {base: ['#a84a2a', '#9a4224', '#b0542e'][seed % 3], seed}, w / 2, 5)} />
		<Bx s={[w, 2.2, 0.2]} p={[0, h + 1.1, -5]} m={mat('brick', {base: '#a8543a', alt: '#c8b49a', seed}, w / 4, 0.6)} />
		{[-w / 4, w / 4].map((wx) => <Window key={wx} w={1.4} h={1.8} p={[wx, h - 3, 5.02]} frame="#e8e0d0" shutters="#3a5a7a" open={1.25} glass="#1a1e24" bars={seed % 2 === 0} />)}
		{seed % 2 ? (
			<mesh position={[w / 4, h + 2.3, -2.5]} material={flat('#1a1a1c')} castShadow>
				<cylinderGeometry args={[0.7, 0.7, 1.5, 8]} />
			</mesh>
		) : (
			<group position={[-w / 4, h + 1.6, -1]}>
				<Bx s={[0.08, 2.8, 0.08]} p={[0, 1.4, 0]} m={flat('#5a5a5a')} />
				{[0, 1, 2].map((k) => <Bx key={k} s={[1.4 - k * 0.3, 0.05, 0.05]} p={[0, 2.2 + k * 0.25, 0]} m={flat('#5a5a5a')} />)}
			</group>
		)}
	</group>
);
export const Rooftops: React.FC<{f: number; heli?: V3}> = ({f, heli}) => (
	<>
		<Sky3 top="#3a3a7a" mid="#d07a6a" horizon="#ffa050" fog="#d08a6a" near={50} far={500} sunDir={[-0.3, 0.06, -1]} glowCol="#ffd080" />
		<SunDisc pos={[-90, 24, -300]} color="#ffb060" r={16} i={7} />
		<SunRig sun={[-0.3, 0.14, -1]} key="#ff9a50" keyI={3.4} sky="#8a8ad0" ground="#5a3a2a" hemi={0.9} rim="#ffb880" rimI={2} rimDir={[-6, 6, -14]} fill={0.6} fillCol="#ffd8c8" span={30} />
		<group position={[0, -14, -70]}>
			<Valley f={f} dusk />
		</group>
		{/* the row of houses (MG) and a second row across the alley (BG) */}
		{[[-24, 8, '#e8d8b8'], [-16, 8, '#c8d0b8'], [-8, 8, '#e8c0a0'], [0, 8, '#d8c8e0'], [8, 8, '#f0e0b0'], [16, 8, '#c8b8a0'], [24, 8, '#e0d0c0']].map(([x, w, c], i) => (
			<RoofHouse key={i} x={x as number} w={w as number} color={c as string} seed={i + 1} h={i === 3 ? 7.4 : 7} />
		))}
		<group position={[0, 0, -18]}>
			{[[-20, 10, '#d8b8a0'], [-10, 10, '#b8c8c0'], [0, 10, '#e0c8a8'], [10, 10, '#c8b8d0'], [20, 10, '#e8d8c0']].map(([x, w, c], i) => (
				<RoofHouse key={i} x={x as number} w={w as number} color={c as string} seed={i + 9} h={9} />
			))}
		</group>
		<Bx s={[80, 0.2, 40]} p={[0, -0.1, 0]} m={mat('asphalt', {base: '#4a4844', seed: 4}, 20, 10)} />
		<Laundry a={[-10, 9.6, -3]} b={[-4, 9.2, -4]} f={f} seed={12} n={4} />
		<Wires pts={[[-30, 11, 6], [0, 11.5, 6], [30, 11, 6]] as V3[]} offsets={[0, 0.4]} sag={1.2} />
		<Birds f={f} from={[-50, 20, -40]} dir={[0.4, 0.02, 0.05]} n={6} />
		{heli ? (
			<group position={heli} rotation={[0.15, PI / 2 + 0.4, 0.05]}>
				<Helicopter f={f} color="#2a3a2a" />
			</group>
		) : null}
		<Motes f={f} n={40} center={[0, 9, 0]} size={[20, 4, 10]} color="#ffd0a0" glow={1.2} s={0.05} />
	</>
);

// ===== I. FUNERAL: crowd on a hillside cemetery lawn, the portrait, flowers; the city beyond (9a) =====
export const Funeral: React.FC<{f: number}> = ({f}) => {
	const lawn = useMemo(() => scatter(500, {x: [-30, 30], z: [-30, 20]}, {seed: 41, h: [0.2, 0.5], cols: ['#3a6a2a', '#4a7a32', '#5a7a3a']}), []);
	return (
		<>
			<Sky3 top="#3a4058" mid="#8a8898" horizon="#d8b8a0" fog="#a09898" near={60} far={650} sunDir={[0.4, 0.06, -1]} glowCol="#f0c090" />
			<SunRig sun={[0.4, 0.3, -1]} key="#f0c8a0" keyI={1.8} sky="#9aa0b8" ground="#3a3a30" hemi={1.1} rim="#ffd8b0" rimI={1.6} fill={0.7} fillCol="#d0d8e8" span={30} />
			<group position={[0, -16, -60]}>
				<Valley f={f} night={0.6} dusk />
			</group>
			<Terrain w={140} d={100} nx={30} nz={24} pos={[0, 0, -10]} height={(x, z) => nz(x * 0.05, z * 0.05) * 1.2 - Math.max(0, -z - 25) * 0.5} color={(_x, _y, _z, _s, r) => tint('#4a7a32', (r - 0.5) * 0.2)} />
			<Blades items={lawn} f={f} wind={0.5} />
			{/* flat grave plaques in rows + flower vases */}
			{Array.from({length: 6}, (_, r) => Array.from({length: 10}, (_, c) => (
				<group key={`${r}-${c}`} position={[-18 + c * 4, 0.05, 10 - r * 4]}>
					<Bx s={[1.6, 0.1, 0.9]} m={flat('#8a8a80')} />
					{(r + c) % 3 === 0 ? <Bx s={[0.3, 0.5, 0.3]} p={[0.5, 0.3, 0]} m={flat(['#e8c84a', '#c83a3a', '#f2f0e8'][(r * c) % 3])} /> : null}
				</group>
			)))}
			{[[-24, -8], [24, -12], [-14, -22], [18, -26]].map(([x, z], i) => <BigTree key={i} pos={[x, 0, z]} s={1.2} seed={i + 20} f={f} leaf="#3a5a2a" />)}
			<Bush pos={[6, 0, 6]} s={1.2} seed={3} />
			<Motes f={f} n={40} center={[0, 3, 0]} size={[20, 5, 20]} color="#f0e8e0" glow={1} s={0.04} />
		</>
	);
};

// Framed funeral portrait: our 3D Pablo face painted at 64 px (not a real photo), black ribbon.
export const Portrait: React.FC = () => (
	<group>
		<Bx s={[1.6, 2.0, 0.12]} m={flat('#2a1a10')} />
		<Bx s={[1.3, 1.7, 0.14]} m={flat('#e8e0d0')} />
		<Bx s={[1.0, 1.1, 0.16]} p={[0, 0.05, 0]} m={flat('#c8946a')} />
		<Bx s={[1.05, 0.4, 0.17]} p={[0, 0.55, 0]} m={flat('#1a1410')} />
		<Bx s={[0.6, 0.14, 0.18]} p={[0, -0.18, 0]} m={flat('#1a1410')} />
		{[-0.22, 0.22].map((x) => <Bx key={x} s={[0.18, 0.12, 0.18]} p={[x, 0.15, 0]} m={flat('#f2ead2')} />)}
		<Bx s={[0.12, 1.0, 0.18]} p={[0.55, 0.6, 0.02]} r={[0, 0, 0.6]} m={flat('#141414')} />
		<Bx s={[0.08, 2.6, 0.08]} p={[0, -2.2, -0.08]} m={flat('#5a3a22')} />
	</group>
);
export {Wall};
