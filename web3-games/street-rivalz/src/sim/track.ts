import { Vec2, v, add, sub, scale, dot, len, clamp } from './math'

export interface TrackDef {
  name: string
  width: number                   // total road width, meters
  centerline: [number, number][]  // closed CCW loop
  checkpoints: number[]           // ordered indices into centerline; [0] = start/finish
}

export interface Track {
  def: TrackDef
  points: Vec2[]
  cum: number[]         // cumulative centerline length at each point
  total: number         // total loop length
  cpProgress: number[]  // loop progress (m) of each checkpoint
}

export function buildTrack(def: TrackDef): Track {
  const points = def.centerline.map(([x, y]) => v(x, y))
  const cum: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + len(sub(points[i], points[i - 1])))
  }
  const total = cum[points.length - 1] + len(sub(points[0], points[points.length - 1]))
  return { def, points, cum, total, cpProgress: def.checkpoints.map((i) => cum[i]) }
}

export interface TrackSample {
  point: Vec2      // nearest point on centerline
  progress: number // meters along the loop at that point
  dist: number     // distance from query point to centerline
}

/** Nearest point on the closed centerline polyline (includes wrap segment). */
export function sampleTrack(track: Track, p: Vec2): TrackSample {
  const n = track.points.length
  let best: TrackSample = { point: track.points[0], progress: 0, dist: Infinity }
  for (let i = 0; i < n; i++) {
    const a = track.points[i]
    const b = track.points[(i + 1) % n]
    const ab = sub(b, a)
    const abLen2 = dot(ab, ab)
    const t = abLen2 === 0 ? 0 : clamp(dot(sub(p, a), ab) / abLen2, 0, 1)
    const point = add(a, scale(ab, t))
    const dist = len(sub(p, point))
    if (dist < best.dist) {
      const segLen = Math.sqrt(abLen2)
      best = { point, dist, progress: track.cum[i] + t * segLen }
    }
  }
  return best
}

/** Signed forward distance from `from` to `to` along a loop of length `total`. */
export function forwardDelta(from: number, to: number, total: number): number {
  let d = to - from
  if (d > total / 2) d -= total
  if (d < -total / 2) d += total
  return d
}
