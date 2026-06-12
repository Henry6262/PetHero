// Pure function form so RNG state can live inside SimState and replays stay exact.
export function nextRand(state: number): [value: number, nextState: number] {
  const a = (state + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a >>> 0]
}
