import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { buildAgents3D } from "../../lib/agents";
import { getTerrainHeight } from "../../lib/terrain";
import type { Agent } from "../../types/data";

const PATH_VERTEX_SHADER = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PATH_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float dash = fract(vUv.x * 24.0 - uTime * 3.0);
    float alpha = smoothstep(0.0, 0.15, dash) * (1.0 - smoothstep(0.45, 0.6, dash));
    gl_FragColor = vec4(uColor, alpha * 0.9);
  }
`;

function ArrowHead({
  position,
  rotation,
  color,
}: {
  position: THREE.Vector3;
  rotation: number;
  color: THREE.Color;
}) {
  return (
    <mesh position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
      <coneGeometry args={[0.35, 0.9, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
}

function AgentPath({
  start,
  end,
  color,
  label,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: THREE.Color;
  label?: string;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { tubeGeometry, mid, angle } = useMemo(() => {
    const midHeight = (start.y + end.y) / 2 + 1.2;
    const mid = new THREE.Vector3(
      (start.x + end.x) / 2,
      midHeight,
      (start.z + end.z) / 2
    );
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const tubeGeometry = new THREE.TubeGeometry(curve, 48, 0.06, 8, false);
    const angle = Math.atan2(end.x - start.x, end.z - start.z);
    return { tubeGeometry, mid, angle };
  }, [start, end]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PATH_VERTEX_SHADER,
        fragmentShader: PATH_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: color },
        },
        transparent: true,
        depthWrite: false,
      }),
    [color]
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <>
      <mesh geometry={tubeGeometry} material={material} ref={(mesh) => {
        if (mesh) materialRef.current = mesh.material as THREE.ShaderMaterial;
      }} />
      <ArrowHead position={end} rotation={angle} color={color} />
      {label && (
        <Html position={[mid.x, mid.y + 0.8, mid.z]} center distanceFactor={14}>
          <div className="pointer-events-none whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {label}
          </div>
        </Html>
      )}
    </>
  );
}

export default function AgentPaths({ agents }: { agents: Agent[] }) {
  const agents3D = useMemo(() => buildAgents3D(agents), [agents]);

  const paths = useMemo(() => {
    return agents3D
      .filter((a) => a.agent.destination)
      .map((a) => {
        const dest = a.agent.destination!;
        const endY = a.agent.icon === "drone" ? 5.5 : getTerrainHeight(dest.x, dest.z) + 0.2;
        return {
          id: a.id,
          start: a.position,
          end: new THREE.Vector3(dest.x, endY, dest.z),
          color: new THREE.Color(a.agent.accent),
          label: dest.label,
        };
      });
  }, [agents3D]);

  return (
    <>
      {paths.map((p) => (
        <AgentPath key={p.id} start={p.start} end={p.end} color={p.color} label={p.label} />
      ))}
    </>
  );
}
