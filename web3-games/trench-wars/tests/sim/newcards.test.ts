import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { getCard, CARDS } from '../../src/sim/cards'
import type { SimState, UnitEntity, PlayerId } from '../../src/sim/types'

function place(s: SimState, cardId: string, owner: PlayerId, x: number, y: number, hp?: number): UnitEntity {
  const card = getCard(cardId)
  const u: UnitEntity = {
    id: s.nextId++, owner, cardId, x, y,
    hp: hp ?? card.hp!, maxHp: card.hp!,
    cooldown: 0, fleeing: false,
    revealed: card.stealthRange === undefined, buffUntil: 0, slowUntil: 0, hasAttacked: false,
  }
  s.units.push(u)
  return u
}
const deck = ['bag-holder', 'jeet-horde', 'paper-hands', 'chad-trader', 'diamond-hands', 'mev-bots', 'pump-signal', 'liquidation-cascade']
const fresh = () => createMatch(1, [[...deck], [...deck]])

describe('new card definitions', () => {
  it('all 20 cards validate, with the 6 new ones present', () => {
    const ids = CARDS.map(c => c.id)
    expect(CARDS.length).toBe(20)
    for (const id of ['scalper', 'discord-raid', 'moon-boy', 'trading-bot', 'gas-war', 'copium']) {
      expect(ids).toContain(id)
    }
  })
})

describe('moon-boy (targetsTowers)', () => {
  it('ignores a nearby enemy unit and walks past it toward the tower', () => {
    let s = fresh()
    const moon = place(s, 'moon-boy', 0, 9, 14)
    const blocker = place(s, 'bag-holder', 1, 9, 14.5) // right in its face
    const hpBefore = blocker.hp
    for (let i = 0; i < 5; i++) s = step(s, [])
    const moonAfter = s.units.find(u => u.cardId === 'moon-boy')!
    const blockerAfter = s.units.find(u => u.cardId === 'bag-holder')
    // moon-boy kept moving up toward the enemy tower instead of stopping to fight
    expect(moonAfter.y).toBeGreaterThan(moon.y)
    // it never attacked the blocker (blocker only loses hp if moon-boy hit it)
    if (blockerAfter) expect(blockerAfter.hp).toBe(hpBefore)
  })
})

describe('trading-bot (building)', () => {
  it('does not move, attacks enemies in range, and decays over its lifespan', () => {
    let s = fresh()
    const bot = place(s, 'trading-bot', 0, 9, 10)
    const startX = bot.x, startY = bot.y, startHp = bot.hp
    const enemy = place(s, 'jeet-horde', 1, 9, 13) // within range 5.0
    const enemyHp = enemy.hp
    s = step(s, [])
    const botAfter = s.units.find(u => u.cardId === 'trading-bot')!
    expect(botAfter.x).toBe(startX)
    expect(botAfter.y).toBe(startY)
    expect(botAfter.hp).toBeLessThan(startHp) // decayed
    expect(s.units.find(u => u.cardId === 'jeet-horde')!.hp).toBeLessThan(enemyHp) // shot it
  })

  it('decays to death within its lifespan with no enemies', () => {
    let s = fresh()
    place(s, 'trading-bot', 0, 9, 10)
    const life = getCard('trading-bot').lifespan!
    for (let i = 0; i < life + 2 && s.units.length > 0; i++) s = step(s, [])
    expect(s.units.find(u => u.cardId === 'trading-bot')).toBeUndefined()
  })
})

describe('gas-war (cheap damage spell)', () => {
  it('damages enemy units in radius', () => {
    let s = fresh()
    s.decks[0][0] = 'gas-war'
    place(s, 'discord-raid', 1, 9, 20)
    place(s, 'discord-raid', 1, 9.3, 20)
    s.elixir[0] = 10
    s = step(s, [{ tick: 0, player: 0, cardId: 'gas-war', x: 9, y: 20 }])
    expect(s.units.filter(u => u.owner === 1).length).toBe(0) // 90 dmg kills 70hp discord units
  })
})

describe('copium (heal spell)', () => {
  it('heals damaged friendly units in radius, capped at maxHp', () => {
    let s = fresh()
    s.decks[0][0] = 'copium'
    const ally = place(s, 'chad-trader', 0, 9, 8, 100) // damaged to 100
    s.elixir[0] = 10
    s = step(s, [{ tick: 0, player: 0, cardId: 'copium', x: 9, y: 8 }])
    const healed = s.units.find(u => u.id === ally.id)!
    expect(healed.hp).toBe(Math.min(ally.maxHp, 100 + getCard('copium').effectHeal!))
  })
})

describe('scalper (cheap fast cycle)', () => {
  it('deploys for 1 elixir and cycles to the back of the deck', () => {
    let s = fresh()
    s.decks[0][0] = 'scalper'
    s.elixir[0] = 5
    s = step(s, [{ tick: 0, player: 0, cardId: 'scalper', x: 9, y: 8 }])
    expect(s.units.some(u => u.cardId === 'scalper')).toBe(true)
    expect(s.elixir[0]).toBeCloseTo(5 - 1 + 0.05, 5) // spent 1, regen 1 tick
    expect(s.decks[0][s.decks[0].length - 1]).toBe('scalper') // cycled to back
  })
})
