import { Suspense, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows, Bounds } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

/* ============================================================================
 * Hero diorama v2 — two-sided lane battle.
 * Blue army (Traders) marches up from the front camp, red army (Jeets) sallies
 * from the back castle; they meet on the lanes and play their walk → attack
 * animations against each other. Clean KayKit low-poly, leveled up via density,
 * composition and lighting (no textures). See docs/specs/2026-06-15-hero-diorama-v2.md
 * ========================================================================== */

const K = '/assets/3d/kaykit'
const HEX_GRASS_URL = `${K}/hex_grass.gltf`
const CASTLE_RED_URL = `${K}/building_castle_red.gltf`
const CASTLE_BLUE_URL = `${K}/building_castle_blue.gltf`
const TOWER_RED_URL = `${K}/building_tower_A_red.gltf`
const TOWER_BLUE_URL = `${K}/building_tower_A_blue.gltf`
const FLAG_RED_URL = `${K}/flag_red.gltf`
const FLAG_BLUE_URL = `${K}/flag_blue.gltf`
const TREE_URL = `${K}/tree_single_A.gltf`
const TREES_LARGE_URL = `${K}/trees_A_large.gltf`
const TREES_MED_URL = `${K}/trees_B_medium.gltf`
const ROCK_URL = `${K}/rock_single_A.gltf`
const TENT_URL = `${K}/tent.gltf`
const BARREL_URL = `${K}/barrel.gltf`
const CRATE_BIG_URL = `${K}/crate_A_big.gltf`
const CRATE_SMALL_URL = `${K}/crate_A_small.gltf`
const TARGET_URL = `${K}/target.gltf`
const WEAPONRACK_URL = `${K}/weaponrack.gltf`
const BUCKET_ARROWS_URL = `${K}/bucket_arrows.gltf`
const SACK_URL = `${K}/sack.gltf`
const FENCE_URL = `${K}/fence_wood_straight.gltf`
const FENCE_GATE_URL = `${K}/fence_wood_straight_gate.gltf`
const WATERLILY_URL = `${K}/waterlily_A.gltf`
const WATERPLANT_URL = `${K}/waterplant_A.gltf`

const BLUE_ARMY = ['mert', 'toly', 'gake', 'phoenix']
const RED_ARMY = ['ansem', 'sbf', 'pepe']
const CHAR_NAMES = [...new Set([...BLUE_ARMY, ...RED_ARMY])]
const WALK_URLS = CHAR_NAMES.map((n) => `/assets/3d/chars/${n}/walk.glb`)
const ATTACK_URLS = CHAR_NAMES.map((n) => `/assets/3d/chars/${n}/attack.glb`)

const ENV_URLS = [
  HEX_GRASS_URL, CASTLE_RED_URL, CASTLE_BLUE_URL, TOWER_RED_URL, TOWER_BLUE_URL, FLAG_RED_URL, FLAG_BLUE_URL,
  TREE_URL, TREES_LARGE_URL, TREES_MED_URL, ROCK_URL, TENT_URL, BARREL_URL,
  CRATE_BIG_URL, CRATE_SMALL_URL, TARGET_URL, WEAPONRACK_URL, BUCKET_ARROWS_URL,
  SACK_URL, FENCE_URL, FENCE_GATE_URL, WATERLILY_URL, WATERPLANT_URL,
]
;[...ENV_URLS, ...WALK_URLS, ...ATTACK_URLS].forEach((u) => useGLTF.preload(u))

// ---- board geometry ----
const COLS = [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8]
const ROWS = 30
const RIVER_ROW = 14
const TARGET_TILE_W = 0.9
const TILE_OVERLAP = 1.06
const SURFACE_Y = 0.06
const WATER_DROP = -0.16 // river-row tiles sink into a channel (in-game look — no flat-plane z-fighting)

// ---- combat / animation ----
const UNIT_SCALE = 0.6 // fixed scale (skinned-mesh bounding boxes are unreliable; roster is baked uniformly)
const UNIT_SPEED = 0.013 // slow, deliberate march
const WALK_TIMESCALE = 0.85 // play the walk cycle a touch slower so feet don't slide
const LANE_SIDE = 0.34 // lateral offset so two units stand side-by-side in a lane
const ENGAGE_RANGE = 0.62 // z-gap at which two enemies stop and fight
const BASE_RANGE = 0.95 // z-gap at which a unit starts hitting the enemy base
const UNIT_HP = 380 // high HP -> fights last a good while
const UNIT_DMG = 15
const ATTACK_INTERVAL = 0.6
const ARMY_CAP = 4 // per side — only a few units at a time
const SPAWN_BLUE = 3.6
const SPAWN_RED = 4.0
const ARROW_COOLDOWN = 3.0
const ARROW_DMG = 16
const TOWER_RANGE = 2.7 // lane tower fires at enemy units within this z-distance
const PROJECTILE_SPEED = 2.8

interface Cell { x: number; z: number; scale: number; water: boolean }
interface Layout {
  cells: Cell[]
  laneX: number[]
  laneWidth: number
  frontZ: number
  backZ: number
  castleZ: number
  campZ: number
  blueKingZ: number
  redKingZ: number
  blueTowerZ: number
  redTowerZ: number
  towerSpreadX: number
  riverZ: number
  riverWidth: number
  edgeX: number
}

/**
 * KayKit medieval hexes are POINTY-TOP (height z > width x). Pointy-top tiling:
 * columns a full width apart, rows 3/4 height apart, every other ROW offset half
 * a width in X so tiles interlock. Board is all grass; lanes + river are flat
 * straight overlays (pointy-top hexes can't form straight lanes — edges at ±60°).
 */
function buildLayout(grassScene: THREE.Object3D): Layout {
  const size = new THREE.Box3().setFromObject(grassScene).getSize(new THREE.Vector3())
  const flatTop = size.x >= size.z
  const baseScale = TARGET_TILE_W / Math.max(size.x, size.z)
  const tileScale = baseScale * TILE_OVERLAP
  const stepA = (flatTop ? size.x * 0.75 : size.x) * baseScale
  const stepB = (flatTop ? size.z : size.z * 0.75) * baseScale

  const frontZ = ((ROWS - 1) * stepB) / 2
  const rowOffX = (row: number) => (flatTop ? 0 : row % 2 ? stepA / 2 : 0)
  const worldX = (col: number, row: number) => col * stepA + rowOffX(row)
  const worldZ = (row: number) => frontZ - row * stepB

  const cells: Cell[] = []
  let edgeX = 0
  for (let row = 0; row < ROWS; row++) {
    for (const col of COLS) {
      const x = worldX(col, row)
      edgeX = Math.max(edgeX, Math.abs(x))
      cells.push({ x, z: worldZ(row), scale: tileScale, water: Math.abs(row - RIVER_ROW) <= 1 })
    }
  }

  const backZ = worldZ(ROWS - 1)
  return {
    cells,
    laneX: [-stepA * 2.8, stepA * 2.8],
    laneWidth: stepA * 2.0,
    frontZ,
    backZ,
    // symmetric arena: a king at each end, two lane towers pulled back near each
    // king and spread wide to flank it
    blueKingZ: worldZ(2.5),
    redKingZ: worldZ(ROWS - 3.5),
    blueTowerZ: worldZ(5),
    redTowerZ: worldZ(ROWS - 6),
    towerSpreadX: stepA * 4.3,
    castleZ: backZ, // alias kept for prop placement (red side)
    campZ: frontZ, // alias kept for prop placement (blue side)
    riverZ: worldZ(RIVER_ROW),
    riverWidth: stepB * 3.3, // thicker river (3 rows of water)
    edgeX,
  }
}

function cloneWithUniqueMaterials(scene: THREE.Object3D): THREE.Group {
  const clone = cloneSkeleton(scene) as THREE.Group
  clone.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && m.material) {
      m.castShadow = true
      m.frustumCulled = false
      m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone()
    }
  })
  return clone
}

function createHealthBar(color: number): { group: THREE.Group; fill: THREE.Mesh } {
  const group = new THREE.Group()
  group.position.set(0, 1.05, 0)
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.07), new THREE.MeshBasicMaterial({ color: 0x20060a }))
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.07), new THREE.MeshBasicMaterial({ color }))
  fill.position.z = 0.01
  group.add(bg, fill)
  return { group, fill }
}

/** Clone a static prop/tile GLTF, keeping its native textured material. */
function useClonedScene(url: string): THREE.Group {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    const clone = cloneSkeleton(scene) as THREE.Group
    clone.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true }
    })
    return clone
  }, [scene])
}

type PropName =
  | 'tree' | 'treesLarge' | 'treesMed' | 'rock' | 'flagRed' | 'flagBlue' | 'tent'
  | 'barrel' | 'crateBig' | 'crateSmall' | 'target' | 'weaponrack' | 'bucketArrows'
  | 'sack' | 'waterlily' | 'waterplant'

interface PropPlacement { m: PropName; pos: [number, number, number]; rot: number; s: number }

/** A wooden fence ringing the grass island, with a gate gap at the front. */
function FenceRing({ fence, gate, layout }: { fence: THREE.Group; gate: THREE.Group; layout: Layout }) {
  const segs = useMemo(() => {
    const sc = 0.5
    const segLen = 1.15 * sc // fence model runs along its local Z (length 1.15)
    const minX = -layout.edgeX * 0.98
    const maxX = layout.edgeX * 0.98
    const frontZ = layout.frontZ + 0.2
    const backZ = layout.backZ - 0.2
    const out: { kind: 'fence' | 'gate'; pos: [number, number, number]; rot: number }[] = []

    // Left / right edges — fence runs along Z (rot 0)
    const nZ = Math.max(2, Math.round((frontZ - backZ) / segLen))
    for (let i = 0; i < nZ; i++) {
      const z = backZ + (i + 0.5) * ((frontZ - backZ) / nZ)
      out.push({ kind: 'fence', pos: [minX, 0, z], rot: 0 })
      out.push({ kind: 'fence', pos: [maxX, 0, z], rot: 0 })
    }
    // Back edge — fence runs along X (rot 90°)
    const nX = Math.max(2, Math.round((maxX - minX) / segLen))
    for (let i = 0; i < nX; i++) {
      const x = minX + (i + 0.5) * ((maxX - minX) / nX)
      out.push({ kind: 'fence', pos: [x, 0, backZ], rot: Math.PI / 2 })
    }
    // Front edge — same, but leave a gate gap in the centre
    const gateHalf = segLen * 1.1
    for (let i = 0; i < nX; i++) {
      const x = minX + (i + 0.5) * ((maxX - minX) / nX)
      if (Math.abs(x) < gateHalf) continue
      out.push({ kind: 'fence', pos: [x, 0, frontZ], rot: Math.PI / 2 })
    }
    out.push({ kind: 'gate', pos: [0, 0, frontZ], rot: Math.PI / 2 })
    return { segs: out, sc }
  }, [layout])

  return (
    <group>
      {segs.segs.map((s, i) => (
        <primitive
          key={`fence-${i}`}
          object={(s.kind === 'gate' ? gate : fence).clone()}
          position={s.pos}
          rotation={[0, s.rot, 0]}
          scale={segs.sc}
        />
      ))}
    </group>
  )
}

function Battlefield({ layout, models }: { layout: Layout; models: Record<string, THREE.Group> }) {
  const laneLength = layout.frontZ - layout.castleZ + 0.4
  const laneMidZ = (layout.frontZ + layout.castleZ) / 2 + 0.2

  const props = useMemo<PropPlacement[]>(() => {
    const ex = layout.edgeX * 0.9
    const span = layout.frontZ
    const cz = layout.castleZ
    const camp = layout.campZ
    return [
      // perimeter nature
      { m: 'treesLarge', pos: [-ex, 0, span * 0.6], rot: 0.4, s: 0.5 },
      { m: 'treesMed', pos: [ex * 1.02, 0, span * 0.28], rot: -0.6, s: 0.55 },
      { m: 'tree', pos: [-ex * 1.02, 0, -span * 0.05], rot: 0.9, s: 1.2 },
      { m: 'treesMed', pos: [ex, 0, -span * 0.45], rot: 1.4, s: 0.5 },
      { m: 'treesLarge', pos: [-ex * 0.98, 0, -span * 0.6], rot: 2.1, s: 0.45 },
      { m: 'tree', pos: [ex * 0.7, 0, cz - 0.1], rot: 0.5, s: 1.0 },
      { m: 'rock', pos: [ex * 0.86, 0, span * 0.62], rot: 0.3, s: 0.8 },
      { m: 'rock', pos: [-ex * 0.9, 0, span * 0.2], rot: 1.2, s: 0.7 },
      { m: 'rock', pos: [ex * 0.84, 0, -span * 0.18], rot: 2.4, s: 0.75 },
      // extra fill — back-right + right side were reading empty from the camera angle
      { m: 'treesMed', pos: [ex * 0.98, 0, -span * 0.62], rot: 0.7, s: 0.5 },
      { m: 'tree', pos: [ex * 0.62, 0, cz - 0.05], rot: 1.6, s: 0.95 },
      { m: 'treesMed', pos: [-ex * 0.98, 0, span * 0.46], rot: 2.4, s: 0.5 },
      { m: 'rock', pos: [ex * 0.5, 0, -span * 0.05], rot: 0.9, s: 0.55 },
      { m: 'barrel', pos: [ex * 0.66, 0, span * 0.7], rot: 0.4, s: 1.1 },
      { m: 'crateSmall', pos: [-ex * 0.34, 0, span * 0.88], rot: 0.7, s: 1.0 },
      // blue camp dressing (front)
      { m: 'tent', pos: [-ex * 0.62, 0, camp - 0.1], rot: 0.3, s: 1.25 },
      { m: 'tent', pos: [ex * 0.62, 0, camp + 0.05], rot: -0.4, s: 1.15 },
      { m: 'barrel', pos: [-ex * 0.4, 0, span * 0.92], rot: 0, s: 1.2 },
      { m: 'crateBig', pos: [ex * 0.42, 0, span * 0.9], rot: 0.5, s: 1.1 },
      { m: 'crateSmall', pos: [ex * 0.55, 0, span * 0.84], rot: 1.1, s: 1.1 },
      { m: 'target', pos: [-ex * 0.72, 0, span * 0.78], rot: 0.4, s: 1.3 },
      { m: 'weaponrack', pos: [ex * 0.74, 0, span * 0.74], rot: -0.5, s: 1.3 },
      { m: 'bucketArrows', pos: [-ex * 0.5, 0, span * 0.82], rot: 0.2, s: 1.3 },
      { m: 'sack', pos: [ex * 0.3, 0, span * 0.95], rot: 0.8, s: 1.2 },
      // banners — blue at camp, red at castle
      { m: 'flagBlue', pos: [layout.laneX[1] + 0.5, 0, span * 1.0], rot: -0.3, s: 0.95 },
      { m: 'flagBlue', pos: [layout.laneX[0] - 0.5, 0, span * 1.0], rot: 0.3, s: 0.95 },
      { m: 'flagRed', pos: [layout.laneX[1] + 0.55, 0, cz + 0.6], rot: -0.3, s: 0.95 },
      { m: 'flagRed', pos: [layout.laneX[0] - 0.55, 0, cz + 0.6], rot: 0.3, s: 0.95 },
      // river life — sit on the sunk water surface
      { m: 'waterlily', pos: [-ex * 0.55, WATER_DROP + 0.06, layout.riverZ], rot: 0.4, s: 0.9 },
      { m: 'waterplant', pos: [ex * 0.5, WATER_DROP + 0.06, layout.riverZ + 0.1], rot: 1.0, s: 0.9 },
      { m: 'waterlily', pos: [ex * 0.78, WATER_DROP + 0.06, layout.riverZ - 0.05], rot: 2.0, s: 0.8 },
    ]
  }, [layout])

  return (
    <group>
      {/* Grass field — river-row tiles are swapped for blue water and sunk into a channel */}
      {layout.cells.map((c, i) => (
        <primitive
          key={`tile-${i}`}
          object={(c.water ? models.water : models.grass).clone()}
          position={[c.x, c.water ? WATER_DROP : 0, c.z]}
          scale={c.scale}
        />
      ))}

      {/* Lanes + stone-edge borders */}
      {layout.laneX.map((lx, i) => (
        <group key={`lane-${i}`}>
          {/* stone curb (slightly wider, light grey) */}
          <mesh position={[lx, SURFACE_Y - 0.01, laneMidZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[layout.laneWidth * 1.32, laneLength]} />
            <meshStandardMaterial color="#7c7d82" roughness={0.95} />
          </mesh>
          {/* dirt road */}
          <mesh position={[lx, SURFACE_Y, laneMidZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[layout.laneWidth, laneLength]} />
            <meshStandardMaterial color="#a8824c" roughness={1} />
          </mesh>
        </group>
      ))}

      {/* Bridge planks where lanes cross the river */}
      {layout.laneX.map((lx, i) => (
        <mesh key={`bridge-${i}`} position={[lx, SURFACE_Y + 0.03, layout.riverZ]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <planeGeometry args={[layout.laneWidth * 1.2, layout.riverWidth * 1.3]} />
          <meshStandardMaterial color="#7d5a32" roughness={0.95} />
        </mesh>
      ))}

      <FenceRing fence={models.fence} gate={models.fenceGate} layout={layout} />

      {props.map((p, i) => (
        <primitive key={`prop-${i}`} object={models[p.m].clone()} position={p.pos} rotation={[0, p.rot, 0]} scale={p.s} />
      ))}
    </group>
  )
}

type UnitState = 'walk' | 'attack' | 'die'
interface Unit {
  id: number
  owner: 'blue' | 'red'
  lane: number
  group: THREE.Group
  mixer: THREE.AnimationMixer
  walk: THREE.AnimationAction
  attack: THREE.AnimationAction
  state: UnitState
  hp: number
  lastAttack: number
  hpBar: THREE.Mesh
}
interface Projectile { mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number; targetId: number }

function PreviewScene() {
  const grass = useClonedScene(HEX_GRASS_URL)
  const castleRedScene = useClonedScene(CASTLE_RED_URL)
  const castleBlueScene = useClonedScene(CASTLE_BLUE_URL)
  const towerRedScene = useClonedScene(TOWER_RED_URL)
  const towerBlueScene = useClonedScene(TOWER_BLUE_URL)

  // Blue water tile = grass hex with its material swapped for water (used in the sunk river row)
  const water = useMemo(() => {
    const c = cloneSkeleton(grass) as THREE.Group
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.material = new THREE.MeshStandardMaterial({ color: '#2f7fd6', roughness: 0.3, metalness: 0.12 })
        m.receiveShadow = true
      }
    })
    return c
  }, [grass])

  // Static prop models keyed for Battlefield
  const models = {
    grass,
    water,
    tree: useClonedScene(TREE_URL),
    treesLarge: useClonedScene(TREES_LARGE_URL),
    treesMed: useClonedScene(TREES_MED_URL),
    rock: useClonedScene(ROCK_URL),
    flagRed: useClonedScene(FLAG_RED_URL),
    flagBlue: useClonedScene(FLAG_BLUE_URL),
    tent: useClonedScene(TENT_URL),
    barrel: useClonedScene(BARREL_URL),
    crateBig: useClonedScene(CRATE_BIG_URL),
    crateSmall: useClonedScene(CRATE_SMALL_URL),
    target: useClonedScene(TARGET_URL),
    weaponrack: useClonedScene(WEAPONRACK_URL),
    bucketArrows: useClonedScene(BUCKET_ARROWS_URL),
    sack: useClonedScene(SACK_URL),
    fence: useClonedScene(FENCE_URL),
    fenceGate: useClonedScene(FENCE_GATE_URL),
    waterlily: useClonedScene(WATERLILY_URL),
    waterplant: useClonedScene(WATERPLANT_URL),
  }

  const walkGlbs = useGLTF(WALK_URLS)
  const attackGlbs = useGLTF(ATTACK_URLS)
  const charData = useMemo(() => {
    const map: Record<string, { scene: THREE.Group; walk: THREE.AnimationClip; attack: THREE.AnimationClip }> = {}
    CHAR_NAMES.forEach((name, i) => {
      const scene = cloneWithUniqueMaterials(walkGlbs[i].scene as THREE.Group)
      map[name] = { scene, walk: walkGlbs[i].animations[0], attack: attackGlbs[i].animations[0] }
    })
    return map
  }, [walkGlbs, attackGlbs])

  const layout = useMemo(() => buildLayout(grass), [grass])

  const sceneRef = useRef<THREE.Group>(null)
  const unitsRef = useRef<Unit[]>([])
  const projRef = useRef<Projectile[]>([])
  const blueTimer = useRef(0)
  const redTimer = useRef(0)
  const nextId = useRef(1)
  const blueIdx = useRef(0)
  const redIdx = useRef(0)

  // The four lane towers — each fires arrows at enemy units on its lane.
  const towers = useMemo(() => {
    const list: { owner: 'blue' | 'red'; lane: number; top: THREE.Vector3; lastShot: number }[] = []
    layout.laneX.forEach((_lx, lane) => {
      const sx = lane === 0 ? -layout.towerSpreadX : layout.towerSpreadX
      list.push({ owner: 'blue', lane, top: new THREE.Vector3(sx, 1.35, layout.blueTowerZ), lastShot: 0 })
      list.push({ owner: 'red', lane, top: new THREE.Vector3(sx, 1.35, layout.redTowerZ), lastShot: 0 })
    })
    return list
  }, [layout])

  const spawn = (owner: 'blue' | 'red') => {
    if (!sceneRef.current) return
    const army = owner === 'blue' ? BLUE_ARMY : RED_ARMY
    const idxRef = owner === 'blue' ? blueIdx : redIdx
    const name = army[idxRef.current % army.length]
    idxRef.current++
    const slot = idxRef.current
    const lane = slot % layout.laneX.length
    // alternate left/right within a lane so units pair up side-by-side (group fights: 2v2, 2v1)
    const side = (Math.floor(slot / layout.laneX.length) % 2 === 0 ? -1 : 1) * LANE_SIDE
    const cd = charData[name]
    if (!cd) return

    const group = cloneWithUniqueMaterials(cd.scene)
    group.scale.setScalar(UNIT_SCALE)
    group.position.set(layout.laneX[lane] + side, 0, owner === 'blue' ? layout.blueTowerZ + 0.6 : layout.redTowerZ - 0.6)
    group.rotation.y = owner === 'blue' ? Math.PI : 0

    const mixer = new THREE.AnimationMixer(group)
    const walk = mixer.clipAction(cd.walk)
    const attack = mixer.clipAction(cd.attack)
    walk.timeScale = WALK_TIMESCALE
    walk.play()

    const { group: barGroup, fill } = createHealthBar(owner === 'blue' ? 0x3da5ff : 0xff5a4d)
    group.add(barGroup)
    sceneRef.current.add(group)

    unitsRef.current.push({ id: nextId.current++, owner, lane, group, mixer, walk, attack, state: 'walk', hp: UNIT_HP, lastAttack: 0, hpBar: fill })
  }

  const spawnProjectile = (from: THREE.Vector3, to: THREE.Vector3, targetId: number) => {
    if (!sceneRef.current) return
    const geo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6)
    geo.rotateX(Math.PI / 2)
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffea60 }))
    mesh.position.copy(from)
    sceneRef.current.add(mesh)
    projRef.current.push({ mesh, from: from.clone(), to: to.clone(), t: 0, dur: Math.max(0.22, from.distanceTo(to) / PROJECTILE_SPEED), targetId })
  }

  // nearest enemy directly ahead on the same lane, within engage range
  const enemyAhead = (u: Unit): Unit | null => {
    let best: Unit | null = null
    let bestD = Infinity
    for (const e of unitsRef.current) {
      if (e.owner === u.owner || e.lane !== u.lane || e.state === 'die') continue
      const d = u.owner === 'blue' ? u.group.position.z - e.group.position.z : e.group.position.z - u.group.position.z
      if (d >= -0.1 && d <= ENGAGE_RANGE && d < bestD) { bestD = d; best = e }
    }
    return best
  }
  // a unit besieges the enemy's forward lane tower when it gets there
  const atEnemyTower = (u: Unit) =>
    u.owner === 'blue'
      ? u.group.position.z <= layout.redTowerZ + BASE_RANGE
      : u.group.position.z >= layout.blueTowerZ - BASE_RANGE

  const toWalk = (u: Unit) => {
    if (u.state === 'walk') return
    u.attack.fadeOut(0.15)
    u.walk.reset().fadeIn(0.15).play()
    u.state = 'walk'
  }
  const toAttack = (u: Unit) => {
    if (u.state === 'attack') return
    u.walk.fadeOut(0.15)
    u.attack.reset().fadeIn(0.15).play()
    u.state = 'attack'
  }
  const kill = (u: Unit) => {
    if (u.state === 'die') return
    u.walk.stop()
    u.attack.stop()
    u.state = 'die'
  }

  useEffect(() => {
    spawn('blue')
    spawn('red')
    const units = unitsRef.current
    const projs = projRef.current
    return () => {
      units.forEach((u) => { u.mixer.stopAllAction(); u.group.parent?.remove(u.group) })
      projs.forEach((p) => p.mesh.parent?.remove(p.mesh))
      unitsRef.current = []
      projRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime
    // static — no camera sway
    const alive = (o: 'blue' | 'red') => unitsRef.current.filter((u) => u.owner === o && u.state !== 'die').length

    blueTimer.current += delta
    if (blueTimer.current >= SPAWN_BLUE) { blueTimer.current = 0; if (alive('blue') < ARMY_CAP) spawn('blue') }
    redTimer.current += delta
    if (redTimer.current >= SPAWN_RED) { redTimer.current = 0; if (alive('red') < ARMY_CAP) spawn('red') }

    for (const u of unitsRef.current) {
      u.mixer.update(delta)
      u.hpBar.scale.x = Math.max(0.001, u.hp / UNIT_HP)
      u.hpBar.position.x = -0.25 + 0.25 * (u.hp / UNIT_HP)
      u.hpBar.parent!.lookAt(state.camera.position)

      if (u.state === 'die') {
        u.group.position.y -= delta * 1.0
        u.group.scale.multiplyScalar(0.92)
        u.group.rotation.x += delta * 0.9
        if (u.group.scale.x < 0.06) u.group.visible = false
        continue
      }

      const foe = enemyAhead(u)
      const siege = !foe && atEnemyTower(u)
      if (foe || siege) {
        toAttack(u)
        if (now - u.lastAttack > ATTACK_INTERVAL) {
          u.lastAttack = now
          if (foe) { foe.hp -= UNIT_DMG; if (foe.hp <= 0) kill(foe) }
        }
      } else {
        toWalk(u)
        u.group.position.z += (u.owner === 'blue' ? -1 : 1) * UNIT_SPEED
      }
    }

    unitsRef.current = unitsRef.current.filter((u) => {
      if (u.group.visible === false) { u.mixer.stopAllAction(); u.group.parent?.remove(u.group); return false }
      return true
    })

    // Lane towers (both sides) fire at the nearest enemy unit on their lane within range
    for (const t of towers) {
      const targets = unitsRef.current.filter((u) => u.owner !== t.owner && u.state !== 'die' && u.lane === t.lane)
      if (!targets.length) continue
      const target = targets.reduce((b, u) =>
        Math.abs(u.group.position.z - t.top.z) < Math.abs(b.group.position.z - t.top.z) ? u : b)
      if (Math.abs(target.group.position.z - t.top.z) <= TOWER_RANGE && now - t.lastShot > ARROW_COOLDOWN) {
        t.lastShot = now
        spawnProjectile(t.top, target.group.position.clone().add(new THREE.Vector3(0, 0.5, 0)), target.id)
      }
    }

    projRef.current = projRef.current.filter((p) => {
      p.t += delta / p.dur
      if (p.t >= 1) {
        const u = unitsRef.current.find((x) => x.id === p.targetId)
        if (u && u.state !== 'die') { u.hp -= ARROW_DMG; if (u.hp <= 0) kill(u) }
        p.mesh.parent?.remove(p.mesh)
        return false
      }
      const pos = new THREE.Vector3().lerpVectors(p.from, p.to, p.t)
      pos.y += Math.sin(p.t * Math.PI) * 0.45
      p.mesh.position.copy(pos)
      p.mesh.lookAt(p.to)
      return true
    })
  })

  return (
    <group ref={sceneRef}>
      <Battlefield layout={layout} models={models} />

      {/* Traders (blue) — king + 2 lane towers flanking it, front end */}
      <group position={[0, 0.1, layout.blueKingZ]} rotation={[0, Math.PI, 0]} scale={1.15}>
        <primitive object={castleBlueScene.clone()} />
      </group>
      <primitive object={towerBlueScene.clone()} position={[-layout.towerSpreadX, 0.05, layout.blueTowerZ]} scale={0.95} />
      <primitive object={towerBlueScene.clone()} position={[layout.towerSpreadX, 0.05, layout.blueTowerZ]} scale={0.95} />

      {/* Jeets (red) — king + 2 lane towers flanking it, back end */}
      <group position={[0, 0.1, layout.redKingZ]} scale={1.15}>
        <primitive object={castleRedScene.clone()} />
      </group>
      <primitive object={towerRedScene.clone()} position={[-layout.towerSpreadX, 0.05, layout.redTowerZ]} scale={0.95} />
      <primitive object={towerRedScene.clone()} position={[layout.towerSpreadX, 0.05, layout.redTowerZ]} scale={0.95} />
    </group>
  )
}

export function BattlePreview() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 680 }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.8]}
        shadows
        camera={{ position: [8, 7, 8], fov: 33, near: 0.1, far: 100 }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <fog attach="fog" args={['#0b0e14', 22, 60]} />
        {/* warm gold key + cool rim */}
        <ambientLight intensity={1.05} color="#b6c4dc" />
        <directionalLight position={[-5, 9, 6]} intensity={2.9} color="#ffe6b0" castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[6, 5, -6]} intensity={1.0} color="#5f7fc8" />
        <spotLight position={[4, 8, 5]} angle={0.55} penumbra={0.9} intensity={45} color="#e8c158" castShadow />
        <Suspense fallback={null}>
          <Bounds fit clip margin={0.55}>
            <PreviewScene />
          </Bounds>
          <ContactShadows position={[0, -0.04, 0]} opacity={0.45} scale={22} blur={2.8} far={7} color="#000000" />
        </Suspense>
      </Canvas>
    </div>
  )
}
