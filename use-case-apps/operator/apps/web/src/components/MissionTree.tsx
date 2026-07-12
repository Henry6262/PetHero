import { useState } from "react";
import type { TheaterOperation } from "../types/data";

interface MissionTreeProps {
  operations: TheaterOperation[];
  onFocus: (location?: { lat: number; lon: number }, zoneId?: string) => void;
}

export default function MissionTree({ operations, onFocus }: MissionTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Expand the active operation and its active mission by default.
    const ids = new Set<string>();
    for (const op of operations) {
      if (!op.active) continue;
      ids.add(op.id);
      for (const mission of op.missions) {
        if (!mission.active) continue;
        ids.add(mission.id);
        for (const objective of mission.objectives) {
          ids.add(objective.id);
        }
      }
    }
    return ids;
  });

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const ids = new Set<string>();
    for (const op of operations) {
      ids.add(op.id);
      for (const mission of op.missions) {
        ids.add(mission.id);
        for (const objective of mission.objectives) {
          ids.add(objective.id);
        }
      }
    }
    setExpanded(ids);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <button
          onClick={expandAll}
          style={{
            background: "transparent",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: 11,
          }}
        >
          expand all
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
        {operations.map((op) => (
          <TreeNode key={op.id} id={op.id} label={op.name} expanded={expanded} onToggle={toggle}>
            {op.missions.map((mission) => (
              <TreeNode
                key={mission.id}
                id={mission.id}
                label={mission.name}
                indent={12}
                expanded={expanded}
                onToggle={toggle}
              >
                {mission.objectives.map((objective) => (
                  <TreeNode
                    key={objective.id}
                    id={objective.id}
                    label={objective.label}
                    indent={24}
                    expanded={expanded}
                    onToggle={toggle}
                    onClick={() => onFocus(objective.location, objective.zoneId)}
                  >
                    {objective.targets.map((target) => (
                      <TreeLeaf
                        key={target.id}
                        label={target.name}
                        indent={36}
                        onClick={() => onFocus(target.location, target.zoneId)}
                      />
                    ))}
                  </TreeNode>
                ))}
              </TreeNode>
            ))}
          </TreeNode>
        ))}
      </div>
    </div>
  );
}

function TreeNode({
  id,
  label,
  children,
  indent = 0,
  expanded,
  onToggle,
  onClick,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  indent?: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onClick?: () => void;
}) {
  const isOpen = expanded.has(id);
  return (
    <div>
      <button
        onClick={() => {
          onToggle(id);
          onClick?.();
        }}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          color: "#e5e7eb",
          cursor: "pointer",
          padding: "4px 0",
          paddingLeft: indent,
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span style={{ color: "#6b7280", width: 12 }}>{children ? (isOpen ? "▼" : "▶") : "•"}</span>
        {label}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}

function TreeLeaf({
  label,
  indent,
  onClick,
}: {
  label: string;
  indent: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        color: "#9ca3af",
        cursor: onClick ? "pointer" : "default",
        padding: "2px 0",
        paddingLeft: indent + 16,
        fontSize: 11,
      }}
    >
      • {label}
    </button>
  );
}
