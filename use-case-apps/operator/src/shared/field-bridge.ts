import { z } from "zod";
import { trackClassificationSchema } from "./track.ts";

export const fieldBridgeReportKindSchema = z.enum([
  "contact",
  "obstacle",
  "status",
  "unknown",
]);

export type FieldBridgeReportKind = z.infer<typeof fieldBridgeReportKindSchema>;

export const fieldBridgeReportSchema = z.object({
  agentId: z.string().min(1),
  kind: fieldBridgeReportKindSchema,
  text: z.string().max(500).optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  // ISO timestamp; if omitted, server uses receipt time.
  observedAt: z.string().datetime().optional(),
});

export type FieldBridgeReport = z.infer<typeof fieldBridgeReportSchema>;

/**
 * Robot adapter report sent from physical assets.
 *
 * Reports are HMAC-signed by the adapter using OPERATOR_ROBOT_SECRET.
 */
export const robotReportSchema = z.object({
  type: z.enum(["detection", "status", "telemetry"]),
  timestamp: z.string().datetime(),
  robotId: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export type RobotReport = z.infer<typeof robotReportSchema>;

/**
 * Detection payload inside a robot report.
 */
export const robotDetectionPayloadSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  alt: z.number().default(0),
  classification: trackClassificationSchema,
  confidence: z.number().min(0).max(1),
  imageUrl: z.string().optional(),
});

export type RobotDetectionPayload = z.infer<typeof robotDetectionPayloadSchema>;

/**
 * Status / telemetry payload inside a robot report.
 */
export const robotStatusPayloadSchema = z.object({
  state: z.string().optional(),
  currentWaypointId: z.string().optional(),
  batteryPct: z.number().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

export type RobotStatusPayload = z.infer<typeof robotStatusPayloadSchema>;
