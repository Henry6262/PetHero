# StreetRivalz — Agent Context

Browser-based 3D crypto-meme kart racer. Plans 1-4 shipped (drivable core, AI/items/Quick Race, backend, garage/GLB/token). Launch-ready v1 build.

## Quick links

- Spec: `docs/superpowers/specs/2026-06-12-street-rivalz-design.md`
- Plan 1 (done): `docs/superpowers/plans/2026-06-12-street-rivalz-plan-1-drivable-core.md`
- Plan 2 (done): `docs/superpowers/plans/2026-06-12-street-rivalz-plan-2-ai-items-quick-race.md`
- Plan 3 (done): `docs/superpowers/plans/2026-06-12-street-rivalz-plan-3-backend.md`
- Plan 4 (done): `docs/superpowers/plans/2026-06-12-street-rivalz-plan-4-garage-glb-token.md`
- Asset prompts: `docs/superpowers/specs/2026-06-12-street-rivalz-asset-prompts.md`
- README: `web3-games/street-rivalz/README.md`

## Dev commands

```bash
# Client
cd web3-games/street-rivalz
npm run dev      # Quick Race / Time Trial / Garage (WASD/arrows, Space drift, E use item, R new race, T Time Trial, G Garage)
npm test         # vitest sim + game + garage + token tests
npm run build    # tsc + vite production build

# Backend
cd api
npm run dev      # Fastify API on :3001
npm test         # backend route + verification tests
npm run build    # tsc --noEmit
```

Copy `api/.env.example` → `api/.env` and `.env.local.example` → `.env.local`.

## Architecture rules

- `src/sim/` — pure TypeScript, zero rendering imports, deterministic fixed-tick.
  Any change here MUST keep replays byte-identical.
- `src/render/` — Three.js view only. Sim (x,y) maps to world (x,z), y-up.
- `src/game/` — input, HUD, Quick Race, Time Trial, fixed-timestep loop.
- `src/garage/` — inventory, loadout validation, GLB validator, garage UI.
- `src/data/` — cars, items, garage cosmetics, token metadata.
- `src/tracks/` — track definitions.
- `src/api/` — fetch client for backend.
- `api/` — Fastify + Prisma backend. Verifies replays server-side.

## Conventions

- Kart models use detached-wheels node names: `body`, `wheel_FL/FR/RL/RR`.
- Inputs: arrows/WASD drive, Space drift, E use item, R new Quick Race, T Time Trial, G Garage.
- Backend auth is anonymous cookie for v1; wallet connect is Season 1.
- Tests: `tests/sim/`, `tests/game/`, `tests/garage/`, `tests/data/` for client; `api/tests/` for backend.

## Status

Plan 4 complete: GLB validator, runtime GLB loader, garage data model + backend loadout endpoints, holder tier skeleton, and in-game garage UI with body/paint/trail equip and save.
