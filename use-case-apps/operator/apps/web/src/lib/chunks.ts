import * as THREE from "three";
import type { HexCell } from "./hex-math";
import type { Building } from "../data/sections";

export const CHUNK_SIZE_CELLS = 8;

export interface Chunk {
  id: string;
  col: number;
  row: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  box: THREE.Box3;
  cells: HexCell[];
  buildingIds: Set<string>;
}

export function chunkId(col: number, row: number): string {
  return `${col}-${row}`;
}

export function cellChunk(col: number, row: number): { col: number; row: number } {
  return {
    col: Math.floor((col - 1) / CHUNK_SIZE_CELLS),
    row: Math.floor((row - 1) / CHUNK_SIZE_CELLS),
  };
}

export function buildChunks(cells: HexCell[], buildings: Building[]): Chunk[] {
  const map = new Map<string, Chunk>();

  for (const cell of cells) {
    const { col: cc, row: rc } = cellChunk(cell.col, cell.row);
    const id = chunkId(cc, rc);
    if (!map.has(id)) {
      map.set(id, createChunk(id, cc, rc));
    }
    map.get(id)!.cells.push(cell);
  }

  for (const building of buildings) {
    const { col: cc, row: rc } = cellChunk(building.hexCol, building.hexRow);
    const id = chunkId(cc, rc);
    if (!map.has(id)) {
      map.set(id, createChunk(id, cc, rc));
    }
    map.get(id)!.buildingIds.add(building.id);
  }

  // Finalize bounds from actual cells.
  for (const chunk of map.values()) {
    if (chunk.cells.length === 0) continue;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const cell of chunk.cells) {
      minX = Math.min(minX, cell.x);
      maxX = Math.max(maxX, cell.x);
      minZ = Math.min(minZ, cell.z);
      maxZ = Math.max(maxZ, cell.z);
    }
    // Margin for cell height and buildings.
    const margin = 6;
    chunk.minX = minX - margin;
    chunk.maxX = maxX + margin;
    chunk.minZ = minZ - margin;
    chunk.maxZ = maxZ + margin;
    chunk.box.set(
      new THREE.Vector3(chunk.minX, -2, chunk.minZ),
      new THREE.Vector3(chunk.maxX, 20, chunk.maxZ)
    );
  }

  return Array.from(map.values());
}

function createChunk(id: string, col: number, row: number): Chunk {
  return {
    id,
    col,
    row,
    minX: 0,
    maxX: 0,
    minZ: 0,
    maxZ: 0,
    box: new THREE.Box3(),
    cells: [],
    buildingIds: new Set(),
  };
}

export function getVisibleChunkIds(chunks: Chunk[], frustum: THREE.Frustum): Set<string> {
  const visible = new Set<string>();
  for (const chunk of chunks) {
    if (frustum.intersectsBox(chunk.box)) {
      visible.add(chunk.id);
    }
  }
  return visible;
}
