# StreetRivalz — Plan 2: AI Racers, Items, and Quick Race

**Date:** 2026-06-12  
**Goal:** Player can run a full 6-kart Quick Race on Moonaco against AI, with items, item boxes, lap counting, and a results screen. Determinism + test coverage preserved.  
**Spec:** `docs/superpowers/specs/2026-06-12-street-rivalz-design.md`  
**Predecessor:** Plan 1 (drivable core) — must be complete.

---

## Architecture notes

- All new logic stays in `src/sim/` (pure TS, testable) until render wiring.
- AI is a function `aiInput(kart, raceContext) => KartInput`. It reads the same `KartState` the player does plus a lightweight `RaceContext`.
- Items are deterministic: effects modify `KartState` directly on the tick they resolve.
- Rubber-banding is a param multiplier, not a cheat — it keeps AI close but does not break physics.

---

## Task 2.1: Car roster — per-body KartParams + data file

**Files:**
- Create: `web3-games/street-rivalz/src/data/cars.ts`
- Test: `web3-games/street-rivalz/tests/data/cars.test.ts`

Implement:

```ts
// src/data/cars.ts
import { KartParams } from '../sim/kart'

export interface CarDef {
  id: string
  name: string
  archetype: string
  params: KartParams
  color: number // default body color for placeholder visual
}

export const CARS: CarDef[] = [
  {
    id: 'paper-scooter',
    name: 'Paper Hands Scooter',
    archetype: 'starter',
    params: { /* balanced-bad: lower accel/grip/top */ },
    color: 0xfacc15,
  },
  // ... Whale Limo, Jeet Tuk-Tuk, Diamond Hands Monster Truck, Rug Dev Getaway, MEV Bot F1
]

export function carById(id: string): CarDef {
  const c = CARS.find((c) => c.id === id)
  if (!c) throw new Error(`unknown car ${id}`)
  return c
}
```

Default kart becomes the Scooter. Each body tweaks KartParams in a way that is noticeable but still fair:

| Body | accel | maxSpeed | grip | driftGrip | driftSteerBonus | driftMinSpeed |
|---|---|---|---|---|---|---|
| Paper Scooter | 22 | 24 | 8 | 2.2 | 1.15 | 10 |
| Whale Limo | 20 | 28 | 9 | 2.0 | 1.05 | 11 |
| Jeet Tuk-Tuk | 30 | 25 | 6 | 2.6 | 1.35 | 9 |
| Diamond Hands | 24 | 25 | 11 | 1.9 | 1.05 | 12 |
| Rug Dev Getaway | 25 | 26 | 8.5 | 3.0 | 1.25 | 10 |
| MEV Bot F1 | 28 | 30 | 6.5 | 2.4 | 1.1 | 11 |

Tests: each car has valid params, ids unique, default scooter exists.

Commit: `feat(street-rivalz): car roster data + per-body KartParams`

---

## Task 2.2: AI path follower

**Files:**
- Create: `web3-games/street-rivalz/src/sim/ai.ts`
- Test: `web3-games/street-rivalz/tests/sim/ai.test.ts`

AI needs a target point on the track ahead of the kart. Add to track:

```ts
// src/sim/track.ts — add helper
export function pointAtProgress(track: Track, progress: number): Vec2 {
  // clamp/wrap progress, interpolate along centerline
}
```

AI logic:

```ts
export interface RaceContext {
  track: Track
  karts: KartState[]
  itemBoxes?: ItemBox[]
}

export function aiInput(k: KartState, ctx: RaceContext, skill: number = 0.8): KartInput {
  const lookAhead = 14 + len(k.vel) * 0.35
  const targetProgress = wrapProgress(k.progress + lookAhead, ctx.track.total)
  const target = pointAtProgress(ctx.track, targetProgress)
  const toTarget = sub(target, k.pos)
  const headingVec = v(Math.cos(k.heading), Math.sin(k.heading))
  const cross = headingVec.x * toTarget.y - headingVec.y * toTarget.x
  let steer = clamp(cross * 0.15, -1, 1)

  // throttle: full unless heading way off or sharp corner ahead
  const angleErr = Math.abs(Math.atan2(cross, dot(headingVec, toTarget)))
  let throttle = 1
  if (angleErr > 1.0) throttle = 0.4
  if (angleErr > 1.6) throttle = -0.4 // brake for hairpin

  // drift if turning hard and fast enough
  const drift = angleErr > 0.9 && len(k.vel) > k.params?.driftMinSpeed ?? 11

  // add small noise via skill seed? No — keep deterministic; vary skill via lookAhead/steer gain.
  return { throttle, steer, drift }
}
```

Tests:
- AI can complete a lap on SQUARE without getting stuck.
- AI keeps progress moving forward over 10s.

Commit: `feat(street-rivalz): AI path follower — target steering, throttle/brake, drift trigger`

---

## Task 2.3: AI drift + item-use decisions

**Files:**
- Modify: `web3-games/street-rivalz/src/sim/ai.ts`
- Test: `web3-games/street-rivalz/tests/sim/ai.test.ts` (append)

Extend AI to:
1. Hold drift while charge builds, release for boost when tier 2+ reached.
2. Use held item when it has a good target (e.g., Pump Rocket when someone ahead, Rug Pull when someone behind is close).
3. Avoid item boxes if already holding an item.

Add `heldItem` and `itemCooldown` to `KartState` (or a separate `RaceKart` state). For Plan 2, keep it simple: add to `KartState`.

Commit: `feat(street-rivalz): AI drift release + item usage decisions`

---

## Task 2.4: Rubber-banding

**Files:**
- Create: `web3-games/street-rivalz/src/sim/rubberband.ts`
- Test: `web3-games/street-rivalz/tests/sim/rubberband.test.ts`

Rubber-band multiplier based on rank:

```ts
export function rubberBandMultiplier(rank: number, total: number): number {
  // rank 0 = first place
  if (rank === 0) return 1.0        // honest front
  if (rank === total - 1) return 1.12 // last place catch-up
  return 1.0 + (rank / (total - 1)) * 0.10
}
```

Apply to AI accel and maxSpeed only (not player). Keep within test bounds.

Tests: multiplier ranges, front gets 1.0, last gets > 1.0.

Commit: `feat(street-rivalz): rubber-band multipliers by rank — honest front, catch-up back`

---

## Task 2.5: Items data model + effect framework

**Files:**
- Create: `web3-games/street-rivalz/src/data/items.ts`
- Create: `web3-games/street-rivalz/src/sim/items.ts`
- Test: `web3-games/street-rivalz/tests/sim/items.test.ts`

```ts
export type ItemType = 'pump-rocket' | 'rug-pull' | 'fud-cloud' | 'diamond-shield' | 'candle-boost' | 'liquidation-wave'

export interface ItemEffect {
  type: ItemType
  durationTicks?: number
  // effect-specific fields
}

export interface KartState {
  // ... existing fields
  heldItem?: ItemType
  shieldTicks: number
  spinoutTicks: number
  slowTicks: number
}
```

Effects:
- `candle-boost`: instant `boostTicks = 40` (tier 1.5)
- `diamond-shield`: `shieldTicks = 180`
- `pump-rocket`: hit kart ahead → spinout 90 ticks (unless shield)
- `rug-pull`: drop trap behind; kart hitting trap spins out 90 ticks (unless shield)
- `fud-cloud`: AoE slow cloud, 4s duration, slows karts inside
- `liquidation-wave`: all karts ahead spinout 60 ticks (unless shield)

Commit: `feat(street-rivalz): item data + effect framework (6 meme items)`

---

## Task 2.6: Item boxes + pickup/use system

**Files:**
- Modify: `web3-games/street-rivalz/src/sim/items.ts`
- Modify: `web3-games/street-rivalz/src/sim/race.ts`
- Test: `web3-games/street-rivalz/tests/sim/items.test.ts` (append)

Item boxes placed at fixed progress positions around track. Kart collects if within radius and no held item. Item given by weighted roll based on position.

```ts
export interface ItemBox {
  progress: number
  active: boolean
  respawnTicks: number
}
```

In `stepRace`, after kart step + constraints:
- check item box pickup
- resolve active effects (spinout, slow)
- if input has a `useItem` flag and kart has item, fire it

Add `useItem: boolean` to `KartInput`.

Commit: `feat(street-rivalz): item boxes, pickup, and use-item wiring`

---

## Task 2.7: Quick Race flow

**Files:**
- Create: `web3-games/street-rivalz/src/game/quickRace.ts`
- Test: `web3-games/street-rivalz/tests/game/quickRace.test.ts`

```ts
export interface QuickRace {
  race: RaceState
  countdownTicks: number // 180 = 3s
  results?: QuickRaceResult[]
}

export function createQuickRace(track: Track): QuickRace
export function stepQuickRace(qr: QuickRace, inputs: KartInput[], params?: KartParams[]): void
```

Countdown: no driving for 180 ticks, then race starts. Results sorted by progress when all finish or timeout (e.g., 60s).

Tests: countdown prevents movement, race starts after 180 ticks, results order correct.

Commit: `feat(street-rivalz): Quick Race flow — countdown, results, timeout`

---

## Task 2.8: Render AI karts, item boxes, held item HUD

**Files:**
- Modify: `web3-games/street-rivalz/src/render/trackMesh.ts` — add item box meshes
- Modify: `web3-games/street-rivalz/src/render/kartVisual.ts` — spinout visual (tilt), shield bubble
- Modify: `web3-games/street-rivalz/src/game/hud.ts` — show held item icon

Item box: rotating crate at each box position.
Shield: translucent sphere around kart.
Spinout: kart rocks/tips.

No tests — visual smoke only.

Commit: `feat(street-rivalz): render AI karts, item boxes, shield/spinout visuals, held-item HUD`

---

## Task 2.9: Main.ts Quick Race mode + reset

**Files:**
- Modify: `web3-games/street-rivalz/src/main.ts`

Replace single-kart race with Quick Race:
- 6 karts on grid, player is kart 0
- AI inputs for karts 1-5 each tick
- Item boxes from track
- HUD shows position, held item
- R resets to new Quick Race

Commit: `feat(street-rivalz): main.ts runs full Quick Race — player + 5 AI + items`

---

## Task 2.10: Sim tests + final verification

Run `npm test && npm run build`. Expected: all green.

Commit: `test(street-rivalz): Quick Race + item integration tests, all green`

---

## Self-review notes

- Determinism preserved: AI is a pure function, items apply deterministic state changes.
- Anti-cheat foundation intact: a replay log still reproduces the race.
- Out of this plan: real-time multiplayer, wager escrow, garage/GLB loading, backend — all Plan 3+.
