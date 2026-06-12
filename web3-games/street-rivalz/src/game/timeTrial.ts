import { buildTrack, TrackDef } from '../sim/track'
import { createRace, stepRace, RaceState } from '../sim/race'
import { KartInput } from '../sim/kart'
import { api, Ghost } from '../api/client'

export interface TimeTrial {
  trackDef: TrackDef
  race: RaceState
  inputs: KartInput[][]
  finished: boolean
  submitted: boolean
  ghost?: Ghost
  ghostRace?: RaceState
  results?: { rank: number; bestTime: number; mmr: number }
}

export function createTimeTrial(trackDef: TrackDef, seed: number = Math.floor(Math.random() * 1e9)): TimeTrial {
  const track = buildTrack(trackDef)
  return {
    trackDef,
    race: createRace(track, 1, seed),
    inputs: [],
    finished: false,
    submitted: false,
  }
}

export async function loadGhost(tt: TimeTrial): Promise<void> {
  try {
    const ghosts = await api.getGhosts(tt.trackDef.name, 1)
    if (ghosts.length > 0) {
      tt.ghost = ghosts[0]
      tt.ghostRace = createRace(buildTrack(tt.trackDef), 1, tt.ghost.seed)
    }
  } catch (err) {
    console.error('failed to load ghost', err)
  }
}

export function stepTimeTrial(tt: TimeTrial, playerInput: KartInput): void {
  if (tt.finished) return
  tt.inputs.push([playerInput])
  const inputs: KartInput[] = [playerInput]
  if (tt.ghostRace && tt.ghost) {
    const tickInputs = tt.ghost.inputs[tt.ghostRace.tick]
    const ghostInput = tickInputs ? tickInputs[0] : { throttle: 0, steer: 0, drift: false }
    inputs.push(ghostInput)
  }
  stepRace(tt.race, buildTrack(tt.trackDef), inputs)
  if (tt.ghostRace) {
    stepRace(tt.ghostRace, buildTrack(tt.trackDef), [{ throttle: 0, steer: 0, drift: false }])
  }
  if (tt.race.karts[0].finished) {
    tt.finished = true
  }
}

export async function submitTimeTrial(tt: TimeTrial, carId: string): Promise<void> {
  if (tt.submitted || !tt.finished) return
  tt.submitted = true
  try {
    const res = await api.submitReplay({
      trackDef: tt.trackDef,
      carId,
      seed: 1,
      inputs: tt.inputs,
    })
    console.log('submit result', res)
    if (res.valid) {
      const rank = await api.getMyRank(tt.trackDef.name)
      tt.results = rank
    }
  } catch (err) {
    console.error('failed to submit time trial', err)
  }
}
