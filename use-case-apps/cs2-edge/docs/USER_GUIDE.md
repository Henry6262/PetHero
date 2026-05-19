# CS2 Edge — User Guide & Technical Docs

Welcome to the **CS2 Edge** automation engine. This system is designed to identify underpriced CS2 skins on Skinport and rank them for automated trading.

## 🚀 How to Run the System

### 1. Prerequisites
- **Bun Runtime:** Fast JS engine.
- **PostgreSQL:** Primary database.
- **Environment:** Copy `.env.example` to `.env` and fill in:
  - `DATABASE_URL` for live ingestion
  - `TEST_DATABASE_URL` for destructive smoke tests
  - `SKINPORT_API_KEY`
  - `DMARKET_PUBLIC_KEY` & `DMARKET_PRIVATE_KEY` (Ed25519)
  - `BUFF_SESSION` (Optional, for price verification)
  - `ML_SERVICE_URL` only if the prediction sidecar is running

### 2. Launching the Engine
Start the local database first:
```bash
docker compose up -d
bunx prisma migrate deploy
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/cs2_edge_test' bunx prisma migrate deploy
```

Then start the full ingestion and API server:
To start the full ingestion and API server:
```bash
bun run src/index.ts
```
The server will start on port `3000` (default) and begin polling Skinport every 5 minutes.

---

## 🧠 The "Opportunity" Logic

The system doesn't just look for "cheap" items. It calculates a **Composite Opportunity Score** using this formula:

```
Score = (Net Profit %) × log(Daily Volume + 1)
```

- **Net Profit:** `(Median Resell Price × 0.88) - Current Buy Price`.
- **0.88:** Standard 12% Skinport seller fee.
- **Volume Multiplier:** We prioritize items that sell 100 times a day over items that sell once a month, even if the slow item has a higher margin.

---

## 🛠 Manual Triggers & Maintenance

### Run a Smoke Test
To verify the engine is scoring correctly without waiting for a poll:
```bash
bun smoke-test.ts
```
This clears the database referenced by `TEST_DATABASE_URL`, seeds it with 3 test items, and prints the ranked opportunities to your console. It will refuse to run if `TEST_DATABASE_URL` is not set.

### Export a Durable Run Snapshot
Before stopping an overnight run, archive the collected state to disk:
```bash
bun run export-run
```
This writes timestamped JSON and CSV exports to `artifacts/runs/<timestamp>/`.

### Stop Local Infra
When you are done:
```bash
docker compose down
```

### Database Migrations
If the schema changes, sync your DB:
```bash
bunx prisma migrate dev
```

### View Data (Prisma Studio)
To see your items and scores in a nice UI:
```bash
bunx prisma studio
```

---

## 🔒 Steam Automation Setup (Phase 4)

To enable the bot to automatically accept your Skinport trades:

1. **Extract Secrets:** Use a tool like [Steam Desktop Authenticator](https://github.com/Jessecar96/SteamDesktopAuthenticator) to get your `shared_secret` and `identity_secret`.
2. **Update `.env`:**
   - `STEAM_USERNAME`: Your login name.
   - `STEAM_PASSWORD`: Your password.
   - `STEAM_SHARED_SECRET`: For 2FA codes.
   - `STEAM_IDENTITY_SECRET`: For confirming trades.
   - `STEAM_API_KEY`: Get one from [Steam Dev](https://steamcommunity.com/dev/apikey).

3. **Behavior:** The bot will automatically accept any "Gift" trade (items to receive only) and use the identity secret to bypass the mobile app confirmation.

---

## 📡 API Reference

### `GET /opportunities`
Returns the current list of profitable flips, ranked by Score.
- **Filter:** `?marketplace=SKINPORT`
- **Output:**
  ```json
  {
    "opportunities": [
      {
        "itemId": "AK-47 | Redline (Field-Tested)",
        "score": 73.92,
        "expectedProfitPct": 18.8,
        "listedPrice": 10.00,
        "targetSellPrice": 13.50,
        "volume24h": 50
      }
    ],
    "total": 1,
    "scoredAt": "2026-05-08T..."
  }
  ```

### `GET /items`
Paginated catalog of all tracked CS2 skins.

---

## 📈 Roadmap

- **Phase 1 (Complete):** Data ingestion from Skinport.
- **Phase 2 (Complete):** Mathematical Opportunity Scoring & API.
- **Phase 3 (Complete):** XGBoost Fair Value Infrastructure & Momentum Logic.
- **Phase 4 (In Progress):** Multi-Market Integration (DMarket, Buff, CSFloat) & Automated Execution Layer.
