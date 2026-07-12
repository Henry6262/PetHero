import { describe, expect, it } from "bun:test";
import { SensorSimulator, TrackFusionEngine } from "../src/core/track-fusion.ts";

describe("track fusion", () => {
  it("fuses multiple sensor feeds into fewer tracks than raw reports", () => {
    const simulator = new SensorSimulator(42, 8);
    const engine = new TrackFusionEngine({ seed: 42 });

    simulator.tick();
    const feeds = simulator.generateFeeds();
    const rawCount = feeds.reduce((sum, f) => sum + f.tracks.length, 0);
    const fused = engine.processFeeds(...feeds);

    expect(fused.length).toBeLessThan(rawCount);
    expect(fused.length).toBeGreaterThanOrEqual(1);
  });

  it("increases confidence when multiple sources agree", () => {
    const simulator = new SensorSimulator(42, 8);
    const engine = new TrackFusionEngine({ seed: 42 });

    simulator.tick();
    const first = engine.processFeeds(...simulator.generateFeeds());
    const initialConfidence = first[0]?.confidence ?? 0;

    simulator.tick();
    const second = engine.processFeeds(...simulator.generateFeeds());
    const laterConfidence = second[0]?.confidence ?? 0;

    expect(laterConfidence).toBeGreaterThanOrEqual(initialConfidence);
  });

  it("resets cleanly", () => {
    const simulator = new SensorSimulator(42, 4);
    const engine = new TrackFusionEngine({ seed: 42 });

    simulator.tick();
    engine.processFeeds(...simulator.generateFeeds());
    expect(engine.getFusedTracks().length).toBeGreaterThan(0);

    simulator.reset();
    engine.reset();
    expect(engine.getFusedTracks().length).toBe(0);
  });
});
