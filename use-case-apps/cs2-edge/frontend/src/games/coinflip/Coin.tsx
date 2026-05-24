import { useRef, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

export interface CoinHandle {
  playFlip: (winsideCT: boolean) => Promise<void>;
}

interface CoinProps {
  idleSpin?: boolean;
}

export const Coin = forwardRef<CoinHandle, CoinProps>(function Coin({ idleSpin = true }, ref) {
  const groupRef = useRef<THREE.Group>(null!);
  const isFlipping = useRef(false);

  // Idle spin via useFrame
  useFrame((_, delta) => {
    if (!groupRef.current || isFlipping.current) return;
    if (idleSpin) {
      groupRef.current.rotation.y += delta * 0.8;
    }
  });

  useImperativeHandle(ref, () => ({
    playFlip(winsideCT: boolean): Promise<void> {
      return new Promise((resolve) => {
        if (!groupRef.current) { resolve(); return; }
        isFlipping.current = true;

        // target X rotation: 0 = CT face up, Math.PI = T face up
        const targetX = winsideCT ? 0 : Math.PI;

        const tl = gsap.timeline({
          onComplete: () => {
            isFlipping.current = false;
            resolve();
          },
        });

        // Phase 1: arc up
        tl.to(groupRef.current.position, { y: 2.5, duration: 0.35, ease: "power2.out" });
        // Phase 2: arc down (overlapping)
        tl.to(groupRef.current.position, { y: 0, duration: 0.35, ease: "power2.in" }, 0.35);
        // Phase 3: rapid X spin during air (full arc)
        tl.to(groupRef.current.rotation, { x: Math.PI * 14, duration: 0.7, ease: "none" }, 0);
        // Phase 4: slow land on correct face
        tl.to(groupRef.current.rotation, {
          x: Math.PI * 14 + targetX, // preserve full rotation count + land angle
          duration: 0.6,
          ease: "power4.out",
        }, 0.7);
      });
    },
  }));

  return (
    <group ref={groupRef}>
      {/* Coin body */}
      <mesh castShadow>
        <cylinderGeometry args={[1, 1, 0.12, 64]} />
        <meshStandardMaterial color="#d4a017" metalness={1} roughness={0.08} toneMapped={false} />
      </mesh>
      {/* CT face (top, y+ = visible when x=0) */}
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 64]} />
        <meshStandardMaterial color="#c8a600" metalness={0.9} roughness={0.15} toneMapped={false} />
      </mesh>
      {/* T face (bottom, y- = visible when x=PI) */}
      <mesh position={[0, -0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 64]} />
        <meshStandardMaterial color="#8b4513" metalness={0.9} roughness={0.15} toneMapped={false} />
      </mesh>
    </group>
  );
});
