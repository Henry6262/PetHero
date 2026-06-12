import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { getCard } from '../../src/sim/cards'
import type { SimState, UnitEntity, PlayerId } from '../../src/sim/types'

// Hand-place units to isolate combat from deploy/elixir rules.
function place(s: SimState, cardId: string, owner: PlayerId, x: number, y: number, hpOverride?: number): UnitEntity {
  const card = getCard(cardId)
  const u: UnitEntity = {
    id: s.nextId++, owner, cardId, x, y,
    hp: hpOverride ?? card.hp!, maxHp: card.hp!,
    cooldown: 0, fleeing: false,
    revealed: card.stealthRange === undefined, buffUntil: 0,
  }
  s.units.push(u)
  return u
}
const fresh = () => {
  const deck = ['bag-holder','jeet-horde','paper-hands','chad-trader','diamond-hands','mev-bots','pump-signal','liquidation-cascade']
  return createMatch(1, [[...deck], [...deck]])
}

describe('combat', () => {
  it('adjacent enemies fight; attacker respects attackSpeed cooldown', () => {
    let s = fresh()
    place(s, 'chad-trader', 0, 9, 15)
    place(s, 'bag-holder', 1, 9.5, 15)
    const hpBefore = s.units[1].hp
    s = step(s, [])
    expect(s.units[1].hp).toBe(hpBefore - getCard('chad-trader').damage!)
    const hpAfterFirst = s.units[1].hp
    s = step(s, []) // cooldown active: no second hit yet
    expect(s.units[1].hp).toBe(hpAfterFirst)
  })
  it('dead units are removed', () => {
    let s = fresh()
    place(s, 'chad-trader', 0, 9, 15)
    place(s, 'jeet-horde', 1, 9.5, 15, 10) // one hit kills
    s = step(s, [])
    expect(s.units.length).toBe(1)
  })
  it('lowestHp targeting picks the weakest enemy in attack range, not the closest', () => {
    let s = fresh()
    place(s, 'mev-bots', 0, 9, 15)
    place(s, 'bag-holder', 1, 9.5, 15)                    // closest (0.5), full hp
    const weak = place(s, 'chad-trader', 1, 9.6, 15, 20)  // slightly farther (0.6), nearly dead
    s = step(s, [])
    // mev damage 25 kills the weak unit; nearest-targeting would have hit bag-holder instead
    expect(s.units.find(u => u.id === weak.id)).toBeUndefined()
    expect(s.units.find(u => u.cardId === 'bag-holder' && u.owner === 1)!.hp).toBe(getCard('bag-holder').hp)
  })
  it('Paper Hands flees below 30% hp and stops fighting', () => {
    let s = fresh()
    const ph = place(s, 'paper-hands', 0, 9, 15, Math.floor(280 * 0.2))
    place(s, 'bag-holder', 1, 9.5, 15)
    s = step(s, [])
    const fled = s.units.find(u => u.id === ph.id)!
    expect(fled.fleeing).toBe(true)
    const yBefore = fled.y
    s = step(s, [])
    expect(s.units.find(u => u.id === ph.id)!.y).toBeLessThan(yBefore) // running home (down for player 0)
  })
  it('Rug Dev is untargetable until close, then revealed', () => {
    let s = fresh()
    const rug = place(s, 'rug-dev', 0, 9, 10)
    place(s, 'sniper-bot', 1, 9, 17) // sniper range 7.5 would normally hit y=10
    s = step(s, [])
    expect(s.units.find(u => u.id === rug.id)!.hp).toBe(getCard('rug-dev').hp!) // untouched while stealthed
    expect(s.units.find(u => u.id === rug.id)!.revealed).toBe(false)
    // both units converge on the right bridge -> they pass within stealthRange 3.5
    for (let i = 0; i < 120; i++) s = step(s, [])
    expect(s.units.find(u => u.id === rug.id)?.revealed ?? true).toBe(true)
  })
  it('Influencer aura boosts ally damage; FUD Spirit aura slows enemies', () => {
    let s = fresh()
    place(s, 'influencer', 0, 8, 15)
    place(s, 'chad-trader', 0, 9, 15)
    place(s, 'diamond-hands', 1, 9.5, 15)
    const hpBefore = s.units[2].hp
    s = step(s, [])
    const dealt = hpBefore - s.units.find(u => u.cardId === 'diamond-hands')!.hp
    // chad hits for round(90 * 1.35) = 122 (aura-boosted); influencer itself also attacks
    // (range 4.5 > its own 3.0 aura radius, self-buff excluded) for unboosted 40 -> 162 total
    expect(dealt).toBe(Math.round(getCard('chad-trader').damage! * 1.35) + getCard('influencer').damage!)

    let s2 = fresh()
    place(s2, 'fud-spirit', 0, 9, 15)
    const runner = place(s2, 'mev-bots', 1, 9, 16.5)
    const yBefore = runner.y
    s2 = step(s2, [])
    const moved = Math.abs(yBefore - s2.units.find(u => u.id === runner.id)!.y)
    expect(moved).toBeLessThan(getCard('mev-bots').speed!) // slowed below base speed
  })
  it('Whale splash hits multiple clumped enemies', () => {
    let s = fresh()
    place(s, 'whale', 0, 9, 12)
    place(s, 'jeet-horde', 1, 9, 16)
    place(s, 'jeet-horde', 1, 9.5, 16)
    s = step(s, [])
    // whale damage 200 one-shots both 90hp jeets via splash (radius 1.5 covers both)
    expect(s.units.filter(u => u.owner === 1).length).toBe(0)
  })
})
