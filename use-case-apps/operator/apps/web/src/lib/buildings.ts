import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { cellWorldPosition } from "./hex";
import { getTerrainHeight } from "./terrain";
import { STATUS_THEME } from "./theme";
import type { Building, BuildingStatus } from "../types/data";

export interface Building3D {
  id: string;
  kind: string;
  hexCol: number;
  hexRow: number;
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
  BARRACKS: { width: 6.0, depth: 2.4, storyHeight: 2.4 },
  "WATCH TOWER": { width: 1.6, depth: 1.6, storyHeight: 2.8 },
};

const ROOF_KINDS: Record<string, "flat" | "peaked" | "shed"> = {
  "OFFICE BLOCK": "flat",
  WAREHOUSE: "shed",
  RESIDENTIAL: "peaked",
  GARAGE: "flat",
  SHOPFRONT: "flat",
  TOWER: "flat",
  BARRACKS: "shed",
  "WATCH TOWER": "flat",
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

const FACADE_TEXTURE_CACHE = new Map<string, THREE.CanvasTexture>();

export function createFacadeTexture(kind: string): THREE.CanvasTexture {
  const cached = FACADE_TEXTURE_CACHE.get(kind);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Wall color varies slightly by kind.
  const wallColors: Record<string, string> = {
    "OFFICE BLOCK": "#6b7078",
    WAREHOUSE: "#7d7569",
    RESIDENTIAL: "#8c7f70",
    GARAGE: "#5e646b",
    SHOPFRONT: "#7a8189",
    TOWER: "#5c6168",
    BARRACKS: "#6e685d",
    "WATCH TOWER": "#5a5f66",
  };

  ctx.fillStyle = wallColors[kind] ?? "#6b7078";
  ctx.fillRect(0, 0, 256, 256);

  // Subtle noise
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  // Window grid
  const rows = 4;
  const cols = 4;
  const padX = 32;
  const padY = 28;
  const winW = (256 - padX * 2) / cols - 8;
  const winH = (256 - padY * 2) / rows - 10;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * (winW + 8);
      const y = padY + r * (winH + 10);
      // Window frame
      ctx.fillStyle = "#1a2330";
      ctx.fillRect(x, y, winW, winH);
      // Glint
      ctx.fillStyle = "rgba(159,208,255,0.12)";
      ctx.fillRect(x + 2, y + 2, winW - 4, winH / 2);
      // Sill
      ctx.fillStyle = "#4a5057";
      ctx.fillRect(x - 2, y + winH, winW + 4, 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  FACADE_TEXTURE_CACHE.set(kind, texture);
  return texture;
}

function footprintDimensions(footprint: THREE.Vector2[]): { width: number; depth: number } {
  const xs = footprint.map((p) => p.x);
  const ys = footprint.map((p) => p.y);
  return { width: Math.max(...xs) - Math.min(...xs), depth: Math.max(...ys) - Math.min(...ys) };
}

export function applyFacadeUVs(geometry: THREE.BufferGeometry, footprint: THREE.Vector2[], height: number): void {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const { width, depth } = footprintDimensions(footprint);
  const perimeter = 2 * (width + depth);

  // ExtrudeGeometry side UVs: u is along the perimeter, v is along the extrusion height.
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Roof/top faces are at y ~= height; leave their UVs roughly planar.
    if (y >= height - 0.01) {
      uv.setXY(i, (x / width + 0.5), (z / depth + 0.5));
      continue;
    }

    // Approximate perimeter coordinate.
    let u = 0;
    if (Math.abs(z - (-depth / 2)) < 0.01) {
      u = (x / width + 0.5) * width;
    } else if (Math.abs(z - depth / 2) < 0.01) {
      u = width + depth + (width / 2 - x);
    } else if (Math.abs(x - width / 2) < 0.01) {
      u = width + (z / depth + 0.5) * depth;
    } else if (Math.abs(x - (-width / 2)) < 0.01) {
      u = width + depth + width + (depth / 2 - z);
    }

    const v = y / height;
    uv.setXY(i, u / 2.5, v);
  }
  uv.needsUpdate = true;
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
  applyFacadeUVs(geom, footprint, height);
  geom.computeVertexNormals();
  return geom;
}

export function createRoofGeometry(footprint: THREE.Vector2[], kind: string): THREE.BufferGeometry | null {
  const roofType = ROOF_KINDS[kind] ?? "flat";
  const { width, depth } = footprintDimensions(footprint);

  if (roofType === "flat") {
    // Simple flat roof cap with a small parapet lip.
    const inset = 0.12;
    const inner = footprint.map((p) => new THREE.Vector2(
      Math.sign(p.x) * Math.max(0, Math.abs(p.x) - inset),
      Math.sign(p.y) * Math.max(0, Math.abs(p.y) - inset)
    ));
    const capShape = new THREE.Shape(inner);
    const cap = new THREE.ExtrudeGeometry(capShape, { depth: 0.1, bevelEnabled: false });
    cap.rotateX(-Math.PI / 2);

    // HVAC box.
    const hvacW = Math.max(0.4, width * 0.22);
    const hvacD = Math.max(0.4, depth * 0.22);
    const hvacH = 0.5;
    const hvac = new THREE.BoxGeometry(hvacW, hvacH, hvacD);
    hvac.translate(width * 0.15, 0.1 + hvacH / 2, depth * 0.15);

    // Parapet lip.
    const lipShape = new THREE.Shape(footprint);
    const lipPath = new THREE.Path(inner);
    lipShape.holes.push(lipPath);
    const lip = new THREE.ExtrudeGeometry(lipShape, { depth: 0.25, bevelEnabled: false });
    lip.rotateX(-Math.PI / 2);

    return mergeGeometries([cap.toNonIndexed(), hvac.toNonIndexed(), lip.toNonIndexed()]);
  }

  if (roofType === "peaked") {
    // Gable roof: ridge runs along the longer side.
    const ridgeH = 0.8 + Math.min(width, depth) * 0.25;
    const hw = width / 2;
    const hd = depth / 2;

    const positions: number[] = [];
    const indices: number[] = [];

    if (depth >= width) {
      // Ridge along Z.
      positions.push(
        -hw, 0, -hd,
        hw, 0, -hd,
        0, ridgeH, -hd,
        -hw, 0, hd,
        hw, 0, hd,
        0, ridgeH, hd
      );
      // Front and back gables.
      indices.push(0, 2, 1);
      indices.push(3, 4, 5);
      // Left and right slopes.
      indices.push(0, 3, 5, 0, 5, 2);
      indices.push(1, 2, 5, 1, 5, 4);
    } else {
      // Ridge along X.
      positions.push(
        -hw, 0, -hd,
        -hw, 0, hd,
        -hw, ridgeH, 0,
        hw, 0, -hd,
        hw, 0, hd,
        hw, ridgeH, 0
      );
      // Left and right gables.
      indices.push(0, 1, 2);
      indices.push(3, 5, 4);
      // Front and back slopes.
      indices.push(0, 2, 5, 0, 5, 3);
      indices.push(1, 4, 5, 1, 5, 2);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  if (roofType === "shed") {
    // Single-slope roof: high on the +Z side, low on the -Z side.
    const slopeH = 0.6 + Math.max(width, depth) * 0.15;
    const hw = width / 2;
    const hd = depth / 2;

    const positions = [
      -hw, 0, -hd,
      hw, 0, -hd,
      hw, slopeH, hd,
      -hw, slopeH, hd,
    ];
    const indices = [
      0, 2, 1, // top slope
      0, 3, 2,
    ];

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  return null;
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
    kind: building.kind,
    hexCol: building.hexCol,
    hexRow: building.hexRow,
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
  kind: string,
  selected: boolean,
  xray = false
): THREE.MeshStandardMaterial {
  const theme = STATUS_THEME[status];
  const texture = createFacadeTexture(kind);
  return new THREE.MeshStandardMaterial({
    color: "#7a8189",
    map: texture,
    emissive: theme.emissive,
    emissiveIntensity: selected ? theme.emissiveIntensity * 2.2 : theme.emissiveIntensity,
    roughness: 0.72,
    metalness: 0.08,
    transparent: xray,
    opacity: xray ? 0.22 : 1,
    depthWrite: !xray,
    fog: false,
  });
}

const OUTLINE_MATERIAL = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});

export function createBuildingOutlineGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  return new THREE.EdgesGeometry(geometry);
}

export function buildingOutlineMaterial(): THREE.LineBasicMaterial {
  return OUTLINE_MATERIAL;
}
