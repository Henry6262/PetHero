import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { createHexMaterial, generateCells, cellColor, HEX_SIZE, cellWorldPosition } from "../../lib/hex";
import { requestHexGeometry } from "../../lib/geometryWorker";

export default function HexMapScene({
  onHoverCell,
}: {
  onHoverCell?: (index: number | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hoveredRef = useRef<number | null>(null);
  const { raycaster, pointer, camera } = useThree();

  const cells = useMemo(() => generateCells(), []);
  const material = useMemo(() => createHexMaterial(), []);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let active = true;
    requestHexGeometry(HEX_SIZE * 0.94, 0.22).then((geom) => {
      if (active) setGeometry(geom);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !geometry) return;

    const dummy = new THREE.Object3D();

    cells.forEach((cell, i) => {
      const { x, y, z } = cellWorldPosition(cell.col, cell.row);
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, cellColor(cell));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    return () => {
      cells.forEach((cell, i) => {
        mesh.setColorAt(i, cellColor(cell));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
  }, [cells, geometry]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(mesh);
    const hit = hits[0];
    const instanceId = hit?.instanceId ?? null;

    if (instanceId !== hoveredRef.current) {
      // Restore previous hover.
      if (hoveredRef.current !== null) {
        const prev = hoveredRef.current;
        mesh.setColorAt(prev, cellColor(cells[prev]));
      }
      // Apply hover highlight.
      if (instanceId !== null) {
        const hovered = cellColor(cells[instanceId]).clone();
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
    <instancedMesh ref={meshRef} args={[geometry, material, cells.length]} />
  );
}
