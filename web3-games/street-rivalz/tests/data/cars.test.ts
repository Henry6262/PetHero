import { describe, it, expect } from 'vitest'
import { CARS, carById, DEFAULT_CAR } from '../../src/data/cars'

describe('car data', () => {
  it('has 6 unique cars with valid params', () => {
    expect(CARS.length).toBe(6)
    const ids = new Set(CARS.map((c) => c.id))
    expect(ids.size).toBe(CARS.length)
    for (const c of CARS) {
      expect(c.params.accel).toBeGreaterThan(0)
      expect(c.params.maxSpeed).toBeGreaterThan(0)
      expect(c.params.grip).toBeGreaterThan(0)
      expect(c.params.driftGrip).toBeGreaterThan(0)
      expect(c.params.boostTicks.length).toBe(3)
      expect(c.params.chargeTiers.length).toBe(3)
    }
  })

  it('default car is the Paper Hands Scooter', () => {
    expect(DEFAULT_CAR.id).toBe('paper-scooter')
  })

  it('carById finds cars and throws on unknown', () => {
    expect(carById('mev-bot').name).toBe('MEV Bot F1')
    expect(() => carById('not-a-car')).toThrow()
  })
})
