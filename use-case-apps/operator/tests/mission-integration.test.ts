import { describe, expect, it } from "bun:test";
import { MissionEngine } from "../src/core/mission-engine.ts";
import { RobotCommander } from "../src/core/robot-commander.ts";
import { AutonomousAdvisor } from "../src/core/autonomous-advisor.ts";
import { SensorSimulator, TrackFusionEngine } from "../src/core/track-fusion.ts";
import { escortAssets, escortOperation, escortWaypoints } from "../src/shared/escort-mission.ts";
import type { TheaterOperation } from "../src/shared/mission.ts";

describe("payload escort integration", () => {
  it("runs the autonomous loop: scout dispatch and human escalation", () => {
    // Clone the scenario so we can tighten thresholds for a fast, deterministic test.
    const operation = JSON.parse(JSON.stringify(escortOperation)) as TheaterOperation;
    operation.missions[0].autonomyPolicy = {
      confirmConfidence: 0.65,
      scoutDispatchConfidence: 0.6,
      corridorWidthM: 2,
      llmAutoApprove: false,
    };

    const commander = new RobotCommander();
    commander.registerWaypoints(...escortWaypoints);
    commander.registerAssets(...escortAssets);

    const fusion = {
      simulator: new SensorSimulator(),
      engine: new TrackFusionEngine(),
    };

    const advisor = new AutonomousAdvisor();
    const engine = new MissionEngine({ commander, advisor, fusion });
    const started = engine.start(operation, "msn-payload-escort");
    expect(started).not.toBeNull();

    // Move payload partway along the route.
    for (let i = 0; i < 6; i++) engine.stepTick();

    // Inject an uncertain contact → advisor should autonomously dispatch scout.
    const route = operation.missions[0].route!;
    const contactPoint = route[2];
    engine.injectContact(contactPoint.lat, contactPoint.lon, "PERSON", 0.9);
    engine.stepTick();

    expect(commander.getAsset("quad-01")?.status).toBe("moving");
    expect(engine.getState()?.pendingDecision).toBeNull();

    // Inject corroboration → confidence rises above confirm threshold → human escalation.
    engine.injectContact(contactPoint.lat, contactPoint.lon, "PERSON", 0.9);
    engine.stepTick();

    expect(engine.getState()?.state).toBe("paused");
    expect(engine.getState()?.pendingDecision).not.toBeNull();

    // Operator approves → mission resumes.
    const decisionId = engine.getState()?.pendingDecision?.id;
    expect(decisionId).toBeDefined();
    engine.applyHumanDecision(decisionId!, true, "approved reroute");

    expect(engine.getState()?.state).toBe("running");
    expect(engine.getState()?.pendingDecision).toBeNull();
  });
});
