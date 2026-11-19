import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RBox, shade} from '../parts';
import {Canvas2D, Hoop, PI, font} from './common';

const Shadowed: React.FC<{pos: number[]; color: string; intensity: number; size?: number; far?: number}> = ({pos, color, intensity, size = 18, far = 80}) => (
	<directionalLight
		position={pos as [number, number, number]}
		intensity={intensity}
		color={color}
		castShadow
		shadow-mapSize={[2048, 2048]}
		shadow-bias={-0.0004}
		shadow-normalBias={0.03}
		shadow-camera-left={-size}
		shadow-camera-right={size}
		shadow-camera-top={size}
		shadow-camera-bottom={-size}
		shadow-camera-near={1}
		shadow-camera-far={far}
	/>
);

// ---------------- Street: dusk (hook/moving) or morning (routine) ----------------
export const Street: React.FC<{time?: 'dusk' | 'morning'}> = ({time = 'dusk'}) => {
	const dusk = time === 'dusk';
	const bricks = ['#9a5a44', '#b07a5a', '#8a6a58', '#a3664a', '#7f5a4a'];
	return (
		<group>
			<color attach="background" args={[dusk ? '#e98f66' : '#a9d8f0']} />
			<fog attach="fog" args={[dusk ? '#d98a70' : '#cfe6f2', 30, 90]} />
			<hemisphereLight args={[dusk ? '#ffb38a' : '#e8f4ff', dusk ? '#3a3048' : '#6a6a5a', dusk ? 0.55 : 0.9]} />
			{/* Low sun: long dusk shadows, or a bright clean morning */}
			<Shadowed pos={dusk ? [-24, 7, 12] : [14, 22, 16]} color={dusk ? '#ffb070' : '#fff6e0'} intensity={dusk ? 2.4 : 2.6} size={22} />
			{/* Cool rim from behind */}
			<directionalLight position={[6, 9, -18]} intensity={dusk ? 1.0 : 0.5} color={dusk ? '#9a8cff' : '#cfe0ff'} />
			{/* Soft front fill so faces read against the sky */}
			<directionalLight position={[2, 6, 20]} intensity={dusk ? 1.1 : 0.8} color={dusk ? '#ffd2b0' : '#fff6ea'} />
			{/* Ground: road, curb, sidewalk */}
			<mesh rotation={[-PI / 2, 0, 0]} receiveShadow position={[0, 0, 6]}>
				<planeGeometry args={[200, 20]} />
				<meshStandardMaterial color="#45464e" roughness={0.95} />
			</mesh>
			<RBox size={[200, 0.25, 7]} pos={[0, 0.12, -1.5]} color="#a39d92" rough={0.95} />
			{Array.from({length: 40}, (_, i) => (
				<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[-60 + i * 3, 0.26, -1.5]}>
					<planeGeometry args={[0.05, 7]} />
					<meshStandardMaterial color="#8a857b" />
				</mesh>
			))}
			{/* Apartment blocks */}
			{Array.from({length: 9}, (_, i) => {
				const x = -40 + i * 10;
				const h = 12 + ((i * 7) % 5) * 2;
				const c = bricks[i % bricks.length];
				return (
					<group key={i} position={[x, 0, -9]}>
						<RBox size={[9.6, h, 6]} pos={[0, h / 2, 0]} color={c} rough={0.95} />
						<RBox size={[9.8, 0.5, 6.2]} pos={[0, h, 0]} color={shade(c, -0.12)} />
						{Array.from({length: Math.floor((h - 3) / 3)}, (_, r) =>
							[-3, 0, 3].map((wx, j) => {
								const lit = dusk && (i * 3 + r * 5 + j) % 4 === 0;
								return (
									<group key={`${r}${j}`} position={[wx, 3.6 + r * 3, 3.02]}>
										<RBox size={[1.8, 1.9, 0.1]} color={shade(c, -0.15)} />
										<mesh position={[0, 0, 0.06]}>
											<planeGeometry args={[1.5, 1.6]} />
											<meshStandardMaterial color={lit ? '#ffd28a' : dusk ? '#4a4a66' : '#8ab6d0'} emissive={lit ? '#ffb85a' : '#000000'} emissiveIntensity={lit ? 1.2 : 0} roughness={0.2} />
										</mesh>
									</group>
								);
							}),
						)}
						{/* Stoop and door */}
						<RBox size={[2.4, 0.5, 1.2]} pos={[0, 0.25, 3.6]} color="#8d877d" />
						<RBox size={[2.4, 0.5, 0.8]} pos={[0, 0.75, 3.4]} color="#97918a" />
						<RBox size={[1.8, 3.2, 0.12]} pos={[0, 2.6, 3.04]} color={shade(c, -0.3)} />
					</group>
				);
			})}
			{/* Streetlamps */}
			{[-15, 5, 25].map((x) => (
				<group key={x} position={[x, 0, 1.4]}>
					<mesh position={[0, 4.5, 0]} castShadow>
						<cylinderGeometry args={[0.12, 0.16, 9, 8]} />
						<meshStandardMaterial color="#2a2c30" metalness={0.5} roughness={0.5} />
					</mesh>
					<RBox size={[1.4, 0.3, 0.6]} pos={[0.5, 9, 0]} color="#2a2c30" />
					<mesh position={[0.9, 8.8, 0]}>
						<boxGeometry args={[0.6, 0.12, 0.4]} />
						<meshStandardMaterial color="#fff2c0" emissive="#ffd27a" emissiveIntensity={dusk ? 3 : 0.3} />
					</mesh>
					{dusk ? <pointLight position={[0.9, 8.4, 0]} intensity={45} color="#ffcf80" distance={16} decay={2} /> : null}
				</group>
			))}
		</group>
	);
};

// ---------------- Classroom with the calendar of missed days ----------------
export const Calendar: React.FC<{crossed: number}> = ({crossed}) => (
	<Canvas2D
		w={3.4}
		h={3.0}
		k={`cal${crossed}`}
		draw={(g, w, h) => {
			g.fillStyle = '#fbf8f1';
			g.fillRect(0, 0, w, h);
			g.fillStyle = '#c0392b';
			g.fillRect(0, 0, w, h * 0.18);
			g.fillStyle = '#ffffff';
			g.font = font(h * 0.11);
			g.textAlign = 'center';
			g.textBaseline = 'middle';
			g.fillText('SCHOOL DAYS', w / 2, h * 0.09);
			const cols = 7;
			const rows = 5;
			const cw = w / cols;
			const ch = (h * 0.82) / rows;
			g.strokeStyle = '#cfc8b8';
			g.lineWidth = 3;
			for (let i = 0; i < cols * rows; i++) {
				const x = (i % cols) * cw;
				const y = h * 0.18 + Math.floor(i / cols) * ch;
				g.strokeRect(x, y, cw, ch);
				g.fillStyle = '#8a8478';
				g.font = font(ch * 0.22, 700);
				g.fillText(String(i + 1), x + cw * 0.22, y + ch * 0.2);
				if (i < crossed) {
					g.strokeStyle = '#d0281e';
					g.lineWidth = 9;
					g.beginPath();
					g.moveTo(x + cw * 0.2, y + ch * 0.25);
					g.lineTo(x + cw * 0.8, y + ch * 0.85);
					g.moveTo(x + cw * 0.8, y + ch * 0.25);
					g.lineTo(x + cw * 0.2, y + ch * 0.85);
					g.stroke();
					g.strokeStyle = '#cfc8b8';
					g.lineWidth = 3;
				}
			}
		}}
	/>
);

export const Desk: React.FC = () => (
	<group>
		<RBox size={[2.6, 0.16, 1.6]} pos={[0, 2.0, 0]} color="#c49a6a" />
		{[-1.1, 1.1].map((x) =>
			[-0.6, 0.6].map((z) => <RBox key={`${x}${z}`} size={[0.12, 2, 0.12]} pos={[x, 1, z]} color="#5a5f68" />),
		)}
		<RBox size={[1.6, 0.12, 1.4]} pos={[0, 1.2, 1.5]} color="#4a7ab0" />
		<RBox size={[1.6, 1.4, 0.12]} pos={[0, 2.0, 2.15]} color="#4a7ab0" />
		{[-0.65, 0.65].map((x) =>
			[0.9, 2.1].map((z) => <RBox key={`${x}${z}`} size={[0.1, 1.2, 0.1]} pos={[x, 0.6, z]} color="#5a5f68" />),
		)}
	</group>
);

export const Classroom: React.FC<{crossed: number}> = ({crossed}) => (
	<group>
		<color attach="background" args={['#cfe4f0']} />
		<hemisphereLight args={['#fff4e2', '#6a5a48', 0.7]} />
		<Shadowed pos={[-16, 12, 8]} color="#eef6ff" intensity={2.4} size={14} />
		<pointLight position={[2, 9, 2]} intensity={30} color="#ffe8c4" distance={20} decay={2} />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[40, 40]} />
			<meshStandardMaterial color="#b98a5a" roughness={0.8} />
		</mesh>
		<RBox size={[30, 12, 0.4]} pos={[0, 6, -3]} color="#e6dcc0" />
		<RBox size={[0.4, 12, 30]} pos={[-7, 6, 6]} color="#ddd2b4" />
		{/* Chalkboard */}
		<group position={[-2.2, 5.6, -2.78]}>
			<RBox size={[6.6, 3.4, 0.12]} color="#5a3e28" />
			<group position={[0, 0, 0.08]}>
				<Canvas2D
					w={6.2}
					h={3.0}
					k="board"
					draw={(g, w, h) => {
						g.fillStyle = '#2f4a3a';
						g.fillRect(0, 0, w, h);
						g.fillStyle = 'rgba(240,240,230,0.85)';
						g.font = font(h * 0.16, 700);
						g.fillText('ATTENDANCE', w * 0.06, h * 0.25);
						g.font = font(h * 0.1, 500);
						['Monday ✓', 'Tuesday ✓', 'Wednesday ✓'].forEach((t, i) => g.fillText(t, w * 0.08, h * (0.45 + i * 0.16)));
					}}
				/>
			</group>
		</group>
		{/* Calendar of missed days */}
		<group position={[3.2, 5.2, -2.76]}>
			<Calendar crossed={crossed} />
		</group>
		{/* Windows on the left wall */}
		{[0, 5, 10].map((z) => (
			<group key={z} position={[-6.78, 6, z]}>
				<mesh rotation={[0, PI / 2, 0]}>
					<planeGeometry args={[3.4, 4]} />
					<meshStandardMaterial color="#dff0fa" emissive="#cfe8ff" emissiveIntensity={0.8} />
				</mesh>
			</group>
		))}
		{/* Desks: the one at the front stays empty */}
		{[
			[0, 0],
			[-3.6, 0],
			[3.6, 0],
			[0, 4],
			[-3.6, 4],
			[3.6, 4],
		].map(([x, z]) => (
			<group key={`${x}${z}`} position={[x, 0, z]}>
				<Desk />
			</group>
		))}
	</group>
);

// ---------------- Small apartment room ----------------
export const Room: React.FC<{lamp?: number; boxes?: boolean; bed?: boolean; table?: boolean}> = ({lamp = 1, boxes, bed, table}) => (
	<group>
		<color attach="background" args={['#1a1c2a']} />
		<hemisphereLight args={['#b8b0d8', '#4a3a2e', 0.75]} />
		{/* Warm bounce from the lamp side toward camera */}
		<directionalLight position={[3, 6, 12]} intensity={1.0} color="#ffd8a8" />
		{/* Moonlight through the window */}
		<Shadowed pos={[-10, 9, 6]} color="#9fb4ff" intensity={1.1} size={12} />
		{/* Warm lamp */}
		<pointLight position={[2.6, 5.2, 2.4]} intensity={80 * lamp} color="#ffc27a" distance={18} decay={2} />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[30, 30]} />
			<meshStandardMaterial color="#6b5544" roughness={0.9} />
		</mesh>
		<RBox size={[20, 10, 0.4]} pos={[0, 5, -3]} color="#a8907a" />
		<RBox size={[0.4, 10, 16]} pos={[-6, 5, 4]} color="#9c8670" />
		{/* Wallpaper stripes */}
		{Array.from({length: 12}, (_, i) => (
			<mesh key={i} position={[-8 + i * 1.5, 5, -2.78]}>
				<planeGeometry args={[0.18, 10]} />
				<meshStandardMaterial color="#957d68" />
			</mesh>
		))}
		{/* Window with night outside */}
		<group position={[-5.78, 5.8, 1.5]} rotation={[0, PI / 2, 0]}>
			<RBox size={[3.0, 3.4, 0.1]} color="#4a3a2e" />
			<mesh position={[0, 0, 0.06]}>
				<planeGeometry args={[2.6, 3.0]} />
				<meshStandardMaterial color="#26304e" emissive="#3a4a7a" emissiveIntensity={0.6} />
			</mesh>
			<RBox size={[0.1, 3.0, 0.14]} pos={[0, 0, 0.08]} color="#4a3a2e" />
		</group>
		{/* Lamp */}
		<group position={[2.6, 0, 1.5]}>
			<RBox size={[1.2, 2.6, 1.2]} pos={[0, 1.3, 0]} color="#5a4030" />
			<mesh position={[0, 3.2, 0]}>
				<cylinderGeometry args={[0.06, 0.06, 1.2, 6]} />
				<meshStandardMaterial color="#2a2a2a" />
			</mesh>
			<mesh position={[0, 4.0, 0]}>
				<cylinderGeometry args={[0.45, 0.7, 0.8, 12, 1, true]} />
				<meshStandardMaterial color="#f2e2c0" emissive="#ffc27a" emissiveIntensity={1.2 * lamp} side={THREE.DoubleSide} />
			</mesh>
		</group>
		{boxes ? (
			<group>
				{[
					[-2.4, 0.9, -1.4, 2.2, 1.8, 1.8],
					[-2.2, 2.6, -1.4, 1.8, 1.6, 1.6],
					[-0.2, 0.8, -1.8, 1.8, 1.6, 1.6],
					[1.3, 0.7, -1.2, 1.4, 1.4, 1.4],
					[-1.0, 0.6, 1.3, 1.6, 1.2, 1.4],
				].map(([x, y, z, w, h, d], i) => (
					<group key={i}>
						<RBox size={[w, h, d]} pos={[x, y, z]} color={i % 2 ? '#b98d5a' : '#c79c66'} />
						<RBox size={[w * 0.25, 0.02, d + 0.01]} pos={[x, y + h / 2, z]} color="#d8c8a0" />
					</group>
				))}
			</group>
		) : null}
		{bed ? (
			<group position={[-2.2, 0, -0.6]}>
				<RBox size={[3.4, 1.2, 5.4]} pos={[0, 0.6, 0]} color="#5a4030" />
				<RBox size={[3.2, 0.5, 5.2]} pos={[0, 1.45, 0]} color="#e8e4dc" />
				<RBox size={[3.3, 0.35, 3.4]} pos={[0, 1.8, 0.9]} color="#4a6aa0" />
				<RBox size={[2.2, 0.5, 1.0]} pos={[0, 1.95, -2.0]} color="#f6f4ee" />
				<RBox size={[3.4, 2.6, 0.3]} pos={[0, 1.3, -2.75]} color="#5a4030" />
			</group>
		) : null}
		{table ? (
			<group position={[0.6, 0, -0.6]}>
				<RBox size={[3.2, 0.2, 2.0]} pos={[0, 2.2, 0]} color="#7a5a40" />
				{[-1.4, 1.4].map((x) => [-0.8, 0.8].map((z) => <RBox key={`${x}${z}`} size={[0.16, 2.2, 0.16]} pos={[x, 1.1, z]} color="#6a4a32" />))}
				{/* The empty chair */}
				<group position={[0, 0, 1.9]}>
					<RBox size={[1.5, 0.16, 1.4]} pos={[0, 1.4, 0]} color="#8a6a4a" />
					<RBox size={[1.5, 1.8, 0.16]} pos={[0, 2.3, -0.65]} color="#8a6a4a" />
					{[-0.6, 0.6].map((x) => [-0.55, 0.55].map((z) => <RBox key={`${x}${z}`} size={[0.12, 1.4, 0.12]} pos={[x, 0.7, z]} color="#6a4a32" />))}
				</group>
				{/* A single plate set for two */}
				<mesh position={[0, 2.32, -0.4]}>
					<cylinderGeometry args={[0.45, 0.4, 0.06, 16]} />
					<meshStandardMaterial color="#f2efe6" />
				</mesh>
			</group>
		) : null}
	</group>
);

// ---------------- High-school gym ----------------
export const Gym: React.FC = () => (
	<group>
		<color attach="background" args={['#2a2420']} />
		<hemisphereLight args={['#ffe8c8', '#5a4030', 0.6]} />
		<Shadowed pos={[8, 24, 10]} color="#fff0d8" intensity={2.2} size={16} />
		<pointLight position={[0, 14, 4]} intensity={90} color="#ffe2b0" distance={30} decay={2} />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[60, 60]} />
			<meshStandardMaterial color="#d9a066" roughness={0.45} />
		</mesh>
		{Array.from({length: 30}, (_, i) => (
			<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[-30 + i * 2, 0.005, 0]}>
				<planeGeometry args={[0.04, 60]} />
				<meshStandardMaterial color="#c48c55" />
			</mesh>
		))}
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.01, -1]}>
			<ringGeometry args={[5.8, 6.0, 48, 1, 0, PI]} />
			<meshStandardMaterial color="#f4f4f0" />
		</mesh>
		<RBox size={[60, 22, 0.5]} pos={[0, 11, -9]} color="#8a6a4a" />
		{/* Bleachers */}
		{[0, 1, 2, 3].map((i) => (
			<RBox key={i} size={[30, 0.8, 1.6]} pos={[0, 0.4 + i * 0.8, -7.8 + i * 0.0]} color={i % 2 ? '#c8b088' : '#b89e78'} />
		))}
		{/* High windows */}
		{[-12, -4, 4, 12].map((x) => (
			<mesh key={x} position={[x, 16, -8.7]}>
				<planeGeometry args={[5, 3]} />
				<meshStandardMaterial color="#e8f0ff" emissive="#d8e8ff" emissiveIntensity={1.1} />
			</mesh>
		))}
		<group position={[0, 0, -5.4]}>
			<Hoop rimY={10} />
		</group>
	</group>
);

// ---------------- NBA arena ----------------
export const Scoreboard: React.FC<{top: string; big: string; sub?: string; accent?: string}> = ({top, big, sub, accent = '#ffb81c'}) => (
	<group>
		<RBox size={[10.6, 6.2, 1.6]} color="#15161a" />
		<group position={[0, 0, 0.82]}>
			<Canvas2D
				w={10}
				h={5.6}
				px={110}
				k={`${top}|${big}|${sub}|${accent}`}
				emissive={0.9}
				draw={(g, w, h) => {
					g.fillStyle = '#05060a';
					g.fillRect(0, 0, w, h);
					g.textAlign = 'center';
					g.textBaseline = 'middle';
					g.fillStyle = accent;
					g.font = font(h * 0.13);
					g.fillText(top, w / 2, h * 0.17);
					g.fillStyle = '#ffffff';
					g.font = font(h * 0.38);
					g.fillText(big, w / 2, h * 0.52);
					if (sub) {
						g.fillStyle = accent;
						g.font = font(h * 0.11, 800);
						g.fillText(sub, w / 2, h * 0.84);
					}
				}}
			/>
		</group>
	</group>
);

const Crowd: React.FC = () => {
	const people = useMemo(() => {
		let s = 5;
		const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
		const cols = ['#6f263d', '#ffb81c', '#2a2c34', '#3a3d48', '#552583', '#d0d0d0', '#1d428a'];
		const out: {x: number; y: number; z: number; c: string; h: number}[] = [];
		for (let row = 0; row < 7; row++)
			for (let i = 0; i < 26; i++) out.push({x: -30 + i * 2.3 + (row % 2) * 1.1, y: 1.5 + row * 1.6, z: -14 - row * 1.8, c: cols[Math.floor(r() * cols.length)], h: 0.9 + r() * 0.4});
		return out;
	}, []);
	return (
		<group>
			{people.map((p, i) => (
				<group key={i} position={[p.x, p.y, p.z]}>
					<mesh position={[0, 0.6 * p.h, 0]}>
						<boxGeometry args={[1.4, 1.2 * p.h, 0.8]} />
						<meshStandardMaterial color={p.c} roughness={0.9} />
					</mesh>
					<mesh position={[0, 1.55 * p.h, 0]}>
						<boxGeometry args={[0.7, 0.7, 0.7]} />
						<meshStandardMaterial color={i % 3 ? '#7a5038' : '#d8b08a'} roughness={0.9} />
					</mesh>
				</group>
			))}
			{/* Stands */}
			{Array.from({length: 7}, (_, row) => (
				<RBox key={row} size={[70, 1.6, 1.8]} pos={[0, 0.8 + row * 1.6, -14 - row * 1.8]} color="#1c1d22" />
			))}
		</group>
	);
};

export const Arena: React.FC<{team?: string; board?: React.ReactNode; flash?: number}> = ({team = '#6f263d', board, flash = 0}) => (
	<group>
		<color attach="background" args={['#07080c']} />
		<fog attach="fog" args={['#07080c', 26, 60]} />
		<hemisphereLight args={['#c8d0ff', '#2a1a14', 0.35]} />
		{/* Big overhead court lights */}
		<Shadowed pos={[4, 30, 10]} color="#fff4e0" intensity={2.6} size={18} far={90} />
		<spotLight position={[0, 22, 6]} angle={0.5} penumbra={0.6} intensity={900} distance={60} decay={2} color="#fff2dc" />
		{/* Front fill from the camera side so faces read under the big lights */}
		<directionalLight position={[0, 7, 22]} intensity={0.9} color="#fff2e2" />
		{/* Team-colour rim lights from the sides */}
		<directionalLight position={[-18, 8, -10]} intensity={1.6} color={team} />
		<directionalLight position={[18, 8, -10]} intensity={1.2} color="#9ab8ff" />
		{flash ? <pointLight position={[0, 8, 10]} intensity={300 * flash} color="#ffffff" distance={40} decay={2} /> : null}
		{/* Court */}
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[60, 60]} />
			<meshStandardMaterial color="#d49a5e" roughness={0.35} metalness={0.05} />
		</mesh>
		{Array.from({length: 30}, (_, i) => (
			<mesh key={i} rotation={[-PI / 2, 0, 0]} position={[-30 + i * 2, 0.005, 0]}>
				<planeGeometry args={[0.04, 60]} />
				<meshStandardMaterial color="#bf8650" />
			</mesh>
		))}
		{/* Painted key and three-point arc */}
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.01, -1.8]}>
			<planeGeometry args={[6, 9]} />
			<meshStandardMaterial color={team} roughness={0.4} />
		</mesh>
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.012, -6]}>
			<ringGeometry args={[11.6, 11.85, 64, 1, PI, PI]} />
			<meshStandardMaterial color="#f8f8f4" />
		</mesh>
		<mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.012, 2.6]}>
			<ringGeometry args={[2.8, 3.0, 40]} />
			<meshStandardMaterial color="#f8f8f4" />
		</mesh>
		<group position={[0, 0, -7.2]}>
			<Hoop rimY={10} />
		</group>
		<Crowd />
		{board ? <group position={[0, 19, -11]}>{board}</group> : null}
	</group>
);

// ---------------- Magazine cover studio ----------------
export const CoverStudio: React.FC<{chosen: boolean; flash: number}> = ({chosen, flash}) => (
	<group>
		<color attach="background" args={['#0e0f14']} />
		<hemisphereLight args={['#ffffff', '#30303a', 0.45]} />
		<spotLight position={[4, 12, 10]} angle={0.45} penumbra={0.5} intensity={700} distance={50} decay={2} color="#fff4e6" castShadow />
		<directionalLight position={[-8, 6, -4]} intensity={1.6} color="#ffd36a" />
		<directionalLight position={[8, 6, -4]} intensity={1.2} color="#8ac0ff" />
		<pointLight position={[0, 5, 9]} intensity={260 * flash} color="#ffffff" distance={30} decay={2} />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[40, 40]} />
			<meshStandardMaterial color="#1a1b22" roughness={0.6} />
		</mesh>
		{/* Giant magazine cover behind the subject */}
		<group position={[0, 6.6, -2.4]}>
			<RBox size={[9.4, 12.6, 0.2]} pos={[0, 0, -0.12]} color="#f4f4f0" />
			<Canvas2D
				w={9}
				h={12.2}
				px={90}
				k={chosen ? 'cover2' : 'cover1'}
				emissive={0.15}
				draw={(g, w, h) => {
					const grad = g.createLinearGradient(0, 0, 0, h);
					grad.addColorStop(0, '#2b4e86');
					grad.addColorStop(1, '#0f1c34');
					g.fillStyle = grad;
					g.fillRect(0, 0, w, h);
					g.fillStyle = '#ffffff';
					g.textAlign = 'center';
					g.textBaseline = 'middle';
					g.font = font(h * 0.11);
					g.fillText('SPORTS', w / 2, h * 0.08);
					g.fillStyle = '#e8c547';
					g.fillRect(w * 0.08, h * 0.15, w * 0.84, h * 0.008);
					g.fillStyle = '#d8e2f2';
					g.font = font(h * 0.026, 700);
					g.fillText('HIGH SCHOOL PHENOM', w / 2, h * 0.185);
					if (chosen) {
						g.save();
						g.translate(w * 0.5, h * 0.84);
						g.rotate(-0.06);
						g.fillStyle = '#ffffff';
						g.strokeStyle = '#000000';
						g.lineWidth = h * 0.012;
						g.font = font(h * 0.085);
						g.strokeText('THE CHOSEN ONE', 0, 0);
						g.fillText('THE CHOSEN ONE', 0, 0);
						g.restore();
					}
				}}
			/>
		</group>
	</group>
);

// ---------------- Draft stage ----------------
export const DraftStage: React.FC<{pick: boolean; flash: number}> = ({pick, flash}) => (
	<group>
		<color attach="background" args={['#06070d']} />
		<hemisphereLight args={['#c8d4ff', '#202030', 0.4]} />
		<spotLight position={[0, 16, 8]} angle={0.35} penumbra={0.6} intensity={900} distance={50} decay={2} color="#fffaf0" castShadow />
		<directionalLight position={[-10, 6, -4]} intensity={1.4} color="#4a7cff" />
		<directionalLight position={[10, 6, -4]} intensity={1.4} color="#4a7cff" />
		<pointLight position={[0, 4, 12]} intensity={260 * flash} color="#ffffff" distance={30} decay={2} />
		<mesh rotation={[-PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[60, 60]} />
			<meshStandardMaterial color="#14161f" roughness={0.4} />
		</mesh>
		<RBox size={[22, 0.8, 8]} pos={[0, 0.4, -1]} color="#1c2a4a" />
		<RBox size={[22, 0.06, 8.02]} pos={[0, 0.81, -1]} color="#2a3e6a" />
		<group position={[0, 7.8, -5]}>
			<Canvas2D
				w={20}
				h={11}
				px={70}
				k={pick ? 'draft2' : 'draft1'}
				emissive={0.8}
				draw={(g, w, h) => {
					const grad = g.createLinearGradient(0, 0, w, h);
					grad.addColorStop(0, '#0b1a3e');
					grad.addColorStop(1, '#1d3c7a');
					g.fillStyle = grad;
					g.fillRect(0, 0, w, h);
					g.textAlign = 'center';
					g.textBaseline = 'middle';
					g.fillStyle = '#9ab8ff';
					g.font = font(h * 0.08, 800);
					g.fillText('2003 DRAFT', w / 2, h * 0.14);
					if (pick) {
						g.fillStyle = '#ffffff';
						g.font = font(h * 0.5);
						g.fillText('#1', w / 2, h * 0.5);
						g.fillStyle = '#ffc72c';
						g.font = font(h * 0.09);
						g.fillText('FIRST PICK', w / 2, h * 0.84);
					}
				}}
			/>
		</group>
		{/* Podium */}
		<group position={[3.2, 0.8, 0.6]}>
			<RBox size={[2.2, 3.4, 1.4]} pos={[0, 1.7, 0]} color="#1a2238" />
			<RBox size={[2.4, 0.2, 1.6]} pos={[0, 3.45, 0]} color="#2a3658" />
		</group>
	</group>
);
