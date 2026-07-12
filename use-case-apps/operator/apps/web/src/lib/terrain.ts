import * as THREE from "three";
import { createNoise2D } from "simplex-noise";
import alea from "alea";
import { TERRAIN_THEME } from "./theme";
import { GRID_COLS, GRID_ROWS, evenrToAxial, axialToWorld } from "./hex-math";

const TERRAIN_SEED = "operator-village-north-001";
const MARGIN = 6;

const topLeft = axialToWorld(...(Object.values(evenrToAxial(1, 1)) as [number, number]));
const bottomRight = axialToWorld(...(Object.values(evenrToAxial(GRID_COLS, GRID_ROWS)) as [number, number]));

export const TERRAIN_SIZE = {
  width: bottomRight.x - topLeft.x + MARGIN * 2,
  depth: bottomRight.z - topLeft.z + MARGIN * 2,
};

export interface TerrainSource {
  getHeight(x: number, z: number): number;
  getNormal(x: number, z: number): THREE.Vector3;
  getSlope(x: number, z: number): number;
  getQuaternion(x: number, z: number): THREE.Quaternion;
  sampleColor?(height: number, slope: number): THREE.Color;
  dispose?(): void;
}

const SAMPLE_DISTANCE = 0.5;
const UP = new THREE.Vector3(0, 1, 0);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Procedural noise terrain used as the default Operator base map.
 */
export class ProceduralTerrainSource implements TerrainSource {
  private noiseBase;
  private noiseDetail;
  private noiseMicro;

  constructor(seed = TERRAIN_SEED) {
    this.noiseBase = createNoise2D(alea(seed));
    this.noiseDetail = createNoise2D(alea(`${seed}-detail`));
    this.noiseMicro = createNoise2D(alea(`${seed}-micro`));
  }

  getHeight(x: number, z: number): number {
    const base = this.noiseBase(x * 0.015, z * 0.015) * 2.5;
    const detail = this.noiseDetail(x * 0.04, z * 0.04) * 1.0;
    const micro = this.noiseMicro(x * 0.08, z * 0.08) * 0.3;
    return Math.max(0, Math.min(4.5, 0.5 + base + detail + micro));
  }

  getNormal(x: number, z: number): THREE.Vector3 {
    const hL = this.getHeight(x - SAMPLE_DISTANCE, z);
    const hR = this.getHeight(x + SAMPLE_DISTANCE, z);
    const hD = this.getHeight(x, z - SAMPLE_DISTANCE);
    const hU = this.getHeight(x, z + SAMPLE_DISTANCE);

    const dx = (hR - hL) / (2 * SAMPLE_DISTANCE);
    const dz = (hU - hD) / (2 * SAMPLE_DISTANCE);

    return new THREE.Vector3(-dx, 1, -dz).normalize();
  }

  getSlope(x: number, z: number): number {
    const normal = this.getNormal(x, z);
    const slopeCos = normal.dot(UP);
    return Math.acos(clamp(slopeCos, -1, 1)) * (180 / Math.PI);
  }

  getQuaternion(x: number, z: number): THREE.Quaternion {
    return new THREE.Quaternion().setFromUnitVectors(UP, this.getNormal(x, z));
  }

  sampleColor(height: number, slope: number): THREE.Color {
    if (height < 1.2 && slope < 12) return new THREE.Color(TERRAIN_THEME.lowFlat);
    if (height < 2.5 && slope < 20) return new THREE.Color(TERRAIN_THEME.midGentle);
    if (slope >= 20) return new THREE.Color(TERRAIN_THEME.steep);
    return new THREE.Color(TERRAIN_THEME.high);
  }
}

/**
 * Terrain source backed by a raster heightmap (e.g., drone-derived DEM).
 */
export class HeightmapTerrainSource implements TerrainSource {
  private elevations: Float32Array;
  private width: number;
  private height: number;
  private bounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  constructor(options: {
    imageData: ImageData;
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
    scale?: number;
    offset?: number;
  }) {
    const { imageData, bounds, scale = 1, offset = 0 } = options;
    this.width = imageData.width;
    this.height = imageData.height;
    this.bounds = bounds;

    const pixels = imageData.data;
    this.elevations = new Float32Array(this.width * this.height);
    for (let i = 0; i < this.width * this.height; i++) {
      this.elevations[i] = (pixels[i * 4] / 255) * scale + offset;
    }
  }

  getHeight(x: number, z: number): number {
    const u = (x - this.bounds.minX) / (this.bounds.maxX - this.bounds.minX);
    const v = (z - this.bounds.minZ) / (this.bounds.maxZ - this.bounds.minZ);

    const px = u * (this.width - 1);
    const py = v * (this.height - 1);

    const x0 = Math.floor(px);
    const y0 = Math.floor(py);
    const x1 = Math.min(x0 + 1, this.width - 1);
    const y1 = Math.min(y0 + 1, this.height - 1);
    const fx = px - x0;
    const fy = py - y0;

    const h00 = this.elevations[y0 * this.width + x0];
    const h10 = this.elevations[y0 * this.width + x1];
    const h01 = this.elevations[y1 * this.width + x0];
    const h11 = this.elevations[y1 * this.width + x1];

    return h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) + h01 * (1 - fx) * fy + h11 * fx * fy;
  }

  getNormal(x: number, z: number): THREE.Vector3 {
    const hL = this.getHeight(x - SAMPLE_DISTANCE, z);
    const hR = this.getHeight(x + SAMPLE_DISTANCE, z);
    const hD = this.getHeight(x, z - SAMPLE_DISTANCE);
    const hU = this.getHeight(x, z + SAMPLE_DISTANCE);

    const dx = (hR - hL) / (2 * SAMPLE_DISTANCE);
    const dz = (hU - hD) / (2 * SAMPLE_DISTANCE);

    return new THREE.Vector3(-dx, 1, -dz).normalize();
  }

  getSlope(x: number, z: number): number {
    const normal = this.getNormal(x, z);
    const slopeCos = normal.dot(UP);
    return Math.acos(clamp(slopeCos, -1, 1)) * (180 / Math.PI);
  }

  getQuaternion(x: number, z: number): THREE.Quaternion {
    return new THREE.Quaternion().setFromUnitVectors(UP, this.getNormal(x, z));
  }

  dispose(): void {
    this.elevations = new Float32Array(0);
  }
}

/**
 * Active terrain source registry.
 *
 * Components read terrain through the exported convenience functions below,
 * which delegate to the current source. Switching sources (e.g., from
 * procedural to drone-derived DEM) updates this registry.
 */
class TerrainRegistry {
  private source: TerrainSource = new ProceduralTerrainSource();
  private listeners = new Set<() => void>();

  get(): TerrainSource {
    return this.source;
  }

  set(next: TerrainSource): void {
    const prev = this.source;
    this.source = next;
    if (prev !== next && prev.dispose) {
      prev.dispose();
    }
    this.emit();
  }

  reset(): void {
    this.set(new ProceduralTerrainSource());
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(): void {
    for (const cb of this.listeners) cb();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("terrain:reload"));
    }
  }
}

const registry = new TerrainRegistry();

/** Get the currently active terrain source. */
export function getTerrainSource(): TerrainSource {
  return registry.get();
}

/** Replace the active terrain source. */
export function setTerrainSource(source: TerrainSource): void {
  registry.set(source);
}

/** Reset to the default procedural terrain source. */
export function resetTerrainSource(): void {
  registry.reset();
}

/** Subscribe to terrain source changes (e.g., to reload a Three.js layer). */
export function subscribeTerrainChanges(callback: () => void): () => void {
  return registry.subscribe(callback);
}

/** Convenience: height at world position. */
export function getTerrainHeight(x: number, z: number): number {
  return registry.get().getHeight(x, z);
}

/** Convenience: normal at world position. */
export function getTerrainNormal(x: number, z: number): THREE.Vector3 {
  return registry.get().getNormal(x, z);
}

/** Convenience: slope angle in degrees. */
export function getTerrainSlope(x: number, z: number): number {
  return registry.get().getSlope(x, z);
}

/** Convenience: quaternion aligned to terrain. */
export function getTerrainQuaternion(x: number, z: number): THREE.Quaternion {
  return registry.get().getQuaternion(x, z);
}

/** Convenience: align an object to the terrain surface. */
export function alignToTerrain(object: THREE.Object3D, x: number, z: number, yOffset = 0.02): void {
  const source = registry.get();
  object.position.set(x, source.getHeight(x, z) + yOffset, z);
  object.quaternion.copy(source.getQuaternion(x, z));
}

/**
 * Backwards-compatible helper that creates a HeightmapTerrainSource and
 * activates it. Use setTerrainSource() directly for more control.
 */
export function setTerrainHeightmap(options: {
  imageData: ImageData;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  scale?: number;
  offset?: number;
}): void {
  registry.set(new HeightmapTerrainSource(options));
}

/**
 * Backwards-compatible helper that resets to procedural terrain.
 */
export function resetTerrain(): void {
  registry.reset();
}

