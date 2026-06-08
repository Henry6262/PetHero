import { useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Piece, PieceKind } from "@app/data/pieces";

const SPIN_SPEED = 0.35;

/** Polished gold for settings, bands and bails. */
function Gold(props: ThreeElements["meshStandardMaterial"]) {
  return <meshStandardMaterial color="#c9a24b" metalness={1} roughness={0.26} {...props} />;
}

/** A faceted, lightly translucent ruby. `color` tints it per piece. */
function Ruby({ color }: { color: string }) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={0}
      roughness={0.05}
      transmission={0.4}
      thickness={1.3}
      ior={1.77}
      clearcoat={1}
      clearcoatRoughness={0.12}
      emissive={color}
      emissiveIntensity={0.18}
      attenuationColor={color}
      attenuationDistance={1.8}
      flatShading
    />
  );
}

/** A single faceted stone (squashed octahedron = brilliant-ish bipyramid). */
function Stone({ r = 0.5, elongate = 1.25, color }: { r?: number; elongate?: number; color: string }) {
  return (
    <mesh scale={[1, elongate, 1]} castShadow>
      <octahedronGeometry args={[r, 0]} />
      <Ruby color={color} />
    </mesh>
  );
}

/** A gold ring band lying flat, opening downward. */
function Band({ radius = 0.62, tube = 0.1 }: { radius?: number; tube?: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.52, 0]}>
      <torusGeometry args={[radius, tube, 24, 80]} />
      <Gold />
    </mesh>
  );
}

/** Procedural placeholder jewelry, distinct per kind. Swapped for Meshy GLBs later. */
function ProceduralPiece({ kind, color }: { kind: PieceKind; color: string }) {
  switch (kind) {
    case "solitaire":
      return (
        <group>
          <Band />
          <group position={[0, 0.28, 0]}>
            <Stone r={0.58} elongate={1.3} color={color} />
          </group>
        </group>
      );
    case "ring":
      // pavé band — a row of small stones across the crown
      return (
        <group>
          <Band radius={0.64} tube={0.12} />
          <group position={[0, 0.18, 0.62]}>
            {[-0.34, -0.17, 0, 0.17, 0.34].map((x, idx) => (
              <group key={x} position={[x, Math.abs(x) * -0.12, 0]}>
                <Stone r={0.13 - Math.abs(x) * 0.06} elongate={1.1} color={color} />
              </group>
            ))}
          </group>
        </group>
      );
    case "pendant":
      return (
        <group>
          {/* bail */}
          <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.035, 16, 48]} />
            <Gold />
          </mesh>
          {/* pear drop: crown sphere + pavilion cone */}
          <group position={[0, 0.05, 0]}>
            <mesh position={[0, 0.18, 0]}>
              <sphereGeometry args={[0.34, 32, 24]} />
              <Ruby color={color} />
            </mesh>
            <mesh position={[0, -0.28, 0]}>
              <coneGeometry args={[0.34, 0.62, 24]} />
              <Ruby color={color} />
            </mesh>
          </group>
        </group>
      );
    case "studs":
      return (
        <group>
          {[-0.55, 0.55].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <Stone r={0.42} elongate={1.15} color={color} />
              {/* gold martini setting underneath */}
              <mesh position={[0, -0.34, 0]}>
                <coneGeometry args={[0.34, 0.34, 12]} />
                <Gold roughness={0.32} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "cuff":
      return (
        <group>
          {/* open arc cuff */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.78, 0.14, 24, 64, Math.PI * 1.4]} />
            <Gold roughness={0.34} />
          </mesh>
          {/* cabochon */}
          <mesh position={[0, 0.16, 0.78]} scale={[1, 0.6, 1]}>
            <sphereGeometry args={[0.34, 32, 24]} />
            <Ruby color={color} />
          </mesh>
        </group>
      );
    default:
      return <Stone color={color} />;
  }
}

/** GLB loader path: auto-centre + auto-scale so framing is source-independent. */
function GlbPiece({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  const fit = useMemo(() => {
    const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    return 2 / (Math.max(size.x, size.y, size.z) || 1);
  }, [scene]);
  return (
    <group scale={fit}>
      <Center>
        <primitive object={scene} dispose={null} />
      </Center>
    </group>
  );
}

/**
 * One jewelry piece on a slow turntable. Renders a Meshy GLB when the piece has
 * a `model`, otherwise a procedural ruby placeholder so the stage is always live.
 */
export function JewelryModel({ piece, reduced }: { piece: Piece; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current && !reduced) group.current.rotation.y += delta * SPIN_SPEED;
  });

  return (
    <group ref={group}>
      <Center>
        {piece.model ? <GlbPiece src={piece.model} /> : <ProceduralPiece kind={piece.kind} color={piece.glow} />}
      </Center>
    </group>
  );
}
