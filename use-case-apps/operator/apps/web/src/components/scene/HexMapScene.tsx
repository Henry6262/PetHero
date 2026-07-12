import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { createHexMaterial, generateCells, cellColor, HEX_SIZE, cellWorldPosition } from "../../lib/hex";
import type { MissionSector } from "../../types/data";
import { alignToTerrain } from "../../lib/terrain";
import { requestHexGeometry } from "../../lib/geometryWorker";

export default function HexMapScene({
  onHoverCell,
  sectors = [],
}: {
  onHoverCell?: (index: number | null) => void;
  sectors?: MissionSector[];
}) {
  const { raycaster, pointer, camera } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hoveredRef = useRef<number | null>(null);

  const cells = useMemo(() => generateCells(), []);
  const material = useMemo(() => createHexMaterial(), []);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let active = true;
    requestHexGeometry(HEX_SIZE, 0.22).then((geom) => {
      if (active) setGeometry(geom);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      geometry?.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !geometry) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    cells.forEach((cell, i) => {
      const { x, z } = cellWorldPosition(cell.col, cell.row);
      alignToTerrain(dummy, x, z, 0.02);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(cellColor(cell, sectors)));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cells, geometry, sectors]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(mesh);
    const hit = hits[0];
    const instanceId = hit?.instanceId ?? null;

    if (instanceId !== hoveredRef.current) {
      if (hoveredRef.current !== null) {
        mesh.setColorAt(hoveredRef.current, cellColor(cells[hoveredRef.current], sectors));
      }
      if (instanceId !== null) {
        const hovered = cellColor(cells[instanceId], sectors).clone();
        hovered.offsetHSL(0, 0, 0.12);
        mesh.setColorAt(instanceId, hovered);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      hoveredRef.current = instanceId;
      onHoverCell?.(instanceId);
    }
  });

  if (!geometry) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, cells.length]}
    />
  );
}
