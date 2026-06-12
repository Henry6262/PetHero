import { describe, it, expect } from 'vitest'
import { buildTrack } from '../../src/sim/track'
import { SQUARE } from '../sim/track.test'
import { createQuickRace, stepQuickRace, COUNTDOWN_TICKS } from '../../src/game/quickRace'

const PLAYER_INPUT = { throttle: 1, steer: 0, drift: false, useItem: false }

describe('createQuickRace', () => {
  it('creates a race with 6 karts and a countdown', () => {
    const track = buildTrack(SQUARE)
    const qr = createQuickRace(track, 6, 42)
    expect(qr.race.karts).toHaveLength(6)
    expect(qr.countdownTicks).toBe(COUNTDOWN_TICKS)
    expect(qr.started).toBe(false)
  })
})

describe('stepQuickRace', () => {
  it('does not move karts during countdown', () => {
    const track = buildTrack(SQUARE)
    const qr = createQuickRace(track, 6, 42)
    const p0 = qr.race.karts[0].pos.x
    for (let i = 0; i < COUNTDOWN_TICKS; i++) stepQuickRace(qr, PLAYER_INPUT)
    expect(qr.started).toBe(true)
    expect(qr.race.karts[0].pos.x).toBeCloseTo(p0, 3)
  })

  it('moves karts after countdown', () => {
    const track = buildTrack(SQUARE)
    const qr = createQuickRace(track, 6, 42)
    for (let i = 0; i < COUNTDOWN_TICKS; i++) stepQuickRace(qr, PLAYER_INPUT)
    const p0 = qr.race.karts[0].progress
    for (let i = 0; i < 120; i++) stepQuickRace(qr, PLAYER_INPUT)
    expect(qr.race.karts[0].progress).not.toBeCloseTo(p0, 0)
  })

  it('produces results when race finishes or times out', () => {
    const track = buildTrack(SQUARE)
    const qr = createQuickRace(track, 6, 42, COUNTDOWN_TICKS + 50)
    for (let i = 0; i < COUNTDOWN_TICKS + 100; i++) stepQuickRace(qr, PLAYER_INPUT)
    expect(qr.results).toBeDefined()
    expect(qr.results!.length).toBe(6)
    expect(qr.results![0].rank).toBe(1)
  })
})
