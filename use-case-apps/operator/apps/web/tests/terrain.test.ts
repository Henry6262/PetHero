import { describe, expect, test } from "bun:test";
import * as THREE from "three";
import {
  getTerrainHeight,
  getTerrainNormal,
  getTerrainSlope,
  resetTerrain,
  setTerrainHeightmap,
  TERRAIN_SIZE,
} from "../src/lib/terrain";

describe("procedural terrain", () => {
  test("height is deterministic", () => {
    const a = getTerrainHeight(10.5, -7.2);
    const b = getTerrainHeight(10.5, -7.2);
    expect(a).toBe(b);
  });

  test("height stays within expected bounds", () => {
    for (let x = -20; x <= 20; x += 5) {
      for (let z = -20; z <= 20; z += 5) {
        const h = getTerrainHeight(x, z);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(4.5);
      }
    }
  });

  test("normal is normalized", () => {
    const normal = getTerrainNormal(0, 0);
    expect(normal.length()).toBeCloseTo(1, 5);
  });

  test("slope is within 0-90 degrees", () => {
    const slope = getTerrainSlope(0, 0);
    expect(slope).toBeGreaterThanOrEqual(0);
    expect(slope).toBeLessThanOrEqual(90);
  });

  test("terrain size is positive", () => {
    expect(TERRAIN_SIZE.width).toBeGreaterThan(0);
    expect(TERRAIN_SIZE.depth).toBeGreaterThan(0);
  });
});

describe("DEM heightmap", () => {
  test("setTerrainHeightmap overrides heights", () => {
    const size = 4;
    const pixels = new Uint8ClampedArray(size * size * 4).fill(128);
    const imageData = { width: size, height: size, data: pixels } as unknown as ImageData;

    setTerrainHeightmap({
      imageData,
      bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
      scale: 10,
      offset: 0,
    });

    const h = getTerrainHeight(0, 0);
    expect(h).toBeCloseTo(5, 1); // 128/255 * 10 ≈ 5

    resetTerrain();
  });
});
