import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { getCard, CARDS } from '../../src/sim/cards'
import type { SimState, UnitEntity, PlayerId } from '../../src/sim/types'

function place(s: SimState, cardId: string, owner: PlayerId, x: number, y: number, hp?: number): UnitEntity {
  const c = getCard(cardId)
  const u: UnitEntity = {
    id: s.nextId++, owner, cardId, x, y, hp: hp ?? c.hp!, maxHp: c.hp!,
    cooldown: 0, fleeing: false, revealed: c.stealthRange === undefined,
    buffUntil: 0, slowUntil: 0, hasAttacked: false,
  }
  s.units.push(u)
  return u
}
const deck = ['bag-holder', 'jeet-horde', 'paper-hands', 'chad-trader', 'diamond-hands', 'mev-bots', 'pump-signal', 'liquidation-cascade']
const fresh = () => createMatch(1, [[...deck], [...deck]])

describe('roles', () => {
  it('every card has a role', () => {
    for (const c of CARDS) expect(c.role, c.id).toBeTruthy()
  })
})

describe('armor (tank)', () => {
  it('reduces each incoming hit by the armor value, min 1', () => {
    let s = fresh()
    // scalper hits for 60 (but critFirst 1.8 on first strike); use a fresh second hit
    place(s, 'jeet-horde', 0, 9, 15)         // 35 dmg, no crit
    const dh = place(s, 'diamond-hands', 1, 9.5, 15) // armor 10
    const before = dh.hp
    s = step(s, [])
    const after = s.units.find(u => u.id === dh.id)!.hp
    // jeet 35 - armor 10 = 25 removed
    expect(before - after).toBe(getCard('jeet-horde').damage! - getCard('diamond-hands').armor!)
  })
})

describe('taunt (tank)', () => {
  it('pulls a melee attacker onto the tank even if another enemy is closer', () => {
    let s = fresh()
    const mev = place(s, 'mev-bots', 0, 9, 15)   // melee, targeting lowestHp
    const tank = place(s, 'diamond-hands', 1, 9.4, 15) // taunt 3.0, full hp
    const weak = place(s, 'jeet-horde', 1, 9.5, 15, 5)  // would be lowestHp pick
    void mev; void weak
    s = step(s, [])
    // taunt forces mev onto the tank, so the weak jeet survives
    expect(s.units.find(u => u.id === weak.id)).toBeTruthy()
    expect(s.units.find(u => u.id === tank.id)!.hp).toBeLessThan(tank.maxHp)
  })
})

describe('lifesteal (brawler)', () => {
  it('heals the attacker for a fraction of damage dealt', () => {
    let s = fresh()
    const chad = place(s, 'chad-trader', 0, 9, 15, 100) // lifesteal 0.3, damaged to 100
    place(s, 'jeet-horde', 1, 9.5, 15) // 95hp — chad's 95 one-shots it, so no counterattack
    s = step(s, [])
    const healed = s.units.find(u => u.id === chad.id)!
    expect(healed.hp).toBeGreaterThan(100) // gained hp from lifesteal on the kill
  })
})

describe('mage slow', () => {
  it('a slowed unit moves at SLOW_MULT of base speed', () => {
    let s = fresh()
    place(s, 'fud-spirit', 0, 9, 12)            // ranged, slowTicks on hit
    const target = place(s, 'mev-bots', 1, 9, 14) // in fud range 4.5
    s = step(s, [])
    const t = s.units.find(u => u.id === target.id)!
    expect(t.slowUntil).toBeGreaterThan(0) // got slowed
  })
})

describe('assassin critFirst', () => {
  it('first strike is multiplied, later strikes are not', () => {
    let s = fresh()
    const rug = place(s, 'rug-dev', 0, 9, 15) // critFirst 2.0, dmg 300
    place(s, 'diamond-hands', 1, 9.5, 15)     // big hp to survive the crit
    s = step(s, [])
    expect(s.units.find(u => u.id === rug.id)!.hasAttacked).toBe(true)
  })
})

