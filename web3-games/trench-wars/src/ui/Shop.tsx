import { useState } from 'react'
import { TrenchCard } from './TrenchCard'
import { Icon } from './Icon'
import { PackOpen } from './PackOpen'
import { chestForTier, type ChestTier } from './crates'
import { CARDS } from '../sim/cards'
import { rarityOf } from './rarity'

interface Offer {
  cardId: string
  price: number
  currency: 'gold' | 'gem'
  stock: number
}

const DAILY_DEALS: Offer[] = [
  { cardId: 'ansem', price: 300, currency: 'gold', stock: 10 },
  { cardId: 'sbf', price: 2500, currency: 'gold', stock: 2 },
  { cardId: 'vucan', price: 400, currency: 'gem', stock: 1 },
]

const TRADER_CARDS: Offer[] = [
  { cardId: 'mert', price: 180, currency: 'gem', stock: 1 },
  { cardId: 'toly', price: 2200, currency: 'gold', stock: 3 },
  { cardId: 'whale', price: 150, currency: 'gem', stock: 1 },
]

interface ChestOfferDef {
  tier: ChestTier
  price: number
  currency: 'gold' | 'gem'
  count: number
}

const CHEST_OFFERS: ChestOfferDef[] = [
  { tier: 'wooden', price: 100, currency: 'gold', count: 3 },
  { tier: 'silver', price: 500, currency: 'gold', count: 4 },
  { tier: 'gold', price: 1200, currency: 'gold', count: 6 },
  { tier: 'magical', price: 200, currency: 'gem', count: 8 },
  { tier: 'rug', price: 500, currency: 'gem', count: 8 },
]

function Currency({ type }: { type: 'gold' | 'gem' }) {
  if (type === 'gem') {
    return <span className="shop-currency gem"><Icon name="elixir" size={12} color="#b44dff" /></span>
  }
  return <span className="shop-currency gold"><Icon name="loot" size={12} color="#f5c842" /></span>
}

function OfferCard({ offer }: { offer: Offer }) {
  return (
    <div className="shop-offer">
      <TrenchCard cardId={offer.cardId} size="md" showRibbon />
      <div className="shop-price">
        <Currency type={offer.currency} />
        <span>{offer.price}</span>
      </div>
      <div className="shop-stock">x{offer.stock}</div>
    </div>
  )
}

function ChestOffer({ offer, onOpen }: { offer: ChestOfferDef; onOpen: (tier: ChestTier, count: number) => void }) {
  const chest = chestForTier(offer.tier)
  return (
    <div className="shop-chest" onClick={() => onOpen(offer.tier, offer.count)}>
      <div className="shop-chest-visual" style={{ ['--crate-glow' as any]: chest.glow }}>
        <div className="crate-box">
          <div className="crate-lid"><Icon name="loot" size={24} /></div>
          <div className="crate-body"><Icon name="loot" size={32} /></div>
        </div>
      </div>
      <div className="shop-chest-name">{chest.name}</div>
      <div className="shop-chest-count">{offer.count} cards</div>
      <div className="shop-price">
        <Currency type={offer.currency} />
        <span>{offer.price}</span>
      </div>
    </div>
  )
}

function Banner({ children }: { children: React.ReactNode }) {
  return <div className="shop-banner"><span>{children}</span></div>
}

const RARITY_WEIGHTS = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
}

/** Cards released this season — boosted drop rate in every chest. */
const FEATURED_CARDS = new Set(['mert', 'toly', 'ansem', 'sbf', 'vucan'])
const FEATURED_BONUS = 4

const CHEST_RARITY_FLOOR: Record<ChestTier, 'common' | 'rare' | 'epic' | 'legendary'> = {
  wooden: 'common',
  silver: 'common',
  gold: 'rare',
  magical: 'epic',
  rug: 'epic',
}

const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'] as const

function rollCard(tier: ChestTier): string {
  const floorIdx = RARITY_ORDER.indexOf(CHEST_RARITY_FLOOR[tier])

  // Build a weighted pool respecting the chest's rarity floor.
  const pool: { id: string; weight: number }[] = []
  for (const c of CARDS) {
    if (c.type !== 'unit') continue // chests drop fighters, not spells
    const rarity = rarityOf(c.id)
    const idx = RARITY_ORDER.indexOf(rarity)
    if (idx < floorIdx) continue
    let weight = RARITY_WEIGHTS[rarity]
    if (FEATURED_CARDS.has(c.id)) weight *= FEATURED_BONUS
    pool.push({ id: c.id, weight })
  }

  const total = pool.reduce((s, p) => s + p.weight, 0)
  let roll = Math.random() * total
  for (const p of pool) {
    roll -= p.weight
    if (roll <= 0) return p.id
  }
  return pool[pool.length - 1]?.id ?? 'mert'
}

function rollChest(count: number, tier: ChestTier): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) out.push(rollCard(tier))
  return out
}

export function Shop() {
  const [msg] = useState("Fresh cards and crates just dropped, commander. Spend wisely.")
  const [opening, setOpening] = useState<{ tier: ChestTier; cardIds: string[] } | null>(null)

  const openChest = (tier: ChestTier, count: number) => {
    setOpening({ tier, cardIds: rollChest(count, tier) })
  }

  return (
    <>
      <div className="screen shop-screen">
        <div className="shop-merchant">
          <div className="shop-portrait">
            <img src="/assets/3d/portraits/sbf.png" alt="Rug Merchant" />
          </div>
          <div className="shop-speech">
            <div className="shop-speech-name">RUG MERCHANT</div>
            <div className="shop-speech-text">{msg}</div>
          </div>
        </div>

        <div className="shop-balance">
          <div className="shop-balance-row">
            <Icon name="loot" size={16} color="#f5c842" />
            <span>0</span>
          </div>
          <div className="shop-balance-row">
            <Icon name="elixir" size={16} color="#b44dff" />
            <span>0</span>
          </div>
        </div>

        <div className="shop-section">
          <Banner>Chests</Banner>
          <div className="shop-chests">
            {CHEST_OFFERS.map((o) => (
              <ChestOffer key={o.tier} offer={o} onOpen={openChest} />
            ))}
          </div>
        </div>

        <div className="shop-section">
          <Banner>Daily Deals</Banner>
          <div className="shop-offers">
            {DAILY_DEALS.map((o, i) => <OfferCard key={i} offer={o} />)}
          </div>
        </div>

        <div className="shop-section">
          <Banner>Trader</Banner>
          <div className="shop-offers">
            {TRADER_CARDS.map((o, i) => <OfferCard key={i} offer={o} />)}
          </div>
        </div>

        <div className="shop-section">
          <Banner>Cosmetics</Banner>
          <div className="shop-coming-soon">Skins, emotes, and card backs — coming next season.</div>
        </div>
      </div>

      {opening && (
        <div className="shop-overlay">
          <PackOpen tier={opening.tier} cardIds={opening.cardIds} onDone={() => setOpening(null)} />
        </div>
      )}
    </>
  )
}
