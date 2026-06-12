import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { ARENA_H, ARENA_W, RIVER_Y, LANE_LEFT_X, LANE_RIGHT_X } from '../sim/constants'
import type { SimState, UnitEntity, Tower } from '../sim/types'

/**
 * Real-3D battle renderer. Owns a WebGL canvas positioned underneath the
 * (transparent) Phaser canvas. The sim stays the source of truth — this class
 * only visualizes SimState, mirroring the old SpriteRenderer contract.
 *
 * sim coords: x ∈ [0, ARENA_W], y ∈ [0, ARENA_H], y grows toward the enemy.
 * world coords: x = simX - ARENA_W/2, z = RIVER_Y - simY (player 0 at +z).
 */

const ARENA_PX_W = 540
const ARENA_PX_H = 960

// Which character model plays each unit card.
const CARD_CHAR: Record<string, CharName> = {
  'bag-holder': 'vanguard',
  'chad-trader': 'vanguard',
  'diamond-hands': 'vanguard',
  'paper-hands': 'vanguard',
  'whale': 'vanguard',
  'jeet-horde': 'explorer',
  'mev-bots': 'explorer',
  'exit-liquidity': 'explorer',
  'sniper-bot': 'explorer',
  'fud-spirit': 'crimson',
  'influencer': 'crimson',
  'rug-dev': 'crimson',
}

type CharName = 'vanguard' | 'explorer' | 'crimson'

interface CharAsset {
  scene: THREE.Group
  walkClip: THREE.AnimationClip
  attackClip: THREE.AnimationClip
  height: number
}

interface UnitView {
  group: THREE.Group
  mixer: THREE.AnimationMixer
  walk: THREE.AnimationAction
  attack: THREE.AnimationAction
  target: THREE.Vector3
  lastCooldown: number
  moving: boolean
}

interface TowerView {
  group: THREE.Group
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
  ready = false

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'fixed'
    this.canvas.style.zIndex = '0'
    this.canvas.style.pointerEvents = 'none'
    document.body.appendChild(this.canvas)

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(ARENA_PX_W, ARENA_PX_H, false)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.scene.background = new THREE.Color(0x0a0e14)
    this.scene.fog = new THREE.Fog(0x0a0e14, 55, 90)

    this.camera = new THREE.PerspectiveCamera(46, ARENA_PX_W / ARENA_PX_H, 1, 200)
    this.camera.position.set(0, 36, 26)
    this.camera.lookAt(0, 0, 1)

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
    const [grass, water, towerBlue, towerRed, castleBlue, castleRed, ...charGlbs] = await Promise.all([
      glb('/assets/3d/kaykit/hex_grass.gltf'),
      glb('/assets/3d/kaykit/hex_water.gltf'),
      glb('/assets/3d/kaykit/building_tower_A_blue.gltf'),
      glb('/assets/3d/kaykit/building_tower_A_red.gltf'),
      glb('/assets/3d/kaykit/building_castle_blue.gltf'),
      glb('/assets/3d/kaykit/building_castle_red.gltf'),
      glb('/assets/3d/chars/vanguard-walk.glb'),
      glb('/assets/3d/chars/vanguard-throw.glb'),
      glb('/assets/3d/chars/explorer-walk.glb'),
      glb('/assets/3d/chars/explorer-throw.glb'),
      glb('/assets/3d/chars/crimson-walk.glb'),
      glb('/assets/3d/chars/crimson-throw.glb'),
    ])

    this.buildings = {
      'lane-0': towerBlue.scene, 'lane-1': towerRed.scene,
      'king-0': castleBlue.scene, 'king-1': castleRed.scene,
    }
    for (const g of Object.values(this.buildings)) {
      g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true } })
    }

    const names: CharName[] = ['vanguard', 'explorer', 'crimson']
    names.forEach((name, i) => {
      const walkGlb = charGlbs[i * 2]
      const throwGlb = charGlbs[i * 2 + 1]
      const scene = walkGlb.scene
      scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; (o as THREE.Mesh).frustumCulled = false } })
      const box = new THREE.Box3().setFromObject(scene)
      this.chars[name] = {
        scene,
        walkClip: walkGlb.animations[0],
        attackClip: throwGlb.animations[0],
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

  /** Hand-placed battlefield dressing — edges and river only, never the play area. */
  private decorate() {
    // mountains framing each king tower, pushed off-board
    this.place('mountain_B_grass_trees', -2.2, 34.5, 0.4)
    this.place('mountain_B_grass_trees', 20.2, 34.8, 2.1)
    this.place('mountain_B_grass_trees', -2.4, -2.5, 1.2)
    this.place('mountain_B_grass_trees', 20.4, -2.8, 4.0)

    // forest belts hugging both flanks, inside the visible frame
    const forest: [string, number][] = [
      ['trees_A_large', 3], ['trees_B_medium', 7.5], ['trees_A_large', 12],
      ['trees_B_medium', 20], ['trees_A_large', 24.5], ['trees_B_medium', 29],
    ]
    for (const [name, y] of forest) {
      this.place(name, 0.9, y, y * 1.7, 1.1)
      this.place(name, 17.1, y + 1.6, y * 2.3, 1.1)
    }

    // single trees + rocks scattered along the edges, clear of both lanes
    this.place('tree_single_A', 1.6, 5.2, 0.7, 1.2)
    this.place('tree_single_B', 16.4, 9.8, 2.2, 1.2)
    this.place('tree_single_B', 1.5, 26.5, 4.1, 1.2)
    this.place('tree_single_A', 16.5, 22.4, 1.0, 1.2)
    this.place('rock_single_A', 2.2, 13.8, 0.3)
    this.place('rock_single_C', 15.8, 18.4, 2.8)
    this.place('rock_single_C', 1.3, 18.2, 1.4)
    this.place('rock_single_A', 16.7, 13.6, 5.2)
    this.place('hill_single_A', 9, 33.4, 3.3)

    // river life between the bridges
    this.place('waterlily_A', 2.0, RIVER_Y, 0.5, 1, -0.1)
    this.place('waterplant_A', 7.2, RIVER_Y + 0.2, 1.8, 1, -0.1)
    this.place('waterlily_A', 9.0, RIVER_Y - 0.2, 3.1, 1, -0.1)
    this.place('waterplant_A', 10.8, RIVER_Y + 0.1, 4.4, 1, -0.1)
    this.place('waterlily_A', 16.0, RIVER_Y, 2.0, 1, -0.1)

    // team flags flanking the lane towers
    this.place('flag_blue', LANE_LEFT_X - 1.8, 5.5)
    this.place('flag_blue', LANE_RIGHT_X + 1.8, 5.5)
    this.place('flag_red', LANE_LEFT_X - 1.8, ARENA_H - 5.5)
    this.place('flag_red', LANE_RIGHT_X + 1.8, ARENA_H - 5.5)
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

  /** Position the 3D canvas to exactly underlay the arena portion of the (scaled) Phaser canvas. */
  syncLayout(phaserCanvas: HTMLCanvasElement, gameH: number) {
    const rect = phaserCanvas.getBoundingClientRect()
    const arenaFrac = ARENA_PX_H / gameH
    this.canvas.style.left = `${rect.left}px`
    this.canvas.style.top = `${rect.top}px`
    this.canvas.style.width = `${rect.width}px`
    this.canvas.style.height = `${rect.height * arenaFrac}px`
  }

  /** Sync meshes to sim state. Call once per rendered frame. */
  sync(sim: SimState) {
    if (!this.ready) return
    const aliveUnits = new Set<number>()
    for (const u of sim.units) {
      aliveUnits.add(u.id)
      this.syncUnit(u)
    }
    for (const [id, view] of this.units) {
      if (!aliveUnits.has(id)) {
        this.scene.remove(view.group)
        this.units.delete(id)
      }
    }
    for (const t of sim.towers) this.syncTower(t)
  }

  private syncUnit(u: UnitEntity) {
    let view = this.units.get(u.id)
    if (!view) view = this.createUnit(u)
    toWorld(u.x, u.y, view.target)

    // hide enemy stealth units until revealed; dim own
    view.group.visible = u.revealed || u.owner === 0

    // attack fired this tick → cooldown jumped up
    if (u.cooldown > view.lastCooldown) {
      view.attack.reset().play()
      view.walk.crossFadeTo(view.attack, 0.08, false)
      view.moving = false
    }
    view.lastCooldown = u.cooldown
  }

  private createUnit(u: UnitEntity): UnitView {
    const charName = CARD_CHAR[u.cardId] ?? 'explorer'
    const asset = this.chars[charName]!
    const model = cloneSkeleton(asset.scene)
    const targetH = 2.1 + Math.min(1.5, u.maxHp / 900)
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
    }
    mixer.addEventListener('finished', () => {
      view.attack.stop()
      view.walk.reset().play()
      view.walk.paused = !view.moving
    })
    this.units.set(u.id, view)
    return view
  }

  private syncTower(t: Tower) {
    let view = this.towers.get(t.id)
    if (t.hp <= 0) {
      if (view) { this.scene.remove(view.group); this.towers.delete(t.id) }
      return
    }
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
      view = { group }
      this.towers.set(t.id, view)
    }
  }

  /** Advance animations + interpolation and draw. */
  render(deltaMs: number) {
    if (!this.ready) return
    const dt = deltaMs / 1000
    for (const view of this.units.values()) {
      const d = this.tmpV.subVectors(view.target, view.group.position)
      const dist = d.length()
      if (dist > 0.01) {
        // face movement direction, smoothly
        const desired = Math.atan2(d.x, d.z)
        let diff = desired - view.group.rotation.y
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        view.group.rotation.y += diff * Math.min(1, dt * 10)
        view.group.position.addScaledVector(d, Math.min(1, dt * 9))
        if (!view.moving && !view.attack.isRunning()) {
          view.moving = true
          view.attack.crossFadeTo(view.walk.reset().play(), 0.12, false)
        }
      } else if (view.moving && !view.attack.isRunning()) {
        view.walk.paused = true
      }
      if (view.moving && dist > 0.01) view.walk.paused = false
      view.mixer.update(dt)
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

  setVisible(visible: boolean) {
    this.canvas.style.display = visible ? 'block' : 'none'
  }

  dispose() {
    this.renderer.dispose()
    this.canvas.remove()
    this.units.clear()
    this.towers.clear()
  }
}
