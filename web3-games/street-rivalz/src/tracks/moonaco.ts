import { TrackDef } from '../sim/track'

/**
 * Moonaco v0 — street-circuit-style closed loop (meters, CCW).
 * Layout beats: start straight -> fast right sweep -> harbor esses ->
 * hairpin (casino corner) -> back straight -> final chicane onto start.
 * Geometry is v0: drivable + correct; beautification happens with the
 * real track art pass in Plan 4.
 */
export const MOONACO: TrackDef = {
  name: 'moonaco',
  width: 14,
  centerline: [
    [0, 0], [45, 0], [90, 0], [130, 8],          // start straight
    [165, 25], [185, 55], [190, 90],             // right sweep
    [180, 120], [155, 140], [125, 145],          // harbor entry
    [100, 160], [90, 190], [105, 215],           // esses
    [95, 245], [65, 255], [35, 245], [25, 215],  // casino hairpin
    [10, 190], [-20, 180], [-50, 185],           // hairpin exit
    [-80, 170], [-95, 140], [-95, 105],          // back sweep
    [-90, 70], [-75, 40], [-50, 20], [-25, 8],   // final chicane onto start
  ],
  checkpoints: [0, 6, 13, 20],
}
