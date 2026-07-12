import type { Squadron, TheaterMission } from "../shared/index.ts";
import type { FusionSystem } from "../api/routes/fusion.ts";
import type { MissionEngine } from "./mission-engine.ts";
import type { RobotCommander } from "./robot-commander.ts";
import type { SquadronSimulator } from "./squadron-simulator.ts";
import type { RoomClearanceEngine } from "./room-clearance-engine.ts";

export interface VoiceAgentDependencies {
  missionEngine: MissionEngine;
  commander: RobotCommander;
  fusion: FusionSystem;
  simulator: SquadronSimulator;
  roomClearance?: RoomClearanceEngine;
}

export interface VoiceQueryResult {
  response: string;
  action?:
    | "dispatch_scout"
    | "pause_mission"
    | "resume_mission"
    | "status_report"
    | "room_clearance"
    | "unknown";
}

/**
 * Minimal voice agent for the EDTH live demo prop.
 *
 * This is intentionally not a general NLU system. It recognizes a small set of
 * short, reliable phrases and answers with deterministic responses. The goal is
 * a 30-second live interaction that survives a noisy demo room.
 */
export class VoiceAgent {
  private deps: VoiceAgentDependencies;

  constructor(deps: VoiceAgentDependencies) {
    this.deps = deps;
  }

  handleQuery(query: string): VoiceQueryResult {
    const normalized = query.toLowerCase().trim();

    if (this.matches(normalized, ["enemy", "hostile", "threat", "where is"])) {
      return this.reportEnemy();
    }

    if (this.matches(normalized, ["payload", "mission status", "how is the mission"])) {
      return this.reportMissionStatus();
    }

    if (this.matches(normalized, ["scout", "send scout", "dispatch scout"])) {
      return this.dispatchScout();
    }

    if (this.matches(normalized, ["next waypoint", "where do i go", "where to"])) {
      return this.reportNextWaypoint();
    }

    if (this.matches(normalized, ["pause", "stop mission"])) {
      return this.pauseMission();
    }

    if (this.matches(normalized, ["resume", "continue"])) {
      return this.resumeMission();
    }

    if (this.matches(normalized, ["status", "report", "situation"])) {
      return this.reportSituation();
    }

    if (this.matches(normalized, ["clear the building", "clear rooms", "room clearance", "start clearance"])) {
      return this.startRoomClearance();
    }

    if (this.matches(normalized, ["robot status", "spider status", "where is the robot"])) {
      return this.reportRobotStatus();
    }

    if (this.deps.roomClearance && this.matches(normalized, ["continue mission", "continue", "proceed"])) {
      this.deps.roomClearance.continueMission();
      return { response: "Continuing room clearance.", action: "room_clearance" };
    }

    if (this.deps.roomClearance && this.matches(normalized, ["retreat", "go back", "return to base"])) {
      this.deps.roomClearance.retreat();
      return { response: "SPIDER-01 is returning to base.", action: "room_clearance" };
    }

    return {
      response:
        "I can report enemy location, mission status, next waypoint, or dispatch a scout. Say one of those.",
      action: "unknown",
    };
  }

  private matches(input: string, keywords: string[]): boolean {
    return keywords.some((kw) => input.includes(kw.toLowerCase()));
  }

  private reportEnemy(): VoiceQueryResult {
    const tracks = this.deps.fusion.engine.getFusedTracks();
    const hostile = tracks.filter((t) => t.assessment === "hostile" || t.confidence < 0.85);
    const tracksToReport = hostile.length > 0 ? hostile : tracks;

    if (tracksToReport.length === 0) {
      return { response: "No confirmed contacts. Picture is clear.", action: "status_report" };
    }

    const nearest = tracksToReport[0];
    const distanceKm = this.distanceToMission(nearest.lat, nearest.lon);
    const direction = this.bearingToCardinal(nearest.lat, nearest.lon);

    return {
      response: `Nearest contact is ${distanceKm.toFixed(1)} kilometers ${direction}. Confidence ${Math.round(
        nearest.confidence * 100
      )} percent.`,
      action: "status_report",
    };
  }

  private reportMissionStatus(): VoiceQueryResult {
    const state = this.deps.missionEngine.getState();
    if (!state) {
      return { response: "No active mission.", action: "status_report" };
    }

    const payload = state.mission.payload;
    if (!payload) {
      return { response: `Mission ${state.mission.name} is ${state.state}.`, action: "status_report" };
    }

    const route = state.mission.route ?? [];
    const progress = route.length > 0 ? Math.min(100, Math.round((payload.currentWaypointIndex / (route.length - 1)) * 100)) : 0;

    return {
      response: `Payload is ${payload.status.replace("_", " ")}. Route progress ${progress} percent.`,
      action: "status_report",
    };
  }

  private dispatchScout(): VoiceQueryResult {
    const scout = this.deps.commander.getAssets().find((a) => a.role === "scout" && a.status === "idle");
    if (!scout) {
      return { response: "No idle scout available.", action: "status_report" };
    }

    const tracks = this.deps.fusion.engine.getFusedTracks();
    const target = tracks[0];
    if (!target) {
      return { response: "No contact to investigate. Scout standing by.", action: "status_report" };
    }

    const waypointId = `voice-scout-${Date.now()}`;
    this.deps.commander.registerWaypoints({ id: waypointId, lat: target.lat, lon: target.lon });
    void this.deps.commander.sendCommand(scout.id, { command: "move_to_waypoint", waypointId });

    return {
      response: `Dispatching ${scout.name} to investigate contact.`,
      action: "dispatch_scout",
    };
  }

  private reportNextWaypoint(): VoiceQueryResult {
    const state = this.deps.missionEngine.getState();
    const route = state?.mission.route;
    if (!route || route.length === 0) {
      return { response: "No route loaded.", action: "status_report" };
    }

    const idx = state?.mission.payload?.currentWaypointIndex ?? 0;
    const wp = route[Math.min(idx, route.length - 1)];
    return {
      response: `Next waypoint is ${wp.id}, ${wp.lat.toFixed(4)} north, ${wp.lon.toFixed(4)} east.`,
      action: "status_report",
    };
  }

  private pauseMission(): VoiceQueryResult {
    this.deps.missionEngine.pause();
    return { response: "Mission paused.", action: "pause_mission" };
  }

  private resumeMission(): VoiceQueryResult {
    this.deps.missionEngine.resume();
    return { response: "Mission resumed.", action: "resume_mission" };
  }

  private startRoomClearance(): VoiceQueryResult {
    if (!this.deps.roomClearance) {
      return { response: "Room clearance is not available.", action: "unknown" };
    }
    this.deps.roomClearance.start();
    return {
      response: "SPIDER-01 starting building clearance. Entrance, Room A, Room B, Room C.",
      action: "room_clearance",
    };
  }

  private reportRobotStatus(): VoiceQueryResult {
    if (!this.deps.roomClearance) {
      return { response: "No robot linked.", action: "unknown" };
    }
    const state = this.deps.roomClearance.getState();
    const { missionState, robot, currentRoomId } = state;
    const room = state.rooms.find((r) => r.id === currentRoomId);
    return {
      response: `SPIDER-01 is ${missionState.replace("_", " ")}. Battery ${robot.battery} percent. Current area: ${
        room?.label ?? "base"
      }.`,
      action: "status_report",
    };
  }

  private reportSituation(): VoiceQueryResult {
    const mission = this.deps.missionEngine.getState();
    const tracks = this.deps.fusion.engine.getFusedTracks();
    const squadrons = this.deps.simulator.getAll();

    const friendly = squadrons.filter((s) => s.affiliation === "friendly").length;
    const hostile = squadrons.filter((s) => s.affiliation === "hostile").length;
    const status = mission?.state ?? "idle";

    return {
      response: `Situation: mission ${status}. ${tracks.length} contacts. ${friendly} friendly and ${hostile} hostile battalions on the COP.`,
      action: "status_report",
    };
  }

  private distanceToMission(lat: number, lon: number): number {
    const state = this.deps.missionEngine.getState();
    const payload = state?.mission.payload;
    if (!payload) return 0;

    const route = state.mission.route ?? [];
    const wp = route[payload.currentWaypointIndex];
    if (!wp) return 0;

    const R = 6371; // km
    const dLat = ((lat - wp.lat) * Math.PI) / 180;
    const dLon = ((lon - wp.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((wp.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private bearingToCardinal(lat: number, lon: number): string {
    const state = this.deps.missionEngine.getState();
    const payload = state?.mission.payload;
    const route = state?.mission.route ?? [];
    const wp = payload ? route[payload.currentWaypointIndex] : undefined;
    if (!wp) return "unknown";

    const dLon = lon - wp.lon;
    const y = Math.sin((dLon * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180);
    const x =
      Math.cos((wp.lat * Math.PI) / 180) * Math.sin((lat * Math.PI) / 180) -
      Math.sin((wp.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.cos((dLon * Math.PI) / 180);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    const normalized = (brng + 360) % 360;

    const dirs = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
    return dirs[Math.round(normalized / 45) % 8];
  }
}
