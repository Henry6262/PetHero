# Phase 4: Execution Layer — Design Spec

## Context
Phase 1-3 built the data foundation and the intelligence layer. Phase 4 is the **action layer**: a bot that automatically purchases items that meet our strict "Alpha" criteria.

## Goal
Automate the purchase of high-confidence, high-profit CS2 items on Skinport using their API/Webhooks or Browser Automation if necessary.

---

## The Buying Strategy

The bot will poll `GET /opportunities` every 30 seconds and execute a buy if:
1. **Opportunity Score** > `X` (e.g., 50.0)
2. **Net Profit %** > `Y` (e.g., 10%)
3. **ML Confidence** > `Z` (e.g., 0.80)
4. **Balance Check:** We have enough funds in the Skinport account.

---

## Technical Approach: Skinport API vs. Playwright

### Option A: Skinport API (Preferred)
- **Pros:** Fast, reliable, official.
- **Cons:** Requires "Cart" and "Checkout" API access which might be restricted or require specific permissions.

### Option B: Playwright (Browser Automation)
- **Pros:** Can do anything a human can. Harder to block if done correctly.
- **Cons:** Slower, heavier, more fragile (if UI changes).

---

## Implementation Workflow

### 1. Account & Balance Service
- Create `src/execution/account.service.ts`.
- Fetch current balance and active trades.

### 2. The Buyer Service
- Create `src/execution/buyer.service.ts`.
- Implements the `executeBuy(itemId, price)` logic.

### 3. The Execution Loop
- A background worker that runs alongside the Ingestion service.
- Monitors the `OpportunityScore` table for new entries.

---

## Risk Management (Safety First)

- **Maximum Daily Spend:** Limit the total $ amount the bot can spend per 24h.
- **Maximum Price per Item:** Don't buy a $1,000 knife even if it looks like a "good deal" (too risky).
- **Inventory Limit:** Don't buy more than `N` of the same item (avoids market manipulation traps).
- **Stop-Loss:** If the prediction was wrong and price drops, alert the user.

---

## Phase 4 Roadmap

1. **Task 1:** Skinport Buy API Integration.
2. **Task 2:** Buyer Service & Strategy Engine.
3. **Task 3:** Risk Management & Safety Limits.
4. **Task 4:** Full End-to-End Live Test (with small amounts).
