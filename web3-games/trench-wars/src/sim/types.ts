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
  range?: number            // attack range (tiles)
  sightRange?: number       // aggro acquisition range
  speed?: number            // tiles per tick
  attackSpeed?: number      // ticks between attacks
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
