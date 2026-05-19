import { PrismaClient } from "@prisma/client";
import { SkinportClient } from "./ingestion/skinport.client.ts";
import { CsfloatClient } from "./ingestion/csfloat.client.ts";
import { DmarketClient } from "./ingestion/dmarket.client.ts";
import { BuffClient } from "./ingestion/buff.client.ts";
import { SkinportWsHandler } from "./ingestion/skinport.ws.ts";
import { BitskinsWsHandler } from "./ingestion/bitskins.ws.ts";
import { IngestionService } from "./ingestion/ingestion.service.ts";
import { OpportunityService } from "./opportunities/opportunity.service.ts";
import { ExecutionService } from "./execution/execution.service.ts";
import { SteamService } from "./execution/steam.service.ts";
import { createApp } from "./api/api.server.ts";

const PORT = parseInt(process.env["PORT"] ?? "3000", 10);
const CURRENCY = process.env["CURRENCY"] ?? "USD";

const prisma = new PrismaClient();

// 2026 Institutional Architecture: Market Connectors
const skinportClient = new SkinportClient();
const csfloatClient = new CsfloatClient();
const dmarketClient = new DmarketClient({
  publicKey: process.env["DMARKET_PUBLIC_KEY"] ?? "",
  privateKey: process.env["DMARKET_PRIVATE_KEY"] ?? "",
});
const buffClient = new BuffClient({
  session: process.env["BUFF_SESSION"] ?? "",
  ntesYdSess: process.env["BUFF_NTES_YD_SESS"] ?? "",
  deviceId: process.env["BUFF_DEVICE_ID"] ?? "",
});

const wsHandler = new SkinportWsHandler({ currency: CURRENCY });
const bitskinsWs = new BitskinsWsHandler();
const opportunityService = new OpportunityService(prisma);

const steam = new SteamService({
  username: process.env["STEAM_USERNAME"] || "",
  password: process.env["STEAM_PASSWORD"] || "",
  sharedSecret: process.env["STEAM_SHARED_SECRET"] || "",
  identitySecret: process.env["STEAM_IDENTITY_SECRET"] || "",
  apiKey: process.env["STEAM_API_KEY"] || "",
});

const execution = new ExecutionService(prisma, {
  minScore: 50,
  minProfitPct: 15,
  maxSpendPerTrade: 30,
  minBuyPrice: 10,
  minVolume24h: 5,
  steamService: steam,
});

const ingestion = new IngestionService(prisma, skinportClient, wsHandler, {
  currency: CURRENCY,
  opportunityService,
  csfloatClient,
  dmarketClient,
  buffClient,
  bitskinsWs,
});

const app = createApp(prisma);

async function shutdown(signal: string) {
  console.log(`[cs2-edge] ${signal} received — shutting down`);
  ingestion.stop();
  steam.stop();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

ingestion.start();
steam.start();

// Run execution cycle every 60 seconds
setInterval(() => void execution.runCycle(), 60000);

Bun.serve({
  port: PORT,
  fetch: app.fetch,
});

console.log(`[cs2-edge] API listening on http://localhost:${PORT}`);
console.log(`[cs2-edge] Execution Bot active — scanning for Alpha trades...`);
