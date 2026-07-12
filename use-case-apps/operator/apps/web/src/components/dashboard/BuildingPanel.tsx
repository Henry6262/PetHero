import type { Building } from "../../types/data";
import { STATUS_THEME } from "../../lib/theme";
import { FloorplanPanel } from "../scene";
import type { RoomInterior } from "../../lib/interiors";

export interface BuildingPanelProps {
  building: Building;
  selectedRoom: RoomInterior | null;
  selectedFloor: number;
  onSelectRoom: (room: RoomInterior | null) => void;
  onFloorChange: (floor: number) => void;
  onClose: () => void;
}

export default function BuildingPanel({
  building,
  selectedRoom,
  selectedFloor,
  onSelectRoom,
  onFloorChange,
  onClose,
}: BuildingPanelProps) {
  const theme = STATUS_THEME[building.status];

  return (
    <div className="building-panel sheet-scroll">
      <div className="building-panel-head">
        <div className="building-panel-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9fd0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 21V8l7-4 7 4v13" />
            <path d="M9 21v-5h6v5" />
            <path d="M9 11h.01M15 11h.01" />
          </svg>
        </div>
        <div className="building-panel-title">
          <div>{building.id} · {building.kind}</div>
          <small>{building.w}×{building.h2} cells · {building.area} m² · {building.floors} floors</small>
        </div>
        <button className="sheet-toggle" onClick={onClose} title="Close">✕</button>
      </div>
      <div className="building-panel-body">
        <div className="building-panel-status">
          <span className="lbl">STATUS</span>
          <span style={{ color: theme.color, background: theme.bg, border: `1px solid ${theme.border}` }}>
            {theme.label}
          </span>
        </div>
        <div>
          <FloorplanPanel
            building={building}
            selectedRoomId={selectedRoom?.id ?? null}
            onSelectRoom={onSelectRoom}
            floor={selectedFloor}
            onFloorChange={onFloorChange}
          />
        </div>
        <div>
          <div className="lbl">DRONE FRAMES · SHARED</div>
          {building.frames > 0 ? (
            <div className="building-panel-frames">
              {Array.from({ length: Math.min(building.frames, 6) }).map((_, i) => (
                <div key={i}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(159,208,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="6" width="18" height="13" rx="2" />
                    <circle cx="12" cy="12.5" r="3.2" />
                    <path d="M8 6l1.5-2h5L16 6" />
                  </svg>
                  <span>{building.by}·{i + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="building-panel-empty">No imagery shared yet — assign D1 for a pass.</span>
          )}
        </div>
        <div className="building-panel-provenance">
          <span style={{ background: theme.color }} />
          <span>{building.status === "unmapped" ? "Not yet inspected — assign a scan" : `Inspected by ${building.by} · ${building.ago} ago`}</span>
        </div>
      </div>
    </div>
  );
}
