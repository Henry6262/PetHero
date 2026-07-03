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
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
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

export function createHexMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: 0xffffff,
    fog: false,
  });
}
