import { BRAND, hexToCss } from './Brand'

export type ProjectFn = (x: number, y: number) => { x: number; y: number }

interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; size: number; color: number; alpha: number
}

interface Ring {
  x: number; y: number; radius: number; maxRadius: number
  life: number; maxLife: number; color: number
}

/** Particle + spell-ring effects drawn on the 2D overlay canvas in sim coords. */
export class Vfx2D {
  private particles: Particle[] = []
  private rings: Ring[] = []

  private project: ProjectFn

  constructor(project: ProjectFn) {
    this.project = project
  }

  deploy(x: number, y: number) {
    this.burst(x, y, 8, 0.3, BRAND.colors.primary, 0.6)
  }

  hit(x: number, y: number, color: number) {
    this.burst(x, y, 5, 0.2, color, 0.35)
  }

  explosion(x: number, y: number, color: number) {
    this.burst(x, y, 24, 1.2, color, 0.9)
    this.burst(x, y, 12, 0.8, BRAND.colors.primary, 0.7)
  }

  spellRing(x: number, y: number, radius: number, color = BRAND.colors.elixir) {
    this.rings.push({ x, y, radius: 2, maxRadius: radius, life: 0, maxLife: 600, color })
  }

  private burst(x: number, y: number, count: number, speed: number, color: number, alpha: number) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
      const v = speed * (0.4 + Math.random() * 0.8)
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: 0,
        maxLife: 350 + Math.random() * 250,
        size: 1.5 + Math.random() * 2.5,
        color, alpha,
      })
    }
  }

  update(delta: number) {
    for (const p of this.particles) {
      p.x += p.vx * delta * 0.05
      p.y += p.vy * delta * 0.05
      p.vy += 0.005 * delta
      p.life += delta
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife)

    for (const r of this.rings) {
      r.life += delta
      r.radius = 2 + (r.maxRadius - 2) * (r.life / r.maxLife)
    }
    this.rings = this.rings.filter((r) => r.life < r.maxLife)
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const t = p.life / p.maxLife
      const s = this.project(p.x, p.y)
      ctx.globalAlpha = p.alpha * (1 - t)
      ctx.fillStyle = hexToCss(p.color)
      ctx.beginPath()
      ctx.arc(s.x, s.y, p.size * (1 - t * 0.5), 0, Math.PI * 2)
      ctx.fill()
    }
    for (const r of this.rings) {
      const t = r.life / r.maxLife
      const c = this.project(r.x, r.y)
      const edge = this.project(r.x + r.radius, r.y)
      ctx.globalAlpha = 0.85 * (1 - t)
      ctx.strokeStyle = hexToCss(r.color)
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(c.x, c.y, Math.abs(edge.x - c.x), 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
}
