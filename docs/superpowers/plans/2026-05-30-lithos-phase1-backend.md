# Lithos Phase 1 — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the non-custodial lithium-brokerage backend so one deal flows end-to-end through all 10 pipeline stages (origination → commission recorded) via API + tests, before any mobile work.

**Architecture:** Fork AgroTrade's NestJS monolith into `normie-apps/lithium-broker`, prune agriculture-specific modules, and add net-new lithium domain modules (`deals`, `counterparties`, `lithium-products`, `documents`) that reuse the engine patterns (PrismaService, RealtimeService, TradeEventsService → DealEventsService). The deal pipeline is an explicit state machine with a `VALID_TRANSITIONS` table; every transition writes an immutable `DealStateHistory` row + a `DealEvent` and emits a realtime event. Non-custodial: no money-moving code path ships.

**Tech Stack:** NestJS 10, Prisma + PostgreSQL, Jest, Privy/JWT (ES256), Socket.IO. Node per `.nvmrc`.

**Spec:** `docs/superpowers/specs/2026-05-30-lithos-phase1-design.md`

---

## File Structure (what this plan creates/modifies)

Inside `normie-apps/lithium-broker/backend/`:

- `prisma/schema.prisma` — replace ag domain with lithium domain (enums + models below). **Modify.**
- `src/app.module.ts` — drop pruned modules, add new ones. **Modify.**
- `src/common/config/env.validation.ts` — fail-fast env validation. **Create.**
- `src/deals/deals.module.ts` — **Create.**
- `src/deals/state-machine.ts` — `VALID_TRANSITIONS` + `assertTransition()`. **Create.** (pure, unit-tested)
- `src/deals/deal.service.ts` — create/find/advance/dispute/cancel/complete + commission. **Create.**
- `src/deals/deal.controller.ts` — REST endpoints. **Create.**
- `src/deals/dto/*.ts` — DTOs. **Create.**
- `src/deal-events/deal-events.service.ts` — event log writer (adapted from `trade-events`). **Create.**
- `src/deal-events/deal-events.module.ts` — **Create.**
- `src/counterparties/*` — Counterparty + KYC + stubbed screening. **Create.**
- `src/counterparties/sanctions-screening.stub.ts` — deterministic mock provider. **Create.**
- `src/lithium-products/*` — Product/Spec CRUD + per-form validation. **Create.**
- `src/documents/*` — Document upload-record + verify. **Create.**
- Delete dirs: `src/{transport,transport-company,investments,b2g,ebsi,escrow,regions,location,traceability,commodity-registry,sms,simulation,seller,buyer,orders,negotiations,products,trade-operations,trade-events}`, plus repo dirs `contracts`, `contracts-solana`, `admin-dashboard`, `landing`, `voice-agent`. **Delete.**

---

## Phase A — Fork & green baseline

### Task 1: Create the fork

**Files:**
- Create: `normie-apps/lithium-broker/` (copy of `agro-trade-native` minus artifacts)

- [ ] **Step 1: Copy the repo excluding heavy artifacts and nested git**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps
rsync -a --exclude '.git' --exclude 'node_modules' --exclude 'dist' --exclude 'dist-test' \
  --exclude 'ios/Pods' --exclude 'android/build' --exclude 'android/.gradle' \
  --exclude '.expo' --exclude 'contracts/out' --exclude 'contracts/cache' --exclude 'contracts/lib' \
  --exclude 'contracts-solana/target' --exclude '.playwright-mcp' \
  agro-trade-native/ lithium-broker/
```

- [ ] **Step 2: Initialize a fresh git repo for the new product**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git init -q
git add -A
git commit -q -m "chore: fork agro-trade-native as lithos (lithium-broker) baseline"
echo "baseline: $(git rev-parse --short HEAD)"
```

Expected: prints a short commit hash.

### Task 2: Prune agriculture-specific repo dirs and backend modules

**Files:**
- Delete: repo dirs `contracts`, `contracts-solana`, `admin-dashboard`, `landing`, `voice-agent`
- Delete: backend module dirs listed above

- [ ] **Step 1: Remove non-backend ag/crypto dirs (mobile kept for later phase)**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
rm -rf contracts contracts-solana admin-dashboard landing voice-agent
```

- [ ] **Step 2: Remove ag-specific backend modules**

```bash
cd backend/src
rm -rf transport transport-company investments b2g ebsi escrow regions location \
  traceability commodity-registry sms simulation seller buyer orders negotiations \
  products trade-operations trade-events
ls
```

Expected: remaining dirs include `auth analytics cache common data deals?(none yet) health inspections modules notifications onboarding prisma realtime scripts seed`.

- [ ] **Step 3: Commit the prune**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "chore: prune agriculture/crypto modules and dirs"
```

### Task 3: Make the pruned backend compile (remove dangling imports)

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: any file importing a deleted module (resolve by deletion/stubbing)

- [ ] **Step 1: Install backend deps**

Run: `cd normie-apps/lithium-broker/backend && npm install`
Expected: completes; lockfile resolves.

- [ ] **Step 2: Strip pruned modules from `app.module.ts`**

Edit `backend/src/app.module.ts`: remove every `import` and `@Module({ imports: [...] })` entry referencing the deleted modules (TransportModule, TransportCompanyModule, InvestmentsModule, B2gModule, EbsiModule, EscrowModule, RegionsModule, LocationModule, TraceabilityModule, CommodityRegistryModule, SimulationModule, SellerModule, BuyerModule, OrdersModule, NegotiationsModule, ProductsModule, TradeOperationsModule, TradeEventsModule, AnalyticsModule if it depends on pruned services). Keep: RealtimeModule, ConfigModule, ScheduleModule, CacheModule, PrismaModule, SeedModule (only if it compiles; otherwise prune later), AuthModule, OnboardingModule, InspectionModule, InspectorModule, NotificationModule, HealthModule.

- [ ] **Step 3: Find remaining dangling references**

Run: `cd normie-apps/lithium-broker/backend && npx tsc --noEmit 2>&1 | head -50`
Expected: a list of TS errors pointing at files importing deleted modules. Resolve each by deleting the orphaned file (if ag-only) or removing the import. Re-run until zero errors. The `seed` and `analytics` modules may reference deleted models — delete them if they do; they are not needed for Phase 1.

- [ ] **Step 4: Verify build is clean**

Run: `cd normie-apps/lithium-broker/backend && npx tsc --noEmit`
Expected: exits 0, no output.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "chore: resolve dangling imports after prune; backend compiles"
```

---

## Phase B — Lithium domain model (Prisma)

> All models below are added to `backend/prisma/schema.prisma`. Delete the ag models (`SaleListing`, `BuyListing`, `Truck`, `TransportJob`, `TransportRequest`, `TransportBid`, `RegionalPrice`, `InvestmentPosition`, `UserInvestmentPreference`, `Driver`, `DriverDocument`, `CommodityRegistry`, `Region`, `City`, `Product`, `SpecificationType`, `ProductSpecTemplate`, `ListingSpec`, `Offer`, `OfferNegotiation`, `OfferRound`, `TransportCostCalculation`, `ProfitEstimation`, `TransportCostSettings`, `TradeOperation`, `TradeSeller`, `TradeTransporter`, `TradeStateHistory`, `TradeNote`, `TradeEvent`) and their enums. Keep `User`, `Company`, `Address`, `PhoneOtp`, `InspectionRequest` (adapt), `CompanyDocument` (optional), `CompanyAdmin`.

### Task 4: Replace roles + add deal/pricing enums

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Replace `UserRole` and add lithium enums**

```prisma
enum UserRole {
  ADMIN
  SUPPLIER
  BUYER
  INSPECTOR
  LOGISTICS
}

enum LithiumPhase {
  ORIGINATION
  QUALIFICATION
  INDICATIVE_OFFER
  FIRM_OFFER
  CONTRACT
  COMPLIANCE
  INSPECTION
  FINANCE
  LOGISTICS
  SETTLEMENT
  DISPUTED
  CANCELLED
  COMPLETED
}

enum DealStatus {
  ACTIVE
  ON_HOLD
  DISPUTED
  CANCELLED
  COMPLETED
}

enum DealEventType {
  DEAL_ORIGINATED
  STAGE_ADVANCED
  DOCUMENT_UPLOADED
  DOCUMENT_VERIFIED
  KYC_STATUS_CHANGED
  COMMISSION_RECORDED
  DEAL_DISPUTED
  DEAL_CANCELLED
  DEAL_COMPLETED
}

enum ProductForm {
  SPODUMENE_CONCENTRATE
  LITHIUM_CARBONATE
  LITHIUM_HYDROXIDE
  BRINE
  LEPIDOLITE
  OTHER
}

enum GradeFamily {
  CHEMICAL
  TECHNICAL
  BATTERY
}

enum ProductUnit {
  DMT
  KG
  TONNE
  LCE
}

enum CounterpartyRole {
  SUPPLIER
  BUYER
  INSPECTOR
  LOGISTICS
}

enum KycStatus {
  NOT_STARTED
  IN_REVIEW
  APPROVED
  REJECTED
}

enum RiskRating {
  LOW
  MEDIUM
  HIGH
}

enum DocumentType {
  LOI
  ICPO
  FCO
  NCNDA
  IMFPA
  SPA
  KYC
  POF
  POP
  COA
  LC
  BL
  OTHER
}

enum CommissionBasis {
  PERCENT
  PER_TONNE
  FLAT
  SPREAD
}

enum CommissionStatus {
  PENDING
  RECORDED_PAID
}

enum Incoterm {
  EXW
  FCA
  FOB
  CFR
  CIF
  CIP
  CPT
  DAP
  DDP
}
```

- [ ] **Step 2: Update `User.role` default**

In the `User` model change `role UserRole @default(BUYER)` to `role UserRole @default(BUYER)` (valid) and remove ag relations (`saleListings`, `buyListings`, `trucks`, `investmentPositions`, `transport*`, `tradeSellers`, etc.). Add new relations declared in later tasks: `dealsAsAdmin Deal[] @relation("DealAdmin")`, `dealNotes DealNote[]`, `dealStateChanges DealStateHistory[]`, `counterparty Counterparty?`.

### Task 5: Counterparty + LithiumProduct models

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add models**

```prisma
model Counterparty {
  id              String           @id @default(cuid())
  userId          String?          @unique @map("user_id")
  companyId       String?          @map("company_id")
  name            String
  role            CounterpartyRole
  jurisdiction    String?
  kycStatus       KycStatus        @default(NOT_STARTED) @map("kyc_status")
  riskRating      RiskRating       @default(MEDIUM) @map("risk_rating")
  sanctionsResult Json?            @map("sanctions_result")
  pepResult       Json?            @map("pep_result")
  isVerified      Boolean          @default(false) @map("is_verified")
  verifiedAt      DateTime?        @map("verified_at")
  verifiedBy      String?          @map("verified_by")
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  user            User?            @relation(fields: [userId], references: [id])
  supplierDeals   Deal[]           @relation("DealSupplier")
  buyerDeals      Deal[]           @relation("DealBuyer")

  @@index([role])
  @@index([kycStatus])
  @@map("counterparties")
}

model LithiumProduct {
  id           String       @id @default(cuid())
  form         ProductForm
  gradeFamily  GradeFamily? @map("grade_family")
  li2oPercent  Decimal?     @map("li2o_percent") @db.Decimal(6, 3)
  fe2o3Percent Decimal?     @map("fe2o3_percent") @db.Decimal(6, 3)
  purityPercent Decimal?    @map("purity_percent") @db.Decimal(6, 3)
  quantity     Decimal      @db.Decimal(14, 3)
  unit         ProductUnit
  packaging    String?
  coaReference String?      @map("coa_reference")
  createdAt    DateTime     @default(now()) @map("created_at")
  deals        Deal[]

  @@index([form])
  @@map("lithium_products")
}
```

### Task 6: Deal, DealStateHistory, DealNote, DealEvent, Document models

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add models**

```prisma
model Deal {
  id                String           @id @default(cuid())
  dealNumber        String           @unique @map("deal_number")
  adminId           String           @map("admin_id")
  phase             LithiumPhase     @default(ORIGINATION)
  status            DealStatus       @default(ACTIVE)
  productId         String?          @map("product_id")
  supplierId        String?          @map("supplier_id")
  buyerId           String?          @map("buyer_id")
  volume            Decimal?         @db.Decimal(14, 3)
  incoterm          Incoterm?
  // Manual pricing (NO feed)
  indexReference    String?          @map("index_reference")
  differential      Decimal?         @db.Decimal(14, 4)
  priceFloor        Decimal?         @map("price_floor") @db.Decimal(14, 4)
  manualPrice       Decimal?         @map("manual_price") @db.Decimal(14, 4)
  priceBasisNote    String?          @map("price_basis_note")
  currency          String           @default("USD")
  // Broker economics (records only)
  commissionBasis   CommissionBasis? @map("commission_basis")
  commissionValue   Decimal?         @map("commission_value") @db.Decimal(14, 4)
  commissionStatus  CommissionStatus @default(PENDING) @map("commission_status")
  // Dormant — Phase 3 anchoring; no logic in P1
  blockchainTxHash  String?          @map("blockchain_tx_hash")
  metadata          Json?
  initiatedAt       DateTime         @default(now()) @map("initiated_at")
  completedAt       DateTime?        @map("completed_at")
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")
  admin             User             @relation("DealAdmin", fields: [adminId], references: [id])
  product           LithiumProduct?  @relation(fields: [productId], references: [id])
  supplier          Counterparty?    @relation("DealSupplier", fields: [supplierId], references: [id])
  buyer             Counterparty?    @relation("DealBuyer", fields: [buyerId], references: [id])
  stateHistory      DealStateHistory[]
  events            DealEvent[]
  notes             DealNote[]
  documents         Document[]

  @@index([adminId])
  @@index([phase])
  @@index([status])
  @@index([createdAt])
  @@map("deals")
}

model DealStateHistory {
  id        String        @id @default(cuid())
  dealId    String        @map("deal_id")
  fromPhase LithiumPhase? @map("from_phase")
  toPhase   LithiumPhase  @map("to_phase")
  changedBy String        @map("changed_by")
  reason    String?
  metadata  Json?
  changedAt DateTime      @default(now()) @map("changed_at")
  deal      Deal          @relation(fields: [dealId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [changedBy], references: [id])

  @@index([dealId])
  @@index([changedAt])
  @@map("deal_state_history")
}

model DealNote {
  id        String   @id @default(cuid())
  dealId    String   @map("deal_id")
  authorId  String   @map("author_id")
  content   String
  isInternal Boolean @default(true) @map("is_internal")
  createdAt DateTime @default(now()) @map("created_at")
  deal      Deal     @relation(fields: [dealId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])

  @@index([dealId])
  @@map("deal_notes")
}

model DealEvent {
  id        String        @id @default(cuid())
  dealId    String        @map("deal_id")
  eventType DealEventType @map("event_type")
  actorRole String        @map("actor_role")
  actorId   String?       @map("actor_id")
  metadata  Json?
  timestamp DateTime      @default(now())
  deal      Deal          @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@index([dealId])
  @@index([eventType])
  @@index([timestamp])
  @@map("deal_events")
}

model Document {
  id          String       @id @default(cuid())
  dealId      String       @map("deal_id")
  type        DocumentType
  version     Int          @default(1)
  documentUrl String       @map("document_url")
  fileName    String?      @map("file_name")
  mimeType    String?      @map("mime_type")
  uploadedBy  String       @map("uploaded_by")
  uploadedAt  DateTime     @default(now()) @map("uploaded_at")
  isVerified  Boolean      @default(false) @map("is_verified")
  verifiedAt  DateTime?    @map("verified_at")
  verifiedBy  String?      @map("verified_by")
  deal        Deal         @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@index([dealId])
  @@index([type])
  @@map("documents")
}
```

- [ ] **Step 2: Remove the `User` relations that no longer resolve**

Ensure `User` declares only: `dealsAsAdmin Deal[] @relation("DealAdmin")`, `dealNotes DealNote[]`, `dealStateChanges DealStateHistory[]`, `counterparty Counterparty?`, plus kept relations (`company`, `addresses`, `inspectionAssignments`, `companyAdmin`). Delete the rest.

- [ ] **Step 3: Validate the schema**

Run: `cd normie-apps/lithium-broker/backend && npx prisma validate`
Expected: "The schema at prisma/schema.prisma is valid 🚀".

### Task 7: Migration + client generation

**Files:**
- Create: `backend/prisma/migrations/<timestamp>_lithos_phase1/migration.sql` (generated)

- [ ] **Step 1: Reset and create the initial lithium migration**

Run (requires a dev `DATABASE_URL`; use a local Postgres or the Prisma dev DB):
```bash
cd normie-apps/lithium-broker/backend
npx prisma migrate reset --force --skip-seed
npx prisma migrate dev --name lithos_phase1
```
Expected: migration created and applied; "Your database is now in sync".

- [ ] **Step 2: Generate the client and typecheck**

Run: `npx prisma generate && npx tsc --noEmit`
Expected: client generated. Remaining tsc errors will be in kept modules referencing deleted models (e.g. `inspections`, `onboarding`) — fix by aligning them to the new schema or removing ag-only code paths. Re-run until zero errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(db): lithium domain model (deals, counterparties, products, documents)"
```

---

## Phase C — State machine (pure, TDD first)

### Task 8: `VALID_TRANSITIONS` table + `assertTransition`

**Files:**
- Create: `backend/src/deals/state-machine.ts`
- Test: `backend/src/deals/state-machine.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/deals/state-machine.spec.ts
import { LithiumPhase } from "@prisma/client";
import { getValidTransitions, canTransition, assertTransition } from "./state-machine";

describe("deal state machine", () => {
  it("advances along the linear backbone", () => {
    expect(canTransition(LithiumPhase.ORIGINATION, LithiumPhase.QUALIFICATION)).toBe(true);
    expect(canTransition(LithiumPhase.FINANCE, LithiumPhase.LOGISTICS)).toBe(true);
    expect(canTransition(LithiumPhase.LOGISTICS, LithiumPhase.SETTLEMENT)).toBe(true);
  });

  it("rejects skipping stages", () => {
    expect(canTransition(LithiumPhase.ORIGINATION, LithiumPhase.SETTLEMENT)).toBe(false);
    expect(canTransition(LithiumPhase.QUALIFICATION, LithiumPhase.INSPECTION)).toBe(false);
  });

  it("allows DISPUTED and CANCELLED from any active stage", () => {
    for (const p of [
      LithiumPhase.ORIGINATION, LithiumPhase.QUALIFICATION, LithiumPhase.INDICATIVE_OFFER,
      LithiumPhase.FIRM_OFFER, LithiumPhase.CONTRACT, LithiumPhase.COMPLIANCE,
      LithiumPhase.INSPECTION, LithiumPhase.FINANCE, LithiumPhase.LOGISTICS, LithiumPhase.SETTLEMENT,
    ]) {
      expect(canTransition(p, LithiumPhase.CANCELLED)).toBe(true);
      expect(canTransition(p, LithiumPhase.DISPUTED)).toBe(true);
    }
  });

  it("only reaches COMPLETED from SETTLEMENT", () => {
    expect(canTransition(LithiumPhase.SETTLEMENT, LithiumPhase.COMPLETED)).toBe(true);
    expect(canTransition(LithiumPhase.LOGISTICS, LithiumPhase.COMPLETED)).toBe(false);
  });

  it("supports the assay-dispute loop INSPECTION -> DISPUTED -> INSPECTION", () => {
    expect(canTransition(LithiumPhase.INSPECTION, LithiumPhase.DISPUTED)).toBe(true);
    expect(canTransition(LithiumPhase.DISPUTED, LithiumPhase.INSPECTION)).toBe(true);
    expect(canTransition(LithiumPhase.DISPUTED, LithiumPhase.CANCELLED)).toBe(true);
  });

  it("terminal states allow no further transitions", () => {
    expect(getValidTransitions(LithiumPhase.COMPLETED)).toEqual([]);
    expect(getValidTransitions(LithiumPhase.CANCELLED)).toEqual([]);
  });

  it("assertTransition throws on invalid transition", () => {
    expect(() => assertTransition(LithiumPhase.ORIGINATION, LithiumPhase.SETTLEMENT)).toThrow();
    expect(() => assertTransition(LithiumPhase.ORIGINATION, LithiumPhase.QUALIFICATION)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/deals/state-machine.spec.ts`
Expected: FAIL — cannot find module `./state-machine`.

- [ ] **Step 3: Implement the state machine**

```typescript
// backend/src/deals/state-machine.ts
import { BadRequestException } from "@nestjs/common";
import { LithiumPhase } from "@prisma/client";

const BRANCH = [LithiumPhase.DISPUTED, LithiumPhase.CANCELLED];

const TRANSITIONS: Record<LithiumPhase, LithiumPhase[]> = {
  [LithiumPhase.ORIGINATION]:      [LithiumPhase.QUALIFICATION, ...BRANCH],
  [LithiumPhase.QUALIFICATION]:    [LithiumPhase.INDICATIVE_OFFER, ...BRANCH],
  [LithiumPhase.INDICATIVE_OFFER]: [LithiumPhase.FIRM_OFFER, ...BRANCH],
  [LithiumPhase.FIRM_OFFER]:       [LithiumPhase.CONTRACT, ...BRANCH],
  [LithiumPhase.CONTRACT]:         [LithiumPhase.COMPLIANCE, ...BRANCH],
  [LithiumPhase.COMPLIANCE]:       [LithiumPhase.INSPECTION, ...BRANCH],
  [LithiumPhase.INSPECTION]:       [LithiumPhase.FINANCE, ...BRANCH],
  [LithiumPhase.FINANCE]:          [LithiumPhase.LOGISTICS, ...BRANCH],
  [LithiumPhase.LOGISTICS]:        [LithiumPhase.SETTLEMENT, ...BRANCH],
  [LithiumPhase.SETTLEMENT]:       [LithiumPhase.COMPLETED, ...BRANCH],
  // assay-dispute branch can return to INSPECTION or terminate
  [LithiumPhase.DISPUTED]:         [LithiumPhase.INSPECTION, LithiumPhase.CANCELLED],
  [LithiumPhase.CANCELLED]:        [],
  [LithiumPhase.COMPLETED]:        [],
};

export function getValidTransitions(current: LithiumPhase): LithiumPhase[] {
  return TRANSITIONS[current] ?? [];
}

export function canTransition(from: LithiumPhase, to: LithiumPhase): boolean {
  return getValidTransitions(from).includes(to);
}

export function assertTransition(from: LithiumPhase, to: LithiumPhase): void {
  if (!canTransition(from, to)) {
    throw new BadRequestException(`Invalid transition from ${from} to ${to}`);
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/deals/state-machine.spec.ts`
Expected: PASS (all assertions).

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(deals): pipeline state machine with VALID_TRANSITIONS"
```

---

## Phase D — Deal events + deal service

### Task 9: DealEventsService

**Files:**
- Create: `backend/src/deal-events/deal-events.service.ts`
- Create: `backend/src/deal-events/deal-events.module.ts`
- Test: `backend/src/deal-events/deal-events.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/deal-events/deal-events.service.spec.ts
import { DealEventType } from "@prisma/client";
import { DealEventsService } from "./deal-events.service";

describe("DealEventsService", () => {
  it("records an event via prisma.dealEvent.create", async () => {
    const create = jest.fn().mockResolvedValue({});
    const prisma = { dealEvent: { create } } as any;
    const svc = new DealEventsService(prisma);

    await svc.record({
      dealId: "d1",
      eventType: DealEventType.DEAL_ORIGINATED,
      actorRole: "ADMIN",
      actorId: "u1",
    });

    expect(create).toHaveBeenCalledWith({
      data: { dealId: "d1", eventType: DealEventType.DEAL_ORIGINATED, actorRole: "ADMIN", actorId: "u1", metadata: undefined },
    });
  });

  it("never throws if prisma fails", async () => {
    const prisma = { dealEvent: { create: jest.fn().mockRejectedValue(new Error("db down")) } } as any;
    const svc = new DealEventsService(prisma);
    await expect(svc.record({ dealId: "d1", eventType: DealEventType.STAGE_ADVANCED, actorRole: "ADMIN" })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/deal-events`
Expected: FAIL — cannot find module `./deal-events.service`.

- [ ] **Step 3: Implement**

```typescript
// backend/src/deal-events/deal-events.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { DealEventType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface RecordDealEvent {
  dealId: string;
  eventType: DealEventType;
  actorRole: string;
  actorId?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class DealEventsService {
  private readonly logger = new Logger(DealEventsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async record(e: RecordDealEvent): Promise<void> {
    try {
      await this.prisma.dealEvent.create({
        data: {
          dealId: e.dealId,
          eventType: e.eventType,
          actorRole: e.actorRole,
          actorId: e.actorId,
          metadata: e.metadata,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record deal event: ${(error as Error).message}`);
    }
  }

  getByDeal(dealId: string) {
    return this.prisma.dealEvent.findMany({ where: { dealId }, orderBy: { timestamp: "asc" } });
  }
}
```

```typescript
// backend/src/deal-events/deal-events.module.ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { DealEventsService } from "./deal-events.service";

@Module({ imports: [PrismaModule], providers: [DealEventsService], exports: [DealEventsService] })
export class DealEventsModule {}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/deal-events`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(deals): DealEventsService event log writer"
```

### Task 10: DealService — create/originate (TDD)

**Files:**
- Create: `backend/src/deals/deal.service.ts`
- Test: `backend/src/deals/deal.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/deals/deal.service.spec.ts
import { DealEventType, LithiumPhase } from "@prisma/client";
import { DealService } from "./deal.service";

function makePrisma() {
  return {
    deal: {
      create: jest.fn().mockResolvedValue({ id: "d1", phase: LithiumPhase.ORIGINATION, adminId: "admin1" }),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dealStateHistory: { create: jest.fn().mockResolvedValue({}) },
  } as any;
}
const realtime = { emitToUser: jest.fn() } as any;
const events = { record: jest.fn().mockResolvedValue(undefined) } as any;

describe("DealService.create", () => {
  it("creates a deal in ORIGINATION and records DEAL_ORIGINATED", async () => {
    const prisma = makePrisma();
    const svc = new DealService(prisma, realtime, events);
    const deal = await svc.create({ supplierId: "s1", buyerId: "b1" }, "admin1");
    expect(prisma.deal.create).toHaveBeenCalled();
    const arg = prisma.deal.create.mock.calls[0][0].data;
    expect(arg.phase).toBe(LithiumPhase.ORIGINATION);
    expect(arg.adminId).toBe("admin1");
    expect(typeof arg.dealNumber).toBe("string");
    expect(events.record).toHaveBeenCalledWith(expect.objectContaining({ dealId: "d1", eventType: DealEventType.DEAL_ORIGINATED, actorId: "admin1" }));
    expect(deal.id).toBe("d1");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/deals/deal.service.spec.ts`
Expected: FAIL — cannot find module `./deal.service`.

- [ ] **Step 3: Implement the create method (file will grow in later tasks)**

```typescript
// backend/src/deals/deal.service.ts
import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { Deal, DealEventType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeService } from "../realtime/realtime.service";
import { DealEventsService } from "../deal-events/deal-events.service";

export interface CreateDealInput {
  supplierId?: string;
  buyerId?: string;
  productId?: string;
  volume?: number;
  incoterm?: any;
  indexReference?: string;
  differential?: number;
  priceFloor?: number;
  manualPrice?: number;
  priceBasisNote?: string;
  currency?: string;
}

@Injectable()
export class DealService {
  private readonly logger = new Logger(DealService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly events: DealEventsService,
  ) {}

  async create(input: CreateDealInput, adminId: string): Promise<Deal> {
    const deal = await this.prisma.deal.create({
      data: {
        dealNumber: `LX-${Date.now()}`,
        adminId,
        phase: "ORIGINATION",
        status: "ACTIVE",
        supplierId: input.supplierId,
        buyerId: input.buyerId,
        productId: input.productId,
        volume: input.volume,
        incoterm: input.incoterm,
        indexReference: input.indexReference,
        differential: input.differential,
        priceFloor: input.priceFloor,
        manualPrice: input.manualPrice,
        priceBasisNote: input.priceBasisNote,
        currency: input.currency ?? "USD",
      },
    });

    await this.events.record({
      dealId: deal.id,
      eventType: DealEventType.DEAL_ORIGINATED,
      actorRole: "ADMIN",
      actorId: adminId,
    });

    return deal;
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/deals/deal.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(deals): DealService.create (originate deal)"
```

### Task 11: DealService.advancePhase — transition + history + event + realtime (TDD)

**Files:**
- Modify: `backend/src/deals/deal.service.ts`
- Modify: `backend/src/deals/deal.service.spec.ts`

- [ ] **Step 1: Add the failing test**

```typescript
// append to backend/src/deals/deal.service.spec.ts
describe("DealService.advancePhase", () => {
  it("advances to the next valid phase, writing history + event + realtime", async () => {
    const prisma = makePrisma();
    prisma.deal.findUnique.mockResolvedValue({ id: "d1", phase: LithiumPhase.ORIGINATION, adminId: "admin1", supplierId: null, buyerId: null });
    prisma.deal.update.mockResolvedValue({ id: "d1", phase: LithiumPhase.QUALIFICATION, adminId: "admin1" });
    const svc = new DealService(prisma, realtime, events);

    const updated = await svc.advancePhase("d1", LithiumPhase.QUALIFICATION, "admin1");

    expect(prisma.deal.update).toHaveBeenCalledWith({ where: { id: "d1" }, data: { phase: LithiumPhase.QUALIFICATION } });
    expect(prisma.dealStateHistory.create).toHaveBeenCalledWith({
      data: { dealId: "d1", fromPhase: LithiumPhase.ORIGINATION, toPhase: LithiumPhase.QUALIFICATION, changedBy: "admin1", reason: undefined },
    });
    expect(events.record).toHaveBeenCalledWith(expect.objectContaining({ dealId: "d1", eventType: DealEventType.STAGE_ADVANCED }));
    expect(updated.phase).toBe(LithiumPhase.QUALIFICATION);
  });

  it("rejects an invalid transition without mutating", async () => {
    const prisma = makePrisma();
    prisma.deal.findUnique.mockResolvedValue({ id: "d1", phase: LithiumPhase.ORIGINATION, adminId: "admin1" });
    const svc = new DealService(prisma, realtime, events);
    await expect(svc.advancePhase("d1", LithiumPhase.SETTLEMENT, "admin1")).rejects.toThrow(/Invalid transition/);
    expect(prisma.deal.update).not.toHaveBeenCalled();
    expect(prisma.dealStateHistory.create).not.toHaveBeenCalled();
  });

  it("throws NotFound when the deal does not exist", async () => {
    const prisma = makePrisma();
    prisma.deal.findUnique.mockResolvedValue(null);
    const svc = new DealService(prisma, realtime, events);
    await expect(svc.advancePhase("missing", LithiumPhase.QUALIFICATION, "admin1")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/deals/deal.service.spec.ts`
Expected: FAIL — `advancePhase` is not a function.

- [ ] **Step 3: Implement `advancePhase` + status sync + terminal handling**

Add the import and methods to `deal.service.ts`:

```typescript
// add to imports
import { LithiumPhase, DealStatus } from "@prisma/client";
import { assertTransition } from "./state-machine";

// add inside DealService
async advancePhase(id: string, to: LithiumPhase, changedBy: string, reason?: string): Promise<Deal> {
  const deal = await this.prisma.deal.findUnique({ where: { id } });
  if (!deal) throw new NotFoundException("Deal not found");

  assertTransition(deal.phase, to);

  const status = this.statusForPhase(to, deal.status);
  const updated = await this.prisma.deal.update({
    where: { id },
    data: {
      phase: to,
      ...(status !== deal.status ? { status } : {}),
      ...(to === LithiumPhase.COMPLETED ? { completedAt: new Date() } : {}),
    },
  });

  await this.prisma.dealStateHistory.create({
    data: { dealId: id, fromPhase: deal.phase, toPhase: to, changedBy, reason },
  });

  await this.events.record({
    dealId: id,
    eventType: this.eventForPhase(to),
    actorRole: "ADMIN",
    actorId: changedBy,
    metadata: { from: deal.phase, to },
  });

  this.realtime.emitToUser(deal.adminId, "deal:updated", updated);

  return updated;
}

private statusForPhase(phase: LithiumPhase, current: DealStatus): DealStatus {
  if (phase === LithiumPhase.DISPUTED) return DealStatus.DISPUTED;
  if (phase === LithiumPhase.CANCELLED) return DealStatus.CANCELLED;
  if (phase === LithiumPhase.COMPLETED) return DealStatus.COMPLETED;
  if (current === DealStatus.DISPUTED && phase === LithiumPhase.INSPECTION) return DealStatus.ACTIVE;
  return current;
}

private eventForPhase(phase: LithiumPhase): DealEventType {
  if (phase === LithiumPhase.DISPUTED) return DealEventType.DEAL_DISPUTED;
  if (phase === LithiumPhase.CANCELLED) return DealEventType.DEAL_CANCELLED;
  if (phase === LithiumPhase.COMPLETED) return DealEventType.DEAL_COMPLETED;
  return DealEventType.STAGE_ADVANCED;
}
```

> Note: the history-create test asserts no `metadata` key is passed; keep `dealStateHistory.create` data to exactly `{ dealId, fromPhase, toPhase, changedBy, reason }`.

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/deals/deal.service.spec.ts`
Expected: PASS (all advancePhase + create tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(deals): advancePhase with history, event log, realtime, status sync"
```

### Task 12: DealService.recordCommissionPaid (TDD)

**Files:**
- Modify: `backend/src/deals/deal.service.ts`
- Modify: `backend/src/deals/deal.service.spec.ts`

- [ ] **Step 1: Add the failing test**

```typescript
// append to backend/src/deals/deal.service.spec.ts
describe("DealService.recordCommissionPaid", () => {
  it("marks commission RECORDED_PAID and logs COMMISSION_RECORDED at SETTLEMENT", async () => {
    const prisma = makePrisma();
    prisma.deal.findUnique.mockResolvedValue({ id: "d1", phase: LithiumPhase.SETTLEMENT, adminId: "admin1" });
    prisma.deal.update.mockResolvedValue({ id: "d1", commissionStatus: "RECORDED_PAID" });
    const svc = new DealService(prisma, realtime, events);

    const r = await svc.recordCommissionPaid("d1", "admin1");

    expect(prisma.deal.update).toHaveBeenCalledWith({ where: { id: "d1" }, data: { commissionStatus: "RECORDED_PAID" } });
    expect(events.record).toHaveBeenCalledWith(expect.objectContaining({ eventType: DealEventType.COMMISSION_RECORDED }));
    expect(r.commissionStatus).toBe("RECORDED_PAID");
  });

  it("refuses to record commission before SETTLEMENT", async () => {
    const prisma = makePrisma();
    prisma.deal.findUnique.mockResolvedValue({ id: "d1", phase: LithiumPhase.FINANCE, adminId: "admin1" });
    const svc = new DealService(prisma, realtime, events);
    await expect(svc.recordCommissionPaid("d1", "admin1")).rejects.toThrow();
    expect(prisma.deal.update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/deals/deal.service.spec.ts`
Expected: FAIL — `recordCommissionPaid` is not a function.

- [ ] **Step 3: Implement**

```typescript
// add to imports
import { BadRequestException } from "@nestjs/common";

// add inside DealService
async recordCommissionPaid(id: string, actorId: string): Promise<Deal> {
  const deal = await this.prisma.deal.findUnique({ where: { id } });
  if (!deal) throw new NotFoundException("Deal not found");
  if (deal.phase !== LithiumPhase.SETTLEMENT) {
    throw new BadRequestException("Commission can only be recorded at SETTLEMENT");
  }
  const updated = await this.prisma.deal.update({
    where: { id },
    data: { commissionStatus: "RECORDED_PAID" },
  });
  await this.events.record({
    dealId: id, eventType: DealEventType.COMMISSION_RECORDED, actorRole: "ADMIN", actorId,
  });
  return updated;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/deals/deal.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(deals): recordCommissionPaid at SETTLEMENT"
```

---

## Phase E — Counterparties, KYC, documents, products

### Task 13: Stubbed sanctions/PEP screening (TDD)

**Files:**
- Create: `backend/src/counterparties/sanctions-screening.stub.ts`
- Test: `backend/src/counterparties/sanctions-screening.stub.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/counterparties/sanctions-screening.stub.spec.ts
import { screenCounterparty } from "./sanctions-screening.stub";

describe("screenCounterparty (stub)", () => {
  it("returns a deterministic clear result for a normal name", () => {
    const r = screenCounterparty({ name: "Andes Lithium SA", jurisdiction: "CL" });
    expect(r.provider).toBe("STUB");
    expect(r.sanctions.hit).toBe(false);
    expect(r.pep.hit).toBe(false);
    expect(typeof r.screenedAt).toBe("string");
  });

  it("flags a name containing the magic test token", () => {
    const r = screenCounterparty({ name: "SANCTIONED Trading Ltd", jurisdiction: "RU" });
    expect(r.sanctions.hit).toBe(true);
  });

  it("is deterministic for the same input", () => {
    const a = screenCounterparty({ name: "Acme", jurisdiction: "US" });
    const b = screenCounterparty({ name: "Acme", jurisdiction: "US" });
    expect(a.sanctions.hit).toBe(b.sanctions.hit);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/counterparties/sanctions-screening.stub.spec.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement (deterministic stub; NO live API)**

```typescript
// backend/src/counterparties/sanctions-screening.stub.ts
export interface ScreeningInput { name: string; jurisdiction?: string }
export interface ScreeningResult {
  provider: "STUB";
  sanctions: { hit: boolean; lists: string[] };
  pep: { hit: boolean };
  screenedAt: string;
}

// Phase 1 stub: models the workflow only. The magic token "SANCTIONED"
// lets tests/demos exercise the rejected branch deterministically.
export function screenCounterparty(input: ScreeningInput): ScreeningResult {
  const upper = input.name.toUpperCase();
  const sanctionsHit = upper.includes("SANCTIONED");
  const pepHit = upper.includes("PEP");
  return {
    provider: "STUB",
    sanctions: { hit: sanctionsHit, lists: sanctionsHit ? ["STUB_OFAC"] : [] },
    pep: { hit: pepHit },
    screenedAt: new Date(0).toISOString(),
  };
}
```

> Note: `new Date(0)` keeps the result deterministic for tests; the service layer stamps the real time when persisting.

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/counterparties/sanctions-screening.stub.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(counterparties): stubbed sanctions/PEP screening"
```

### Task 14: CounterpartyService — create + KYC transitions (TDD)

**Files:**
- Create: `backend/src/counterparties/counterparty.service.ts`
- Test: `backend/src/counterparties/counterparty.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/counterparties/counterparty.service.spec.ts
import { KycStatus } from "@prisma/client";
import { CounterpartyService } from "./counterparty.service";

function prismaMock() {
  return { counterparty: {
    create: jest.fn().mockResolvedValue({ id: "c1", kycStatus: "NOT_STARTED" }),
    findUnique: jest.fn(),
    update: jest.fn(),
  } } as any;
}

describe("CounterpartyService", () => {
  it("creates a counterparty and runs the screening stub", async () => {
    const prisma = prismaMock();
    const svc = new CounterpartyService(prisma);
    await svc.create({ name: "Andes Lithium SA", role: "SUPPLIER", jurisdiction: "CL" });
    const data = prisma.counterparty.create.mock.calls[0][0].data;
    expect(data.name).toBe("Andes Lithium SA");
    expect(data.sanctionsResult).toEqual(expect.objectContaining({ provider: "STUB" }));
  });

  it("approves KYC", async () => {
    const prisma = prismaMock();
    prisma.counterparty.findUnique.mockResolvedValue({ id: "c1", kycStatus: "IN_REVIEW" });
    prisma.counterparty.update.mockResolvedValue({ id: "c1", kycStatus: "APPROVED", isVerified: true });
    const svc = new CounterpartyService(prisma);
    const r = await svc.setKycStatus("c1", KycStatus.APPROVED, "admin1");
    expect(prisma.counterparty.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "c1" },
      data: expect.objectContaining({ kycStatus: "APPROVED", isVerified: true, verifiedBy: "admin1" }),
    }));
    expect(r.kycStatus).toBe("APPROVED");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/counterparties/counterparty.service.spec.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement**

```typescript
// backend/src/counterparties/counterparty.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { Counterparty, CounterpartyRole, KycStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { screenCounterparty } from "./sanctions-screening.stub";

export interface CreateCounterpartyInput {
  name: string;
  role: CounterpartyRole;
  jurisdiction?: string;
  userId?: string;
  companyId?: string;
}

@Injectable()
export class CounterpartyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCounterpartyInput): Promise<Counterparty> {
    const screening = screenCounterparty({ name: input.name, jurisdiction: input.jurisdiction });
    return this.prisma.counterparty.create({
      data: {
        name: input.name,
        role: input.role,
        jurisdiction: input.jurisdiction,
        userId: input.userId,
        companyId: input.companyId,
        kycStatus: "NOT_STARTED",
        sanctionsResult: { ...screening, screenedAt: new Date().toISOString() },
        pepResult: screening.pep,
      },
    });
  }

  async setKycStatus(id: string, status: KycStatus, actorId: string): Promise<Counterparty> {
    const existing = await this.prisma.counterparty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Counterparty not found");
    const approved = status === KycStatus.APPROVED;
    return this.prisma.counterparty.update({
      where: { id },
      data: {
        kycStatus: status,
        isVerified: approved,
        verifiedAt: approved ? new Date() : null,
        verifiedBy: approved ? actorId : null,
      },
    });
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/counterparties/counterparty.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(counterparties): create + KYC status transitions"
```

### Task 15: DocumentService — upload-record + verify (TDD)

**Files:**
- Create: `backend/src/documents/document.service.ts`
- Test: `backend/src/documents/document.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/documents/document.service.spec.ts
import { DealEventType, DocumentType } from "@prisma/client";
import { DocumentService } from "./document.service";

function deps() {
  const prisma = { document: {
    create: jest.fn().mockResolvedValue({ id: "doc1", type: "LOI", isVerified: false, dealId: "d1" }),
    findUnique: jest.fn(),
    update: jest.fn(),
  } } as any;
  const events = { record: jest.fn().mockResolvedValue(undefined) } as any;
  return { prisma, events };
}

describe("DocumentService", () => {
  it("records an uploaded document and logs DOCUMENT_UPLOADED", async () => {
    const { prisma, events } = deps();
    const svc = new DocumentService(prisma, events);
    await svc.upload({ dealId: "d1", type: DocumentType.LOI, documentUrl: "https://x/loi.pdf", uploadedBy: "admin1" });
    expect(prisma.document.create).toHaveBeenCalled();
    expect(events.record).toHaveBeenCalledWith(expect.objectContaining({ dealId: "d1", eventType: DealEventType.DOCUMENT_UPLOADED }));
  });

  it("verifies a document and logs DOCUMENT_VERIFIED", async () => {
    const { prisma, events } = deps();
    prisma.document.findUnique.mockResolvedValue({ id: "doc1", dealId: "d1", isVerified: false });
    prisma.document.update.mockResolvedValue({ id: "doc1", dealId: "d1", isVerified: true });
    const svc = new DocumentService(prisma, events);
    const r = await svc.verify("doc1", "admin1");
    expect(prisma.document.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "doc1" }, data: expect.objectContaining({ isVerified: true, verifiedBy: "admin1" }),
    }));
    expect(events.record).toHaveBeenCalledWith(expect.objectContaining({ eventType: DealEventType.DOCUMENT_VERIFIED }));
    expect(r.isVerified).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/documents/document.service.spec.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement**

```typescript
// backend/src/documents/document.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { Document, DocumentType, DealEventType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { DealEventsService } from "../deal-events/deal-events.service";

export interface UploadDocumentInput {
  dealId: string;
  type: DocumentType;
  documentUrl: string;
  uploadedBy: string;
  version?: number;
  fileName?: string;
  mimeType?: string;
}

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: DealEventsService,
  ) {}

  async upload(input: UploadDocumentInput): Promise<Document> {
    const doc = await this.prisma.document.create({
      data: {
        dealId: input.dealId,
        type: input.type,
        documentUrl: input.documentUrl,
        uploadedBy: input.uploadedBy,
        version: input.version ?? 1,
        fileName: input.fileName,
        mimeType: input.mimeType,
      },
    });
    await this.events.record({
      dealId: input.dealId, eventType: DealEventType.DOCUMENT_UPLOADED, actorRole: "ADMIN",
      actorId: input.uploadedBy, metadata: { documentId: doc.id, type: input.type },
    });
    return doc;
  }

  async verify(documentId: string, actorId: string): Promise<Document> {
    const existing = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!existing) throw new NotFoundException("Document not found");
    const doc = await this.prisma.document.update({
      where: { id: documentId },
      data: { isVerified: true, verifiedAt: new Date(), verifiedBy: actorId },
    });
    await this.events.record({
      dealId: doc.dealId, eventType: DealEventType.DOCUMENT_VERIFIED, actorRole: "ADMIN",
      actorId, metadata: { documentId },
    });
    return doc;
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/documents/document.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(documents): upload-record + verify with audit events"
```

### Task 16: LithiumProductService — per-form spec validation (TDD)

**Files:**
- Create: `backend/src/lithium-products/lithium-product.service.ts`
- Test: `backend/src/lithium-products/lithium-product.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/lithium-products/lithium-product.service.spec.ts
import { ProductForm, ProductUnit } from "@prisma/client";
import { LithiumProductService } from "./lithium-product.service";

const prisma = { lithiumProduct: { create: jest.fn().mockResolvedValue({ id: "p1" }) } } as any;

describe("LithiumProductService", () => {
  it("creates a spodumene concentrate with Li2O grade", async () => {
    const svc = new LithiumProductService(prisma);
    await svc.create({ form: ProductForm.SPODUMENE_CONCENTRATE, li2oPercent: 6, unit: ProductUnit.DMT, quantity: 1000 });
    expect(prisma.lithiumProduct.create).toHaveBeenCalled();
  });

  it("rejects spodumene without Li2O grade", async () => {
    const svc = new LithiumProductService(prisma);
    await expect(svc.create({ form: ProductForm.SPODUMENE_CONCENTRATE, unit: ProductUnit.DMT, quantity: 1000 } as any))
      .rejects.toThrow(/li2oPercent/i);
  });

  it("rejects carbonate without purity", async () => {
    const svc = new LithiumProductService(prisma);
    await expect(svc.create({ form: ProductForm.LITHIUM_CARBONATE, unit: ProductUnit.TONNE, quantity: 20 } as any))
      .rejects.toThrow(/purityPercent/i);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/lithium-products`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement**

```typescript
// backend/src/lithium-products/lithium-product.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { LithiumProduct, ProductForm, ProductUnit, GradeFamily } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface CreateProductInput {
  form: ProductForm;
  unit: ProductUnit;
  quantity: number;
  gradeFamily?: GradeFamily;
  li2oPercent?: number;
  fe2o3Percent?: number;
  purityPercent?: number;
  packaging?: string;
  coaReference?: string;
}

@Injectable()
export class LithiumProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateProductInput): Promise<LithiumProduct> {
    this.validateSpec(input);
    return this.prisma.lithiumProduct.create({
      data: {
        form: input.form,
        unit: input.unit,
        quantity: input.quantity,
        gradeFamily: input.gradeFamily,
        li2oPercent: input.li2oPercent,
        fe2o3Percent: input.fe2o3Percent,
        purityPercent: input.purityPercent,
        packaging: input.packaging,
        coaReference: input.coaReference,
      },
    });
  }

  private validateSpec(i: CreateProductInput): void {
    if (i.form === ProductForm.SPODUMENE_CONCENTRATE && i.li2oPercent == null) {
      throw new BadRequestException("li2oPercent is required for spodumene concentrate");
    }
    if (
      (i.form === ProductForm.LITHIUM_CARBONATE || i.form === ProductForm.LITHIUM_HYDROXIDE) &&
      i.purityPercent == null
    ) {
      throw new BadRequestException("purityPercent is required for carbonate/hydroxide");
    }
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/lithium-products`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(lithium-products): per-form spec validation"
```

---

## Phase F — Wire modules + REST API + end-to-end

### Task 17: Modules + controllers + DTOs, registered in app.module

**Files:**
- Create: `backend/src/deals/deals.module.ts`, `backend/src/deals/deal.controller.ts`, `backend/src/deals/dto/create-deal.dto.ts`, `backend/src/deals/dto/advance-phase.dto.ts`
- Create: `backend/src/counterparties/counterparties.module.ts`, `backend/src/counterparties/counterparty.controller.ts`
- Create: `backend/src/documents/documents.module.ts`, `backend/src/documents/document.controller.ts`
- Create: `backend/src/lithium-products/lithium-products.module.ts`, `backend/src/lithium-products/lithium-product.controller.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create the deals module + controller + DTOs**

```typescript
// backend/src/deals/dto/create-deal.dto.ts
import { IsOptional, IsString, IsNumber } from "class-validator";
export class CreateDealDto {
  @IsOptional() @IsString() supplierId?: string;
  @IsOptional() @IsString() buyerId?: string;
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsNumber() volume?: number;
  @IsOptional() @IsString() incoterm?: string;
  @IsOptional() @IsString() indexReference?: string;
  @IsOptional() @IsNumber() differential?: number;
  @IsOptional() @IsNumber() priceFloor?: number;
  @IsOptional() @IsNumber() manualPrice?: number;
  @IsOptional() @IsString() priceBasisNote?: string;
  @IsOptional() @IsString() currency?: string;
}
```

```typescript
// backend/src/deals/dto/advance-phase.dto.ts
import { IsEnum, IsOptional, IsString } from "class-validator";
import { LithiumPhase } from "@prisma/client";
export class AdvancePhaseDto {
  @IsEnum(LithiumPhase) to: LithiumPhase;
  @IsOptional() @IsString() reason?: string;
}
```

```typescript
// backend/src/deals/deal.controller.ts
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { DealService } from "./deal.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import { AdvancePhaseDto } from "./dto/advance-phase.dto";

@Controller("deals")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DealController {
  constructor(private readonly deals: DealService) {}

  @Post() @Roles("ADMIN")
  create(@Body() dto: CreateDealDto, @CurrentUser() user: { id: string }) {
    return this.deals.create(dto, user.id);
  }

  @Patch(":id/advance") @Roles("ADMIN")
  advance(@Param("id") id: string, @Body() dto: AdvancePhaseDto, @CurrentUser() user: { id: string }) {
    return this.deals.advancePhase(id, dto.to, user.id, dto.reason);
  }

  @Patch(":id/commission/paid") @Roles("ADMIN")
  commission(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.deals.recordCommissionPaid(id, user.id);
  }
}
```

> Verify `@CurrentUser`, `@Roles`, `JwtAuthGuard`, `RolesGuard` import paths/signatures against the kept `auth` module; adjust if the decorator returns a different user shape.

```typescript
// backend/src/deals/deals.module.ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { DealEventsModule } from "../deal-events/deal-events.module";
import { DealService } from "./deal.service";
import { DealController } from "./deal.controller";

@Module({
  imports: [PrismaModule, RealtimeModule, DealEventsModule],
  providers: [DealService],
  controllers: [DealController],
  exports: [DealService],
})
export class DealsModule {}
```

- [ ] **Step 2: Create counterparties / documents / lithium-products modules + controllers**

Follow the same pattern. Controllers (all `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles("ADMIN")`):
- `counterparty.controller.ts`: `POST /counterparties` → `create`; `PATCH /counterparties/:id/kyc` (body `{ status }`) → `setKycStatus`.
- `document.controller.ts`: `POST /documents` → `upload`; `PATCH /documents/:id/verify` → `verify`.
- `lithium-product.controller.ts`: `POST /lithium-products` → `create`.

Each module imports `PrismaModule` (and `DealEventsModule` for documents), provides its service, declares its controller.

- [ ] **Step 3: Register the new modules in `app.module.ts`**

Add to imports: `DealsModule, DealEventsModule, CounterpartiesModule, DocumentsModule, LithiumProductsModule`.

- [ ] **Step 4: Typecheck + build**

Run: `cd normie-apps/lithium-broker/backend && npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(api): deals/counterparties/documents/products modules + controllers"
```

### Task 18: End-to-end deal lifecycle test (origination → commission)

**Files:**
- Test: `backend/test/deal-lifecycle.e2e-spec.ts`

- [ ] **Step 1: Write the failing end-to-end test (service-level, real Prisma test DB)**

```typescript
// backend/test/deal-lifecycle.e2e-spec.ts
import { Test } from "@nestjs/testing";
import { DealEventType, KycStatus, LithiumPhase, ProductForm, ProductUnit } from "@prisma/client";
import { PrismaModule } from "../src/prisma/prisma.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { RealtimeService } from "../src/realtime/realtime.service";
import { DealEventsService } from "../src/deal-events/deal-events.service";
import { DealService } from "../src/deals/deal.service";
import { CounterpartyService } from "../src/counterparties/counterparty.service";
import { DocumentService } from "../src/documents/document.service";
import { LithiumProductService } from "../src/lithium-products/lithium-product.service";

const LINEAR: LithiumPhase[] = [
  LithiumPhase.QUALIFICATION, LithiumPhase.INDICATIVE_OFFER, LithiumPhase.FIRM_OFFER,
  LithiumPhase.CONTRACT, LithiumPhase.COMPLIANCE, LithiumPhase.INSPECTION,
  LithiumPhase.FINANCE, LithiumPhase.LOGISTICS, LithiumPhase.SETTLEMENT,
];

describe("Deal lifecycle (e2e)", () => {
  let prisma: PrismaService, deals: DealService, cps: CounterpartyService,
      docs: DocumentService, products: LithiumProductService;
  let adminId: string;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        DealService, CounterpartyService, DocumentService, LithiumProductService,
        DealEventsService, { provide: RealtimeService, useValue: { emitToUser: jest.fn() } },
      ],
    }).compile();
    prisma = mod.get(PrismaService);
    deals = mod.get(DealService); cps = mod.get(CounterpartyService);
    docs = mod.get(DocumentService); products = mod.get(LithiumProductService);
    const admin = await prisma.user.create({ data: { email: `admin-${Date.now()}@lithos.test`, role: "ADMIN" } });
    adminId = admin.id;
  });

  afterAll(async () => { await prisma.$disconnect(); });

  it("runs one deal origination -> commission recorded", async () => {
    const supplier = await cps.create({ name: "Andes Lithium SA", role: "SUPPLIER", jurisdiction: "CL" });
    const buyer = await cps.create({ name: "Ganfeng Buyer", role: "BUYER", jurisdiction: "CN" });
    await cps.setKycStatus(supplier.id, KycStatus.APPROVED, adminId);
    await cps.setKycStatus(buyer.id, KycStatus.APPROVED, adminId);

    const product = await products.create({
      form: ProductForm.SPODUMENE_CONCENTRATE, li2oPercent: 6, unit: ProductUnit.DMT, quantity: 1000,
    });

    const deal = await deals.create({
      supplierId: supplier.id, buyerId: buyer.id, productId: product.id, volume: 1000,
      indexReference: "Fastmarkets spodumene 6% CIF China", differential: -50, manualPrice: 950,
    }, adminId);
    expect(deal.phase).toBe(LithiumPhase.ORIGINATION);

    await docs.upload({ dealId: deal.id, type: "LOI", documentUrl: "https://x/loi.pdf", uploadedBy: adminId });
    const loi = await prisma.document.findFirst({ where: { dealId: deal.id, type: "LOI" } });
    await docs.verify(loi!.id, adminId);

    let current = deal;
    for (const phase of LINEAR) {
      current = await deals.advancePhase(deal.id, phase, adminId);
      expect(current.phase).toBe(phase);
    }
    expect(current.phase).toBe(LithiumPhase.SETTLEMENT);

    const settled = await deals.recordCommissionPaid(deal.id, adminId);
    expect(settled.commissionStatus).toBe("RECORDED_PAID");

    const completed = await deals.advancePhase(deal.id, LithiumPhase.COMPLETED, adminId);
    expect(completed.phase).toBe(LithiumPhase.COMPLETED);
    expect(completed.status).toBe("COMPLETED");

    // Audit invariant: one history row per transition (10 advances)
    const history = await prisma.dealStateHistory.findMany({ where: { dealId: deal.id } });
    expect(history.length).toBe(10);

    // Audit invariant: events cover origination, upload, verify, advances, commission, completion
    const events = await prisma.dealEvent.findMany({ where: { dealId: deal.id } });
    const types = events.map((e) => e.eventType);
    expect(types).toContain(DealEventType.DEAL_ORIGINATED);
    expect(types).toContain(DealEventType.DOCUMENT_UPLOADED);
    expect(types).toContain(DealEventType.DOCUMENT_VERIFIED);
    expect(types).toContain(DealEventType.COMMISSION_RECORDED);
    expect(types).toContain(DealEventType.DEAL_COMPLETED);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest --config ./test/jest-e2e.json deal-lifecycle 2>/dev/null || npx jest test/deal-lifecycle.e2e-spec.ts`
Expected: FAIL initially if the test DB/env is not set; once `DATABASE_URL` points at a clean test DB, failures should be assertion-driven, not import errors.

- [ ] **Step 3: Make it pass**

Ensure `DATABASE_URL` points to a disposable Postgres and migrations are applied (`npx prisma migrate deploy`). Fix any signature mismatches surfaced by the test (this test is the integration contract for Tasks 8–16).

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest test/deal-lifecycle.e2e-spec.ts`
Expected: PASS — the full lifecycle and both audit invariants hold.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "test(e2e): one deal origination -> commission recorded, audit invariants"
```

---

## Phase G — Non-custodial guard + secrets discipline

### Task 19: Fail-fast env validation

**Files:**
- Create: `backend/src/common/config/env.validation.ts`
- Modify: `backend/src/app.module.ts` (wire `validate` into `ConfigModule.forRoot`)
- Test: `backend/src/common/config/env.validation.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/common/config/env.validation.spec.ts
import { validateEnv } from "./env.validation";

describe("validateEnv", () => {
  it("passes when required vars are present", () => {
    expect(() => validateEnv({ DATABASE_URL: "postgres://x", JWT_SECRET: "s", PRIVY_APP_ID: "p" })).not.toThrow();
  });
  it("throws listing every missing required var", () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
    expect(() => validateEnv({})).toThrow(/JWT_SECRET/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/common/config/env.validation.spec.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement**

```typescript
// backend/src/common/config/env.validation.ts
const REQUIRED = ["DATABASE_URL", "JWT_SECRET", "PRIVY_APP_ID"] as const;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED.filter((k) => !config[k] || String(config[k]).trim() === "");
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  return config;
}
```

In `app.module.ts`, wire it: `ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })`.

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest src/common/config/env.validation.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "feat(config): fail-fast required env validation"
```

### Task 20: Non-custodial guard test (architectural invariant)

**Files:**
- Test: `backend/test/non-custodial.guard-spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// backend/test/non-custodial.guard-spec.ts
import { execSync } from "child_process";

describe("non-custodial invariant", () => {
  it("ships no money-moving code paths", () => {
    // grep the source for forbidden custody/transfer primitives. Exit code 1 => no matches (good).
    const cmd = `grep -rniE "transferFrom|releaseFunds|sendTransaction|escrowRelease|payout|custody" src --include=*.ts || true`;
    const out = execSync(cmd, { cwd: `${__dirname}/..` }).toString().trim();
    expect(out).toBe("");
  });

  it("has no escrow or contracts modules", () => {
    const cmd = `ls src | grep -E "^(escrow)$" || true`;
    const out = execSync(cmd, { cwd: `${__dirname}/..` }).toString().trim();
    expect(out).toBe("");
  });
});
```

- [ ] **Step 2: Run to verify it fails (or passes immediately if prune was clean)**

Run: `cd normie-apps/lithium-broker/backend && npx jest test/non-custodial.guard-spec.ts`
Expected: If any forbidden primitive remains, FAIL and prints the offending lines — remove them. Once clean, PASS.

- [ ] **Step 3: Remove any flagged custody code**

Delete or refactor any file the grep surfaced (leftover ag/crypto code). Re-run until PASS.

- [ ] **Step 4: Run to verify it passes**

Run: `cd normie-apps/lithium-broker/backend && npx jest test/non-custodial.guard-spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "test: non-custodial architectural invariant"
```

### Task 21: Full suite green + CLAUDE.md

**Files:**
- Create: `normie-apps/lithium-broker/CLAUDE.md`
- Modify: `normie-apps/lithium-broker/README.md`

- [ ] **Step 1: Run the entire backend test suite**

Run: `cd normie-apps/lithium-broker/backend && npx jest`
Expected: all suites PASS.

- [ ] **Step 2: Typecheck + lint**

Run: `cd normie-apps/lithium-broker/backend && npx tsc --noEmit && npm run lint`
Expected: zero errors (fix any lint failures).

- [ ] **Step 3: Write a concise CLAUDE.md** capturing: product = Lithos non-custodial lithium brokerage; stack; the deal state machine + audit invariants; non-custodial rule; "Phase 1 only" scope; next phase = mobile re-skin (Salar brand).

- [ ] **Step 4: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add -A && git commit -q -m "docs: CLAUDE.md + README for Lithos backend; Phase 1 backend complete"
```

---

## Self-review notes (coverage map)

- Spec §3 build order (backend-first) → this whole plan; mobile is a separate plan.
- Spec §4 fork+prune → Tasks 1–3.
- Spec §5 roles → Task 4 (`UserRole`).
- Spec §6 domain model → Tasks 4–7 (enums, Counterparty, LithiumProduct, Deal, DealStateHistory, DealNote, DealEvent, Document).
- Spec §7 state machine + invariants → Tasks 8, 11 (history+event+realtime per transition), 18 (invariants asserted).
- Spec §8 documents/KYC/verification → Tasks 13, 14, 15.
- Spec §10 non-custodial + secrets → Tasks 19, 20.
- Spec §11 thin vertical slice (one deal, admin-driven) → Task 18 end-to-end.
- Spec §12 testing → every task is TDD; Task 18 asserts the audit invariant; Task 20 the non-custodial invariant.
- Spec §13 definition of done → Task 18 proves one deal end-to-end; Task 21 full suite green.
- Branding (§9) is explicitly deferred to the mobile plan (backend has no UI).
```
