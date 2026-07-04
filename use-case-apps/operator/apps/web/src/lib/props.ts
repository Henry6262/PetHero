import * as THREE from "three";
import { generateCells, cellWorldPosition, HEX_SIZE } from "./hex";
import { getTerrainHeight } from "./terrain";
import type { Building } from "../data/sections";

export type PropType =
  | "car"
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

const PROP_COLORS = {
  car: ["#5fb2ff", "#94a3b8", "#fbbf24", "#cbd5e1", "#f87171", "#a78bfa"],
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

export function generateProps(buildings: Building[]): PropInstance[] {
  const cells = generateCells();
  const props: PropInstance[] = [];
  const rng = seededRandom(42);

  const buildingPositions = buildings.map((b) => {
    const { x, z } = cellWorldPosition(b.hexCol, b.hexRow);
    return { x, z, id: b.id };
  });

  // --- Compound walls around the central building cluster ---
  const compoundMargin = 5;
  const xs = buildingPositions.map((b) => b.x);
  const zs = buildingPositions.map((b) => b.z);
  const minX = Math.min(...xs) - compoundMargin;
  const maxX = Math.max(...xs) + compoundMargin;
  const minZ = Math.min(...zs) - compoundMargin;
  const maxZ = Math.max(...zs) + compoundMargin;
  const segmentLength = 3.5;
  const wallHeight = 2.4;

  // Gate opening on the top edge, slightly off-center.
  const gateCenterZ = minZ;
  const gateCenterX = (minX + maxX) / 2 + 4;
  const gateWidth = 6;

  function nearGate(x: number, z: number, isHorizontal: boolean): boolean {
    if (!isHorizontal) return false;
    const dx = x - gateCenterX;
    return Math.abs(dx) < gateWidth / 2;
  }

  // Top and bottom walls.
  for (let x = minX; x <= maxX; x += segmentLength) {
    if (!nearGate(x, minZ, true)) {
      props.push(wallSegment(x, minZ, 0, segmentLength, wallHeight, rng));
    }
    props.push(wallSegment(x, maxZ, 0, segmentLength, wallHeight, rng));
  }
  // Left and right walls.
  for (let z = minZ + segmentLength; z < maxZ; z += segmentLength) {
    props.push(wallSegment(minX, z, Math.PI / 2, segmentLength, wallHeight, rng));
    props.push(wallSegment(maxX, z, Math.PI / 2, segmentLength, wallHeight, rng));
  }

  // Gate barrier.
  props.push({
    type: "gate",
    position: new THREE.Vector3(gateCenterX, getTerrainHeight(gateCenterX, gateCenterZ), gateCenterZ),
    rotation: 0,
    scale: new THREE.Vector3(1.2, 1, 1),
    color: "#9ca3af",
  });

  // --- Street props ---
  for (const cell of cells) {
    if (!cell.street) continue;
    if (cell.station || cell.goal) continue;

    const { x, z } = cellWorldPosition(cell.col, cell.row);
    const roll = rng();

    if (cell.route) {
      // Main route: cars, occasional wrecked car, barriers.
      if (roll > 0.55) {
        const type: PropType = roll > 0.9 ? "wrecked-car" : roll > 0.75 ? "truck" : "car";
        const length = type === "truck" ? 4.8 : 3.6;
        const px = x + (rng() - 0.5) * HEX_SIZE;
        const pz = z + (rng() - 0.5) * HEX_SIZE;
        props.push({
          type,
          position: new THREE.Vector3(px, getTerrainHeight(px, pz) + 0.12, pz),
          rotation: rng() * Math.PI * 2,
          scale: type === "truck" ? new THREE.Vector3(1.1, 1.1, 1.1) : new THREE.Vector3(0.95, 0.95, 0.95),
          color: pick(PROP_COLORS[type], rng),
        });
      }
      continue;
    }

    // Side streets and yards.
    if (roll > 0.96) {
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
    if (rng() > 0.35) continue;
    const angle = rng() * Math.PI * 2;
    const dist = 3 + rng() * 3;
    const px = bp.x + Math.cos(angle) * dist;
    const pz = bp.z + Math.sin(angle) * dist;
    const type: PropType = rng() > 0.6 ? "car" : rng() > 0.3 ? "crate" : "barrel";
    props.push({
      type,
      position: new THREE.Vector3(px, getTerrainHeight(px, pz) + 0.1, pz),
      rotation: rng() * Math.PI * 2,
      scale: new THREE.Vector3(0.9, 0.9, 0.9),
      color: pick(PROP_COLORS[type], rng),
    });
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

  return props;
}

function wallSegment(
  x: number,
  z: number,
  rotation: number,
  length: number,
  height: number,
  rng: () => number
): PropInstance {
  // Slight damage variation: some walls shorter.
  const damaged = rng() > 0.85;
  const h = damaged ? height * (0.4 + rng() * 0.4) : height;
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
    case "car":
      return new THREE.BoxGeometry(1.9, 1.0, 3.8);
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
