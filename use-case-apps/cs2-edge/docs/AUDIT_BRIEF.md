# CS2 Edge Audit Brief

## Purpose

`cs2-edge` is a local CS2 skin market scanning and trade-selection system.

Its current purpose is:

1. Ingest live Skinport market data.
2. Store price history and scored opportunities in Postgres.
3. Rank candidate flips using a simple profit-and-liquidity model.
4. Run an execution loop that can record paper trades now and support controlled live buying later.
5. Produce persistent metrics that can feed a dashboard and support operator decisions.

This document is intended for an AI agent or auditor with zero prior context.

## Repo Location

Project root:

`/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge`

Key files:

- [`package.json`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/package.json:1)
- [`src/index.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/index.ts:1)
- [`prisma/schema.prisma`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/prisma/schema.prisma:1)
- [`src/ingestion/ingestion.service.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/ingestion/ingestion.service.ts:1)
- [`src/opportunities/opportunity.service.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/opportunities/opportunity.service.ts:1)
- [`src/execution/execution.service.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/execution/execution.service.ts:1)
- [`src/api/api.server.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/api/api.server.ts:1)
- [`src/api/routes/execution.route.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/api/routes/execution.route.ts:1)
- [`smoke-test.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/smoke-test.ts:1)
- [`docker-compose.yml`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/docker-compose.yml:1)

## Product Summary

Today this is a working local prototype, not a validated profitable trading business.

What works:

- Local Postgres stack
- Live Skinport ingestion
- Live price snapshot storage
- Opportunity scoring
- Hono API
- Paper-trade recording
- Execution-cycle metrics
- Durable export snapshots
- Separate live/test databases

What is not yet proven:

- That the ranked opportunities are genuinely executable at scale
- That estimated profits survive slippage, latency, relisting friction, and stale data
- That the current strategy has positive realized expectancy
- That live buying logic is safe enough to run with real capital

## Current Operating Model

### Data Sources

Primary source:

- Skinport REST API for item pricing
- Skinport WebSocket feed for listing/sale activity

Current code references:

- [`src/ingestion/skinport.client.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/ingestion/skinport.client.ts:1)
- [`src/ingestion/skinport.ws.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/ingestion/skinport.ws.ts:1)

### Storage

Postgres via Prisma.

Live DB:

- `cs2_edge_live`

Test DB:

- `cs2_edge_test`

The test DB exists specifically so smoke tests do not wipe live data.

### Runtime

The app entrypoint is [`src/index.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/index.ts:1).

It does the following:

1. Starts ingestion.
2. Starts the Steam service if credentials exist.
3. Starts the HTTP API on port `3000` by default.
4. Runs the execution loop every 60 seconds.

## Strategy Definition

This section is the core answer to "how is the strategy defined?"

### Strategy Goal

Buy items whose current Skinport listing price appears meaningfully below an estimated resale value, while preferring items with enough daily liquidity to exit.

### Current Core Formula

The current opportunity logic is defined in [`src/opportunities/opportunity.service.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/opportunities/opportunity.service.ts:1).

Base estimated profit percentage:

```text
expectedProfitPct = ((medianPrice * 0.88 - minPrice) / minPrice) * 100
```

Where:

- `minPrice` = current floor listing price
- `medianPrice` = current median market price
- `0.88` = assumed resale proceeds after a 12% fee

Composite ranking score:

```text
score = expectedProfitPct * log(volume24h + 1)
```

This means the current system prefers:

- higher theoretical margin
- higher 24h liquidity

It deprioritizes:

- low-liquidity items with huge but slow theoretical spreads

### Current Trade Filters

The execution loop applies additional filters in [`src/execution/execution.service.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/execution/execution.service.ts:1):

- `minScore`
- `minProfitPct`
- `minBuyPrice`
- `maxSpendPerTrade`
- `minConfidence`

Current practical behavior:

- If ML is disabled, confidence threshold defaults to `0.0`
- If ML is enabled via `ML_SERVICE_URL`, confidence threshold defaults to `0.4`

### ML Status

ML is currently optional.

If `ML_SERVICE_URL` is not set:

- no ML requests are made
- no ML error spam occurs
- scoring falls back to the base mathematical model only

If `ML_SERVICE_URL` is set:

- the app will attempt to enrich opportunities with predicted value and confidence

Current ML code:

- [`src/opportunities/ml.client.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/opportunities/ml.client.ts:1)

### Important Strategy Weaknesses

The current strategy is simple and likely overstates edge in some cases.

Known reasons:

1. It uses current median price as the resale anchor.
2. It does not model queue position or time-to-exit.
3. It does not model stale listings or disappearing listings.
4. It does not model float, pattern, stickers, or item-specific attributes beyond basic catalog fields.
5. It assumes 12% resale fees as a flat rule.
6. It does not model capital lock-up cost.
7. It does not validate that the destination market is where resale actually occurs.

## Database Model

Main tables in [`prisma/schema.prisma`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/prisma/schema.prisma:1):

- `Item`
  - canonical item catalog
- `PriceSnapshot`
  - periodic pricing history
- `Listing`
  - listing state from the live feed
- `SaleEvent`
  - sold listing events
- `OpportunityScore`
  - latest scored opportunity per item/marketplace
- `TradeAttempt`
  - paper or live trade attempts with expected net profit
- `ExecutionCycle`
  - one record per execution pass so the operator can see why nothing or something happened

### Why `ExecutionCycle` Exists

This was added because previously the system could be "doing work" while leaving no persistent evidence of why no trades were taken.

Now every cycle can answer:

- how many candidates existed
- how many passed filters
- how many were affordable
- which item was selected
- whether the cycle was paper, live, skipped, failed, or empty
- what the stated reason was

## API Surface

### Health

`GET /health`

Purpose:

- liveness check

### Items

`GET /items`

Purpose:

- browse tracked catalog

`GET /items/:id/snapshots`

Purpose:

- inspect price history for a specific item

`GET /items/:id/sales`

Purpose:

- inspect sale history for a specific item

`GET /items/:id/price`

Purpose:

- get current summarized price view

### Opportunities

`GET /opportunities`

Purpose:

- view currently ranked opportunity list

### Execution Metrics

`GET /execution/metrics`

Purpose:

- dashboard-ready summary of:
  - aggregate attempts
  - paper attempts
  - successes
  - failures
  - accumulated expected net profit
  - latest execution cycle
  - recent attempts
  - recent cycles

Route implementation:

- [`src/api/routes/execution.route.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/api/routes/execution.route.ts:1)

## Current Validation Status

### Infrastructure Validation

Validated:

- project-local Postgres starts with Docker Compose
- live and test DB separation works
- Prisma migrations apply to both DBs
- app boots cleanly without ML sidecar

### Runtime Validation

Validated:

- ingestion pulls live Skinport data
- items are stored in the live DB
- opportunities are scored and exposed through the API
- paper trade attempts can now be persisted
- execution-cycle metrics can now be queried through the API

### Test Validation

Focused tests currently passing:

- execution service tests
- item route tests
- opportunity route tests
- execution metrics route tests

Recent result:

- `20 pass`
- `0 fail`

## Current Known Numbers

These are not stable investment claims. They are snapshots from current recorded system output.

At the point of last validation:

- live catalog size was roughly `19k+` items
- live snapshots were `20k+`
- one forced execution cycle recorded:
  - `619` candidates in price range
  - `96` qualified opportunities
  - `96` affordable opportunities in paper mode
  - selected trade: `AUG | Death by Puppy (Factory New)`
  - estimated net profit: `$606.14`

This number is an estimated paper profit, not realized profit.

## Why Realized Profit Is Unknown

Realized profit is not yet established because:

1. no real trades have been completed by the bot
2. the current system has only recently started persisting paper-trade history correctly
3. current opportunity math is still a ranking heuristic, not a proven execution model

So at the moment:

- realized profit: unknown / effectively zero recorded
- paper-trade expected profit: now measurable and persisted

## Trading Bot Status

### Current State

The "trading bot" is only partially live.

It currently supports:

- recurring execution cycles
- candidate filtering
- paper-trade recording when API key is absent
- structure for live buying

It is not yet fully validated for:

- safe real-money buying
- order lifecycle management
- reconciliation of buy, hold, relist, and exit
- PnL accounting from actual closed trades

### Live Trading Risk

A real audit should assume the live buying layer is high risk until the following are proven:

1. item selection quality
2. price freshness
3. balance handling
4. relist strategy
5. cancellation and failure recovery
6. post-trade accounting
7. dashboard observability

## Operator Workflow

### Start Local Infra

```bash
cd /Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge
docker compose up -d
```

### Apply Migrations

```bash
bunx prisma migrate deploy
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/cs2_edge_test' bunx prisma migrate deploy
```

### Start The App

```bash
bun run start
```

### Export A Run Snapshot

```bash
bun run export-run
```

This writes timestamped artifacts under:

- `artifacts/runs/<timestamp>/`

### Stop Infra

```bash
docker compose down
```

## Files That Matter For Auditing

Architecture and behavior:

- [`src/index.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/index.ts:1)
- [`src/ingestion/ingestion.service.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/ingestion/ingestion.service.ts:1)
- [`src/opportunities/opportunity.service.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/opportunities/opportunity.service.ts:1)
- [`src/execution/execution.service.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/execution/execution.service.ts:1)
- [`src/api/routes/execution.route.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/api/routes/execution.route.ts:1)

Data model:

- [`prisma/schema.prisma`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/prisma/schema.prisma:1)

Local infra:

- [`docker-compose.yml`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/docker-compose.yml:1)
- [`docker/postgres-init/001-create-test-db.sql`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/docker/postgres-init/001-create-test-db.sql:1)

Safety:

- [`smoke-test.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/smoke-test.ts:1)

Tests:

- [`tests/execution/execution.service.test.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/tests/execution/execution.service.test.ts:1)
- [`tests/api/execution.test.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/tests/api/execution.test.ts:1)
- [`tests/api/items.test.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/tests/api/items.test.ts:1)
- [`tests/api/opportunities.test.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/tests/api/opportunities.test.ts:1)

## Questions An Auditor Should Answer

### Technical Audit

1. Is the ingestion model robust against rate limits, dropped feeds, and stale data?
2. Is the database model sufficient for historical PnL and inventory accounting?
3. Is the execution loop idempotent enough to avoid duplicate trades?
4. Are there concurrency or consistency risks between ingestion, scoring, and execution?
5. Does the API surface expose the right data for a real operator dashboard?

### Strategy Audit

1. Is `medianPrice * 0.88` a defensible resale anchor?
2. Which opportunity classes are clearly false positives?
3. Should the strategy use sale history instead of median listing price?
4. Should the ranking model penalize low-volume or exotic items harder?
5. What filters are required to get from "interesting prototypes" to "tradeable setups"?

### Product Audit

1. What operator dashboard is needed for daily use?
2. What metrics actually matter for decision-making?
3. What must be visible before any live capital is deployed?
4. What audit trail is required for post-trade review?

## Recommended Next Steps

Highest-value next steps:

1. Add stricter realism filters so absurd outliers do not dominate the paper-trade record.
2. Build a thin dashboard on top of `/execution/metrics` and `/opportunities`.
3. Record closed-trade lifecycle data, not just attempted trade selection.
4. Add inventory and relist tracking if real execution is pursued.
5. Backtest current paper selections against later market outcomes.

## Bottom Line

`cs2-edge` is now in a better place for audit than before:

- it runs
- it stores live market data
- it scores opportunities
- it records execution intent
- it exposes dashboardable metrics

But it is still pre-proof on the one thing that matters commercially:

- whether this actually produces repeatable realized trading profits after execution friction

That is the main gap an auditor should focus on.
