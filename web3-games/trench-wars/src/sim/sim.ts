import {
  ARENA_H, ARENA_W, DECK_SIZE, DOUBLE_ELIXIR_TICK, ELIXIR_MAX, ELIXIR_PER_TICK,
  ELIXIR_START, FLEE_HP_RATIO, HAND_SIZE, LANE_LEFT_X, LANE_RIGHT_X, MATCH_TICKS,
  OVERTIME_TICKS, RIVER_Y, SPELL_TOWER_DAMAGE_MULT,
} from './constants'
import { getCard } from './cards'
import type { CardDef, DeployCommand, MatchResult, PlayerId, SimState, Tower, UnitEntity } from './types'

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

export function handOf(s: SimState, p: PlayerId): string[] {
  return s.decks[p].slice(0, HAND_SIZE)
}

export function validateDeploy(s: SimState, cmd: DeployCommand): boolean {
  let card
  try { card = getCard(cmd.cardId) } catch { return false }
  if (!handOf(s, cmd.player).includes(cmd.cardId)) return false
  if (s.elixir[cmd.player] < card.cost) return false
  if (cmd.x < 0 || cmd.x > ARENA_W || cmd.y < 0 || cmd.y > ARENA_H) return false
  if (card.type === 'unit') {
    const onOwnHalf = cmd.player === 0 ? cmd.y < RIVER_Y - 0.5 : cmd.y > RIVER_Y + 0.5
    if (!onOwnHalf) return false
  }
  return true
}

function applyCommands(s: SimState, commands: DeployCommand[]) {
  for (const cmd of commands) {
    if (!validateDeploy(s, cmd)) continue
    const card = getCard(cmd.cardId)
    s.elixir[cmd.player] -= card.cost
    // cycle: remove from hand position, push to back of queue
    const idx = s.decks[cmd.player].indexOf(cmd.cardId)
    s.decks[cmd.player].splice(idx, 1)
    s.decks[cmd.player].push(cmd.cardId)

    if (card.type === 'spell') {
      castSpell(s, cmd, card) // Task 9
    } else {
      for (let i = 0; i < card.count!; i++) {
        // deterministic ring offsets so multi-unit cards don't stack on one point
        const angle = (2 * Math.PI * i) / card.count!
        const r = card.count! > 1 ? 0.7 : 0
        s.units.push({
          id: s.nextId++,
          owner: cmd.player,
          cardId: card.id,
          x: Math.min(ARENA_W, Math.max(0, cmd.x + r * Math.cos(angle))),
          y: Math.min(ARENA_H, Math.max(0, cmd.y + r * Math.sin(angle))),
          hp: card.hp!,
          maxHp: card.hp!,
          cooldown: 0,
          fleeing: false,
          revealed: card.stealthRange === undefined,
          buffUntil: 0,
        })
      }
    }
  }
}

function castSpell(_s: SimState, _cmd: DeployCommand, _card: CardDef) {} // Task 9

// ---- placeholders fleshed out by later tasks ----
function updateUnits(_s: SimState) {}
function updateTowers(_s: SimState) {}
function cleanupAndWinCheck(_s: SimState) {}

export { TOWER_STATS }
