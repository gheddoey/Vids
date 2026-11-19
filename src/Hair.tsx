import React from 'react';
import {RBox, seeded, shade} from './parts';

// All hair is built in head-local space. The head is a 1.2 cube centred on 0,
// so the top of the scalp is y = 0.6 and the face points toward +z.

export type HairType = 'swept' | 'spiky' | 'bob' | 'pompadour' | 'bun' | 'mop' | 'flattop' | 'braids' | 'short';

const Shell: React.FC<{color: string; height?: number}> = ({color, height = 0.6}) => (
	<>
		{/* Scalp cap */}
		<RBox size={[1.32, height, 1.32]} pos={[0, 0.72 - height / 2, -0.02]} color={color} r={0.14} />
		{/* Back of the head */}
		<RBox size={[1.3, 0.85, 0.28]} pos={[0, 0.05, -0.56]} color={color} r={0.1} />
	</>
);

// Side-swept bangs with long side locks.
const Swept: React.FC<{color: string}> = ({color}) => {
	const dark = shade(color, -0.08);
	return (
		<group>
			<Shell color={color} />
			{/* Fringe pieces sweeping to the right */}
			<RBox size={[0.55, 0.22, 0.2]} pos={[-0.36, 0.5, 0.6]} rot={[0, 0, 0.35]} color={color} r={0.07} />
			<RBox size={[0.55, 0.2, 0.2]} pos={[0.05, 0.47, 0.62]} rot={[0, 0, 0.25]} color={dark} r={0.07} />
			<RBox size={[0.45, 0.18, 0.2]} pos={[0.4, 0.42, 0.6]} rot={[0, 0, 0.15]} color={color} r={0.07} />
			{/* Side locks framing the face */}
			<RBox size={[0.2, 0.62, 0.26]} pos={[-0.66, 0.12, 0.18]} rot={[0.05, 0, 0.06]} color={color} r={0.07} />
			<RBox size={[0.2, 0.55, 0.26]} pos={[0.66, 0.16, 0.18]} rot={[0.05, 0, -0.06]} color={color} r={0.07} />
			<RBox size={[0.2, 0.65, 0.5]} pos={[-0.66, 0.1, -0.2]} color={color} r={0.07} />
			<RBox size={[0.2, 0.65, 0.5]} pos={[0.66, 0.1, -0.2]} color={color} r={0.07} />
			{/* Tips flicking out at the back */}
			<RBox size={[0.4, 0.3, 0.2]} pos={[-0.4, -0.38, -0.6]} rot={[0.3, 0, 0.3]} color={dark} r={0.07} />
			<RBox size={[0.4, 0.3, 0.2]} pos={[0.4, -0.38, -0.6]} rot={[0.3, 0, -0.3]} color={dark} r={0.07} />
		</group>
	);
};

// Spikes pointing up and out.
const Spiky: React.FC<{color: string}> = ({color}) => {
	const spikes: {pos: [number, number, number]; rot: [number, number, number]; h: number}[] = [
		{pos: [0, 0.85, 0.05], rot: [0, 0, 0], h: 0.75},
		{pos: [-0.38, 0.8, 0.2], rot: [0.25, 0, 0.45], h: 0.6},
		{pos: [0.38, 0.8, 0.2], rot: [0.25, 0, -0.45], h: 0.6},
		{pos: [-0.35, 0.82, -0.3], rot: [-0.35, 0, 0.4], h: 0.65},
		{pos: [0.35, 0.82, -0.3], rot: [-0.35, 0, -0.4], h: 0.65},
		{pos: [0, 0.78, -0.45], rot: [-0.6, 0, 0], h: 0.6},
		{pos: [0.05, 0.72, 0.5], rot: [0.75, 0, 0.1], h: 0.5},
		{pos: [-0.62, 0.45, -0.05], rot: [0, 0, 1.0], h: 0.5},
		{pos: [0.62, 0.45, -0.05], rot: [0, 0, -1.0], h: 0.5},
	];
	const light = shade(color, 0.07);
	return (
		<group>
			<Shell color={color} height={0.45} />
			{spikes.map((s, i) => (
				<mesh key={i} position={s.pos} rotation={s.rot} castShadow>
					<coneGeometry args={[0.22, s.h * 1.15, 4]} />
					<meshStandardMaterial color={i % 2 ? light : color} roughness={0.75} flatShading />
				</mesh>
			))}
			{/* Short bangs */}
			<RBox size={[1.1, 0.16, 0.16]} pos={[0, 0.5, 0.6]} color={color} r={0.06} />
		</group>
	);
};

// Straight bob with a blunt fringe.
const Bob: React.FC<{color: string}> = ({color}) => {
	const dark = shade(color, -0.06);
	return (
		<group>
			<Shell color={color} />
			{/* Fringe cut into strands of slightly different lengths */}
			{[-0.45, -0.15, 0.15, 0.45].map((x, i) => (
				<RBox key={x} size={[0.3, 0.26 + (i % 2) * 0.05, 0.14]} pos={[x, 0.46 - (i % 2) * 0.025, 0.62]} color={i % 2 ? dark : color} r={0.05} />
			))}
			{/* Long sides down to the jaw */}
			<RBox size={[0.22, 1.1, 1.0]} pos={[-0.67, -0.05, 0.05]} color={color} r={0.08} />
			<RBox size={[0.22, 1.1, 1.0]} pos={[0.67, -0.05, 0.05]} color={color} r={0.08} />
			<RBox size={[1.32, 1.15, 0.28]} pos={[0, -0.08, -0.58]} color={dark} r={0.1} />
			{/* Ends curl inward slightly */}
			<RBox size={[0.26, 0.16, 1.0]} pos={[-0.62, -0.62, 0.05]} color={dark} r={0.06} />
			<RBox size={[0.26, 0.16, 1.0]} pos={[0.62, -0.62, 0.05]} color={dark} r={0.06} />
		</group>
	);
};

// Tall quiff swept up and back, with sideburns.
const Pompadour: React.FC<{color: string}> = ({color}) => {
	const light = shade(color, 0.08);
	return (
		<group>
			<Shell color={color} height={0.5} />
			<RBox size={[1.1, 0.4, 0.7]} pos={[0, 0.82, 0.25]} rot={[-0.3, 0, 0]} color={color} r={0.18} />
			<RBox size={[0.9, 0.22, 0.5]} pos={[0, 0.98, 0.3]} rot={[-0.45, 0, 0]} color={light} r={0.1} />
			{/* Comb lines */}
			{[-0.3, 0, 0.3].map((x) => (
				<RBox key={x} size={[0.05, 0.05, 0.6]} pos={[x, 0.95, -0.05]} rot={[-0.15, 0, 0]} color={light} r={0.02} />
			))}
			{/* Sideburns */}
			<RBox size={[0.08, 0.35, 0.18]} pos={[-0.62, 0.05, 0.25]} color={color} r={0.03} />
			<RBox size={[0.08, 0.35, 0.18]} pos={[0.62, 0.05, 0.25]} color={color} r={0.03} />
		</group>
	);
};

// Hair tied into a top bun with a band.
const Bun: React.FC<{color: string; accent: string}> = ({color, accent}) => (
	<group>
		<Shell color={color} height={0.5} />
		<RBox size={[0.5, 0.42, 0.5]} pos={[0, 1.02, -0.2]} rot={[0, Math.PI / 4, 0]} color={color} />
		<RBox size={[0.36, 0.1, 0.36]} pos={[0, 0.8, -0.2]} rot={[0, Math.PI / 4, 0]} color={accent} rough={0.5} />
		{/* Center parting */}
		<RBox size={[0.04, 0.03, 0.9]} pos={[0, 0.725, 0.05]} color={shade(color, -0.12)} r={0.01} />
		<RBox size={[0.18, 0.4, 0.22]} pos={[-0.64, 0.15, 0.35]} color={color} r={0.06} />
		<RBox size={[0.18, 0.4, 0.22]} pos={[0.64, 0.15, 0.35]} color={color} r={0.06} />
	</group>
);

// Messy chunks at random angles.
const Mop: React.FC<{color: string}> = ({color}) => {
	const rand = seeded(7);
	const chunks = Array.from({length: 16}, (_, i) => {
		const a = (i / 16) * Math.PI * 2;
		const y = 0.55 + rand() * 0.25;
		return {
			pos: [Math.sin(a) * 0.55, y, Math.cos(a) * 0.55] as [number, number, number],
			rot: [rand() * 0.6 - 0.3, a, rand() * 0.6 - 0.3] as [number, number, number],
			c: rand() > 0.5 ? color : shade(color, -0.07),
		};
	});
	return (
		<group>
			<Shell color={color} height={0.55} />
			{chunks.map((c, i) => (
				<RBox key={i} size={[0.42, 0.3, 0.3]} pos={c.pos} rot={c.rot} color={c.c} r={0.08} />
			))}
			<RBox size={[0.7, 0.3, 0.6]} pos={[0.05, 0.86, 0]} rot={[0.1, 0.4, 0.1]} color={color} r={0.12} />
			{/* Fringe falling over the eyes a bit */}
			<RBox size={[0.4, 0.28, 0.16]} pos={[-0.3, 0.42, 0.62]} rot={[0, 0, -0.2]} color={color} r={0.07} />
			<RBox size={[0.4, 0.24, 0.16]} pos={[0.3, 0.44, 0.62]} rot={[0, 0, 0.25]} color={shade(color, -0.07)} r={0.07} />
		</group>
	);
};

// Tall, flat-topped slab of hair standing straight up, with comb lines.
const Flattop: React.FC<{color: string}> = ({color}) => {
	const light = shade(color, 0.08);
	const dark = shade(color, -0.1);
	return (
		<group>
			<Shell color={color} height={0.45} />
			<RBox size={[0.9, 1.7, 1.15]} pos={[0, 1.45, 0.02]} color={color} />
			<RBox size={[0.96, 0.12, 1.2]} pos={[0, 2.3, 0.02]} color={light} />
			{[-0.3, -0.1, 0.1, 0.3].map((x) => (
				<RBox key={x} size={[0.03, 1.5, 0.03]} pos={[x, 1.45, 0.6]} color={dark} />
			))}
			{[-0.3, 0, 0.3].map((z) => (
				<RBox key={z} size={[0.03, 1.5, 0.03]} pos={[0.46, 1.45, z]} color={dark} />
			))}
			{/* Short sides */}
			<RBox size={[0.12, 0.4, 0.5]} pos={[-0.64, 0.25, 0.15]} color={color} />
			<RBox size={[0.12, 0.4, 0.5]} pos={[0.64, 0.25, 0.15]} color={color} />
		</group>
	);
};

// Black hair gathered into thick hanging braids at the back.
const Braids: React.FC<{color: string}> = ({color}) => {
	const dark = shade(color, -0.06);
	return (
		<group>
			<Shell color={color} height={0.5} />
			{[-0.5, -0.17, 0.17, 0.5].map((x, i) =>
				[0, 1, 2].map((j) => (
					<RBox key={`${x}${j}`} size={[0.24, 0.3, 0.24]} pos={[x, -0.3 - j * 0.28, -0.62 - j * 0.02]} rot={[0, 0, (j % 2 ? 0.2 : -0.2)]} color={(i + j) % 2 ? dark : color} />
				)),
			)}
		</group>
	);
};

// Short neat hair (mostly hidden under a hat).
const Short: React.FC<{color: string}> = ({color}) => (
	<group>
		<Shell color={color} height={0.45} />
		<RBox size={[0.14, 0.45, 0.5]} pos={[-0.64, 0.12, 0.12]} color={color} />
		<RBox size={[0.14, 0.45, 0.5]} pos={[0.64, 0.12, 0.12]} color={color} />
	</group>
);

export const Hair: React.FC<{type: HairType; color: string; accent?: string}> = ({type, color, accent = '#e04a7a'}) => {
	switch (type) {
		case 'swept':
			return <Swept color={color} />;
		case 'spiky':
			return <Spiky color={color} />;
		case 'bob':
			return <Bob color={color} />;
		case 'pompadour':
			return <Pompadour color={color} />;
		case 'bun':
			return <Bun color={color} accent={accent} />;
		case 'mop':
			return <Mop color={color} />;
		case 'flattop':
			return <Flattop color={color} />;
		case 'braids':
			return <Braids color={color} />;
		case 'short':
			return <Short color={color} />;
	}
};
