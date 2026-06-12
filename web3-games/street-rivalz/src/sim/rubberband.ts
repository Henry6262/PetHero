/**
 * Rubber-band multipliers by race rank.
 * Honest at the front, catch-up at the back.
 * Applied to AI accel / top-speed only (never the player).
 */
export function rubberBandMultiplier(rank: number, total: number): number {
  if (total <= 1) return 1.0
  if (rank === 0) return 1.0 // first place: no help
  if (rank === total - 1) return 1.12 // last place: max catch-up
  // linear interpolation between 2nd and last
  return 1.0 + (rank / (total - 1)) * 0.10
}

/** Sort karts by effective race progress (lap + progress fraction). Lower = leading. */
export function rankByProgress(karts: { lap: number; progress: number; finished: boolean }[]): number[] {
  const withIndex = karts.map((k, i) => ({ i, score: k.lap * 1e6 + k.progress + (k.finished ? 1e9 : 0) }))
  withIndex.sort((a, b) => b.score - a.score) // descending: highest score first
  const ranks = new Array(karts.length)
  for (let r = 0; r < withIndex.length; r++) {
    ranks[withIndex[r].i] = r
  }
  return ranks
}
