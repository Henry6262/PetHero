import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ICON_PATHS } from '../../src/ui/icons/data'

const UI_DIR = join(__dirname, '../../src/ui')

function uiFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.tsx')) out.push(p)
    }
  }
  walk(UI_DIR)
  return out
}

// Emoji codepoint ranges (pictographs, symbols, dingbats, arrows used as glyphs)
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{2190}-\u{21FF}\u{FE0F}]/u

describe('icons', () => {
  it('registry has the 26 curated names', () => {
    expect(Object.keys(ICON_PATHS).length).toBeGreaterThanOrEqual(26)
    for (const n of ['tank', 'battle', 'elixir', 'loot', 'crown']) {
      expect(ICON_PATHS[n]).toBeTruthy()
    }
  })

  it('no emoji glyphs remain in src/ui/*.tsx', () => {
    const offenders: string[] = []
    for (const f of uiFiles()) {
      const txt = readFileSync(f, 'utf8')
      if (EMOJI.test(txt)) offenders.push(f.replace(UI_DIR, 'src/ui'))
    }
    expect(offenders).toEqual([])
  })
})
