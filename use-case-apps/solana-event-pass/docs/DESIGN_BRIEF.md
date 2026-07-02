# Solana Event Pass — Design Brief for Claude (UI)

> Share this with Claude so they can start designing the mobile UI. Backend API contract is included so screens can be designed against real endpoints.

---

## 1. Product in one sentence

A Solana-native mobile app that turns crypto conferences into seamless, token-powered experiences: agenda, wallet, payments, and POAPs in one place.

---

## 2. Origin story (the real pain)

Blockchain Week Berlin / Web3 Summit showed the problem clearly:
- Registration on **Luma**
- Food/drinks paid with **cash or Stripe**
- City tips scattered across **Telegram groups**
- Attendance badges via **POAP**
- Local deals and grey-zone info via **word-of-mouth**

Polkadot built a one-off app for Web3 Summit with agenda + cash wallet + event tokens for F&B. Solana needs a standardized version for all its events.

---

## 3. Why now / market validation

- **Event management software:** $8.4B (2024) → $17.3B (2030), 13.2% CAGR.
- **Festival cashless payments:** $2.12B (2024) → $9.89B (2033), 16.5% CAGR.
- **Solana ecosystem:** 7,625+ new developers in 2024, 83% YoY growth.
- **Solana events scale:** Breakpoint 2025 drew 7,000+ attendees from 100+ countries. Superteam organized 700+ events with 16,000 members in 6 months.
- **No unified competitor:** Luma = ticketing, River = community events, XP = NFT resale, POAP = badges. None combine payments + agenda + city guide + Solana-native wallet.

---

## 4. Target users

1. **Attendees** at Solana/crypto events — want one app for everything.
2. **Organizers** (Superteam chapters, Solana Foundation, event agencies) — want analytics, cashless payments, and sponsor ROI.
3. **Vendors** at events — want fast checkout and real-time sales data.

---

## 5. MVP scope (Phase 1) — design for this first

**Only these modules in Phase 1:**
1. **Wallet Connect** — Mobile Wallet Adapter (Phantom, Solflare, Backpack).
2. **Events Feed** — events the user is registered for.
3. **Event Detail / Agenda** — schedule, speakers, bookmarks.
4. **Token Wallet** — event-specific balance, top-up, history.
5. **Pay / Scan** — Solana Pay QR scanner + payer QR.
6. **POAP Collection** — earned attendance badges.

**Deferred to Phase 2:** City Guide, Local Discounts, Cannabis/CSC Navigator, Organizer Dashboard.

---

## 6. Core screens & flows

### A. Onboarding / Connect Wallet
- Clean dark-mode Solana vibe.
- One primary CTA: "Connect Wallet".
- Supported wallets: Phantom, Solflare, Backpack.
- Optional fallback: "I don't have a wallet" → later Privy email/social.

### B. Events Feed (home)
- Card list of upcoming events the wallet is registered for.
- Each card: event image, name, date, city, token balance badge.
- Pull-to-refresh.
- Empty state: "No events yet. Explore Solana events on Luma."

### C. Event Detail
- Hero image + event name + date/venue.
- Tabs: Agenda | Wallet | POAPs
- **Agenda tab:**
  - Day selector
  - Session list with time, title, speaker, room
  - Bookmark icon
  - "Add to schedule" → push reminder
- **Wallet tab:**
  - Large token balance (e.g. "120 BREAKPOINT")
  - Top-up button
  - Recent transactions list
- **POAPs tab:**
  - Grid of earned badges for this event
  - Locked state for not-yet-earned badges

### D. Token Wallet
- Balance card with event token + USD equivalent.
- "Top Up" CTA → amount selector → payment method (USDC / Card).
- Transaction history: date, vendor, amount, status.
- "Refund unused tokens" (if event ended).

### E. Pay / Scan
- Two tabs: **Scan** | **My QR**
- **Scan:** camera viewfinder scanning Solana Pay QR.
- **My QR:** show payer QR for vendor to scan.
- Payment confirmation sheet: amount, vendor name, confirm.
- Success animation + POAP unlock hint.

### F. POAPs / Badges
- Grid of collectible badges.
- Badge detail modal: art, event, date, rarity, share button.
- Share to Twitter / copy image.

### G. Profile
- Wallet address (truncated) + copy.
- Linked events count.
- Total POAPs count.
- Settings: notifications, currency display, logout.

---

## 7. Design direction

### Vibe
- **Dark mode primary.** Solana ecosystem expects sleek, premium dark UI.
- **Neon accents.** Solana purple/gradient (`#9945FF`, `#14F195`), plus event token accent colors.
- **Crypto-native but accessible.** Show wallet addresses truncated; use USD equivalents everywhere.
- **Fast and tactile.** Large buttons, swipeable tabs, instant haptic feedback on payments.

### Brand voice
- Confident, insider, no corporate filler.
- "Your pass. Your wallet. Your city."
- Avoid Web2 jargon; use "wallet," "tokens," "badges," "scan."

### Icons / illustration
- Wallet icons per provider.
- Token coin illustration per event (organizer-defined).
- POAP badges as circular/square collectible art.
- Map pins for future city guide.

---

## 8. Solana-specific UI patterns

- **Wallet sheet:** standard Solana Mobile Wallet Adapter bottom sheet.
- **Transaction states:** pending → confirmed → finalized (reference Solana block finality).
- **Token display:** show both token amount and USD value.
- **Address copy:** tap-to-copy public key with toast.
- **Explorer link:** every transaction links to Solscan / SolanaFM.

---

## 9. Backend API contract (for UI mocks)

Base URL: `http://localhost:3002` (dev)

### Auth
```
POST /auth/nonce
Body: { "publicKey": "<base58>" }
Resp: { "nonce": "sign this message: ...", "message": "..." }

POST /auth/verify
Body: { "publicKey": "<base58>", "signature": "<base58>", "nonce": "..." }
Resp: { "token": "<jwt>", "user": { "id", "publicKey", "createdAt" } }
```

### Events
```
GET /events
Headers: Authorization: Bearer <jwt>
Resp: { "events": [ { "id", "name", "startAt", "endAt", "location", "coverImage", "tokenBalance", "tokenSymbol" } ] }

GET /events/:id
Resp: { "id", "name", "description", "startAt", "endAt", "venue", "sessions": [], "token": {} }
```

### Wallet
```
GET /wallet/:eventId
Headers: Authorization: Bearer <jwt>
Resp: { "wallet": { "eventTokenId", "tokenName", "tokenSymbol", "decimals", "mintAddress", "balance" } }

GET /wallet/:eventId/history
Headers: Authorization: Bearer <jwt>
Resp: { "history": [ { "id", "type": "topup" | "payment", "amount", "status", "createdAt", ... } ] }

POST /wallet/:eventId/topup
Headers: Authorization: Bearer <jwt>
Body: { "amountTokens": "50", "paymentMethod": "usdc" | "fiat" }
Resp: { "order": { "id", "status": "pending", ... }, "token": {} }

POST /wallet/orders/:orderId/complete
Headers: Authorization: Bearer <jwt>
Resp: { "order": { "status": "completed", ... }, "wallet": { "balance", ... } }
```

### Payments
```
POST /payments/request
Headers: Authorization: Bearer <jwt>
Body: { "eventId", "amount", "terminalId" }
Resp: { "solanaPayUrl": "solana:...?amount=...", "terminalId", "eventTokenId", "amount", "recipient" }

POST /payments/verify
Headers: Authorization: Bearer <jwt>
Body: { "signature": "<txSignature>", "terminalId", "eventTokenId", "amount" }
Resp: { "status": "confirmed", "signature", "explorerUrl", "record": {} }
```

### City Guide + Missions + Rewards
```
GET    /guide/:eventId/locations?category=
Resp: { "locations": [ { "id", "name", "category", "lat", "lng", "partnerName", "discountDescription", ... } ] }

GET    /guide/locations/:id
Resp: { "location": {} }

POST   /guide/locations/:id/checkin
Body: { "method": "geofence" | "qr", "lat"?, "lng"? }
Resp: { "location", "completedMissions": [] }

GET    /guide/:eventId/missions
Resp: { "missions": [ { "id", "title", "progress": { "status", "completedCount", "totalCount" }, ... } ] }

GET    /guide/:eventId/rewards
Resp: { "rewards": [ { "id", "title", "type", "userStatus", ... } ] }

POST   /guide/rewards/:id/claim
Resp: { "reward", "userReward": { "status", "claimCode" } }

POST   /guide/admin/locations       # organizer/admin only
PUT    /guide/admin/locations/:id
POST   /guide/admin/missions
PUT    /guide/admin/missions/:id
POST   /guide/admin/rewards
PUT    /guide/admin/rewards/:id
```

---

## 10. Compliance notes that affect UI

- **Token wallet:** Frame tokens as "event credits," never as tradable assets. No price charts.
- **Cannabis module (Phase 2):** Must be educational/geo-restricted. No buy buttons, no delivery.
- **GDPR:** Minimal personal data. Wallet-first. Add a "Delete my data" option in settings.

---

## 11. Competitor references

- **Polkadot Web3 Summit app:** one-off event app with agenda + cash wallet + tokens for F&B.
- **Solana Breakpoint app:** similar concept, built by Henry at LimeChain.
- **Luma:** clean event pages, QR check-in.
- **River:** community event discovery.

---

## 12. Deliverables from Claude

1. **Figma file** or high-fidelity mobile screens for all Phase 1 screens.
2. **Design system:** colors, typography, components, icon set.
3. **Interaction prototypes** for pay flow and wallet top-up.
4. **Exportable assets** for Expo/React Native.

---

## 13. File locations

- Architecture: `docs/ARCHITECTURE.md`
- Features: `docs/FEATURES.md`
- Roadmap: `docs/ROADMAP.md`
- Project CLAUDE.md: `CLAUDE.md`

---

Last updated: 2026-06-18
