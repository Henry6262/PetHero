import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { itemsRouter } from "./routes/items.route.ts";
import { opportunitiesRouter } from "./routes/opportunities.route.ts";
import { executionRouter } from "./routes/execution.route.ts";
import { dashboardRouter } from "./routes/dashboard.route.ts";

export function createApp(prisma: PrismaClient) {
  const app = new Hono();

  app.get("/health", c => c.json({ status: "ok" }));
  app.route("/items", itemsRouter(prisma));
  app.route("/opportunities", opportunitiesRouter(prisma));
  app.route("/execution", executionRouter(prisma));
  app.route("/dashboard", dashboardRouter());

  return app;
}
