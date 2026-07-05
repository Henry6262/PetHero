import { Hono } from "hono";
import type { MissionContextStore } from "../../core/context-store.ts";

export function buildCellsRoutes(store: MissionContextStore) {
  const app = new Hono();

  app.get("/stale", (c) =>
    c.json({
      cells: store.getStaleCells(),
    })
  );

  return app;
}
