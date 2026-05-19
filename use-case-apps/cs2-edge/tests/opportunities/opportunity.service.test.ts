import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { PrismaClient, Marketplace } from "@prisma/client";
import { computeScore, OpportunityService } from "../../src/opportunities/opportunity.service.ts";

const prisma = new PrismaClient();
beforeAll(() => prisma.$connect());
afterAll(() => prisma.$disconnect());
beforeEach(async () => {
  await prisma.opportunityScore.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.saleEvent.deleteMany({});
  await prisma.priceSnapshot.deleteMany({});
  await prisma.item.deleteMany({});
});

// ─── computeScore (pure function) ────────────────────────────────────────────

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

// ─── scoreAll ─────────────────────────────────────────────────────────────────

describe("OpportunityService.scoreAll", () => {
  test("writes correct score to DB for an item with a snapshot", async () => {
    await prisma.item.create({
      data: {
        id: "AK-47 | Redline (Field-Tested)",
        name: "AK-47 | Redline (Field-Tested)",
        type: "Rifle",
        rarity: "Classified",
      },
    });
    await prisma.priceSnapshot.create({
      data: {
        itemId: "AK-47 | Redline (Field-Tested)",
        marketplace: Marketplace.SKINPORT,
        minPrice: 10,
        medianPrice: 13,
        volume24h: 42,
      },
    });

    const service = new OpportunityService(prisma);
    await service.scoreAll(Marketplace.SKINPORT);

    const row = await prisma.opportunityScore.findUnique({
      where: {
        itemId_marketplace: {
          itemId: "AK-47 | Redline (Field-Tested)",
          marketplace: Marketplace.SKINPORT,
        },
      },
    });
    expect(row).not.toBeNull();
    expect(row!.score).toBeGreaterThan(0);
    expect(row!.expectedProfitPct).toBeCloseTo(14.4, 1);
    expect(Number(row!.listedPrice)).toBe(10);
    expect(Number(row!.targetSellPrice)).toBe(13);
  });

  test("resolves without error when no snapshots exist", async () => {
    const service = new OpportunityService(prisma);
    await expect(service.scoreAll(Marketplace.SKINPORT)).resolves.toBeUndefined();
    const count = await prisma.opportunityScore.count();
    expect(count).toBe(0);
  });

  test("upserts — does not duplicate rows on repeated calls", async () => {
    await prisma.item.create({
      data: { id: "AWP | Asiimov (Field-Tested)", name: "AWP | Asiimov (Field-Tested)", type: "Sniper Rifle", rarity: "Covert" },
    });
    await prisma.priceSnapshot.create({
      data: { itemId: "AWP | Asiimov (Field-Tested)", marketplace: Marketplace.SKINPORT, minPrice: 50, medianPrice: 60, volume24h: 20 },
    });

    const service = new OpportunityService(prisma);
    await service.scoreAll(Marketplace.SKINPORT);
    await service.scoreAll(Marketplace.SKINPORT);

    const count = await prisma.opportunityScore.count();
    expect(count).toBe(1);
  });
});
