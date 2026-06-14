# Trench Royale — CR-Level UI Polish (design)

**Date:** 2026-06-14
**Status:** Approved (brainstorm) → ready for plan
**Repo:** `web3-games/trench-wars`
**Scope track:** Phase E (UI polish) + emoji→icon swap from `2026-06-14-trench-royale-cr-level-audit.md`

## Problem

The UX flow is good but the static visuals read "mid." Root cause: there is **no card system** and **no icon system**. Every screen hand-rolls flat tiles (a portrait PNG + a cost circle + a name) and borrows **emojis** as iconography. The pack-opening and level-up "moments" — the dopamine core of a Clash-Royale-style game — are a `🎁` emoji with a shake and a plain reveal grid.

Fix the primitives once and every screen levels up together.

## Goals

1. Kill every emoji in `src/ui/` and replace with a real game-icon set.
2. A single shared, premium **card component** used everywhere, with size variants — cards become bigger and consistent in onboarding, deck builder, hand, lootbox, level-up.
3. A real **pack-opening** sequence (chest → burst → sequential rarity-rayed card flips).
4. A real **level-up** celebration (card punch, ring burst, animated stat bars).
5. Menu / shell icon + state polish.
6. Premium "hero card" shimmer via **React Bits Pro ChromaCard** for focused single-card moments.

## Non-goals (explicit)

- 3D character generation (Phase A / Meshy) — separate track.
- Audio files / SFX wiring.
- Backend, progression economy, leagues/chests-as-currency.
- Landing page restyle (`src/landing/` emojis stay).

## Golden-rule guardrails

- **`src/sim/` stays byte-identical.** Rarity is cosmetic and lives in a UI-only table — NOT in `cards.json` — so replay fingerprints / anti-cheat are untouched (golden rules 1, 4, 5).
- No React/Three imports added to `src/sim/`.
- All visual changes verified with `npm run build`, `npm test` (sim green = proof sim untouched), and Playwright smoke screenshots.

---

## Architecture — shared primitives

### 1. Icon system — `src/ui/Icon.tsx` + `src/ui/icons/index.ts`

- One component: `<Icon name="tank" size={24} />`. Inline-SVG registry keyed by name.
- Source: curated subset of **game-icons.net** (CC-BY 3.0). Add `src/ui/icons/CREDITS.md` listing each icon, author, and the CC-BY link.
- Icons render with `fill="currentColor"` (+ optional `gradient` prop) so they restyle per context.
- **Registry coverage** (drives a unit test — every used name must exist):
  - **Roles (9):** tank=shield, brawler=fist, mage=crystal-orb, assassin=dagger, support=winged-heart, swarm=three-figures, ranged=bow, building=tower, spell=scroll-sparkle.
  - **Spell sub-types (4):** damage=fireball, heal=health-cross, buff=up-wings, slow=snowflake.
  - **UI/nav:** battle=crossed-swords, practice=target, deck=card-stack, loot=chest, ladder=trophy, wallet, guest=person, lock, check, crown, **elixir=droplet**, plus, back.
- **Replaces every emoji found in `src/ui/`:** `Menu.tsx` (⚔ 🎯 🎴 🎁 🏆), `Onboarding.tsx` (👤 👛 🎁 ✦), `CardTile.tsx` (✦ ◳), `DeckBuilder.tsx` (🔒 ✓), `Battle.tsx` (♛ ✦).

### 2. Rarity model — `src/ui/rarity.ts`

- UI-only lookup: `RARITY: Record<cardId, 'common'|'rare'|'epic'|'legendary'>`.
- Helpers: `rarityOf(id)`, `rarityColor(rarity)`, `rarityRays(rarity)`.
- Palette (CSS vars added to `theme.css`):
  - common = steel-blue `#6f86b8`
  - rare = bronze/orange `#e8932e`
  - epic = purple `#b14dff`
  - legendary = gold `#f5c842` (animated rainbow sheen)
- **Assignments (all 30):**

| Rarity | Cards |
| --- | --- |
| legendary | degen-titan, whale, gigachad, mev-overlord |
| epic | diamond-hands, rug-dev, shadow-dev, sniper-bot, fomo-jet, exit-liquidity, influencer, sailor-cat, airdrop, liquidation-cascade |
| rare | mev-bots, fud-spirit, chad-trader, discord-raid, trading-bot, moon-boy, based-brawlers, fomo-mob, copium, liquidity-freeze |
| common | bag-holder, scalper, jeet-horde, paper-hands, pump-signal, gas-war |

- A unit test asserts **every card id in `CARDS` has a rarity** (guards against new cards being missed).

### 3. Shared card — `src/ui/TrenchCard.tsx` (supersedes flat `CardTile`)

A real Clash-Royale card frame, pure CSS (cheap, many instances):

- **Rarity border + inner bevel**, role **ribbon** across the top with the role `Icon`, **elixir gem** (cost) top-left, **framed portrait** (or spell/building icon for non-character cards), **nameplate** at the bottom, optional **level pip**.
- Props: `cardId`, `size: 'sm'|'md'|'lg'|'xl'`, `state?: 'selected'|'in-deck'|'locked'|'dimmed'|'leveled'`, `onClick`, `onPointerDown`, `level?`.
- Size scale (portrait heights): `sm` ~72px (hand/deck grid), `md` ~110px (onboarding pick), `lg` ~180px (pack reveal / preview), `xl` ~240px (focused inspect).
- **Consumers refactored to use it:** `DeckBuilder` grid, `Battle` hand, `Onboarding` (deck pick + level-up + lootbox reward), `Menu` deck preview.
- `CardTile.tsx` becomes a thin `<TrenchCard size="sm" />` wrapper so existing imports/`data-card` testids keep working.

### 4. ChromaCard (React Bits Pro) — `src/ui/reactbits/ChromaCard.tsx`

- Vendored from the vault (`react-bits-vault/src/pro/react-bits/chroma-card.tsx`), adapted: drop `cn`/`@/lib/utils`, inline class strings (match `src/landing/reactbits/StarBorder.tsx` convention). Deps already present (`@react-three/fiber`, `gsap`, `three`).
- **Used only for single focused hero cards** (one R3F `<Canvas>` per instance = too heavy for grids):
  - Pack-reveal focus card
  - Card preview / inspect
  - Level-up hero card
- Pattern: ChromaCard renders the **card portrait** as `imageSrc` (chroma shimmer + hover/tilt); the `TrenchCard` frame chrome renders as the DOM `children` overlay on top. So the shimmer plays under a real card frame.
- License key stays in gitignored `.env.local` if registry CLI is used; vendored source carries no key.

### 5. Pack opening — `src/ui/PackOpen.tsx` (replaces `🎁` + reveal grid)

Reusable component (future LOOT shop tab uses the same one). Sequence:

1. **Idle** — layered chest (SVG/CSS: body + lid + lock + glow + floating particles), "TAP TO OPEN".
2. **Charge** — tap → chest shakes, light leaks intensify, elixir-purple/gold glow ramps.
3. **Burst** — lid blows, white flash + rarity-colored **light rays** fan out.
4. **Sequential reveal** — cards flip in **one at a time** (3D back→front flip from a branded **card back**), each with rarity-scaled glow; **legendary/epic = screen flash + bigger ray burst**; the focus card uses **ChromaCard**. Tap advances to the next.
5. **Summary** — all revealed cards laid out, "TAP TO CONTINUE".

Props: `cardIds: string[]`, `onDone()`. Card back: branded (logo chevron + faction tint).

### 6. Level-up — rework `OnboardingLevelUp`

- Hero **ChromaCard** of the chosen card.
- Tap to level → **card punch (scale pop)** + **gold ring burst** + **level pip 1→2 flip** + **animated HP/DMG bars** fill from old→new + **floating `+X` numbers**.
- Replaces the current `+10% HP · +10% DMG` text line.

### 7. Menu / shell polish — `Menu.tsx`

- Swap all nav + button emojis for `Icon`s; add pressed/active states.
- Deck-preview thumbnails become `TrenchCard size="sm"`.
- **Stretch (cut if needed):** light cross-fade between screen transitions in `App.tsx`.

---

## Data flow

```
cards.ts (sim, unchanged) ──┐
                            ├─> TrenchCard ──> DeckBuilder / Battle hand / Menu preview / Onboarding
rarity.ts (UI) ─────────────┤
icons/index.ts ──> Icon ────┘
                            └─> PackOpen ──(focus card)──> ChromaCard + TrenchCard overlay
                            └─> LevelUp ───(hero card)────> ChromaCard + animated stat bars
```

No new data crosses the sim boundary. Rarity + icons are presentation-only lookups keyed by the existing card ids.

## Testing & verification

- `npm test` — existing sim/game suite stays green (proof sim untouched).
- `npm run build` — typecheck + production build.
- **New unit tests** (`tests/ui/`):
  - every `CARDS` id has a rarity in `rarity.ts`.
  - every role/sub-type/UI `Icon` name referenced in components exists in the registry.
  - regex guard: no emoji codepoints remain in `src/ui/*.tsx`.
- **Playwright** (`scripts/` / `e2e/`): extend smoke to walk onboarding lootbox → deck → level-up and screenshot each new moment; existing `npm run smoke-3d` battle smoke still passes.
- Manual: `npm run dev`, verify pack-open + level-up + menu via the run skill / screenshots.

## Build order (for the plan)

1. Icon system + registry + CREDITS (unblocks every screen).
2. `rarity.ts` + palette vars + rarity test.
3. `TrenchCard` + refactor `CardTile`/DeckBuilder/Battle hand/Menu preview.
4. Vendor + adapt `ChromaCard`.
5. `PackOpen` (chest, card back, sequential flip, rays) + wire into Onboarding lootbox.
6. Level-up celebration rework.
7. Menu/shell emoji swap + states (+ stretch cross-fade).
8. Tests + Playwright smoke + visual verification pass.

## Open follow-ups (not this session)

- Per-card 3D models (Phase A) so portraits stop reusing 8 rigs.
- SFX cues (pack rip, flip, level-up chime) into `AudioBus`.
- Real LOOT shop economy reusing `PackOpen`.
