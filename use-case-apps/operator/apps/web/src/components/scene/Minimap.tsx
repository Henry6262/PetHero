import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrthographicCamera } from "@react-three/drei";
import { cellColor, generateCells, HEX_SIZE, cellWorldPosition } from "../../lib/hex";
import { requestHexGeometry } from "../../lib/geometryWorker";
import { buildBuilding3D } from "../../lib/buildings";
import { buildAgents3D } from "../../lib/agents";
import type { Agent, Building } from "../../types/data";

const PADDING = 1.12;

function buildingStatusColor(status: Building["status"], selected: boolean): string {
  if (selected) return "#ffffff";
  switch (status) {
    case "clear":
      return "#22c55e";
    case "partial":
      return "#f59e0b";
    case "conflict":
      return "#ef4444";
    case "stale":
      return "#94a3b8";
    case "unmapped":
    default:
      return "#64748b";
  }
}

export default function Minimap({
  buildings,
  selectedBuilding,
  agents,
}: {
  buildings: Building[];
  selectedBuilding: Building | null;
  agents: Agent[];
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cells = useMemo(() => generateCells(), []);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let active = true;
    requestHexGeometry(HEX_SIZE, 0.06).then((geom) => {
      if (active) setGeometry(geom);
    });
    return () => {
      active = false;
    };
  }, []);

  const bounds = useMemo(() => {
    const positions = cells.map((c) => cellWorldPosition(c.col, c.row));
    const xs = positions.map((p) => p.x);
    const zs = positions.map((p) => p.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const halfRange = Math.max(maxX - minX, maxZ - minZ) / 2 * PADDING;
    return {
      cx: (minX + maxX) / 2,
      cz: (minZ + maxZ) / 2,
      halfRange,
    };
  }, [cells]);

  const buildingMarkers = useMemo(() => {
    return buildings.map((b) => {
      const b3d = buildBuilding3D(b, selectedBuilding?.id === b.id);
      return {
        id: b.id,
        position: b3d.position,
        color: buildingStatusColor(b.status, b3d.selected),
        selected: b3d.selected,
      };
    });
  }, [buildings, selectedBuilding]);

  const agentMarkers = useMemo(() => buildAgents3D(agents), [agents]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !geometry) return;

    const dummy = new THREE.Object3D();
    dummy.scale.set(1, 0.15, 1);
    cells.forEach((cell, i) => {
      const { x, z } = cellWorldPosition(cell.col, cell.row);
      dummy.position.set(x, 0, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, cellColor(cell));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cells, geometry]);

  if (!geometry) return null;

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[bounds.cx, 80, bounds.cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        near={1}
        far={200}
        left={-bounds.halfRange}
        right={bounds.halfRange}
        top={bounds.halfRange}
        bottom={-bounds.halfRange}
        zoom={1}
      />
      <ambientLight intensity={1.2} />
      <instancedMesh
        ref={meshRef}
        args={[geometry, new THREE.MeshBasicMaterial(), cells.length]}
      />
      {buildingMarkers.map((b) => (
        <mesh key={b.id} position={[b.position.x, 0.2, b.position.z]}>
          <boxGeometry args={[1.3, 0.25, 1.3]} />
          <meshBasicMaterial color={b.color} />
        </mesh>
      ))}
      {agentMarkers.map((a) => (
        <mesh key={a.id} position={[a.position.x, 0.35, a.position.z]}>
          <sphereGeometry args={[0.55, 8, 8]} />
          <meshBasicMaterial color="#f5e600" />
        </mesh>
      ))}
    </>
  );
}
