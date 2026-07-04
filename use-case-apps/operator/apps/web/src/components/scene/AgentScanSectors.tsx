import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { buildAgents3D } from "../../lib/agents";
import { getTerrainHeight } from "../../lib/terrain";
import type { Agent } from "../../data/sections";

const SCAN_VERTEX_SHADER = `
  varying float vDist;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vDist = position.y; // reused as normalized radius in geometry
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SCAN_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uRadius;
  varying float vDist;

  void main() {
    float radial = 1.0 - smoothstep(0.0, 1.0, vDist);
    float scanLine = smoothstep(0.7, 0.75, fract(vDist * 3.0 - uTime * 0.8));
    float alpha = radial * (0.15 + scanLine * 0.25) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function createSectorGeometry(
  origin: THREE.Vector3,
  heading: number,
  radius: number,
  angle: number,
  radialSegments: number,
  arcSegments: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfAngle = angle / 2;

  for (let r = 0; r <= radialSegments; r++) {
    const t = r / radialSegments;
    const dist = t * radius;
    for (let a = 0; a <= arcSegments; a++) {
      const theta = -halfAngle + (a / arcSegments) * angle;
      const worldTheta = heading + theta;
      const lx = Math.sin(worldTheta) * dist;
      const lz = Math.cos(worldTheta) * dist;
      const wx = origin.x + lx;
      const wz = origin.z + lz;
      const wy = getTerrainHeight(wx, wz) + 0.12;

      positions.push(wx, wy, wz);
      uvs.push(t, a / arcSegments);
    }
  }

  const cols = arcSegments + 1;
  for (let r = 0; r < radialSegments; r++) {
    for (let a = 0; a < arcSegments; a++) {
      const i0 = r * cols + a;
      const i1 = i0 + 1;
      const i2 = i0 + cols;
      const i3 = i2 + 1;
      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

export default function AgentScanSectors({ agents, visible }: { agents: Agent[]; visible: boolean }) {
  const agents3D = useMemo(() => buildAgents3D(agents), [agents]);
  const materialRef = useRef(
    new THREE.ShaderMaterial({
      vertexShader: SCAN_VERTEX_SHADER,
      fragmentShader: SCAN_FRAGMENT_SHADER,
      uniforms: {
        uColor: { value: new THREE.Color(0xffffff) },
        uOpacity: { value: 1.0 },
        uTime: { value: 0 },
        uRadius: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );

  useFrame(({ clock }) => {
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  if (!visible) return null;

  return (
    <group>
      {agents3D.map((a) => {
        const isDrone = a.agent.icon === "drone";
        const radius = isDrone ? 14 : 8;
        const angle = isDrone ? Math.PI / 3 : Math.PI / 4;
        const geometry = createSectorGeometry(a.position, a.heading, radius, angle, 16, 24);
        const material = materialRef.current.clone();
        material.uniforms.uColor.value = new THREE.Color(a.agent.accent);
        material.uniforms.uOpacity.value = isDrone ? 0.7 : 1.0;
        material.uniforms.uRadius.value = radius;
        return <mesh key={a.id} geometry={geometry} material={material} />;
      })}
    </group>
  );
}
