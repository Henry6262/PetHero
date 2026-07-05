import { Hono } from "hono";
import { dockCheckInSchema } from "../schemas.ts";
import type { MissionContextStore } from "../../core/context-store.ts";

export function buildDockRoutes(store: MissionContextStore, trustedTokens: Set<string>) {
  const app = new Hono();

  app.post("/check-in", async (c) => {
    const body = dockCheckInSchema.parse(await c.req.json());
    const trusted = Boolean(body.trustToken && trustedTokens.has(body.trustToken));

    const agent = store.upsertAgent({
      id: body.agentId,
      kind: body.kind ?? "ground",
      status: "syncing",
      trusted,
      batteryPct: body.batteryPct,
      localRevision: body.localRevision,
    });

    if (!trusted) {
      return c.json(
        {
          trusted: false,
          agent,
          rejected: true,
          reason: "untrusted_or_missing_token",
        },
        403
      );
    }

    const events = store.ingestDeltaBatch(body.agentId, body.deltas);
    const state = store.getState();

    return c.json({
      trusted: true,
      agent,
      uploadedEvents: events.length,
      stationRevision: state.revision,
      initializationContext: {
        revision: state.revision,
        cells: state.cells,
        staleCells: store.getStaleCells(),
      },
    });
  });

  return app;
}
