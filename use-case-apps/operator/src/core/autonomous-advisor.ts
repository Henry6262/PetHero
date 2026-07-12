import type {
  AdvisorDecision,
  AdvisorRecommendation,
  Asset,
  AssetRole,
  AutonomyPolicy,
  FusedTrack,
  MissionZone,
  ReasoningLogEntry,
  TheaterMission,
} from "../shared/index.ts";
import { metersPerDegreeLat, metersPerDegreeLon } from "../shared/geo.ts";

export interface AdvisorSnapshot {
  mission: TheaterMission;
  assets: Asset[];
  fusedTracks: FusedTrack[];
}

export interface AutonomousAdvisorOptions {
  /** Minimum time between repeated recommendations for the same track (ms). */
  cooldownMs?: number;
  /** Maximum reasoning log entries to retain. */
  maxLogEntries?: number;
}

/**
 * Hard-rules autonomous advisor for defensive ISR missions.
 *
 * Evaluates fused tracks against the mission route, zones, and autonomy policy,
 * then recommends either automatic action or human escalation. It never
 * recommends offensive/strike actions.
 */
export class AutonomousAdvisor {
  private log: ReasoningLogEntry[] = [];
  private cooldownMs: number;
  private maxLogEntries: number;
  /** Tracks the last time a dispatch/hold was recommended for a given track id. */
  private lastActionByTrack = new Map<string, number>();

  constructor(options: AutonomousAdvisorOptions = {}) {
    this.cooldownMs = options.cooldownMs ?? 10_000;
    this.maxLogEntries = options.maxLogEntries ?? 100;
  }

  getLog(): ReasoningLogEntry[] {
    return [...this.log];
  }

  clearLog() {
    this.log = [];
  }

  /**
   * Produce a recommendation without writing to the reasoning log.
   * Useful for read-only UI polls.
   */
  peek(snapshot: AdvisorSnapshot): AdvisorRecommendation {
    return this.produceRecommendation(snapshot);
  }

  evaluate(snapshot: AdvisorSnapshot): AdvisorRecommendation {
    const rec = this.produceRecommendation(snapshot);
    this.appendAdvisorLog(rec);
    return rec;
  }

  private appendAdvisorLog(rec: AdvisorRecommendation) {
    const level: ReasoningLogEntry["level"] =
      rec.decision === "request_human_decision"
        ? "critical"
        : rec.decision === "continue"
        ? "info"
        : "warn";
    this.pushLog({
      id: this.nextLogId(),
      timestamp: rec.timestamp,
      level,
      message: rec.reason,
      source: rec.source,
      recommendationId: rec.id,
    });
  }

  private produceRecommendation(snapshot: AdvisorSnapshot): AdvisorRecommendation {
    const { mission, assets, fusedTracks } = snapshot;
    const policy = mission.autonomyPolicy ?? defaultPolicy();
    const now = Date.now();
    const timestamp = new Date().toISOString();

    const route = mission.route ?? [];
    const zones = mission.zones ?? [];
    const noGoZones = zones.filter((z) => z.type === "no_go_area");
    const corridorWidthM = policy.corridorWidthM;
    const confirmConfidence = policy.confirmConfidence;
    const scoutConfidence = policy.scoutDispatchConfidence;

    // Score every track relative to the mission geometry.
    const trackEvals = fusedTracks.map((track) => {
      const inNoGo = noGoZones.some((z) => pointInPolygon(track.lat, track.lon, z.ring));
      const distanceToRouteM =
        route.length > 1 ? distanceToRouteMeters(track.lat, track.lon, route) : Number.POSITIVE_INFINITY;
      const inCorridor = distanceToRouteM <= corridorWidthM;
      return { track, inNoGo, inCorridor, distanceToRouteM };
    });

    // Highest-confidence threat first.
    const threats = trackEvals
      .filter((e) => e.inNoGo || e.inCorridor)
      .sort((a, b) => b.track.confidence - a.track.confidence);

    if (threats.length === 0) {
      return this.recommendation("continue", 1, "No tracks inside corridor or no-go zones. Continue mission.", timestamp);
    }

    const top = threats[0];
    const { track, inNoGo, inCorridor, distanceToRouteM } = top;
    const where = inNoGo ? "no-go zone" : inCorridor ? `corridor (${Math.round(distanceToRouteM)} m)` : "vicinity";
    const classification = track.classification ?? "UNKNOWN";

    // Critical threshold: confirmed contact near the payload route → human review.
    if (track.confidence >= confirmConfidence) {
      const reason = `Confirmed ${classification} contact in ${where}. Confidence ${Math.round(
        track.confidence * 100
      )}% exceeds ${Math.round(confirmConfidence * 100)}% threshold. Human review required.`;
      return this.recommendation(
        "request_human_decision",
        track.confidence,
        reason,
        timestamp,
        [track.id],
        undefined,
        true,
        `Recommend pause payload and decide on reroute around ${classification} contact.`
      );
    }

    // Scout threshold: uncertain contact → dispatch nearest scout autonomously.
    if (track.confidence >= scoutConfidence && !this.isOnCooldown(track.id, now)) {
      const scout = this.findAvailableAsset(assets, "scout");
      if (scout) {
        const reason = `Uncertain ${classification} contact in ${where}. Confidence ${Math.round(
          track.confidence * 100
        )}% is between scout (${Math.round(scoutConfidence * 100)}%) and confirm (${Math.round(
          confirmConfidence * 100
        )}%) thresholds. Dispatching scout ${scout.id}.`;
        return this.recommendation(
          "dispatch_scout",
          track.confidence,
          reason,
          timestamp,
          [track.id],
          [scout.id],
          false,
          `Scout ${scout.name} will move to the contact to improve confidence.`
        );
      }
      const reason = `Uncertain ${classification} contact in ${where}, but no scout is available.`;
      return this.recommendation(
        "hold_payload",
        track.confidence,
        reason,
        timestamp,
        [track.id],
        mission.assignedAssetIds,
        false,
        "Holding payload until a scout can be dispatched."
      );
    }

    // Below scout threshold: just keep monitoring.
    const reason = `${classification} contact in ${where} at ${Math.round(
      track.confidence * 100
    )}% confidence is below the scout threshold. Monitoring.`;
    return this.recommendation("continue", track.confidence, reason, timestamp, [track.id]);
  }

  private isOnCooldown(trackId: string, now: number): boolean {
    const last = this.lastActionByTrack.get(trackId);
    return last !== undefined && now - last < this.cooldownMs;
  }

  private findAvailableAsset(assets: Asset[], role: AssetRole): Asset | undefined {
    return assets.find((a) => a.role === role && (a.status === "idle" || a.status === "moving"));
  }

  private recommendation(
    decision: AdvisorDecision,
    confidence: number,
    reason: string,
    timestamp: string,
    trackIds?: string[],
    assetIds?: string[],
    requiresHumanConfirmation = false,
    context?: string,
    source: "advisor" | "llm" = "advisor"
  ): AdvisorRecommendation {
    const rec: AdvisorRecommendation = {
      id: `rec_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      timestamp,
      decision,
      confidence,
      reason,
      source,
      trackIds,
      assetIds,
      requiresHumanConfirmation,
      context,
    };
    return rec;
  }

  private info(timestamp: string, message: string, source: "advisor" | "llm" = "advisor") {
    this.pushLog({ id: this.nextLogId(), timestamp, level: "info", message, source });
  }

  private warn(timestamp: string, message: string, source: "advisor" | "llm" = "advisor") {
    this.pushLog({ id: this.nextLogId(), timestamp, level: "warn", message, source });
  }

  private pushLog(entry: ReasoningLogEntry) {
    this.log.push(entry);
    if (this.log.length > this.maxLogEntries) {
      this.log = this.log.slice(-this.maxLogEntries);
    }
  }

  private nextLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  }
}

function defaultPolicy(): AutonomyPolicy {
  return {
    confirmConfidence: 0.75,
    scoutDispatchConfidence: 0.65,
    corridorWidthM: 2,
    llmAutoApprove: false,
  };
}

function pointInPolygon(lat: number, lon: number, ring: [number, number][]): boolean {
  // Ray-casting algorithm. ring is [lon, lat] GeoJSON ring, closed.
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distanceToRouteMeters(
  lat: number,
  lon: number,
  route: { lat: number; lon: number }[]
): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const d = distanceToSegmentMeters(lat, lon, a.lat, a.lon, b.lat, b.lon);
    if (d < best) best = d;
  }
  return best;
}

function distanceToSegmentMeters(
  lat: number,
  lon: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const refLat = lat;
  const x = lon * metersPerDegreeLon(refLat);
  const y = lat * metersPerDegreeLat(refLat);
  const x1 = lon1 * metersPerDegreeLon(refLat);
  const y1 = lat1 * metersPerDegreeLat(refLat);
  const x2 = lon2 * metersPerDegreeLon(refLat);
  const y2 = lat2 * metersPerDegreeLat(refLat);

  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(x - projX, y - projY);
}
