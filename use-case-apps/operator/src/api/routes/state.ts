import { Hono } from "hono";
import type { MissionContextStore } from "../../core/context-store.ts";

export function buildStateRoutes(store: MissionContextStore) {
  const app = new Hono();

  app.get("/", (c) => c.json(store.getState()));

  app.get("/cells/stale", (c) =>
    c.json({
      cells: store.getStaleCells(),
    })
  );

  app.post("/reset", (c) => {
    store.reset();
    return c.json({ ok: true });
  });

  return app;
}
