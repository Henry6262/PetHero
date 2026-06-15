import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  useGLTF,
  Float,
  Bounds,
  Environment,
  ContactShadows,
} from '@react-three/drei'
import * as THREE from 'three'

/**
 * Landing-page hero diorama: a small floating slice of the battlefield built
 * from the same KayKit terrain/building GLTFs the in-game renderer uses. These
 * `.gltf` files reference a shared `.bin` + the `hexagons_medieval.png` texture
 * atlas, which the default GLTFLoader (under drei's `useGLTF`) resolves
 * automatically — no meshopt/draco decoder needed (those are only for the
 * character `.glb`, which we deliberately avoid here for robustness).
 */

const HEX_GRASS = '/assets/3d/kaykit/hex_grass.gltf'
const TOWER_BLUE = '/assets/3d/kaykit/building_tower_A_blue.gltf'
const TOWER_RED = '/assets/3d/kaykit/building_tower_A_red.gltf'
const CASTLE = '/assets/3d/kaykit/building_castle_blue.gltf'

// Preload the most-instanced asset at module scope so the first paint is quick.
useGLTF.preload(HEX_GRASS)

/** Clone a loaded GLTF scene so the same model can be placed multiple times. */
function useClonedScene(url: string) {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return clone
  }, [scene])
}

function Model({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  tint,
}: {
  url: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  tint?: THREE.Color
}) {
  const scene = useClonedScene(url)
  if (tint) {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && (m.material as THREE.MeshStandardMaterial)?.color) {
        const mat = m.material as THREE.MeshStandardMaterial
        mat.color.lerp(tint, 0.55)
      }
    })
  }
  return (
    <primitive object={scene} position={position} rotation={rotation} scale={scale} />
  )
}

/** A 3x3 hex-tile platform. KayKit hexes are flat-top; offset alternate columns. */
const TINT_HEX = new THREE.Color('#252f42')
const TINT_TOWER = new THREE.Color('#c9d4e8')

function HexPlatform() {
  const tiles = useMemo(() => {
    const out: [number, number][] = []
    const stepX = 0.86
    const stepZ = 1.0
    for (let col = -1; col <= 1; col++) {
      for (let row = -1; row <= 1; row++) {
        const z = row * stepZ + (col % 2 ? stepZ / 2 : 0)
        out.push([col * stepX, z])
      }
    }
    return out
  }, [])
  return (
    <group>
      {tiles.map(([x, z], i) => (
        <Model key={i} url={HEX_GRASS} position={[x, 0, z]} tint={TINT_HEX} />
      ))}
    </group>
  )
}

function Diorama() {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.15
  })

  return (
    <group ref={group}>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6} floatingRange={[-0.04, 0.06]}>
        <HexPlatform />
        {/* Blue tower (near corner) + red tower (far corner) */}
        <Model url={TOWER_BLUE} position={[-0.86, 0.2, 1.0]} tint={TINT_TOWER} />
        <Model url={TOWER_RED} position={[0.86, 0.2, -1.0]} rotation={[0, Math.PI, 0]} tint={TINT_TOWER} />
        {/* Castle anchoring the centre-back */}
        <Model url={CASTLE} position={[0, 0.2, -0.2]} tint={TINT_TOWER} />
      </Float>
    </group>
  )
}

export function BattlefieldDiorama() {
  return (
    <div style={{ width: '100%', aspectRatio: '1/1' }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.8]}
        camera={{ position: [3, 3.2, 3.4], fov: 38 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.45} color="#8fa8d8" />
        <directionalLight
          position={[-3, 5, 4]}
          intensity={1.2}
          color="#b8c8e8"
          castShadow
        />
        <spotLight
          position={[3.5, 5.5, 2.5]}
          angle={0.55}
          penumbra={0.85}
          intensity={28}
          color="#d4a13c"
          castShadow
        />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.1}>
            <Diorama />
          </Bounds>
          <ContactShadows
            position={[0, -0.6, 0]}
            opacity={0.45}
            scale={8}
            blur={2.4}
            far={4}
            color="#000000"
          />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  )
}
