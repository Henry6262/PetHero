import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import type { AuthRequest } from '../lib/auth'
import { getCard, STARTER_DECK } from '../../../src/sim/cards'
import { DECK_SIZE } from '../../../src/sim/constants'

export function decksRouter(prisma: PrismaClient): Router {
  const router = Router()

  function parseCards(input: unknown): string[] {
    if (!Array.isArray(input) || input.length !== DECK_SIZE) {
      throw new Error(`deck must contain exactly ${DECK_SIZE} cards`)
    }
    const ids = input.map((c) => {
      if (typeof c !== 'string') throw new Error('card ids must be strings')
      getCard(c)
      return c
    })
    return ids
  }

  router.get('/', async (req: AuthRequest, res) => {
    if (!req.account) return res.status(401).json({ error: 'unauthorized' })
    const decks = await prisma.deck.findMany({
      where: { accountId: req.account.id },
      orderBy: { updatedAt: 'desc' },
    })
    res.json({
      decks: decks.map((d) => ({ id: d.id, name: d.name, cards: JSON.parse(d.cards), updatedAt: d.updatedAt })),
    })
  })

  router.post('/', async (req: AuthRequest, res) => {
    if (!req.account) return res.status(401).json({ error: 'unauthorized' })
    try {
      const name = typeof req.body.name === 'string' ? req.body.name : 'Custom'
      const cards = parseCards(req.body.cards)
      const deck = await prisma.deck.create({
        data: { accountId: req.account.id, name, cards: JSON.stringify(cards) },
      })
      res.status(201).json({ deck: { id: deck.id, name: deck.name, cards, updatedAt: deck.updatedAt } })
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'bad request' })
    }
  })

  router.get('/:id', async (req: AuthRequest, res) => {
    if (!req.account) return res.status(401).json({ error: 'unauthorized' })
    const deck = await prisma.deck.findFirst({
      where: { id: req.params.id as string, accountId: req.account.id },
    })
    if (!deck) return res.status(404).json({ error: 'not found' })
    res.json({ deck: { id: deck.id, name: deck.name, cards: JSON.parse(deck.cards), updatedAt: deck.updatedAt } })
  })

  router.put('/:id', async (req: AuthRequest, res) => {
    if (!req.account) return res.status(401).json({ error: 'unauthorized' })
    try {
      const cards = parseCards(req.body.cards)
      const name = typeof req.body.name === 'string' ? req.body.name : undefined
      const deck = await prisma.deck.updateMany({
        where: { id: req.params.id as string, accountId: req.account.id },
        data: { cards: JSON.stringify(cards), ...(name ? { name } : {}) },
      })
      if (deck.count === 0) return res.status(404).json({ error: 'not found' })
      const updated = await prisma.deck.findFirstOrThrow({
        where: { id: req.params.id as string, accountId: req.account.id },
      })
      res.json({ deck: { id: updated.id, name: updated.name, cards, updatedAt: updated.updatedAt } })
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'bad request' })
    }
  })

  router.delete('/:id', async (req: AuthRequest, res) => {
    if (!req.account) return res.status(401).json({ error: 'unauthorized' })
    const deck = await prisma.deck.findFirst({
      where: { id: req.params.id as string, accountId: req.account.id },
    })
    if (!deck) return res.status(404).json({ error: 'not found' })
    await prisma.deck.delete({ where: { id: deck.id } })
    res.status(204).send()
  })

  return router
}

export { STARTER_DECK }
