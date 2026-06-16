export type PlayerId = 0 | 1

export interface AuraDef { radius: number; speedMult?: number; damageMult?: number }

export type Role = 'tank' | 'brawler' | 'mage' | 'assassin' | 'support' | 'swarm' | 'ranged' | 'building' | 'spell'

export interface CardDef {
  id: string
  name: string
  cost: number
  type: 'unit' | 'spell'
  role?: Role               // tactical role — drives size, UI tag, and stat philosophy
  // unit fields
  count?: number            // units spawned per play
  hp?: number
  damage?: number
  range?: number            // attack range (tiles), measured edge-to-edge from collision radius
  sightRange?: number       // aggro acquisition range, measured edge-to-edge from collision radius
  speed?: number            // tiles per tick
  attackSpeed?: number      // ticks between attacks (hit time)
  splashRadius?: number     // 0/undefined = single target
  targeting?: 'nearest' | 'lowestHp'
  flees?: boolean           // Paper Hands: flees below FLEE_HP_RATIO
  stealthRange?: number     // Rug Dev: hidden until an enemy is this close
  aura?: AuraDef            // Influencer (ally damageMult) / FUD Spirit (enemy speedMult)
  targetsTowers?: boolean   // Moon Boy: ignores enemy units, charges towers (win condition)
  building?: boolean        // Trading Bot: stationary defensive structure
  lifespan?: number         // building only: ticks until it decays to 0 hp
  // passive traits (synergy mechanics)
  armor?: number            // flat damage reduction per incoming hit (tanks)
  taunt?: number            // radius: forces enemy melee to target this unit (tanks)
  lifesteal?: number        // 0-1: attacker heals this fraction of damage dealt (brawlers)
  rage?: number             // 0-1: attack cooldown shrinks as hp drops (brawlers)
  slowTicks?: number        // hits slow the target for this many ticks (mages)
  critFirst?: number        // first attack damage multiplier (assassins)
  flying?: boolean          // only ranged units + towers can target it
  // spell fields
  effectRadius?: number
  effectDamage?: number
  effectHeal?: number       // Copium: heals friendly units in radius
  buffTicks?: number
  buffSpeedMult?: number
  buffDamageMult?: number

  // === COMBAT GEOMETRY (P0) ===
  /** Collision radius in tiles. Determines melee contact distance,
   *  separation steering, and visual scale. */
  radius?: number
  /** Approximate mass for push resolution (light 1 .. heavy 12).
   *  Defaults to radius-based fallback in sim if absent. */
  mass?: number

  // === ATTACK TIMING (P1) ===
  /** Portion of attackSpeed (in ticks) that can be preloaded while walking.
   *  First hit delay = attackSpeed - loadTime.
   *  Default: 0 (no preload — first hit takes full attackSpeed). */
  loadTime?: number
  /** Delay in ticks before damage is dealt during the attack animation.
   *  Used to sync visual strike with damage application.
   *  Default: attackSpeed / 2 */
  damageDelay?: number

  // === PROJECTILES (P1) ===
  /** For ranged units: local [x, y, z] offset where projectiles spawn.
   *  Applied in character local space. Default: [0, 1.0, 0.3] */
  projectileOffset?: [number, number, number]
  /** Named bone/empty in the GLB to use as projectile spawn point.
   *  Falls back to projectileOffset if missing. */
  muzzleBone?: string
  /** Projectile travel speed in tiles per tick. */
  projectileSpeed?: number

  // === VISUAL / FX (P1/P3) ===
  /** ID of impact particle effect to spawn on hit.
   *  References an entry in a new fx registry. */
  impactFx?: string
  /** ID of death effect (particles, sound) to spawn on death. */
  deathFx?: string
  /** Duration of hit-pause in milliseconds. 0 = no pause.
   *  Default: 80 for melee, 0 for ranged */
  hitPauseMs?: number
  /** Screen shake intensity (0–10) on attack impact. Default: 0 */
  screenShake?: number
  /** Visual height offset in tiles above ground plane.
   *  Only applies when flying: true. Default: 2.4 */
  heightOffset?: number
}

export interface UnitEntity {
  id: number
  owner: PlayerId
  cardId: string
  x: number
  y: number
  hp: number
  maxHp: number
  cooldown: number
  fleeing: boolean
  revealed: boolean
  buffUntil: number   // pump-signal expiry tick; 0 = no buff
  slowUntil: number   // mage-slow expiry tick; 0 = not slowed
  hasAttacked: boolean // for assassin critFirst
  loadProgress: number // 0..loadTime; accumulated preload while walking toward a target
  attackState: 'idle' | 'windup' | 'strike'
  targetId?: number   // current combat target (unit only); renderer uses it for projectiles/aim
}

export interface Tower {
  id: number
  owner: PlayerId
  kind: 'lane' | 'king'
  x: number
  y: number
  hp: number
  maxHp: number
  active: boolean   // king towers sleep until a lane tower falls or they take damage
  cooldown: number
}

export interface DeployCommand {
  tick: number
  player: PlayerId
  cardId: string
  x: number
  y: number
}

export interface MatchResult {
  winner: PlayerId | null // null = draw
  reason: 'king' | 'crowns' | 'tiebreak' | 'draw'
}

export interface SimState {
  tick: number
  rngState: number
  elixir: [number, number]
  decks: [string[], string[]] // card-id queues; first HAND_SIZE entries = hand
  units: UnitEntity[]
  towers: Tower[]
  nextId: number
  overtime: boolean
  result: MatchResult | null
}

export interface Replay {
  seed: number
  decks: [string[], string[]]
  commands: DeployCommand[]
}
