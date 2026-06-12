import Phaser from 'phaser'
import { createMatch, step, handOf, validateDeploy } from '../sim/sim'
import { aiCommands } from '../sim/ai'
import { getCard, STARTER_DECK } from '../sim/cards'
import { ARENA_H, ARENA_W, ELIXIR_MAX, MATCH_TICKS, OVERTIME_TICKS, RIVER_Y, TICK_MS } from '../sim/constants'
import { Ladder } from './ladder'
import type { DeployCommand, SimState } from '../sim/types'

const TILE = 30
export const GAME_W = ARENA_W * TILE          // 540
export const ARENA_PX_H = ARENA_H * TILE      // 960
const HUD_H = 150
export const GAME_H = ARENA_PX_H + HUD_H      // 1110

const P0_COLOR = 0x2bff88
const P1_COLOR = 0xff4d5e

// sim y grows upward for player 0; screen y grows downward
const sx = (x: number) => x * TILE
const sy = (y: number) => ARENA_PX_H - y * TILE

export class BattleScene extends Phaser.Scene {
  private sim!: SimState
  private ladder!: Ladder
  private gfx!: Phaser.GameObjects.Graphics
  private hudText!: Phaser.GameObjects.Text
  private cardTexts: Phaser.GameObjects.Text[] = []
  private acc = 0
  private selectedCard = 0
  private pending: DeployCommand[] = []
  private over = false

  constructor() { super('battle') }

  create() {
    this.ladder = new Ladder(window.localStorage)
    this.startMatch()
    this.gfx = this.add.graphics()
    this.hudText = this.add.text(8, ARENA_PX_H + 6, '', { fontFamily: 'monospace', fontSize: '15px', color: '#e6f0ff' })
    for (let i = 0; i < 4; i++) {
      const t = this.add.text(10 + i * 132, ARENA_PX_H + 64, '', {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
        backgroundColor: '#1c2740', padding: { x: 8, y: 14 }, fixedWidth: 122, align: 'center',
      }).setInteractive()
      t.on('pointerdown', () => { this.selectedCard = i })
      this.cardTexts.push(t)
    }
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onArenaClick(p))
    ;(window as any).__TRENCH_READY__ = true
  }

  private startMatch() {
    this.sim = createMatch(Date.now() >>> 0, [[...STARTER_DECK], [...STARTER_DECK]])
    this.acc = 0
    this.pending = []
    this.over = false
  }

  private onArenaClick(p: Phaser.Input.Pointer) {
    if (this.over) { this.startMatch(); return }
    if (p.y >= ARENA_PX_H) return // HUD clicks handled by card texts
    const hand = handOf(this.sim, 0)
    const cmd: DeployCommand = {
      tick: this.sim.tick,
      player: 0,
      cardId: hand[this.selectedCard],
      x: p.x / TILE,
      y: (ARENA_PX_H - p.y) / TILE,
    }
    if (validateDeploy(this.sim, cmd)) this.pending.push(cmd)
  }

  update(_time: number, delta: number) {
    if (!this.over) {
      this.acc += delta
      while (this.acc >= TICK_MS && !this.sim.result) {
        const cmds = [...this.pending, ...aiCommands(this.sim, 1, this.ladder.currentLevel())]
        this.pending = []
        // retag queued player commands to the current tick
        for (const c of cmds) c.tick = this.sim.tick
        this.sim = step(this.sim, cmds)
        this.acc -= TICK_MS
      }
      if (this.sim.result && !this.over) {
        this.over = true
        if (this.sim.result.winner === 0) this.ladder.recordWin()
        else if (this.sim.result.winner === 1) this.ladder.recordLoss()
      }
    }
    this.draw()
  }

  private draw() {
    const g = this.gfx
    g.clear()
    // arena halves + river + bridges
    g.fillStyle(0x12351f).fillRect(0, sy(RIVER_Y), GAME_W, ARENA_PX_H - sy(RIVER_Y))
    g.fillStyle(0x351212).fillRect(0, 0, GAME_W, sy(RIVER_Y))
    g.fillStyle(0x1b4965).fillRect(0, sy(RIVER_Y) - 9, GAME_W, 18)
    g.fillStyle(0x6b4f2a)
    g.fillRect(sx(4.5) - 27, sy(RIVER_Y) - 9, 54, 18)
    g.fillRect(sx(13.5) - 27, sy(RIVER_Y) - 9, 54, 18)
    // towers with hp bars
    for (const t of this.sim.towers) {
      if (t.hp <= 0) continue
      const size = t.kind === 'king' ? 54 : 42
      g.fillStyle(t.owner === 0 ? P0_COLOR : P1_COLOR, t.active ? 1 : 0.45)
      g.fillRect(sx(t.x) - size / 2, sy(t.y) - size / 2, size, size)
      g.fillStyle(0x000000, 0.6).fillRect(sx(t.x) - size / 2, sy(t.y) - size / 2 - 9, size, 6)
      g.fillStyle(0xffe14d).fillRect(sx(t.x) - size / 2, sy(t.y) - size / 2 - 9, size * (t.hp / t.maxHp), 6)
    }
    // units
    for (const u of this.sim.units) {
      const r = 7 + Math.min(9, u.maxHp / 160)
      const alpha = u.revealed ? 1 : 0.35 // own stealth units show faded
      g.fillStyle(u.owner === 0 ? P0_COLOR : P1_COLOR, alpha)
      g.fillCircle(sx(u.x), sy(u.y), r)
      g.fillStyle(0x000000, 0.6).fillRect(sx(u.x) - r, sy(u.y) - r - 7, 2 * r, 4)
      g.fillStyle(0xffe14d).fillRect(sx(u.x) - r, sy(u.y) - r - 7, 2 * r * (u.hp / u.maxHp), 4)
    }
    // HUD background + elixir bar
    g.fillStyle(0x0a0e14).fillRect(0, ARENA_PX_H, GAME_W, HUD_H)
    g.fillStyle(0x232c44).fillRect(8, ARENA_PX_H + 34, GAME_W - 16, 16)
    g.fillStyle(0xb44dff).fillRect(8, ARENA_PX_H + 34, (GAME_W - 16) * (this.sim.elixir[0] / ELIXIR_MAX), 16)

    const remaining = Math.max(0, (this.sim.overtime ? MATCH_TICKS + OVERTIME_TICKS : MATCH_TICKS) - this.sim.tick)
    const secs = Math.ceil(remaining / 10)
    const level = this.ladder.currentLevel()
    this.hudText.setText(
      this.over
        ? `${this.sim.result!.winner === 0 ? 'VICTORY' : this.sim.result!.winner === 1 ? 'DEFEAT' : 'DRAW'} (${this.sim.result!.reason}) — click to play again`
        : `vs ${level.name}${this.sim.overtime ? '  OVERTIME' : ''}  ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}  elixir ${Math.floor(this.sim.elixir[0])}`
    )
    const hand = handOf(this.sim, 0)
    hand.forEach((id, i) => {
      const c = getCard(id)
      this.cardTexts[i]
        .setText(`${c.name}\n${c.cost} elixir`)
        .setBackgroundColor(i === this.selectedCard ? '#3e57a0' : '#1c2740')
        .setAlpha(this.sim.elixir[0] >= c.cost ? 1 : 0.45)
    })
  }
}
