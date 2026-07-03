import { useMemo } from "react";
import { generateInteriors, type RoomInterior } from "../../lib/interiors";
import type { Building } from "../../data/sections";

export default function FloorplanPanel({
  building,
  selectedRoomId,
  onSelectRoom,
  floor,
  onFloorChange,
}: {
  building: Building;
  selectedRoomId: string | null;
  onSelectRoom: (room: RoomInterior | null) => void;
  floor: number;
  onFloorChange: (floor: number) => void;
}) {
  const interiors = useMemo(() => generateInteriors(building), [building]);
  const currentFloor = interiors[Math.min(floor, interiors.length - 1)];

  if (!currentFloor) return null;

  // Compute SVG viewBox from room polygons.
  const allPoints = currentFloor.rooms.flatMap((r) => r.polygon);
  const minX = Math.min(...allPoints.map((p) => p[0]));
  const maxX = Math.max(...allPoints.map((p) => p[0]));
  const minY = Math.min(...allPoints.map((p) => p[1]));
  const maxY = Math.max(...allPoints.map((p) => p[1]));
  const pad = 0.6;
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  const roomFill = (room: RoomInterior) => {
    if (room.state === "clear") return `rgba(52, 211, 153, ${0.08 + room.scanConfidence / 1000})`;
    if (building.status === "conflict") return "rgba(248, 113, 113, 0.12)";
    return "rgba(255, 255, 255, 0.03)";
  };

  const roomStroke = (room: RoomInterior) => {
    if (selectedRoomId === room.id) return "#9fd0ff";
    if (room.state === "clear") return "rgba(52, 211, 153, 0.55)";
    if (building.status === "conflict") return "rgba(248, 113, 113, 0.5)";
    return "rgba(255, 255, 255, 0.18)";
  };

  return (
    <div className="floorplan-panel">
      <div className="floorplan-head">
        <span className="lbl">FLOORPLAN · FLOOR</span>
        <div className="floor-selector">
          {interiors.map((f) => (
            <button
              key={f.level}
              className={f.level === floor ? "active" : undefined}
              onClick={() => onFloorChange(f.level)}
            >
              {f.level + 1}
            </button>
          ))}
        </div>
      </div>
      <svg className="floorplan-svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        {currentFloor.rooms.map((room) => {
          const points = room.polygon.map((p) => `${p[0]},${p[1]}`).join(" ");
          const cx = room.polygon.reduce((s, p) => s + p[0], 0) / room.polygon.length;
          const cy = room.polygon.reduce((s, p) => s + p[1], 0) / room.polygon.length;
          return (
            <g key={room.id} onClick={() => onSelectRoom(room)} className="floorplan-room">
              <polygon
                points={points}
                fill={roomFill(room)}
                stroke={roomStroke(room)}
                strokeWidth={selectedRoomId === room.id ? 0.12 : 0.08}
                strokeDasharray={room.state === "unknown" ? "0.2,0.15" : undefined}
              />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="floorplan-label">
                {room.label}
              </text>
              {room.state === "clear" && (
                <text x={cx} y={cy + 0.45} textAnchor="middle" dominantBaseline="middle" className="floorplan-confidence">
                  {room.scanConfidence}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
