import React from 'react';
import {RBox, seeded} from '../parts';
import {BlockText} from '../BlockText';
import {Sky} from '../messi/sets';
import {Building, Car, CarKind, Crt, FlipCounter, FloppyStack, GameBox, Glow, Keyboard, Mug, Palm, PizzaBoxStack, Rain, Rig, StreetLamp, Sticky} from './props';

type V3 = [number, number, number];
const PI = Math.PI;

const Floor: React.FC<{color: string; size?: [number, number]; y?: number; pos?: V3}> = ({color, size = [80, 80], y = 0, pos = [0, 0, 0]}) => (
	<mesh rotation={[-PI / 2, 0, 0]} position={[pos[0], y, pos[2]]} receiveShadow>
		<planeGeometry args={size} />
		<meshStandardMaterial color={color} roughness={0.9} />
	</mesh>
);

// =====================================================================
// Diorama city: the early top-down game as a physical model on a table.
// Grid of roads at y=0 with blocks between them. `cars` drives the tiny cars.
// =====================================================================
export type DioCar = {kind: CarKind; x: number; z: number; rot: number; siren?: number; dent?: number; roll?: number; flip?: number};

export const DIO_ROADS = [-6, 0, 6];
export const Diorama: React.FC<{cars: DioCar[]; night?: boolean; table?: boolean; frame?: number; chaos?: number}> = ({cars, night = true, table = true, frame = 0, chaos = 0}) => {
	const r = seeded(9);
	const blocks: {x: number; z: number; w: number; d: number; h: number; c: string}[] = [];
	const cols = ['#c8b8a0', '#a8b0b8', '#b89880', '#9aa8a0', '#d0c0a8', '#8a98a8'];
	for (const bx of [-9, -3, 3, 9])
		for (const bz of [-9, -3, 3, 9]) {
			const n = 1 + Math.floor(r() * 2);
			for (let k = 0; k < n; k++) blocks.push({x: bx + (n > 1 ? (k - 0.5) * 2.2 : 0), z: bz + (r() - 0.5) * 0.8, w: n > 1 ? 1.9 : 3.6, d: 3.4, h: 0.6 + r() * 2.6, c: cols[Math.floor(r() * cols.length)]});
		}
	return (
		<group>
			{table ? (
				<>
					<RBox size={[26, 0.6, 26]} pos={[0, -0.32, 0]} color="#6a4a30" />
					<RBox size={[26.4, 0.2, 26.4]} pos={[0, -0.7, 0]} color="#5a3a22" />
				</>
			) : null}
			{/* pavement base */}
			<RBox size={[24, 0.08, 24]} pos={[0, 0.0, 0]} color={night ? '#5a5e66' : '#9a9ea6'} />
			{/* roads */}
			{DIO_ROADS.map((x) => (
				<React.Fragment key={x}>
					<RBox size={[2.2, 0.1, 24]} pos={[x, 0.02, 0]} color="#2e3036" />
					<RBox size={[24, 0.1, 2.2]} pos={[0, 0.021, x]} color="#2e3036" />
					{Array.from({length: 10}).map((_, i) => (
						<React.Fragment key={i}>
							<RBox size={[0.08, 0.11, 0.6]} pos={[x, 0.03, -11 + i * 2.4]} color="#f2c21a" />
							<RBox size={[0.6, 0.11, 0.08]} pos={[-11 + i * 2.4, 0.031, x]} color="#f2f2ea" />
						</React.Fragment>
					))}
				</React.Fragment>
			))}
			{/* zebra crossings */}
			{[-1.6, 1.6].map((dz) =>
				Array.from({length: 5}).map((_, i) => <RBox key={`${dz}-${i}`} size={[0.24, 0.112, 0.6]} pos={[-0.8 + i * 0.4, 0.032, dz]} color="#f4f4ee" />),
			)}
			{blocks.map((b, i) => {
				const shake = chaos > 0 ? Math.sin(frame * 1.7 + i) * 0.04 * chaos : 0;
				return <Building key={i} w={b.w} d={b.d} h={b.h} pos={[b.x + shake, 0.05, b.z]} color={b.c} lit={night ? 0.55 : 0.1} rows={Math.max(1, Math.round(b.h / 0.6))} cols={3} seed={i + 3} trim="#6a6e76" />;
			})}
			{/* tiny trees, lamps, hydrants */}
			{[-10.5, -4.5, 1.5, 7.5].map((x, i) => (
				<group key={i} position={[x, 0.05, -1.4]}>
					<RBox size={[0.12, 0.4, 0.12]} pos={[0, 0.2, 0]} color="#5a3a22" />
					<RBox size={[0.5, 0.5, 0.5]} pos={[0, 0.6, 0]} color="#3f8a4a" />
				</group>
			))}
			{night
				? [-7.4, -1.4, 4.6].map((x) => (
						<group key={x} position={[x, 0.05, 1.4]}>
							<RBox size={[0.06, 0.8, 0.06]} pos={[0, 0.4, 0]} color="#2a2a2e" />
							<Glow size={[0.2, 0.06, 0.2]} pos={[0, 0.82, 0]} color="#ffc070" i={3} />
							<pointLight position={[0, 0.7, 0]} color="#ffb060" intensity={1.2} distance={3} />
						</group>
				  ))
				: null}
			<RBox size={[0.14, 0.24, 0.14]} pos={[1.4, 0.17, 1.4]} color="#d82a2a" />
			{cars.map((c, i) => (
				<group key={i} position={[c.x, 0.08 + (c.flip ? Math.sin(c.flip * PI) * 1.2 : 0), c.z]} rotation={[c.flip ? c.flip * PI * 2 : 0, c.rot, 0]}>
					<Car kind={c.kind} scale={0.3} siren={c.siren} dent={c.dent} roll={c.roll} lights={night} />
				</group>
			))}
		</group>
	);
};

// Room around the diorama table (the DMA playtest room) at night, for wide shots.
export const DioRoomLights: React.FC<{night?: boolean}> = ({night = true}) => (
	<>
		<Sky color={night ? '#0c1018' : '#1a1e26'} fog={[40, 90]} />
		<Rig hemi={['#6a7aa8', '#2a2018', night ? 0.45 : 0.8]} key_={{pos: [-8, 22, 10], color: '#c8d8ff', i: night ? 1.1 : 2.2, size: 16}} rim={{pos: [10, 6, -14], color: '#ff6a4a', i: 0.8}} fill={{pos: [0, 10, 20], i: 0.35}} />
	</>
);

// =====================================================================
// Dundee 1988: rainy sandstone tenement street.
// =====================================================================
export const Dundee: React.FC<{frame: number}> = ({frame}) => (
	<group>
		<Sky color="#7d8898" fog={[30, 80]} />
		<Rig hemi={['#a8b4c8', '#3a3a3a', 0.8]} key_={{pos: [-10, 20, 12], color: '#dde4f0', i: 1.2, size: 24}} rim={{pos: [8, 8, -16], color: '#9ab8e0', i: 0.8}} fill={{pos: [0, 6, 20], i: 0.4}} />
		<Floor color="#3e4248" />
		{/* road and kerbs */}
		<RBox size={[80, 0.06, 10]} pos={[0, 0.03, 0]} color="#2e3138" rough={0.3} />
		<RBox size={[80, 0.3, 4]} pos={[0, 0.15, -7]} color="#7a7a7e" />
		<RBox size={[80, 0.3, 4]} pos={[0, 0.15, 7]} color="#7a7a7e" />
		{Array.from({length: 12}).map((_, i) => (
			<RBox key={i} size={[2, 0.07, 0.2]} pos={[-26 + i * 4.6, 0.05, 0]} color="#d8d8d0" />
		))}
		{/* puddles (glossy) */}
		{[
			[-4, 2],
			[3, -2.5],
			[9, 1.5],
		].map(([x, z], i) => (
			<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[x, 0.07, z]}>
				<circleGeometry args={[1.2 + i * 0.3, 10]} />
				<meshStandardMaterial color="#5a6a80" metalness={0.6} roughness={0.05} />
			</mesh>
		))}
		{/* tenements: sandstone with warm windows */}
		{[-22, -13, -4, 5, 14, 23].map((x, i) => (
			<Building key={i} w={8.6} d={6} h={13 + (i % 3) * 1.5} pos={[x, 0, -13]} color={['#a8906e', '#9a8466', '#b09878'][i % 3]} win="#ffd890" lit={0.4} rows={4} cols={4} seed={i + 20} trim="#7a6a52" />
		))}
		{/* shopfront: chip shop */}
		<group position={[-4, 0.3, -9.9]}>
			<RBox size={[8, 3.4, 0.3]} pos={[0, 1.7, 0]} color="#2a5a3a" />
			<Glow size={[6.4, 2.0, 0.1]} pos={[0, 1.4, 0.2]} color="#ffe2a0" i={1.2} />
			<RBox size={[8.4, 1.1, 0.5]} pos={[0, 3.9, 0.1]} color="#1e3a28" />
			<BlockText text="THE GOLDEN FRYER" size={0.5} depth={0.12} color="#f2c84a" position={[0, 3.9, 0.45]} />
		</group>
		{/* red phone box */}
		<group position={[6, 0.3, -6.6]}>
			<RBox size={[1.6, 4.6, 1.6]} pos={[0, 2.3, 0]} color="#c41e1e" rough={0.4} />
			<Glow size={[1.1, 2.6, 0.06]} pos={[0, 2.4, 0.82]} color="#fff0c0" i={0.7} />
			<RBox size={[1.7, 0.4, 1.7]} pos={[0, 4.8, 0]} color="#a81818" />
			<BlockText text="PHONE" size={0.22} depth={0.04} color="#f4f4ee" position={[0, 4.3, 0.84]} />
		</group>
		{/* bus stop with timetable */}
		<group position={[11, 0.3, -6.4]}>
			<RBox size={[0.2, 4, 0.2]} pos={[-1.6, 2, 0]} color="#3a3a40" />
			<RBox size={[0.2, 4, 0.2]} pos={[1.6, 2, 0]} color="#3a3a40" />
			<RBox size={[3.8, 0.2, 1.6]} pos={[0, 4.0, 0.3]} color="#2a2a30" />
			<RBox size={[3.2, 2.4, 0.06]} pos={[0, 2.2, -0.4]} color="#9ab8d0" rough={0.1} />
			<RBox size={[0.9, 1.1, 0.1]} pos={[-0.9, 2.6, -0.3]} color="#f4f4ee" />
			<BlockText text="BUS 22" size={0.16} depth={0.03} color="#c41e1e" position={[-0.9, 2.9, -0.24]} />
			<RBox size={[2.8, 0.2, 0.6]} pos={[0, 1.2, -0.1]} color="#6a4a30" />
		</group>
		{/* bin with a seagull */}
		<group position={[-10, 0.3, -6]}>
			<RBox size={[1.2, 1.8, 1.2]} pos={[0, 0.9, 0]} color="#2a5a3a" />
			<group position={[0, 1.9, 0]} rotation={[0, 0.6 + Math.sin(frame * 0.2) * 0.2, 0]}>
				<RBox size={[0.7, 0.4, 0.34]} pos={[0, 0.25, 0]} color="#f4f4f0" />
				<RBox size={[0.3, 0.3, 0.3]} pos={[0.38, 0.5, 0]} color="#f4f4f0" />
				<RBox size={[0.2, 0.08, 0.1]} pos={[0.6, 0.48, 0]} color="#f2b21a" />
				<RBox size={[0.5, 0.1, 0.4]} pos={[-0.1, 0.4, 0]} color="#8a8e96" />
			</group>
		</group>
		{/* boxy hatchback parked */}
		<Car kind="hatch" pos={[-15, 0, 3.4]} rotY={0} scale={1.25} lights={false} />
		{/* the DUNDEE 1988 kerb caption */}
		<group position={[0, 0.32, 5.4]}>
			<BlockText text="DUNDEE" size={1.3} depth={0.5} color="#f4f0e6" side="#8a8070" position={[-1.6, 0.66, 0]} />
			<BlockText text="1988" size={1.3} depth={0.5} color="#f2c84a" side="#8a6a20" position={[5.2, 0.66, 0]} />
		</group>
		<StreetLamp pos={[-6, 0.3, -5.8]} h={7.5} light={6} />
		<StreetLamp pos={[16, 0.3, -5.8]} h={7.5} light={6} />
		<Rain frame={frame} n={600} area={[50, 18, 26]} center={[0, 0, -2]} />
	</group>
);

// =====================================================================
// DMA studio: cramped room, CRTs, floppies, tea, rain on the window.
// =====================================================================
export const Studio: React.FC<{frame: number; glitch?: number; lamp?: number; dim?: number; plaque?: number; screenKids?: React.ReactNode; boardText?: string}> = ({frame, glitch = 0, lamp = 1, dim = 0, plaque = 1, screenKids, boardText}) => {
	const scr = glitch > 0 ? (Math.floor(frame / 2) % 2 ? '#ff2a4a' : '#2aff9a') : '#3aff8a';
	return (
		<group>
			<Sky color="#2a2e38" />
			<Rig hemi={['#b8c4d8', '#4a3a2a', 0.7 - dim * 0.4]} key_={{pos: [-12, 14, 8], color: '#c8d4e8', i: 1.4 - dim, size: 14}} rim={{pos: [10, 8, -10], color: '#ffb870', i: 1.0}} fill={{pos: [2, 6, 18], i: 0.5 - dim * 0.3}} />
			<Floor color="#5a4a3e" />
			{/* carpet tiles */}
			{Array.from({length: 6}).map((_, i) =>
				Array.from({length: 4}).map((_, j) => <RBox key={`${i}-${j}`} size={[3.9, 0.02, 3.9]} pos={[-10 + i * 4, 0.01, -6 + j * 4]} color={(i + j) % 2 ? '#5e5044' : '#54473c'} />),
			)}
			{/* walls */}
			<RBox size={[30, 14, 0.4]} pos={[0, 7, -9]} color="#cfc4a8" />
			<RBox size={[0.4, 14, 20]} pos={[-13, 7, 0]} color="#c4b89c" />
			<RBox size={[30, 0.6, 0.5]} pos={[0, 1.2, -8.8]} color="#8a7458" />
			{/* rainy window */}
			<group position={[-6, 7.5, -8.75]}>
				<Glow size={[6, 4.4, 0.05]} color="#5a6a88" i={0.5} />
				<RBox size={[6.4, 0.3, 0.3]} pos={[0, -2.3, 0.1]} color="#e8e2d0" />
				<RBox size={[6.4, 0.2, 0.2]} pos={[0, 2.3, 0.1]} color="#e8e2d0" />
				<RBox size={[0.2, 4.6, 0.2]} pos={[0, 0, 0.1]} color="#e8e2d0" />
				{Array.from({length: 18}).map((_, i) => (
					<RBox key={i} size={[0.05, 0.4, 0.02]} pos={[-2.8 + ((i * 1.37) % 5.6), 2 - ((frame * 0.12 + i * 0.7) % 4.2), 0.06]} color="#c8d8f0" />
				))}
				<pointLight position={[0, 0, 2]} color="#8aa0c8" intensity={6} distance={10} />
			</group>
			{/* radiator with drying socks */}
			<group position={[-6, 0, -8.5]}>
				{Array.from({length: 9}).map((_, i) => (
					<RBox key={i} size={[0.36, 2.2, 0.4]} pos={[-2 + i * 0.5, 2.0, 0]} color="#e8e4d8" />
				))}
				<RBox size={[0.5, 0.9, 0.12]} pos={[-1.2, 2.6, 0.3]} color="#c83a3a" />
				<RBox size={[0.5, 0.9, 0.12]} pos={[0.4, 2.6, 0.3]} color="#3a6ac8" />
			</group>
			{/* corkboard with cards */}
			<group position={[4, 8, -8.75]}>
				<RBox size={[6, 3.6, 0.2]} color="#b88a5a" />
				{Array.from({length: 9}).map((_, i) => (
					<RBox key={i} size={[1.2, 0.8, 0.05]} pos={[-2.2 + (i % 3) * 2.2, 1 - Math.floor(i / 3) * 1.0, 0.13]} rot={[0, 0, (i % 4) * 0.04 - 0.06]} color={['#f4f4ee', '#f8e26a', '#9ad0f0', '#f4b0c8'][i % 4]} />
				))}
			</group>
			{/* whiteboard */}
			<group position={[11, 6.8, -8.7]}>
				<RBox size={[5.6, 3.6, 0.15]} color="#f4f4f6" rough={0.2} />
				<RBox size={[5.8, 0.2, 0.4]} pos={[0, -1.9, 0.15]} color="#a8a8b0" />
				{boardText ? <BlockText text={boardText} size={0.42} depth={0.04} color="#2a4ab0" position={[0, 0.8, 0.1]} /> : null}
				{/* scribbled arrows */}
				<RBox size={[2.6, 0.08, 0.02]} pos={[-0.6, -0.3, 0.09]} rot={[0, 0, 0.2]} color="#c82a2a" />
				<RBox size={[0.08, 1.2, 0.02]} pos={[1.5, -0.4, 0.09]} color="#2a8a4a" />
				<RBox size={[1.4, 0.08, 0.02]} pos={[1.0, -1.0, 0.09]} color="#2a8a4a" />
			</group>
			{/* door with plaque */}
			<group position={[-12.75, 0, 4]}>
				<RBox size={[0.2, 9, 4.4]} pos={[0, 4.5, 0]} color="#6a4a30" />
				<RBox size={[0.3, 0.3, 0.3]} pos={[0.2, 4.4, -1.6]} color="#d8b048" />
				<group position={[0.18, 6.6, 0]} rotation={[0, PI / 2, 0]} scale={plaque}>
					<RBox size={[2.8, 0.8, 0.08]} color="#c8a048" rough={0.3} />
					<BlockText text="DMA DESIGN" size={0.34} depth={0.05} color="#2a2420" position={[0, 0, 0.06]} />
				</group>
			</group>
			{/* main desk */}
			<group position={[0, 0, -3]}>
				<RBox size={[12, 0.3, 4.4]} pos={[0, 2.3, 0]} color="#8a6a48" />
				{[-5.6, 5.6].map((x) => (
					<RBox key={x} size={[0.4, 2.3, 4]} pos={[x, 1.15, 0]} color="#6a5038" />
				))}
				<Crt pos={[-3, 2.45, -0.5]} rotY={0.15} screen={scr} glow={lamp}>
					{screenKids}
				</Crt>
				<Crt pos={[3.2, 2.45, -0.6]} rotY={-0.2} screen={glitch > 0 ? scr : '#8ad8ff'} glow={lamp * 0.8} />
				<Keyboard pos={[-2.8, 2.45, 1.2]} rotY={0.1} />
				<Keyboard pos={[3.0, 2.45, 1.1]} rotY={-0.15} />
				<FloppyStack pos={[-5.0, 2.45, 0.6]} n={7} />
				<FloppyStack pos={[0.4, 2.45, -1.4]} n={4} seed={9} />
				<Mug pos={[-0.8, 2.6, 1.3]} color="#2a6ab0" steam={frame * 0.15} />
				<Mug pos={[5.0, 2.6, 1.2]} color="#c8402a" />
				{/* biscuit tin */}
				<group position={[1.2, 2.45, 1.4]}>
					<mesh castShadow position={[0, 0.25, 0]}>
						<cylinderGeometry args={[0.5, 0.5, 0.5, 12]} />
						<meshStandardMaterial color="#c8202a" metalness={0.4} roughness={0.4} />
					</mesh>
					<mesh position={[0, 0.52, 0]}>
						<cylinderGeometry args={[0.52, 0.52, 0.06, 12]} />
						<meshStandardMaterial color="#e8c040" metalness={0.5} roughness={0.3} />
					</mesh>
				</group>
				{/* coiled cables */}
				{[0, 1, 2].map((i) => (
					<mesh key={i} position={[-1.2 + i * 0.3, 2.47, -1.8]} rotation={[PI / 2, 0, 0]}>
						<torusGeometry args={[0.3 + i * 0.05, 0.04, 6, 14]} />
						<meshStandardMaterial color="#1a1a1a" />
					</mesh>
				))}
				{/* desk lamp */}
				<group position={[5.0, 2.45, -1.2]}>
					<RBox size={[0.8, 0.12, 0.8]} color="#2a2a2e" />
					<RBox size={[0.1, 1.8, 0.1]} pos={[0, 0.9, 0]} rot={[0, 0, 0.3]} color="#2a2a2e" />
					<RBox size={[0.7, 0.4, 0.5]} pos={[-0.5, 1.8, 0]} rot={[0, 0, -0.4]} color="#2a4a2a" />
					{lamp > 0.1 ? <pointLight position={[-0.6, 1.4, 0.4]} color="#ffc070" intensity={8 * lamp} distance={7} /> : null}
					<Glow size={[0.4, 0.06, 0.3]} pos={[-0.55, 1.58, 0]} color="#ffd890" i={2 * lamp} />
				</group>
			</group>
			{/* chairs */}
			{[-3, 3.2].map((x) => (
				<group key={x} position={[x, 0, 2.6]}>
					<RBox size={[1.8, 0.2, 1.8]} pos={[0, 1.4, 0]} color="#2a3a6a" />
					<RBox size={[1.8, 2, 0.2]} pos={[0, 2.5, 0.9]} color="#2a3a6a" />
					<RBox size={[0.16, 1.3, 0.16]} pos={[0, 0.65, 0]} color="#3a3a3e" />
					<RBox size={[1.4, 0.1, 0.16]} pos={[0, 0.06, 0]} color="#3a3a3e" />
				</group>
			))}
			{/* side table with pizza boxes and bin */}
			<PizzaBoxStack pos={[9, 0, -5]} n={4} rotY={0.3} />
			<group position={[7.2, 0, 1.8]}>
				<RBox size={[1.2, 1.5, 1.2]} pos={[0, 0.75, 0]} color="#5a5e66" />
				<RBox size={[0.4, 0.3, 0.4]} pos={[0.1, 1.5, 0.1]} color="#f4f4ee" />
			</group>
			{/* posters as framed 3D tiles: block car and a tiny walker */}
			<group position={[-11, 8, -8.7]}>
				<RBox size={[3, 3.6, 0.15]} color="#2a2a30" />
				<RBox size={[2.6, 3.2, 0.05]} pos={[0, 0, 0.08]} color="#1a6aa8" />
				<RBox size={[1.6, 0.5, 0.1]} pos={[0, -0.4, 0.12]} color="#f2c21a" />
				<RBox size={[0.9, 0.4, 0.1]} pos={[0, 0.0, 0.12]} color="#f2c21a" />
			</group>
		</group>
	);
};

// =====================================================================
// London boardroom: glass, rain, long table, the wall socket and the plug.
// =====================================================================
export const Boardroom: React.FC<{frame: number; plug: number; lights?: number}> = ({frame, plug, lights = 1}) => (
	<group>
		<Sky color="#1a2030" />
		<Rig hemi={['#a8b8d8', '#2a2a30', 0.6 * lights + 0.1]} key_={{pos: [0, 20, 4], color: '#e8f0ff', i: 1.6 * lights + 0.1, size: 16}} rim={{pos: [-10, 6, -14], color: '#4a7ac8', i: 1.2}} fill={{pos: [0, 6, 20], i: 0.4}} />
		<Floor color="#2a2a30" />
		{/* glass wall with city bokeh */}
		<RBox size={[40, 16, 0.2]} pos={[0, 8, -10]} color="#1a2438" rough={0.05} />
		{Array.from({length: 40}).map((_, i) => (
			<Glow key={i} size={[0.4, 0.4, 0.05]} pos={[-18 + ((i * 7.3) % 36), 1 + ((i * 3.7) % 12), -9.85]} color={['#ffd890', '#ff9a6a', '#9ac8ff'][i % 3]} i={1.2} />
		))}
		{Array.from({length: 9}).map((_, i) => (
			<RBox key={i} size={[0.2, 16, 0.3]} pos={[-16 + i * 4, 8, -9.8]} color="#3a3e48" />
		))}
		<Rain frame={frame} n={250} area={[36, 16, 1]} center={[0, 0, -10.3]} color="#6a8ab0" />
		{/* long table and chairs */}
		<RBox size={[16, 0.4, 4.4]} pos={[0, 2.6, -2]} color="#3a2a20" rough={0.3} />
		<RBox size={[1.2, 2.4, 1.2]} pos={[-5, 1.2, -2]} color="#2a1e18" />
		<RBox size={[1.2, 2.4, 1.2]} pos={[5, 1.2, -2]} color="#2a1e18" />
		{[-6, -3, 0, 3, 6].map((x) => (
			<group key={x}>
				<RBox size={[1.8, 3.6, 0.3]} pos={[x, 2.6, -5.2]} color="#1a1a1e" />
				<RBox size={[1.8, 0.3, 1.8]} pos={[x, 1.5, -4.4]} color="#1a1a1e" />
				<RBox size={[1.0, 0.06, 1.3]} pos={[x, 2.83, -3.0]} color="#f4f4ee" />
			</group>
		))}
		{/* water jug and glasses */}
		<mesh position={[0, 3.3, -1.8]}>
			<cylinderGeometry args={[0.3, 0.35, 1.0, 10]} />
			<meshStandardMaterial color="#bfe0f0" transparent opacity={0.6} roughness={0.05} />
		</mesh>
		{/* the plug: socket on the side wall, cable across the floor */}
		<group position={[9.5, 0, 1]}>
			<RBox size={[0.3, 12, 10]} pos={[0.6, 6, 0]} color="#3a3e48" />
			<RBox size={[0.2, 1.4, 1.4]} pos={[0.4, 1.6, 0]} color="#f4f4ee" />
			<RBox size={[0.1, 0.3, 0.15]} pos={[0.28, 1.7, -0.3]} color="#2a2a2a" />
			<RBox size={[0.1, 0.3, 0.15]} pos={[0.28, 1.7, 0.3]} color="#2a2a2a" />
			<group position={[0.1 - plug * 2.6, 1.6 + plug * 1.2, 0]} rotation={[0, 0, plug * 0.6]}>
				<RBox size={[0.9, 1.0, 1.0]} pos={[-0.45, 0, 0]} color="#1a1a1e" />
				<RBox size={[0.4, 0.14, 0.1]} pos={[0.15, 0.1, -0.25]} color="#c8b048" />
				<RBox size={[0.4, 0.14, 0.1]} pos={[0.15, 0.1, 0.25]} color="#c8b048" />
			</group>
			<RBox size={[8, 0.25, 0.25]} pos={[-4.5, 0.14, 0]} color="#1a1a1e" />
		</group>
	</group>
);

// =====================================================================
// Publicist's office: sun through blinds, brick phone, fax, palm.
// =====================================================================
export const PubOffice: React.FC<{frame: number; fax: number}> = ({frame, fax}) => (
	<group>
		<Sky color="#f2c890" />
		<hemisphereLight args={['#ffe8c8', '#6a4a30', 0.6]} />
		{/* sun through blinds: key light behind the slats casts stripes */}
		<directionalLight position={[-16, 14, -4]} color="#ffd8a0" intensity={3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} shadow-bias={-0.0004} />
		<directionalLight position={[10, 6, -10]} color="#ff9a6a" intensity={1} />
		<directionalLight position={[0, 6, 20]} color="#fff0e0" intensity={0.6} />
		<Floor color="#c8a078" />
		<RBox size={[30, 14, 0.4]} pos={[0, 7, -8]} color="#e8d8c0" />
		{/* window wall on the left with blinds */}
		<group position={[-10, 0, 0]}>
			<RBox size={[0.3, 14, 4]} pos={[0, 7, -6]} color="#e8d8c0" />
			<RBox size={[0.3, 14, 4]} pos={[0, 7, 6]} color="#e8d8c0" />
			<RBox size={[0.3, 3, 8]} pos={[0, 1.5, 0]} color="#e8d8c0" />
			<RBox size={[0.3, 2, 8]} pos={[0, 13, 0]} color="#e8d8c0" />
			{Array.from({length: 18}).map((_, i) => (
				<RBox key={i} size={[0.6, 0.12, 8]} pos={[0.1, 3.3 + i * 0.5, 0]} rot={[0, 0, 0.5]} color="#f4f0e4" />
			))}
		</group>
		{/* desk */}
		<RBox size={[8, 0.4, 3.0]} pos={[0, 2.5, 3.0]} color="#f4f0e8" rough={0.3} />
		<RBox size={[7.6, 2.3, 0.2]} pos={[0, 1.15, 4.3]} color="#d8d0c0" />
		{/* fax machine spitting paper */}
		<group position={[2.6, 2.7, 2.6]}>
			<RBox size={[1.6, 0.6, 1.2]} pos={[0, 0.3, 0]} color="#e8e4d8" />
			<RBox size={[0.6, 0.06, 0.4]} pos={[-0.3, 0.62, 0.2]} color="#2a2a2a" />
			<RBox size={[1.1, 0.02, 0.4 + fax * 1.2]} pos={[0, 0.5, 0.6 + fax * 0.6]} rot={[-0.2, 0, 0]} color="#ffffff" />
		</group>
		{/* gold disc on the wall (generic), framed */}
		<group position={[4.5, 8, -7.7]}>
			<RBox size={[2.6, 3, 0.2]} color="#2a2a2a" />
			<mesh position={[0, 0.2, 0.15]} rotation={[PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.9, 0.9, 0.06, 20]} />
				<meshStandardMaterial color="#f2c84a" metalness={0.9} roughness={0.2} />
			</mesh>
		</group>
		{/* palm plant */}
		<group position={[6.5, 0, -5.8]} scale={0.5}>
			<Palm pos={[0, 0, 0]} h={6} lean={0.05} />
			<RBox size={[1.6, 1.6, 1.6]} pos={[0, 0.8, 0]} color="#c86a3a" />
		</group>
		{/* swivel chair */}
		<group position={[-1, 0, -0.2]}>
			<RBox size={[2, 0.3, 2]} pos={[0, 1.5, 0]} color="#3a2a20" />
			<RBox size={[2, 2.8, 0.3]} pos={[0, 3, -1.1]} color="#3a2a20" />
		</group>
		{/* water cooler */}
		<group position={[-7, 0, -6]}>
			<RBox size={[1.2, 3, 1.2]} pos={[0, 1.5, 0]} color="#f4f4f4" />
			<mesh position={[0, 3.8, 0]}>
				<cylinderGeometry args={[0.5, 0.5, 1.5, 10]} />
				<meshStandardMaterial color="#8ac8f0" transparent opacity={0.7} />
			</mesh>
		</group>
		{/* dust motes in the light */}
		{Array.from({length: 20}).map((_, i) => (
			<Glow key={i} size={[0.04, 0.04, 0.04]} pos={[-6 + ((i * 3.1) % 10), 3 + ((i * 1.7 + frame * 0.01) % 7), -2 + ((i * 2.3) % 6)]} color="#fff0c0" i={1.5} />
		))}
	</group>
);

// =====================================================================
// Newsstand with 3D tabloid headlines.
// =====================================================================
const Paper: React.FC<{pos: V3; rot?: V3; name: string; head: string; col?: string}> = ({pos, rot, name, head, col = '#c41e1e'}) => (
	<group position={pos} rotation={rot}>
		<RBox size={[2.2, 2.9, 0.12]} color="#f4f0e6" />
		<RBox size={[2.0, 0.5, 0.02]} pos={[0, 1.1, 0.07]} color={col} />
		<BlockText text={name} size={0.2} depth={0.03} color="#f4f4ee" position={[0, 1.1, 0.1]} />
		<BlockText text={head} size={0.36} depth={0.06} color="#1a1a1a" position={[0, 0.35, 0.09]} />
		{[0, 1, 2, 3].map((i) => (
			<RBox key={i} size={[1.8, 0.07, 0.02]} pos={[0, -0.3 - i * 0.22, 0.07]} color="#9a9a9a" />
		))}
	</group>
);

export const Newsstand: React.FC<{frame: number}> = ({frame}) => (
	<group>
		<Sky color="#bcd8f0" fog={[40, 90]} />
		<Rig hemi={['#e8f0ff', '#6a5a4a', 0.9]} key_={{pos: [12, 18, 12], color: '#fff2d8', i: 2.2, size: 16}} rim={{pos: [-10, 8, -12], color: '#9ac8ff', i: 1.0}} fill={{pos: [0, 6, 20], i: 0.5}} />
		<Floor color="#8a8a86" />
		{Array.from({length: 8}).map((_, i) => (
			<RBox key={i} size={[0.06, 0.02, 20]} pos={[-14 + i * 4, 0.01, 0]} color="#7a7a76" />
		))}
		{/* kiosk */}
		<group position={[0, 0, -5]}>
			<RBox size={[12, 8, 3]} pos={[0, 4, -1]} color="#2a5a3a" />
			<RBox size={[13, 0.4, 5]} pos={[0, 8.2, 0.4]} color="#1e3a28" />
			{Array.from({length: 7}).map((_, i) => (
				<RBox key={i} size={[1.8, 0.8, 1.2]} pos={[-5.4 + i * 1.8, 7.5, 2.4]} rot={[0.3, 0, 0]} color={i % 2 ? '#f4f0e6' : '#c41e1e'} />
			))}
			<BlockText text="NEWS" size={0.9} depth={0.2} color="#f2c84a" position={[0, 8.2, 2.9]} />
			{/* counter shelf of papers */}
			<RBox size={[12, 0.4, 2]} pos={[0, 2.6, 1.4]} color="#3a2a20" />
			<Paper pos={[-4, 4.4, 0.6]} rot={[-0.2, 0, 0]} name="DAILY BLARE" head="BAN IT!" />
			<Paper pos={[-1.4, 4.4, 0.6]} rot={[-0.2, 0, 0]} name="MORNING HOWL" head="OUTRAGE" col="#2a4a9a" />
			<Paper pos={[1.2, 4.4, 0.6]} rot={[-0.2, 0, 0]} name="THE SNORT" head="SHAME!" col="#1a1a1a" />
			<Paper pos={[3.8, 4.4, 0.6]} rot={[-0.2, 0, 0]} name="WEEKLY YELL" head="SICK!" col="#c87a1a" />
			{/* stacks */}
			{[-4, -1.4, 1.2, 3.8].map((x, i) => (
				<group key={x} position={[x, 2.8, 1.6]}>
					{Array.from({length: 6}).map((_, k) => (
						<RBox key={k} size={[2.0, 0.08, 1.4]} pos={[Math.sin(k + i) * 0.05, k * 0.09, 0]} color={k % 2 ? '#f4f0e6' : '#e8e2d4'} />
					))}
				</group>
			))}
		</group>
		{/* bench, bin, pigeon */}
		<group position={[9, 0, 2]}>
			<RBox size={[4, 0.3, 1.4]} pos={[0, 1.6, 0]} color="#6a4a30" />
			<RBox size={[4, 1.2, 0.2]} pos={[0, 2.4, -0.6]} color="#6a4a30" />
			<RBox size={[0.2, 1.6, 1.2]} pos={[-1.8, 0.8, 0]} color="#2a2a2e" />
			<RBox size={[0.2, 1.6, 1.2]} pos={[1.8, 0.8, 0]} color="#2a2a2e" />
		</group>
		<group position={[-8, 0, 3]} rotation={[0, Math.sin(frame * 0.3) * 0.3, 0]}>
			<RBox size={[0.6, 0.4, 0.3]} pos={[0, 0.3, 0]} color="#8a8e98" />
			<RBox size={[0.26, 0.26, 0.26]} pos={[0.32, 0.6, 0]} color="#5a6070" />
			<RBox size={[0.12, 0.06, 0.06]} pos={[0.5, 0.58, 0]} color="#e8a040" />
		</group>
		<Building w={10} d={6} h={16} pos={[-16, 0, -16]} color="#b8a088" lit={0} rows={5} cols={4} seed={40} trim="#8a7a68" />
		<Building w={10} d={6} h={20} pos={[16, 0, -16]} color="#a8988a" lit={0} rows={6} cols={4} seed={41} trim="#8a7a68" />
	</group>
);

// =====================================================================
// Parliament-style chamber: wood panels, green benches, podium, chandelier.
// =====================================================================
export const Chamber: React.FC = () => (
	<group>
		<Sky color="#2a1e18" />
		<Rig hemi={['#ffe8c8', '#3a2a1a', 0.7]} key_={{pos: [4, 20, 8], color: '#ffd8a0', i: 2.0, size: 16}} rim={{pos: [-8, 8, -12], color: '#7ac88a', i: 1.0}} fill={{pos: [0, 6, 20], i: 0.5}} />
		<Floor color="#4a3020" />
		<RBox size={[40, 18, 0.5]} pos={[0, 9, -12]} color="#6a4428" />
		{Array.from({length: 10}).map((_, i) => (
			<RBox key={i} size={[0.4, 18, 0.7]} pos={[-18 + i * 4, 9, -11.6]} color="#4a2e1a" />
		))}
		{/* tiered green benches on both sides */}
		{[-1, 1].map((side) =>
			[0, 1, 2].map((tier) => (
				<group key={`${side}-${tier}`} position={[side * (8 + tier * 2.6), tier * 1.1, -2]}>
					<RBox size={[2.4, 1.4 + tier * 1.1, 18]} pos={[0, (1.4 + tier * 1.1) / 2 - tier * 1.1, 0]} color="#5a3a22" />
					<RBox size={[2.2, 0.5, 17.6]} pos={[0, 1.5, 0]} color="#2a6a3a" />
					<RBox size={[0.4, 1.4, 17.6]} pos={[side * 1.0, 2.3, 0]} color="#2a6a3a" />
				</group>
			)),
		)}
		{/* table in the centre with despatch boxes */}
		<RBox size={[4, 2.6, 8]} pos={[0, 1.3, -3]} color="#5a3a22" />
		<RBox size={[1.4, 0.8, 1]} pos={[0, 3.0, 0]} color="#3a2416" />
		{/* podium */}
		<group position={[0, 0, 1.6]}>
			<RBox size={[2.6, 3.6, 1.6]} pos={[0, 1.8, 0]} color="#6a4428" />
			<RBox size={[3, 0.3, 2]} pos={[0, 3.7, 0]} rot={[-0.15, 0, 0]} color="#4a2e1a" />
			<RBox size={[0.08, 1, 0.08]} pos={[0.6, 4.3, 0.4]} rot={[0.4, 0, 0]} color="#2a2a2a" />
			<RBox size={[0.24, 0.3, 0.24]} pos={[0.6, 4.8, 0.6]} color="#3a3a3a" />
		</group>
		{/* chandelier */}
		<group position={[0, 14, -3]}>
			<RBox size={[0.1, 4, 0.1]} pos={[0, 2, 0]} color="#c8a048" />
			{Array.from({length: 8}).map((_, i) => (
				<group key={i} rotation={[0, (i / 8) * PI * 2, 0]}>
					<RBox size={[2, 0.1, 0.1]} pos={[1, 0, 0]} color="#c8a048" />
					<Glow size={[0.2, 0.4, 0.2]} pos={[2, 0.25, 0]} color="#ffe0a0" i={3} />
				</group>
			))}
			<pointLight color="#ffd890" intensity={30} distance={26} />
		</group>
		{/* ornate clock */}
		<group position={[0, 11, -11.6]}>
			<RBox size={[2.6, 2.6, 0.3]} color="#c8a048" />
			<RBox size={[2.1, 2.1, 0.1]} pos={[0, 0, 0.2]} color="#f4f0e4" />
			<RBox size={[0.08, 0.8, 0.05]} pos={[0, 0.35, 0.28]} color="#1a1a1a" />
			<RBox size={[0.6, 0.08, 0.05]} pos={[0.28, 0, 0.28]} color="#1a1a1a" />
		</group>
	</group>
);

// =====================================================================
// Game shop, 1997: shelves of our own game boxes, till, neon OPEN.
// =====================================================================
export const Shop97: React.FC<{frame: number; fly: number}> = ({frame, fly}) => (
	<group>
		<Sky color="#1a1e2a" />
		<Rig hemi={['#f0f4ff', '#4a4a50', 0.9]} key_={{pos: [0, 18, 10], color: '#f4f8ff', i: 1.8, size: 16}} rim={{pos: [10, 8, -12], color: '#ff6ab0', i: 1.2}} fill={{pos: [0, 6, 20], i: 0.5}} />
		<Floor color="#b8b0a4" />
		{Array.from({length: 10}).map((_, i) =>
			Array.from({length: 6}).map((_, j) => ((i + j) % 2 ? <RBox key={`${i}-${j}`} size={[2.9, 0.02, 2.9]} pos={[-14 + i * 3, 0.01, -8 + j * 3]} color="#3a3a40" /> : null)),
		)}
		<RBox size={[36, 14, 0.4]} pos={[0, 7, -9]} color="#3a4a7a" />
		{/* fluorescent tubes */}
		{[-6, 0, 6].map((x) => (
			<Glow key={x} size={[4, 0.15, 0.4]} pos={[x, 12.8, -2]} color="#f0f8ff" i={2.5} />
		))}
		{/* shelf units with boxes */}
		{[-7, 0, 7].map((x, u) => (
			<group key={x} position={[x, 0, -7.6]}>
				<RBox size={[6.4, 9, 1.4]} pos={[0, 4.5, -0.3]} color="#d8d4cc" />
				{[1.4, 3.4, 5.4, 7.4].map((y, r) => (
					<React.Fragment key={y}>
						<RBox size={[6.2, 0.15, 1.6]} pos={[0, y - 0.8, 0.2]} color="#a8a49c" />
						{Array.from({length: 5}).map((_, k) => {
							const id = u * 20 + r * 5 + k;
							const go = u === 1 && r === 1;
							const t = go ? Math.max(0, fly - k * 0.08) : 0;
							return (
								<GameBox
									key={k}
									pos={[-2.4 + k * 1.2 + t * (k - 2) * 2, y + t * 4 + Math.sin(t * PI) * 2, 0.5 + t * 7]}
									rot={[t * 4, t * (k - 2) * 2, t * 3]}
									s={0.95}
									tint={['#1a1a1e', '#2a1a3a', '#1a2a3a'][id % 3]}
								/>
							);
						})}
					</React.Fragment>
				))}
			</group>
		))}
		{/* price tag */}
		<group position={[0, 2.8, -6.4]}>
			<RBox size={[2.4, 0.9, 0.1]} color="#f2d23a" />
			<BlockText text="1997" size={0.5} depth={0.08} color="#1a1a1a" position={[0, 0, 0.08]} />
		</group>
		{/* till counter */}
		<group position={[9, 0, 2]}>
			<RBox size={[5, 3, 2.4]} pos={[0, 1.5, 0]} color="#c8402a" />
			<RBox size={[5.2, 0.3, 2.6]} pos={[0, 3.1, 0]} color="#2a2a30" />
			<RBox size={[1.6, 1.0, 1.2]} pos={[0, 3.8, 0]} color="#3a3a40" />
			<RBox size={[1.4, 0.3, 1.0]} pos={[0, 3.3, 0.7 + Math.min(1, fly * 2) * 0.7]} color="#2a2a30" />
			<Glow size={[0.9, 0.3, 0.05]} pos={[0, 4.1, 0.62]} color="#3aff8a" i={1.5} />
		</group>
		{/* neon OPEN */}
		<group position={[-11, 9.5, -8.6]}>
			<RBox size={[5.4, 1.8, 0.2]} color="#1a1a1e" />
			<BlockText text="OPEN" size={0.9} depth={0.1} color="#ff4fa8" emissive={2} position={[0, 0, 0.2]} />
			<pointLight position={[0, 0, 1]} color="#ff4fa8" intensity={6} distance={8} />
		</group>
		{/* the 'press' stack: sticker 'AS SEEN IN THE PAPERS' as a 3D badge */}
		<group position={[3.6, 9.6, -8.6]} rotation={[0, 0, Math.sin(frame * 0.2) * 0.05]}>
			<mesh rotation={[PI / 2, 0, 0]}>
				<cylinderGeometry args={[1.3, 1.3, 0.2, 12]} />
				<meshStandardMaterial color="#f2c21a" />
			</mesh>
			<BlockText text="HOT!" size={0.5} depth={0.06} color="#c41e1e" position={[0, 0, 0.14]} />
		</group>
	</group>
);

// =====================================================================
// New York loft, 1998: brick, arched windows, skyline, water tower.
// =====================================================================
export const Loft: React.FC<{frame: number; sign: number}> = ({frame, sign}) => {
	const flick = sign > 0 ? (sign < 1 ? (Math.floor(frame / 3) % 2 ? 1 : 0.2) : 1) : 0;
	return (
		<group>
			<Sky color="#f0a068" fog={[50, 120]} />
			<Rig hemi={['#ffd8b0', '#4a2a20', 0.7]} key_={{pos: [-18, 10, -6], color: '#ffb870', i: 2.6, size: 18}} rim={{pos: [12, 6, -14], color: '#ff7a3a', i: 1.0}} fill={{pos: [0, 6, 20], i: 0.5}} />
			<Floor color="#6a4a32" />
			{Array.from({length: 14}).map((_, i) => (
				<RBox key={i} size={[1.6, 0.02, 30]} pos={[-13 + i * 2, 0.01, 0]} color={i % 2 ? '#7a5638' : '#6a4a30'} />
			))}
			{/* brick back wall with arched windows */}
			<group position={[0, 0, -10]}>
				{Array.from({length: 26}).map((_, r) =>
					Array.from({length: 16}).map((_, c) => {
						const x = -15 + c * 2 + (r % 2) * 1;
						const y = 0.3 + r * 0.6;
						const inWin = [-7, 7].some((wx) => Math.abs(x - wx) < 3.2 && y > 3 && y < 12.5);
						return inWin ? null : <RBox key={`${r}-${c}`} size={[1.9, 0.52, 0.5]} pos={[x, y, 0]} color={['#9a4a32', '#8a3e2a', '#a85238'][(r * 7 + c) % 3]} />;
					}),
				)}
				{[-7, 7].map((wx) => (
					<group key={wx} position={[wx, 7.6, 0]}>
						<RBox size={[6.4, 0.3, 0.6]} pos={[0, -4.6, 0.1]} color="#2a2a2e" />
						<RBox size={[0.2, 9.4, 0.4]} pos={[0, 0, 0.1]} color="#2a2a2e" />
						<RBox size={[6.4, 0.2, 0.4]} pos={[0, 0, 0.1]} color="#2a2a2e" />
						<RBox size={[0.3, 9.4, 0.6]} pos={[-3.1, 0, 0.1]} color="#2a2a2e" />
						<RBox size={[0.3, 9.4, 0.6]} pos={[3.1, 0, 0.1]} color="#2a2a2e" />
					</group>
				))}
			</group>
			{/* skyline beyond the windows */}
			{Array.from({length: 12}).map((_, i) => (
				<Building key={i} w={4 + (i % 3)} d={4} h={14 + ((i * 7) % 18)} pos={[-24 + i * 4.4, 0, -24 - (i % 3) * 4]} color={['#5a4a5a', '#6a5060', '#4a3e52'][i % 3]} win="#ffd890" lit={0.3} rows={8} cols={3} seed={i + 60} />
			))}
			{/* water tower on a rooftop outside */}
			<group position={[10, 14, -20]}>
				<mesh position={[0, 2, 0]}>
					<cylinderGeometry args={[1.8, 1.8, 3.4, 10]} />
					<meshStandardMaterial color="#6a4a30" flatShading />
				</mesh>
				<mesh position={[0, 4.2, 0]}>
					<coneGeometry args={[2, 1.2, 10]} />
					<meshStandardMaterial color="#4a3a2a" flatShading />
				</mesh>
				{[-1, 1].map((x) => (
					<RBox key={x} size={[0.2, 2, 0.2]} pos={[x, -0.6, 0]} color="#2a2a2e" />
				))}
			</group>
			{/* neon star sign (our own shape) + block word */}
			<group position={[0, 10.6, -9.4]}>
				{Array.from({length: 5}).map((_, i) => (
					<Glow key={i} size={[0.4, 2.2, 0.2]} pos={[Math.sin((i / 5) * PI * 2) * 0.9, Math.cos((i / 5) * PI * 2) * 0.9, 0]} rot={[0, 0, -(i / 5) * PI * 2]} color="#ffd23a" i={3 * flick + 0.1} />
				))}
				<BlockText text="ROCKSTAR GAMES" size={0.6} depth={0.12} color="#f4f4ee" emissive={1.2 * flick} position={[0, -2.2, 0]} />
				{flick > 0.5 ? <pointLight position={[0, 0, 2]} color="#ffd23a" intensity={10} distance={10} /> : null}
			</group>
			{/* furniture: sofa, crate table with pizza, record decks, boombox */}
			<group position={[-6, 0, -3]}>
				<RBox size={[6, 1.6, 2.4]} pos={[0, 0.8, 0]} color="#3a5a6a" />
				<RBox size={[6, 2.0, 0.6]} pos={[0, 2.2, -1]} color="#3a5a6a" />
				<RBox size={[0.6, 2.0, 2.4]} pos={[-3, 1.4, 0]} color="#2e4a58" />
				<RBox size={[0.6, 2.0, 2.4]} pos={[3, 1.4, 0]} color="#2e4a58" />
			</group>
			<group position={[-6, 0, 1.4]}>
				<RBox size={[3, 1.6, 1.8]} pos={[0, 0.8, 0]} color="#b8945a" />
				<PizzaBoxStack pos={[0, 1.6, 0]} n={2} />
			</group>
			<group position={[7, 0, -4]}>
				<RBox size={[5, 2.6, 2]} pos={[0, 1.3, 0]} color="#2a2a2e" />
				{[-1.2, 1.2].map((x) => (
					<group key={x} position={[x, 2.7, 0]}>
						<mesh rotation={[0, frame * 0.3, 0]}>
							<cylinderGeometry args={[0.8, 0.8, 0.08, 16]} />
							<meshStandardMaterial color="#1a1a1a" />
						</mesh>
						<mesh position={[0, 0.06, 0]}>
							<cylinderGeometry args={[0.25, 0.25, 0.04, 10]} />
							<meshStandardMaterial color="#e8402a" />
						</mesh>
					</group>
				))}
			</group>
			<group position={[10.6, 0, -1]}>
				<RBox size={[2.4, 1.4, 0.8]} pos={[0, 0.7, 0]} color="#3a3a40" />
				{[-0.65, 0.65].map((x) => (
					<mesh key={x} position={[x, 0.7, 0.42]} rotation={[PI / 2, 0, 0]}>
						<cylinderGeometry args={[0.45, 0.45, 0.06, 12]} />
						<meshStandardMaterial color="#1a1a1e" />
					</mesh>
				))}
			</group>
		</group>
	);
};

// =====================================================================
// Full 3D night city (2001): street-level, lit windows, steam, el-train.
// =====================================================================
export const City3D: React.FC<{frame: number; traffic?: number}> = ({frame, traffic = 1}) => (
	<group>
		<Sky color="#0a1020" fog={[30, 110]} />
		<Rig hemi={['#4a5a88', '#1a1410', 0.5]} key_={{pos: [-14, 20, 6], color: '#ffb870', i: 1.0, size: 22}} rim={{pos: [10, 8, -20], color: '#4ad0ff', i: 1.2}} fill={{pos: [0, 6, 20], i: 0.35}} />
		<Floor color="#2a2c32" size={[200, 200]} />
		<RBox size={[14, 0.06, 200]} pos={[0, 0.03, 0]} color="#1e2026" rough={0.3} />
		{Array.from({length: 20}).map((_, i) => (
			<RBox key={i} size={[0.2, 0.07, 2]} pos={[0, 0.05, 40 - i * 6]} color="#f2c21a" />
		))}
		{[-1, 1].map((s) => (
			<RBox key={s} size={[5, 0.3, 200]} pos={[s * 9.5, 0.15, 0]} color="#5a5e66" />
		))}
		{/* buildings both sides */}
		{Array.from({length: 9}).map((_, i) =>
			[-1, 1].map((s) => (
				<Building key={`${i}-${s}`} w={9} d={9} h={14 + ((i * 13 + (s + 1) * 7) % 22)} pos={[s * 17, 0, 20 - i * 11]} color={['#4a4e5a', '#5a4a48', '#3e4a52', '#5a5048'][(i + (s > 0 ? 1 : 0)) % 4]} win="#ffd27a" lit={0.5} rows={10} cols={4} seed={i * 2 + (s > 0 ? 1 : 0) + 80} trim="#2a2c32" rotY={0} />
			)),
		)}
		{/* elevated train bridge */}
		<group position={[0, 9, -30]}>
			<RBox size={[60, 1.2, 3]} color="#3a3e48" />
			{[-24, -12, 0, 12, 24].map((x) => (
				<RBox key={x} size={[0.8, 9, 0.8]} pos={[x, -4.5, 0]} color="#3a3e48" />
			))}
			<group position={[((frame * 0.6) % 90) - 45, 1.4, 0]}>
				{[0, 1, 2].map((k) => (
					<group key={k} position={[k * 7.2, 0, 0]}>
						<RBox size={[7, 2.2, 2.4]} pos={[0, 0.8, 0]} color="#8a8e98" />
						{Array.from({length: 5}).map((_, w) => (
							<Glow key={w} size={[0.9, 0.7, 0.05]} pos={[-2.6 + w * 1.3, 1.1, 1.22]} color="#ffe8a0" i={1.6} />
						))}
					</group>
				))}
			</group>
		</group>
		{/* steam vents */}
		{[
			[-3, 6],
			[3, -10],
		].map(([x, z], i) =>
			[0, 1, 2, 3].map((k) => {
				const t = ((frame * 0.03 + k * 0.25 + i * 0.3) % 1) as number;
				return (
					<mesh key={`${i}-${k}`} position={[x + Math.sin(t * 6 + k) * 0.3, t * 5, z]} scale={0.6 + t * 1.6}>
						<boxGeometry args={[1, 1, 1]} />
						<meshStandardMaterial color="#c8ccd8" transparent opacity={0.35 * (1 - t)} />
					</mesh>
				);
			}),
		)}
		{/* street lamps */}
		{[12, -4, -20, -36].map((z) => (
			<React.Fragment key={z}>
				<StreetLamp pos={[-7.6, 0.3, z]} h={8} color="#ffb460" light={10} />
				<StreetLamp pos={[7.6, 0.3, z - 8]} h={8} color="#ffb460" rotY={PI} light={10} />
			</React.Fragment>
		))}
		{/* hydrant, mailbox */}
		<group position={[-8.4, 0.3, 2]}>
			<RBox size={[0.6, 1.0, 0.6]} pos={[0, 0.5, 0]} color="#c82a2a" />
			<RBox size={[0.8, 0.2, 0.3]} pos={[0, 0.7, 0]} color="#c82a2a" />
		</group>
		<group position={[8.4, 0.3, 6]}>
			<RBox size={[1.0, 1.8, 1.0]} pos={[0, 1.1, 0]} color="#2a4a9a" />
			<RBox size={[1.0, 0.4, 1.0]} pos={[0, 2.2, 0]} color="#1e3a7a" />
		</group>
		{/* traffic */}
		<Car kind="taxi" pos={[-3.2, 0, -10 + ((frame * 0.35 * traffic) % 40)]} rotY={-PI / 2} scale={1.3} spin={frame * 0.5} />
		<Car kind="sedan" pos={[3.2, 0, 20 - ((frame * 0.4 * traffic) % 50)]} rotY={PI / 2} scale={1.3} spin={frame * 0.5} />
		<Car kind="cop" pos={[3.2, 0, -24]} rotY={PI / 2} scale={1.3} siren={Math.floor(frame / 4) % 2} lights />
	</group>
);

// =====================================================================
// Neon 80s coast at sunset.
// =====================================================================
export const ViceCoast: React.FC<{frame: number}> = ({frame}) => (
	<group>
		<Sky color="#ff8aa8" fog={[50, 140]} />
		<hemisphereLight args={['#ffb0d0', '#5a2a6a', 0.9]} />
		<directionalLight position={[0, 6, -40]} color="#ff9a5a" intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-camera-far={90} />
		<directionalLight position={[-10, 10, 20]} color="#c8a0ff" intensity={0.9} />
		{/* sun disc with bands */}
		<group position={[0, 12, -90]}>
			<mesh>
				<circleGeometry args={[16, 32]} />
				<meshBasicMaterial color="#ffd06a" toneMapped={false} />
			</mesh>
			{[0, 1, 2, 3].map((i) => (
				<RBox key={i} size={[34, 0.8 + i * 0.4, 0.1]} pos={[0, -4 - i * 3, 0.2]} color="#ff8aa8" />
			))}
		</group>
		{/* ocean */}
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.2, -50]}>
			<planeGeometry args={[300, 80]} />
			<meshStandardMaterial color="#6a3a9a" metalness={0.4} roughness={0.15} />
		</mesh>
		{Array.from({length: 8}).map((_, i) => (
			<RBox key={i} size={[30, 0.05, 0.3]} pos={[((frame * 0.05 + i * 9) % 60) - 30, -0.15, -18 - i * 5]} color="#ffb0d0" />
		))}
		{/* sand + promenade */}
		<RBox size={[200, 0.3, 14]} pos={[0, -0.1, -6]} color="#f2d0a8" />
		<RBox size={[200, 0.4, 12]} pos={[0, 0, 7]} color="#c8c0d8" />
		<RBox size={[200, 0.06, 10]} pos={[0, 0.2, 16]} color="#2a2a3a" />
		{/* palms */}
		{[-18, -9, 9, 18, 27, -27].map((x, i) => (
			<Palm key={x} pos={[x, 0, 1 + (i % 2) * 2]} h={8 + (i % 3)} lean={0.1 - (i % 2) * 0.2} />
		))}
		{/* art-deco hotel with neon trim */}
		<group position={[-26, 0, 20]} rotation={[0, PI * 0.8, 0]}>
			<RBox size={[14, 12, 8]} pos={[0, 6, 0]} color="#f4e4f0" />
			<RBox size={[4, 15, 8.4]} pos={[0, 7.5, 0]} color="#a8e4e0" />
			{[3, 6, 9].map((y) => (
				<Glow key={y} size={[14.2, 0.2, 0.2]} pos={[0, y, -4.15]} color="#2ae6ff" i={2.5} />
			))}
			<Glow size={[0.2, 15, 0.2]} pos={[2.1, 7.5, -4.3]} color="#ff4fd8" i={3} />
			<Glow size={[0.2, 15, 0.2]} pos={[-2.1, 7.5, -4.3]} color="#ff4fd8" i={3} />
		</group>
		<pointLight position={[-22, 6, 14]} color="#ff4fd8" intensity={20} distance={20} />
		{/* pastel convertible on the drive */}
		<Car kind="convertible" pos={[-30 + ((frame * 0.5) % 70), 0.2, 15]} rotY={0} scale={1.4} spin={frame * 0.6} />
		<Car kind="sedan" color="#2ae6e0" pos={[8, 0.2, 18]} rotY={PI} scale={1.4} lights={false} />
	</group>
);

// =====================================================================
// West Coast street: dusty sun, houses, garage hoop, lowrider, hills.
// =====================================================================
export const WestCoast: React.FC<{frame: number; hop: number}> = ({frame, hop}) => (
	<group>
		<Sky color="#f6c070" fog={[60, 160]} />
		<Rig hemi={['#fff0c8', '#8a5a2a', 0.9]} key_={{pos: [16, 22, 10], color: '#ffe0a0', i: 2.6, size: 24}} rim={{pos: [-12, 6, -16], color: '#ff9a4a', i: 1.0}} fill={{pos: [0, 6, 20], i: 0.4}} />
		<Floor color="#c8a070" size={[220, 220]} />
		<RBox size={[200, 0.06, 12]} pos={[0, 0.03, 4]} color="#4a4440" rough={0.4} />
		<RBox size={[200, 0.3, 3]} pos={[0, 0.15, -3.5]} color="#b8b0a4" />
		{/* hills */}
		{[-50, -20, 15, 45].map((x, i) => (
			<mesh key={x} position={[x, 0, -70]} rotation={[0, i, 0]}>
				<coneGeometry args={[22 + i * 3, 18 + (i % 2) * 6, 5]} />
				<meshStandardMaterial color={['#b88a5a', '#a87a4a', '#c89a68', '#9a7048'][i]} flatShading />
			</mesh>
		))}
		{/* little houses */}
		{[-22, -8, 6, 20].map((x, i) => (
			<group key={x} position={[x, 0, -12]}>
				<RBox size={[11, 5, 7]} pos={[0, 2.5, 0]} color={['#e8d0a8', '#a8d0c8', '#f0b8a0', '#d8d8b0'][i]} />
				<RBox size={[12, 0.6, 8]} pos={[0, 5.2, 0]} color="#8a4a30" />
				<RBox size={[2, 3.4, 0.2]} pos={[-3, 1.7, 3.55]} color="#5a3a2a" />
				<RBox size={[2.4, 1.8, 0.2]} pos={[2, 2.8, 3.55]} color="#8ab8d0" />
				<RBox size={[11, 1.2, 0.2]} pos={[0, 0.6, 6]} color="#f4f4ee" />
			</group>
		))}
		{/* garage with a basketball hoop */}
		<group position={[13, 0, -6]}>
			<RBox size={[0.3, 4, 0.3]} pos={[0, 6, 0]} color="#3a3a40" />
			<RBox size={[2.4, 1.6, 0.15]} pos={[0, 8.4, 0.2]} color="#f4f4ee" />
			<mesh position={[0, 7.6, 0.9]} rotation={[PI / 2, 0, 0]}>
				<torusGeometry args={[0.55, 0.05, 6, 16]} />
				<meshStandardMaterial color="#e85a1a" />
			</mesh>
		</group>
		{/* palms in silhouette behind */}
		{[-30, -14, 2, 26].map((x, i) => (
			<Palm key={x} pos={[x, 0, -22]} h={13 + i} lean={0.05} />
		))}
		{/* power lines */}
		{[-26, 0, 26].map((x) => (
			<RBox key={x} size={[0.3, 12, 0.3]} pos={[x, 6, -4]} color="#5a3a22" />
		))}
		<RBox size={[60, 0.05, 0.05]} pos={[0, 11.2, -4]} color="#1a1a1a" />
		<RBox size={[60, 0.05, 0.05]} pos={[0, 10.6, -4]} color="#1a1a1a" />
		{/* lowrider bouncing + BMX */}
		<Car kind="lowrider" pos={[-2, 0.1, 4]} rotY={0.35} scale={1.5} hop={hop} pitch={hop * 0.12} spin={0} />
		<group position={[9, 0.1, 6]} rotation={[0, -0.6 + Math.sin(frame * 0.1) * 0.1, 0]}>
			{[-0.8, 0.8].map((x) => (
				<mesh key={x} position={[x, 0.6, 0]}>
					<torusGeometry args={[0.55, 0.07, 6, 14]} />
					<meshStandardMaterial color="#1a1a1a" />
				</mesh>
			))}
			<RBox size={[1.8, 0.12, 0.12]} pos={[0, 0.9, 0]} rot={[0, 0, 0.2]} color="#2ac8e8" />
			<RBox size={[0.1, 0.9, 0.1]} pos={[0.7, 1.2, 0]} color="#2ac8e8" />
			<RBox size={[0.12, 0.1, 0.9]} pos={[0.7, 1.65, 0]} color="#1a1a1a" />
		</group>
		{/* heat-haze dust motes */}
		{Array.from({length: 16}).map((_, i) => (
			<Glow key={i} size={[0.08, 0.08, 0.08]} pos={[-12 + ((i * 3.3 + frame * 0.05) % 24), 0.5 + (i % 4) * 0.8, 2 + (i % 3)]} color="#fff0c0" i={0.8} />
		))}
	</group>
);

// =====================================================================
// Launch night 2013: store front, queue rope, roof flip counter.
// =====================================================================
export const LaunchNight: React.FC<{frame: number; shutter: number; counter: string; flip?: number; children?: React.ReactNode}> = ({frame, shutter, counter, children}) => (
	<group>
		<Sky color="#120a24" fog={[40, 110]} />
		<Rig hemi={['#7a6ab0', '#1a1020', 0.55]} key_={{pos: [-10, 18, 14], color: '#d8d0ff', i: 1.0, size: 20}} rim={{pos: [12, 8, -16], color: '#c84aff', i: 1.4}} fill={{pos: [0, 6, 22], i: 0.45}} />
		<Floor color="#3a3a42" size={[160, 160]} />
		<RBox size={[60, 0.3, 6]} pos={[0, 0.15, 3]} color="#5a5a62" />
		{/* store front */}
		<group position={[0, 0, -4]}>
			<RBox size={[22, 12, 2]} pos={[0, 6, -1]} color="#2a2a34" />
			<Glow size={[14, 6.4, 0.1]} pos={[0, 3.4, 0.05]} color="#e8f0ff" i={1.4} />
			{/* boxes in the window */}
			{Array.from({length: 7}).map((_, i) => (
				<GameBox key={i} pos={[-5.4 + i * 1.8, 2.4 + (i % 2) * 0.4, 0.4]} rot={[0, (i - 3) * 0.1, 0]} s={1.2} tint={i % 2 ? '#1a3a2a' : '#1a1a1e'} label="V" />
			))}
			{/* roll shutter */}
			<RBox size={[14.2, Math.max(0.2, 6.6 * (1 - shutter)), 0.2]} pos={[0, 6.6 - (6.6 * (1 - shutter)) / 2 + 0.1, 0.25]} color="#8a8e96" />
			{Array.from({length: Math.max(1, Math.floor(11 * (1 - shutter)))}).map((_, i) => (
				<RBox key={i} size={[14.2, 0.06, 0.22]} pos={[0, 6.6 - i * 0.6, 0.3]} color="#6a6e76" />
			))}
			{/* sign */}
			<RBox size={[16, 2.4, 0.6]} pos={[0, 9, 0.4]} color="#1a1a22" />
			<BlockText text="PIXEL PIT" size={1.2} depth={0.2} color="#2ae6e0" emissive={1.5} position={[0, 9, 0.8]} />
			<pointLight position={[0, 9, 3]} color="#2ae6e0" intensity={12} distance={14} />
			{/* rooftop flip counter */}
			<group position={[0, 13.4, 0]}>
				<RBox size={[17, 2.4, 1]} color="#0e0e14" />
				<FlipCounterLazy value={counter} />
			</group>
			<Glow size={[16, 0.2, 0.2]} pos={[0, 12.1, 0.5]} color="#c84aff" i={2.5} />
		</group>
		{/* rope posts */}
		{[-9, -5, -1, 3, 7].map((x) => (
			<group key={x} position={[x, 0.3, 4.4]}>
				<RBox size={[0.3, 2.4, 0.3]} pos={[0, 1.2, 0]} color="#d8b048" rough={0.3} />
				<RBox size={[0.6, 0.2, 0.6]} pos={[0, 0.1, 0]} color="#d8b048" rough={0.3} />
			</group>
		))}
		{[-7, -3, 1, 5].map((x) => (
			<RBox key={x} size={[4, 0.16, 0.16]} pos={[x, 2.1, 4.4]} color="#a81e2a" />
		))}
		<StreetLamp pos={[-14, 0.3, 6]} h={9} color="#d8c8ff" light={8} />
		<StreetLamp pos={[14, 0.3, 6]} h={9} color="#d8c8ff" rotY={PI} light={8} />
		{children}
		{/* phone flash dots in the queue */}
		{Array.from({length: 6}).map((_, i) => ((frame + i * 7) % 23 < 2 ? <pointLight key={i} position={[-10 + i * 4, 4, 6]} color="#ffffff" intensity={14} distance={8} /> : null))}
	</group>
);

const FlipCounterLazy: React.FC<{value: string}> = ({value}) => <FlipCounter value={value} pos={[0, 0, 0.6]} size={1.6} />;

// =====================================================================
// Asphalt void with a single streetlamp, for the name reveal.
// =====================================================================
export const Void: React.FC<{lamp?: number}> = ({lamp = 1}) => (
	<group>
		<Sky color="#06070a" fog={[20, 50]} />
		<hemisphereLight args={['#3a4a68', '#0a0808', 0.25]} />
		<directionalLight position={[6, 4, -8]} color="#6fb6ff" intensity={1.6} />
		<directionalLight position={[0, 1, 14]} color="#ffffff" intensity={0.3} />
		<Floor color="#141518" size={[120, 120]} />
		{[-14, -8, -2, 4, 10].map((z) => (
			<RBox key={z} size={[0.4, 0.04, 3]} pos={[0, 0.02, z]} color="#d8d4c8" />
		))}
		<StreetLamp pos={[-7, 0, -4]} h={11} color="#ffb460" light={22 * lamp} on={lamp > 0.1} />
	</group>
);

// =====================================================================
// Dawn coast for the sixth game: lagoon, flamingos, neon skyline.
// =====================================================================
export const Dawn: React.FC<{frame: number; rise: number}> = ({frame, rise}) => (
	<group>
		<Sky color="#ffb08a" fog={[60, 170]} />
		<hemisphereLight args={['#ffd0c0', '#3a2a6a', 0.9]} />
		<directionalLight position={[-20, 8, -30]} color="#ffb07a" intensity={2.4} />
		<directionalLight position={[16, 10, 18]} color="#7ae0ff" intensity={1.0} />
		<directionalLight position={[0, 4, 30]} color="#ffffff" intensity={0.4} />
		<mesh position={[-30, 8, -120]}>
			<circleGeometry args={[12, 32]} />
			<meshBasicMaterial color="#fff0b0" toneMapped={false} />
		</mesh>
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0, -40]}>
			<planeGeometry args={[300, 160]} />
			<meshStandardMaterial color="#c86a9a" metalness={0.5} roughness={0.12} />
		</mesh>
		{Array.from({length: 10}).map((_, i) => (
			<RBox key={i} size={[24, 0.04, 0.25]} pos={[((frame * 0.04 + i * 11) % 80) - 40, 0.03, -10 - i * 6]} color="#ffd0e0" />
		))}
		{/* neon skyline on the far shore */}
		{Array.from({length: 16}).map((_, i) => (
			<group key={i}>
				<Building w={4 + (i % 3)} d={4} h={10 + ((i * 11) % 26)} pos={[-60 + i * 8, 0, -80 - (i % 2) * 6]} color={['#5a3a7a', '#6a4a8a', '#4a3a6a'][i % 3]} win="#ffe0f0" lit={0.35} rows={8} cols={2} seed={i + 120} />
				{i % 3 === 0 ? <Glow size={[4.5, 0.3, 0.3]} pos={[-60 + i * 8, 10 + ((i * 11) % 26), -77.8 - (i % 2) * 6]} color={i % 2 ? '#2ae6ff' : '#ff4fd8'} i={3} /> : null}
			</group>
		))}
		{/* mangrove islets and palms */}
		{[-26, -10, 14, 30].map((x, i) => (
			<group key={x} position={[x, 0, -30 - i * 4]}>
				<RBox size={[8, 0.6, 5]} pos={[0, 0.2, 0]} color="#3a6a4a" />
				<Palm pos={[0, 0.3, 0]} h={7 + i} lean={0.15 - i * 0.08} />
			</group>
		))}
		{/* flamingos lifting off */}
		{Array.from({length: 7}).map((_, i) => {
			const t = Math.max(0, (frame - 10 - i * 3) / 40);
			const flap = Math.sin(frame * 0.6 + i) * 0.6;
			return (
				<group key={i} position={[-10 + i * 3.2 + t * 8, 0.6 + t * 9 + (i % 2), -14 - (i % 3) * 3]} rotation={[0, 0.4, 0]}>
					<RBox size={[1.0, 0.5, 0.4]} color="#ff8ab0" />
					<RBox size={[0.12, 1.0, 0.12]} pos={[0.5, 0.5, 0]} rot={[0, 0, -0.3]} color="#ff8ab0" />
					<RBox size={[0.3, 0.22, 0.22]} pos={[0.7, 1.0, 0]} color="#ff8ab0" />
					<RBox size={[0.2, 0.08, 0.1]} pos={[0.9, 0.95, 0]} color="#1a1a1a" />
					<RBox size={[0.08, 1.2, 0.08]} pos={[-0.1, -0.8, 0]} color="#f07090" />
					<RBox size={[0.9, 0.06, 0.6]} pos={[0, 0.25, 0.4]} rot={[flap, 0, 0]} color="#ff6a98" />
					<RBox size={[0.9, 0.06, 0.6]} pos={[0, 0.25, -0.4]} rot={[-flap, 0, 0]} color="#ff6a98" />
				</group>
			);
		})}
		{/* chrome VI rising from the water */}
		<group position={[4, -9 + rise * 13.5, -36]}>
			<BlockText text="VI" size={9} depth={2.6} color="#f2f4fa" side="#8a6ab0" />
			{rise > 0.05 && rise < 0.95
				? Array.from({length: 12}).map((_, i) => (
						<mesh key={i} position={[-5 + i * 0.9, -4.6 - ((frame * 0.25 + i * 0.37) % 1) * 4, 1.4]} scale={0.25}>
							<boxGeometry args={[1, 1, 1]} />
							<meshStandardMaterial color="#e8f4ff" transparent opacity={0.7} />
						</mesh>
				  ))
				: null}
		</group>
		<pointLight position={[4, 6, -28]} color="#ff9ad0" intensity={30 * rise} distance={30} />
	</group>
);

export {Studio as DMAStudio};
