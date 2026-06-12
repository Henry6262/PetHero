import { createMatch, step } from './sim'
import { MATCH_TICKS, OVERTIME_TICKS } from './constants'
import type { Replay, SimState } from './types'

/** Re-simulate a full replay to its terminal state. Hard cap prevents infinite loops on bad input. */
export function runReplay(replay: Replay): SimState {
  let s = createMatch(replay.seed, [[...replay.decks[0]], [...replay.decks[1]]])
  const byTick = new Map<number, Replay['commands']>()
  for (const c of replay.commands) {
    if (!byTick.has(c.tick)) byTick.set(c.tick, [])
    byTick.get(c.tick)!.push(c)
  }
  const cap = MATCH_TICKS + OVERTIME_TICKS + 10
  while (!s.result && s.tick < cap) {
    s = step(s, byTick.get(s.tick) ?? [])
  }
  return s
}

/** Stable digest of everything gameplay-relevant. Two honest runs MUST match byte-for-byte. */
export function fingerprint(s: SimState): string {
  const parts: string[] = [`t${s.tick}`, `r${s.result?.winner ?? 'x'}:${s.result?.reason ?? 'none'}`]
  for (const t of s.towers) parts.push(`T${t.id}:${t.hp}`)
  for (const u of s.units) parts.push(`U${u.id}:${u.cardId}:${u.hp}:${u.x.toFixed(4)}:${u.y.toFixed(4)}`)
  parts.push(`e${s.elixir[0].toFixed(4)}:${s.elixir[1].toFixed(4)}`)
  return parts.join('|')
}
