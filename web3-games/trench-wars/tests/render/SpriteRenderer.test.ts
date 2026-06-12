import { describe, it, expect } from 'vitest'
import { headingToDirection, getFrame, type SpriteSheetDef } from '../../src/render/AssetManifest'
import { unitHeading } from '../../src/render/SpriteRenderer'
import type { UnitEntity } from '../../src/sim/types'

const def: SpriteSheetDef = {
  id: 'test',
  path: '/assets/test.png',
  frameWidth: 64,
  frameHeight: 64,
  directions: 8,
  anchorX: 0.5,
  anchorY: 0.75,
  animations: { walk: { row: 0, frames: 4, speed: 0.2 } },
}

describe('unitHeading', () => {
  it('faces the enemy king (+y for player 0, -y for player 1)', () => {
    const p0: UnitEntity = { id: 1, owner: 0, cardId: 'x', x: 9, y: 10, hp: 100, maxHp: 100, cooldown: 0, fleeing: false, revealed: true, buffUntil: 0 }
    const p1: UnitEntity = { id: 2, owner: 1, cardId: 'x', x: 9, y: 20, hp: 100, maxHp: 100, cooldown: 0, fleeing: false, revealed: true, buffUntil: 0 }
    expect(unitHeading(p0)).toBe(Math.PI / 2)
    expect(unitHeading(p1)).toBe(-Math.PI / 2)
  })
})

describe('frame selection', () => {
  it('selects the north-facing row for a player 0 unit', () => {
    const dir = headingToDirection(Math.PI / 2)
    expect(dir).toBe(0)
    expect(getFrame(def, 'walk', dir, 0)).toBe(0)
  })
  it('selects the south-facing row for a player 1 unit', () => {
    const dir = headingToDirection(-Math.PI / 2)
    expect(dir).toBe(4)
    expect(getFrame(def, 'walk', dir, 0)).toBe(16)
  })
})
