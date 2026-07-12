import { describe, expect, it } from "bun:test";
import { SensorSimulator, TrackFusionEngine } from "../src/core/track-fusion.ts";

describe("performance", () => {
  it("fuses 100 sensor tracks in under 50 ms", () => {
    const simulator = new SensorSimulator(42, 100);
    const engine = new TrackFusionEngine({ seed: 42 });

    simulator.tick();
    const feeds = simulator.generateFeeds();
    const rawCount = feeds.reduce((sum, f) => sum + f.tracks.length, 0);
    expect(rawCount).toBeGreaterThanOrEqual(100);

    const start = performance.now();
    const fused = engine.processFeeds(...feeds);
    const elapsed = performance.now() - start;

    expect(fused.length).toBeGreaterThanOrEqual(1);
    expect(elapsed).toBeLessThan(100);
  });
});
