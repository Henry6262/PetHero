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


function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Nearest enemy tower that is still standing (lane towers shield the king implicitly by distance). */
function nearestEnemyTower(s: SimState, u: UnitEntity): Tower | null {
  let best: Tower | null = null
  for (const t of s.towers) {
    if (t.owner === u.owner || t.hp <= 0) continue
    if (!best || dist(u, t) < dist(u, best) || (dist(u, t) === dist(u, best) && t.id < best.id)) best = t
  }
  return best
}

function crossedRiver(u: UnitEntity): boolean {
  return u.owner === 0 ? u.y > RIVER_Y : u.y < RIVER_Y
}

/** Where this unit wants to walk when it has no combat target in range. */
function moveGoal(s: SimState, u: UnitEntity): { x: number; y: number } {
  if (u.fleeing) {
    const king = s.towers.find(t => t.owner === u.owner && t.kind === 'king')!
    return { x: king.x, y: king.y }
  }
  if (!crossedRiver(u)) {
    const bridgeX = u.x < ARENA_W / 2 ? LANE_LEFT_X : LANE_RIGHT_X
    if (dist(u, { x: bridgeX, y: RIVER_Y }) > 0.6) return { x: bridgeX, y: RIVER_Y }
  }
  const t = nearestEnemyTower(s, u)
  return t ?? { x: ARENA_W / 2, y: u.owner === 0 ? ARENA_H : 0 }
}

function moveToward(u: UnitEntity, goal: { x: number; y: number }, speed: number) {
  const d = dist(u, goal)
  if (d < 1e-6) return
  const stepLen = Math.min(speed, d)
  u.x += ((goal.x - u.x) / d) * stepLen
  u.y += ((goal.y - u.y) / d) * stepLen
}

/** Damage multiplier from friendly Influencer auras + own pump-signal buff. */
function damageMult(s: SimState, u: UnitEntity): number {
  let m = 1
  for (const ally of s.units) {
    if (ally.owner !== u.owner || ally.id === u.id) continue
    const aura = getCard(ally.cardId).aura
    if (aura?.damageMult && dist(u, ally) <= aura.radius) m *= aura.damageMult
  }
  if (u.buffUntil > s.tick) m *= getCard('pump-signal').buffDamageMult!
  return m
}

/** Speed multiplier from enemy FUD auras + own pump-signal buff. */
function speedMult(s: SimState, u: UnitEntity): number {
  let m = 1
  for (const enemy of s.units) {
    if (enemy.owner === u.owner) continue
    const aura = getCard(enemy.cardId).aura
    if (aura?.speedMult && dist(u, enemy) <= aura.radius) m *= aura.speedMult
  }
  if (u.buffUntil > s.tick) m *= getCard('pump-signal').buffSpeedMult!
  return m
}

function acquireTarget(s: SimState, u: UnitEntity): UnitEntity | null {
  const card = getCard(u.cardId)
  const candidates = s.units.filter(e => e.owner !== u.owner && e.revealed && dist(u, e) <= card.sightRange!)
  if (candidates.length === 0) return null
  if (card.targeting === 'lowestHp') {
    return candidates.reduce((a, b) => (b.hp < a.hp || (b.hp === a.hp && b.id < a.id)) ? b : a)
  }
  return candidates.reduce((a, b) => (dist(u, b) < dist(u, a) || (dist(u, b) === dist(u, a) && b.id < a.id)) ? b : a)
}

function dealDamage(s: SimState, attacker: UnitEntity, target: UnitEntity, card = getCard(attacker.cardId)) {
  const dmg = Math.round(card.damage! * damageMult(s, attacker))
  if (card.splashRadius) {
    for (const e of s.units) {
      if (e.owner !== attacker.owner && dist(target, e) <= card.splashRadius) e.hp -= dmg
    }
  } else {
    target.hp -= dmg
  }
  attacker.revealed = true // attacking breaks stealth
}

function updateUnits(s: SimState) {
  // stealth reveal pass: any enemy (unit or tower) within stealthRange reveals
  for (const u of s.units) {
    const sr = getCard(u.cardId).stealthRange
    if (sr === undefined || u.revealed) continue
    const enemyClose =
      s.units.some(e => e.owner !== u.owner && dist(u, e) <= sr) ||
      s.towers.some(t => t.owner !== u.owner && t.hp > 0 && dist(u, t) <= sr)
    if (enemyClose) u.revealed = true
  }

  for (const u of s.units) {
    const card = getCard(u.cardId)
    if (u.cooldown > 0) u.cooldown--

    // flee check (Paper Hands)
    if (card.flees && !u.fleeing && u.hp < FLEE_HP_RATIO * u.maxHp) u.fleeing = true
    if (u.fleeing) {
      moveToward(u, moveGoal(s, u), card.speed! * speedMult(s, u))
      continue
    }

    const target = acquireTarget(s, u)
    if (target && dist(u, target) <= card.range!) {
      if (u.cooldown === 0) {
        dealDamage(s, u, target)
        u.cooldown = card.attackSpeed!
      }
      continue // in combat: hold position
    }
    // tower in attack range? (units siege towers when nothing else is around)
    const tower = nearestEnemyTower(s, u)
    if (tower && dist(u, tower) <= card.range! + 0.8) {
      if (u.cooldown === 0) {
        tower.hp -= Math.round(card.damage! * damageMult(s, u))
        u.revealed = true
        u.cooldown = card.attackSpeed!
      }
      continue
    }
    const goal = target ?? moveGoal(s, u)
    moveToward(u, goal, card.speed! * speedMult(s, u))
  }

  // remove dead units (insertion order preserved)
  s.units = s.units.filter(u => u.hp > 0)
}

// ---- placeholders fleshed out by later tasks ----
function updateTowers(_s: SimState) {}
function cleanupAndWinCheck(_s: SimState) {}

export { TOWER_STATS }
