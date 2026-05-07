import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { itemsRouter } from "./routes/items.route.ts";

export function createApp(prisma: PrismaClient) {
  const app = new Hono();

  app.get("/health", c => c.json({ status: "ok" }));
  app.route("/items", itemsRouter(prisma));

  return app;
}
