# Solana Event Pass — Feature Specification

## Module map

| Module | Phase | Priority |
|--------|-------|----------|
| Event Hub | 1 | Must |
| Token Wallet | 1 | Must |
| Solana Pay POS | 1 | Must |
| POAP Badges | 1 | Should |
| Push Notifications | 1 | Should |
| City Guide | 2 | Could |
| Local Discounts | 2 | Could |
| CSC Navigator | 2 | Won't (MVP) |
| Analytics Dashboard | 2 | Should |
| Self-serve Event Creation | 3 | Could |

## Phase 1 features

### 1. Event Hub
**User stories**
- As an attendee, I see all events my wallet is registered for.
- As an attendee, I can view the agenda, speaker list, and venue map.
- As an attendee, I can bookmark sessions and receive reminders.

**Details**
- Sync events from Luma API using the attendee's registered email or wallet-linked Luma account.
- Fallback: event code / manual import.
- Agenda supports tracks, times, and room/venue info.

### 2. Token Wallet
**User stories**
- As an attendee, I can top up my wallet with USDC or fiat.
- As an attendee, I see my event token balance and transaction history.
- As an attendee, I can request a refund of unused tokens after the event.

**Details**
- One SPL token per event (e.g. `BERLINWEB3_2026`).
- 1:1 USDC backing via escrow.
- Top-up options: direct USDC transfer, Kado/Circle fiat on-ramp.
- Refund window controlled by organizer policy.

### 3. Solana Pay POS
**User stories**
- As a vendor, I can enter an amount and generate a QR code for payment.
- As an attendee, I can scan a vendor QR and confirm payment.
- As an organizer, I can see real-time sales per vendor.

**Details**
- Vendor terminals are web or tablet-based.
- QR encodes a Solana Pay transaction request.
- Backend verifies on-chain transfer and updates ledger.
- Supports tipping and rounding.

### 4. POAP Badges
**User stories**
- As an attendee, I receive a digital badge for checking into an event.
- As an attendee, I can view my badge collection.
- As an organizer, I can create attendance-based engagement campaigns.

**Details**
- Compressed NFTs via Metaplex Bubblegum.
- Mint triggered by Luma check-in sync or on-site QR scan.
- Badge designs uploaded by organizer.

### 5. Push Notifications
**User stories**
- As an attendee, I get a reminder 10 minutes before my bookmarked sessions.
- As an attendee, I receive event-wide announcements.

**Details**
- Expo Push for MVP.
- Topic-based subscriptions per event.

## Phase 2 features

### 6. City Guide + Missions + Rewards
**User stories**
- As an attendee, I toggle between AI assistant and Map view.
- As an attendee, I see location pins on a map with categories (food, drinks, party, landmark, culture).
- As an attendee, I tap a pin to see details and any partner discount.
- As an attendee, I complete missions by visiting locations and earn rewards.
- As an organizer, I add locations, missions, and rewards through admin endpoints.

**Details**
- Mapbox/Google Maps client-side; backend serves location data.
- Location categories: food, drinks, party, landmark, culture, plus organizer-defined tags.
- Check-in verification: geofence (default 100m) with QR fallback.
- Missions require visiting a set of locations; progress tracked per user.
- Rewards: token, POAP, merch, or discount codes.
- Admin CRUD for locations, missions, rewards.

### 7. CSC Navigator *(compliance-sensitive)*
**User stories**
- As an attendee in a legal jurisdiction, I can read local cannabis laws.
- As a resident member, I can find verified Cannabis Social Clubs.

**Details**
- Educational content only; no marketplace or delivery.
- Geo-restricted by jurisdiction.
- Clear disclaimers and harm-reduction resources.
- App Store review risk: position as "City Info" module, not a cannabis app.

### 9. Analytics Dashboard
**User stories**
- As an organizer, I see attendance, wallet top-ups, vendor sales, and engagement.
- As a vendor, I see my daily sales and most popular items.

**Details**
- Web dashboard (React + Vite) for organizers/vendors.
- Real-time charts from PostgreSQL/Redis.

## Feature priorities (MoSCoW)

### Must have (MVP)
- Wallet auth
- Luma event sync
- Agenda viewer
- SPL token wallet per event
- Top-up (USDC + fiat)
- Solana Pay vendor checkout
- Transaction history

### Should have
- POAP minting
- Push notifications
- Refund flow
- Organizer admin panel

### Could have
- City guide
- Local discounts
- Analytics dashboard
- Offline queueing

### Won't have (MVP)
- CSC Navigator
- Self-serve event creation
- Native ticketing (we rely on Luma)
- Secondary ticket resale

## Compliance & risk notes

| Feature | Risk | Mitigation |
|---------|------|------------|
| Token wallet | Securities / money transmission | Tokens are 1:1 USDC-backed event credits; no trading; redeem only via organizer |
| Cannabis module | App Store rejection | Educational only; geo-restricted; separate City Info framing |
| POAPs | IP / brand misuse | Organizer-controlled designs; attendee opt-in |
| Data privacy | GDPR in EU | Minimal PII; wallet-first; clear retention policy |
