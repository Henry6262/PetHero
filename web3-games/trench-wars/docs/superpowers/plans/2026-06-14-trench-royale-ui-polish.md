# Trench Royale — CR-Level UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace flat tiles + emojis with a real Clash-Royale-grade card/icon system, plus premium pack-opening and level-up moments — without touching the deterministic sim.

**Architecture:** Build three shared, isolated primitives first (`Icon`, `rarity`, `TrenchCard`), then compose the "moment" screens (`PackOpen`, level-up) on top. A vendored React Bits Pro `ChromaCard` provides shader shimmer for single focused hero cards only (one R3F `<Canvas>` per instance = too heavy for grids). Rarity is a UI-only lookup keyed by existing card ids, so `src/sim/` stays byte-identical and anti-cheat/replay fingerprints are unaffected.

**Tech Stack:** React 19 + Vite, plain CSS (`src/ui/theme.css`, no Tailwind utilities in `src/ui`), Three.js + @react-three/fiber + gsap (already installed), Vitest (`tests/**/*.test.ts` only), Playwright.

**Spec:** `docs/specs/2026-06-14-trench-royale-ui-polish-design.md`

**Verification baseline (run before starting, must already pass):**
- `npm test` — sim/game suite green
- `npm run build` — typecheck + build clean
- `grep -riE "react|three" src/sim/` — empty

---

## File map

| File | Responsibility | Action |
| --- | --- | --- |
| `scripts/fetch-icons.mjs` | One-off: pull game-icons.net SVGs → `src/ui/icons/data.ts` | Create |
| `src/ui/icons/data.ts` | `ICON_PATHS: Record<string,string>` (raw SVG inner markup) + `CREDITS.md` | Create (generated) |
| `src/ui/icons/CREDITS.md` | CC-BY 3.0 attribution per icon | Create |
| `src/ui/Icon.tsx` | `<Icon name size className gradient />` renderer | Create |
| `src/ui/rarity.ts` | `RARITY` map + `rarityOf`/`rarityColor` helpers | Create |
| `src/ui/theme.css` | rarity palette vars + new component styles | Modify |
| `src/ui/TrenchCard.tsx` | shared CR card frame, size + state variants | Create |
| `src/ui/CardTile.tsx` | thin `<TrenchCard size="sm">` wrapper (keep testids) | Modify |
| `src/ui/reactbits/ChromaCard.tsx` | vendored shader card (no `cn`/`@/lib/utils`) | Create |
| `src/ui/PackOpen.tsx` | chest → burst → sequential rarity-rayed flip reveal | Create |
| `src/ui/Onboarding.tsx` | use PackOpen + TrenchCard + level-up rework | Modify |
| `src/ui/Menu.tsx` | emoji → Icon, TrenchCard deck preview | Modify |
| `src/ui/DeckBuilder.tsx` | emoji → Icon (lock/check) | Modify |
| `src/ui/Battle.tsx` | crown/next-hint emoji → Icon | Modify |
| `tests/ui/rarity.test.ts` | every card id has a rarity | Create |
| `tests/ui/icons.test.ts` | every used icon name exists; no emoji in src/ui | Create |
| `scripts/screenshot-onboarding.ts` | Playwright smoke for lootbox→deck→levelup | Create |

**Note on TDD scope:** logic (rarity, icon registry, emoji guard) is unit-tested first (Tasks 1–2, 4). Visual components (TrenchCard, ChromaCard, PackOpen, level-up, menu) are verified by `npm run build` (typecheck) + Playwright screenshots + manual review — there is no meaningful unit assertion for "does it look like Clash Royale," so do not fabricate one.

---

## Task 1: Rarity model (TDD)

**Files:**
- Create: `src/ui/rarity.ts`
- Test: `tests/ui/rarity.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ui/rarity.test.ts
import { describe, it, expect } from 'vitest'
import { CARDS } from '../../src/sim/cards'
import { RARITY, rarityOf, rarityColor } from '../../src/ui/rarity'

describe('rarity', () => {
  it('assigns a rarity to every card', () => {
    const missing = CARDS.filter((c) => !RARITY[c.id])
    expect(missing.map((c) => c.id)).toEqual([])
  })

  it('rarityOf falls back to common for unknown ids', () => {
    expect(rarityOf('does-not-exist')).toBe('common')
    expect(rarityOf('whale')).toBe('legendary')
  })

  it('rarityColor returns a hex for every tier', () => {
    for (const t of ['common', 'rare', 'epic', 'legendary'] as const) {
      expect(rarityColor(t)).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/rarity.test.ts`
Expected: FAIL — cannot find module `../../src/ui/rarity`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/ui/rarity.ts
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export const RARITY: Record<string, Rarity> = {
  // legendary
  'degen-titan': 'legendary', whale: 'legendary', gigachad: 'legendary', 'mev-overlord': 'legendary',
  // epic
  'diamond-hands': 'epic', 'rug-dev': 'epic', 'shadow-dev': 'epic', 'sniper-bot': 'epic',
  'fomo-jet': 'epic', 'exit-liquidity': 'epic', influencer: 'epic', 'sailor-cat': 'epic',
  airdrop: 'epic', 'liquidation-cascade': 'epic',
  // rare
  'mev-bots': 'rare', 'fud-spirit': 'rare', 'chad-trader': 'rare', 'discord-raid': 'rare',
  'trading-bot': 'rare', 'moon-boy': 'rare', 'based-brawlers': 'rare', 'fomo-mob': 'rare',
  copium: 'rare', 'liquidity-freeze': 'rare',
  // common
  'bag-holder': 'common', scalper: 'common', 'jeet-horde': 'common', 'paper-hands': 'common',
  'pump-signal': 'common', 'gas-war': 'common',
}

const COLORS: Record<Rarity, string> = {
  common: '#6f86b8',
  rare: '#e8932e',
  epic: '#b14dff',
  legendary: '#f5c842',
}

export function rarityOf(id: string): Rarity {
  return RARITY[id] ?? 'common'
}

export function rarityColor(r: Rarity): string {
  return COLORS[r]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/rarity.test.ts`
Expected: PASS (3 tests). If "assigns a rarity" fails, a card id was renamed in the sim — add it to `RARITY`.

- [ ] **Step 5: Commit**

```bash
git add src/ui/rarity.ts tests/ui/rarity.test.ts
git commit -m "feat(trench-royale): UI-only card rarity model"
```

---

## Task 2: Icon registry data (fetch + generate)

**Files:**
- Create: `scripts/fetch-icons.mjs`
- Create (generated): `src/ui/icons/data.ts`, `src/ui/icons/CREDITS.md`

game-icons.net SVGs are CC-BY 3.0 and live in the `game-icons/icons` GitHub repo as `master/<author>/<slug>.svg`, each a single `<path>` on a `0 0 512 512` viewBox. We fetch the chosen subset and extract the `d` attribute.

- [ ] **Step 1: Write the fetch script**

```js
// scripts/fetch-icons.mjs
// Run: node scripts/fetch-icons.mjs
// Pulls the curated game-icons.net subset and writes src/ui/icons/data.ts + CREDITS.md
import { writeFileSync, mkdirSync } from 'node:fs'

// name -> [author, slug]  (game-icons.net CC-BY 3.0)
const ICONS = {
  // roles
  tank: ['sbed', 'round-shield'],
  brawler: ['skoll', 'fist'],
  mage: ['lorc', 'crystal-ball'],
  assassin: ['lorc', 'plain-dagger'],
  support: ['lorc', 'winged-emblem'],
  swarm: ['delapouite', 'backup'],
  ranged: ['lorc', 'high-shot'],
  building: ['delapouite', 'tower-flag'],
  spell: ['lorc', 'scroll-unfurled'],
  // spell sub-types
  'spell-damage': ['lorc', 'fireball'],
  'spell-heal': ['delapouite', 'health-normal'],
  'spell-buff': ['lorc', 'wingfoot'],
  'spell-slow': ['lorc', 'snowflake-2'],
  // ui / nav
  battle: ['delapouite', 'crossed-swords'],
  practice: ['delapouite', 'target-arrows'],
  deck: ['delapouite', 'card-pick'],
  loot: ['delapouite', 'open-treasure-chest'],
  ladder: ['lorc', 'trophy'],
  wallet: ['delapouite', 'wallet'],
  guest: ['delapouite', 'person'],
  lock: ['lorc', 'padlock'],
  check: ['delapouite', 'check-mark'],
  crown: ['lorc', 'crown'],
  elixir: ['lorc', 'water-drop'],
  plus: ['delapouite', 'plus'],
  back: ['delapouite', 'previous-button'],
}

const RAW = (author, slug) =>
  `https://raw.githubusercontent.com/game-icons/icons/master/${author}/${slug}.svg`

const paths = {}
const credits = []
for (const [name, [author, slug]] of Object.entries(ICONS)) {
  const url = RAW(author, slug)
  const res = await fetch(url)
  if (!res.ok) { console.error(`MISS ${name}: ${url} -> ${res.status}`); continue }
  const svg = await res.text()
  const m = svg.match(/<path[^>]*\sd="([^"]+)"/i)
  if (!m) { console.error(`NO PATH ${name}: ${url}`); continue }
  paths[name] = m[1]
  credits.push(`- **${name}** — "${slug}" by ${author} — https://game-icons.net/1x1/${author}/${slug}.html`)
  console.log(`OK ${name}`)
}

mkdirSync('src/ui/icons', { recursive: true })
const ts =
  `// AUTO-GENERATED by scripts/fetch-icons.mjs — do not edit by hand.\n` +
  `// game-icons.net, CC-BY 3.0. See CREDITS.md.\n` +
  `export const ICON_PATHS: Record<string, string> = ${JSON.stringify(paths, null, 2)}\n`
writeFileSync('src/ui/icons/data.ts', ts)
writeFileSync(
  'src/ui/icons/CREDITS.md',
  `# Icon credits\n\nAll icons from game-icons.net, licensed CC-BY 3.0 (https://creativecommons.org/licenses/by/3.0/).\n\n${credits.join('\n')}\n`,
)
console.log(`\nWrote ${Object.keys(paths).length}/${Object.keys(ICONS).length} icons.`)
```

- [ ] **Step 2: Run the script**

Run: `node scripts/fetch-icons.mjs`
Expected: `OK <name>` for each; final line `Wrote N/26 icons.` If any line prints `MISS` or `NO PATH`, that author/slug is wrong — search the icon on https://game-icons.net (top-right search), open it, the URL is `/1x1/<author>/<slug>.html`; update the `ICONS` map and re-run. Do not proceed until all 26 print `OK`.

- [ ] **Step 3: Verify the generated file**

Run: `node -e "const {ICON_PATHS}=require('./src/ui/icons/data.ts'.replace('.ts',''))" 2>/dev/null; grep -c '": "' src/ui/icons/data.ts`
Expected: `26`. Also confirm `src/ui/icons/CREDITS.md` exists with 26 attribution lines.

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-icons.mjs src/ui/icons/data.ts src/ui/icons/CREDITS.md
git commit -m "feat(trench-royale): fetch game-icons.net icon set (CC-BY 3.0)"
```

---

## Task 3: Icon component

**Files:**
- Create: `src/ui/Icon.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/ui/Icon.tsx
import { ICON_PATHS } from './icons/data'

export type IconName = keyof typeof ICON_PATHS

interface Props {
  name: string
  size?: number
  className?: string
  color?: string
  title?: string
}

export function Icon({ name, size = 24, className = '', color = 'currentColor', title }: Props) {
  const d = ICON_PATHS[name]
  if (!d) {
    if (import.meta.env.DEV) console.warn(`<Icon> unknown name: ${name}`)
    return null
  }
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill={color}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: build succeeds (no type errors). The component is unused so far — that's fine.

- [ ] **Step 3: Commit**

```bash
git add src/ui/Icon.tsx
git commit -m "feat(trench-royale): <Icon> inline-SVG renderer"
```

---

## Task 4: Emoji-guard + icon-name tests (TDD — will fail until later tasks land)

**Files:**
- Create: `tests/ui/icons.test.ts`

This test enforces "no emojis in `src/ui`" and "every icon name used resolves." It will FAIL now (emojis still present) and turn green as Tasks 7–11 strip them. Mark it `it.skip` for the emoji assertion until Task 11, OR keep it failing as the completion signal. We keep it active and treat green-at-the-end as the acceptance gate.

- [ ] **Step 1: Write the test**

```ts
// tests/ui/icons.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ICON_PATHS } from '../../src/ui/icons/data'

const UI_DIR = join(__dirname, '../../src/ui')

function uiFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.tsx')) out.push(p)
    }
  }
  walk(UI_DIR)
  return out
}

// Emoji codepoint ranges (pictographs, symbols, dingbats, arrows used as glyphs)
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{2190}-\u{21FF}\u{FE0F}]/u

describe('icons', () => {
  it('registry has the 26 curated names', () => {
    expect(Object.keys(ICON_PATHS).length).toBeGreaterThanOrEqual(26)
    for (const n of ['tank', 'battle', 'elixir', 'loot', 'crown']) {
      expect(ICON_PATHS[n]).toBeTruthy()
    }
  })

  it('no emoji glyphs remain in src/ui/*.tsx', () => {
    const offenders: string[] = []
    for (const f of uiFiles()) {
      const txt = readFileSync(f, 'utf8')
      if (EMOJI.test(txt)) offenders.push(f.replace(UI_DIR, 'src/ui'))
    }
    expect(offenders).toEqual([])
  })
})
```

- [ ] **Step 2: Run — expect partial failure**

Run: `npx vitest run tests/ui/icons.test.ts`
Expected: "registry has the 26 curated names" PASSES; "no emoji glyphs remain" FAILS, listing `Menu.tsx`, `Onboarding.tsx`, `CardTile.tsx`, `DeckBuilder.tsx`, `Battle.tsx`. This is the acceptance gate — it goes green at Task 11.

- [ ] **Step 3: Commit (red test is intentional)**

```bash
git add tests/ui/icons.test.ts
git commit -m "test(trench-royale): emoji-guard + icon registry test (red until UI swap done)"
```

---

## Task 5: Rarity palette + card CSS tokens

**Files:**
- Modify: `src/ui/theme.css` (append a new section)

- [ ] **Step 1: Append rarity + card variables to `:root` and a styles block**

Add after the existing `:root { ... }` close (line ~18) a second rule, and append the styles block at end of file:

```css
/* ---------- rarity palette ---------- */
:root {
  --r-common: #6f86b8;
  --r-rare: #e8932e;
  --r-epic: #b14dff;
  --r-legendary: #f5c842;
  --r-common-glow: rgba(111, 134, 184, 0.45);
  --r-rare-glow: rgba(232, 147, 46, 0.5);
  --r-epic-glow: rgba(177, 77, 255, 0.55);
  --r-legendary-glow: rgba(245, 200, 66, 0.6);
}

/* ---------- TrenchCard ---------- */
.tcard {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 14px;
  background: linear-gradient(180deg, var(--panel-light), var(--panel));
  border: 2.5px solid var(--rarity, var(--border));
  box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 6px 16px rgba(0,0,0,0.35),
    0 0 18px var(--rarity-glow, transparent);
  overflow: hidden;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  color: var(--text);
  cursor: pointer;
}
.tcard:hover { transform: translateY(-3px); }
.tcard.is-selected, .tcard.is-in-deck { box-shadow: 0 0 0 2px var(--primary), 0 0 22px rgba(245,230,0,0.4); }
.tcard.is-locked { filter: grayscale(1) brightness(0.45); cursor: not-allowed; }
.tcard.is-dimmed { opacity: 0.45; filter: grayscale(0.6); }

.tcard-ribbon {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 4px 6px;
  background: var(--rarity, var(--border));
  color: #0a0e14;
  font-family: var(--font-header); font-weight: 800;
  letter-spacing: 1px; text-transform: uppercase;
}
.tcard-ribbon .icon { fill: #0a0e14; }

.tcard-art {
  position: relative;
  width: 100%;
  display: grid; place-items: center;
  background: radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.06), transparent 70%);
}
.tcard-art img { width: 80%; height: 80%; object-fit: contain; }
.tcard-art .spell-icon { fill: var(--rarity, var(--elixir)); }

.tcard-gem {
  position: absolute; top: 6px; left: 6px; z-index: 2;
  width: 26px; height: 26px; display: grid; place-items: center;
  font-family: var(--font-header); font-weight: 900; color: #fff; font-size: 13px;
  background: radial-gradient(circle at 35% 30%, var(--elixir), var(--elixir-dark));
  border: 1.5px solid var(--elixir-dark); border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.6);
}
.tcard-name {
  width: 100%; text-align: center; padding: 4px 4px 6px;
  font-family: var(--font-header); font-weight: 700; line-height: 1.1;
  background: linear-gradient(180deg, transparent, rgba(0,0,0,0.35));
}
.tcard-lvl {
  position: absolute; top: 6px; right: 6px; z-index: 2;
  min-width: 22px; height: 22px; padding: 0 5px; display: grid; place-items: center;
  font-family: var(--font-header); font-weight: 900; font-size: 11px; color: #1a1500;
  background: var(--primary); border: 2px solid var(--bg); border-radius: 11px;
}

/* size variants (art height drives the card) */
.tcard.size-sm { width: 84px; }
.tcard.size-sm .tcard-art { height: 72px; } .tcard.size-sm .tcard-ribbon { font-size: 8px; } .tcard.size-sm .tcard-name { font-size: 10px; }
.tcard.size-md { width: 128px; }
.tcard.size-md .tcard-art { height: 112px; } .tcard.size-md .tcard-ribbon { font-size: 10px; } .tcard.size-md .tcard-name { font-size: 12px; }
.tcard.size-lg { width: 192px; }
.tcard.size-lg .tcard-art { height: 184px; } .tcard.size-lg .tcard-ribbon { font-size: 12px; } .tcard.size-lg .tcard-name { font-size: 15px; }
.tcard.size-xl { width: 248px; }
.tcard.size-xl .tcard-art { height: 240px; } .tcard.size-xl .tcard-ribbon { font-size: 13px; } .tcard.size-xl .tcard-name { font-size: 17px; }

.tcard.r-legendary .tcard-ribbon { animation: leg-sheen 2.4s linear infinite; background-size: 200% 100%;
  background-image: linear-gradient(100deg, #f5c842 0%, #fff3c4 50%, #f5c842 100%); }
@keyframes leg-sheen { to { background-position: 200% 0; } }

.icon { display: inline-block; vertical-align: middle; }
```

- [ ] **Step 2: Typecheck/build**

Run: `npm run build`
Expected: build succeeds (CSS only, no JS impact).

- [ ] **Step 3: Commit**

```bash
git add src/ui/theme.css
git commit -m "style(trench-royale): rarity palette + TrenchCard tokens"
```

---

## Task 6: TrenchCard component + CardTile wrapper

**Files:**
- Create: `src/ui/TrenchCard.tsx`
- Modify: `src/ui/CardTile.tsx`

- [ ] **Step 1: Write `TrenchCard`**

```tsx
// src/ui/TrenchCard.tsx
import { getCard } from '../sim/cards'
import { CARD_CHAR } from '../render3d/Battle3D'
import { rarityOf, rarityColor } from './rarity'
import { Icon } from './Icon'

export type CardSize = 'sm' | 'md' | 'lg' | 'xl'
export type CardState = 'selected' | 'in-deck' | 'locked' | 'dimmed' | 'leveled'

interface Props {
  cardId: string
  size?: CardSize
  state?: CardState
  level?: number
  className?: string
  showRibbon?: boolean
  onClick?: () => void
  onPointerDown?: (e: React.PointerEvent) => void
}

// sim role -> icon registry name; spells use their effect sub-type
function roleIcon(card: ReturnType<typeof getCard>): string {
  if (card.role === 'spell') {
    const fx = (card as any).spell?.kind ?? (card as any).spellKind
    if (fx === 'heal') return 'spell-heal'
    if (fx === 'buff') return 'spell-buff'
    if (fx === 'slow') return 'spell-slow'
    if (fx === 'damage') return 'spell-damage'
    return 'spell'
  }
  return card.role // tank/brawler/mage/assassin/support/swarm/ranged/building
}

export function TrenchCard({
  cardId, size = 'md', state, level, className = '', showRibbon = true, onClick, onPointerDown,
}: Props) {
  const card = getCard(cardId)
  const rarity = rarityOf(cardId)
  const charName = CARD_CHAR[cardId]
  const icon = roleIcon(card)
  const stateClass = state ? `is-${state}` : ''
  return (
    <button
      className={`tcard size-${size} r-${rarity} ${stateClass} ${className}`}
      data-card={cardId}
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={{
        ['--rarity' as any]: rarityColor(rarity),
        ['--rarity-glow' as any]: `var(--r-${rarity}-glow)`,
      }}
    >
      <span className="tcard-gem">{card.cost}</span>
      {(level ?? 0) > 0 && <span className="tcard-lvl">{level}</span>}
      {showRibbon && (
        <span className="tcard-ribbon">
          <Icon name={icon} size={size === 'sm' ? 12 : 16} /> {rarity}
        </span>
      )}
      <span className="tcard-art">
        {charName ? (
          <img src={`/assets/3d/portraits/${charName}.png`} alt={card.name} draggable={false} />
        ) : (
          <Icon name={icon} className="spell-icon" size={size === 'sm' ? 40 : 64} />
        )}
      </span>
      <span className="tcard-name">{card.name.toUpperCase()}</span>
    </button>
  )
}
```

Note: verify the spell effect field name. Run `grep -n "spell\|kind\|heal\|buff\|slow" src/sim/types.ts src/sim/cards.json | head` and adjust `roleIcon`'s `fx` extraction to the real field. If spells have no discriminator, return `'spell'` for all and drop the `fx` branch.

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: build succeeds. Fix any `card.role`/spell-field type errors per the note above.

- [ ] **Step 3: Replace `CardTile` body with a `sm` wrapper (keeps existing imports + `data-card` testid + className/handlers)**

```tsx
// src/ui/CardTile.tsx
import { TrenchCard } from './TrenchCard'

interface Props {
  cardId: string
  className?: string
  onPointerDown?: (e: React.PointerEvent) => void
  onClick?: () => void
}

export function CardTile({ cardId, className = '', onPointerDown, onClick }: Props) {
  const state = className.includes('in-deck') ? 'in-deck'
    : className.includes('selected') ? 'selected' : undefined
  return (
    <TrenchCard
      cardId={cardId}
      size="sm"
      state={state}
      showRibbon={false}
      className={className}
      onClick={onClick}
      onPointerDown={onPointerDown}
    />
  )
}
```

- [ ] **Step 4: Build + run existing tests**

Run: `npm run build && npm test`
Expected: build clean; sim/game suite still green (no sim touched).

- [ ] **Step 5: Visual check**

Run: `npm run dev` then open the deck builder + a practice battle (the run skill). Confirm cards render with rarity borders, gems, role ribbons, and the hand still drags. Screenshot for the record.

- [ ] **Step 6: Commit**

```bash
git add src/ui/TrenchCard.tsx src/ui/CardTile.tsx
git commit -m "feat(trench-royale): shared TrenchCard, CardTile becomes sm wrapper"
```

---

## Task 7: Swap Battle + DeckBuilder + Menu emojis for Icons

**Files:**
- Modify: `src/ui/Battle.tsx`, `src/ui/DeckBuilder.tsx`, `src/ui/Menu.tsx`

- [ ] **Step 1: Battle — crown + next-hint glyphs → Icon**

In `src/ui/Battle.tsx`: add `import { Icon } from './Icon'`. Replace line 74 `<span ...>♛</span>` with:
```tsx
<span key={i} className={i < (snap?.crowns ?? 0) ? 'won' : ''}><Icon name="crown" size={15} /></span>
```
Replace line 136 `<span>✦</span>` with `<Icon name="spell" size={20} />`.

- [ ] **Step 2: DeckBuilder — lock + check → Icon**

In `src/ui/DeckBuilder.tsx`: add `import { Icon } from './Icon'`. 
- Line 36: replace the `🔒 ` prefix string with plain text (drop the emoji): `setStatus(\`${getCardName(id)} unlocks at ${unlockWins(id)} wins (you have ${wins})\`)`.
- Line 57: `setStatus('deck saved')` (drop `✓`).
- Line 87: replace `<div className="lock-badge">🔒 {unlockWins(c.id)}W</div>` with:
```tsx
<div className="lock-badge"><Icon name="lock" size={13} /> {unlockWins(c.id)}W</div>
```

- [ ] **Step 3: Menu — nav + button icons → Icon, deck preview → TrenchCard**

In `src/ui/Menu.tsx`: add `import { Icon } from './Icon'` and `import { TrenchCard } from './TrenchCard'`.
- Battle button (line ~107): replace `<span className="cr-battle-icon">⚔</span>` with `<span className="cr-battle-icon"><Icon name="battle" size={42} /></span>`.
- Practice btn (line ~113): replace `<span>🎯</span>` with `<Icon name="practice" size={16} />`.
- Deck btn (line ~116): replace `<span>🎴</span>` with `<Icon name="deck" size={16} />`.
- Deck preview cards (lines ~124–135): replace the `<img …>` / `cr-deck-empty` map with:
```tsx
{(deck.cards.length ? deck.cards : Array.from({ length: DECK_SIZE }, () => '')).map((id, i) =>
  id ? <TrenchCard key={i} cardId={id} size="sm" showRibbon={false} /> : <div key={i} className="cr-deck-empty" />
)}
```
- Bottom nav array (lines ~181–184): replace the `icon: '⚔'|'🎴'|'🎁'|'🏆'` strings with names and render `<Icon name={t.icon} size={22} />` in place of `{t.icon}`:
```tsx
{ id: 'battle', label: 'BATTLE', icon: 'battle' },
{ id: 'deck', label: 'DECK', icon: 'deck' },
{ id: 'loot', label: 'LOOT', icon: 'loot' },
{ id: 'leaderboard', label: 'LADDER', icon: 'ladder' },
```
and `<span className="cr-nav-icon"><Icon name={t.icon} size={22} /></span>`.

- [ ] **Step 4: Build + emoji-guard partial check**

Run: `npm run build && npx vitest run tests/ui/icons.test.ts`
Expected: build clean. Emoji test offender list now excludes `Battle.tsx`, `DeckBuilder.tsx`, `Menu.tsx` (only `Onboarding.tsx` + `CardTile.tsx` may remain — `CardTile` should already be clean from Task 6; `Onboarding` clears in Tasks 9–10).

- [ ] **Step 5: Commit**

```bash
git add src/ui/Battle.tsx src/ui/DeckBuilder.tsx src/ui/Menu.tsx
git commit -m "feat(trench-royale): Battle/DeckBuilder/Menu emojis -> Icon set"
```

---

## Task 8: Vendor + adapt ChromaCard

**Files:**
- Create: `src/ui/reactbits/ChromaCard.tsx`

- [ ] **Step 1: Copy the vault source into the repo**

Run:
```bash
mkdir -p src/ui/reactbits
cp ../../react-bits-vault/src/pro/react-bits/chroma-card.tsx src/ui/reactbits/ChromaCard.tsx
```
(If the relative path differs, the source is `react-bits-vault/src/pro/react-bits/chroma-card.tsx` — 355 lines.)

- [ ] **Step 2: Remove the `cn`/`@/lib/utils` dependency**

In `src/ui/reactbits/ChromaCard.tsx`:
- Delete the line `import { cn } from "@/lib/utils";`.
- Replace the single `cn("relative overflow-hidden", className)` call (in the outer wrapper `<div className=...>`) with a template string: `` `relative overflow-hidden ${className}` ``.

Everything else (R3F `<Canvas>`, shaders, gsap hover) stays; `@react-three/fiber`, `gsap`, `three` are already deps. The component uses Tailwind utility class names on its wrapper/Canvas — the project has `@tailwindcss/vite` enabled so `relative`, `overflow-hidden`, `absolute inset-0 h-full w-full` resolve.

- [ ] **Step 3: Typecheck**

Run: `npm run build`
Expected: build succeeds. If the Tailwind utility classes don't apply (no Tailwind in `src/ui`), it still renders — the Canvas is absolutely positioned via the component; if layout breaks, add inline `style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}` to the `<Canvas>` and `position:'relative', overflow:'hidden'` to the wrapper div, and remove the className strings.

- [ ] **Step 4: Commit**

```bash
git add src/ui/reactbits/ChromaCard.tsx
git commit -m "feat(trench-royale): vendor React Bits Pro ChromaCard (no cn dep)"
```

---

## Task 9: PackOpen component + onboarding lootbox rework

**Files:**
- Create: `src/ui/PackOpen.tsx`
- Modify: `src/ui/Onboarding.tsx` (replace `OnboardingLootbox` + `LootReward`)
- Modify: `src/ui/theme.css` (append pack styles)

- [ ] **Step 1: Append pack-open styles to `theme.css`**

```css
/* ---------- PackOpen ---------- */
.packopen { display: flex; flex-direction: column; align-items: center; gap: 22px; }
.chest {
  position: relative; width: 200px; height: 170px; cursor: pointer;
  filter: drop-shadow(0 12px 30px rgba(245,230,0,0.25));
  transition: transform 0.15s ease;
}
.chest:hover { transform: scale(1.04); }
.chest.charging { animation: chest-shake 0.5s ease-in-out infinite; }
@keyframes chest-shake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-4deg)} 75%{transform:rotate(4deg)} }
.chest-glow {
  position: absolute; inset: -30% 10% 30% 10%; border-radius: 50%;
  background: radial-gradient(circle, rgba(245,230,0,0.5), transparent 65%);
  opacity: 0; transition: opacity 0.3s ease;
}
.chest.charging .chest-glow { opacity: 1; animation: glow-pulse 0.5s ease-in-out infinite; }
@keyframes glow-pulse { 50% { transform: scale(1.15); } }

.pack-rays {
  position: fixed; inset: 0; z-index: 40; pointer-events: none;
  background: conic-gradient(from 0deg, transparent 0 8deg, var(--ray, rgba(255,255,255,0.18)) 9deg 11deg, transparent 12deg 20deg);
  opacity: 0; mix-blend-mode: screen;
}
.pack-rays.show { animation: rays-spin 1.1s ease-out; }
@keyframes rays-spin { 0%{opacity:0; transform:scale(0.6) rotate(0)} 30%{opacity:0.9} 100%{opacity:0; transform:scale(1.6) rotate(40deg)} }

.pack-flash { position: fixed; inset: 0; z-index: 41; background: #fff; opacity: 0; pointer-events: none; }
.pack-flash.fire { animation: flash 0.35s ease-out; }
@keyframes flash { 0%{opacity:0} 20%{opacity:0.85} 100%{opacity:0} }

.pack-reveal { display: grid; place-items: center; gap: 12px; min-height: 320px; }
.pack-card-flip { perspective: 1000px; }
.pack-card-flip > * { animation: card-flip 0.55s cubic-bezier(0.2,0.9,0.3,1.2); transform-style: preserve-3d; }
@keyframes card-flip { from { transform: rotateY(90deg) scale(0.8); opacity: 0; } to { transform: rotateY(0) scale(1); opacity: 1; } }
.pack-progress { font-family: var(--font-header); letter-spacing: 1px; color: var(--muted); font-size: 12px; }
.pack-summary { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 560px; }
.pack-cta { font-family: var(--font-header); letter-spacing: 2px; color: var(--primary); font-size: 14px; animation: pulse-soft 1.2s ease-in-out infinite; }
@keyframes pulse-soft { 50% { opacity: 0.55; } }
```

- [ ] **Step 2: Write `PackOpen`**

```tsx
// src/ui/PackOpen.tsx
import { useState } from 'react'
import { TrenchCard } from './TrenchCard'
import { rarityOf, rarityColor } from './rarity'
import { CARD_CHAR } from '../render3d/Battle3D'
import ChromaCard from './reactbits/ChromaCard'
import { Icon } from './Icon'

type Phase = 'idle' | 'charging' | 'revealing' | 'summary'

export function PackOpen({ cardIds, onDone }: { cardIds: string[]; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [index, setIndex] = useState(0)
  const [rays, setRays] = useState(false)
  const [flash, setFlash] = useState(false)

  const open = () => {
    if (phase !== 'idle') return
    setPhase('charging')
    setTimeout(() => { fireBurst(); setPhase('revealing') }, 700)
  }

  const fireBurst = () => {
    setFlash(true); setRays(true)
    setTimeout(() => { setFlash(false); setRays(false) }, 1100)
  }

  const next = () => {
    if (index + 1 >= cardIds.length) { setPhase('summary'); return }
    const ni = index + 1
    setIndex(ni)
    const r = rarityOf(cardIds[ni])
    if (r === 'epic' || r === 'legendary') fireBurst()
  }

  const current = cardIds[index]
  const rayColor = current ? rarityColor(rarityOf(current)) : '#fff'
  const portrait = current ? (CARD_CHAR[current] ?? 'explorer') : 'explorer'

  return (
    <div className="packopen">
      <div className={`pack-rays ${rays ? 'show' : ''}`} style={{ ['--ray' as any]: `${rayColor}55` }} />
      <div className={`pack-flash ${flash ? 'fire' : ''}`} />

      {phase === 'idle' && (
        <>
          <div className="chest" onClick={open}>
            <div className="chest-glow" />
            <Icon name="loot" size={200} color="var(--primary)" />
          </div>
          <div className="pack-cta">TAP TO OPEN</div>
        </>
      )}

      {phase === 'charging' && (
        <div className="chest charging">
          <div className="chest-glow" />
          <Icon name="loot" size={200} color="var(--primary)" />
        </div>
      )}

      {phase === 'revealing' && current && (
        <div className="pack-reveal" onClick={next}>
          <div className="pack-card-flip" key={current}>
            <div style={{ position: 'relative', width: 200, height: 252 }}>
              <ChromaCard width={200} height={252} imageSrc={`/assets/3d/portraits/${portrait}.png`} imageAspectRatio={1}>
                <TrenchCard cardId={current} size="lg" showRibbon />
              </ChromaCard>
            </div>
          </div>
          <div className="pack-progress">{index + 1} / {cardIds.length} — TAP FOR NEXT</div>
        </div>
      )}

      {phase === 'summary' && (
        <>
          <div className="pack-summary">
            {cardIds.map((id, i) => <TrenchCard key={`${id}-${i}`} cardId={id} size="sm" />)}
          </div>
          <button className="btn primary" onClick={onDone}>CONTINUE</button>
        </>
      )}
    </div>
  )
}
```

Note: the ChromaCard renders the portrait with shimmer; the `TrenchCard` overlay (via ChromaCard's `children`) draws the frame on top. If the overlay frame looks doubled against the shimmer portrait, set ChromaCard `opacity={0.85}` so the shimmer reads as a sheen behind the frame.

- [ ] **Step 3: Rework `Onboarding` lootbox to use `PackOpen`**

In `src/ui/Onboarding.tsx`:
- Add `import { PackOpen } from './PackOpen'`.
- Replace the entire `OnboardingLootbox` function (lines ~209–243) and delete `LootReward` (lines ~245–255) with:
```tsx
function OnboardingLootbox({ loot, onOpen }: { loot: string[]; onOpen: () => void }) {
  // loot is the fixed FIRST_PACK; reveal it through the cinematic PackOpen.
  return (
    <div className="screen onboarding-lootbox">
      <h2>Commander starter pack</h2>
      <p className="subtitle">Every commander needs troops. Open your first pack.</p>
      <PackOpen cardIds={FIRST_PACK} onDone={onOpen} />
      <TutorialGuide
        steps={[{ text: 'Tap the chest to reveal your squad cards one by one. These are your starting troops.' }]}
        onComplete={() => {}}
        startVisible
      />
    </div>
  )
}
```
- The lootbox step's `onOpen` currently sets loot + auto-advances after 1600ms. Change the handler `openLootbox` (lines ~74–78) to set loot immediately and advance when PackOpen calls `onDone` (no timer):
```tsx
const openLootbox = () => {
  setLoot([...FIRST_PACK])
  setStep('deck')
}
```
(`onOpen={openLootbox}` is now fired by PackOpen's CONTINUE button.)

- [ ] **Step 4: Build + visual check**

Run: `npm run build` then `npm run dev`. Walk: identity → guest → lootbox. Confirm chest taps, charges, bursts with rays, cards flip in one-by-one with chroma shimmer, legendary/epic flash brighter, summary → CONTINUE advances to deck. Screenshot the reveal.

- [ ] **Step 5: Commit**

```bash
git add src/ui/PackOpen.tsx src/ui/Onboarding.tsx src/ui/theme.css
git commit -m "feat(trench-royale): cinematic PackOpen (chest -> rays -> chroma flip reveal)"
```

---

## Task 10: Level-up celebration + onboarding deck grid → TrenchCard

**Files:**
- Modify: `src/ui/Onboarding.tsx` (`OnboardingDeck`, `OnboardingLevelUp`)
- Modify: `src/ui/theme.css` (append level-up styles)

- [ ] **Step 1: Append level-up styles**

```css
/* ---------- level up ---------- */
.levelup-hero { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.levelup-hero.punch .lu-card { animation: lu-punch 0.5s cubic-bezier(0.2,1.4,0.4,1); }
@keyframes lu-punch { 0%{transform:scale(1)} 40%{transform:scale(1.18)} 100%{transform:scale(1.06)} }
.lu-ring {
  position: absolute; inset: 0; margin: auto; width: 120%; height: 120%;
  border: 3px solid var(--primary); border-radius: 18px; opacity: 0; pointer-events: none;
}
.levelup-hero.punch .lu-ring { animation: lu-ring 0.6s ease-out; }
@keyframes lu-ring { 0%{opacity:0.9; transform:scale(0.7)} 100%{opacity:0; transform:scale(1.4)} }
.lu-bars { width: min(280px, 80vw); display: flex; flex-direction: column; gap: 10px; }
.lu-bar { display: flex; align-items: center; gap: 8px; font-family: var(--font-header); font-size: 12px; color: var(--muted); }
.lu-bar .track { flex: 1; height: 12px; background: var(--panel-light); border-radius: 99px; overflow: hidden; border: 1px solid var(--border); }
.lu-bar .fill { height: 100%; width: 0; transition: width 0.7s cubic-bezier(0.2,0.9,0.3,1); }
.lu-bar .fill.hp { background: linear-gradient(90deg, var(--green), #7dffb8); }
.lu-bar .fill.dmg { background: linear-gradient(90deg, var(--red), #ff9aa6); }
.lu-float { color: var(--green); font-family: var(--font-header); font-weight: 800; animation: lu-float 0.9s ease-out; }
@keyframes lu-float { from { opacity: 0; transform: translateY(8px); } 30% { opacity: 1; } to { opacity: 0; transform: translateY(-18px); } }
```

- [ ] **Step 2: Onboarding deck grid → TrenchCard (`md`)**

In `OnboardingDeck` (lines ~292–311), replace the inner `.tile-wrap`/`.card-tile` block with:
```tsx
{lootCards.map((c) => (
  <TrenchCard
    key={c.id}
    cardId={c.id}
    size="md"
    state={deck.includes(c.id) ? 'in-deck' : 'dimmed'}
    onClick={() => toggle(c.id)}
  />
))}
```
Add `import { TrenchCard } from './TrenchCard'` at the top of `Onboarding.tsx` (if not already added in Task 9).

- [ ] **Step 3: Rework `OnboardingLevelUp` into a hero + bars celebration**

Replace the `OnboardingLevelUp` function body's JSX. Keep the same props. New version: a single-select hero list where tapping a card promotes it with punch + ring + animated bars.

```tsx
function OnboardingLevelUp({
  deck, leveledCard, setLeveledCard, onContinue, status,
}: {
  deck: string[]; leveledCard: string | null; setLeveledCard: (id: string) => void; onContinue: () => void; status: string
}) {
  const deckCards = useMemo(() => CARDS.filter((c) => deck.includes(c.id)), [deck])
  const [punch, setPunch] = useState(false)
  const hero = leveledCard ? getCard(leveledCard) : null

  const pick = (id: string) => {
    setLeveledCard(id)
    setPunch(false)
    requestAnimationFrame(() => setPunch(true))
  }

  return (
    <div className="screen onboarding-levelup">
      <h2>Level up a card</h2>
      <p className="subtitle">Pick one card to boost. Higher level means more HP and damage.</p>

      {hero && (
        <div className={`levelup-hero ${punch ? 'punch' : ''}`}>
          <div className="lu-card" style={{ position: 'relative' }}>
            <div className="lu-ring" />
            <TrenchCard cardId={hero.id} size="lg" level={2} showRibbon />
          </div>
          <div className="lu-bars">
            <div className="lu-bar">HP<div className="track"><div className="fill hp" style={{ width: punch ? '90%' : '70%' }} /></div>
              <span className="lu-float">+{Math.round((hero.hp ?? 100) * 0.1)}</span></div>
            <div className="lu-bar">DMG<div className="track"><div className="fill dmg" style={{ width: punch ? '85%' : '65%' }} /></div>
              <span className="lu-float">+{Math.round((hero.damage ?? 20) * 0.1)}</span></div>
          </div>
        </div>
      )}

      <div className="levelup-pool">
        {deckCards.map((c) => (
          <TrenchCard
            key={c.id}
            cardId={c.id}
            size="sm"
            state={leveledCard === c.id ? 'selected' : undefined}
            onClick={() => pick(c.id)}
          />
        ))}
      </div>

      <div className="status">{status}</div>
      <button className="btn primary" onClick={onContinue} disabled={!leveledCard}>CONTINUE</button>
      <TutorialGuide
        steps={[{ text: 'Tap a card to level it up. Your favorite troop will hit harder and survive longer.' }]}
        onComplete={() => {}}
        startVisible
      />
    </div>
  )
}
```
Ensure `getCard` is imported in `Onboarding.tsx` (`import { CARDS, STARTER_DECK } from '../sim/cards'` → add `getCard`). Also import `useState` (already imported at top).

- [ ] **Step 4: Build + visual check**

Run: `npm run build` then `npm run dev`. Walk deck → level-up: deck cards are bigger (`md`) with rarity frames; tapping a card in level-up shows the hero card punch + ring burst + bars filling + floating +X. Screenshot.

- [ ] **Step 5: Commit**

```bash
git add src/ui/Onboarding.tsx src/ui/theme.css
git commit -m "feat(trench-royale): level-up celebration + onboarding deck on TrenchCard"
```

---

## Task 11: Final emoji sweep, identity icons, full test gate

**Files:**
- Modify: `src/ui/Onboarding.tsx` (identity `👤`/`👛`)

- [ ] **Step 1: Identity card icons → Icon**

In `OnboardingIdentity` block (lines ~117–149): add `import { Icon } from './Icon'` (if not present). Replace `<div className="id-icon">👤</div>` with `<div className="id-icon"><Icon name="guest" size={42} /></div>`, and both `👛` with `<Icon name="wallet" size={42} />`.

- [ ] **Step 2: Run the full emoji guard + all tests**

Run: `npx vitest run tests/ui/icons.test.ts && npm test`
Expected: `no emoji glyphs remain in src/ui/*.tsx` now PASSES (offenders `[]`); full sim/game/ui suite green.

If any file still flags, grep it: `grep -rnP '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{2300}-\x{23FF}]' src/ui` and replace the glyph with the matching `<Icon>`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/ui/Onboarding.tsx
git commit -m "feat(trench-royale): identity icons + emoji-free src/ui (guard green)"
```

---

## Task 12: Playwright onboarding smoke + final verification

**Files:**
- Create: `scripts/screenshot-onboarding.ts`

- [ ] **Step 1: Write the smoke script (mirrors `scripts/screenshot-3d.ts` setup)**

First read `scripts/screenshot-3d.ts` to copy its launch/baseURL/wait conventions, then:

```ts
// scripts/screenshot-onboarding.ts
// Run: npm run dev (5174) + backend (3001), then: npx tsx scripts/screenshot-onboarding.ts
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:5174'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 430, height: 900 } })
  await page.goto(BASE)
  await page.waitForFunction(() => (window as any).__TRENCH_READY__ === true, { timeout: 15000 })

  // welcome -> identity -> guest
  await page.getByText('ENTER THE TRENCH').click().catch(() => {})
  await page.getByTestId('onboarding-guest').click()

  // lootbox: open chest, advance through reveals
  await page.waitForTimeout(800)
  await page.locator('.chest').click()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: '/tmp/tw-lootbox.png' })
  for (let i = 0; i < 10; i++) { await page.locator('.pack-reveal, .pack-summary').first().click().catch(() => {}); await page.waitForTimeout(250) }
  await page.getByText('CONTINUE').click().catch(() => {})

  // deck: pick 8, deploy
  await page.waitForSelector('.tcard')
  await page.screenshot({ path: '/tmp/tw-deck.png' })
  const cards = await page.locator('.onboarding-deck .tcard').all()
  for (const c of cards.slice(0, 8)) await c.click()
  await page.getByText('DEPLOY SQUAD').click()

  // level-up
  await page.waitForSelector('.levelup-pool .tcard')
  await page.locator('.levelup-pool .tcard').first().click()
  await page.waitForTimeout(900)
  await page.screenshot({ path: '/tmp/tw-levelup.png' })

  await browser.close()
  console.log('screens: /tmp/tw-lootbox.png /tmp/tw-deck.png /tmp/tw-levelup.png')
}
main()
```

- [ ] **Step 2: Run the smoke (dev server + backend must be up)**

Run: `npx tsx scripts/screenshot-onboarding.ts`
Expected: prints the three screenshot paths, no throw. Open `/tmp/tw-lootbox.png`, `/tmp/tw-deck.png`, `/tmp/tw-levelup.png` and confirm: chest/rays reveal, rarity-framed bigger cards, level-up punch+bars. Adjust selectors if the walk stalls.

- [ ] **Step 3: Full gate**

Run: `npm test && npm run build && npm run smoke-3d`
Expected: sim+ui suites green, build clean, battle smoke screenshots `/tmp/tw3d.png` (hand still renders TrenchCards). Confirm `grep -riE "react|three" src/sim/` is still empty.

- [ ] **Step 4: Commit**

```bash
git add scripts/screenshot-onboarding.ts
git commit -m "test(trench-royale): Playwright onboarding smoke (lootbox/deck/levelup)"
```

---

## Self-review notes

- **Spec coverage:** Icon system (T2–3,7,11), rarity (T1,5), TrenchCard (T6) consumed by DeckBuilder/Battle/Menu/Onboarding (T6,7,10), ChromaCard vendor (T8), PackOpen (T9), level-up (T10), menu polish (T7), tests+Playwright (T1,4,12). Cross-fade transitions were marked "stretch / cut if needed" in the spec and are intentionally omitted to keep scope tight — add later if desired.
- **Sim untouched:** rarity is `src/ui/rarity.ts` only; `npm test` + the `grep` guard in T6/T12 prove `src/sim/` is byte-identical.
- **Known verify-points flagged inline:** spell sub-type field name (T6 Step 1 note), ChromaCard Tailwind-class fallback (T8 Step 3), ChromaCard opacity if frame doubles (T9 Step 2 note), game-icons author/slug resolution (T2 Step 2).
- **No fabricated assertions:** visual tasks verify via build + Playwright screenshots, not invented unit checks.
