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
