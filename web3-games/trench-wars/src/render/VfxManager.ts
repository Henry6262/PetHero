import Phaser from 'phaser'
import { BRAND, cssToHex } from './Brand'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: number
  alpha: number
}

interface Ring {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
  maxLife: number
  color: number
}

export type ProjectFn = (x: number, y: number) => { x: number; y: number }

export class VfxManager {
  private particles: Particle[] = []
  private rings: Ring[] = []
  private gfx?: Phaser.GameObjects.Graphics
  private project: ProjectFn

  constructor(scene: Phaser.Scene, project: ProjectFn) {
    this.project = project
    this.gfx = scene.add.graphics()
    this.gfx.setDepth(100)
  }

  deploy(x: number, y: number) {
    this.burst(x, y, 8, 0.3, BRAND.colors.primary, 0.6)
  }

  hit(x: number, y: number, color = cssToHex(BRAND.colors.white)) {
    this.burst(x, y, 5, 0.2, color, 0.35)
  }

  explosion(x: number, y: number, color = BRAND.colors.defender as number) {
    this.burst(x, y, 24, 1.2, color, 0.9)
    this.burst(x, y, 12, 0.8, BRAND.colors.primary, 0.7)
  }

  spellRing(x: number, y: number, radius: number, color = BRAND.colors.elixir as number) {
    this.rings.push({ x, y, radius: 2, maxRadius: radius, life: 0, maxLife: 600, color })
  }

  private burst(x: number, y: number, count: number, speed: number, color: number, alpha: number) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
      const v = speed * (0.4 + Math.random() * 0.8)
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: 0,
        maxLife: 350 + Math.random() * 250,
        size: 1.5 + Math.random() * 2.5,
        color,
        alpha,
      })
    }
  }

  update(delta: number) {
    const dt = delta
    for (const p of this.particles) {
      p.x += p.vx * dt * 0.05
      p.y += p.vy * dt * 0.05
      p.vy += 0.005 * dt // gravity
      p.life += dt
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife)

    for (const r of this.rings) {
      r.life += dt
      const t = r.life / r.maxLife
      r.radius = 2 + (r.maxRadius - 2) * t
    }
    this.rings = this.rings.filter((r) => r.life < r.maxLife)
  }

  draw() {
    if (!this.gfx) return
    this.gfx.clear()

    for (const p of this.particles) {
      const t = p.life / p.maxLife
      const alpha = p.alpha * (1 - t)
      const size = p.size * (1 - t * 0.5)
      const s = this.project(p.x, p.y)
      this.gfx.fillStyle(p.color, alpha)
      this.gfx.fillCircle(s.x, s.y, size)
    }

    for (const r of this.rings) {
      const t = r.life / r.maxLife
      const alpha = 0.85 * (1 - t)
      const c = this.project(r.x, r.y)
      const edge = this.project(r.x + r.radius, r.y)
      const radiusPx = Math.abs(edge.x - c.x)
      this.gfx.lineStyle(2, r.color, alpha)
      this.gfx.strokeCircle(c.x, c.y, radiusPx)
    }
  }

  destroy() {
    this.gfx?.destroy()
    this.particles = []
    this.rings = []
  }
}
