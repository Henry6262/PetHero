import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { buildRouteCurve } from "../../lib/route";

const ROUTE_VERTEX_SHADER = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ROUTE_FRAGMENT_SHADER = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float dash = fract(vUv.x * 40.0 - uTime * 2.5);
    float alpha = smoothstep(0.0, 0.15, dash) * (1.0 - smoothstep(0.45, 0.6, dash));
    vec3 color = vec3(0.373, 0.698, 1.0); // #5fb2ff
    gl_FragColor = vec4(color, alpha * 0.9);
  }
`;

export default function RouteLines() {
  const curve = useMemo(() => buildRouteCurve(), []);
  const geometry = useMemo(() => {
    const tube = new THREE.TubeGeometry(curve, 120, 0.12, 8, false);
    return tube;
  }, [curve]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ROUTE_VERTEX_SHADER,
        fragmentShader: ROUTE_FRAGMENT_SHADER,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return <mesh geometry={geometry} material={material} />;
}
