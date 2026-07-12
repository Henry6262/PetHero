import { describe, expect, it } from "bun:test";
import { MazeEngine } from "../src/core/maze-engine.ts";
import { buildMazeRoutes } from "../src/api/routes/maze.ts";

function buildMap() {
  const grid = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ];
  return {
    width: 5,
    height: 5,
    cell_size_m: 0.1,
    robot_radius_m: 0.05,
    grid,
    inflated_grid: grid,
    start: [1, 1],
    end: [3, 3],
  };
}

function makePlan(): any {
  return {
    map_file: "test.json",
    width: 5,
    height: 5,
    cell_size_m: 0.1,
    start: [1, 1],
    end: [3, 3],
    path: [
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 3],
      [3, 3],
    ],
    commands: [
      { action: "forward", steps: 2 },
      { action: "turn_right", steps: 2 },
      { action: "forward", steps: 2 },
      { action: "sit", steps: 1 },
    ],
    heading: "E",
    distance_cells: 4,
    estimated_time_s: 5,
    calibration: {
      forward_steps_per_cell: 2,
      turn_steps_per_90: 2,
      speed: 60,
    },
  };
}

describe("MazeEngine", () => {
  it("starts idle", () => {
    const engine = new MazeEngine();
    expect(engine.getState().executionState).toBe("idle");
  });

  it("loads a map", () => {
    const engine = new MazeEngine();
    engine.setMap(buildMap());
    expect(engine.getState().executionState).toBe("mapping");
    expect(engine.getState().map?.width).toBe(5);
  });

  it("loads a plan and starts execution", () => {
    const engine = new MazeEngine();
    engine.setMap(buildMap());
    engine.setPlan(makePlan());
    expect(engine.getState().executionState).toBe("planned");
    engine.startExecution();
    expect(engine.getState().executionState).toBe("executing");
  });

  it("hands out queued commands", () => {
    const engine = new MazeEngine();
    engine.setMap(buildMap());
    engine.setPlan(makePlan());
    engine.startExecution();

    const first = engine.getNextCommand();
    expect(first?.command).toBe("execute_command");
    expect((first?.payload as any).action).toBe("forward");

    const second = engine.getNextCommand();
    expect((second?.payload as any).action).toBe("turn_right");
  });

  it("pauses on obstacle telemetry", () => {
    const engine = new MazeEngine();
    engine.setMap(buildMap());
    engine.setPlan(makePlan());
    engine.startExecution();
    engine.telemetry({ obstacle_detected: true });
    expect(engine.getState().executionState).toBe("paused");
    expect(engine.getState().robot.obstacleDetected).toBe(true);
  });
});

describe("/api/maze", () => {
  it("returns state", async () => {
    const engine = new MazeEngine();
    const app = buildMazeRoutes(engine);
    const res = await app.request("/state");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.executionState).toBe("idle");
  });

  it("accepts a map", async () => {
    const engine = new MazeEngine();
    const app = buildMazeRoutes(engine);
    const res = await app.request("/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildMap()),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.executionState).toBe("mapping");
  });

  it("accepts a plan and executes", async () => {
    const engine = new MazeEngine();
    const app = buildMazeRoutes(engine);
    await app.request("/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildMap()),
    });
    await app.request("/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(makePlan()),
    });
    const execRes = await app.request("/execute", { method: "POST" });
    expect(execRes.status).toBe(200);
    const state = await execRes.json();
    expect(state.executionState).toBe("executing");

    const cmdRes = await app.request("/next-command");
    const cmd = await cmdRes.json();
    expect(cmd.command).toBe("execute_command");
  });
});
