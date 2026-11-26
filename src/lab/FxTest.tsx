import React, {useEffect, useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {HullBox, Redraw} from '../fx';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {EffectComposer, Bloom, Vignette, Outline, Selection, Select} from '@react-three/postprocessing';
import {ContactShadows, Sparkles} from '@react-three/drei';
import RAPIER from '@dimforge/rapier3d-compat';

// Smoke test for the new tools: bloom + vignette (postprocessing), drei contact shadows and
// sparkles, an inverted-hull outline, and a Rapier drop pre-simulated up to the current frame.
let ready: Promise<void> | null = null;
const useRapier = () => {
	const [ok, setOk] = useState(false);
	const [h] = useState(() => delayRender('rapier'));
	useEffect(() => {
		ready = ready ?? RAPIER.init();
		ready.then(() => (setOk(true), continueRender(h)));
	}, [h]);
	return ok;
};

const dropY = (frame: number) => {
	const world = new RAPIER.World({x: 0, y: -9.81, z: 0});
	world.createCollider(RAPIER.ColliderDesc.cuboid(10, 0.1, 10));
	const b = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0));
	world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(0.6), b);
	world.timestep = 1 / 30;
	for (let i = 0; i < frame; i++) world.step();
	return b.translation().y;
};

class Catch extends React.Component<{children: React.ReactNode}, {err: string | null}> {
	state = {err: null as string | null};
	static getDerivedStateFromError(e: Error) {
		return {err: String(e?.stack ?? e).slice(0, 600)};
	}
	render() {
		return this.state.err ? <div style={{color: 'red', fontSize: 30, padding: 40, whiteSpace: 'pre-wrap'}}>{this.state.err}</div> : this.props.children;
	}
}

export const FxTest: React.FC = () => {
	const f = useCurrentFrame();
	const ok = useRapier();
	if (!ok) return null;
	return (
		<AbsoluteFill>
		<Catch>
		<ThreeCanvas width={1080} height={1920} camera={{position: [0, 2.5, 9], fov: 42}} onCreated={(st) => st.camera.lookAt(0, 1.2, 0)} gl={{preserveDrawingBuffer: true}}>
			<color attach="background" args={['#141a2e']} />
			<ambientLight intensity={0.6} />
			<directionalLight position={[3, 6, 4]} intensity={2} />
			<Selection>
				<Select enabled>
					<mesh position={[-1.2, dropY(f) + 0.1, 0]}>
						<boxGeometry />
						<meshStandardMaterial color="#2fa39a" flatShading />
						<HullBox size={[1, 1, 1]} />
					</mesh>
				</Select>
				<mesh position={[1.2, 1, 0]}>
					<boxGeometry args={[1, 2, 1]} />
					<meshStandardMaterial color="#ffc278" emissive="#ffc278" emissiveIntensity={3} toneMapped={false} />
				</mesh>
				<ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={10} blur={2} frames={1} />
				<Sparkles count={40} scale={6} size={4} speed={0} color="#e8c84a" />
				<EffectComposer multisampling={0}>
					<Bloom intensity={1.2} luminanceThreshold={0.8} mipmapBlur />
					<Vignette darkness={0.5} />
				</EffectComposer>
			</Selection>
			<Redraw />
		</ThreeCanvas>
		</Catch>
		</AbsoluteFill>
	);
};
