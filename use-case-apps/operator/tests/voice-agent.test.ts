import { describe, expect, it } from "bun:test";
import { createApp } from "../src/api/app.ts";
import { MissionContextStore } from "../src/core/context-store.ts";
import { SquadronSimulator } from "../src/core/squadron-simulator.ts";

describe("/api/voice", () => {
  async function makeApp() {
    const simulator = new SquadronSimulator({ seed: 42 });
    const app = createApp(new MissionContextStore(), simulator);
    const startResponse = await app.request("/api/missions/start", { method: "POST" });
    expect(startResponse.status).toBe(200);
    return app;
  }

  async function query(app: Awaited<ReturnType<typeof makeApp>>, text: string) {
    const response = await app.request("/api/voice/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text }),
    });
    expect(response.status).toBe(200);
    return response.json();
  }

  it("reports enemy location", async () => {
    const app = await makeApp();
    const result = await query(app, "Where is the enemy?");
    expect(result.response).toBeString();
    expect(result.response.length).toBeGreaterThan(0);
  });

  it("reports mission status", async () => {
    const app = await makeApp();
    const result = await query(app, "Status of the payload");
    expect(result.response).toBeString();
    expect(result.response).toContain("Payload");
  });

  it("reports next waypoint", async () => {
    const app = await makeApp();
    const result = await query(app, "What is my next waypoint?");
    expect(result.response).toBeString();
    expect(result.response).toContain("waypoint");
  });

  it("returns unknown for unrecognized queries", async () => {
    const app = await makeApp();
    const result = await query(app, "Tell me a joke");
    expect(result.action).toBe("unknown");
  });

  it("rejects invalid requests", async () => {
    const app = await makeApp();
    const response = await app.request("/api/voice/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
  });
});
