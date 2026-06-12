import { describe, it, expect } from 'vitest'
import { isValidLoadout, normalizeLoadout, DEFAULT_LOADOUT } from '../../src/garage/inventory'

describe('garage inventory', () => {
  it('validates a correct loadout', () => {
    expect(isValidLoadout(DEFAULT_LOADOUT)).toBe(true)
  })

  it('rejects an invalid body', () => {
    expect(isValidLoadout({ ...DEFAULT_LOADOUT, body: 'not-a-car' })).toBe(false)
  })

  it('normalizes an incomplete loadout', () => {
    const normalized = normalizeLoadout({ body: 'paper-scooter' })
    expect(normalized.body).toBe('paper-scooter')
    expect(normalized.wheels).toBeDefined()
    expect(normalized.paint).toBeDefined()
  })
})
