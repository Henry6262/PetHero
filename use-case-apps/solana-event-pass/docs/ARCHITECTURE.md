# Solana Event Pass — Architecture

## Overview

Solana Event Pass is a mobile-first event experience platform. It consumes event data from existing providers (Luma primary, River/Eventbrite fallback) and layers on a Solana-native token wallet, Solana Pay checkout, and POAP badges.

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Expo)                       │
│  Event Hub │ Token Wallet │ Solana Pay QR │ POAP Collection │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   Mobile Wallet   Solana RPC    Push Notifications
   Adapter         /Helius       (Firebase/Expo)
        │              │              │
┌───────▼──────────────▼──────────────▼───────────────────────┐
│                   Backend API (Bun + Hono)                  │
│  Auth │ Events │ Orders │ Vendors │ Webhooks │ POAP Jobs    │
└───────┬─────────────────────────────┬───────────────────────┘
        │                             │
   PostgreSQL                    Redis + BullMQ
        │                             │
   Luma API ──┐                 Solana Program
   River  ────┼── Event sync     (token escrow)
   Eventbrite ┘
```

## Mobile app

### Stack
- **Expo SDK** with React Native
- **Solana Mobile Wallet Adapter** for wallet connection and signing
- **react-native-vision-camera** for Solana Pay QR scanning
- **React Query** for server state, **Zustand** for local state
- **Expo Router** for navigation

### Screens (MVP)
1. **Connect Wallet** — Mobile Wallet Adapter deep-link.
2. **Events Feed** — list of synced Luma events the wallet is registered for.
3. **Event Detail** — agenda, speakers, my schedule.
4. **Wallet** — token balance, top-up, transaction history.
5. **Pay** — scan vendor QR (Solana Pay tx request) or show payer QR.
6. **POAPs** — grid of earned attendance badges.

## Backend

### Stack
- **Bun + TypeScript + Hono** — lightweight HTTP API
- **PostgreSQL** — relational data
- **Redis** — sessions, caching, real-time pub/sub
- **BullMQ** — background job processing
- **Zod** — validation

### Modules
| Module | Responsibility |
|--------|----------------|
| `auth` | Wallet message signing, nonce issuance, JWT sessions |
| `events` | Sync from Luma/River/Eventbrite; cache agendas |
| `tickets` | Attendee eligibility, check-in status |
| `tokens` | SPL token creation, mint/burn, escrow accounting |
| `orders` | Top-ups, refunds, vendor payouts |
| `payments` | Solana Pay tx request generation, verification |
| `vendors` | Vendor accounts, POS QR codes, sales analytics |
| `poaps` | Attendance verification, compressed NFT minting |
| `webhooks` | Luma event/guest webhooks, on-chain tx listeners |

## On-chain design

### Program
Custom Anchor program: `packages/solana/event-pass/programs/event_pass/`.

Instructions:
1. `initialize_event(event_id)` — creates the event state PDA and event authority PDA.
2. `create_token_mint(event_id)` — creates the event SPL mint (decimals = 6).
3. `create_escrow(event_id, usdc_mint)` — creates the program-owned USDC escrow ATA.
4. `top_up(amount)` — attendee transfers USDC to escrow; program mints 1:1 event tokens.
5. `pay_vendor(amount)` — attendee burns event tokens; escrow releases USDC to vendor.
6. `redeem_unused(amount)` — post-event, attendee burns remaining tokens for USDC refund.
7. `close_event()` — organizer recovers leftover USDC and marks event inactive.

### Event token model
Each event creates one SPL token (e.g. `BREAKPOINT2026`) backed 1:1 by USDC held in a program-controlled escrow.

```
Attendee tops up $100 USDC
        │
        ▼
┌───────────────────┐
│  Escrow Program   │
│  holds USDC       │
└─────────┬─────────┘
          │ mints 100 BREAKPOINT2026 tokens
          ▼
   Attendee wallet
          │
          │ pays vendor 15 BREAKPOINT2026
          ▼
   Vendor wallet
          │
          │ redeems 15 BREAKPOINT2026 → USDC
          ▼
   Escrow burns tokens, releases USDC
```

### Why closed-loop tokens
- Proven festival cashless uplift: 25–60% higher spend.
- Near-instant settlement and auditable reconciliation.
- Tokens can retain post-event utility or become memorabilia.
- Organizer controls redemption window and refund policy.

### Solana Pay flow
1. Vendor POS app generates a Solana Pay transaction request URL.
2. Attendee scans QR with the app.
3. App constructs an SPL token transfer transaction.
4. Wallet signs and submits.
5. Backend indexes the transaction and updates vendor balance.

### POAPs
- Use Metaplex compressed NFTs (bubblegum) for low-cost minting.
- Mint triggered by check-in verification (QR scan at venue) or Luma guest sync.
- Badge metadata stored on Arweave/IPFS.

## Data model (simplified)

```
Organization
  └── Event
        ├── Session
        ├── Speaker
        ├── TicketType (synced from Luma)
        └── EventToken (SPL mint + escrow)

User (wallet publicKey)
  ├── Ticket (event + ticket type + check-in status)
  ├── TokenBalance (event token + amount)
  ├── Order (top-up / refund)
  └── Poap (mint address + event)

Vendor
  ├── EventVendor (event-specific config)
  ├── Terminal (POS device / QR code)
  └── Transaction (per-payment record)
```

## Integrations

### Luma (primary)
- Use Luma Plus API ($59/mo) for event CRUD, ticket types, guest lists.
- Webhooks for real-time guest registration and check-in.
- Rate limit: 200 req/min Calendar, 500 req/min Organization.

### River (secondary)
- Manual event JSON import or API sync if available.
- Target Superteam's existing River workflow.

### Eventbrite (fallback)
- REST API for event listings and attendee lists.

### Fiat on-ramp
- Kado or Circle for credit-card → USDC top-ups.

## Security

- All admin/vendor endpoints require signed JWT.
- Escrow program is upgrade authority controlled by multi-sig.
- Vendor terminals use single-use or rotating QR codes.
- Refunds capped to unused balance and organizer policy.

## Deployment

| Layer | Target |
|-------|--------|
| Mobile | Expo EAS (iOS TestFlight + Android Internal) |
| API | Railway or Fly.io |
| Database | Railway PostgreSQL or Supabase |
| Cache/Queue | Railway Redis or Upstash |
| On-chain program | Solana devnet → mainnet via Anchor |
| Storage | Arweave/IPFS for POAP metadata |

Required environment variables:
- `SOLANA_RPC_URL` — e.g. `https://api.devnet.solana.com`
- `SOLANA_NETWORK` — `devnet` | `testnet` | `mainnet-beta`
- `EVENT_PASS_PROGRAM_ID` — deployed program ID
- `USDC_MINT` — USDC mint for the target cluster
- `SOLANA_BACKEND_KEYPAIR_BASE58` — optional backend signer for admin transactions

## Open technical questions

1. ~~Do we build a custom escrow program in Anchor, or use a multi-sig + Token Program?~~ → Custom Anchor program is built and local tests pass.
2. Should Phase 1 support direct USDC payments in addition to event tokens?
3. Which push notification provider? (Expo Push vs Firebase)
4. Offline transaction queue strategy for unreliable venue WiFi.
5. Devnet deployment is blocked until Agave 4.x enables SIMD-0161 / Loader-v4; re-attempt once the feature gate is active.
