import { buildTrack, TrackDef } from './sim/track'
import { MOONACO } from './tracks/moonaco'
import { createScene } from './render/scene'
import { buildTrackMeshes, buildItemBoxMeshes } from './render/trackMesh'
import { buildPlaceholderKart, bindKartVisual, updateKartVisual, KartVisual } from './render/kartVisual'
import { KeyboardInput } from './game/input'
import { Hud } from './game/hud'
import { startLoop, snapshot, Snapshot, updateChaseCamera } from './game/loop'
import { createQuickRace, stepQuickRace, QuickRace } from './game/quickRace'
import { createTimeTrial, stepTimeTrial, submitTimeTrial, loadGhost, TimeTrial } from './game/timeTrial'
import { rankByProgress } from './sim/rubberband'
import { CARS } from './data/cars'

type Mode = { type: 'quick'; qr: QuickRace } | { type: 'tt'; tt: TimeTrial }

const app = document.getElementById('app')!
const ctx = createScene(app)
const track = buildTrack(MOONACO)
ctx.scene.add(buildTrackMeshes(track))

const itemBoxMeshes = buildItemBoxMeshes(track)
for (const m of itemBoxMeshes) ctx.scene.add(m)

const input = new KeyboardInput()
const hud = new Hud()

let mode: Mode = { type: 'quick', qr: createQuickRace(track, 6) }
let visuals: KartVisual[] = []
let lastInput = input.read()

function clearVisuals(): void {
  for (const vis of visuals) ctx.scene.remove(vis.group)
  visuals = []
}

function createVisuals(count: number): void {
  clearVisuals()
  for (let i = 0; i < count; i++) {
    const car = CARS[i % CARS.length]
    const vis = bindKartVisual(buildPlaceholderKart(car.color))
    ctx.scene.add(vis.group)
    visuals.push(vis)
  }
}

function resetQuickRace(): void {
  mode = { type: 'quick', qr: createQuickRace(track, 6) }
  createVisuals(mode.qr.race.karts.length)
}

async function resetTimeTrial(): Promise<void> {
  const tt = createTimeTrial(MOONACO as TrackDef)
  await loadGhost(tt)
  mode = { type: 'tt', tt }
  createVisuals(tt.ghostRace ? 2 : 1)
}

// start in Quick Race
resetQuickRace()

function updateAllVisuals(snaps: Snapshot[], dt: number): void {
  for (let i = 0; i < visuals.length; i++) {
    const vis = visuals[i]
    const s = snaps[i]
    const k = mode.type === 'quick'
      ? mode.qr.race.karts[i]
      : (i === 0 ? mode.tt.race.karts[0] : mode.tt.ghostRace!.karts[0])
    updateKartVisual(vis, { x: s.x, y: s.y }, s.heading, k, i === 0 ? lastInput : { throttle: 0, steer: 0, drift: false }, dt)
  }
}

function updateItemBoxes(): void {
  if (mode.type !== 'quick') {
    for (const m of itemBoxMeshes) m.visible = false
    return
  }
  for (let i = 0; i < itemBoxMeshes.length; i++) {
    const box = mode.qr.race.itemBoxes[i]
    itemBoxMeshes[i].visible = box ? box.active : false
    if (box && box.active) itemBoxMeshes[i].rotation.y += 0.03
  }
}

startLoop(
  () => {
    if (input.pressed('KeyR')) {
      resetQuickRace()
    } else if (input.pressed('KeyT')) {
      resetTimeTrial()
    }
    lastInput = input.read()

    if (mode.type === 'quick') {
      stepQuickRace(mode.qr, lastInput)
    } else {
      stepTimeTrial(mode.tt, lastInput)
      if (mode.tt.finished && !mode.tt.submitted) {
        submitTimeTrial(mode.tt, 'paper-scooter')
      }
    }
  },
  () => {
    if (mode.type === 'quick') {
      return mode.qr.race.karts.map(snapshot)
    }
    const snaps = [snapshot(mode.tt.race.karts[0])]
    if (mode.tt.ghostRace) snaps.push(snapshot(mode.tt.ghostRace.karts[0]))
    return snaps
  },
  (snaps, dt) => {
    updateAllVisuals(snaps, dt)
    updateChaseCamera(ctx.camera, snaps[0], dt)
    updateItemBoxes()
    if (mode.type === 'quick') {
      const ranks = rankByProgress(mode.qr.race.karts)
      hud.update(mode.qr.race.karts[0], ranks[0] + 1, mode.qr.race.karts.length)
    } else {
      const k = mode.tt.race.karts[0]
      hud.update(k, 1, mode.tt.ghostRace ? 2 : 1)
    }
    ctx.renderer.render(ctx.scene, ctx.camera)
  },
)
