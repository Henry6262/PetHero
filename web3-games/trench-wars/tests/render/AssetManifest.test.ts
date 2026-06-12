import { describe, it, expect } from 'vitest'
import { headingToDirection, getFrame, validateManifest, type AssetManifest } from '../../src/render/AssetManifest'

const manifest: AssetManifest = {
  units: {
    'jeet-horde': {
      id: 'jeet-horde',
      path: '/assets/units/jeet-horde.png',
      frameWidth: 64,
      frameHeight: 64,
      directions: 8,
      anchorX: 0.5,
      anchorY: 1,
      animations: { walk: { row: 0, frames: 8, speed: 0.2 } },
    },
  },
  towers: {
    king: {
      id: 'king',
      path: '/assets/towers/king.png',
      frameWidth: 64,
      frameHeight: 96,
      directions: 8,
      anchorX: 0.5,
      anchorY: 1,
      animations: { idle: { row: 0, frames: 1, speed: 0 } },
    },
  },
}

describe('headingToDirection', () => {
  it('maps cardinal headings to rows', () => {
    expect(headingToDirection(Math.PI / 2)).toBe(0)  // +y = north
    expect(headingToDirection(0)).toBe(2)             // +x = east
    expect(headingToDirection(-Math.PI / 2)).toBe(4)  // -y = south
    expect(headingToDirection(Math.PI)).toBe(6)       // -x = west
  })
})

describe('getFrame', () => {
  it('computes grid index from direction and frame', () => {
    const def = manifest.units['jeet-horde']
    expect(getFrame(def, 'walk', 0, 0)).toBe(0)
    expect(getFrame(def, 'walk', 0, 7)).toBe(7)
    expect(getFrame(def, 'walk', 1, 0)).toBe(8)
    expect(getFrame(def, 'walk', 7, 3)).toBe(59)
  })
})

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    expect(validateManifest(manifest)).toEqual([])
  })
  it('rejects bad definitions', () => {
    const bad: AssetManifest = {
      units: {
        bad: { ...manifest.units['jeet-horde'], id: 'wrong', frameWidth: 0, directions: 4, animations: {} },
      },
      towers: {},
    }
    const errs = validateManifest(bad)
    expect(errs.length).toBeGreaterThan(0)
    expect(errs.some(e => e.includes('id mismatch'))).toBe(true)
    expect(errs.some(e => e.includes('directions must be 8'))).toBe(true)
    expect(errs.some(e => e.includes('no animations'))).toBe(true)
  })
})
