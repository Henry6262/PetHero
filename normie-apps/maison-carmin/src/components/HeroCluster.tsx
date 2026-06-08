import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, Lightformer, Sparkles, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODELS = [
  "/models/pieces/jewel-01.glb",
  "/models/pieces/jewel-02.glb",
  "/models/pieces/jewel-03.glb",
];
MODELS.forEach((m) => useGLTF.preload(m));

// All three clustered close together — a tight triangle. [x, y, z, targetSize]
const LAYOUT: [number, number, number, number][] = [
  [-0.62, 0.5, 0.15, 1.95],
  [0.66, 0.2, -0.3, 1.85],
  [0.02, -0.62, 0.35, 1.9],
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

/**
 * The three pieces clustered close together, each floating gently up and down on
 * its own slow bob (no spin, no camera/group rotation).
 */
function Cluster({ reduced }: { reduced: boolean }) {
  return (
    <group>
      {MODELS.map((src, i) => {
        const [x, y, z, target] = LAYOUT[i];
        return (
          <Float
            key={src}
            position={[x, y, z]}
            speed={reduced ? 0 : 0.8 + i * 0.12}
            rotationIntensity={0}
            floatIntensity={reduced ? 0 : 1}
            floatingRange={[-0.18, 0.18]}
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
          camera={{ position: [0, 0, 7.8], fov: 40 }}
          dpr={[1, 1.8]}
          gl={{ antialias: true, alpha: true }}
          frameloop={reduced ? "demand" : "always"}
        >
          <ambientLight intensity={0.4} />
          {/* warm key light from upper-front, soft-edged */}
          <spotLight
            position={[4, 6, 6]}
            angle={0.5}
            penumbra={0.8}
            intensity={45}
            distance={22}
            color="#fff2e2"
          />
          {/* ruby fill from the front */}
          <pointLight position={[0, 0.5, 3.5]} intensity={3.4} color="#ff2b46" distance={14} />
          {/* gold rim from behind-right */}
          <pointLight position={[3.5, 1.5, -3]} intensity={2.6} color="#ffcf7a" distance={16} />
          {/* cool rose fill from behind-left for separation */}
          <directionalLight position={[-5, 2, -3]} intensity={0.8} color="#ff8a9a" />

          {/* in-memory studio env — metallic/gem reflections without a network HDR */}
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={2.4} position={[0, 3, 2]} scale={[8, 4, 1]} color="#fff4e8" />
            <Lightformer form="rect" intensity={1.6} position={[-4, 1, 1]} scale={[3, 6, 1]} color="#ffd9df" />
            <Lightformer form="ring" intensity={2} position={[3, 2, -2]} scale={4} color="#ff2b46" />
            <Lightformer form="circle" intensity={1.4} position={[2, -1, 2]} scale={2.5} color="#ffcf7a" />
            <Lightformer form="rect" intensity={0.8} position={[0, -3, 1]} scale={[8, 2, 1]} color="#3a242a" />
          </Environment>

          {/* slow floating glints around the pieces — gold + ruby ambiance */}
          <Sparkles count={40} scale={[5, 5, 3]} size={3} speed={0.3} opacity={0.6} color="#ffcf7a" />
          <Sparkles count={24} scale={[4.5, 4.5, 2.5]} size={2} speed={0.25} opacity={0.5} color="#ff8a9a" />

          <Suspense fallback={null}>
            <Cluster reduced={reduced} />
          </Suspense>
        </Canvas>
      </div>
    </ClusterBoundary>
  );
}
