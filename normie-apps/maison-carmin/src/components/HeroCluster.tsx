import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODELS = [
  "/models/pieces/jewel-01.glb",
  "/models/pieces/jewel-02.glb",
  "/models/pieces/jewel-03.glb",
];
MODELS.forEach((m) => useGLTF.preload(m));

// A diagonal cascade that fills the tall hero column. [x, y, z, targetSize]
const LAYOUT: [number, number, number, number][] = [
  [0.15, 1.2, 0.2, 2.3],
  [1.25, -0.05, -0.5, 2.0],
  [-1.0, -1.3, 0.4, 1.9],
];

/** Load a GLB, centre it, and scale its largest axis to `target` units (big). */
function Normalized({ src, target }: { src: string; target: number }) {
  const { scene } = useGLTF(src);
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { scale: target / (Math.max(size.x, size.y, size.z) || 1), offset: center };
  }, [scene, target]);
  return (
    <group scale={scale}>
      <group position={[-offset.x, -offset.y, -offset.z]}>
        <primitive object={scene} dispose={null} />
      </group>
    </group>
  );
}

/** The three pieces revolving slowly as a group, each floating on its own bob. */
function Cluster({ reduced }: { reduced: boolean }) {
  const orbit = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (orbit.current && !reduced) orbit.current.rotation.y += delta * 0.18;
  });
  return (
    <group ref={orbit}>
      {MODELS.map((src, i) => {
        const [x, y, z, target] = LAYOUT[i];
        return (
          <Float
            key={src}
            position={[x, y, z]}
            speed={reduced ? 0 : 1.3 + i * 0.35}
            rotationIntensity={reduced ? 0 : 0.7}
            floatIntensity={reduced ? 0 : 1.3}
            floatingRange={[-0.12, 0.12]}
          >
            <Normalized src={src} target={target} />
          </Float>
        );
      })}
    </group>
  );
}

class ClusterBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Hero showpiece: the three real Meshy jewelry models, big, floating and slowly
 * orbiting on the right of the hero. One WebGL context.
 */
export function HeroCluster({ reduced, className }: { reduced: boolean; className?: string }) {
  const fallback = (
    <div className={className}>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(48% 56% at 56% 50%, rgba(255,43,70,0.22), transparent 70%)" }}
      />
    </div>
  );

  return (
    <ClusterBoundary fallback={fallback}>
      <div className={className}>
        <Canvas
          camera={{ position: [0, 0, 9], fov: 42 }}
          dpr={[1, 1.8]}
          gl={{ antialias: true, alpha: true }}
          frameloop={reduced ? "demand" : "always"}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 6, 5]} intensity={2.2} />
          <directionalLight position={[-5, 2, -3]} intensity={0.7} color="#ff8a9a" />
          <pointLight position={[0, 1, 3]} intensity={3.2} color="#ff2b46" distance={14} />

          {/* in-memory studio env — metallic/gem reflections without a network HDR */}
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={2.2} position={[0, 3, 2]} scale={[7, 4, 1]} color="#fff4e8" />
            <Lightformer form="rect" intensity={1.5} position={[-4, 1, 1]} scale={[3, 5, 1]} color="#ffd9df" />
            <Lightformer form="ring" intensity={1.8} position={[3, 2, -2]} scale={3.5} color="#ff2b46" />
            <Lightformer form="rect" intensity={0.8} position={[0, -3, 1]} scale={[7, 2, 1]} color="#3a242a" />
          </Environment>

          <Suspense fallback={null}>
            <Cluster reduced={reduced} />
          </Suspense>
        </Canvas>
      </div>
    </ClusterBoundary>
  );
}
