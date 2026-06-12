import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db'
import { verifyReplay } from '../verify'
import { DEFAULT_KART } from '../../../src/sim/kart'

const replaySchema = z.object({
  trackDef: z.object({
    name: z.string(),
    width: z.number(),
    centerline: z.array(z.tuple([z.number(), z.number()])),
    checkpoints: z.array(z.number()),
    itemBoxes: z.array(z.number()).optional(),
  }),
  carId: z.string(),
  seed: z.number().int(),
  inputs: z.array(z.array(z.object({
    throttle: z.number(),
    steer: z.number(),
    drift: z.boolean(),
    useItem: z.boolean().optional(),
  }))),
})

const grandPrix: FastifyPluginAsync = async (app) => {
  app.get('/active', async () => {
    const now = new Date()
    return prisma.grandPrix.findFirst({
      where: { startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { startsAt: 'desc' },
    })
  })

  app.post('/:id/qualify', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = replaySchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message })

    const gp = await prisma.grandPrix.findUnique({ where: { id } })
    if (!gp) return reply.status(404).send({ error: 'grand prix not found' })
    if (gp.state !== 'qualifying') return reply.status(400).send({ error: 'qualifying closed' })

    const result = verifyReplay(parsed.data, DEFAULT_KART)
    if (!result.valid) return reply.status(400).send(result)

    const anonId = req.cookies.anonId ?? crypto.randomUUID()
    if (!req.cookies.anonId) reply.setCookie('anonId', anonId, { path: '/', httpOnly: true, sameSite: 'lax' })

    let account = await prisma.account.findUnique({ where: { anonId } })
    if (!account) account = await prisma.account.create({ data: { anonId } })

    await prisma.grandPrixEntry.upsert({
      where: { gpId_accountId: { gpId: id, accountId: account.id } },
      create: { gpId: id, accountId: account.id, qualifyingTime: result.finalTime },
      update: { qualifyingTime: result.finalTime },
    })

    return { ok: true, finalTime: result.finalTime }
  })

  app.get('/:id/leaderboard', async (req, reply) => {
    const { id } = req.params as { id: string }
    const entries = await prisma.grandPrixEntry.findMany({
      where: { gpId: id, qualifyingTime: { not: null } },
      orderBy: { qualifyingTime: 'asc' },
      include: { account: { select: { anonId: true } } },
    })
    return entries.map((e, i) => ({
      rank: i + 1,
      accountId: e.account.anonId,
      qualifyingTime: e.qualifyingTime,
    }))
  })

  app.post('/:id/finals', async (req, reply) => {
    const { id } = req.params as { id: string }
    // v1: simple admin token guard
    const token = req.headers['x-admin-token']
    if (token !== process.env.ADMIN_TOKEN) return reply.status(403).send({ error: 'forbidden' })

    const gp = await prisma.grandPrix.update({
      where: { id },
      data: { state: 'finals' },
    })
    return { ok: true, state: gp.state }
  })

  app.get('/:id/results', async (req, reply) => {
    const { id } = req.params as { id: string }
    const gp = await prisma.grandPrix.findUnique({ where: { id } })
    if (!gp) return reply.status(404).send({ error: 'grand prix not found' })

    const entries = await prisma.grandPrixEntry.findMany({
      where: { gpId: id },
      orderBy: [{ finalTime: 'asc' }, { qualifyingTime: 'asc' }],
      include: { account: { select: { anonId: true } } },
    })

    return {
      state: gp.state,
      prizePool: gp.prizePool,
      entries: entries.map((e, i) => ({
        rank: e.rank ?? i + 1,
        accountId: e.account.anonId,
        finalTime: e.finalTime,
        qualifyingTime: e.qualifyingTime,
      })),
    }
  })
}

export default grandPrix
