import { useMemo, useRef } from "react";
import * as THREE from "three";
import { buildAgents3D } from "../../lib/agents";
import type { Agent } from "../../data/sections";

export default function FOVCones({ agents, visible }: { agents: Agent[]; visible: boolean }) {
  const agents3D = useMemo(() => buildAgents3D(agents), [agents]);
  const groupRef = useRef<THREE.Group>(null);

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {agents3D.map((a) => {
        const range = a.agent.icon === "drone" ? 14 : 8;
        const angle = a.agent.icon === "drone" ? Math.PI / 3 : Math.PI / 4;
        const geometry = new THREE.ConeGeometry(range * Math.tan(angle / 2), range, 32, 1, true);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, 0, range / 2);
        const material = new THREE.MeshBasicMaterial({
          color: a.agent.accent,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        return (
          <mesh
            key={a.id}
            position={a.position}
            rotation={[0, a.heading, 0]}
            geometry={geometry}
            material={material}
          />
        );
      })}
    </group>
  );
}
