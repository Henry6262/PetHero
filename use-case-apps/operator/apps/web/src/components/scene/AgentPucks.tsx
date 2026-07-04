import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { buildAgents3D } from "../../lib/agents";
import type { Agent } from "../../data/sections";

export default function AgentPucks({ agents }: { agents: Agent[] }) {
  const agents3D = useMemo(() => buildAgents3D(agents), [agents]);
  const groundRef = useRef<THREE.InstancedMesh>(null);
  const aerialRef = useRef<THREE.InstancedMesh>(null);

  const groundGeom = useMemo(() => new THREE.CylinderGeometry(1.5, 1.5, 0.45, 24), []);
  const aerialGeom = useMemo(() => new THREE.SphereGeometry(1.3, 24, 24), []);
  const groundMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.2,
        fog: false,
      }),
    []
  );
  const aerialMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
        fog: false,
      }),
    []
  );

  useEffect(() => {
    const ground = groundRef.current;
    const aerial = aerialRef.current;
    if (!ground || !aerial) return;

    const groundAgents = agents3D.filter((a) => a.agent.icon !== "drone");
    const aerialAgents = agents3D.filter((a) => a.agent.icon === "drone");

    // Resize instance counts if needed (instanced mesh count is fixed at creation).
    // For simplicity we recreate geometry/material only; here we just set matrices/colors.
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    groundAgents.forEach((a, i) => {
      dummy.position.copy(a.position);
      dummy.rotation.set(0, a.heading, 0);
      dummy.updateMatrix();
      ground.setMatrixAt(i, dummy.matrix);
      ground.setColorAt(i, color.set(a.agent.accent));
    });

    aerialAgents.forEach((a, i) => {
      dummy.position.copy(a.position);
      dummy.rotation.set(0, a.heading, 0);
      dummy.updateMatrix();
      aerial.setMatrixAt(i, dummy.matrix);
      aerial.setColorAt(i, color.set(a.agent.accent));
    });

    ground.instanceMatrix.needsUpdate = true;
    if (ground.instanceColor) ground.instanceColor.needsUpdate = true;
    aerial.instanceMatrix.needsUpdate = true;
    if (aerial.instanceColor) aerial.instanceColor.needsUpdate = true;
  }, [agents3D]);

  const groundCount = agents3D.filter((a) => a.agent.icon !== "drone").length;
  const aerialCount = agents3D.filter((a) => a.agent.icon === "drone").length;

  return (
    <group>
      <instancedMesh ref={groundRef} args={[groundGeom, groundMat, groundCount]} castShadow receiveShadow />
      <instancedMesh ref={aerialRef} args={[aerialGeom, aerialMat, aerialCount]} castShadow receiveShadow />
      {agents3D.map((a) => (
        <Html key={a.id} position={[a.position.x, a.position.y + 2.0, a.position.z]} center distanceFactor={12}>
          <div className="agent-puck-label">{a.agent.id}</div>
        </Html>
      ))}
    </group>
  );
}
