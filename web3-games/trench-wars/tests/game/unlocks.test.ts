import { describe, it, expect } from 'vitest'
import { unlockedCards, unlockWins, nextUnlock, UNLOCK_TIERS } from '../../src/game/unlocks'
import { CARDS, STARTER_DECK } from '../../src/sim/cards'

describe('card unlocks', () => {
  it('every card belongs to exactly one tier and all 20 are covered', () => {
    const all = UNLOCK_TIERS.flatMap((t) => t.cards)
    expect(all.length).toBe(20)
    expect(new Set(all).size).toBe(20)
    for (const c of CARDS) expect(all).toContain(c.id)
  })

  it('the starter deck is fully unlocked from the start', () => {
    const base = unlockedCards(0)
    for (const id of STARTER_DECK) expect(base.has(id)).toBe(true)
  })

  it('unlocks expand monotonically with wins', () => {
    expect(unlockedCards(0).size).toBe(10)
    expect(unlockedCards(3).size).toBe(14)
    expect(unlockedCards(7).size).toBe(17)
    expect(unlockedCards(12).size).toBe(20)
    expect(unlockedCards(999).size).toBe(20)
  })

  it('unlockWins and nextUnlock report progress', () => {
    expect(unlockWins('bag-holder')).toBe(0)
    expect(unlockWins('whale')).toBe(12)
    expect(nextUnlock(0)?.remaining).toBe(3)
    expect(nextUnlock(5)?.remaining).toBe(2) // next tier at 7
    expect(nextUnlock(12)).toBeNull()
  })
})
