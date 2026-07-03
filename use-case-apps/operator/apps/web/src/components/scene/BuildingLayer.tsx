import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { MeshBVH } from "three-mesh-bvh";
import { GenerateMeshBVHWorker } from "three-mesh-bvh/worker";
import { buildBuilding3D, buildingMaterial } from "../../lib/buildings";
import { requestBuildingGeometry } from "../../lib/geometryWorker";
import type { Building } from "../../data/sections";

interface CachedBuilding {
  geometry: THREE.BufferGeometry;
  bvh: MeshBVH;
}

interface BuildingMeshData {
  b3d: ReturnType<typeof buildBuilding3D>;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
}

export default function BuildingLayer({
  buildings,
  selectedBuilding,
  onSelectBuilding,
  interiorView,
}: {
  buildings: Building[];
  selectedBuilding: Building | null;
  onSelectBuilding: (building: Building | null) => void;
  interiorView: boolean;
}) {
  const building3Ds = buildings.map((b) => buildBuilding3D(b, selectedBuilding?.id === b.id));

  const [meshData, setMeshData] = useState<BuildingMeshData[]>([]);
  const cacheRef = useRef(new Map<string, CachedBuilding>());
  const workerRef = useRef<GenerateMeshBVHWorker | null>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new GenerateMeshBVHWorker();
    }
    const bvhWorker = workerRef.current;
    let cancelled = false;

    (async () => {
      // Dispose materials from the previous frame; geometry is cached separately.
      materialsRef.current.forEach((m) => m.dispose());
      materialsRef.current = [];

      const missing = building3Ds.filter((b3d) => !cacheRef.current.has(b3d.id));

      // Fetch missing extruded geometries in parallel.
      const geometryResults = await Promise.all(
        missing.map(async (b3d) => {
          const footprint: [number, number][] = b3d.footprint.map((p) => [p.x, p.y]);
          const geometry = await requestBuildingGeometry(footprint, b3d.height);
          return { b3d, geometry };
        })
      );

      // The BVH worker only runs one job at a time, so generate sequentially.
      for (const { b3d, geometry } of geometryResults) {
        const bvh = await bvhWorker.generate(geometry);
        geometry.boundsTree = bvh;
        cacheRef.current.set(b3d.id, { geometry, bvh });
      }

      // Drop buildings that no longer exist.
      const currentIds = new Set(building3Ds.map((b) => b.id));
      for (const [id, { geometry }] of Array.from(cacheRef.current.entries())) {
        if (!currentIds.has(id)) {
          geometry.dispose();
          cacheRef.current.delete(id);
        }
      }

      if (cancelled) return;

      const results: BuildingMeshData[] = building3Ds.map((b3d) => {
        const cached = cacheRef.current.get(b3d.id)!;
        const isXray = interiorView && b3d.selected;
        const material = buildingMaterial(b3d.status, b3d.selected, isXray);
        return { b3d, geometry: cached.geometry, material };
      });

      materialsRef.current = results.map((r) => r.material);
      setMeshData(results);
    })();

    return () => {
      cancelled = true;
    };
  }, [building3Ds, interiorView]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      materialsRef.current.forEach((m) => m.dispose());
      materialsRef.current = [];
      cacheRef.current.forEach(({ geometry }) => geometry.dispose());
      cacheRef.current.clear();
    };
  }, []);

  return (
    <group>
      {meshData.map(({ b3d, geometry, material }) => (
        <mesh
          key={b3d.id}
          position={b3d.position}
          rotation={[0, b3d.rotation, 0]}
          geometry={geometry}
          material={material}
          castShadow
          receiveShadow
          onPointerDown={(e) => {
            e.stopPropagation();
            const match = buildings.find((b) => b.id === b3d.id) ?? null;
            onSelectBuilding(match);
          }}
        />
      ))}
    </group>
  );
}
