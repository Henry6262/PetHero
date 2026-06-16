import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import type { PrismaClient } from '@prisma/client'
import { createRequireAuth } from './lib/auth'
import { accountsRouter } from './routes/accounts'
import { decksRouter } from './routes/decks'
import { ladderRouter } from './routes/ladder'
import { matchesRouter } from './routes/matches'

export interface AppConfig {
  prisma: PrismaClient
  cookieSecret: string
  clientUrl: string
}

export function createApp({ prisma, cookieSecret, clientUrl }: AppConfig) {
  const app = express()

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (process.env.NODE_ENV !== 'production') return callback(null, true)
        const prodOrigins = [
          clientUrl,
          'https://trench-wars.vercel.app',
          'https://trench-wars-k0dk8qcz7-henry6262s-projects.vercel.app',
          'https://trench-wars-henry6262s-projects.vercel.app',
          'https://www.trenchroyale.app',
          'https://trenchroyale.app',
        ]
        // Allow the production domain (any subdomain of trenchroyale.app) plus
        // any trench-royale or legacy trench-wars Vercel preview/production URL.
        const allowed =
          prodOrigins.includes(origin) ||
          /^https:\/\/([a-z0-9-]+\.)*trenchroyale\.app$/.test(origin) ||
          /^https:\/\/trench-royale[a-z0-9-]*\.vercel\.app$/.test(origin) ||
          /^https:\/\/trench-wars[a-z0-9-]*\.vercel\.app$/.test(origin)
        if (allowed) return callback(null, true)
        callback(new Error(`CORS blocked origin: ${origin}`))
      },
      credentials: true,
      maxAge: 0,
    }),
  )
  app.use(express.json({ limit: '5mb' }))
  app.use(cookieParser(cookieSecret))

  const requireAuth = createRequireAuth(prisma, cookieSecret)

  app.get('/health', (_req, res) => res.json({ ok: true }))

  app.use('/api/accounts', accountsRouter(prisma, cookieSecret, requireAuth))
  app.use('/api/decks', requireAuth, decksRouter(prisma))
  app.use('/api/ladder', ladderRouter(prisma))
  app.use('/api/matches', requireAuth, matchesRouter(prisma))

  app.use((_req, res) => res.status(404).json({ error: 'not found' }))

  return app
}
