import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { createHexMaterial, generateCells, cellColor, HEX_SIZE, cellWorldPosition } from "../../lib/hex";
import { getTerrainHeight } from "../../lib/terrain";
import { requestHexGeometry } from "../../lib/geometryWorker";

export default function HexMapScene({
  onHoverCell,
}: {
  onHoverCell?: (index: number | null) => void;
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
    const mesh = meshRef.current;
    if (!mesh || !geometry) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    cells.forEach((cell, i) => {
      const { x, z } = cellWorldPosition(cell.col, cell.row);
      const y = getTerrainHeight(x, z) + 0.02;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(cellColor(cell)));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cells, geometry]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(mesh);
    const hit = hits[0];
    const instanceId = hit?.instanceId ?? null;

    if (instanceId !== hoveredRef.current) {
      if (hoveredRef.current !== null) {
        mesh.setColorAt(hoveredRef.current, cellColor(cells[hoveredRef.current]));
      }
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
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, cells.length]}
    />
  );
}
