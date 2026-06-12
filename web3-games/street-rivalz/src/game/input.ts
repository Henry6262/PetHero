import { KartInput } from '../sim/kart'

export class KeyboardInput {
  private keys = new Set<string>()

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })
    window.addEventListener('keyup', (e) => this.keys.delete(e.code))
  }

  /** Positive steer = left (sim math-positive rotation). */
  read(): KartInput {
    const up = this.keys.has('ArrowUp') || this.keys.has('KeyW')
    const down = this.keys.has('ArrowDown') || this.keys.has('KeyS')
    const leftKey = this.keys.has('ArrowLeft') || this.keys.has('KeyA')
    const rightKey = this.keys.has('ArrowRight') || this.keys.has('KeyD')
    return {
      throttle: (up ? 1 : 0) + (down ? -1 : 0),
      steer: (leftKey ? 1 : 0) + (rightKey ? -1 : 0),
      drift: this.keys.has('Space'),
    }
  }

  pressed(code: string): boolean {
    return this.keys.has(code)
  }
}
