export type ChestTier = 'wooden' | 'silver' | 'gold' | 'magical' | 'rug'

export interface ChestDef {
  tier: ChestTier
  name: string
  glow: string
  url: string | null // null = use CSS placeholder until GLB is generated
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

/**
 * Chest tier registry.
 * The PokeDex crates (pump/neon/rug) are the high-end magical/epic chests.
 * Cheaper wooden/silver/gold chests will get their own GLBs later; for now
 * the missing tiers render as a styled placeholder so the system is ready.
 */
export const CHESTS: Record<ChestTier, ChestDef> = {
  wooden: {
    tier: 'wooden',
    name: 'Wooden Chest',
    glow: '#8b5a2b',
    url: '/assets/3d/crates/neon.glb',
    rarity: 'common',
  },
  silver: {
    tier: 'silver',
    name: 'Silver Chest',
    glow: '#a0a8b8',
    url: '/assets/3d/crates/neon.glb',
    rarity: 'rare',
  },
  gold: {
    tier: 'gold',
    name: 'Gold Chest',
    glow: '#e8932e',
    url: '/assets/3d/crates/pump.glb',
    rarity: 'epic',
  },
  magical: {
    tier: 'magical',
    name: 'Magical Chest',
    glow: '#b14dff',
    url: '/assets/3d/crates/pump.glb',
    rarity: 'legendary',
  },
  rug: {
    tier: 'rug',
    name: 'Rug Chest',
    glow: '#f5c842',
    url: '/assets/3d/crates/rug.glb',
    rarity: 'legendary',
  },
}

export function chestForTier(tier: ChestTier): ChestDef {
  return CHESTS[tier]
}

export function defaultChestTier(): ChestTier {
  return 'rug'
}
