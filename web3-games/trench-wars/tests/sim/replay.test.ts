import { describe, it, expect } from 'vitest'
import { runReplay, fingerprint } from '../../src/sim/replay'
import { STARTER_DECK } from '../../src/sim/cards'
import type { Replay } from '../../src/sim/types'

const golden: Replay = {
  seed: 1337,
  decks: [[...STARTER_DECK], [...STARTER_DECK]],
  commands: [
    { tick: 10,  player: 0, cardId: 'jeet-horde',    x: 4.5, y: 10 },
    { tick: 12,  player: 1, cardId: 'chad-trader',   x: 4.5, y: 22 },
    { tick: 80,  player: 0, cardId: 'diamond-hands', x: 13.5, y: 10 },
    { tick: 90,  player: 1, cardId: 'mev-bots',      x: 13.5, y: 22 },
    { tick: 200, player: 0, cardId: 'liquidation-cascade', x: 4.5, y: 22 },
    { tick: 300, player: 1, cardId: 'jeet-horde',    x: 9, y: 24 },
    { tick: 450, player: 0, cardId: 'pump-signal',   x: 13.5, y: 14 },
  ],
}

describe('replay determinism', () => {
  it('two runs of the same replay produce identical state fingerprints', () => {
    const a = runReplay(golden)
    const b = runReplay(golden)
    expect(fingerprint(a)).toBe(fingerprint(b))
  })
  it('replays always terminate with a result', () => {
    const final = runReplay(golden)
    expect(final.result).not.toBeNull()
  })
  it('a tampered command changes the fingerprint', () => {
    const tampered: Replay = structuredClone(golden)
    tampered.commands[0].x = 13.5
    expect(fingerprint(runReplay(tampered))).not.toBe(fingerprint(runReplay(golden)))
  })
})
