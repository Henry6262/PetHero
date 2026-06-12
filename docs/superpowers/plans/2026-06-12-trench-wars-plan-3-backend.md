# Trench Wars — Plan 3: Backend, Async PvP, Replay Verification

> Goal: a shippable backend that accepts verified match results, stores accounts/decks, and runs an Elo ladder. The browser client stays the authority for the live match (client-side AI), but every ranked result is re-simulated server-side before it is recorded.
> Plans 1 and 2 must be green before starting.

## Architecture

- **Backend** (`server/`): Node + Express + TypeScript + Prisma + PostgreSQL.
- **Client**: submits the deterministic replay `{ seed, decks, commands }` to `/api/matches` after a match ends.
- **Anti-cheat**: server imports the same `src/sim/` package and runs `runReplay(replay)`. If the re-simulated result matches the submitted result and the replay is internally consistent (e.g. commands are valid, player 0 wins), the result is accepted.
- **Auth**: anonymous accounts via signed cookie (`accountId`) created on first visit; optional wallet link later (signature nonce). v1 keeps auth minimal.
- **Async PvP v1**: player fights the AI using a **defender deck** fetched from another player's stored deck. The attacker submits a replay; the defender's Elo is impacted by the outcome. This gives ladder PvP without real-time netcode.
- **Deployment**: Railway (`railway.json`, `Dockerfile` or Nixpacks), Postgres provisioned via Railway.

## Database schema (Prisma)

```prisma
model Account {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  wallet    String?  @unique
  elo       Int      @default(1000)
  wins      Int      @default(0)
  losses    Int      @default(0)
  decks     Deck[]
  matchesAsAttacker Match[] @relation("Attacker")
  matchesAsDefender Match[] @relation("Defender")
}

model Deck {
  id        String   @id @default(cuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  name      String   @default("Starter")
  cards     String[] // 8 card ids
  updatedAt DateTime @updatedAt
  @@unique([accountId, name])
}

model Match {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  attackerId  String
  defenderId  String
  attacker    Account  @relation("Attacker", fields: [attackerId], references: [id])
  defender    Account  @relation("Defender", fields: [defenderId], references: [id])
  replaySeed  Int
  replayCommands Json
  winner      Int      // 0 = attacker, 1 = defender, -1 = draw
  attackerEloChange Int
  defenderEloChange Int
  verified    Boolean  @default(true)
}
```

## API endpoints

- `POST /api/accounts` — create anonymous account; returns `{ id }` and sets cookie.
- `GET /api/accounts/me` — current account + stats.
- `POST /api/accounts/link-wallet` — link Solana wallet (signature verification stub for v1).
- `GET /api/decks` — list decks for current account.
- `POST /api/decks` — save/update a deck `{ name, cards }`.
- `GET /api/ladder` — top N accounts by Elo.
- `GET /api/opponents/:elo` — find a near-Elo defender and their active deck.
- `POST /api/matches` — submit a replay, server re-simulates, updates Elo, returns result.

## Anti-cheat verification

`POST /api/matches` body:
```json
{
  "seed": 1337,
  "decks": [[...], [...]],
  "commands": [...],
  "defenderId": "..."
}
```

Server:
1. Loads defender's active deck.
2. Runs `runReplay({ seed, decks, commands })`.
3. Rejects if:
   - submitted winner doesn't match re-simulated winner
   - match didn't terminate (timeout / bad replay)
   - commands contain unknown cards or invalid positions
   - replay is shorter than a reasonable minimum
4. Computes Elo delta (K=32).
5. Stores match + updates both accounts in a transaction.

## Client wiring

- `src/api/client.ts` — thin fetch wrapper that sends `accountId` cookie.
- On first boot: `POST /api/accounts`, store `accountId` in `localStorage` as fallback and cookie.
- `BattleScene` submits the replay to `/api/matches` when the match ends.
- If backend is unreachable, client falls back to local ladder (Plan 1 behavior) so the game never breaks offline.

## File structure

```
web3-games/trench-wars/
├── server/
│   ├── src/
│   │   ├── index.ts          # Express app bootstrap
│   │   ├── routes/
│   │   │   ├── accounts.ts
│   │   │   ├── decks.ts
│   │   │   ├── ladder.ts
│   │   │   └── matches.ts
│   │   ├── middleware/
│   │   │   └── auth.ts       # accountId cookie resolver
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   ├── elo.ts        # Elo calculation
│   │   │   └── verifyReplay.ts
│   │   └── types.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── tests/
│   │   └── api.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── src/api/client.ts
├── src/game/BattleScene.ts   # submit replay on match end
└── railway.json
```

## Shared sim package

To import `src/sim/` from `server/` cleanly, add `server/tsconfig.json` paths mapping:
```json
"paths": { "@trench/sim/*": ["../src/sim/*"] }
```
And copy/compile the sim folder into server build, OR keep both client and server in the same TS project. For v1, the simplest approach is a shared `src/sim/` that both client and server import via path aliases; the server build step bundles it.

## Tasks

### Task 1: Backend scaffold + Prisma schema
- Create `server/` with `package.json`, `tsconfig.json`, `prisma/schema.prisma`.
- Install `express`, `cors`, `cookie-parser`, `prisma`, `@prisma/client`, `typescript`, `tsx`, `vitest`, `supertest`.
- Run `prisma migrate dev --name init`.
- Commit.

### Task 2: Shared sim import + verifyReplay
- Wire `server/tsconfig.json` to import from `../src/sim/`.
- Write `server/src/lib/verifyReplay.ts` that uses `runReplay` and validates the replay.
- Add unit test `server/tests/verifyReplay.test.ts`.
- Commit.

### Task 3: Accounts + auth middleware
- `POST /api/accounts` creates account, sets `accountId` cookie.
- `GET /api/accounts/me` returns account + stats.
- Middleware resolves account from cookie.
- Tests.
- Commit.

### Task 4: Deck storage
- `GET /api/decks`, `POST /api/decks`.
- Validate deck has 8 known card ids.
- Tests.
- Commit.

### Task 5: Ladder + opponent lookup
- `GET /api/ladder?limit=20`.
- `GET /api/opponents/:elo` returns random account near that Elo with a deck.
- Tests.
- Commit.

### Task 6: Match submission + Elo update
- `POST /api/matches` with full anti-cheat verification.
- Elo calculation with K=32.
- Prisma transaction for match + account updates.
- Tests.
- Commit.

### Task 7: Client API client + BattleScene submission
- `src/api/client.ts`.
- Create account on first boot, store id.
- Submit replay after match end; fallback to local ladder on error.
- Commit.

### Task 8: Railway config + docs
- `server/Dockerfile`, `railway.json`, `.env.example`.
- Update README/CLAUDE.md with backend commands.
- Commit.

### Task 9: Full verification
- `npm test` (client) green.
- `cd server && npm test` (server) green.
- `npm run build` (client) green.
- Playwright smoke green.
- Commit any final fixes.

## Done criteria

- A fresh browser session creates an anonymous account.
- Player can save a deck.
- Player can fetch a defender deck and play a match.
- Match result is re-simulated server-side before Elo changes.
- Ladder endpoint returns ranked accounts.
- `src/sim/` still has zero Phaser/Express imports.
- Backend is deployable to Railway with one command.
