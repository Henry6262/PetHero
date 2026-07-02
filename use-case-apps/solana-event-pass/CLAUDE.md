# CLAUDE.md — Solana Event Pass

> Read `~/Documents/Gazillion-dollars/AGENTS.md` first.

## What it is

A Solana-native mobile event platform for crypto conferences, meetups, and festivals. It unifies agendas, cashless token payments, attendance badges, and city exploration into one app — starting with the ecosystem that already needs it most: Solana Foundation, Superteam, and Web3-native organizers.

Born from first-hand friction at Blockchain Week Berlin / Web3 Summit: attendees juggle Luma, Telegram, cash, QR codes, and word-of-mouth. Organizers lack a unified payments, analytics, and engagement layer. Solana Breakpoint already proved the model; this product standardizes it for every Solana event.

## Status

- Anchor escrow program compiles, passes local tests, and deploys to a local validator.
- Backend Anchor client (`lib/anchor.ts`) and token transaction builder (`services/tokens.ts`) are wired into the wallet routes.
- Backend pay-vendor transaction endpoint (`POST /payments/transaction`) builds a signed-ready `pay_vendor` transaction; `POST /payments/verify` records it on-chain and in the DB.
- Mobile Expo app (`apps/mobile`) has been redesigned end-to-end to match the Hi-Fi v1 UI/UX spec (`Mobile-first event navigation design`). It now includes onboarding (Sol orb, wallet connect, success), tab-bar shell (Events / Wallet / Pay / POAPs / Sol), events feed, event detail, wallet with top-up/pay, POAP grid, Sol AI assistant, explore categories/partner offers/side events, and gamification (quests, leaderboard, reward pool). It passes `tsc --noEmit` and `bun expo export --platform web`.
- Custom fonts Inter and Space Grotesk are loaded via `expo-font` / `@expo-google-fonts`.
- Wallet adapter abstraction is in place (`apps/mobile/lib/wallet/`). The dev-key adapter remains for local testing. **Phantom deep-link adapter is implemented** for iOS/Android: connect, sign message (for backend auth), and sign-and-send transaction (for top-up/pay) using TweetNaCl x25519 encryption and the `solanaeventpass://` redirect scheme registered in `app.json`.
- Onboarding now routes Phantom to the real deep-link flow; Solflare and Backpack are stubbed as "Coming soon".
- Local end-to-end test (`apps/api/scripts/e2e-local.ts`) passes: starts a local validator, deploys the program, seeds the DB, funds test keypairs, creates a fake USDC mint, initializes the event on-chain, and exercises auth → top-up → pay-vendor via the API.
- Devnet deployment is currently blocked by an inactive SBPF feature gate on Agave 4.x public clusters (legacy SBF binaries are rejected; modern SBPF binaries are rejected because SIMD-0161 / Loader-v4 is not yet enabled).
- Next: re-attempt devnet deploy once the feature gate activates; test Phantom deep-link flow on a real device/simulator; add Solflare/Backpack deep-link adapters; refine font-weight mapping per design tokens.

## Quick start (backend)

```bash
# 1. Install dependencies
bun install

# 2. Start PostgreSQL + Redis
docker compose up -d

# 3. Copy env and fill in real values (optional for local dev)
cp .env.example .env

# 4. Run migrations + seed sample events
bun run db:migrate
bun run db:seed

# 5. Start API
bun run dev
# API is now on http://localhost:3002
```

## API endpoints (MVP)

```
GET    /health
POST   /auth/nonce
POST   /auth/verify
GET    /events
GET    /events/:id
POST   /luma/sync
POST   /payments/request
POST   /payments/verify
GET    /wallet/:eventId
GET    /wallet/:eventId/history
POST   /wallet/:eventId/topup
POST   /wallet/orders/:orderId/complete
POST   /wallet/orders/:orderId/topup-transaction
POST   /wallet/orders/:orderId/verify-onchain
POST   /payments/transaction
POST   /payments/verify
GET    /guide/:eventId/locations
GET    /guide/locations/:id
POST   /guide/locations/:id/checkin
GET    /guide/:eventId/missions
GET    /guide/:eventId/rewards
POST   /guide/rewards/:id/claim
POST   /guide/admin/locations
PUT    /guide/admin/locations/:id
POST   /guide/admin/missions
PUT    /guide/admin/missions/:id
POST   /guide/admin/rewards
PUT    /guide/admin/rewards/:id
```

All protected endpoints require `Authorization: Bearer <jwt>`.

### Dev token (local testing only)

```bash
cd apps/api
bun run dev:token
```

This prints a JWT for the seeded test user (`111111...1111`).

## On-chain program

Location: `packages/solana/event-pass/`

```bash
cd packages/solana/event-pass

# Build (needs platform-tools v1.52 because dependencies require Rust >=1.89)
anchor build -- --tools-version v1.52

# Run local tests
anchor test
```

Program instructions: `initialize_event`, `create_token_mint`, `create_escrow`, `top_up`, `pay_vendor`, `redeem_unused`, `close_event`.

## Local end-to-end test

One command starts a local validator, deploys the program, seeds the DB, and runs the full attendee flow.

Prerequisites:

- Docker Compose running PostgreSQL + Redis (`docker compose up -d`)
- DB migrated and seeded (`bun run --cwd packages/db migrate && bun run --cwd packages/db seed`)
- Anchor build artifacts present (`packages/solana/event-pass/target/deploy/event_pass.so`)

Run:

```bash
cd apps/api
bun run e2e:local
```

What it does:

1. Starts `solana-test-validator` on port 8899.
2. Deploys `event_pass.so` using the keypair in `target/deploy/`.
3. Funds test organizer / attendee / vendor keypairs.
4. Creates a fake 6-decimal USDC mint and funds the attendee.
5. Initializes the seeded Berlin event on-chain and updates `event_tokens.mintAddress`, `event_tokens.usdcEscrowAddress`, and `terminals.walletAddress` to match.
6. Starts the Hono API server on port 3002.
7. Authenticates the attendee wallet.
8. Top-up: creates an order, builds the on-chain `top_up` transaction, signs and sends it, then verifies it via `/wallet/orders/:id/verify-onchain`.
9. Pay vendor: builds the on-chain `pay_vendor` transaction, signs and sends it, then verifies via `/payments/verify`.
10. Asserts final wallet balance (7.5 BBW26) and vendor USDC balance (2.5 USDC).

Use `SEP_E2E_SKIP_VALIDATOR=1 bun run e2e:local` to reuse an already-running local validator.

## Mobile app

Location: `apps/mobile/`

```bash
cd apps/mobile

# Verify types and web bundle export
bun tsc --noEmit
bun expo export --platform web

# Start Expo (configure API/RPC in app.json extra first)
bun start
```

The app is organized around a custom tab bar (`(tabs)`): **Events**, **Wallet**, **Pay** (center action), **POAPs**, **Sol**. Additional stack screens cover onboarding, event detail, top-up, pay/scan, success, explore, and quests.

Dev wallet flow: paste a base58 secret key → log in → view events → top up → pay vendor.
Production wallet integration: Phantom deep-link connect is wired via `lib/wallet/phantom.ts`. Solflare and Backpack deep-link adapters are pending.

> **Build note:** `babel-preset-expo` and `@babel/runtime` are required dev dependencies for web export in this monorepo layout. They are already listed in `apps/mobile/package.json`.

## Project layout

```
solana-event-pass/
  apps/api/                    # Hono API
  apps/mobile/                 # Expo + React Native
  packages/db/                 # Drizzle schema + migrations
  packages/solana/event-pass/  # Anchor program + IDL
  docs/
    ARCHITECTURE.md            # System design
    FEATURES.md                # Feature spec
    ROADMAP.md                 # Build phases + metrics
    DESIGN_BRIEF.md            # UI brief for Claude
  README.md
  CLAUDE.md                    # This file
```

## Tech stack

- **Mobile:** Expo (React Native) + Mobile Wallet Adapter (Phantom/Solflare/Backpack)
- **Backend:** Bun + TypeScript + Hono
- **Database:** PostgreSQL
- **Cache / queues:** Redis + BullMQ
- **On-chain:** Solana Pay, SPL tokens, USDC, Metaplex compressed NFTs (POAPs)
- **Integrations:** Luma API, River (community events), Eventbrite fallback, Mapbox/Google Maps (Phase 2)
- **Auth:** Wallet-first, with optional Privy email/social fallback
- **Infra:** Railway/Fly.io + Expo EAS

## Key documents

```
solana-event-pass/
  docs/
    ARCHITECTURE.md  # System design, data model, integrations
    FEATURES.md      # Feature modules, user stories, priorities
    ROADMAP.md       # Phased build plan + metrics
  README.md          # Founder pitch + quick links
  CLAUDE.md          # This file
```

## MVP scope (Phase 1)

Events + Token Wallet only. No city guide, no cannabis module, no marketplace in Phase 1. Goal: validate the closed-loop SPL token payment loop with 3 pilot events.

## Core principles

1. **Wallet-first.** Attendees auth with their Solana wallet; no new account password.
2. **Luma is the data backend.** We are the experience + wallet layer, not a ticketing replacement.
3. **Closed-loop tokens per event.** Each event mints its own SPL token backed 1:1 by USDC escrow. This drives spending uplift and real-time vendor analytics.
4. **Compliance-first grey-zone features.** Cannabis/CSC content is educational and geo-restricted; never a marketplace. Defer to Phase 2.
5. **Public-good positioning for grants.** Open-source core components; commercial services layered on top.

## Last updated

2026-06-18
