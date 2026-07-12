import { describe, expect, it } from "bun:test";
import { createApp } from "../src/api/app.ts";
import { MissionContextStore } from "../src/core/context-store.ts";
import { SquadronSimulator } from "../src/core/squadron-simulator.ts";
import { THEATER_BATTALIONS } from "../src/shared/theater.ts";

describe("/api/squadrons", () => {
  function makeApp(count?: number) {
    const simulator = count ? new SquadronSimulator({ seed: 42, count }) : new SquadronSimulator({ seed: 42 });
    return { app: createApp(new MissionContextStore(), simulator), simulator };
  }

  it("returns the full squadron list", async () => {
    const { app } = makeApp();
    const response = await app.request("/api/squadrons");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(THEATER_BATTALIONS.length);
    expect(body[0]).toHaveProperty("id");
    expect(body[0]).toHaveProperty("callsign");
    expect(body[0]).toHaveProperty("lat");
    expect(body[0]).toHaveProperty("lon");
    expect(body[0]).toHaveProperty("provenance");
  });

  it("returns a single squadron by id", async () => {
    const { app } = makeApp();
    const listResponse = await app.request("/api/squadrons");
    const list = await listResponse.json();
    const id = list[0].id;

    const response = await app.request(`/api/squadrons/${id}`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(id);
  });

  it("returns 404 for an unknown squadron", async () => {
    const { app } = makeApp();
    const response = await app.request("/api/squadrons/SQ-UNKNOWN");
    expect(response.status).toBe(404);
  });

  it("filters squadrons by bounding box", async () => {
    const { app } = makeApp();
    const response = await app.request("/api/squadrons?bbox=48,51,34,38");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body.length).toBeLessThan(THEATER_BATTALIONS.length);

    for (const sq of body) {
      expect(sq.lat).toBeGreaterThanOrEqual(48);
      expect(sq.lat).toBeLessThanOrEqual(51);
      expect(sq.lon).toBeGreaterThanOrEqual(34);
      expect(sq.lon).toBeLessThanOrEqual(38);
    }
  });

  it("rejects an invalid bbox", async () => {
    const { app } = makeApp();
    const response = await app.request("/api/squadrons?bbox=abc");
    expect(response.status).toBe(400);
  });

  it("updates timestamps when the simulator ticks", () => {
    const simulator = new SquadronSimulator({ seed: 42, count: 10 });
    const before = simulator.getAll()[0].updatedAt;

    simulator.tick();

    const after = simulator.getAll()[0].updatedAt;
    expect(Date.parse(after)).toBeGreaterThanOrEqual(Date.parse(before));
  });
});
