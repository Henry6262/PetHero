import { useMemo, useRef } from "react";
import * as THREE from "three";
import { buildAgents3D } from "../../lib/agents";
import type { Agent } from "../../types/data";

function ConeMesh({
  position,
  heading,
  accent,
  isDrone,
}: {
  position: THREE.Vector3;
  heading: number;
  accent: string;
  isDrone: boolean;
}) {
  const { geometry, material } = useMemo(() => {
    const range = isDrone ? 14 : 8;
    const angle = isDrone ? Math.PI / 3 : Math.PI / 4;
    const geometry = new THREE.ConeGeometry(range * Math.tan(angle / 2), range, 32, 1, true);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, range / 2);
    const material = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    return { geometry, material };
  }, [accent, isDrone]);

  return <mesh position={position} rotation={[0, heading, 0]} geometry={geometry} material={material} />;
}

export default function FOVCones({ agents, visible }: { agents: Agent[]; visible: boolean }) {
  const agents3D = useMemo(() => buildAgents3D(agents), [agents]);
  const groupRef = useRef<THREE.Group>(null);

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {agents3D.map((a) => (
        <ConeMesh
          key={a.id}
          position={a.position}
          heading={a.heading}
          accent={a.agent.accent}
          isDrone={a.agent.icon === "drone"}
        />
      ))}
    </group>
  );
}
