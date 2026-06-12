import * as THREE from 'three'
import { Track } from '../sim/track'
import { v, add, sub, scale, norm, Vec2 } from '../sim/math'

/** Sim (x, y) plane maps to three (x, z); y is up. */
export const toWorld = (p: Vec2, y = 0): THREE.Vector3 => new THREE.Vector3(p.x, y, p.y)

function offsets(track: Track): { left: Vec2[]; right: Vec2[] } {
  const pts = track.points
  const n = pts.length
  const half = track.def.width / 2
  const left: Vec2[] = []
  const right: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]
    const next = pts[(i + 1) % n]
    const dir = norm(sub(next, prev)) // averaged tangent
    const normal = v(-dir.y, dir.x)
    left.push(add(pts[i], scale(normal, half)))
    right.push(add(pts[i], scale(normal, -half)))
  }
  return { left, right }
}

function ribbon(a: Vec2[], b: Vec2[], y: number, material: THREE.Material): THREE.Mesh {
  const n = a.length
  const positions: number[] = []
  const indices: number[] = []
  for (let i = 0; i < n; i++) {
    positions.push(a[i].x, y, a[i].y, b[i].x, y, b[i].y)
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const a0 = i * 2, b0 = i * 2 + 1, a1 = j * 2, b1 = j * 2 + 1
    indices.push(a0, b0, a1, b0, b1, a1)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, material)
  mesh.receiveShadow = true
  return mesh
}

export function buildTrackMeshes(track: Track): THREE.Group {
  const g = new THREE.Group()
  const { left, right } = offsets(track)

  // asphalt
  g.add(ribbon(left, right, 0, new THREE.MeshStandardMaterial({ color: 0x2a2a33 })))

  // neon edge strips (slightly inset, slightly raised)
  const inset = 0.6
  const innerL = left.map((p, i) => add(p, scale(norm(sub(track.points[i], p)), inset)))
  const innerR = right.map((p, i) => add(p, scale(norm(sub(track.points[i], p)), inset)))
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0x39ff88 })
  g.add(ribbon(left, innerL, 0.02, edgeMat))
  g.add(ribbon(right, innerR, 0.02, edgeMat))

  // start/finish line across the road at point 0
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const start = new THREE.Mesh(new THREE.BoxGeometry(track.def.width, 0.02, 1.5), lineMat)
  const p0 = track.points[0]
  const p1 = track.points[1]
  const dir = norm(sub(p1, p0))
  start.position.set(p0.x, 0.03, p0.y)
  start.rotation.y = -Math.atan2(dir.y, dir.x)
  g.add(start)

  return g
}
