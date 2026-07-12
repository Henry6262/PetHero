import { Hono } from "hono";
import type { RobotCommander } from "../../core/robot-commander.ts";

export function buildAssetsRoutes(commander: RobotCommander) {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json(commander.getAssets());
  });

  app.get("/:id", (c) => {
    const asset = commander.getAsset(c.req.param("id"));
    if (!asset) return c.json({ error: "Not found" }, 404);
    return c.json(asset);
  });

  app.post("/:id/command", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const ack = await commander.sendCommand(id, body);
    return c.json(ack, ack.ok ? 200 : 502);
  });

  return app;
}
