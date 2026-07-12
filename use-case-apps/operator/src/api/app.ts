import { Hono } from "hono";
import { cors } from "hono/cors";
import { MissionContextStore } from "../core/context-store.ts";
import { SquadronSimulator } from "../core/squadron-simulator.ts";
import { MissionEngine } from "../core/mission-engine.ts";
import { RobotCommander } from "../core/robot-commander.ts";
import { AutonomousAdvisor } from "../core/autonomous-advisor.ts";
import { LLMAdvisor } from "../core/llm-advisor.ts";
import { escortAssets, escortOperation, escortWaypoints } from "../shared/escort-mission.ts";
import { buildAdvisorRoutes } from "./routes/advisor.ts";
import { buildAgentsRoutes } from "./routes/agents.ts";
import { buildAssetsRoutes } from "./routes/assets.ts";
import { buildCellsRoutes } from "./routes/cells.ts";
import { buildDockRoutes } from "./routes/dock.ts";
import { buildMissionsRoutes } from "./routes/missions.ts";
import { buildPlaybookRoutes } from "./routes/playbook.ts";
import { buildSquadronsRoutes } from "./routes/squadrons.ts";
import { buildStateRoutes } from "./routes/state.ts";
import { buildFusionRoutes, createFusionSystem, type FusionSystem } from "./routes/fusion.ts";
import { buildFieldBridgeRoutes } from "./routes/field-bridge.ts";
import { buildCotRoutes } from "./routes/cot.ts";
import { buildVoiceRoutes } from "./routes/voice.ts";
import { buildRoomClearanceRoutes } from "./routes/room-clearance.ts";
import { RoomClearanceEngine } from "../core/room-clearance-engine.ts";
import { buildMazeRoutes } from "./routes/maze.ts";
import { MazeEngine } from "../core/maze-engine.ts";
import { readFileSync } from "node:fs";

function loadDefaultMaze(engine: MazeEngine) {
  try {
    const map = JSON.parse(readFileSync("./results/maze_extraction/ddas_maze_map.json", "utf-8"));
    const plan = JSON.parse(readFileSync("./results/maze_extraction/ddas_maze_plan.json", "utf-8"));
    engine.setMap(map);
    engine.setPlan(plan);
  } catch (err) {
    console.warn("[operator] could not load default maze:", (err as Error).message);
  }
}

export function createApp(
  store = new MissionContextStore(),
  simulator = new SquadronSimulator(),
  fusion: FusionSystem = createFusionSystem()
) {
  const app = new Hono();
  const trustedTokens = new Set(
    (process.env["OPERATOR_TRUST_TOKENS"] ?? "demo-agent-token,demo-dock-token")
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
  );

  // EDTH hackathon: load the Relay Run escort scenario by default.
  const commander = new RobotCommander();
  commander.registerWaypoints(...escortWaypoints);
  commander.registerAssets(...escortAssets);

  const advisor = new AutonomousAdvisor();
  const llmAdvisor = new LLMAdvisor(advisor);
  const missionEngine = new MissionEngine({ commander, advisor, fusion });
  const roomClearance = new RoomClearanceEngine({
    syntheticContact: process.env["OPERATOR_ROOM_CLEARANCE_SYNTHETIC"] !== "false",
  });
  const mazeEngine = new MazeEngine();
  loadDefaultMaze(mazeEngine);

  app.use("*", cors());

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "operator",
      generatedAt: new Date().toISOString(),
    })
  );

  app.route("/api/advisor", buildAdvisorRoutes(missionEngine, commander, fusion, llmAdvisor, escortOperation));
  app.route("/api/agents", buildAgentsRoutes(store));
  app.route("/api/assets", buildAssetsRoutes(commander));
  app.route("/api/cells", buildCellsRoutes(store));
  app.route("/api/dock", buildDockRoutes(store, trustedTokens));
  app.route("/api/missions", buildMissionsRoutes(missionEngine, escortOperation));
  app.route("/api/playbook", buildPlaybookRoutes(store));
  app.route("/api/state", buildStateRoutes(store));
  app.route("/api/squadrons", buildSquadronsRoutes(simulator));
  app.route("/api/fusion", buildFusionRoutes(fusion));
  app.route("/api/field-bridge", buildFieldBridgeRoutes(store, commander, fusion));
  app.route("/api/cot", buildCotRoutes(fusion, commander, escortOperation));
  app.route("/api/voice", buildVoiceRoutes({ missionEngine, commander, fusion, simulator, roomClearance }));
  app.route("/api/room-clearance", buildRoomClearanceRoutes(roomClearance));
  app.route("/api/maze", buildMazeRoutes(mazeEngine));

  return app;
}
