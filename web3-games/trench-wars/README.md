# Trench Royale

**LIVE**: https://trench-wars-henry6262s-projects.vercel.app (client, Vercel) · https://trench-wars-api-production.up.railway.app (API, Railway project `trench-wars`, sqlite on /data volume)

Browser Clash Royale-style lane battler — Traders vs Jeets. Deterministic pure-TS sim + **real 3D battle renderer (Three.js)** with a React UI shell + Express/Prisma backend. Client API base URL defaults to `http://localhost:3001/api`; set `VITE_API_URL` for production builds.

The arena is full 3D: KayKit Medieval Hexagon tiles, towers, and decoration plus Meshy AI animated characters (meshopt-compressed GLBs). The sim stays the single source of truth — the 3D layer only visualizes state.

## Client

- `npm run dev` — play locally (3D battle vs AI ladder, wallet connect, deck builder)
- `npm test` — sim + game logic unit tests (vitest)
- `npm run e2e` — Playwright boot smoke
- `npm run build` — typecheck + production build
- `npm run smoke-3d` — Playwright visual smoke of a live 3D match (needs dev server + backend)

Features: deterministic sim, 3D battle arena, AI ladder, ranked async PvP with server-side replay verification, Solana wallet login, deck builder, VFX.

## Server

- `cd server/`
- `cp .env.example .env` (already done in this checkout)
- `npm install`
- `npm run db:migrate`
- `npm run dev` — start on `http://localhost:3001`
- `npm test` — backend API tests (vitest + supertest)

### Deploy (Railway)

1. Create a Railway project and add a PostgreSQL database.
2. Add the `server/` directory as a service.
3. Set required environment variables:
   - `DATABASE_URL` — PostgreSQL connection string
   - `COOKIE_SECRET` — random 32+ character secret
   - `CLIENT_URL` — production client origin (e.g. `https://trench-wars.vercel.app`)
   - `PORT` — Railway sets this automatically
4. Push; Railway uses `server/railway.json` to build and start.

Spec: `docs/superpowers/specs/2026-06-12-trench-wars-design.md` (monorepo root).
Status: Plan 1 ✅, Plan 3 ✅ (backend, async PvP, replay verification, Railway config), 3D pivot ✅.
All game rules live in `src/sim/` (no React/Three/Express imports there — enforced by review); balance lives in `src/sim/cards.json`.
3D rendering lives in `src/render3d/Battle3D.ts`; React UI in `src/ui/`; battle driver in `src/game/BattleController.ts`.
