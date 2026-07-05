import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import {
  buildBuilding3D,
  buildingMaterial,
  createBuildingOutlineGeometry,
  createRoofGeometry,
  buildingOutlineMaterial,
} from "../../lib/buildings";
import { requestBuildingGeometry } from "../../lib/geometryWorker";
import type { Building } from "../../types/data";

interface CachedBuilding {
  geometry: THREE.BufferGeometry;
  bvh: MeshBVH;
}

interface BuildingMeshData {
  b3d: ReturnType<typeof buildBuilding3D>;
  geometry: THREE.BufferGeometry;
  roofGeometry: THREE.BufferGeometry | null;
  outlineGeometry: THREE.BufferGeometry;
  roofOutlineGeometry: THREE.BufferGeometry | null;
  material: THREE.MeshStandardMaterial;
  outlineMaterial: THREE.LineBasicMaterial;
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
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
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

      // Compute BVH synchronously on the main thread (small number of buildings).
      for (const { b3d, geometry } of geometryResults) {
        const bvh = new MeshBVH(geometry);
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

      const outlineMaterial = buildingOutlineMaterial();
      const results: BuildingMeshData[] = building3Ds.map((b3d) => {
        const cached = cacheRef.current.get(b3d.id)!;
        const isXray = interiorView && b3d.selected;
        const material = buildingMaterial(b3d.status, b3d.kind, b3d.selected, isXray);
        const roofGeometry = createRoofGeometry(b3d.footprint, b3d.kind);
        const outlineGeometry = createBuildingOutlineGeometry(cached.geometry);
        const roofOutlineGeometry = roofGeometry ? createBuildingOutlineGeometry(roofGeometry) : null;
        return {
          b3d,
          geometry: cached.geometry,
          roofGeometry,
          outlineGeometry,
          roofOutlineGeometry,
          material,
          outlineMaterial,
        };
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
      materialsRef.current.forEach((m) => m.dispose());
      materialsRef.current = [];
      cacheRef.current.forEach(({ geometry }) => geometry.dispose());
      cacheRef.current.clear();
    };
  }, []);

  return (
    <group>
      {meshData.map(({ b3d, geometry, roofGeometry, outlineGeometry, roofOutlineGeometry, material, outlineMaterial }) => (
        <group
          key={b3d.id}
          position={b3d.position}
          rotation={[0, b3d.rotation, 0]}
        >
          <mesh
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
          <lineSegments geometry={outlineGeometry} material={outlineMaterial} />
          {roofGeometry && (
            <mesh
              geometry={roofGeometry}
              material={material}
              position={[0, b3d.height, 0]}
              castShadow
              receiveShadow
            />
          )}
          {roofOutlineGeometry && (
            <lineSegments
              geometry={roofOutlineGeometry}
              material={outlineMaterial}
              position={[0, b3d.height, 0]}
            />
          )}
        </group>
      ))}
    </group>
  );
}
