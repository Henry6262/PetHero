import { Vec2, v, add, sub, scale, dot, len, clamp } from './math'

export const DT = 1 / 60
export const TOTAL_LAPS = 3
export const KART_RADIUS = 1.1

export interface KartInput {
  throttle: number // -1..1 (negative = brake/reverse)
  steer: number    // -1..1 (positive = left, math-positive rotation)
  drift: boolean
}

export interface KartParams {
  accel: number; brake: number; maxSpeed: number; reverseMax: number
  drag: number; grip: number; driftGrip: number
  steerRate: number; driftSteerBonus: number; driftMinSpeed: number
  chargeTiers: [number, number, number] // seconds of drift held per boost tier
  boostTicks: [number, number, number]  // boost duration per tier, in ticks
  boostAccel: number; boostMaxSpeed: number
}

export const DEFAULT_KART: KartParams = {
  accel: 26, brake: 50, maxSpeed: 26, reverseMax: 8,
  drag: 0.45, grip: 9, driftGrip: 2.4,
  steerRate: 2.1, driftSteerBonus: 1.6, driftMinSpeed: 11,
  chargeTiers: [0.7, 1.4, 2.2], boostTicks: [28, 50, 80],
  boostAccel: 38, boostMaxSpeed: 33,
}

export interface DriftState { active: boolean; dir: 1 | -1; charge: number }

export interface KartState {
  pos: Vec2
  heading: number // radians; 0 = +x
  vel: Vec2
  drift: DriftState
  boostTicks: number
  lap: number      // starts at 1
  cpIndex: number  // last checkpoint hit (0..n-1)
  finished: boolean
  progress: number // loop progress, updated by track constraints
}

export function createKart(pos: Vec2, heading: number): KartState {
  return {
    pos, heading, vel: v(0, 0),
    drift: { active: false, dir: 1, charge: 0 },
    boostTicks: 0, lap: 1, cpIndex: 0, finished: false, progress: 0,
  }
}

export function stepKart(k: KartState, input: KartInput, p: KartParams): void {
  const fwd = v(Math.cos(k.heading), Math.sin(k.heading))
  const speedF = dot(k.vel, fwd) // signed forward speed

  // --- steering, scaled down at low speed so you can't pivot in place
  const steerScale = clamp(Math.abs(speedF) / 6, 0, 1)
  let steer = clamp(input.steer, -1, 1) * p.steerRate * steerScale

  // --- drift state machine (behavior locked by Task 5's tests)
  if (k.drift.active) {
    // release on button-up, or auto-release when genuinely slow (total speed,
    // not forward speed — drifting rotates heading away from velocity, which
    // would collapse forward speed and end every drift instantly)
    if (!input.drift || len(k.vel) < p.driftMinSpeed * 0.6) {
      const t = p.chargeTiers
      if (k.drift.charge >= t[2]) k.boostTicks = p.boostTicks[2]
      else if (k.drift.charge >= t[1]) k.boostTicks = p.boostTicks[1]
      else if (k.drift.charge >= t[0]) k.boostTicks = p.boostTicks[0]
      k.drift.active = false
      k.drift.charge = 0
    } else {
      k.drift.charge += DT
      steer = (steer + k.drift.dir * p.steerRate * 0.5) * p.driftSteerBonus
    }
  } else if (input.drift && Math.abs(input.steer) > 0.25 && speedF > p.driftMinSpeed) {
    k.drift.active = true
    k.drift.dir = input.steer > 0 ? 1 : -1
    k.drift.charge = 0
  }
  k.heading += steer * DT * (speedF >= 0 ? 1 : -1)

  // --- longitudinal forces
  const boosting = k.boostTicks > 0
  if (boosting) k.boostTicks--
  const throttle = clamp(input.throttle, -1, 1)
  let a = 0
  if (boosting) a += p.boostAccel
  if (throttle > 0) a += throttle * p.accel
  else if (throttle < 0) a += throttle * (speedF > 0 ? p.brake : p.accel * 0.5)
  const fwd2 = v(Math.cos(k.heading), Math.sin(k.heading))
  k.vel = add(k.vel, scale(fwd2, a * DT))

  // --- grip: decay lateral velocity (looser while drifting)
  const f = dot(k.vel, fwd2)
  const lat = sub(k.vel, scale(fwd2, f))
  const g = k.drift.active ? p.driftGrip : p.grip
  k.vel = add(scale(fwd2, f), scale(lat, Math.max(0, 1 - g * DT)))

  // --- drag + speed caps
  k.vel = scale(k.vel, Math.max(0, 1 - p.drag * DT))
  const cap = boosting ? p.boostMaxSpeed : p.maxSpeed
  const sp = len(k.vel)
  if (sp > cap) k.vel = scale(k.vel, cap / sp)
  const f2 = dot(k.vel, fwd2)
  if (f2 < -p.reverseMax) k.vel = add(k.vel, scale(fwd2, -p.reverseMax - f2))

  // --- integrate
  k.pos = add(k.pos, scale(k.vel, DT))
}
