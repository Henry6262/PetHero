import { ItemType } from '../sim/kart'

export interface ItemDef {
  id: ItemType
  name: string
  // weights indexed by race rank (0 = first place). Higher = more likely.
  weights: number[]
}

export const ITEMS: ItemDef[] = [
  { id: 'pump-rocket', name: 'Pump Rocket', weights: [5, 15, 25, 35, 45, 55] },
  { id: 'rug-pull', name: 'Rug Pull', weights: [20, 25, 30, 35, 40, 45] },
  { id: 'fud-cloud', name: 'FUD Cloud', weights: [10, 20, 30, 40, 50, 60] },
  { id: 'diamond-shield', name: 'Diamond Shield', weights: [30, 25, 20, 15, 10, 5] },
  { id: 'candle-boost', name: 'Candle Boost', weights: [35, 30, 25, 20, 15, 10] },
  { id: 'liquidation-wave', name: 'Liquidation Wave', weights: [0, 5, 15, 30, 50, 70] },
]

export function itemById(id: ItemType): ItemDef {
  const it = ITEMS.find((i) => i.id === id)
  if (!it) throw new Error(`unknown item ${id}`)
  return it
}
