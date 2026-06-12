import * as THREE from 'three'
import { DT, KartState } from '../sim/kart'

export interface Snapshot { x: number; y: number; heading: number }

export const snapshot = (k: KartState): Snapshot => ({ x: k.pos.x, y: k.pos.y, heading: k.heading })

export function lerpSnap(a: Snapshot, b: Snapshot, t: number): Snapshot {
  let dh = b.heading - a.heading
  if (dh > Math.PI) dh -= Math.PI * 2
  if (dh < -Math.PI) dh += Math.PI * 2
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, heading: a.heading + dh * t }
}

/**
 * Fixed-timestep driver: sim advances in exact DT steps; rendering
 * interpolates between the previous and current sim states.
 */
export function startLoop(
  stepSim: () => void,
  takeSnapshots: () => Snapshot[],
  render: (interpolated: Snapshot[], dt: number) => void,
): void {
  let acc = 0
  let last = performance.now()
  let prev = takeSnapshots()
  let curr = takeSnapshots()

  function frame(now: number) {
    const frameDt = Math.min((now - last) / 1000, 0.25) // clamp away tab-switch spikes
    last = now
    acc += frameDt
    while (acc >= DT) {
      prev = curr
      stepSim()
      curr = takeSnapshots()
      acc -= DT
    }
    const alpha = acc / DT
    render(curr.map((c, i) => lerpSnap(prev[i] ?? c, c, alpha)), frameDt)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

/** Smooth chase camera behind the kart. */
export function updateChaseCamera(
  camera: THREE.PerspectiveCamera,
  snap: Snapshot,
  dt: number,
): void {
  const fwd = new THREE.Vector3(Math.cos(snap.heading), 0, Math.sin(snap.heading))
  const kartPos = new THREE.Vector3(snap.x, 0, snap.y)
  const desired = kartPos.clone().addScaledVector(fwd, -8).add(new THREE.Vector3(0, 3.4, 0))
  camera.position.lerp(desired, Math.min(1, dt * 5))
  camera.lookAt(kartPos.clone().addScaledVector(fwd, 5).add(new THREE.Vector3(0, 1, 0)))
}
