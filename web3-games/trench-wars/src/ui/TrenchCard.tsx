import { getCard } from '../sim/cards'
import { CARD_CHAR } from '../render3d/Battle3D'
import { rarityOf, rarityColor } from './rarity'
import { Icon } from './Icon'

export type CardSize = 'sm' | 'md' | 'lg' | 'xl'
export type CardState = 'selected' | 'in-deck' | 'locked' | 'dimmed' | 'leveled'

interface Props {
  cardId: string
  size?: CardSize
  state?: CardState
  level?: number
  className?: string
  showRibbon?: boolean
  onClick?: () => void
  onPointerDown?: (e: React.PointerEvent) => void
}

function roleIcon(card: ReturnType<typeof getCard>): string {
  if (card.role === 'spell') {
    // Spells use flat effect fields (no discriminator object) — pick the sub-icon
    // from whichever effect the card carries. Order: heal > buff > slow > damage.
    const c = card as any
    if (c.effectHeal != null) return 'spell-heal'
    if (c.buffTicks != null) return 'spell-buff'
    if (c.slowTicks != null) return 'spell-slow'
    if (c.effectDamage != null) return 'spell-damage'
    return 'spell'
  }
  return card.role ?? 'spell' // tank/brawler/mage/assassin/support/swarm/ranged/building
}

export function TrenchCard({
  cardId, size = 'md', state, level, className = '', showRibbon = true, onClick, onPointerDown,
}: Props) {
  const card = getCard(cardId)
  const rarity = rarityOf(cardId)
  const charName = CARD_CHAR[cardId]
  const icon = roleIcon(card)
  const stateClass = state ? `is-${state}` : ''
  return (
    <button
      className={`tcard size-${size} r-${rarity} ${stateClass} ${className}`}
      data-card={cardId}
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={{
        ['--rarity' as any]: rarityColor(rarity),
        ['--rarity-glow' as any]: `var(--r-${rarity}-glow)`,
      }}
    >
      <span className="tcard-gem">{card.cost}</span>
      {(level ?? 0) > 0 && <span className="tcard-lvl">{level}</span>}
      {showRibbon && (
        <span className="tcard-ribbon">
          <Icon name={icon} size={size === 'sm' ? 12 : 16} /> {rarity}
        </span>
      )}
      <span className="tcard-art">
        {charName ? (
          <img src={`/assets/3d/portraits/${charName}.png`} alt={card.name} draggable={false} />
        ) : (
          <Icon name={icon} className="spell-icon" size={size === 'sm' ? 40 : 64} />
        )}
      </span>
      <span className="tcard-name">{card.name.toUpperCase()}</span>
    </button>
  )
}
