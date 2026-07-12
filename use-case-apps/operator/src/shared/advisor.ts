import { z } from "zod";

export const ADVISOR_DECISIONS = [
  "continue",
  "dispatch_scout",
  "hold_payload",
  "reroute",
  "request_human_decision",
] as const;

export type AdvisorDecision = (typeof ADVISOR_DECISIONS)[number];
export const advisorDecisionSchema = z.enum(ADVISOR_DECISIONS);

export const REASONING_LEVELS = ["info", "warn", "critical"] as const;
export type ReasoningLevel = (typeof REASONING_LEVELS)[number];
export const reasoningLevelSchema = z.enum(REASONING_LEVELS);

export const ADVISOR_SOURCES = ["advisor", "llm", "operator"] as const;
export type AdvisorSource = (typeof ADVISOR_SOURCES)[number];
export const advisorSourceSchema = z.enum(ADVISOR_SOURCES);

/**
 * A single recommendation produced by the autonomous advisor.
 *
 * The recommendation may be auto-executed (e.g. dispatch_scout) or may require
 * human confirmation (request_human_decision) depending on the mission's
 * autonomy policy and the confidence of the underlying tracks.
 */
export interface AdvisorRecommendation {
  id: string;
  timestamp: string;
  decision: AdvisorDecision;
  confidence: number;
  reason: string;
  source: AdvisorSource;
  /** Track ids that triggered this recommendation, if any. */
  trackIds?: string[];
  /** Asset ids that should act on this recommendation, if any. */
  assetIds?: string[];
  requiresHumanConfirmation: boolean;
  /** True if the recommendation has already been acted on. */
  executed?: boolean;
  /** Human-readable context for the operator. */
  context?: string;
}

export const advisorRecommendationSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  decision: advisorDecisionSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  source: advisorSourceSchema,
  trackIds: z.array(z.string()).optional(),
  assetIds: z.array(z.string()).optional(),
  requiresHumanConfirmation: z.boolean(),
  executed: z.boolean().optional(),
  context: z.string().optional(),
});

/**
 * One entry in the mission reasoning log.
 */
export interface ReasoningLogEntry {
  id: string;
  timestamp: string;
  level: ReasoningLevel;
  message: string;
  source: AdvisorSource;
  /** Link to the recommendation that produced this entry. */
  recommendationId?: string;
}

export const reasoningLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  level: reasoningLevelSchema,
  message: z.string(),
  source: advisorSourceSchema,
  recommendationId: z.string().optional(),
});

/**
 * Human operator response to a pending advisor recommendation.
 */
export interface HumanDecision {
  decisionId: string;
  approved: boolean;
  note?: string;
}

export const humanDecisionSchema = z.object({
  decisionId: z.string(),
  approved: z.boolean(),
  note: z.string().optional(),
});
