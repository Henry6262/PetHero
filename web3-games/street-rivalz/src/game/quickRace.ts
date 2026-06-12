import { Track } from '../sim/track'
import { KartInput, KartParams, KartState } from '../sim/kart'
import { RaceState, createRace, stepRace } from '../sim/race'
import { aiInputs } from '../sim/ai'

export const COUNTDOWN_TICKS = 180 // 3 seconds at 60 Hz
export const QUICK_RACE_TIMEOUT = 3600 // 60 seconds

export interface QuickRaceResult {
  kart: KartState
  rank: number
  finished: boolean
  finalTick: number
}

export interface QuickRace {
  track: Track
  race: RaceState
  countdownTicks: number
  started: boolean
  finished: boolean
  timeoutTicks: number
  results?: QuickRaceResult[]
}

export function createQuickRace(
  track: Track,
  numKarts: number = 6,
  seed: number = Math.floor(Math.random() * 1e9),
  timeoutTicks: number = QUICK_RACE_TIMEOUT,
): QuickRace {
  return {
    track,
    race: createRace(track, numKarts, seed),
    countdownTicks: COUNTDOWN_TICKS,
    started: false,
    finished: false,
    timeoutTicks,
  }
}

export function stepQuickRace(
  qr: QuickRace,
  playerInput: KartInput,
  params?: KartParams[],
): void {
  if (qr.finished) return

  if (!qr.started) {
    qr.countdownTicks--
    if (qr.countdownTicks <= 0) qr.started = true
    qr.race.tick++
    return
  }

  // timeout guard
  if (qr.race.tick >= qr.timeoutTicks) {
    finishQuickRace(qr)
    return
  }

  const inputs = aiInputs({ track: qr.track, karts: qr.race.karts })
  inputs[0] = playerInput
  stepRace(qr.race, qr.track, inputs, params)

  if (qr.race.finished) finishQuickRace(qr)
}

function finishQuickRace(qr: QuickRace): void {
  qr.finished = true
  const order = qr.race.karts
    .map((k) => ({
      k,
      score: k.finished ? 1e12 + k.lap * 1e6 + k.progress : k.lap * 1e6 + k.progress,
      tick: k.finished ? 0 : qr.race.tick,
    }))
  order.sort((a, b) => b.score - a.score)
  qr.results = order.map((o, rank) => ({
    kart: o.k,
    rank: rank + 1,
    finished: o.k.finished,
    finalTick: o.tick,
  }))
}
