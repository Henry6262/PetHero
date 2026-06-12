import { TrackDef, buildTrack } from './track'
import { KartInput, KartParams, DEFAULT_KART } from './kart'
import { RaceState, createRace, stepRace } from './race'

/**
 * Headless deterministic race execution. A replay is (trackDef, numKarts, inputLog);
 * re-running it MUST reproduce the exact same RaceState. This is the foundation for
 * ghosts (Plan 3) and server-side replay verification (anti-cheat).
 */
export function runRace(
  trackDef: TrackDef,
  numKarts: number,
  inputLog: KartInput[][],
  params: KartParams = DEFAULT_KART,
): RaceState {
  const track = buildTrack(trackDef)
  const race = createRace(track, numKarts)
  for (const inputs of inputLog) {
    if (race.finished) break
    stepRace(race, track, inputs, params)
  }
  return race
}
