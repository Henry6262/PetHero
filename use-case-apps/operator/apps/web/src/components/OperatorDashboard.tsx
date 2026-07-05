import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, FXAA } from "@react-three/postprocessing";
import {
  type Agent,
  type Building,
  type BuildingStatus,
  agents,
  buildings as buildingData,
  commandPlaybooks,
  demoStages,
  legend,
  logFilters,
  timeline,
} from "../data/sections";
import OperatorNav from "./OperatorNav";
import { buildAgents3D } from "../lib/agents";
import {
  AgentPucks,
  AgentScanSectors,
  BuildingLayer,
  CarLayer,
  FOVCones,
  FloorplanPanel,
  HexGridLines,
  HexMapScene,
  PropLayer,
  RockLayer,
  RouteLines,
  TacticalCamera,
  TerrainLayer,
  XRayBuilding,
  type TacticalCameraHandle,
} from "./scene";
import type { RoomInterior } from "../lib/interiors";



const agentIcons: Record<string, JSX.Element> = {
  op: (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="15" r="6" />
      <path d="M13 38v-3a11 11 0 0122 0v3" />
      <path d="M18 14a8 8 0 0112 0" />
    </svg>
  ),
  quad: (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="11" y="19" width="21" height="9" rx="2.5" />
      <path d="M32 21l6-4" />
      <circle cx="39" cy="16" r="2.2" fill="currentColor" stroke="none" />
      <path d="M14 28v7M20 28v7M27 28v7M31 28v7" />
    </svg>
  ),
  hexapod: (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 18h12l4 6-4 6H18l-4-6z" />
      <path d="M18 21l-7-4M15 24H7M18 27l-7 4M30 21l7-4M33 24h8M30 27l7 4" />
    </svg>
  ),
  drone: (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="4.5" />
      <path d="M24 19V12M24 29v7M19 24h-7M29 24h7" />
      <circle cx="24" cy="11" r="3.6" />
      <circle cx="24" cy="37" r="3.6" />
      <circle cx="11" cy="24" r="3.6" />
      <circle cx="37" cy="24" r="3.6" />
    </svg>
  ),
};

const buildingPanelStatus: Record<BuildingStatus, { label: string; col: string; bg: string; bd: string }> = {
  clear: { label: "INSPECTED", col: "#34d399", bg: "rgba(52,211,153,0.14)", bd: "rgba(52,211,153,0.4)" },
  partial: { label: "PARTIAL", col: "#fbbf24", bg: "rgba(251,191,36,0.14)", bd: "rgba(251,191,36,0.4)" },
  unmapped: { label: "NOT INSPECTED", col: "#94a3b8", bg: "rgba(148,163,184,0.12)", bd: "rgba(148,163,184,0.35)" },
  conflict: { label: "CONFLICT", col: "#f87171", bg: "rgba(248,113,113,0.14)", bd: "rgba(248,113,113,0.4)" },
  stale: { label: "STALE", col: "#fbbf24", bg: "rgba(251,191,36,0.14)", bd: "rgba(251,191,36,0.4)" },
};

export default function OperatorDashboard() {
  const [logOpen, setLogOpen] = useState(false);
  const [telOpen, setTelOpen] = useState(true);
  const [view, setView] = useState<"iso" | "flat">("iso");
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [q1Prog, setQ1Prog] = useState(1);
  const [h1Prog, setH1Prog] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const [demoStage, setDemoStage] = useState("");
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [agentPos, setAgentPos] = useState<{ top: number; left: number; height: number } | null>(null);
  const [toast, setToast] = useState<{ msg: string; accent: string } | null>(null);
  const [showFov, setShowFov] = useState(false);
  const [interiorView, setInteriorView] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomInterior | null>(null);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [terrainKey, setTerrainKey] = useState(0);

  useEffect(() => {
    setSelectedRoom(null);
    setSelectedFloor(0);
  }, [selectedBuilding?.id]);

  useEffect(() => {
    const handler = () => setTerrainKey((k) => k + 1);
    window.addEventListener("terrain:reload", handler);
    return () => window.removeEventListener("terrain:reload", handler);
  }, []);

  const cameraRef = useRef<TacticalCameraHandle>(null);
  const rafRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const agentCloseRef = useRef<number | null>(null);

  const zoomIn = () => cameraRef.current?.zoomIn();
  const zoomOut = () => cameraRef.current?.zoomOut();
  const resetView = () => {
    setView("iso");
    cameraRef.current?.reset();
  };
  const rotateCW = () => cameraRef.current?.rotate(-45);
  const rotateCCW = () => cameraRef.current?.rotate(45);
  const setIsoView = () => {
    setView("iso");
    cameraRef.current?.iso();
  };
  const setFlatView = () => {
    setView("flat");
    cameraRef.current?.flat();
  };
  const snapToAgent = (agentId: string) => {
    const match = buildAgents3D(agents).find((a) => a.id === agentId);
    if (match) {
      cameraRef.current?.snapTo(match.position);
    }
  };

  const playDemo = () => {
    const start = performance.now();
    setPlaying(true);
    setQ1Prog(0);
    setH1Prog(0);
    setDemoStage("EXPLORE");
    setSelectedBuilding(null);

    const loop = () => {
      const elapsed = (performance.now() - start) / 1000;
      if (elapsed < 3.0) {
        setQ1Prog(elapsed / 3);
        setH1Prog(0);
        setDemoStage("EXPLORE");
      } else if (elapsed < 3.8) {
        setQ1Prog(1);
        setH1Prog(0);
        setDemoStage("DOCK");
      } else if (elapsed < 4.6) {
        setQ1Prog(1);
        setH1Prog(0);
        setDemoStage("MERGE");
      } else if (elapsed < 7.8) {
        setQ1Prog(1);
        setH1Prog((elapsed - 4.6) / 3.2);
        setDemoStage("SOLVE");
      } else {
        setQ1Prog(1);
        setH1Prog(1);
        setDemoStage("COMPLETE");
        setPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const togglePlay = () => {
    if (playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setPlaying(false);
    } else if (demoStage === "COMPLETE") {
      playDemo();
    } else {
      playDemo();
    }
  };



  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (agentCloseRef.current) window.clearTimeout(agentCloseRef.current);
    };
  }, []);

  const openAgent = (agent: Agent) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (agentCloseRef.current) window.clearTimeout(agentCloseRef.current);
    const r = e.currentTarget.getBoundingClientRect();
    setActiveAgent(agent);
    setAgentPos({ top: r.top, left: r.left, height: r.height });
  };

  const closeSoon = () => {
    agentCloseRef.current = window.setTimeout(() => setActiveAgent(null), 160);
  };

  const keepOpen = () => {
    if (agentCloseRef.current) window.clearTimeout(agentCloseRef.current);
  };

  const fireAction = (agent: Agent, label: string) => {
    if (agentCloseRef.current) window.clearTimeout(agentCloseRef.current);
    setActiveAgent(null);
    setToast({ msg: `${agent.name} ← ${label} · pending approval`, accent: agent.accent });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  };

  const curStageIndex = demoStage === "COMPLETE" ? 4 : demoStages.indexOf(demoStage);
  const playLabel = playing ? "⏸ PAUSE" : demoStage === "COMPLETE" ? "↻ REPLAY" : "▶ PLAY DEMO";

  const panel = selectedBuilding
    ? {
        ...selectedBuilding,
        statusMeta: buildingPanelStatus[selectedBuilding.status],
      }
    : null;

  let popoverLeft = 0;
  let popoverTop = 0;
  let pointTop = 0;
  if (activeAgent && agentPos) {
    const pw = 246;
    popoverLeft = agentPos.left - pw - 14;
    if (popoverLeft < 8) popoverLeft = agentPos.left + 304;
    popoverTop = Math.max(10, Math.min(agentPos.top - 8, window.innerHeight - 320));
    pointTop = Math.max(16, agentPos.top - popoverTop + agentPos.height / 2);
  }

  const telSheetWidth = telOpen ? 300 : 54;

  return (
    <main className="dashboard-shell">
      <OperatorNav active="dashboard" />
      <section className="dashboard-frame">
        <header className="dashboard-topbar">
          <div className="dashboard-brand">
            <strong>SCOUT</strong>
            <span className="live-dot" />
          </div>
          <div style={{ flex: 1 }} />
          <div className="dashboard-clock">
            <span>Clock</span>
            <strong>00:41:12</strong>
          </div>
          <button className="reset-demo">↻ RESET</button>
        </header>

        <div className="dashboard-body">
          <section className="ops-map-panel">
            <div className="ops-map-head">
              <div>
                <strong>Operational Picture</strong>
                <small>{agents.length} agents · 71% explored</small>
              </div>
              <button className="play-demo" onClick={togglePlay}>{playLabel}</button>
            </div>

            <div className="ops-map-viewport">
              <div className="ops-map-canvas">
                <Canvas
                  shadows
                  camera={{ position: [0, 0, 0], fov: 50 }}
                  gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                  style={{ background: "transparent" }}
                >
                  <color attach="background" args={["#0d1117"]} />
                  <fog attach="fog" args={["#0d1117", 0.005]} />
                  <EffectComposer>
                    <ambientLight intensity={0.55} />
                    <hemisphereLight intensity={0.35} groundColor="#06080c" color="#9fb2c7" />
                    <directionalLight
                      position={[35, 55, 25]}
                      intensity={1.15}
                      castShadow
                      shadow-mapSize={[2048, 2048]}
                      shadow-camera-near={1}
                      shadow-camera-far={300}
                      shadow-camera-left={-180}
                      shadow-camera-right={180}
                      shadow-camera-top={180}
                      shadow-camera-bottom={-180}
                      shadow-bias={-0.0005}
                    />
                    <TerrainLayer key={terrainKey} />
                    <HexMapScene />
                    <HexGridLines opacity={0.06} />
                    <BuildingLayer
                      buildings={buildingData}
                      selectedBuilding={selectedBuilding}
                      onSelectBuilding={setSelectedBuilding}
                      interiorView={interiorView}
                    />
                    <RockLayer buildings={buildingData} />
                    <PropLayer buildings={buildingData} />
                    <CarLayer buildings={buildingData} />
                    <RouteLines />
                    <AgentPucks agents={agents} />
                    <AgentScanSectors agents={agents} visible={showFov} />
                    <XRayBuilding
                      building={selectedBuilding}
                      selectedRoom={selectedRoom}
                      visible={interiorView && selectedBuilding !== null}
                      floor={selectedFloor}
                    />
                    <TacticalCamera ref={cameraRef} />
                    <Bloom
                      luminanceThreshold={0.65}
                      luminanceSmoothing={0.85}
                      intensity={0.55}
                      height={300}
                    />
                    <FXAA />
                  </EffectComposer>
                </Canvas>
              </div>

              <div className="map-controls">
                <div className="map-control-group">
                  <button className={view === "iso" ? "active" : undefined} onClick={setIsoView}>ISO</button>
                  <button className={view === "flat" ? "active" : undefined} onClick={setFlatView}>FLAT</button>
                </div>
                <div className="map-control-group">
                  <button onClick={zoomIn}>+</button>
                  <button onClick={zoomOut}>−</button>
                  <button onClick={resetView} title="Reset view">⤾</button>
                </div>
                <div className="map-control-group">
                  <button onClick={rotateCCW} title="Rotate left">⟲</button>
                  <button onClick={rotateCW} title="Rotate right">⟳</button>
                </div>
                <div className="map-control-group">
                  <button
                    className={showFov ? "active" : undefined}
                    onClick={() => setShowFov((s) => !s)}
                    title="Toggle FOV cones"
                    style={{ width: "auto", padding: "0 10px", fontSize: "10px" }}
                  >
                    FOV
                  </button>
                  <button
                    className={interiorView ? "active" : undefined}
                    onClick={() => setInteriorView((v) => !v)}
                    title="Toggle interior view"
                    style={{ width: "auto", padding: "0 10px", fontSize: "10px" }}
                  >
                    INT
                  </button>
                </div>
              </div>

              <div className="map-help">drag to rotate · scroll to zoom · right-drag to pan</div>

              <div className={`ops-map-log ${logOpen ? "open" : ""}`}>
                {!logOpen && (
                  <button className="log-toggle" onClick={() => setLogOpen(true)} title="Expand mission log">
                    <span className="live-dot" />
                    <span>LOG · {timeline.length}</span>
                    <span>›</span>
                  </button>
                )}
                {logOpen && (
                  <>
                    <div className="log-head">
                      <span className="live-dot" />
                      <strong>Mission Log</strong>
                      <small>{timeline.length} EVENTS</small>
                      <button className="sheet-toggle" onClick={() => setLogOpen(false)} title="Collapse log">‹</button>
                    </div>
                    <div className="log-filter-row">
                      {logFilters.map((f) => (
                        <button key={f} className={f === "ALL" ? "active" : undefined}>{f}</button>
                      ))}
                    </div>
                    <div className="log-scroll timeline">
                      {timeline.map((e, i) => (
                        <article key={i} className="timeline-item">
                          <div className="timeline-track">
                            <span className={e.live ? "livedot" : undefined} style={{ background: e.color, boxShadow: `0 0 8px ${e.color}` }} />
                            <span className="timeline-line" />
                          </div>
                          <div className="timeline-body">
                            <div className="timeline-meta">
                              <span style={{ color: e.color }}>{e.type}</span>
                              <span>{e.tag}</span>
                              <span>{e.t}</span>
                            </div>
                            <p>{e.text}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="map-legend">
                {legend.map((lg) => (
                  <span key={lg.label}>
                    <i style={{ background: lg.bg, border: lg.border }} />
                    {lg.label}
                  </span>
                ))}
              </div>

              {panel && (
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
                      <div>{panel.id} · {panel.kind}</div>
                      <small>{panel.w}×{panel.h2} cells · {panel.area} m² · {panel.floors} floors</small>
                    </div>
                    <button className="sheet-toggle" onClick={() => setSelectedBuilding(null)} title="Close">✕</button>
                  </div>
                  <div className="building-panel-body">
                    <div className="building-panel-status">
                      <span className="lbl">STATUS</span>
                      <span style={{ color: panel.statusMeta.col, background: panel.statusMeta.bg, border: `1px solid ${panel.statusMeta.bd}` }}>
                        {panel.statusMeta.label}
                      </span>
                    </div>
                    <div>
                      <FloorplanPanel
                        building={selectedBuilding}
                        selectedRoomId={selectedRoom?.id ?? null}
                        onSelectRoom={setSelectedRoom}
                        floor={selectedFloor}
                        onFloorChange={setSelectedFloor}
                      />
                    </div>
                    <div>
                      <div className="lbl">DRONE FRAMES · SHARED</div>
                      {panel.frames > 0 ? (
                        <div className="building-panel-frames">
                          {Array.from({ length: Math.min(panel.frames, 6) }).map((_, i) => (
                            <div key={i}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(159,208,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="6" width="18" height="13" rx="2" />
                                <circle cx="12" cy="12.5" r="3.2" />
                                <path d="M8 6l1.5-2h5L16 6" />
                              </svg>
                              <span>{panel.by}·{i + 1}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="building-panel-empty">No imagery shared yet — assign D1 for a pass.</span>
                      )}
                    </div>
                    <div className="building-panel-provenance">
                      <span style={{ background: panel.statusMeta.col }} />
                      <span>{panel.status === "unmapped" ? "Not yet inspected — assign a scan" : `Inspected by ${panel.by} · ${panel.ago} ago`}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="dashboard-bottom">
              <strong>−54%</strong>
              <span>H1 runs Q1's merged map to the goal — half the route, three dead ends skipped. <b>The second robot starts with context, not zero.</b></span>
            </div>
          </section>

          <aside className="dashboard-agents" style={{ width: telSheetWidth }}>
            {!telOpen && (
              <div className="tel-collapsed">
                <button className="sheet-toggle" onClick={() => setTelOpen(true)} title="Expand agents">
                  ‹
                </button>
                <div className="sheet-vertical-label">AGENTS · {agents.length}</div>
                <div className="sheet-dots">
                  {agents.map((ag) => (
                    <span key={ag.id} style={{ background: ag.accent, boxShadow: `0 0 8px ${ag.accent}` }} title={ag.id} />
                  ))}
                </div>
              </div>
            )}
            {telOpen && (
              <div className="tel-expanded">
                <div className="panel-title">
                  <strong>Agents</strong>
                  <small>{agents.length} ON MESH</small>
                  <button className="sheet-toggle" onClick={() => setTelOpen(false)} title="Collapse agents">
                    ›
                  </button>
                </div>
                <div className="sheet-scroll agent-stack">
                  <div className="agent-section">
                    <span className="lbl">HUMAN OPERATORS</span>
                    <span />
                    <span className="mono">{agents.filter((a) => a.section === "human").length}</span>
                  </div>
                  <div className="agent-section">
                    <span className="lbl">ROBOTS</span>
                    <span />
                    <span className="mono">{agents.filter((a) => a.section === "robot").length}</span>
                  </div>
                  {agents.map((agent) => (
                    <article
                      key={agent.id}
                      className="agent-card-mini"
                      style={{ "--agent": agent.accent } as React.CSSProperties}
                      onMouseEnter={openAgent(agent)}
                      onMouseLeave={closeSoon}
                      onClick={() => snapToAgent(agent.id)}
                    >
                      <div className="agent-icon">
                        {agent.image ? (
                          <img src={agent.image} alt={agent.name} />
                        ) : (
                          agentIcons[agent.icon]
                        )}
                      </div>
                      <div className="agent-info">
                        <div className="agent-name">
                          <span>{agent.name} — {agent.role}</span>
                        </div>
                        <div className="agent-activity" style={{ color: agent.accent }}>{agent.activity}</div>
                      </div>
                      <div className="agent-battery">
                        <div className="battery-bar">
                          <div style={{ width: `${agent.battery}%` }} />
                        </div>
                        <span>{agent.battery}%</span>
                      </div>
                    </article>
                  ))}
                  <div className="dock-chip">
                    <div>▣</div>
                    <div>
                      <div>STATION · DOCK-01</div>
                      <small>mission memory · context <b>v.18</b> · offline-ready</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        <footer className="playbook-rail">
          <span className="lbl">PLAYBOOK</span>
          <div className="demo-stages">
            {demoStages.map((stage, i) => (
              <span
                key={stage}
                className={i === curStageIndex ? "active" : i < curStageIndex ? "done" : undefined}
              >
                {stage}
              </span>
            ))}
          </div>
          {commandPlaybooks.map((p) => (
            <button key={p.name} className={p.rec ? "recommended" : undefined}>
              <span>{p.name}</span>
              {p.tag && <em>{p.tag}</em>}
            </button>
          ))}
          <small>assignments require <b>operator approval</b></small>
        </footer>
      </section>

      {activeAgent && agentPos && (
        <div
          className="agent-popover"
          style={{
            left: popoverLeft,
            top: popoverTop,
          }}
          onMouseEnter={keepOpen}
          onMouseLeave={closeSoon}
        >
          <span
            className="agent-popover-point"
            style={{ top: pointTop }}
          />
          <div className="agent-popover-head">
            <span style={{ background: activeAgent.accent, boxShadow: `0 0 8px ${activeAgent.accent}` }} />
            <span>{activeAgent.name}</span>
            <span>{activeAgent.role}</span>
          </div>
          <div className="agent-popover-status">{activeAgent.status}</div>
          <div className="agent-popover-actions">
            <div className="lbl">QUICK ACTIONS</div>
            {activeAgent.actions.map((action) => (
              <div key={action.label} onClick={() => fireAction(activeAgent, action.label)}>
                <ActionIcon icon={action.icon} accent={activeAgent.accent} />
                <span>{action.label}</span>
                <span className="mono">›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="action-toast" style={{ borderColor: toast.accent }}>
          <span style={{ background: toast.accent, boxShadow: `0 0 8px ${toast.accent}` }} />
          <span>{toast.msg}</span>
        </div>
      )}
    </main>
  );
}

function ActionIcon({ icon, accent }: { icon: string; accent: string }) {
  const path =
    {
      goto: "M12 21s-7-6.3-7-11a7 7 0 0114 0c0 4.7-7 11-7 11zM12 10a2 2 0 100 4 2 2 0 000-4z",
      dock: "M5 21V8l7-4 7 4v13M9 21v-6h6v6",
      scan: "M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3",
      mode: "M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M12 3v3M12 18v3M3 12h3M18 12h3",
      recall: "M9 14l-4-4 4-4M5 10h9a5 5 0 015 5v3",
      advise: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
      photo: "M3 6h18v13H3zM8 6l1.5-2h5L16 6M12 12.5a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4z",
      call: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.5-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z",
      launch: "M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
      orbit: "M3 12a9 4 0 1018 0 9 4 0 10-18 0M12 12m-2.5 0a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0",
      hold: "M7 6h3.5v12H7zM13.5 6H17v12h-3.5z",
    }[icon] ?? "";

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}
