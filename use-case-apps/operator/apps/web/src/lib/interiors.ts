import { getBuildingFootprint } from "./buildings";
import type { Building } from "../types/data";

export type RoomInterior = {
  id: string;
  label: string;
  polygon: [number, number][];
  type: "hallway" | "room" | "stairwell" | "entrance";
  scanConfidence: number;
  state: "clear" | "unknown";
};

export type FloorInterior = {
  level: number;
  height: number;
  rooms: RoomInterior[];
};

function roomConfidence(state: "clear" | "unknown", buildingStatus: Building["status"]): number {
  if (buildingStatus === "unmapped") return 0;
  if (state === "clear") return 95 + Math.floor(Math.random() * 5);
  if (buildingStatus === "conflict") return 30 + Math.floor(Math.random() * 40);
  if (buildingStatus === "partial" || buildingStatus === "stale") return 40 + Math.floor(Math.random() * 35);
  return 0;
}

function gridRooms(
  building: Building,
  footprint: [number, number][]
): RoomInterior[] {
  const xs = footprint.map((p) => p[0]);
  const ys = footprint.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;

  const cols = building.roomCols;
  const rows = Math.ceil(building.rooms.length / cols);
  const cellW = width / cols;
  const cellH = height / rows;

  return building.rooms.map((room, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x1 = minX + col * cellW;
    const x2 = x1 + cellW;
    const y1 = minY + row * cellH;
    const y2 = y1 + cellH;
    const inset = 0.08;
    const polygon: [number, number][] = [
      [x1 + inset, y1 + inset],
      [x2 - inset, y1 + inset],
      [x2 - inset, y2 - inset],
      [x1 + inset, y2 - inset],
    ];
    const type = room.label === "HALL" ? "hallway" : "room";
    return {
      id: `${building.id}-r${i}`,
      label: room.label,
      polygon,
      type,
      scanConfidence: roomConfidence(room.state, building.status),
      state: room.state,
    };
  });
}

export function generateInteriors(building: Building): FloorInterior[] {
  const footprint = getBuildingFootprint(building);
  const floorHeight = building.floors > 0 ? 2.8 : 2.8;
  const rooms = gridRooms(building, footprint);

  return Array.from({ length: building.floors }, (_, level) => ({
    level,
    height: floorHeight,
    rooms: rooms.map((r) => ({ ...r, id: `${r.id}-f${level}` })),
  }));
}
