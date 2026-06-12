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

const replays: FastifyPluginAsync = async (app) => {
  app.post('/verify', async (req, reply) => {
    const parsed = replaySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ valid: false, error: parsed.error.message })
    }
    const result = verifyReplay(parsed.data, DEFAULT_KART)
    return result
  })

  app.post('/submit', async (req, reply) => {
    const parsed = replaySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ valid: false, error: parsed.error.message })
    }
    const result = verifyReplay(parsed.data, DEFAULT_KART)
    if (!result.valid) {
      return reply.status(400).send(result)
    }

    const anonId = req.cookies.anonId ?? crypto.randomUUID()
    if (!req.cookies.anonId) {
      reply.setCookie('anonId', anonId, { path: '/', httpOnly: true, sameSite: 'lax' })
    }

    let account = await prisma.account.findUnique({ where: { anonId } })
    if (!account) {
      account = await prisma.account.create({ data: { anonId } })
    }

    const replay = await prisma.replay.create({
      data: {
        accountId: account.id,
        trackId: parsed.data.trackDef.name,
        carId: parsed.data.carId,
        seed: parsed.data.seed,
        inputsJson: JSON.stringify(parsed.data.inputs),
        finalTime: result.finalTime!,
        verified: true,
      },
    })

    return { valid: true, replayId: replay.id, finalTime: replay.finalTime }
  })
}

export default replays
