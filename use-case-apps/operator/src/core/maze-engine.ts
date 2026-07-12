export type MazeCell = [number, number];

export interface MazeMap {
  width: number;
  height: number;
  cell_size_m: number;
  robot_radius_m: number;
  grid: number[][];
  inflated_grid: number[][];
  start: number[];
  end: number[];
  debug_image?: string;
}

export interface MazeCommand {
  action: string;
  steps: number;
}

export interface MazePlan {
  map_file: string;
  width: number;
  height: number;
  cell_size_m: number;
  start: number[];
  end: number[];
  path: number[][];
  commands: MazeCommand[];
  heading: string;
  distance_cells: number;
  estimated_time_s: number;
  calibration: {
    forward_steps_per_cell: number;
    turn_steps_per_90: number;
    speed: number;
  };
  error?: string;
}

export type MazeExecutionState =
  | "idle"
  | "mapping"
  | "planned"
  | "executing"
  | "paused"
  | "complete"
  | "error";

export interface MazeRobotTelemetry {
  status?: string;
  battery?: number;
  cameraUrl?: string;
  pose?: MazeCell;
  command_index?: number;
  obstacle_detected?: boolean;
}

export interface MazeState {
  executionState: MazeExecutionState;
  map: MazeMap | null;
  plan: MazePlan | null;
  robot: {
    status: string;
    battery: number;
    cameraUrl: string;
    pose: MazeCell | null;
    commandIndex: number;
    obstacleDetected: boolean;
  };
  log: string[];
}

/**
 * Lightweight mission controller for the drone-video → maze → robot demo.
 *
 * The Operator backend stores the map and planned path. The PiCrawler bridge
 * polls /api/maze/next-command and reports telemetry back.
 */
export class MazeEngine {
  private state: MazeState;
  private nextCommand: { command: string; payload?: unknown } | null = null;
  private commandQueue: MazeCommand[] = [];
  private commandIndex = 0;

  constructor() {
    this.state = {
      executionState: "idle",
      map: null,
      plan: null,
      robot: {
        status: "idle",
        battery: 100,
        cameraUrl: "",
        pose: null,
        commandIndex: 0,
        obstacleDetected: false,
      },
      log: ["Maze demo initialized. Upload a map or run the pipeline."],
    };
  }

  getState(): MazeState {
    return JSON.parse(JSON.stringify(this.state));
  }

  reset(): MazeState {
    this.commandQueue = [];
    this.commandIndex = 0;
    this.nextCommand = null;
    this.state.executionState = "idle";
    this.state.robot.status = "idle";
    this.state.robot.commandIndex = 0;
    this.state.robot.obstacleDetected = false;
    this.log("Reset. Ready for new map.");
    return this.getState();
  }

  setMap(map: MazeMap): MazeState {
    this.state.map = map;
    this.state.plan = null;
    this.state.executionState = "mapping";
    this.log(`Map loaded: ${map.width}x${map.height}, cell ${map.cell_size_m}m.`);
    return this.getState();
  }

  setPlan(plan: MazePlan): MazeState {
    this.state.plan = plan;
    this.commandQueue = plan.error ? [] : [...plan.commands];
    this.commandIndex = 0;
    this.state.executionState = plan.error ? "error" : "planned";
    if (plan.error) {
      this.log(`Planning failed: ${plan.error}`);
    } else {
      this.log(
        `Path planned: ${plan.distance_cells} cells, ${plan.commands.length} commands, ~${plan.estimated_time_s}s.`
      );
    }
    return this.getState();
  }

  startExecution(): MazeState {
    if (!this.state.plan || this.state.plan.error) {
      this.state.executionState = "error";
      this.log("Cannot start: no valid plan.");
      return this.getState();
    }
    if (this.commandQueue.length === 0) {
      this.state.executionState = "complete";
      this.log("Nothing to execute.");
      return this.getState();
    }
    this.state.executionState = "executing";
    this.state.robot.status = "moving";
    this.commandIndex = 0;
    this.nextCommand = this.buildCommandMessage();
    this.log("Execution started.");
    return this.getState();
  }

  pause(): MazeState {
    if (this.state.executionState === "executing") {
      this.state.executionState = "paused";
      this.state.robot.status = "paused";
      this.nextCommand = { command: "stop" };
      this.log("Execution paused by operator.");
    }
    return this.getState();
  }

  resume(): MazeState {
    if (this.state.executionState === "paused") {
      this.state.executionState = "executing";
      this.state.robot.status = "moving";
      this.nextCommand = this.buildCommandMessage();
      this.log("Execution resumed.");
    }
    return this.getState();
  }

  telemetry(data: MazeRobotTelemetry): MazeState {
    if (data.status) this.state.robot.status = data.status;
    if (typeof data.battery === "number") this.state.robot.battery = data.battery;
    if (data.cameraUrl) this.state.robot.cameraUrl = data.cameraUrl;
    if (data.pose) this.state.robot.pose = data.pose;
    if (typeof data.command_index === "number") this.state.robot.commandIndex = data.command_index;
    if (typeof data.obstacle_detected === "boolean") {
      this.state.robot.obstacleDetected = data.obstacle_detected;
      if (data.obstacle_detected && this.state.executionState === "executing") {
        this.state.executionState = "paused";
        this.nextCommand = { command: "stop" };
        this.log("Obstacle detected: pausing execution.");
      }
    }
    return this.getState();
  }

  /**
   * The bridge calls this to fetch the next gait command. When the command is
   * an actual robot movement we advance the queue so the following poll gets
   * the next one.
   */
  getNextCommand(): { command: string; payload?: unknown } | null {
    const cmd = this.nextCommand;
    this.nextCommand = null;

    if (cmd?.command === "execute_command") {
      // Advance after handing a movement command to the bridge.
      this.commandIndex += 1;
      if (this.commandIndex >= this.commandQueue.length) {
        this.state.executionState = "complete";
        this.state.robot.status = "idle";
        this.log("Execution complete.");
      } else {
        // Pre-stage the next command so the bridge can fetch it immediately.
        this.nextCommand = this.buildCommandMessage();
      }
    }

    return cmd;
  }

  private buildCommandMessage(): { command: string; payload: unknown } | null {
    if (this.commandIndex >= this.commandQueue.length) {
      return null;
    }
    const item = this.commandQueue[this.commandIndex];
    return {
      command: "execute_command",
      payload: {
        index: this.commandIndex,
        total: this.commandQueue.length,
        ...item,
      },
    };
  }

  private log(message: string) {
    this.state.log.push(`${new Date().toLocaleTimeString()} · ${message}`);
    if (this.state.log.length > 50) {
      this.state.log = this.state.log.slice(-50);
    }
  }
}
