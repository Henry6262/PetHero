# StreetRivalz — Plan 3: Backend (Accounts, Ghosts, Ladder, Grand Prix)

**Date:** 2026-06-12  
**Goal:** A thin Railway backend that accepts verified replays, stores ghosts, runs an Elo-style ladder, and schedules Grand Prix events with SOL prize pools.  
**Spec:** `docs/superpowers/specs/2026-06-12-street-rivalz-design.md`  
**Predecessor:** Plan 2 (AI + items + Quick Race) — must be complete.

---

## Architecture notes

- Backend lives in `web3-games/street-rivalz/api/` as a separate Node service.
- Stack: **Fastify** + **Prisma** + **SQLite** (local dev) / **PostgreSQL** (Railway prod).
- Auth: anonymous cookie sessions for v1 (Solana wallet connect deferred to Season 1).
- Determinism is the anti-cheat: server re-simulates replays with the same `runRace()` engine used by the client.
- Client submits `{ seed, trackDef, carId, inputs[] }`; server verifies and accepts only if the replay is valid.

---

## Task 3.1: Backend scaffold — Fastify + Prisma + SQLite/Postgres

**Files:**
- Create: `web3-games/street-rivalz/api/package.json`
- Create: `web3-games/street-rivalz/api/tsconfig.json`
- Create: `web3-games/street-rivalz/api/.env.example`
- Create: `web3-games/street-rivalz/api/.gitignore`
- Create: `web3-games/street-rivalz/api/src/server.ts` (stub)
- Create: `web3-games/street-rivalz/api/prisma/schema.prisma`

Dependencies: `fastify`, `@fastify/cors`, `@fastify/cookie`, `prisma`, `@prisma/client`, `zod`, `vitest`, `tsx`.

Server stub:

```ts
import fastify from 'fastify'
const app = fastify({ logger: true })
app.register(import('@fastify/cors'))
app.register(import('@fastify/cookie'))
app.get('/health', async () => ({ ok: true }))
const start = async () => { await app.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' }) }
start()
```

Commit: `feat(street-rivalz): backend scaffold — Fastify + Prisma + SQLite`

---

## Task 3.2: DB schema — accounts, replays, ghosts, ladder, Grand Prix

**Files:**
- Create: `web3-games/street-rivalz/api/prisma/schema.prisma`

Schema:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Account {
  id        String   @id @default(uuid())
  anonId    String   @unique @default(uuid())
  createdAt DateTime @default(now())
  replays   Replay[]
  ladders   LadderEntry[]
}

model Replay {
  id         String   @id @default(uuid())
  accountId  String
  trackId    String
  carId      String
  seed       Int
  inputsJson String
  finalTime  Float    // seconds
  verified   Boolean
  createdAt  DateTime @default(now())
  account    Account  @relation(fields: [accountId], references: [id])
  ghostOf    Ghost?
}

model Ghost {
  id        String   @id @default(uuid())
  replayId  String   @unique
  trackId   String
  accountId String
  mmr       Int      @default(1000)
  createdAt DateTime @default(now())
  replay    Replay   @relation(fields: [replayId], references: [id])
}

model LadderEntry {
  id        String   @id @default(uuid())
  accountId String
  trackId   String
  bestTime  Float
  mmr       Int      @default(1000)
  updatedAt DateTime @updatedAt
  account   Account  @relation(fields: [accountId], references: [id])
  @@unique([accountId, trackId])
}

model GrandPrix {
  id          String   @id @default(uuid())
  trackId     String
  startsAt    DateTime
  endsAt      DateTime
  prizePool   String   @default("0") // lamports or SOL string
  state       String   @default("qualifying") // qualifying | finals | finished
  createdAt   DateTime @default(now())
}

model GrandPrixEntry {
  id          String    @id @default(uuid())
  gpId        String
  accountId   String
  qualifyingTime Float?
  finalTime   Float?
  rank        Int?
  createdAt   DateTime  @default(now())
  @@unique([gpId, accountId])
}
```

Commit: `feat(street-rivalz): Prisma schema for accounts, replays, ghosts, ladder, Grand Prix`

---

## Task 3.3: Replay verification endpoint

**Files:**
- Create: `web3-games/street-rivalz/api/src/verify.ts`
- Create: `web3-games/street-rivalz/api/src/sim-bridge.ts`

The backend needs access to the sim. The clean way: sim code stays in `web3-games/street-rivalz/src/sim/` and is imported by the API via relative imports. Since `api/` is inside the project, `import { runRace } from '../src/sim/runner'` works after TS config is set up.

Verification function:

```ts
export function verifyReplay(
  trackDef: TrackDef,
  numKarts: number,
  inputs: KartInput[][],
  carParams: KartParams,
): { valid: boolean; finalTime?: number; error?: string }
```

Rules:
- Re-simulate with `runRace(trackDef, numKarts, inputs, carParams)`.
- Time = `race.tick * DT` when race finished, or total progress if not.
- Reject if any checkpoint skipped (lap should increment normally) or if kart leaves road beyond tolerance (already constrained by sim).
- For v1, only verify Time Trial replays (1 kart). Quick Race stays client-side-only.

Endpoint: `POST /replays/verify`

Body: `{ trackDef, carId, seed, inputs }`
Response: `{ valid: true, finalTime, replayId? }` or `{ valid: false, error }`

Commit: `feat(street-rivalz): replay verification endpoint using deterministic sim`

---

## Task 3.4: Ghost endpoints — submit + fetch rival ghosts

**Files:**
- Create: `web3-games/street-rivalz/api/src/routes/ghosts.ts`

Endpoints:
- `POST /ghosts/submit` — verify replay, store Replay + Ghost rows, return ghostId.
- `GET /ghosts/:trackId?count=3&nearMmr=1000` — return 3 ghosts near the requester's MMR for Time Trial rivalry.

Ghost payload includes `inputs`, `carId`, `finalTime`, `mmr`, `displayName`.

Commit: `feat(street-rivalz): ghost submit + fetch endpoints`

---

## Task 3.5: Ladder/Elo endpoints

**Files:**
- Create: `web3-games/street-rivalz/api/src/routes/ladder.ts`

Endpoints:
- `GET /ladder/:trackId?limit=20` — top 20 times for track.
- `GET /ladder/:trackId/me` — caller's best time + rank (needs session).
- On verified submit, update LadderEntry bestTime and adjust MMR:
  - If new PB: MMR +20
  - If not PB but top 10%: MMR +5

Commit: `feat(street-rivalz): ladder endpoints + MMR updates on verified PB`

---

## Task 3.6: Grand Prix event endpoints

**Files:**
- Create: `web3-games/street-rivalz/api/src/routes/grandprix.ts`

Endpoints:
- `GET /grandprix/active` — currently active Grand Prix (qualifying or finals).
- `POST /grandprix/:id/qualify` — submit qualifying replay (verify + store time).
- `GET /grandprix/:id/leaderboard` — qualifying leaderboard.
- `POST /grandprix/:id/finals` — admin-only: close qualifying, open finals.
- `GET /grandprix/:id/results` — final results + prize pool.

For v1, admin state transitions are manual or via a seed script.

Commit: `feat(street-rivalz): Grand Prix event endpoints`

---

## Task 3.7: Client integration — submit replay, show ladder, load ghosts

**Files:**
- Create: `web3-games/street-rivalz/src/api/client.ts`
- Modify: `web3-games/street-rivalz/src/game/quickRace.ts` / main.ts

Client functions:
- `submitTimeTrialReplay(replay)`
- `getGhosts(trackId, mmr)`
- `getLadder(trackId)`

Add a Time Trial mode to the client:
- Race against no AI, record inputs.
- On finish, submit replay to backend.
- Show ladder and load ghost for next run.

For v1, add a simple UI overlay after Time Trial finish.

Commit: `feat(street-rivalz): client API + Time Trial mode with ghost/ladder integration`

---

## Task 3.8: Railway deployment config + env

**Files:**
- Create: `web3-games/street-rivalz/api/railway.json`
- Create: `web3-games/street-rivalz/api/Dockerfile`
- Modify: `web3-games/street-rivalz/api/.env.example`

Env:
```
DATABASE_URL="postgresql://..."
PORT=3001
CORS_ORIGIN="https://street-rivalz.vercel.app"
```

Add `api:start` script and a health check.

Commit: `feat(street-rivalz): Railway deployment config for backend`

---

## Task 3.9: Backend tests + final verification

- Vitest tests for verify function.
- HTTP tests using `fastify.inject()` for routes.
- `npm test` in `/api` passes.
- `npm run build` in both `/api` and root passes.

Commit: `test(street-rivalz): backend verification + route tests, all green`

---

## Self-review notes

- Keep auth anonymous for v1 to avoid blocking the launch. Wallet connect is a Season 1 upgrade.
- Determinism is the trust anchor — the server re-simulates every replay before accepting it.
- Grand Prix prize pool is stored as a string (SOL/lamports) and updated manually or by a cron in v1.
