# StreetRivalz

Browser 3D kart racer — crypto meme grand prix. Marquee track: Moonaco. Spec:
`docs/superpowers/specs/2026-06-12-street-rivalz-design.md` (repo root).

## Dev

- `npm run dev` — Quick Race on Moonaco v0 (WASD/arrows, Space = drift, E = use item, R = new race)
- `npm test` — deterministic sim + game test suite (vitest)
- `npm run build` — typecheck + production build

## Architecture

- `src/sim/` — deterministic fixed-tick sim, pure TS, NO rendering imports.
  Replays/ghosts/anti-cheat all depend on `runRace(trackDef, n, inputLog)`
  reproducing byte-identical results.
- `src/render/` — Three.js view of sim state. Sim (x,y) → world (x, z), y-up.
  Karts bind by node name: `body`, `wheel_FL/FR/RL/RR` (detached-wheels GLB
  convention — placeholder and real Meshy GLBs use the same binding).
- `src/game/` — fixed-timestep loop w/ render interpolation, input, HUD, Quick Race flow.
- `src/data/` — car roster + item definitions.
- `src/tracks/` — track definitions (centerline + width + checkpoints + item box placements).

## Plan series

1. Drivable core ✅
2. AI racers + items + Quick Race flow ✅
3. Backend: accounts, ghosts, ladder, Grand Prix, replay verification
4. Garage, GLB validator/loader, token/holder layer
