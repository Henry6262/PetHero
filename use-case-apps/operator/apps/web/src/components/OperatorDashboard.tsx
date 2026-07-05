import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, FXAA } from "@react-three/postprocessing";
import type { Agent, Building } from "../types/data";
import {
  agents,
  buildings as buildingData,
  commandPlaybooks,
  demoStages,
  legend,
  logFilters,
  timeline,
} from "../data/demo";
import OperatorNav from "./OperatorNav";
import { buildAgents3D } from "../lib/agents";
import {
  AgentPucks,
  AgentScanSectors,
  BuildingLayer,
  CarLayer,
  FOVCones,
  HexGridLines,
  HexMapScene,
  PropLayer,
  RockLayer,
  RouteLines,
  TacticalCamera,
  BaseMapLayer,
  XRayBuilding,
  type TacticalCameraHandle,
  type BaseMapSource,
} from "./scene";
import type { RoomInterior } from "../lib/interiors";
import AgentIcon, { agentIcons } from "./dashboard/AgentIcon";
import AgentPopover from "./dashboard/AgentPopover";
import ActionToast from "./dashboard/ActionToast";
import BuildingPanel from "./dashboard/BuildingPanel";

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
  const [baseLayer, setBaseLayer] = useState<BaseMapSource>("procedural");

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
                    <BaseMapLayer source={baseLayer} key={terrainKey} />
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
                <div className="map-control-group" title="Base map source">
                  <button
                    className={baseLayer === "procedural" ? "active" : undefined}
                    onClick={() => setBaseLayer("procedural")}
                    style={{ width: "auto", padding: "0 10px", fontSize: "10px" }}
                  >
                    PROC
                  </button>
                  <button
                    className={baseLayer === "drone" ? "active" : undefined}
                    onClick={() => setBaseLayer("drone")}
                    style={{ width: "auto", padding: "0 10px", fontSize: "10px" }}
                  >
                    DRONE
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

              {selectedBuilding && (
                <BuildingPanel
                  building={selectedBuilding}
                  selectedRoom={selectedRoom}
                  selectedFloor={selectedFloor}
                  onSelectRoom={setSelectedRoom}
                  onFloorChange={setSelectedFloor}
                  onClose={() => setSelectedBuilding(null)}
                />
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
                          <AgentIcon icon={agent.icon} />
                        )}
                      </div>
                      <div className="agent-info">
                        <div className="agent-name">
                          <span>{agent.name} — {agent.role}</span>
                        </div>
                        <div className="agent-activity" style={{ color: agent.accent }}>{agent.status}</div>
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
        <AgentPopover
          agent={activeAgent}
          position={agentPos}
          onAction={(agent, action) => fireAction(agent, action.label)}
          onMouseEnter={keepOpen}
          onMouseLeave={closeSoon}
        />
      )}

      {toast && <ActionToast msg={toast.msg} accent={toast.accent} />}
    </main>
  );
}

// Re-export icon data for any consumers that need raw SVG elements.
export { agentIcons };
