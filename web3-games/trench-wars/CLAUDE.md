# Trench Wars — Agent Notes

> Browser Clash Royale-style lane battler — Traders vs Jeets. Deterministic fixed-tick sim + Phaser 4 client.
> Spec: `docs/superpowers/specs/2026-06-12-trench-wars-design.md`
> Plan: `docs/superpowers/plans/2026-06-12-trench-wars-v1-core.md`

## Commands

- `npm run dev` — play locally vs AI ladder (click card → click own half to deploy)
- `npm test` — vitest sim + game logic suite
- `npm run e2e` — Playwright boot smoke
- `npm run build` — typecheck + production build

## Architecture

- `src/sim/` — pure TS, NO Phaser imports. Deterministic at 10 ticks/sec.
  - `rng.ts` — pure seeded RNG `[value, nextState]`
  - `constants.ts`, `types.ts`, `cards.json`, `cards.ts` — roster + config
  - `sim.ts` — `createMatch`, `validateDeploy`, `step` (deploy → elixir → auras → units → towers → win)
  - `replay.ts` — `runReplay` + `fingerprint` (anti-cheat foundation)
  - `ai.ts` — deterministic AI policy + 5-level ladder configs
- `src/game/` — Phaser scene, HUD, input, ladder persistence.
  - `BattleScene.ts` — renders sim state, forwards input as `DeployCommand`s
  - `ladder.ts` — localStorage-injected AI ladder progression
- `e2e/` — Playwright boot smoke.

## Golden rules

1. Never import Phaser or DOM APIs into `src/sim/`. Grep check: `grep -ri "phaser" src/sim/` must be empty.
2. All game rules live in sim; renderer only visualizes state.
3. Card stats live in `src/sim/cards.json` — balance changes need no code.
4. Replays must be byte-deterministic; `runReplay(seed, decks, commands)` reproduces the same state.

## Plan series

1. Game core (this) ✅
2. GLB → 8-direction spritesheet art pipeline
3. Backend (accounts, Elo, async PvP, replay verification) + pump.fun token launch ops
