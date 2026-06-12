export type PlayerId = 0 | 1

export interface AuraDef { radius: number; speedMult?: number; damageMult?: number }

export interface CardDef {
  id: string
  name: string
  cost: number
  type: 'unit' | 'spell'
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
  // spell fields
  effectRadius?: number
  effectDamage?: number
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
  buffUntil: number // pump-signal expiry tick; 0 = no buff
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
