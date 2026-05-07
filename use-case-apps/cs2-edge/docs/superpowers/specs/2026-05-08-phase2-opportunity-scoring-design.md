# Phase 2: Opportunity Scoring — Design Spec

## Context

Phase 1 built the data foundation: Skinport ingestion, normalized item catalog, price history, Hono API. Phase 2 adds the first real signal: a ranked list of underpriced items, structured for the Phase 4 execution layer to act on.

## Goal

Compute a composite opportunity score for every tracked item after each ingestion poll. Expose a ranked list via `GET /opportunities` that the execution layer can query to decide what to buy.

---

## Scoring Model

### Formula

```
netProfitPct = (median × 0.88 − min) / min × 100
score        = netProfitPct × log(volume24h + 1)   // 0 if netProfitPct ≤ 0
```

- `min` = current floor price (minPrice from latest PriceSnapshot)
- `median` = expected resale price (medianPrice from latest PriceSnapshot)
- `0.88` = Skinport seller fee factor (12% taken from seller)
- `log(volume24h + 1)` = liquidity multiplier — suppresses illiquid items with large spreads

### Rationale

- `netProfitPct` is real take-home profit, not gross spread — avoids ranking items where fees eat the margin
- Liquidity multiplier ensures a liquid item with a 15% margin outranks an illiquid item with a 40% margin but zero daily volume
- No ML required: pure stats model on data we already have. XGBoost upgrade deferred to Phase 3 once we have weeks of snapshot history for feature engineering

---

## Data Model

One new table, composite PK — one live score row per item-marketplace pair, overwritten each poll.

```prisma
model OpportunityScore {
  itemId            String
  marketplace       Marketplace
  score             Float
  expectedProfitPct Float
  listedPrice       Decimal
  targetSellPrice   Decimal
  volume24h         Int
  scoredAt          DateTime    @updatedAt
  item              Item        @relation(fields: [itemId], references: [id])

  @@id([itemId, marketplace])
}
```

No score history stored — the `PriceSnapshot` table provides the raw history needed for Phase 3 ML feature engineering.

---

## Service Layer

### OpportunityService (`src/opportunities/opportunity.service.ts`)

```typescript
class OpportunityService {
  async scoreAll(marketplace: Marketplace): Promise<void>
  async getRanked(marketplace: Marketplace): Promise<OpportunityScore[]>
}
```

**`scoreAll`:**
1. Calls `PricingService.getAllPriceSummaries(marketplace)`
2. Applies formula to each summary; items where `netProfitPct ≤ 0` get `score = 0`
3. Upserts all scores in chunks of 200 via `prisma.$transaction([...upserts])` — Prisma has no native `upsertMany`, so we batch individual `upsert` calls inside a transaction

**`getRanked`:**
1. Queries `OpportunityScore` where `score > 0`, ordered `score DESC`
2. Returns full rows — no additional computation

### Wiring into IngestionService

After each poll's snapshot writes complete, `IngestionService` calls `opportunityService.scoreAll(marketplace)`. Scoring is best-effort — a scoring failure does not abort the poll.

---

## API

### `GET /opportunities`

Query params:
- `marketplace` (optional, default: `SKINPORT`)

Response:
```json
{
  "opportunities": [
    {
      "itemId": "AK-47 | Redline (Field-Tested)",
      "marketplace": "SKINPORT",
      "score": 4.23,
      "expectedProfitPct": 18.5,
      "listedPrice": 10.50,
      "targetSellPrice": 13.00,
      "volume24h": 42,
      "scoredAt": "2026-05-08T12:00:00Z"
    }
  ],
  "total": 3241,
  "scoredAt": "2026-05-08T12:00:00Z"
}
```

`scoredAt` at the response level is the `MAX(scoredAt)` of the returned rows — tells the execution layer when scores were last refreshed.

---

## New Files

| File | Purpose |
|---|---|
| `src/opportunities/opportunity.service.ts` | Scoring logic + DB writes |
| `src/api/routes/opportunities.route.ts` | GET /opportunities handler |
| `tests/opportunities/opportunity.service.test.ts` | Unit tests for scoring math + integration tests |
| `tests/api/opportunities.test.ts` | API endpoint integration tests |
| `prisma/migrations/…` | `OpportunityScore` table migration |

---

## Testing Strategy

| Test | Type | What it covers |
|---|---|---|
| Scoring formula | Unit (pure function) | netProfitPct + score math, edge cases (zero volume, zero median, negative profit) |
| scoreAll() | Integration (test DB) | Seeded snapshots → correct scores written to DB |
| getRanked() | Integration (test DB) | Returns items sorted score desc, excludes score = 0 |
| GET /opportunities | Integration (Hono test client + DB) | Empty state 200, seeded data returns ranked list, marketplace filter |

---

## Phase 3 Forward-Compatibility

The `OpportunityScore` table schema is designed so Phase 4's execution layer can read it directly:
- `itemId` + `marketplace` → enough to fetch the live listing at buy time
- `expectedProfitPct` → threshold filter for the auto-buyer
- `score` → ranking/priority for the execution queue

Phase 3 (XGBoost fair value model) will replace the formula in `scoreAll()` with a model prediction. The table schema and API contract stay unchanged.
