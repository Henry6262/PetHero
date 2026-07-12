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
  roofGeometry: THREE.BufferGeometry | null;
  outlineGeometry: THREE.BufferGeometry;
  roofOutlineGeometry: THREE.BufferGeometry | null;
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

function disposeTransient(data: BuildingMeshData[]) {
  for (const d of data) {
    d.roofGeometry?.dispose();
    d.outlineGeometry.dispose();
    d.roofOutlineGeometry?.dispose();
    d.material.dispose();
  }
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
  const building3Ds = useMemo(
    () => buildings.map((b) => buildBuilding3D(b, selectedBuilding?.id === b.id)),
    [buildings, selectedBuilding?.id]
  );
  const [meshData, setMeshData] = useState<BuildingMeshData[]>([]);
  const cacheRef = useRef(new Map<string, CachedBuilding>());
  const prevMeshDataRef = useRef<BuildingMeshData[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
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
        const roofGeometry = createRoofGeometry(b3d.footprint, b3d.kind);
        const outlineGeometry = createBuildingOutlineGeometry(geometry);
        const roofOutlineGeometry = roofGeometry ? createBuildingOutlineGeometry(roofGeometry) : null;
        cacheRef.current.set(b3d.id, { geometry, bvh, roofGeometry, outlineGeometry, roofOutlineGeometry });
      }

      // Drop buildings that no longer exist and dispose their cached data.
      const currentIds = new Set(building3Ds.map((b) => b.id));
      for (const [id, cached] of Array.from(cacheRef.current.entries())) {
        if (!currentIds.has(id)) {
          cached.geometry.dispose();
          cached.roofGeometry?.dispose();
          cached.outlineGeometry.dispose();
          cached.roofOutlineGeometry?.dispose();
          cacheRef.current.delete(id);
        }
      }

      if (cancelled) return;

      const outlineMaterial = buildingOutlineMaterial();
      const results: BuildingMeshData[] = building3Ds.map((b3d) => {
        const cached = cacheRef.current.get(b3d.id)!;
        const isXray = interiorView && b3d.selected;
        const material = buildingMaterial(b3d.status, b3d.kind, b3d.selected, isXray);
        return {
          b3d,
          geometry: cached.geometry,
          roofGeometry: cached.roofGeometry,
          outlineGeometry: cached.outlineGeometry,
          roofOutlineGeometry: cached.roofOutlineGeometry,
          material,
          outlineMaterial,
        };
      });

      disposeTransient(prevMeshDataRef.current);
      prevMeshDataRef.current = results;
      setMeshData(results);
    })();

    return () => {
      cancelled = true;
    };
  }, [building3Ds, interiorView]);

  useEffect(() => {
    return () => {
      disposeTransient(prevMeshDataRef.current);
      prevMeshDataRef.current = [];
      for (const cached of cacheRef.current.values()) {
        cached.geometry.dispose();
        cached.roofGeometry?.dispose();
        cached.outlineGeometry.dispose();
        cached.roofOutlineGeometry?.dispose();
      }
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
