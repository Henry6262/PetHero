import { KartState, TOTAL_LAPS } from '../sim/kart'
import { len } from '../sim/math'

export class Hud {
  private position = document.getElementById('position')!
  private speed = document.getElementById('speed')!
  private lap = document.getElementById('lap')!
  private item = document.getElementById('item')!
  private driftFill = document.getElementById('drift-fill')!

  update(k: KartState, position: number, total: number): void {
    this.position.textContent = `${position}/${total}`
    this.speed.textContent = `${Math.round(len(k.vel) * 3.6)} km/h`
    this.lap.textContent = k.finished
      ? 'FINISHED'
      : `LAP ${Math.min(k.lap, TOTAL_LAPS)}/${TOTAL_LAPS}`
    this.item.textContent = k.heldItem ? k.heldItem.toUpperCase().replace(/-/g, ' ') : '-'
    const t = k.params.chargeTiers
    const pct = Math.min(100, (k.drift.charge / t[2]) * 100)
    const el = this.driftFill as HTMLElement
    el.style.width = `${k.drift.active ? pct : 0}%`
    el.style.background = k.drift.charge >= t[2] ? '#f472b6' : k.drift.charge >= t[1] ? '#fb923c' : '#4ade80'
  }
}
