import request from 'supertest'
import type { Application } from 'express'
import { PrismaClient } from '@prisma/client'
import { createApp } from '../src/app'
import { createMatch, step, aiCommands } from '../../src/sim/ai'
import { STARTER_DECK } from '../../src/sim/cards'
export { STARTER_DECK }
import { AI_LEVELS } from '../../src/sim/ai'
import type { DeployCommand, Replay } from '../../src/sim/types'

export const cookieSecret = 'test-secret'

export const testPrisma = new PrismaClient()

export function createTestApp(): Application {
  return createApp({
    prisma: testPrisma,
    cookieSecret,
    clientUrl: 'http://localhost:5174',
  })
}

export function agent(app: Application): ReturnType<typeof request.agent> {
  return request.agent(app) as ReturnType<typeof request.agent>
}

export async function createAccount(app: Application): Promise<{ id: string; agent: ReturnType<typeof request.agent> }> {
  const a = agent(app)
  const res = await a.post('/api/accounts').expect(201)
  return { id: res.body.account.id, agent: a }
}

export function buildEmptyReplay(seed = 1): Replay {
  return {
    seed,
    decks: [STARTER_DECK, STARTER_DECK],
    commands: [],
  }
}

export function runAiMatch(seed: number, level0 = AI_LEVELS[1], level1 = AI_LEVELS[1]): { replay: Replay; winner: 0 | 1 | null } {
  let s = createMatch(seed, [[...STARTER_DECK], [...STARTER_DECK]])
  const commands: DeployCommand[] = []
  while (!s.result && s.tick < 3000) {
    const tickCmds = [...aiCommands(s, 0, level0), ...aiCommands(s, 1, level1)]
    commands.push(...tickCmds)
    s = step(s, tickCmds)
  }
  return {
    replay: { seed, decks: [STARTER_DECK, STARTER_DECK], commands },
    winner: s.result?.winner ?? null,
  }
}
