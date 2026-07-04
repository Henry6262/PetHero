import * as THREE from "three";
import { getTerrainHeight } from "./terrain";
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

const STATUS_PALETTE = {
  goal: "#4ade80",
  station: "#22c55e",
  conflict: "#86efac",
  stale: "#6ee7b7",
  route: "#3b8c5f",
  street: "#2f6b47",
  default: "#2d5a3d",
};

export function cellColor(cell: HexCell): THREE.Color {
  const key: keyof typeof STATUS_PALETTE = cell.goal
    ? "goal"
    : cell.station
    ? "station"
    : cell.conflict
    ? "conflict"
    : cell.stale
    ? "stale"
    : cell.route
    ? "route"
    : cell.street
    ? "street"
    : "default";
  return new THREE.Color(STATUS_PALETTE[key]);
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
