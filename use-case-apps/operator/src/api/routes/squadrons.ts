import { Hono } from "hono";
import type { SquadronSimulator } from "../../core/squadron-simulator.ts";

export function buildSquadronsRoutes(simulator: SquadronSimulator) {
  const app = new Hono();

  app.get("/", (c) => {
    if (!simulator.isRunning) simulator.start();

    const bbox = c.req.query("bbox");
    if (bbox) {
      const [minLat, maxLat, minLon, maxLon] = bbox.split(",").map(Number);
      if ([minLat, maxLat, minLon, maxLon].some((n) => Number.isNaN(n))) {
        return c.json({ error: "Invalid bbox format. Expected minLat,maxLat,minLon,maxLon" }, 400);
      }
      return c.json(simulator.getInBbox(minLat, maxLat, minLon, maxLon));
    }

    return c.json(simulator.getAll());
  });

  app.get("/:id", (c) => {
    if (!simulator.isRunning) simulator.start();

    const squadron = simulator.getById(c.req.param("id"));
    if (!squadron) {
      return c.json({ error: "Squadron not found" }, 404);
    }
    return c.json(squadron);
  });

  return app;
}
