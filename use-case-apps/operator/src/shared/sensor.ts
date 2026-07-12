import { z } from "zod";
import { sensorTrackSchema } from "./track.ts";

export const sensorSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["radar", "eo", "ir", "ais", "adsb", "manual", "camera", "simulated"]),
  // 0–1 reliability score; used by the fusion engine as a weight.
  reliability: z.number().min(0).max(1),
  // Typical position uncertainty in meters.
  nominalUncertaintyM: z.number().positive(),
  // Update interval in seconds.
  updateIntervalS: z.number().positive(),
});

export type SensorSource = z.infer<typeof sensorSourceSchema>;

export const sensorFeedSchema = z.object({
  source: sensorSourceSchema,
  tracks: z.array(sensorTrackSchema),
});

export type SensorFeed = z.infer<typeof sensorFeedSchema>;
