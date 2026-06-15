import { describe, it, expect } from 'vitest'
import { CARDS, getCard, validateCards } from '../../src/sim/cards'

describe('card config', () => {
  it('loads 30 cards: 25 units + 5 spells', () => {
    expect(CARDS.length).toBe(30)
    expect(CARDS.filter(c => c.type === 'unit').length).toBe(25)
    expect(CARDS.filter(c => c.type === 'spell').length).toBe(5)
  })
  it('every unit has complete combat stats', () => {
    for (const c of CARDS.filter(c => c.type === 'unit')) {
      expect(c.hp).toBeGreaterThan(0)
      expect(c.damage).toBeGreaterThan(0)
      expect(c.range).toBeGreaterThan(0)
      expect(c.sightRange).toBeGreaterThanOrEqual(c.range!)
      expect(c.speed).toBeGreaterThan(0)
      expect(c.attackSpeed).toBeGreaterThan(0)
      expect(c.count).toBeGreaterThanOrEqual(1)
    }
  })
  it('costs span 1-7 elixir for curve variety', () => {
    const costs = CARDS.map(c => c.cost)
    expect(Math.min(...costs)).toBeLessThanOrEqual(2)
    expect(Math.max(...costs)).toBeGreaterThanOrEqual(6)
  })
  it('getCard throws on unknown id', () => {
    expect(() => getCard('nope')).toThrow()
    expect(getCard('diamond-hands').name).toBe('Diamond Hands')
  })
  it('validateCards rejects a unit with missing hp', () => {
    expect(() => validateCards([{ id: 'x', name: 'X', cost: 3, type: 'unit' } as any])).toThrow(/hp/)
  })
})
