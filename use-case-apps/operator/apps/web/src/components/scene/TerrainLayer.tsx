import { useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight, getTerrainSlope, TERRAIN_SIZE } from "../../lib/terrain";

const SEGMENTS_X = 120;
const SEGMENTS_Z = 88;

function terrainColor(height: number, slope: number): THREE.Color {
  // Low, flat ground — grassy green.
  if (height < 1.2 && slope < 12) return new THREE.Color("#3d7a4f");
  // Mid elevation / gentle slope — olive/brown-green.
  if (height < 2.5 && slope < 20) return new THREE.Color("#4a6b45");
  // Steep slopes — earthy brown / rock.
  if (slope >= 20) return new THREE.Color("#6b5d4d");
  // High ground — darker rocky green.
  return new THREE.Color("#3e4d3f");
}

export default function TerrainLayer() {
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

    // Sample height on a slightly finer grid for normal estimation.
    function sampleHeight(x: number, z: number) {
      return getTerrainHeight(x, z);
    }

    // Build vertex grid.
    for (let iz = 0; iz <= SEGMENTS_Z; iz++) {
      for (let ix = 0; ix <= SEGMENTS_X; ix++) {
        const x = -halfW + ix * segW;
        const z = -halfD + iz * segD;
        const y = sampleHeight(x, z);
        positions.push(x, y, z);

        const slope = getTerrainSlope(x, z);
        const color = terrainColor(y, slope);
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

        const left = ix > 0 ? new THREE.Vector3(
          -segW,
          sampleHeight(x - segW, z) - y,
          0
        ) : new THREE.Vector3(-segW, 0, 0);
        const right = ix < SEGMENTS_X ? new THREE.Vector3(
          segW,
          sampleHeight(x + segW, z) - y,
          0
        ) : new THREE.Vector3(segW, 0, 0);
        const up = iz > 0 ? new THREE.Vector3(
          0,
          sampleHeight(x, z - segD) - y,
          -segD
        ) : new THREE.Vector3(0, 0, -segD);
        const down = iz < SEGMENTS_Z ? new THREE.Vector3(
          0,
          sampleHeight(x, z + segD) - y,
          segD
        ) : new THREE.Vector3(0, 0, segD);

        const n1 = new THREE.Vector3().crossVectors(right, up).normalize();
        const n2 = new THREE.Vector3().crossVectors(up, left).normalize();
        const n3 = new THREE.Vector3().crossVectors(left, down).normalize();
        const n4 = new THREE.Vector3().crossVectors(down, right).normalize();

        const normal = new THREE.Vector3()
          .addVectors(n1, n2)
          .add(n3)
          .add(n4)
          .normalize();
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
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        metalness: 0.0,
      }),
    []
  );

  return <mesh geometry={geometry} material={material} receiveShadow />;
}
