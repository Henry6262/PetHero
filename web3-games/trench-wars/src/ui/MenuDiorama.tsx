import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const HEX_GRASS_URL = '/assets/3d/kaykit/hex_grass.gltf'
const HEX_WATER_URL = '/assets/3d/kaykit/hex_water.gltf'
const CASTLE_BLUE_URL = '/assets/3d/kaykit/building_castle_blue.gltf'
const CASTLE_RED_URL = '/assets/3d/kaykit/building_castle_red.gltf'
const TOWER_BLUE_URL = '/assets/3d/kaykit/building_tower_A_blue.gltf'
const TOWER_RED_URL = '/assets/3d/kaykit/building_tower_A_red.gltf'
const FLAG_BLUE_URL = '/assets/3d/kaykit/flag_blue.gltf'
const FLAG_RED_URL = '/assets/3d/kaykit/flag_red.gltf'
const TREE_URL = '/assets/3d/kaykit/tree_single_A.gltf'
const ROCK_URL = '/assets/3d/kaykit/rock_single_A.gltf'

;[
  HEX_GRASS_URL, HEX_WATER_URL,
  CASTLE_BLUE_URL, CASTLE_RED_URL, TOWER_BLUE_URL, TOWER_RED_URL,
  FLAG_BLUE_URL, FLAG_RED_URL, TREE_URL, ROCK_URL,
].forEach((u) => useGLTF.preload(u))

const COLS = [-2, -1, 0, 1, 2]
const ROWS = 8
const RIVER_ROW = 4
const TARGET_TILE_W = 0.9
const TILE_OVERLAP = 1.05

interface Cell { x: number; z: number; y: number; water: boolean }

function buildCells(grassScene: THREE.Object3D): Cell[] {
  const box = new THREE.Box3().setFromObject(grassScene)
  const size = box.getSize(new THREE.Vector3())
  const flatTop = size.x >= size.z
  const baseScale = TARGET_TILE_W / Math.max(size.x, size.z)
  const stepA = (flatTop ? size.x * 0.75 : size.x) * baseScale
  const stepB = (flatTop ? size.z : size.z * 0.75) * baseScale
  const depth = (ROWS - 1) * stepB
  const frontZ = depth / 2

  const cells: Cell[] = []
  for (let row = 0; row < ROWS; row++) {
    const rowOffX = flatTop ? 0 : row % 2 ? stepA / 2 : 0
    for (let col = 0; col < COLS.length; col++) {
      const colIdx = COLS[col]
      const wx = colIdx * stepA + rowOffX
      const wz = frontZ - row * stepB - (flatTop && Math.abs(colIdx) % 2 ? stepB / 2 : 0)
      const isRiver = row === RIVER_ROW && Math.abs(colIdx) !== 1
      cells.push({ x: wx, z: wz, y: isRiver ? -0.06 : 0, water: isRiver })
    }
  }
  return cells
}

function Tile({ scene, x, z, y, scale }: { scene: THREE.Object3D; x: number; z: number; y: number; scale: number }) {
  const cloned = useMemo(() => {
    const s = scene.clone(true)
    s.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return s
  }, [scene])
  return (
    <primitive object={cloned} position={[x, y, z]} scale={[scale, scale, scale]} />
  )
}

function Model({ url, position, rotation = [0, 0, 0], scale = 1 }: { url: string; position: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => {
    const s = scene.clone(true)
    s.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return s
  }, [scene])
  return <primitive object={cloned} position={position} rotation={rotation} scale={[scale, scale, scale]} />
}

function Scene() {
  const { scene } = useThree()
  const grass = useGLTF(HEX_GRASS_URL).scene
  const water = useGLTF(HEX_WATER_URL).scene
  const cells = useMemo(() => buildCells(grass), [grass])
  const tileScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(grass)
    const size = box.getSize(new THREE.Vector3())
    return (TARGET_TILE_W / Math.max(size.x, size.z)) * TILE_OVERLAP
  }, [grass])

  // static fog and lights
  scene.background = new THREE.Color(0x0a0e14)
  scene.fog = new THREE.Fog(0x0a0e14, 8, 18)

  return (
    <>
      <hemisphereLight args={[0xbfd6ff, 0x33271a, 0.9]} />
      <directionalLight
        args={[0xfff2d9, 1.8]}
        position={[-10, 24, 8]}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {cells.map((c, i) => (
        <Tile
          key={i}
          scene={c.water ? water : grass}
          x={c.x}
          y={c.y}
          z={c.z}
          scale={tileScale}
        />
      ))}

      {/* Towers */}
      <Model url={TOWER_BLUE_URL} position={[-1.6, 0, 2.2]} scale={0.55} />
      <Model url={TOWER_BLUE_URL} position={[1.6, 0, 2.2]} scale={0.55} />
      <Model url={CASTLE_BLUE_URL} position={[0, 0, 3.6]} scale={0.6} />
      <Model url={TOWER_RED_URL} position={[-1.6, 0, -2.2]} rotation={[0, Math.PI, 0]} scale={0.55} />
      <Model url={TOWER_RED_URL} position={[1.6, 0, -2.2]} rotation={[0, Math.PI, 0]} scale={0.55} />
      <Model url={CASTLE_RED_URL} position={[0, 0, -3.6]} rotation={[0, Math.PI, 0]} scale={0.6} />

      {/* Decorations */}
      <Model url={FLAG_BLUE_URL} position={[-2.5, 0, 2.2]} scale={0.7} />
      <Model url={FLAG_BLUE_URL} position={[2.5, 0, 2.2]} scale={0.7} />
      <Model url={FLAG_RED_URL} position={[-2.5, 0, -2.2]} rotation={[0, Math.PI, 0]} scale={0.7} />
      <Model url={FLAG_RED_URL} position={[2.5, 0, -2.2]} rotation={[0, Math.PI, 0]} scale={0.7} />
      <Model url={TREE_URL} position={[-2.6, 0, 0.5]} scale={0.9} />
      <Model url={TREE_URL} position={[2.6, 0, -0.5]} rotation={[0, 1.2, 0]} scale={0.9} />
      <Model url={ROCK_URL} position={[-2.4, 0, -1.0]} scale={0.7} />
      <Model url={ROCK_URL} position={[2.4, 0, 1.0]} rotation={[0, 0.8, 0]} scale={0.7} />

      <CameraRig />
    </>
  )
}

function CameraRig() {
  const { camera } = useThree()
  const angle = useRef(0)
  useFrame((_, delta) => {
    angle.current += delta * 0.12
    const r = 8.5
    camera.position.set(Math.sin(angle.current) * r, 6.5, Math.cos(angle.current) * r)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export function MenuDiorama() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 6.5, 8.5], fov: 38 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
    >
      <Scene />
    </Canvas>
  )
}
