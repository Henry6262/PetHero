import { describe, it, expect } from 'vitest'
import { createTestApp, createAccount, agent } from './helpers'

describe('accounts', () => {
  const app = createTestApp()

  it('creates a guest account with default stats', async () => {
    const res = await agent(app).post('/api/accounts').expect(201)
    expect(res.body.account).toMatchObject({
      elo: 1000,
      wins: 0,
      losses: 0,
    })
    expect(typeof res.body.account.id).toBe('string')
  })

  it('returns 401 for /me without a cookie', async () => {
    await agent(app).get('/api/accounts/me').expect(401)
  })

  it('returns the current account after creation', async () => {
    const { agent: a, id } = await createAccount(app)
    const res = await a.get('/api/accounts/me').expect(200)
    expect(res.body.account.id).toBe(id)
    expect(res.body.account.elo).toBe(1000)
  })

  it('connects a wallet and returns a persistent account', async () => {
    const a = agent(app)
    const wallet = `test-wallet-${Date.now()}`
    const res = await a.post('/api/accounts/connect').send({ wallet }).expect(200)
    expect(res.body.account.wallet).toBe(wallet)
    expect(res.body.account.elo).toBe(1000)

    const me = await a.get('/api/accounts/me').expect(200)
    expect(me.body.account.wallet).toBe(wallet)
  })
})
