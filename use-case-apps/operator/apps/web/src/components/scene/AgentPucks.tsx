import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { buildAgents3D } from "../../lib/agents";
import type { Agent } from "../../data/sections";

function GroundAgent({
  position,
  rotation,
  accent,
  name,
}: {
  position: THREE.Vector3;
  rotation: number;
  accent: string;
  name: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const color = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame(({ clock }) => {
    // Subtle idle breathing animation.
    if (groupRef.current) {
      groupRef.current.position.y = position.y + Math.sin(clock.getElapsedTime() * 2 + position.x) * 0.015;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[0, rotation, 0]}
    >
      {/* Body */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.95, 4, 8]} />
        <meshStandardMaterial color="#3a3f47" roughness={0.8} metalness={0.1} fog={false} />
      </mesh>
      {/* Vest / accent */}
      <mesh position={[0, 0.78, 0.05]} castShadow>
        <boxGeometry args={[0.52, 0.55, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} fog={false} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#d4c5b0" roughness={0.6} fog={false} />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 1.48, 0]} castShadow>
        <sphereGeometry args={[0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#2b3038" roughness={0.7} fog={false} />
      </mesh>
      {/* Weapon */}
      <mesh position={[0.22, 0.55, 0.35]} rotation={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.65]} />
        <meshStandardMaterial color="#1f2329" roughness={0.6} metalness={0.3} fog={false} />
      </mesh>
      {/* Backpack */}
      <mesh position={[0, 0.8, -0.25]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.18]} />
        <meshStandardMaterial color="#2b3038" roughness={0.85} fog={false} />
      </mesh>
      <Html position={[0, 1.9, 0]} center distanceFactor={12}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {name}
        </div>
      </Html>
    </group>
  );
}

function DroneAgent({
  position,
  rotation,
  accent,
  name,
}: {
  position: THREE.Vector3;
  rotation: number;
  accent: string;
  name: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const rotorRefs = useRef<THREE.Mesh[]>([]);
  const color = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame(({ clock }) => {
    const speed = 20;
    rotorRefs.current.forEach((rotor) => {
      if (rotor) rotor.rotation.y = clock.getElapsedTime() * speed;
    });
    // Hover bob.
    if (groupRef.current) {
      groupRef.current.position.y = position.y + Math.sin(clock.getElapsedTime() * 3) * 0.08;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[0, rotation, 0]}
    >
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.18, 0.75]} />
        <meshStandardMaterial color="#2b3038" roughness={0.5} metalness={0.3} fog={false} />
      </mesh>
      {/* Accent stripe */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.57, 0.06, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} fog={false} />
      </mesh>
      {/* Camera gimbal */}
      <mesh position={[0, -0.18, 0.22]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.6} fog={false} />
      </mesh>
      {/* Rotors */}
      {[
        [-0.35, 0.08, -0.35],
        [0.35, 0.08, -0.35],
        [-0.35, 0.08, 0.35],
        [0.35, 0.08, 0.35],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
            <meshStandardMaterial color="#3a3f47" fog={false} />
          </mesh>
          <mesh
            ref={(el) => {
              if (el) rotorRefs.current[i] = el;
            }}
            position={[0, 0.1, 0]}
            castShadow
          >
            <boxGeometry args={[0.55, 0.02, 0.06]} />
            <meshStandardMaterial color="#1a1d23" transparent opacity={0.8} fog={false} />
          </mesh>
        </group>
      ))}
      <Html position={[0, 0.7, 0]} center distanceFactor={12}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {name}
        </div>
      </Html>
    </group>
  );
}

export default function AgentPucks({ agents }: { agents: Agent[] }) {
  const agents3D = useMemo(() => buildAgents3D(agents), [agents]);

  return (
    <>
      {agents3D.map((a) =>
        a.agent.icon === "drone" ? (
          <DroneAgent
            key={a.id}
            position={a.position}
            rotation={a.heading}
            accent={a.agent.accent}
            name={a.agent.name}
          />
        ) : (
          <GroundAgent
            key={a.id}
            position={a.position}
            rotation={a.heading}
            accent={a.agent.accent}
            name={a.agent.name}
          />
        )
      )}
    </>
  );
}
