# Trench Wars v1 — Game Core Implementation Plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browser-playable Clash Royale-style lane battler (Traders vs Jeets theme) with a deterministic TypeScript sim, Phaser rendering with placeholder art, and an AI ladder — the playable core that Plans 2 (asset pipeline) and 3 (backend/token) build on.

**Architecture:** Pure-TS fixed-tick deterministic simulation (`src/sim/`, zero rendering deps, fully unit-tested) consumed by a Phaser 4 `BattleScene` that converts wall-clock time into sim ticks and renders state with placeholder graphics. AI opponents are deterministic policies over the same sim. Card stats live in JSON config so balance changes need no code.

**Tech Stack:** Vite + TypeScript + Phaser 4 + Vitest. No backend in this plan.

**Spec:** `docs/superpowers/specs/2026-06-12-trench-wars-design.md`

---

## File structure

```
web3-games/trench-wars/
├── package.json, vite.config.ts, tsconfig.json, index.html
├── src/
│   ├── sim/                  # PURE TS — no Phaser imports allowed, ever
│   │   ├── constants.ts      # tick rate, arena dims, elixir rates
│   │   ├── types.ts          # CardDef, SimState, UnitEntity, Tower, commands
│   │   ├── rng.ts            # pure seeded RNG (state in, [value, state] out)
│   │   ├── cards.ts          # loads + validates cards.json, deck helpers
│   │   ├── cards.json        # the 14-card launch roster stats
│   │   ├── sim.ts            # createMatch / validateDeploy / step
│   │   ├── replay.ts         # record + re-simulate replays
│   │   └── ai.ts             # deterministic AI policy + difficulty configs
│   ├── game/
│   │   ├── main.ts           # Phaser.Game boot
│   │   ├── BattleScene.ts    # render sim, input, HUD, result overlay
│   │   └── ladder.ts         # localStorage AI-ladder progression
│   └── tests in tests/sim/*.test.ts (vitest)
└── e2e/smoke.spec.ts         # Playwright boot smoke
```

Sim update order inside `step()` (the determinism contract — every task respects it):
1. apply validated deploy commands → 2. elixir regen → 3. compute aura multipliers → 4. units acquire targets, attack or move → 5. towers attack → 6. remove dead, apply tower destruction side-effects → 7. win check → 8. `tick++`.
Iteration is always array insertion order; distance ties break by lower entity `id`. No `Math.random`, no `Date.now` anywhere in `src/sim/`.

---

### Task 1: Scaffold project

**Files:**
- Create: `web3-games/trench-wars/` (Vite vanilla-ts), `package.json`, `vite.config.ts`

- [ ] **Step 1: Scaffold**

```bash
cd /Users/henry/Documents/Gazillion-dollars/web3-games
npm create vite@latest trench-wars -- --template vanilla-ts
cd trench-wars
npm i phaser@^4
npm i -D vitest
rm -f src/counter.ts src/typescript.svg public/vite.svg src/style.css
```

- [ ] **Step 2: Wire scripts and entry**

In `package.json` set:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Replace `src/main.ts` with a placeholder (Task 12 fills it):

```ts
console.log('trench wars boot')
```

Replace `index.html` body with:

```html
<body style="margin:0;background:#0a0e14">
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
```

- [ ] **Step 3: Verify build runs**

Run: `npm run build`
Expected: exits 0, `dist/` produced.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): scaffold Vite+TS+Phaser4 project"
```

---

### Task 2: Seeded RNG

**Files:**
- Create: `src/sim/rng.ts`
- Test: `tests/sim/rng.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/rng.test.ts
import { describe, it, expect } from 'vitest'
import { nextRand } from '../../src/sim/rng'

describe('nextRand', () => {
  it('is deterministic for a given state', () => {
    const [v1, s1] = nextRand(42)
    const [v2] = nextRand(42)
    expect(v1).toBe(v2)
    expect(s1).not.toBe(42)
  })
  it('returns values in [0,1) and advances state', () => {
    let state = 7
    for (let i = 0; i < 1000; i++) {
      const [v, next] = nextRand(state)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      state = next
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sim/rng.test.ts`
Expected: FAIL — cannot resolve `src/sim/rng`.

- [ ] **Step 3: Implement (mulberry32, pure)**

```ts
// src/sim/rng.ts
// Pure function form so RNG state can live inside SimState and replays stay exact.
export function nextRand(state: number): [value: number, nextState: number] {
  const a = (state + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a >>> 0]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sim/rng.test.ts` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): pure seeded RNG"
```

---

### Task 3: Constants, types, and the 14-card roster config

**Files:**
- Create: `src/sim/constants.ts`, `src/sim/types.ts`, `src/sim/cards.json`, `src/sim/cards.ts`
- Test: `tests/sim/cards.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/cards.test.ts
import { describe, it, expect } from 'vitest'
import { CARDS, getCard, validateCards } from '../../src/sim/cards'

describe('card config', () => {
  it('loads 14 cards: 12 units + 2 spells', () => {
    expect(CARDS.length).toBe(14)
    expect(CARDS.filter(c => c.type === 'unit').length).toBe(12)
    expect(CARDS.filter(c => c.type === 'spell').length).toBe(2)
  })
  it('every unit has complete combat stats', () => {
    for (const c of CARDS.filter(c => c.type === 'unit')) {
      expect(c.hp).toBeGreaterThan(0)
      expect(c.damage).toBeGreaterThan(0)
      expect(c.range).toBeGreaterThan(0)
      expect(c.sightRange).toBeGreaterThanOrEqual(c.range!)
      expect(c.speed).toBeGreaterThan(0)
      expect(c.attackSpeed).toBeGreaterThan(0)
      expect(c.count).toBeGreaterThanOrEqual(1)
    }
  })
  it('costs span 1-7 elixir for curve variety', () => {
    const costs = CARDS.map(c => c.cost)
    expect(Math.min(...costs)).toBeLessThanOrEqual(2)
    expect(Math.max(...costs)).toBeGreaterThanOrEqual(6)
  })
  it('getCard throws on unknown id', () => {
    expect(() => getCard('nope')).toThrow()
    expect(getCard('diamond-hands').name).toBe('Diamond Hands')
  })
  it('validateCards rejects a unit with missing hp', () => {
    expect(() => validateCards([{ id: 'x', name: 'X', cost: 3, type: 'unit' } as any])).toThrow(/hp/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sim/cards.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement constants and types**

```ts
// src/sim/constants.ts
export const TICKS_PER_SEC = 10
export const TICK_MS = 100
export const MATCH_TICKS = 1800        // 3:00
export const OVERTIME_TICKS = 600      // +1:00 sudden death
export const DOUBLE_ELIXIR_TICK = 1200 // final 60s = 2x elixir
export const ELIXIR_PER_TICK = 0.05    // 1 elixir / 2s
export const ELIXIR_START = 5
export const ELIXIR_MAX = 10
export const ARENA_W = 18
export const ARENA_H = 32
export const RIVER_Y = 16
export const LANE_LEFT_X = 4.5
export const LANE_RIGHT_X = 13.5
export const HAND_SIZE = 4
export const DECK_SIZE = 8
export const FLEE_HP_RATIO = 0.3
export const SPELL_TOWER_DAMAGE_MULT = 0.5
```

```ts
// src/sim/types.ts
export type PlayerId = 0 | 1

export interface AuraDef { radius: number; speedMult?: number; damageMult?: number }

export interface CardDef {
  id: string
  name: string
  cost: number
  type: 'unit' | 'spell'
  // unit fields
  count?: number            // units spawned per play
  hp?: number
  damage?: number
  range?: number            // attack range (tiles)
  sightRange?: number       // aggro acquisition range
  speed?: number            // tiles per tick
  attackSpeed?: number      // ticks between attacks
  splashRadius?: number     // 0/undefined = single target
  targeting?: 'nearest' | 'lowestHp'
  flees?: boolean           // Paper Hands: flees below FLEE_HP_RATIO
  stealthRange?: number     // Rug Dev: hidden until an enemy is this close
  aura?: AuraDef            // Influencer (ally damageMult) / FUD Spirit (enemy speedMult)
  // spell fields
  effectRadius?: number
  effectDamage?: number
  buffTicks?: number
  buffSpeedMult?: number
  buffDamageMult?: number
}

export interface UnitEntity {
  id: number
  owner: PlayerId
  cardId: string
  x: number
  y: number
  hp: number
  maxHp: number
  cooldown: number
  fleeing: boolean
  revealed: boolean
  buffUntil: number // pump-signal expiry tick; 0 = no buff
}

export interface Tower {
  id: number
  owner: PlayerId
  kind: 'lane' | 'king'
  x: number
  y: number
  hp: number
  maxHp: number
  active: boolean   // king towers sleep until a lane tower falls or they take damage
  cooldown: number
}

export interface DeployCommand {
  tick: number
  player: PlayerId
  cardId: string
  x: number
  y: number
}

export interface MatchResult {
  winner: PlayerId | null // null = draw
  reason: 'king' | 'crowns' | 'tiebreak' | 'draw'
}

export interface SimState {
  tick: number
  rngState: number
  elixir: [number, number]
  decks: [string[], string[]] // card-id queues; first HAND_SIZE entries = hand
  units: UnitEntity[]
  towers: Tower[]
  nextId: number
  overtime: boolean
  result: MatchResult | null
}

export interface Replay {
  seed: number
  decks: [string[], string[]]
  commands: DeployCommand[]
}
```

- [ ] **Step 4: Implement the roster config**

```json
// src/sim/cards.json
[
  { "id": "bag-holder",     "name": "Bag Holder",          "cost": 1, "type": "unit", "count": 1, "hp": 220,  "damage": 40,  "range": 0.8, "sightRange": 5.5, "speed": 0.10, "attackSpeed": 10 },
  { "id": "jeet-horde",     "name": "Jeet Horde",          "cost": 2, "type": "unit", "count": 3, "hp": 90,   "damage": 35,  "range": 0.8, "sightRange": 5.5, "speed": 0.16, "attackSpeed": 9 },
  { "id": "paper-hands",    "name": "Paper Hands",         "cost": 2, "type": "unit", "count": 1, "hp": 280,  "damage": 60,  "range": 0.8, "sightRange": 5.5, "speed": 0.12, "attackSpeed": 10, "flees": true },
  { "id": "mev-bots",       "name": "MEV Bot Swarm",       "cost": 3, "type": "unit", "count": 4, "hp": 60,   "damage": 25,  "range": 0.8, "sightRange": 6.5, "speed": 0.20, "attackSpeed": 8,  "targeting": "lowestHp" },
  { "id": "fud-spirit",     "name": "FUD Spirit",          "cost": 3, "type": "unit", "count": 1, "hp": 150,  "damage": 15,  "range": 4.0, "sightRange": 6.0, "speed": 0.10, "attackSpeed": 12, "aura": { "radius": 3, "speedMult": 0.65 } },
  { "id": "chad-trader",    "name": "Chad Trader",         "cost": 3, "type": "unit", "count": 1, "hp": 420,  "damage": 90,  "range": 0.8, "sightRange": 5.5, "speed": 0.12, "attackSpeed": 11 },
  { "id": "diamond-hands",  "name": "Diamond Hands",       "cost": 4, "type": "unit", "count": 1, "hp": 1400, "damage": 120, "range": 0.8, "sightRange": 5.5, "speed": 0.07, "attackSpeed": 13 },
  { "id": "rug-dev",        "name": "Rug Dev",             "cost": 4, "type": "unit", "count": 1, "hp": 240,  "damage": 320, "range": 0.8, "sightRange": 6.0, "speed": 0.16, "attackSpeed": 14, "stealthRange": 3.5 },
  { "id": "influencer",     "name": "Influencer",          "cost": 4, "type": "unit", "count": 1, "hp": 350,  "damage": 40,  "range": 4.5, "sightRange": 6.0, "speed": 0.10, "attackSpeed": 12, "aura": { "radius": 3, "damageMult": 1.35 } },
  { "id": "sniper-bot",     "name": "Sniper Bot",          "cost": 5, "type": "unit", "count": 1, "hp": 180,  "damage": 110, "range": 7.5, "sightRange": 8.5, "speed": 0.09, "attackSpeed": 15 },
  { "id": "exit-liquidity", "name": "Exit Liquidity Mob",  "cost": 5, "type": "unit", "count": 5, "hp": 110,  "damage": 30,  "range": 0.8, "sightRange": 5.5, "speed": 0.14, "attackSpeed": 9 },
  { "id": "whale",          "name": "Whale",               "cost": 6, "type": "unit", "count": 1, "hp": 900,  "damage": 200, "range": 5.0, "sightRange": 7.0, "speed": 0.05, "attackSpeed": 20, "splashRadius": 1.5 },
  { "id": "pump-signal",       "name": "Pump Signal",         "cost": 2, "type": "spell", "effectRadius": 3.0, "buffTicks": 50, "buffSpeedMult": 1.5, "buffDamageMult": 1.25 },
  { "id": "liquidation-cascade", "name": "Liquidation Cascade", "cost": 4, "type": "spell", "effectRadius": 2.5, "effectDamage": 180 }
]
```

```ts
// src/sim/cards.ts
import rawCards from './cards.json'
import type { CardDef } from './types'

export function validateCards(cards: CardDef[]): CardDef[] {
  for (const c of cards) {
    if (!c.id || !c.name || !(c.cost >= 1)) throw new Error(`card ${c.id}: bad id/name/cost`)
    if (c.type === 'unit') {
      for (const f of ['hp', 'damage', 'range', 'sightRange', 'speed', 'attackSpeed', 'count'] as const) {
        if (!((c[f] as number) > 0)) throw new Error(`card ${c.id}: missing/invalid ${f}`)
      }
    } else if (c.type === 'spell') {
      if (!(c.effectRadius! > 0)) throw new Error(`card ${c.id}: missing effectRadius`)
      if (!c.effectDamage && !c.buffTicks) throw new Error(`card ${c.id}: spell does nothing`)
    } else {
      throw new Error(`card ${c.id}: unknown type`)
    }
  }
  const ids = new Set(cards.map(c => c.id))
  if (ids.size !== cards.length) throw new Error('duplicate card ids')
  return cards
}

export const CARDS: CardDef[] = validateCards(rawCards as CardDef[])

const byId = new Map(CARDS.map(c => [c.id, c]))

export function getCard(id: string): CardDef {
  const c = byId.get(id)
  if (!c) throw new Error(`unknown card: ${id}`)
  return c
}

/** Default starter deck used by the client and tests. */
export const STARTER_DECK: string[] = [
  'bag-holder', 'jeet-horde', 'paper-hands', 'chad-trader',
  'diamond-hands', 'mev-bots', 'pump-signal', 'liquidation-cascade',
]
```

Note: `tsconfig.json` needs `"resolveJsonModule": true` and `"esModuleInterop": true` in `compilerOptions` — add them.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/sim/cards.test.ts` — Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): sim types, constants, 14-card Traders-vs-Jeets roster config"
```

---

### Task 4: Match creation + elixir regen

**Files:**
- Create: `src/sim/sim.ts`
- Test: `tests/sim/match.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/match.test.ts
import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { STARTER_DECK } from '../../src/sim/cards'
import { ELIXIR_START, ELIXIR_MAX, ELIXIR_PER_TICK, DOUBLE_ELIXIR_TICK } from '../../src/sim/constants'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]

describe('createMatch', () => {
  it('creates 6 towers: 2 lane + 1 sleeping king per player', () => {
    const s = createMatch(123, decks)
    expect(s.towers.length).toBe(6)
    for (const p of [0, 1] as const) {
      const mine = s.towers.filter(t => t.owner === p)
      expect(mine.filter(t => t.kind === 'lane').length).toBe(2)
      const king = mine.find(t => t.kind === 'king')!
      expect(king.active).toBe(false)
      expect(mine.filter(t => t.kind === 'lane').every(t => t.active)).toBe(true)
    }
  })
  it('starts with ELIXIR_START for both and empty board', () => {
    const s = createMatch(123, decks)
    expect(s.elixir).toEqual([ELIXIR_START, ELIXIR_START])
    expect(s.units).toEqual([])
    expect(s.result).toBeNull()
  })
})

describe('elixir regen', () => {
  it('regens ELIXIR_PER_TICK per tick, capped at ELIXIR_MAX', () => {
    let s = createMatch(123, decks)
    for (let i = 0; i < 20; i++) s = step(s, [])
    expect(s.elixir[0]).toBeCloseTo(ELIXIR_START + 20 * ELIXIR_PER_TICK, 5)
    for (let i = 0; i < 500; i++) s = step(s, [])
    expect(s.elixir[0]).toBe(ELIXIR_MAX)
  })
  it('doubles regen after DOUBLE_ELIXIR_TICK', () => {
    let s = createMatch(123, decks)
    s.tick = DOUBLE_ELIXIR_TICK
    s.elixir = [0, 0]
    s = step(s, [])
    expect(s.elixir[0]).toBeCloseTo(2 * ELIXIR_PER_TICK, 5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sim/match.test.ts` — Expected: FAIL (no sim.ts).

- [ ] **Step 3: Implement createMatch + step skeleton**

```ts
// src/sim/sim.ts
import {
  ARENA_H, ARENA_W, DECK_SIZE, DOUBLE_ELIXIR_TICK, ELIXIR_MAX, ELIXIR_PER_TICK,
  ELIXIR_START, FLEE_HP_RATIO, HAND_SIZE, LANE_LEFT_X, LANE_RIGHT_X, MATCH_TICKS,
  OVERTIME_TICKS, RIVER_Y, SPELL_TOWER_DAMAGE_MULT,
} from './constants'
import { getCard } from './cards'
import type { DeployCommand, MatchResult, PlayerId, SimState, Tower, UnitEntity } from './types'

const TOWER_STATS = {
  lane: { hp: 1400, damage: 90, range: 5.5, attackSpeed: 8 },
  king: { hp: 2400, damage: 120, range: 7.0, attackSpeed: 10 },
} as const

export function createMatch(seed: number, decks: [string[], string[]]): SimState {
  for (const d of decks) {
    if (d.length !== DECK_SIZE) throw new Error(`deck must have ${DECK_SIZE} cards`)
    d.forEach(getCard) // throws on unknown id
  }
  let nextId = 1
  const towers: Tower[] = []
  for (const owner of [0, 1] as const) {
    // player 0 = bottom (small y), player 1 = top, mirrored
    const laneY = owner === 0 ? 6.5 : ARENA_H - 6.5
    const kingY = owner === 0 ? 3 : ARENA_H - 3
    for (const x of [LANE_LEFT_X, LANE_RIGHT_X]) {
      towers.push({ id: nextId++, owner, kind: 'lane', x, y: laneY, hp: TOWER_STATS.lane.hp, maxHp: TOWER_STATS.lane.hp, active: true, cooldown: 0 })
    }
    towers.push({ id: nextId++, owner, kind: 'king', x: ARENA_W / 2, y: kingY, hp: TOWER_STATS.king.hp, maxHp: TOWER_STATS.king.hp, active: false, cooldown: 0 })
  }
  return {
    tick: 0,
    rngState: seed >>> 0,
    elixir: [ELIXIR_START, ELIXIR_START],
    decks: [[...decks[0]], [...decks[1]]],
    units: [],
    towers,
    nextId,
    overtime: false,
    result: null,
  }
}

export function step(prev: SimState, commands: DeployCommand[]): SimState {
  const s: SimState = structuredClone(prev)
  if (s.result) return s

  applyCommands(s, commands)   // Task 5
  regenElixir(s)
  updateUnits(s)               // Task 6/7
  updateTowers(s)              // Task 7/8
  cleanupAndWinCheck(s)        // Task 8
  s.tick++
  return s
}

function regenElixir(s: SimState) {
  const rate = (s.tick >= DOUBLE_ELIXIR_TICK || s.overtime) ? 2 * ELIXIR_PER_TICK : ELIXIR_PER_TICK
  s.elixir = [Math.min(ELIXIR_MAX, s.elixir[0] + rate), Math.min(ELIXIR_MAX, s.elixir[1] + rate)]
}

// ---- placeholders fleshed out by later tasks (keep them, they make this file compile) ----
function applyCommands(_s: SimState, _commands: DeployCommand[]) {}
function updateUnits(_s: SimState) {}
function updateTowers(_s: SimState) {}
function cleanupAndWinCheck(_s: SimState) {}

export { TOWER_STATS }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sim/match.test.ts` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): match creation, tower layout, elixir regen"
```

---

### Task 5: Deploy validation + unit spawning + hand cycling

**Files:**
- Modify: `src/sim/sim.ts` (replace `applyCommands` placeholder; add exported `validateDeploy`, `handOf`)
- Test: `tests/sim/deploy.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/deploy.test.ts
import { describe, it, expect } from 'vitest'
import { createMatch, step, validateDeploy, handOf } from '../../src/sim/sim'
import { STARTER_DECK, getCard } from '../../src/sim/cards'
import { HAND_SIZE, RIVER_Y } from '../../src/sim/constants'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]
const deploy = (cardId: string, x = 9, y = 8) => ({ tick: 0, player: 0 as const, cardId, x, y })

describe('validateDeploy', () => {
  it('accepts an affordable hand card on own half', () => {
    const s = createMatch(1, decks)
    expect(validateDeploy(s, deploy('jeet-horde'))).toBe(true)
  })
  it('rejects a card not in hand', () => {
    const s = createMatch(1, decks)
    const notInHand = s.decks[0][HAND_SIZE] // first card beyond the hand
    expect(validateDeploy(s, deploy(notInHand))).toBe(false)
  })
  it('rejects insufficient elixir', () => {
    const s = createMatch(1, decks)
    s.elixir[0] = 1
    expect(validateDeploy(s, deploy('chad-trader'))).toBe(false)
  })
  it('rejects unit deploys on enemy half (spells allowed anywhere)', () => {
    const s = createMatch(1, decks)
    expect(validateDeploy(s, deploy('jeet-horde', 9, RIVER_Y + 4))).toBe(false)
    expect(validateDeploy(s, deploy('liquidation-cascade', 9, RIVER_Y + 4))).toBe(true)
  })
})

describe('spawning + hand cycle', () => {
  it('spawns `count` units, deducts elixir, cycles card to deck back', () => {
    let s = createMatch(1, decks)
    const before = s.elixir[0]
    s = step(s, [deploy('jeet-horde')])
    expect(s.units.length).toBe(getCard('jeet-horde').count)
    expect(s.units.every(u => u.owner === 0 && u.hp === getCard('jeet-horde').hp)).toBe(true)
    // regen happens same tick, so compare against cost only
    expect(s.elixir[0]).toBeLessThan(before)
    expect(handOf(s, 0)).not.toContain('jeet-horde')
    expect(s.decks[0][s.decks[0].length - 1]).toBe('jeet-horde')
    expect(s.decks[0].length).toBe(8)
  })
  it('ignores invalid commands without crashing', () => {
    let s = createMatch(1, decks)
    s = step(s, [deploy('whale')]) // not in starter deck/hand
    expect(s.units.length).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sim/deploy.test.ts` — Expected: FAIL (`validateDeploy` not exported).

- [ ] **Step 3: Implement**

Replace the `applyCommands` placeholder in `src/sim/sim.ts` and add exports:

```ts
export function handOf(s: SimState, p: PlayerId): string[] {
  return s.decks[p].slice(0, HAND_SIZE)
}

export function validateDeploy(s: SimState, cmd: DeployCommand): boolean {
  let card
  try { card = getCard(cmd.cardId) } catch { return false }
  if (!handOf(s, cmd.player).includes(cmd.cardId)) return false
  if (s.elixir[cmd.player] < card.cost) return false
  if (cmd.x < 0 || cmd.x > ARENA_W || cmd.y < 0 || cmd.y > ARENA_H) return false
  if (card.type === 'unit') {
    const onOwnHalf = cmd.player === 0 ? cmd.y < RIVER_Y - 0.5 : cmd.y > RIVER_Y + 0.5
    if (!onOwnHalf) return false
  }
  return true
}

function applyCommands(s: SimState, commands: DeployCommand[]) {
  for (const cmd of commands) {
    if (!validateDeploy(s, cmd)) continue
    const card = getCard(cmd.cardId)
    s.elixir[cmd.player] -= card.cost
    // cycle: remove from hand position, push to back of queue
    const idx = s.decks[cmd.player].indexOf(cmd.cardId)
    s.decks[cmd.player].splice(idx, 1)
    s.decks[cmd.player].push(cmd.cardId)

    if (card.type === 'spell') {
      castSpell(s, cmd, card) // Task 9 — stub below for now
    } else {
      for (let i = 0; i < card.count!; i++) {
        // deterministic ring offsets so multi-unit cards don't stack on one point
        const angle = (2 * Math.PI * i) / card.count!
        const r = card.count! > 1 ? 0.7 : 0
        s.units.push({
          id: s.nextId++,
          owner: cmd.player,
          cardId: card.id,
          x: Math.min(ARENA_W, Math.max(0, cmd.x + r * Math.cos(angle))),
          y: Math.min(ARENA_H, Math.max(0, cmd.y + r * Math.sin(angle))),
          hp: card.hp!,
          maxHp: card.hp!,
          cooldown: 0,
          fleeing: false,
          revealed: card.stealthRange === undefined,
          buffUntil: 0,
        })
      }
    }
  }
}

function castSpell(_s: SimState, _cmd: DeployCommand, _card: ReturnType<typeof getCard>) {} // Task 9
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sim/deploy.test.ts` — Expected: PASS. Also run `npx vitest run` — all prior tests still green.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): deploy validation, unit spawning, hand cycling"
```

---

### Task 6: Movement — bridge waypoints toward enemy towers

**Files:**
- Modify: `src/sim/sim.ts` (replace `updateUnits` placeholder with movement; combat lands in Task 7)
- Test: `tests/sim/movement.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/movement.test.ts
import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { STARTER_DECK, getCard } from '../../src/sim/cards'
import { RIVER_Y, LANE_LEFT_X } from '../../src/sim/constants'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]

describe('movement', () => {
  it('a unit advances toward the river bridge of its lane, then crosses', () => {
    let s = createMatch(1, decks)
    s = step(s, [{ tick: 0, player: 0, cardId: 'jeet-horde', x: 3, y: 8 }])
    const startY = s.units[0].y
    for (let i = 0; i < 40; i++) s = step(s, [])
    const u = s.units[0]
    expect(u.y).toBeGreaterThan(startY)              // marching up
    expect(Math.abs(u.x - LANE_LEFT_X)).toBeLessThan(3) // pulled toward left bridge
    // keep stepping until it crosses (enemy tower fire kills it later — stop at the crossing)
    let crossed = false
    for (let i = 0; i < 300 && !crossed; i++) {
      s = step(s, [])
      crossed = s.units.length > 0 && s.units[0].y > RIVER_Y
    }
    expect(crossed).toBe(true)
  })
  it('speed stat is respected (fast unit outruns slow unit)', () => {
    let s = createMatch(1, decks)
    // both cards are in the starting hand and affordable together (2 + 1 <= 5 elixir)
    s = step(s, [
      { tick: 0, player: 0, cardId: 'jeet-horde', x: 4.5, y: 8 },
      { tick: 0, player: 0, cardId: 'bag-holder', x: 4.5, y: 8 },
    ])
    for (let i = 0; i < 30; i++) s = step(s, [])
    const fast = s.units.find(u => u.cardId === 'jeet-horde')!  // speed 0.16
    const slow = s.units.find(u => u.cardId === 'bag-holder')!  // speed 0.10
    expect(fast.y).toBeGreaterThan(slow.y)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sim/movement.test.ts` — Expected: FAIL (units never move).

- [ ] **Step 3: Implement movement inside updateUnits**

Replace the `updateUnits` placeholder in `src/sim/sim.ts`:

```ts
function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Nearest enemy tower that is still standing (lane towers shield the king implicitly by distance). */
function nearestEnemyTower(s: SimState, u: UnitEntity): Tower | null {
  let best: Tower | null = null
  for (const t of s.towers) {
    if (t.owner === u.owner || t.hp <= 0) continue
    if (!best || dist(u, t) < dist(u, best) || (dist(u, t) === dist(u, best) && t.id < best.id)) best = t
  }
  return best
}

function crossedRiver(u: UnitEntity): boolean {
  return u.owner === 0 ? u.y > RIVER_Y : u.y < RIVER_Y
}

/** Where this unit wants to walk when it has no combat target in range. */
function moveGoal(s: SimState, u: UnitEntity): { x: number; y: number } {
  if (u.fleeing) {
    const king = s.towers.find(t => t.owner === u.owner && t.kind === 'king')!
    return { x: king.x, y: king.y }
  }
  if (!crossedRiver(u)) {
    const bridgeX = u.x < ARENA_W / 2 ? LANE_LEFT_X : LANE_RIGHT_X
    if (dist(u, { x: bridgeX, y: RIVER_Y }) > 0.6) return { x: bridgeX, y: RIVER_Y }
  }
  const t = nearestEnemyTower(s, u)
  return t ?? { x: ARENA_W / 2, y: u.owner === 0 ? ARENA_H : 0 }
}

function moveToward(u: UnitEntity, goal: { x: number; y: number }, speed: number) {
  const d = dist(u, goal)
  if (d < 1e-6) return
  const stepLen = Math.min(speed, d)
  u.x += ((goal.x - u.x) / d) * stepLen
  u.y += ((goal.y - u.y) / d) * stepLen
}

function updateUnits(s: SimState) {
  for (const u of s.units) {
    const card = getCard(u.cardId)
    // Task 7 adds targeting/attack before movement; for now: walk
    moveToward(u, moveGoal(s, u), card.speed!)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sim/movement.test.ts` — Expected: PASS. Full suite: `npx vitest run` green.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): unit movement with bridge waypoints"
```

---

### Task 7: Targeting + combat (auras, stealth, flee, lowest-HP targeting, splash)

**Files:**
- Modify: `src/sim/sim.ts` (extend `updateUnits` with targeting/attack; add aura helpers)
- Test: `tests/sim/combat.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/combat.test.ts
import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { getCard } from '../../src/sim/cards'
import type { SimState, UnitEntity, PlayerId } from '../../src/sim/types'

// Hand-place units to isolate combat from deploy/elixir rules.
function place(s: SimState, cardId: string, owner: PlayerId, x: number, y: number, hpOverride?: number): UnitEntity {
  const card = getCard(cardId)
  const u: UnitEntity = {
    id: s.nextId++, owner, cardId, x, y,
    hp: hpOverride ?? card.hp!, maxHp: card.hp!,
    cooldown: 0, fleeing: false,
    revealed: card.stealthRange === undefined, buffUntil: 0,
  }
  s.units.push(u)
  return u
}
const fresh = () => {
  const deck = ['bag-holder','jeet-horde','paper-hands','chad-trader','diamond-hands','mev-bots','pump-signal','liquidation-cascade']
  return createMatch(1, [[...deck], [...deck]])
}

describe('combat', () => {
  it('adjacent enemies fight; attacker respects attackSpeed cooldown', () => {
    let s = fresh()
    place(s, 'chad-trader', 0, 9, 15)
    place(s, 'bag-holder', 1, 9.5, 15)
    const hpBefore = s.units[1].hp
    s = step(s, [])
    expect(s.units[1].hp).toBe(hpBefore - getCard('chad-trader').damage!)
    const hpAfterFirst = s.units[1].hp
    s = step(s, []) // cooldown active: no second hit yet
    expect(s.units[1].hp).toBe(hpAfterFirst)
  })
  it('dead units are removed', () => {
    let s = fresh()
    place(s, 'chad-trader', 0, 9, 15)
    place(s, 'jeet-horde', 1, 9.5, 15, 10) // one hit kills
    s = step(s, [])
    expect(s.units.length).toBe(1)
  })
  it('lowestHp targeting picks the weakest enemy in attack range, not the closest', () => {
    let s = fresh()
    place(s, 'mev-bots', 0, 9, 15)
    place(s, 'bag-holder', 1, 9.5, 15)                    // closest (0.5), full hp
    const weak = place(s, 'chad-trader', 1, 9.6, 15, 20)  // slightly farther (0.6), nearly dead
    s = step(s, [])
    // mev damage 25 kills the weak unit; nearest-targeting would have hit bag-holder instead
    expect(s.units.find(u => u.id === weak.id)).toBeUndefined()
    expect(s.units.find(u => u.cardId === 'bag-holder' && u.owner === 1)!.hp).toBe(getCard('bag-holder').hp)
  })
  it('Paper Hands flees below 30% hp and stops fighting', () => {
    let s = fresh()
    const ph = place(s, 'paper-hands', 0, 9, 15, Math.floor(280 * 0.2))
    place(s, 'bag-holder', 1, 9.5, 15)
    s = step(s, [])
    const fled = s.units.find(u => u.id === ph.id)!
    expect(fled.fleeing).toBe(true)
    const yBefore = fled.y
    s = step(s, [])
    expect(s.units.find(u => u.id === ph.id)!.y).toBeLessThan(yBefore) // running home (down for player 0)
  })
  it('Rug Dev is untargetable until close, then revealed', () => {
    let s = fresh()
    const rug = place(s, 'rug-dev', 0, 9, 10)
    place(s, 'sniper-bot', 1, 9, 17) // sniper range 7.5 would normally hit y=10
    s = step(s, [])
    expect(s.units.find(u => u.id === rug.id)!.hp).toBe(getCard('rug-dev').hp!) // untouched while stealthed
    expect(s.units.find(u => u.id === rug.id)!.revealed).toBe(false)
    // both units converge on the right bridge -> they pass within stealthRange 3.5
    for (let i = 0; i < 120; i++) s = step(s, [])
    expect(s.units.find(u => u.id === rug.id)?.revealed ?? true).toBe(true)
  })
  it('Influencer aura boosts ally damage; FUD Spirit aura slows enemies', () => {
    let s = fresh()
    place(s, 'influencer', 0, 8, 15)
    place(s, 'chad-trader', 0, 9, 15)
    place(s, 'diamond-hands', 1, 9.5, 15)
    const hpBefore = s.units[2].hp
    s = step(s, [])
    const dealt = hpBefore - s.units.find(u => u.cardId === 'diamond-hands')!.hp
    // chad hits for round(90 * 1.35) = 122 (aura-boosted); influencer itself also attacks
    // (range 4.5 > its own 3.0 aura radius, self-buff excluded) for unboosted 40 -> 162 total
    expect(dealt).toBe(Math.round(getCard('chad-trader').damage! * 1.35) + getCard('influencer').damage!)

    let s2 = fresh()
    place(s2, 'fud-spirit', 0, 9, 15)
    const runner = place(s2, 'mev-bots', 1, 9, 16.5)
    const yBefore = runner.y
    s2 = step(s2, [])
    const moved = Math.abs(yBefore - s2.units.find(u => u.id === runner.id)!.y)
    expect(moved).toBeLessThan(getCard('mev-bots').speed!) // slowed below base speed
  })
  it('Whale splash hits multiple clumped enemies', () => {
    let s = fresh()
    place(s, 'whale', 0, 9, 12)
    place(s, 'jeet-horde', 1, 9, 16)
    place(s, 'jeet-horde', 1, 9.5, 16)
    s = step(s, [])
    // whale damage 200 one-shots both 90hp jeets via splash (radius 1.5 covers both)
    expect(s.units.filter(u => u.owner === 1).length).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sim/combat.test.ts` — Expected: FAIL (no attacks happen).

- [ ] **Step 3: Implement targeting + attack in updateUnits**

Replace `updateUnits` (and add helpers) in `src/sim/sim.ts`:

```ts
/** Damage multiplier from friendly Influencer auras + own pump-signal buff. */
function damageMult(s: SimState, u: UnitEntity): number {
  let m = 1
  for (const ally of s.units) {
    if (ally.owner !== u.owner || ally.id === u.id) continue
    const aura = getCard(ally.cardId).aura
    if (aura?.damageMult && dist(u, ally) <= aura.radius) m *= aura.damageMult
  }
  if (u.buffUntil > s.tick) m *= getCard('pump-signal').buffDamageMult!
  return m
}

/** Speed multiplier from enemy FUD auras + own pump-signal buff. */
function speedMult(s: SimState, u: UnitEntity): number {
  let m = 1
  for (const enemy of s.units) {
    if (enemy.owner === u.owner) continue
    const aura = getCard(enemy.cardId).aura
    if (aura?.speedMult && dist(u, enemy) <= aura.radius) m *= aura.speedMult
  }
  if (u.buffUntil > s.tick) m *= getCard('pump-signal').buffSpeedMult!
  return m
}

function acquireTarget(s: SimState, u: UnitEntity): UnitEntity | null {
  const card = getCard(u.cardId)
  const candidates = s.units.filter(e => e.owner !== u.owner && e.revealed && dist(u, e) <= card.sightRange!)
  if (candidates.length === 0) return null
  if (card.targeting === 'lowestHp') {
    return candidates.reduce((a, b) => (b.hp < a.hp || (b.hp === a.hp && b.id < a.id)) ? b : a)
  }
  return candidates.reduce((a, b) => (dist(u, b) < dist(u, a) || (dist(u, b) === dist(u, a) && b.id < a.id)) ? b : a)
}

function dealDamage(s: SimState, attacker: UnitEntity, target: UnitEntity, card = getCard(attacker.cardId)) {
  const dmg = Math.round(card.damage! * damageMult(s, attacker))
  if (card.splashRadius) {
    for (const e of s.units) {
      if (e.owner !== attacker.owner && dist(target, e) <= card.splashRadius) e.hp -= dmg
    }
  } else {
    target.hp -= dmg
  }
  attacker.revealed = true // attacking breaks stealth
}

function updateUnits(s: SimState) {
  // stealth reveal pass: any enemy (unit or tower) within stealthRange reveals
  for (const u of s.units) {
    const sr = getCard(u.cardId).stealthRange
    if (sr === undefined || u.revealed) continue
    const enemyClose =
      s.units.some(e => e.owner !== u.owner && dist(u, e) <= sr) ||
      s.towers.some(t => t.owner !== u.owner && t.hp > 0 && dist(u, t) <= sr)
    if (enemyClose) u.revealed = true
  }

  for (const u of s.units) {
    const card = getCard(u.cardId)
    if (u.cooldown > 0) u.cooldown--

    // flee check (Paper Hands)
    if (card.flees && !u.fleeing && u.hp < FLEE_HP_RATIO * u.maxHp) u.fleeing = true
    if (u.fleeing) {
      moveToward(u, moveGoal(s, u), card.speed! * speedMult(s, u))
      continue
    }

    const target = acquireTarget(s, u)
    if (target && dist(u, target) <= card.range!) {
      if (u.cooldown === 0) {
        dealDamage(s, u, target)
        u.cooldown = card.attackSpeed!
      }
      continue // in combat: hold position
    }
    // tower in attack range? (units siege towers when nothing else is around)
    const tower = nearestEnemyTower(s, u)
    if (tower && dist(u, tower) <= card.range! + 0.8) {
      if (u.cooldown === 0) {
        tower.hp -= Math.round(card.damage! * damageMult(s, u))
        u.revealed = true
        u.cooldown = card.attackSpeed!
      }
      continue
    }
    const goal = target ?? moveGoal(s, u)
    moveToward(u, goal, card.speed! * speedMult(s, u))
  }

  // remove dead units (insertion order preserved)
  s.units = s.units.filter(u => u.hp > 0)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sim/combat.test.ts` — Expected: PASS. Full suite green: `npx vitest run`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): combat — targeting, auras, stealth, flee, splash"
```

---

### Task 8: Towers fight back, king activation, win conditions, overtime

**Files:**
- Modify: `src/sim/sim.ts` (replace `updateTowers` + `cleanupAndWinCheck` placeholders)
- Test: `tests/sim/win.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/win.test.ts
import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { STARTER_DECK } from '../../src/sim/cards'
import { MATCH_TICKS, OVERTIME_TICKS } from '../../src/sim/constants'
import type { SimState, PlayerId } from '../../src/sim/types'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]
const laneTower = (s: SimState, owner: PlayerId, i = 0) => s.towers.filter(t => t.owner === owner && t.kind === 'lane')[i]
const king = (s: SimState, owner: PlayerId) => s.towers.find(t => t.owner === owner && t.kind === 'king')!

describe('towers', () => {
  it('an active tower attacks a unit in range', () => {
    let s = createMatch(1, decks)
    // chad-trader (420hp) survives tower hits long enough to observe the damage
    s = step(s, [{ tick: 0, player: 0, cardId: 'chad-trader', x: 4.5, y: 14 }])
    let damaged = false
    for (let i = 0; i < 900 && !damaged && s.units.length > 0; i++) {
      s = step(s, [])
      damaged = s.units.some(u => u.hp < u.maxHp)
    }
    expect(damaged).toBe(true)
  })
  it('king activates when a lane tower falls', () => {
    let s = createMatch(1, decks)
    const lt = laneTower(s, 1)
    lt.hp = 1
    // liquidation-cascade is castable anywhere: 180 * 0.5 tower damage finishes it instantly
    s = step(s, [{ tick: 0, player: 0, cardId: 'liquidation-cascade', x: lt.x, y: lt.y }])
    expect(laneTower(s, 1).hp).toBeLessThanOrEqual(0)
    expect(king(s, 1).active).toBe(true)
  })
  it('king destruction ends the match immediately', () => {
    let s = createMatch(1, decks)
    const k = king(s, 1)
    k.hp = 1
    s = step(s, [{ tick: 0, player: 0, cardId: 'liquidation-cascade', x: k.x, y: k.y }])
    expect(s.result).toEqual({ winner: 0, reason: 'king' })
  })
  it('at full time, more crowns wins', () => {
    let s = createMatch(1, decks)
    laneTower(s, 1).hp = 0
    s.tick = MATCH_TICKS - 1
    s = step(s, [])
    expect(s.result).toEqual({ winner: 0, reason: 'crowns' })
  })
  it('tie at full time enters overtime; tower-damage tiebreak ends it after overtime', () => {
    let s = createMatch(1, decks)
    s.tick = MATCH_TICKS - 1
    s = step(s, [])
    expect(s.result).toBeNull()
    expect(s.overtime).toBe(true)
    // player 0 chipped the enemy tower more
    laneTower(s, 1).hp -= 500
    laneTower(s, 0).hp -= 100
    s.tick = MATCH_TICKS + OVERTIME_TICKS - 1
    s = step(s, [])
    expect(s.result).toEqual({ winner: 0, reason: 'tiebreak' })
  })
  it('perfect tie is a draw', () => {
    let s = createMatch(1, decks)
    s.tick = MATCH_TICKS - 1
    s = step(s, [])
    s.tick = MATCH_TICKS + OVERTIME_TICKS - 1
    s = step(s, [])
    expect(s.result).toEqual({ winner: null, reason: 'draw' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sim/win.test.ts` — Expected: FAIL (towers inert, no result ever set).

- [ ] **Step 3: Implement**

Replace the two placeholders in `src/sim/sim.ts`:

```ts
function updateTowers(s: SimState) {
  for (const t of s.towers) {
    if (t.hp <= 0 || !t.active) continue
    if (t.cooldown > 0) { t.cooldown--; continue }
    const stats = TOWER_STATS[t.kind]
    let target: UnitEntity | null = null
    for (const u of s.units) {
      if (u.owner === t.owner || !u.revealed) continue
      if (dist(t, u) > stats.range) continue
      if (!target || dist(t, u) < dist(t, target) || (dist(t, u) === dist(t, target) && u.id < target.id)) target = u
    }
    if (target) {
      target.hp -= stats.damage
      t.cooldown = stats.attackSpeed
    }
  }
  s.units = s.units.filter(u => u.hp > 0)
}

function crownsTaken(s: SimState, by: PlayerId): number {
  return s.towers.filter(t => t.owner !== by && t.hp <= 0).length
}

function towerDamageDealt(s: SimState, by: PlayerId): number {
  return s.towers.filter(t => t.owner !== by).reduce((sum, t) => sum + (t.maxHp - Math.max(0, t.hp)), 0)
}

function cleanupAndWinCheck(s: SimState) {
  // king wake-up: lane tower down, or king took damage
  for (const owner of [0, 1] as const) {
    const k = s.towers.find(t => t.owner === owner && t.kind === 'king')!
    if (!k.active && (k.hp < k.maxHp || s.towers.some(t => t.owner === owner && t.kind === 'lane' && t.hp <= 0))) {
      k.active = true
    }
  }
  // instant win: king destroyed
  for (const owner of [0, 1] as const) {
    if (s.towers.find(t => t.owner === owner && t.kind === 'king')!.hp <= 0) {
      s.result = { winner: (1 - owner) as PlayerId, reason: 'king' }
      return
    }
  }
  // full time
  if (!s.overtime && s.tick === MATCH_TICKS - 1) {
    const c0 = crownsTaken(s, 0), c1 = crownsTaken(s, 1)
    if (c0 !== c1) { s.result = { winner: c0 > c1 ? 0 : 1, reason: 'crowns' }; return }
    s.overtime = true
    return
  }
  // overtime: first crown wins (checked via crowns diff), else damage tiebreak at the end
  if (s.overtime) {
    const c0 = crownsTaken(s, 0), c1 = crownsTaken(s, 1)
    if (c0 !== c1) { s.result = { winner: c0 > c1 ? 0 : 1, reason: 'crowns' }; return }
    if (s.tick >= MATCH_TICKS + OVERTIME_TICKS - 1) {
      const d0 = towerDamageDealt(s, 0), d1 = towerDamageDealt(s, 1)
      s.result = d0 === d1
        ? { winner: null, reason: 'draw' }
        : { winner: d0 > d1 ? 0 : 1, reason: 'tiebreak' }
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sim/win.test.ts` — Expected: PASS. Full suite green.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): tower combat, king activation, win/overtime/tiebreak"
```

---

### Task 9: Spells

**Files:**
- Modify: `src/sim/sim.ts` (replace `castSpell` stub)
- Test: `tests/sim/spells.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/spells.test.ts
import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { STARTER_DECK, getCard } from '../../src/sim/cards'
import { SPELL_TOWER_DAMAGE_MULT } from '../../src/sim/constants'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]

describe('liquidation-cascade', () => {
  it('damages enemy units in radius, allies unharmed, towers take half', () => {
    let s = createMatch(1, decks)
    s = step(s, [{ tick: 0, player: 1, cardId: 'jeet-horde', x: 4.5, y: 25 }])
    const towerBefore = s.towers.find(t => t.owner === 1 && t.kind === 'lane')!.hp
    s = step(s, [{ tick: 1, player: 0, cardId: 'liquidation-cascade', x: 4.5, y: 25.2 }])
    const spell = getCard('liquidation-cascade')
    // 180 damage one-shots all three 90hp jeets in the radius
    expect(s.units.length).toBe(0)
    const tower = s.towers.find(t => t.owner === 1 && t.kind === 'lane' && t.x === 4.5)!
    expect(towerBefore - tower.hp).toBe(Math.round(spell.effectDamage! * SPELL_TOWER_DAMAGE_MULT))
  })
})

describe('pump-signal', () => {
  it('buffs friendly units in radius for buffTicks', () => {
    let s = createMatch(1, decks)
    s = step(s, [{ tick: 0, player: 0, cardId: 'jeet-horde', x: 9, y: 8 }])
    s = step(s, [{ tick: 1, player: 0, cardId: 'pump-signal', x: 9, y: 8 }])
    const spell = getCard('pump-signal')
    for (const u of s.units) expect(u.buffUntil).toBe(1 + spell.buffTicks!)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sim/spells.test.ts` — Expected: FAIL (castSpell is a no-op).

- [ ] **Step 3: Implement castSpell**

Replace the stub in `src/sim/sim.ts`:

```ts
import type { CardDef } from './types' // add to existing type import

function castSpell(s: SimState, cmd: DeployCommand, card: CardDef) {
  const at = { x: cmd.x, y: cmd.y }
  if (card.effectDamage) {
    for (const u of s.units) {
      if (u.owner !== cmd.player && dist(at, u) <= card.effectRadius!) u.hp -= card.effectDamage
    }
    for (const t of s.towers) {
      if (t.owner !== cmd.player && t.hp > 0 && dist(at, t) <= card.effectRadius!) {
        t.hp -= Math.round(card.effectDamage * SPELL_TOWER_DAMAGE_MULT)
      }
    }
    s.units = s.units.filter(u => u.hp > 0)
  }
  if (card.buffTicks) {
    for (const u of s.units) {
      if (u.owner === cmd.player && dist(at, u) <= card.effectRadius!) u.buffUntil = s.tick + card.buffTicks
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sim/spells.test.ts` — PASS. Full suite green.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): spells — liquidation cascade + pump signal"
```

---

### Task 10: Replay record + deterministic re-simulation (golden replay)

**Files:**
- Create: `src/sim/replay.ts`
- Test: `tests/sim/replay.test.ts`

This is the anti-cheat foundation for Plan 3 (server re-simulates client replays), so it gets its own hardened test.

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/replay.test.ts
import { describe, it, expect } from 'vitest'
import { runReplay, fingerprint } from '../../src/sim/replay'
import { STARTER_DECK } from '../../src/sim/cards'
import type { Replay } from '../../src/sim/types'

const golden: Replay = {
  seed: 1337,
  decks: [[...STARTER_DECK], [...STARTER_DECK]],
  commands: [
    { tick: 10,  player: 0, cardId: 'jeet-horde',    x: 4.5, y: 10 },
    { tick: 12,  player: 1, cardId: 'chad-trader',   x: 4.5, y: 22 },
    { tick: 80,  player: 0, cardId: 'diamond-hands', x: 13.5, y: 10 },
    { tick: 90,  player: 1, cardId: 'mev-bots',      x: 13.5, y: 22 },
    { tick: 200, player: 0, cardId: 'liquidation-cascade', x: 4.5, y: 22 },
    { tick: 300, player: 1, cardId: 'jeet-horde',    x: 9, y: 24 },
    { tick: 450, player: 0, cardId: 'pump-signal',   x: 13.5, y: 14 },
  ],
}

describe('replay determinism', () => {
  it('two runs of the same replay produce identical state fingerprints', () => {
    const a = runReplay(golden)
    const b = runReplay(golden)
    expect(fingerprint(a)).toBe(fingerprint(b))
  })
  it('replays always terminate with a result', () => {
    const final = runReplay(golden)
    expect(final.result).not.toBeNull()
  })
  it('a tampered command changes the fingerprint', () => {
    const tampered: Replay = structuredClone(golden)
    tampered.commands[0].x = 13.5
    expect(fingerprint(runReplay(tampered))).not.toBe(fingerprint(runReplay(golden)))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sim/replay.test.ts` — Expected: FAIL (no replay.ts).

- [ ] **Step 3: Implement**

```ts
// src/sim/replay.ts
import { createMatch, step } from './sim'
import { MATCH_TICKS, OVERTIME_TICKS } from './constants'
import type { Replay, SimState } from './types'

/** Re-simulate a full replay to its terminal state. Hard cap prevents infinite loops on bad input. */
export function runReplay(replay: Replay): SimState {
  let s = createMatch(replay.seed, [[...replay.decks[0]], [...replay.decks[1]]])
  const byTick = new Map<number, Replay['commands']>()
  for (const c of replay.commands) {
    if (!byTick.has(c.tick)) byTick.set(c.tick, [])
    byTick.get(c.tick)!.push(c)
  }
  const cap = MATCH_TICKS + OVERTIME_TICKS + 10
  while (!s.result && s.tick < cap) {
    s = step(s, byTick.get(s.tick) ?? [])
  }
  return s
}

/** Stable digest of everything gameplay-relevant. Two honest runs MUST match byte-for-byte. */
export function fingerprint(s: SimState): string {
  const parts: string[] = [`t${s.tick}`, `r${s.result?.winner ?? 'x'}:${s.result?.reason ?? 'none'}`]
  for (const t of s.towers) parts.push(`T${t.id}:${t.hp}`)
  for (const u of s.units) parts.push(`U${u.id}:${u.cardId}:${u.hp}:${u.x.toFixed(4)}:${u.y.toFixed(4)}`)
  parts.push(`e${s.elixir[0].toFixed(4)}:${s.elixir[1].toFixed(4)}`)
  return parts.join('|')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sim/replay.test.ts` — Expected: PASS. Full suite green.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): replay re-simulation + determinism fingerprint"
```

---

### Task 11: AI policy + difficulty ladder configs

**Files:**
- Create: `src/sim/ai.ts`
- Test: `tests/sim/ai.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/ai.test.ts
import { describe, it, expect } from 'vitest'
import { aiCommands, AI_LEVELS } from '../../src/sim/ai'
import { createMatch, step, runMatchVsAi } from '../../src/sim/ai'
import { STARTER_DECK } from '../../src/sim/cards'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]

describe('aiCommands', () => {
  it('does nothing off its think tick', () => {
    const s = createMatch(1, decks)
    s.tick = 1 // thinkEvery >= 10 for all levels
    expect(aiCommands(s, 1, AI_LEVELS[0])).toEqual([])
  })
  it('defends: plays a unit in front of an enemy on its half', () => {
    let s = createMatch(1, decks)
    s.elixir[1] = 10
    s = step(s, [{ tick: 0, player: 0, cardId: 'jeet-horde', x: 4.5, y: 10 }])
    // teleport threat onto AI half to trigger defense
    for (const u of s.units) u.y = 22
    s.tick = AI_LEVELS[0].thinkEvery // a think tick
    const cmds = aiCommands(s, 1, AI_LEVELS[0])
    expect(cmds.length).toBe(1)
    expect(cmds[0].player).toBe(1)
    expect(cmds[0].y).toBeGreaterThan(22) // between threat and own king
  })
  it('attacks when saved up: plays its most expensive unit at the bridge', () => {
    const s = createMatch(1, decks)
    s.elixir[1] = 10
    s.tick = AI_LEVELS[0].thinkEvery
    const cmds = aiCommands(s, 1, AI_LEVELS[0])
    expect(cmds.length).toBe(1)
  })
  it('is deterministic', () => {
    const s = createMatch(7, decks)
    s.elixir[1] = 10
    s.tick = AI_LEVELS[0].thinkEvery
    expect(aiCommands(s, 1, AI_LEVELS[0])).toEqual(aiCommands(s, 1, AI_LEVELS[0]))
  })
})

describe('full AI-vs-AI match (integration)', () => {
  it('completes with a result and no crash at every level', () => {
    for (const level of AI_LEVELS) {
      const final = runMatchVsAi(42, decks, level, level)
      expect(final.result).not.toBeNull()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sim/ai.test.ts` — Expected: FAIL (no ai.ts).

- [ ] **Step 3: Implement**

```ts
// src/sim/ai.ts
import { createMatch, step, handOf, validateDeploy } from './sim'
import { getCard } from './cards'
import { ARENA_H, RIVER_Y, LANE_LEFT_X, LANE_RIGHT_X } from './constants'
import type { DeployCommand, PlayerId, SimState } from './types'

export { createMatch, step } // re-export for test convenience

export interface AiLevel {
  name: string
  thinkEvery: number  // ticks between decisions (reaction speed)
  attackAt: number    // elixir threshold to start a push
}

export const AI_LEVELS: AiLevel[] = [
  { name: 'Paper Trader', thinkEvery: 30, attackAt: 9 },
  { name: 'Day Trader',   thinkEvery: 20, attackAt: 8 },
  { name: 'Quant',        thinkEvery: 15, attackAt: 8 },
  { name: 'Whale Desk',   thinkEvery: 10, attackAt: 7 },
  { name: 'Insider',      thinkEvery: 10, attackAt: 6 },
]

export function aiCommands(s: SimState, player: PlayerId, level: AiLevel): DeployCommand[] {
  if (s.tick === 0 || s.tick % level.thinkEvery !== 0 || s.result) return []
  const hand = handOf(s, player)
  const affordableUnits = hand
    .map(getCard)
    .filter(c => c.type === 'unit' && c.cost <= s.elixir[player])
    .sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))
  if (affordableUnits.length === 0) return []

  const ownHalf = (y: number) => (player === 0 ? y < RIVER_Y : y > RIVER_Y)
  const threats = s.units.filter(u => u.owner !== player && ownHalf(u.y))

  let cmd: DeployCommand | null = null
  if (threats.length > 0) {
    // defend: cheapest unit directly between the nearest threat and our king
    const threat = threats.reduce((a, b) => {
      const ka = player === 0 ? a.y : ARENA_H - a.y
      const kb = player === 0 ? b.y : ARENA_H - b.y
      return kb < ka || (kb === ka && b.id < a.id) ? b : a
    })
    const y = player === 0 ? Math.max(1, threat.y - 2) : Math.min(ARENA_H - 1, threat.y + 2)
    cmd = { tick: s.tick, player, cardId: affordableUnits[0].id, x: threat.x, y }
  } else if (s.elixir[player] >= level.attackAt) {
    // push: most expensive affordable unit at the left/right bridge (alternate by tick for variety, still deterministic)
    const best = affordableUnits[affordableUnits.length - 1]
    const x = (s.tick / level.thinkEvery) % 2 === 0 ? LANE_LEFT_X : LANE_RIGHT_X
    const y = player === 0 ? RIVER_Y - 2 : RIVER_Y + 2
    cmd = { tick: s.tick, player, cardId: best.id, x, y }
  }
  if (cmd && validateDeploy(s, cmd)) return [cmd]
  return []
}

/** Headless full match, both sides AI — used by tests and balance checks. */
export function runMatchVsAi(
  seed: number,
  decks: [string[], string[]],
  level0: AiLevel,
  level1: AiLevel,
): SimState {
  let s = createMatch(seed, [[...decks[0]], [...decks[1]]])
  while (!s.result && s.tick < 3000) {
    s = step(s, [...aiCommands(s, 0, level0), ...aiCommands(s, 1, level1)])
  }
  return s
}
```

Export `handOf` and `validateDeploy` from `src/sim/sim.ts` if not already (they are, from Task 5).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sim/ai.test.ts` — Expected: PASS. Full suite green.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): deterministic AI policy + 5-level ladder configs"
```

---

### Task 12: Ladder progression (pure logic, storage-injected)

**Files:**
- Create: `src/game/ladder.ts`
- Test: `tests/game/ladder.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/game/ladder.test.ts
import { describe, it, expect } from 'vitest'
import { Ladder } from '../../src/game/ladder'
import { AI_LEVELS } from '../../src/sim/ai'

function memStorage(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: k => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: k => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() { return m.size },
  } as Storage
}

describe('Ladder', () => {
  it('starts at level 0', () => {
    const l = new Ladder(memStorage())
    expect(l.levelIndex()).toBe(0)
    expect(l.currentLevel()).toBe(AI_LEVELS[0])
  })
  it('a win advances, capped at the top level', () => {
    const l = new Ladder(memStorage())
    for (let i = 0; i < AI_LEVELS.length + 3; i++) l.recordWin()
    expect(l.levelIndex()).toBe(AI_LEVELS.length - 1)
  })
  it('a loss never goes below 0 and drops one level', () => {
    const l = new Ladder(memStorage())
    l.recordLoss()
    expect(l.levelIndex()).toBe(0)
    l.recordWin(); l.recordWin(); l.recordLoss()
    expect(l.levelIndex()).toBe(1)
  })
  it('persists across instances sharing storage', () => {
    const storage = memStorage()
    new Ladder(storage).recordWin()
    expect(new Ladder(storage).levelIndex()).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/game/ladder.test.ts` — Expected: FAIL (no ladder.ts).

- [ ] **Step 3: Implement**

```ts
// src/game/ladder.ts
import { AI_LEVELS, type AiLevel } from '../sim/ai'

const KEY = 'trench-wars-ladder-level'

/** Storage injected so tests run in Node; browser passes window.localStorage. */
export class Ladder {
  constructor(private storage: Storage) {}

  levelIndex(): number {
    const raw = this.storage.getItem(KEY)
    const n = raw === null ? 0 : parseInt(raw, 10)
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), AI_LEVELS.length - 1) : 0
  }

  currentLevel(): AiLevel {
    return AI_LEVELS[this.levelIndex()]
  }

  recordWin(): void {
    this.storage.setItem(KEY, String(Math.min(this.levelIndex() + 1, AI_LEVELS.length - 1)))
  }

  recordLoss(): void {
    this.storage.setItem(KEY, String(Math.max(this.levelIndex() - 1, 0)))
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/game/ladder.test.ts` — PASS. Full suite green.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): AI ladder progression with injected storage"
```

---

### Task 13: Phaser BattleScene — render sim, input, HUD, result overlay

**Files:**
- Create: `src/game/BattleScene.ts`
- Modify: `src/main.ts` (replace placeholder)

No unit test for rendering (verified by the Task 14 smoke test + manual play). Keep ALL game rules in the sim — this scene only converts time→ticks, draws state, and forwards input as `DeployCommand`s.

- [ ] **Step 1: Implement BattleScene**

```ts
// src/game/BattleScene.ts
import Phaser from 'phaser'
import { createMatch, step, handOf, validateDeploy } from '../sim/sim'
import { aiCommands } from '../sim/ai'
import { getCard, STARTER_DECK } from '../sim/cards'
import { ARENA_H, ARENA_W, ELIXIR_MAX, MATCH_TICKS, OVERTIME_TICKS, RIVER_Y, TICK_MS } from '../sim/constants'
import { Ladder } from './ladder'
import type { DeployCommand, SimState } from '../sim/types'

const TILE = 30
export const GAME_W = ARENA_W * TILE          // 540
export const ARENA_PX_H = ARENA_H * TILE      // 960
const HUD_H = 150
export const GAME_H = ARENA_PX_H + HUD_H      // 1110

const P0_COLOR = 0x2bff88
const P1_COLOR = 0xff4d5e

// sim y grows upward for player 0; screen y grows downward
const sx = (x: number) => x * TILE
const sy = (y: number) => ARENA_PX_H - y * TILE

export class BattleScene extends Phaser.Scene {
  private sim!: SimState
  private ladder!: Ladder
  private gfx!: Phaser.GameObjects.Graphics
  private hudText!: Phaser.GameObjects.Text
  private cardTexts: Phaser.GameObjects.Text[] = []
  private acc = 0
  private selectedCard = 0
  private pending: DeployCommand[] = []
  private over = false

  constructor() { super('battle') }

  create() {
    this.ladder = new Ladder(window.localStorage)
    this.startMatch()
    this.gfx = this.add.graphics()
    this.hudText = this.add.text(8, ARENA_PX_H + 6, '', { fontFamily: 'monospace', fontSize: '15px', color: '#e6f0ff' })
    for (let i = 0; i < 4; i++) {
      const t = this.add.text(10 + i * 132, ARENA_PX_H + 64, '', {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
        backgroundColor: '#1c2740', padding: { x: 8, y: 14 }, fixedWidth: 122, align: 'center',
      }).setInteractive()
      t.on('pointerdown', () => { this.selectedCard = i })
      this.cardTexts.push(t)
    }
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onArenaClick(p))
    ;(window as any).__TRENCH_READY__ = true
  }

  private startMatch() {
    this.sim = createMatch(Date.now() >>> 0, [[...STARTER_DECK], [...STARTER_DECK]])
    this.acc = 0
    this.pending = []
    this.over = false
  }

  private onArenaClick(p: Phaser.Input.Pointer) {
    if (this.over) { this.startMatch(); return }
    if (p.y >= ARENA_PX_H) return // HUD clicks handled by card texts
    const hand = handOf(this.sim, 0)
    const cmd: DeployCommand = {
      tick: this.sim.tick,
      player: 0,
      cardId: hand[this.selectedCard],
      x: p.x / TILE,
      y: (ARENA_PX_H - p.y) / TILE,
    }
    if (validateDeploy(this.sim, cmd)) this.pending.push(cmd)
  }

  update(_time: number, delta: number) {
    if (!this.over) {
      this.acc += delta
      while (this.acc >= TICK_MS && !this.sim.result) {
        const cmds = [...this.pending, ...aiCommands(this.sim, 1, this.ladder.currentLevel())]
        this.pending = []
        // retag queued player commands to the current tick
        for (const c of cmds) c.tick = this.sim.tick
        this.sim = step(this.sim, cmds)
        this.acc -= TICK_MS
      }
      if (this.sim.result && !this.over) {
        this.over = true
        if (this.sim.result.winner === 0) this.ladder.recordWin()
        else if (this.sim.result.winner === 1) this.ladder.recordLoss()
      }
    }
    this.draw()
  }

  private draw() {
    const g = this.gfx
    g.clear()
    // arena halves + river + bridges
    g.fillStyle(0x12351f).fillRect(0, sy(RIVER_Y), GAME_W, ARENA_PX_H - sy(RIVER_Y))
    g.fillStyle(0x351212).fillRect(0, 0, GAME_W, sy(RIVER_Y))
    g.fillStyle(0x1b4965).fillRect(0, sy(RIVER_Y) - 9, GAME_W, 18)
    g.fillStyle(0x6b4f2a)
    g.fillRect(sx(4.5) - 27, sy(RIVER_Y) - 9, 54, 18)
    g.fillRect(sx(13.5) - 27, sy(RIVER_Y) - 9, 54, 18)
    // towers with hp bars
    for (const t of this.sim.towers) {
      if (t.hp <= 0) continue
      const size = t.kind === 'king' ? 54 : 42
      g.fillStyle(t.owner === 0 ? P0_COLOR : P1_COLOR, t.active ? 1 : 0.45)
      g.fillRect(sx(t.x) - size / 2, sy(t.y) - size / 2, size, size)
      g.fillStyle(0x000000, 0.6).fillRect(sx(t.x) - size / 2, sy(t.y) - size / 2 - 9, size, 6)
      g.fillStyle(0xffe14d).fillRect(sx(t.x) - size / 2, sy(t.y) - size / 2 - 9, size * (t.hp / t.maxHp), 6)
    }
    // units
    for (const u of this.sim.units) {
      const r = 7 + Math.min(9, u.maxHp / 160)
      const alpha = u.revealed ? 1 : 0.35 // own stealth units show faded
      g.fillStyle(u.owner === 0 ? P0_COLOR : P1_COLOR, alpha)
      g.fillCircle(sx(u.x), sy(u.y), r)
      g.fillStyle(0x000000, 0.6).fillRect(sx(u.x) - r, sy(u.y) - r - 7, 2 * r, 4)
      g.fillStyle(0xffe14d).fillRect(sx(u.x) - r, sy(u.y) - r - 7, 2 * r * (u.hp / u.maxHp), 4)
    }
    // HUD background + elixir bar
    g.fillStyle(0x0a0e14).fillRect(0, ARENA_PX_H, GAME_W, HUD_H)
    g.fillStyle(0x232c44).fillRect(8, ARENA_PX_H + 34, GAME_W - 16, 16)
    g.fillStyle(0xb44dff).fillRect(8, ARENA_PX_H + 34, (GAME_W - 16) * (this.sim.elixir[0] / ELIXIR_MAX), 16)

    const remaining = Math.max(0, (this.sim.overtime ? MATCH_TICKS + OVERTIME_TICKS : MATCH_TICKS) - this.sim.tick)
    const secs = Math.ceil(remaining / 10)
    const level = this.ladder.currentLevel()
    this.hudText.setText(
      this.over
        ? `${this.sim.result!.winner === 0 ? 'VICTORY' : this.sim.result!.winner === 1 ? 'DEFEAT' : 'DRAW'} (${this.sim.result!.reason}) — click to play again`
        : `vs ${level.name}${this.sim.overtime ? '  OVERTIME' : ''}  ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}  elixir ${Math.floor(this.sim.elixir[0])}`
    )
    const hand = handOf(this.sim, 0)
    hand.forEach((id, i) => {
      const c = getCard(id)
      this.cardTexts[i]
        .setText(`${c.name}\n${c.cost} elixir`)
        .setBackgroundColor(i === this.selectedCard ? '#3e57a0' : '#1c2740')
        .setAlpha(this.sim.elixir[0] >= c.cost ? 1 : 0.45)
    })
  }
}
```

- [ ] **Step 2: Boot Phaser in main.ts**

```ts
// src/main.ts
import Phaser from 'phaser'
import { BattleScene, GAME_W, GAME_H } from './game/BattleScene'

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0a0e14',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BattleScene],
})
```

Note: `Date.now()` seeds the live match — that's fine, the *seed value* enters the sim; the sim itself stays deterministic per seed (replays carry the seed).

- [ ] **Step 3: Verify by playing**

Run: `npm run dev`, open the printed URL.
Expected: arena renders, clicking a card then the lower half deploys green units that march, fight red AI units, towers shoot, match ends with VICTORY/DEFEAT overlay, clicking restarts at the adjusted ladder level. Full suite still green: `npx vitest run`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): Phaser BattleScene — placeholder rendering, input, HUD, ladder loop"
```

---

### Task 14: Playwright boot smoke + README

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`, `README.md`

- [ ] **Step 1: Install Playwright**

```bash
npm i -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Write the smoke test**

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
  use: { baseURL: 'http://localhost:5173' },
})
```

```ts
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test'

test('game boots: canvas mounts and scene signals ready', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  await page.waitForFunction(() => (window as any).__TRENCH_READY__ === true, undefined, { timeout: 10_000 })
})
```

Add to `package.json` scripts: `"e2e": "playwright test"`.

- [ ] **Step 3: Run it**

Run: `npx playwright test`
Expected: 1 passed.

- [ ] **Step 4: Write README**

```markdown
# Trench Wars

Browser Clash Royale-style lane battler — Traders vs Jeets. Deterministic pure-TS sim + Phaser 4 client.

- `npm run dev` — play locally (AI ladder, placeholder art)
- `npm test` — sim unit tests (vitest)
- `npm run e2e` — Playwright boot smoke

Spec: `docs/superpowers/specs/2026-06-12-trench-wars-design.md` (monorepo root).
Status: Plan 1 (game core). Plan 2 = GLB→spritesheet art pipeline. Plan 3 = backend, async PvP, pump.fun token.
All game rules live in `src/sim/` (no Phaser imports there — enforced by review); balance lives in `src/sim/cards.json`.
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(trench-wars): Playwright boot smoke + README"
```

---

## Done criteria for Plan 1

- `npx vitest run` — all sim/game tests green (~30 tests across 8 files).
- `npx playwright test` — boot smoke green.
- A human can play a full match vs the AI ladder in the browser with placeholder art.
- `src/sim/` contains zero Phaser imports (grep check: `grep -r "phaser" src/sim/` → empty).

**Next plans (written after this executes):** Plan 2 — Meshy GLB → 8-direction spritesheet pipeline replacing placeholder circles; Plan 3 — Railway backend (accounts, Elo, async PvP, replay verification) + pump.fun token launch ops.




