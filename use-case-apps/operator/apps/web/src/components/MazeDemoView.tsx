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

interface RutaStep {
  accion: string;
  velocidad: number;
  angulo?: number;
}

function computeTrajectory(steps: RutaStep[]) {
  // Defaults from _archivo/navegar.py calibration fallback.
  const pasoM = 0.06;
  const defaultGiroDeg = 15;
  let x = 0;
  let y = 0;
  // 0 degrees = up on the canvas (negative Y in math coordinates).
  let heading = -Math.PI / 2;
  const pts = [{ x, y }];

  for (const s of steps) {
    const a = s.accion.toLowerCase();
    if (a === "forward") {
      x += pasoM * Math.cos(heading);
      y += pasoM * Math.sin(heading);
      pts.push({ x, y });
    } else if (a.includes("right")) {
      const deg = s.angulo ?? defaultGiroDeg;
      heading += (deg * Math.PI) / 180;
    } else if (a.includes("left")) {
      const deg = s.angulo ?? defaultGiroDeg;
      heading -= (deg * Math.PI) / 180;
    }
  }
  return pts;
}

function TrajectoryCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [steps, setSteps] = useState<RutaStep[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/maze/ruta.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setSteps(data))
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || steps.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 384;
    canvas.width = size;
    canvas.height = size;

    const pts = computeTrajectory(steps);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const margin = 24;
    const width = Math.max(maxX - minX, 0.001);
    const height = Math.max(maxY - minY, 0.001);
    const scale = Math.min((size - margin * 2) / width, (size - margin * 2) / height);
    const offsetX = (size - width * scale) / 2 - minX * scale;
    const offsetY = (size - height * scale) / 2 - minY * scale;

    const toCanvas = (p: { x: number; y: number }) => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
    });

    ctx.fillStyle = "#0b0d12";
    ctx.fillRect(0, 0, size, size);

    // Grid lines for reference.
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i += 48) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // Trajectory line.
    ctx.beginPath();
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (let i = 0; i < pts.length; i++) {
      const c = toCanvas(pts[i]);
      if (i === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    }
    ctx.stroke();

    // Start point.
    const start = toCanvas(pts[0]);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // End point / current robot pose.
    const end = toCanvas(pts[pts.length - 1]);
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Legend.
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(`steps: ${steps.length} · pts: ${pts.length}`, 10, size - 10);
  }, [steps]);

  if (error) return <p className="maze-error">Could not load ruta.json: {error}</p>;
  if (steps.length === 0) return <div className="maze-canvas-placeholder">Loading route…</div>;
  return <canvas ref={canvasRef} className="maze-canvas" />;
}

function CameraPanel({
  cameraUrl,
  onSetCameraUrl,
  post,
}: {
  cameraUrl: string;
  onSetCameraUrl: (url: string) => void;
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
          placeholder="http://172.20.10.10:8000"
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={() => {
            const url = input.replace(/\/$/, "");
            onSetCameraUrl(url);
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

const CAMERA_URL_KEY = "operatorMazeCameraUrl";

export default function MazeDemoView() {
  const { state, error } = usePollState();
  const [busy, setBusy] = useState(false);
  const [cameraUrl, setCameraUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CAMERA_URL_KEY) ?? "";
    }
    return "";
  });

  useEffect(() => {
    if (state?.robot.cameraUrl && state.robot.cameraUrl !== cameraUrl) {
      setCameraUrl(state.robot.cameraUrl);
      localStorage.setItem(CAMERA_URL_KEY, state.robot.cameraUrl);
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

          <TrajectoryCanvas />

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
          <CameraPanel
            cameraUrl={cameraUrl}
            onSetCameraUrl={(url) => {
              setCameraUrl(url);
              localStorage.setItem(CAMERA_URL_KEY, url);
            }}
            post={post}
          />

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
