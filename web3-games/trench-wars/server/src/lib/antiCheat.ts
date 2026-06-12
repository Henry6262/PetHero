import { runReplay, fingerprint } from '../../../src/sim/replay'
import type { Replay, MatchResult, SimState } from '../../../src/sim/types'

export type ClaimedWinner = 0 | 1 | null

export interface VerificationResult {
  state: SimState
  winner: ClaimedWinner
  computedFingerprint: string
}

export function verifyReplay(
  replay: Replay,
  claimedWinner: ClaimedWinner,
  claimedFingerprint: string,
): VerificationResult {
  const state = runReplay(replay)
  if (!state.result) {
    throw new Error('replay did not reach a terminal state')
  }

  const computedWinner = normalizeWinner(state.result.winner)
  if (computedWinner !== claimedWinner) {
    throw new Error(
      `winner mismatch: claimed ${formatWinner(claimedWinner)}, computed ${formatWinner(computedWinner)}`,
    )
  }

  const computedFingerprint = fingerprint(state)
  if (computedFingerprint !== claimedFingerprint) {
    throw new Error('fingerprint mismatch')
  }

  return { state, winner: computedWinner, computedFingerprint }
}

function normalizeWinner(w: MatchResult['winner']): ClaimedWinner {
  if (w === null) return null
  if (w !== 0 && w !== 1) throw new Error(`invalid winner value: ${w}`)
  return w
}

function formatWinner(w: ClaimedWinner): string {
  if (w === null) return 'draw'
  return w === 0 ? 'attacker' : 'defender'
}
