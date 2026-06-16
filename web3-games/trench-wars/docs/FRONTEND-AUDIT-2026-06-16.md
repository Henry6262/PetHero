# Trench Royale — Frontend Audit (pre-launch) · 2026-06-16

All issues below are **frontend/UX**. Goal: a polished, launch-ready, fully **responsive** experience —
**desktop AND mobile both first-class** (mobile is as important or more, *especially the battle*).
Captured from live screenshots (`/tmp/game_menu_in.png`, `/tmp/game_battle.png`) + Henry's notes.

## 🔴 BIGGEST: desktop scaling — everything is tiny
- The whole game (menu **and** battle) renders as a narrow ~440px **mobile-width column centered in a sea of black** on a 1440px desktop. Enormous wasted horizontal space; everything reads tiny.
- The **battle** is a small centered portrait box with big black bars left/right — does not use desktop real estate.
- Buttons are **small, inconsistent sizes, not proportional** widths.
- **Text is too small** across the menu and the in-battle HUD.

## 🗺️ Battle uses the OLD map
- Gameplay (`src/render3d/Battle3D.ts`) renders the old flat, sparse hex arena.
- The landing hero (`src/landing/three/BattlePreview.tsx`) has the **new diorama-quality map** (lanes, river, bridges, castles, decoration, flora, mountains, villages).
- Gameplay must use the **new map look** (within the sim's lane/tower/deploy coordinate constraints).

## 🃏 In-game cards & HUD
- **Cards are super small** during play.
- **Elixir bar + card cost are barely visible** — white text on purple = poor contrast. Needs high-contrast, readable cost pips + elixir meter.
- HUD elements (timer, hand, next card, mute) are small / cramped.

## 📱 Mobile (as important as desktop — especially the game)
- Battle must be first-class on mobile: full-bleed arena, large readable cards, big touch targets, readable elixir/HUD, safe-area insets (notch/home bar).
- Menu must adapt cleanly to phone widths (it's currently mobile-column but unverified for real device sizes / touch sizing).

## 🎯 Definition of done (launch bar)
- Desktop: game fills the viewport sensibly (no skinny centered column / black bars); proportional, generous sizing.
- Mobile: full-bleed, thumb-friendly, readable; battle especially.
- Battle uses the new diorama map.
- Cards/elixir/cost high-contrast and appropriately sized on both breakpoints.
- Buttons consistent, proportional, properly sized; typography scaled up.

## Key files (for the fix plan)
- `src/ui/App.tsx` — screen state machine (menu/onboarding/deck/battle).
- `src/ui/Menu.tsx` + `src/ui/styles/cr-menu.css` — menu layout (the skinny column).
- `src/ui/Battle.tsx` + `src/ui/styles/battle.css` — battle HUD, hand, elixir.
- `src/ui/TrenchCard.tsx` + `src/ui/styles/cards.css` — card component sizing/contrast.
- `src/game/BattleController.ts` + `src/render3d/Battle3D.ts` — battle renderer + the arena/map (old).
- `src/landing/three/BattlePreview.tsx` — the NEW map to port into gameplay.
- `src/ui/styles/base.css`, `index.css` — global/responsive tokens.
