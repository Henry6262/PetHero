import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fastify from 'fastify'
import cookie from '@fastify/cookie'
import replays from '../src/routes/replays'
import ghosts from '../src/routes/ghosts'
import ladder from '../src/routes/ladder'
import { prisma } from '../src/db'
import { SQUARE } from '../../tests/sim/track.test'
import { aiInput } from '../../src/sim/ai'
import { buildTrack } from '../../src/sim/track'
import { createRace, stepRace } from '../../src/sim/race'
import { KartInput } from '../../src/sim/kart'

function aiReplay(ticks: number): KartInput[][] {
  const track = buildTrack(SQUARE)
  const race = createRace(track, 1)
  const inputs: KartInput[][] = []
  for (let i = 0; i < ticks; i++) {
    const input = aiInput(race.karts[0], { track, karts: race.karts })
    inputs.push([input])
    stepRace(race, track, [input])
  }
  return inputs
}

async function buildApp() {
  const app = fastify({ logger: false })
  await app.register(cookie, { secret: 'test-secret' })
  await app.register(replays, { prefix: '/replays' })
  await app.register(ghosts, { prefix: '/ghosts' })
  await app.register(ladder, { prefix: '/ladder' })
  return app
}

describe('routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('submits a verified replay and returns replayId', async () => {
    const inputs = aiReplay(3000)
    const res = await app.inject({
      method: 'POST',
      url: '/replays/submit',
      payload: { trackDef: SQUARE, carId: 'paper-scooter', seed: 1, inputs },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.valid).toBe(true)
    expect(body.replayId).toBeDefined()
    expect(body.finalTime).toBeGreaterThan(0)
  })

  it('lists ghosts for a track', async () => {
    const inputs = aiReplay(3000)
    await app.inject({
      method: 'POST',
      url: '/replays/submit',
      payload: { trackDef: SQUARE, carId: 'paper-scooter', seed: 1, inputs },
    })
    const res = await app.inject({ method: 'GET', url: '/ghosts/square' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.length).toBeGreaterThan(0)
    expect(body[0].inputs).toBeDefined()
  })

  it('lists ladder for a track', async () => {
    const res = await app.inject({ method: 'GET', url: '/ladder/square' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body)).toBe(true)
  })
})
