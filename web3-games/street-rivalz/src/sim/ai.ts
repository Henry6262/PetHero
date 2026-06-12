import { KartState, KartInput } from './kart'
import { Track, pointAtProgress, wrapProgress } from './track'
import { Vec2, v, sub, len, clamp } from './math'

export interface RaceContext {
  track: Track
  karts: KartState[]
}

function angleSigned(from: Vec2, to: Vec2): number {
  return Math.atan2(from.x * to.y - from.y * to.x, from.x * to.x + from.y * to.y)
}

/**
 * Produce an input for an AI kart.
 * `skill` 0..1 tunes aggression: higher = earlier throttle, tighter lines.
 */
export function aiInput(k: KartState, ctx: RaceContext, skill: number = 0.8): KartInput {
  const speed = len(k.vel)
  const lookAhead = 10 + speed * (0.25 + skill * 0.15)
  const targetProgress = wrapProgress(k.progress + lookAhead, ctx.track.total)
  const target = pointAtProgress(ctx.track, targetProgress)

  // also look slightly further out for sharp corners
  const farProgress = wrapProgress(k.progress + lookAhead * 1.6, ctx.track.total)
  const farTarget = pointAtProgress(ctx.track, farProgress)

  const headingVec = v(Math.cos(k.heading), Math.sin(k.heading))
  const toTarget = sub(target, k.pos)
  const toFar = sub(farTarget, target)

  // steer toward target
  const errNear = angleSigned(headingVec, toTarget)
  const errFar = angleSigned(headingVec, toFar)
  const err = errNear * 0.7 + errFar * 0.3
  const steerGain = 1.2 + skill * 0.6
  const steer = clamp(err * steerGain, -1, 1)

  // throttle: lift if heading far off or corner is tight
  const absErr = Math.abs(err)
  let throttle = 1
  if (absErr > 0.9) throttle = 0.5
  if (absErr > 1.35) throttle = -0.5 // brake for hairpin

  // drift if turning hard and fast enough; release when tier-2 charge is reached
  let drift = absErr > 0.8 && speed > k.params.driftMinSpeed
  if (k.drift.active && k.drift.charge >= k.params.chargeTiers[1]) {
    drift = false // release for boost
  }

  // AI uses items immediately on pickup (simple v1 behaviour)
  const useItem = Boolean(k.heldItem)

  return { throttle, steer, drift, useItem }
}

/** Inputs for all AI karts (kart 0 is assumed player). */
export function aiInputs(ctx: RaceContext): KartInput[] {
  return ctx.karts.map((k, i) =>
    i === 0 ? { throttle: 0, steer: 0, drift: false } : aiInput(k, ctx, 0.75 + i * 0.03),
  )
}
