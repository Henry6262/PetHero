# StreetRivalz — Agent Context

Browser-based 3D crypto-meme kart racer. Plans 1-3 shipped (drivable core, AI/items/Quick Race, backend); Plan 4+ cover garage, GLB loader, token/holder layer.

## Quick links

- Spec: `docs/superpowers/specs/2026-06-12-street-rivalz-design.md`
- Plan 1 (done): `docs/superpowers/plans/2026-06-12-street-rivalz-plan-1-drivable-core.md`
- Plan 2 (done): `docs/superpowers/plans/2026-06-12-street-rivalz-plan-2-ai-items-quick-race.md`
- Plan 3 (done): `docs/superpowers/plans/2026-06-12-street-rivalz-plan-3-backend.md`
- Asset prompts: `docs/superpowers/specs/2026-06-12-street-rivalz-asset-prompts.md`
- README: `web3-games/street-rivalz/README.md`

## Dev commands

```bash
# Client
cd web3-games/street-rivalz
npm run dev      # Quick Race / Time Trial (WASD/arrows, Space drift, E use item, R reset, T Time Trial)
npm test         # vitest sim + game suite
npm run build    # tsc + vite production build

# Backend
cd api
npm run dev      # Fastify API on :3001
npm test         # backend route + verification tests
npm run build    # tsc --noEmit
```

## Architecture rules

- `src/sim/` — pure TypeScript, zero rendering imports, deterministic fixed-tick.
  Any change here MUST keep replays byte-identical.
- `src/render/` — Three.js view only. Sim (x,y) maps to world (x,z), y-up.
- `src/game/` — input, HUD, Quick Race flow, Time Trial flow, fixed-timestep loop with render interpolation.
- `src/data/` — car roster + item definitions (balance patches = data edits, no code).
- `src/tracks/` — track definitions (centerline + width + checkpoints + item box placements).
- `src/api/` — thin fetch wrapper to backend.
- `api/` — Fastify + Prisma backend. Re-simulates every replay for verification.

## Conventions

- Kart models use detached-wheels node names: `body`, `wheel_FL/FR/RL/RR`.
- Inputs: arrows/WASD drive, Space drift, E use item, R new Quick Race, T Time Trial.
- 6 car bodies with distinct KartParams; items weighted by race position.
- Backend auth is anonymous cookie for v1; wallet connect is Season 1.
- Tests: `tests/sim/`, `tests/game/` for client; `api/tests/` for backend.

## Status

Plan 3 complete: Fastify/Prisma backend with replay verification, ghost storage, ladder/Elo, Grand Prix events, Time Trial client integration, and Railway deployment config.
