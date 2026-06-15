# Trench Royale — Loot Shop Design

**Date:** 2026-06-14
**Status:** In progress
**Repo:** `web3-games/trench-wars`

## Summary

Turn the Loot tab from a placeholder into a real `$ROYALE` shop. Players see their balance, buy card packs, and open them with the same reveal animation used in onboarding. For v1 the shop is client-side only: balance is stored in `localStorage`, packs are deterministic/random from the starter pool, and owned cards are tracked locally.

## Player $ROYALE balance

- Stored in `localStorage` key `trench-royale-royale-balance`
- New players start with **1000 $ROYALE**
- Displayed in the main menu top bar next to ELO/wins

## Shop offers

| Pack | Price | Cards | Description |
| --- | --- | --- | --- |
| Starter Pack | FREE (one-time) | 10 | Same as onboarding starter pack |
| Common Pack | 100 $ROYALE | 4 | 4 cards from starter pool |
| Rare Pack | 300 $ROYALE | 6 | 6 cards, higher chance for higher-cost cards |

## Flow

1. Click Loot tab → see balance + pack grid
2. Click a pack → if affordable, subtract price and open
3. Pack opening: center pack shakes, then cards reveal one by one
4. Cards are added to `localStorage` collection key `trench-royale-collection`
5. "OPEN ANOTHER" / "BACK" buttons

## UI

- Top bar: `$ROYALE 1,000`
- Pack cards with name, price, card count
- Pack uses gift-box emoji + gold border (reuse onboarding style)
- Reveal screen uses `.loot-reward` components

## Files to change

| File | Change |
| --- | --- |
| `src/ui/Menu.tsx` | add balance display, real Loot tab content |
| `src/ui/LootShop.tsx` | new shop component |
| `src/ui/PackOpen.tsx` | reusable pack opening animation (extract from onboarding) |
| `src/ui/Onboarding.tsx` | reuse PackOpen for onboarding lootbox |
| `src/ui/theme.css` | shop + pack styles |
