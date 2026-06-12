import { v, add, sub, scale, dot, norm, mulberry32 } from './math'
import { Track, sampleTrack, forwardDelta } from './track'
import {
  KartState, KartInput, KartParams,
  createKart, stepKart, KART_RADIUS, TOTAL_LAPS,
} from './kart'
import { rubberBandMultiplier, rankByProgress } from './rubberband'
import { applyItemUse, resolveItemWorld, rollItem, ItemWorldState } from './items'

export const CP_WINDOW = 6 // meters of progress within which a checkpoint counts
export const ITEM_BOX_WINDOW = 8 // meters of progress within which an item box is collected
export const ITEM_BOX_RESPAWN = 300 // ticks (5s)

export interface ItemBox {
  progress: number
  active: boolean
  respawnTicks: number
}

export interface RaceState extends ItemWorldState {
  tick: number
  karts: KartState[]
  finished: boolean
  itemBoxes: ItemBox[]
  rng: () => number
}

/** Clamp the kart onto the road and update its loop progress. */
export function applyTrackConstraints(k: KartState, track: Track): void {
  const s = sampleTrack(track, k.pos)
  const half = track.def.width / 2 - KART_RADIUS
  if (s.dist > half) {
    const out = norm(sub(k.pos, s.point))
    k.pos = add(s.point, scale(out, half))
    const vOut = dot(k.vel, out)
    if (vOut > 0) k.vel = sub(k.vel, scale(out, vOut * 1.4)) // remove + slight bounce
    k.vel = scale(k.vel, 0.92)                               // wall scrub
  }
  k.progress = s.progress
}

/** Ordered checkpoint advance; lap++ when start/finish is re-hit; anti-cut by ordering. */
export function updateCheckpoints(k: KartState, track: Track): void {
  if (k.finished) return
  const cps = track.cpProgress
  const next = (k.cpIndex + 1) % cps.length
  if (Math.abs(forwardDelta(k.progress, cps[next], track.total)) < CP_WINDOW) {
    k.cpIndex = next
    if (next === 0) {
      k.lap++
      if (k.lap > TOTAL_LAPS) k.finished = true
    }
  }
}

/** Spawn karts on a staggered grid just behind the start line, facing segment 0->1. */
export function createRace(track: Track, numKarts: number, seed: number = 12345): RaceState {
  const a = track.points[0]
  const b = track.points[1]
  const fwd = norm(sub(b, a))
  const side = v(-fwd.y, fwd.x)
  const heading = Math.atan2(fwd.y, fwd.x)
  const karts: KartState[] = []
  for (let i = 0; i < numKarts; i++) {
    const lateral = (i % 2 === 0 ? 1 : -1) * 2.5
    const back = 4 + Math.floor(i / 2) * 4.5
    const pos = add(add(a, scale(fwd, back)), scale(side, lateral))
    karts.push(createKart(pos, heading))
  }
  const itemBoxes: ItemBox[] = track.itemBoxProgress.map((p) => ({ progress: p, active: true, respawnTicks: 0 }))
  return { tick: 0, karts, finished: false, itemBoxes, traps: [], clouds: [], rng: mulberry32(seed) }
}

export function stepRace(
  race: RaceState,
  track: Track,
  inputs: KartInput[],
  params?: KartParams | KartParams[],
  rubberBandPlayerIndex: number = 0,
): void {
  const ranks = rankByProgress(race.karts)
  for (let i = 0; i < race.karts.length; i++) {
    const k = race.karts[i]
    if (k.finished) continue
    let p = Array.isArray(params) ? params[i] : params
    p = p ?? k.params
    if (i !== rubberBandPlayerIndex && race.karts.length > 1) {
      const mul = rubberBandMultiplier(ranks[i], race.karts.length)
      p = {
        ...p,
        accel: p.accel * mul,
        maxSpeed: p.maxSpeed * mul,
        boostMaxSpeed: p.boostMaxSpeed * mul,
      }
    }
    stepKart(k, inputs[i], p)
    applyTrackConstraints(k, track)
    updateCheckpoints(k, track)

    // item box pickup
    if (!k.heldItem) {
      for (const box of race.itemBoxes) {
        if (!box.active) continue
        if (Math.abs(forwardDelta(k.progress, box.progress, track.total)) < ITEM_BOX_WINDOW) {
          box.active = false
          box.respawnTicks = ITEM_BOX_RESPAWN
          k.heldItem = rollItem(ranks[i], race.rng)
          break
        }
      }
    }

    if (inputs[i].useItem && k.heldItem) {
      applyItemUse(k, k.heldItem, race, race.karts, i)
      k.heldItem = undefined
    }
  }
  resolveItemWorld(race.karts, race)
  for (const box of race.itemBoxes) {
    if (!box.active) {
      box.respawnTicks--
      if (box.respawnTicks <= 0) box.active = true
    }
  }
  race.tick++
  race.finished = race.karts.every((k) => k.finished)
}
