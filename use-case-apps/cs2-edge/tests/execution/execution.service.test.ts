import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { Marketplace, PrismaClient } from "@prisma/client";
import { ExecutionService } from "../../src/execution/execution.service.ts";
import type { SkinportBuyClient } from "../../src/execution/skinport.buy.client.ts";

const prisma = new PrismaClient();

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
  delete process.env.SKINPORT_API_KEY;
});

describe("ExecutionService", () => {
  test("records a paper trade and execution cycle when API key is missing", async () => {
    await prisma.item.create({
      data: {
        id: "AUG | Death by Puppy (Factory New)",
        name: "AUG | Death by Puppy (Factory New)",
        type: "Rifle",
        rarity: "Restricted",
      },
    });

    await prisma.opportunityScore.create({
      data: {
        itemId: "AUG | Death by Puppy (Factory New)",
        marketplace: Marketplace.SKINPORT,
        score: 180,
        expectedProfitPct: 55,
        listedPrice: 27.77,
        targetSellPrice: 41.12,
        volume24h: 18,
        confidence: 0,
      },
    });

    const buyClient = {
      getBalance: mock(async () => 100),
      buyItem: mock(async () => ({ success: true, orderId: "order-1" })),
    } as unknown as SkinportBuyClient;

    const svc = new ExecutionService(prisma, {
      buyClient,
      minScore: 50,
      minProfitPct: 10,
      minBuyPrice: 20,
      maxSpendPerTrade: 500,
    });

    await svc.runCycle();

    const attempts = await prisma.tradeAttempt.findMany();
    const cycles = await prisma.executionCycle.findMany();
    expect(attempts).toHaveLength(1);
    expect(cycles).toHaveLength(1);
    expect(attempts[0]!.status).toBe("PAPER");
    expect(attempts[0]!.mode).toBe("PAPER");
    expect(attempts[0]!.error).toBe("NO_API_KEY_PAPER_TRADE");
    expect(Number(attempts[0]!.buyPrice)).toBe(27.77);
    expect(Number(attempts[0]!.expectedNetProfit)).toBe(8.42);
    expect(cycles[0]!.status).toBe("PAPER");
    expect(cycles[0]!.reason).toBe("NO_API_KEY_PAPER_TRADE");
    expect((buyClient as unknown as { buyItem: ReturnType<typeof mock> }).buyItem).not.toHaveBeenCalled();
  });

  test("skips implausible outliers and respects cooldown when choosing paper trades", async () => {
    await prisma.item.createMany({
      data: [
        {
          id: "AUG | Death by Puppy (Factory New)",
          name: "AUG | Death by Puppy (Factory New)",
          type: "Rifle",
          rarity: "Restricted",
        },
        {
          id: "M4A4 | Temukau (Field-Tested)",
          name: "M4A4 | Temukau (Field-Tested)",
          type: "Rifle",
          rarity: "Covert",
        },
        {
          id: "M4A1-S | Printstream (Field-Tested)",
          name: "M4A1-S | Printstream (Field-Tested)",
          type: "Rifle",
          rarity: "Covert",
        },
      ],
    });

    await prisma.opportunityScore.createMany({
      data: [
        {
          itemId: "AUG | Death by Puppy (Factory New)",
          marketplace: Marketplace.SKINPORT,
          score: 2406.62,
          expectedProfitPct: 2190.61,
          listedPrice: 27.67,
          targetSellPrice: 720.24,
          volume24h: 2,
          confidence: 0,
        },
        {
          itemId: "M4A4 | Temukau (Field-Tested)",
          marketplace: Marketplace.SKINPORT,
          score: 269.52,
          expectedProfitPct: 61.33,
          listedPrice: 22.5,
          targetSellPrice: 41.25,
          volume24h: 80,
          confidence: 0,
        },
        {
          itemId: "M4A1-S | Printstream (Field-Tested)",
          marketplace: Marketplace.SKINPORT,
          score: 101.81,
          expectedProfitPct: 24.87,
          listedPrice: 175.66,
          targetSellPrice: 249.25,
          volume24h: 59,
          confidence: 0,
        },
      ],
    });

    const buyClient = {
      getBalance: mock(async () => 100),
      buyItem: mock(async () => ({ success: true, orderId: "order-1" })),
    } as unknown as SkinportBuyClient;

    const svc = new ExecutionService(prisma, {
      buyClient,
      minScore: 50,
      minProfitPct: 10,
      minBuyPrice: 20,
      maxSpendPerTrade: 500,
      minVolume24h: 10,
      maxExpectedProfitPct: 150,
      cooldownMinutes: 180,
    });

    await svc.runCycle();
    await svc.runCycle();

    const attempts = await prisma.tradeAttempt.findMany({
      orderBy: { attemptedAt: "asc" },
    });
    const cycles = await prisma.executionCycle.findMany({
      orderBy: { executedAt: "asc" },
    });

    expect(attempts).toHaveLength(2);
    expect(attempts[0]!.itemId).toBe("M4A4 | Temukau (Field-Tested)");
    expect(attempts[1]!.itemId).toBe("M4A1-S | Printstream (Field-Tested)");
    expect(cycles[0]!.selectedItemId).toBe("M4A4 | Temukau (Field-Tested)");
    expect(cycles[1]!.selectedItemId).toBe("M4A1-S | Printstream (Field-Tested)");
  });
});
