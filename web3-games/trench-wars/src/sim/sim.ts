import {
  ARENA_H, ARENA_W, DECK_SIZE, DOUBLE_ELIXIR_TICK, ELIXIR_MAX, ELIXIR_PER_TICK,
  ELIXIR_START, FLEE_HP_RATIO, HAND_SIZE, LANE_LEFT_X, LANE_RIGHT_X, MATCH_TICKS,
  OVERTIME_TICKS, RIVER_Y, SLOW_MULT, SPELL_TOWER_DAMAGE_MULT,
} from './constants'
import { getCard } from './cards'
import type { CardDef, DeployCommand, PlayerId, SimState, Tower, UnitEntity } from './types'

const TOWER_STATS = {
  lane: { hp: 1400, damage: 90, range: 5.5, attackSpeed: 8, radius: 1.0 },
  king: { hp: 2400, damage: 120, range: 7.0, attackSpeed: 10, radius: 1.4 },
} as const

// Boid-style separation tuned for lane battlers: strong enough to break clumps,
// weak enough that units still reach their goals.
const SEPARATION_STRENGTH = 0.08 // tiles/tick
const OVERLAP_ITERATIONS = 3

export function createMatch(seed: number, decks: [string[], string[]]): SimState {
  for (const d of decks) {
    if (d.length !== DECK_SIZE) throw new Error(`deck must have ${DECK_SIZE} cards`)
    d.forEach(getCard) // throws on unknown id
  }
  let nextId = 1
  const towers: Tower[] = []
  for (const owner of [0, 1] as const) {
    // player 0 = bottom (small y), player 1 = top, mirrored
    const laneY = owner === 0 ? 3.2 : ARENA_H - 3.2
    const kingY = owner === 0 ? 1.0 : ARENA_H - 1.0
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
          slowUntil: 0,
          hasAttacked: false,
          loadProgress: card.loadTime ?? 0,
          attackState: 'idle',
        })
      }
    }
  }
}

function castSpell(s: SimState, cmd: DeployCommand, card: CardDef) {
  const at = { x: cmd.x, y: cmd.y }
  if (card.effectDamage) {
    for (const u of s.units) {
      if (u.owner !== cmd.player && dist(at, u) <= card.effectRadius!) u.hp -= card.effectDamage
    }
    for (const t of s.towers) {
      if (t.owner !== cmd.player && t.hp > 0 && dist(at, t) <= card.effectRadius!) {
        t.hp -= Math.round(card.effectDamage * SPELL_TOWER_DAMAGE_MULT)
      }
    }
    s.units = s.units.filter(u => u.hp > 0)
  }
  if (card.buffTicks) {
    for (const u of s.units) {
      if (u.owner === cmd.player && dist(at, u) <= card.effectRadius!) u.buffUntil = s.tick + card.buffTicks
    }
  }
  if (card.effectHeal) {
    for (const u of s.units) {
      if (u.owner === cmd.player && dist(at, u) <= card.effectRadius!) {
        u.hp = Math.min(u.maxHp, u.hp + card.effectHeal)
      }
    }
  }
  if (card.slowTicks) {
    for (const u of s.units) {
      if (u.owner !== cmd.player && dist(at, u) <= card.effectRadius!) u.slowUntil = s.tick + card.slowTicks
    }
  }
}


function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function unitRadius(u: UnitEntity): number {
  return getCard(u.cardId).radius ?? 0.5
}

function isBuilding(u: UnitEntity): boolean {
  return !!getCard(u.cardId).building
}

/** Edge-to-edge contact reach: attacker.range is measured from attacker edge to target edge,
 *  but our card data follows the CR-derived convention centerDist <= range + targetRadius. */
function attackRangeTo(u: UnitEntity, target: UnitEntity): number {
  return getCard(u.cardId).range! + unitRadius(target)
}

function sightRangeTo(u: UnitEntity, target: UnitEntity): number {
  return getCard(u.cardId).sightRange! + unitRadius(target)
}

function towerAttackRangeTo(t: Tower, u: UnitEntity): number {
  return TOWER_STATS[t.kind].range + unitRadius(u)
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

/** Move toward goal while softly separating from nearby units. Clamped to maxSpeed. */
function stepMove(s: SimState, u: UnitEntity, goal: { x: number; y: number }, maxSpeed: number) {
  if (isBuilding(u)) return // buildings are immovable
  const card = getCard(u.cardId)
  const r = unitRadius(u)

  // Goal-seeking velocity.
  const dx = goal.x - u.x, dy = goal.y - u.y
  const d = Math.hypot(dx, dy)
  let vx = 0, vy = 0
  if (d > 0.001) {
    const step = Math.min(maxSpeed, d)
    vx = (dx / d) * step
    vy = (dy / d) * step
  }

  // Soft separation: push away from units inside 1.8× combined radius.
  // Building-targeters (targetsTowers) ignore enemy collision so they can push through.
  const pushesThroughEnemies = card.targetsTowers
  for (const o of s.units) {
    if (o.id === u.id || o.hp <= 0) continue
    const or = unitRadius(o)
    const rdx = u.x - o.x, rdy = u.y - o.y
    const rd = Math.hypot(rdx, rdy)
    const threshold = (r + or) * 1.8
    if (rd > 0.001 && rd < threshold) {
      const isAlly = u.owner === o.owner
      if (!isAlly && pushesThroughEnemies) continue
      const push = (threshold - rd) / threshold
      const strength = SEPARATION_STRENGTH * (isAlly ? 1.0 : 0.25)
      vx += (rdx / rd) * push * strength
      vy += (rdy / rd) * push * strength
    }
  }

  // Clamp so separation never accelerates a unit past its normal speed.
  const v = Math.hypot(vx, vy)
  if (v > maxSpeed) {
    vx = (vx / v) * maxSpeed
    vy = (vy / v) * maxSpeed
  }

  u.x += vx
  u.y += vy
}

/** Hard de-penetration pass: guarantees no two units visually overlap.
 *  Buildings are immovable; other units yield equally when colliding. */
function resolveOverlaps(s: SimState) {
  for (let iter = 0; iter < OVERLAP_ITERATIONS; iter++) {
    for (let i = 0; i < s.units.length; i++) {
      const a = s.units[i]
      if (a.hp <= 0) continue
      const aBuilding = isBuilding(a)
      const ar = unitRadius(a)
      for (let j = i + 1; j < s.units.length; j++) {
        const b = s.units[j]
        if (b.hp <= 0) continue
        const bBuilding = isBuilding(b)
        if (aBuilding && bBuilding) continue
        const br = unitRadius(b)
        const aPushesThrough = getCard(a.cardId).targetsTowers && a.owner !== b.owner
        const bPushesThrough = getCard(b.cardId).targetsTowers && b.owner !== a.owner
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.hypot(dx, dy)
        const minDist = ar + br
        if (d > 0.001 && d < minDist) {
          const overlap = minDist - d
          const nx = dx / d, ny = dy / d
          if (aBuilding || aPushesThrough) {
            // a is immovable; b takes full push
            b.x += nx * overlap
            b.y += ny * overlap
          } else if (bBuilding || bPushesThrough) {
            // b is immovable; a takes full push
            a.x -= nx * overlap
            a.y -= ny * overlap
          } else {
            a.x -= nx * overlap * 0.5
            a.y -= ny * overlap * 0.5
            b.x += nx * overlap * 0.5
            b.y += ny * overlap * 0.5
          }
        }
      }
    }
  }
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

/** Speed multiplier from enemy FUD auras + own pump-signal buff + mage-slow. */
function speedMult(s: SimState, u: UnitEntity): number {
  let m = 1
  for (const enemy of s.units) {
    if (enemy.owner === u.owner) continue
    const aura = getCard(enemy.cardId).aura
    if (aura?.speedMult && dist(u, enemy) <= aura.radius) m *= aura.speedMult
  }
  if (u.buffUntil > s.tick) m *= getCard('pump-signal').buffSpeedMult!
  if (u.slowUntil > s.tick) m *= SLOW_MULT
  return m
}

function acquireTarget(s: SimState, u: UnitEntity): UnitEntity | null {
  const card = getCard(u.cardId)
  if (card.targetsTowers) return null // Moon Boy ignores units, beelines for towers
  const isMelee = card.range! < 2
  let candidates = s.units.filter(e => {
    if (e.owner === u.owner || !e.revealed || dist(u, e) > sightRangeTo(u, e)) return false
    if (getCard(e.cardId).flying && isMelee) return false // melee can't reach flyers
    return true
  })
  if (candidates.length === 0) return null
  // taunt: a melee unit is pulled to the nearest enemy tank taunting it
  if (isMelee) {
    const taunters = candidates.filter(e => {
      const t = getCard(e.cardId).taunt
      return t !== undefined && dist(u, e) <= t + unitRadius(e)
    })
    if (taunters.length > 0) candidates = taunters
  }
  if (card.targeting === 'lowestHp') {
    return candidates.reduce((a, b) => (b.hp < a.hp || (b.hp === a.hp && b.id < a.id)) ? b : a)
  }
  return candidates.reduce((a, b) => (dist(u, b) < dist(u, a) || (dist(u, b) === dist(u, a) && b.id < a.id)) ? b : a)
}

/** Apply one hit's worth of damage to a single victim, honoring its armor; returns hp actually removed. */
function applyHit(victim: UnitEntity, rawDmg: number): number {
  const armor = getCard(victim.cardId).armor ?? 0
  const dealt = Math.max(1, rawDmg - armor)
  victim.hp -= dealt
  return dealt
}

function dealDamage(s: SimState, attacker: UnitEntity, target: UnitEntity, card = getCard(attacker.cardId)) {
  let dmg = card.damage! * damageMult(s, attacker)
  // assassin: first strike crits
  if (card.critFirst && !attacker.hasAttacked) dmg *= card.critFirst
  dmg = Math.round(dmg)
  attacker.hasAttacked = true

  let totalDealt = 0
  if (card.splashRadius) {
    for (const e of s.units) {
      if (e.owner !== attacker.owner && dist(target, e) <= card.splashRadius) {
        totalDealt += applyHit(e, dmg)
        if (card.slowTicks) e.slowUntil = s.tick + card.slowTicks
      }
    }
  } else {
    totalDealt = applyHit(target, dmg)
    if (card.slowTicks) target.slowUntil = s.tick + card.slowTicks
  }

  // brawler lifesteal
  if (card.lifesteal) attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.round(totalDealt * card.lifesteal))
  attacker.revealed = true // attacking breaks stealth
}

/** Attack cooldown after a hit, shortened by rage as the brawler loses hp. */
function attackCooldown(u: UnitEntity, card = getCard(u.cardId)): number {
  let cd = card.attackSpeed!
  if (card.rage) cd = Math.round(cd * (1 - card.rage * (1 - u.hp / u.maxHp)))
  return Math.max(1, cd)
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
    if (u.hp <= 0) continue // killed earlier this tick — can't act (no lifesteal from the grave)
    const card = getCard(u.cardId)
    if (u.cooldown > 0) u.cooldown--

    // buildings decay over their lifespan and never move; they only attack in range
    if (card.building) {
      u.hp -= u.maxHp / card.lifespan!
      const target = acquireTarget(s, u)
      if (target && dist(u, target) <= attackRangeTo(u, target)) {
        u.targetId = target.id
        if (u.cooldown === 0) {
          u.attackState = 'strike'
          dealDamage(s, u, target)
          u.cooldown = attackCooldown(u, card)
        } else {
          u.attackState = 'windup'
        }
      } else {
        u.attackState = 'idle'
        u.targetId = undefined
      }
      continue
    }

    // flee check (Paper Hands)
    if (card.flees && !u.fleeing && u.hp < FLEE_HP_RATIO * u.maxHp) u.fleeing = true
    if (u.fleeing) {
      u.attackState = 'idle'
      stepMove(s, u, moveGoal(s, u), card.speed! * speedMult(s, u))
      continue
    }

    const target = acquireTarget(s, u)
    const tower = nearestEnemyTower(s, u)
    const targetInRange = target && dist(u, target) <= attackRangeTo(u, target)
    const towerInRange = tower && dist(u, tower) <= card.range! + TOWER_STATS[tower.kind].radius

    if (targetInRange || towerInRange) {
      // In combat range: hold position and attack.
      u.targetId = targetInRange ? target!.id : undefined
      if (u.cooldown === 0) {
        if (u.attackState === 'windup') {
          // Windup finished — strike.
          u.attackState = 'strike'
          if (targetInRange) {
            dealDamage(s, u, target!, card)
          } else {
            tower!.hp -= Math.round(card.damage! * damageMult(s, u))
            u.revealed = true
          }
          u.cooldown = attackCooldown(u, card)
        } else {
          // Just entered range (or re-entered after losing target). Start windup.
          const firstHit = Math.max(0, card.attackSpeed! - u.loadProgress)
          u.loadProgress = 0
          if (firstHit === 0) {
            // Fully preloaded: strike immediately.
            u.attackState = 'strike'
            if (targetInRange) {
              dealDamage(s, u, target!, card)
            } else {
              tower!.hp -= Math.round(card.damage! * damageMult(s, u))
              u.revealed = true
            }
            u.cooldown = attackCooldown(u, card)
          } else {
            u.cooldown = firstHit
            u.attackState = 'windup'
          }
        }
      } else {
        u.attackState = 'windup'
      }
      continue
    }

    // No target in range: move and accumulate loadProgress.
    u.attackState = 'idle'
    u.targetId = undefined
    if (u.cooldown > 0) u.cooldown = 0 // abandon partial windup
    const goal = target ?? moveGoal(s, u)
    const prevX = u.x, prevY = u.y
    stepMove(s, u, goal, card.speed! * speedMult(s, u))
    if (target && (u.x !== prevX || u.y !== prevY)) {
      const loadTime = card.loadTime ?? card.attackSpeed!
      u.loadProgress = Math.min(loadTime, u.loadProgress + 1)
    }
  }

  // Resolve visual overlaps after all movement; buildings are immovable.
  resolveOverlaps(s)

  // remove dead units (insertion order preserved)
  s.units = s.units.filter(u => u.hp > 0)
}

function updateTowers(s: SimState) {
  for (const t of s.towers) {
    if (t.hp <= 0 || !t.active) continue
    if (t.cooldown > 0) { t.cooldown--; continue }
    const stats = TOWER_STATS[t.kind]
    let target: UnitEntity | null = null
    for (const u of s.units) {
      if (u.owner === t.owner || !u.revealed) continue
      if (dist(t, u) > towerAttackRangeTo(t, u)) continue
      if (!target || dist(t, u) < dist(t, target) || (dist(t, u) === dist(t, target) && u.id < target.id)) target = u
    }
    if (target) {
      // Towers delete direct attackers in ~3-4 hits, scaling with target health.
      const directHitDmg = Math.round(target.maxHp / 3.5)
      applyHit(target, directHitDmg)
      t.cooldown = stats.attackSpeed
    }
  }
  s.units = s.units.filter(u => u.hp > 0)
}

function crownsTaken(s: SimState, by: PlayerId): number {
  return s.towers.filter(t => t.owner !== by && t.hp <= 0).length
}

function towerDamageDealt(s: SimState, by: PlayerId): number {
  return s.towers.filter(t => t.owner !== by).reduce((sum, t) => sum + (t.maxHp - Math.max(0, t.hp)), 0)
}

function cleanupAndWinCheck(s: SimState) {
  // king wake-up: lane tower down, or king took damage
  for (const owner of [0, 1] as const) {
    const k = s.towers.find(t => t.owner === owner && t.kind === 'king')!
    if (!k.active && (k.hp < k.maxHp || s.towers.some(t => t.owner === owner && t.kind === 'lane' && t.hp <= 0))) {
      k.active = true
    }
  }
  // instant win: king destroyed
  for (const owner of [0, 1] as const) {
    if (s.towers.find(t => t.owner === owner && t.kind === 'king')!.hp <= 0) {
      s.result = { winner: (1 - owner) as PlayerId, reason: 'king' }
      return
    }
  }
  // full time
  if (!s.overtime && s.tick === MATCH_TICKS - 1) {
    const c0 = crownsTaken(s, 0), c1 = crownsTaken(s, 1)
    if (c0 !== c1) { s.result = { winner: c0 > c1 ? 0 : 1, reason: 'crowns' }; return }
    s.overtime = true
    return
  }
  // overtime: first crown wins (checked via crowns diff), else damage tiebreak at the end
  if (s.overtime) {
    const c0 = crownsTaken(s, 0), c1 = crownsTaken(s, 1)
    if (c0 !== c1) { s.result = { winner: c0 > c1 ? 0 : 1, reason: 'crowns' }; return }
    if (s.tick >= MATCH_TICKS + OVERTIME_TICKS - 1) {
      const d0 = towerDamageDealt(s, 0), d1 = towerDamageDealt(s, 1)
      s.result = d0 === d1
        ? { winner: null, reason: 'draw' }
        : { winner: d0 > d1 ? 0 : 1, reason: 'tiebreak' }
    }
  }
}

export { TOWER_STATS }
