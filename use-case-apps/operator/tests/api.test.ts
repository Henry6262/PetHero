import { describe, expect, it } from "bun:test";
import { createApp } from "../src/api/app.ts";
import { MissionContextStore } from "../src/core/context-store.ts";

describe("operator api", () => {
  it("accepts meaning-first event packets and updates mission state", async () => {
    const app = createApp(new MissionContextStore());

    const response = await app.request("/api/agents/alpha/events", {
      method: "POST",
      body: JSON.stringify({
        kind: "detection",
        cellId: "A1",
        x: 1,
        y: 2,
        label: "person",
        confidence: 0.82,
      }),
      headers: { "content-type": "application/json" },
    });

    expect(response.status).toBe(202);

    const stateResponse = await app.request("/api/state");
    const state = await stateResponse.json();

    expect(state.agents[0].id).toBe("alpha");
    expect(state.cells[0].id).toBe("A1");
    expect(state.cells[0].status).toBe("alert");
    expect(state.cells[0].provenance[0].agentId).toBe("alpha");
  });

  it("rejects untrusted dock check-ins", async () => {
    const app = createApp(new MissionContextStore());

    const response = await app.request("/api/dock/check-in", {
      method: "POST",
      body: JSON.stringify({
        agentId: "unknown-agent",
        trustToken: "wrong",
        deltas: [],
      }),
      headers: { "content-type": "application/json" },
    });

    expect(response.status).toBe(403);
  });

  it("returns a formation plan for stale-zone rechecks", async () => {
    const app = createApp(new MissionContextStore(1));

    await app.request("/api/agents/alpha/events", {
      method: "POST",
      body: JSON.stringify({
        kind: "map_cell",
        cellId: "A1",
        x: 0,
        y: 0,
        confidence: 0.9,
        observedAt: new Date(Date.now() - 10_000).toISOString(),
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await app.request("/api/playbook", {
      method: "POST",
      body: JSON.stringify({ intent: "recheck_stale_zones" }),
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();

    expect(body.plan.formation).toBe("return-and-refresh");
    expect(body.plan.tasks[0].targetCellId).toBe("A1");
  });
});
