# Lithos Phase 1 — Mobile (Expo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) — steps use checkbox (`- [ ]`) syntax.

**Goal:** Re-skin AgroTrade's Expo app as **Lithos** (Salar brand) and ship a runnable **admin deal-pipeline** thin slice wired to the Lithos backend: log in, see deals, originate a deal (product/spec + counterparties), advance it through the 10 stages, upload + verify documents, manage counterparty KYC, record commission.

**Architecture:** Reuse the dark-glass design system + Moti motion + navigation shell. Re-brand via `design-system/tokens.ts` (single source — re-skins the whole app). Add a new `features/deals` module of screens that talk to a new typed `services/lithos/*` API layer. Add a dedicated Lithos admin navigator and route to it; leave ag screens dormant (not imported) rather than adapting them.

**Tech Stack:** React Native + Expo, NativeWind, Moti/Reanimated, axios, Zustand, Privy auth, React Navigation.

**Spec:** `docs/superpowers/specs/2026-05-30-lithos-phase1-design.md` · **Backend:** `normie-apps/lithium-broker/backend` (`:4000/api`).

---

## File Structure

In `normie-apps/lithium-broker/front-end/`:
- `src/design-system/tokens.ts` — **Modify**: Salar palette + gradient.
- `BRAND_GUIDELINES.md` — **Modify**: Salar table.
- `app.json` — **Modify**: name/slug/splash bg to Lithos.
- `.env` — **Modify**: `EXPO_PUBLIC_API_URL=http://localhost:4000/api`.
- `src/services/lithos/types.ts` — **Create**: shared API types (mirror Prisma enums).
- `src/services/lithos/deals.api.ts`, `counterparties.api.ts`, `documents.api.ts`, `products.api.ts` — **Create**.
- `src/features/deals/PIPELINE.ts` — **Create**: stage list + labels + valid next-stages (mirror backend).
- `src/features/deals/screens/DealsListScreen.tsx` — **Create**.
- `src/features/deals/screens/DealDetailScreen.tsx` — **Create**: stage stepper + advance + commission + documents.
- `src/features/deals/screens/NewDealScreen.tsx` — **Create**: product/spec + counterparty pickers.
- `src/features/deals/screens/CounterpartiesScreen.tsx` — **Create**: list + create + KYC.
- `src/features/deals/components/*` — **Create**: `StageStepper`, `DealCard`, `DocumentRow`.
- `src/navigation/LithosNavigator.tsx` — **Create**: stack for the admin slice.
- `src/navigation/RootNavigator.tsx` — **Modify**: route to LithosNavigator.

---

## Phase M-A — Salar rebrand

### Task 1: Re-skin design tokens

**Files:** Modify `src/design-system/tokens.ts`

- [ ] **Step 1: Replace COLORS + GRADIENT with the Salar palette**

```typescript
export const GRADIENT = {
  background: ['#101216', '#0B0B0E', '#000000'] as const, // salar dusk -> dark
  platinum: ['#9CA3AF', '#D4D7DD'] as const,
  blue: ['#2563EB', '#60A5FA'] as const,
  amber: ['#B45309', '#F5B544'] as const,
};
```

```typescript
export const COLORS = {
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.35)',
  accentPlatinum: '#D4D7DD',  // primary CTAs / active / brand
  accentBlue: '#60A5FA',      // secondary / neutral highlight
  accentGold: '#F5B544',      // money / commission stats (kept name for compat)
  accentGreen: '#2DD4BF',     // verify/KYC-approved (kept name for compat)
  danger: '#F87171',
  warning: '#F5B544',
  success: '#2DD4BF',
  info: '#60A5FA',
};
```

> Keep the `accentGreen`/`accentGold` keys (many components import them) but repoint their hex to teal/amber so the whole app re-skins without touching every consumer. App background base becomes `#0B0B0E`.

- [ ] **Step 2: Typecheck**

Run: `cd front-end && npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: same count as before the edit (no new errors from tokens).

- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): Salar brand palette in design tokens"`

### Task 2: App identity

**Files:** Modify `app.json`, `BRAND_GUIDELINES.md`

- [ ] **Step 1:** In `app.json` set `expo.name` = "Lithos", `expo.slug` = "lithos", splash `backgroundColor` = `#0B0B0E`, and any `backgroundColor` to `#0B0B0E`.
- [ ] **Step 2:** Replace the color table in `BRAND_GUIDELINES.md` with the Salar tokens (platinum/blue/amber/teal on `#0B0B0E`).
- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): Lithos app identity + Salar brand guidelines"`

---

## Phase M-B — Lithos API layer

### Task 3: API types mirroring backend

**Files:** Create `src/services/lithos/types.ts`

- [ ] **Step 1:** Define TS unions matching backend enums + DTO shapes.

```typescript
export type LithiumPhase =
  | 'ORIGINATION' | 'QUALIFICATION' | 'INDICATIVE_OFFER' | 'FIRM_OFFER' | 'CONTRACT'
  | 'COMPLIANCE' | 'INSPECTION' | 'FINANCE' | 'LOGISTICS' | 'SETTLEMENT'
  | 'DISPUTED' | 'CANCELLED' | 'COMPLETED';
export type DealStatus = 'ACTIVE' | 'ON_HOLD' | 'DISPUTED' | 'CANCELLED' | 'COMPLETED';
export type CounterpartyRole = 'SUPPLIER' | 'BUYER' | 'INSPECTOR' | 'LOGISTICS';
export type KycStatus = 'NOT_STARTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
export type ProductForm =
  | 'SPODUMENE_CONCENTRATE' | 'LITHIUM_CARBONATE' | 'LITHIUM_HYDROXIDE' | 'BRINE' | 'LEPIDOLITE' | 'OTHER';
export type ProductUnit = 'DMT' | 'KG' | 'TONNE' | 'LCE';
export type DocumentType =
  | 'LOI' | 'ICPO' | 'FCO' | 'NCNDA' | 'IMFPA' | 'SPA' | 'KYC' | 'POF' | 'POP' | 'COA' | 'LC' | 'BL' | 'OTHER';
export type CommissionStatus = 'PENDING' | 'RECORDED_PAID';

export interface Deal {
  id: string; dealNumber: string; phase: LithiumPhase; status: DealStatus;
  supplierId?: string; buyerId?: string; productId?: string; volume?: string;
  indexReference?: string; manualPrice?: string; commissionStatus: CommissionStatus;
  createdAt: string;
}
export interface Counterparty {
  id: string; name: string; role: CounterpartyRole; jurisdiction?: string;
  kycStatus: KycStatus; isVerified: boolean;
}
export interface DealDocument {
  id: string; dealId: string; type: DocumentType; documentUrl: string; isVerified: boolean;
}
```

- [ ] **Step 2: Commit** — `git commit -m "feat(mobile): Lithos API types"`

### Task 4: API client modules + env

**Files:** Create `src/services/lithos/{deals,counterparties,documents,products}.api.ts`; modify `.env`

- [ ] **Step 1:** Point the app at the backend — add to `front-end/.env`: `EXPO_PUBLIC_API_URL=http://localhost:4000/api`.
- [ ] **Step 2:** Reuse the existing axios instance from `src/services/api.ts` (already attaches the Bearer token). Create thin API modules:

```typescript
// src/services/lithos/deals.api.ts
import api from '../api';
import type { Deal, LithiumPhase } from './types';

export const dealsApi = {
  list: () => api.get<Deal[]>('/deals').then((r) => r.data),
  get: (id: string) => api.get<Deal>(`/deals/${id}`).then((r) => r.data),
  create: (body: Partial<Deal>) => api.post<Deal>('/deals', body).then((r) => r.data),
  advance: (id: string, to: LithiumPhase, reason?: string) =>
    api.patch<Deal>(`/deals/${id}/advance`, { to, reason }).then((r) => r.data),
  recordCommission: (id: string) =>
    api.patch<Deal>(`/deals/${id}/commission/paid`, {}).then((r) => r.data),
};
```

(counterparties.api.ts → `POST /counterparties`, `PATCH /counterparties/:id/kyc`; documents.api.ts → `POST /documents`, `PATCH /documents/:id/verify`; products.api.ts → `POST /lithium-products`. Verify `src/services/api.ts` default-exports the axios instance; if it exports named, adjust imports.)

> Backend gap to close while wiring: the controllers currently expose `POST /deals` + advance/commission but **not** `GET /deals` / `GET /deals/:id`. Add `findAll`/`findOne` to `DealService` + `@Get()`/`@Get(':id')` to `DealController` (admin-guarded) as part of this task, with a unit test for `findAll`.

- [ ] **Step 3: Commit** — `git commit -m "feat(mobile): Lithos API client modules + backend deal read endpoints"`

---

## Phase M-C — Admin deal-pipeline screens

### Task 5: Pipeline metadata (shared with UI)

**Files:** Create `src/features/deals/PIPELINE.ts`

- [ ] **Step 1:** Mirror the backend stage order + human labels + per-phase accent.

```typescript
import type { LithiumPhase } from '@services/lithos/types';

export const PIPELINE: LithiumPhase[] = [
  'ORIGINATION','QUALIFICATION','INDICATIVE_OFFER','FIRM_OFFER','CONTRACT',
  'COMPLIANCE','INSPECTION','FINANCE','LOGISTICS','SETTLEMENT',
];
export const PHASE_LABEL: Record<LithiumPhase, string> = {
  ORIGINATION: 'Origination', QUALIFICATION: 'Qualification', INDICATIVE_OFFER: 'Indicative Offer',
  FIRM_OFFER: 'Firm Offer', CONTRACT: 'Contract', COMPLIANCE: 'Compliance', INSPECTION: 'Inspection',
  FINANCE: 'Finance', LOGISTICS: 'Logistics', SETTLEMENT: 'Settlement',
  DISPUTED: 'Disputed', CANCELLED: 'Cancelled', COMPLETED: 'Completed',
};
export function nextPhase(p: LithiumPhase): LithiumPhase | null {
  const i = PIPELINE.indexOf(p);
  return i >= 0 && i < PIPELINE.length - 1 ? PIPELINE[i + 1] : (p === 'SETTLEMENT' ? 'COMPLETED' : null);
}
```

- [ ] **Step 2: Commit**

### Task 6: DealsListScreen + DealCard + StageStepper

**Files:** Create `src/features/deals/components/DealCard.tsx`, `StageStepper.tsx`, `src/features/deals/screens/DealsListScreen.tsx`

- [ ] **Step 1:** Build `StageStepper` (horizontal pills of `PIPELINE`, current highlighted with `accentPlatinum`, done with `accentGreen`/teal) using `GlassCard` + tokens.
- [ ] **Step 2:** Build `DealCard` (deal number, phase pill, status, commission badge) reusing `GlassCard`.
- [ ] **Step 3:** Build `DealsListScreen`: `dealsApi.list()` in a `useEffect`/query, `FlatList` of `DealCard`, Moti stagger entrance, empty state, a "＋ New Deal" CTA → `NewDealScreen`. Tap a card → `DealDetailScreen`.
- [ ] **Step 4:** Typecheck. **Commit.**

### Task 7: DealDetailScreen

**Files:** Create `src/features/deals/screens/DealDetailScreen.tsx`, `components/DocumentRow.tsx`

- [ ] **Step 1:** Header (deal number, status), `StageStepper`, "Advance to <nextPhase>" button (`dealsApi.advance`), plus Dispute/Cancel actions. At `SETTLEMENT`, show "Record commission paid" (`dealsApi.recordCommission`); at `COMPLETED`, show the done state.
- [ ] **Step 2:** Documents section: list deal documents (`DocumentRow` with verify toggle → `documentsApi.verify`), and an "Upload document" action (type picker + URL field → `documentsApi.upload`). (File picker can be a URL field in the thin slice.)
- [ ] **Step 3:** Counterparties summary (supplier/buyer + KYC badges).
- [ ] **Step 4:** Typecheck. **Commit.**

### Task 8: NewDealScreen + CounterpartiesScreen

**Files:** Create `src/features/deals/screens/NewDealScreen.tsx`, `CounterpartiesScreen.tsx`

- [ ] **Step 1:** `CounterpartiesScreen`: list counterparties, create (name/role/jurisdiction → `counterpartiesApi.create`), KYC action (set APPROVED/REJECTED → `counterpartiesApi.setKyc`) with screening result shown.
- [ ] **Step 2:** `NewDealScreen`: pick supplier + buyer (from counterparties), create product (form + spec fields, validated client-side mirroring backend: Li₂O for spodumene, purity for carbonate/hydroxide → `productsApi.create`), enter manual price (indexReference + differential + manualPrice), then `dealsApi.create`. Navigate to the new `DealDetailScreen`.
- [ ] **Step 3:** Typecheck. **Commit.**

---

## Phase M-D — Navigation + role wiring

### Task 9: LithosNavigator + route in

**Files:** Create `src/navigation/LithosNavigator.tsx`; modify `src/navigation/RootNavigator.tsx`

- [ ] **Step 1:** Create a native-stack `LithosNavigator` with routes: `DealsList`, `DealDetail`, `NewDeal`, `Counterparties`.
- [ ] **Step 2:** In `RootNavigator`, for an authenticated user render `LithosNavigator` (replace the ag dashboard route for the admin slice). Leave ag navigators unimported so nothing ag renders.
- [ ] **Step 3:** Relabel any visible role strings to ADMIN/SUPPLIER/BUYER/INSPECTOR/LOGISTICS.
- [ ] **Step 4:** Typecheck. **Commit.**

---

## Phase M-E — Run it

### Task 10: Launch + smoke

- [ ] **Step 1:** Start the backend (`cd backend && npm run start:dev`) with the local Postgres up.
- [ ] **Step 2:** Start Expo (`cd front-end && npx expo start`) on iOS simulator (or web: `npx expo start --web`).
- [ ] **Step 3:** Smoke the slice: log in → Counterparties (create supplier+buyer, approve KYC) → New Deal → advance through stages → upload+verify a document → record commission → completed. Screenshot the Salar-branded deal detail.
- [ ] **Step 4:** Note any gaps; capture follow-ups. **Commit** screenshots/notes.

---

## Self-review notes

- Spec §9 branding → Tasks 1–2 (Salar tokens + identity).
- Spec §5 roles → Task 9 relabel.
- Spec §11 thin slice (admin-driven, one deal end-to-end on the phone) → Tasks 5–10.
- Backend read-endpoint gap (`GET /deals`) is closed in Task 4 with a test.
- Adapting the 500+ ag screens is explicitly out of scope; ag navigators are left dormant, not deleted, to keep the diff focused.
- Document upload uses a URL field in the slice (matches backend's URL-storage pattern); a native file picker is a follow-up.
