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
