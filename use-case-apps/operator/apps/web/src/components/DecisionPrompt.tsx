import { useState } from "react";
import type { AdvisorRecommendation } from "../types/data";

interface DecisionPromptProps {
  decision: AdvisorRecommendation | null;
  onDecision: (decisionId: string, approved: boolean, note: string) => void;
}

export default function DecisionPrompt({ decision, onDecision }: DecisionPromptProps) {
  const [note, setNote] = useState("");

  if (!decision || decision.requiresHumanConfirmation !== true) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.65)",
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "90vw",
          padding: 24,
          background: "#111827",
          border: "1px solid #f87171",
          borderRadius: 10,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "3px 10px",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#f87171",
            background: "rgba(248, 113, 113, 0.12)",
            borderRadius: 4,
            marginBottom: 12,
          }}
        >
          Critical decision required
        </div>

        <h2 style={{ margin: "0 0 10px", fontSize: 18, color: "#e5e7eb" }}>
          {decision.decision.replace(/_/g, " ").toUpperCase()}
        </h2>

        <p style={{ margin: 0, fontSize: 14, color: "#9ca3af", lineHeight: 1.5 }}>
          {decision.reason}
        </p>
        {decision.context && (
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "#6b7280" }}>{decision.context}</p>
        )}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Operator note (optional)…"
          rows={2}
          style={{
            width: "100%",
            marginTop: 16,
            padding: 8,
            background: "#0b0f14",
            border: "1px solid #374151",
            borderRadius: 6,
            color: "#e5e7eb",
            fontSize: 12,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            onClick={() => onDecision(decision.id, false, note)}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "#374151",
              border: "1px solid #4b5563",
              borderRadius: 6,
              color: "#e5e7eb",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reject
          </button>
          <button
            onClick={() => onDecision(decision.id, true, note)}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "#0e5c3b",
              border: "1px solid #1a9c66",
              borderRadius: 6,
              color: "#e5e7eb",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
