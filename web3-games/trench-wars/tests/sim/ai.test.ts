import { describe, it, expect } from 'vitest'
import { aiCommands, AI_LEVELS } from '../../src/sim/ai'
import { createMatch, step, runMatchVsAi } from '../../src/sim/ai'
import { STARTER_DECK } from '../../src/sim/cards'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]

describe('aiCommands', () => {
  it('does nothing off its think tick', () => {
    const s = createMatch(1, decks)
    s.tick = 1 // thinkEvery >= 10 for all levels
    expect(aiCommands(s, 1, AI_LEVELS[0])).toEqual([])
  })
  it('defends: plays a unit in front of an enemy on its half', () => {
    let s = createMatch(1, decks)
    s.elixir[1] = 10
    s = step(s, [{ tick: 0, player: 0, cardId: 'jeet-horde', x: 4.5, y: 10 }])
    // teleport threat onto AI half to trigger defense
    for (const u of s.units) u.y = 22
    s.tick = AI_LEVELS[0].thinkEvery // a think tick
    const cmds = aiCommands(s, 1, AI_LEVELS[0])
    expect(cmds.length).toBe(1)
    expect(cmds[0].player).toBe(1)
    expect(cmds[0].y).toBeGreaterThan(22) // between threat and own king
  })
  it('attacks when saved up: plays its most expensive unit at the bridge', () => {
    const s = createMatch(1, decks)
    s.elixir[1] = 10
    s.tick = AI_LEVELS[0].thinkEvery
    const cmds = aiCommands(s, 1, AI_LEVELS[0])
    expect(cmds.length).toBe(1)
  })
  it('is deterministic', () => {
    const s = createMatch(7, decks)
    s.elixir[1] = 10
    s.tick = AI_LEVELS[0].thinkEvery
    expect(aiCommands(s, 1, AI_LEVELS[0])).toEqual(aiCommands(s, 1, AI_LEVELS[0]))
  })
})

describe('full AI-vs-AI match (integration)', () => {
  it('completes with a result and no crash at every level', () => {
    for (const level of AI_LEVELS) {
      const final = runMatchVsAi(42, decks, level, level)
      expect(final.result).not.toBeNull()
    }
  })
})
