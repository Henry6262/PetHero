import { useMemo } from "react";
import * as THREE from "three";
import { generateInteriors } from "../../lib/interiors";
import { buildingWorldPosition } from "../../lib/buildings";
import type { Building } from "../../data/sections";
import type { RoomInterior } from "../../lib/interiors";

function roomColor(confidence: number, state: RoomInterior["state"]): string {
  if (state === "unknown") return "#6b7280";
  if (confidence >= 90) return "#34d399";
  if (confidence >= 50) return "#fbbf24";
  return "#f87171";
}

export default function XRayBuilding({
  building,
  selectedRoom,
  visible,
  floor,
}: {
  building: Building | null;
  selectedRoom: RoomInterior | null;
  visible: boolean;
  floor: number;
}) {
  const data = useMemo(() => {
    if (!building) return null;
    const interiors = generateInteriors(building);
    const position = buildingWorldPosition(building);
    return { building, interiors, position };
  }, [building]);

  if (!visible || !data) return null;

  const { building: b, interiors, position } = data;
  const currentFloor = interiors[Math.min(floor, interiors.length - 1)];
  if (!currentFloor) return null;

  const floorY = currentFloor.level * currentFloor.height;
  const rotationY = (b.rotation * Math.PI) / 180;

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
    >
      {currentFloor.rooms.map((room) => {
        const xs = room.polygon.map((p) => p[0]);
        const zs = room.polygon.map((p) => p[1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minZ = Math.min(...zs);
        const maxZ = Math.max(...zs);
        const w = maxX - minX;
        const d = maxZ - minZ;
        const cx = (minX + maxX) / 2;
        const cz = (minZ + maxZ) / 2;
        const isSelected = selectedRoom?.id === room.id;
        const color = roomColor(room.scanConfidence, room.state);

        return (
          <mesh
            key={room.id}
            position={[cx, floorY + currentFloor.height / 2, cz]}
          >
            <boxGeometry args={[w, currentFloor.height, d]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={isSelected ? 0.85 : 0.42}
              emissive={color}
              emissiveIntensity={isSelected ? 0.6 : 0.15}
              roughness={0.7}
              metalness={0.1}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
