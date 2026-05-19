# cs2-edge 🔪

Automated CS2 Skin Trading & Opportunity Scoring Engine.

## Quick Start

1. **Install Dependencies:**
   ```bash
   bun install
   ```

2. **Setup DB:**
   Start the project-local PostgreSQL stack and keep separate databases for live ingestion and smoke tests.
   ```bash
   docker compose up -d
   bunx prisma migrate deploy
   DATABASE_URL='postgresql://postgres:postgres@localhost:5432/cs2_edge_test' bunx prisma migrate deploy
   ```

3. **Run the Engine:**
   ```bash
   bun run src/index.ts
   ```

4. **Verify Scoring:**
   ```bash
   bun smoke-test.ts
   ```

5. **Archive A Run Before Stopping:**
   ```bash
   bun run export-run
   ```

6. **Stop Local Infra When Done:**
   ```bash
   docker compose down
   ```

## Key Features

- **Multi-Marketplace Ingestion:** Polls Skinport, DMarket, CSFloat, and Buff.163.
- **Real-time Feeds:** Low-latency pricing via Bitskins and Skinport WebSockets.
- **Smart Scoring:** Ranks items based on net profit (after fees), liquidity, and ML-predicted fair value.
- **Execution Bot:** Automated alpha trading based on customizable profit and confidence thresholds.
- **Durable Run Exports:** Writes snapshots, opportunities, and trade attempts to `artifacts/runs/<timestamp>/`.

For detailed logic and API specs, see [docs/USER_GUIDE.md](./docs/USER_GUIDE.md).
