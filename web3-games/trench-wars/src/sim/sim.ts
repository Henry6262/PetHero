import {
  ARENA_H, ARENA_W, DECK_SIZE, DOUBLE_ELIXIR_TICK, ELIXIR_MAX, ELIXIR_PER_TICK,
  ELIXIR_START, FLEE_HP_RATIO, HAND_SIZE, LANE_LEFT_X, LANE_RIGHT_X, MATCH_TICKS,
  OVERTIME_TICKS, RIVER_Y, SPELL_TOWER_DAMAGE_MULT,
} from './constants'
import { getCard } from './cards'
import type { DeployCommand, MatchResult, PlayerId, SimState, Tower, UnitEntity } from './types'

const TOWER_STATS = {
  lane: { hp: 1400, damage: 90, range: 5.5, attackSpeed: 8 },
  king: { hp: 2400, damage: 120, range: 7.0, attackSpeed: 10 },
} as const

export function createMatch(seed: number, decks: [string[], string[]]): SimState {
  for (const d of decks) {
    if (d.length !== DECK_SIZE) throw new Error(`deck must have ${DECK_SIZE} cards`)
    d.forEach(getCard) // throws on unknown id
  }
  let nextId = 1
  const towers: Tower[] = []
  for (const owner of [0, 1] as const) {
    // player 0 = bottom (small y), player 1 = top, mirrored
    const laneY = owner === 0 ? 6.5 : ARENA_H - 6.5
    const kingY = owner === 0 ? 3 : ARENA_H - 3
    for (const x of [LANE_LEFT_X, LANE_RIGHT_X]) {
      towers.push({ id: nextId++, owner, kind: 'lane', x, y: laneY, hp: TOWER_STATS.lane.hp, maxHp: TOWER_STATS.lane.hp, active: true, cooldown: 0 })
    }
    towers.push({ id: nextId++, owner, kind: 'king', x: ARENA_W / 2, y: kingY, hp: TOWER_STATS.king.hp, maxHp: TOWER_STATS.king.hp, active: false, cooldown: 0 })
  }
  return {
    tick: 0,
    rngState: seed >>> 0,
    elixir: [ELIXIR_START, ELIXIR_START],
    decks: [[...decks[0]], [...decks[1]]],
    units: [],
    towers,
    nextId,
    overtime: false,
    result: null,
  }
}

export function step(prev: SimState, commands: DeployCommand[]): SimState {
  const s: SimState = structuredClone(prev)
  if (s.result) return s

  applyCommands(s, commands)   // Task 5
  regenElixir(s)
  updateUnits(s)               // Task 6/7
  updateTowers(s)              // Task 7/8
  cleanupAndWinCheck(s)        // Task 8
  s.tick++
  return s
}

function regenElixir(s: SimState) {
  const rate = (s.tick >= DOUBLE_ELIXIR_TICK || s.overtime) ? 2 * ELIXIR_PER_TICK : ELIXIR_PER_TICK
  s.elixir = [Math.min(ELIXIR_MAX, s.elixir[0] + rate), Math.min(ELIXIR_MAX, s.elixir[1] + rate)]
}

// ---- placeholders fleshed out by later tasks (keep them, they make this file compile) ----
function applyCommands(_s: SimState, _commands: DeployCommand[]) {}
function updateUnits(_s: SimState) {}
function updateTowers(_s: SimState) {}
function cleanupAndWinCheck(_s: SimState) {}

export { TOWER_STATS }
