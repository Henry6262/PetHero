import { useMemo } from "react";
import * as THREE from "three";
import { TERRAIN_SIZE } from "../../lib/terrain";

/**
 * Placeholder base map layer for drone-derived orthomosaic + DEM.
 *
 * In the real implementation this component will load tile textures and a
 * heightmap/displacement map produced by the video-to-map pipeline. For now it
 * renders a flat reference plane so the dashboard layer switcher has a target
 * to exercise.
 */
export default function DroneMapLayer() {
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(TERRAIN_SIZE.width, TERRAIN_SIZE.depth, 1, 1).rotateX(-Math.PI / 2);
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a2330",
        roughness: 0.9,
        metalness: 0.0,
        transparent: true,
        opacity: 0.6,
      }),
    []
  );

  return <mesh geometry={geometry} material={material} receiveShadow />;
}
