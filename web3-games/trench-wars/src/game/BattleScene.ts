import Phaser from 'phaser'
import { createMatch, step, handOf, validateDeploy } from '../sim/sim'
import { aiCommands } from '../sim/ai'
import { getCard, STARTER_DECK } from '../sim/cards'
import { ARENA_H, ARENA_W, ELIXIR_MAX, HAND_SIZE, MATCH_TICKS, OVERTIME_TICKS, TICK_MS } from '../sim/constants'
import { Ladder } from './ladder'
import { BRAND, hexToCss } from '../render/Brand'
import { VfxManager } from '../render/VfxManager'
import { Battle3D, CARD_CHAR } from '../render3d/Battle3D'
import { fingerprint } from '../sim/replay'
import { submitMatch } from '../api'
import type { DeployCommand, SimState } from '../sim/types'

const TILE = 30
export const GAME_W = ARENA_W * TILE          // 540
export const ARENA_PX_H = ARENA_H * TILE      // 960
const HUD_H = 150
export const GAME_H = ARENA_PX_H + HUD_H      // 1110

const CARD_W = 126
const CARD_H = 82
const CARD_Y = ARENA_PX_H + 60

// One 3D renderer for the lifetime of the page — survives scene restarts.
let battle3d: Battle3D | null = null

interface CardSlot {
  bg: Phaser.GameObjects.Rectangle
  portrait: Phaser.GameObjects.Image
  glyph: Phaser.GameObjects.Text
  name: Phaser.GameObjects.Text
  costBg: Phaser.GameObjects.Arc
  cost: Phaser.GameObjects.Text
}

export class BattleScene extends Phaser.Scene {
  private sim!: SimState
  private ladder!: Ladder
  private gfx!: Phaser.GameObjects.Graphics
  private hudText!: Phaser.GameObjects.Text
  private elixirText!: Phaser.GameObjects.Text
  private nextLabel!: Phaser.GameObjects.Text
  private nextPortrait!: Phaser.GameObjects.Image
  private cardSlots: CardSlot[] = []
  private acc = 0
  private selectedCard = 0
  private dragIndex: number | null = null
  private pending: DeployCommand[] = []
  private over = false
  private muteText!: Phaser.GameObjects.Text
  private elixirShown = 0
  private lastHitSfx = 0

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

  preload() {
    this.load.image('portrait-vanguard', '/assets/3d/portraits/vanguard.png')
    this.load.image('portrait-explorer', '/assets/3d/portraits/explorer.png')
    this.load.image('portrait-crimson', '/assets/3d/portraits/crimson.png')
    // audio is optional — missing files just emit loaderror and the game stays silent
    for (const key of ['deploy', 'hit', 'shoot', 'explosion', 'tower-down', 'elixir', 'victory', 'defeat', 'battle-loop']) {
      this.load.audio(key, `/assets/audio/${key}.mp3`)
    }
    this.load.on('loaderror', () => {}) // swallow 404s for optional audio
  }

  /** Play a sound only if its file actually loaded. */
  private sfx(key: string, volume = 0.5) {
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume })
  }

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
    this.elixirText = this.add.text(GAME_W - 14, ARENA_PX_H + 35, '', {
      fontFamily: BRAND.fonts.header,
      fontSize: '15px',
      color: hexToCss(BRAND.colors.elixir),
      fontStyle: '700',
    }).setOrigin(1, 0)
    this.nextLabel = this.add.text(GAME_W - 90, ARENA_PX_H + 10, 'NEXT', {
      fontFamily: BRAND.fonts.body,
      fontSize: '11px',
      color: BRAND.colors.textMuted,
    })
    this.nextPortrait = this.add.image(GAME_W - 40, ARENA_PX_H + 17, 'portrait-vanguard')
      .setDisplaySize(26, 26)
    this.loadingText = this.add.text(GAME_W / 2, ARENA_PX_H / 2, 'RAISING THE BATTLEFIELD…', {
      fontFamily: BRAND.fonts.header,
      fontSize: '22px',
      color: BRAND.colors.text,
    }).setOrigin(0.5)

    this.buildCardSlots()

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onArenaClick(p))
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onDragMove(p))
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onDragEnd(p))
    this.vfx = new VfxManager(this, (x, y) => battle3d!.project(x, y, 0.4))
    battle3d.onProjectile = () => this.sfx('shoot', 0.25)

    // sound toggle — floats top-right over the arena
    this.sound.mute = window.localStorage.getItem('tw-muted') === '1'
    this.muteText = this.add.text(GAME_W - 10, 10, this.sound.mute ? 'SOUND OFF' : 'SOUND ON', {
      fontFamily: BRAND.fonts.body,
      fontSize: '13px',
      color: BRAND.colors.textMuted,
      backgroundColor: hexToCss(BRAND.colors.panel),
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setDepth(50)
    if (this.cache.audio.exists('battle-loop') && !this.sound.get('battle-loop')) {
      this.sound.play('battle-loop', { loop: true, volume: 0.3 })
    }
    ;(window as any).__TRENCH_READY__ = true
  }

  private toggleMute() {
    this.sound.mute = !this.sound.mute
    window.localStorage.setItem('tw-muted', this.sound.mute ? '1' : '0')
    this.muteText.setText(this.sound.mute ? 'SOUND OFF' : 'SOUND ON')
  }

  private inMuteButton(p: Phaser.Input.Pointer): boolean {
    return p.x > GAME_W - 110 && p.y < 36
  }

  private buildCardSlots() {
    for (let i = 0; i < HAND_SIZE; i++) {
      const x = 8 + i * (CARD_W + 8) + CARD_W / 2
      const y = CARD_Y + CARD_H / 2
      const bg = this.add.rectangle(x, y, CARD_W, CARD_H, BRAND.colors.panelLight)
        .setStrokeStyle(2, BRAND.colors.panelBorder)
        .setInteractive()
      const portrait = this.add.image(x - CARD_W / 2 + 30, y, 'portrait-vanguard')
        .setDisplaySize(48, 58)
      const glyph = this.add.text(x - CARD_W / 2 + 30, y, '✦', {
        fontFamily: BRAND.fonts.header,
        fontSize: '34px',
        color: hexToCss(BRAND.colors.elixir),
      }).setOrigin(0.5).setVisible(false)
      const name = this.add.text(x + 6, y - 8, '', {
        fontFamily: BRAND.fonts.body,
        fontSize: '12px',
        color: BRAND.colors.text,
        fontStyle: '700',
        wordWrap: { width: 62 },
        align: 'center',
      }).setOrigin(0.5)
      const costBg = this.add.circle(x - CARD_W / 2 + 14, y - CARD_H / 2 + 14, 11, BRAND.colors.elixir)
        .setStrokeStyle(2, BRAND.colors.elixirDark)
      const cost = this.add.text(costBg.x, costBg.y, '', {
        fontFamily: BRAND.fonts.header,
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: '900',
      }).setOrigin(0.5)

      bg.on('pointerdown', () => {
        this.selectedCard = i
        this.dragIndex = i
      })
      this.cardSlots.push({ bg, portrait, glyph, name, costBg, cost })
    }
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

  private deployAt(px: number, py: number): boolean {
    if (!battle3d?.ready) return false
    const tile = battle3d.screenToSim(px, py)
    if (!tile) return false
    const hand = handOf(this.sim, 0)
    const cmd: DeployCommand = {
      tick: this.sim.tick,
      player: 0,
      cardId: hand[this.selectedCard],
      x: tile.x,
      y: tile.y,
    }
    if (!validateDeploy(this.sim, cmd)) return false
    this.pending.push(cmd)
    return true
  }

  private onArenaClick(p: Phaser.Input.Pointer) {
    if (this.inMuteButton(p)) { this.toggleMute(); return }
    if (this.over) { this.startMatch(); return }
    if (p.y >= ARENA_PX_H) return
    this.deployAt(p.x, p.y)
  }

  private onDragMove(p: Phaser.Input.Pointer) {
    if (this.dragIndex === null || !battle3d?.ready || this.over) return
    if (p.y >= ARENA_PX_H) { battle3d.hideDeployPreview(); return }
    const tile = battle3d.screenToSim(p.x, p.y)
    if (!tile) { battle3d.hideDeployPreview(); return }
    const hand = handOf(this.sim, 0)
    const cmd: DeployCommand = { tick: this.sim.tick, player: 0, cardId: hand[this.dragIndex], x: tile.x, y: tile.y }
    battle3d.showDeployPreview(tile.x, tile.y, validateDeploy(this.sim, cmd))
  }

  private onDragEnd(p: Phaser.Input.Pointer) {
    if (this.dragIndex === null) return
    const wasDraggedToArena = p.y < ARENA_PX_H
    if (wasDraggedToArena && !this.over) {
      this.selectedCard = this.dragIndex
      this.deployAt(p.x, p.y)
    }
    this.dragIndex = null
    battle3d?.hideDeployPreview()
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
        if (this.sim.result.winner === 0) { this.ladder.recordWin(); this.sfx('victory', 0.7) }
        else if (this.sim.result.winner === 1) { this.ladder.recordLoss(); this.sfx('defeat', 0.7) }
        if (this.mode === 'ladder' && this.defenderId) {
          void this.submitReplay()
        }
      }
    }
    // smooth elixir bar toward the sim value
    this.elixirShown += (this.sim.elixir[0] - this.elixirShown) * Math.min(1, (delta / 1000) * 10)
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

    // elixir bar: track + fill + 10 segment ticks
    const barX = 12
    const barY = ARENA_PX_H + 38
    const barW = GAME_W - 70
    const barH = 14
    g.fillStyle(BRAND.colors.panelLight, 1).fillRoundedRect(barX, barY, barW, barH, 7)
    const pct = Math.max(0, Math.min(1, this.elixirShown / ELIXIR_MAX))
    g.fillStyle(BRAND.colors.elixir, 1).fillRoundedRect(barX, barY, barW * pct, barH, 7)
    const full = this.sim.elixir[0] >= ELIXIR_MAX
    const pulse = full ? 0.6 + 0.4 * Math.sin(this.time.now / 120) : 1
    g.lineStyle(full ? 3 : 2, full ? BRAND.colors.primary : BRAND.colors.elixirDark, pulse)
    g.strokeRoundedRect(barX, barY, barW, barH, 7)
    for (let i = 1; i < ELIXIR_MAX; i++) {
      const tx = barX + (barW / ELIXIR_MAX) * i
      g.lineStyle(1, BRAND.colors.panel, 0.8)
      g.lineBetween(tx, barY + 2, tx, barY + barH - 2)
    }
    this.elixirText.setText(`${Math.floor(this.sim.elixir[0])}`)

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
    this.hudText.setX(78).setText(
      this.over
        ? ''
        : `${this.mode === 'ladder' ? 'RANKED' : level.name}  •  ${timeText}`,
    )

    // hand
    const hand = handOf(this.sim, 0)
    hand.forEach((id, i) => this.updateCardSlot(i, id))

    // next card from the deck queue
    const nextId = this.sim.decks[0][HAND_SIZE]
    if (nextId) {
      const charName = CARD_CHAR[nextId]
      this.nextPortrait.setVisible(!!charName)
      if (charName) this.nextPortrait.setTexture(`portrait-${charName}`).setDisplaySize(26, 26)
      this.nextLabel.setText(`NEXT: ${getCard(nextId).name.toUpperCase().slice(0, 14)}`).setX(GAME_W - 200)
    }
  }

  private updateCardSlot(i: number, cardId: string) {
    const slot = this.cardSlots[i]
    const c = getCard(cardId)
    const canAfford = this.sim.elixir[0] >= c.cost
    const selected = i === this.selectedCard
    const charName = CARD_CHAR[cardId]

    slot.bg.setFillStyle(selected ? BRAND.colors.primaryDark : BRAND.colors.panelLight)
    slot.bg.setStrokeStyle(selected ? 3 : 2, selected ? BRAND.colors.primary : BRAND.colors.panelBorder)
    if (charName) {
      slot.portrait.setTexture(`portrait-${charName}`).setDisplaySize(48, 58).setVisible(true)
      slot.glyph.setVisible(false)
    } else {
      slot.portrait.setVisible(false)
      slot.glyph.setVisible(true)
    }
    slot.name.setText(c.name.toUpperCase())
    slot.cost.setText(`${c.cost}`)
    const alpha = canAfford ? 1 : 0.45
    ;[slot.bg, slot.portrait, slot.glyph, slot.name, slot.costBg, slot.cost].forEach((o) => o.setAlpha(alpha))
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
      if (cmd.player === 0) this.sfx('deploy', 0.5)
    }

    const prevUnits = new Map(prev.units.map((u) => [u.id, u]))
    const nextUnits = new Map(next.units.map((u) => [u.id, u]))
    for (const [id, u] of nextUnits) {
      const p = prevUnits.get(id)
      if (p && u.hp < p.hp) {
        this.vfx.hit(u.x, u.y, u.owner === 0 ? BRAND.colors.defender : BRAND.colors.attacker)
        if (this.time.now - this.lastHitSfx > 90) {
          this.lastHitSfx = this.time.now
          this.sfx('hit', 0.15)
        }
      }
    }
    for (const [id, u] of prevUnits) {
      if (!nextUnits.has(id) && u.hp > 0) {
        this.vfx.explosion(u.x, u.y, u.owner === 0 ? BRAND.colors.attacker : BRAND.colors.defender)
        this.sfx('explosion', 0.3)
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
        this.sfx('tower-down', 0.8)
        battle3d?.shake(p.kind === 'king' ? 1.3 : 0.7)
      }
    }
  }
}
