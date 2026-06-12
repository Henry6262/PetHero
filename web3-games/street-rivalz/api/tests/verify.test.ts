import { describe, it, expect } from 'vitest'
import { verifyReplay } from '../src/verify'
import { SQUARE } from '../../tests/sim/track.test'
import { DEFAULT_KART, KartInput } from '../../src/sim/kart'
import { buildTrack } from '../../src/sim/track'
import { createRace, stepRace } from '../../src/sim/race'
import { aiInput } from '../../src/sim/ai'

function aiReplay(ticks: number): KartInput[][] {
  const track = buildTrack(SQUARE)
  const race = createRace(track, 1)
  const inputs: KartInput[][] = []
  for (let i = 0; i < ticks; i++) {
    const input = aiInput(race.karts[0], { track, karts: race.karts })
    inputs.push([input])
    stepRace(race, track, [input])
  }
  return inputs
}

describe('verifyReplay', () => {
  it('accepts a valid time-trial replay that finishes', () => {
    const inputs = aiReplay(3000)
    const res = verifyReplay({ trackDef: SQUARE, carId: 'paper-scooter', seed: 1, inputs }, DEFAULT_KART)
    expect(res.valid).toBe(true)
    expect(res.finalTime).toBeGreaterThan(0)
  })

  it('rejects an unfinished replay', () => {
    const inputs = aiReplay(60)
    const res = verifyReplay({ trackDef: SQUARE, carId: 'paper-scooter', seed: 1, inputs }, DEFAULT_KART)
    expect(res.valid).toBe(false)
    expect(res.error).toContain('did not finish')
  })
})
