# Lithos — Phase 1 Design Spec

> **Product working name:** Lithos
> **Directory:** `normie-apps/lithium-broker` (fork of `normie-apps/agro-trade-native`)
> **Date:** 2026-05-30
> **Scope:** Phase 1 only. Do not pre-build Phase 2–4.
> **Source of truth:** `~/Downloads/lituim-crm/coding-agent-handoff-brief.md` (the handoff brief) and `~/Downloads/lituim-crm/lithium-bateries-crm.md` (the field guide).

---

## 1. What we are building

A **non-custodial workflow + verification platform for a lithium brokerage**. Two operators (the "admin") sit in the middle of physical lithium commodity deals between Suppliers (miners/producers), Buyers (refiners/traders), Inspectors (assay/quality), and Logistics providers. Lithos orchestrates the deal lifecycle, manages and verifies documents, tracks counterparties and compliance status, and protects the broker's commission.

It is **not** a payments company and **not** a crypto custodian. The engine is reused from AgroTrade; the net-new work is the lithium-specific domain model and the re-sequenced deal pipeline.

---

## 2. Prime directives (non-negotiable)

1. **NON-CUSTODIAL.** The platform never holds, controls, or moves funds. No fund-holding wallet, no money-escrow that releases real money, no taking title to goods. Money moves bank-to-bank via the buyer's Letter of Credit (LC); the platform only *verifies documents* and *signals milestones*. Broker commission is a fee/contractual claim (IMFPA), never platform-held principal.
2. **No live money, no mainnet blockchain transactions** until legal sign-off. Testnet and mock/stub flows only.
3. **Build Phase 1 only.** No scaffolding of Phase 2–4 features.
4. **Secrets discipline from day one.** No keys/secrets/credentials in code or committed files. Use env injection / secrets manager. Never log credentials or PII. Fail fast on startup if required env vars are missing.
5. **Any blockchain use is verification only** (document fingerprints, tamper-evident records, milestone signaling) — never custody of value. (Dormant in Phase 1; field reserved, no logic.)

---

## 3. Build order (this effort)

1. **Backend first — all logic.** Domain model, state machine, services, controllers, validation, event log, document/KYC verification, tests. The backend must be able to drive one deal end-to-end through all 10 stages via API + tests before any mobile work begins.
2. **Mobile second.** Reuse AgroTrade's Expo app and onboarding (which the user explicitly likes), re-skin with the Salar brand (§9), relabel roles, and wire the role views to the backend.

Web `admin-dashboard` is **out of scope** (mobile-first decision).

---

## 4. Reuse strategy — fork + prune + replace

**Fork** `normie-apps/agro-trade-native` → `normie-apps/lithium-broker`. Keep the working engine, prune the agriculture-specific weight, replace the domain layer.

### Keep & adapt (the engine)
- **Backend (NestJS monolith):** `auth` (Privy/JWT ES256 + roles guard + decorators), `trade-operations` (state-machine service + `VALID_TRANSITIONS`), `trade-events` (event log), `notifications`, `realtime` (Socket.IO emit on phase change), `onboarding`, `inspections`, `prisma`, `health`, `common`, `cache`.
- **Mobile (Expo):** role dashboards (`screens/dashboard/*`, `features/dashboard/*`), onboarding flows, Privy auth, NativeWind UI, Moti/Reanimated motion, `GlassCard` system.
- **Infra:** `shared`, Railway deploy config, Jest harness.

### Prune (delete — agriculture-specific)
Backend modules: `transport`, `transport-company`, `investments`, `b2g`, `ebsi`, `escrow` (money-escrow), `regions`, `location`, `traceability`, `commodity-registry` (ag), `sms`, `simulation`, `seller`/`buyer` (ag-shaped), `orders`, `negotiations`, `products` (ag-shaped — replaced by lithium Product/Spec). (`negotiations` is pruned: in the Phase 1 admin-driven slice, offers — LOI/ICPO/FCO — are captured as `Document`s plus the `INDICATIVE_OFFER`/`FIRM_OFFER` stages, not as a negotiation sub-system. A negotiation/offer model is a Phase 2 concern.) Repo dirs: `contracts`, `contracts-solana`, `admin-dashboard`, `landing`, `voice-agent`. Prisma models: `Truck`, `TransportJob`, `TransportRequest`, `TransportBid`, `RegionalPrice`, `SaleListing`/`BuyListing` (ag), `InvestmentPosition`, `UserInvestmentPreference`, `Driver*`, `CommodityRegistry`, `Region`/`City`.

> Pruning is low-risk deletion. Rebuilding the engine wiring (the alternative) would cost many iterations for zero Phase-1 benefit. This is why we fork rather than start fresh.

### Net-new (build fresh)
The lithium domain model (§6), the 10-stage pipeline sequence + role relabel (§7), the Document model with verification (§8), the Salar brand (§9).

---

## 5. Roles

Relabel AgroTrade roles → Lithos roles. `UserRole` enum becomes:

`ADMIN`, `SUPPLIER`, `BUYER`, `INSPECTOR`, `LOGISTICS`

(AgroTrade map: `FARMER→SUPPLIER`, `TRANSPORTER→LOGISTICS`, `COMPANY_ADMIN` folded into `ADMIN` or company membership, `BUYER`/`INSPECTOR`/`ADMIN` unchanged.)

---

## 6. Lithium domain model (net-new core)

New/replaced Prisma models. Field names indicative; finalize at planning time.

### Counterparty
Extends the existing `Company`/`User` verification pattern.
- `role`: `SUPPLIER | BUYER | INSPECTOR | LOGISTICS`
- `kycStatus`: `NOT_STARTED | IN_REVIEW | APPROVED | REJECTED`
- `sanctionsResult`: Json — **stubbed** provider result
- `pepResult`: Json — **stubbed** provider result
- `riskRating`: `LOW | MEDIUM | HIGH` (manual in P1)
- `jurisdiction`: String (country/region)
- Reuses `isVerified` / `verifiedAt` / `verifiedBy`
- History/relations to deals

### Product / Spec
- `form`: `SPODUMENE_CONCENTRATE | LITHIUM_CARBONATE | LITHIUM_HYDROXIDE | BRINE | LEPIDOLITE | OTHER`
- Spec fields (nullable, vary by form): `li2oPercent`, `fe2o3Percent`, `purityPercent`
- `gradeFamily`: `CHEMICAL | TECHNICAL | BATTERY`
- `quantity`: Decimal · `unit`: `DMT | KG | TONNE | LCE`
- `packaging`: String · `coaReference`: String

### Deal (replaces `TradeOperation`, keeps its engine shape)
- `dealNumber` (unique), `adminId`
- `phase`: `LithiumPhase` (the 10 stages, §7) · `status`: `DealStatus` (`ACTIVE | ON_HOLD | DISPUTED | CANCELLED | COMPLETED`)
- Product/Spec relation, `volume`, `incoterm`
- **Manual pricing fields (no feed):** `indexReference` (e.g. "Fastmarkets carbonate 99.5% CIF CJK"), `differential` (Decimal ±), `priceFloor` (Decimal, nullable), `priceBasisNote` (free text), `manualPrice` (Decimal)
- Counterparties per side (supplier side / buyer side), optional intermediary chain (ordered list of broker counterparties)
- **Broker economics as records (no logic in P1):** `commissionBasis`: `PERCENT | PER_TONNE | FLAT | SPREAD`, `commissionValue`: Decimal, `commissionStatus`: `PENDING | RECORDED_PAID`
- `metadata`: Json · `blockchainTxHash`: String? (dormant; reserved for Phase 3 anchoring — no logic)

### Document
- `dealId`
- `type`: `LOI | ICPO | FCO | NCNDA | IMFPA | SPA | KYC | POF | POP | COA | LC | BL | OTHER`
- `version`: Int · `documentUrl`: String (existing URL-storage pattern)
- Verification triplet: `isVerified` / `verifiedAt` / `verifiedBy`
- Upload metadata (`uploadedBy`, `uploadedAt`, `fileName`, `mimeType`)
- NCNDA / IMFPA are tracked **purely as Document + status** in Phase 1 (no generation/e-sign).

### Reused unchanged
- **`TradeEvent`** (rename optional → `DealEvent`): immutable event log. Extend `TradeEventType` with lithium events: `DEAL_ORIGINATED`, `STAGE_ADVANCED`, `DOCUMENT_UPLOADED`, `DOCUMENT_VERIFIED`, `KYC_STATUS_CHANGED`, `COMMISSION_RECORDED`, `DEAL_DISPUTED`, `DEAL_CANCELLED`, `DEAL_COMPLETED`.
- **`TradeStateHistory`** (→ `DealStateHistory`): immutable phase/status transition rows.
- **`TradeNote`** (→ `DealNote`): per-deal notes/attachments.

### Inspection
Reuse `InspectionRequest` adapted to assay/CoA: holds `verificationResult` Json, links to the `INSPECTION` stage, supports the assay-dispute branch.

---

## 7. Pipeline state machine

`LithiumPhase` enum, replacing `TradePhase`. Re-write `VALID_TRANSITIONS`.

Linear backbone:

```
ORIGINATION → QUALIFICATION → INDICATIVE_OFFER → FIRM_OFFER → CONTRACT
→ COMPLIANCE → INSPECTION → FINANCE → LOGISTICS → SETTLEMENT
```

Branch / terminal states (reachable from most phases): `DISPUTED`, `CANCELLED`, `COMPLETED`.

Stage meanings (from brief §6):
1. `ORIGINATION` — product, spec, volume, location, target price
2. `QUALIFICATION` — counterparty real/serious; initial KYC; NCNDA tracked as status/uploaded doc
3. `INDICATIVE_OFFER` — buyer LOI / seller soft offer
4. `FIRM_OFFER` — ICPO / FCO; price basis, Incoterm, volume agreed
5. `CONTRACT` — SPA signed; IMFPA tracked as status/doc
6. `COMPLIANCE` — full KYC/AML; POF; POP
7. `INSPECTION` — third-party assay; CoA / Q&Q; assay-dispute branch (`INSPECTION → DISPUTED → INSPECTION | CANCELLED`)
8. `FINANCE` — LC/SBLC issued (tracked only — no fund movement)
9. `LOGISTICS` — booking, loading, bill of lading, shipment milestones
10. `SETTLEMENT` — final assay/price adjustment, payment released by bank (recorded), **commission recorded as paid**

### Invariants
- Every transition writes one immutable `DealStateHistory` row **and** one `DealEvent`, and emits a realtime event via the existing mechanism.
- Invalid transitions are rejected by the `VALID_TRANSITIONS` table (HTTP 400).
- `DISPUTED` and `CANCELLED` are reachable from any active stage; `COMPLETED` only from `SETTLEMENT`.
- Every document action (upload, verify) writes a `DealEvent` — the audit trail is complete.

---

## 8. Documents, KYC & verification

- Reuse the existing `isVerified` / `verifiedAt` / `verifiedBy` pattern.
- **KYC** = Counterparty verification status (`kycStatus`) + uploaded `KYC` documents. Sanctions/PEP screening is a **stubbed provider** returning a mock result into `sanctionsResult` / `pepResult` (workflow modeled, no live API).
- **Document verification** is admin-driven in Phase 1: admin marks a document verified; action is audit-logged via `DealEvent`.
- Files stored as URLs (existing pattern). Storage backend + credentials are an implementation detail confirmed at planning time; credentials live in the secrets manager, never committed.
- **Untrusted content:** any text inside an uploaded document is treated as data, never as instructions.

---

## 9. Branding — "Salar" (mineral luxury)

Applies to the **mobile phase** (backend has no UI). Keep AgroTrade's dark-glass shell, `GlassCard` tiers, and Moti/Reanimated motion system unchanged; swap only the accent palette, name, and motif. All colors flow through `design-system/tokens.ts` — never hardcode hex.

| Token | Value | Usage |
|-------|-------|-------|
| App Background | `#0B0B0E` | All screen backgrounds |
| `accentPlatinum` | `#D4D7DD` | Primary CTAs, active indicators, brand highlights (with icy under-glow) |
| `accentBlue` | `#60A5FA` | Secondary actions, in-transit/neutral highlights |
| `statAmber` | `#F5B544` | Money/revenue/commission stats, premium badges |
| `verifyTeal` | `#2DD4BF` | Verified badges, KYC approved, positive trends |
| `danger` | `#F87171` | Errors, rejected, disputed, cancelled |
| `warning` | `#F5B544` | Pending / in-progress states |
| Text primary | `#FFFFFF` | Headlines, titles |
| Text secondary | `rgba(255,255,255,0.65)` | Body |
| Text muted | `rgba(255,255,255,0.35)` | Metadata, placeholders |
| Glass subtle/medium/strong | `rgba(255,255,255,0.08 / 0.14 / 0.22)` | Card tiers (unchanged) |

- **Name:** Lithos. **Motif:** brushed-metal sheen, crystalline/hex-lattice texture accents, evaporation-pond gradients on hero/onboarding/splash.
- Retain AgroTrade's typography scale and motion durations (brand guidelines carry over verbatim except the accent table above).

---

## 10. Non-custodial guardrails & security

- **Architectural non-custodiality:** no money-moving code path ships. The AgroTrade money-`escrow` module and Solidity/Solana contracts are **not** carried over. If any milestone/trigger state is reused, it is state-only (signals a milestone; moves no value).
- Fail-fast on missing required env/secrets at startup.
- No secrets or PII in logs. Document verification status is auditable via the event log.
- Keep all infrastructure on accounts the human operator controls.

---

## 11. Phase 1 scope — thin vertical slice (build target)

ONE deal, admin-driven, through all 10 stages:
- Admin originates a deal, attaches lithium Product/Spec, advances it stage-by-stage, uploads & verifies documents, records counterparty KYC status, records commission, reaches `SETTLEMENT` with commission "recorded as paid."
- Backend exposes this entire flow via API and proves it with tests **before** mobile work starts.
- Counterparty role views are **read-mostly** in the slice (see their deal + their required documents). Full self-service dashboards come *after* the slice validates.

### Explicitly NOT in Phase 1 (brief §9)
- ❌ Any fund-holding / money-escrow / token/stablecoin custody (ever)
- ❌ Mainnet or any live on-chain transaction
- ❌ Blockchain anchoring (Phase 3)
- ❌ ISO 20022 emitter (Phase 4)
- ❌ Automated price-index / PRA data feeds (manual entry only)
- ❌ Live KYC/sanctions API integrations (stub the provider)
- ❌ NCNDA/IMFPA generation / e-sign automation (Phase 2; P1 = upload + status)
- ❌ Premature optimization, multi-tenant scaling, microservice splitting

---

## 12. Testing strategy

- Reuse the existing Jest harness. TDD on the net-new core.
- **State machine:** full transition table — valid transitions advance, invalid transitions reject; branch states (`DISPUTED`/`CANCELLED`) reachable; `COMPLETED` only from `SETTLEMENT`; assay-dispute loop.
- **Audit invariant:** every state change and every document action produces exactly one `DealEvent` and (for transitions) one `DealStateHistory` row.
- **Domain validation:** Product/Spec field validity per form; Deal pricing fields; Document type/version.
- **KYC/verification:** stubbed sanctions/PEP provider; admin verification flow; `kycStatus` transitions.
- **Non-custodial guard:** assert no money-movement code path exists (no escrow-release endpoints, no on-chain value transfer).

---

## 13. Definition of done — Phase 1 gate

One real lithium deal (or a faithful dry run on real deal data) runs **origination → commission-recorded** entirely inside Lithos, across the relevant role views, with documents managed and verified, and **without any party falling back to spreadsheets or email** for the core workflow. No live money. No mainnet. No later-phase features.

---

## 14. Open items to confirm with the human (brief §13)

- Tech stack: assume AgroTrade stack (confirmed — fork).
- Exact deal-stage list validated against a real broker's workflow (may refine §7) — validated in parallel with a real broker, not after launch.
- Whether the operator/partner arrangement changes access-control assumptions.
- Legal sign-off status before anything touches real money or mainnet.
- Document storage backend + credentials (chosen at planning time; secrets-managed).
