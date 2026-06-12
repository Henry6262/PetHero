import { describe, it, expect } from 'vitest'
import { createKart, KartState } from '../../src/sim/kart'
import { v } from '../../src/sim/math'
import { applyItemUse, resolveItemWorld, rollItem, DroppedTrap, FudCloud } from '../../src/sim/items'
import { ITEMS } from '../../src/data/items'

function makeKarts(n: number): KartState[] {
  return Array.from({ length: n }, (_, i) => createKart(v(i * 3, 0), 0))
}

describe('applyItemUse', () => {
  it('candle-boost gives boost ticks', () => {
    const k = createKart(v(0, 0), 0)
    applyItemUse(k, 'candle-boost', { traps: [], clouds: [] }, [k], 0)
    expect(k.boostTicks).toBeGreaterThan(0)
  })

  it('diamond-shield gives shield ticks', () => {
    const k = createKart(v(0, 0), 0)
    applyItemUse(k, 'diamond-shield', { traps: [], clouds: [] }, [k], 0)
    expect(k.shieldTicks).toBeGreaterThan(0)
  })

  it('pump-rocket spins out the kart ahead', () => {
    const karts = makeKarts(2)
    karts[1].progress = 100 // ahead
    applyItemUse(karts[0], 'pump-rocket', { traps: [], clouds: [] }, karts, 0)
    expect(karts[1].spinoutTicks).toBeGreaterThan(0)
    expect(karts[0].spinoutTicks).toBe(0)
  })

  it('shield blocks pump-rocket', () => {
    const karts = makeKarts(2)
    karts[1].progress = 100
    karts[1].shieldTicks = 10
    applyItemUse(karts[0], 'pump-rocket', { traps: [], clouds: [] }, karts, 0)
    expect(karts[1].spinoutTicks).toBe(0)
  })

  it('liquidation-wave hits all ahead', () => {
    const karts = makeKarts(3)
    karts[1].progress = 50
    karts[2].progress = 100
    applyItemUse(karts[0], 'liquidation-wave', { traps: [], clouds: [] }, karts, 0)
    expect(karts[1].spinoutTicks).toBeGreaterThan(0)
    expect(karts[2].spinoutTicks).toBeGreaterThan(0)
  })

  it('rug-pull drops a trap', () => {
    const karts = makeKarts(1)
    const world = { traps: [] as DroppedTrap[], clouds: [] as FudCloud[] }
    applyItemUse(karts[0], 'rug-pull', world, karts, 0)
    expect(world.traps.length).toBe(1)
  })

  it('fud-cloud drops a cloud', () => {
    const karts = makeKarts(1)
    const world = { traps: [] as DroppedTrap[], clouds: [] as FudCloud[] }
    applyItemUse(karts[0], 'fud-cloud', world, karts, 0)
    expect(world.clouds.length).toBe(1)
  })
})

describe('resolveItemWorld', () => {
  it('trap triggers spinout when kart drives over it', () => {
    const karts = makeKarts(2)
    const world = { traps: [{ pos: v(0, 0), ownerIndex: 0 }], clouds: [] }
    karts[1].pos = v(0, 0)
    resolveItemWorld(karts, world)
    expect(karts[1].spinoutTicks).toBeGreaterThan(0)
    expect(world.traps.length).toBe(0)
  })

  it('cloud slows karts inside and expires', () => {
    const karts = makeKarts(2)
    const world = { traps: [], clouds: [{ pos: v(0, 0), ticks: 1, ownerIndex: 0 }] }
    karts[1].pos = v(0, 0)
    resolveItemWorld(karts, world)
    expect(karts[1].slowTicks).toBeGreaterThan(0)
    resolveItemWorld(karts, world)
    expect(world.clouds.length).toBe(0)
  })
})

describe('rollItem', () => {
  it('returns a valid item type', () => {
    const rng = () => 0.5
    const item = rollItem(5, rng)
    expect(ITEMS.some((it) => it.id === item)).toBe(true)
  })
})
