import { Hono } from "hono";
import { SensorSimulator, TrackFusionEngine } from "../../core/track-fusion.ts";

export interface FusionSystem {
  simulator: SensorSimulator;
  engine: TrackFusionEngine;
}

export function createFusionSystem(seed?: number): FusionSystem {
  return {
    simulator: new SensorSimulator(seed),
    engine: new TrackFusionEngine({ seed }),
  };
}

export function buildFusionRoutes(system: FusionSystem) {
  const app = new Hono();

  app.get("/sources", (c) => {
    return c.json(system.simulator.getSources());
  });

  app.get("/tracks", (c) => {
    system.simulator.tick();
    const feeds = system.simulator.generateFeeds();
    const fused = system.engine.processFeeds(...feeds);
    return c.json({ fused, feeds });
  });

  app.get("/fused", (c) => {
    return c.json(system.engine.getFusedTracks());
  });

  app.post("/reset", (c) => {
    system.simulator.reset();
    system.engine.reset();
    return c.json({ ok: true });
  });

  return app;
}
