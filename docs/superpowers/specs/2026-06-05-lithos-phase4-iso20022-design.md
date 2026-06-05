# Lithos — Phase 4 Design Spec (ISO 20022 Settlement Messaging + Token-Settlement Signal)

> **Product working name:** Lithos
> **Directory:** `normie-apps/lithium-broker`
> **Date:** 2026-06-05
> **Scope:** First Phase 4 sub-project only — ISO 20022 commission-settlement messaging + a non-custodial on-chain settlement signal. Backend-only (no mobile UI this pass). Bank-integration and real token settlement remain deferred, legal-gated phases.
> **Builds on:** Phase 3 (deal pipeline, commission/IMFPA chains, blockchain anchoring). See `2026-05-30-lithos-phase1-design.md`.

---

## 1. What we are building

When a deal reaches `SETTLEMENT`, the broker needs to (a) instruct their bank to be paid their commission and (b) confirm the money actually arrived. ISO 20022 is the global bank-messaging XML standard. This sub-project lets Lithos **produce and read** those bank messages — without ever touching the money itself.

Two message flows + one on-chain signal:

1. **`pain.001` (Payment Initiation) — OUT.** Generate a standards-compliant commission payment-instruction XML the broker hands to their bank. Lithos creates the document; the bank executes the transfer.
2. **`camt.054` (Bank-to-Customer Debit/Credit Notification) — IN.** Ingest the bank's "money received" notification, match it against the deal's expected commission, and on match auto-flip `commissionStatus → RECORDED_PAID`. Pure document verification — exactly the platform's existing model.
3. **Token-settlement signal — on-chain attestation.** When commission is confirmed by an ingested `camt.054`, fingerprint the deal's final settlement state and anchor it on testnet via the existing blockchain module. A tamper-evident milestone record, **not** a value transfer.

It is **not** a payments processor and **not** a custodian. Lithos generates paperwork and reads notifications; the bank moves the money.

---

## 2. Prime directives (unchanged, non-negotiable)

1. **NON-CUSTODIAL.** No code path holds, controls, or moves funds. The `pain.001` is an *instruction document* the broker submits to their own bank; Lithos never executes a payment. The token signal anchors a hash, never a transfer.
2. **No live money, no mainnet.** Token settlement is a testnet/simulated-hash signal only (`CELO_SEPOLIA`/`SOLANA_DEVNET`), reusing the Phase 3 stub anchor mechanism. No real gas, no real funds.
3. **The Jest guard stays green.** `test/non-custodial.spec.ts` must continue to pass: no `transferFrom`/`releaseFunds`/`escrowRelease`/`payout`/`custody` anywhere in `src`; no `escrow` module; `sendTransaction` (none here) only inside `src/blockchain/`. The settlement signal lives in `src/blockchain/`.
4. **Secrets discipline.** No bank credentials, no keys in code. This sub-project needs none — it generates and parses files, it does not connect to a bank.
5. **Untrusted input.** Ingested `camt.054` XML is untrusted data: parse defensively, never evaluate, guard against XXE (disable external entities in the XML parser).

---

## 3. Out of scope (this sub-project)

- Mobile UI (deferred to a later UI pass — admin buttons to generate/upload messages).
- Live bank API / host-to-host connectivity (Phase 4 sub-project 2, legal-gated).
- Real on-chain settlement / token transfer (Phase 4 sub-project 3, legal-gated; explicitly DO NOT BUILD per CLAUDE.md).
- LC / trade-finance (`tsmt.*`) messaging for the underlying goods payment — not chosen for this pass.
- Multi-currency FX, partial payments, payment reconciliation across multiple deals.
- **Multi-creditor IMFPA-chain disbursement** — `pain.001` carries a single credit transfer for the deal's total commission this pass; splitting it into one transfer per `DealIntermediary` (per `chainPosition`/share) is a clean future extension that reuses the `intermediaries/` data.
- **Wiring the signal into the legacy manual `recordCommissionPaid` path** — the settlement signal fires only on `camt.054`-confirmed settlement this pass. The existing manual `recordCommissionPaid` flow is left unchanged.

---

## 4. Architecture

### 4.1 New module: `backend/src/iso20022/`

```
iso20022/
├── iso20022.module.ts
├── iso20022.controller.ts
├── iso20022.service.ts
├── builders/pain001.builder.ts      # pure: deal+commission -> XML string
├── parsers/camt054.parser.ts        # pure: XML string -> parsed notification
├── dto/ingest-camt054.dto.ts
└── *.spec.ts
```

**`pain001.builder.ts` — pure function, no DB, no Nest DI.**
`buildPain001(input: Pain001Input): string`
- `Pain001Input` = `{ messageId, creationDateTime, debtor (the paying party named on the deal — e.g. the buyer/closing bank), debtorAccount (IBAN/BIC), creditor (the broker/mandate receiving the commission), creditorAccount, amount, currency, endToEndId (deal number), remittanceInfo }`. Account details that Lithos does not hold are emitted as documented placeholders the broker fills in before submitting to their bank — Lithos never stores bank credentials.
- Emits `pain.001.001.09` `CstmrCdtTrfInitn` with `GrpHdr` (MsgId, CreDtTm, NbOfTxs, CtrlSum), one `PmtInf` and one `CdtTrfTxInf`.
- `creationDateTime` is passed in (deterministic for tests; `Date` is not called inside the pure builder).

**`camt054.parser.ts` — pure function, no DB.**
`parseCamt054(xml: string): Camt054Notification`
- Returns `{ amount: string, currency: string, creditDebitIndicator: 'CRDT'|'DBIT', endToEndId?: string, debtorName?: string }` from the first `Ntfctn/Ntry`.
- XML parser configured with external entities **disabled** (XXE-safe).
- Throws a typed `BadRequestException` on malformed/unsupported XML.

**`iso20022.service.ts` — orchestration (DI: Prisma, DealEventsService, BlockchainAnchorService).**
- `computeCommission(deal): { amount: string, currency: string }` — derives the commission amount from `commissionBasis` (`PERCENT`/`PER_TONNE`/`FLAT`/`SPREAD`), `commissionValue`, `volume`, and the effective price (`manualPrice` ?? derived from `indexReference`+`differential`, else `priceFloor`). If the amount cannot be computed, throws `BadRequestException("Commission amount is not determinable")`.
- `generatePain001(dealId, actorId, creationDateTime?)`:
  1. Load deal; require `phase === SETTLEMENT` (else 400 — mirrors `recordCommissionPaid`).
  2. `computeCommission` → `buildPain001`.
  3. Persist a `Document` (`type: PAIN001`, `content: xml`, `documentUrl: "generated://pain001/<dealId>"`, `uploadedBy: actorId`).
  4. Record `DealEvent` (`PAYMENT_INSTRUCTION_GENERATED`).
  5. Return `{ documentId, xml }`.
- `ingestCamt054(dealId, xml, actorId)`:
  1. Load deal; require `phase === SETTLEMENT`.
  2. `parseCamt054(xml)`.
  3. Persist a `Document` (`type: CAMT054`, `content: xml`, `documentUrl: "ingested://camt054/<dealId>"`).
  4. Match: `creditDebitIndicator === 'CRDT'` AND `currency === deal.currency` AND `amount` equals expected commission within a tolerance of 0.01. (Decimal compare, not float.)
  5. On match → `commissionStatus = RECORDED_PAID`; record `DealEvent` (`COMMISSION_RECORDED`, metadata `{ source: 'CAMT054' }`); then `blockchain.signalSettlement(dealId, actorId)`.
  6. On mismatch → record `DealEvent` (`SETTLEMENT_MISMATCH`, metadata with expected vs received); no financial change.
  7. Return `{ matched: boolean, expected, received, documentId }`.

**`iso20022.controller.ts`** (`@UseGuards(JwtAuthGuard, RolesGuard)`):
- `POST /iso20022/deals/:dealId/pain001` — `@Roles(ADMIN)` → `generatePain001`.
- `POST /iso20022/deals/:dealId/camt054` — `@Roles(ADMIN)`, body `{ xml: string }` → `ingestCamt054`.

### 4.2 Settlement signal in `backend/src/blockchain/`

Add to `BlockchainAnchorService`:
- `signalSettlement(dealId, actorId)`:
  - Load deal; build a deterministic fingerprint over `{ dealNumber, volume, currency, commissionValue, commissionBasis, status }` via the existing `fingerprint()`.
  - `await this.anchor({ dealId, entityType: SETTLEMENT_SIGNAL, fingerprint, metadata: { kind: 'settlement' } }, actorId)`.
  - Returns the anchor. No funds, no transfer — reuses the simulated-tx-hash path already shipped in Phase 3.

Lives inside `src/blockchain/` so the non-custodial guard's `sendTransaction`-only-in-blockchain rule is preserved (this sub-project introduces no `sendTransaction` at all).

### 4.3 Schema changes (one Prisma migration)

- `enum AnchorType { DOCUMENT, DEAL_STATE, KYC_ATTESTATION, SETTLEMENT_SIGNAL }`
- `enum DocumentType { …, PAIN001, CAMT054 }`
- `enum DealEventType { …, PAYMENT_INSTRUCTION_GENERATED, SETTLEMENT_MISMATCH }`
  (`COMMISSION_RECORDED` already exists and is reused for the matched case.)
- `model Document { … content String? }` — nullable Text holding generated/ingested XML bodies (`documentUrl` is required and these artifacts have no uploaded file).

Migration name: `phase4_iso20022_settlement`.

---

## 5. Data flow

```
Deal at SETTLEMENT
   │
   ├─ POST /iso20022/deals/:id/pain001
   │     service.generatePain001
   │       → computeCommission → buildPain001(xml)
   │       → Document(PAIN001, content=xml)
   │       → DealEvent(PAYMENT_INSTRUCTION_GENERATED)
   │       → returns xml  ──►  broker submits to their bank (off-platform)
   │
   └─ POST /iso20022/deals/:id/camt054  { xml }   (after bank credits the broker)
         service.ingestCamt054
           → parseCamt054(xml)  (XXE-safe)
           → Document(CAMT054, content=xml)
           → match amount/currency/CRDT vs expected commission
              ├─ match   → commissionStatus=RECORDED_PAID
              │             → DealEvent(COMMISSION_RECORDED, source=CAMT054)
              │             → blockchain.signalSettlement → BlockchainAnchor(SETTLEMENT_SIGNAL)
              └─ mismatch→ DealEvent(SETTLEMENT_MISMATCH); no financial change
```

The admin still advances the deal to `COMPLETED` via the existing phase-advance flow; this sub-project only handles the commission settlement around `SETTLEMENT`.

---

## 6. Error handling

| Condition | Behavior |
|---|---|
| Deal not found | 404 `NotFoundException` |
| Deal not at `SETTLEMENT` | 400 — "Settlement messaging is only available at SETTLEMENT" |
| Commission not determinable (missing basis/value/price) | 400 — "Commission amount is not determinable" |
| Malformed / unsupported `camt.054` XML | 400 from parser (typed) |
| `camt.054` amount/currency mismatch | 200, `{ matched: false }`, `SETTLEMENT_MISMATCH` event, no state change |
| Non-admin caller | 403 via `RolesGuard` |

All money math uses string/Decimal comparison with a fixed 0.01 tolerance — never float equality.

---

## 7. Testing (TDD, all offline — no DB/bank/chain required for unit tests)

1. **`pain001.builder.spec.ts`** — given a fixed `Pain001Input`, asserts the XML contains correct `MsgId`, `CtrlSum`/`InstdAmt` with `Ccy`, `EndToEndId` = deal number, and valid `pain.001.001.09` envelope; deterministic (creationDateTime injected).
2. **`camt054.parser.spec.ts`** — parses a sample `camt.054` fixture → correct amount/currency/indicator/endToEndId; rejects malformed XML; XXE payload does not resolve external entities.
3. **`iso20022.service.spec.ts`** (mocked Prisma/events/blockchain):
   - `generatePain001` creates a `PAIN001` Document + `PAYMENT_INSTRUCTION_GENERATED` event; rejects when not at SETTLEMENT.
   - `ingestCamt054` matching → flips `commissionStatus` to `RECORDED_PAID`, records `COMMISSION_RECORDED`, calls `signalSettlement`.
   - `ingestCamt054` mismatch → no state change, records `SETTLEMENT_MISMATCH`.
   - `computeCommission` covers PERCENT and PER_TONNE; throws when indeterminable.
4. **`blockchain-anchor.service.spec.ts`** — extend: `signalSettlement` creates a `SETTLEMENT_SIGNAL` anchor with a non-empty fingerprint and no fund primitives.
5. **`test/non-custodial.spec.ts`** — must still pass unchanged.
6. **e2e (DB-gated, runs when local Postgres is up):** extend `deal-lifecycle.e2e-spec.ts` — drive a deal to SETTLEMENT, generate pain.001, ingest a matching camt.054, assert `RECORDED_PAID` + a `SETTLEMENT_SIGNAL` anchor exists.

Acceptance: `npx tsc --noEmit` clean, full Jest unit suite green (existing 51 + new), non-custodial guard green.

---

## 8. Module wiring

- `Iso20022Module` imports `PrismaModule`, `DealEventsModule`, `BlockchainModule` (exporting `BlockchainAnchorService`); registered in `app.module.ts`.
- No new env vars. No new runtime dependencies if a parser is hand-rolled; if a small XML lib is used it must be dependency-light and XXE-safe by configuration (decision deferred to the plan).

---

## 9. Definition of done

- New `iso20022/` module + `signalSettlement` in `blockchain/`, all per above.
- Prisma migration `phase4_iso20022_settlement` applied; client regenerated.
- All unit tests green; tsc clean; non-custodial guard green.
- `CLAUDE.md` and `PROGRESS_REPORT.md` updated to "Phase 4 sub-project 1 (ISO 20022 settlement messaging) complete"; remaining Phase 4 (bank integration, real token settlement) still marked DO NOT BUILD.
- No mobile changes (deferred).
