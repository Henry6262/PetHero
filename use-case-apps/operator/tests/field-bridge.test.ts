import { describe, expect, it } from "bun:test";
import { createHmac } from "node:crypto";
import { createApp } from "../src/api/app.ts";
import { MissionContextStore } from "../src/core/context-store.ts";

function sign(body: string, timestamp: number, nonce: string, secret = "demo-robot-secret") {
  const message = `${body}:${timestamp}:${nonce}`;
  return createHmac("sha256", secret).update(message).digest("hex");
}

describe("field-bridge robot-report", () => {
  it("accepts a valid HMAC-signed detection report", async () => {
    const app = createApp(new MissionContextStore());
    const body = JSON.stringify({
      type: "detection",
      timestamp: "2026-07-10T06:50:00.000Z",
      robotId: "crawler-01",
      payload: {
        lat: 48.1374,
        lon: 11.5755,
        alt: 0,
        classification: "PERSON",
        confidence: 0.82,
      },
    });
    const timestamp = Date.now();
    const nonce = `crawler-01-${timestamp}`;
    const signature = sign(body, timestamp, nonce);

    const res = await app.request("/api/field-bridge/robot-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Robot-Id": "crawler-01",
        "X-Timestamp": String(timestamp),
        "X-Nonce": nonce,
        "X-Signature": signature,
      },
      body,
    });

    expect(res.status).toBe(202);
    const json = (await res.json()) as { accepted: boolean };
    expect(json.accepted).toBe(true);
  });

  it("rejects a report with a bad signature", async () => {
    const app = createApp(new MissionContextStore());
    const body = JSON.stringify({
      type: "detection",
      timestamp: "2026-07-10T06:50:00.000Z",
      robotId: "crawler-01",
      payload: { lat: 48.1374, lon: 11.5755, alt: 0, classification: "PERSON", confidence: 0.82 },
    });

    const res = await app.request("/api/field-bridge/robot-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Robot-Id": "crawler-01",
        "X-Timestamp": String(Date.now()),
        "X-Nonce": "abc",
        "X-Signature": "bad",
      },
      body,
    });

    expect(res.status).toBe(403);
  });
});
