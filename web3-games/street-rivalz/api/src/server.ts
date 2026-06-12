import fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'

const app = fastify({ logger: true })

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? true,
  credentials: true,
})

await app.register(cookie, {
  secret: process.env.COOKIE_SECRET ?? 'dev-secret-change-me',
})

app.get('/health', async () => ({ ok: true }))

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
