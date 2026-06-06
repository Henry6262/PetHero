import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/assets/base_basic_shaded.glb";
useGLTF.preload(MODEL_URL);

// Side profile: player facing right, hoop swung to the left. Tweak to taste.
const ROTATION_Y = -Math.PI / 2;

/** The dunk, auto-centred + auto-scaled to a fixed size. Static (no motion). */
function Ball() {
  const { scene } = useGLTF(MODEL_URL);

  // Normalise the model: centre it on the origin and scale its largest
  // dimension to a known size, so framing is independent of the source units.
  const { scale, center } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const c = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(c);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { scale: 2.7 / maxDim, center: c };
  }, [scene]);

  return (
    <group scale={scale} rotation={[0, ROTATION_Y, 0]}>
      <group position={[-center.x, -center.y, -center.z]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

export function BasketBall3D({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        frameloop="demand"
      >
        {/* Self-contained lighting — no external HDR. */}
        <ambientLight intensity={0.75} />
        <hemisphereLight args={["#ffffff", "#0c0d10", 0.6]} />
        <directionalLight position={[4, 6, 5]} intensity={2.4} />
        <directionalLight position={[-5, 2, -4]} intensity={0.8} color="#c6ff2e" />
        <Suspense fallback={null}>
          <Ball />
        </Suspense>
      </Canvas>
    </div>
  );
}
