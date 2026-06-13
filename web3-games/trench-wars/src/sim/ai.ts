import { createMatch, step, handOf, validateDeploy } from './sim'
import { getCard } from './cards'
import { ARENA_H, RIVER_Y, LANE_LEFT_X, LANE_RIGHT_X } from './constants'
import type { DeployCommand, PlayerId, SimState } from './types'

export { createMatch, step } // re-export for test convenience

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

export interface AiLevel {
  name: string
  thinkEvery: number  // ticks between decisions (reaction speed)
  attackAt: number    // elixir threshold to start a push
}

export const AI_LEVELS: AiLevel[] = [
  { name: 'Paper Trader', thinkEvery: 30, attackAt: 9 },
  { name: 'Day Trader',   thinkEvery: 20, attackAt: 8 },
  { name: 'Quant',        thinkEvery: 15, attackAt: 8 },
  { name: 'Whale Desk',   thinkEvery: 10, attackAt: 7 },
  { name: 'Insider',      thinkEvery: 10, attackAt: 6 },
]

export function aiCommands(s: SimState, player: PlayerId, level: AiLevel): DeployCommand[] {
  if (s.tick === 0 || s.tick % level.thinkEvery !== 0 || s.result) return []
  const hand = handOf(s, player)
  const cards = hand.map(getCard)
  const affordableUnits = cards
    .filter(c => c.type === 'unit' && c.cost <= s.elixir[player])
    .sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))

  const ownHalf = (y: number) => (player === 0 ? y < RIVER_Y : y > RIVER_Y)
  const threats = s.units.filter(u => u.owner !== player && ownHalf(u.y))

  // Value play: drop a damage spell on a tight cluster of enemy units (≥3) it can hit.
  const damageSpell = cards
    .filter(c => c.type === 'spell' && c.effectDamage && c.cost <= s.elixir[player])
    .sort((a, b) => b.effectDamage! - a.effectDamage!)[0]
  if (damageSpell) {
    const enemies = s.units.filter(u => u.owner !== player)
    for (const e of enemies) {
      const hitCount = enemies.filter(o => dist(o, e) <= damageSpell.effectRadius!).length
      if (hitCount >= 3) {
        const spellCmd = { tick: s.tick, player, cardId: damageSpell.id, x: e.x, y: e.y }
        if (validateDeploy(s, spellCmd)) return [spellCmd]
      }
    }
  }

  if (affordableUnits.length === 0) return []

  let cmd: DeployCommand | null = null
  if (threats.length > 0) {
    // defend: cheapest unit directly between the nearest threat and our king
    const threat = threats.reduce((a, b) => {
      const ka = player === 0 ? a.y : ARENA_H - a.y
      const kb = player === 0 ? b.y : ARENA_H - b.y
      return kb < ka || (kb === ka && b.id < a.id) ? b : a
    })
    const y = player === 0 ? Math.max(1, threat.y - 2) : Math.min(ARENA_H - 1, threat.y + 2)
    cmd = { tick: s.tick, player, cardId: affordableUnits[0].id, x: threat.x, y }
  } else if (s.elixir[player] >= level.attackAt) {
    // push: most expensive affordable unit at the left/right bridge (alternate by tick for variety, still deterministic)
    const best = affordableUnits[affordableUnits.length - 1]
    const x = (s.tick / level.thinkEvery) % 2 === 0 ? LANE_LEFT_X : LANE_RIGHT_X
    const y = player === 0 ? RIVER_Y - 2 : RIVER_Y + 2
    cmd = { tick: s.tick, player, cardId: best.id, x, y }
  }
  if (cmd && validateDeploy(s, cmd)) return [cmd]
  return []
}

/** Headless full match, both sides AI — used by tests and balance checks. */
export function runMatchVsAi(
  seed: number,
  decks: [string[], string[]],
  level0: AiLevel,
  level1: AiLevel,
): SimState {
  let s = createMatch(seed, [[...decks[0]], [...decks[1]]])
  while (!s.result && s.tick < 3000) {
    s = step(s, [...aiCommands(s, 0, level0), ...aiCommands(s, 1, level1)])
  }
  return s
}
