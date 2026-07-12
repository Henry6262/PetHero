import { useEffect, useRef, useState } from "react";
import OperatorNav from "./OperatorNav";

const API = import.meta.env.VITE_OPERATOR_API ?? "http://localhost:3069";

interface MazeMap {
  width: number;
  height: number;
  cell_size_m: number;
  grid: number[][];
  start: number[];
  end: number[];
  debug_image?: string;
}

interface MazeCommand {
  action: string;
  steps: number;
}

interface MazePlan {
  path: number[][];
  commands: MazeCommand[];
  distance_cells: number;
  estimated_time_s: number;
  calibration: {
    forward_steps_per_cell: number;
    turn_steps_per_90: number;
    speed: number;
  };
}

interface MazeState {
  executionState: string;
  map: MazeMap | null;
  plan: MazePlan | null;
  robot: {
    status: string;
    battery: number;
    cameraUrl: string;
    pose: [number, number] | null;
    commandIndex: number;
    obstacleDetected: boolean;
  };
  log: string[];
}

function usePollState() {
  const [state, setState] = useState<MazeState | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`${API}/api/maze/state`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setState(data);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { state, error };
}

function usePiEvents(cameraUrl: string) {
  const [piState, setPiState] = useState<{ fase: string; paso: string; minas: unknown[] }>({
    fase: "",
    paso: "",
    minas: [],
  });

  useEffect(() => {
    if (!cameraUrl) return;
    const base = cameraUrl.replace(/\/video\/?$/, "").replace(/\/$/, "");
    let es: EventSource | null = null;
    try {
      es = new EventSource(`${base}/eventos`);
      es.addEventListener("fase", (e) => {
        const d = JSON.parse((e as MessageEvent).data);
        setPiState((s) => ({ ...s, fase: d.fase, paso: d.paso }));
      });
      es.addEventListener("mina", (e) => {
        const d = JSON.parse((e as MessageEvent).data);
        setPiState((s) => ({ ...s, minas: [d, ...s.minas].slice(0, 20) }));
      });
    } catch (err) {
      console.warn("Pi SSE error:", err);
    }
    return () => {
      es?.close();
    };
  }, [cameraUrl]);

  return piState;
}

function MazeCanvas({ map, plan, robotPose }: { map: MazeMap; plan: MazePlan | null; robotPose: [number, number] | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rows = map.height;
    const cols = map.width;
    const size = 384;
    canvas.width = size;
    canvas.height = size;
    const cell = size / Math.max(rows, cols);

    ctx.fillStyle = "#0b0d12";
    ctx.fillRect(0, 0, size, size);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cell;
        const y = r * cell;
        if (map.grid[r]?.[c] === 1) {
          ctx.fillStyle = "#334155";
          ctx.fillRect(x, y, cell, cell);
        } else {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(x, y, cell, cell);
        }
        ctx.strokeStyle = "#1e293b";
        ctx.strokeRect(x, y, cell, cell);
      }
    }

    if (plan?.path) {
      ctx.beginPath();
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = Math.max(2, cell * 0.4);
      for (let i = 0; i < plan.path.length; i++) {
        const [r, c] = plan.path[i];
        const x = c * cell + cell / 2;
        const y = r * cell + cell / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const [sr, sc] = map.start;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(sc * cell + cell / 2, sr * cell + cell / 2, cell * 0.35, 0, Math.PI * 2);
    ctx.fill();

    const [er, ec] = map.end;
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(ec * cell + cell / 2, er * cell + cell / 2, cell * 0.35, 0, Math.PI * 2);
    ctx.fill();

    if (robotPose) {
      const [rr, rc] = robotPose;
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(rc * cell + cell / 2, rr * cell + cell / 2, cell * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [map, plan, robotPose]);

  return <canvas ref={canvasRef} className="maze-canvas" />;
}

function CameraPanel({
  cameraUrl,
  setCameraUrl,
  post,
}: {
  cameraUrl: string;
  setCameraUrl: (url: string) => void;
  post: (path: string, body?: unknown) => Promise<void>;
}) {
  const [input, setInput] = useState(cameraUrl);
  const pi = usePiEvents(cameraUrl);

  useEffect(() => {
    setInput(cameraUrl);
  }, [cameraUrl]);

  const videoUrl = cameraUrl ? (cameraUrl.endsWith("/video") ? cameraUrl : `${cameraUrl.replace(/\/$/, "")}/video`) : "";

  return (
    <div className="maze-camera">
      <h2>Robot camera</h2>
      <div className="maze-camera-input">
        <input
          type="text"
          value={input}
          placeholder="http://172.20.10.4:8000"
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={() => {
            const url = input.replace(/\/$/, "");
            setCameraUrl(url);
            post("/telemetry", { cameraUrl: url });
          }}
        >
          Set
        </button>
      </div>
      {cameraUrl && (
        <>
          {pi.fase && (
            <p className="maze-pi-fase">
              Pi: <strong>{pi.fase.replace("_", " ")}</strong> {pi.paso && `· ${pi.paso}`}
            </p>
          )}
          <div className="maze-feed">
            <img src={videoUrl} alt="Robot camera feed" />
          </div>
          {pi.minas.length > 0 && (
            <div className="maze-minas">
              <h3>Mines detected</h3>
              <ul>
                {pi.minas.map((m: any) => (
                  <li key={m.id}>
                    <b>Mine #{m.id}</b> · {m.hora} · area {m.area}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FileDrop({
  label,
  onFile,
}: {
  label: string;
  onFile: (obj: unknown) => void;
}) {
  return (
    <label className="maze-upload">
      <span>{label}</span>
      <input
        type="file"
        accept=".json,application/json"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          try {
            onFile(JSON.parse(text));
          } catch (err) {
            alert(`Invalid JSON: ${err}`);
          }
        }}
      />
    </label>
  );
}

export default function MazeDemoView() {
  const { state, error } = usePollState();
  const [busy, setBusy] = useState(false);
  const [cameraUrl, setCameraUrl] = useState(state?.robot.cameraUrl ?? "");

  useEffect(() => {
    if (state?.robot.cameraUrl && state.robot.cameraUrl !== cameraUrl) {
      setCameraUrl(state.robot.cameraUrl);
    }
  }, [state?.robot.cameraUrl]);

  async function post(path: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/maze${path}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function uploadMap(map: unknown) {
    await post("/map", map);
  }

  async function uploadPlan(plan: unknown) {
    await post("/plan", plan);
  }

  return (
    <main className="maze-demo">
      <OperatorNav active="maze" />
      <section className="maze-layout">
        <div className="maze-panel">
          <div className="maze-header">
            <h1>Maze Demo</h1>
            <span className={`maze-state ${state?.executionState ?? "idle"}`}>
              {state?.executionState ?? "loading"}
            </span>
          </div>

          {state?.map ? (
            <MazeCanvas map={state.map} plan={state.plan} robotPose={state.robot.pose} />
          ) : (
            <div className="maze-canvas-placeholder">No map loaded</div>
          )}

          {error && <p className="maze-error">Backend error: {error}</p>}

          <div className="maze-actions">
            <FileDrop label="Upload map JSON" onFile={uploadMap} />
            <FileDrop label="Upload plan JSON" onFile={uploadPlan} />
            <button disabled={busy} onClick={() => post("/execute")}>
              Execute
            </button>
            <button disabled={busy} onClick={() => post("/pause")}>
              Pause
            </button>
            <button disabled={busy} onClick={() => post("/resume")}>
              Resume
            </button>
            <button disabled={busy} onClick={() => post("/reset")}>
              Reset
            </button>
          </div>
        </div>

        <aside className="maze-sidebar">
          <CameraPanel cameraUrl={cameraUrl} setCameraUrl={setCameraUrl} post={post} />

          <div className="maze-status">
            <h2>Robot</h2>
            <p>Status: {state?.robot.status ?? "—"}</p>
            <p>Battery: {state?.robot.battery ?? "—"}%</p>
            <p>Command: {state?.robot.commandIndex ?? "—"}</p>
            {state?.robot.obstacleDetected && <p className="maze-alert">Obstacle detected</p>}
          </div>

          {state?.plan && (
            <div className="maze-plan">
              <h2>Plan</h2>
              <p>{state.plan.distance_cells} cells</p>
              <p>~{state.plan.estimated_time_s}s</p>
              <p>Speed {state.plan.calibration.speed}</p>
              <p>Forward {state.plan.calibration.forward_steps_per_cell} steps/cell</p>
              <p>Turn {state.plan.calibration.turn_steps_per_90} steps/90°</p>
            </div>
          )}

          <div className="maze-log">
            <h2>Log</h2>
            <ul>
              {state?.log.slice(-12).map((line, i) => (
                <li key={i}>{line}</li>
              )) ?? <li>Waiting for state…</li>}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
