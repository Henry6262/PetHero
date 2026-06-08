import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import type { Piece } from "@app/data/pieces";
import { JewelryModel } from "@app/components/JewelryModel";

/** Catches a WebGL/3D failure and shows a static poster instead of a blank box. */
class StageBoundary extends React.Component<
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
 * The lit 3D stage shared by the hero and the collection carousel. An in-memory
 * Lightformer environment (no network HDR) gives the gold + ruby real
 * reflections; a ruby key light pools colour under the piece.
 */
export function JewelryStage({
  piece,
  reduced,
  glow,
  className,
}: {
  piece: Piece;
  reduced: boolean;
  glow: string;
  className?: string;
}) {
  const fallback = (
    <div className={className}>
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(46% 56% at 50% 46%, ${glow}33, transparent 70%)` }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-2xl italic text-silver/70">{piece.name}</span>
      </div>
    </div>
  );

  return (
    <StageBoundary fallback={fallback}>
      <div className={className}>
        <Canvas
          camera={{ position: [0, 0.4, 4.6], fov: 34 }}
          dpr={[1, 1.8]}
          gl={{ antialias: true, alpha: true }}
          frameloop={reduced ? "demand" : "always"}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[4, 6, 5]} intensity={2.1} />
          <directionalLight position={[-5, 2, -3]} intensity={0.7} color="#ff8a9a" />
          <pointLight position={[0, 1.4, 2.4]} intensity={3} color={glow} distance={10} />

          {/* in-memory studio env — metallic reflections without a network HDR */}
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={2.2} position={[0, 3, 2]} scale={[6, 3, 1]} color="#fff4e8" />
            <Lightformer form="rect" intensity={1.4} position={[-4, 1, 1]} scale={[3, 4, 1]} color="#ffd9df" />
            <Lightformer form="ring" intensity={1.6} position={[3, 2, -2]} scale={3} color={glow} />
            <Lightformer form="rect" intensity={0.8} position={[0, -2, 1]} scale={[6, 2, 1]} color="#3a242a" />
          </Environment>

          <Suspense fallback={null}>
            <group position={[0, 0.15, 0]}>
              <JewelryModel key={piece.id} piece={piece} reduced={reduced} />
            </group>
            <ContactShadows position={[0, -1.15, 0]} opacity={0.5} scale={7} blur={2.8} far={3} color="#000000" />
          </Suspense>
        </Canvas>
      </div>
    </StageBoundary>
  );
}
