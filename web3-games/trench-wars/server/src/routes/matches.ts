import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { createHash } from 'node:crypto'
import type { AuthRequest } from '../lib/auth'
import { verifyReplay, type ClaimedWinner } from '../lib/antiCheat'
import { calculateEloDelta } from '../lib/elo'
import { getCard, STARTER_DECK } from '../../../src/sim/cards'
import { DECK_SIZE } from '../../../src/sim/constants'
import type { DeployCommand, Replay } from '../../../src/sim/types'

function normalizeClaimedWinner(raw: unknown): ClaimedWinner {
  if (raw === null || raw === undefined) return null
  if (raw === 0 || raw === '0') return 0
  if (raw === 1 || raw === '1') return 1
  throw new Error('claimedWinner must be 0, 1, or null')
}

function parseDeck(input: unknown): string[] {
  if (!Array.isArray(input) || input.length !== DECK_SIZE) {
    throw new Error(`deck must contain exactly ${DECK_SIZE} cards`)
  }
  return input.map((c) => {
    if (typeof c !== 'string') throw new Error('card ids must be strings')
    getCard(c)
    return c
  })
}

function parseCommands(input: unknown): DeployCommand[] {
  if (!Array.isArray(input)) throw new Error('commands must be an array')
  return input.map((c) => {
    if (
      typeof c !== 'object' ||
      c === null ||
      typeof c.tick !== 'number' ||
      typeof c.player !== 'number' ||
      typeof c.cardId !== 'string' ||
      typeof c.x !== 'number' ||
      typeof c.y !== 'number'
    ) {
      throw new Error('invalid command shape')
    }
    return c as DeployCommand
  })
}

function replayHash(replay: Replay): string {
  return createHash('sha256').update(JSON.stringify(replay)).digest('hex')
}

export function matchesRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.post('/', async (req: AuthRequest, res) => {
    if (!req.account) return res.status(401).json({ error: 'unauthorized' })

    try {
      const seed = typeof req.body.seed === 'number' ? req.body.seed : parseInt(req.body.seed, 10)
      if (!Number.isFinite(seed)) throw new Error('seed must be a number')

      const attackerDeck = parseDeck(req.body.attackerDeck)
      const commands = parseCommands(req.body.commands)
      const claimedWinner = normalizeClaimedWinner(req.body.claimedWinner)
      const claimedFingerprint = typeof req.body.fingerprint === 'string' ? req.body.fingerprint : ''
      const defenderId = typeof req.body.defenderId === 'string' ? req.body.defenderId : ''

      const defender = await prisma.account.findUnique({ where: { id: defenderId } })
      if (!defender) return res.status(404).json({ error: 'defender not found' })

      const defenderDeckRow = await prisma.deck.findFirst({
        where: { accountId: defender.id },
        orderBy: { updatedAt: 'desc' },
      })
      const defenderDeck = defenderDeckRow ? JSON.parse(defenderDeckRow.cards) : STARTER_DECK

      const replay: Replay = {
        seed,
        decks: [attackerDeck, defenderDeck],
        commands,
      }

      const { winner } = verifyReplay(replay, claimedWinner, claimedFingerprint)

      const outcome: 'attacker' | 'defender' | 'draw' =
        winner === 0 ? 'attacker' : winner === 1 ? 'defender' : 'draw'
      const { attackerDelta, defenderDelta } = calculateEloDelta(req.account.elo, defender.elo, outcome)

      const match = await prisma.$transaction(async (tx) => {
        await tx.account.update({
          where: { id: req.account!.id },
          data: {
            elo: { increment: attackerDelta },
            wins: { increment: outcome === 'attacker' ? 1 : 0 },
            losses: { increment: outcome === 'defender' ? 1 : 0 },
          },
        })
        await tx.account.update({
          where: { id: defender.id },
          data: {
            elo: { increment: defenderDelta },
            wins: { increment: outcome === 'defender' ? 1 : 0 },
            losses: { increment: outcome === 'attacker' ? 1 : 0 },
          },
        })
        return tx.match.create({
          data: {
            attackerId: req.account!.id,
            defenderId: defender.id,
            replaySeed: seed,
            replayCommands: commands as any,
            winner: winner === null ? -1 : winner,
            attackerEloChange: attackerDelta,
            defenderEloChange: defenderDelta,
            verified: true,
            replayHash: replayHash(replay),
          },
        })
      })

      res.status(201).json({
        match: {
          id: match.id,
          attackerId: match.attackerId,
          defenderId: match.defenderId,
          winner: match.winner,
          attackerEloChange: match.attackerEloChange,
          defenderEloChange: match.defenderEloChange,
          replayHash: match.replayHash,
        },
        eloDelta: attackerDelta,
      })
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'bad request' })
    }
  })

  router.get('/', async (req: AuthRequest, res) => {
    if (!req.account) return res.status(401).json({ error: 'unauthorized' })
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100)
    const matches = await prisma.match.findMany({
      where: { OR: [{ attackerId: req.account.id }, { defenderId: req.account.id }] },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        attacker: { select: { id: true, elo: true } },
        defender: { select: { id: true, elo: true } },
      },
    })
    res.json({ matches })
  })

  return router
}
