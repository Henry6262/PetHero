import { describe, it, expect } from 'vitest'
import { runReplay, fingerprint } from '../../src/sim/replay'
import { createTestApp, createAccount, buildEmptyReplay, runAiMatch } from './helpers'

describe('matches', () => {
  const app = createTestApp()

  it('accepts a verified draw replay and updates Elo symmetrically', async () => {
    const { agent: a1 } = await createAccount(app)
    const { id: defenderId } = await createAccount(app)

    const replay = buildEmptyReplay(2)
    const state = runReplay(replay)
    const fp = fingerprint(state)

    const before = (await a1.get('/api/accounts/me')).body.account.elo
    const res = await a1.post('/api/matches').send({
      seed: replay.seed,
      attackerDeck: replay.decks[0],
      defenderId,
      commands: replay.commands,
      claimedWinner: null,
      fingerprint: fp,
    }).expect(201)

    expect(res.body.match.winner).toBe(-1)
    expect(res.body.eloDelta).toBe(0)

    const after = (await a1.get('/api/accounts/me')).body.account.elo
    expect(after).toBe(before)
  })

  it('rejects a fingerprint mismatch', async () => {
    const { agent: a1 } = await createAccount(app)
    const { id: defenderId } = await createAccount(app)
    const replay = buildEmptyReplay(3)

    const res = await a1.post('/api/matches').send({
      seed: replay.seed,
      attackerDeck: replay.decks[0],
      defenderId,
      commands: replay.commands,
      claimedWinner: null,
      fingerprint: 'bad',
    }).expect(400)

    expect(res.body.error).toContain('fingerprint')
  })

  it('rejects a winner mismatch', async () => {
    const { agent: a1 } = await createAccount(app)
    const { id: defenderId } = await createAccount(app)
    const replay = buildEmptyReplay(4)
    const state = runReplay(replay)

    const res = await a1.post('/api/matches').send({
      seed: replay.seed,
      attackerDeck: replay.decks[0],
      defenderId,
      commands: replay.commands,
      claimedWinner: 0,
      fingerprint: fingerprint(state),
    }).expect(400)

    expect(res.body.error).toContain('winner')
  })

  it('accepts a real AI replay and adjusts Elo', async () => {
    const { agent: a1 } = await createAccount(app)
    const { agent: a2, id: defenderId } = await createAccount(app)

    const { replay, winner } = runAiMatch(5)
    const state = runReplay(replay)
    const fp = fingerprint(state)

    const attackerBefore = (await a1.get('/api/accounts/me')).body.account.elo
    const defenderBefore = (await a2.get('/api/accounts/me')).body.account.elo

    const res = await a1.post('/api/matches').send({
      seed: replay.seed,
      attackerDeck: replay.decks[0],
      defenderId,
      commands: replay.commands,
      claimedWinner: winner,
      fingerprint: fp,
    }).expect(201)

    const attackerAfter = (await a1.get('/api/accounts/me')).body.account.elo
    const defenderAfter = (await a2.get('/api/accounts/me')).body.account.elo

    if (winner === 0) {
      expect(res.body.eloDelta).toBeGreaterThan(0)
      expect(attackerAfter).toBeGreaterThan(attackerBefore)
      expect(defenderAfter).toBeLessThan(defenderBefore)
    } else if (winner === 1) {
      expect(res.body.eloDelta).toBeLessThan(0)
      expect(attackerAfter).toBeLessThan(attackerBefore)
      expect(defenderAfter).toBeGreaterThan(defenderBefore)
    }
  })
})
