import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getTerrainSource, TERRAIN_SIZE } from "../../lib/terrain";

const SEGMENTS_X = 120;
const SEGMENTS_Z = 88;

export default function TerrainLayer() {
  const source = getTerrainSource();

  const geometry = useMemo(() => {
    const width = TERRAIN_SIZE.width;
    const depth = TERRAIN_SIZE.depth;
    const halfW = width / 2;
    const halfD = depth / 2;
    const segW = width / SEGMENTS_X;
    const segD = depth / SEGMENTS_Z;

    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    // Build vertex grid.
    for (let iz = 0; iz <= SEGMENTS_Z; iz++) {
      for (let ix = 0; ix <= SEGMENTS_X; ix++) {
        const x = -halfW + ix * segW;
        const z = -halfD + iz * segD;
        const y = source.getHeight(x, z);
        positions.push(x, y, z);

        const slope = source.getSlope(x, z);
        const color = source.sampleColor ? source.sampleColor(y, slope) : new THREE.Color("#3d8c5f");
        colors.push(color.r, color.g, color.b);
      }
    }

    // Compute normals via cross product of adjacent edges.
    for (let iz = 0; iz <= SEGMENTS_Z; iz++) {
      for (let ix = 0; ix <= SEGMENTS_X; ix++) {
        const idx = iz * (SEGMENTS_X + 1) + ix;
        const x = positions[idx * 3];
        const y = positions[idx * 3 + 1];
        const z = positions[idx * 3 + 2];

        const left = ix > 0
          ? new THREE.Vector3(-segW, source.getHeight(x - segW, z) - y, 0)
          : new THREE.Vector3(-segW, 0, 0);
        const right = ix < SEGMENTS_X
          ? new THREE.Vector3(segW, source.getHeight(x + segW, z) - y, 0)
          : new THREE.Vector3(segW, 0, 0);
        const up = iz > 0
          ? new THREE.Vector3(0, source.getHeight(x, z - segD) - y, -segD)
          : new THREE.Vector3(0, 0, -segD);
        const down = iz < SEGMENTS_Z
          ? new THREE.Vector3(0, source.getHeight(x, z + segD) - y, segD)
          : new THREE.Vector3(0, 0, segD);

        const n1 = new THREE.Vector3().crossVectors(right, up).normalize();
        const n2 = new THREE.Vector3().crossVectors(up, left).normalize();
        const n3 = new THREE.Vector3().crossVectors(left, down).normalize();
        const n4 = new THREE.Vector3().crossVectors(down, right).normalize();

        const normal = new THREE.Vector3().addVectors(n1, n2).add(n3).add(n4).normalize();
        normals.push(normal.x, normal.y, normal.z);
      }
    }

    // Build indices for triangle strips.
    for (let iz = 0; iz < SEGMENTS_Z; iz++) {
      for (let ix = 0; ix < SEGMENTS_X; ix++) {
        const a = iz * (SEGMENTS_X + 1) + ix;
        const b = a + 1;
        const c = a + (SEGMENTS_X + 1);
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    geom.computeBoundingSphere();
    return geom;
  }, [source]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        metalness: 0.0,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} receiveShadow />;
}
