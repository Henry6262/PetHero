import * as THREE from "three";
import { generateCells, cellWorldPosition, HEX_SIZE } from "./hex";
import { getTerrainHeight } from "./terrain";
import type { Building } from "../data/sections";

export type PropType =
  | "wrecked-car"
  | "truck"
  | "barrier"
  | "sandbag-wall"
  | "crate"
  | "barrel"
  | "tire-stack"
  | "wall"
  | "gate"
  | "dock-beacon";

export interface PropInstance {
  type: PropType;
  position: THREE.Vector3;
  rotation: number;
  scale: THREE.Vector3;
  color: string;
}

export interface CarInstance {
  position: THREE.Vector3;
  rotation: number;
  scale: THREE.Vector3;
  color: string;
}

const PROP_COLORS = {
  "wrecked-car": ["#3f3f46", "#52525b", "#713f12", "#1f2937"],
  truck: ["#4b5563", "#166534", "#92400e", "#1e3a8a"],
  barrier: ["#f97316", "#ef4444", "#e5e7eb", "#f59e0b"],
  "sandbag-wall": ["#a68b5b", "#8c7352", "#bfa37a"],
  crate: ["#8b5cf6", "#64748b", "#a16207", "#92400e"],
  barrel: ["#1d4ed8", "#b91c1c", "#065f46", "#52525b"],
  "tire-stack": ["#1f2937", "#111827", "#374151"],
  wall: ["#78716c", "#57534e", "#a8a29e", "#d6d3d1"],
  gate: ["#9ca3af"],
  "dock-beacon": ["#34d399"],
};

const CAR_COLORS = ["#5fb2ff", "#94a3b8", "#fbbf24", "#cbd5e1", "#f87171", "#a78bfa", "#34d399"];

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateProps(buildings: Building[]): { props: PropInstance[]; cars: CarInstance[] } {
  const cells = generateCells();
  const props: PropInstance[] = [];
  const cars: CarInstance[] = [];
  const rng = seededRandom(42);

  const buildingPositions = buildings.map((b) => {
    const { x, z } = cellWorldPosition(b.hexCol, b.hexRow);
    return { x, z, id: b.id };
  });

  // --- One outer wall side (top edge of battle zone) ---
  const xs = buildingPositions.map((b) => b.x);
  const zs = buildingPositions.map((b) => b.z);
  const minX = Math.min(...xs) - 4;
  const maxX = Math.max(...xs) + 4;
  const maxZ = Math.max(...zs) + 4;
  const segmentLength = 3.6;
  const wallHeight = 2.4;

  for (let x = minX; x <= maxX; x += segmentLength) {
    props.push(wallSegment(x, maxZ, 0, segmentLength, wallHeight, rng));
  }

  // --- Internal walls inside the battle zone ---
  // Place wall segments along some street cells to create alleys and cover.
  for (const cell of cells) {
    if (!cell.street) continue;
    if (cell.station || cell.goal) continue;
    if (cell.route && rng() > 0.75) continue; // keep route mostly clear

    const { x, z } = cellWorldPosition(cell.col, cell.row);

    // Chance for an internal wall segment across this street cell.
    if (rng() > 0.92) {
      const rotation = rng() > 0.5 ? 0 : Math.PI / 2;
      props.push(wallSegment(x, z, rotation, segmentLength, wallHeight, rng));
    }
  }

  // Random internal wall segments in non-street open ground.
  for (let i = 0; i < 18; i++) {
    const x = minX + rng() * (maxX - minX);
    const z = (Math.min(...zs) - 4) + rng() * (maxZ - (Math.min(...zs) - 4));
    if (tooCloseToBuilding(x, z, buildingPositions)) continue;
    props.push(wallSegment(x, z, rng() > 0.5 ? 0 : Math.PI / 2, segmentLength, wallHeight, rng));
  }

  // --- Street props and cars ---
  for (const cell of cells) {
    if (!cell.street) continue;
    if (cell.station || cell.goal) continue;

    const { x, z } = cellWorldPosition(cell.col, cell.row);
    const roll = rng();

    if (cell.route) {
      // Main route: reusable textured cars, occasional wrecked car/truck, barriers.
      if (roll > 0.5) {
        const px = x + (rng() - 0.5) * HEX_SIZE;
        const pz = z + (rng() - 0.5) * HEX_SIZE;
        if (roll > 0.88) {
          props.push({
            type: "wrecked-car",
            position: new THREE.Vector3(px, getTerrainHeight(px, pz) + 0.12, pz),
            rotation: rng() * Math.PI * 2,
            scale: new THREE.Vector3(0.95, 0.95, 0.95),
            color: pick(PROP_COLORS["wrecked-car"], rng),
          });
        } else if (roll > 0.72) {
          props.push({
            type: "truck",
            position: new THREE.Vector3(px, getTerrainHeight(px, pz) + 0.12, pz),
            rotation: rng() * Math.PI * 2,
            scale: new THREE.Vector3(1.1, 1.1, 1.1),
            color: pick(PROP_COLORS.truck, rng),
          });
        } else {
          // Reusable textured cars are tracked separately.
          cars.push({
            position: new THREE.Vector3(px, getTerrainHeight(px, pz) + 0.12, pz),
            rotation: rng() * Math.PI * 2,
            scale: new THREE.Vector3(1, 1, 1),
            color: pick(CAR_COLORS, rng),
          });
        }
      }
      continue;
    }

    // Side streets and yards.
    if (roll > 0.95) {
      const type: PropType = pick(["barrier", "sandbag-wall", "barrel", "tire-stack", "crate"], rng);
      const px = x + (rng() - 0.5) * HEX_SIZE * 0.7;
      const pz = z + (rng() - 0.5) * HEX_SIZE * 0.7;
      props.push({
        type,
        position: new THREE.Vector3(px, getTerrainHeight(px, pz) + 0.1, pz),
        rotation: rng() * Math.PI * 2,
        scale: new THREE.Vector3(0.85, 0.85, 0.85),
        color: pick(PROP_COLORS[type], rng),
      });
    }
  }

  // --- Extra cars/barriers near buildings ---
  for (const bp of buildingPositions) {
    if (rng() > 0.4) continue;
    const angle = rng() * Math.PI * 2;
    const dist = 3 + rng() * 3;
    const px = bp.x + Math.cos(angle) * dist;
    const pz = bp.z + Math.sin(angle) * dist;
    if (rng() > 0.55) {
      cars.push({
        position: new THREE.Vector3(px, getTerrainHeight(px, pz) + 0.12, pz),
        rotation: rng() * Math.PI * 2,
        scale: new THREE.Vector3(1, 1, 1),
        color: pick(CAR_COLORS, rng),
      });
    } else {
      const type: PropType = rng() > 0.5 ? "crate" : "barrel";
      props.push({
        type,
        position: new THREE.Vector3(px, getTerrainHeight(px, pz) + 0.1, pz),
        rotation: rng() * Math.PI * 2,
        scale: new THREE.Vector3(0.85, 0.85, 0.85),
        color: pick(PROP_COLORS[type], rng),
      });
    }
  }

  // --- Dock beacon at the station cell ---
  const station = cells.find((c) => c.station);
  if (station) {
    const { x, z } = cellWorldPosition(station.col, station.row);
    props.push({
      type: "dock-beacon",
      position: new THREE.Vector3(x, getTerrainHeight(x, z) + 0.05, z),
      rotation: 0,
      scale: new THREE.Vector3(1, 1, 1),
      color: PROP_COLORS["dock-beacon"][0],
    });
  }

  return { props, cars };
}

function tooCloseToBuilding(x: number, z: number, buildings: { x: number; z: number; id: string }[], minDist = 3.5): boolean {
  for (const b of buildings) {
    const dx = b.x - x;
    const dz = b.z - z;
    if (dx * dx + dz * dz < minDist * minDist) return true;
  }
  return false;
}

function wallSegment(
  x: number,
  z: number,
  rotation: number,
  length: number,
  height: number,
  rng: () => number
): PropInstance {
  const damaged = rng() > 0.82;
  const h = damaged ? height * (0.35 + rng() * 0.45) : height;
  return {
    type: "wall",
    position: new THREE.Vector3(x, getTerrainHeight(x, z) + h / 2 - 0.1, z),
    rotation,
    scale: new THREE.Vector3(1, h / height, 1),
    color: pick(PROP_COLORS.wall, rng),
  };
}

export function propGeometry(type: PropType): THREE.BufferGeometry {
  switch (type) {
    case "wrecked-car":
      return new THREE.BoxGeometry(1.9, 0.75, 3.6);
    case "truck":
      return new THREE.BoxGeometry(2.2, 2.2, 5.2);
    case "barrier":
      return new THREE.BoxGeometry(2.2, 0.9, 0.5);
    case "sandbag-wall":
      return new THREE.BoxGeometry(2.4, 0.9, 0.8);
    case "crate":
      return new THREE.BoxGeometry(1.4, 1.4, 1.4);
    case "barrel":
      return new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16);
    case "tire-stack":
      return new THREE.CylinderGeometry(0.45, 0.45, 0.9, 16);
    case "wall":
      return new THREE.BoxGeometry(3.6, 2.4, 0.45);
    case "gate":
      return new THREE.BoxGeometry(4.5, 1.6, 0.35);
    case "dock-beacon":
      return new THREE.CylinderGeometry(0.6, 0.8, 0.25, 16);
  }
}
