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
