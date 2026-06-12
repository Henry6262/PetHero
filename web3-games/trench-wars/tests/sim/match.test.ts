import { describe, it, expect } from 'vitest'
import { createMatch, step } from '../../src/sim/sim'
import { STARTER_DECK } from '../../src/sim/cards'
import { ELIXIR_START, ELIXIR_MAX, ELIXIR_PER_TICK, DOUBLE_ELIXIR_TICK } from '../../src/sim/constants'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]

describe('createMatch', () => {
  it('creates 6 towers: 2 lane + 1 sleeping king per player', () => {
    const s = createMatch(123, decks)
    expect(s.towers.length).toBe(6)
    for (const p of [0, 1] as const) {
      const mine = s.towers.filter(t => t.owner === p)
      expect(mine.filter(t => t.kind === 'lane').length).toBe(2)
      const king = mine.find(t => t.kind === 'king')!
      expect(king.active).toBe(false)
      expect(mine.filter(t => t.kind === 'lane').every(t => t.active)).toBe(true)
    }
  })
  it('starts with ELIXIR_START for both and empty board', () => {
    const s = createMatch(123, decks)
    expect(s.elixir).toEqual([ELIXIR_START, ELIXIR_START])
    expect(s.units).toEqual([])
    expect(s.result).toBeNull()
  })
})

describe('elixir regen', () => {
  it('regens ELIXIR_PER_TICK per tick, capped at ELIXIR_MAX', () => {
    let s = createMatch(123, decks)
    for (let i = 0; i < 20; i++) s = step(s, [])
    expect(s.elixir[0]).toBeCloseTo(ELIXIR_START + 20 * ELIXIR_PER_TICK, 5)
    for (let i = 0; i < 500; i++) s = step(s, [])
    expect(s.elixir[0]).toBe(ELIXIR_MAX)
  })
  it('doubles regen after DOUBLE_ELIXIR_TICK', () => {
    let s = createMatch(123, decks)
    s.tick = DOUBLE_ELIXIR_TICK
    s.elixir = [0, 0]
    s = step(s, [])
    expect(s.elixir[0]).toBeCloseTo(2 * ELIXIR_PER_TICK, 5)
  })
})
