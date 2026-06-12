import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db'

const ghosts: FastifyPluginAsync = async (app) => {
  app.get('/:trackId', async (req, reply) => {
    const { trackId } = req.params as { trackId: string }
    const { count = '3', nearMmr = '1000' } = req.query as { count?: string; nearMmr?: string }
    const n = Math.min(10, Math.max(1, Number(count) || 3))
    const targetMmr = Number(nearMmr) || 1000

    const all = await prisma.ghost.findMany({
      where: { trackId },
      include: { replay: { select: { inputsJson: true, finalTime: true, carId: true, seed: true } } },
    })

    // sort by MMR distance from target, then pick n
    const sorted = all
      .map((g) => ({ ...g, dist: Math.abs(g.mmr - targetMmr) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, n)

    return sorted.map((g) => ({
      ghostId: g.id,
      accountId: g.accountId,
      mmr: g.mmr,
      carId: g.replay.carId,
      seed: g.replay.seed,
      finalTime: g.replay.finalTime,
      inputs: JSON.parse(g.replay.inputsJson),
    }))
  })
}

export default ghosts
