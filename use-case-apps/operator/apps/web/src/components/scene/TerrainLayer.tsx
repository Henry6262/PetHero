import { useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight, TERRAIN_SIZE } from "../../lib/terrain";

export default function TerrainLayer() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_SIZE.width,
      TERRAIN_SIZE.depth,
      160,
      110
    );
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = getTerrainHeight(x, z);
      positions.setY(i, y);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a3d42",
        roughness: 0.92,
        metalness: 0.0,
      }),
    []
  );

  return <mesh geometry={geometry} material={material} receiveShadow />;
}
