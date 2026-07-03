import { useMemo } from "react";
import * as THREE from "three";
import seedrandom from "seedrandom";
import { getTerrainHeight, getTerrainSlope, TERRAIN_SIZE } from "../../lib/terrain";
import { generateCells, cellWorldPosition } from "../../lib/hex";
import type { Building } from "../../data/sections";

const ROCK_COUNT = 200;
const ROCK_SEED = "operator-village-north-001-rocks";

function isStreetCell(col: number, row: number): boolean {
  return [2, 5, 8, 11, 14].includes(row) || [2, 6, 10, 14, 18].includes(col);
}

export default function RockLayer({ buildings }: { buildings: Building[] }) {
  const mesh = useMemo(() => {
    const rng = seedrandom(ROCK_SEED);
    const geometry = new THREE.DodecahedronGeometry(1, 0);
    const material = new THREE.MeshStandardMaterial({
      color: "#6b6560",
      roughness: 0.95,
      metalness: 0.05,
    });

    const rockMesh = new THREE.InstancedMesh(geometry, material, ROCK_COUNT);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;

    const cells = generateCells();
    const cellCenters = cells.map((c) => {
      const { x, z } = cellWorldPosition(c.col, c.row);
      return { col: c.col, row: c.row, x, z, street: isStreetCell(c.col, c.row) };
    });

    const buildingPositions = buildings.map((b) => {
      const { x, z } = cellWorldPosition(b.hexCol, b.hexRow);
      return { x, z };
    });

    const dummy = new THREE.Object3D();
    let placed = 0;
    let attempts = 0;
    const maxAttempts = ROCK_COUNT * 15;

    function nearestCellInfo(x: number, z: number) {
      let best = cellCenters[0];
      let bestDist = Infinity;
      for (const c of cellCenters) {
        const dx = c.x - x;
        const dz = c.z - z;
        const d = dx * dx + dz * dz;
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      return best;
    }

    while (placed < ROCK_COUNT && attempts < maxAttempts) {
      attempts++;

      const x = (rng() - 0.5) * TERRAIN_SIZE.width;
      const z = (rng() - 0.5) * TERRAIN_SIZE.depth;

      // Skip if outside the actual hex grid area (leave margin clear).
      const gridHalfW = TERRAIN_SIZE.width / 2 - 6;
      const gridHalfD = TERRAIN_SIZE.depth / 2 - 6;
      if (Math.abs(x) > gridHalfW || Math.abs(z) > gridHalfD) continue;

      // Skip streets.
      const nearest = nearestCellInfo(x, z);
      if (nearest.street) continue;

      // Skip near buildings.
      let nearBuilding = false;
      for (const bp of buildingPositions) {
        const dx = bp.x - x;
        const dz = bp.z - z;
        if (dx * dx + dz * dz < 9) {
          nearBuilding = true;
          break;
        }
      }
      if (nearBuilding) continue;

      const terrainY = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      // Rocks prefer elevated/slope areas; skip very flat ground most of the time.
      if (slope < 2 && rng() > 0.2) continue;

      const baseScale = 0.3 + rng() * 0.7;
      const slopeBonus = Math.min(slope / 20, 0.5);
      const scale = baseScale * (1 + slopeBonus);

      dummy.position.set(x, terrainY + scale * 0.3, z);
      dummy.rotation.set(rng() * Math.PI, rng() * Math.PI * 2, rng() * Math.PI * 0.3);
      dummy.scale.set(scale, scale * (0.6 + rng() * 0.4), scale);
      dummy.updateMatrix();

      rockMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    rockMesh.instanceMatrix.needsUpdate = true;
    return rockMesh;
  }, [buildings]);

  return <primitive object={mesh} />;
}
