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
  body: 'toyota-supra',
  wheels: 'stock',
  paint: 0xff6600,
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
  { id: 'supra-orange', name: 'Supra Orange', color: 0xff6600 },
  { id: 'm4-blue', name: 'M4 Blue', color: 0x4a90e2 },
  { id: 'r8-silver', name: 'R8 Silver', color: 0xc0c0c0 },
  { id: 'camaro-yellow', name: 'Camaro Yellow', color: 0xfacc15 },
  { id: 'hellcat-black', name: 'Hellcat Black', color: 0x111111 },
  { id: 'gtr-gray', name: 'GT-R Gray', color: 0x4a4a4a },
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
