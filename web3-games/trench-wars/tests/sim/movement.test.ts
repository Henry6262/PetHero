import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { STARTER_DECK } from '../../src/sim/cards'
import { RIVER_Y, LANE_LEFT_X } from '../../src/sim/constants'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]

describe('movement', () => {
  it('a unit advances toward the river bridge of its lane, then crosses', () => {
    let s = createMatch(1, decks)
    s = step(s, [{ tick: 0, player: 0, cardId: 'jeet-horde', x: 3, y: 8 }])
    const startY = s.units[0].y
    for (let i = 0; i < 40; i++) s = step(s, [])
    const u = s.units[0]
    expect(u.y).toBeGreaterThan(startY)              // marching up
    expect(Math.abs(u.x - LANE_LEFT_X)).toBeLessThan(3) // pulled toward left bridge
    // keep stepping until it crosses (enemy tower fire kills it later — stop at the crossing)
    let crossed = false
    for (let i = 0; i < 300 && !crossed; i++) {
      s = step(s, [])
      crossed = s.units.length > 0 && s.units[0].y > RIVER_Y
    }
    expect(crossed).toBe(true)
  })
  it('speed stat is respected (fast unit outruns slow unit)', () => {
    let s = createMatch(1, decks)
    // both cards are in the starting hand and affordable together (2 + 1 <= 5 elixir)
    s = step(s, [
      { tick: 0, player: 0, cardId: 'jeet-horde', x: 4.5, y: 8 },
      { tick: 0, player: 0, cardId: 'bag-holder', x: 4.5, y: 8 },
    ])
    for (let i = 0; i < 30; i++) s = step(s, [])
    const fast = s.units.find(u => u.cardId === 'jeet-horde')!  // speed 0.16
    const slow = s.units.find(u => u.cardId === 'bag-holder')!  // speed 0.10
    expect(fast.y).toBeGreaterThan(slow.y)
  })
})
