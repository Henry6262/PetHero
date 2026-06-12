import { describe, it, expect } from 'vitest'
import { tierForBalance, HOLDER_TIERS, TOKEN } from '../../src/data/token'

describe('token data', () => {
  it('returns the correct tier for a balance', () => {
    expect(tierForBalance(0).name).toBe('Fan')
    expect(tierForBalance(150_000).name).toBe('Crew')
    expect(tierForBalance(2_000_000).name).toBe('Whale')
  })

  it('has tiers sorted ascending by minTokens', () => {
    for (let i = 1; i < HOLDER_TIERS.length; i++) {
      expect(HOLDER_TIERS[i].minTokens).toBeGreaterThan(HOLDER_TIERS[i - 1].minTokens)
    }
  })

  it('defines a ticker and network', () => {
    expect(TOKEN.ticker).toBeDefined()
    expect(TOKEN.network).toBe('solana')
  })
})
