import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { PrismaClient, Marketplace } from "@prisma/client";
import { createApp } from "../../src/api/api.server.ts";

const prisma = new PrismaClient();
const app = createApp(prisma);

async function json(res: Response): Promise<Record<string, unknown>> {
  return res.json() as Promise<Record<string, unknown>>;
}

beforeAll(() => prisma.$connect());
afterAll(() => prisma.$disconnect());

beforeEach(async () => {
  await prisma.tradeAttempt.deleteMany({});
  await prisma.executionCycle.deleteMany({});
  await prisma.opportunityScore.deleteMany({});
  await prisma.priceSnapshot.deleteMany({});
  await prisma.saleEvent.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.item.deleteMany({});
});

describe("GET /execution/metrics", () => {
  test("returns aggregate totals and recent cycle data", async () => {
    await prisma.item.create({
      data: {
        id: "AK-47 | Inheritance (Field-Tested)",
        name: "AK-47 | Inheritance (Field-Tested)",
        type: "Rifle",
        rarity: "Covert",
      },
    });

    const cycle = await prisma.executionCycle.create({
      data: {
        mode: "PAPER",
        status: "PAPER",
        candidateCount: 12,
        qualifiedCount: 2,
        affordableCount: 2,
        selectedItemId: "AK-47 | Inheritance (Field-Tested)",
        selectedBuyPrice: 37.48,
        selectedTargetSellPrice: 51.82,
        selectedExpectedProfitPct: 21.67,
        selectedExpectedNetProfit: 8.12,
        selectedScore: 111.79,
        selectedConfidence: 0,
        reason: "NO_API_KEY_PAPER_TRADE",
      },
    });

    await prisma.tradeAttempt.create({
      data: {
        itemId: "AK-47 | Inheritance (Field-Tested)",
        marketplace: Marketplace.SKINPORT,
        buyPrice: 37.48,
        resellPrice: 51.82,
        expectedProfitPct: 21.67,
        expectedNetProfit: 8.12,
        score: 111.79,
        confidence: 0,
        mode: "PAPER",
        status: "PAPER",
        error: "NO_API_KEY_PAPER_TRADE",
        cycleId: cycle.id,
      },
    });

    const res = await app.request("/execution/metrics");
    expect(res.status).toBe(200);
    const body = await json(res);

    expect(body.totals).toEqual({
      attempts: 1,
      paperAttempts: 1,
      successes: 0,
      failures: 0,
      expectedNetProfit: 8.12,
    });

    const latestCycle = body.latestCycle as Record<string, unknown>;
    expect(latestCycle.status).toBe("PAPER");
    expect(latestCycle.reason).toBe("NO_API_KEY_PAPER_TRADE");
    expect(latestCycle.selectedExpectedNetProfit).toBe(8.12);

    const recentAttempts = body.recentAttempts as Array<Record<string, unknown>>;
    expect(recentAttempts).toHaveLength(1);
    expect(recentAttempts[0]!.expectedNetProfit).toBe(8.12);
  });
});
