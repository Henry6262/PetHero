import { PrismaClient } from "@prisma/client";
import { SkinportClient } from "./ingestion/skinport.client.ts";
import { SkinportWsHandler } from "./ingestion/skinport.ws.ts";
import { IngestionService } from "./ingestion/ingestion.service.ts";
import { createApp } from "./api/api.server.ts";

const PORT = parseInt(process.env["PORT"] ?? "3000", 10);
const CURRENCY = process.env["CURRENCY"] ?? "USD";

const prisma = new PrismaClient();
const skinportClient = new SkinportClient();
const wsHandler = new SkinportWsHandler({ currency: CURRENCY });
const ingestion = new IngestionService(prisma, skinportClient, wsHandler, {
  currency: CURRENCY,
});

const app = createApp(prisma);

async function shutdown(signal: string) {
  console.log(`[cs2-edge] ${signal} received — shutting down`);
  ingestion.stop();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

ingestion.start();

Bun.serve({
  port: PORT,
  fetch: app.fetch,
});

console.log(`[cs2-edge] API listening on http://localhost:${PORT}`);
