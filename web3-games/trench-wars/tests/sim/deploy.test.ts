import { describe, it, expect } from 'vitest'
import { createMatch, step, validateDeploy, handOf } from '../../src/sim/sim'
import { STARTER_DECK, getCard } from '../../src/sim/cards'
import { HAND_SIZE, RIVER_Y } from '../../src/sim/constants'

const decks: [string[], string[]] = [[...STARTER_DECK], [...STARTER_DECK]]
const deploy = (cardId: string, x = 9, y = 8) => ({ tick: 0, player: 0 as const, cardId, x, y })

describe('validateDeploy', () => {
  it('accepts an affordable hand card on own half', () => {
    const s = createMatch(1, decks)
    expect(validateDeploy(s, deploy('jeet-horde'))).toBe(true)
  })
  it('rejects a card not in hand', () => {
    const s = createMatch(1, decks)
    const notInHand = s.decks[0][HAND_SIZE] // first card beyond the hand
    expect(validateDeploy(s, deploy(notInHand))).toBe(false)
  })
  it('rejects insufficient elixir', () => {
    const s = createMatch(1, decks)
    s.elixir[0] = 1
    expect(validateDeploy(s, deploy('chad-trader'))).toBe(false)
  })
  it('rejects unit deploys on enemy half (spells allowed anywhere)', () => {
    const s = createMatch(1, decks)
    s.decks[0][0] = 'pump-signal' // put a spell in hand
    expect(validateDeploy(s, deploy('jeet-horde', 9, RIVER_Y + 4))).toBe(false)
    expect(validateDeploy(s, { tick: 0, player: 0, cardId: 'pump-signal', x: 9, y: RIVER_Y + 4 })).toBe(true)
  })
})

describe('spawning + hand cycle', () => {
  it('spawns `count` units, deducts elixir, cycles card to deck back', () => {
    let s = createMatch(1, decks)
    const before = s.elixir[0]
    s = step(s, [deploy('jeet-horde')])
    expect(s.units.length).toBe(getCard('jeet-horde').count)
    expect(s.units.every(u => u.owner === 0 && u.hp === getCard('jeet-horde').hp)).toBe(true)
    // regen happens same tick, so compare against cost only
    expect(s.elixir[0]).toBeLessThan(before)
    expect(handOf(s, 0)).not.toContain('jeet-horde')
    expect(s.decks[0][s.decks[0].length - 1]).toBe('jeet-horde')
    expect(s.decks[0].length).toBe(8)
  })
  it('ignores invalid commands without crashing', () => {
    let s = createMatch(1, decks)
    s = step(s, [deploy('whale')]) // not in starter deck/hand
    expect(s.units.length).toBe(0)
  })
})
