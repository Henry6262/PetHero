import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { PrismaClient, Marketplace } from "@prisma/client";
import { PricingService } from "../../src/pricing/pricing.service.ts";

const prisma = new PrismaClient();
const svc = new PricingService(prisma);

beforeAll(() => prisma.$connect());
afterAll(() => prisma.$disconnect());

beforeEach(async () => {
  // Delete in FK-safe order (children before parents)
  await prisma.saleEvent.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.priceSnapshot.deleteMany({});
  await prisma.item.deleteMany({});
});

async function seedItemAndSnapshot(
  itemId: string,
  minPrice: number,
  medianPrice: number,
  volume: number,
) {
  await prisma.item.upsert({
    where: { id: itemId },
    create: { id: itemId, name: itemId, type: "Rifle", rarity: "Classified" },
    update: {},
  });
  return prisma.priceSnapshot.create({
    data: {
      itemId,
      marketplace: Marketplace.SKINPORT,
      minPrice,
      medianPrice,
      volume24h: volume,
    },
  });
}

describe("PricingService.getPriceSummary", () => {
  test("returns null for unknown item", async () => {
    const result = await svc.getPriceSummary("nonexistent item");
    expect(result).toBeNull();
  });

  test("returns correct min, median, volume from latest snapshot", async () => {
    await seedItemAndSnapshot("AK-47 | Redline (Field-Tested)", 10.0, 12.0, 45);
    const result = await svc.getPriceSummary("AK-47 | Redline (Field-Tested)");

    expect(result).not.toBeNull();
    expect(result?.minPrice).toBe(10);
    expect(result?.medianPrice).toBe(12);
    expect(result?.volume24h).toBe(45);
    expect(result?.marketplace).toBe("SKINPORT");
  });

  test("calculates spreadPct correctly", async () => {
    // spread = (12 - 10) / 12 * 100 = 16.67%
    await seedItemAndSnapshot("AK-47 | Redline (Field-Tested)", 10.0, 12.0, 45);
    const result = await svc.getPriceSummary("AK-47 | Redline (Field-Tested)");
    expect(result?.spreadPct).toBeCloseTo(16.67, 1);
  });

  test("returns spreadPct null when medianPrice is 0", async () => {
    await seedItemAndSnapshot("AK-47 | Safari Mesh (Field-Tested)", 0, 0, 0);
    const result = await svc.getPriceSummary("AK-47 | Safari Mesh (Field-Tested)");
    expect(result?.spreadPct).toBeNull();
  });

  test("returns the LATEST snapshot when multiple exist", async () => {
    const itemId = "AWP | Dragon Lore (Factory New)";
    await prisma.item.upsert({
      where: { id: itemId },
      create: { id: itemId, name: itemId, type: "Sniper Rifle", rarity: "Covert" },
      update: {},
    });
    // Older snapshot
    await prisma.priceSnapshot.create({
      data: {
        itemId,
        marketplace: Marketplace.SKINPORT,
        minPrice: 4800,
        medianPrice: 5000,
        volume24h: 2,
        snappedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
      },
    });
    // Newer snapshot
    await prisma.priceSnapshot.create({
      data: {
        itemId,
        marketplace: Marketplace.SKINPORT,
        minPrice: 5100,
        medianPrice: 5300,
        volume24h: 3,
        snappedAt: new Date(),
      },
    });

    const result = await svc.getPriceSummary(itemId);
    expect(result?.minPrice).toBe(5100); // newer snapshot
  });
});

describe("PricingService.getAllPriceSummaries", () => {
  test("returns empty array when no snapshots exist", async () => {
    const result = await svc.getAllPriceSummaries();
    expect(result).toHaveLength(0);
  });

  test("returns one summary per item (latest snapshot only)", async () => {
    await seedItemAndSnapshot("AK-47 | Redline (Field-Tested)", 10, 12, 45);
    await seedItemAndSnapshot("AWP | Dragon Lore (Factory New)", 5000, 5500, 2);

    const result = await svc.getAllPriceSummaries();
    expect(result).toHaveLength(2);
    const itemIds = result.map(r => r.itemId).sort();
    expect(itemIds).toEqual(
      ["AK-47 | Redline (Field-Tested)", "AWP | Dragon Lore (Factory New)"].sort(),
    );
  });
});
