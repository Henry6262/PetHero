import { describe, expect, test } from "bun:test";
import * as THREE from "three";
import {
  axialToWorld,
  createHexGeometry,
  createHexMaterial,
  evenrToAxial,
  generateCells,
  GRID_COLS,
  GRID_ROWS,
  HEX_SIZE,
  worldToAxial,
} from "../src/lib/hex";
import { createBuildingGeometry } from "../src/lib/buildings";

describe("hex grid math", () => {
  test("evenrToAxial converts offset to axial", () => {
    expect(evenrToAxial(1, 1)).toEqual({ q: 0, r: 0 });
    expect(evenrToAxial(2, 2)).toEqual({ q: 1, r: 1 });
    expect(evenrToAxial(3, 2)).toEqual({ q: 2, r: 1 });
  });

  test("axialToWorld and worldToAxial are inverse", () => {
    for (let r = 0; r < 5; r++) {
      for (let q = 0; q < 5; q++) {
        const { x, z } = axialToWorld(q, r);
        expect(worldToAxial(x, z)).toEqual({ q, r });
      }
    }
  });

  test("generateCells covers the full grid", () => {
    const cells = generateCells();
    expect(cells).toHaveLength(GRID_COLS * GRID_ROWS);
    expect(cells[0].col).toBe(1);
    expect(cells[0].row).toBe(1);
    expect(cells.at(-1)?.col).toBe(GRID_COLS);
    expect(cells.at(-1)?.row).toBe(GRID_ROWS);
  });

  test("hex world spacing matches HEX_SIZE", () => {
    const a = axialToWorld(0, 0);
    const b = axialToWorld(1, 0);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    expect(dist).toBeCloseTo(HEX_SIZE * Math.sqrt(3), 5);
  });
});

describe("hex geometry", () => {
  test("createHexGeometry produces expected attributes", () => {
    const geom = createHexGeometry(HEX_SIZE * 0.94, 0.22);
    expect(geom.attributes.position).toBeDefined();
    expect(geom.attributes.normal).toBeDefined();
    expect(geom.attributes.uv).toBeDefined();
    expect(geom.attributes.position.count).toBeGreaterThan(0);
    geom.dispose();
  });

  test("createHexGeometry bounds are centered on origin horizontally", () => {
    const geom = createHexGeometry(2, 0.5);
    geom.computeBoundingBox();
    const box = geom.boundingBox!;
    expect(box.max.y - box.min.y).toBeCloseTo(0.5, 5);
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(0, 5);
    expect((box.min.z + box.max.z) / 2).toBeCloseTo(0, 5);
    geom.dispose();
  });

  test("createHexMaterial is a terrain-matching transparent material", () => {
    const material = createHexMaterial();
    expect(material.transparent).toBe(true);
    expect(material.opacity).toBeLessThan(1);
    expect(material.color.r).toBeGreaterThan(material.color.g);
    material.dispose();
  });
});

describe("building geometry", () => {
  test("createBuildingGeometry creates a solid extruded mesh", () => {
    const footprint = [
      new THREE.Vector2(-1, -1),
      new THREE.Vector2(1, -1),
      new THREE.Vector2(1, 1),
      new THREE.Vector2(-1, 1),
    ];
    const geom = createBuildingGeometry(footprint, 4);
    expect(geom.attributes.position).toBeDefined();
    expect(geom.attributes.normal).toBeDefined();
    expect(geom.attributes.uv).toBeDefined();
    geom.computeBoundingBox();
    expect(geom.boundingBox!.max.y).toBeGreaterThan(3.9);
    geom.dispose();
  });
});
