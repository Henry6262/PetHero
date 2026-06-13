// Client-side card progression: players start with a base set and unlock the rest
// by winning ladder matches. Purely a deck-building UX gate — the sim and server
// always know every card, so this never affects determinism or anti-cheat.

export interface UnlockTier {
  wins: number
  cards: string[]
}

export const UNLOCK_TIERS: UnlockTier[] = [
  {
    wins: 0,
    cards: [
      'bag-holder', 'jeet-horde', 'paper-hands', 'chad-trader',
      'diamond-hands', 'mev-bots', 'pump-signal', 'liquidation-cascade',
      'scalper', 'gas-war',
    ],
  },
  { wins: 3, cards: ['fud-spirit', 'discord-raid', 'trading-bot', 'copium'] },
  { wins: 7, cards: ['rug-dev', 'influencer', 'sniper-bot'] },
  { wins: 12, cards: ['exit-liquidity', 'moon-boy', 'whale'] },
]

/** Set of card ids unlocked at a given total-win count. */
export function unlockedCards(totalWins: number): Set<string> {
  const set = new Set<string>()
  for (const tier of UNLOCK_TIERS) {
    if (totalWins >= tier.wins) for (const c of tier.cards) set.add(c)
  }
  return set
}

/** Wins required to unlock a card (0 if a base card). */
export function unlockWins(cardId: string): number {
  for (const tier of UNLOCK_TIERS) if (tier.cards.includes(cardId)) return tier.wins
  return 0
}

/** The next locked tier and how many more wins to reach it, or null if all unlocked. */
export function nextUnlock(totalWins: number): { wins: number; remaining: number; cards: string[] } | null {
  for (const tier of UNLOCK_TIERS) {
    if (totalWins < tier.wins) return { wins: tier.wins, remaining: tier.wins - totalWins, cards: tier.cards }
  }
  return null
}
