import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db'

const ladder: FastifyPluginAsync = async (app) => {
  app.get('/:trackId', async (req, reply) => {
    const { trackId } = req.params as { trackId: string }
    const { limit = '20' } = req.query as { limit?: string }
    const n = Math.min(100, Math.max(1, Number(limit) || 20))

    const entries = await prisma.ladderEntry.findMany({
      where: { trackId },
      orderBy: { bestTime: 'asc' },
      take: n,
      include: { account: { select: { anonId: true } } },
    })

    return entries.map((e, i) => ({
      rank: i + 1,
      accountId: e.account.anonId,
      bestTime: e.bestTime,
      mmr: e.mmr,
    }))
  })

  app.get('/:trackId/me', async (req, reply) => {
    const { trackId } = req.params as { trackId: string }
    const anonId = req.cookies.anonId
    if (!anonId) return reply.status(401).send({ error: 'no session' })

    const account = await prisma.account.findUnique({ where: { anonId } })
    if (!account) return reply.status(404).send({ error: 'account not found' })

    const entry = await prisma.ladderEntry.findUnique({
      where: { accountId_trackId: { accountId: account.id, trackId } },
    })
    if (!entry) return reply.status(404).send({ error: 'no ladder entry' })

    const better = await prisma.ladderEntry.count({
      where: { trackId, bestTime: { lt: entry.bestTime } },
    })

    return {
      rank: better + 1,
      bestTime: entry.bestTime,
      mmr: entry.mmr,
    }
  })
}

export default ladder
