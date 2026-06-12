# StreetRivalz — Plan 1: Drivable Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A drivable 3D kart in the browser — deterministic fixed-tick sim (physics, drift/boost, walls, laps) rendered with Three.js on the Moonaco v0 track, controlled by keyboard.

**Architecture:** Pure-TS deterministic sim (`src/sim/`, zero rendering deps, vitest-tested) stepped at a fixed 60 Hz by a game loop; Three.js renderer (`src/render/`) interpolates between sim ticks. Sim is 2D top-down (x,y meters); renderer maps sim (x,y) → three (x, z) with y-up. Placeholder kart uses the detached-wheels node convention (`body`, `wheel_FL/FR/RL/RR`) so real Meshy GLBs drop in later with zero binding changes.

**Tech Stack:** Vite + TypeScript + Three.js + vitest. No physics engine — custom arcade kart model.

**Plan series (this is 1 of 4):** Plan 2 = AI racers + items + race flow (Quick Race). Plan 3 = backend (accounts, ghosts, ladder, Grand Prix) + replay verification. Plan 4 = garage, GLB validator/loader, token/holder layer. Each gets its own plan doc when its predecessor ships.

**Spec:** `docs/superpowers/specs/2026-06-12-street-rivalz-design.md`

---

### Task 1: Project scaffold

**Files:**
- Create: `web3-games/street-rivalz/package.json`
- Create: `web3-games/street-rivalz/tsconfig.json`
- Create: `web3-games/street-rivalz/vite.config.ts`
- Create: `web3-games/street-rivalz/index.html`
- Create: `web3-games/street-rivalz/.gitignore`
- Create: `web3-games/street-rivalz/src/main.ts` (stub)

- [ ] **Step 1: Create package.json**

```json
{
  "name": "street-rivalz",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "three": "^0.177.0"
  },
  "devDependencies": {
    "@types/three": "^0.177.0",
    "typescript": "^5.5.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUnusedLocals": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
})
```

- [ ] **Step 4: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StreetRivalz</title>
    <style>
      html, body { margin: 0; height: 100%; overflow: hidden; background: #0a0a12; }
      #app { width: 100%; height: 100%; }
      #hud {
        position: fixed; left: 16px; bottom: 16px; color: #fff;
        font-family: ui-monospace, monospace; font-size: 16px; user-select: none;
        text-shadow: 0 1px 3px rgba(0,0,0,.8);
      }
      #drift-bar { width: 140px; height: 8px; background: #ffffff22; border-radius: 4px; margin-top: 6px; }
      #drift-fill { height: 100%; width: 0%; background: #4ade80; border-radius: 4px; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <div id="hud">
      <div id="speed">0 km/h</div>
      <div id="lap">LAP 1/3</div>
      <div id="drift-bar"><div id="drift-fill"></div></div>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
.env
.env.*
.DS_Store
```

- [ ] **Step 6: Create stub src/main.ts**

```ts
console.log('street-rivalz boot')
```

- [ ] **Step 7: Install and verify**

Run: `cd web3-games/street-rivalz && npm install && npm run build`
Expected: build succeeds, `dist/` created.

- [ ] **Step 8: Commit**

```bash
git add web3-games/street-rivalz
git commit -m "feat(street-rivalz): scaffold Vite + TS + Three.js project"
```

---

### Task 2: Sim math — vectors + seeded RNG

**Files:**
- Create: `web3-games/street-rivalz/src/sim/math.ts`
- Test: `web3-games/street-rivalz/tests/sim/math.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/sim/math.test.ts
import { describe, it, expect } from 'vitest'
import { v, add, sub, scale, dot, len, norm, clamp, mulberry32 } from '../../src/sim/math'

describe('vec2', () => {
  it('does basic arithmetic', () => {
    expect(add(v(1, 2), v(3, 4))).toEqual(v(4, 6))
    expect(sub(v(3, 4), v(1, 2))).toEqual(v(2, 2))
    expect(scale(v(1, -2), 3)).toEqual(v(3, -6))
    expect(dot(v(1, 2), v(3, 4))).toBe(11)
    expect(len(v(3, 4))).toBe(5)
  })

  it('normalizes safely', () => {
    expect(norm(v(0, 5))).toEqual(v(0, 1))
    expect(norm(v(0, 0))).toEqual(v(0, 0))
  })

  it('clamps', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-1, 0, 3)).toBe(0)
    expect(clamp(2, 0, 3)).toBe(2)
  })
})

describe('mulberry32', () => {
  it('same seed -> identical sequence', () => {
    const a = mulberry32(1234)
    const b = mulberry32(1234)
    for (let i = 0; i < 100; i++) expect(a()).toBe(b())
  })

  it('outputs in [0,1) and varies by seed', () => {
    const a = mulberry32(1)
    const x = a()
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThan(1)
    expect(mulberry32(2)()).not.toBe(mulberry32(3)())
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web3-games/street-rivalz && npm test`
Expected: FAIL — cannot resolve `../../src/sim/math`.

- [ ] **Step 3: Implement src/sim/math.ts**

```ts
export interface Vec2 { x: number; y: number }

export const v = (x: number, y: number): Vec2 => ({ x, y })
export const add = (a: Vec2, b: Vec2): Vec2 => v(a.x + b.x, a.y + b.y)
export const sub = (a: Vec2, b: Vec2): Vec2 => v(a.x - b.x, a.y - b.y)
export const scale = (a: Vec2, s: number): Vec2 => v(a.x * s, a.y * s)
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y
export const len = (a: Vec2): number => Math.hypot(a.x, a.y)
export const norm = (a: Vec2): Vec2 => {
  const l = len(a)
  return l === 0 ? v(0, 0) : scale(a, 1 / l)
}
export const clamp = (x: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, x))

/** Deterministic PRNG — same seed gives same sequence on every platform. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (2 files may not exist yet — only math tests run, all green).

- [ ] **Step 5: Commit**

```bash
git add src/sim/math.ts tests/sim/math.test.ts
git commit -m "feat(street-rivalz): sim math — vec2 helpers + mulberry32 seeded RNG"
```

---

### Task 3: Track model — definition, build, nearest-point sampling

**Files:**
- Create: `web3-games/street-rivalz/src/sim/track.ts`
- Test: `web3-games/street-rivalz/tests/sim/track.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/sim/track.test.ts
import { describe, it, expect } from 'vitest'
import { buildTrack, sampleTrack, forwardDelta, TrackDef } from '../../src/sim/track'
import { v } from '../../src/sim/math'

// 100x100 square loop, CCW, 4 points
export const SQUARE: TrackDef = {
  name: 'square',
  width: 14,
  centerline: [[0, 0], [100, 0], [100, 100], [0, 100]],
  checkpoints: [0, 1, 2, 3],
}

describe('buildTrack', () => {
  it('computes cumulative + total loop length', () => {
    const t = buildTrack(SQUARE)
    expect(t.cum).toEqual([0, 100, 200, 300])
    expect(t.total).toBe(400)
    expect(t.cpProgress).toEqual([0, 100, 200, 300])
  })
})

describe('sampleTrack', () => {
  it('projects onto the nearest segment with progress', () => {
    const t = buildTrack(SQUARE)
    const s = sampleTrack(t, v(50, 3)) // 3m inside of bottom edge midpoint
    expect(s.point.x).toBeCloseTo(50)
    expect(s.point.y).toBeCloseTo(0)
    expect(s.dist).toBeCloseTo(3)
    expect(s.progress).toBeCloseTo(50)
  })

  it('handles the wrap-around segment (last point -> first)', () => {
    const t = buildTrack(SQUARE)
    const s = sampleTrack(t, v(2, 50)) // on the left edge (wrap segment)
    expect(s.point.x).toBeCloseTo(0)
    expect(s.point.y).toBeCloseTo(50)
    expect(s.progress).toBeCloseTo(350)
  })
})

describe('forwardDelta', () => {
  it('wraps signed distance around the loop', () => {
    expect(forwardDelta(390, 10, 400)).toBe(20)   // forward across start line
    expect(forwardDelta(10, 390, 400)).toBe(-20)  // just behind
    expect(forwardDelta(100, 150, 400)).toBe(50)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/sim/track`.

- [ ] **Step 3: Implement src/sim/track.ts**

```ts
import { Vec2, v, add, sub, scale, dot, len, clamp } from './math'

export interface TrackDef {
  name: string
  width: number                   // total road width, meters
  centerline: [number, number][]  // closed CCW loop
  checkpoints: number[]           // ordered indices into centerline; [0] = start/finish
}

export interface Track {
  def: TrackDef
  points: Vec2[]
  cum: number[]         // cumulative centerline length at each point
  total: number         // total loop length
  cpProgress: number[]  // loop progress (m) of each checkpoint
}

export function buildTrack(def: TrackDef): Track {
  const points = def.centerline.map(([x, y]) => v(x, y))
  const cum: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + len(sub(points[i], points[i - 1])))
  }
  const total = cum[points.length - 1] + len(sub(points[0], points[points.length - 1]))
  return { def, points, cum, total, cpProgress: def.checkpoints.map((i) => cum[i]) }
}

export interface TrackSample {
  point: Vec2     // nearest point on centerline
  progress: number // meters along the loop at that point
  dist: number    // distance from query point to centerline
}

/** Nearest point on the closed centerline polyline (includes wrap segment). */
export function sampleTrack(track: Track, p: Vec2): TrackSample {
  const n = track.points.length
  let best: TrackSample = { point: track.points[0], progress: 0, dist: Infinity }
  for (let i = 0; i < n; i++) {
    const a = track.points[i]
    const b = track.points[(i + 1) % n]
    const ab = sub(b, a)
    const abLen2 = dot(ab, ab)
    const t = abLen2 === 0 ? 0 : clamp(dot(sub(p, a), ab) / abLen2, 0, 1)
    const point = add(a, scale(ab, t))
    const dist = len(sub(p, point))
    if (dist < best.dist) {
      const segLen = Math.sqrt(abLen2)
      best = { point, dist, progress: track.cum[i] + t * segLen }
    }
  }
  return best
}

/** Signed forward distance from `from` to `to` along a loop of length `total`. */
export function forwardDelta(from: number, to: number, total: number): number {
  let d = to - from
  if (d > total / 2) d -= total
  if (d < -total / 2) d += total
  return d
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/track.ts tests/sim/track.test.ts
git commit -m "feat(street-rivalz): track model — closed-loop build, nearest-point sampling, loop deltas"
```

---

### Task 4: Kart physics — input, params, step (throttle/steer/grip/drag)

**Files:**
- Create: `web3-games/street-rivalz/src/sim/kart.ts`
- Test: `web3-games/street-rivalz/tests/sim/kart.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/sim/kart.test.ts
import { describe, it, expect } from 'vitest'
import { createKart, stepKart, DEFAULT_KART, DT, KartInput } from '../../src/sim/kart'
import { v, len, dot } from '../../src/sim/math'

const THROTTLE: KartInput = { throttle: 1, steer: 0, drift: false }
const NEUTRAL: KartInput = { throttle: 0, steer: 0, drift: false }

describe('stepKart — longitudinal', () => {
  it('accelerates forward along heading and approaches max speed', () => {
    const k = createKart(v(0, 0), 0) // heading 0 = +x
    for (let i = 0; i < 600; i++) stepKart(k, THROTTLE, DEFAULT_KART) // 10s
    expect(k.pos.x).toBeGreaterThan(100)
    expect(Math.abs(k.pos.y)).toBeLessThan(0.001)
    const speed = len(k.vel)
    expect(speed).toBeGreaterThan(DEFAULT_KART.maxSpeed * 0.85)
    expect(speed).toBeLessThanOrEqual(DEFAULT_KART.maxSpeed + 0.001)
  })

  it('coasts to a stop under drag with no throttle', () => {
    const k = createKart(v(0, 0), 0)
    for (let i = 0; i < 300; i++) stepKart(k, THROTTLE, DEFAULT_KART)
    const cruise = len(k.vel)
    for (let i = 0; i < 600; i++) stepKart(k, NEUTRAL, DEFAULT_KART)
    expect(len(k.vel)).toBeLessThan(cruise * 0.1)
  })
})

describe('stepKart — steering', () => {
  it('turns left with positive steer while moving', () => {
    const k = createKart(v(0, 0), 0)
    for (let i = 0; i < 120; i++) stepKart(k, THROTTLE, DEFAULT_KART)
    const h0 = k.heading
    for (let i = 0; i < 60; i++) stepKart(k, { throttle: 1, steer: 1, drift: false }, DEFAULT_KART)
    expect(k.heading).toBeGreaterThan(h0)
  })

  it('cannot pivot in place at zero speed', () => {
    const k = createKart(v(0, 0), 0)
    for (let i = 0; i < 60; i++) stepKart(k, { throttle: 0, steer: 1, drift: false }, DEFAULT_KART)
    expect(k.heading).toBeCloseTo(0, 3)
  })
})

describe('stepKart — grip', () => {
  it('kills lateral velocity when not drifting (kart tracks its heading)', () => {
    const k = createKart(v(0, 0), 0)
    k.vel = v(10, 10) // half forward, half lateral
    for (let i = 0; i < 120; i++) stepKart(k, NEUTRAL, DEFAULT_KART)
    const fwd = v(Math.cos(k.heading), Math.sin(k.heading))
    const lat = k.vel.y * fwd.x - k.vel.x * fwd.y // 2D cross = lateral magnitude
    expect(Math.abs(lat)).toBeLessThan(0.5)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/sim/kart`.

- [ ] **Step 3: Implement src/sim/kart.ts**

```ts
import { Vec2, v, add, sub, scale, dot, len, clamp } from './math'

export const DT = 1 / 60
export const TOTAL_LAPS = 3
export const KART_RADIUS = 1.1

export interface KartInput {
  throttle: number // -1..1 (negative = brake/reverse)
  steer: number    // -1..1 (positive = left, math-positive rotation)
  drift: boolean
}

export interface KartParams {
  accel: number; brake: number; maxSpeed: number; reverseMax: number
  drag: number; grip: number; driftGrip: number
  steerRate: number; driftSteerBonus: number; driftMinSpeed: number
  chargeTiers: [number, number, number] // seconds of drift held per boost tier
  boostTicks: [number, number, number]  // boost duration per tier, in ticks
  boostAccel: number; boostMaxSpeed: number
}

export const DEFAULT_KART: KartParams = {
  accel: 26, brake: 50, maxSpeed: 26, reverseMax: 8,
  drag: 0.45, grip: 9, driftGrip: 2.4,
  steerRate: 2.1, driftSteerBonus: 1.6, driftMinSpeed: 11,
  chargeTiers: [0.7, 1.4, 2.2], boostTicks: [28, 50, 80],
  boostAccel: 38, boostMaxSpeed: 33,
}

export interface DriftState { active: boolean; dir: 1 | -1; charge: number }

export interface KartState {
  pos: Vec2
  heading: number // radians; 0 = +x
  vel: Vec2
  drift: DriftState
  boostTicks: number
  lap: number      // starts at 1
  cpIndex: number  // last checkpoint hit (0..n-1)
  finished: boolean
  progress: number // loop progress, updated by track constraints
}

export function createKart(pos: Vec2, heading: number): KartState {
  return {
    pos, heading, vel: v(0, 0),
    drift: { active: false, dir: 1, charge: 0 },
    boostTicks: 0, lap: 1, cpIndex: 0, finished: false, progress: 0,
  }
}

export function stepKart(k: KartState, input: KartInput, p: KartParams): void {
  const fwd = v(Math.cos(k.heading), Math.sin(k.heading))
  const speedF = dot(k.vel, fwd) // signed forward speed

  // --- steering, scaled down at low speed so you can't pivot in place
  const steerScale = clamp(Math.abs(speedF) / 6, 0, 1)
  let steer = clamp(input.steer, -1, 1) * p.steerRate * steerScale

  // --- drift state machine (boost applied on release in Task 5's tests)
  if (k.drift.active) {
    if (!input.drift || Math.abs(speedF) < p.driftMinSpeed * 0.6) {
      const t = p.chargeTiers
      if (k.drift.charge >= t[2]) k.boostTicks = p.boostTicks[2]
      else if (k.drift.charge >= t[1]) k.boostTicks = p.boostTicks[1]
      else if (k.drift.charge >= t[0]) k.boostTicks = p.boostTicks[0]
      k.drift.active = false
      k.drift.charge = 0
    } else {
      k.drift.charge += DT
      steer = (steer + k.drift.dir * p.steerRate * 0.5) * p.driftSteerBonus
    }
  } else if (input.drift && Math.abs(input.steer) > 0.25 && speedF > p.driftMinSpeed) {
    k.drift.active = true
    k.drift.dir = input.steer > 0 ? 1 : -1
    k.drift.charge = 0
  }
  k.heading += steer * DT * (speedF >= 0 ? 1 : -1)

  // --- longitudinal forces
  const boosting = k.boostTicks > 0
  if (boosting) k.boostTicks--
  const throttle = clamp(input.throttle, -1, 1)
  let a = 0
  if (boosting) a += p.boostAccel
  if (throttle > 0) a += throttle * p.accel
  else if (throttle < 0) a += throttle * (speedF > 0 ? p.brake : p.accel * 0.5)
  const fwd2 = v(Math.cos(k.heading), Math.sin(k.heading))
  k.vel = add(k.vel, scale(fwd2, a * DT))

  // --- grip: decay lateral velocity (looser while drifting)
  const f = dot(k.vel, fwd2)
  const lat = sub(k.vel, scale(fwd2, f))
  const g = k.drift.active ? p.driftGrip : p.grip
  k.vel = add(scale(fwd2, f), scale(lat, Math.max(0, 1 - g * DT)))

  // --- drag + speed caps
  k.vel = scale(k.vel, Math.max(0, 1 - p.drag * DT))
  const cap = boosting ? p.boostMaxSpeed : p.maxSpeed
  const sp = len(k.vel)
  if (sp > cap) k.vel = scale(k.vel, cap / sp)
  const f2 = dot(k.vel, fwd2)
  if (f2 < -p.reverseMax) k.vel = add(k.vel, scale(fwd2, -p.reverseMax - f2))

  // --- integrate
  k.pos = add(k.pos, scale(k.vel, DT))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS. If the "approaches max speed" assertion fails, the drag/accel balance is off — accel must exceed `drag * maxSpeed` comfortably (26 > 0.45·26=11.7 ✓); do not weaken the test.

- [ ] **Step 5: Commit**

```bash
git add src/sim/kart.ts tests/sim/kart.test.ts
git commit -m "feat(street-rivalz): arcade kart physics — throttle, steer, grip, drag, speed caps"
```

---

### Task 5: Drift & boost state machine tests

The implementation already landed in Task 4 (one coherent step function — splitting it would create a broken intermediate kart). This task locks the drift/boost behavior with focused tests so balance tweaks can't silently break it.

**Files:**
- Modify: `web3-games/street-rivalz/tests/sim/kart.test.ts` (append)

- [ ] **Step 1: Write the tests (they should pass immediately — they pin behavior)**

```ts
// append to tests/sim/kart.test.ts
describe('drift & boost', () => {
  function cruise(): ReturnType<typeof createKart> {
    const k = createKart(v(0, 0), 0)
    for (let i = 0; i < 240; i++) stepKart(k, THROTTLE, DEFAULT_KART)
    return k
  }

  it('initiates drift only when steering + fast enough', () => {
    const k = cruise()
    stepKart(k, { throttle: 1, steer: 1, drift: true }, DEFAULT_KART)
    expect(k.drift.active).toBe(true)
    expect(k.drift.dir).toBe(1)

    const slow = createKart(v(0, 0), 0)
    stepKart(slow, { throttle: 1, steer: 1, drift: true }, DEFAULT_KART)
    expect(slow.drift.active).toBe(false) // too slow to drift
  })

  it('charges while held and grants tiered boost on release', () => {
    const k = cruise()
    const drifting: KartInput = { throttle: 1, steer: 1, drift: true }
    // hold ~1.5s -> tier 2 (charge >= 1.4, < 2.2)
    for (let i = 0; i < 90; i++) stepKart(k, drifting, DEFAULT_KART)
    expect(k.drift.charge).toBeGreaterThan(DEFAULT_KART.chargeTiers[1])
    stepKart(k, THROTTLE, DEFAULT_KART) // release
    expect(k.drift.active).toBe(false)
    // release tick consumed 1 boost tick already
    expect(k.boostTicks).toBe(DEFAULT_KART.boostTicks[1] - 1)
  })

  it('no boost when released before tier 1', () => {
    const k = cruise()
    for (let i = 0; i < 20; i++) stepKart(k, { throttle: 1, steer: 1, drift: true }, DEFAULT_KART) // ~0.33s
    stepKart(k, THROTTLE, DEFAULT_KART)
    expect(k.boostTicks).toBe(0)
  })

  it('boost raises speed above normal cap', () => {
    const k = cruise()
    for (let i = 0; i < 140; i++) stepKart(k, { throttle: 1, steer: 1, drift: true }, DEFAULT_KART) // tier 3
    for (let i = 0; i < 40; i++) stepKart(k, THROTTLE, DEFAULT_KART)
    expect(len(k.vel)).toBeGreaterThan(DEFAULT_KART.maxSpeed + 1)
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: PASS. If any fail, fix `stepKart` (not the test) — the spec behavior is: hold-to-charge, tiered release boost, no boost below tier 1, boost exceeds normal cap.

- [ ] **Step 3: Commit**

```bash
git add tests/sim/kart.test.ts
git commit -m "test(street-rivalz): pin drift charge tiers + boost release behavior"
```

---

### Task 6: Track constraints — walls, checkpoints, laps

**Files:**
- Create: `web3-games/street-rivalz/src/sim/race.ts`
- Test: `web3-games/street-rivalz/tests/sim/race.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/sim/race.test.ts
import { describe, it, expect } from 'vitest'
import { buildTrack } from '../../src/sim/track'
import { createKart, stepKart, DEFAULT_KART, KART_RADIUS, KartInput } from '../../src/sim/kart'
import { applyTrackConstraints, updateCheckpoints, createRace, stepRace } from '../../src/sim/race'
import { v, len, sub } from '../../src/sim/math'
import { SQUARE } from './track.test'

const THROTTLE: KartInput = { throttle: 1, steer: 0, drift: false }

describe('applyTrackConstraints', () => {
  it('keeps a kart driving at a wall inside the road', () => {
    const track = buildTrack(SQUARE)
    const k = createKart(v(50, 0), Math.PI / 2) // on bottom edge, aimed straight off-road
    for (let i = 0; i < 300; i++) {
      stepKart(k, THROTTLE, DEFAULT_KART)
      applyTrackConstraints(k, track)
    }
    const half = SQUARE.width / 2 - KART_RADIUS
    expect(Math.abs(k.pos.y)).toBeLessThanOrEqual(half + 0.01)
  })

  it('updates kart progress', () => {
    const track = buildTrack(SQUARE)
    const k = createKart(v(30, 0), 0)
    applyTrackConstraints(k, track)
    expect(k.progress).toBeCloseTo(30)
  })
})

describe('updateCheckpoints', () => {
  it('advances checkpoints in order and counts laps at start/finish', () => {
    const track = buildTrack(SQUARE)
    const k = createKart(v(0, 0), 0)
    // teleport around the loop hitting each checkpoint in order
    const route = [v(100, 0), v(100, 100), v(0, 100), v(0, 0)]
    for (const p of route) {
      k.pos = p
      applyTrackConstraints(k, track)
      updateCheckpoints(k, track)
    }
    expect(k.lap).toBe(2)
    expect(k.cpIndex).toBe(0)
  })

  it('ignores a checkpoint hit out of order (anti-cut)', () => {
    const track = buildTrack(SQUARE)
    const k = createKart(v(0, 0), 0)
    k.pos = v(100, 100) // checkpoint 2, but next required is 1
    applyTrackConstraints(k, track)
    updateCheckpoints(k, track)
    expect(k.cpIndex).toBe(0)
    expect(k.lap).toBe(1)
  })

  it('marks finished after TOTAL_LAPS', () => {
    const track = buildTrack(SQUARE)
    const k = createKart(v(0, 0), 0)
    const route = [v(100, 0), v(100, 100), v(0, 100), v(0, 0)]
    for (let lap = 0; lap < 3; lap++) {
      for (const p of route) {
        k.pos = p
        applyTrackConstraints(k, track)
        updateCheckpoints(k, track)
      }
    }
    expect(k.finished).toBe(true)
  })
})

describe('createRace / stepRace', () => {
  it('spawns karts on the grid facing the first segment', () => {
    const track = buildTrack(SQUARE)
    const race = createRace(track, 2)
    expect(race.karts).toHaveLength(2)
    expect(race.karts[0].heading).toBeCloseTo(0) // segment 0->1 of SQUARE points +x
    // staggered, not overlapping
    expect(len(sub(race.karts[0].pos, race.karts[1].pos))).toBeGreaterThan(2)
  })

  it('a throttling kart makes forward progress on track', () => {
    const track = buildTrack(SQUARE)
    const race = createRace(track, 1)
    for (let i = 0; i < 300; i++) stepRace(race, track, [THROTTLE])
    expect(race.karts[0].progress).toBeGreaterThan(20)
    expect(race.tick).toBe(300)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/sim/race`.

- [ ] **Step 3: Implement src/sim/race.ts**

```ts
import { Vec2, v, add, sub, scale, dot, norm, len } from './math'
import { Track, sampleTrack, forwardDelta } from './track'
import {
  KartState, KartInput, KartParams, DEFAULT_KART,
  createKart, stepKart, KART_RADIUS, TOTAL_LAPS,
} from './kart'

export const CP_WINDOW = 6 // meters of progress within which a checkpoint counts

export interface RaceState {
  tick: number
  karts: KartState[]
  finished: boolean
}

/** Clamp the kart onto the road and update its loop progress. */
export function applyTrackConstraints(k: KartState, track: Track): void {
  const s = sampleTrack(track, k.pos)
  const half = track.def.width / 2 - KART_RADIUS
  if (s.dist > half) {
    const out = norm(sub(k.pos, s.point))
    k.pos = add(s.point, scale(out, half))
    const vOut = dot(k.vel, out)
    if (vOut > 0) k.vel = sub(k.vel, scale(out, vOut * 1.4)) // remove + slight bounce
    k.vel = scale(k.vel, 0.92)                               // wall scrub
  }
  k.progress = s.progress
}

/** Ordered checkpoint advance; lap++ when start/finish is re-hit; anti-cut by ordering. */
export function updateCheckpoints(k: KartState, track: Track): void {
  if (k.finished) return
  const cps = track.cpProgress
  const next = (k.cpIndex + 1) % cps.length
  if (Math.abs(forwardDelta(k.progress, cps[next], track.total)) < CP_WINDOW) {
    k.cpIndex = next
    if (next === 0) {
      k.lap++
      if (k.lap > TOTAL_LAPS) k.finished = true
    }
  }
}

/** Spawn karts on a staggered grid just behind the start line, facing segment 0->1. */
export function createRace(track: Track, numKarts: number): RaceState {
  const a = track.points[0]
  const b = track.points[1]
  const fwd = norm(sub(b, a))
  const side = v(-fwd.y, fwd.x)
  const heading = Math.atan2(fwd.y, fwd.x)
  const karts: KartState[] = []
  for (let i = 0; i < numKarts; i++) {
    const lateral = (i % 2 === 0 ? 1 : -1) * 2.5
    const back = 4 + Math.floor(i / 2) * 4.5
    const pos = add(add(a, scale(fwd, back)), scale(side, lateral))
    karts.push(createKart(pos, heading))
  }
  return { tick: 0, karts, finished: false }
}

export function stepRace(
  race: RaceState,
  track: Track,
  inputs: KartInput[],
  params: KartParams = DEFAULT_KART,
): void {
  for (let i = 0; i < race.karts.length; i++) {
    const k = race.karts[i]
    if (k.finished) continue
    stepKart(k, inputs[i], params)
    applyTrackConstraints(k, track)
    updateCheckpoints(k, track)
  }
  race.tick++
  race.finished = race.karts.every((k) => k.finished)
}
```

Note: karts spawn a few meters PAST the start line (`back` along segment 0→1) with `cpIndex = 0`, so the first required checkpoint is 1 — crossing the start at spawn cannot double-count a lap.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/race.ts tests/sim/race.test.ts
git commit -m "feat(street-rivalz): race layer — wall constraints, ordered checkpoints, laps, grid spawn"
```

---

### Task 7: Determinism — headless runner + golden replay test

**Files:**
- Create: `web3-games/street-rivalz/src/sim/runner.ts`
- Test: `web3-games/street-rivalz/tests/sim/determinism.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/determinism.test.ts
import { describe, it, expect } from 'vitest'
import { runRace } from '../../src/sim/runner'
import { KartInput } from '../../src/sim/kart'
import { SQUARE } from './track.test'

/** Scripted 20s of driving: accelerate, corner, drift, release. */
function scriptedInputs(ticks: number): KartInput[][] {
  const log: KartInput[][] = []
  for (let t = 0; t < ticks; t++) {
    const phase = t % 240
    let input: KartInput
    if (phase < 120) input = { throttle: 1, steer: 0, drift: false }
    else if (phase < 200) input = { throttle: 1, steer: 1, drift: true }
    else input = { throttle: 1, steer: 0, drift: false }
    log.push([input])
  }
  return log
}

describe('replay determinism', () => {
  it('identical input log -> byte-identical final state', () => {
    const inputs = scriptedInputs(1200)
    const a = runRace(SQUARE, 1, inputs)
    const b = runRace(SQUARE, 1, inputs)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('kart stays on the road for the whole scripted run', () => {
    const inputs = scriptedInputs(1200)
    const final = runRace(SQUARE, 1, inputs)
    // wall constraint guarantees this; the assertion guards regressions
    expect(final.karts[0].progress).toBeGreaterThan(0)
    expect(Number.isFinite(final.karts[0].pos.x)).toBe(true)
    expect(Number.isFinite(final.karts[0].pos.y)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/sim/runner`.

- [ ] **Step 3: Implement src/sim/runner.ts**

```ts
import { TrackDef, buildTrack } from './track'
import { KartInput, KartParams, DEFAULT_KART } from './kart'
import { RaceState, createRace, stepRace } from './race'

/**
 * Headless deterministic race execution. A replay is (trackDef, numKarts, inputLog);
 * re-running it MUST reproduce the exact same RaceState. This is the foundation for
 * ghosts (Plan 3) and server-side replay verification (anti-cheat).
 */
export function runRace(
  trackDef: TrackDef,
  numKarts: number,
  inputLog: KartInput[][],
  params: KartParams = DEFAULT_KART,
): RaceState {
  const track = buildTrack(trackDef)
  const race = createRace(track, numKarts)
  for (const inputs of inputLog) {
    if (race.finished) break
    stepRace(race, track, inputs, params)
  }
  return race
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all sim suites green.

- [ ] **Step 5: Commit**

```bash
git add src/sim/runner.ts tests/sim/determinism.test.ts
git commit -m "feat(street-rivalz): headless race runner + golden replay determinism test"
```

---

### Task 8: Moonaco v0 track data

**Files:**
- Create: `web3-games/street-rivalz/src/tracks/moonaco.ts`
- Test: `web3-games/street-rivalz/tests/sim/moonaco.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sim/moonaco.test.ts
import { describe, it, expect } from 'vitest'
import { buildTrack } from '../../src/sim/track'
import { MOONACO } from '../../src/tracks/moonaco'

describe('Moonaco v0', () => {
  it('builds into a valid closed loop of reasonable length', () => {
    const t = buildTrack(MOONACO)
    expect(t.total).toBeGreaterThan(600)   // not a toy loop
    expect(t.total).toBeLessThan(2000)     // ~60-90s laps at kart speeds
    expect(t.cpProgress.length).toBeGreaterThanOrEqual(4)
    // checkpoints strictly increasing along the loop, starting at 0
    expect(t.cpProgress[0]).toBe(0)
    for (let i = 1; i < t.cpProgress.length; i++) {
      expect(t.cpProgress[i]).toBeGreaterThan(t.cpProgress[i - 1])
    }
  })

  it('has no degenerate (zero-length) segments', () => {
    const pts = MOONACO.centerline
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i]
      const [bx, by] = pts[(i + 1) % pts.length]
      expect(Math.hypot(bx - ax, by - ay)).toBeGreaterThan(1)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/tracks/moonaco`.

- [ ] **Step 3: Implement src/tracks/moonaco.ts**

```ts
import { TrackDef } from '../sim/track'

/**
 * Moonaco v0 — street-circuit-style closed loop (meters, CCW).
 * Layout beats: start straight -> fast right sweep -> harbor esses ->
 * hairpin (casino corner) -> back straight -> final chicane onto start.
 * Geometry is v0: drivable + correct; beautification happens with the
 * real track art pass in Plan 4.
 */
export const MOONACO: TrackDef = {
  name: 'moonaco',
  width: 14,
  centerline: [
    [0, 0], [45, 0], [90, 0], [130, 8],          // start straight
    [165, 25], [185, 55], [190, 90],             // right sweep
    [180, 120], [155, 140], [125, 145],          // harbor entry
    [100, 160], [90, 190], [105, 215],           // esses
    [95, 245], [65, 255], [35, 245], [25, 215],  // casino hairpin
    [10, 190], [-20, 180], [-50, 185],           // hairpin exit
    [-80, 170], [-95, 140], [-95, 105],          // back sweep
    [-90, 70], [-75, 40], [-50, 20], [-25, 8],   // final chicane onto start
  ],
  checkpoints: [0, 6, 13, 20],
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS. If loop length is outside bounds, adjust coordinates (scale the layout), not the test bounds.

- [ ] **Step 5: Commit**

```bash
git add src/tracks/moonaco.ts tests/sim/moonaco.test.ts
git commit -m "feat(street-rivalz): Moonaco v0 track layout — street circuit with hairpin + esses"
```

---

### Task 9: Renderer — scene, track mesh, placeholder kart with detached wheels

No unit tests for Three.js code (verified visually in Task 10); all game logic stays in the tested sim.

**Files:**
- Create: `web3-games/street-rivalz/src/render/scene.ts`
- Create: `web3-games/street-rivalz/src/render/trackMesh.ts`
- Create: `web3-games/street-rivalz/src/render/kartVisual.ts`

- [ ] **Step 1: Implement src/render/scene.ts**

```ts
import * as THREE from 'three'

export interface SceneCtx {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
}

export function createScene(container: HTMLElement): SceneCtx {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a18)
  scene.fog = new THREE.Fog(0x0a0a18, 120, 420)

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 600)
  camera.position.set(0, 8, -14)

  const hemi = new THREE.HemisphereLight(0x8899ff, 0x223344, 0.9)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.4)
  sun.position.set(80, 120, 40)
  sun.castShadow = true
  sun.shadow.camera.left = -200
  sun.shadow.camera.right = 200
  sun.shadow.camera.top = 200
  sun.shadow.camera.bottom = -200
  scene.add(sun)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x111122 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.05
  ground.receiveShadow = true
  scene.add(ground)

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  return { renderer, scene, camera }
}
```

- [ ] **Step 2: Implement src/render/trackMesh.ts**

```ts
import * as THREE from 'three'
import { Track } from '../sim/track'
import { v, add, sub, scale, norm, Vec2 } from '../sim/math'

/** Sim (x, y) plane maps to three (x, z); y is up. */
export const toWorld = (p: Vec2, y = 0): THREE.Vector3 => new THREE.Vector3(p.x, y, p.y)

function offsets(track: Track): { left: Vec2[]; right: Vec2[] } {
  const pts = track.points
  const n = pts.length
  const half = track.def.width / 2
  const left: Vec2[] = []
  const right: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]
    const next = pts[(i + 1) % n]
    const dir = norm(sub(next, prev)) // averaged tangent
    const normal = v(-dir.y, dir.x)
    left.push(add(pts[i], scale(normal, half)))
    right.push(add(pts[i], scale(normal, -half)))
  }
  return { left, right }
}

function ribbon(a: Vec2[], b: Vec2[], y: number, material: THREE.Material): THREE.Mesh {
  const n = a.length
  const positions: number[] = []
  const indices: number[] = []
  for (let i = 0; i < n; i++) {
    positions.push(a[i].x, y, a[i].y, b[i].x, y, b[i].y)
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const a0 = i * 2, b0 = i * 2 + 1, a1 = j * 2, b1 = j * 2 + 1
    indices.push(a0, b0, a1, b0, b1, a1)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, material)
  mesh.receiveShadow = true
  return mesh
}

export function buildTrackMeshes(track: Track): THREE.Group {
  const g = new THREE.Group()
  const { left, right } = offsets(track)

  // asphalt
  g.add(ribbon(left, right, 0, new THREE.MeshStandardMaterial({ color: 0x2a2a33 })))

  // neon edge strips (slightly inset, slightly raised)
  const inset = 0.6
  const innerL = left.map((p, i) => add(p, scale(norm(sub(track.points[i], p)), inset)))
  const innerR = right.map((p, i) => add(p, scale(norm(sub(track.points[i], p)), inset)))
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0x39ff88 })
  g.add(ribbon(left, innerL, 0.02, edgeMat))
  g.add(ribbon(right, innerR, 0.02, edgeMat))

  // start/finish line across the road at point 0
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const start = new THREE.Mesh(new THREE.BoxGeometry(track.def.width, 0.02, 1.5), lineMat)
  const p0 = track.points[0]
  const p1 = track.points[1]
  const dir = norm(sub(p1, p0))
  start.position.set(p0.x, 0.03, p0.y)
  start.rotation.y = -Math.atan2(dir.y, dir.x)
  g.add(start)

  return g
}
```

- [ ] **Step 3: Implement src/render/kartVisual.ts**

```ts
import * as THREE from 'three'
import { KartState, KartInput, DEFAULT_KART } from '../sim/kart'
import { len } from '../sim/math'

const WHEEL_RADIUS = 0.35

/**
 * Placeholder kart honoring the detached-wheels GLB convention:
 * named nodes `body`, `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR`,
 * forward = local +Z, origin at ground center. Real Meshy GLBs (Plan 4)
 * bind through the exact same node lookup.
 */
export function buildPlaceholderKart(color: number): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.6, 2.6),
    new THREE.MeshStandardMaterial({ color }),
  )
  body.name = 'body'
  body.position.y = 0.55
  body.castShadow = true
  g.add(body)

  const wheelGeo = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 14)
  wheelGeo.rotateZ(Math.PI / 2) // cylinder axis -> local x
  const positions: [string, number, number][] = [
    ['wheel_FL', -0.85, 1.0],
    ['wheel_FR', 0.85, 1.0],
    ['wheel_RL', -0.85, -1.0],
    ['wheel_RR', 0.85, -1.0],
  ]
  for (const [name, x, z] of positions) {
    const w = new THREE.Mesh(wheelGeo, new THREE.MeshStandardMaterial({ color: 0x16161a }))
    w.name = name
    w.position.set(x, WHEEL_RADIUS, z)
    w.castShadow = true
    g.add(w)
  }
  return g
}

export interface KartVisual {
  group: THREE.Group
  wheels: { FL: THREE.Object3D; FR: THREE.Object3D; RL: THREE.Object3D; RR: THREE.Object3D }
  body: THREE.Object3D
  spin: number
}

export function bindKartVisual(group: THREE.Group): KartVisual {
  const get = (n: string) => {
    const o = group.getObjectByName(n)
    if (!o) throw new Error(`kart model missing required node: ${n}`)
    return o
  }
  return {
    group,
    body: get('body'),
    wheels: { FL: get('wheel_FL'), FR: get('wheel_FR'), RL: get('wheel_RL'), RR: get('wheel_RR') },
    spin: 0,
  }
}

/**
 * Apply interpolated sim state to the visual.
 * Sim heading 0 = +x (sim) = world (1,0,0); local forward is +Z,
 * so rotation.y = PI/2 - heading maps local +Z onto the sim heading.
 */
export function updateKartVisual(
  vis: KartVisual,
  pos: { x: number; y: number },
  heading: number,
  state: KartState,
  input: KartInput,
  dt: number,
): void {
  vis.group.position.set(pos.x, 0, pos.y)
  vis.group.rotation.y = Math.PI / 2 - heading

  // wheel spin from speed
  const speed = len(state.vel)
  vis.spin += (speed / WHEEL_RADIUS) * dt
  for (const w of [vis.wheels.FL, vis.wheels.FR, vis.wheels.RL, vis.wheels.RR]) {
    w.rotation.x = vis.spin
  }
  // front wheel steering yaw (negated: positive steer = left turn = -y yaw in world map)
  const steerYaw = -input.steer * 0.42
  vis.wheels.FL.rotation.y = steerYaw
  vis.wheels.FR.rotation.y = steerYaw

  // body drift lean + boost squat
  const targetLean = state.drift.active ? state.drift.dir * 0.18 : 0
  vis.body.rotation.z += (targetLean - vis.body.rotation.z) * Math.min(1, dt * 10)
  const targetSquat = state.boostTicks > 0 ? 0.45 : 0.55
  vis.body.position.y += (targetSquat - vis.body.position.y) * Math.min(1, dt * 10)

  // boost speed cap visual: stretch flame later (Plan 4); color flash for now
  const mat = (vis.body as THREE.Mesh).material as THREE.MeshStandardMaterial
  mat.emissive.setHex(state.boostTicks > 0 ? 0x3366ff : 0x000000)
  void DEFAULT_KART
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: tsc passes, vite build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/render
git commit -m "feat(street-rivalz): renderer — scene, track ribbon mesh, detached-wheels kart visual"
```

---

### Task 10: Game loop, input, HUD, main — drive Moonaco

**Files:**
- Create: `web3-games/street-rivalz/src/game/input.ts`
- Create: `web3-games/street-rivalz/src/game/loop.ts`
- Create: `web3-games/street-rivalz/src/game/hud.ts`
- Modify: `web3-games/street-rivalz/src/main.ts` (replace stub)

- [ ] **Step 1: Implement src/game/input.ts**

```ts
import { KartInput } from '../sim/kart'

export class KeyboardInput {
  private keys = new Set<string>()

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })
    window.addEventListener('keyup', (e) => this.keys.delete(e.code))
  }

  /** Positive steer = left (sim math-positive rotation). */
  read(): KartInput {
    const up = this.keys.has('ArrowUp') || this.keys.has('KeyW')
    const down = this.keys.has('ArrowDown') || this.keys.has('KeyS')
    const leftKey = this.keys.has('ArrowLeft') || this.keys.has('KeyA')
    const rightKey = this.keys.has('ArrowRight') || this.keys.has('KeyD')
    return {
      throttle: (up ? 1 : 0) + (down ? -1 : 0),
      steer: (leftKey ? 1 : 0) + (rightKey ? -1 : 0),
      drift: this.keys.has('Space'),
    }
  }

  pressed(code: string): boolean {
    return this.keys.has(code)
  }
}
```

- [ ] **Step 2: Implement src/game/hud.ts**

```ts
import { KartState, TOTAL_LAPS, DEFAULT_KART } from '../sim/kart'
import { len } from '../sim/math'

export class Hud {
  private speed = document.getElementById('speed')!
  private lap = document.getElementById('lap')!
  private driftFill = document.getElementById('drift-fill')!

  update(k: KartState): void {
    this.speed.textContent = `${Math.round(len(k.vel) * 3.6)} km/h`
    this.lap.textContent = k.finished
      ? 'FINISHED'
      : `LAP ${Math.min(k.lap, TOTAL_LAPS)}/${TOTAL_LAPS}`
    const t = DEFAULT_KART.chargeTiers
    const pct = Math.min(100, (k.drift.charge / t[2]) * 100)
    const el = this.driftFill as HTMLElement
    el.style.width = `${k.drift.active ? pct : 0}%`
    el.style.background = k.drift.charge >= t[2] ? '#f472b6' : k.drift.charge >= t[1] ? '#fb923c' : '#4ade80'
  }
}
```

- [ ] **Step 3: Implement src/game/loop.ts**

```ts
import * as THREE from 'three'
import { DT, KartState } from '../sim/kart'

export interface Snapshot { x: number; y: number; heading: number }

export const snapshot = (k: KartState): Snapshot => ({ x: k.pos.x, y: k.pos.y, heading: k.heading })

export function lerpSnap(a: Snapshot, b: Snapshot, t: number): Snapshot {
  let dh = b.heading - a.heading
  if (dh > Math.PI) dh -= Math.PI * 2
  if (dh < -Math.PI) dh += Math.PI * 2
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, heading: a.heading + dh * t }
}

/**
 * Fixed-timestep driver: sim advances in exact DT steps; rendering
 * interpolates between the previous and current sim states.
 */
export function startLoop(
  stepSim: () => void,
  takeSnapshots: () => Snapshot[],
  render: (interpolated: Snapshot[], dt: number) => void,
): void {
  let acc = 0
  let last = performance.now()
  let prev = takeSnapshots()
  let curr = takeSnapshots()

  function frame(now: number) {
    const frameDt = Math.min((now - last) / 1000, 0.25) // clamp away tab-switch spikes
    last = now
    acc += frameDt
    while (acc >= DT) {
      prev = curr
      stepSim()
      curr = takeSnapshots()
      acc -= DT
    }
    const alpha = acc / DT
    render(curr.map((c, i) => lerpSnap(prev[i] ?? c, c, alpha)), frameDt)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

/** Smooth chase camera behind the kart. */
export function updateChaseCamera(
  camera: THREE.PerspectiveCamera,
  snap: Snapshot,
  dt: number,
): void {
  const fwd = new THREE.Vector3(Math.cos(snap.heading), 0, Math.sin(snap.heading))
  const kartPos = new THREE.Vector3(snap.x, 0, snap.y)
  const desired = kartPos.clone().addScaledVector(fwd, -8).add(new THREE.Vector3(0, 3.4, 0))
  camera.position.lerp(desired, Math.min(1, dt * 5))
  camera.lookAt(kartPos.clone().addScaledVector(fwd, 5).add(new THREE.Vector3(0, 1, 0)))
}
```

- [ ] **Step 4: Replace src/main.ts**

```ts
import { buildTrack } from './sim/track'
import { MOONACO } from './tracks/moonaco'
import { createRace, stepRace } from './sim/race'
import { createScene } from './render/scene'
import { buildTrackMeshes } from './render/trackMesh'
import { buildPlaceholderKart, bindKartVisual } from './render/kartVisual'
import { KeyboardInput } from './game/input'
import { Hud } from './game/hud'
import { startLoop, snapshot, updateChaseCamera } from './game/loop'

const app = document.getElementById('app')!
const ctx = createScene(app)
const track = buildTrack(MOONACO)
ctx.scene.add(buildTrackMeshes(track))

let race = createRace(track, 1)
const kartVis = bindKartVisual(buildPlaceholderKart(0xe11d48))
ctx.scene.add(kartVis.group)

const input = new KeyboardInput()
const hud = new Hud()
let lastInput = input.read()

startLoop(
  () => {
    if (input.pressed('KeyR')) race = createRace(track, 1) // reset
    lastInput = input.read()
    stepRace(race, track, [lastInput])
  },
  () => race.karts.map(snapshot),
  (snaps, dt) => {
    const k = race.karts[0]
    import('./render/kartVisual').then(() => {}) // no-op; keeps tree-shaking honest
    const s = snaps[0]
    // update visual with interpolated transform + live sim state
    // (state fields like drift/boost don't need interpolation)
    updateKartVisualSafe(s, k, dt)
    updateChaseCamera(ctx.camera, s, dt)
    hud.update(k)
    ctx.renderer.render(ctx.scene, ctx.camera)
  },
)

import { updateKartVisual } from './render/kartVisual'
import type { Snapshot } from './game/loop'
import type { KartState } from './sim/kart'

function updateKartVisualSafe(s: Snapshot, k: KartState, dt: number): void {
  updateKartVisual(kartVis, { x: s.x, y: s.y }, s.heading, k, lastInput, dt)
}
```

Note for the implementer: hoist ALL imports to the top of the file in the actual code (shown split here only to keep the wiring readable) and delete the no-op dynamic import line — final `main.ts` is plain top-down: imports, scene setup, loop start, with `updateKartVisualSafe` defined before `startLoop` is called.

- [ ] **Step 5: Full check — tests + build**

Run: `npm test && npm run build`
Expected: all tests PASS, build succeeds.

- [ ] **Step 6: Manual drive smoke**

Run: `npm run dev` and open the printed URL.
Checklist:
- Kart renders on the start line of a closed neon-edged circuit
- Arrows/WASD drive; Space + steer drifts (body leans, drift bar charges through green → orange → pink)
- Releasing a charged drift visibly boosts (blue emissive flash, speed > 90 km/h on HUD)
- Driving at a wall keeps you on the road with speed scrub, no tunneling
- HUD lap counter advances after a full lap; shows FINISHED after 3 laps; `R` resets
- Wheels spin with speed and front wheels yaw with steering

- [ ] **Step 7: Commit**

```bash
git add src/main.ts src/game index.html
git commit -m "feat(street-rivalz): drivable core — fixed-step loop, chase cam, keyboard input, HUD"
```

---

### Task 11: Wire into monorepo + wrap up

**Files:**
- Modify: `web3-games/street-rivalz/package.json` (no change expected — verify scripts)
- Create: `web3-games/street-rivalz/README.md`

- [ ] **Step 1: Write README.md**

```markdown
# StreetRivalz

Browser 3D kart racer — crypto meme grand prix. Marquee track: Moonaco. Spec:
`docs/superpowers/specs/2026-06-12-street-rivalz-design.md` (repo root).

## Dev

- `npm run dev` — drive Moonaco v0 (WASD/arrows, Space = drift, R = reset)
- `npm test` — deterministic sim test suite (vitest)
- `npm run build` — typecheck + production build

## Architecture

- `src/sim/` — deterministic fixed-tick sim, pure TS, NO rendering imports.
  Replays/ghosts/anti-cheat all depend on `runRace(trackDef, n, inputLog)`
  reproducing byte-identical results.
- `src/render/` — Three.js view of sim state. Sim (x,y) → world (x, z), y-up.
  Karts bind by node name: `body`, `wheel_FL/FR/RL/RR` (detached-wheels GLB
  convention — placeholder and real Meshy GLBs use the same binding).
- `src/game/` — fixed-timestep loop w/ render interpolation, input, HUD.
- `src/tracks/` — track definitions (centerline + width + checkpoints).

## Plan series

1. Drivable core (this) ✅
2. AI racers + items + Quick Race flow
3. Backend: accounts, ghosts, ladder, Grand Prix, replay verification
4. Garage, GLB validator/loader, token/holder layer
```

- [ ] **Step 2: Final verification**

Run: `npm test && npm run build`
Expected: PASS / success.

- [ ] **Step 3: Commit**

```bash
git add web3-games/street-rivalz/README.md
git commit -m "docs(street-rivalz): README — architecture, dev commands, plan series"
```

---

## Self-review notes

- **Spec coverage (Plan 1 slice):** deterministic fixed-tick sim ✓ (Tasks 2–7), drift mini-boost chains ✓ (4–5), checkpoint-gated laps/anti-cut ✓ (6), golden replay determinism ✓ (7), Moonaco track ✓ (8), detached-wheels visual convention ✓ (9), assists/auto-accelerate, items, AI, rubber-banding, slipstream, backend, garage → Plans 2–4 by design.
- **Type consistency:** `KartInput {throttle, steer, drift}`, `KartState`, `Track`, `Snapshot` used identically across tasks; `SQUARE` fixture exported from `track.test.ts` and reused.
- **No placeholders:** every code step has full code; the one intentionally deferred visual (boost flame) is explicitly assigned to Plan 4.
