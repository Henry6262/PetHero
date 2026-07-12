import { useState } from "react";
import type { Mission, MissionObjective, SectorStatus } from "../../types/data";

const STATUS_DOT: Record<SectorStatus, string> = {
  friendly: "#3b82f6",
  hostile: "#ef4444",
  neutral: "#94a3b8",
  objective: "#f5e600",
};

export default function MissionPanel({
  missions,
  onChange,
}: {
  missions: Mission[];
  onChange: (missions: Mission[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(missions.find((m) => m.active)?.id ?? missions[0]?.id);
  const [newObjective, setNewObjective] = useState("");

  const selected = missions.find((m) => m.id === selectedId) ?? missions[0];
  if (!selected) return null;

  const setActive = (id: string) => {
    onChange(
      missions.map((m) => ({
        ...m,
        active: m.id === id,
      }))
    );
    setSelectedId(id);
  };

  const toggleObjective = (objectiveId: string) => {
    const next = missions.map((m) => {
      if (m.id !== selected.id) return m;
      return {
        ...m,
        objectives: m.objectives.map((o) =>
          o.id === objectiveId
            ? { ...o, status: (o.status === "complete" ? "pending" : o.status === "pending" ? "active" : "complete") as MissionObjective["status"] }
            : o
        ),
      };
    });
    onChange(next);
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    const next = missions.map((m) => {
      if (m.id !== selected.id) return m;
      return {
        ...m,
        objectives: [
          ...m.objectives,
          {
            id: `O-${Date.now()}`,
            label: newObjective.trim(),
            status: "pending" as const,
          },
        ],
      };
    });
    onChange(next);
    setNewObjective("");
  };

  return (
    <div className="mission-panel">
      <div className="panel-title">
        <strong>Missions</strong>
        <small>{missions.length} PLANS</small>
      </div>

      <div className="mission-list">
        {missions.map((m) => (
          <button
            key={m.id}
            className={`mission-item ${m.id === selected.id ? "active" : ""} ${m.active ? "live" : ""}`}
            onClick={() => setActive(m.id)}
          >
            <span className="mission-status" style={{ background: m.active ? "#22c55e" : "#64748b" }} />
            <span className="mission-name">{m.name}</span>
            <span className="mission-meta">{m.sectors.length} sectors · {m.objectives.length} obj</span>
          </button>
        ))}
      </div>

      <div className="mission-detail">
        <div className="mission-detail-head">
          <strong>{selected.name}</strong>
          <span className={selected.active ? "live-badge" : "draft-badge"}>{selected.active ? "ACTIVE" : "DRAFT"}</span>
        </div>

        <div className="mission-section">
          <span className="section-label">Sectors</span>
          <div className="sector-chips">
            {selected.sectors.map((s) => (
              <span key={s.id} className="sector-chip" style={{ "--sector-color": STATUS_DOT[s.status] } as React.CSSProperties}>
                <i style={{ background: STATUS_DOT[s.status], boxShadow: `0 0 6px ${STATUS_DOT[s.status]}` }} />
                {s.name}
              </span>
            ))}
          </div>
        </div>

        <div className="mission-section">
          <span className="section-label">Objectives</span>
          <div className="objective-list">
            {selected.objectives.map((o) => (
              <button
                key={o.id}
                className={`objective-item ${o.status}`}
                onClick={() => toggleObjective(o.id)}
                title="Click to cycle status"
              >
                <span className={`objective-dot ${o.status}`} />
                <span className="objective-label">{o.label}</span>
                <span className="objective-status">{o.status}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mission-add">
          <input
            type="text"
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addObjective()}
            placeholder="Add objective..."
          />
          <button onClick={addObjective} disabled={!newObjective.trim()}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}
