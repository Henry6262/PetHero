import type {
  AdvisorRecommendation,
  Asset,
  FusedTrack,
  MissionPayload,
  ReasoningLogEntry,
  RouteWaypoint,
  SensorFeed,
  SensorSource,
  SensorTrack,
  TheaterMission,
  TheaterOperation,
} from "../shared/index.ts";
import type { FusionSystem } from "../api/routes/fusion.ts";
import type { AutonomousAdvisor, AdvisorSnapshot } from "./autonomous-advisor.ts";
import type { RobotCommander } from "./robot-commander.ts";

export type MissionEngineState = "idle" | "running" | "paused" | "complete";

export interface RunningMission {
  operation: TheaterOperation;
  mission: TheaterMission;
  state: MissionEngineState;
  elapsedMs: number;
  tickCount: number;
  pendingDecision?: AdvisorRecommendation | null;
  reasoningLog: ReasoningLogEntry[];
}

interface MissionEngineDependencies {
  commander?: RobotCommander;
  advisor?: AutonomousAdvisor;
  fusion?: FusionSystem;
}

/**
 * Lightweight mission runner for the payload-escort demo.
 *
 * Holds the active operation/mission, advances the payload along its route,
 * evaluates fused tracks with the autonomous advisor, and only escalates
 * critical decisions to a human operator.
 */
export class MissionEngine {
  private running: RunningMission | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private tickRateMs = 1000;
  private commander?: RobotCommander;
  private advisor?: AutonomousAdvisor;
  private fusion?: FusionSystem;

  constructor(deps: MissionEngineDependencies = {}) {
    this.commander = deps.commander;
    this.advisor = deps.advisor;
    this.fusion = deps.fusion;
  }

  start(operation: TheaterOperation, missionId: string): RunningMission | null {
    const mission = operation.missions.find((m) => m.id === missionId);
    if (!mission) return null;

    this.stop();
    this.running = {
      operation,
      mission,
      state: "running",
      elapsedMs: 0,
      tickCount: 0,
      pendingDecision: null,
      reasoningLog: [],
    };

    this.interval = setInterval(() => this.tick(), this.tickRateMs);
    return this.running;
  }

  pause() {
    if (!this.running) return;
    this.running.state = "paused";
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  resume() {
    if (!this.running || this.running.state !== "paused") return;
    this.running.state = "running";
    this.interval = setInterval(() => this.tick(), this.tickRateMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.running = null;
  }

  reset(operation: TheaterOperation, missionId: string) {
    this.stop();
    return this.start(operation, missionId);
  }

  getState(): RunningMission | null {
    return this.running;
  }

  /**
   * Apply a human operator decision to a pending recommendation.
   * Approved critical decisions resume the mission; rejected ones are discarded.
   */
  applyHumanDecision(decisionId: string, approved: boolean, note?: string): RunningMission | null {
    if (!this.running) return null;
    const pending = this.running.pendingDecision;
    if (!pending || pending.id !== decisionId) return this.running;

    const timestamp = new Date().toISOString();
    if (approved) {
      this.logReasoning({
        id: this.nextLogId(),
        timestamp,
        level: "info",
        message: `Operator approved ${pending.decision}. ${note ?? ""}`,
        source: "operator",
        recommendationId: pending.id,
      });
      // Clear hold on payload if it was stopped.
      if (this.running.mission.payload && this.running.mission.payload.status === "stopped") {
        this.running.mission.payload.status = "in_transit";
      }
    } else {
      this.logReasoning({
        id: this.nextLogId(),
        timestamp,
        level: "warn",
        message: `Operator rejected ${pending.decision}. ${note ?? ""}`,
        source: "operator",
        recommendationId: pending.id,
      });
    }

    this.running.pendingDecision = null;
    this.resume();
    return this.running;
  }

  /**
   * Inject a synthetic contact near the given lat/lon for demo purposes.
   * The contact is observed by the carrier camera and a simulated corroborating
   * sensor, then fed into the fusion engine.
   */
  injectContact(lat: number, lon: number, classification = "PERSON", confidence = 0.72): FusedTrack[] {
    if (!this.fusion) return [];

    const carrierId = this.running?.mission.payload?.carrierAssetId ?? "crawler-01";
    const now = new Date().toISOString();
    // Scale sensor quality by the requested confidence so tests/demo can force
    // scout-dispatch or human-escalation thresholds easily.
    const reliability = 0.5 + confidence * 0.5;
    const uncertaintyM = Math.max(5, Math.round((1 - confidence) * 100));
    const variance = uncertaintyM * uncertaintyM;

    const cameraTrack: SensorTrack = {
      id: `${carrierId}-cam-${Date.now()}`,
      sourceId: carrierId,
      lat: lat + 0.00001,
      lon: lon + 0.00001,
      altitude: 0,
      timestamp: now,
      reliability,
      uncertaintyRadiusM: uncertaintyM,
      covariance: { ee: variance, en: 0, ne: 0, nn: variance },
      isPlot: false,
      classification: classification as SensorTrack["classification"],
    };

    const corroboratingTrack: SensorTrack = {
      id: `sim-corroboration-${Date.now()}`,
      sourceId: "SIM-CORR-1",
      lat: lat - 0.00002,
      lon: lon - 0.000005,
      altitude: 0,
      timestamp: now,
      reliability: reliability * 0.95,
      uncertaintyRadiusM: uncertaintyM * 1.5,
      covariance: { ee: variance * 2.25, en: 0, ne: 0, nn: variance * 2.25 },
      isPlot: false,
      classification: classification as SensorTrack["classification"],
    };

    const feeds: SensorFeed[] = [
      {
        source: {
          id: carrierId,
          name: `${carrierId} camera`,
          type: "camera",
          reliability: 0.8,
          nominalUncertaintyM: 40,
          updateIntervalS: 2,
        },
        tracks: [cameraTrack],
      },
      {
        source: {
          id: "SIM-CORR-1",
          name: "Simulated corroborating sensor",
          type: "simulated",
          reliability: 0.75,
          nominalUncertaintyM: 60,
          updateIntervalS: 2,
        },
        tracks: [corroboratingTrack],
      },
    ];

    this.fusion.simulator.tick();
    return this.fusion.engine.processFeeds(...feeds);
  }

  private tick() {
    if (!this.running || this.running.state !== "running") return;

    // Wait for operator input on critical decisions.
    if (this.running.pendingDecision) return;

    this.running.elapsedMs += this.tickRateMs;
    this.running.tickCount += 1;

    this.commander?.tickSimulatedAssets();

    const mission = this.running.mission;
    if (mission.payload && mission.route && mission.route.length > 1) {
      this.advancePayload(mission.payload, mission.route);
      this.syncCarrierAsset(mission.payload, mission.route);
    }

    if (this.advisor && this.commander && this.fusion) {
      this.evaluateAndAct(mission);
    }
  }

  private evaluateAndAct(mission: TheaterMission) {
    // Advance the synthetic sensor picture so recommendations react to new data.
    this.fusion!.simulator.tick();
    const feeds = this.fusion!.simulator.generateFeeds();
    this.fusion!.engine.processFeeds(...feeds);

    const snapshot: AdvisorSnapshot = {
      mission,
      assets: this.commander!.getAssets(),
      fusedTracks: this.fusion!.engine.getFusedTracks(),
    };

    const rec = this.advisor!.evaluate(snapshot);
    this.appendAdvisorLog(rec);

    if (rec.requiresHumanConfirmation) {
      this.running!.pendingDecision = rec;
      this.pause();
      this.logReasoning({
        id: this.nextLogId(),
        timestamp: rec.timestamp,
        level: "critical",
        message: `Critical: ${rec.reason}`,
        source: rec.source,
        recommendationId: rec.id,
      });
      return;
    }

    switch (rec.decision) {
      case "dispatch_scout":
        this.dispatchScout(rec);
        break;
      case "hold_payload":
        this.holdPayload();
        break;
      case "reroute":
        // Reroute is treated as critical; if it ever comes back non-critical,
        // hold payload until a human reviews.
        this.holdPayload();
        break;
      case "continue":
      default:
        break;
    }
  }

  private dispatchScout(rec: AdvisorRecommendation) {
    if (!this.commander) return;
    const scoutId = rec.assetIds?.find((id) => this.commander!.getAsset(id)?.role === "scout");
    const scout = scoutId ? this.commander.getAsset(scoutId) : this.findAssetByRole("scout");
    if (!scout || scout.status !== "idle") return;

    // Determine contact location from the first referenced track, or default ahead of route.
    let targetLat = scout.lat;
    let targetLon = scout.lon;
    const fused = this.fusion?.engine.getFusedTracks();
    const track = fused?.find((t) => rec.trackIds?.includes(t.id));
    if (track) {
      targetLat = track.lat;
      targetLon = track.lon;
    }

    const waypointId = `contact-${rec.id}`;
    this.commander.registerWaypoints({ id: waypointId, lat: targetLat, lon: targetLon });
    void this.commander.sendCommand(scout.id, { command: "move_to_waypoint", waypointId });
  }

  private holdPayload() {
    const carrierId = this.running?.mission.payload?.carrierAssetId;
    if (!carrierId || !this.commander) return;
    const carrier = this.commander.getAsset(carrierId);
    if (carrier && carrier.status === "moving") {
      void this.commander.sendCommand(carrierId, { command: "stop" });
    }
    if (this.running?.mission.payload) {
      this.running.mission.payload.status = "stopped";
    }
  }

  private syncCarrierAsset(payload: MissionPayload, route: RouteWaypoint[]) {
    if (!this.commander) return;
    const wp = route[payload.currentWaypointIndex];
    if (!wp) return;
    this.commander.updateAsset(payload.carrierAssetId, {
      lat: wp.lat,
      lon: wp.lon,
      status: payload.status === "in_transit" ? "moving" : payload.status === "stopped" ? "busy" : "idle",
      currentWaypointId: wp.id,
    });
  }

  private advancePayload(payload: MissionPayload, route: RouteWaypoint[]) {
    if (payload.status === "delivered" || payload.status === "compromised") return;

    // Move one waypoint every 5 ticks (~5 seconds).
    const waypointIndex = Math.min(Math.floor(this.running!.tickCount / 5), route.length - 1);

    if (waypointIndex !== payload.currentWaypointIndex) {
      payload.currentWaypointIndex = waypointIndex;
      if (payload.currentWaypointIndex >= route.length - 1) {
        payload.status = "delivered";
      } else if (payload.status !== "stopped") {
        payload.status = "in_transit";
      }
    }
  }

  private appendAdvisorLog(rec: AdvisorRecommendation) {
    const level: ReasoningLogEntry["level"] =
      rec.decision === "request_human_decision"
        ? "critical"
        : rec.decision === "continue"
        ? "info"
        : "warn";
    this.logReasoning({
      id: this.nextLogId(),
      timestamp: rec.timestamp,
      level,
      message: rec.reason,
      source: rec.source,
      recommendationId: rec.id,
    });
  }

  private logReasoning(entry: ReasoningLogEntry) {
    if (!this.running) return;
    this.running.reasoningLog.push(entry);
    if (this.running.reasoningLog.length > 100) {
      this.running.reasoningLog = this.running.reasoningLog.slice(-100);
    }
  }

  private findAssetByRole(role: Asset["role"]): Asset | undefined {
    return this.commander?.getAssets().find((a) => a.role === role);
  }

  private nextLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  }

  /** Exposed for tests and deterministic stepping. */
  stepTick() {
    this.tick();
  }
}
