import { describe, it, expect } from 'vitest'
import { buildTrack, sampleTrack, forwardDelta, TrackDef } from '../../src/sim/track'
import { v } from '../../src/sim/math'

// 100x100 square loop, CCW, 4 points
export const SQUARE: TrackDef = {
  name: 'square',
  width: 14,
  centerline: [[0, 0], [100, 0], [100, 100], [0, 100]],
  checkpoints: [0, 1, 2, 3],
  itemBoxes: [50, 150, 250, 350],
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
