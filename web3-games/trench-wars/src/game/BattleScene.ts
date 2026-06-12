import Phaser from 'phaser'
import { createMatch, step, handOf, validateDeploy } from '../sim/sim'
import { aiCommands } from '../sim/ai'
import { getCard, STARTER_DECK } from '../sim/cards'
import { ARENA_H, ARENA_W, ELIXIR_MAX, MATCH_TICKS, OVERTIME_TICKS, RIVER_Y, TICK_MS } from '../sim/constants'
import { Ladder } from './ladder'
import { type AssetManifest, type SpriteSheetDef } from '../render/AssetManifest'
import { createSpritePool, loadManifestIntoScene, updateUnitSprite, updateTowerSprite } from '../render/SpriteRenderer'
import type { DeployCommand, SimState, UnitEntity, Tower } from '../sim/types'

const TILE = 30
export const GAME_W = ARENA_W * TILE          // 540
export const ARENA_PX_H = ARENA_H * TILE      // 960
const HUD_H = 150
export const GAME_H = ARENA_PX_H + HUD_H      // 1110

// sim y grows upward for player 0; screen y grows downward
const sx = (x: number) => x * TILE
const sy = (y: number) => ARENA_PX_H - y * TILE

export class BattleScene extends Phaser.Scene {
  private sim!: SimState
  private ladder!: Ladder
  private manifest: AssetManifest | null = null
  private gfx!: Phaser.GameObjects.Graphics
  private hudText!: Phaser.GameObjects.Text
  private cardTexts: Phaser.GameObjects.Text[] = []
  private unitSprites = createSpritePool()
  private towerSprites = createSpritePool()
  private acc = 0
  private selectedCard = 0
  private pending: DeployCommand[] = []
  private over = false

  constructor() { super('battle') }

  preload() {
    this.load.json('manifest', '/assets/manifest.json')
  }

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

    // Load manifest + spritesheets once on first boot
    if (!this.manifest) {
      this.manifest = this.cache.json.get('manifest') as AssetManifest
      if (this.manifest) loadManifestIntoScene(this, this.manifest)
      this.load.start()
    }
  }

  private onArenaClick(p: Phaser.Input.Pointer) {
    if (this.over) { this.startMatch(); return }
    if (p.y >= ARENA_PX_H) return
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

    const unitDef = (u: UnitEntity): SpriteSheetDef | null => this.manifest?.units[u.cardId] ?? null
    const towerDef = (t: Tower): SpriteSheetDef | null => this.manifest?.towers[t.kind] ?? null

    // towers
    for (const t of this.sim.towers) {
      if (t.hp <= 0) continue
      const def = towerDef(t)
      if (def) {
        let sprite = this.towerSprites.get(t.id)
        if (!sprite || sprite.texture.key !== def.id) {
          this.towerSprites.remove(t.id)
          sprite = this.add.sprite(0, 0, def.id)
          this.towerSprites.set(t.id, sprite)
        }
        updateTowerSprite(sprite, t, def, sx, sy)
      } else {
        this.drawTowerFallback(g, t)
      }
      this.drawHpBar(g, sx(t.x), sy(t.y) - 28, 40, 6, t.hp, t.maxHp)
    }

    // units
    const seen = new Set<number>()
    for (const u of this.sim.units) {
      seen.add(u.id)
      const def = unitDef(u)
      if (def) {
        let sprite = this.unitSprites.get(u.id)
        if (!sprite || sprite.texture.key !== def.id) {
          this.unitSprites.remove(u.id)
          sprite = this.add.sprite(0, 0, def.id)
          this.unitSprites.set(u.id, sprite)
        }
        updateUnitSprite(sprite, u, def, this.sim.tick, sx, sy)
      } else {
        this.drawUnitFallback(g, u)
      }
      this.drawHpBar(g, sx(u.x) - 10, sy(u.y) - 16, 20, 4, u.hp, u.maxHp)
    }
    // remove stale sprites
    for (const id of this.collectStaleIds(this.unitSprites, seen)) this.unitSprites.remove(id)

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

  private collectStaleIds(pool: ReturnType<typeof createSpritePool>, keep: Set<number>): number[] {
    const stale: number[] = []
    for (const [id] of pool.entries()) {
      if (!keep.has(id)) stale.push(id)
    }
    return stale
  }

  private drawTowerFallback(g: Phaser.GameObjects.Graphics, t: Tower) {
    const size = t.kind === 'king' ? 54 : 42
    g.fillStyle(t.owner === 0 ? 0x2bff88 : 0xff4d5e, t.active ? 1 : 0.45)
    g.fillRect(sx(t.x) - size / 2, sy(t.y) - size / 2, size, size)
  }

  private drawUnitFallback(g: Phaser.GameObjects.Graphics, u: UnitEntity) {
    const r = 7 + Math.min(9, u.maxHp / 160)
    g.fillStyle(u.owner === 0 ? 0x2bff88 : 0xff4d5e, u.revealed ? 1 : 0.35)
    g.fillCircle(sx(u.x), sy(u.y), r)
  }

  private drawHpBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, hp: number, maxHp: number) {
    g.fillStyle(0x000000, 0.6).fillRect(x, y, w, h)
    g.fillStyle(0xffe14d).fillRect(x, y, w * (hp / maxHp), h)
  }
}
