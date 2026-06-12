# Trench Wars

Browser Clash Royale-style lane battler — Traders vs Jeets. Deterministic pure-TS sim + Phaser 4 client.

- `npm run dev` — play locally (AI ladder, sprite placeholders)
- `npm test` — sim + render unit tests (vitest)
- `npm run e2e` — Playwright boot smoke
- `npm run build-placeholders` — regenerate colored directional placeholder spritesheets
- `npm run validate-art` — validate GLBs in `raw-art/`
- `npm run build-art` — render real GLBs to spritesheets (currently fallback placeholders)

Spec: `docs/superpowers/specs/2026-06-12-trench-wars-design.md` (monorepo root).
Status: Plan 1 ✅, Plan 2 ✅ (placeholder art pipeline). Plan 3 = backend, async PvP, pump.fun token.
All game rules live in `src/sim/` (no Phaser imports there — enforced by review); balance lives in `src/sim/cards.json`.
Art pipeline lives in `scripts/` and `src/render/`.
