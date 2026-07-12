import { useState } from "react";
import {
  demoFrontLine,
  demoOperations,
  demoSquadrons,
  demoSubSectors,
  demoVectors,
  demoZones,
} from "../data/demo";
import { useAdvisor } from "../hooks/useAdvisor";
import { useAssets } from "../hooks/useAssets";
import { useFusion } from "../hooks/useFusion";
import { useMission } from "../hooks/useMission";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useSquadrons } from "../hooks/useSquadrons";
import AdvisorPanel from "./AdvisorPanel";
import CollapsibleSection from "./CollapsibleSection";
import DecisionPrompt from "./DecisionPrompt";
import MissionTree from "./MissionTree";
import OperationalMap from "./OperationalMap";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/Sheet";
import VoiceAgent from "./VoiceAgent";
import type { Asset, Squadron, TheaterOperation } from "../types/data";

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#e5e7eb" }}>
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: color,
          boxShadow: `0 0 8px ${color}`,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

export default function OperationalMapView() {
  const { squadrons, loading: squadronsLoading, offline: squadronsOffline } = useSquadrons(demoSquadrons);
  const { fused, feeds } = useFusion();
  const { assets, loading: assetsLoading } = useAssets();
  const { degraded } = useNetworkStatus();
  const {
    operation,
    mission,
    state: missionState,
    elapsedMs,
    loading: missionLoading,
    error: missionError,
    start,
    pause,
    resume,
    reset,
  } = useMission();
  const {
    brief,
    pendingDecision,
    reasoning,
    loading: advisorLoading,
    error: advisorError,
    submitDecision,
    injectContact,
  } = useAdvisor();

  const [selectedSquadron, setSelectedSquadron] = useState<Squadron | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lon: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeOperation = operation ?? (demoOperations[0] as TheaterOperation);
  // Operational view is the theater COP; use the shared theater zones rather
  // than the tactical escort mission zones which live in a different geography.
  const activeZones = demoZones;
  const activeSubSectors = demoSubSectors;
  const activeVectors = demoVectors;
  const activeRoute = mission?.route;

  const handleTreeClick = (location?: { lat: number; lon: number }, zoneId?: string) => {
    const zone = zoneId ? activeZones.find((z) => z.id === zoneId) : undefined;
    const target = location ?? zone?.center;
    if (target) setFocus(target);
  };

  const handleInjectContact = async () => {
    const wp = activeRoute && activeRoute.length > 2 ? activeRoute[2] : activeRoute?.[0];
    if (!wp) return;
    await injectContact(wp.lat, wp.lon, "PERSON");
  };

  const handleDecision = async (decisionId: string, approved: boolean, note: string) => {
    await submitDecision(decisionId, approved, note);
  };

  const squadronCounts = {
    friendly: squadrons.filter((s) => s.affiliation === "friendly").length,
    hostile: squadrons.filter((s) => s.affiliation === "hostile").length,
    neutral: squadrons.filter((s) => s.affiliation === "neutral").length,
  };

  const assetCounts = {
    idle: assets.filter((a) => a.status === "idle").length,
    moving: assets.filter((a) => a.status === "moving").length,
    busy: assets.filter((a) => a.status === "busy" || a.status === "scanning").length,
    offline: assets.filter((a) => a.status === "offline").length,
  };

  const formatElapsed = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  const isRunning = missionState === "running";
  const isPaused = missionState === "paused";

  return (
    <div className="operational-map-view" style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <SheetTitle>Operational Picture</SheetTitle>
                <SheetDescription>
                  {squadronsLoading ? "Loading squadrons…" : `${squadrons.length} squadrons · theater view`}
                </SheetDescription>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close operational picture"
                style={{
                  background: "transparent",
                  border: "1px solid #374151",
                  color: "#9ca3af",
                  borderRadius: 6,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
            {squadronsOffline && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  padding: "2px 8px",
                  fontSize: 11,
                  color: "#fbbf24",
                  background: "rgba(251, 191, 36, 0.12)",
                  border: "1px solid rgba(251, 191, 36, 0.35)",
                  borderRadius: 4,
                }}
              >
                offline — demo data
              </span>
            )}
            {degraded && (
              <div
                style={{
                  marginTop: 8,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#f87171",
                  background: "rgba(248, 113, 113, 0.12)",
                  border: "1px solid rgba(248, 113, 113, 0.35)",
                  borderRadius: 4,
                }}
              >
                degraded — local mode
              </div>
            )}
          </SheetHeader>

          <div style={{ flex: 1, overflow: "auto", padding: 20, fontSize: 14 }}>
            {/* Status summary — the only thing always visible at a glance. */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>Mission</span>
                <MissionStateBadge state={missionState} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e5e7eb", lineHeight: 1.25 }}>
                {mission?.name ?? "No active mission"}
              </div>
              {mission?.payload && (
                <div style={{ marginTop: 8, fontSize: 15, color: "#9ca3af" }}>
                  Payload: <span style={{ color: "#e5e7eb" }}>{mission.payload.label}</span> ·{" "}
                  <span style={{ color: "#e5e7eb", textTransform: "uppercase" }}>
                    {mission.payload.status.replace("_", " ")}
                  </span>
                </div>
              )}
              <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
                {!isRunning ? (
                  <ControlButton onClick={start} variant="primary" label={isPaused ? "Resume" : "Start"} />
                ) : (
                  <ControlButton onClick={pause} variant="warning" label="Pause" />
                )}
                <ControlButton onClick={reset} variant="secondary" label="Reset" />
                <span style={{ marginLeft: "auto", fontSize: 14, color: "#6b7280" }}>
                  {formatElapsed(elapsedMs)}
                </span>
              </div>
              {missionError && (
                <div style={{ marginTop: 10, fontSize: 13, color: "#f87171" }}>{missionError}</div>
              )}
            </div>

            <CollapsibleSection title="Theater Zones" defaultOpen>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <LegendItem color="#00a8dc" label="Our territory / friendly" />
                <LegendItem color="#fbbf24" label="Contested corridor" />
                <LegendItem color="#ff3031" label="Enemy territory / kill zone" />
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, lineHeight: 1.4 }}>
                  Zoom in to see boundary-aligned dominance sectors clipped from the real oblast polygons.
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Dominance Sectors" defaultOpen>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <LegendItem color="#00a8dc" label="Friendly-held sector" />
                <LegendItem color="#fbbf24" label="Contested sector" />
                <LegendItem color="#ff3031" label="Hostile-held sector" />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Map Symbols" defaultOpen>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#e5e7eb" }}>
                  <span style={{ fontSize: 16, color: "#7dd3fc", textShadow: "0 0 6px #7dd3fc" }}>●</span>
                  <span>Infantry</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#e5e7eb" }}>
                  <span style={{ fontSize: 16, color: "#7dd3fc", textShadow: "0 0 6px #7dd3fc" }}>■</span>
                  <span>Armor</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#e5e7eb" }}>
                  <span style={{ fontSize: 16, color: "#7dd3fc", textShadow: "0 0 6px #7dd3fc" }}>▲</span>
                  <span>Artillery</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#e5e7eb" }}>
                  <span style={{ fontSize: 16, color: "#7dd3fc", textShadow: "0 0 6px #7dd3fc" }}>◆</span>
                  <span>Drone</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#e5e7eb" }}>
                  <span style={{ fontSize: 16, color: "#7dd3fc", textShadow: "0 0 6px #7dd3fc" }}>★</span>
                  <span>Recon</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#e5e7eb" }}>
                  <span style={{ fontSize: 16, color: "#7dd3fc", textShadow: "0 0 6px #7dd3fc" }}>□</span>
                  <span>Logistics</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#e5e7eb" }}>
                  <span style={{ fontSize: 16, color: "#f87171", textShadow: "0 0 6px #f87171" }}>●</span>
                  <span>Hostile squadron</span>
                </div>
                <LegendItem color="#fbbf24" label="Line of Contact — contested corridor" />
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#e5e7eb" }}>
                  <span style={{ fontSize: 16, color: "#34d399", textShadow: "0 0 6px #34d399" }}>◆</span>
                  <span>Fused multi-sensor track</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#e5e7eb" }}>
                  <span
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                      borderBottom: "14px solid #ff3031",
                      flexShrink: 0,
                    }}
                  />
                  <span>Axis of advance / pressure</span>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Current Situation" defaultOpen>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {activeVectors.map((v) => {
                  const color =
                    v.affiliation === "friendly"
                      ? "#00a8dc"
                      : v.affiliation === "hostile"
                        ? "#ff3031"
                        : "#fbbf24";
                  return (
                    <div key={v.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: color,
                          boxShadow: `0 0 8px ${color}`,
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb" }}>
                          {v.label}
                        </div>
                        <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.4 }}>
                          {v.narrative}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Forces" right={
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                {squadrons.length} sq · {assets.length} assets
              </span>
            }>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <BigCount color="#00a8dc" label="Friendly" value={squadronCounts.friendly} />
                <BigCount color="#ff3031" label="Hostile" value={squadronCounts.hostile} />
                <BigCount color="#00e200" label="Neutral" value={squadronCounts.neutral} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <BigCount color="#64748b" label="Idle" value={assetCounts.idle} />
                <BigCount color="#3b8c5f" label="Moving" value={assetCounts.moving} />
                <BigCount color="#fbbf24" label="Busy" value={assetCounts.busy} />
                <BigCount color="#ef4444" label="Offline" value={assetCounts.offline} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Autonomous Advisor" defaultOpen={!!pendingDecision} right={
              pendingDecision ? <span style={{ fontSize: 12, color: "#f87171", fontWeight: 700 }}>⚠ DECISION</span> : undefined
            }>
              <AdvisorPanel
                reasoning={reasoning}
                brief={brief}
                pendingDecision={pendingDecision}
                loading={advisorLoading}
                error={advisorError}
                onInjectContact={handleInjectContact}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Mission Hierarchy">
              <MissionTree operations={[activeOperation]} onFocus={handleTreeClick} />
            </CollapsibleSection>

            <CollapsibleSection title="Voice Agent">
              <VoiceAgent />
            </CollapsibleSection>

            {selectedSquadron ? (
              <CollapsibleSection title="Squadron Detail" defaultOpen>
                <SquadronDetail squadron={selectedSquadron} onBack={() => setSelectedSquadron(null)} />
              </CollapsibleSection>
            ) : selectedAsset ? (
              <CollapsibleSection title="Asset Detail" defaultOpen>
                <AssetDetail asset={selectedAsset} onBack={() => setSelectedAsset(null)} />
              </CollapsibleSection>
            ) : (
              <>
                <CollapsibleSection title={`Assets ${assetsLoading ? "…" : ""}`}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {assets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        style={{
                          textAlign: "left",
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid rgba(31, 41, 55, 0.55)",
                          padding: "10px 0",
                          color: "#e5e7eb",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{asset.name}</div>
                        <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                          {asset.role} · {asset.status} · batt {asset.batteryPct ?? "—"}%
                        </div>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Squadrons">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {squadrons.slice(0, 40).map((sq) => (
                      <button
                        key={sq.id}
                        onClick={() => setSelectedSquadron(sq)}
                        style={{
                          textAlign: "left",
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid rgba(31, 41, 55, 0.55)",
                          padding: "10px 0",
                          color: "#e5e7eb",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{sq.callsign}</div>
                        <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                          {sq.type} · {sq.status} · {sq.lat.toFixed(2)}°, {sq.lon.toFixed(2)}°
                        </div>
                      </button>
                    ))}
                    {squadrons.length > 40 && (
                      <div style={{ color: "#6b7280", fontSize: 12, textAlign: "center", padding: 10 }}>
                        + {squadrons.length - 40} more
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              </>
            )}
          </div>

        <footer style={{ padding: 16, borderTop: "1px solid #1f2937", fontSize: 12, color: "#6b7280" }}>
          <a href="/dashboard" style={{ color: "#00a8dc", textDecoration: "none" }}>
            Open tactical dashboard →
          </a>
        </footer>
        </SheetContent>
      </Sheet>

      <main style={{ flex: 1, position: "relative" }}>
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 30,
              background: "#0b0f14",
              border: "1px solid #1f2937",
              color: "#e5e7eb",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
            }}
          >
            ☰ Operational Picture
          </button>
        )}
        <OperationalMap
          squadrons={squadrons.length ? squadrons : demoSquadrons}
          zones={activeZones}
          subSectors={activeSubSectors}
          vectors={activeVectors}
          fusedTracks={fused}
          rawFeeds={feeds}
          route={activeRoute}
          frontLine={demoFrontLine}
          assets={assets}
          selectedSquadronId={selectedSquadron?.id ?? null}
          selectedAssetId={selectedAsset?.id ?? null}
          onSelectSquadron={setSelectedSquadron}
          onSelectAsset={setSelectedAsset}
          focus={focus}
        />
      </main>

      <DecisionPrompt decision={pendingDecision} onDecision={handleDecision} />
    </div>
  );
}

function MissionStateBadge({ state }: { state: string | null }) {
  const colors: Record<string, string> = {
    idle: "#64748b",
    running: "#34d399",
    paused: "#fbbf24",
    complete: "#60a5fa",
  };
  return (
    <span
      style={{
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        color: colors[state ?? "idle"] ?? "#9ca3af",
        background: `${colors[state ?? "idle"] ?? "#9ca3af"}22`,
        border: `1px solid ${colors[state ?? "idle"] ?? "#9ca3af"}55`,
        borderRadius: 4,
      }}
    >
      {state ?? "idle"}
    </span>
  );
}

function ControlButton({
  onClick,
  variant,
  label,
}: {
  onClick: () => void;
  variant: "primary" | "warning" | "secondary";
  label: string;
}) {
  const backgrounds = {
    primary: "#0e5c3b",
    warning: "#7c4a12",
    secondary: "#374151",
  };
  const borders = {
    primary: "#1a9c66",
    warning: "#b47a22",
    secondary: "#4b5563",
  };
  return (
    <button
      onClick={onClick}
      style={{
        background: backgrounds[variant],
        border: `1px solid ${borders[variant]}`,
        color: "#e5e7eb",
        borderRadius: 4,
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function CountChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0", background: "#111827", borderRadius: 6 }}>
      <div style={{ color, fontWeight: 700, fontSize: 18 }}>{value}</div>
      <div style={{ color: "#9ca3af", fontSize: 11 }}>{label}</div>
    </div>
  );
}

function BigCount({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div style={{ textAlign: "center", padding: "14px 0", background: "rgba(17, 24, 39, 0.6)", borderRadius: 8 }}>
      <div style={{ color, fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{value}</div>
      <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
    </div>
  );
}

function SquadronDetail({ squadron, onBack }: { squadron: Squadron; onBack: () => void }) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "1px solid #374151",
          color: "#9ca3af",
          borderRadius: 4,
          padding: "4px 10px",
          cursor: "pointer",
          fontSize: 12,
          marginBottom: 16,
        }}
      >
        ← Back to list
      </button>
      <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>{squadron.callsign}</h2>
      <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
        <div>
          <strong>ID:</strong> {squadron.id}
        </div>
        <div>
          <strong>Type:</strong> {squadron.type}
        </div>
        <div>
          <strong>Status:</strong>{" "}
          <span style={{ textTransform: "uppercase", color: "#fff" }}>{squadron.status}</span>
        </div>
        <div>
          <strong>Affiliation:</strong> {squadron.affiliation}
        </div>
        <div>
          <strong>Coords:</strong> {squadron.lat.toFixed(4)}°, {squadron.lon.toFixed(4)}°
        </div>
        <div>
          <strong>Heading:</strong> {squadron.heading}°
        </div>
        <div>
          <strong>Speed:</strong> {squadron.speed} km/h
        </div>
        <div>
          <strong>Battery:</strong> {squadron.battery}%
        </div>
        <div>
          <strong>Confidence:</strong> {Math.round(squadron.confidence * 100)}%
        </div>
        <div>
          <strong>Source:</strong> {squadron.source}
        </div>
      </div>
    </div>
  );
}

function AssetDetail({ asset, onBack }: { asset: Asset; onBack: () => void }) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "1px solid #374151",
          color: "#9ca3af",
          borderRadius: 4,
          padding: "4px 10px",
          cursor: "pointer",
          fontSize: 12,
          marginBottom: 16,
        }}
      >
        ← Back to list
      </button>
      <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>{asset.name}</h2>
      <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
        <div>
          <strong>ID:</strong> {asset.id}
        </div>
        <div>
          <strong>Role:</strong> {asset.role}
        </div>
        <div>
          <strong>Status:</strong>{" "}
          <span style={{ textTransform: "uppercase", color: "#fff" }}>{asset.status}</span>
        </div>
        <div>
          <strong>Coords:</strong> {asset.lat.toFixed(6)}°, {asset.lon.toFixed(6)}°
        </div>
        {asset.heading !== undefined && (
          <div>
            <strong>Heading:</strong> {asset.heading}°
          </div>
        )}
        {asset.speed !== undefined && (
          <div>
            <strong>Speed:</strong> {asset.speed} km/h
          </div>
        )}
        {asset.batteryPct !== undefined && (
          <div>
            <strong>Battery:</strong> {asset.batteryPct}%
          </div>
        )}
        {asset.currentWaypointId && (
          <div>
            <strong>Waypoint:</strong> {asset.currentWaypointId}
          </div>
        )}
        <div>
          <strong>Simulated:</strong> {asset.isSimulated ? "yes" : "live"}
        </div>
      </div>
    </div>
  );
}
