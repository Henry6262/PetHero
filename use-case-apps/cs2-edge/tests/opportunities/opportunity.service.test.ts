import { describe, test, expect } from "bun:test";
import { computeScore } from "../../src/opportunities/opportunity.service.ts";

describe("computeScore", () => {
  test("returns positive score for profitable item with volume", () => {
    // netProfitPct = (13 * 0.88 - 10) / 10 * 100 = 14.4
    // score = 14.4 * ln(43) ≈ 54.16
    const { score, expectedProfitPct } = computeScore(10, 13, 42);
    expect(expectedProfitPct).toBeCloseTo(14.4, 1);
    expect(score).toBeGreaterThan(0);
  });

  test("returns score = 0 when fees eat the margin", () => {
    // min = 12, median = 12 → receive 12*0.88=10.56, paid 12 → net negative
    const { score, expectedProfitPct } = computeScore(12, 12, 100);
    expect(score).toBe(0);
    expect(expectedProfitPct).toBeLessThan(0);
  });

  test("returns score = 0 when volume is 0 (log(1) = 0)", () => {
    const { score } = computeScore(10, 13, 0);
    expect(score).toBe(0);
  });

  test("returns score = 0 when min <= 0 (division guard)", () => {
    const { score } = computeScore(0, 13, 42);
    expect(score).toBe(0);
  });

  test("higher volume amplifies score for same margins", () => {
    const low = computeScore(10, 13, 10);
    const high = computeScore(10, 13, 100);
    expect(high.score).toBeGreaterThan(low.score);
    expect(high.expectedProfitPct).toBeCloseTo(low.expectedProfitPct, 4);
  });
});
