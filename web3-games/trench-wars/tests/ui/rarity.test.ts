import { describe, it, expect } from 'vitest'
import { CARDS } from '../../src/sim/cards'
import { RARITY, rarityOf, rarityColor } from '../../src/ui/rarity'

describe('rarity', () => {
  it('assigns a rarity to every card', () => {
    const missing = CARDS.filter((c) => !RARITY[c.id])
    expect(missing.map((c) => c.id)).toEqual([])
  })

  it('rarityOf falls back to common for unknown ids', () => {
    expect(rarityOf('does-not-exist')).toBe('common')
    expect(rarityOf('whale')).toBe('legendary')
  })

  it('rarityColor returns a hex for every tier', () => {
    for (const t of ['common', 'rare', 'epic', 'legendary'] as const) {
      expect(rarityColor(t)).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
