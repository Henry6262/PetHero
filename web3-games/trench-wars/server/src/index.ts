import { config } from 'dotenv'
config()

import { prisma } from './lib/prisma'
import { createApp } from './app'
import { ensureBotAccount } from './routes/ladder'

const PORT = parseInt(process.env.PORT || '3001', 10)
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev-secret-change-me'
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174'

async function main() {
  await ensureBotAccount(prisma)

  const app = createApp({ prisma, cookieSecret: COOKIE_SECRET, clientUrl: CLIENT_URL })

  app.listen(PORT, () => {
    console.log(`Trench Wars server listening on http://localhost:${PORT}`)
  })
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
