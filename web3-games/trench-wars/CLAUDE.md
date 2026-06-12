# Trench Wars — Agent Notes

> Browser Clash Royale-style lane battler — Traders vs Jeets. Deterministic fixed-tick sim + Phaser 4 client.
> Spec: `docs/superpowers/specs/2026-06-12-trench-wars-design.md`
> Plan 1: `docs/superpowers/plans/2026-06-12-trench-wars-v1-core.md`
> Plan 2: `docs/superpowers/plans/2026-06-12-trench-wars-plan-2-art-pipeline.md`

## Commands

- `npm run dev` — play locally vs AI ladder (click card → click own half to deploy)
- `npm test` — vitest sim + game logic suite
- `npm run e2e` — Playwright boot smoke
- `npm run build` — typecheck + production build
- `npm run build-placeholders` — regenerate colored directional placeholder spritesheets
- `npm run validate-art` — validate GLBs in `raw-art/`
- `npm run build-art` — render real GLBs to spritesheets (currently fallback placeholders)

## Architecture

- `src/sim/` — pure TS, NO Phaser imports. Deterministic at 10 ticks/sec.
  - `rng.ts` — pure seeded RNG `[value, nextState]`
  - `constants.ts`, `types.ts`, `cards.json`, `cards.ts` — roster + config
  - `sim.ts` — `createMatch`, `validateDeploy`, `step` (deploy → elixir → auras → units → towers → win)
  - `replay.ts` — `runReplay` + `fingerprint` (anti-cheat foundation)
  - `ai.ts` — deterministic AI policy + 5-level ladder configs
- `src/render/` — Phaser asset manifest, sprite pools, frame mapping.
  - `AssetManifest.ts` — manifest types, loader, direction mapping, validator
  - `SpriteRenderer.ts` — sprite pools, unit/tower sprite updates
- `src/game/` — Phaser scene, HUD, input, ladder persistence.
  - `BattleScene.ts` — renders sim state with spritesheets, forwards input as `DeployCommand`s
  - `ladder.ts` — localStorage-injected AI ladder progression
- `scripts/` — art pipeline tooling.
  - `validate-glb.ts` — GLB convention validator
  - `render-sprites.ts` — GLB → spritesheet renderer (fallback placeholders until headless WebGL is wired)
  - `build-placeholders.ts` — canvas-based placeholder directional sprites
- `e2e/` — Playwright boot smoke.

## Golden rules

1. Never import Phaser or DOM APIs into `src/sim/`. Grep check: `grep -ri "phaser" src/sim/` must be empty.
2. All game rules live in sim; renderer only visualizes state.
3. Card stats live in `src/sim/cards.json` — balance changes need no code.
4. Replays must be byte-deterministic; `runReplay(seed, decks, commands)` reproduces the same state.
5. All units render through the spritesheet manifest. Fallback primitives are only for missing assets.

## Plan series

1. Game core ✅
2. GLB → 8-direction spritesheet art pipeline ✅ (placeholder pipeline live; real GLB render stubbed)
3. Backend (accounts, Elo, async PvP, replay verification) + pump.fun token launch ops
