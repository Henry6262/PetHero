# Phase 2: Opportunity Scoring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Score every tracked CS2 item after each ingestion poll and expose a ranked opportunity list via `GET /opportunities` for the Phase 4 execution layer.

**Architecture:** A new `OpportunityService` computes a composite score (`netProfitPct × log(volume+1)`) from the latest `PriceSnapshot` per item, writes one `OpportunityScore` row per item (upserted), and exposes results through a Hono route. `IngestionService.poll()` calls `scoreAll()` best-effort after snapshot writes.

**Tech Stack:** Bun, TypeScript strict mode, Hono, Prisma 6, PostgreSQL, `bun:test`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/opportunities/opportunity.service.ts` | `computeScore()` pure fn + `OpportunityService` class |
| Create | `src/api/routes/opportunities.route.ts` | `GET /opportunities` Hono handler |
| Create | `tests/opportunities/opportunity.service.test.ts` | Unit + integration tests for scoring |
| Create | `tests/api/opportunities.test.ts` | API endpoint integration tests |
| Modify | `prisma/schema.prisma` | Add `OpportunityScore` model + relation on `Item` |
| Modify | `src/ingestion/ingestion.service.ts` | Accept + call `OpportunityService` in `poll()` |
| Modify | `src/api/api.server.ts` | Register `/opportunities` route |
| Modify | `src/index.ts` | Instantiate `OpportunityService`, pass to `IngestionService` |

---

## Task 1: Prisma Schema — Add OpportunityScore Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add OpportunityScore model and Item relation to schema.prisma**

Open `prisma/schema.prisma`. Add `opportunityScores OpportunityScore[]` to the `Item` model's relations block, and append the new model at the end of the file:

```prisma
// Add this line to the existing Item model's relations:
opportunityScores OpportunityScore[]

// Append this new model:
model OpportunityScore {
  itemId            String
  marketplace       Marketplace
  score             Float
  expectedProfitPct Float
  listedPrice       Decimal     @db.Decimal(12, 2)
  targetSellPrice   Decimal     @db.Decimal(12, 2)
  volume24h         Int
  scoredAt          DateTime    @updatedAt
  item              Item        @relation(fields: [itemId], references: [id])

  @@id([itemId, marketplace])
  @@index([marketplace, score])
}
```

- [ ] **Step 2: Run migration**

```bash
cd use-case-apps/cs2-edge && bunx prisma migrate dev --name add-opportunity-score
```

Expected output:
```
Applying migration `..._add_opportunity_score`
Your database is now in sync with your schema.
```

- [ ] **Step 3: Verify existing tests still pass**

```bash
bun --cwd use-case-apps/cs2-edge test tests/
```

Expected: all existing tests green, no type errors.

- [ ] **Step 4: Commit**

```bash
git add use-case-apps/cs2-edge/prisma/ && git commit -m "feat: add OpportunityScore prisma model"
```

---

## Task 2: computeScore() Pure Function

**Files:**
- Create: `src/opportunities/opportunity.service.ts`
- Create: `tests/opportunities/opportunity.service.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/opportunities/opportunity.service.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
bun --cwd use-case-apps/cs2-edge test tests/opportunities/opportunity.service.test.ts
```

Expected: `error: Cannot find module '../../src/opportunities/opportunity.service.ts'`

- [ ] **Step 3: Create the service file with computeScore**

Create `src/opportunities/opportunity.service.ts`:

```typescript
import { PrismaClient, Marketplace, type OpportunityScore } from "@prisma/client";
import { PricingService } from "../pricing/pricing.service.ts";

export function computeScore(
  min: number,
  median: number,
  volume24h: number,
): { score: number; expectedProfitPct: number } {
  if (min <= 0) return { score: 0, expectedProfitPct: 0 };
  const netProfitPct = ((median * 0.88 - min) / min) * 100;
  const score =
    netProfitPct > 0
      ? Math.round(netProfitPct * Math.log(volume24h + 1) * 10000) / 10000
      : 0;
  return {
    score,
    expectedProfitPct: Math.round(netProfitPct * 100) / 100,
  };
}

export class OpportunityService {
  private readonly pricing: PricingService;

  constructor(private readonly prisma: PrismaClient) {
    this.pricing = new PricingService(prisma);
  }

  async scoreAll(_marketplace: Marketplace = Marketplace.SKINPORT): Promise<void> {
    throw new Error("not implemented");
  }

  async getRanked(_marketplace: Marketplace = Marketplace.SKINPORT): Promise<OpportunityScore[]> {
    throw new Error("not implemented");
  }
}
```

- [ ] **Step 4: Run to confirm computeScore tests pass**

```bash
bun --cwd use-case-apps/cs2-edge test tests/opportunities/opportunity.service.test.ts
```

Expected: 5 tests pass (the `scoreAll`/`getRanked` tests don't exist yet).

- [ ] **Step 5: Commit**

```bash
git add use-case-apps/cs2-edge/src/opportunities/ use-case-apps/cs2-edge/tests/opportunities/ && git commit -m "feat: computeScore pure function with unit tests"
```

---

## Task 3: OpportunityService.scoreAll()

**Files:**
- Modify: `src/opportunities/opportunity.service.ts`
- Modify: `tests/opportunities/opportunity.service.test.ts`

- [ ] **Step 1: Add failing integration tests for scoreAll()**

Append to `tests/opportunities/opportunity.service.test.ts` (after the existing imports, add the DB setup; after the existing describe block, add this new one):

```typescript
import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { PrismaClient, Marketplace } from "@prisma/client";
import { computeScore, OpportunityService } from "../../src/opportunities/opportunity.service.ts";

const prisma = new PrismaClient();
beforeAll(() => prisma.$connect());
afterAll(() => prisma.$disconnect());
beforeEach(async () => {
  await prisma.opportunityScore.deleteMany({});
  await prisma.priceSnapshot.deleteMany({});
  await prisma.item.deleteMany({});
});
```

Note: the `describe("computeScore", ...)` block already exists from Task 2. Append the new describe block below it:

```typescript
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
bun --cwd use-case-apps/cs2-edge test tests/opportunities/opportunity.service.test.ts
```

Expected: `Error: not implemented` from `scoreAll`.

- [ ] **Step 3: Implement scoreAll()**

Replace the `scoreAll` stub in `src/opportunities/opportunity.service.ts`:

```typescript
async scoreAll(marketplace: Marketplace = Marketplace.SKINPORT): Promise<void> {
  const summaries = await this.pricing.getAllPriceSummaries(marketplace);
  if (summaries.length === 0) return;

  const CHUNK_SIZE = 200;
  for (let i = 0; i < summaries.length; i += CHUNK_SIZE) {
    const chunk = summaries.slice(i, i + CHUNK_SIZE);
    await this.prisma.$transaction(
      chunk.map(s => {
        const { score, expectedProfitPct } = computeScore(s.minPrice, s.medianPrice, s.volume24h);
        return this.prisma.opportunityScore.upsert({
          where: {
            itemId_marketplace: { itemId: s.itemId, marketplace: s.marketplace },
          },
          create: {
            itemId: s.itemId,
            marketplace: s.marketplace,
            score,
            expectedProfitPct,
            listedPrice: s.minPrice,
            targetSellPrice: s.medianPrice,
            volume24h: s.volume24h,
          },
          update: {
            score,
            expectedProfitPct,
            listedPrice: s.minPrice,
            targetSellPrice: s.medianPrice,
            volume24h: s.volume24h,
          },
        });
      }),
    );
  }
}
```

- [ ] **Step 4: Run to confirm scoreAll tests pass**

```bash
bun --cwd use-case-apps/cs2-edge test tests/opportunities/opportunity.service.test.ts
```

Expected: all tests green.

- [ ] **Step 5: Commit**

```bash
git add use-case-apps/cs2-edge/src/opportunities/ use-case-apps/cs2-edge/tests/opportunities/ && git commit -m "feat: OpportunityService.scoreAll with chunked upserts"
```

---

## Task 4: OpportunityService.getRanked()

**Files:**
- Modify: `src/opportunities/opportunity.service.ts`
- Modify: `tests/opportunities/opportunity.service.test.ts`

- [ ] **Step 1: Add failing tests for getRanked()**

Append to `tests/opportunities/opportunity.service.test.ts`:

```typescript
describe("OpportunityService.getRanked", () => {
  test("returns items sorted by score descending", async () => {
    await prisma.item.createMany({
      data: [
        { id: "Item A", name: "Item A", type: "Rifle", rarity: "Classified" },
        { id: "Item B", name: "Item B", type: "Rifle", rarity: "Classified" },
      ],
    });
    await prisma.opportunityScore.createMany({
      data: [
        {
          itemId: "Item A",
          marketplace: Marketplace.SKINPORT,
          score: 2.5,
          expectedProfitPct: 10,
          listedPrice: 10,
          targetSellPrice: 12,
          volume24h: 10,
        },
        {
          itemId: "Item B",
          marketplace: Marketplace.SKINPORT,
          score: 7.0,
          expectedProfitPct: 25,
          listedPrice: 8,
          targetSellPrice: 12,
          volume24h: 30,
        },
      ],
    });

    const service = new OpportunityService(prisma);
    const ranked = await service.getRanked(Marketplace.SKINPORT);

    expect(ranked).toHaveLength(2);
    expect(ranked[0]!.itemId).toBe("Item B");
    expect(ranked[1]!.itemId).toBe("Item A");
  });

  test("excludes items with score = 0", async () => {
    await prisma.item.create({
      data: { id: "Loser Item", name: "Loser Item", type: "Rifle", rarity: "Mil-Spec" },
    });
    await prisma.opportunityScore.create({
      data: {
        itemId: "Loser Item",
        marketplace: Marketplace.SKINPORT,
        score: 0,
        expectedProfitPct: -5,
        listedPrice: 12,
        targetSellPrice: 12,
        volume24h: 5,
      },
    });

    const service = new OpportunityService(prisma);
    const ranked = await service.getRanked(Marketplace.SKINPORT);
    expect(ranked).toHaveLength(0);
  });

  test("returns empty array when table is empty", async () => {
    const service = new OpportunityService(prisma);
    const ranked = await service.getRanked(Marketplace.SKINPORT);
    expect(ranked).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
bun --cwd use-case-apps/cs2-edge test tests/opportunities/opportunity.service.test.ts
```

Expected: `Error: not implemented` from `getRanked`.

- [ ] **Step 3: Implement getRanked()**

Replace the `getRanked` stub in `src/opportunities/opportunity.service.ts`:

```typescript
async getRanked(marketplace: Marketplace = Marketplace.SKINPORT): Promise<OpportunityScore[]> {
  return this.prisma.opportunityScore.findMany({
    where: { marketplace, score: { gt: 0 } },
    orderBy: { score: "desc" },
  });
}
```

- [ ] **Step 4: Run to confirm all service tests pass**

```bash
bun --cwd use-case-apps/cs2-edge test tests/opportunities/opportunity.service.test.ts
```

Expected: all tests green.

- [ ] **Step 5: Commit**

```bash
git add use-case-apps/cs2-edge/src/opportunities/ use-case-apps/cs2-edge/tests/opportunities/ && git commit -m "feat: OpportunityService.getRanked sorted by score"
```

---

## Task 5: Wire OpportunityService into IngestionService

**Files:**
- Modify: `src/ingestion/ingestion.service.ts`
- Modify: `src/index.ts`
- Create: `tests/ingestion/ingestion.opportunity.test.ts`

- [ ] **Step 1: Write the failing wiring test**

Create `tests/ingestion/ingestion.opportunity.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
bun --cwd use-case-apps/cs2-edge test tests/ingestion/ingestion.opportunity.test.ts
```

Expected: TypeScript error — `opportunityService` is not a known option on `IngestionServiceOptions`.

- [ ] **Step 3: Add opportunityService to IngestionServiceOptions**

In `src/ingestion/ingestion.service.ts`, update the interface and constructor:

```typescript
// Add import at top of file:
import { OpportunityService } from "../opportunities/opportunity.service.ts";

// Update IngestionServiceOptions:
export interface IngestionServiceOptions {
  currency?: string;
  appId?: number;
  opportunityService?: OpportunityService;
}

// Add private field before constructor (after existing private fields):
private readonly opportunityService?: OpportunityService;

// In the constructor body, add:
this.opportunityService = opts.opportunityService;
```

- [ ] **Step 4: Wire scoreAll() call inside poll()**

In `src/ingestion/ingestion.service.ts`, inside `poll()`, add a best-effort scoring call after the `priceSnapshot.createMany` call and before the completion log:

```typescript
// After the existing priceSnapshot.createMany block, before the console.log:
if (this.opportunityService) {
  try {
    await this.opportunityService.scoreAll(Marketplace.SKINPORT);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ingestion] opportunity scoring error: ${msg}`);
  }
}
```

- [ ] **Step 5: Run to confirm wiring test passes**

```bash
bun --cwd use-case-apps/cs2-edge test tests/ingestion/ingestion.opportunity.test.ts
```

Expected: 1 test passes.

- [ ] **Step 6: Run all tests to check for regressions**

```bash
bun --cwd use-case-apps/cs2-edge test tests/
```

Expected: all tests green.

- [ ] **Step 7: Update src/index.ts to pass opportunityService**

In `src/index.ts`, add `OpportunityService` import and pass it to `IngestionService`:

```typescript
// Add import:
import { OpportunityService } from "./opportunities/opportunity.service.ts";

// Add before ingestion instantiation:
const opportunityService = new OpportunityService(prisma);

// Update IngestionService instantiation:
const ingestion = new IngestionService(prisma, skinportClient, wsHandler, {
  currency: CURRENCY,
  opportunityService,
});
```

- [ ] **Step 8: Commit**

```bash
git add use-case-apps/cs2-edge/src/ use-case-apps/cs2-edge/tests/ingestion/ && git commit -m "feat: wire OpportunityService into IngestionService.poll"
```

---

## Task 6: GET /opportunities API Endpoint

**Files:**
- Create: `src/api/routes/opportunities.route.ts`
- Modify: `src/api/api.server.ts`
- Create: `tests/api/opportunities.test.ts`

- [ ] **Step 1: Write the failing API tests**

Create `tests/api/opportunities.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
bun --cwd use-case-apps/cs2-edge test tests/api/opportunities.test.ts
```

Expected: `404` for `/opportunities` — route not registered yet.

- [ ] **Step 3: Create the opportunities route**

Create `src/api/routes/opportunities.route.ts`:

```typescript
import { Hono } from "hono";
import { PrismaClient, Marketplace } from "@prisma/client";
import { OpportunityService } from "../../opportunities/opportunity.service.ts";

export function opportunitiesRouter(prisma: PrismaClient) {
  const app = new Hono();
  const opportunities = new OpportunityService(prisma);

  app.get("/", async c => {
    const marketplaceParam = (c.req.query("marketplace") ?? "SKINPORT").toUpperCase();
    const marketplace = Object.values(Marketplace).includes(marketplaceParam as Marketplace)
      ? (marketplaceParam as Marketplace)
      : Marketplace.SKINPORT;

    const ranked = await opportunities.getRanked(marketplace);

    return c.json({
      opportunities: ranked.map(r => ({
        itemId: r.itemId,
        marketplace: r.marketplace,
        score: r.score,
        expectedProfitPct: r.expectedProfitPct,
        listedPrice: Number(r.listedPrice),
        targetSellPrice: Number(r.targetSellPrice),
        volume24h: r.volume24h,
        scoredAt: r.scoredAt,
      })),
      total: ranked.length,
      scoredAt: ranked[0]?.scoredAt ?? null,
    });
  });

  return app;
}
```

- [ ] **Step 4: Register route in api.server.ts**

In `src/api/api.server.ts`, add the import and route registration:

```typescript
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { itemsRouter } from "./routes/items.route.ts";
import { opportunitiesRouter } from "./routes/opportunities.route.ts";

export function createApp(prisma: PrismaClient) {
  const app = new Hono();

  app.get("/health", c => c.json({ status: "ok" }));
  app.route("/items", itemsRouter(prisma));
  app.route("/opportunities", opportunitiesRouter(prisma));

  return app;
}
```

- [ ] **Step 5: Run to confirm all API tests pass**

```bash
bun --cwd use-case-apps/cs2-edge test tests/api/opportunities.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 6: Run full test suite**

```bash
bun --cwd use-case-apps/cs2-edge test tests/
```

Expected: all tests green (71 existing + new tests).

- [ ] **Step 7: Commit**

```bash
git add use-case-apps/cs2-edge/src/api/ use-case-apps/cs2-edge/tests/api/ && git commit -m "feat: GET /opportunities endpoint — Phase 2 complete"
```

---

## Verification

After all tasks complete, run the full test suite one final time:

```bash
bun --cwd use-case-apps/cs2-edge test tests/
```

Expected: all tests green.

Then check TypeScript:

```bash
bun --cwd use-case-apps/cs2-edge run node_modules/.bin/tsc -p tsconfig.json --noEmit
```

Expected: no errors.
