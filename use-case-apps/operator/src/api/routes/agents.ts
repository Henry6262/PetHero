import { Hono } from "hono";
import { eventSchema } from "../schemas.ts";
import type { MissionContextStore } from "../../core/context-store.ts";

export function buildAgentsRoutes(store: MissionContextStore) {
  const app = new Hono();

  app.post("/:agentId/events", async (c) => {
    const body = eventSchema.parse(await c.req.json());
    const event = store.ingestEvent(c.req.param("agentId"), body);
    return c.json({ accepted: true, event, stateRevision: store.getState().revision }, 202);
  });

  return app;
}
