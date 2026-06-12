import { getCard } from '../sim/cards'
import { CARD_CHAR } from '../render3d/Battle3D'

interface Props {
  cardId: string
  className?: string
  onPointerDown?: (e: React.PointerEvent) => void
  onClick?: () => void
}

export function CardTile({ cardId, className = '', onPointerDown, onClick }: Props) {
  const card = getCard(cardId)
  const charName = CARD_CHAR[cardId]
  return (
    <button
      className={`card-tile ${className}`}
      onPointerDown={onPointerDown}
      onClick={onClick}
      data-card={cardId}
    >
      <span className="cost-chip">{card.cost}</span>
      {charName ? (
        <img src={`/assets/3d/portraits/${charName}.png`} alt={card.name} draggable={false} />
      ) : (
        <span className="spell-glyph">✦</span>
      )}
      <span className="nm">{card.name.toUpperCase()}</span>
    </button>
  )
}
