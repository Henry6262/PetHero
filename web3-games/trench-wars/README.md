# Trench Wars

Browser Clash Royale-style lane battler — Traders vs Jeets. Deterministic pure-TS sim + Phaser 4 client.

- `npm run dev` — play locally (AI ladder, placeholder art)
- `npm test` — sim unit tests (vitest)
- `npm run e2e` — Playwright boot smoke

Spec: `docs/superpowers/specs/2026-06-12-trench-wars-design.md` (monorepo root).
Status: Plan 1 (game core). Plan 2 = GLB→spritesheet art pipeline. Plan 3 = backend, async PvP, pump.fun token.
All game rules live in `src/sim/` (no Phaser imports there — enforced by review); balance lives in `src/sim/cards.json`.
