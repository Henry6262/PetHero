import { Hono } from "hono";
import type { MissionEngine } from "../../core/mission-engine.ts";
import type { TheaterOperation } from "../../shared/mission.ts";

export function buildMissionsRoutes(engine: MissionEngine, defaultOperation: TheaterOperation) {
  const app = new Hono();

  app.get("/state", (c) => {
    const state = engine.getState();
    if (!state) {
      return c.json({ active: false, operation: defaultOperation }, 200);
    }
    return c.json({
      active: true,
      operation: state.operation,
      mission: state.mission,
      state: state.state,
      elapsedMs: state.elapsedMs,
      tickCount: state.tickCount,
    });
  });

  app.post("/start", (c) => {
    const state = engine.getState();
    if (state?.state === "running") {
      return c.json({ error: "Mission already running." }, 409);
    }
    const mission = defaultOperation.missions.find((m) => m.active) ?? defaultOperation.missions[0];
    engine.start(defaultOperation, mission.id);
    return c.json({ ok: true, missionId: mission.id, state: "running" });
  });

  app.post("/pause", (c) => {
    engine.pause();
    return c.json({ ok: true, state: engine.getState()?.state ?? "idle" });
  });

  app.post("/resume", (c) => {
    engine.resume();
    return c.json({ ok: true, state: engine.getState()?.state ?? "idle" });
  });

  app.post("/reset", (c) => {
    engine.stop();
    return c.json({ ok: true, state: "idle" });
  });

  return app;
}
