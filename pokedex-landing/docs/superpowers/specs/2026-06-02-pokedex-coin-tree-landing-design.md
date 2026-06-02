# PokeDex — Coin Tree Landing — Design Spec

**Date:** 2026-06-02
**Status:** Approved (brainstorming) → ready for implementation plan
**Working name:** PokeDex (meme token), signature feature "Coin Tree"

## 1. Purpose

Ship a single-page, premium marketing landing for the **PokeDex** meme token — a parody/fan crypto project launching fair on pump.fun. It mirrors an existing reference site's information architecture (Hero + CA, Coin Tree, Tokenomics, Trust, How to Buy, Footer) but executes at a dramatically higher production quality using our in-house **react-bits-vault** component library.

**Success criteria:**
- Visitor instantly grasps: it's a fair-launch meme coin, 1B fixed supply, zero tax, locked LP, not launched yet (CA coming).
- The "Coin Tree" is the memorable hook — a living, glowing tree that grows on scroll and reveals rewards/tokenomics.
- Feels hand-crafted and premium ("epic & nicer"), not a generic AI template.
- Fully responsive; smooth on mobile; respects `prefers-reduced-motion`.
- Deployable to Vercel as a static SPA.

**Non-goals (v1):** No wallet connect, no live price/holder data, no backend, no multi-page routing. These are explicit phase-2 candidates.

## 2. Direction

- **Vibe:** Premium-organic / mystical. Deep forest green + warm gold + bioluminescent glow. Elevated and trustworthy, not childish.
- **Name/IP:** Keep the "PokeDex" parody name and Pokémon fan references, with the parody/not-affiliated disclaimer in the footer (as in the reference).
- **Core metaphor:** The "Coin Tree" — community rewards visualized as a growing tree with a Trainer branch and a Starter branch. The tree is the brand spine across hero, coin-tree section, and tokenomics.

## 3. Tech stack

- **Vite + React + TypeScript** — matches react-bits-vault so vault components import with zero porting.
- **Tailwind CSS** for layout/utility styling; CSS variables for the theme palette.
- **GSAP** (+ ScrollTrigger) and **Framer Motion** for scroll-driven and entrance animation (both already used by vault components).
- **react-bits-vault** components consumed via path alias (mirror the vault's `@/free/...` and `@/pro/react-bits/...` conventions).
- Static deploy target: **Vercel**.

**Project location:** `pokedex-landing/` (new standalone folder at repo root, alongside the prior `dickbutt-landing` pattern).

## 4. Information architecture (single scroll page)

Order top→bottom:

1. **Sticky Nav** — brand mark + anchors: Home, Coin Tree, Tokenomics, Buy, Follow on X. Glassy, glowing pill style. Collapses to a staggered drawer on mobile.
2. **Hero** — mystical animated background, kinetic "PokeDex" wordmark, one-line pitch, primary "Buy on pump.fun" + secondary "Follow on X" CTAs, and the **CA card**: "Not launched yet — contract address coming soon" with a Copy button (copies a placeholder/"coming soon" string and shows a "Copied" toast, matching reference behavior).
3. **Coin Tree** ⭐ — the signature section. A glowing SVG tree that grows/draws in as it scrolls into view; branches light up to reveal reward cards (Trainer branch, Starter branch). Ambient line/thread background.
4. **Tokenomics ("THE NUMBERS")** — giant animated **1,000,000,000** counter; allocation breakdown with animated bars + percentages:
   - Presale & Liquidity — 600,000,000 (60%)
   - Coin Tree Rewards — 150,000,000 (15%)
   - Marketing & Listings — 150,000,000 (15%)
   - Community Treasury — 100,000,000 (10%)
5. **Trust strip** — four cards: Fixed Supply (1B), Zero Tax, Locked Liquidity, Fair Launch.
6. **How to Buy** — numbered stepper guide (get a Solana wallet → fund SOL → open pump.fun at launch → swap → hold) with a prominent CTA.
7. **Footer** — brand, social icons (X / Twitter), anchor links, parody + risk disclaimer, "not launched yet" line.

## 5. Component mapping (react-bits-vault)

Components are the first-choice building blocks; each may be swapped during build if a better fit emerges, but the design assumes these.

| Section | Components |
|---|---|
| Nav | `Pill Nav` or `Gooey Nav`; `Staggered Menu` (mobile drawer) |
| Hero background | `Aurora` / `Silk` / `Prismatic Burst` (pick one in build; Aurora is the default) |
| Hero title | `Text Pressure` or `Shiny Text` for "PokeDex"; `Split Text` for the sub-pitch |
| Hero orb/mascot | `Orb` and/or `Magic Rings` as a floating poké-orb motif |
| Hero CTAs | `Star Border` buttons |
| Hero CA card | `Glass Surface` container + custom Copy button & toast |
| Coin Tree | Custom GSAP/SVG growing tree + `Scroll Reveal` / `Scroll Float`; `Magic Bento` for branch reward cards; `Threads` or `Floating Lines` background |
| Tokenomics counter | `Count Up` |
| Tokenomics bars/grid | `Gradient Bars` (pro) for allocation bars; `Spotlight Card` for allocation tiles |
| Trust strip | `Pixel Card` or `Tilted Card` with `Border Glow` |
| How to Buy | `Stepper` + `Star Border` CTA |
| Footer | `Glass Icons`, `Dock`, optional `Logo Loop` |
| Global polish | `Target Cursor` (custom cursor), `Click Spark`, `Noise`/`Grainient` overlay, `Gradual Blur` section edges |

## 6. Data / content model

All content is static, defined in a single typed config module (`src/content/site.ts`) so copy, tokenomics numbers, links, and the placeholder CA live in one place:

```ts
siteConfig = {
  token: { name, ticker, totalSupply, supplyDisplay },
  ca: { launched: false, address: null, placeholder: "Coming soon at launch" },
  links: { pumpfun, twitter },
  allocations: [{ label, amount, pct, branch? }],
  trust: [{ key, title, body }],
  buySteps: [{ title, body }],
  coinTree: { branches: [{ name, rewardCards: [...] }] },
}
```

This makes the eventual "launch" flip (set `launched: true` + real address) a one-line change.

## 7. Components / units (project code)

Each is a focused, independently understandable unit:

- `App.tsx` — composes sections in order; mounts global-polish wrappers (cursor, click spark, grain).
- `components/Nav.tsx` — sticky nav, anchor scroll, mobile drawer.
- `sections/Hero.tsx` — background + title + CTAs + `CaCard`.
- `components/CaCard.tsx` — CA pill with copy-to-clipboard + toast; reads `ca` from config.
- `sections/CoinTree.tsx` — scroll-grown tree + branch reward cards.
- `sections/Tokenomics.tsx` — counter + allocation bars (reads `allocations`).
- `sections/TrustStrip.tsx` — four trust cards (reads `trust`).
- `sections/HowToBuy.tsx` — stepper (reads `buySteps`).
- `components/Footer.tsx` — socials + disclaimer.
- `content/site.ts` — all copy/data.
- `lib/theme.css` / Tailwind config — palette + tokens.
- `lib/useReducedMotion.ts` — gate heavy animations.

Vault components are imported, not copied; project units wrap/configure them.

## 8. Motion & performance

- Scroll-triggered reveals via GSAP ScrollTrigger / Framer `whileInView`.
- Heavy WebGL/shader backgrounds (Aurora/Silk/Prismatic) limited to **one per viewport** and lazy-mounted; pause/disable when off-screen and under `prefers-reduced-motion`.
- Target: smooth 60fps hero on a mid laptop; mobile falls back to a lighter static gradient where a shader bg would be costly.
- Images/SVG optimized; fonts subset; no layout shift on counter mount.

## 9. Error handling & edge cases

- **Copy button without clipboard API** → fallback select-text + still show toast.
- **Reduced motion** → static/simplified visuals, no parallax, instant reveals.
- **Small viewports** → tree section reflows to vertical; bento/grid collapse to single column.
- **WebGL unavailable** → background degrades to CSS gradient (feature-detect).
- **Pre-launch CA** → Copy copies the placeholder string; UI clearly states "not launched yet".

## 10. Testing / verification

- Manual visual QA at 3 breakpoints (mobile ~390px, tablet ~768px, desktop ~1440px) via Playwright/Chrome MCP screenshots.
- Lint + typecheck + production build must pass (`vite build`).
- `prefers-reduced-motion` snapshot check (animations gated).
- Copy-button interaction check (toast shows, clipboard receives placeholder).
- Lighthouse pass on the built page (performance/accessibility sanity).

## 11. Phase 2 (out of scope, noted only)

Wallet connect, live price/marketcap/holder feed wired into the tree, real CA flip automation, dedicated routes (full Tokenomics / Roadmap / Coin Tree pages), and on-chain rewards visualization.
