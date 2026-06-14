# Trench Royale — Clash Royale-Style Menu + Onboarding Design

**Date:** 2026-06-14
**Status:** Approved (pivot from full landing build-out)
**Repo:** `web3-games/trench-wars`

## Summary

Pause the remaining landing-page sections (Roster / How It Works / Mechanics / Token Economy) and focus on the in-game shell: a **Clash Royale-style main menu** plus a **short first-time onboarding** that starts from the landing "BUILD YOUR DECK" CTA.

The landing Hero/DarkVeil/diorama stay as-is. The single CTA now enters onboarding instead of dropping straight into the legacy menu.

## Research takeaways (Clash Royale UX)

- **Bottom navigation** is always visible; tabs map to the game's core loops (Battle · Cards/Deck · Shop · Events/Social).
- **Primary action is yellow/gold, big, and centered** on the main screen — the "BATTLE" button is the star.
- **One-hand interface**: all key tap targets live in the lower 50% of the screen.
- **Shallow UI depth**: most panels are popups/modals, rarely fullscreen; previous screen stays visible behind.
- **Onboarding throws you straight into the arena**: first seconds are a real battle with light guidance, not a slideshow.
- **Tooltips** appear contextually; players can ignore/skip them.
- **First matches are vs AI** until the player is ready for PvP.

## New user flow

```
Landing ("BUILD YOUR DECK")
        ↓
Onboarding
   Step 1  Welcome splash  →  "Enter the Trench"
   Step 2  Identity        →  Play as Guest  /  Connect Wallet
   Step 3  Build Deck      →  pick 8 starter cards
   Step 4  First Battle    →  practice vs AI with hint overlay
        ↓
Main Menu (CR-style)
        ↓
Deck / Practice / Ladder / Battle
```

Returning players (who have completed onboarding) skip the onboarding and land directly in the Main Menu.

## Main Menu layout (Clash Royale inspired)

```
┌─────────────────────────────────────────────────┐
│  [AVATAR] Guest#ABC1           ELO 1000  ⚡ 0W  │  ← top bar
├─────────────────────────────────────────────────┤
│                                                 │
│           [  ⚔ BATTLE  ]                        │  ← big gold CTA
│                                                 │
│      [PRACTICE VS AI]    [DECK BUILDER]         │  ← secondary actions
│                                                 │
│      ┌─────────────────┐                        │
│      │  CURRENT DECK   │                        │  ← deck preview strip
│      │  8 card faces   │                        │
│      └─────────────────┘                        │
│                                                 │
├─────────────────────────────────────────────────┤
│  ⚔ Battle   🎴 Deck   🎁 Loot   🏆 Ladder       │  ← bottom tabs
└─────────────────────────────────────────────────┘
```

- **Top bar**: avatar + display name, ELO, win count. Gold/platinum palette.
- **Center stage**: the big gold **BATTLE** button starts a ladder match when logged in; if no account, it routes to onboarding step 2.
- **Secondary row**: Practice vs AI, Deck Builder.
- **Deck preview**: shows the 8 currently selected cards; tapping opens Deck Builder.
- **Bottom tabs**: Battle (main), Deck, Loot (shop/lootbox teaser — ties to $ROYALE economy), Ladder (leaderboard / match history placeholder).

## Onboarding steps

### Step 1 — Welcome splash
- Fullscreen dark background with animated logo + "Traders vs Jeets" tagline.
- One big gold button: **"ENTER THE TRENCH"**.
- Subtle hint: "First battle in under 60 seconds."

### Step 2 — Choose identity
- Two cards:
  - **Play as Guest** — instant, local ladder, no rewards.
  - **Connect Wallet** — ranked ladder, $ROYALE rewards, requires Phantom.
- Existing `createAccount()` / `connectWallet()` APIs reused.

### Step 3 — Build your deck
- Reuse the existing `DeckBuilder` but in "onboarding mode":
  - Simpler header: "Pick your 8-card squad".
  - Locked cards hidden or visually de-emphasized (starters only).
  - Big "DEPLOY" button (save deck) enabled only at 8 cards.
  - On save, mark onboarding complete and proceed to first battle.

### Step 4 — First battle
- Launch a practice match (`mode: 'practice'`).
- Show lightweight tutorial hints on first deploy:
  - "Drag a card onto your side of the trench".
  - "Destroy both enemy towers before the timer ends".
  - "Elixir refills automatically — spend it wisely".
- After the battle, show a result screen with **"TO THE TRENCH"** button → Main Menu.

## Technical architecture

- New screen state in `App.tsx`: `'onboarding'`.
- `Landing` CTA `onPlay` now routes to `onboarding` (not `menu`).
- `Onboarding` component owns the step machine; it creates the guest/wallet account and saves the first deck.
- `Menu` is redesigned; it receives `account`/`setAccount`/`go` as today.
- Onboarding completion is stored in `localStorage` key `trench-royale-onboarding-complete`.
- On app boot: if onboarding complete AND account exists → `menu`; else → `landing`.

## Files to change

| File | Change |
| --- | --- |
| `src/ui/App.tsx` | add `'onboarding'` screen; boot logic checks completion flag |
| `src/landing/Landing.tsx` | pass `onBuildDeck` prop; CTA routes to onboarding |
| `src/landing/sections/Hero.tsx` | rename `onPlay` → `onBuildDeck` for clarity |
| `src/ui/Onboarding.tsx` | new multi-step onboarding component |
| `src/ui/Menu.tsx` | CR-style main menu redesign |
| `src/ui/theme.css` | new menu + onboarding styles |
| `e2e/landing.spec.ts` | click "BUILD YOUR DECK"; expect onboarding |
| `e2e/smoke.spec.ts` | click through onboarding or assert menu after skip |

## Out of scope

- Real lootbox/shop implementation (Loot tab is a teaser).
- Real ladder leaderboard (placeholder).
- Changes to sim, cards, or battle renderer.
- Changes to the landing Hero/diorama.
