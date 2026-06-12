import * as THREE from 'three'
import { KartState, KartInput, DEFAULT_KART } from '../sim/kart'
import { len } from '../sim/math'

const WHEEL_RADIUS = 0.35

/**
 * Placeholder kart honoring the detached-wheels GLB convention:
 * named nodes `body`, `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR`,
 * forward = local +Z, origin at ground center. Real Meshy GLBs (Plan 4)
 * bind through the exact same node lookup.
 */
export function buildPlaceholderKart(color: number): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.6, 2.6),
    new THREE.MeshStandardMaterial({ color }),
  )
  body.name = 'body'
  body.position.y = 0.55
  body.castShadow = true
  g.add(body)

  const wheelGeo = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 14)
  wheelGeo.rotateZ(Math.PI / 2) // cylinder axis -> local x
  const positions: [string, number, number][] = [
    ['wheel_FL', -0.85, 1.0],
    ['wheel_FR', 0.85, 1.0],
    ['wheel_RL', -0.85, -1.0],
    ['wheel_RR', 0.85, -1.0],
  ]
  for (const [name, x, z] of positions) {
    const w = new THREE.Mesh(wheelGeo, new THREE.MeshStandardMaterial({ color: 0x16161a }))
    w.name = name
    w.position.set(x, WHEEL_RADIUS, z)
    w.castShadow = true
    g.add(w)
  }
  return g
}

export interface KartVisual {
  group: THREE.Group
  wheels: { FL: THREE.Object3D; FR: THREE.Object3D; RL: THREE.Object3D; RR: THREE.Object3D }
  body: THREE.Object3D
  spin: number
}

export function bindKartVisual(group: THREE.Group): KartVisual {
  const get = (n: string) => {
    const o = group.getObjectByName(n)
    if (!o) throw new Error(`kart model missing required node: ${n}`)
    return o
  }
  return {
    group,
    body: get('body'),
    wheels: { FL: get('wheel_FL'), FR: get('wheel_FR'), RL: get('wheel_RL'), RR: get('wheel_RR') },
    spin: 0,
  }
}

/**
 * Apply interpolated sim state to the visual.
 * Sim heading 0 = +x (sim) = world (1,0,0); local forward is +Z,
 * so rotation.y = PI/2 - heading maps local +Z onto the sim heading.
 */
export function updateKartVisual(
  vis: KartVisual,
  pos: { x: number; y: number },
  heading: number,
  state: KartState,
  input: KartInput,
  dt: number,
): void {
  vis.group.position.set(pos.x, 0, pos.y)
  vis.group.rotation.y = Math.PI / 2 - heading

  // wheel spin from speed
  const speed = len(state.vel)
  vis.spin += (speed / WHEEL_RADIUS) * dt
  for (const w of [vis.wheels.FL, vis.wheels.FR, vis.wheels.RL, vis.wheels.RR]) {
    w.rotation.x = vis.spin
  }
  // front wheel steering yaw (negated: positive steer = left turn = -y yaw in world map)
  const steerYaw = -input.steer * 0.42
  vis.wheels.FL.rotation.y = steerYaw
  vis.wheels.FR.rotation.y = steerYaw

  // body drift lean + boost squat
  const targetLean = state.drift.active ? state.drift.dir * 0.18 : 0
  vis.body.rotation.z += (targetLean - vis.body.rotation.z) * Math.min(1, dt * 10)
  const targetSquat = state.boostTicks > 0 ? 0.45 : 0.55
  vis.body.position.y += (targetSquat - vis.body.position.y) * Math.min(1, dt * 10)

  // boost speed cap visual: stretch flame later (Plan 4); color flash for now
  const mat = (vis.body as THREE.Mesh).material as THREE.MeshStandardMaterial
  mat.emissive.setHex(state.boostTicks > 0 ? 0x3366ff : 0x000000)
  void DEFAULT_KART
}
