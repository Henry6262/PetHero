# Solana Event Pass — Roadmap

## North star
Become the default event experience layer for Solana: every attendee uses one app for agendas, payments, and badges; every organizer gets real-time analytics and a cashless token economy.

## Phase 0: Validation (Month 1–2)
**Goal:** De-risk the core assumptions before writing production code.

| Milestone | Deliverable | Success Criteria |
|-----------|-------------|------------------|
| Luma API test | Working API client + event sync demo | Pull 50 real events; map ticket types and guest lists |
| Solana Pay prototype | End-to-end SPL token payment on devnet | Wallet → vendor QR → escrow → redemption in <3s |
| Organizer interviews | 5 recorded interviews | 3+ express strong pain around cashless payments or fragmented apps |
| Pilot LOIs | 3 letters of intent | At least one Superteam chapter commits to pilot |
| Foundation alignment | Initial pitch deck | Feedback from Solana Foundation events or grants team |

## Phase 1: MVP (Month 3–6)
**Goal:** Ship Events + Token Wallet to 3 pilot events.

| Milestone | Deliverable | Target |
|-----------|-------------|--------|
| Mobile app (iOS/Android) | Expo app on TestFlight / Internal | 500 downloads |
| Event Hub | Luma-synced agenda + bookmarks | 3 events live |
| Token Wallet | Top-up, balance, history | $10K top-up volume |
| Vendor POS | Web POS with Solana Pay QR | 10+ vendors per event |
| POAPs | Compressed NFT attendance badges | 1,000+ mints |
| Organizer dashboard | Real-time sales + check-ins | Used by 3 organizers |

**Metrics target for Phase 1**
- Events powered: 3–5
- Attendees using app: 2,000
- Token top-up volume: $10K
- App Store rating: 4.0+
- Organizer NPS: 40+

## Phase 2: Growth (Month 7–12)
**Goal:** Scale to Superteam chapters and add city experience layer.

| Milestone | Deliverable | Target |
|-----------|-------------|--------|
| Luma partnership | Formal integration / co-marketing | Luma lists us in integrations directory |
| Superteam rollout | Germany + Brazil + 2 more chapters | 50+ events |
| City Guide v1 | Curated spots + geo-check-ins | 20 partner businesses per pilot city |
| Local Discounts | Token-gated promo redemptions | $25K tracked discount value |
| Analytics v1 | Full organizer + vendor dashboards | 50+ active organizers |
| CSC Navigator | Educational grey-zone module | Live in DE/BR where legal |

**Metrics target for Phase 2**
- Events powered: 100
- Attendees using app: 25,000
- Token top-up volume: $250K
- City guide partners: 200
- App Store rating: 4.5+

## Phase 3: Scale (Year 2)
**Goal:** Turn the app into a self-sustaining platform.

| Milestone | Deliverable | Target |
|-----------|-------------|--------|
| Revenue model | Transaction fees + sponsored placements | $50K MRR |
| Self-serve event creation | Create event + token in UI | 500+ events |
| Open-source SDK | Core event/wallet SDK | Community contributors |
| Multi-chain watchlist | Ethereum/Polygon POAP imports | Strategic option only |

**Metrics target for Phase 3**
- Events powered: 500+
- Attendees using app: 150,000+
- Token top-up volume: $2M+
- Organizer NPS: 60+

## Funding path

| Source | Amount | Fit | Timing |
|--------|--------|-----|--------|
| Superteam microgrant | <$10K | Quick validation | Phase 0 |
| Solana Foundation standard grant | $50K–$250K | Public-good infrastructure | Phase 0–1 |
| Solana Foundation convertible grant | $250K+ | Commercial potential + public good | Phase 1–2 |
| Angel / ecosystem fund | $500K–$1M | Scale after pilot metrics | Phase 1–2 |

## Key partnerships

1. **Luma** — ticketing data backend + distribution.
2. **Superteam** — pilot events and chapter rollout.
3. **Solana Foundation** — grants, branding, Breakpoint integration.
4. **Kado / Circle** — fiat on-ramp.
5. **Phantom / Solflare** — wallet promotion and Mobile Wallet Adapter support.

## Risks & mitigations

| Risk | Phase | Mitigation |
|------|-------|------------|
| Luma partnership falls through | 1 | Build standalone event import; Eventbrite fallback |
| Low wallet adoption | 1 | Fiat bonuses, vendor discounts, keep cash/card fallback |
| App Store rejection | 2 | Defer CSC module; frame city guide as general info |
| Solana network issues | 1 | Multi-sig escrow; offline queue; fiat fallback |
| Regulatory changes (Germany cannabis) | 2 | Educational-only content; adapt per jurisdiction |
| Competitor adds wallet/city guide | 2 | First-mover with Luma integration; community network effects |

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-18 | MVP = Events + Token Wallet only | Faster validation, clearer pitch, lower App Store risk |
| 2026-06-18 | Closed-loop SPL tokens per event | Proven festival model, organizer analytics, USDC backing |
| 2026-06-18 | Luma as primary event data source | Avoid rebuilding ticketing; target existing organizer workflow |
| 2026-06-18 | CSC Navigator deferred to Phase 2 | High compliance/App Store risk; not needed for core loop |
