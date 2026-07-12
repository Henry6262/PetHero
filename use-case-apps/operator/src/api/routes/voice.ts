import { Hono } from "hono";
import { z } from "zod";
import { VoiceAgent, type VoiceAgentDependencies } from "../../core/voice-agent.ts";

const voiceQuerySchema = z.object({
  query: z.string().min(1).max(500),
});

export function buildVoiceRoutes(deps: VoiceAgentDependencies) {
  const agent = new VoiceAgent(deps);
  const app = new Hono();

  app.post("/query", async (c) => {
    const body = await c.req.json();
    const parsed = voiceQuerySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Invalid query" }, 400);
    }

    const result = agent.handleQuery(parsed.data.query);
    return c.json(result);
  });

  return app;
}
