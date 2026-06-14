# Trench Royale — Landing v2 Design

**Date:** 2026-06-14
**Status:** Approved (brainstorm complete)
**Repo:** `web3-games/trench-wars`

## Summary

Rename the game **Trench Wars → Trench Royale** everywhere, and build a premium,
full-scroll marketing landing page (v2) that becomes the new front door to the
existing game. The landing matches the quality bar of Henry's other A-tier sites
(Maison Carmin, Ensemble, Streetball): Vite + React 19 + Tailwind v4 + Lenis +
GSAP + React Three Fiber + vendored React Bits.

The landing's **PLAY** button drops the user into the existing, untouched game
flow (Menu → guest/wallet → deck builder → 3D battle).

## Decisions (from brainstorm)

| Decision | Choice |
| --- | --- |
| Scope | Full scroll marketing landing (hero + sections), not just a hero |
| 3D hero item | Floating hex **battlefield diorama** (KayKit terrain + towers + units) |
| Hero background | **DarkVeil** (neural-noir procedural distortion) |
| Tech stack | Match premium stack: Tailwind v4 + Lenis + GSAP + R3F + React Bits |
| Palette | **Military gold + obsidian** |
| Token section | Real **token-economy** section (lootbox spend → burn) — centerpiece |
| PLAY button | Drops into the existing game flow |

## Brand & Palette

Rename **"Trench Wars" → "Trench Royale"** across all references (see Rename
Checklist below).

Design tokens (CSS custom properties + Tailwind v4 `@theme`):

```
--obsidian   #07090d   /* page base */
--panel      #0f1219   /* raised panel */
--gold       #d4a13c   /* primary accent */
--gold-dark  #9c7528   /* accent shadow */
--ember      #ff6a2b   /* highlight / danger */
--trader     #2bff88   /* Traders faction (player) */
--jeet       #ff4d5e   /* Jeets faction (opponent) */
--platinum   #ece8e5   /* primary text */
--muted      #9aa3b2   /* secondary text */
```

Typography (already in repo — no new font deps):
- **Orbitron** (700/900) — display / headings
- **Rajdhani** (500/700) — body / UI

## Tech & Integration Architecture

### New dependencies (added to trench-wars `package.json`)
- `tailwindcss` v4 + `@tailwindcss/vite`
- `lenis` (smooth scroll)
- `gsap` (scroll reveals)
- `@react-three/fiber`, `@react-three/drei` (R3F — Three.js already present)
- React Bits components are **vendored** (copied into `src/landing/reactbits/`),
  not installed as a package — same pattern as the other sites.

### Style isolation (critical)
The existing game UI uses plain `src/ui/theme.css`. Tailwind v4's preflight is
global and would risk regressing in-game element defaults. Mitigation:
- Add Tailwind with **preflight disabled** (or scoped under a `.landing` root
  container), so Tailwind utilities are available to the landing without
  resetting the game's existing styles.
- Landing-specific CSS variables/tokens live in a landing stylesheet, separate
  from `theme.css`.

### App flow
`src/ui/App.tsx` currently is a screen state machine: `menu | deck | battle`.
- Add a new **initial** screen state: `landing`.
- On mount, render `<Landing onPlay={() => setScreen('menu')} />`.
- **PLAY** (and "Enter the Trench" final CTA) call `onPlay` → existing `menu`
  flow. The game screens (`Menu.tsx`, `DeckBuilder.tsx`, `Battle.tsx`) are
  **not modified** beyond the rename.

### File layout
```
src/landing/
  Landing.tsx              # composition: nav + sections, Lenis provider
  sections/
    Nav.tsx
    Hero.tsx               # DarkVeil bg + text left + 3D diorama right
    Roster.tsx             # 7 character cards
    HowItWorks.tsx
    Mechanics.tsx
    TokenEconomy.tsx       # $ROYALE lootbox→burn centerpiece
    FinalCta.tsx
    Footer.tsx
    Divider.tsx            # numbered roman-numeral section divider
  three/
    BattlefieldDiorama.tsx # R3F floating hex battlefield
  reactbits/               # vendored React Bits components
    DarkVeil/ ...
    SplitText/ GlitchText/ ShinyText/ CountUp/ StarBorder/
    TiltedCard/ SpotlightCard/ MagicBento/ AnimatedContent/
  landing.css              # landing-scoped tokens + base
```

## Section-by-Section Spec

### 1. Sticky Nav
- Left: `TRENCH ROYALE` wordmark (Orbitron, gold).
- Center/right links: Roster · How It Works · Mechanics · Economy.
- Right: gold **PLAY** button (`StarBorder`).
- Transparent over hero, gains obsidian/blur background on scroll.

### 2. Hero (two-column)
- **Background:** `DarkVeil` (React Bits, OGL-based), tuned dark with gold edge
  glow. Lazy-loaded behind a `Suspense` boundary; radial vignette overlay.
- **Left column:**
  - `GlitchText` or `SplitText` headline **TRENCH ROYALE**.
  - Tagline "Traders vs Jeets" (uppercase, tracked).
  - One-line pitch (e.g. "Real-time lane warfare on Solana. Stack your deck,
    storm the trench, burn $ROYALE.").
  - CTAs: **PLAY NOW** (`StarBorder` gold, → `onPlay`) + **Connect Wallet**
    (ghost). Connect reuses existing wallet flow if trivially wired; otherwise
    routes into the menu where connect already lives.
  - `CountUp` stat strip: 7 commanders · N cards · real-time battles.
- **Right column:** `BattlefieldDiorama` (R3F):
  - KayKit hex grass/water tiles forming a small island, 2 towers
    (`building_tower_A_blue/red`), a castle, 2–3 unit GLBs (e.g. one Trader,
    one Jeet) posed.
  - Slow Y-axis rotation + `Float` bob; gold key spotlight; subtle ember
    particle drift.
  - Lazy-loaded; collapses below the text column on mobile.

### 3. Divider I — "The Roster"

### 4. Roster
- All **7 characters** using existing portrait PNGs
  (`/assets/3d/portraits/{explorer,vanguard,crimson,phoenix,degen,pepe,bluemob}.png`).
- Each in a `TiltedCard` / `SpotlightCard`: portrait, name, **faction tag**
  (Trader / Jeet), one-line flavor.
- GSAP staggered reveal on scroll.

### 5. Divider II — "How It Works"

### 6. How It Works
- 4 steps with icon + copy:
  1. **Build your deck** — pick commanders & cards.
  2. **Deploy down the lanes** — spend elixir, send units.
  3. **Destroy their towers** — break the trench line.
  4. **Climb the ladder** — win-gated unlocks & ELO.

### 7. Divider III — "Mechanics"

### 8. Mechanics / Cards
- `MagicBento`-style grid highlighting: elixir economy, lanes, the existing 6
  mechanics, spell VFX & damage numbers, card progression/unlocks.
- A few real card tiles rendered from `cards.json`.

### 9. Divider IV — "Token Economy"

### 10. Token Economy ($ROYALE) — centerpiece
- Explains the core loop: **$ROYALE is the in-game currency.**
- Players spend $ROYALE on **lootboxes / card packs**.
- Animated **flow diagram**: `spend → routed to burn/treasury contract →
  permanently burned (deflationary) + reward pool + treasury`.
- **Split:** **50% burned · 30% reward pool · 20% treasury.**
- Live `CountUp` **burn counter** (placeholder figure, easy to wire to real
  data later) emphasizing shrinking supply / deflationary design.
- **Fair launch on pump.fun** teaser + CTA (real contract address dropped in
  later).
- Ticker: **$ROYALE**.

### 11. Divider V — "Enlist"

### 12. Final CTA + Footer
- Big "Enter the Trench" → **PLAY** (`onPlay`).
- Footer: wordmark, minimal links, year.

## Motion & Accessibility
- **Lenis** smooth scroll wraps the landing.
- **GSAP** scroll-reveal (fade/translate) per section; numbered roman-numeral
  dividers for rhythm (matches other sites).
- All heavy WebGL (DarkVeil, diorama) lazy-loaded via `lazy()` + `Suspense`.
- `prefers-reduced-motion`: disable shaders/auto-motion, show static fallbacks.
- Fully responsive: hero collapses to single column (text over 3D) on mobile;
  diorama scales down / can be a static render fallback on low-power devices.

## Rename Checklist (Trench Wars → Trench Royale)

| File | What |
| --- | --- |
| `index.html` | `<title>`, meta description |
| `package.json` | `name` → `trench-royale` |
| `server/package.json` | `name` → `trench-royale-server` |
| `src/render/Brand.ts` | comment + `name: 'TRENCH ROYALE'` |
| `src/ui/Menu.tsx` | h1 text |
| `src/game/ladder.ts` | localStorage keys (`trench-royale-*`) — migrate/rename |
| `e2e/smoke.spec.ts` | h1 assertion |
| `server/src/index.ts` | console log |
| `README.md`, `CLAUDE.md` | headings + intro |
| `scripts/prod-check.ts` | prod URL string (note: actual Vercel/Railway project rename is ops, out of scope here) |

> localStorage key rename will reset existing local ladder progress unless a
> migration reads the old key once. Acceptable for a pre-launch game; note in
> the plan.

## Out of Scope
- Renaming the live Vercel/Railway projects/URLs (ops task, separate).
- Real pump.fun contract / on-chain burn wiring (teaser only).
- Changes to game simulation, cards balance, or 3D battle renderer beyond the
  rename.

## Open / Assumed (confirmed by user)
- Ticker = **$ROYALE**.
- Burn split = **50 / 30 / 20**.
