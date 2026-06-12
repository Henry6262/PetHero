import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { STARTER_DECK } from '../../src/sim/cards'
import { MATCH_TICKS, OVERTIME_TICKS } from '../../src/sim/constants'
import type { SimState, PlayerId } from '../../src/sim/types'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]
const laneTower = (s: SimState, owner: PlayerId, i = 0) => s.towers.filter(t => t.owner === owner && t.kind === 'lane')[i]
const king = (s: SimState, owner: PlayerId) => s.towers.find(t => t.owner === owner && t.kind === 'king')!

describe('towers', () => {
  it('an active tower attacks a unit in range', () => {
    let s = createMatch(1, decks)
    // chad-trader (420hp) survives tower hits long enough to observe the damage
    s = step(s, [{ tick: 0, player: 0, cardId: 'chad-trader', x: 4.5, y: 14 }])
    let damaged = false
    for (let i = 0; i < 900 && !damaged && s.units.length > 0; i++) {
      s = step(s, [])
      damaged = s.units.some(u => u.hp < u.maxHp)
    }
    expect(damaged).toBe(true)
  })
  it('king activates when a lane tower falls', () => {
    let s = createMatch(1, decks)
    s.decks[0][0] = 'liquidation-cascade' // ensure spell is in hand
    const lt = laneTower(s, 1)
    lt.hp = 1
    // liquidation-cascade is castable anywhere: 180 * 0.5 tower damage finishes it instantly
    s = step(s, [{ tick: 0, player: 0, cardId: 'liquidation-cascade', x: lt.x, y: lt.y }])
    expect(laneTower(s, 1).hp).toBeLessThanOrEqual(0)
    expect(king(s, 1).active).toBe(true)
  })
  it('king destruction ends the match immediately', () => {
    let s = createMatch(1, decks)
    s.decks[0][0] = 'liquidation-cascade' // ensure spell is in hand
    const k = king(s, 1)
    k.hp = 1
    s = step(s, [{ tick: 0, player: 0, cardId: 'liquidation-cascade', x: k.x, y: k.y }])
    expect(s.result).toEqual({ winner: 0, reason: 'king' })
  })
  it('at full time, more crowns wins', () => {
    let s = createMatch(1, decks)
    laneTower(s, 1).hp = 0
    s.tick = MATCH_TICKS - 1
    s = step(s, [])
    expect(s.result).toEqual({ winner: 0, reason: 'crowns' })
  })
  it('tie at full time enters overtime; tower-damage tiebreak ends it after overtime', () => {
    let s = createMatch(1, decks)
    s.tick = MATCH_TICKS - 1
    s = step(s, [])
    expect(s.result).toBeNull()
    expect(s.overtime).toBe(true)
    // player 0 chipped the enemy tower more
    laneTower(s, 1).hp -= 500
    laneTower(s, 0).hp -= 100
    s.tick = MATCH_TICKS + OVERTIME_TICKS - 1
    s = step(s, [])
    expect(s.result).toEqual({ winner: 0, reason: 'tiebreak' })
  })
  it('perfect tie is a draw', () => {
    let s = createMatch(1, decks)
    s.tick = MATCH_TICKS - 1
    s = step(s, [])
    s.tick = MATCH_TICKS + OVERTIME_TICKS - 1
    s = step(s, [])
    expect(s.result).toEqual({ winner: null, reason: 'draw' })
  })
})
