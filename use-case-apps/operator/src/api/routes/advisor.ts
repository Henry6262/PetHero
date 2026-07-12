import { Hono } from "hono";
import { z } from "zod";
import type { LLMAdvisor } from "../../core/llm-advisor.ts";
import type { MissionEngine } from "../../core/mission-engine.ts";
import type { RobotCommander } from "../../core/robot-commander.ts";
import type { FusionSystem } from "./fusion.ts";
import type { TheaterOperation } from "../../shared/mission.ts";
import { humanDecisionSchema } from "../../shared/advisor.ts";

export function buildAdvisorRoutes(
  engine: MissionEngine,
  commander: RobotCommander,
  fusion: FusionSystem,
  llmAdvisor: LLMAdvisor,
  defaultOperation: TheaterOperation
) {
  const app = new Hono();

  app.get("/brief", async (c) => {
    const state = engine.getState();
    const mission = state?.mission ?? defaultOperation.missions[0];
    if (!mission) return c.json({ error: "No mission loaded" }, 404);

    const snapshot = {
      mission,
      assets: commander.getAssets(),
      fusedTracks: fusion.engine.getFusedTracks(),
    };

    const brief = await llmAdvisor.advise(snapshot);

    return c.json({
      brief,
      pendingDecision: state?.pendingDecision ?? null,
      state: state?.state ?? "idle",
      elapsedMs: state?.elapsedMs ?? 0,
    });
  });

  app.get("/reasoning", (c) => {
    const state = engine.getState();
    return c.json({ log: state?.reasoningLog ?? [] });
  });

  app.post("/decision", async (c) => {
    const body = humanDecisionSchema.parse(await c.req.json());
    const updated = engine.applyHumanDecision(body.decisionId, body.approved, body.note);
    if (!updated) return c.json({ error: "No running mission" }, 409);
    return c.json({ ok: true, state: updated.state, pendingDecision: updated.pendingDecision });
  });

  app.post("/inject-contact", async (c) => {
    const schema = z.object({
      lat: z.number(),
      lon: z.number(),
      classification: z.string().optional(),
      confidence: z.number().optional(),
    });
    const body = schema.parse(await c.req.json());
    const tracks = engine.injectContact(body.lat, body.lon, body.classification, body.confidence);
    return c.json({ accepted: true, tracks });
  });

  return app;
}
