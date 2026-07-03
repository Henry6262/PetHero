import * as THREE from "three";
import { generateCells, cellWorldPosition, HEX_SIZE } from "./hex";
import { getTerrainHeight } from "./terrain";

export type PropType = "car" | "barrier" | "crate" | "dock-beacon";

export interface PropInstance {
  type: PropType;
  position: THREE.Vector3;
  rotation: number;
  scale: THREE.Vector3;
  color: string;
}

const PROP_COLORS = {
  car: ["#5fb2ff", "#94a3b8", "#fbbf24", "#cbd5e1"],
  barrier: ["#f97316", "#ef4444", "#e5e7eb"],
  crate: ["#8b5cf6", "#64748b", "#a16207"],
  "dock-beacon": ["#34d399"],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateProps(): PropInstance[] {
  const cells = generateCells();
  const props: PropInstance[] = [];
  const rng = seededRandom(42);

  // Place props along street cells, avoiding the station and goal.
  for (const cell of cells) {
    if (!cell.street) continue;
    if (cell.station || cell.goal) continue;
    const { x, z } = cellWorldPosition(cell.col, cell.row);
    if (cell.route && rng() > 0.65) {
      // Cars along the main route.
      const px = x + (rng() - 0.5) * HEX_SIZE;
      const pz = z + (rng() - 0.5) * HEX_SIZE;
      props.push({
        type: "car",
        position: new THREE.Vector3(px, getTerrainHeight(px, pz) + 0.1, pz),
        rotation: rng() * Math.PI * 2,
        scale: new THREE.Vector3(0.9, 0.9, 0.9),
        color: pick(PROP_COLORS.car),
      });
      continue;
    }
    if (rng() > 0.92) {
      const type: PropType = rng() > 0.5 ? "barrier" : "crate";
      const px = x + (rng() - 0.5) * HEX_SIZE * 0.7;
      const pz = z + (rng() - 0.5) * HEX_SIZE * 0.7;
      props.push({
        type,
        position: new THREE.Vector3(px, getTerrainHeight(px, pz) + 0.1, pz),
        rotation: rng() * Math.PI * 2,
        scale: new THREE.Vector3(0.7, 0.7, 0.7),
        color: pick(PROP_COLORS[type]),
      });
    }
  }

  // Dock beacon at the station cell.
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

export function propGeometry(type: PropType): THREE.BufferGeometry {
  switch (type) {
    case "car":
      return new THREE.BoxGeometry(1.8, 0.9, 3.6);
    case "barrier":
      return new THREE.CylinderGeometry(0.35, 0.35, 1.8, 12);
    case "crate":
      return new THREE.BoxGeometry(1.4, 1.4, 1.4);
    case "dock-beacon":
      return new THREE.CylinderGeometry(0.6, 0.8, 0.25, 16);
  }
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
