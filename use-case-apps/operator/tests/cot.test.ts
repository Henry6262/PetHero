import { describe, expect, it } from "bun:test";
import { createApp } from "../src/api/app.ts";
import { MissionContextStore } from "../src/core/context-store.ts";

describe("CoT emitter", () => {
  it("returns XML for fused tracks", async () => {
    const app = createApp(new MissionContextStore());
    await app.request("/api/fusion/tracks");

    const res = await app.request("/api/cot/tracks");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<event version="2.0"');
    expect(body).toContain('uid="operator-track-');
  });

  it("returns XML for mission assets", async () => {
    const app = createApp(new MissionContextStore());
    const res = await app.request("/api/cot/mission");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('uid="operator-asset-');
  });
});
