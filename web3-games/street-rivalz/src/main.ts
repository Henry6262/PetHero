import { buildTrack } from './sim/track'
import { MOONACO } from './tracks/moonaco'
import { createRace, stepRace } from './sim/race'
import { KartState } from './sim/kart'
import { createScene } from './render/scene'
import { buildTrackMeshes } from './render/trackMesh'
import { buildPlaceholderKart, bindKartVisual, updateKartVisual, KartVisual } from './render/kartVisual'
import { KeyboardInput } from './game/input'
import { Hud } from './game/hud'
import { startLoop, snapshot, Snapshot, updateChaseCamera } from './game/loop'

const app = document.getElementById('app')!
const ctx = createScene(app)
const track = buildTrack(MOONACO)
ctx.scene.add(buildTrackMeshes(track))

let race = createRace(track, 1)
const kartVis: KartVisual = bindKartVisual(buildPlaceholderKart(0xe11d48))
ctx.scene.add(kartVis.group)

const input = new KeyboardInput()
const hud = new Hud()
let lastInput = input.read()

function updateKartVisualSafe(s: Snapshot, k: KartState, dt: number): void {
  updateKartVisual(kartVis, { x: s.x, y: s.y }, s.heading, k, lastInput, dt)
}

startLoop(
  () => {
    if (input.pressed('KeyR')) race = createRace(track, 1)
    lastInput = input.read()
    stepRace(race, track, [lastInput])
  },
  () => race.karts.map(snapshot),
  (snaps, dt) => {
    const k = race.karts[0]
    const s = snaps[0]
    updateKartVisualSafe(s, k, dt)
    updateChaseCamera(ctx.camera, s, dt)
    hud.update(k)
    ctx.renderer.render(ctx.scene, ctx.camera)
  },
)
