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
  pointInPolygon,
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

export type SectorColor = {
  friendly: string;
  hostile: string;
  neutral: string;
  objective: string;
};

export const SECTOR_HEX_COLORS: SectorColor = {
  friendly: "#4a6b8a",
  hostile: "#8a4a4a",
  neutral: "#6b6b6b",
  objective: "#8a6a3a",
};

const STATUS_COLOR_CACHE = new Map<string, THREE.Color>();
const TERRAIN_HEX_COLOR = new THREE.Color("#5a544d");

function getStatusColor(kind: keyof typeof STATUS_THEME): THREE.Color {
  const cached = STATUS_COLOR_CACHE.get(kind);
  if (cached) return cached;
  const color = new THREE.Color(STATUS_THEME[kind].color);
  STATUS_COLOR_CACHE.set(kind, color);
  return color;
}

export function cellColor(cell: HexCell, sectors: { polygon: [number, number][]; status: keyof SectorColor }[] = []): THREE.Color {
  for (const { key, kind } of HEX_STATUS_PRIORITY) {
    if (cell[key]) return getStatusColor(kind);
  }

  for (const sector of sectors) {
    if (pointInPolygon(cell.x, cell.z, sector.polygon)) {
      return new THREE.Color(SECTOR_HEX_COLORS[sector.status]).clone().multiplyScalar(0.75);
    }
  }

  return TERRAIN_HEX_COLOR;
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
    color: "#5a544d",
    roughness: 0.85,
    metalness: 0.02,
    transparent: true,
    opacity: 0.55,
    fog: false,
  });
}
