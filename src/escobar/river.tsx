import React, {useMemo} from 'react';
import {BlockText} from '../BlockText';
import {onTwos} from '../anim';
import {Who} from '../lowpoly/Rig';
import {SunDisc} from '../cine/Cine';
import {
	BigTree,
	Bamboo,
	Blades,
	Bush,
	Bx,
	Canoe,
	Fence,
	Hyacinth,
	Jetty,
	Mist,
	Palm2,
	Pole,
	Reflection,
	Ridge,
	Shafts,
	Sky3,
	StiltHouse,
	SunPath,
	SunRig,
	Terrain,
	Treeline,
	WaterSurface,
	Wires,
	flat,
	mat,
	scatter,
	tint,
	tuft,
	vnoise,
} from '../env';
import {Birds, Clouds, Motes, life} from './kit';
import {handOf} from '../lebron/common';
import {Egret} from './sets';
import {P} from './cast';

// RIVER (shots 1 + 26): the Magdalena near Puerto Triunfo at sunrise, built as a full location.
//   FG  near-bank reeds and a mooring post framing the lens, floating water hyacinth.
//   MG  the hippos in brown water, a fisherman paddling a canoe across, egrets on the mudbank.
//   BG  far bank: stilt house (palafito) + jetty + moored canoes, guadua bamboo, a ceiba, palms,
//       power poles, the yellow PELIGRO sign; behind: two treelines and three hazy ridges.
// Light: low sun BEHIND the far bank (backlight, long shadows toward camera, hot rims, sun path
// on the water), sky fill, warm camera-side fill. Ambient: current, glints, mist, reeds sway,
// birds, pollen, smoke from the house, laundry, the fisherman's strokes.
type V3 = [number, number, number];
const PI = Math.PI;

const SUN: V3 = [-0.09, 0.075, -1]; // direction to the sun (low, behind the far bank, a little left)
const SUN_POS: V3 = [-21, 17, -230];
const BANK_Z = -38; // far waterline (the Magdalena is wide: keep the bank far so people/houses read small)

// Far-bank height: under water in the river, rising through mud to a grassy bank with bumps.
const nz = vnoise(5);
const bankH = (x: number, z: number) => {
	const t = Math.min(1, Math.max(0, (BANK_Z - z) / 5));
	const shore = -0.6 + t * 1.7;
	return shore + (z < BANK_Z - 4 ? nz(x * 0.08, z * 0.08) * 1.6 + nz(x * 0.3, z * 0.3) * 0.3 : nz(x * 0.4, z * 0.4) * 0.15);
};
// mirrored copy must never poke above the water: clamp to just above y=0 (mirrors to below)
const bankLite = (x: number, z: number) => Math.max(0.02, bankH(x, z));
const bankCol = (_x: number, y: number, _z: number, slope: number, r: number) => {
	if (y < 0.35) return tint('#5a4632', (r - 0.5) * 0.15); // wet mud
	if (y < 0.75 || slope > 0.45) return tint('#7a6244', (r - 0.5) * 0.2); // dry mud bank
	return tint(r < 0.5 ? '#5a7a2e' : '#6a8a34', (r - 0.5) * 0.18, (r - 0.5) * 0.08); // pasture
};

// Everything on the far bank (also mirrored into the water as a reflection).
const FarBank: React.FC<{f: number; lite?: boolean}> = ({f, lite}) => {
	const reeds = useMemo(
		() =>
			scatter(lite ? 200 : 520, {x: [-80, 80], z: [BANK_Z - 3.2, BANK_Z + 0.8]}, {seed: 31, h: [0.9, 2.4], w: [0.06, 0.12], cols: ['#6a8a3a', '#7a9a42', '#8a8a44', '#5a7a32', '#a89a5a'], y: (x, z) => Math.max(lite ? 0.02 : -0.3, bankH(x, z))}),
		[lite],
	);
	const grass = useMemo(
		() => scatter(lite ? 0 : 700, {x: [-70, 70], z: [BANK_Z - 14, BANK_Z - 3]}, {seed: 32, h: [0.3, 0.9], cols: ['#5a7a2e', '#6a8a34', '#7a9a3a', '#8a8a4a'], y: (x, z) => bankH(x, z)}),
		[lite],
	);
	const y = (x: number, z: number) => bankH(x, z);
	return (
		<group>
			<Terrain w={260} d={64} nx={70} nz={22} pos={[0, 0, BANK_Z - 28]} height={lite ? bankLite : bankH} color={bankCol} shadow={!lite} />
			<Blades items={reeds} f={f} />
			{!lite ? <Blades items={grass} f={f} wind={0.6} /> : null}
			{/* the riverside house on stilts with its jetty + moored canoes */}
			<group position={[-10, -0.3, BANK_Z - 3.5]} rotation={[0, 0.45, 0]} scale={1.7}>
				<StiltHouse f={f} seed={3} wall="#8a6a4a" />
				{!lite ? (
					<group position={[0.8, 1.7, 1.85]} scale={1 / 1.7}>
						<Angler f={f} />
					</group>
				) : null}
			</group>
			<group position={[-7, 0, BANK_Z - 1.6]} rotation={[0, 0.55, 0]} scale={1.6}>
				<Jetty len={3} y={0.45} />
			</group>
			<group position={[-4.4, -0.1, BANK_Z + 2.8]} rotation={[0, 2.1, 0]} scale={1.5}>
				<Canoe color="#2a6a8a" rock={Math.sin(onTwos(f) * 0.08)} />
			</group>
			<group position={[2.5, 0.05, BANK_Z + 0.4]} rotation={[0.04, 1.2, 0]} scale={1.5}>
				<Canoe color="#a83a2a" trim="#e8c84a" len={5} paddle={false} rock={Math.sin(onTwos(f) * 0.08 + 1)} />
			</group>
			{/* second house further along, half hidden by bamboo */}
			<group position={[17, 0, BANK_Z - 5]} rotation={[0, -0.35, 0]} scale={1.7}>
				<StiltHouse f={f} seed={8} wall="#9a8a6a" />
			</group>
			<Bamboo pos={[-13, y(-13, BANK_Z - 3), BANK_Z - 3]} n={11} h={12} seed={4} f={f} />
			<Bamboo pos={[9.5, y(9.5, BANK_Z - 3), BANK_Z - 3]} n={9} h={10} seed={7} f={f} />
			<Bamboo pos={[27, y(27, BANK_Z - 2), BANK_Z - 2]} n={8} h={11} seed={9} f={f} s={0.9} />
			{/* a big ceiba dominating the skyline, backlit; palms and bushes */}
			<BigTree pos={[-17, y(-17, BANK_Z - 12), BANK_Z - 12]} s={1.35} seed={2} f={f} leaf="#3e6a2a" />
			<BigTree pos={[11, y(11, BANK_Z - 14), BANK_Z - 14]} s={1.1} seed={6} f={f} leaf="#466e2a" flowers="#e89a3a" />
			<Palm2 pos={[6, y(6, BANK_Z - 5), BANK_Z - 5]} s={1.1} seed={1} f={f} bend={0.14} />
			<Palm2 pos={[-5, y(-5, BANK_Z - 7), BANK_Z - 7]} s={1.25} seed={3} f={f} bend={0.1} />
			<Palm2 pos={[34, y(34, BANK_Z - 8), BANK_Z - 8]} s={1.2} seed={5} f={f} />
			{!lite
				? [[-14, -5], [-7, -6], [2, -4.5], [9, -6], [24, -7], [-36, -6], [40, -5]].map(([x, dz], i) => <Bush key={i} pos={[x, y(x, BANK_Z + dz), BANK_Z + dz]} s={1.2 + (i % 3) * 0.3} seed={i + 2} c={i % 2 ? '#4a7a2e' : '#5a7a32'} />)
				: null}
			{/* power line marching along the bank road */}
			{!lite ? (
				<>
					{[-46, -24, -2, 20, 42].map((x, i) => <Pole key={x} p={[x, y(x, BANK_Z - 9), BANK_Z - 9]} h={11} lean={(i % 2 ? 1 : -1) * 0.03} />)}
					<Wires pts={[-46, -24, -2, 20, 42].map((x) => [x, y(x, BANK_Z - 9) + 10.67, BANK_Z - 9] as V3)} />
					<Fence a={[-30, y(-30, BANK_Z - 6), BANK_Z - 6]} b={[-16, y(-16, BANK_Z - 6.5), BANK_Z - 6.5]} n={7} />
				</>
			) : null}
			{/* the real-life warning sign (yellow, "PELIGRO HIPOPÓTAMOS") on the bank */}
			<group position={[4.6, y(4.6, BANK_Z - 1.2), BANK_Z - 1.2]} rotation={[0, -0.15, 0]} scale={1.35}>
				<Bx s={[0.2, 3.4, 0.2]} p={[0, 1.7, 0]} m={mat('bark', {base: '#6a5a44', seed: 3}, 1, 2)} />
				<Bx s={[0.2, 3.2, 0.2]} p={[1.6, 1.6, 0]} m={mat('bark', {base: '#6a5a44', seed: 4}, 1, 2)} />
				<group position={[0.8, 3.2, 0.14]}>
					<Bx s={[2.9, 1.5, 0.1]} m={flat('#f2c830')} />
					<Bx s={[2.7, 1.3, 0.12]} m={flat('#141414')} />
					<Bx s={[2.55, 1.15, 0.14]} m={mat('concrete', {base: '#f2c830', seed: 7, wear: 1}, 1, 1)} />
					{!lite ? (
						<>
							<BlockText text="PELIGRO" size={0.34} depth={0.05} color="#c8201a" position={[0, 0.22, 0.08]} />
							<BlockText text="HIPOPOTAMOS" size={0.2} depth={0.04} color="#141414" position={[0, -0.26, 0.08]} />
						</>
					) : null}
				</group>
			</group>
			{/* egrets on the mud */}
			{[[7.5, BANK_Z + 0.1], [-14, BANK_Z - 0.6]].map(([x, z], i) => <Egret key={i} pos={[x, Math.max(0, y(x, z)) - 0.1, z]} rot={i * 0.9 + 0.3} />)}
			{/* background: two treelines fading into haze */}
			<Treeline z={BANK_Z - 26} y={1.2} n={lite ? 40 : 90} seed={9} x={[-140, 140]} cols={['#4a6a34', '#527038', '#466430']} h={[5, 9]} />
			<Treeline z={BANK_Z - 50} y={0.5} n={lite ? 30 : 70} seed={10} x={[-180, 180]} h={[8, 14]} cols={['#5a7a4a', '#647e50', '#58744a']} />
		</group>
	);
};

// Background life: an old fisherman sits at the end of the jetty with a rod, watching the hippos.
const Angler: React.FC<{f: number}> = ({f}) => {
	const ff = onTwos(f);
	const p = P.fisher;
	const bob = Math.sin(ff * 0.07) * 0.06;
	const pose = {lean: 0.22, armRX: -1.3 + bob * 0.5, armLX: -1.0, armRZ: 0.25, armLZ: -0.2, legLX: 0.1, headY: 0.35 + Math.sin(ff * 0.02) * 0.3, headX: 0.15, face: 'calm'};
	const h = handOf(pose, 'R', [0, 0, 0], p.h);
	return (
		// on the stilt-house porch (placed inside the house group), leaning on the rail with a coffee
		<group rotation={[0, 0.25, 0]}>
			<Who look={p.look} h={p.h} pose={life(pose, f, 1.3, 0.6)} />
			<Bx s={[0.22, 0.26, 0.22]} p={[h.x, h.y + 0.12, h.z]} m={flat('#e8e0d0')} cast={false} />
		</group>
	);
};

// Midground layer: a mud sandbar with reeds, a bleached driftwood snag and egrets (one perched).
const SAND_Z = -17;
const sandH = (x: number, z: number) => 0.55 - Math.pow((x - 8) / 7, 2) * 0.6 - Math.pow((z - SAND_Z) / 2.6, 2) * 0.6 + nz(x * 0.5, z * 0.5) * 0.15;
const Sandbar: React.FC<{f: number}> = ({f}) => {
	const reeds = useMemo(() => scatter(160, {x: [2, 14], z: [SAND_Z - 2.5, SAND_Z + 1.5]}, {seed: 51, h: [0.6, 2.0], cols: ['#6a8a3a', '#8a8a44', '#a89a5a', '#5a7a32'], y: sandH, keep: (x, z) => sandH(x, z) > 0.05}), []);
	const drift = mat('bark', {base: '#b8ae9e', seed: 61}, 1, 2);
	const ff = onTwos(f);
	return (
		<group>
			<Terrain w={18} d={8} nx={18} nz={8} pos={[8, 0, SAND_Z]} height={sandH} color={(_x, y, _z, _s, r) => (y < 0.2 ? tint('#5a4632', (r - 0.5) * 0.15) : tint('#8a7458', (r - 0.5) * 0.2))} />
			<Blades items={reeds} f={f} />
			{/* driftwood snag: a fallen trunk with a dead branch pointing at the sky */}
			<group position={[6.2, 0.25, SAND_Z + 0.6]} rotation={[0, 0.5, 0.08]}>
				<Bx s={[5.5, 0.5, 0.5]} m={drift} />
				<Bx s={[0.3, 2.6, 0.3]} p={[1.6, 1.2, 0]} r={[0, 0, -0.35]} m={drift} />
				<Bx s={[0.2, 1.2, 0.2]} p={[2.4, 2.3, 0]} r={[0, 0, -1.0]} m={drift} />
				<Bx s={[0.9, 0.7, 0.9]} p={[-2.8, 0.1, 0]} r={[0.3, 0.2, 0.4]} m={drift} />
			</group>
			<Egret pos={[8.6, 2.55, SAND_Z + 0.9]} rot={-0.6} />
			<Egret pos={[10.2, 0.25, SAND_Z - 0.4]} rot={0.9 + Math.sin(ff * 0.03) * 0.3} />
			<Egret pos={[4.0, 0.2, SAND_Z + 0.9]} rot={2.4} />
		</group>
	);
};

export const RiverV3: React.FC<{f: number; cam: V3; fg?: 'hook' | 'yawn'}> = ({f, cam, fg = 'hook'}) => {
	const fgBlades = useMemo(
		() =>
			fg === 'hook'
				? [...tuft([-0.95, -0.3, 8.6], 14, 1.7, ['#4a6a2a', '#5a7a32', '#6a8a3a', '#3a5a24'], 3, 0.4, 0.5), ...tuft([2.1, -0.3, 7.0], 9, 1.3, ['#5a7a32', '#7a8a3a', '#8a8a44'], 5, 0.4, 0.5)]
				: [...tuft([-3.9, -0.3, 7.6], 14, 2.0, ['#4a6a2a', '#5a7a32', '#6a8a3a', '#3a5a24'], 7, 0.4, 0.5), ...tuft([-1.8, -0.3, 7.0], 8, 1.2, ['#5a7a32', '#7a8a3a'], 9, 0.4, 0.5)],
		[fg],
	);
	const hyac = useMemo<V3[]>(() => (fg === 'hook' ? [[-0.2, 0, 7.4], [1.2, 0, 4.4], [-2.6, 0, 3], [3.5, 0, -2], [-5, 0, -8], [5, 0, -9]] : [[-0.4, 0, 3.6], [1.6, 0, 1.2], [4, 0, -4], [-5, 0, -6]]), [fg]);
	return (
		<>
			<Sky3 top="#3e5c96" mid="#c89a98" horizon="#ffc88a" below="#3a3a40" fog="#e8b88e" near={14} far={170} sunDir={SUN} glowCol="#ffe0a0" />
			<SunDisc pos={SUN_POS} color="#ffd890" r={9} i={6} />
			<SunRig sun={SUN} key="#ffb070" keyI={3.0} sky="#a8c0e8" ground="#7a6048" hemi={1.0} rim="#ffc890" rimI={0.9} rimDir={[-20, 6, -8]} fill={1.1} fillDir={[cam[0] + 4, cam[1] + 6, cam[2] + 6]} fillCol="#ffe4c8" span={34} />
			{/* distance: three ridges fading into the dawn haze (atmospheric perspective) */}
			<Ridge z={-120} h={26} color="#8a7a7a" seed={2} x={-20} />
			<Ridge z={-160} h={40} color="#b0928a" seed={5} />
			<Ridge z={-205} h={55} color="#d0a890" seed={8} x={30} />
			<Clouds f={f} y={40} z={-150} spread={260} n={10} color="#ffd8b8" speed={0.02} />
			<Birds f={f} from={[-46, 18, -60]} dir={[0.32, 0.03, 0.05]} n={9} />
			<Birds f={f} from={[10, 12, -30]} dir={[-0.22, 0.04, 0.02]} n={4} color="#f2f0e8" start={20} />
			{/* water: see-through brown current over the mirrored bank = reflection */}
			<WaterSurface f={f} base="#6a5236" alt="#c8a878" opacity={0.9} flow={[0.005, 0.0004]} />
			<Reflection>
				<FarBank f={f} lite />
			</Reflection>
			<SunPath f={f} from={[SUN_POS[0] * 0.3, 0, BANK_Z - 4]} to={[cam[0] - 0.2, 0, cam[2] - 7]} w={3.5} op={0.5} />
			<FarBank f={f} />
			<Mist f={f} bands={[{y: 0.5, z: BANK_Z + 2, w: 180, d: 8, op: 0.55}, {y: 1.4, z: BANK_Z - 10, w: 220, d: 14, op: 0.5}, {y: 3.5, z: BANK_Z - 40, w: 300, d: 30, op: 0.45}]} color="#ffe2c4" speed={0.4} />
			<Shafts from={[-26, 26, -150]} dir={[0.12, -0.18, 1]} n={6} len={120} spread={0.5} w={6} op={0.05} f={f} />
			<Sandbar f={f} />
			{/* foreground: reeds + a weathered mooring post framing the lens, floating hyacinth */}
			<Blades items={fgBlades} f={f} wind={1.2} shadow />
			<Hyacinth pts={hyac} f={f} />
			<Motes f={f} n={45} center={[0, 2.5, 0]} size={[16, 4, 18]} color="#fff0c0" glow={1.1} s={0.04} />
		</>
	);
};
