import { useMemo } from "react";
import * as THREE from "three";
import seedrandom from "seedrandom";
import { getTerrainHeight, getTerrainSlope, TERRAIN_SIZE } from "../../lib/terrain";
import { generateCells, cellWorldPosition } from "../../lib/hex";
import { buildChunks } from "../../lib/chunks";
import type { Building } from "../../data/sections";
import { useVisibleChunks } from "./ChunkVisibility";

const ROCK_COUNT = 400;
const ROCK_SEED = "operator-village-north-001-rocks";

function isStreetCell(col: number, row: number): boolean {
  return [2, 5, 8, 11, 14, 17, 20].includes(row) || [2, 6, 10, 14, 18, 22, 26, 30].includes(col);
}

export default function RockLayer({ buildings }: { buildings: Building[] }) {
  const visibleChunks = useVisibleChunks();

  const cells = useMemo(() => generateCells(), []);
  const chunks = useMemo(() => buildChunks(cells, buildings), [cells, buildings]);

  const chunkRocks = useMemo(() => {
    const rng = seedrandom(ROCK_SEED);
    const cellCenters = cells.map((c) => {
      const { x, z } = cellWorldPosition(c.col, c.row);
      return { col: c.col, row: c.row, x, z, street: isStreetCell(c.col, c.row) };
    });

    const buildingPositions = buildings.map((b) => {
      const { x, z } = cellWorldPosition(b.hexCol, b.hexRow);
      return { x, z };
    });

    const allRocks: { x: number; y: number; z: number; rotX: number; rotY: number; rotZ: number; scale: number }[] = [];
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

    while (allRocks.length < ROCK_COUNT && attempts < maxAttempts) {
      attempts++;

      const x = (rng() - 0.5) * TERRAIN_SIZE.width;
      const z = (rng() - 0.5) * TERRAIN_SIZE.depth;

      const gridHalfW = TERRAIN_SIZE.width / 2 - 6;
      const gridHalfD = TERRAIN_SIZE.depth / 2 - 6;
      if (Math.abs(x) > gridHalfW || Math.abs(z) > gridHalfD) continue;

      const nearest = nearestCellInfo(x, z);
      if (nearest.street) continue;

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
      if (slope < 2 && rng() > 0.2) continue;

      const baseScale = 0.6 + rng() * 1.2;
      const slopeBonus = Math.min(slope / 20, 0.5);
      const scale = baseScale * (1 + slopeBonus);

      allRocks.push({
        x,
        y: terrainY + scale * 0.3,
        z,
        rotX: rng() * Math.PI,
        rotY: rng() * Math.PI * 2,
        rotZ: rng() * Math.PI * 0.3,
        scale,
      });
    }

    // Distribute rocks into chunks by world position.
    const map = new Map<string, typeof allRocks>();
    for (const chunk of chunks) {
      map.set(chunk.id, []);
    }
    for (const rock of allRocks) {
      for (const chunk of chunks) {
        if (
          rock.x >= chunk.minX &&
          rock.x <= chunk.maxX &&
          rock.z >= chunk.minZ &&
          rock.z <= chunk.maxZ
        ) {
          map.get(chunk.id)!.push(rock);
          break;
        }
      }
    }
    return map;
  }, [cells, chunks, buildings]);

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6b6560",
        roughness: 0.95,
        metalness: 0.05,
      }),
    []
  );

  const meshes = useMemo(() => {
    const dummy = new THREE.Object3D();
    const map = new Map<string, THREE.InstancedMesh>();
    for (const [id, rocks] of chunkRocks.entries()) {
      const mesh = new THREE.InstancedMesh(geometry, material, rocks.length);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      rocks.forEach((rock, i) => {
        dummy.position.set(rock.x, rock.y, rock.z);
        dummy.rotation.set(rock.rotX, rock.rotY, rock.rotZ);
        dummy.scale.set(rock.scale, rock.scale * 0.8, rock.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      map.set(id, mesh);
    }
    return map;
  }, [chunkRocks, geometry, material]);

  return (
    <>
      {chunks.map((chunk) => {
        if (visibleChunks.size > 0 && !visibleChunks.has(chunk.id)) return null;
        const mesh = meshes.get(chunk.id);
        if (!mesh || mesh.count === 0) return null;
        return <primitive key={chunk.id} object={mesh} />;
      })}
    </>
  );
}
