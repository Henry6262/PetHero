// Re-export the pure sim so the backend can re-simulate replays for verification.
export { runRace } from '../../src/sim/runner'
export { buildTrack } from '../../src/sim/track'
export type { TrackDef } from '../../src/sim/track'
export type { KartInput, KartParams } from '../../src/sim/kart'
export { DT } from '../../src/sim/kart'
