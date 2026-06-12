import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { validateKartGLB } from '../../src/garage/validator'

function createNode(name: string, sx: number, sy: number, sz: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshStandardMaterial())
  mesh.name = name
  return mesh
}

describe('validateKartGLB', () => {
  it('passes a valid kart scene', () => {
    const root = new THREE.Group()
    root.add(createNode('body', 1.6, 0.6, 2.6))
    root.add(createNode('wheel_FL', 0.3, 0.7, 0.7))
    root.add(createNode('wheel_FR', 0.3, 0.7, 0.7))
    root.add(createNode('wheel_RL', 0.3, 0.7, 0.7))
    root.add(createNode('wheel_RR', 0.3, 0.7, 0.7))
    const report = validateKartGLB(root)
    expect(report.valid).toBe(true)
    expect(report.missingNodes).toHaveLength(0)
  })

  it('fails when required nodes are missing', () => {
    const root = new THREE.Group()
    root.add(createNode('body', 1.6, 0.6, 2.6))
    const report = validateKartGLB(root)
    expect(report.valid).toBe(false)
    expect(report.missingNodes.length).toBeGreaterThan(0)
  })

  it('warns when body is too large', () => {
    const root = new THREE.Group()
    root.add(createNode('body', 10, 5, 10))
    root.add(createNode('wheel_FL', 0.3, 0.7, 0.7))
    root.add(createNode('wheel_FR', 0.3, 0.7, 0.7))
    root.add(createNode('wheel_RL', 0.3, 0.7, 0.7))
    root.add(createNode('wheel_RR', 0.3, 0.7, 0.7))
    const report = validateKartGLB(root)
    expect(report.warnings.length).toBeGreaterThan(0)
  })
})
