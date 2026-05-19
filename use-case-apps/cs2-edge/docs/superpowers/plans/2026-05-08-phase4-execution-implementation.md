# Phase 4: Execution Layer — Implementation Plan

> **Goal:** Build the final "Execution Bot" that automatically buys items based on ML signals.

---

## Task 1: Setup Execution Foundation (Complete ✅)

- [x] **Step 1: Create ExecutionService**
  - logic for filtering "Alpha" trades based on score, profit, and confidence.
- [x] **Step 2: Create SkinportBuyClient (Skeleton)**
  - Placeholder for balance check and purchase logic.
- [x] **Step 3: Main Loop Integration**
  - Wired `ExecutionService` into `src/index.ts` to run every 60s.

---

## Task 2: Real API Integration

- [ ] **Step 1: Implement Cart API**
  - Skinport requires adding items to a cart before purchase.
  - Implement `POST /v1/checkout/cart` in `SkinportBuyClient`.
- [ ] **Step 2: Implement Checkout**
  - Implement `POST /v1/checkout/purchase`.
- [ ] **Step 3: Secure API Key Management**
  - Ensure keys are loaded from `.env` and never logged.

---

## Task 3: Risk & Safety Guards

- [ ] **Step 1: Daily Spend Limit**
  - Add a persistent "Spent Today" counter to prevent the bot from draining the wallet if the AI goes rogue.
- [ ] **Step 2: Inventory Deduplication**
  - Ensure the bot doesn't buy 50 of the same skin.
- [ ] **Step 3: Telegram Alerts**
  - Send a message to the user whenever a buy is executed or a high-score deal is found.

---

## Task 4: Final Verification

- [ ] **Live Dry-Run**
  - Run the bot with a $0 balance or a mock "success" flag to ensure the timing and loops are perfect.
- [ ] **First Live Trade**
  - Execute a trade on a $0.50 skin to verify end-to-end success.
