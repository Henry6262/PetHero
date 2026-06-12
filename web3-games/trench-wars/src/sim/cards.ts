import rawCards from './cards.json'
import type { CardDef } from './types'

export function validateCards(cards: CardDef[]): CardDef[] {
  for (const c of cards) {
    if (!c.id || !c.name || !(c.cost >= 1)) throw new Error(`card ${c.id}: bad id/name/cost`)
    if (c.type === 'unit') {
      for (const f of ['hp', 'damage', 'range', 'sightRange', 'speed', 'attackSpeed', 'count'] as const) {
        if (!((c[f] as number) > 0)) throw new Error(`card ${c.id}: missing/invalid ${f}`)
      }
    } else if (c.type === 'spell') {
      if (!(c.effectRadius! > 0)) throw new Error(`card ${c.id}: missing effectRadius`)
      if (!c.effectDamage && !c.buffTicks) throw new Error(`card ${c.id}: spell does nothing`)
    } else {
      throw new Error(`card ${c.id}: unknown type`)
    }
  }
  const ids = new Set(cards.map(c => c.id))
  if (ids.size !== cards.length) throw new Error('duplicate card ids')
  return cards
}

export const CARDS: CardDef[] = validateCards(rawCards as CardDef[])

const byId = new Map(CARDS.map(c => [c.id, c]))

export function getCard(id: string): CardDef {
  const c = byId.get(id)
  if (!c) throw new Error(`unknown card: ${id}`)
  return c
}

/** Default starter deck used by the client and tests. */
export const STARTER_DECK: string[] = [
  'bag-holder', 'jeet-horde', 'paper-hands', 'chad-trader',
  'diamond-hands', 'mev-bots', 'pump-signal', 'liquidation-cascade',
]
