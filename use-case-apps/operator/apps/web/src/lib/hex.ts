import * as THREE from "three";
import { getTerrainHeight } from "./terrain";
import { STATUS_THEME } from "./theme";
import {
  type HexCell,
  generateCells,
  GRID_COLS,
  GRID_ROWS,
  HEX_SIZE,
  HEX_HEIGHT,
  evenrToAxial,
  axialToWorld,
  worldToAxial,
  GRID_CENTER,
} from "./hex-math";

export {
  type HexCell,
  generateCells,
  GRID_COLS,
  GRID_ROWS,
  HEX_SIZE,
  HEX_HEIGHT,
  evenrToAxial,
  axialToWorld,
  worldToAxial,
  GRID_CENTER,
};

export function cellWorldPosition(col: number, row: number): { x: number; y: number; z: number } {
  const { q, r } = evenrToAxial(col, row);
  const { x, z } = axialToWorld(q, r);
  const cx = x - GRID_CENTER.x;
  const cz = z - GRID_CENTER.z;
  return { x: cx, y: getTerrainHeight(cx, cz) + 0.02, z: cz };
}

const HEX_STATUS_PRIORITY: { key: keyof HexCell; kind: keyof typeof STATUS_THEME }[] = [
  { key: "goal", kind: "goal" },
  { key: "station", kind: "station" },
  { key: "conflict", kind: "conflict" },
  { key: "stale", kind: "stale" },
  { key: "route", kind: "route" },
  { key: "street", kind: "street" },
];

export function cellColor(cell: HexCell): THREE.Color {
  for (const { key, kind } of HEX_STATUS_PRIORITY) {
    if (cell[key]) return new THREE.Color(STATUS_THEME[kind].color);
  }
  return new THREE.Color(STATUS_THEME.street.color);
}

export function createHexGeometry(radius: number, height: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    // Rotate by 30° so the hex is pointy-top and matches the grid spacing.
    const angle = i * Math.PI / 3 + Math.PI / 6;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, 0);
  geometry.computeVertexNormals();
  return geometry;
}

export function createHexMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: "#3d8c5f",
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    opacity: 0.92,
    fog: false,
  });
}
