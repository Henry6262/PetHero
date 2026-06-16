export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export const RARITY: Record<string, Rarity> = {
  // legendary
  'degen-titan': 'legendary', whale: 'legendary', gigachad: 'legendary', 'mev-overlord': 'legendary',
  // epic
  'diamond-hands': 'epic', 'rug-dev': 'epic', 'shadow-dev': 'epic', 'sniper-bot': 'epic',
  'fomo-jet': 'epic', 'exit-liquidity': 'epic', influencer: 'epic', 'sailor-cat': 'epic',
  airdrop: 'epic', 'liquidation-cascade': 'epic', mert: 'epic', toly: 'epic', vucan: 'epic',
  // rare
  'mev-bots': 'rare', 'fud-spirit': 'rare', 'chad-trader': 'rare', 'discord-raid': 'rare',
  'trading-bot': 'rare', 'moon-boy': 'rare', 'based-brawlers': 'rare', 'fomo-mob': 'rare',
  copium: 'rare', 'liquidity-freeze': 'rare', ansem: 'rare',
  // common
  'bag-holder': 'common', scalper: 'common', 'jeet-horde': 'common', 'paper-hands': 'common',
  'pump-signal': 'common', 'gas-war': 'common', sbf: 'legendary',
}

const COLORS: Record<Rarity, string> = {
  common: '#6f86b8',
  rare: '#e8932e',
  epic: '#b14dff',
  legendary: '#f5c842',
}

export function rarityOf(id: string): Rarity {
  return RARITY[id] ?? 'common'
}

export function rarityColor(r: Rarity): string {
  return COLORS[r]
}
