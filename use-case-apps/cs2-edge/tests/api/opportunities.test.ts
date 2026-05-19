import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { PrismaClient, Marketplace } from "@prisma/client";
import { createApp } from "../../src/api/api.server.ts";

const prisma = new PrismaClient();

async function json(res: Response): Promise<Record<string, unknown>> {
  return res.json() as Promise<Record<string, unknown>>;
}

const app = createApp(prisma);

beforeAll(() => prisma.$connect());
afterAll(() => prisma.$disconnect());

beforeEach(async () => {
  await prisma.tradeAttempt.deleteMany({});
  await prisma.executionCycle.deleteMany({});
  await prisma.opportunityScore.deleteMany({});
  await prisma.priceSnapshot.deleteMany({});
  await prisma.item.deleteMany({});
});

describe("GET /opportunities", () => {
  test("returns empty list with total 0 and null scoredAt when no scores", async () => {
    const res = await app.request("/opportunities");
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.opportunities).toHaveLength(0);
    expect(body.total).toBe(0);
    expect(body.scoredAt).toBeNull();
  });

  test("returns ranked opportunities with correct shape", async () => {
    await prisma.item.create({
      data: {
        id: "AK-47 | Redline (Field-Tested)",
        name: "AK-47 | Redline (Field-Tested)",
        type: "Rifle",
        rarity: "Classified",
      },
    });
    await prisma.opportunityScore.create({
      data: {
        itemId: "AK-47 | Redline (Field-Tested)",
        marketplace: Marketplace.SKINPORT,
        score: 54.16,
        expectedProfitPct: 14.4,
        listedPrice: 10,
        targetSellPrice: 13,
        volume24h: 42,
      },
    });

    const res = await app.request("/opportunities");
    expect(res.status).toBe(200);
    const body = await json(res);
    const opps = body.opportunities as {
      itemId: string;
      score: number;
      expectedProfitPct: number;
      listedPrice: number;
      targetSellPrice: number;
      volume24h: number;
    }[];

    expect(body.total).toBe(1);
    expect(opps[0]!.itemId).toBe("AK-47 | Redline (Field-Tested)");
    expect(opps[0]!.score).toBe(54.16);
    expect(opps[0]!.expectedProfitPct).toBe(14.4);
    expect(opps[0]!.listedPrice).toBe(10);
    expect(opps[0]!.targetSellPrice).toBe(13);
    expect(opps[0]!.volume24h).toBe(42);
    expect(body.scoredAt).not.toBeNull();
  });

  test("returns items sorted by score descending", async () => {
    await prisma.item.createMany({
      data: [
        { id: "Item High", name: "Item High", type: "Rifle", rarity: "Classified" },
        { id: "Item Low", name: "Item Low", type: "Rifle", rarity: "Classified" },
      ],
    });
    await prisma.opportunityScore.createMany({
      data: [
        {
          itemId: "Item Low",
          marketplace: Marketplace.SKINPORT,
          score: 1.0,
          expectedProfitPct: 5,
          listedPrice: 10,
          targetSellPrice: 11,
          volume24h: 5,
        },
        {
          itemId: "Item High",
          marketplace: Marketplace.SKINPORT,
          score: 8.0,
          expectedProfitPct: 20,
          listedPrice: 10,
          targetSellPrice: 14,
          volume24h: 20,
        },
      ],
    });

    const res = await app.request("/opportunities");
    const body = await json(res);
    const opps = body.opportunities as { itemId: string }[];
    expect(opps[0]!.itemId).toBe("Item High");
    expect(opps[1]!.itemId).toBe("Item Low");
  });

  test("excludes score = 0 items", async () => {
    await prisma.item.create({
      data: { id: "Loser", name: "Loser", type: "Rifle", rarity: "Mil-Spec" },
    });
    await prisma.opportunityScore.create({
      data: {
        itemId: "Loser",
        marketplace: Marketplace.SKINPORT,
        score: 0,
        expectedProfitPct: -5,
        listedPrice: 12,
        targetSellPrice: 12,
        volume24h: 5,
      },
    });

    const res = await app.request("/opportunities");
    const body = await json(res);
    expect(body.opportunities).toHaveLength(0);
    expect(body.total).toBe(0);
  });
});
