import { useState } from 'react'
import { TrenchCard } from './TrenchCard'
import { Icon } from './Icon'
import { PackOpen } from './PackOpen'
import { chestForTier, type ChestTier } from './crates'
import { CARDS } from '../sim/cards'

interface Offer {
  cardId: string
  price: number
  currency: 'gold' | 'gem'
  stock: number
}

const DAILY_DEALS: Offer[] = [
  { cardId: 'jeet-horde', price: 200, currency: 'gold', stock: 20 },
  { cardId: 'diamond-hands', price: 1200, currency: 'gold', stock: 5 },
  { cardId: 'whale', price: 300, currency: 'gem', stock: 1 },
]

const TRADER_CARDS: Offer[] = [
  { cardId: 'rug-dev', price: 150, currency: 'gem', stock: 1 },
  { cardId: 'sniper-bot', price: 2500, currency: 'gold', stock: 3 },
  { cardId: 'influencer', price: 120, currency: 'gem', stock: 2 },
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

function rollChest(count: number): string[] {
  const ids = CARDS.map((c) => c.id)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    out.push(ids[Math.floor(Math.random() * ids.length)])
  }
  return out
}

export function Shop() {
  const [msg] = useState("Fresh cards and crates just dropped, commander. Spend wisely.")
  const [opening, setOpening] = useState<{ tier: ChestTier; cardIds: string[] } | null>(null)

  const openChest = (tier: ChestTier, count: number) => {
    setOpening({ tier, cardIds: rollChest(count) })
  }

  return (
    <>
      <div className="screen shop-screen">
        <div className="shop-merchant">
          <div className="shop-portrait">
            <img src="/assets/3d/portraits/degen.png" alt="Rug Merchant" />
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
