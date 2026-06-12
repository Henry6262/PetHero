import { describe, it, expect } from 'vitest'
import { createTestApp, createAccount, STARTER_DECK } from './helpers'
import { DECK_SIZE } from '../../src/sim/constants'

describe('decks', () => {
  const app = createTestApp()

  it('lists the default starter deck', async () => {
    const { agent: a } = await createAccount(app)
    const res = await a.get('/api/decks').expect(200)
    expect(res.body.decks).toHaveLength(1)
    expect(res.body.decks[0].cards).toEqual(STARTER_DECK)
    expect(res.body.decks[0].name).toBe('Starter')
  })

  it('creates a valid custom deck', async () => {
    const { agent: a } = await createAccount(app)
    const cards = Array(DECK_SIZE).fill('bag-holder')
    const res = await a.post('/api/decks').send({ name: 'Push', cards }).expect(201)
    expect(res.body.deck.name).toBe('Push')
    expect(res.body.deck.cards).toEqual(cards)
  })

  it('rejects a deck with wrong size', async () => {
    const { agent: a } = await createAccount(app)
    const res = await a.post('/api/decks').send({ name: 'Bad', cards: ['bag-holder'] }).expect(400)
    expect(res.body.error).toContain('8')
  })

  it('rejects an unknown card id', async () => {
    const { agent: a } = await createAccount(app)
    const cards = Array(DECK_SIZE).fill('not-a-card')
    const res = await a.post('/api/decks').send({ name: 'Bad', cards }).expect(400)
    expect(res.body.error).toContain('unknown card')
  })
})
