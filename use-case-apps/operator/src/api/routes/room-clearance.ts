import { Hono } from "hono";
import { z } from "zod";
import { RoomClearanceEngine } from "../../core/room-clearance-engine.ts";

const telemetrySchema = z.object({
  status: z.string().optional(),
  battery: z.number().optional(),
  cameraUrl: z.string().optional(),
  detection: z
    .object({
      roomId: z.string().optional(),
      label: z.string(),
      confidence: z.number(),
    })
    .optional(),
});

export function buildRoomClearanceRoutes(engine: RoomClearanceEngine) {
  const app = new Hono();

  app.get("/state", (c) => c.json(engine.getState()));

  app.post("/start", (c) => {
    engine.start();
    return c.json(engine.getState());
  });

  app.post("/reset", (c) => {
    engine.reset();
    return c.json(engine.getState());
  });

  app.post("/continue", (c) => {
    engine.continueMission();
    return c.json(engine.getState());
  });

  app.post("/retreat", (c) => {
    engine.retreat();
    return c.json(engine.getState());
  });

  app.post("/telemetry", async (c) => {
    const body = await c.req.json();
    const parsed = telemetrySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Invalid telemetry" }, 400);
    }
    engine.telemetry(parsed.data);
    return c.json(engine.getState());
  });

  app.post("/simulate-contact", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    engine.simulateContact(body.roomId);
    return c.json(engine.getState());
  });

  app.get("/next-command", (c) => {
    return c.json(engine.getNextCommand() ?? { command: "none" });
  });

  return app;
}
