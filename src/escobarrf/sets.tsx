import React, {useMemo} from 'react';
import {onTwos} from '../anim';
import {SunDisc} from '../cine/Cine';
import {
	Bamboo,
	BigTree,
	Blades,
	Bush,
	Bx,
	Laundry,
	LampPost,
	Mist,
	Palm2,
	Pole,
	Ridge,
	Road,
	Sky3,
	SunRig,
	Terrain,
	tint,
	Treeline,
	Wires,
	flat,
	glow,
	mat,
	scatter,
	tuft,
} from '../env';
import {Birds, Clouds, Motes, Smoke} from '../escobar/kit';
import {Car80, Comuna, Facade, Helicopter, Towers} from './props';

// EscobarRF locations (docs/escobar-rf/01-brief-storyboard.md). Each is a full set: FG / MG / BG,
// its own story light, ambient motion. Gate results: docs/escobar-rf/02-environments.md.
type V3 = [number, number, number];
const PI = Math.PI;

// Medellín valley seen from high up: hillsides of brick comunas down to a valley of towers, the
// opposite slope, ridges in haze. `night` lights the windows.
export const valleyY = (x: number, z: number) => {
	// our slope drops from the terrace (z -6, y -3) to the valley floor (z -170, y -48); the far slope climbs from z -250
	const near = z > -170 ? -3 - (Math.min(0, z + 6) / -164) ** 0.8 * 45 : -48;
	const far = z < -250 ? -48 + ((-250 - z) / 140) * 70 : -48;
	return Math.min(near, -3) + (z < -250 ? far + 48 : 0) + Math.sin(x * 0.03) * 2;
};
export const Valley: React.FC<{f: number; night?: number; dusk?: boolean}> = ({f, night = 0, dusk}) => (
	<group>
		<Terrain w={700} d={520} nx={50} nz={50} pos={[0, 0, -260]} height={valleyY} color={(_x, _y, _z, sl, r) => (sl > 0.5 ? tint('#7a6a4a', (r - 0.5) * 0.2) : tint(r < 0.5 ? '#5a7a3a' : '#6a7a42', (r - 0.5) * 0.2))} shadow={false} />
		<Comuna x={[-160, 160]} z={[-165, -8]} y={valleyY} step={7} seed={4} night={night} />
		<Towers center={[10, -48, -205]} n={70} spread={[170, 60]} lit={night ? 0.55 : dusk ? 0.25 : 0.05} seed={3} />
		<Towers center={[-60, -48, -235]} n={30} spread={[90, 40]} lit={night ? 0.5 : dusk ? 0.2 : 0.05} seed={8} h={[6, 22]} />
		<Comuna x={[-320, 320]} z={[-390, -252]} y={valleyY} step={9} seed={9} night={night} />
		<Ridge z={-420} h={110} base={20} color={night ? '#1a2030' : dusk ? '#7a6070' : '#7a8a8a'} seed={3} w={1100} />
		<Ridge z={-520} h={160} base={10} color={night ? '#141a28' : dusk ? '#a07a7a' : '#a0aab0'} seed={7} w={1300} x={60} />
		{!night ? <Clouds f={f} y={110} z={-480} spread={600} n={12} color={dusk ? '#ffc8a0' : '#ffffff'} speed={0.04} /> : null}
		{!night ? <Birds f={f} from={[-60, 10, -60]} dir={[0.35, 0.02, 0.0]} n={7} /> : null}
	</group>
);

// ===== A. MIRADOR: a barrio rooftop terrace above the valley at sunset (shots 1a, 1b) =====
// Pablo stands at the parapet at the origin, facing -z (the city).
export const Mirador: React.FC<{f: number}> = ({f}) => {
	const slab = mat('concrete', {base: '#9a9288', seed: 3, wear: 2}, 4, 4);
	const brick = mat('brick', {base: '#a8543a', alt: '#c8b49a', seed: 5, wear: 1}, 6, 0.6);
	const plants = useMemo(() => [...tuft([-4.2, 0.9, -1.4], 9, 1.0, ['#3a7a2e', '#4a8a36', '#5a9a3e'], 3, 0.4), ...tuft([4.6, 0.9, 1.6], 8, 1.2, ['#3a7a2e', '#4a8a36'], 5, 0.4)], []);
	return (
		<>
			<Sky3 top="#2a3a6a" mid="#c88a7a" horizon="#ffb070" fog="#e0a080" near={90} far={900} sunDir={[0.9, 0.12, -0.6]} glowCol="#ffd890" />
			<SunDisc pos={[330, 55, -300]} color="#ffc070" r={18} i={6} />
			<SunRig sun={[1, 0.22, -0.45]} key="#ffa860" keyI={3.2} sky="#8aa0d8" ground="#6a4a3a" hemi={1.0} rim="#ffc890" rimI={1.6} rimDir={[6, 6, -14]} fill={0.6} fillCol="#ffd8c0" span={16} />
			<Valley f={f} dusk />
			{/* the house under the terrace + neighbours stepping down the hill */}
			<Bx s={[16, 0.5, 12]} p={[0, -0.25, 0]} m={slab} />
			<Bx s={[16, 9, 12]} p={[0, -4.75, 0]} m={mat('brick', {base: '#a8543a', alt: '#c8b49a', seed: 6, wear: 1.5}, 6, 3)} />
			{[[-15, -6, -6], [13, -8, -10]].map(([x, y, z], i) => (
				<group key={i} position={[x, y, z]}>
					<Bx s={[10, 10, 9]} p={[0, -5, 0]} m={mat('brick', {base: ['#9a4a30', '#b0603e', '#a8543a', '#c8784a'][i], alt: '#c8b49a', seed: 10 + i, wear: 1.5}, 4, 3)} />
					<Bx s={[10.6, 0.25, 9.6]} p={[0, 0.1, 0]} m={mat('tin', {base: '#8a8a88', seed: 20 + i, wear: 2}, 4, 3)} r={[0.08, 0, 0]} />
					<mesh position={[2, 1.0, -2]} material={flat('#1a1a1a')} castShadow>
						<cylinderGeometry args={[0.8, 0.8, 1.6, 8]} />
					</mesh>
				</group>
			))}
			{/* parapet: low brick wall + iron railing (FG framing for 1b) */}
			<Bx s={[16, 1.0, 0.4]} p={[0, 0.5, -2.6]} m={brick} />
			<Bx s={[0.4, 1.0, 8]} p={[-7.8, 0.5, 1.4]} m={brick} />
			<Bx s={[0.4, 1.0, 8]} p={[7.8, 0.5, 1.4]} m={brick} />
			{Array.from({length: 23}, (_, i) => <Bx key={i} s={[0.06, 1.2, 0.06]} p={[-7.6 + i * 0.69, 1.6, -2.6]} m={flat('#1e1e20')} />)}
			<Bx s={[16, 0.1, 0.1]} p={[0, 2.2, -2.6]} m={flat('#1e1e20')} />
			{/* rooftop life: black water tank, plastic chair, clay pots with plants, TV antenna, laundry */}
			<mesh position={[-5.5, 1.1, 3.0]} material={flat('#1a1a1c')} castShadow>
				<cylinderGeometry args={[1.0, 1.0, 2.2, 10]} />
			</mesh>
			<group position={[3.6, 0, 0.4]} rotation={[0, -0.6, 0]}>
				<Bx s={[1.2, 0.12, 1.2]} p={[0, 1.0, 0]} m={flat('#f0eee8')} />
				<Bx s={[1.2, 1.2, 0.12]} p={[0, 1.6, -0.55]} m={flat('#f0eee8')} />
				{[-0.5, 0.5].flatMap((x) => [-0.5, 0.5].map((z) => <Bx key={`${x}${z}`} s={[0.1, 1.0, 0.1]} p={[x, 0.5, z]} m={flat('#e8e6e0')} />))}
			</group>
			{[[-4.2, -1.4], [4.6, 1.6], [-2.4, -1.8]].map(([x, z], i) => (
				<mesh key={i} position={[x, 0.45, z]} material={flat('#a8542a')} castShadow>
					<cylinderGeometry args={[0.45, 0.32, 0.9, 6]} />
				</mesh>
			))}
			<Blades items={plants} f={f} wind={0.8} shadow />
			<group position={[6.2, 0, 4.2]}>
				<Bx s={[0.1, 5, 0.1]} p={[0, 2.5, 0]} m={flat('#6a6a6a')} />
				{[0, 1, 2, 3].map((k) => <Bx key={k} s={[1.6 - k * 0.3, 0.05, 0.05]} p={[0, 4 + k * 0.3, 0]} m={flat('#6a6a6a')} />)}
			</group>
			<Laundry a={[-7.5, 2.6, 4.5]} b={[-1.0, 2.4, 5.5]} f={f} seed={4} n={5} />
			{[-7.5, -1.0].map((x, i) => <Bx key={x} s={[0.1, 2.6, 0.1]} p={[x, 1.3, 4.5 + i]} m={flat('#5a4a3a')} />)}
			<Mist f={f} bands={[{y: -30, z: -150, w: 600, d: 80, op: 0.35}, {y: -20, z: -260, w: 700, d: 100, op: 0.3}]} color="#ffd0b0" speed={0.3} />
			<Motes f={f} n={40} center={[0, 3, -1]} size={[14, 4, 6]} color="#ffe0b0" glow={1.2} s={0.04} />
			<Smoke f={f} pos={[-40, -30, -90]} n={10} h={30} color="#a89890" spread={0.12} />
		</>
	);
};

// ===== B. STREET: a downtown Medellín street, 1980s (shots 2a/2b by day; 5a at night) =====
// Road runs along z; Pablo walks toward +z on the road's left half.
export const Street: React.FC<{f: number; night?: boolean; fire?: boolean}> = ({f, night, fire}) => {
	const left: {sign?: string; color: string; awning: string; w: number; floors: number}[] = [
		{sign: 'FARMACIA', color: '#d8c8a0', awning: '#2a6a4a', w: 9, floors: 3},
		{sign: 'PANADERIA', color: '#e8b8a0', awning: '#a83a2a', w: 8, floors: 2},
		{color: '#c8d0b8', awning: '#3a4a8a', w: 7, floors: 4},
		{sign: 'TIENDA', color: '#e8d8a0', awning: '#c87a2a', w: 8, floors: 3},
		{sign: 'BILLARES', color: '#b8c8d0', awning: '#2a2a2a', w: 9, floors: 3},
	];
	const right = [
		{sign: 'CAFE', color: '#f0e0c0', awning: '#7a2a3a', w: 8, floors: 3},
		{color: '#d0a888', awning: '#2a6a4a', w: 9, floors: 4},
		{sign: 'ZAPATERIA', color: '#c8b8d8', awning: '#3a5a3a', w: 9, floors: 2},
		{sign: 'RADIOS', color: '#e8c8a8', awning: '#2a4a7a', w: 8, floors: 3},
		{color: '#d8d0c0', awning: '#8a5a2a', w: 7, floors: 3},
	];
	const ff = onTwos(f);
	const flick = night ? 0.8 + Math.sin(ff * 0.9) * 0.15 + Math.sin(ff * 2.3) * 0.08 : 0;
	const strobe = night && Math.sin(f * 0.5) > 0;
	return (
		<>
			{night ? (
				<Sky3 top="#060a18" mid="#141a30" horizon="#2a2a40" fog="#1a1a28" near={20} far={160} />
			) : (
				<Sky3 top="#3a6aa8" mid="#a8c0d8" horizon="#ffd8a8" fog="#e8c8a8" near={30} far={220} sunDir={[-0.5, 0.25, -1]} />
			)}
			{night ? (
				<>
					<hemisphereLight args={['#3a4a8a', '#100a08', 0.5]} />
					<directionalLight position={[-10, 30, -20]} intensity={0.5} color="#8aa0ff" />
					{fire ? <pointLight position={[2.5, 2.5, -14]} intensity={40 * flick} distance={40} decay={1.6} color="#ff8a3a" castShadow /> : null}
					<pointLight position={[-4, 3, -32]} intensity={strobe ? 40 : 0} distance={30} decay={1.6} color="#3a6aff" />
					<pointLight position={[4, 3, -34]} intensity={strobe ? 0 : 30} distance={30} decay={1.6} color="#ff2a2a" />
					<directionalLight position={[0, 4, 16]} intensity={0.25} color="#c8d0ff" />
				</>
			) : (
				<SunRig sun={[-0.55, 0.35, -1]} key="#ffc890" keyI={3.0} sky="#a8c8f0" ground="#7a6a5a" hemi={0.85} rim="#ffe0b0" rimI={1.2} fill={0.6} span={30} />
			)}
			<Road len={140} w={7} walk={2.2} p={[0, 0, -30]} />
			{/* puddles reflect at night */}
			{night ? [[-1.5, -8], [2.2, -20], [-2.6, -26]].map(([x, z], i) => <Bx key={i} s={[1.8, 0.02, 1.2]} p={[x, 0.12, z]} m={flat('#3a4a6a', {transparent: true, opacity: 0.6})} cast={false} />) : null}
			{left.map((b, i) => (
				<Facade key={`l${i}`} p={[-6.2, 0.28, 20 - left.slice(0, i).reduce((a, x) => a + x.w, 0) - b.w / 2]} r={PI / 2} {...b} seed={i + 1} lit={night} />
			))}
			{right.map((b, i) => (
				<Facade key={`r${i}`} p={[6.2, 0.28, 20 - right.slice(0, i).reduce((a, x) => a + x.w, 0) - b.w / 2]} r={-PI / 2} {...b} seed={i + 11} lit={night} />
			))}
			{/* street furniture: poles + sagging wires, lamps, parked cars, a kiosk, bins */}
			{[14, -6, -26].map((z, i) => <Pole key={z} p={[-4.6, 0.28, z]} h={10} lean={(i % 2 ? 1 : -1) * 0.02} r={PI / 2} />)}
			<Wires pts={[14, -6, -26].map((z) => [-4.6, 10.0, z] as V3)} offsets={[0]} sag={0.9} />
			<Wires pts={[[-4.6, 9.5, 14], [6.0, 8.0, 10]] as V3[]} offsets={[0]} sag={0.6} />
			<Wires pts={[[-4.6, 9.5, -6], [6.0, 8.5, -12]] as V3[]} offsets={[0]} sag={0.7} />
			{[4, -16].map((z) => <LampPost key={z} p={[4.8, 0.28, z]} r={-PI / 2} h={6.5} on={!!night} />)}
			{!fire ? <Car80 p={[3.0, 0.1, 6]} color="#c8b890" lights={night} /> : null}
			<Car80 p={[3.0, 0.1, -4]} color="#7a2a2a" />
			<Car80 p={[-3.0, 0.1, -22]} r={PI} color="#e8e0d0" />
			{fire ? (
				<>
					<Car80 p={[2.5, 0.1, -14]} r={0.4} burnt />
					<Smoke f={f} pos={[2.5, 1.6, -14]} n={18} h={26} color="#2a2624" ember spread={0.18} scale={1.2} />
					{Array.from({length: 7}, (_, i) => (
						<Bx key={i} s={[0.5 + (i % 3) * 0.3, 0.7 + ((ff + i * 5) % 6) * 0.2, 0.5]} p={[2.5 + ((i * 0.7) % 2) - 1, 1.6 + ((ff + i * 3) % 5) * 0.12, -14 + ((i * 0.9) % 3) - 1.5]} m={glow(i % 2 ? '#ff8a2a' : '#ffd04a', 3 * flick)} cast={false} />
					))}
					<Motes f={f} n={50} center={[2.5, 5, -14]} size={[5, 9, 5]} color="#ffa040" glow={3} s={0.07} rise={0.03} />
					{/* debris + police car with lights down the street */}
					{[[0.5, -10], [-1.2, -12], [3.6, -9]].map(([x, z], i) => <Bx key={i} s={[0.6, 0.15, 0.4]} p={[x, 0.15, z]} r={[0, i, 0.1]} m={flat('#3a3430')} />)}
					<group position={[0, 0.1, -33]}>
						<Car80 color="#e8e8e8" lights />
						<Bx s={[1.2, 0.25, 0.4]} p={[0, 2.1, 0]} m={glow(strobe ? '#3a6aff' : '#ff2a2a', 4)} cast={false} />
					</group>
				</>
			) : null}
			<group position={[-4.0, 0.28, -10]}>
				<Bx s={[1.6, 2.2, 1.2]} p={[0, 1.1, 0]} m={mat('tin', {base: '#c8a23a', seed: 5, wear: 1}, 1, 1)} />
				<Bx s={[2.2, 0.1, 1.8]} p={[0, 2.3, 0]} m={flat('#a83a2a')} />
			</group>
			<Bx s={[0.7, 1.0, 0.7]} p={[4.6, 0.78, 0]} m={flat('#3a5a3a')} />
			{/* distant city closes the street (BG) */}
			<Towers center={[0, 0, -110]} n={20} spread={[60, 20]} lit={night ? 0.5 : 0.05} seed={5} h={[14, 40]} />
			{night ? null : <Birds f={f} from={[-20, 18, -40]} dir={[0.2, 0.01, 0.05]} n={5} />}
			<Motes f={f} n={night ? 30 : 50} center={[0, 3, 0]} size={[10, 5, 20]} color={night ? '#c8d0ff' : '#ffe8c0'} glow={1.1} s={0.04} />
		</>
	);
};

// re-exported for later sets
export {Bamboo, BigTree, Blades, Bush, Palm2, Treeline, scatter, Helicopter};
