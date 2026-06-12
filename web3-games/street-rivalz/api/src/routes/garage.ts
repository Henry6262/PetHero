import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db'

const loadoutSchema = z.object({
  body: z.string(),
  wheels: z.string(),
  spoiler: z.string().optional(),
  paint: z.number().int(),
  trail: z.string(),
})

const garage: FastifyPluginAsync = async (app) => {
  app.get('/', async (req, reply) => {
    let anonId = req.cookies.anonId
    if (!anonId) {
      anonId = crypto.randomUUID()
      reply.setCookie('anonId', anonId, { path: '/', httpOnly: true, sameSite: 'lax' })
    }

    let account = await prisma.account.findUnique({ where: { anonId }, include: { loadout: true } })
    if (!account) {
      account = await prisma.account.create({ data: { anonId }, include: { loadout: true } })
    }

    return account.loadout ?? {
      body: 'paper-scooter',
      wheels: 'stock',
      spoiler: null,
      paint: 16432661,
      trail: 'default',
    }
  })

  app.post('/', async (req, reply) => {
    const anonId = req.cookies.anonId
    if (!anonId) return reply.status(401).send({ error: 'no session' })

    const parsed = loadoutSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.message })

    let account = await prisma.account.findUnique({ where: { anonId } })
    if (!account) {
      account = await prisma.account.create({ data: { anonId } })
    }

    const loadout = await prisma.loadout.upsert({
      where: { accountId: account.id },
      create: { accountId: account.id, ...parsed.data },
      update: parsed.data,
    })

    return loadout
  })
}

export default garage
