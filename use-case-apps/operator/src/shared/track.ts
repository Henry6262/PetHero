import { z } from "zod";

export const covariance2dSchema = z.object({
  ee: z.number(),
  en: z.number(),
  ne: z.number(),
  nn: z.number(),
});

export type Covariance2D = z.infer<typeof covariance2dSchema>;

export const velocityEnuSchema = z.object({
  east: z.number().default(0),
  north: z.number().default(0),
  up: z.number().default(0),
});

export type VelocityENU = z.infer<typeof velocityEnuSchema>;

export const TRACK_CLASSIFICATIONS = [
  "UNKNOWN",
  "PERSON",
  "VEHICLE",
  "UAV",
  "AIRCRAFT",
  "VESSEL",
  "ANIMAL",
  "OBJECT",
] as const;

export const trackClassificationSchema = z.enum(TRACK_CLASSIFICATIONS);
export type TrackClassification = z.infer<typeof trackClassificationSchema>;

export const sensorTrackSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  lat: z.number(),
  lon: z.number(),
  altitude: z.number().default(0),
  heading: z.number().optional(),
  speed: z.number().optional(),
  velocityEnu: velocityEnuSchema.optional(),
  timestamp: z.string().datetime(),
  // 0–1; higher is better. Allows the fusion engine to weight sources differently.
  reliability: z.number().min(0).max(1).default(0.5),
  // Estimated position uncertainty in meters.
  uncertaintyRadiusM: z.number().nonnegative().default(100),
  // 2x2 position covariance in ENU (meters^2). Takes precedence over uncertaintyRadiusM when present.
  covariance: covariance2dSchema.optional(),
  // True if the sensor only emits a raw plot (no continuous track id).
  isPlot: z.boolean().default(false),
  classification: trackClassificationSchema.default("UNKNOWN"),
  detectionMode: z.string().optional(),
});

export type SensorTrack = z.infer<typeof sensorTrackSchema>;

export const fusedTrackSchema = z.object({
  id: z.string(),
  lat: z.number(),
  lon: z.number(),
  altitude: z.number().default(0),
  heading: z.number().optional(),
  speed: z.number().optional(),
  velocityEnu: velocityEnuSchema.optional(),
  updatedAt: z.string().datetime(),
  // 0–1 composite confidence based on source reliability and agreement.
  confidence: z.number().min(0).max(1),
  // Sources that contributed to this fused track.
  sourceIds: z.array(z.string()),
  // Per-source track ids that were associated.
  sourceTrackIds: z.array(z.string()),
  // Human-readable reason for the current confidence score.
  assessment: z.string(),
  // 2x2 fused position covariance in ENU.
  covariance: covariance2dSchema,
  classification: trackClassificationSchema.default("UNKNOWN"),
  // Number of unique sources that corroborated this track.
  corroborationCount: z.number().int().nonnegative().default(1),
});

export type FusedTrack = z.infer<typeof fusedTrackSchema>;
