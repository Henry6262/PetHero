import { useEffect, useState } from "react";

const REPORT_KINDS = [
  { id: "contact", label: "Contact", emoji: "👁", color: "#ff3031" },
  { id: "obstacle", label: "Obstacle", emoji: "🚧", color: "#fbbf24" },
  { id: "status", label: "Status OK", emoji: "✅", color: "#34d399" },
] as const;

export default function FieldReporter() {
  const [agentId, setAgentId] = useState("OP-FIELD-1");
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocating(false);
        },
        () => setLocating(false),
        { enableHighAccuracy: true, timeout: 10_000 }
      );
    }
  }, []);

  async function send(kind: string) {
    if (!coords) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/field-bridge/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId,
          kind,
          text: note || undefined,
          lat: coords.lat,
          lon: coords.lon,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setStatus("sent");
      setNote("");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f14",
        color: "#e5e7eb",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header>
        <h1 style={{ margin: 0, fontSize: 22 }}>Field Reporter</h1>
        <p style={{ margin: "6px 0 0", color: "#9ca3af", fontSize: 13 }}>
          Drop a low-bandwidth report straight onto the COP.
        </p>
      </header>

      <div style={{ background: "#111827", padding: 12, borderRadius: 8 }}>
        <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 6 }}>
          Operator callsign
        </label>
        <input
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          style={{
            width: "100%",
            background: "#0b0f14",
            border: "1px solid #1f2937",
            color: "#e5e7eb",
            padding: 10,
            borderRadius: 6,
            fontSize: 16,
          }}
        />
      </div>

      <div style={{ background: "#111827", padding: 12, borderRadius: 8 }}>
        <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 6 }}>
          Note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. 2 unknowns near red building"
          rows={3}
          style={{
            width: "100%",
            background: "#0b0f14",
            border: "1px solid #1f2937",
            color: "#e5e7eb",
            padding: 10,
            borderRadius: 6,
            fontSize: 16,
            resize: "none",
          }}
        />
      </div>

      <div style={{ background: "#111827", padding: 12, borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>GPS fix</div>
        {locating ? (
          <div style={{ color: "#fbbf24", fontSize: 14 }}>Acquiring position…</div>
        ) : coords ? (
          <div style={{ fontSize: 14, fontFamily: "monospace" }}>
            {coords.lat.toFixed(5)}°, {coords.lon.toFixed(5)}°
          </div>
        ) : (
          <div style={{ color: "#ef4444", fontSize: 14 }}>No GPS fix available.</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
        {REPORT_KINDS.map((kind) => (
          <button
            key={kind.id}
            disabled={!coords || status === "sending"}
            onClick={() => send(kind.id)}
            style={{
              padding: "18px 16px",
              fontSize: 18,
              fontWeight: 600,
              borderRadius: 10,
              border: "none",
              background: kind.color,
              color: "#0b0f14",
              cursor: coords ? "pointer" : "not-allowed",
              opacity: coords ? 1 : 0.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span>{kind.emoji}</span>
            {kind.label}
          </button>
        ))}
      </div>

      {status === "sending" && <div style={{ textAlign: "center", color: "#9ca3af" }}>Sending…</div>}
      {status === "sent" && (
        <div style={{ textAlign: "center", color: "#34d399" }}>Report accepted by Operator.</div>
      )}
      {status === "error" && (
        <div style={{ textAlign: "center", color: "#ef4444" }}>Failed to send. Try again.</div>
      )}

      <footer style={{ textAlign: "center", fontSize: 12, color: "#6b7280" }}>
        <a href="/operational" style={{ color: "#00a8dc", textDecoration: "none" }}>
          ← Back to operational map
        </a>
      </footer>
    </div>
  );
}
