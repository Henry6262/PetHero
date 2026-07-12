import { z } from "zod";

export const SQUADRON_STATUSES = [
  "operational",
  "degraded",
  "offline",
  "engaging",
  "moving",
  "refitting",
] as const;

export const SQUADRON_TYPES = [
  "infantry",
  "armor",
  "artillery",
  "drone",
  "recon",
  "logistics",
] as const;

export const SQUADRON_AFFILIATIONS = [
  "friendly",
  "hostile",
  "neutral",
  "unknown",
] as const;

export type SquadronStatus = (typeof SQUADRON_STATUSES)[number];
export type SquadronType = (typeof SQUADRON_TYPES)[number];
export type SquadronAffiliation = (typeof SQUADRON_AFFILIATIONS)[number];

export const squadronStatusSchema = z.enum(SQUADRON_STATUSES);
export const squadronTypeSchema = z.enum(SQUADRON_TYPES);
export const squadronAffiliationSchema = z.enum(SQUADRON_AFFILIATIONS);

export const squadronProvenanceSchema = z.object({
  source: z.string(),
  receivedAt: z.string().datetime(),
  confidence: z.number().min(0).max(1),
});

export type SquadronProvenance = z.infer<typeof squadronProvenanceSchema>;

export const squadronSchema = z.object({
  id: z.string(),
  callsign: z.string(),
  type: squadronTypeSchema,
  status: squadronStatusSchema,
  affiliation: squadronAffiliationSchema,
  lat: z.number(),
  lon: z.number(),
  altitude: z.number().default(0),
  heading: z.number(),
  speed: z.number(),
  battery: z.number().min(0).max(100),
  missionId: z.string().optional(),
  updatedAt: z.string().datetime(),
  source: z.string(),
  confidence: z.number().min(0).max(1),
  provenance: z.array(squadronProvenanceSchema),
});

export type Squadron = z.infer<typeof squadronSchema>;

export const squadronUpdateSchema = z.object({
  lat: z.number().optional(),
  lon: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  status: squadronStatusSchema.optional(),
  altitude: z.number().optional(),
  battery: z.number().min(0).max(100).optional(),
});

export type SquadronUpdate = z.infer<typeof squadronUpdateSchema>;

export function squadronCallsign(type: SquadronType, index: number): string {
  return `${type.slice(0, 3).toUpperCase()}-${String(index).padStart(2, "0")}`;
}
