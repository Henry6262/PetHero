import { useRef, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

interface AnimatedCharacterProps {
  /** Character folder name under `/assets/3d/chars/`. Expected files:
   *  `{folder}/model.glb`, `{folder}/walk.glb`, `{folder}/attack.glb`. */
  charName: string
  /** Scale of the character in the scene. */
  scale?: number
  /** Background color behind the model. */
  bg?: string
}

function Model({ charName, scale = 1, fitHeight = 2.0 }: Pick<AnimatedCharacterProps, 'charName' | 'scale'> & { fitHeight?: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const walkActionRef = useRef<THREE.AnimationAction | null>(null)
  const attackActionRef = useRef<THREE.AnimationAction | null>(null)
  const stateRef = useRef<'walk' | 'attack'>('walk')
  const nextSwitchRef = useRef<number>(0)

  const modelUrl = `/assets/3d/chars/${charName}/model.glb`
  const walkUrl = `/assets/3d/chars/${charName}/walk.glb`
  const attackUrl = `/assets/3d/chars/${charName}/attack.glb`

  const modelGltf = useGLTF(modelUrl)
  const walkGltf = useGLTF(walkUrl)
  const attackGltf = useGLTF(attackUrl)

  // Auto-fit: recenter the model at the origin and scale it to a consistent
  // target height so every character (big SBF, small Ansem) frames the same way
  // and never overflows the container.
  const { scene, fit } = useMemo(() => {
    const clone = cloneSkeleton(modelGltf.scene)
    clone.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    clone.position.set(-center.x, -center.y, -center.z)
    return { scene: clone, fit: fitHeight / (size.y || 1) }
  }, [modelGltf.scene, fitHeight])

  useEffect(() => {
    if (!groupRef.current) return
    const mixer = new THREE.AnimationMixer(groupRef.current)
    mixerRef.current = mixer

    // The animation GLBs carry the same rig; reuse their clips on the base model.
    const walkClip = walkGltf.animations[0]
    const attackClip = attackGltf.animations[0]

    if (walkClip) {
      const action = mixer.clipAction(walkClip)
      action.play()
      walkActionRef.current = action
    }
    if (attackClip) {
      const action = mixer.clipAction(attackClip)
      action.setEffectiveWeight(0)
      action.play()
      attackActionRef.current = action
    }

    nextSwitchRef.current = performance.now() + 2000

    return () => {
      mixer.stopAllAction()
      mixerRef.current = null
    }
  }, [walkGltf.animations, attackGltf.animations])

  useFrame((_, delta) => {
    mixerRef.current?.update(delta)

    const now = performance.now()
    if (now < nextSwitchRef.current) return

    const duration = stateRef.current === 'walk' ? 1200 : 2000
    nextSwitchRef.current = now + duration

    if (stateRef.current === 'walk') {
      stateRef.current = 'attack'
      walkActionRef.current?.crossFadeTo(attackActionRef.current!, 0.25, false)
      attackActionRef.current?.setEffectiveWeight(1)
    } else {
      stateRef.current = 'walk'
      attackActionRef.current?.crossFadeTo(walkActionRef.current!, 0.25, false)
      walkActionRef.current?.setEffectiveWeight(1)
    }
  })

  return (
    <group ref={groupRef} rotation={[0, -0.4, 0]} scale={fit * scale} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  )
}

export function CharacterModel({ charName, scale = 1, bg = '#0a0c11' }: AnimatedCharacterProps) {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', background: bg }}>
      <Canvas
        camera={{ position: [0, 0.2, 4.4], fov: 34 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={[bg]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 5, 4]} intensity={2.5} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.8} color="#d4a13c" />
        <Suspense fallback={null}>
          <Model charName={charName} scale={scale} />
          <ContactShadows position={[0, -1.05, 0]} opacity={0.35} scale={8} blur={2.5} far={3} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}

for (const name of ['ansem', 'sbf', 'mert', 'vucan', 'toly']) {
  useGLTF.preload(`/assets/3d/chars/${name}/model.glb`)
  useGLTF.preload(`/assets/3d/chars/${name}/walk.glb`)
  useGLTF.preload(`/assets/3d/chars/${name}/attack.glb`)
}
