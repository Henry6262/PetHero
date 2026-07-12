import { useEffect, useState } from "react";

type ClearanceRoomState = "pending" | "clearing" | "cleared" | "contact";

type ClearanceRoom = {
  id: string;
  label: string;
  state: ClearanceRoomState;
};

type ClearanceMissionState =
  | "idle"
  | "scanning"
  | "contact"
  | "awaiting_orders"
  | "returning"
  | "complete";

type State = {
  missionState: ClearanceMissionState;
  robot: {
    id: string;
    status: string;
    battery: number;
    cameraUrl: string;
  };
  rooms: ClearanceRoom[];
  currentRoomId: string | null;
  alert?: {
    roomId: string;
    label: string;
    confidence: number;
    message: string;
  };
  log: string[];
};

const STATE_LABEL: Record<ClearanceMissionState, string> = {
  idle: "IDLE",
  scanning: "CLEARING",
  contact: "CONTACT",
  awaiting_orders: "AWAITING ORDERS",
  returning: "RETURNING",
  complete: "COMPLETE",
};

const ROOM_DOT: Record<ClearanceRoomState, string> = {
  pending: "#64748b",
  clearing: "#fbbf24",
  cleared: "#34d399",
  contact: "#f87171",
};

const ROOM_GLOW: Record<ClearanceRoomState, string> = {
  pending: "rgba(100,116,139,0.25)",
  clearing: "rgba(251,191,36,0.35)",
  cleared: "rgba(52,211,153,0.35)",
  contact: "rgba(248,113,113,0.45)",
};

export default function RobotClearancePanel() {
  const [state, setState] = useState<State | null>(null);

  const refresh = async () => {
    try {
      const res = await fetch("/api/room-clearance/state");
      if (res.ok) setState(await res.json());
    } catch {
      // ignore
    }
  };

  const post = async (path: string, body?: unknown) => {
    await fetch(`/api/room-clearance${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    await refresh();
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, []);

  if (!state) return null;

  const active = state.missionState !== "idle";
  const alertOpen = state.missionState === "awaiting_orders" && state.alert;
  const statusClass = alertOpen ? "alert" : active ? "active" : "idle";

  return (
    <aside className="clearance-panel">
      <div className="clearance-head">
        <div className="clearance-robot">
          <div className="clearance-robot-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2a2 2 0 0 1 2 2v2h-4V4a2 2 0 0 1 2-2Z"
                fill="currentColor"
                opacity="0.7"
              />
              <rect x="6" y="6" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
              <circle cx="14" cy="10" r="1.5" fill="currentColor" />
              <path d="M9 16v4M15 16v4M7 20h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="clearance-robot-meta">
            <div className="clearance-robot-id">{state.robot.id}</div>
            <div className="clearance-robot-status">
              {state.robot.status} · battery {state.robot.battery}%
            </div>
          </div>
        </div>
        <span className={`clearance-badge ${statusClass}`}>{STATE_LABEL[state.missionState]}</span>
      </div>

      <div className="clearance-camera">
        {state.robot.cameraUrl ? (
          <img src={state.robot.cameraUrl} alt="robot camera" />
        ) : (
          <div className="clearance-camera-placeholder">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="19" cy="9" r="1" fill="currentColor" />
            </svg>
            <span>camera feed</span>
          </div>
        )}
      </div>

      <div className="clearance-section">
        <div className="clearance-section-title">Floor Plan</div>
        <ClearanceFloorPlan rooms={state.rooms} currentRoomId={state.currentRoomId} />
      </div>

      <div className="clearance-section">
        <div className="clearance-section-title">Clearance Progress</div>
        <div className="clearance-rooms">
          {state.rooms.map((room) => (
            <div
              key={room.id}
              className={`clearance-room ${state.currentRoomId === room.id ? "current" : ""}`}
            >
              <span
                className="clearance-room-dot"
                style={{ background: ROOM_DOT[room.state], boxShadow: `0 0 8px ${ROOM_DOT[room.state]}` }}
              />
              <span className="clearance-room-label">{room.label}</span>
              <span className="clearance-room-state">{room.state}</span>
            </div>
          ))}
        </div>
      </div>

      {alertOpen && (
        <div className="clearance-alert">
          <div className="clearance-alert-title">CONTACT</div>
          <div className="clearance-alert-body">{state.alert!.message}</div>
        </div>
      )}

      <div className="clearance-actions">
        {!active ? (
          <button onClick={() => post("/start")} className="clearance-btn primary">
            Start Clearance
          </button>
        ) : (
          <>
            {state.missionState === "awaiting_orders" && (
              <button onClick={() => post("/continue")} className="clearance-btn primary">
                Continue
              </button>
            )}
            <button onClick={() => post("/retreat")} className="clearance-btn danger">
              Retreat
            </button>
            <button onClick={() => post("/reset")} className="clearance-btn">
              Reset
            </button>
            <button onClick={() => post("/simulate-contact")} className="clearance-btn warning">
              Simulate Contact
            </button>
          </>
        )}
      </div>

      <div className="clearance-section">
        <div className="clearance-section-title">Mission Log</div>
        <div className="clearance-log">
          {state.log.slice(-6).map((entry, i) => (
            <div key={i} className="clearance-log-entry">
              {entry}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function ClearanceFloorPlan({
  rooms,
  currentRoomId,
}: {
  rooms: ClearanceRoom[];
  currentRoomId: string | null;
}) {
  const roomById = (id: string) => rooms.find((r) => r.id === id);

  const layout: { id: string; x: number; y: number; w: number; h: number }[] = [
    { id: "entrance", x: 110, y: 200, w: 80, h: 50 },
    { id: "room-a", x: 30, y: 80, w: 90, h: 70 },
    { id: "room-b", x: 130, y: 20, w: 100, h: 70 },
    { id: "room-c", x: 240, y: 80, w: 90, h: 70 },
  ];

  const corridors = [
    { x1: 150, y1: 200, x2: 150, y2: 145 },
    { x1: 150, y1: 145, x2: 75, y2: 145 },
    { x1: 150, y1: 145, x2: 150, y2: 90 },
    { x1: 150, y1: 145, x2: 285, y2: 145 },
  ];

  return (
    <svg className="clearance-floorplan" viewBox="0 0 360 270" aria-label="room clearance floor plan">
      <defs>
        <filter id="clearance-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {corridors.map((c, i) => (
        <line
          key={i}
          x1={c.x1}
          y1={c.y1}
          x2={c.x2}
          y2={c.y2}
          stroke="rgba(230,235,242,0.15)"
          strokeWidth="12"
          strokeLinecap="round"
        />
      ))}

      {layout.map((room) => {
        const r = roomById(room.id);
        const state = r?.state ?? "pending";
        const isCurrent = room.id === currentRoomId;
        const fill = ROOM_GLOW[state];
        const stroke = ROOM_DOT[state];

        return (
          <g key={room.id}>
            <rect
              x={room.x}
              y={room.y}
              width={room.w}
              height={room.h}
              rx="8"
              fill={fill}
              stroke={stroke}
              strokeWidth={isCurrent ? 2.5 : 1.5}
              filter={isCurrent ? "url(#clearance-glow)" : undefined}
              className={isCurrent ? "clearance-floor-room current" : "clearance-floor-room"}
            />
            <text
              x={room.x + room.w / 2}
              y={room.y + room.h / 2 + 4}
              textAnchor="middle"
              fill={state === "pending" ? "rgba(230,235,242,0.6)" : "#e6ebf2"}
              fontSize="11"
              fontWeight="700"
              letterSpacing="0.04em"
            >
              {r?.label ?? room.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
