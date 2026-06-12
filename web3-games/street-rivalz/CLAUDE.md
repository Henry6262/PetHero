# StreetRivalz — Agent Context

Browser-based 3D crypto-meme kart racer. Plan 1 (drivable core) and Plan 2 (AI + items + Quick Race) are shipped; Plan 3+ cover backend, ghosts, ladder, garage, token layer.

## Quick links

- Spec: `docs/superpowers/specs/2026-06-12-street-rivalz-design.md`
- Plan 1 (done): `docs/superpowers/plans/2026-06-12-street-rivalz-plan-1-drivable-core.md`
- Plan 2 (done): `docs/superpowers/plans/2026-06-12-street-rivalz-plan-2-ai-items-quick-race.md`
- README: `web3-games/street-rivalz/README.md`

## Dev commands

```bash
npm run dev      # Quick Race on Moonaco v0 (WASD/arrows, Space drift, E use item, R reset)
npm test         # vitest sim + game suite
npm run build    # tsc + vite production build
```

## Architecture rules

- `src/sim/` — pure TypeScript, zero rendering imports, deterministic fixed-tick.
  Any change here MUST keep replays byte-identical.
- `src/render/` — Three.js view only. Sim (x,y) maps to world (x,z), y-up.
- `src/game/` — input, HUD, Quick Race flow, fixed-timestep loop with render interpolation.
- `src/data/` — car roster + item definitions (balance patches = data edits, no code).
- `src/tracks/` — track definitions (centerline + width + checkpoints + item box placements).

## Conventions

- Kart models use detached-wheels node names: `body`, `wheel_FL/FR/RL/RR`.
- Inputs: arrows/WASD drive, Space drift, E use item, R new Quick Race.
- 6 car bodies with distinct KartParams; items weighted by race position.
- Tests live in `tests/sim/` and `tests/game/`; renderer is visually smoke-tested only.

## Status

Plan 2 complete: 6-kart Quick Race on Moonaco with AI, rubber-banding, 6 meme items, item boxes, traps/clouds, shield/spinout, countdown, results, and updated HUD.
