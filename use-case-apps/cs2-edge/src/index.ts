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
import { createApp, websocket } from "./api/api.server.ts";
import { installRuntimeConsoleCapture } from "./runtime-log.ts";
import { BotFleetService } from "./bots/bot-fleet.service.ts";
import { WalletService } from "./wallet/wallet.service.ts";

installRuntimeConsoleCapture();

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
  maxSpendPerTrade: Number(process.env["MAX_SPEND_PER_TRADE"] ?? "10"),
  minBuyPrice: Number(process.env["MIN_BUY_PRICE"] ?? "1"),
  minVolume24h: 5,
  dmarketClient,
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

// Phase 1: Marketplace Bot Fleet
const botConfigs = [];
if (process.env["MARKETPLACE_BOT_USERNAME"]) {
  botConfigs.push({
    botId: process.env["MARKETPLACE_BOT_ID"] ?? "bot-1",
    steamId: process.env["MARKETPLACE_BOT_STEAM_ID"] ?? "",
    username: process.env["MARKETPLACE_BOT_USERNAME"] ?? "",
    password: process.env["MARKETPLACE_BOT_PASSWORD"] ?? "",
    sharedSecret: process.env["MARKETPLACE_BOT_SHARED_SECRET"] || undefined,
    identitySecret: process.env["MARKETPLACE_BOT_IDENTITY_SECRET"] || undefined,
    apiKey: process.env["MARKETPLACE_BOT_API_KEY"] || undefined,
    tradeToken: process.env["MARKETPLACE_BOT_TRADE_TOKEN"] || undefined,
  });
}

const botFleet = new BotFleetService(prisma, botConfigs);
const walletService = new WalletService(prisma);

// Wire deposit handler: auto-credit wallet when bot receives skins
botFleet.onDeposit(async (deposit, botId) => {
  const user = await prisma.user.findUnique({
    where: { steamId: deposit.partnerSteamId },
  });
  if (!user) {
    console.log(`[deposit] No user found for steamId ${deposit.partnerSteamId}`);
    return;
  }

  try {
    const result = await walletService.processDeposit(user.id, deposit, botId);
    console.log(
      `[deposit] Credited $${result.credited.toFixed(2)} to ${user.steamName} (${result.itemCount} items)`
    );
  } catch (err: any) {
    console.error(`[deposit] Failed to process deposit for ${user.steamId}:`, err.message);
  }
});

const app = createApp(prisma, execution, botFleet);

async function shutdown(signal: string) {
  console.log(`[cs2-edge] ${signal} received — shutting down`);
  ingestion.stop();
  steam.stop();
  await botFleet.shutdown();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

ingestion.start();
steam.start();
if (botConfigs.length > 0) {
  await botFleet.initialize();
}

// Run execution cycle every 60 seconds
setInterval(() => void execution.runCycle(), 60000);

Bun.serve({
  port: PORT,
  fetch: app.fetch,
  websocket,
});

console.log(`[cs2-edge] API listening on http://localhost:${PORT}`);
console.log(`[cs2-edge] Execution Bot active — scanning for Alpha trades...`);
if (botConfigs.length > 0) {
  console.log(`[cs2-edge] Marketplace Bot Fleet active (${botConfigs.length} bot(s))`);
}
