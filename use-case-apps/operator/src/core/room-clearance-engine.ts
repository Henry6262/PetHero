export type ClearanceRoomState = "pending" | "clearing" | "cleared" | "contact";

export interface ClearanceRoom {
  id: string;
  label: string;
  state: ClearanceRoomState;
}

export type ClearanceMissionState =
  | "idle"
  | "scanning"
  | "contact"
  | "awaiting_orders"
  | "returning"
  | "complete";

export interface RobotTelemetry {
  status?: string;
  battery?: number;
  cameraUrl?: string;
  detection?: {
    roomId?: string;
    label: string;
    confidence: number;
  };
}

export interface RoomClearanceState {
  missionState: ClearanceMissionState;
  robot: {
    id: string;
    status: string;
    battery: number;
    cameraUrl: string;
  };
  rooms: ClearanceRoom[];
  currentRoomId: string | null;
  alert?: {
    roomId: string;
    label: string;
    confidence: number;
    message: string;
  };
  log: string[];
}

/**
 * Lightweight state machine for the room-clearance demo.
 *
 * The engine can run in two modes:
 * 1. Synthetic: the frontend/backend drives the mission timeline with timers.
 * 2. Real robot: the PiCrawler bridge POSTs telemetry and the engine reacts.
 *
 * The state is kept simple so it can be polled by the dashboard every second.
 */
export interface RoomClearanceEngineOptions {
  /**
   * When true, Room B automatically reports a contact after scanning.
   * Use true for the synthetic dashboard demo, false when a real robot
   * is doing the detection.
   */
  syntheticContact?: boolean;
}

export class RoomClearanceEngine {
  private state: RoomClearanceState;
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickMs = 1500;
  private nextCommand: { command: string; payload?: unknown } | null = null;
  private syntheticContact: boolean;

  constructor(options: RoomClearanceEngineOptions = {}) {
    this.syntheticContact = options.syntheticContact ?? true;
    this.state = {
      missionState: "idle",
      robot: {
        id: "SPIDER-01",
        status: "idle",
        battery: 100,
        cameraUrl: "",
      },
      rooms: [
        { id: "entrance", label: "Entrance / corridor", state: "pending" },
        { id: "room-a", label: "Room A", state: "pending" },
        { id: "room-b", label: "Room B", state: "pending" },
        { id: "room-c", label: "Room C", state: "pending" },
      ],
      currentRoomId: null,
      log: ["Mission initialized. Awaiting start."],
    };
  }

  getState(): RoomClearanceState {
    return JSON.parse(JSON.stringify(this.state));
  }

  start(): RoomClearanceState {
    this.stop();
    this.state.missionState = "scanning";
    this.state.robot.status = "moving";
    this.state.robot.battery = 100;
    this.state.rooms.forEach((r) => (r.state = "pending"));
    this.state.currentRoomId = this.state.rooms[0].id;
    this.state.alert = undefined;
    this.state.log = ["SPIDER-01 started building clearance."];
    this.nextCommand = { command: "move_to_room", payload: { roomId: this.state.rooms[0].id } };

    this.timer = setInterval(() => this.tick(), this.tickMs);
    return this.getState();
  }

  reset(): RoomClearanceState {
    this.stop();
    return this.start();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  continueMission(): RoomClearanceState {
    if (this.state.missionState === "awaiting_orders") {
      this.state.missionState = "scanning";
      this.state.robot.status = "moving";
      this.state.alert = undefined;
      this.log("Operator: continue mission.");
      // Mark contact room as cleared and move to next.
      const current = this.state.rooms.find((r) => r.id === this.state.currentRoomId);
      if (current && current.state === "contact") {
        current.state = "cleared";
      }
      this.advanceRoom();
      this.timer = setInterval(() => this.tick(), this.tickMs);
    }
    return this.getState();
  }

  retreat(): RoomClearanceState {
    this.stop();
    this.state.missionState = "returning";
    this.state.robot.status = "returning";
    this.state.alert = undefined;
    this.log("Operator: retreat to base.");
    this.nextCommand = { command: "return_to_base" };
    // Simulate return complete after a short delay.
    setTimeout(() => {
      this.state.missionState = "idle";
      this.state.robot.status = "idle";
      this.state.currentRoomId = null;
      this.log("SPIDER-01 returned to base.");
    }, 2000);
    return this.getState();
  }

  /**
   * Accept telemetry from the real robot bridge.
   * If a detection is included, the engine switches to contact/awaiting_orders.
   */
  telemetry(data: RobotTelemetry): RoomClearanceState {
    if (data.status) this.state.robot.status = data.status;
    if (typeof data.battery === "number") this.state.robot.battery = data.battery;
    if (data.cameraUrl) this.state.robot.cameraUrl = data.cameraUrl;

    if (data.detection && data.detection.confidence > 0.4) {
      this.stop();
      const room = this.state.rooms.find((r) => r.id === (data.detection!.roomId ?? this.state.currentRoomId));
      if (room) {
        room.state = "contact";
        this.state.currentRoomId = room.id;
      }
      this.state.missionState = "awaiting_orders";
      this.state.robot.status = "halted";
      this.state.alert = {
        roomId: room?.id ?? "unknown",
        label: data.detection.label,
        confidence: data.detection.confidence,
        message: `${data.detection.label} detected in ${room?.label ?? "unknown area"}. Confidence ${Math.round(
          data.detection.confidence * 100
        )}%.`,
      };
      this.log(this.state.alert.message);
      this.nextCommand = { command: "stop" };
    }
    return this.getState();
  }

  /**
   * Demo helper: force a contact in the current room.
   */
  simulateContact(roomId?: string): RoomClearanceState {
    const targetId = roomId ?? this.state.currentRoomId ?? "room-b";
    return this.telemetry({
      status: "scanning",
      detection: { roomId: targetId, label: "person", confidence: 0.87 },
    });
  }

  getNextCommand(): { command: string; payload?: unknown } | null {
    const cmd = this.nextCommand;
    this.nextCommand = null;
    return cmd;
  }

  private tick() {
    if (this.state.missionState !== "scanning") return;

    const current = this.state.rooms.find((r) => r.id === this.state.currentRoomId);
    if (!current) return;

    // Simulate clearing the current room over one tick.
    if (current.state === "pending") {
      current.state = "clearing";
      this.log(`SPIDER-01 entering ${current.label}.`);
      this.nextCommand = { command: "scan_room", payload: { roomId: current.id } };
      return;
    }

    if (current.state === "clearing") {
      // For synthetic demos, Room B always reports a contact so the audience
      // sees the human-in-the-loop flow. With a real robot, disable this and
      // let the bridge's detection telemetry drive the contact.
      if (this.syntheticContact && current.id === "room-b") {
        this.simulateContact(current.id);
        return;
      }
      current.state = "cleared";
      this.log(`${current.label} cleared.`);
      this.advanceRoom();
    }
  }

  private advanceRoom() {
    const idx = this.state.rooms.findIndex((r) => r.id === this.state.currentRoomId);
    const next = this.state.rooms[idx + 1];
    if (next) {
      this.state.currentRoomId = next.id;
      this.nextCommand = { command: "move_to_room", payload: { roomId: next.id } };
    } else {
      this.stop();
      this.state.missionState = "complete";
      this.state.robot.status = "idle";
      this.state.currentRoomId = null;
      this.log("Building clearance complete.");
      this.nextCommand = { command: "return_to_base" };
    }
  }

  private log(message: string) {
    this.state.log.push(`${new Date().toLocaleTimeString()} · ${message}`);
    if (this.state.log.length > 50) {
      this.state.log = this.state.log.slice(-50);
    }
  }
}
