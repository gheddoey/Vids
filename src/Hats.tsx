import React from 'react';
import {RBox, shade} from './parts';

// Head objects, in head-local space (head is a 1.2 cube centred on 0, face toward +z).
// Built from hard-edged blocks so they read like the blocky reference style.

export type HatType = 'cap' | 'fedora' | 'beanie' | 'goggles' | 'headphones' | 'badgecap' | 'safari' | 'schoolcap' | 'headband';

type P = {color: string; accent: string};

// Low-poly faceted cylinder (8 or 12 sides) for brims and lenses.
const Facet: React.FC<{
	r: number;
	r2?: number;
	h: number;
	sides?: number;
	pos?: [number, number, number];
	rot?: [number, number, number];
	color: string;
	emissive?: string;
}> = ({r, r2, h, sides = 12, pos = [0, 0, 0], rot = [0, 0, 0], color, emissive}) => (
	<mesh position={pos} rotation={rot} castShadow receiveShadow>
		<cylinderGeometry args={[r, r2 ?? r, h, sides]} />
		<meshStandardMaterial color={color} roughness={0.8} flatShading emissive={emissive ?? '#000000'} />
	</mesh>
);

const Cap: React.FC<P> = ({color, accent}) => (
	<group>
		{/* Boxy crown: base band + slightly narrower top block */}
		<RBox size={[1.58, 0.34, 1.5]} pos={[0, 0.55, -0.01]} color={color} />
		<RBox size={[1.44, 0.2, 1.38]} pos={[0, 0.8, -0.03]} color={color} />
		{/* White front panel, like the reference cap */}
		<RBox size={[0.56, 0.36, 0.05]} pos={[0, 0.62, 0.75]} color={accent} />
		{/* Seam ridge along the top */}
		<RBox size={[0.06, 0.03, 1.3]} pos={[0, 0.915, -0.03]} color={shade(color, -0.1)} />
		{/* Flat brim */}
		<RBox size={[1.4, 0.07, 0.62]} pos={[0, 0.4, 1.02]} rot={[0.1, 0, 0]} color={shade(color, -0.07)} />
	</group>
);

const Fedora: React.FC<P> = ({color, accent}) => (
	<group>
		{/* Wide flat brim, tipped down at the front */}
		<Facet r={1.05} h={0.06} sides={12} pos={[0, 0.42, 0.03]} rot={[0.07, Math.PI / 12, 0]} color={shade(color, -0.04)} />
		{/* Squared crown with pinched top */}
		<RBox size={[1.28, 0.5, 1.2]} pos={[0, 0.7, 0]} color={color} />
		<RBox size={[1.0, 0.1, 1.0]} pos={[0, 0.99, 0]} color={color} />
		<RBox size={[0.22, 0.04, 0.9]} pos={[0, 1.05, 0]} color={shade(color, -0.12)} />
		{/* Band and a small feather */}
		<RBox size={[1.32, 0.14, 1.24]} pos={[0, 0.53, 0]} color={accent} rough={0.55} />
		<RBox size={[0.05, 0.4, 0.12]} pos={[0.67, 0.7, 0.15]} rot={[0, 0, -0.35]} color="#d9c27a" />
	</group>
);

const Beanie: React.FC<P> = ({color, accent}) => (
	<group>
		{/* Stacked blocks give a stepped, knitted silhouette */}
		<RBox size={[1.44, 0.3, 1.44]} pos={[0, 0.42, 0]} color={shade(color, -0.06)} />
		<RBox size={[1.38, 0.3, 1.38]} pos={[0, 0.72, 0]} color={color} />
		<RBox size={[1.1, 0.16, 1.1]} pos={[0, 0.95, 0]} color={color} />
		{/* Rib lines on the cuff */}
		{[-0.5, -0.25, 0, 0.25, 0.5].map((x) => (
			<RBox key={x} size={[0.04, 0.3, 0.02]} pos={[x, 0.42, 0.725]} color={shade(color, -0.15)} />
		))}
		{/* Pom-pom */}
		<mesh position={[0, 1.15, 0]} castShadow>
			<icosahedronGeometry args={[0.18, 0]} />
			<meshStandardMaterial color={accent} roughness={1} flatShading />
		</mesh>
	</group>
);

const Goggles: React.FC<P> = ({color, accent}) => (
	<group position={[0, 0.4, 0]}>
		{/* Strap around the head */}
		<RBox size={[1.44, 0.13, 0.06]} pos={[0, 0, -0.71]} color={color} />
		<RBox size={[0.06, 0.13, 1.44]} pos={[-0.71, 0, 0]} color={color} />
		<RBox size={[0.06, 0.13, 1.44]} pos={[0.71, 0, 0]} color={color} />
		<RBox size={[0.3, 0.1, 0.08]} pos={[0, 0, 0.72]} color={shade(color, -0.1)} />
		{[-0.3, 0.3].map((x) => (
			<group key={x} position={[x, 0, 0.74]}>
				<Facet r={0.21} h={0.12} sides={8} rot={[Math.PI / 2, 0, Math.PI / 8]} color="#3a3f47" />
				<Facet r={0.15} h={0.02} sides={8} pos={[0, 0, 0.065]} rot={[Math.PI / 2, 0, Math.PI / 8]} color={accent} emissive={shade(accent, -0.35)} />
			</group>
		))}
	</group>
);

const Headphones: React.FC<P> = ({color, accent}) => (
	<group>
		{/* Squared band: top bar + two side bars */}
		<RBox size={[1.7, 0.1, 0.16]} pos={[0, 0.98, 0]} color={color} />
		<RBox size={[0.1, 0.75, 0.16]} pos={[-0.82, 0.6, 0]} color={color} />
		<RBox size={[0.1, 0.75, 0.16]} pos={[0.82, 0.6, 0]} color={color} />
		<RBox size={[0.5, 0.06, 0.2]} pos={[0, 0.94, 0]} color={shade(color, -0.12)} />
		{[-1, 1].map((s) => (
			<group key={s} position={[s * 0.78, 0.05, 0]}>
				<RBox size={[0.2, 0.55, 0.5]} color={color} />
				<RBox size={[0.03, 0.34, 0.3]} pos={[s * 0.11, 0, 0]} color={accent} rough={0.4} />
			</group>
		))}
	</group>
);

// Tall flat-topped cap with a badge and gem.
const BadgeCap: React.FC<P> = ({color, accent}) => (
	<group>
		<RBox size={[1.4, 0.6, 1.4]} pos={[0, 0.66, 0]} color={color} />
		<RBox size={[1.44, 0.12, 1.44]} pos={[0, 0.42, 0]} color={shade(color, -0.08)} />
		<RBox size={[0.6, 0.42, 0.05]} pos={[0, 0.7, 0.71]} color={accent} />
		<mesh position={[0, 0.7, 0.76]} rotation={[0, 0, Math.PI / 4]} castShadow>
			<octahedronGeometry args={[0.13, 0]} />
			<meshStandardMaterial color="#4fd2e8" emissive="#1b8aa0" emissiveIntensity={0.4} metalness={0.4} roughness={0.2} flatShading />
		</mesh>
		<RBox size={[1.2, 0.06, 0.5]} pos={[0, 0.39, 0.9]} rot={[0.1, 0, 0]} color={shade(color, -0.08)} />
	</group>
);

// Wide-brimmed safari hat with a dented crown and a dark band.
const Safari: React.FC<P> = ({color, accent}) => (
	<group>
		<Facet r={1.2} h={0.06} sides={14} pos={[0, 0.44, 0.04]} rot={[0.1, 0, 0]} color={shade(color, -0.05)} />
		{/* Brim edge turned down slightly */}
		<Facet r={1.22} r2={1.26} h={0.08} sides={14} pos={[0, 0.39, 0.06]} rot={[0.1, 0, 0]} color={shade(color, -0.12)} />
		<RBox size={[1.3, 0.48, 1.26]} pos={[0, 0.7, 0]} color={color} />
		<RBox size={[1.1, 0.12, 1.06]} pos={[0, 0.98, 0]} color={color} />
		<RBox size={[0.26, 0.05, 0.86]} pos={[0, 1.05, 0]} color={shade(color, -0.12)} />
		<RBox size={[1.34, 0.13, 1.3]} pos={[0, 0.53, 0]} color={accent} rough={0.6} />
	</group>
);

// Black school cap: flat top, short stiff brim, gold badge and chain, back fading into the hair.
const SchoolCap: React.FC<P> = ({color, accent}) => (
	<group>
		<RBox size={[1.46, 0.46, 1.46]} pos={[0, 0.66, 0]} color={color} />
		<RBox size={[1.52, 0.1, 1.52]} pos={[0, 0.9, -0.02]} color={shade(color, 0.04)} />
		<RBox size={[1.48, 0.12, 1.48]} pos={[0, 0.44, 0]} color={shade(color, -0.04)} />
		{/* Brim */}
		<RBox size={[1.3, 0.06, 0.45]} pos={[0, 0.4, 0.9]} rot={[0.18, 0, 0]} color={shade(color, -0.02)} />
		{/* Gold badge and a chain across the band */}
		<RBox size={[0.3, 0.26, 0.05]} pos={[0.05, 0.66, 0.74]} color={accent} rough={0.35} />
		<RBox size={[0.14, 0.12, 0.06]} pos={[0.05, 0.66, 0.765]} color={shade(accent, -0.15)} rough={0.35} />
		<RBox size={[0.9, 0.04, 0.04]} pos={[-0.25, 0.48, 0.75]} rot={[0, 0, -0.08]} color={accent} rough={0.35} />
		{/* Ragged back blending into the hair */}
		{[-0.5, -0.17, 0.17, 0.5].map((x, i) => (
			<RBox key={x} size={[0.34, 0.5 + (i % 2) * 0.15, 0.2]} pos={[x, 0.3 - (i % 2) * 0.07, -0.72]} rot={[-0.2, 0, 0]} color={color} />
		))}
	</group>
);

// Cloth headband wrapped around the forehead, knot and tails at the back.
const Headband: React.FC<P> = ({color, accent}) => (
	<group position={[0, 0.42, 0]}>
		<RBox size={[1.4, 0.3, 1.4]} color={color} />
		{[-0.4, -0.1, 0.2, 0.48].map((x) => (
			<RBox key={x} size={[0.04, 0.3, 0.02]} pos={[x, 0, 0.71]} rot={[0, 0, 0.3]} color={shade(color, -0.1)} />
		))}
		<RBox size={[0.3, 0.26, 0.2]} pos={[0.25, 0.02, -0.75]} color={shade(color, -0.06)} />
		<RBox size={[0.18, 0.6, 0.06]} pos={[0.12, -0.32, -0.82]} rot={[0.25, 0, 0.12]} color={color} />
		<RBox size={[0.18, 0.5, 0.06]} pos={[0.4, -0.28, -0.8]} rot={[0.3, 0, -0.18]} color={accent} />
	</group>
);

export const Hat: React.FC<{type: HatType; color: string; accent?: string}> = ({type, color, accent = '#ffffff'}) => {
	const p = {color, accent};
	switch (type) {
		case 'cap':
			return <Cap {...p} />;
		case 'fedora':
			return <Fedora {...p} />;
		case 'beanie':
			return <Beanie {...p} />;
		case 'goggles':
			return <Goggles {...p} />;
		case 'headphones':
			return <Headphones {...p} />;
		case 'badgecap':
			return <BadgeCap {...p} />;
		case 'safari':
			return <Safari {...p} />;
		case 'schoolcap':
			return <SchoolCap {...p} />;
		case 'headband':
			return <Headband {...p} />;
	}
};
