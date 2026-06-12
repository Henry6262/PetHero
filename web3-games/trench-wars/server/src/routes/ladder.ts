import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { STARTER_DECK } from '../../../src/sim/cards'

export const BOT_WALLET = '__bot_ladder__'

export async function ensureBotAccount(prisma: PrismaClient): Promise<string> {
  const existing = await prisma.account.findUnique({ where: { wallet: BOT_WALLET } })
  if (existing) return existing.id

  return await prisma.$transaction(async (tx) => {
    const acc = await tx.account.create({ data: { wallet: BOT_WALLET } })
    await tx.deck.create({
      data: { accountId: acc.id, name: 'Starter', cards: JSON.stringify(STARTER_DECK) },
    })
    return acc.id
  })
}

export function ladderRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.get('/leaderboard', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200)
    const rows = await prisma.account.findMany({
      orderBy: { elo: 'desc' },
      take: limit,
      select: { id: true, elo: true, wins: true, losses: true },
    })
    res.json({
      leaderboard: rows.map((r, i) => ({ rank: i + 1, id: r.id, elo: r.elo, wins: r.wins, losses: r.losses })),
    })
  })

  router.get('/opponent', async (req, res) => {
    const excludeId = req.query.excludeId as string | undefined
    const myElo = parseInt(req.query.elo as string, 10)
    const range = parseInt(req.query.range as string, 10) || 200

    if (Number.isNaN(myElo)) {
      res.status(400).json({ error: 'elo query param required' })
      return
    }

    const minElo = myElo - range
    const maxElo = myElo + range

    // Prefer a human defender within Elo range that has at least one deck.
    let defender = await prisma.account.findFirst({
      where: {
        id: { not: excludeId },
        wallet: { not: BOT_WALLET },
        elo: { gte: minElo, lte: maxElo },
        decks: { some: {} },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fallback to the ladder bot if no human is available.
    if (!defender) {
      const botId = await ensureBotAccount(prisma)
      defender = await prisma.account.findUniqueOrThrow({ where: { id: botId } })
    }

    const deck = await prisma.deck.findFirst({
      where: { accountId: defender.id },
      orderBy: { updatedAt: 'desc' },
    })

    if (!deck) {
      res.status(500).json({ error: 'defender has no deck' })
      return
    }

    res.json({
      account: { id: defender.id, elo: defender.elo, wins: defender.wins, losses: defender.losses },
      deck: { id: deck.id, name: deck.name, cards: JSON.parse(deck.cards) },
    })
  })

  return router
}
