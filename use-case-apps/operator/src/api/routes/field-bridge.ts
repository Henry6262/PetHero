import { Hono } from "hono";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  fieldBridgeReportSchema,
  robotDetectionPayloadSchema,
  robotReportSchema,
  robotStatusPayloadSchema,
} from "../../shared/field-bridge.ts";
import type { MissionContextStore } from "../../core/context-store.ts";
import type { RobotCommander } from "../../core/robot-commander.ts";
import type { FusionSystem } from "./fusion.ts";

/**
 * Parse a legacy NMEA GPGGA sentence and return lat/lon in decimal degrees.
 * Returns null if the sentence is not a valid GPGGA fix.
 */
export function parseGPGGA(sentence: string): { lat: number; lon: number } | null {
  if (!sentence.startsWith("$GPGGA")) return null;
  const parts = sentence.split(",");
  if (parts.length < 5) return null;

  const rawLat = parts[2];
  const latDir = parts[3];
  const rawLon = parts[4];
  const lonDir = parts[5];
  if (!rawLat || !latDir || !rawLon || !lonDir) return null;

  const lat = parseNmeaCoordinate(rawLat, latDir, 2);
  const lon = parseNmeaCoordinate(rawLon, lonDir, 3);
  if (lat === null || lon === null) return null;
  return { lat, lon };
}

function parseNmeaCoordinate(value: string, direction: string, degreesDigits: number): number | null {
  if (value.length <= degreesDigits) return null;
  const degrees = Number(value.slice(0, degreesDigits));
  const minutes = Number(value.slice(degreesDigits));
  if (Number.isNaN(degrees) || Number.isNaN(minutes)) return null;
  const decimal = degrees + minutes / 60;
  if (direction === "S" || direction === "W") return -decimal;
  return decimal;
}

const REPORT_MAX_AGE_MS = 5 * 60 * 1000;

function getRobotSecret(): string {
  return process.env["OPERATOR_ROBOT_SECRET"] ?? "demo-robot-secret";
}

function verifyHmac(
  robotId: string,
  timestampMs: number,
  nonce: string,
  signature: string,
  bodyText: string
): boolean {
  const now = Date.now();
  if (Number.isNaN(timestampMs) || now - timestampMs > REPORT_MAX_AGE_MS) return false;
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  const message = `${bodyText}:${timestampMs}:${nonce}`;
  const expected = createHmac("sha256", getRobotSecret()).update(message).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export function buildFieldBridgeRoutes(
  store: MissionContextStore,
  commander?: RobotCommander,
  fusion?: FusionSystem
) {
  const app = new Hono();

  app.post("/report", async (c) => {
    const body = fieldBridgeReportSchema.parse(await c.req.json());
    const now = new Date().toISOString();

    store.ingestEvent(body.agentId, {
      kind: "detection",
      observedAt: body.observedAt ?? now,
      x: body.lon,
      y: body.lat,
      label: body.kind === "contact" ? "person" : body.kind === "obstacle" ? "obstacle" : "unknown",
      confidence: 0.6,
      payload: { source: "field-bridge", note: body.text },
    });

    return c.json({ accepted: true, receivedAt: now }, 202);
  });

  app.post("/nmea", async (c) => {
    const { sentence, agentId = "field-unit" } = await c.req.json();
    if (typeof sentence !== "string") {
      return c.json({ error: "sentence is required" }, 400);
    }
    const coords = parseGPGGA(sentence);
    if (!coords) {
      return c.json({ error: "Invalid or unsupported NMEA sentence" }, 400);
    }

    const now = new Date().toISOString();
    store.ingestEvent(agentId, {
      kind: "agent_status",
      observedAt: now,
      x: coords.lon,
      y: coords.lat,
      confidence: 0.5,
      payload: { source: "field-bridge-nmea", sentence },
    });

    return c.json({ accepted: true, lat: coords.lat, lon: coords.lon, receivedAt: now }, 202);
  });

  /**
   * HMAC-signed robot adapter report.
   *
   * Headers:
   *   X-Robot-Id, X-Timestamp (ms), X-Nonce, X-Signature (hex)
   *
   * Body: { type: "detection" | "status" | "telemetry", timestamp, robotId, payload }
   */
  app.post("/robot-report", async (c) => {
    const robotId = c.req.header("X-Robot-Id");
    const timestamp = Number(c.req.header("X-Timestamp"));
    const nonce = c.req.header("X-Nonce");
    const signature = c.req.header("X-Signature");
    const bodyText = await c.req.text();

    if (!robotId || !nonce || !signature) {
      return c.json({ error: "Missing authentication headers" }, 401);
    }

    if (!verifyHmac(robotId, timestamp, nonce, signature, bodyText)) {
      return c.json({ error: "Invalid or stale signature" }, 403);
    }

    const report = robotReportSchema.parse(JSON.parse(bodyText));
    const receivedAt = new Date().toISOString();

    if (report.type === "detection" && fusion) {
      const detection = robotDetectionPayloadSchema.parse(report.payload);
      ingestDetectionAsTrack(fusion, robotId, detection, report.timestamp);
    }

    if (commander && (report.type === "status" || report.type === "telemetry")) {
      const status = robotStatusPayloadSchema.parse(report.payload);
      commander.updateAsset(report.robotId, {
        status: status.state as never,
        currentWaypointId: status.currentWaypointId,
        batteryPct: status.batteryPct,
        lat: status.lat,
        lon: status.lon,
      });
    }

    return c.json({ accepted: true, receivedAt, type: report.type }, 202);
  });

  return app;
}

function ingestDetectionAsTrack(
  fusion: FusionSystem,
  robotId: string,
  detection: {
    lat: number;
    lon: number;
    alt: number;
    classification: import("../../shared/track.ts").TrackClassification;
    confidence: number;
    imageUrl?: string;
  },
  timestamp: string
) {
  fusion.engine.processFeeds({
    source: {
      id: robotId,
      name: `${robotId} camera`,
      type: "camera",
      reliability: detection.confidence,
      nominalUncertaintyM: 30,
      updateIntervalS: 2,
    },
    tracks: [
      {
        id: `${robotId}-det-${Date.now()}`,
        sourceId: robotId,
        lat: detection.lat,
        lon: detection.lon,
        altitude: detection.alt,
        timestamp,
        reliability: detection.confidence,
        uncertaintyRadiusM: 30,
        covariance: { ee: 900, en: 0, ne: 0, nn: 900 },
        isPlot: false,
        classification: detection.classification,
      },
    ],
  });
}
