import { KartState, ItemType } from './kart'
import { Vec2, v, len, sub } from './math'
import { ITEMS } from '../data/items'

export const TRAP_RADIUS = 3.5
export const CLOUD_RADIUS = 9
export const CLOUD_TICKS = 240 // 4s

export interface DroppedTrap {
  pos: Vec2
  ownerIndex: number
}

export interface FudCloud {
  pos: Vec2
  ticks: number
  ownerIndex: number
}

export interface ItemWorldState {
  traps: DroppedTrap[]
  clouds: FudCloud[]
}

function kartsAhead(k: KartState, karts: KartState[], ownerIndex: number): number[] {
  const indices: number[] = []
  const myScore = k.lap * 1e6 + k.progress
  for (let i = 0; i < karts.length; i++) {
    if (i === ownerIndex) continue
    const other = karts[i]
    const score = other.lap * 1e6 + other.progress
    if (score > myScore) indices.push(i)
  }
  return indices
}

function closestAhead(k: KartState, karts: KartState[], ownerIndex: number): number | null {
  const ahead = kartsAhead(k, karts, ownerIndex)
  if (ahead.length === 0) return null
  let best: { i: number; dist: number } | null = null
  for (const i of ahead) {
    const dist = len(sub(karts[i].pos, k.pos))
    if (!best || dist < best.dist) best = { i, dist }
  }
  return best!.i
}

export function applyItemUse(
  k: KartState,
  item: ItemType,
  world: ItemWorldState,
  karts: KartState[],
  ownerIndex: number,
): void {
  if (k.shieldTicks > 0 && item !== 'diamond-shield') {
    // shield blocks offensive item usage? No — shield protects from hits, not usage.
  }

  switch (item) {
    case 'candle-boost':
      k.boostTicks = Math.max(k.boostTicks, 40)
      break

    case 'diamond-shield':
      k.shieldTicks = Math.max(k.shieldTicks, 180)
      break

    case 'pump-rocket': {
      const target = closestAhead(k, karts, ownerIndex)
      if (target !== null && karts[target].shieldTicks === 0) {
        karts[target].spinoutTicks = Math.max(karts[target].spinoutTicks, 90)
      }
      break
    }

    case 'liquidation-wave': {
      for (const i of kartsAhead(k, karts, ownerIndex)) {
        if (karts[i].shieldTicks === 0) {
          karts[i].spinoutTicks = Math.max(karts[i].spinoutTicks, 60)
        }
      }
      break
    }

    case 'rug-pull':
      world.traps.push({ pos: v(k.pos.x, k.pos.y), ownerIndex })
      break

    case 'fud-cloud':
      world.clouds.push({ pos: v(k.pos.x, k.pos.y), ticks: CLOUD_TICKS, ownerIndex })
      break
  }
}

/** Resolve trap/cloud hits and tick down clouds. Call once per race step. */
export function resolveItemWorld(
  karts: KartState[],
  world: ItemWorldState,
): void {
  // traps
  for (let i = world.traps.length - 1; i >= 0; i--) {
    const trap = world.traps[i]
    let hit = false
    for (let k = 0; k < karts.length; k++) {
      if (k === trap.ownerIndex) continue
      const kart = karts[k]
      if (len(sub(kart.pos, trap.pos)) < TRAP_RADIUS && kart.shieldTicks === 0) {
        kart.spinoutTicks = Math.max(kart.spinoutTicks, 90)
        hit = true
        break
      }
    }
    if (hit) world.traps.splice(i, 1)
  }

  // clouds
  for (let i = world.clouds.length - 1; i >= 0; i--) {
    const cloud = world.clouds[i]
    for (let k = 0; k < karts.length; k++) {
      if (k === cloud.ownerIndex) continue
      const kart = karts[k]
      if (len(sub(kart.pos, cloud.pos)) < CLOUD_RADIUS) {
        kart.slowTicks = Math.max(kart.slowTicks, 10) // refresh slow while inside
      }
    }
    cloud.ticks--
    if (cloud.ticks <= 0) {
      world.clouds.splice(i, 1)
    }
  }
}

export function rollItem(rank: number, rng: () => number): ItemType {
  const weights = ITEMS.map((it) => it.weights[Math.min(rank, it.weights.length - 1)])
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < ITEMS.length; i++) {
    r -= weights[i]
    if (r <= 0) return ITEMS[i].id
  }
  return ITEMS[ITEMS.length - 1].id
}
