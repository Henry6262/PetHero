:

**Date:** 2026-06-14
**Status:** Approved
**Repo:** `web3-games/trench-wars`

## Summary

Clash Royale-style in-game shell for Trench Royale. The landing Hero/DarkVeil/diorama stay as-is. The single "BUILD YOUR DECK" CTA starts a character-guided onboarding that ends in a CR-style main menu.

## New user flow

```
Landing ("BUILD YOUR DECK")
        ↓
Onboarding
   Step 1  Welcome splash       →  Vanguard guide introduces the trench
   Step 2  Identity             →  Play as Guest / Connect Wallet
   Step 3  First Lootbox        →  open a starter pack, reveal cards
   Step 4  Build Deck           →  pick 8 cards from the loot you just opened
   Step 5  Level Up Character   →  pick one card, bump its level (+hp/+damage)
   Step 6  First Battle         →  practice vs AI with Vanguard hints
   Step 7  Complete             →  enter the CR main menu
        ↓
Main Menu (CR-style)
        ↓
Deck / Practice / Ladder / Battle
```

Returning players (who have completed onboarding) skip the onboarding and land directly in the Main Menu.

## Vanguard tutorial guide

A friendly commander character (Vanguard portrait) follows the player through onboarding with speech bubbles:
- Appears bottom-left by default
- Speech bubble with gold border, dark panel
- Step counter + "Next" / "Got it" button
- Disappears when the step is done
- Can be reused in battle for contextual hints

## Step 1 — Welcome splash
- Dark background, animated logo, "Traders vs Jeets"
- Vanguard appears: "Welcome to the trench, commander."
- Big gold button: **"ENTER THE TRENCH"**

## Step 2 — Choose identity
- Two cards: Play as Guest / Connect Wallet
- Vanguard: "Choose how you want to fight. Guest is instant; wallet unlocks ranked rewards."

## Step 3 — First Lootbox
- A starter pack sits center screen
- Vanguard: "Every commander needs troops. Open your first pack."
- Click the pack → shake animation → cards flip out one by one
- Pack contains 6 starter cards (deterministic first pack)
- Cards revealed with cost and portrait

## Step 4 — Build your deck
- Show only the cards from the lootbox
- Vanguard: "Pick 8 cards for your squad. Tap to add or remove."
- Must pick exactly 8 to continue
- **DEPLOY SQUAD** button

## Step 5 — Level up a character
- Show the 8 cards in your deck
- Vanguard: "Pick one card to level up. Higher level means more HP and damage."
- Click a card → shows level bump animation (+1), stat numbers increase
- **CONTINUE** button

## Step 6 — First battle
- Launch practice match
- Vanguard hints in corner:
  - "Drag a card from your hand onto your side."
  - "Destroy both towers before time runs out."
  - "Elixir refills automatically — spend it wisely."
- After battle → complete step

## Step 7 — Complete
- Vanguard: "You’re ready for ranked warfare."
- **TO THE TRENCH** button → main menu

## Main Menu layout (Clash Royale inspired)

```
┌─────────────────────────────────────────────────┐
│  [AVATAR] Name          ELO 1000  ⚡ 0W          │
├─────────────────────────────────────────────────┤
│                                                 │
│           [  ⚔ BATTLE  ]                        │
│                                                 │
│      [PRACTICE VS AI]    [DECK BUILDER]         │
│                                                 │
│      ┌─────────────────┐                        │
│      │  CURRENT SQUAD  │                        │
│      │  8 card faces   │                        │
│      └─────────────────┘                        │
│                                                 │
├─────────────────────────────────────────────────┤
│  ⚔ Battle   🎴 Deck   🎁 Loot   🏆 Ladder       │
└─────────────────────────────────────────────────┘
```

## Technical architecture

- `Onboarding` state machine with steps: `welcome | identity | lootbox | deck | levelup | battle | complete`
- `TutorialGuide` component drives Vanguard speech bubbles
- Lootbox cards are deterministic first-pack for onboarding
- Level-up is visual-only for onboarding (client state), not persisted to server
- Deck is saved via existing `createDeck` API
- Onboarding completion stored in `localStorage` key `trench-royale-onboarding-complete`

## Files to change

| File | Change |
| --- | --- |
| `src/ui/Onboarding.tsx` | rewrite with lootbox, deck, levelup steps |
| `src/ui/TutorialGuide.tsx` | new Vanguard guide component |
| `src/ui/theme.css` | lootbox + levelup + guide styles |
| `src/ui/Battle.tsx` | use TutorialGuide for in-battle hints |
| `e2e/smoke.spec.ts` | update flow |
