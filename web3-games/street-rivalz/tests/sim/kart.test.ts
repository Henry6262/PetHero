import { describe, it, expect } from 'vitest'
import { createKart, stepKart, DEFAULT_KART, KartInput } from '../../src/sim/kart'
import { v, len } from '../../src/sim/math'

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

  it('auto-releases when speed drops too low (no charge-camping at a crawl)', () => {
    const k = cruise()
    const driftBrake: KartInput = { throttle: -1, steer: 1, drift: true }
    stepKart(k, { throttle: 1, steer: 1, drift: true }, DEFAULT_KART)
    expect(k.drift.active).toBe(true)
    // brake hard while holding drift: once below driftMinSpeed*0.6 the drift must end
    for (let i = 0; i < 600 && k.drift.active; i++) stepKart(k, driftBrake, DEFAULT_KART)
    expect(k.drift.active).toBe(false)
    expect(len(k.vel)).toBeLessThan(DEFAULT_KART.driftMinSpeed * 0.6 + 0.5)
  })

  it('cannot initiate a drift while reversing', () => {
    const k = createKart(v(0, 0), 0)
    k.vel = v(-15, 0) // sliding backwards fast: |vel| > driftMinSpeed but forward speed < 0
    stepKart(k, { throttle: 0, steer: 1, drift: true }, DEFAULT_KART)
    expect(k.drift.active).toBe(false)
  })
})
