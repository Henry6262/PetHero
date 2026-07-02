# Solana Event Pass

> The unified Solana-native event app: agenda, token wallet, payments, and POAPs in one place.

## The problem

Crypto events today run on a broken stack:
- **Luma / Eventbrite** for registration
- **Cash or Stripe** for food, drinks, and merch
- **Telegram groups** for city tips and side events
- **POAP** for attendance badges
- **Word-of-mouth** for local deals

Attendees waste time juggling apps. Organizers lose data, vendor revenue, and engagement.

## The opportunity

Solana's event ecosystem is scaling fast: 700+ Superteam events, Breakpoint 7,000+ attendees, APEX conferences across five mega-regions. No one has built a Web3-native, all-in-one event experience platform. Solana Pay, SPL tokens, and compressed NFTs make this technically trivial and economically superior.

## What we build

A mobile app that turns any Solana event into a seamless, token-powered experience:

1. **Event Hub** — agenda, speakers, session reminders, personal schedule.
2. **Token Wallet** — event-specific SPL tokens for food, drinks, and merch. Top up with USDC or fiat on-ramp. Pay via Solana Pay QR.
3. **POAPs** — attendance badges as compressed NFTs.
4. **City Guide** *(Phase 2)* — curated spots, routes, geo-check-ins, local discounts.
5. **CSC Navigator** *(Phase 2)* — legal cannabis info for grey-zone jurisdictions, framed as education only.

## Why it wins

- **Founder fit:** Built a similar Breakpoint app at LimeChain.
- **Distribution:** Direct relationships with Superteam Germany, Brazil, and global organizers.
- **Timing:** Solana Foundation is actively investing in event infrastructure and public goods.
- **Tech readiness:** Solana Pay, USDC on Solana, Luma API, and Mobile Wallet Adapter are production-grade.

## Documents

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design
- [`docs/FEATURES.md`](docs/FEATURES.md) — feature specification
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — build phases & metrics

## Status

- Anchor escrow program is built and passes local tests (7/7).
- Backend Anchor client + wallet top-up transaction endpoints are wired.
- Devnet deployment is temporarily blocked by the Agave 4.x SBPF feature gate; local validator deploy works.
- Next: mobile UI integration and devnet redeploy once the feature gate activates.

---

Built in `~/Documents/Gazillion-dollars/use-case-apps/solana-event-pass`.
