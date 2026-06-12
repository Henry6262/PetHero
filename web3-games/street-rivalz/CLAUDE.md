# StreetRivalz — Agent Notes

> Browser 3D crypto-meme kart racer. Deterministic fixed-tick sim + Three.js renderer.
> Spec: `docs/superpowers/specs/2026-06-12-street-rivalz-design.md`
> Plan: `docs/superpowers/plans/2026-06-12-street-rivalz-plan-1-drivable-core.md`

## Commands

- `npm run dev` — drive Moonaco v0 (WASD/arrows, Space = drift, R = reset)
- `npm test` — vitest sim suite
- `npm run build` — typecheck + production build

## Architecture

- `src/sim/` — pure TS, no rendering imports. Deterministic at fixed 60 Hz.
  - `math.ts` — vec2 + mulberry32 RNG
  - `track.ts` — closed-loop centerline + sampling
  - `kart.ts` — arcade physics, drift/boost state machine
  - `race.ts` — wall constraints, checkpoint-gated laps
  - `runner.ts` — headless `runRace(trackDef, n, inputLog)` for replays
- `src/render/` — Three.js view only.
  - `scene.ts`, `trackMesh.ts`, `kartVisual.ts`
  - Kart GLB convention: named nodes `body`, `wheel_FL/FR/RL/RR`; forward = +Z; origin at ground center.
- `src/game/` — input, HUD, fixed-timestep loop with render interpolation.
- `src/tracks/` — track definitions (currently `moonaco.ts`).

## Golden rules

1. Never import Three.js or DOM APIs into `src/sim/`.
2. All game rules live in sim; renderer only visualizes state.
3. Keep drift/boost behavior pinned by tests in `tests/sim/kart.test.ts`.
4. GLB karts must follow the detached-wheels node convention — validator will reject fusing.

## Plan series

1. Drivable core ✅
2. AI racers + items + Quick Race flow
3. Backend: accounts, ghosts, ladder, Grand Prix, replay verification
4. Garage, GLB validator/loader, token/holder layer
