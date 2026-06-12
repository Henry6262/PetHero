import * as THREE from 'three'

export interface ValidationReport {
  valid: boolean
  missingNodes: string[]
  warnings: string[]
}

const REQUIRED_NODES = ['body', 'wheel_FL', 'wheel_FR', 'wheel_RL', 'wheel_RR']
const OPTIONAL_NODES = ['spoiler', 'decals']

/**
 * Validate a kart GLB scene graph for the detached-wheels convention.
 * Returns a report; does not throw.
 */
export function validateKartGLB(root: THREE.Object3D): ValidationReport {
  const report: ValidationReport = { valid: false, missingNodes: [], warnings: [] }
  const found = new Set<string>()

  root.traverse((obj) => {
    if (REQUIRED_NODES.includes(obj.name) || OPTIONAL_NODES.includes(obj.name)) {
      found.add(obj.name)
    }
  })

  for (const name of REQUIRED_NODES) {
    if (!found.has(name)) report.missingNodes.push(name)
  }

  const body = findByName(root, 'body')
  if (body) {
    const box = new THREE.Box3().setFromObject(body)
    const size = new THREE.Vector3()
    box.getSize(size)
    if (size.x > 4.5 || size.y > 3 || size.z > 4.5) {
      report.warnings.push(`body size ${size.toArray().map((v) => v.toFixed(2)).join(',')} looks too large for a kart`)
    }
    if (size.x < 0.5 && size.z < 0.5) {
      report.warnings.push(`body appears too small; check real-world scale`)
    }
    if (size.z < size.x * 0.5) {
      report.warnings.push(`body extends more along X than Z; ensure forward axis is +Z`)
    }
  } else {
    report.warnings.push('cannot validate scale without body node')
  }

  if (report.missingNodes.length === 0 && report.warnings.length === 0) {
    report.valid = true
  }
  return report
}

function findByName(root: THREE.Object3D, name: string): THREE.Object3D | null {
  let result: THREE.Object3D | null = null
  root.traverse((obj) => {
    if (obj.name === name && !result) result = obj
  })
  return result
}
