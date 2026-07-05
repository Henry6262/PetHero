import { Hono } from "hono";
import { cors } from "hono/cors";
import { MissionContextStore } from "../core/context-store.ts";
import { buildAgentsRoutes } from "./routes/agents.ts";
import { buildCellsRoutes } from "./routes/cells.ts";
import { buildDockRoutes } from "./routes/dock.ts";
import { buildPlaybookRoutes } from "./routes/playbook.ts";
import { buildStateRoutes } from "./routes/state.ts";

export function createApp(store = new MissionContextStore()) {
  const app = new Hono();
  const trustedTokens = new Set(
    (process.env["OPERATOR_TRUST_TOKENS"] ?? "demo-agent-token,demo-dock-token")
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
  );

  app.use("*", cors());

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "operator",
      generatedAt: new Date().toISOString(),
    })
  );

  app.route("/api/agents", buildAgentsRoutes(store));
  app.route("/api/cells", buildCellsRoutes(store));
  app.route("/api/dock", buildDockRoutes(store, trustedTokens));
  app.route("/api/playbook", buildPlaybookRoutes(store));
  app.route("/api/state", buildStateRoutes(store));

  return app;
}
