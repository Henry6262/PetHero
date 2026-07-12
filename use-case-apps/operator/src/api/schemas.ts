import { z } from "zod";

export {
  squadronAffiliationSchema,
  squadronProvenanceSchema,
  squadronSchema,
  squadronStatusSchema,
  squadronTypeSchema,
  squadronUpdateSchema,
} from "../shared/squadron.ts";

export const eventSchema = z.object({
  kind: z.enum(["map_cell", "detection", "change", "agent_status", "link_status"]),
  cellId: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  label: z
    .enum(["person", "vehicle", "obstacle", "open_door", "closed_door", "signal_loss", "unknown"])
    .optional(),
  confidence: z.number().min(0).max(1).optional(),
  observedAt: z.string().datetime().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const dockCheckInSchema = z.object({
  agentId: z.string().min(1),
  trustToken: z.string().optional(),
  kind: z.enum(["ground", "aerial", "dock", "operator", "simulated"]).optional(),
  batteryPct: z.number().min(0).max(100).optional(),
  localRevision: z.number().int().nonnegative().optional(),
  deltas: z.array(eventSchema).default([]),
});

export const playbookSchema = z.object({
  intent: z.enum([
    "area_scan",
    "perimeter_watch",
    "building_approach",
    "lost_link_recovery",
    "recheck_stale_zones",
    "relay_chain",
  ]),
  targetCells: z.array(z.string()).optional(),
});
