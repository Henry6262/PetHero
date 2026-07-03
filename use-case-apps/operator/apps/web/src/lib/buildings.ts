import * as THREE from "three";
import { cellWorldPosition } from "./hex";
import { getTerrainHeight } from "./terrain";
import type { Building, BuildingStatus } from "../data/sections";

export const STATUS_BUILDING_COLORS: Record<BuildingStatus, { color: string; emissive: string; intensity: number }> = {
  clear: { color: "#1a2330", emissive: "#34d399", intensity: 0.35 },
  partial: { color: "#252214", emissive: "#fbbf24", intensity: 0.35 },
  unmapped: { color: "#181c22", emissive: "#6b7280", intensity: 0.15 },
  conflict: { color: "#2a1618", emissive: "#f87171", intensity: 0.55 },
  stale: { color: "#252214", emissive: "#fbbf24", intensity: 0.3 },
};

export interface Building3D {
  id: string;
  position: THREE.Vector3;
  rotation: number;
  footprint: THREE.Vector2[];
  height: number;
  floors: number;
  status: BuildingStatus;
  selected: boolean;
}

export type BuildingKind = {
  width: number;
  depth: number;
  storyHeight: number;
};

// Sizes in world units. Office 3x5, house 2x2, etc.
export const BUILDING_KINDS: Record<string, BuildingKind> = {
  "OFFICE BLOCK": { width: 3.0, depth: 5.0, storyHeight: 2.6 },
  WAREHOUSE: { width: 5.0, depth: 3.0, storyHeight: 3.2 },
  RESIDENTIAL: { width: 2.0, depth: 2.0, storyHeight: 2.5 },
  GARAGE: { width: 4.0, depth: 2.2, storyHeight: 2.2 },
  SHOPFRONT: { width: 3.0, depth: 2.0, storyHeight: 2.5 },
  TOWER: { width: 2.2, depth: 6.0, storyHeight: 3.0 },
};

export function getBuildingFootprint(building: Building): [number, number][] {
  const kind = BUILDING_KINDS[building.kind] ?? BUILDING_KINDS["RESIDENTIAL"];
  const hw = kind.width / 2;
  const hd = kind.depth / 2;
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
}

export function createFootprint(width: number, depth: number): THREE.Vector2[] {
  const hw = width / 2;
  const hd = depth / 2;
  return [
    new THREE.Vector2(-hw, -hd),
    new THREE.Vector2(hw, -hd),
    new THREE.Vector2(hw, hd),
    new THREE.Vector2(-hw, hd),
  ];
}

export function createBuildingGeometry(footprint: THREE.Vector2[], height: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(footprint.map((p) => new THREE.Vector2(p.x, p.y)));
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  // ExtrudeGeometry extrudes along +Z; rotate so it extrudes along +Y.
  geom.rotateX(-Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

export function buildingWorldPosition(building: Building): THREE.Vector3 {
  const { x, z } = cellWorldPosition(building.hexCol, building.hexRow);
  return new THREE.Vector3(x, getTerrainHeight(x, z), z);
}

export function buildBuilding3D(building: Building, selected: boolean): Building3D {
  const { x, z } = cellWorldPosition(building.hexCol, building.hexRow);
  const kind = BUILDING_KINDS[building.kind] ?? BUILDING_KINDS["RESIDENTIAL"];
  const footprint = createFootprint(kind.width, kind.depth);
  const height = building.floors * kind.storyHeight;
  return {
    id: building.id,
    position: new THREE.Vector3(x, getTerrainHeight(x, z), z),
    rotation: (building.rotation * Math.PI) / 180,
    footprint,
    height,
    floors: building.floors,
    status: building.status,
    selected,
  };
}

export function buildingMaterial(
  status: BuildingStatus,
  selected: boolean,
  xray = false
): THREE.MeshStandardMaterial {
  const palette = STATUS_BUILDING_COLORS[status];
  return new THREE.MeshStandardMaterial({
    color: palette.color,
    emissive: palette.emissive,
    emissiveIntensity: selected ? palette.intensity * 2.2 : palette.intensity,
    roughness: 0.72,
    metalness: 0.08,
    transparent: xray,
    opacity: xray ? 0.22 : 1,
    depthWrite: !xray,
    fog: false,
  });
}
