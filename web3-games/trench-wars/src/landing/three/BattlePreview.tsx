import { Suspense, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
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
const MTN_A_URL = `${K}/mountain_A_grass_trees.gltf`
const MTN_B_URL = `${K}/mountain_B_grass_trees.gltf`
const MTN_C_URL = `${K}/mountain_C_grass_trees.gltf`
const HILLS_TREES_URL = `${K}/hills_A_trees.gltf`
const HILL_A_URL = `${K}/hill_single_A.gltf`
const HILL_B_URL = `${K}/hill_single_B.gltf`
const HILL_C_URL = `${K}/hill_single_C.gltf`
// Village buildings for the surrounding shore — plain hamlet dressing.
const HOME_A_GREEN_URL = `${K}/building_home_A_green.gltf`
const HOME_A_YELLOW_URL = `${K}/building_home_A_yellow.gltf`
const HOME_B_RED_URL = `${K}/building_home_B_red.gltf`
const HOME_B_BLUE_URL = `${K}/building_home_B_blue.gltf`
const WINDMILL_URL = `${K}/building_windmill_red.gltf`
const WELL_URL = `${K}/building_well_green.gltf`
const MARKET_URL = `${K}/building_market_yellow.gltf`
const TAVERN_URL = `${K}/building_tavern_red.gltf`

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
  MTN_A_URL, MTN_B_URL, MTN_C_URL, HILLS_TREES_URL, HILL_A_URL, HILL_B_URL, HILL_C_URL,
  HOME_A_GREEN_URL, HOME_A_YELLOW_URL, HOME_B_RED_URL, HOME_B_BLUE_URL,
  WINDMILL_URL, WELL_URL, MARKET_URL, TAVERN_URL,
]
// Lush flora pool (KayKit Forest Nature + Medieval) scattered across the grass for a
// dense, textured Clash-Royale look. `s` is each model's base world scale.
const FLORA: { n: string; s: number }[] = [
  { n: 'Bush_1_C_Color1', s: 0.5 }, { n: 'Bush_2_B_Color1', s: 0.55 }, { n: 'Bush_3_A_Color1', s: 0.5 },
  { n: 'Bush_4_C_Color1', s: 0.5 }, { n: 'Bush_1_F_Color1', s: 0.45 }, { n: 'Bush_2_E_Color1', s: 0.5 },
  { n: 'Grass_1_A_Singlesided_Color1', s: 0.6 }, { n: 'Grass_2_B_Singlesided_Color1', s: 0.6 }, { n: 'Grass_1_C_Singlesided_Color1', s: 0.55 },
  { n: 'Tree_2_A_Color1', s: 0.5 }, { n: 'Tree_3_B_Color1', s: 0.45 }, { n: 'Tree_1_C_Color1', s: 0.5 },
  { n: 'Rock_1_A_Color1', s: 0.5 }, { n: 'Rock_1_H_Color1', s: 0.5 }, { n: 'Rock_2_C_Color1', s: 0.5 }, { n: 'Rock_3_E_Color1', s: 0.5 },
]
const FLORA_URLS = FLORA.map((f) => `${K}/${f.n}.gltf`)

// deterministic PRNG so the scatter is stable across renders / HMR
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

;[...ENV_URLS, ...FLORA_URLS, ...WALK_URLS, ...ATTACK_URLS].forEach((u) => useGLTF.preload(u))

// ---- board geometry ----
const COLS = [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8]
const ROWS = 30
const RIVER_ROW = 14
const TARGET_TILE_W = 0.9
const TILE_OVERLAP = 1.06
const SURFACE_Y = 0.06
const WATER_DROP = -0.16 // river-row tiles sink into a channel (in-game look — no flat-plane z-fighting)

// ---- combat / animation ----
const UNIT_SCALE = 0.95 // fixed scale (skinned-mesh bounding boxes are unreliable; roster is baked uniformly)
const UNIT_SPEED = 0.013 // slow, deliberate march
const WALK_TIMESCALE = 0.85 // play the walk cycle a touch slower so feet don't slide
const LANE_SIDE = 0.34 // lateral offset so two units stand side-by-side in a lane
const ENGAGE_RANGE = 0.62 // z-gap at which two enemies stop and fight
const BASE_RANGE = 0.95 // z-gap at which a unit starts hitting the enemy base
const UNIT_HP = 380 // high HP -> fights last a good while
const UNIT_DMG = 15
const ATTACK_INTERVAL = 0.6
const ARMY_CAP = 2 // per side — only a couple units at a time (much fewer)
const SPAWN_BLUE = 6.5
const SPAWN_RED = 7.5
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
  stepA: number
  stepB: number
  frontZraw: number
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
    laneX: [-stepA * 3.4, stepA * 3.4], // lanes run straight into the side (princess) towers
    laneWidth: stepA * 2.0,
    frontZ,
    backZ,
    // symmetric arena: a king at each end, two lane towers pulled back near each
    // king and spread wide to flank it
    blueKingZ: worldZ(2.5),
    redKingZ: worldZ(ROWS - 3.5),
    blueTowerZ: worldZ(5),
    redTowerZ: worldZ(ROWS - 6),
    towerSpreadX: stepA * 3.4, // == laneX so each lane tower sits at the end of its lane
    castleZ: backZ, // alias kept for prop placement (red side)
    campZ: frontZ, // alias kept for prop placement (blue side)
    riverZ: worldZ(RIVER_ROW),
    riverWidth: stepB * 3.3, // thicker river (3 rows of water)
    edgeX,
    stepA,
    stepB,
    frontZraw: frontZ,
  }
}

/**
 * Strip horizontal root motion from a clip so it plays IN PLACE — otherwise the baked
 * forward translation drifts the model then snaps back when the clip loops ("teleport").
 * Holds each .position track's X/Z at its first frame (keeps vertical bob).
 */
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

function Battlefield({ layout, models, flora }: { layout: Layout; models: Record<string, THREE.Group>; flora: { scene: THREE.Group; base: number }[] }) {
  const laneLength = layout.frontZ - layout.castleZ + 0.4
  const laneMidZ = (layout.frontZ + layout.castleZ) / 2 + 0.2

  // Dense flora scattered on grass tiles (avoids lanes, river, structures) — the textured look.
  const scattered = useMemo(() => {
    if (!flora.length) return [] as { i: number; x: number; z: number; rot: number; s: number }[]
    const rnd = mulberry32(20260616)
    const out: { i: number; x: number; z: number; rot: number; s: number }[] = []
    const grass = layout.cells.filter((c) => !c.water)
    const nearLane = (x: number) => layout.laneX.some((lx) => Math.abs(x - lx) < layout.laneWidth * 0.62)
    const nearStruct = (x: number, z: number) =>
      ((Math.abs(z - layout.blueKingZ) < 2.4 || Math.abs(z - layout.redKingZ) < 2.4) && Math.abs(x) < 1.8) ||
      ((Math.abs(z - layout.blueTowerZ) < 1.6 || Math.abs(z - layout.redTowerZ) < 1.6) &&
        layout.laneX.some((lx) => Math.abs(x - lx) < 1.6))
    let tries = 0
    while (out.length < 70 && tries < 600) {
      tries++
      const cell = grass[Math.floor(rnd() * grass.length)]
      const x = cell.x + (rnd() - 0.5) * 0.55
      const z = cell.z + (rnd() - 0.5) * 0.55
      if (nearLane(x) || nearStruct(x, z)) continue
      if (Math.abs(z - layout.riverZ) < layout.riverWidth * 0.6) continue
      out.push({ i: Math.floor(rnd() * flora.length), x, z, rot: rnd() * Math.PI * 2, s: 0.8 + rnd() * 0.6 })
    }
    return out
  }, [layout, flora])

  const props = useMemo<PropPlacement[]>(() => {
    const ex = layout.edgeX * 0.9
    const span = layout.frontZ
    const cz = layout.castleZ
    const camp = layout.campZ
    return [
      // big landmark tree at the far corner (back-left, furthest from camera)
      { m: 'treesLarge', pos: [-ex * 1.04, 0, -span * 0.96], rot: 0.6, s: 1.35 },
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

      {/* lush flora scatter */}
      {scattered.map((f, i) => (
        <primitive
          key={`flora-${i}`}
          object={flora[f.i].scene.clone()}
          position={[f.x, 0, f.z]}
          rotation={[0, f.rot, 0]}
          scale={flora[f.i].base * f.s * 0.22}
        />
      ))}
    </group>
  )
}

/** The world OUTSIDE the playable field — a grass apron, then a horizon of mountains,
 * hills and forest so the arena sits in a landscape instead of floating in the void. */
function Surroundings({ layout, models, flora }: { layout: Layout; models: Record<string, THREE.Group>; flora: { scene: THREE.Group; base: number }[] }) {
  const gen = useMemo(() => {
    const { stepA, stepB, frontZ, edgeX } = layout
    const ts = layout.cells[0]?.scale ?? 0.4
    const rnd = mulberry32(99)

    // Field footprint (rect centred at origin; field spans z in [-frontZ, frontZ]).
    const fx = edgeX + stepA * 0.7
    const fz = frontZ + stepB * 0.7
    const moatW = stepB * 2.4 // moat channel width
    const mx = fx + moatW
    const mz = fz + moatW

    // Blobby island outline — organic coast, NOT a clean ellipse/hex grid.
    const Rx = edgeX + stepA * 7.5
    const Rz = frontZ + stepB * 8
    const blob = (a: number) =>
      1 + 0.1 * Math.sin(a * 3 + 0.6) + 0.06 * Math.cos(a * 5 + 1.2) + 0.05 * Math.sin(a * 2 - 0.4)
    const islandPt = (a: number): [number, number] => [Math.cos(a) * Rx * blob(a), Math.sin(a) * Rz * blob(a)]
    const inIsland = (x: number, z: number) => {
      const a = Math.atan2(z, x)
      const b = blob(a)
      return (x * x) / (Rx * Rx * b * b) + (z * z) / (Rz * Rz * b * b) < 0.92
    }
    const onShore = (x: number, z: number) =>
      inIsland(x, z) && (Math.abs(x) > mx * 1.03 || Math.abs(z) > mz * 1.03)

    // Build shape outlines in world (x,z); map to Vector2(x,-z) so a mesh rotated
    // [-π/2,0,0] lays it flat with shape→world (x,0,z).
    const v = (x: number, z: number) => new THREE.Vector2(x, -z)
    const rrect = (hw: number, hh: number, r: number): THREE.Vector2[] => {
      const pts: THREE.Vector2[] = []
      const steps = 7
      const corners: [number, number, number][] = [
        [hw - r, hh - r, 0],
        [-(hw - r), hh - r, Math.PI / 2],
        [-(hw - r), -(hh - r), Math.PI],
        [hw - r, -(hh - r), Math.PI * 1.5],
      ]
      for (const [cx, cz, a0] of corners)
        for (let s = 0; s <= steps; s++) {
          const a = a0 + (s / steps) * (Math.PI / 2)
          pts.push(v(cx + r * Math.cos(a), cz + r * Math.sin(a)))
        }
      return pts
    }
    const islandLoop: THREE.Vector2[] = []
    for (let s = 0; s < 96; s++) {
      const [x, z] = islandPt((s / 96) * Math.PI * 2)
      islandLoop.push(v(x, z))
    }

    const islandShape = new THREE.Shape(islandLoop)
    const shoreShape = new THREE.Shape(islandLoop)
    shoreShape.holes.push(new THREE.Path(rrect(mx, mz, moatW * 0.9)))
    const moatShape = new THREE.Shape(rrect(mx, mz, moatW * 0.9))
    moatShape.holes.push(new THREE.Path(rrect(fx, fz, Math.min(fx, fz) * 0.5)))

    const decor: { m: string; x: number; z: number; rot: number; s: number; y: number }[] = []
    const mtns = ['mountainA', 'mountainB', 'mountainC']
    // Dense, continuous mountain rim hugging the organic coast — the circle barrier.
    const N = 64
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2 + (rnd() - 0.5) * 0.05
      const rr = 0.97 + rnd() * 0.1
      const [x, z] = islandPt(a)
      decor.push({ m: mtns[Math.floor(rnd() * 3)], x: x * rr, z: z * rr, rot: rnd() * Math.PI * 2, s: ts * (2.8 + rnd() * 3.0), y: -0.18 })
    }
    // Distant taller range behind (far -Z, toward the nav) for layered depth.
    for (let i = -9; i <= 9; i++)
      decor.push({ m: mtns[Math.floor(rnd() * 3)], x: i * stepA * 1.5 + (rnd() - 0.5) * stepA, z: -Rz - stepB * (2 + rnd() * 7), rot: rnd() * Math.PI * 2, s: ts * (4.5 + rnd() * 4.5), y: -0.28 })

    // Shore band: forest clusters + hills + rocks between moat and mountains.
    let tries = 0
    let placed = 0
    while (placed < 120 && tries < 1400) {
      tries++
      const a = rnd() * Math.PI * 2
      const rr = 0.3 + rnd() * 0.62
      const [ex, ez] = islandPt(a)
      const x = ex * rr
      const z = ez * rr
      if (!onShore(x, z)) continue
      placed++
      const r = rnd()
      if (r < 0.3) decor.push({ m: 'hillsTrees', x, z, rot: rnd() * Math.PI * 2, s: ts * (1.5 + rnd() * 1.4), y: -0.05 })
      else if (r < 0.62) decor.push({ m: 'treesLarge', x, z, rot: rnd() * Math.PI * 2, s: ts * (1.3 + rnd() * 1.2), y: -0.04 })
      else if (r < 0.8) decor.push({ m: ['hillA', 'hillB', 'hillC'][Math.floor(rnd() * 3)], x, z, rot: rnd() * Math.PI * 2, s: ts * (1.4 + rnd() * 1.1), y: -0.04 })
      else decor.push({ m: 'rock', x, z, rot: rnd() * Math.PI * 2, s: ts * (1.0 + rnd() * 1.2), y: -0.05 })
    }

    // Outlying VILLAGES beyond the mountain barrier — little hamlets on their own
    // ground patches, filling the empty space outside the circle.
    const homes = ['homeAGreen', 'homeAYellow', 'homeBRed', 'homeBBlue']
    const villages: { x: number; z: number; r: number }[] = []
    const NV = 7
    for (let k = 0; k < NV; k++) {
      // fan across the front + sides (toward the camera) where the void sits
      const a = -0.2 * Math.PI + (k / (NV - 1)) * 1.4 * Math.PI + (rnd() - 0.5) * 0.18
      const rr = 1.34 + rnd() * 0.3 // OUTSIDE the mountain ring
      const [ex, ez] = islandPt(a)
      const cx = ex * rr
      const cz = ez * rr
      const patchR = stepA * (2.4 + rnd() * 1.3)
      villages.push({ x: cx, z: cz, r: patchR })
      // a cluster of homes on the patch
      const homeN = 2 + Math.floor(rnd() * 3)
      for (let h = 0; h < homeN; h++) {
        const ha = rnd() * Math.PI * 2
        const hd = rnd() * patchR * 0.55
        decor.push({ m: homes[Math.floor(rnd() * homes.length)], x: cx + Math.cos(ha) * hd, z: cz + Math.sin(ha) * hd, rot: rnd() * Math.PI * 2, s: 0.58 + rnd() * 0.22, y: -0.05 })
      }
      // a landmark building per village
      const lm = ['windmill', 'market', 'tavern', 'well'][Math.floor(rnd() * 4)]
      decor.push({ m: lm, x: cx + (rnd() - 0.5) * patchR * 0.4, z: cz + (rnd() - 0.5) * patchR * 0.4, rot: rnd() * Math.PI * 2, s: 0.7 + rnd() * 0.2, y: -0.05 })
      // small plants + props around the hamlet
      for (let p = 0; p < 5; p++) {
        const pa = rnd() * Math.PI * 2
        const pd = patchR * (0.45 + rnd() * 0.45)
        const prop = ['tree', 'treesMed', 'rock', 'barrel', 'crateBig', 'sack'][Math.floor(rnd() * 6)]
        decor.push({ m: prop, x: cx + Math.cos(pa) * pd, z: cz + Math.sin(pa) * pd, rot: rnd() * Math.PI * 2, s: ts * (0.8 + rnd() * 0.7), y: -0.05 })
      }
    }
    // Moat dressing — lilies/reeds floating in the channel.
    for (let k = 0; k < 28; k++) {
      const a = rnd() * Math.PI * 2
      const rw = (fx + mx) / 2 + (rnd() - 0.5) * moatW * 0.5
      const rh = (fz + mz) / 2 + (rnd() - 0.5) * moatW * 0.5
      decor.push({ m: rnd() < 0.5 ? 'waterlily' : 'waterplant', x: Math.cos(a) * rw, z: Math.sin(a) * rh, rot: rnd() * Math.PI * 2, s: ts * (0.7 + rnd() * 0.5), y: -0.13 })
    }

    // Flora scatter on the shore (bushes / grass tufts / small trees) for density.
    const floraPlace: { i: number; x: number; z: number; rot: number; s: number }[] = []
    let ft = 0
    while (flora.length && floraPlace.length < 90 && ft < 1200) {
      ft++
      const a = rnd() * Math.PI * 2
      const rr = 0.3 + rnd() * 0.6
      const [ex, ez] = islandPt(a)
      const x = ex * rr
      const z = ez * rr
      if (!onShore(x, z)) continue
      floraPlace.push({ i: Math.floor(rnd() * flora.length), x, z, rot: rnd() * Math.PI * 2, s: 0.9 + rnd() * 0.9 })
    }

    // A couple of small ponds on the shore for water variety.
    const ponds: { x: number; z: number; rx: number; rz: number }[] = []
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.7
      const [ex, ez] = islandPt(a)
      const x = ex * 0.58
      const z = ez * 0.58
      if (onShore(x, z)) ponds.push({ x, z, rx: stepA * (1.2 + rnd()), rz: stepB * (1.4 + rnd()) })
    }

    const road = { z: -Rz + stepB * 2.5, len: 9 * stepB, w: stepA * 1.6 }
    return { islandShape, shoreShape, moatShape, decor, floraPlace, ponds, road, villages }
  }, [layout, flora])

  return (
    <group>
      {/* Underside fill — below the river (WATER_DROP) so the river water still shows;
          fills any void under the board. */}
      <mesh position={[0, WATER_DROP - 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[gen.islandShape]} />
        <meshStandardMaterial color="#4f5f28" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Moat water ring hugging the field — one connected water system with the river. */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[gen.moatShape]} />
        <meshStandardMaterial color="#2f7fa6" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Shore land (field + moat cut out) sits just below field level. */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <shapeGeometry args={[gen.shoreShape]} />
        <meshStandardMaterial color="#86a63a" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {gen.ponds.map((p, i) => (
        <mesh key={`pond-${i}`} position={[p.x, -0.09, p.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[p.rx, p.rz, 1]}>
          <circleGeometry args={[1, 26]} />
          <meshStandardMaterial color="#2f6f8f" roughness={0.45} />
        </mesh>
      ))}
      {/* Outlying village ground patches beyond the mountains — little island plateaus
          so the hamlets sit on land instead of floating in the void. */}
      {gen.villages.map((vlg, i) => (
        <group key={`vpatch-${i}`}>
          <mesh position={[vlg.x, -0.08, vlg.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[vlg.r, vlg.r * 0.82, 1]} receiveShadow>
            <circleGeometry args={[1, 30]} />
            <meshStandardMaterial color="#86a63a" roughness={1} />
          </mesh>
          <mesh position={[vlg.x, -0.34, vlg.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[vlg.r * 1.12, vlg.r * 0.94, 1]}>
            <circleGeometry args={[1, 30]} />
            <meshStandardMaterial color="#4f5f28" roughness={1} />
          </mesh>
        </group>
      ))}
      {/* Road winding out to the mountains. */}
      <mesh position={[0, -0.03, gen.road.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[gen.road.w, gen.road.len]} />
        <meshStandardMaterial color="#a8824c" roughness={1} />
      </mesh>
      {gen.decor.map((d, i) => (
        <primitive key={`surr-${i}`} object={models[d.m].clone()} position={[d.x, d.y, d.z]} rotation={[0, d.rot, 0]} scale={d.s} />
      ))}
      {gen.floraPlace.map((f, i) => (
        <primitive
          key={`sflora-${i}`}
          object={flora[f.i].scene.clone()}
          position={[f.x, -0.04, f.z]}
          rotation={[0, f.rot, 0]}
          scale={flora[f.i].base * f.s * 0.22}
        />
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
    mountainA: useClonedScene(MTN_A_URL),
    mountainB: useClonedScene(MTN_B_URL),
    mountainC: useClonedScene(MTN_C_URL),
    hillsTrees: useClonedScene(HILLS_TREES_URL),
    hillA: useClonedScene(HILL_A_URL),
    hillB: useClonedScene(HILL_B_URL),
    hillC: useClonedScene(HILL_C_URL),
    homeAGreen: useClonedScene(HOME_A_GREEN_URL),
    homeAYellow: useClonedScene(HOME_A_YELLOW_URL),
    homeBRed: useClonedScene(HOME_B_RED_URL),
    homeBBlue: useClonedScene(HOME_B_BLUE_URL),
    windmill: useClonedScene(WINDMILL_URL),
    well: useClonedScene(WELL_URL),
    market: useClonedScene(MARKET_URL),
    tavern: useClonedScene(TAVERN_URL),
  }

  // Flora scatter pool — dense bushes/grass/trees/rocks for the textured look
  const floraGlbs = useGLTF(FLORA_URLS)
  const floraPool = useMemo(
    () =>
      floraGlbs.map((g, i) => {
        const scene = cloneSkeleton(g.scene as THREE.Group) as THREE.Group
        scene.traverse((o) => {
          const m = o as THREE.Mesh
          if (m.isMesh) {
            m.castShadow = true
            m.receiveShadow = true
            const mat = m.material as (THREE.Material & { side?: THREE.Side }) | undefined
            if (mat) mat.side = THREE.DoubleSide
          }
        })
        return { scene, base: FLORA[i].s }
      }),
    [floraGlbs],
  )

  const walkGlbs = useGLTF(WALK_URLS)
  const attackGlbs = useGLTF(ATTACK_URLS)
  const charData = useMemo(() => {
    const map: Record<string, { scene: THREE.Group; walk: THREE.AnimationClip; attack: THREE.AnimationClip }> = {}
    CHAR_NAMES.forEach((name, i) => {
      const scene = cloneWithUniqueMaterials(walkGlbs[i].scene as THREE.Group)
      map[name] = { scene, walk: deRoot(walkGlbs[i].animations[0]), attack: deRoot(attackGlbs[i].animations[0]) }
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
      <Surroundings layout={layout} models={models} flora={floraPool} />
      <Battlefield layout={layout} models={models} flora={floraPool} />

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

function CameraRig() {
  const { camera } = useThree()
  useEffect(() => {
    camera.lookAt(0, 0.5, 0)
  }, [camera])
  return null
}

export function BattlePreview() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 680, transform: 'translateY(-12%)' }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.8]}
        shadows
        camera={{ position: [21, 17.5, 21], fov: 33, near: 0.1, far: 220 }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <CameraRig />
        <fog attach="fog" args={['#0b0e14', 30, 95]} />
        {/* warm gold key + cool rim */}
        <ambientLight intensity={1.05} color="#b6c4dc" />
        <directionalLight position={[-5, 9, 6]} intensity={2.9} color="#ffe6b0" castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[6, 5, -6]} intensity={1.0} color="#5f7fc8" />
        <spotLight position={[4, 8, 5]} angle={0.55} penumbra={0.9} intensity={45} color="#e8c158" castShadow />
        <Suspense fallback={null}>
          <PreviewScene />
          <ContactShadows position={[0, -0.04, 0]} opacity={0.45} scale={40} blur={2.8} far={8} color="#000000" />
        </Suspense>
      </Canvas>
    </div>
  )
}
