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

const CELL_SPACING = HEX_SIZE * 2;
const CENTER_COL = (GRID_COLS + 1) / 2;
const CENTER_ROW = (GRID_ROWS + 1) / 2;

export function cellWorldPosition(col: number, row: number): { x: number; y: number; z: number } {
  const x = (col - CENTER_COL) * CELL_SPACING;
  const z = (row - CENTER_ROW) * CELL_SPACING;
  return { x, y: getTerrainHeight(x, z) + 0.02, z };
}

const STATUS_PALETTE = {
  goal: "#5fe6b0",
  station: "#34d399",
  conflict: "#f87171",
  stale: "#fbbf24",
  route: "#5fb2ff",
  street: "#3a4659",
  default: "#2e3848",
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
  // Square cells instead of hexagons.
  const shape = new THREE.Shape();
  shape.moveTo(-radius, -radius);
  shape.lineTo(radius, -radius);
  shape.lineTo(radius, radius);
  shape.lineTo(-radius, radius);
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

export function createHexMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: 0xffffff,
    fog: false,
  });
}
