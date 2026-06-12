import { describe, it, expect } from 'vitest'
import { createTestApp, createAccount } from './helpers'

describe('ladder', () => {
  const app = createTestApp()

  it('returns a leaderboard sorted by Elo', async () => {
    const { agent: a1 } = await createAccount(app)
    const { agent: a2 } = await createAccount(app)

    await a1.post('/api/matches').send({
      seed: 1,
      attackerDeck: ['bag-holder', 'jeet-horde', 'paper-hands', 'chad-trader', 'diamond-hands', 'mev-bots', 'pump-signal', 'liquidation-cascade'],
      defenderId: (await a2.get('/api/accounts/me')).body.account.id,
      commands: [],
      claimedWinner: null,
      fingerprint: 't2400|rx:draw|T1:1400|T2:1400|T3:2400|T4:1400|T5:1400|T6:2400|e10.0000:10.0000',
    }).expect(201)

    const res = await a1.get('/api/ladder/leaderboard?limit=10').expect(200)
    expect(res.body.leaderboard.length).toBeGreaterThanOrEqual(2)
    expect(res.body.leaderboard[0].elo).toBeGreaterThanOrEqual(res.body.leaderboard[1].elo)
  })

  it('finds a fallback bot opponent when no human is in range', async () => {
    const { agent: a } = await createAccount(app)
    const me = (await a.get('/api/accounts/me')).body.account
    const res = await a.get(`/api/ladder/opponent?elo=${me.elo}&excludeId=${me.id}`).expect(200)
    expect(res.body.account).toBeDefined()
    expect(res.body.deck.cards).toHaveLength(8)
  })
})
