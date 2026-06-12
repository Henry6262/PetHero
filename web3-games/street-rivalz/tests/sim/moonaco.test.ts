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
