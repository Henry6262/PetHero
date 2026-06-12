import { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db'
import { TOKEN, HOLDER_TIERS } from '../../../src/data/token'

const token: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    const activeGp = await prisma.grandPrix.findFirst({
      where: { state: { in: ['qualifying', 'finals'] } },
      orderBy: { startsAt: 'desc' },
    })

    return {
      ticker: TOKEN.ticker,
      name: TOKEN.name,
      network: TOKEN.network,
      launchUrl: TOKEN.launchUrl,
      tiers: HOLDER_TIERS,
      prizePool: activeGp?.prizePool ?? '0',
    }
  })
}

export default token
