export const TOKEN = {
  ticker: 'RIVALZ',
  name: 'StreetRivalz',
  network: 'solana' as const,
  launchUrl: 'https://pump.fun',
}

export interface HolderTier {
  minTokens: number
  name: string
  perks: string[]
}

export const HOLDER_TIERS: HolderTier[] = [
  { minTokens: 0, name: 'Fan', perks: ['play', 'earn cosmetics'] },
  { minTokens: 100_000, name: 'Crew', perks: ['exclusive paint', 'name color'] },
  { minTokens: 1_000_000, name: 'Whale', perks: ['legendary trails', 'early tracks'] },
]

export function tierForBalance(balance: number): HolderTier {
  let tier = HOLDER_TIERS[0]
  for (const t of HOLDER_TIERS) {
    if (balance >= t.minTokens) tier = t
  }
  return tier
}
