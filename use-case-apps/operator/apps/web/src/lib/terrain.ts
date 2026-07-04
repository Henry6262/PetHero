import * as THREE from "three";
import { createNoise2D } from "simplex-noise";
import alea from "alea";
import { GRID_COLS, GRID_ROWS, HEX_SIZE } from "./hex-math";

const TERRAIN_SEED = "operator-village-north-001";
const MARGIN = 6;
const CELL_SPACING = HEX_SIZE * 2;

export const TERRAIN_SIZE = {
  width: (GRID_COLS - 1) * CELL_SPACING + MARGIN * 2,
  depth: (GRID_ROWS - 1) * CELL_SPACING + MARGIN * 2,
};

const noiseBase = createNoise2D(alea(TERRAIN_SEED));
const noiseDetail = createNoise2D(alea(TERRAIN_SEED + "-detail"));
const noiseMicro = createNoise2D(alea(TERRAIN_SEED + "-micro"));

function proceduralHeight(x: number, z: number): number {
  const base = noiseBase(x * 0.015, z * 0.015) * 2.5;
  const detail = noiseDetail(x * 0.04, z * 0.04) * 1.0;
  const micro = noiseMicro(x * 0.08, z * 0.08) * 0.3;
  return Math.max(0, Math.min(4.5, 0.5 + base + detail + micro));
}

type HeightSource = (x: number, z: number) => number;

let activeSource: HeightSource = proceduralHeight;

let demData: {
  width: number;
  height: number;
  elevations: Float32Array;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
} | null = null;

function demHeight(x: number, z: number): number {
  if (!demData) return 0;

  const u = (x - demData.bounds.minX) / (demData.bounds.maxX - demData.bounds.minX);
  const v = (z - demData.bounds.minZ) / (demData.bounds.maxZ - demData.bounds.minZ);

  const px = u * (demData.width - 1);
  const py = v * (demData.height - 1);

  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const x1 = Math.min(x0 + 1, demData.width - 1);
  const y1 = Math.min(y0 + 1, demData.height - 1);
  const fx = px - x0;
  const fy = py - y0;

  const h00 = demData.elevations[y0 * demData.width + x0];
  const h10 = demData.elevations[y0 * demData.width + x1];
  const h01 = demData.elevations[y1 * demData.width + x0];
  const h11 = demData.elevations[y1 * demData.width + x1];

  return h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) + h01 * (1 - fx) * fy + h11 * fx * fy;
}

export function getTerrainHeight(x: number, z: number): number {
  return activeSource(x, z);
}

const SAMPLE_DISTANCE = 0.5;

export function getTerrainNormal(x: number, z: number): THREE.Vector3 {
  const hL = getTerrainHeight(x - SAMPLE_DISTANCE, z);
  const hR = getTerrainHeight(x + SAMPLE_DISTANCE, z);
  const hD = getTerrainHeight(x, z - SAMPLE_DISTANCE);
  const hU = getTerrainHeight(x, z + SAMPLE_DISTANCE);

  const dx = (hR - hL) / (2 * SAMPLE_DISTANCE);
  const dz = (hU - hD) / (2 * SAMPLE_DISTANCE);

  return new THREE.Vector3(-dx, 1, -dz).normalize();
}

export function getTerrainSlope(x: number, z: number): number {
  const normal = getTerrainNormal(x, z);
  const slopeCos = normal.dot(new THREE.Vector3(0, 1, 0));
  return Math.acos(Math.max(-1, Math.min(1, slopeCos))) * (180 / Math.PI);
}

export function setTerrainHeightmap(options: {
  imageData: ImageData;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  scale?: number;
  offset?: number;
}): void {
  const { imageData, bounds, scale = 1, offset = 0 } = options;
  const width = imageData.width;
  const height = imageData.height;
  const pixels = imageData.data;

  const elevations = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const normalized = pixels[i * 4] / 255;
    elevations[i] = normalized * scale + offset;
  }

  demData = { width, height, elevations, bounds };
  activeSource = demHeight;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("terrain:reload"));
  }
}

export function resetTerrain(): void {
  demData = null;
  activeSource = proceduralHeight;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("terrain:reload"));
  }
}
