import { describe, it, expect } from 'vitest'
import { rubberBandMultiplier, rankByProgress } from '../../src/sim/rubberband'

describe('rubberBandMultiplier', () => {
  it('gives first place no help and last place the most', () => {
    expect(rubberBandMultiplier(0, 6)).toBe(1.0)
    expect(rubberBandMultiplier(5, 6)).toBe(1.12)
  })

  it('increases monotonically with rank', () => {
    const vals = [0, 1, 2, 3, 4, 5].map((r) => rubberBandMultiplier(r, 6))
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i]).toBeGreaterThanOrEqual(vals[i - 1])
    }
  })

  it('returns 1 for solo race', () => {
    expect(rubberBandMultiplier(0, 1)).toBe(1.0)
  })
})

describe('rankByProgress', () => {
  it('orders karts by lap+progress', () => {
    const karts = [
      { lap: 1, progress: 10, finished: false },
      { lap: 2, progress: 5, finished: false },
      { lap: 1, progress: 50, finished: false },
    ]
    expect(rankByProgress(karts)).toEqual([2, 0, 1]) // kart1 leads, then kart2, then kart0
  })

  it('puts finished karts at the front', () => {
    const karts = [
      { lap: 1, progress: 10, finished: true },
      { lap: 3, progress: 100, finished: false },
    ]
    expect(rankByProgress(karts)).toEqual([0, 1])
  })
})
