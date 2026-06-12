import { describe, it, expect } from 'vitest'
import { Ladder } from '../../src/game/ladder'
import { AI_LEVELS } from '../../src/sim/ai'

function memStorage(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: k => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: k => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() { return m.size },
  } as Storage
}

describe('Ladder', () => {
  it('starts at level 0', () => {
    const l = new Ladder(memStorage())
    expect(l.levelIndex()).toBe(0)
    expect(l.currentLevel()).toBe(AI_LEVELS[0])
  })
  it('a win advances, capped at the top level', () => {
    const l = new Ladder(memStorage())
    for (let i = 0; i < AI_LEVELS.length + 3; i++) l.recordWin()
    expect(l.levelIndex()).toBe(AI_LEVELS.length - 1)
  })
  it('a loss never goes below 0 and drops one level', () => {
    const l = new Ladder(memStorage())
    l.recordLoss()
    expect(l.levelIndex()).toBe(0)
    l.recordWin(); l.recordWin(); l.recordLoss()
    expect(l.levelIndex()).toBe(1)
  })
  it('persists across instances sharing storage', () => {
    const storage = memStorage()
    new Ladder(storage).recordWin()
    expect(new Ladder(storage).levelIndex()).toBe(1)
  })
})
