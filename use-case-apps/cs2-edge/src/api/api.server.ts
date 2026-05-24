import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunWebSocket } from "hono/bun";
import { PrismaClient } from "@prisma/client";
import { coinflipWs } from "../betting/coinflip.ws.ts";

const { upgradeWebSocket, websocket } = createBunWebSocket();
export { websocket };
import { itemsRouter } from "./routes/items.route.ts";
import { opportunitiesRouter } from "./routes/opportunities.route.ts";
import { executionRouter } from "./routes/execution.route.ts";
import { dashboardRouter } from "./routes/dashboard.route.ts";
import { snipesRouter } from "./routes/snipes.route.ts";
import { authRouter } from "./routes/auth.route.ts";
import { marketplaceRouter } from "./routes/marketplace.route.ts";
import { inventoryRouter } from "./routes/inventory.route.ts";
import { walletRouter } from "./routes/wallet.route.ts";
import { casesRouter } from "./routes/cases.route.ts";
import { adminRouter } from "./routes/admin.route.ts";
import { bettingRouter } from "./routes/betting.route.ts";
import { ExecutionService } from "../execution/execution.service.ts";
import type { BotFleetService } from "../bots/bot-fleet.service.ts";

export function createApp(
  prisma: PrismaClient,
  executionService?: ExecutionService,
  botFleet?: BotFleetService
) {
  const app = new Hono();

  app.use("*", cors());

  app.get("/health", c => c.json({ status: "ok" }));
  app.route("/items", itemsRouter(prisma));
  app.route("/opportunities", opportunitiesRouter(prisma));
  app.route("/execution", executionRouter(prisma, executionService));
  app.route("/dashboard", dashboardRouter());
  app.route("/snipes", snipesRouter());

  // Phase 1: Marketplace routes
  app.route("/auth", authRouter(prisma));
  app.route("/marketplace", marketplaceRouter(prisma));
  app.route("/wallet", walletRouter(prisma));
  if (botFleet) {
    app.route("/inventory", inventoryRouter(prisma, botFleet));
  }

  // Phase 2: Case Opening + Crypto
  app.route("/cases", casesRouter(prisma));
  app.route("/admin", adminRouter(prisma));

  // Phase 3: Betting Suite
  app.route("/betting", bettingRouter(prisma));

  // WebSocket: Coinflip real-time notifications
  app.get(
    "/ws/coinflip",
    upgradeWebSocket((c) => {
      let userId: string | null = null;
      return {
        onOpen(_, ws) {
          // userId is sent as first message after connect
        },
        onMessage(event, ws) {
          try {
            const data = JSON.parse(event.data.toString()) as { type: string; userId?: string };
            if (data.type === "auth" && data.userId) {
              userId = data.userId;
              coinflipWs.register(userId, ws);
            }
          } catch {
            // ignore malformed messages
          }
        },
        onClose() {
          if (userId) coinflipWs.unregister(userId);
        },
      };
    })
  );

  return app;
}
