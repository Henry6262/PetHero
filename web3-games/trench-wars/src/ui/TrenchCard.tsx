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
  progress?: { current: number; max: number }
  showProgress?: boolean
  className?: string
  showRibbon?: boolean
  onClick?: () => void
  onPointerDown?: (e: React.PointerEvent) => void
}

function roleIcon(card: ReturnType<typeof getCard>): string {
  if (card.role === 'spell') {
    // Spells use flat effect fields (no discriminator object) — pick the sub-icon
    // from whichever effect the card carries. Order: heal > buff > slow > damage.
    if (card.effectHeal != null) return 'spell-heal'
    if (card.buffTicks != null) return 'spell-buff'
    if (card.slowTicks != null) return 'spell-slow'
    if (card.effectDamage != null) return 'spell-damage'
    return 'spell'
  }
  return card.role ?? 'spell' // tank/brawler/mage/assassin/support/swarm/ranged/building
}

export function TrenchCard({
  cardId, size = 'md', state, level, progress, showProgress, className = '', showRibbon = true, onClick, onPointerDown,
}: Props) {
  const card = getCard(cardId)
  const rarity = rarityOf(cardId)
  const charName = CARD_CHAR[cardId]
  const icon = roleIcon(card)
  const stateClass = state ? `is-${state}` : ''
  const isSpell = card.type === 'spell'
  const progressPct = progress && progress.max > 0
    ? Math.min(100, Math.max(0, (progress.current / progress.max) * 100))
    : 0
  const showProgressBar = showProgress && progress && progress.max > 0
  return (
    <button
      className={`tcard size-${size} r-${rarity} ${isSpell ? 'is-spell' : ''} ${stateClass} ${className}`}
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
          <img
            src={`/assets/3d/portraits/${charName}.png`}
            alt={card.name}
            draggable={false}
            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/3d/portraits/explorer.png' }}
          />
        ) : (
          <Icon name={icon} className="spell-icon" size={size === 'sm' ? 40 : 64} />
        )}
      </span>
      <span className="tcard-name">{card.name.toUpperCase()}</span>
      {showProgressBar && (
        <span className="tcard-progress">
          <i style={{ width: `${progressPct}%` }} />
        </span>
      )}
    </button>
  )
}
