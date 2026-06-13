import { createMatch, step, handOf, validateDeploy } from '../sim/sim'
import { aiCommands } from '../sim/ai'
import { getCard, STARTER_DECK } from '../sim/cards'
import { ELIXIR_MAX, HAND_SIZE, MATCH_TICKS, OVERTIME_TICKS, TICK_MS } from '../sim/constants'
import { Ladder } from './ladder'
import { BRAND } from '../render/Brand'
import { Vfx2D } from '../render/Vfx2D'
import { AudioBus } from '../render/AudioBus'
import { Battle3D } from '../render3d/Battle3D'
import { fingerprint } from '../sim/replay'
import { submitMatch } from '../api'
import type { DeployCommand, SimState, MatchResult } from '../sim/types'

export const ARENA_W_PX = 540
export const ARENA_H_PX = 960

export interface BattleSnapshot {
  ready: boolean
  hand: string[]
  next: string | null
  elixir: number
  selected: number
  timeText: string
  crowns: number
  levelName: string
  mode: 'practice' | 'ladder'
  result: MatchResult | null
  muted: boolean
}

export interface BattleOptions {
  mode: 'practice' | 'ladder'
  defenderId?: string
  defenderDeck?: string[]
  stage: HTMLElement            // positioned container for the 3D canvas
  overlay: HTMLCanvasElement    // 2D overlay for hp bars + vfx
  onSnapshot: (s: BattleSnapshot) => void
}

// One renderer + one audio bus for the lifetime of the page.
let battle3d: Battle3D | null = null
let audio: AudioBus | null = null

export class BattleController {
  private sim!: SimState
  private ladder = new Ladder(window.localStorage)
  private vfx: Vfx2D
  private opts: BattleOptions
  private raf = 0
  private lastTime = 0
  private acc = 0
  private over = false
  private pending: DeployCommand[] = []
  private replayCommands: DeployCommand[] = []
  private matchSeed = 0
  private attackerDeck: string[] = [...STARTER_DECK]
  private defenderDeck: string[]
  private submitting = false
  private lastHitSfx = 0
  selected = 0
  private dragIndex: number | null = null
  private disposed = false

  constructor(opts: BattleOptions) {
    this.opts = opts
    this.defenderDeck = opts.defenderDeck ? [...opts.defenderDeck] : [...STARTER_DECK]
    if (!battle3d) {
      battle3d = new Battle3D()
      void battle3d.load()
    }
    if (!audio) audio = new AudioBus()
    battle3d.attach(opts.stage)
    battle3d.onProjectile = () => audio!.play('shoot', 0.25)
    this.vfx = new Vfx2D((x, y) => battle3d!.project(x, y, 0.4))
    this.startMatch()
    audio.startMusic()
    this.lastTime = performance.now()
    this.raf = requestAnimationFrame(this.loop)

    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
  }

  private startMatch() {
    this.matchSeed = Date.now() >>> 0
    this.attackerDeck = [...STARTER_DECK]
    this.sim = createMatch(this.matchSeed, [[...this.attackerDeck], [...this.defenderDeck]])
    this.replayCommands = []
    this.pending = []
    this.acc = 0
    this.over = false
    this.submitting = false
  }

  restart() {
    if (this.over) this.startMatch()
  }

  /** Stage-relative pointer position → game pixels (540×960 space). */
  private toGamePx(clientX: number, clientY: number): { x: number; y: number } {
    const r = this.opts.stage.getBoundingClientRect()
    return {
      x: ((clientX - r.left) / r.width) * ARENA_W_PX,
      y: ((clientY - r.top) / r.height) * ARENA_H_PX,
    }
  }

  deployAtClient(clientX: number, clientY: number): boolean {
    if (!battle3d?.ready || this.over) return false
    const p = this.toGamePx(clientX, clientY)
    const tile = battle3d.screenToSim(p.x, p.y)
    if (!tile) return false
    const hand = handOf(this.sim, 0)
    const cmd: DeployCommand = { tick: this.sim.tick, player: 0, cardId: hand[this.selected], x: tile.x, y: tile.y }
    if (!validateDeploy(this.sim, cmd)) return false
    this.pending.push(cmd)
    return true
  }

  selectCard(i: number) {
    this.selected = i
    this.emit()
  }

  beginDrag(i: number) {
    this.selected = i
    this.dragIndex = i
    this.emit()
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.dragIndex === null || !battle3d?.ready || this.over) return
    const r = this.opts.stage.getBoundingClientRect()
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    if (!inside) { battle3d.hideDeployPreview(); return }
    const p = this.toGamePx(e.clientX, e.clientY)
    const tile = battle3d.screenToSim(p.x, p.y)
    if (!tile) { battle3d.hideDeployPreview(); return }
    const hand = handOf(this.sim, 0)
    const cmd: DeployCommand = { tick: this.sim.tick, player: 0, cardId: hand[this.dragIndex], x: tile.x, y: tile.y }
    battle3d.showDeployPreview(tile.x, tile.y, validateDeploy(this.sim, cmd))
  }

  private onPointerUp = (e: PointerEvent) => {
    if (this.dragIndex === null) return
    const r = this.opts.stage.getBoundingClientRect()
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    if (inside && !this.over) this.deployAtClient(e.clientX, e.clientY)
    this.dragIndex = null
    battle3d?.hideDeployPreview()
  }

  onStageClick(clientX: number, clientY: number) {
    if (this.over) { this.restart(); return }
    this.deployAtClient(clientX, clientY)
  }

  toggleMute(): boolean {
    return audio!.toggleMute()
  }

  private loop = (now: number) => {
    if (this.disposed) return
    const delta = Math.min(100, now - this.lastTime)
    this.lastTime = now

    if (battle3d?.ready) {
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
          if (this.sim.result.winner === 0) { this.ladder.recordWin(); audio!.play('victory', 0.7) }
          else if (this.sim.result.winner === 1) { this.ladder.recordLoss(); audio!.play('defeat', 0.7) }
          if (this.opts.mode === 'ladder' && this.opts.defenderId) void this.submitReplay()
        }
      }
      battle3d.sync(this.sim)
      battle3d.render(delta)
      this.vfx.update(delta)
      this.drawOverlay()
    }
    this.emit()
    this.raf = requestAnimationFrame(this.loop)
  }

  private drawOverlay() {
    const canvas = this.opts.overlay
    const dpr = Math.min(window.devicePixelRatio, 2)
    if (canvas.width !== ARENA_W_PX * dpr) {
      canvas.width = ARENA_W_PX * dpr
      canvas.height = ARENA_H_PX * dpr
    }
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, ARENA_W_PX, ARENA_H_PX)

    const hpBar = (x: number, y: number, w: number, h: number, hp: number, maxHp: number, friendly: boolean) => {
      ctx.fillStyle = 'rgba(10,14,20,0.65)'
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = friendly ? '#3aa0ff' : '#ff4a4a'
      ctx.fillRect(x, y, w * (hp / maxHp), h)
    }
    for (const t of this.sim.towers) {
      if (t.hp <= 0) continue
      const p = battle3d!.project(t.x, t.y, t.kind === 'king' ? 4.4 : 3.4)
      hpBar(p.x - 22, p.y, 44, 7, t.hp, t.maxHp, t.owner === 0)
    }
    for (const u of this.sim.units) {
      if (!u.revealed && u.owner === 1) continue
      const p = battle3d!.project(u.x, u.y, 3.1)
      hpBar(p.x - 10, p.y, 20, 5, u.hp, u.maxHp, u.owner === 0)
    }
    this.vfx.draw(ctx)
  }

  private lastSnapshotJson = ''
  private emit() {
    const remaining = Math.max(0, (this.sim.overtime ? MATCH_TICKS + OVERTIME_TICKS : MATCH_TICKS) - this.sim.tick)
    const secs = Math.ceil(remaining / 10)
    const s: BattleSnapshot = {
      ready: !!battle3d?.ready,
      hand: handOf(this.sim, 0),
      next: this.sim.decks[0][HAND_SIZE] ?? null,
      elixir: this.sim.elixir[0],
      selected: this.selected,
      timeText: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`,
      crowns: this.sim.towers.filter((t) => t.owner === 1 && t.hp <= 0).length,
      levelName: this.ladder.currentLevel().name,
      mode: this.opts.mode,
      result: this.sim.result,
      muted: audio!.muted,
    }
    const json = JSON.stringify(s)
    if (json !== this.lastSnapshotJson) {
      this.lastSnapshotJson = json
      this.opts.onSnapshot(s)
    }
  }

  private detectVfx(prev: SimState, next: SimState, cmds: DeployCommand[]) {
    for (const cmd of cmds) {
      const card = getCard(cmd.cardId)
      if (card.type === 'unit') {
        this.vfx.deploy(cmd.x, cmd.y)
      } else {
        // spell-specific visuals
        if (card.id === 'liquidation-cascade') {
          battle3d?.meteor(cmd.x, cmd.y)
          this.vfx.spellRing(cmd.x, cmd.y, card.effectRadius || 3, BRAND.colors.defender)
          battle3d?.shake(0.8)
          audio!.play('explosion', 0.5)
        } else if (card.id === 'gas-war') {
          this.vfx.explosion(cmd.x, cmd.y, 0x6fae3d)
          this.vfx.spellRing(cmd.x, cmd.y, card.effectRadius || 2, 0x8fd44d)
        } else if (card.effectHeal) {
          this.vfx.spellRing(cmd.x, cmd.y, card.effectRadius || 3, BRAND.colors.attacker)
        } else {
          this.vfx.spellRing(cmd.x, cmd.y, card.effectRadius || 3)
        }
      }
      if (cmd.player === 0) audio!.play('deploy', 0.5)
    }

    const prevUnits = new Map(prev.units.map((u) => [u.id, u]))
    const nextUnits = new Map(next.units.map((u) => [u.id, u]))
    for (const [id, u] of nextUnits) {
      const p = prevUnits.get(id)
      if (!p) continue
      const delta = Math.round(p.hp - u.hp)
      const isBuilding = !!getCard(u.cardId).building
      if (u.hp < p.hp && delta >= 8) {
        this.vfx.hit(u.x, u.y, u.owner === 0 ? BRAND.colors.defender : BRAND.colors.attacker)
        // friendly took damage = red; enemy took damage = yellow
        this.vfx.damageNumber(u.x, u.y, delta, u.owner === 0 ? 0xff5a6a : 0xffd23f, delta >= 120)
        const now = performance.now()
        if (now - this.lastHitSfx > 90) { this.lastHitSfx = now; audio!.play('hit', 0.15) }
      } else if (u.hp > p.hp && !isBuilding) {
        this.vfx.healNumber(u.x, u.y, Math.round(u.hp - p.hp))
      }
    }
    for (const [id, u] of prevUnits) {
      if (!nextUnits.has(id) && u.hp > 0) {
        this.vfx.explosion(u.x, u.y, u.owner === 0 ? BRAND.colors.attacker : BRAND.colors.defender)
        audio!.play('explosion', 0.3)
      }
    }

    for (let i = 0; i < prev.towers.length; i++) {
      const p = prev.towers[i]
      const n = next.towers[i]
      const delta = Math.round(p.hp - n.hp)
      if (n.hp < p.hp) {
        this.vfx.hit(n.x, n.y, n.owner === 0 ? BRAND.colors.defender : BRAND.colors.attacker)
        if (delta >= 8) this.vfx.damageNumber(n.x, n.y, delta, n.owner === 0 ? 0xff5a6a : 0xffd23f, true)
      }
      if (p.hp > 0 && n.hp <= 0) {
        this.vfx.explosion(n.x, n.y, n.owner === 0 ? BRAND.colors.attacker : BRAND.colors.defender)
        audio!.play('tower-down', 0.8)
        battle3d?.shake(p.kind === 'king' ? 1.3 : 0.7)
      }
    }
  }

  private async submitReplay() {
    if (this.submitting || !this.opts.defenderId) return
    this.submitting = true
    try {
      const result = await submitMatch({
        seed: this.matchSeed,
        attackerDeck: this.attackerDeck,
        defenderId: this.opts.defenderId,
        commands: this.replayCommands,
        claimedWinner: this.sim.result?.winner ?? null,
        fingerprint: fingerprint(this.sim),
      })
      console.log('[trench] replay submitted', result)
    } catch (err) {
      console.error('[trench] replay submit failed', err)
    }
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    audio?.stopMusic()
    battle3d?.hideDeployPreview()
    battle3d?.detach()
  }
}

export { ELIXIR_MAX }
