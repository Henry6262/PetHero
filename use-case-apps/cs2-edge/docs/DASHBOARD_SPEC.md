# CS2 Edge Dashboard Spec

## Purpose

This document defines the operator dashboard for `cs2-edge`.

It is written for an AI agent or engineer who needs to build the dashboard without prior context.

The dashboard is not a vanity UI. Its purpose is operational control.

The operator needs to answer, quickly:

1. Is ingestion alive?
2. Is the market data fresh?
3. What are the best current trade candidates?
4. What paper trades would the bot take right now?
5. What has the bot been doing over time?
6. Are the current trade signals believable or noisy?
7. If live execution is enabled later, what is happening with capital and risk?

## Product Context

Project root:

`/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge`

Useful references:

- [`docs/AUDIT_BRIEF.md`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/docs/AUDIT_BRIEF.md:1)
- [`src/api/routes/opportunities.route.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/api/routes/opportunities.route.ts:1)
- [`src/api/routes/execution.route.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/api/routes/execution.route.ts:1)
- [`src/api/routes/items.route.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/api/routes/items.route.ts:1)
- [`prisma/schema.prisma`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/prisma/schema.prisma:1)

## Dashboard Goal

The first version should help Henry do three things:

1. Validate whether the strategy is producing plausible trade candidates.
2. Review paper-trade history and cycle behavior.
3. Build confidence for controlled live execution later.

The dashboard should therefore optimize for:

- trust
- clarity
- auditability
- fast scanning

It should not optimize for:

- pretty charts with little operator value
- generic admin template aesthetics
- overcomplicated BI-style drilldowns in v1

## Required Views

The first release should have four primary views.

### 1. Overview

Purpose:

- answer “is the system healthy and producing usable signals?”

Contents:

- ingestion health status
- API health status
- last scored timestamp
- total tracked items
- total current opportunities
- total execution cycles recorded
- total paper attempts recorded
- cumulative expected net profit from paper attempts
- latest cycle summary
- top 5 current opportunities

### 2. Opportunities

Purpose:

- review current ranked trade candidates

Contents:

- sortable table of current opportunities
- filters for:
  - min score
  - min expected profit %
  - min buy price
  - max buy price
  - min volume
  - search by item name
- columns for:
  - item
  - score
  - expected profit %
  - estimated net profit
  - buy price
  - target sell price
  - volume24h
  - confidence
  - scoredAt

### 3. Execution

Purpose:

- understand what the execution loop is doing over time

Contents:

- latest cycle card
- recent execution cycles table
- recent trade attempts table
- totals:
  - total attempts
  - paper attempts
  - successes
  - failures
  - cumulative expected net profit
- per-cycle stats:
  - candidate count
  - qualified count
  - affordable count
  - selected item
  - reason

### 4. Item Inspector

Purpose:

- inspect one item in detail before manual action

Contents:

- search/select item
- current summarized price
- recent price snapshots
- recent sales history
- if available:
  - current opportunity score
  - expected profit %
  - estimated net profit

## Exact Questions Each View Must Answer

### Overview

- Is the system alive?
- Has data updated recently?
- Are we seeing enough candidates?
- Are paper-trade numbers increasing over time?
- Are the top candidates obviously absurd?

### Opportunities

- What would I manually consider buying right now?
- Which opportunities survive realistic price filters?
- Are the best candidates liquid enough to matter?

### Execution

- Is the bot taking paper trades?
- Why did it skip a cycle?
- Is the selection logic too permissive or too strict?
- Are the repeated selected items believable or suspicious?

### Item Inspector

- Is this specific opportunity real or likely noise?
- Is its spread supported by recent history?
- Does sale history support the target exit assumption?

## Existing Backend Endpoints

Already available:

- `GET /health`
- `GET /items`
- `GET /items/:id/snapshots`
- `GET /items/:id/sales`
- `GET /items/:id/price`
- `GET /opportunities`
- `GET /execution/metrics`

Current code:

- [`src/api/api.server.ts`](/Users/henry/Documents/Gazillion-dollars/use-case-apps/cs2-edge/src/api/api.server.ts:1)

## Existing Data Contracts

### `GET /opportunities`

Current payload shape:

```json
{
  "opportunities": [
    {
      "itemId": "AK-47 | Redline (Field-Tested)",
      "marketplace": "SKINPORT",
      "score": 54.16,
      "expectedProfitPct": 14.4,
      "listedPrice": 10,
      "targetSellPrice": 13,
      "volume24h": 42,
      "scoredAt": "2026-05-08T00:00:00.000Z"
    }
  ],
  "total": 1,
  "scoredAt": "2026-05-08T00:00:00.000Z"
}
```

Gap:

- This endpoint does not currently expose `expectedNetProfit` directly.
- The UI can compute it client-side using `targetSellPrice * 0.88 - listedPrice`.
- Better long term: expose it directly from the API.

### `GET /execution/metrics`

Current payload shape:

```json
{
  "totals": {
    "attempts": 1,
    "paperAttempts": 1,
    "successes": 0,
    "failures": 0,
    "expectedNetProfit": 606.14
  },
  "latestCycle": {
    "mode": "PAPER",
    "status": "PAPER",
    "candidateCount": 619,
    "qualifiedCount": 96,
    "affordableCount": 96,
    "selectedItemId": "AUG | Death by Puppy (Factory New)",
    "selectedBuyPrice": 27.67,
    "selectedTargetSellPrice": 720.24,
    "selectedExpectedProfitPct": 2190.61,
    "selectedExpectedNetProfit": 606.14,
    "selectedScore": 2406.6287,
    "selectedConfidence": 0,
    "reason": "NO_API_KEY_PAPER_TRADE",
    "executedAt": "2026-05-08T00:00:00.000Z"
  },
  "recentAttempts": [],
  "recentCycles": []
}
```

This is already good enough for the first dashboard version.

## Recommended Dashboard Layout

### Page 1: Overview

Top KPI row:

- system health
- last scored time
- tracked items
- current opportunities
- paper attempts
- cumulative expected net profit

Second row:

- latest execution cycle card
- top opportunities card

Third row:

- recent attempts table

### Page 2: Opportunities

Top section:

- filter bar

Main section:

- full-width ranked table

Side panel or drawer:

- selected opportunity quick details

### Page 3: Execution

Top section:

- aggregated execution KPIs

Middle:

- recent cycles table

Bottom:

- recent attempts table

### Page 4: Item Inspector

Top:

- item search

Middle:

- current price summary
- opportunity summary

Bottom:

- snapshot history table
- sales history table

## KPI Definitions

These must be consistent across UI and backend.

### Tracked Items

Definition:

- total number of `Item` rows

Source:

- `GET /items`

### Current Opportunities

Definition:

- `total` returned by `GET /opportunities`

### Paper Attempts

Definition:

- count of `TradeAttempt` rows with `mode = PAPER`

Source:

- `GET /execution/metrics`

### Cumulative Expected Net Profit

Definition:

- sum of `TradeAttempt.expectedNetProfit`

Important:

- this is not realized PnL
- UI must label it clearly as expected paper profit or expected gross opportunity

### Last Scored Time

Definition:

- top-level `scoredAt` from `GET /opportunities`

### Latest Cycle Status

Definition:

- `latestCycle.status` from `GET /execution/metrics`

## Required Labels To Avoid Misleading The Operator

The dashboard must distinguish:

- estimated profit
- expected paper profit
- realized profit
- live trade success

Never label expected net profit as:

- PnL
- realized PnL
- profit made

Use labels such as:

- `Expected Net Profit`
- `Paper Profit Estimate`
- `Estimated Resale Edge`

## V1 UX Requirements

The UI should feel like a trading workstation, not a generic CRUD admin.

Design direction:

- dense information layout
- strong hierarchy
- fast scanning
- serious visual tone
- minimal decorative fluff

Recommended visual language:

- dark neutral or muted industrial palette
- strong table readability
- clear status colors:
  - green for actionable/positive
  - amber for warning
  - red for failures
  - blue/gray for informational state

Must-have UX behaviors:

- filters update table quickly
- sortable columns
- sticky table headers
- numeric formatting with `$` and `%`
- timestamps shown in local time
- obvious badges for `PAPER`, `SUCCESS`, `FAILED`, `SKIPPED`

## V1 Implementation Recommendation

Recommended approach:

- keep backend as-is for now
- add a simple frontend in the same Bun app or a lightweight HTML/JS client

Because this project already uses Bun and Hono, the simplest path is:

1. add a dashboard route
2. fetch the existing JSON endpoints
3. render a focused single-page operator interface

Do not overengineer v1 with a separate frontend deployment unless necessary.

## Suggested File Targets For Implementation

Likely new files:

- `src/api/routes/dashboard.route.ts`
- `src/dashboard/index.html`
- `src/dashboard/dashboard.ts`
- `src/dashboard/dashboard.css`

Or equivalent structure if the implementing agent prefers another layout.

## Backend Improvements Recommended Before Or During Dashboard Work

These are not all mandatory for v1, but they are high-value.

### 1. Add `expectedNetProfit` to `/opportunities`

Reason:

- avoids recalculating in the client
- keeps calculations consistent

### 2. Add summary counts to `/health` or a dedicated `/overview`

Reason:

- faster single-fetch page load

### 3. Add query params to `/opportunities`

Useful params:

- `minScore`
- `minProfitPct`
- `minBuyPrice`
- `maxBuyPrice`
- `limit`
- `search`

Reason:

- avoids shipping thousands of rows to the client when the dataset grows

### 4. Add historical metrics endpoint

Suggested future route:

- `GET /execution/history?hours=24`

Reason:

- useful for charts like:
  - attempts per hour
  - expected profit per hour
  - cycles with no action

## Metrics The Dashboard Should Eventually Support

Not all required in v1.

### Strategy Metrics

- average expected profit %
- average expected net profit
- median expected profit %
- count of high-confidence opportunities
- distribution by price bucket
- distribution by item type

### Execution Metrics

- cycles per hour
- no-trade cycles
- paper trades per hour
- live trade attempts per hour
- failures by reason
- top repeatedly selected items

### Market Quality Metrics

- snapshot freshness
- items with repeated extreme spreads
- opportunity decay over time
- sales activity by item

## Alerting Rules For Later

These can be simple UI banners first.

Show warning if:

- no opportunities have been scored recently
- latest cycle is older than expected
- recent cycles are all `NO_TRADE`
- repeated outlier opportunities dominate top ranks
- live execution is enabled but trade failures spike

## What The Dashboard Must Make Obvious

An operator should be able to tell immediately:

- whether the engine is alive
- whether the numbers are fresh
- whether the top opportunities look sane
- whether the execution loop is actually selecting trades
- whether the selected trades are mostly absurd outliers or plausible setups

If those five questions are not visually obvious, the dashboard is not doing its job.

## Concrete V1 Acceptance Criteria

The dashboard is acceptable when:

1. An operator can open one page and confirm the system is alive.
2. An operator can see top current opportunities and sort/filter them.
3. An operator can inspect the latest execution cycle and recent attempts.
4. An operator can tell the difference between estimated and realized values.
5. An operator can inspect one item’s price and sales history before deciding to trade manually.

## Concrete V2 Acceptance Criteria

The next version becomes meaningful when:

1. Historical charts show strategy behavior over time.
2. Opportunity quality is segmented by realistic filters.
3. Realized trade lifecycle data is recorded.
4. Capital allocation and inventory state are visible.
5. Alerts exist for stale ingestion, repeated failures, and suspicious opportunities.

## Recommended Build Order

### Phase 1

- Overview page
- Opportunities table
- Execution metrics panel

### Phase 2

- Item Inspector
- search
- richer filters

### Phase 3

- historical charts
- alert banners
- live execution controls

## Short Prompt For A Fresh AI Agent

Use this if handing off implementation:

Build a first operator dashboard for `cs2-edge` inside the existing Bun/Hono app. Use the current JSON endpoints `/health`, `/items`, `/items/:id/snapshots`, `/items/:id/sales`, `/items/:id/price`, `/opportunities`, and `/execution/metrics`. The dashboard should prioritize operational clarity over generic admin UI. It needs an overview screen, a current opportunities screen with filtering/sorting, an execution screen with recent cycles and paper attempts, and an item inspector for manual trade review. Label expected values clearly so they are not mistaken for realized profit. Preserve the existing backend unless a small endpoint improvement materially simplifies the UI.

## Bottom Line

The dashboard is not just a convenience layer.

It is the interface that turns `cs2-edge` from:

- a working prototype with hidden logic

into:

- an auditable operator tool for reviewing and eventually managing trades.
