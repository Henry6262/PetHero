import { buildTrack } from './sim/track'
import { MOONACO } from './tracks/moonaco'
import { createScene } from './render/scene'
import { buildTrackMeshes, buildItemBoxMeshes } from './render/trackMesh'
import { buildPlaceholderKart, bindKartVisual, updateKartVisual, KartVisual } from './render/kartVisual'
import { KeyboardInput } from './game/input'
import { Hud } from './game/hud'
import { startLoop, snapshot, Snapshot, updateChaseCamera } from './game/loop'
import { createQuickRace, stepQuickRace, QuickRace } from './game/quickRace'
import { rankByProgress } from './sim/rubberband'
import { CARS } from './data/cars'

const app = document.getElementById('app')!
const ctx = createScene(app)
const track = buildTrack(MOONACO)
ctx.scene.add(buildTrackMeshes(track))

const itemBoxMeshes = buildItemBoxMeshes(track)
for (const m of itemBoxMeshes) ctx.scene.add(m)

const input = new KeyboardInput()
const hud = new Hud()

let qr = createQuickRace(track, 6)
let visuals: KartVisual[] = []
let lastInput = input.read()

function createKartVisuals(qr: QuickRace): KartVisual[] {
  // remove old visuals
  for (const vis of visuals) ctx.scene.remove(vis.group)
  const out: KartVisual[] = []
  for (let i = 0; i < qr.race.karts.length; i++) {
    const car = CARS[i % CARS.length]
    const vis = bindKartVisual(buildPlaceholderKart(car.color))
    ctx.scene.add(vis.group)
    out.push(vis)
  }
  return out
}

visuals = createKartVisuals(qr)

function updateAllVisuals(snaps: Snapshot[], dt: number): void {
  for (let i = 0; i < visuals.length; i++) {
    const vis = visuals[i]
    const s = snaps[i]
    const k = qr.race.karts[i]
    updateKartVisual(vis, { x: s.x, y: s.y }, s.heading, k, i === 0 ? lastInput : { throttle: 0, steer: 0, drift: false }, dt)
  }
}

function updateItemBoxes(): void {
  for (let i = 0; i < itemBoxMeshes.length; i++) {
    const box = qr.race.itemBoxes[i]
    itemBoxMeshes[i].visible = box ? box.active : false
    if (box && box.active) itemBoxMeshes[i].rotation.y += 0.03
  }
}

startLoop(
  () => {
    if (input.pressed('KeyR')) {
      qr = createQuickRace(track, 6)
      visuals = createKartVisuals(qr)
    }
    lastInput = input.read()
    stepQuickRace(qr, lastInput)
  },
  () => qr.race.karts.map(snapshot),
  (snaps, dt) => {
    updateAllVisuals(snaps, dt)
    updateChaseCamera(ctx.camera, snaps[0], dt)
    updateItemBoxes()
    const ranks = rankByProgress(qr.race.karts)
    const playerPos = ranks[0] + 1
    hud.update(qr.race.karts[0], playerPos, qr.race.karts.length)
    ctx.renderer.render(ctx.scene, ctx.camera)
  },
)
