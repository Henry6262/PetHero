import { TrenchCard } from './TrenchCard'

interface Props {
  cardId: string
  className?: string
  onPointerDown?: (e: React.PointerEvent) => void
  onClick?: () => void
}

export function CardTile({ cardId, className = '', onPointerDown, onClick }: Props) {
  const state = className.includes('in-deck') ? 'in-deck'
    : className.includes('selected') ? 'selected' : undefined
  return (
    <TrenchCard
      cardId={cardId}
      size="sm"
      state={state}
      showRibbon={false}
      className={className}
      onClick={onClick}
      onPointerDown={onPointerDown}
    />
  )
}
