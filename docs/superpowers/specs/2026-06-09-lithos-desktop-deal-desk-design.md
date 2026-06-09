# Lithos Desktop Deal-Desk — Design Spec (Sub-project A)

_2026-06-09_

## Goal

Adapt the existing Lithos mobile app's **admin/broker** experience into a proper
desktop UX: a responsive multi-pane "deal desk" that activates on wide screens
(Mac Catalyst, large iPad, web), while the phone experience stays unchanged. This
is the UX half of "make a Mac app"; the Mac Catalyst build + Mac App Store
distribution is a **separate** spec (Sub-project B).

## Context

- App: Expo React Native (`front-end/`), Salar Aurora design system.
- Admin pipeline today is a phone stack — `src/navigation/LithosNavigator.tsx`:
  `DealsList → DealDetail({dealId}) → NewDeal → Counterparties`.
  `DealsListScreen` uses a `FlatList` of `DealCard`s and
  `navigation.navigate('DealDetail', { dealId })`.
- Counterparty role portals (`features/role-views/*`) are a different navigator
  and are **out of scope** here — the desk is the broker/admin tool.
- Responsive precedent exists (`useWindowDimensions`/`Dimensions` already used in
  `shared/components/Container.tsx`, `Modal.tsx`, `design-system/GradientBackground.tsx`).

## Decisions (locked)

1. Full desktop layout now (not minimal): multi-pane master-detail desk.
2. Single codebase, one breakpoint — no separate desktop app or fork.
3. Breakpoint: `width >= 1024` ⇒ "desk mode". Below ⇒ existing stack (unchanged).
4. Desk is admin/broker only for v1. Counterparty portals unchanged.
5. Native menu bar + keyboard shortcuts are out of scope for v1.

## Architecture

### Responsive switch
- New hook `src/shared/hooks/useResponsive.ts` → `{ width, isDesk }` where
  `isDesk = width >= 1024` (via `useWindowDimensions`, re-renders on resize/rotate).
- `LithosNavigator` branches: `isDesk ? <DeskLayout/> : <existing Stack/>`. The
  phone stack code path is untouched (no regression risk).

### Desk layout (wide screens)
A three-region shell:
- **Sidebar rail** (`Sidebar.tsx`): brand mark + nav items (Deals, Counterparties,
  + New Deal). Selecting an item sets the active view in the desk.
- **Master pane** (`DealTable.tsx`): dense table of deals — columns: deal #,
  supplier→buyer, product, stage (with mini stage indicator), commission status.
  Rows are `Pressable` with `onHoverIn/onHoverOut` highlight; clicking selects.
- **Detail pane**: renders the selected deal via the existing `DealDetailScreen`
  content, keyed by `selectedDealId`. "New Deal" and "Counterparties" render in
  this pane (or a right-side panel) instead of a stack push.

```
┌──────────┬───────────────────────────┬────────────────────────────┐
│ Sidebar  │  DealTable (dense)        │  Deal detail (selected)    │
│ Deals    │  # · parties · stage      │  pipeline · docs · events  │
│ Parties  │  …selectable, hover…      │  assign · advance · commis │
│ + New    │                           │                            │
└──────────┴───────────────────────────┴────────────────────────────┘
```

### State
- Desk-local state in `DeskLayout`: `activeView` ('deals' | 'counterparties' |
  'new-deal') and `selectedDealId: string | null`. No global store needed.
- Realtime: reuse the existing `useDealRealtime` so the table + open detail
  auto-refresh on `deal:updated`.

### Component reuse / refactor
- **`DealDetailScreen`**: decouple from route params — accept an optional
  `dealId?: string` prop; when absent, fall back to the route param (phone path).
  This lets the same screen render inside the desk detail pane and the phone stack.
- **`NewDealScreen` / `CounterpartiesScreen`**: same pattern — usable both as a
  stack screen (phone) and embedded in the desk pane. On submit/close in desk
  mode they return to the deals view + refresh, instead of `navigation.goBack()`.
- New files only add desktop composition; existing card/stack UI is preserved for
  phone.

## New / changed files

- Create: `src/shared/hooks/useResponsive.ts`
- Create: `src/features/deals/desk/DeskLayout.tsx`
- Create: `src/features/deals/desk/Sidebar.tsx`
- Create: `src/features/deals/desk/DealTable.tsx`
- Modify: `src/navigation/LithosNavigator.tsx` (branch on `isDesk`)
- Modify: `src/features/deals/screens/DealDetailScreen.tsx` (accept `dealId` prop)
- Modify: `src/features/deals/screens/NewDealScreen.tsx`,
  `CounterpartiesScreen.tsx` (optional `onDone`/embedded mode)

## Desktop affordances (v1)

- Pointer hover highlight on table rows + sidebar items + buttons (`Pressable`
  `onHoverIn/onHoverOut`).
- Denser table typography/spacing vs the phone card list; tabular-nums for figures.
- Wider content; panes have sensible min/flex widths (sidebar ~240px fixed,
  master ~minmax, detail flex). Detail pane scrolls independently.
- Default/min window size is configured in Sub-project B (Catalyst) — not here.

## Error / empty states

- No deal selected ⇒ detail pane shows an empty-state ("Select a deal").
- Loading/empty deal list ⇒ existing list states reused in table form.
- Resizing across the breakpoint mid-session swaps modes cleanly (state is local;
  a deep-linked phone route still works on narrow).

## Testing

- Manual: run Expo web (`expo start --web`) and resize across 1024px — desk mode
  shows the 3-pane layout; below shows the unchanged stack. In the iOS simulator
  (iPad / Mac Catalyst later) confirm the wide layout. Select different deals →
  detail pane updates; open New Deal/Counterparties in-pane; create a deal →
  returns to deals view refreshed. Confirm phone (narrow) flow is unchanged.
- `tsc --noEmit` clean. No backend changes; non-custodial guard unaffected.

## Out of scope (YAGNI / separate specs)

- **Sub-project B**: Mac Catalyst enablement (config plugin: `SUPPORTS_MACCATALYST`),
  Mac distribution cert + Mac App Store provisioning, EAS/Xcode build, MAS submit.
  Also: stripping the unused Daily.co video + expo-camera modules and gating
  react-native-maps for Catalyst happens in B.
- Counterparty role portals desktop adaptation.
- Native macOS menu bar, keyboard shortcuts, multi-window.
- Column sorting/filtering beyond what exists (can add later).

## Risks / notes

- Detecting "Mac" specifically is unreliable in RN; we deliberately drive layout
  off **window width**, which is correct for Catalyst, iPad, and web alike.
- `onHoverIn/onHoverOut` only fire with a pointer (Mac/iPad trackpad/web) — they
  must be purely additive (no behavior depends on hover).
- Keep the phone stack path literally unchanged to guarantee no mobile regression.
