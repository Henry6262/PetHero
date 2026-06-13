# Trench Wars — Agent Notes

> Browser Clash Royale-style lane battler — Traders vs Jeets. Deterministic fixed-tick sim + **real 3D battle renderer (Three.js)** + **React UI shell** (menu, deck builder, battle HUD) + Express/Prisma backend. No Phaser.
>
> The battle arena is full 3D: KayKit Medieval Hexagon tiles/towers/decoration (`public/assets/3d/kaykit/`) + Meshy AI animated characters (`public/assets/3d/chars/`, meshopt-compressed GLBs ~500KB each). `src/render3d/Battle3D.ts` owns the WebGL canvas inside a React-managed stage; hp bars + particle VFX draw on a 2D overlay canvas; cards/elixir/result are React DOM. Fonts self-hosted via @fontsource.
> Spec: `docs/superpowers/specs/2026-06-12-trench-wars-design.md`
> Plan 1: `docs/superpowers/plans/2026-06-12-trench-wars-v1-core.md`
> Plan 3: `docs/superpowers/plans/2026-06-12-trench-wars-plan-3-backend.md`

## Client

- `npm run dev` — play locally vs AI ladder (drag a card onto your half, or tap card + tap arena)
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

### Production (deployed 2026-06-12)

- Client: https://trench-wars-henry6262s-projects.vercel.app — Vercel project `trench-wars`, deploy with `vercel --prod` from this dir; `VITE_API_URL` set in Vercel env.
- API: https://trench-wars-api-production.up.railway.app — Railway project `trench-wars`, service `trench-wars-api`. Deploy with `railway up --service trench-wars-api --detach` FROM THIS DIRECTORY (monorepo context: server imports ../src/sim at runtime via tsx; root railway.json scopes build/start to server/). DB = sqlite on a Railway volume at /data (Postgres migration is pre-launch hardening). Cross-site cookies require CLIENT_URL to be https (SameSite=None logic in server/src/lib/auth.ts).
- IMPORTANT: any change to src/sim/ must redeploy BOTH client and server — anti-cheat re-simulates replays and they must match.
- Verify prod: `npx tsx scripts/prod-check.ts`

### Deploy (Railway)

1. Add `server/` as a Railway service.
2. Provision a PostgreSQL database and link it (sets `DATABASE_URL`).
3. Set `COOKIE_SECRET` and `CLIENT_URL`.
4. Push; `server/railway.json` tells Railway how to build and start.

## Architecture

- `src/sim/` — pure TS, NO React/Three/Express imports. Deterministic at 10 ticks/sec.
  - `rng.ts` — pure seeded RNG `[value, nextState]`
  - `constants.ts`, `types.ts`, `cards.json`, `cards.ts` — roster + config
  - `sim.ts` — `createMatch`, `validateDeploy`, `step` (deploy → elixir → auras → units → towers → win)
  - `replay.ts` — `runReplay` + `fingerprint` (anti-cheat foundation)
  - `ai.ts` — deterministic AI policy + 5-level ladder configs; casts damage spells on enemy clusters (≥3)
  - 20 cards / 6 mechanics: swarms, ranged, splash, stealth (rug-dev), flee (paper-hands), auras (influencer/fud),
    `targetsTowers` win-condition (moon-boy), `building` stationary decaying structure (trading-bot),
    spell types: damage (liquidation/gas-war), buff (pump-signal), `effectHeal` (copium)
- `src/render3d/` — Three.js battle renderer.
  - `Battle3D.ts` — WebGL canvas inside the React stage; instanced hex arena + river + bridges, hand-placed decoration (`decorate()`), blue/red KayKit towers, Meshy character units with walk/attack animation (meshopt GLBs), ground raycast for deploys (`screenToSim`), camera projection for the HUD overlay (`project`). Card→character mapping in `CARD_CHAR`.
- `src/render/` — presentation helpers.
  - `Brand.ts` — color/copy tokens (CSS source of truth is `src/ui/theme.css`)
  - `Vfx2D.ts` — particles + spell rings on the 2D overlay canvas
  - `AudioBus.ts` — optional drop-in HTMLAudio SFX/music bus
- `src/ui/` — React shell (Vite + @vitejs/plugin-react).
  - `App.tsx` — screen state machine (menu | deck | battle), account state
  - `Menu.tsx` — guest/wallet login, Elo display, mode buttons (data-testids: guest, practice, deck)
  - `DeckBuilder.tsx` — card grid w/ portraits, 8-card deck, server save
  - `Battle.tsx` — battle screen: stage div (3D canvas + 2D overlay + result modal) + HUD (hand, elixir, next, mute)
  - `CardTile.tsx`, `theme.css` — shared card component + design tokens
- `src/game/` — engine-agnostic game drivers.
  - `unlocks.ts` — client-side card progression: base set + win-gated tiers (3/7/12 wins). UX gate only, never affects sim/anti-cheat.
  - `BattleController.ts` — rAF sim loop, drives Battle3D + Vfx2D + AudioBus, drag/click deploys, replay submit, emits BattleSnapshot to React
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

1. Never import React/Three/DOM APIs into `src/sim/`. Grep check: `grep -riE "react|three" src/sim/` must be empty.
2. Never import Express/Prisma into client code. React components never touch the sim directly — only via `BattleController`.
3. All game rules live in sim; renderers only visualize state.
4. Card stats live in `src/sim/cards.json` — balance changes need no code.
5. Replays must be byte-deterministic; `runReplay(seed, decks, commands)` reproduces the same state.
6. Battle visuals render through `src/render3d/Battle3D.ts`. New unit cards need a `CARD_CHAR` entry. Verify visual changes with `npm run smoke-3d`.
7. The server is the source of truth for Elo and async-PvP results; the client only suggests a replay.
8. Headless WebGL gotcha (this Mac): canvas readback (`readPixels`/`toDataURL`) kills the GPU process after ~16 frames. Plain Playwright page screenshots are fine.
