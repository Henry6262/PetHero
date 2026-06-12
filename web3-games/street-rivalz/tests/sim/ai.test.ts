import { describe, it, expect } from 'vitest'
import { buildTrack } from '../../src/sim/track'
import { createRace, stepRace } from '../../src/sim/race'
import { aiInput, aiInputs } from '../../src/sim/ai'
import { SQUARE } from './track.test'

describe('aiInput', () => {
  it('keeps an AI kart moving forward on a simple loop', () => {
    const track = buildTrack(SQUARE)
    const race = createRace(track, 2)
    const startProgress = race.karts[1].progress
    for (let i = 0; i < 300; i++) {
      const inputs = aiInputs({ track, karts: race.karts })
      stepRace(race, track, inputs)
    }
    expect(race.karts[1].progress).not.toBeCloseTo(startProgress, 0)
    expect(race.karts[1].progress).toBeGreaterThan(50)
  })

  it('produces valid input ranges', () => {
    const track = buildTrack(SQUARE)
    const race = createRace(track, 2)
    const input = aiInput(race.karts[1], { track, karts: race.karts })
    expect(input.throttle).toBeGreaterThanOrEqual(-1)
    expect(input.throttle).toBeLessThanOrEqual(1)
    expect(input.steer).toBeGreaterThanOrEqual(-1)
    expect(input.steer).toBeLessThanOrEqual(1)
    expect(typeof input.drift).toBe('boolean')
  })
})
