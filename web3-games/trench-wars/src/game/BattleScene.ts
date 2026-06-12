import Phaser from 'phaser'
import { createMatch, step, handOf, validateDeploy } from '../sim/sim'
import { aiCommands } from '../sim/ai'
import { getCard, STARTER_DECK } from '../sim/cards'
import { ARENA_H, ARENA_W, ELIXIR_MAX, MATCH_TICKS, OVERTIME_TICKS, TICK_MS } from '../sim/constants'
import { Ladder } from './ladder'
import { BRAND, hexToCss } from '../render/Brand'
import { VfxManager } from '../render/VfxManager'
import { Battle3D } from '../render3d/Battle3D'
import { fingerprint } from '../sim/replay'
import { submitMatch } from '../api'
import type { DeployCommand, SimState } from '../sim/types'

const TILE = 30
export const GAME_W = ARENA_W * TILE          // 540
export const ARENA_PX_H = ARENA_H * TILE      // 960
const HUD_H = 150
export const GAME_H = ARENA_PX_H + HUD_H      // 1110

// One 3D renderer for the lifetime of the page — survives scene restarts.
let battle3d: Battle3D | null = null

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

  private mode: 'practice' | 'ladder' = 'practice'
  private defenderId?: string
  private attackerDeck: string[] = [...STARTER_DECK]
  private defenderDeck: string[] = [...STARTER_DECK]
  private replayCommands: DeployCommand[] = []
  private matchSeed = 0
  private submitting = false
  private resultTitle?: Phaser.GameObjects.Text
  private resultReason?: Phaser.GameObjects.Text
  private resultHint?: Phaser.GameObjects.Text
  private loadingText?: Phaser.GameObjects.Text
  private vfx!: VfxManager

  constructor() { super('battle') }

  create() {
    this.ladder = new Ladder(window.localStorage)
    this.mode = (this.data.get('mode') as 'practice' | 'ladder' | undefined) || 'practice'
    this.defenderId = this.data.get('defenderId') as string | undefined
    const incomingDefender = this.data.get('defenderDeck') as string[] | undefined
    this.defenderDeck = incomingDefender ? [...incomingDefender] : [...STARTER_DECK]

    if (!battle3d) {
      battle3d = new Battle3D()
      void battle3d.load()
    }
    battle3d.setVisible(true)
    this.game.canvas.style.position = 'relative'
    this.game.canvas.style.zIndex = '1'
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => battle3d?.setVisible(false))

    this.startMatch()
    this.gfx = this.add.graphics()
    this.hudText = this.add.text(8, ARENA_PX_H + 8, '', {
      fontFamily: BRAND.fonts.body,
      fontSize: '17px',
      color: BRAND.colors.text,
    })
    this.loadingText = this.add.text(GAME_W / 2, ARENA_PX_H / 2, 'RAISING THE BATTLEFIELD…', {
      fontFamily: BRAND.fonts.header,
      fontSize: '22px',
      color: BRAND.colors.text,
    }).setOrigin(0.5)
    for (let i = 0; i < 4; i++) {
      const t = this.add.text(12 + i * 134, ARENA_PX_H + 66, '', {
        fontFamily: BRAND.fonts.body,
        fontSize: '14px',
        color: BRAND.colors.text,
        backgroundColor: hexToCss(BRAND.colors.panel),
        padding: { x: 8, y: 12 },
        fixedWidth: 124,
        align: 'center',
      }).setInteractive()
      t.on('pointerdown', () => { this.selectedCard = i })
      this.cardTexts.push(t)
    }
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onArenaClick(p))
    this.vfx = new VfxManager(this, (x, y) => battle3d!.project(x, y, 0.4))
    ;(window as any).__TRENCH_READY__ = true
  }

  private startMatch() {
    this.matchSeed = Date.now() >>> 0
    this.attackerDeck = [...STARTER_DECK]
    this.sim = createMatch(this.matchSeed, [[...this.attackerDeck], [...this.defenderDeck]])
    this.replayCommands = []
    this.acc = 0
    this.pending = []
    this.over = false
    this.submitting = false
    if (this.resultTitle && this.resultReason && this.resultHint) {
      ;[this.resultTitle, this.resultReason, this.resultHint].forEach((t) => t.setVisible(false))
    }
  }

  private onArenaClick(p: Phaser.Input.Pointer) {
    if (this.over) { this.startMatch(); return }
    if (p.y >= ARENA_PX_H || !battle3d?.ready) return
    const tile = battle3d.screenToSim(p.x, p.y)
    if (!tile) return
    const hand = handOf(this.sim, 0)
    const cmd: DeployCommand = {
      tick: this.sim.tick,
      player: 0,
      cardId: hand[this.selectedCard],
      x: tile.x,
      y: tile.y,
    }
    if (validateDeploy(this.sim, cmd)) this.pending.push(cmd)
  }

  update(_time: number, delta: number) {
    if (!battle3d) return
    battle3d.syncLayout(this.game.canvas, GAME_H)
    if (!battle3d.ready) {
      this.draw()
      return
    }
    this.loadingText?.setVisible(false)

    if (!this.over) {
      this.acc += delta
      while (this.acc >= TICK_MS && !this.sim.result) {
        const cmds = [...this.pending, ...aiCommands(this.sim, 1, this.ladder.currentLevel())]
        this.pending = []
        for (const c of cmds) c.tick = this.sim.tick
        this.replayCommands.push(...cmds)
        const prev = this.sim
        this.sim = step(this.sim, cmds)
        this.detectVfx(prev, this.sim, cmds)
        this.acc -= TICK_MS
      }
      if (this.sim.result && !this.over) {
        this.over = true
        if (this.sim.result.winner === 0) this.ladder.recordWin()
        else if (this.sim.result.winner === 1) this.ladder.recordLoss()
        if (this.mode === 'ladder' && this.defenderId) {
          void this.submitReplay()
        }
      }
    }
    battle3d.sync(this.sim)
    battle3d.render(delta)
    this.vfx.update(delta)
    this.draw()
  }

  private draw() {
    const g = this.gfx
    g.clear()

    if (battle3d?.ready) {
      // health bars projected over the 3D scene
      for (const t of this.sim.towers) {
        if (t.hp <= 0) continue
        const p = battle3d.project(t.x, t.y, t.kind === 'king' ? 4.4 : 3.4)
        this.drawHpBar(g, p.x - 22, p.y, 44, 7, t.hp, t.maxHp, t.owner === 0)
      }
      for (const u of this.sim.units) {
        if (!u.revealed && u.owner === 1) continue
        const p = battle3d.project(u.x, u.y, 3.1)
        this.drawHpBar(g, p.x - 10, p.y, 20, 5, u.hp, u.maxHp, u.owner === 0)
      }
    }

    this.vfx.draw()
    this.drawHud(g)
    if (this.over) this.drawResultOverlay(g)
  }

  private drawHud(g: Phaser.GameObjects.Graphics) {
    // HUD panel
    g.fillStyle(BRAND.colors.panel, 1).fillRoundedRect(0, ARENA_PX_H, GAME_W, HUD_H, 0)
    g.lineStyle(2, BRAND.colors.panelBorder, 1)
    g.strokeRoundedRect(0, ARENA_PX_H, GAME_W, HUD_H, 0)

    // elixir bar track
    const barX = 12
    const barY = ARENA_PX_H + 36
    const barW = GAME_W - 24
    const barH = 16
    g.fillStyle(BRAND.colors.panelLight, 1).fillRoundedRect(barX, barY, barW, barH, 8)
    const pct = Math.max(0, Math.min(1, this.sim.elixir[0] / ELIXIR_MAX))
    g.fillStyle(BRAND.colors.elixir, 1).fillRoundedRect(barX, barY, barW * pct, barH, 8)
    g.lineStyle(2, BRAND.colors.elixirDark, 1)
    g.strokeRoundedRect(barX, barY, barW, barH, 8)

    // crowns
    const crowns = this.crownsTaken()
    const crownY = ARENA_PX_H + 10
    for (let i = 0; i < 3; i++) {
      const filled = i < crowns
      g.fillStyle(filled ? BRAND.colors.primary : BRAND.colors.panelBorder, 1)
      this.drawCrown(g, 14 + i * 20, crownY, 8)
    }

    const remaining = Math.max(0, (this.sim.overtime ? MATCH_TICKS + OVERTIME_TICKS : MATCH_TICKS) - this.sim.tick)
    const secs = Math.ceil(remaining / 10)
    const level = this.ladder.currentLevel()
    const timeText = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
    this.hudText.setText(
      this.over
        ? ''
        : `${this.mode === 'ladder' ? 'RANKED' : level.name}  •  ${timeText}  •  ELIXIR ${Math.floor(this.sim.elixir[0])}/${ELIXIR_MAX}`,
    )

    const hand = handOf(this.sim, 0)
    hand.forEach((id, i) => {
      const c = getCard(id)
      const canAfford = this.sim.elixir[0] >= c.cost
      const selected = i === this.selectedCard
      this.cardTexts[i]
        .setText(`${c.name.toUpperCase()}\n${c.cost} ELIXIR`)
        .setBackgroundColor(hexToCss(selected ? BRAND.colors.primaryDark : BRAND.colors.panel))
        .setColor(canAfford ? (selected ? hexToCss(BRAND.colors.bg) : BRAND.colors.text) : BRAND.colors.textDark)
        .setAlpha(canAfford ? 1 : 0.5)
    })
  }

  private drawResultOverlay(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(BRAND.colors.bg, 0.82).fillRect(0, 0, GAME_W, ARENA_PX_H)

    const panelW = 360
    const panelH = 180
    const x = (GAME_W - panelW) / 2
    const y = (ARENA_PX_H - panelH) / 2

    g.fillStyle(BRAND.colors.panel, 0.95).fillRoundedRect(x, y, panelW, panelH, 16)
    g.lineStyle(3, BRAND.colors.primary, 1)
    g.strokeRoundedRect(x, y, panelW, panelH, 16)

    const isWin = this.sim.result!.winner === 0
    const isLoss = this.sim.result!.winner === 1
    const title = isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : 'DRAW'
    const color = isWin ? BRAND.colors.attacker : isLoss ? BRAND.colors.defender : BRAND.colors.primary

    if (!this.resultTitle) {
      this.resultTitle = this.add.text(GAME_W / 2, y + 48, title, {
        fontFamily: BRAND.fonts.header,
        fontSize: '42px',
        color: hexToCss(color),
        fontStyle: '900',
      }).setOrigin(0.5)
      this.resultReason = this.add.text(GAME_W / 2, y + 96, '', {
        fontFamily: BRAND.fonts.body,
        fontSize: '20px',
        color: BRAND.colors.text,
      }).setOrigin(0.5)
      this.resultHint = this.add.text(GAME_W / 2, y + 138, 'click arena to play again', {
        fontFamily: BRAND.fonts.body,
        fontSize: '15px',
        color: BRAND.colors.textMuted,
      }).setOrigin(0.5)
    }
    this.resultTitle!.setText(title).setColor(hexToCss(color))
    this.resultReason!.setText(`by ${this.sim.result!.reason.toUpperCase()}`)
    ;[this.resultTitle!, this.resultReason!, this.resultHint!].forEach((t) => t.setVisible(true))
  }

  private crownsTaken(): number {
    return this.sim.towers.filter((t) => t.owner === 1 && t.hp <= 0).length
  }

  private drawCrown(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number) {
    g.beginPath()
    g.moveTo(cx - r, cy + r)
    g.lineTo(cx - r, cy - r / 2)
    g.lineTo(cx - r / 2, cy)
    g.lineTo(cx, cy - r)
    g.lineTo(cx + r / 2, cy)
    g.lineTo(cx + r, cy - r / 2)
    g.lineTo(cx + r, cy + r)
    g.closePath()
    g.fillPath()
  }

  private async submitReplay() {
    if (this.submitting || !this.defenderId) return
    this.submitting = true
    try {
      const result = await submitMatch({
        seed: this.matchSeed,
        attackerDeck: this.attackerDeck,
        defenderId: this.defenderId,
        commands: this.replayCommands,
        claimedWinner: this.sim.result?.winner ?? null,
        fingerprint: fingerprint(this.sim),
      })
      console.log('[trench] replay submitted', result)
    } catch (err) {
      console.error('[trench] replay submit failed', err)
    }
  }

  private drawHpBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, hp: number, maxHp: number, friendly: boolean) {
    g.fillStyle(BRAND.colors.bg, 0.65).fillRect(x, y, w, h)
    g.fillStyle(friendly ? 0x3aa0ff : 0xff4a4a, 1).fillRect(x, y, w * (hp / maxHp), h)
  }

  private detectVfx(prev: SimState, next: SimState, cmds: DeployCommand[]) {
    for (const cmd of cmds) {
      const card = getCard(cmd.cardId)
      if (card.type === 'unit') {
        this.vfx.deploy(cmd.x, cmd.y)
      } else {
        this.vfx.spellRing(cmd.x, cmd.y, card.effectRadius || 3)
      }
    }

    const prevUnits = new Map(prev.units.map((u) => [u.id, u]))
    const nextUnits = new Map(next.units.map((u) => [u.id, u]))
    for (const [id, u] of nextUnits) {
      const p = prevUnits.get(id)
      if (p && u.hp < p.hp) {
        this.vfx.hit(u.x, u.y, u.owner === 0 ? BRAND.colors.defender : BRAND.colors.attacker)
      }
    }
    for (const [id, u] of prevUnits) {
      if (!nextUnits.has(id) && u.hp > 0) {
        this.vfx.explosion(u.x, u.y, u.owner === 0 ? BRAND.colors.attacker : BRAND.colors.defender)
      }
    }

    for (let i = 0; i < prev.towers.length; i++) {
      const p = prev.towers[i]
      const n = next.towers[i]
      if (n.hp < p.hp) {
        this.vfx.hit(n.x, n.y, n.owner === 0 ? BRAND.colors.defender : BRAND.colors.attacker)
      }
      if (p.hp > 0 && n.hp <= 0) {
        this.vfx.explosion(n.x, n.y, n.owner === 0 ? BRAND.colors.attacker : BRAND.colors.defender)
      }
    }
  }
}
