import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { createHexMaterial, generateCells, cellColor, HEX_SIZE, cellWorldPosition } from "../../lib/hex";
import { getTerrainHeight, getTerrainNormal } from "../../lib/terrain";
import { requestHexGeometry } from "../../lib/geometryWorker";
import { buildChunks, CHUNK_SIZE_CELLS, type Chunk } from "../../lib/chunks";
import { useVisibleChunks } from "./ChunkVisibility";

export default function HexMapScene({
  onHoverCell,
}: {
  onHoverCell?: (index: number | null) => void;
}) {
  const { raycaster, pointer, camera } = useThree();
  const visibleChunks = useVisibleChunks();

  const cells = useMemo(() => generateCells(), []);
  const chunks = useMemo(() => buildChunks(cells, []), [cells]);
  const cellByIndex = useMemo(() => {
    const map = new Map<number, { cell: typeof cells[0]; chunk: Chunk; localIndex: number }>();
    for (const chunk of chunks) {
      chunk.cells.forEach((cell, localIndex) => {
        map.set(cell.index, { cell, chunk, localIndex });
      });
    }
    return map;
  }, [chunks]);

  const material = useMemo(() => createHexMaterial(), []);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const hoveredRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    requestHexGeometry(HEX_SIZE * 0.94, 0.22).then((geom) => {
      if (active) setGeometry(geom);
    });
    return () => {
      active = false;
    };
  }, []);

  const meshRefs = useRef<Map<string, THREE.InstancedMesh>>(new Map());

  useEffect(() => {
    if (!geometry) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const up = new THREE.Vector3(0, 1, 0);

    for (const chunk of chunks) {
      let mesh = meshRefs.current.get(chunk.id);
      if (!mesh) {
        mesh = new THREE.InstancedMesh(geometry, material, chunk.cells.length);
        mesh.frustumCulled = false;
        meshRefs.current.set(chunk.id, mesh);
      }

      chunk.cells.forEach((cell, i) => {
        const { x, z } = cellWorldPosition(cell.col, cell.row);
        const y = getTerrainHeight(x, z) + 0.02;
        const normal = getTerrainNormal(x, z);
        dummy.position.set(x, y, z);
        dummy.quaternion.setFromUnitVectors(up, normal);
        dummy.updateMatrix();
        mesh!.setMatrixAt(i, dummy.matrix);
        mesh!.setColorAt(i, color.set(cellColor(cell)));
      });

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [chunks, geometry, material]);

  useFrame(() => {
    const visibleMeshes: THREE.InstancedMesh[] = [];
    for (const chunk of chunks) {
      if (visibleChunks.size === 0 || visibleChunks.has(chunk.id)) {
        const mesh = meshRefs.current.get(chunk.id);
        if (mesh) visibleMeshes.push(mesh);
      }
    }
    if (visibleMeshes.length === 0) return;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(visibleMeshes);
    const hit = hits[0];
    const instanceId = hit?.instanceId ?? null;
    const hitMesh = hit?.object as THREE.InstancedMesh | undefined;
    const globalIndex =
      instanceId !== null && hitMesh
        ? chunks.find((c) => meshRefs.current.get(c.id) === hitMesh)?.cells[instanceId]?.index ?? null
        : null;

    if (globalIndex !== hoveredRef.current) {
      if (hoveredRef.current !== null) {
        const prev = hoveredRef.current;
        const prevInfo = cellByIndex.get(prev);
        if (prevInfo) {
          const prevMesh = meshRefs.current.get(prevInfo.chunk.id);
          if (prevMesh) {
            prevMesh.setColorAt(prevInfo.localIndex, cellColor(prevInfo.cell));
            if (prevMesh.instanceColor) prevMesh.instanceColor.needsUpdate = true;
          }
        }
      }
      if (globalIndex !== null && hitMesh && instanceId !== null) {
        const hovered = cellColor(cells[globalIndex]).clone();
        hovered.offsetHSL(0, 0, 0.12);
        hitMesh.setColorAt(instanceId, hovered);
        if (hitMesh.instanceColor) hitMesh.instanceColor.needsUpdate = true;
      }
      hoveredRef.current = globalIndex;
      onHoverCell?.(globalIndex);
    }
  });

  if (!geometry) return null;

  return (
    <>
      {chunks.map((chunk) => {
        const mesh = meshRefs.current.get(chunk.id);
        if (!mesh) return null;
        if (visibleChunks.size > 0 && !visibleChunks.has(chunk.id)) return null;
        return <primitive key={chunk.id} object={mesh} />;
      })}
    </>
  );
}
