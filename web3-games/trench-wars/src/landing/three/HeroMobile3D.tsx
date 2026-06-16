import { Suspense, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

/* ============================================================================
 * Lightweight hero scene for MOBILE — the full diorama is too heavy for phone
 * GPUs, so mobile gets a simple, reliable scene: one tower at the end of one
 * lane, with a few Jeet heroes marching up and attacking it on a loop.
 * ========================================================================== */

const K = '/assets/3d/kaykit'
const TOWER_URL = `${K}/building_tower_A_blue.gltf`
// Jeet attackers (Solana heroes) storming the tower.
const ATTACKERS = ['pepe', 'ansem', 'sbf']
const WALK_URLS = ATTACKERS.map((n) => `/assets/3d/chars/${n}/walk.glb`)
const ATTACK_URLS = ATTACKERS.map((n) => `/assets/3d/chars/${n}/attack.glb`)
;[TOWER_URL, ...WALK_URLS, ...ATTACK_URLS].forEach((u) => useGLTF.preload(u))

const SPAWN_Z = 4.2 // far from the tower (near the camera)
const ATTACK_Z = -1.1 // where they stop and bash the tower
const SPEED = 0.8 // lane march, world units / sec
const ATTACK_TIME = 4.0 // seconds spent attacking before respawning
const TARGET_H = 1.8 // every hero scaled to this height so sizes are consistent

/** Strip horizontal root motion so the walk cycle marches in place (we drive z). */
function deRoot(clip: THREE.AnimationClip): THREE.AnimationClip {
  const c = clip.clone()
  for (const track of c.tracks) {
    if (track.name.endsWith('.position') && track.values.length >= 3) {
      const x0 = track.values[0]
      const z0 = track.values[2]
      for (let i = 0; i < track.values.length; i += 3) {
        track.values[i] = x0
        track.values[i + 2] = z0
      }
    }
  }
  return c
}

interface Unit {
  group: THREE.Group
  mixer: THREE.AnimationMixer
  walk: THREE.AnimationAction
  attack: THREE.AnimationAction
  x: number
  z: number
  state: 'walk' | 'attack'
  t: number
}

function MobileScene() {
  const towerGlb = useGLTF(TOWER_URL)
  const walkGlbs = useGLTF(WALK_URLS)
  const attackGlbs = useGLTF(ATTACK_URLS)

  const built = useMemo(() => {
    const tower = cloneSkeleton(towerGlb.scene) as THREE.Group
    tower.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    tower.scale.setScalar(1.7)
    tower.position.set(0, 0, -2.8)

    const units: Unit[] = ATTACKERS.map((_, i) => {
      const group = cloneSkeleton(walkGlbs[i].scene) as THREE.Group
      group.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) {
          m.castShadow = true
          m.frustumCulled = false
        }
      })
      // uniform height regardless of model size
      const box = new THREE.Box3().setFromObject(group)
      const h = box.getSize(new THREE.Vector3()).y || 1
      group.scale.setScalar(TARGET_H / h)
      group.rotation.y = Math.PI // face down the lane toward the tower (-z)

      const mixer = new THREE.AnimationMixer(group)
      const walk = mixer.clipAction(deRoot(walkGlbs[i].animations[0]))
      const attack = mixer.clipAction(deRoot(attackGlbs[i].animations[0]))
      walk.play()
      attack.play()
      attack.setEffectiveWeight(0)

      const x = (i - 1) * 0.78 // spread the three across the lane width
      const z = SPAWN_Z - i * 1.7 // stagger so they arrive in a wave
      group.position.set(x, 0, z)
      return { group, mixer, walk, attack, x, z, state: 'walk', t: 0 }
    })
    return { tower, units }
  }, [towerGlb, walkGlbs, attackGlbs])

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05)
    for (const u of built.units) {
      u.mixer.update(d)
      if (u.state === 'walk') {
        u.z -= SPEED * d
        u.group.position.z = u.z
        if (u.z <= ATTACK_Z) {
          u.state = 'attack'
          u.t = 0
          u.attack.reset()
          u.walk.crossFadeTo(u.attack, 0.2, false)
          u.attack.setEffectiveWeight(1)
        }
      } else {
        u.t += d
        if (u.t >= ATTACK_TIME) {
          u.z = SPAWN_Z
          u.group.position.z = u.z
          u.state = 'walk'
          u.t = 0
          u.walk.reset()
          u.attack.crossFadeTo(u.walk, 0.25, false)
          u.walk.setEffectiveWeight(1)
        }
      }
    }
  })

  return (
    <group>
      <primitive object={built.tower} />
      {built.units.map((u, i) => (
        <primitive key={i} object={u.group} />
      ))}
    </group>
  )
}

/** Ground + lane — rendered outside Suspense so it shows immediately. */
function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0.5]}>
        <planeGeometry args={[15, 20]} />
        <meshStandardMaterial color="#6f9a36" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1.4]}>
        <planeGeometry args={[2.8, 12]} />
        <meshStandardMaterial color="#a8824c" roughness={1} />
      </mesh>
    </group>
  )
}

function CameraRig() {
  const { camera } = useThree()
  useEffect(() => {
    camera.lookAt(0, 1.3, -2.2)
  }, [camera])
  return null
}

export function HeroMobile3D() {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 2.1, 7.0], fov: 38, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <CameraRig />
      <hemisphereLight args={['#dce8ff', '#46402c', 1.5]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[-5, 9, 5]} intensity={1.9} />
      <Ground />
      <Suspense fallback={null}>
        <MobileScene />
        <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={16} blur={2.6} far={6} color="#000000" />
      </Suspense>
    </Canvas>
  )
}
