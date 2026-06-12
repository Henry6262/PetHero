import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { validateKartGLB, ValidationReport } from '../garage/validator'

const loader = new GLTFLoader()

export interface LoadResult {
  group: THREE.Group
  report: ValidationReport
}

/**
 * Load a kart GLB from URL, validate the detached-wheels convention,
 * and return a group compatible with bindKartVisual().
 */
export function loadKartGLB(url: string): Promise<LoadResult> {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const group = new THREE.Group()
        group.name = 'kart-root'
        // GLTF scene may contain nested transforms; flatten while preserving named nodes
        gltf.scene.traverse((child) => {
          child.castShadow = true
          child.receiveShadow = true
        })
        group.add(gltf.scene)
        const report = validateKartGLB(group)
        resolve({ group, report })
      },
      undefined,
      (err) => reject(err),
    )
  })
}
