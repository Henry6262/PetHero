import type { AdvisorRecommendation, ReasoningLogEntry } from "../types/data";

interface AdvisorPanelProps {
  reasoning: ReasoningLogEntry[];
  brief: AdvisorRecommendation | null;
  pendingDecision: AdvisorRecommendation | null;
  loading?: boolean;
  error?: string | null;
  onInjectContact?: () => void;
}

export default function AdvisorPanel({
  reasoning,
  brief,
  pendingDecision,
  loading,
  error,
  onInjectContact,
}: AdvisorPanelProps) {
  return (
    <div>
      {loading && (
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>thinking…</div>
      )}

      {error && <div style={{ marginBottom: 8, fontSize: 11, color: "#f87171" }}>{error}</div>}

      {brief && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: "#0b0f14",
            borderRadius: 6,
            borderLeft: `3px solid ${decisionColor(brief.decision)}`,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb" }}>
            {brief.decision.replace(/_/g, " ").toUpperCase()}
            {brief.source === "llm" && (
              <span style={{ marginLeft: 8, fontSize: 10, color: "#a78bfa" }}>via Ollama</span>
            )}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#9ca3af", lineHeight: 1.45 }}>
            {brief.reason}
          </div>
          {brief.context && (
            <div style={{ marginTop: 4, fontSize: 11, color: "#6b7280" }}>{brief.context}</div>
          )}
        </div>
      )}

      {pendingDecision && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: "rgba(248, 113, 113, 0.1)",
            border: "1px solid rgba(248, 113, 113, 0.35)",
            borderRadius: 6,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#f87171" }}>Decision pending human review</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#e5e7eb" }}>{pendingDecision.reason}</div>
        </div>
      )}

      {onInjectContact && (
        <button
          onClick={onInjectContact}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "6px 10px",
            fontSize: 11,
            color: "#e5e7eb",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Inject demo contact
        </button>
      )}

      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: 220,
            overflow: "auto",
            fontSize: 11,
          }}
        >
          {reasoning.length === 0 && (
            <div style={{ color: "#4b5563" }}>No reasoning entries yet.</div>
          )}
          {[...reasoning].reverse().map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: "6px 8px",
                background: "#0b0f14",
                borderRadius: 4,
                borderLeft: `2px solid ${levelColor(entry.level)}`,
              }}
            >
              <div style={{ color: "#9ca3af" }}>{entry.message}</div>
              <div style={{ marginTop: 2, fontSize: 10, color: "#4b5563" }}>
                {new Date(entry.timestamp).toLocaleTimeString()} · {entry.source}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function decisionColor(decision: string): string {
  switch (decision) {
    case "continue":
      return "#34d399";
    case "dispatch_scout":
      return "#60a5fa";
    case "hold_payload":
      return "#fbbf24";
    case "request_human_decision":
    case "reroute":
      return "#f87171";
    default:
      return "#94a3b8";
  }
}

function levelColor(level: string): string {
  switch (level) {
    case "critical":
      return "#f87171";
    case "warn":
      return "#fbbf24";
    default:
      return "#34d399";
  }
}
