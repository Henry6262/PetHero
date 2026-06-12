import { runRace, buildTrack, DT, TrackDef, KartInput, KartParams } from './sim-bridge'

export interface ReplayPayload {
  trackDef: TrackDef
  carId: string
  seed: number
  inputs: KartInput[][]
}

export interface VerifyResult {
  valid: boolean
  finalTime?: number
  finalProgress?: number
  error?: string
}

export function verifyReplay(payload: ReplayPayload, params: KartParams): VerifyResult {
  const { trackDef, inputs } = payload
  try {
    const race = runRace(trackDef, 1, inputs, params)
    const k = race.karts[0]
    if (!k) return { valid: false, error: 'no kart in replay' }

    // Anti-cut: lap must have progressed naturally via checkpoints.
    // A valid time-trial replay should finish all laps.
    if (!k.finished) {
      return {
        valid: false,
        finalProgress: k.progress,
        error: `replay did not finish (lap ${k.lap}, progress ${k.progress.toFixed(1)})`,
      }
    }

    const finalTime = race.tick * DT
    return { valid: true, finalTime, finalProgress: k.progress }
  } catch (err) {
    return { valid: false, error: String(err) }
  }
}
