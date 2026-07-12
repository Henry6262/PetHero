import type {
  AdvisorRecommendation,
  AdvisorSource,
  FusedTrack,
  TheaterMission,
  Asset,
} from "../shared/index.ts";
import type { AutonomousAdvisor, AdvisorSnapshot } from "./autonomous-advisor.ts";

export interface LLMAdvisorOptions {
  ollamaHost?: string;
  primaryModel?: string;
  fallbackModel?: string;
  timeoutMs?: number;
}

interface LLMResponse {
  decision: string;
  confidence: number;
  reason: string;
  requiresHumanConfirmation: boolean;
  context?: string;
}

const DISALLOWED_WORDS = [
  "kill",
  "attack",
  "strike",
  "weapon",
  "lethal",
  "destroy",
  "engage",
  "fire",
  "shoot",
  "bomb",
];

/**
 * Local-LLM advisor wrapper around Ollama.
 *
 * The LLM is asked to narrate and validate the hard-rules advisor's
 * recommendation. If Ollama is unreachable, the response is malformed, or the
 * output violates safety rules, the hard-rules recommendation is returned
 * unchanged.
 */
export class LLMAdvisor {
  private ollamaHost: string;
  private primaryModel: string;
  private fallbackModel: string;
  private timeoutMs: number;

  constructor(private hardAdvisor: AutonomousAdvisor, options: LLMAdvisorOptions = {}) {
    this.ollamaHost = options.ollamaHost ?? process.env["OLLAMA_HOST"] ?? "http://localhost:11434";
    this.primaryModel = options.primaryModel ?? process.env["OLLAMA_MODEL"] ?? "qwen3:8b";
    this.fallbackModel = options.fallbackModel ?? process.env["OLLAMA_FALLBACK_MODEL"] ?? "qwen3:4b";
    this.timeoutMs = options.timeoutMs ?? 4000;
  }

  /**
   * Get the hard-rules recommendation first, then ask the LLM to review it.
   * The LLM may agree, disagree, or add nuance, but it cannot recommend
   * offensive/strike actions.
   */
  async advise(snapshot: AdvisorSnapshot): Promise<AdvisorRecommendation> {
    // Use peek so the read-only LLM brief does not pollute the mission reasoning log.
    const hard = this.hardAdvisor.peek(snapshot);

    let llm: LLMResponse | null = null;
    for (const model of [this.primaryModel, this.fallbackModel]) {
      try {
        llm = await this.callOllama(snapshot, hard, model);
        if (llm) break;
      } catch {
        // Try fallback; if that also fails, return hard recommendation.
      }
    }

    if (!llm || !this.isSafe(llm)) {
      return { ...hard, source: "advisor" as AdvisorSource };
    }

    const timestamp = new Date().toISOString();
    const recommendation: AdvisorRecommendation = {
      id: `rec_${Date.now()}_llm`,
      timestamp,
      decision: this.normalizeDecision(llm.decision) ?? hard.decision,
      confidence: clamp(llm.confidence, 0, 1),
      reason: llm.reason || hard.reason,
      source: "llm",
      trackIds: hard.trackIds,
      assetIds: hard.assetIds,
      requiresHumanConfirmation:
        llm.requiresHumanConfirmation ?? hard.requiresHumanConfirmation,
      context: llm.context ?? hard.context,
    };

    return recommendation;
  }

  private async callOllama(
    snapshot: AdvisorSnapshot,
    hard: AdvisorRecommendation,
    model: string
  ): Promise<LLMResponse | null> {
    const prompt = buildPrompt(snapshot, hard);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.ollamaHost}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: "json",
          options: { temperature: 0.2, num_predict: 400 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return null;

      const data = (await res.json()) as { response?: string };
      const text = data.response?.trim();
      if (!text) return null;

      // Ollama may return markdown fences even with format=json.
      const json = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      const parsed = JSON.parse(json) as Partial<LLMResponse>;
      if (!parsed.decision || typeof parsed.confidence !== "number") return null;
      return {
        decision: String(parsed.decision),
        confidence: clamp(parsed.confidence, 0, 1),
        reason: String(parsed.reason ?? ""),
        requiresHumanConfirmation: Boolean(parsed.requiresHumanConfirmation),
        context: parsed.context ? String(parsed.context) : undefined,
      };
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }

  private normalizeDecision(decision: string): AdvisorRecommendation["decision"] | null {
    const allowed = ["continue", "dispatch_scout", "hold_payload", "reroute", "request_human_decision"] as const;
    const normalized = decision.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
    if (allowed.includes(normalized as AdvisorRecommendation["decision"])) {
      return normalized as AdvisorRecommendation["decision"];
    }
    return null;
  }

  private isSafe(response: LLMResponse): boolean {
    const text = `${response.decision} ${response.reason} ${response.context ?? ""}`.toLowerCase();
    return !DISALLOWED_WORDS.some((word) => text.includes(word));
  }
}

function buildPrompt(snapshot: AdvisorSnapshot, hard: AdvisorRecommendation): string {
  const mission = snapshot.mission;
  const payload = mission.payload;
  const tracks = snapshot.fusedTracks.map(summarizeTrack);
  const assets = snapshot.assets.map(summarizeAsset);

  return `You are a defensive ISR mission advisor for a robot C2 system called Operator.
Your job is to review a hard-rules recommendation and produce a concise, safe recommendation.
Rules:
- This is defensive ISR only. Never recommend attack, strike, weapon release, or lethal action.
- Allowed decisions: continue, dispatch_scout, hold_payload, reroute, request_human_decision.
- Confidence is 0.0 to 1.0.
- requiresHumanConfirmation is true only when the decision is critical (confirmed threat near the payload).

Mission: "${mission.name}"
Type: ${mission.type}
Payload: ${payload ? `${payload.label} (${payload.status})` : "none"}
Policy: confirm=${mission.autonomyPolicy?.confirmConfidence}, scout=${mission.autonomyPolicy?.scoutDispatchConfidence}, corridor=${mission.autonomyPolicy?.corridorWidthM}m

Fused tracks:
${JSON.stringify(tracks, null, 2)}

Assets:
${JSON.stringify(assets, null, 2)}

Hard-rules recommendation:
${JSON.stringify(
  {
    decision: hard.decision,
    confidence: hard.confidence,
    reason: hard.reason,
    requiresHumanConfirmation: hard.requiresHumanConfirmation,
  },
  null,
  2
)}

Return only JSON with keys: decision, confidence, reason, requiresHumanConfirmation, context.`;
}

function summarizeTrack(t: FusedTrack) {
  return {
    id: t.id,
    classification: t.classification,
    confidence: t.confidence,
    lat: Number(t.lat.toFixed(6)),
    lon: Number(t.lon.toFixed(6)),
    corroborationCount: t.corroborationCount,
    assessment: t.assessment,
  };
}

function summarizeAsset(a: Asset) {
  return {
    id: a.id,
    name: a.name,
    role: a.role,
    status: a.status,
    batteryPct: a.batteryPct,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
