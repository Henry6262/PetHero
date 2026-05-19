import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { PrismaClient, Marketplace } from "@prisma/client";
import { createApp } from "../../src/api/api.server.ts";

const prisma = new PrismaClient();

// json() returns `unknown` in strict mode — typed cast for test assertions
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
  await prisma.saleEvent.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.priceSnapshot.deleteMany({});
  await prisma.item.deleteMany({});
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seedItem(id = "AK-47 | Redline (Field-Tested)") {
  return prisma.item.create({
    data: { id, name: id, type: "Rifle", rarity: "Classified" },
  });
}

async function seedSnapshot(itemId: string, minPrice: number, medianPrice: number) {
  return prisma.priceSnapshot.create({
    data: { itemId, marketplace: Marketplace.SKINPORT, minPrice, medianPrice, volume24h: 10 },
  });
}

// ─── GET /health ─────────────────────────────────────────────────────────────

test("GET /health returns 200 ok", async () => {
  const res = await app.request("/health");
  expect(res.status).toBe(200);
  const body = await json(res);
  expect(body.status).toBe("ok");
});

// ─── GET /items ───────────────────────────────────────────────────────────────

describe("GET /items", () => {
  test("returns empty items list when DB is empty", async () => {
    const res = await app.request("/items");
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.items).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  test("returns seeded items with total count", async () => {
    await seedItem("AK-47 | Redline (Field-Tested)");
    await seedItem("AWP | Dragon Lore (Factory New)");

    const res = await app.request("/items");
    const body = await json(res);
    expect(body.total).toBe(2);
    expect(body.items).toHaveLength(2);
  });

  test("respects limit query param", async () => {
    for (let i = 0; i < 5; i++) await seedItem(`Item ${i}`);

    const res = await app.request("/items?limit=3");
    const body = await json(res);
    expect(body.items).toHaveLength(3);
    expect(body.total).toBe(5);
    expect(body.limit).toBe(3);
  });

  test("respects page query param", async () => {
    for (let i = 0; i < 4; i++) await seedItem(`Item ${i}`);

    const res = await app.request("/items?page=2&limit=2");
    const body = await json(res);
    expect(body.items).toHaveLength(2);
    expect(body.page).toBe(2);
  });

  test("caps limit at 200", async () => {
    const res = await app.request("/items?limit=999");
    const body = await json(res);
    expect(body.limit).toBe(200);
  });
});

// ─── GET /items/:id/snapshots ─────────────────────────────────────────────────

describe("GET /items/:id/snapshots", () => {
  test("returns 404 for unknown item", async () => {
    const res = await app.request("/items/NonExistentItem/snapshots");
    expect(res.status).toBe(404);
  });

  test("returns empty snapshots for item with no price data", async () => {
    await seedItem();
    const res = await app.request(
      "/items/AK-47%20%7C%20Redline%20(Field-Tested)/snapshots",
    );
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.snapshots).toHaveLength(0);
  });

  test("returns snapshots ordered newest first", async () => {
    await seedItem();
    await seedSnapshot("AK-47 | Redline (Field-Tested)", 10, 12);
    await seedSnapshot("AK-47 | Redline (Field-Tested)", 11, 13);

    const res = await app.request(
      "/items/AK-47%20%7C%20Redline%20(Field-Tested)/snapshots",
    );
    const body = await json(res);
    expect(body.snapshots).toHaveLength(2);
    // Most recent first — higher price was added later
    const snaps = body.snapshots as { minPrice: string }[];
    expect(Number(snaps[0]?.minPrice)).toBe(11);
  });
});

// ─── GET /items/:id/sales ─────────────────────────────────────────────────────

describe("GET /items/:id/sales", () => {
  test("returns 404 for unknown item", async () => {
    const res = await app.request("/items/unknown/sales");
    expect(res.status).toBe(404);
  });

  test("returns empty sales for item with no sale events", async () => {
    await seedItem();
    const res = await app.request("/items/AK-47%20%7C%20Redline%20(Field-Tested)/sales");
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.sales).toHaveLength(0);
  });

  test("returns sale events ordered newest first", async () => {
    await seedItem();
    const earlier = new Date(Date.now() - 10000);
    await prisma.saleEvent.create({
      data: {
        id: "sale-1",
        itemId: "AK-47 | Redline (Field-Tested)",
        marketplace: Marketplace.SKINPORT,
        price: 10,
        soldAt: earlier,
      },
    });
    await prisma.saleEvent.create({
      data: {
        id: "sale-2",
        itemId: "AK-47 | Redline (Field-Tested)",
        marketplace: Marketplace.SKINPORT,
        price: 11,
        soldAt: new Date(),
      },
    });

    const res = await app.request("/items/AK-47%20%7C%20Redline%20(Field-Tested)/sales");
    const body = await json(res);
    const sales = body.sales as { price: string }[];
    expect(sales).toHaveLength(2);
    expect(Number(sales[0]?.price)).toBe(11); // most recent first
  });
});

// ─── GET /items/:id/price ─────────────────────────────────────────────────────

describe("GET /items/:id/price", () => {
  test("returns 404 when no price data exists", async () => {
    await seedItem();
    const res = await app.request("/items/AK-47%20%7C%20Redline%20(Field-Tested)/price");
    expect(res.status).toBe(404);
  });

  test("returns price summary with spreadPct", async () => {
    await seedItem();
    await seedSnapshot("AK-47 | Redline (Field-Tested)", 10, 12);

    const res = await app.request("/items/AK-47%20%7C%20Redline%20(Field-Tested)/price");
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.minPrice).toBe(10);
    expect(body.medianPrice).toBe(12);
    expect(body.spreadPct).toBeCloseTo(16.67, 1);
    expect(body.marketplace).toBe("SKINPORT");
  });
});
