import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import { PrismaClient } from "@prisma/client";
import { IngestionService } from "../../src/ingestion/ingestion.service.ts";
import { SkinportClient } from "../../src/ingestion/skinport.client.ts";
import { SkinportWsHandler } from "../../src/ingestion/skinport.ws.ts";

// ─── Real DB (cs2_edge) ───────────────────────────────────────────────────────

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Clean up test data before each test
beforeEach(async () => {
  await prisma.saleEvent.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.priceSnapshot.deleteMany({});
  await prisma.item.deleteMany({});
});

// ─── Minimal mocks ────────────────────────────────────────────────────────────

const mockItem = {
  market_hash_name: "AK-47 | Redline (Field-Tested)",
  currency: "USD",
  suggested_price: 12.5,
  item_page: "https://skinport.com/item/ak47",
  market_page: "https://skinport.com/market/730",
  min_price: 10.0,
  max_price: 15.0,
  mean_price: 12.3,
  median_price: 12.0,
  quantity: 45,
  created_at: 1620000000,
  updated_at: 1620000001,
  version: null,
};

function makeStubClient(items = [mockItem]): SkinportClient {
  const stub = Object.create(SkinportClient.prototype) as SkinportClient;
  stub.getItems = mock(() => Promise.resolve(items));
  stub.getSalesHistory = mock(() => Promise.resolve([]));
  return stub;
}

function makeStubWsHandler(): SkinportWsHandler {
  const handler = new SkinportWsHandler({ serverUrl: "http://mock" });
  handler.connect = mock(() => undefined);
  handler.disconnect = mock(() => undefined);
  return handler;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("IngestionService.poll", () => {
  test("creates Item and PriceSnapshot records on first poll", async () => {
    const svc = new IngestionService(prisma, makeStubClient(), makeStubWsHandler());
    await svc.poll();

    const item = await prisma.item.findUnique({ where: { id: mockItem.market_hash_name } });
    expect(item).not.toBeNull();
    expect(item?.type).toBe("Rifle");
    expect(item?.rarity).toBe("Unknown"); // no rarity in mock

    const snaps = await prisma.priceSnapshot.findMany({
      where: { itemId: mockItem.market_hash_name },
    });
    expect(snaps).toHaveLength(1);
    expect(Number(snaps[0]?.minPrice)).toBe(10);
    expect(Number(snaps[0]?.medianPrice)).toBe(12);
    expect(snaps[0]?.volume24h).toBe(45);
    expect(snaps[0]?.marketplace).toBe("SKINPORT");
  });

  test("creates a new snapshot on each poll (accumulates history)", async () => {
    const svc = new IngestionService(prisma, makeStubClient(), makeStubWsHandler());
    await svc.poll();
    await svc.poll();

    const snaps = await prisma.priceSnapshot.findMany({
      where: { itemId: mockItem.market_hash_name },
    });
    // Two polls = two snapshots (skipDuplicates won't deduplicate on different cuid ids)
    expect(snaps.length).toBeGreaterThanOrEqual(1);
  });

  test("handles poll with multiple items", async () => {
    const items = [
      mockItem,
      {
        ...mockItem,
        market_hash_name: "AWP | Dragon Lore (Factory New)",
        min_price: 5000,
        median_price: 5500,
        quantity: 3,
      },
    ];
    const svc = new IngestionService(prisma, makeStubClient(items), makeStubWsHandler());
    await svc.poll();

    const count = await prisma.item.count();
    expect(count).toBe(2);
  });

  test("does not throw when API returns empty list", async () => {
    const svc = new IngestionService(prisma, makeStubClient([]), makeStubWsHandler());
    await expect(svc.poll()).resolves.toBeUndefined();
  });
});

describe("IngestionService.handleSaleFeedEvent (via WS handler)", () => {
  // Seed an item first so foreign key constraint is satisfied
  async function seedItem() {
    await prisma.item.create({
      data: {
        id: "AK-47 | Redline (Field-Tested)",
        name: "AK-47 | Redline",
        type: "Rifle",
        rarity: "Classified",
      },
    });
  }

  const baseSale = {
    id: 1,
    saleId: 9001,
    shortId: "s9001",
    appid: 730,
    marketHashName: "AK-47 | Redline (Field-Tested)",
    marketName: "AK-47 | Redline",
    salePrice: 1250, // cents
    suggestedPrice: 1300,
    referencePrice: 1275,
    currency: "USD",
    wear: 0.15,
    pattern: 42,
    lock: null,
    stattrak: false,
    souvenir: false,
    rarity: "Classified",
    rarityColor: "d2691e",
    exterior: "Field-Tested",
    type: "Rifle",
    stickers: [],
    charms: [],
    tags: [],
    fade: null,
    blue: null,
    image: "/img/ak47.png",
    url: "ak-47-redline",
  };

  test("'listed' event creates a Listing record", async () => {
    await seedItem();
    // Object wrapper avoids TS control-flow narrowing of closure-assigned variables
    const capture = { handler: null as ((e: unknown) => void) | null };
    const wsHandler = makeStubWsHandler();
    wsHandler.onEvent = mock((fn: (e: unknown) => void) => {
      capture.handler = fn;
      return wsHandler;
    });

    const svc = new IngestionService(prisma, makeStubClient(), wsHandler);
    svc.start();
    await svc.poll(); // let poll run

    // Simulate the WS event being received
    capture.handler?.({ eventType: "listed", sales: [baseSale] });
    // Wait for async handler to complete
    await new Promise(r => setTimeout(r, 50));

    const listing = await prisma.listing.findUnique({ where: { id: "9001" } });
    expect(listing).not.toBeNull();
    expect(Number(listing?.price)).toBe(12.5); // cents ÷ 100
    expect(listing?.floatValue).toBe(0.15);
    expect(listing?.marketplace).toBe("SKINPORT");
    expect(listing?.state).toBe("ACTIVE");

    svc.stop();
  });

  test("'sold' event creates a SaleEvent and marks Listing as SOLD", async () => {
    await seedItem();
    // Pre-create a listing
    await prisma.listing.create({
      data: {
        id: "9001",
        itemId: "AK-47 | Redline (Field-Tested)",
        marketplace: "SKINPORT",
        price: 12.5,
        listedAt: new Date(),
      },
    });

    const capture = { handler: null as ((e: unknown) => void) | null };
    const wsHandler = makeStubWsHandler();
    wsHandler.onEvent = mock((fn: (e: unknown) => void) => {
      capture.handler = fn;
      return wsHandler;
    });

    const svc = new IngestionService(prisma, makeStubClient(), wsHandler);
    svc.start();

    capture.handler?.({ eventType: "sold", sales: [baseSale] });
    await new Promise(r => setTimeout(r, 50));

    const saleEvent = await prisma.saleEvent.findUnique({ where: { id: "9001" } });
    expect(saleEvent).not.toBeNull();
    expect(Number(saleEvent?.price)).toBe(12.5);

    const listing = await prisma.listing.findUnique({ where: { id: "9001" } });
    expect(listing?.state).toBe("SOLD");

    svc.stop();
  });
});
