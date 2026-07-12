import { describe, expect, test } from "bun:test";
import { createApp } from "../src/api/app.ts";
import { MissionContextStore } from "../src/core/context-store.ts";
import { SquadronSimulator } from "../src/core/squadron-simulator.ts";

describe("/api/room-clearance", () => {
  async function makeApp() {
    const simulator = new SquadronSimulator({ seed: 42 });
    const app = createApp(new MissionContextStore(), simulator);
    return app;
  }

  test("starts idle and moves to scanning", async () => {
    const app = await makeApp();

    const stateRes = await app.request("/api/room-clearance/state");
    const initial = await stateRes.json();
    expect(initial.missionState).toBe("idle");

    const startRes = await app.request("/api/room-clearance/start", { method: "POST" });
    expect(startRes.status).toBe(200);
    const started = await startRes.json();
    expect(started.missionState).toBe("scanning");
    expect(started.robot.status).toBe("moving");
  });

  test("simulates a contact and awaits orders", async () => {
    const app = await makeApp();

    await app.request("/api/room-clearance/start", { method: "POST" });
    const contactRes = await app.request("/api/room-clearance/simulate-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: "room-b" }),
    });
    const state = await contactRes.json();
    expect(state.missionState).toBe("awaiting_orders");
    expect(state.alert).toBeDefined();
    expect(state.alert.label).toBe("person");
  });

  test("continue mission resumes after contact", async () => {
    const app = await makeApp();

    await app.request("/api/room-clearance/start", { method: "POST" });
    await app.request("/api/room-clearance/simulate-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: "room-b" }),
    });
    const continueRes = await app.request("/api/room-clearance/continue", { method: "POST" });
    const state = await continueRes.json();
    expect(state.missionState).toBe("scanning");
    expect(state.alert).toBeUndefined();
  });

  test("retreat returns to idle", async () => {
    const app = await makeApp();

    await app.request("/api/room-clearance/start", { method: "POST" });
    const retreatRes = await app.request("/api/room-clearance/retreat", { method: "POST" });
    const state = await retreatRes.json();
    expect(state.missionState).toBe("returning");
  });

  test("telemetry ingestion triggers contact", async () => {
    const app = await makeApp();

    await app.request("/api/room-clearance/start", { method: "POST" });
    const telRes = await app.request("/api/room-clearance/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "scanning",
        battery: 77,
        detection: { roomId: "room-a", label: "person", confidence: 0.91 },
      }),
    });
    const state = await telRes.json();
    expect(state.missionState).toBe("awaiting_orders");
    expect(state.robot.battery).toBe(77);
  });
});
