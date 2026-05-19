import { test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import { PrismaClient, Marketplace } from "@prisma/client";
import { IngestionService } from "../../src/ingestion/ingestion.service.ts";
import { OpportunityService } from "../../src/opportunities/opportunity.service.ts";
import type { SkinportClient } from "../../src/ingestion/skinport.client.ts";
import type { SkinportWsHandler } from "../../src/ingestion/skinport.ws.ts";

const prisma = new PrismaClient();
beforeAll(() => prisma.$connect());
afterAll(() => prisma.$disconnect());
beforeEach(async () => {
  await prisma.tradeAttempt.deleteMany({});
  await prisma.opportunityScore.deleteMany({});
  await prisma.priceSnapshot.deleteMany({});
  await prisma.saleEvent.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.item.deleteMany({});
});

test("poll() writes OpportunityScore rows after snapshot writes", async () => {
  const fakeItems = [
    {
      market_hash_name: "AK-47 | Redline (Field-Tested)",
      currency: "USD",
      suggested_price: 13,
      item_page: "https://skinport.com/item/ak-47-redline",
      market_page: "https://skinport.com/market/730",
      min_price: 10,
      max_price: 20,
      mean_price: 13,
      median_price: 13,
      quantity: 42,
      created_at: 1700000000,
      updated_at: 1700000000,
    },
  ];

  const mockClient = {
    getItems: mock(async () => fakeItems),
  } as unknown as SkinportClient;

  const mockWsHandler = {
    onEvent: mock(() => mockWsHandler),
    onError: mock(() => mockWsHandler),
    connect: mock(() => {}),
    disconnect: mock(() => {}),
  } as unknown as SkinportWsHandler;

  const opportunityService = new OpportunityService(prisma);
  const ingestion = new IngestionService(
    prisma,
    mockClient,
    mockWsHandler,
    { currency: "USD", opportunityService },
  );

  await ingestion.poll();

  const scores = await prisma.opportunityScore.findMany();
  expect(scores.length).toBeGreaterThan(0);
  expect(scores[0]!.score).toBeGreaterThan(0);
});
