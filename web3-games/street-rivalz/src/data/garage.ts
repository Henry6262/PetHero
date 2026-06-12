import { CARS } from './cars'

export interface CosmeticItem {
  id: string
  name: string
  slot: 'body' | 'wheels' | 'spoiler' | 'paint' | 'trail'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface Loadout {
  body: string      // maps to car id
  wheels: string
  spoiler?: string
  paint: number     // hex color
  trail: string
}

export const DEFAULT_LOADOUT: Loadout = {
  body: 'paper-scooter',
  wheels: 'stock',
  paint: 0xfacc15,
  trail: 'default',
}

export const WHEELS: CosmeticItem[] = [
  { id: 'stock', name: 'Stock Wheels', slot: 'wheels', rarity: 'common' },
  { id: 'chrome', name: 'Chrome Rims', slot: 'wheels', rarity: 'rare' },
  { id: 'crypto-gold', name: 'Crypto Gold', slot: 'wheels', rarity: 'epic' },
  { id: 'slick', name: 'Slick Racing', slot: 'wheels', rarity: 'rare' },
]

export const SPOILERS: CosmeticItem[] = [
  { id: 'none', name: 'No Spoiler', slot: 'spoiler', rarity: 'common' },
  { id: 'ducktail', name: 'Ducktail', slot: 'spoiler', rarity: 'common' },
  { id: 'wing', name: 'Racing Wing', slot: 'spoiler', rarity: 'rare' },
  { id: 'whale-tail', name: 'Whale Tail', slot: 'spoiler', rarity: 'epic' },
]

export const TRAILS: CosmeticItem[] = [
  { id: 'default', name: 'Default Flame', slot: 'trail', rarity: 'common' },
  { id: 'green-candle', name: 'Green Candle', slot: 'trail', rarity: 'rare' },
  { id: 'diamond', name: 'Diamond Sparkle', slot: 'trail', rarity: 'epic' },
  { id: 'liquidation', name: 'Liquidation Blue', slot: 'trail', rarity: 'legendary' },
]

export const PAINTS: { id: string; name: string; color: number }[] = [
  { id: 'paper-yellow', name: 'Paper Yellow', color: 0xfacc15 },
  { id: 'whale-blue', name: 'Whale Blue', color: 0x3b82f6 },
  { id: 'jeet-orange', name: 'Jeet Orange', color: 0xf97316 },
  { id: 'diamond-green', name: 'Diamond Green', color: 0x22c55e },
  { id: 'rug-purple', name: 'Rug Purple', color: 0xa855f7 },
  { id: 'mev-red', name: 'MEV Red', color: 0xef4444 },
]

export function bodyItem(id: string): CosmeticItem | undefined {
  const car = CARS.find((c) => c.id === id)
  if (!car) return undefined
  return { id: car.id, name: car.name, slot: 'body', rarity: id === 'paper-scooter' ? 'common' : 'rare' }
}

export function allOwnedItems(): CosmeticItem[] {
  return [
    ...CARS.map((c) => ({ id: c.id, name: c.name, slot: 'body' as const, rarity: c.id === 'paper-scooter' ? 'common' as const : 'rare' as const })),
    ...WHEELS,
    ...SPOILERS,
    ...TRAILS,
  ]
}
