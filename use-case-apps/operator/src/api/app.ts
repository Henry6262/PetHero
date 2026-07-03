import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { MissionContextStore } from "../core/context-store.ts";
import { proposeFormation } from "../core/playbook.ts";

const eventSchema = z.object({
  kind: z.enum(["map_cell", "detection", "change", "agent_status", "link_status"]),
  cellId: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  label: z
    .enum(["person", "vehicle", "obstacle", "open_door", "closed_door", "signal_loss", "unknown"])
    .optional(),
  confidence: z.number().min(0).max(1).optional(),
  observedAt: z.string().datetime().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

const dockCheckInSchema = z.object({
  agentId: z.string().min(1),
  trustToken: z.string().optional(),
  kind: z.enum(["ground", "aerial", "dock", "operator", "simulated"]).optional(),
  batteryPct: z.number().min(0).max(100).optional(),
  localRevision: z.number().int().nonnegative().optional(),
  deltas: z.array(eventSchema).default([]),
});

const playbookSchema = z.object({
  intent: z.enum([
    "area_scan",
    "perimeter_watch",
    "building_approach",
    "lost_link_recovery",
    "recheck_stale_zones",
    "relay_chain",
  ]),
  targetCells: z.array(z.string()).optional(),
});

export function createApp(store = new MissionContextStore()) {
  const app = new Hono();
  const trustedTokens = new Set(
    (process.env["OPERATOR_TRUST_TOKENS"] ?? "demo-agent-token,demo-dock-token")
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
  );

  app.use("*", cors());

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "operator",
      generatedAt: new Date().toISOString(),
    })
  );

  app.get("/api/state", (c) => c.json(store.getState()));

  app.post("/api/agents/:agentId/events", async (c) => {
    const body = eventSchema.parse(await c.req.json());
    const event = store.ingestEvent(c.req.param("agentId"), body);
    return c.json({ accepted: true, event, stateRevision: store.getState().revision }, 202);
  });

  app.get("/api/cells/stale", (c) =>
    c.json({
      cells: store.getStaleCells(),
    })
  );

  app.post("/api/dock/check-in", async (c) => {
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

  app.post("/api/playbook", async (c) => {
    const body = playbookSchema.parse(await c.req.json());
    const state = store.getState();
    const plan = proposeFormation({
      intent: body.intent,
      agents: state.agents,
      staleCells: store.getStaleCells(),
      targetCells: body.targetCells,
    });

    return c.json({ plan });
  });

  app.post("/api/reset", (c) => {
    store.reset();
    return c.json({ ok: true });
  });

  return app;
}
