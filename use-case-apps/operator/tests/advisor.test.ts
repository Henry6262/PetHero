import { describe, expect, it } from "bun:test";
import { AutonomousAdvisor } from "../src/core/autonomous-advisor.ts";
import type { Asset, FusedTrack, TheaterMission } from "../src/shared/index.ts";

function makeMission(): TheaterMission {
  return {
    id: "msn-test",
    name: "Test escort",
    active: true,
    status: "active",
    type: "payload_escort",
    assignedAssetIds: ["crawler-01", "quad-01"],
    route: [
      { id: "dock", lat: 48.1374, lon: 11.5755 },
      { id: "wp-1", lat: 48.1375, lon: 11.5755 },
      { id: "wp-2", lat: 48.1376, lon: 11.5755 },
    ],
    payload: {
      id: "payload-1",
      label: "Medical supplies",
      status: "in_transit",
      currentWaypointIndex: 0,
      carrierAssetId: "crawler-01",
    },
    autonomyPolicy: {
      confirmConfidence: 0.75,
      scoutDispatchConfidence: 0.65,
      corridorWidthM: 2,
      llmAutoApprove: false,
    },
    zones: [
      {
        id: "zone-corridor",
        name: "Corridor",
        type: "route_corridor",
        affiliation: "friendly",
        status: "active",
        ring: [
          [11.5754, 48.1373],
          [11.5756, 48.1373],
          [11.5756, 48.1377],
          [11.5754, 48.1377],
          [11.5754, 48.1373],
        ],
      },
    ],
    objectives: [],
  };
}

function makeAssets(): Asset[] {
  return [
    {
      id: "crawler-01",
      name: "Crawler",
      kind: "robot",
      role: "payload",
      status: "moving",
      lat: 48.1374,
      lon: 11.5755,
      isSimulated: true,
    },
    {
      id: "quad-01",
      name: "Quadruped",
      kind: "robot",
      role: "scout",
      status: "idle",
      lat: 48.1374,
      lon: 11.5755,
      isSimulated: true,
    },
  ];
}

function makeTrack(confidence: number, lat = 48.1375, lon = 11.5755): FusedTrack {
  return {
    id: "F-001",
    lat,
    lon,
    altitude: 0,
    updatedAt: new Date().toISOString(),
    confidence,
    sourceIds: ["CAM-1"],
    sourceTrackIds: ["cam-1"],
    assessment: "Test track",
    covariance: { ee: 100, en: 0, ne: 0, nn: 100 },
    classification: "PERSON",
    corroborationCount: 1,
  };
}

describe("autonomous advisor", () => {
  it("recommends continue when no threats are near the route", () => {
    const advisor = new AutonomousAdvisor();
    const rec = advisor.evaluate({ mission: makeMission(), assets: makeAssets(), fusedTracks: [] });
    expect(rec.decision).toBe("continue");
  });

  it("autonomously dispatches a scout for an uncertain corridor contact", () => {
    const advisor = new AutonomousAdvisor();
    const rec = advisor.evaluate({
      mission: makeMission(),
      assets: makeAssets(),
      fusedTracks: [makeTrack(0.66)],
    });
    expect(rec.decision).toBe("dispatch_scout");
    expect(rec.assetIds).toContain("quad-01");
    expect(rec.requiresHumanConfirmation).toBe(false);
  });

  it("escalates to human for a confirmed corridor contact", () => {
    const advisor = new AutonomousAdvisor();
    const rec = advisor.evaluate({
      mission: makeMission(),
      assets: makeAssets(),
      fusedTracks: [makeTrack(0.8)],
    });
    expect(rec.decision).toBe("request_human_decision");
    expect(rec.requiresHumanConfirmation).toBe(true);
  });

  it("ignores tracks far from the route", () => {
    const advisor = new AutonomousAdvisor();
    const rec = advisor.evaluate({
      mission: makeMission(),
      assets: makeAssets(),
      fusedTracks: [makeTrack(0.9, 48.2, 11.6)],
    });
    expect(rec.decision).toBe("continue");
  });
});
