import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { buildAgents3D } from "../../lib/agents";
import type { Agent } from "../../data/sections";

function addOutline(geometry: THREE.BufferGeometry, color: THREE.Color): THREE.LineSegments {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    })
  );
}

function HumanAgent({
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
  const scale = 1.5;

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = position.y + Math.sin(clock.getElapsedTime() * 2 + position.x) * 0.02;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[0, rotation, 0]}
      scale={[scale, scale, scale]}
    >
      {/* Legs */}
      <mesh position={[-0.12, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.7, 4, 8]} />
        <meshStandardMaterial color="#2b3038" roughness={0.85} metalness={0.1} fog={false} />
      </mesh>
      <mesh position={[0.12, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.7, 4, 8]} />
        <meshStandardMaterial color="#2b3038" roughness={0.85} metalness={0.1} fog={false} />
      </mesh>

      {/* Boots */}
      <mesh position={[-0.12, 0.06, 0.04]} castShadow>
        <boxGeometry args={[0.16, 0.12, 0.28]} />
        <meshStandardMaterial color="#1f2329" roughness={0.9} fog={false} />
      </mesh>
      <mesh position={[0.12, 0.06, 0.04]} castShadow>
        <boxGeometry args={[0.16, 0.12, 0.28]} />
        <meshStandardMaterial color="#1f2329" roughness={0.9} fog={false} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.42, 0.55, 0.28]} />
        <meshStandardMaterial color="#3a3f47" roughness={0.8} metalness={0.1} fog={false} />
      </mesh>

      {/* Vest / accent */}
      <mesh position={[0, 0.95, 0.04]} castShadow>
        <boxGeometry args={[0.46, 0.45, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} fog={false} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.28, 0.9, 0]} rotation={[0, 0, 0.08]} castShadow>
        <capsuleGeometry args={[0.07, 0.48, 4, 8]} />
        <meshStandardMaterial color="#3a3f47" roughness={0.8} fog={false} />
      </mesh>
      <mesh position={[0.28, 0.9, 0]} rotation={[0, 0, -0.08]} castShadow>
        <capsuleGeometry args={[0.07, 0.48, 4, 8]} />
        <meshStandardMaterial color="#3a3f47" roughness={0.8} fog={false} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#d4c5b0" roughness={0.6} fog={false} />
      </mesh>

      {/* Helmet */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#2b3038" roughness={0.7} fog={false} />
      </mesh>

      {/* Weapon */}
      <mesh position={[0.15, 0.7, 0.32]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.07, 0.12, 0.7]} />
        <meshStandardMaterial color="#1f2329" roughness={0.6} metalness={0.3} fog={false} />
      </mesh>

      {/* Backpack */}
      <mesh position={[0, 0.95, -0.18]} castShadow>
        <boxGeometry args={[0.32, 0.42, 0.14]} />
        <meshStandardMaterial color="#2b3038" roughness={0.85} fog={false} />
      </mesh>

      {/* Outline — approximate bounding box */}
      <primitive
        object={addOutline(new THREE.BoxGeometry(0.62, 1.7, 0.45), color)}
        position={[0, 0.86, 0.02]}
      />

      <Html position={[0, 1.95, 0]} center distanceFactor={12}>
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
    if (groupRef.current) {
      groupRef.current.position.y = position.y + Math.sin(clock.getElapsedTime() * 3) * 0.08;
    }
  });

  const s = 1.5; // scale factor

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[0, rotation, 0]}
    >
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.55 * s, 0.18 * s, 0.75 * s]} />
        <meshStandardMaterial color="#2b3038" roughness={0.5} metalness={0.3} fog={false} />
      </mesh>
      <primitive object={addOutline(new THREE.BoxGeometry(0.55 * s, 0.18 * s, 0.75 * s), color)} />

      {/* Accent stripe */}
      <mesh position={[0, 0.02 * s, 0]} castShadow>
        <boxGeometry args={[0.57 * s, 0.06 * s, 0.45 * s]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} fog={false} />
      </mesh>

      {/* Camera gimbal */}
      <mesh position={[0, -0.18 * s, 0.22 * s]} castShadow>
        <sphereGeometry args={[0.12 * s, 16, 16]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.6} fog={false} />
      </mesh>

      {/* Rotors */}
      {[
        [-0.35 * s, 0.08 * s, -0.35 * s],
        [0.35 * s, 0.08 * s, -0.35 * s],
        [-0.35 * s, 0.08 * s, 0.35 * s],
        [0.35 * s, 0.08 * s, 0.35 * s],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 0.04 * s, 0]} castShadow>
            <cylinderGeometry args={[0.04 * s, 0.04 * s, 0.08 * s, 8]} />
            <meshStandardMaterial color="#3a3f47" fog={false} />
          </mesh>
          <mesh
            ref={(el) => {
              if (el) rotorRefs.current[i] = el;
            }}
            position={[0, 0.1 * s, 0]}
            castShadow
          >
            <boxGeometry args={[0.55 * s, 0.02 * s, 0.06 * s]} />
            <meshStandardMaterial color="#1a1d23" transparent opacity={0.8} fog={false} />
          </mesh>
          <primitive
            object={addOutline(new THREE.BoxGeometry(0.55 * s, 0.02 * s, 0.06 * s), color)}
            position={[0, 0.1 * s, 0]}
          />
        </group>
      ))}

      <Html position={[0, 0.7 * s, 0]} center distanceFactor={12}>
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
          <HumanAgent
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
