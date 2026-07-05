import { Hono } from "hono";
import { playbookSchema } from "../schemas.ts";
import { proposeFormation } from "../../core/playbook.ts";
import type { MissionContextStore } from "../../core/context-store.ts";

export function buildPlaybookRoutes(store: MissionContextStore) {
  const app = new Hono();

  app.post("/", async (c) => {
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

  return app;
}
