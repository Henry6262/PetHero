# Trench Wars — Agent Notes

> Browser Clash Royale-style lane battler — Traders vs Jeets. Deterministic fixed-tick sim + **real 3D battle renderer (Three.js)** with a transparent Phaser 4 HUD overlay + Express/Prisma backend.
>
> The battle arena is full 3D: KayKit Medieval Hexagon tiles/towers/decoration (`public/assets/3d/kaykit/`) + Meshy AI animated characters (`public/assets/3d/chars/`, meshopt-compressed GLBs ~500KB each). `src/render3d/Battle3D.ts` owns a WebGL canvas underneath the transparent Phaser canvas; Phaser draws HUD, hp bars, and VFX projected through the 3D camera. The 2D spritesheet pipeline was removed in the 3D pivot.
> Spec: `docs/superpowers/specs/2026-06-12-trench-wars-design.md`
> Plan 1: `docs/superpowers/plans/2026-06-12-trench-wars-v1-core.md`
> Plan 3: `docs/superpowers/plans/2026-06-12-trench-wars-plan-3-backend.md`

## Client

- `npm run dev` — play locally vs AI ladder (click card → click own half to deploy)
- `npm test` — vitest sim + game logic suite
- `npm run e2e` — Playwright boot smoke
- `npm run build` — typecheck + production build
- `npm run smoke-3d` — Playwright visual smoke: boots a practice match, deploys units, exercises drag-deploy, screenshots to `/tmp/tw3d.png` (needs dev server on 5174 + backend on 3001)
- `npm run portraits` — re-render transparent card portraits from `public/assets/3d/chars/*-walk.glb` into `public/assets/3d/portraits/`; run after adding a new character

### Audio (optional, drop-in)

`public/assets/audio/*.mp3` — keys: deploy, hit, shoot, explosion, tower-down, elixir, victory, defeat, battle-loop. Missing files are silently skipped; the moment a file exists it plays. Mute toggle persists in localStorage `tw-muted`.

## Server

- `cd server/`
- `cp .env.example .env`
- `npm install`
- `npm run db:migrate`
- `npm run dev` — hot-reload on `http://localhost:3001`
- `npm test` — backend API tests (vitest + supertest)
- `npm run start` — production start with Prisma migrate deploy

### Deploy (Railway)

1. Add `server/` as a Railway service.
2. Provision a PostgreSQL database and link it (sets `DATABASE_URL`).
3. Set `COOKIE_SECRET` and `CLIENT_URL`.
4. Push; `server/railway.json` tells Railway how to build and start.

## Architecture

- `src/sim/` — pure TS, NO Phaser/Three/Express imports. Deterministic at 10 ticks/sec.
  - `rng.ts` — pure seeded RNG `[value, nextState]`
  - `constants.ts`, `types.ts`, `cards.json`, `cards.ts` — roster + config
  - `sim.ts` — `createMatch`, `validateDeploy`, `step` (deploy → elixir → auras → units → towers → win)
  - `replay.ts` — `runReplay` + `fingerprint` (anti-cheat foundation)
  - `ai.ts` — deterministic AI policy + 5-level ladder configs
- `src/render3d/` — Three.js battle renderer.
  - `Battle3D.ts` — WebGL canvas under Phaser; instanced hex arena + river + bridges, hand-placed decoration (`decorate()`), blue/red KayKit towers, Meshy character units with walk/attack animation (meshopt GLBs), ground raycast for deploys (`screenToSim`), camera projection for the HUD overlay (`project`). Card→character mapping in `CARD_CHAR`.
- `src/render/` — Phaser-side presentation.
  - `Brand.ts` — colors, fonts, hex/CSS helpers (single source of truth for UI)
  - `VfxManager.ts` — particles + spell rings for deploy, hits, deaths (positions projected through the 3D camera)
- `src/game/` — Phaser scenes, HUD, input, ladder persistence, server API wiring.
  - `MenuScene.ts` — Solana wallet connect, guest login, Elo display, Practice / Ladder Match / Deck Builder buttons
  - `BattleScene.ts` — transparent HUD overlay: runs the sim loop, drives `Battle3D`, draws cards/elixir/hp bars/VFX, forwards input as `DeployCommand`s, submits ladder replays
  - `DeckBuilderScene.ts` — pick 8 cards from the roster and save to the server
  - `ladder.ts` — localStorage-injected AI ladder progression
- `src/api.ts` — typed fetch client for the backend.
- `src/wallet.ts` — minimal Phantom/Solana provider wrapper.
- `server/` — Express + Prisma backend.
  - `src/app.ts` — route wiring, CORS, signed cookies
  - `src/routes/accounts.ts`, `decks.ts`, `ladder.ts`, `matches.ts`
  - `src/lib/antiCheat.ts` — re-runs replays and verifies winner + fingerprint
  - `src/lib/elo.ts` — K=32 Elo delta
  - `prisma/schema.prisma` — Account, Deck, Match
- `scripts/screenshot-3d.ts` — Playwright visual smoke for the 3D battle.
- `scripts/render-portraits.ts` — bakes transparent card portraits from character GLBs (3 canvas readbacks, safe under the GPU limit).
- `e2e/` — Playwright boot smoke.

## 3D asset sources (portfolio)

- KayKit packs: `pokedex-landing/raw-art/asset-packs/` (medieval hexagon unzipped; city/forest/block zips)
- Optimized Meshy characters: `pokedex-landing/public/models/characters/` (~500KB; the 15MB raw ones in `raw-art/characters-user/` must NOT be shipped)
- More: Sin-City `public/models/` (56 env GLBs), Web3-Poker characters, SS-Warzone weapon FBXs

## Golden rules

1. Never import Phaser or DOM APIs into `src/sim/`. Grep check: `grep -ri "phaser" src/sim/` must be empty.
2. Never import Express/Prisma into `src/sim/`, `src/render/`, or `src/render3d/`.
3. All game rules live in sim; renderers only visualize state.
4. Card stats live in `src/sim/cards.json` — balance changes need no code.
5. Replays must be byte-deterministic; `runReplay(seed, decks, commands)` reproduces the same state.
6. Battle visuals render through `src/render3d/Battle3D.ts`. New unit cards need a `CARD_CHAR` entry. Verify visual changes with `npm run smoke-3d`.
7. The server is the source of truth for Elo and async-PvP results; the client only suggests a replay.
8. Headless WebGL gotcha (this Mac): canvas readback (`readPixels`/`toDataURL`) kills the GPU process after ~16 frames. Plain Playwright page screenshots are fine.
