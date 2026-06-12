import { v, add, sub, scale, dot, norm } from './math'
import { Track, sampleTrack, forwardDelta } from './track'
import {
  KartState, KartInput, KartParams,
  createKart, stepKart, KART_RADIUS, TOTAL_LAPS,
} from './kart'

export const CP_WINDOW = 6 // meters of progress within which a checkpoint counts

export interface RaceState {
  tick: number
  karts: KartState[]
  finished: boolean
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
export function createRace(track: Track, numKarts: number): RaceState {
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
  return { tick: 0, karts, finished: false }
}

export function stepRace(
  race: RaceState,
  track: Track,
  inputs: KartInput[],
  params?: KartParams | KartParams[],
): void {
  for (let i = 0; i < race.karts.length; i++) {
    const k = race.karts[i]
    if (k.finished) continue
    const p = Array.isArray(params) ? params[i] : params
    stepKart(k, inputs[i], p ?? k.params)
    applyTrackConstraints(k, track)
    updateCheckpoints(k, track)
  }
  race.tick++
  race.finished = race.karts.every((k) => k.finished)
}
