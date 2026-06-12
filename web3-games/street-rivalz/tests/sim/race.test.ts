import { describe, it, expect } from 'vitest'
import { buildTrack } from '../../src/sim/track'
import { createKart, stepKart, DEFAULT_KART, KART_RADIUS, KartInput } from '../../src/sim/kart'
import { applyTrackConstraints, updateCheckpoints, createRace, stepRace } from '../../src/sim/race'
import { v, len, sub } from '../../src/sim/math'
import { SQUARE } from './track.test'

const THROTTLE: KartInput = { throttle: 1, steer: 0, drift: false }

describe('applyTrackConstraints', () => {
  it('keeps a kart driving at a wall inside the road', () => {
    const track = buildTrack(SQUARE)
    const k = createKart(v(50, 0), Math.PI / 2) // on bottom edge, aimed straight off-road
    for (let i = 0; i < 300; i++) {
      stepKart(k, THROTTLE, DEFAULT_KART)
      applyTrackConstraints(k, track)
    }
    const half = SQUARE.width / 2 - KART_RADIUS
    expect(Math.abs(k.pos.y)).toBeLessThanOrEqual(half + 0.01)
  })

  it('updates kart progress', () => {
    const track = buildTrack(SQUARE)
    const k = createKart(v(30, 0), 0)
    applyTrackConstraints(k, track)
    expect(k.progress).toBeCloseTo(30)
  })
})

describe('updateCheckpoints', () => {
  it('advances checkpoints in order and counts laps at start/finish', () => {
    const track = buildTrack(SQUARE)
    const k = createKart(v(0, 0), 0)
    // teleport around the loop hitting each checkpoint in order
    const route = [v(100, 0), v(100, 100), v(0, 100), v(0, 0)]
    for (const p of route) {
      k.pos = p
      applyTrackConstraints(k, track)
      updateCheckpoints(k, track)
    }
    expect(k.lap).toBe(2)
    expect(k.cpIndex).toBe(0)
  })

  it('ignores a checkpoint hit out of order (anti-cut)', () => {
    const track = buildTrack(SQUARE)
    const k = createKart(v(0, 0), 0)
    k.pos = v(100, 100) // checkpoint 2, but next required is 1
    applyTrackConstraints(k, track)
    updateCheckpoints(k, track)
    expect(k.cpIndex).toBe(0)
    expect(k.lap).toBe(1)
  })

  it('marks finished after TOTAL_LAPS', () => {
    const track = buildTrack(SQUARE)
    const k = createKart(v(0, 0), 0)
    const route = [v(100, 0), v(100, 100), v(0, 100), v(0, 0)]
    for (let lap = 0; lap < 3; lap++) {
      for (const p of route) {
        k.pos = p
        applyTrackConstraints(k, track)
        updateCheckpoints(k, track)
      }
    }
    expect(k.finished).toBe(true)
  })
})

describe('createRace / stepRace', () => {
  it('spawns karts on the grid facing the first segment', () => {
    const track = buildTrack(SQUARE)
    const race = createRace(track, 2)
    expect(race.karts).toHaveLength(2)
    expect(race.karts[0].heading).toBeCloseTo(0) // segment 0->1 of SQUARE points +x
    // staggered, not overlapping
    expect(len(sub(race.karts[0].pos, race.karts[1].pos))).toBeGreaterThan(2)
  })

  it('a throttling kart makes forward progress on track', () => {
    const track = buildTrack(SQUARE)
    const race = createRace(track, 1)
    for (let i = 0; i < 300; i++) stepRace(race, track, [THROTTLE])
    expect(race.karts[0].progress).toBeGreaterThan(20)
    expect(race.tick).toBe(300)
  })
})
