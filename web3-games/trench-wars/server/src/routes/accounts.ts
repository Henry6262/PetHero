import { Router } from 'express'
import type { PrismaClient, Account } from '@prisma/client'
import type { RequestHandler } from 'express'
import type { AuthRequest } from '../lib/auth'
import { setAccountCookie } from '../lib/auth'
import { STARTER_DECK } from '../../../src/sim/cards'

function serializeAccount(account: Account) {
  return {
    id: account.id,
    wallet: account.wallet,
    elo: account.elo,
    wins: account.wins,
    losses: account.losses,
    createdAt: account.createdAt,
  }
}

export function accountsRouter(prisma: PrismaClient, cookieSecret: string, requireAuth: RequestHandler): Router {
  const router = Router()

  async function createGuestWithDeck(wallet?: string): Promise<Account> {
    return await prisma.$transaction(async (tx) => {
      const acc = await tx.account.create({ data: wallet ? { wallet } : {} })
      await tx.deck.create({
        data: {
          accountId: acc.id,
          name: 'Starter',
          cards: JSON.stringify(STARTER_DECK),
        },
      })
      return acc
    })
  }

  router.post('/', async (_req, res) => {
    const account = await createGuestWithDeck()
    setAccountCookie(res, account.id, cookieSecret)
    res.status(201).json({ account: serializeAccount(account) })
  })

  router.post('/connect', async (req, res) => {
    const wallet = typeof req.body.wallet === 'string' ? req.body.wallet : ''
    if (!wallet) {
      res.status(400).json({ error: 'wallet address required' })
      return
    }

    let account = await prisma.account.findUnique({ where: { wallet } })
    if (!account) {
      account = await createGuestWithDeck(wallet)
    }

    setAccountCookie(res, account.id, cookieSecret)
    res.json({ account: serializeAccount(account) })
  })

  router.get('/me', requireAuth, async (req: AuthRequest, res) => {
    res.json({ account: serializeAccount(req.account!) })
  })

  return router
}
