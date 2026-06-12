import * as THREE from 'three'

export interface SceneCtx {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
}

export function createScene(container: HTMLElement): SceneCtx {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a18)
  scene.fog = new THREE.Fog(0x0a0a18, 120, 420)

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 600)
  camera.position.set(0, 8, -14)

  const hemi = new THREE.HemisphereLight(0x8899ff, 0x223344, 0.9)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.4)
  sun.position.set(80, 120, 40)
  sun.castShadow = true
  sun.shadow.camera.left = -200
  sun.shadow.camera.right = 200
  sun.shadow.camera.top = 200
  sun.shadow.camera.bottom = -200
  scene.add(sun)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x111122 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.05
  ground.receiveShadow = true
  scene.add(ground)

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  return { renderer, scene, camera }
}
