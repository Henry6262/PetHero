export interface Vec2 { x: number; y: number }

export const v = (x: number, y: number): Vec2 => ({ x, y })
export const add = (a: Vec2, b: Vec2): Vec2 => v(a.x + b.x, a.y + b.y)
export const sub = (a: Vec2, b: Vec2): Vec2 => v(a.x - b.x, a.y - b.y)
export const scale = (a: Vec2, s: number): Vec2 => v(a.x * s, a.y * s)
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y
export const len = (a: Vec2): number => Math.hypot(a.x, a.y)
export const norm = (a: Vec2): Vec2 => {
  const l = len(a)
  return l === 0 ? v(0, 0) : scale(a, 1 / l)
}
export const clamp = (x: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, x))

/** Deterministic PRNG — same seed gives same sequence on every platform. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
