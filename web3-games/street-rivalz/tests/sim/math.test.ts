import { describe, it, expect } from 'vitest'
import { v, add, sub, scale, dot, len, norm, clamp, mulberry32 } from '../../src/sim/math'

describe('vec2', () => {
  it('does basic arithmetic', () => {
    expect(add(v(1, 2), v(3, 4))).toEqual(v(4, 6))
    expect(sub(v(3, 4), v(1, 2))).toEqual(v(2, 2))
    expect(scale(v(1, -2), 3)).toEqual(v(3, -6))
    expect(dot(v(1, 2), v(3, 4))).toBe(11)
    expect(len(v(3, 4))).toBe(5)
  })

  it('normalizes safely', () => {
    expect(norm(v(0, 5))).toEqual(v(0, 1))
    expect(norm(v(0, 0))).toEqual(v(0, 0))
  })

  it('clamps', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-1, 0, 3)).toBe(0)
    expect(clamp(2, 0, 3)).toBe(2)
  })
})

describe('mulberry32', () => {
  it('same seed -> identical sequence', () => {
    const a = mulberry32(1234)
    const b = mulberry32(1234)
    for (let i = 0; i < 100; i++) expect(a()).toBe(b())
  })

  it('outputs in [0,1) and varies by seed', () => {
    const a = mulberry32(1)
    const x = a()
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThan(1)
    expect(mulberry32(2)()).not.toBe(mulberry32(3)())
  })
})
