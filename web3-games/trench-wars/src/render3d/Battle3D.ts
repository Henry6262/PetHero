import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { ARENA_H, ARENA_W, RIVER_Y, LANE_LEFT_X, LANE_RIGHT_X } from '../sim/constants'
import { getCard } from '../sim/cards'
import type { SimState, UnitEntity, Tower } from '../sim/types'

/**
 * Real-3D battle renderer. Owns a WebGL canvas positioned underneath the
 * (transparent) Phaser canvas. The sim stays the source of truth — this class
 * only visualizes SimState, mirroring the old SpriteRenderer contract.
 *
 * sim coords: x ∈ [0, ARENA_W], y ∈ [0, ARENA_H], y grows toward the enemy.
 * world coords: x = simX - ARENA_W/2, z = RIVER_Y - simY (player 0 at +z).
 */

const ARENA_PX_W = 782
const ARENA_PX_H = 960

// Which character model plays each unit card. Seven distinct rigs spread across the roster.
export const CARD_CHAR: Record<string, CharName> = {
  'jeet-horde': 'pepe',         // pepe "STOP BEING POOR" — the quintessential jeet swarm
  'exit-liquidity': 'pepe',     // rekt retail mob
  'bag-holder': 'bluemob',      // sad-sack holder
  'paper-hands': 'bluemob',     // panicky, flees
  'chad-trader': 'degen',       // degen in black + shades, the gigachad
  'rug-dev': 'degen',           // anonymous hoodie dev
  'diamond-hands': 'phoenix',   // huge fiery tank
  'whale': 'phoenix',           // the boss
  'mev-bots': 'vanguard',       // techy armored swarm
  'sniper-bot': 'vanguard',     // military marksman
  'fud-spirit': 'crimson',      // dark, spooky caster
  'influencer': 'explorer',     // flashy youth
  'scalper': 'explorer',        // cheap fast cycle
  'discord-raid': 'pepe',       // cheap swarm
  'moon-boy': 'degen',          // win-condition charger
  // trading-bot is a building → rendered as a structure, no character
  'airdrop': 'phoenix',         // fiery flyer
  'fomo-jet': 'crimson',        // flying splash mage
  'gigachad': 'degen',          // big bruiser
  'sailor-cat': 'gake',         // tanky support cat
  'fomo-mob': 'pepe',           // fast swarm
  'shadow-dev': 'explorer',     // stealth assassin
  'degen-titan': 'vanguard',    // massive tank
  'mev-overlord': 'crimson',    // splash mage
  'based-brawlers': 'degen',    // lifesteal swarm
  'mert': 'mert',               // golden-armored bull trader
  'ansem': 'ansem',             // hooded assassin
  'toly': 'toly',               // architect support
  'sbf': 'sbf',                 // final boss of rugs
  'vucan': 'vucan',             // ranged archer
}

/** Portrait filename (no extension) for each card in the deck builder. */
export const CARD_PORTRAIT: Record<string, string> = {
  ...CARD_CHAR,
}

export type CharName = 'vanguard' | 'explorer' | 'crimson' | 'pepe' | 'bluemob' | 'degen' | 'phoenix' | 'gake' | 'ansem' | 'sbf' | 'mert' | 'toly' | 'vucan'

interface CharAsset {
  scene: THREE.Group
  walkClip: THREE.AnimationClip
  attackClip: THREE.AnimationClip
  height: number
}

interface UnitView {
  group: THREE.Group
  mixer?: THREE.AnimationMixer
  walk?: THREE.AnimationAction
  attack?: THREE.AnimationAction
  target: THREE.Vector3
  lastCooldown: number
  moving: boolean
  isBuilding?: boolean
  flyHeight?: number
  /** True while the attack animation is playing and should not be interrupted by movement. */
  attacking?: boolean
}

interface TowerView {
  group: THREE.Group
  lastCooldown: number
}

interface Projectile {
  mesh: THREE.Mesh
  from: THREE.Vector3
  to: THREE.Vector3
  t: number
  dur: number
}

interface DyingUnit {
  group: THREE.Group
  t: number
}

interface Meteor {
  mesh: THREE.Mesh
  ring: THREE.Mesh
  x: number
  z: number
  t: number
  landed: boolean
}

const toWorld = (simX: number, simY: number, out = new THREE.Vector3()) =>
  out.set(simX - ARENA_W / 2, 0, RIVER_Y - simY)

export class Battle3D {
  readonly canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private loader = new GLTFLoader()
  private chars: Partial<Record<CharName, CharAsset>> = {}
  private buildings: Record<string, THREE.Group> = {}
  private deco: Record<string, THREE.Group> = {}
  private tileScale = 1
  private units = new Map<number, UnitView>()
  private towers = new Map<number, TowerView>()
  private ray = new THREE.Raycaster()
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private tmpV = new THREE.Vector3()
  private projectiles: Projectile[] = []
  private dying: DyingUnit[] = []
  private meteors: Meteor[] = []
  private shakeAmp = 0
  private clock = 0
  private camBase = new THREE.Vector3()
  /** Set by the host scene to hear projectile launches (for SFX). */
  onProjectile?: () => void
  ready = false

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.inset = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.pointerEvents = 'none'

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(ARENA_PX_W, ARENA_PX_H, false)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap

    this.scene.background = new THREE.Color(0x0a0e14)
    this.scene.fog = new THREE.Fog(0x0a0e14, 55, 90)

    this.camera = new THREE.PerspectiveCamera(44, ARENA_PX_W / ARENA_PX_H, 1, 200)
    this.camera.position.set(0, 29, 22)
    this.camera.lookAt(0, 0, 1)
    this.camBase.copy(this.camera.position)

    const hemi = new THREE.HemisphereLight(0xbfd6ff, 0x33271a, 1.1)
    this.scene.add(hemi)
    const sun = new THREE.DirectionalLight(0xfff2d9, 2.2)
    sun.position.set(-14, 30, 12)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const cam = sun.shadow.camera
    cam.left = -16; cam.right = 16; cam.top = 22; cam.bottom = -22; cam.far = 80
    this.scene.add(sun)
  }

  async load(): Promise<void> {
    this.loader.setMeshoptDecoder(MeshoptDecoder)
    const glb = (url: string) => this.loader.loadAsync(url)
    const charNames: CharName[] = ['vanguard', 'explorer', 'crimson', 'pepe', 'bluemob', 'degen', 'phoenix', 'gake', 'ansem', 'sbf', 'mert', 'toly', 'vucan']
    const [grass, water, towerBlue, towerRed, castleBlue, castleRed, ...charGlbs] = await Promise.all([
      glb('/assets/3d/kaykit/hex_grass.gltf'),
      glb('/assets/3d/kaykit/hex_water.gltf'),
      glb('/assets/3d/kaykit/building_tower_A_blue.gltf'),
      glb('/assets/3d/kaykit/building_tower_A_red.gltf'),
      glb('/assets/3d/kaykit/building_castle_blue.gltf'),
      glb('/assets/3d/kaykit/building_castle_red.gltf'),
      ...charNames.flatMap((n) => [glb(`/assets/3d/chars/${n}/walk.glb`), glb(`/assets/3d/chars/${n}/attack.glb`)]),
    ])

    this.buildings = {
      'lane-0': towerBlue.scene, 'lane-1': towerRed.scene,
      'king-0': castleBlue.scene, 'king-1': castleRed.scene,
    }
    for (const g of Object.values(this.buildings)) {
      g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true } })
    }

    charNames.forEach((name, i) => {
      const walkGlb = charGlbs[i * 2]
      const attackGlb = charGlbs[i * 2 + 1]
      const scene = walkGlb.scene
      scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; (o as THREE.Mesh).frustumCulled = false } })
      const box = new THREE.Box3().setFromObject(scene)
      this.chars[name] = {
        scene,
        walkClip: walkGlb.animations[0],
        attackClip: attackGlb.animations[0],
        height: box.max.y - box.min.y || 1,
      }
    })

    const decoNames = [
      'trees_A_large', 'trees_B_medium', 'tree_single_A', 'tree_single_B',
      'rock_single_A', 'rock_single_C', 'hill_single_A', 'mountain_B_grass_trees',
      'waterlily_A', 'waterplant_A', 'flag_blue', 'flag_red',
    ]
    const decoGlbs = await Promise.all(decoNames.map((n) => glb(`/assets/3d/kaykit/${n}.gltf`)))
    decoNames.forEach((n, i) => {
      const s = decoGlbs[i].scene
      s.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true } })
      this.deco[n] = s
    })

    this.buildArena(grass.scene, water.scene)
    this.buildLanes()
    this.decorate()
    this.ready = true
  }

  private place(name: string, simX: number, simY: number, rotY = 0, mult = 1, y = 0) {
    const src = this.deco[name]
    if (!src) return
    const g = src.clone()
    g.scale.setScalar(this.tileScale * mult)
    toWorld(simX, simY, g.position)
    g.position.y = y
    g.rotation.y = rotY
    this.scene.add(g)
  }

  /** Worn dirt roads down both lanes, tower to tower across the bridges. */
  private buildLanes() {
    const mat = new THREE.MeshLambertMaterial({ color: 0x9a7748, transparent: true, opacity: 0.62 })
    for (const laneX of [LANE_LEFT_X, LANE_RIGHT_X]) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(1.7, ARENA_H - 8), mat)
      road.rotation.x = -Math.PI / 2
      toWorld(laneX, ARENA_H / 2, road.position)
      road.position.y = 0.02
      road.receiveShadow = true
      this.scene.add(road)

      // plank texture on the bridge section
      for (let i = -2; i <= 2; i++) {
        const plank = new THREE.Mesh(
          new THREE.BoxGeometry(2.1, 0.06, 0.32),
          new THREE.MeshLambertMaterial({ color: i % 2 ? 0x8c6b3d : 0x7a5c33 }),
        )
        toWorld(laneX, RIVER_Y + i * 0.4, plank.position)
        plank.position.y = 0.06
        plank.castShadow = true
        this.scene.add(plank)
      }
    }
  }

  /** Ghost disc shown while dragging a card over the arena. */
  private preview?: { group: THREE.Group; disc: THREE.MeshBasicMaterial; ring: THREE.MeshBasicMaterial }

  showDeployPreview(simX: number, simY: number, valid: boolean) {
    if (!this.preview) {
      const disc = new THREE.MeshBasicMaterial({ color: 0x44dd66, transparent: true, opacity: 0.3 })
      const ring = new THREE.MeshBasicMaterial({ color: 0x44dd66, transparent: true, opacity: 0.9 })
      const group = new THREE.Group()
      const d = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32), disc)
      d.rotation.x = -Math.PI / 2
      d.position.y = 0.05
      const r = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.14, 32), ring)
      r.rotation.x = -Math.PI / 2
      r.position.y = 0.06
      group.add(d, r)
      this.scene.add(group)
      this.preview = { group, disc, ring }
    }
    const color = valid ? 0x44dd66 : 0xee4444
    this.preview.disc.color.setHex(color)
    this.preview.ring.color.setHex(color)
    toWorld(simX, simY, this.preview.group.position)
    this.preview.group.visible = true
  }

  hideDeployPreview() {
    if (this.preview) this.preview.group.visible = false
  }

  /** Hand-placed battlefield dressing — edges and river only, never the play area. */
  private decorate() {
    // mountains framing each king tower, pushed off-board
    this.place('mountain_B_grass_trees', -2.2, 34.5, 0.4)
    this.place('mountain_B_grass_trees', 20.2, 34.8, 2.1)
    this.place('mountain_B_grass_trees', -2.4, -2.5, 1.2)
    this.place('mountain_B_grass_trees', 20.4, -2.8, 4.0)

    // forest belts hugging the very edges, outside the lanes (lanes are at ~2.8 / 15.2)
    const forest: [string, number][] = [
      ['trees_A_large', 6], ['trees_B_medium', 10], ['trees_A_large', 14],
      ['trees_B_medium', 18], ['trees_A_large', 22], ['trees_B_medium', 26],
    ]
    for (const [name, y] of forest) {
      this.place(name, 0.5, y, y * 1.7, 1.1)
      this.place(name, 17.5, y + 1.6, y * 2.3, 1.1)
    }

    // trees + rocks in the wide centre grass, kept off the king (x=9) and lanes
    this.place('tree_single_A', 6.0, 9.5, 0.7, 1.2)
    this.place('tree_single_B', 12.0, 11.5, 2.2, 1.2)
    this.place('tree_single_B', 6.2, 22.5, 4.1, 1.2)
    this.place('tree_single_A', 11.8, 20.5, 1.0, 1.2)
    this.place('rock_single_A', 7.0, 13.6, 0.3)
    this.place('rock_single_C', 11.5, 18.4, 2.8)
    this.place('rock_single_C', 0.8, 22.0, 1.4)
    this.place('rock_single_A', 17.2, 12.0, 5.2)

    // river life in the open water between the two bridges (centre band)
    this.place('waterlily_A', 5.5, RIVER_Y, 0.5, 1, -0.1)
    this.place('waterplant_A', 7.6, RIVER_Y + 0.2, 1.8, 1, -0.1)
    this.place('waterlily_A', 9.0, RIVER_Y - 0.2, 3.1, 1, -0.1)
    this.place('waterplant_A', 10.4, RIVER_Y + 0.1, 4.4, 1, -0.1)
    this.place('waterlily_A', 12.5, RIVER_Y, 2.0, 1, -0.1)

    // team flags flanking the lane towers (outer side, toward the borders)
    this.place('flag_blue', LANE_LEFT_X - 1.4, 4.6)
    this.place('flag_blue', LANE_RIGHT_X + 1.4, 4.6)
    this.place('flag_red', LANE_LEFT_X - 1.4, ARENA_H - 4.6)
    this.place('flag_red', LANE_RIGHT_X + 1.4, ARENA_H - 4.6)
  }

  private buildArena(grassTile: THREE.Group, waterTile: THREE.Group) {
    const box = new THREE.Box3().setFromObject(grassTile)
    const size = box.getSize(new THREE.Vector3())
    const flatTop = size.x > size.z
    const targetW = 1.55 // hex footprint in sim tiles — slight overlap hides seams
    const scale = targetW / Math.max(size.x, size.z)
    this.tileScale = scale

    const grassGeo = this.collapseTile(grassTile)
    const waterGeo = this.collapseTile(waterTile)
    const placements: { mat: THREE.Matrix4; water: boolean }[] = []

    const stepA = (flatTop ? size.x * 0.75 : size.x) * scale
    const stepB = (flatTop ? size.z : size.z * 0.75) * scale
    const margin = 3
    for (let row = -2; ; row++) {
      const simY = row * (flatTop ? stepB : stepB) // z step maps 1:1 to sim y units
      if (simY > ARENA_H + 2) break
      for (let col = -2; ; col++) {
        const simX = col * stepA + (flatTop ? 0 : (row % 2 ? stepA / 2 : 0))
        const offY = flatTop ? (col % 2 ? stepB / 2 : 0) : 0
        const y = simY + offY
        if (simX > ARENA_W + 2) break
        if (simX < -margin || y < -margin || y > ARENA_H + margin) continue
        const nearLane = Math.abs(simX - LANE_LEFT_X) < 1.4 || Math.abs(simX - LANE_RIGHT_X) < 1.4
        const isRiver = Math.abs(y - RIVER_Y) < 1.0 && !nearLane
        const pos = toWorld(simX, y)
        pos.y = isRiver ? -0.12 : 0
        const mat = new THREE.Matrix4().compose(
          pos,
          new THREE.Quaternion(),
          new THREE.Vector3(scale, scale, scale),
        )
        placements.push({ mat, water: isRiver })
      }
    }

    for (const [geo, water] of [[grassGeo, false], [waterGeo, true]] as const) {
      const subset = placements.filter((p) => p.water === water)
      if (!geo || subset.length === 0) continue
      const inst = new THREE.InstancedMesh(geo.geometry, geo.material, subset.length)
      subset.forEach((p, i) => inst.setMatrixAt(i, p.mat))
      inst.receiveShadow = true
      this.scene.add(inst)
    }
  }

  /** Flatten a single-tile GLTF into one geometry+material for instancing. */
  private collapseTile(tile: THREE.Group): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
    let found: { geometry: THREE.BufferGeometry; material: THREE.Material } | null = null
    tile.updateMatrixWorld(true)
    tile.traverse((o) => {
      const m = o as THREE.Mesh
      if (!found && m.isMesh) {
        const geometry = m.geometry.clone().applyMatrix4(m.matrixWorld)
        found = { geometry, material: m.material as THREE.Material }
      }
    })
    return found
  }

  /** Mount the 3D canvas into a positioned container (it fills it). */
  attach(container: HTMLElement) {
    container.appendChild(this.canvas)
  }

  detach() {
    this.canvas.remove()
  }

  /** Sync meshes to sim state. Call once per rendered frame. */
  sync(sim: SimState) {
    if (!this.ready) return
    this.lastSim = sim
    const aliveUnits = new Set<number>()
    for (const u of sim.units) {
      aliveUnits.add(u.id)
      this.syncUnit(u)
    }
    for (const [id, view] of this.units) {
      if (!aliveUnits.has(id)) {
        // shrink-and-sink death instead of popping out
        this.dying.push({ group: view.group, t: 0 })
        this.units.delete(id)
      }
    }
    for (const t of sim.towers) this.syncTower(t, sim)
  }

  private syncUnit(u: UnitEntity) {
    let view = this.units.get(u.id)
    if (!view) view = this.createUnit(u)
    toWorld(u.x, u.y, view.target)

    // hide enemy stealth units until revealed; dim own
    view.group.visible = u.revealed || u.owner === 0

    // attack fired this tick → cooldown jumped up
    if (u.cooldown > view.lastCooldown) {
      if (view.attack && view.walk) {
        view.attack.reset().play()
        view.walk.crossFadeTo(view.attack, 0.12, false)
        view.moving = false
        view.attacking = true
      }
      const range = getCard(u.cardId).range ?? 0
      if (range > 1.5) this.fireAt(u.x, u.y, u.owner, range, view.isBuilding ? 2.0 : 1.4, u.owner === 0 ? 0x6fd4ff : 0xffb04a)
    }
    view.lastCooldown = u.cooldown
  }

  /** Visual-only projectile toward the nearest enemy in range (mirrors sim targeting closely enough). */
  private fireAt(x: number, y: number, owner: number, range: number, height: number, color: number) {
    let best: { x: number; y: number; h: number } | null = null
    let bestD = range + 0.8
    const consider = (tx: number, ty: number, h: number) => {
      const d = Math.hypot(tx - x, ty - y)
      if (d < bestD) { bestD = d; best = { x: tx, y: ty, h } }
    }
    for (const u of this.lastSim?.units ?? []) {
      if (u.owner !== owner) consider(u.x, u.y, 1.2)
    }
    for (const t of this.lastSim?.towers ?? []) {
      if (t.owner !== owner && t.hp > 0) consider(t.x, t.y, 2.0)
    }
    if (!best) return
    const target = best as { x: number; y: number; h: number }
    const from = toWorld(x, y); from.y = height
    const to = toWorld(target.x, target.y); to.y = target.h
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshBasicMaterial({ color }),
    )
    mesh.position.copy(from)
    this.scene.add(mesh)
    this.projectiles.push({ mesh, from, to, t: 0, dur: 0.16 + bestD * 0.022 })
    this.onProjectile?.()
  }

  private lastSim: SimState | null = null

  /** Camera shake — call on big impacts (tower kills). */
  shake(amp: number) {
    this.shakeAmp = Math.max(this.shakeAmp, amp)
  }

  /** Liquidation Cascade meteor: a fiery ball drops from the sky and erupts a shockwave. */
  meteor(simX: number, simY: number) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xff5a2a }),
    )
    const pos = toWorld(simX, simY)
    mesh.position.set(pos.x, 22, pos.z)
    this.scene.add(mesh)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.6, 32),
      new THREE.MeshBasicMaterial({ color: 0xffb24a, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(pos.x, 0.1, pos.z)
    ring.visible = false
    this.scene.add(ring)
    this.meteors.push({ mesh, ring, x: pos.x, z: pos.z, t: 0, landed: false })
  }

  private createUnit(u: UnitEntity): UnitView {
    const card = getCard(u.cardId)
    if (card.building) return this.createBuilding(u)
    const charName = CARD_CHAR[u.cardId] ?? 'explorer'
    const asset = this.chars[charName]!
    const model = cloneSkeleton(asset.scene)
    // size reads the role: tanks/bosses loom, swarms are small, plus a touch of hp scaling
    const base: Record<string, number> = {
      tank: 3.2, brawler: 2.7, mage: 2.7, support: 2.6, ranged: 2.5, assassin: 2.3, swarm: 1.9,
    }
    const targetH = (base[card.role ?? 'brawler'] ?? 2.6) + Math.min(0.8, u.maxHp / 2600)
    const s = targetH / asset.height
    model.scale.setScalar(s)

    const group = new THREE.Group()
    group.add(model)

    // team ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.72, 24),
      new THREE.MeshBasicMaterial({ color: u.owner === 0 ? 0x3aa0ff : 0xff4a4a, transparent: true, opacity: 0.85 }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.03
    group.add(ring)

    toWorld(u.x, u.y, group.position)
    group.rotation.y = u.owner === 0 ? Math.PI : 0 // face the enemy side
    this.scene.add(group)

    const mixer = new THREE.AnimationMixer(model)
    const walk = mixer.clipAction(asset.walkClip)
    const attack = mixer.clipAction(asset.attackClip)
    attack.setLoop(THREE.LoopOnce, 1)
    attack.clampWhenFinished = false
    walk.play()

    const view: UnitView = {
      group, mixer, walk, attack,
      target: group.position.clone(),
      lastCooldown: u.cooldown,
      moving: true,
      flyHeight: card.flying ? 2.4 : undefined,
    }
    mixer.addEventListener('finished', () => {
      view.attacking = false
      view.attack!.stop()
      view.walk!.reset().play()
      view.walk!.paused = !view.moving
    })
    this.units.set(u.id, view)
    return view
  }

  /** Buildings (Trading Bot) render as a small KayKit structure, no character rig. */
  private createBuilding(u: UnitEntity): UnitView {
    const src = this.buildings[`lane-${u.owner}`]
    const model = src.clone()
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    model.scale.setScalar(2.4 / Math.max(size.x, size.z))

    const group = new THREE.Group()
    group.add(model)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.9, 24),
      new THREE.MeshBasicMaterial({ color: u.owner === 0 ? 0x3aa0ff : 0xff4a4a, transparent: true, opacity: 0.85 }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.03
    group.add(ring)

    // faint range telegraph so players read the bot's defensive coverage
    const range = getCard(u.cardId).range ?? 0
    if (range > 1.5) {
      const rangeRing = new THREE.Mesh(
        new THREE.RingGeometry(range - 0.12, range, 48),
        new THREE.MeshBasicMaterial({
          color: u.owner === 0 ? 0x3aa0ff : 0xff4a4a,
          transparent: true, opacity: 0.22, side: THREE.DoubleSide,
        }),
      )
      rangeRing.rotation.x = -Math.PI / 2
      rangeRing.position.y = 0.04
      group.add(rangeRing)
    }

    toWorld(u.x, u.y, group.position)
    this.scene.add(group)

    const view: UnitView = {
      group,
      target: group.position.clone(),
      lastCooldown: u.cooldown,
      moving: false,
      isBuilding: true,
    }
    this.units.set(u.id, view)
    return view
  }

  private syncTower(t: Tower, _sim: SimState) {
    let view = this.towers.get(t.id)
    if (t.hp <= 0) {
      if (view) { this.scene.remove(view.group); this.towers.delete(t.id) }
      return
    }
    if (view && t.cooldown > view.lastCooldown) {
      this.fireAt(t.x, t.y, t.owner, 8.5, t.kind === 'king' ? 3.2 : 2.6, t.owner === 0 ? 0x6fd4ff : 0xffb04a)
    }
    if (view) view.lastCooldown = t.cooldown
    if (!view) {
      const src = this.buildings[`${t.kind}-${t.owner}`]
      const group = src.clone()
      const box = new THREE.Box3().setFromObject(group)
      const size = box.getSize(new THREE.Vector3())
      const targetW = t.kind === 'king' ? 4.6 : 3.2
      const s = targetW / Math.max(size.x, size.z)
      group.scale.setScalar(s)
      toWorld(t.x, t.y, group.position)
      group.rotation.y = t.owner === 0 ? 0 : Math.PI
      this.scene.add(group)
      view = { group, lastCooldown: t.cooldown }
      this.towers.set(t.id, view)
    }
  }

  /** Advance animations + interpolation and draw. */
  render(deltaMs: number) {
    if (!this.ready) return
    const dt = deltaMs / 1000
    this.clock += dt
    for (const view of this.units.values()) {
      if (view.isBuilding || !view.mixer || !view.walk || !view.attack) continue
      const walk = view.walk, attack = view.attack
      const model = view.group.children[0]
      const d = this.tmpV.subVectors(view.target, view.group.position)
      const dist = d.length()
      // flyers hover; everyone gets a gentle idle bob when standing still so nobody looks frozen
      if (model) {
        const fly = view.flyHeight ?? 0
        const bob = (view.flyHeight || (!view.moving && dist <= 0.01)) ? Math.sin(this.clock * 3 + view.group.id) * (view.flyHeight ? 0.15 : 0.06) : 0
        model.position.y = fly + bob
      }
      if (dist > 0.01) {
        // face movement direction, smoothly
        const desired = Math.atan2(d.x, d.z)
        let diff = desired - view.group.rotation.y
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        view.group.rotation.y += diff * Math.min(1, dt * 10)
        view.group.position.addScaledVector(d, Math.min(1, dt * 9))
        // Only resume walking once the attack animation has finished.
        if (!view.moving && !view.attacking && !attack.isRunning()) {
          view.moving = true
          attack.crossFadeTo(walk.reset().play(), 0.12, false)
        }
      } else if (view.moving && !view.attacking && !attack.isRunning()) {
        walk.paused = true
      }
      if (view.moving && dist > 0.01 && !view.attacking) walk.paused = false
      view.mixer.update(dt)
    }

    // projectiles: arc from muzzle to target
    for (const p of this.projectiles) {
      p.t += dt / p.dur
      const k = Math.min(1, p.t)
      p.mesh.position.lerpVectors(p.from, p.to, k)
      p.mesh.position.y += Math.sin(k * Math.PI) * 0.7
    }
    this.projectiles = this.projectiles.filter((p) => {
      if (p.t >= 1) { this.scene.remove(p.mesh); return false }
      return true
    })

    // dying units: shrink and sink
    for (const d of this.dying) {
      d.t += dt / 0.35
      const k = Math.max(0, 1 - d.t)
      d.group.scale.setScalar(k)
      d.group.position.y = -0.4 * (1 - k)
    }
    this.dying = this.dying.filter((d) => {
      if (d.t >= 1) { this.scene.remove(d.group); return false }
      return true
    })

    // meteors: fall, then erupt a shockwave ring
    for (const m of this.meteors) {
      m.t += dt
      if (!m.landed) {
        m.mesh.position.y = Math.max(0.4, 22 - m.t * 70)
        if (m.mesh.position.y <= 0.5) {
          m.landed = true
          m.t = 0
          this.scene.remove(m.mesh)
          m.ring.visible = true
        }
      } else {
        const k = Math.min(1, m.t / 0.5)
        m.ring.scale.setScalar(1 + k * 9)
        ;(m.ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k)
      }
    }
    this.meteors = this.meteors.filter((m) => {
      if (m.landed && m.t >= 0.5) { this.scene.remove(m.ring); return false }
      return true
    })

    // camera shake decay
    if (this.shakeAmp > 0.004) {
      this.camera.position.set(
        this.camBase.x + (Math.random() - 0.5) * this.shakeAmp,
        this.camBase.y + (Math.random() - 0.5) * this.shakeAmp * 0.6,
        this.camBase.z + (Math.random() - 0.5) * this.shakeAmp,
      )
      this.shakeAmp *= Math.exp(-dt * 7)
    } else if (this.shakeAmp !== 0) {
      this.shakeAmp = 0
      this.camera.position.copy(this.camBase)
    }

    this.renderer.render(this.scene, this.camera)
  }

  /** Game-pixel arena coords (540×960) → sim tile coords via ground raycast. */
  screenToSim(px: number, py: number): { x: number; y: number } | null {
    const ndc = new THREE.Vector2((px / ARENA_PX_W) * 2 - 1, -((py / ARENA_PX_H) * 2 - 1))
    this.ray.setFromCamera(ndc, this.camera)
    const hit = new THREE.Vector3()
    if (!this.ray.ray.intersectPlane(this.groundPlane, hit)) return null
    return { x: hit.x + ARENA_W / 2, y: RIVER_Y - hit.z }
  }

  /** Sim coords (+ height in world units) → game-pixel coords for the Phaser overlay. */
  project(simX: number, simY: number, height = 0): { x: number; y: number } {
    const v = toWorld(simX, simY, this.tmpV)
    v.y = height
    v.project(this.camera)
    return { x: ((v.x + 1) / 2) * ARENA_PX_W, y: ((1 - v.y) / 2) * ARENA_PX_H }
  }

  dispose() {
    this.renderer.dispose()
    this.canvas.remove()
    this.units.clear()
    this.towers.clear()
  }
}
