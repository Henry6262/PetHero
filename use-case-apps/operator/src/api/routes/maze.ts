import { Hono, type Context } from "hono";
import { z } from "zod";
import { MazeEngine, type MazeMap, type MazePlan, type MazeRobotTelemetry } from "../../core/maze-engine.ts";

const mazeMapSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  cell_size_m: z.number().positive(),
  robot_radius_m: z.number().nonnegative(),
  grid: z.array(z.array(z.number().int().min(0).max(1))),
  inflated_grid: z.array(z.array(z.number().int().min(0).max(1))),
  start: z.array(z.number().int()).length(2),
  end: z.array(z.number().int()).length(2),
  debug_image: z.string().optional(),
});

const mazePlanSchema = z.object({
  map_file: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  cell_size_m: z.number().positive(),
  start: z.array(z.number().int()).length(2),
  end: z.array(z.number().int()).length(2),
  path: z.array(z.array(z.number().int()).length(2)),
  commands: z.array(z.object({ action: z.string(), steps: z.number().int().nonnegative() })),
  heading: z.string(),
  distance_cells: z.number().int().nonnegative(),
  estimated_time_s: z.number().nonnegative(),
  calibration: z.object({
    forward_steps_per_cell: z.number().int().positive(),
    turn_steps_per_90: z.number().int().positive(),
    speed: z.number().int().positive(),
  }),
  error: z.string().optional(),
});

const telemetrySchema = z.object({
  status: z.string().optional(),
  battery: z.number().optional(),
  cameraUrl: z.string().optional(),
  pose: z.tuple([z.number(), z.number()]).optional(),
  command_index: z.number().optional(),
  obstacle_detected: z.boolean().optional(),
});

function jsonResponse(c: Context, data: unknown, status = 200) {
  return c.json(data, status as any);
}

export function buildMazeRoutes(engine: MazeEngine): Hono {
  const app = new Hono();

  app.get("/state", (c) => jsonResponse(c, engine.getState()));

  app.get("/map", (c) => {
    const state = engine.getState();
    if (!state.map) return jsonResponse(c, { error: "No map loaded" }, 404);
    return jsonResponse(c, state.map);
  });

  app.post("/map", async (c) => {
    const body = await c.req.json();
    const parsed = mazeMapSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(c, { error: "Invalid maze map", issues: parsed.error.format() }, 400);
    }
    return jsonResponse(c, engine.setMap(parsed.data as MazeMap));
  });

  app.get("/plan", (c) => {
    const state = engine.getState();
    if (!state.plan) return jsonResponse(c, { error: "No plan loaded" }, 404);
    return jsonResponse(c, state.plan);
  });

  app.post("/plan", async (c) => {
    const body = await c.req.json();
    const parsed = mazePlanSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(c, { error: "Invalid maze plan", issues: parsed.error.format() }, 400);
    }
    return jsonResponse(c, engine.setPlan(parsed.data as MazePlan));
  });

  app.post("/execute", (c) => {
    return jsonResponse(c, engine.startExecution());
  });

  app.post("/pause", (c) => {
    return jsonResponse(c, engine.pause());
  });

  app.post("/resume", (c) => {
    return jsonResponse(c, engine.resume());
  });

  app.post("/reset", (c) => {
    return jsonResponse(c, engine.reset());
  });

  app.post("/telemetry", async (c) => {
    const body = await c.req.json();
    const parsed = telemetrySchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(c, { error: "Invalid telemetry", issues: parsed.error.format() }, 400);
    }
    return jsonResponse(c, engine.telemetry(parsed.data as MazeRobotTelemetry));
  });

  app.get("/next-command", (c) => {
    const cmd = engine.getNextCommand();
    return jsonResponse(c, cmd ?? { command: "none" });
  });

  return app;
}
