import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { STARTER_DECK, getCard } from '../../src/sim/cards'
import { SPELL_TOWER_DAMAGE_MULT, LANE_LEFT_X } from '../../src/sim/constants'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]

describe('liquidation-cascade', () => {
  it('damages enemy units in radius, allies unharmed, towers take half', () => {
    let s = createMatch(1, decks)
    const lx = LANE_LEFT_X
    const laneTower = s.towers.find(t => t.owner === 1 && t.kind === 'lane' && t.x === lx)!
    const ty = laneTower.y // wherever the lane tower sits
    s.decks[0][0] = 'jeet-horde'
    s.decks[0][1] = 'liquidation-cascade'
    s = step(s, [{ tick: 0, player: 0, cardId: 'jeet-horde', x: lx, y: 10 }])
    s = step(s, [{ tick: 1, player: 1, cardId: 'jeet-horde', x: lx, y: ty - 1.5 }])
    const towerBefore = s.towers.find(t => t.owner === 1 && t.kind === 'lane' && t.x === lx)!.hp
    s.decks[0][0] = 'liquidation-cascade' // ensure still in hand after cycle
    s.elixir[0] = 10
    s = step(s, [{ tick: 2, player: 0, cardId: 'liquidation-cascade', x: lx, y: ty - 1.2 }])
    const spell = getCard('liquidation-cascade')
    // 180 damage one-shots all three 90hp jeets in the radius
    expect(s.units.filter(u => u.owner === 1).length).toBe(0)
    const tower = s.towers.find(t => t.owner === 1 && t.kind === 'lane' && t.x === lx)!
    expect(towerBefore - tower.hp).toBe(Math.round(spell.effectDamage! * SPELL_TOWER_DAMAGE_MULT))
  })
})

describe('pump-signal', () => {
  it('buffs friendly units in radius for buffTicks', () => {
    let s = createMatch(1, decks)
    s.decks[0][0] = 'jeet-horde'
    s.decks[0][1] = 'pump-signal'
    s = step(s, [{ tick: 0, player: 0, cardId: 'jeet-horde', x: 9, y: 8 }])
    s = step(s, [{ tick: 1, player: 0, cardId: 'pump-signal', x: 9, y: 8 }])
    const spell = getCard('pump-signal')
    for (const u of s.units) expect(u.buffUntil).toBe(1 + spell.buffTicks!)
  })
})
