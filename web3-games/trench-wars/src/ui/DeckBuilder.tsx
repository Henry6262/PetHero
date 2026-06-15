import { useEffect, useMemo, useState } from 'react'
import { CARDS, STARTER_DECK, getCard } from '../sim/cards'
import { DECK_SIZE } from '../sim/constants'
import { getDecks, createDeck, updateDeck } from '../api'
import { Ladder } from '../game/ladder'
import { unlockedCards, unlockWins, nextUnlock } from '../game/unlocks'
import { TrenchCard } from './TrenchCard'
import { Icon } from './Icon'
import type { Screen } from './Screen'

interface Props {
  go: (s: Screen) => void
}

export function DeckBuilder({ go }: Props) {
  const [deck, setDeck] = useState<string[]>([...STARTER_DECK])
  const [deckId, setDeckId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const wins = useMemo(() => new Ladder(window.localStorage).totalWins(), [])
  const unlocked = useMemo(() => unlockedCards(wins), [wins])
  const next = useMemo(() => nextUnlock(wins), [wins])

  useEffect(() => {
    getDecks()
      .then(({ decks }) => {
        if (decks.length) {
          setDeck(decks[0].cards)
          setDeckId(decks[0].id)
        }
      })
      .catch(() => setStatus('could not load saved deck — sign in on the menu first'))
  }, [])

  const avgElixir = useMemo(() => {
    if (deck.length === 0) return 0
    const sum = deck.reduce((acc, id) => acc + getCard(id).cost, 0)
    return +(sum / deck.length).toFixed(1)
  }, [deck])

  const addCard = (id: string) => {
    if (!unlocked.has(id)) {
      setStatus(`${getCardName(id)} unlocks at ${unlockWins(id)} wins (you have ${wins})`)
      return
    }
    setStatus('')
    setDeck((d) => {
      if (d.includes(id) || d.length >= DECK_SIZE) return d
      return [...d, id]
    })
  }

  const removeCard = (id: string) => {
    setStatus('')
    setDeck((d) => d.filter((c) => c !== id))
  }

  const save = async () => {
    if (deck.length !== DECK_SIZE) { setStatus(`pick exactly ${DECK_SIZE} cards`); return }
    if (deck.some((c) => !unlocked.has(c))) { setStatus('deck contains locked cards'); return }
    setStatus('saving…')
    try {
      if (deckId) await updateDeck(deckId, 'main', deck)
      else {
        const res = await createDeck('main', deck)
        setDeckId(res.deck.id)
      }
      setStatus('deck saved')
    } catch (err) {
      setStatus(`save failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  // collection: unlocked first, then locked, sorted by unlock req then cost
  const sorted = useMemo(() => [...CARDS].sort((a, b) => {
    const ua = unlocked.has(a.id) ? 0 : 1
    const ub = unlocked.has(b.id) ? 0 : 1
    return ua - ub || unlockWins(a.id) - unlockWins(b.id) || a.cost - b.cost
  }), [unlocked])

  const emptySlots = Math.max(0, DECK_SIZE - deck.length)

  return (
    <div className="screen deck-screen">
      <div className="deck-header">
        <button className="deck-back" onClick={() => go({ name: 'menu' })}>
          <Icon name="back" size={18} />
        </button>
        <h2>DECK BUILDER</h2>
        <button className="deck-save" onClick={save}>SAVE</button>
      </div>

      <div className="deck-meta">
        <div className="deck-avg">
          <Icon name="elixir" size={16} color="#b44dff" />
          <span>{avgElixir.toFixed(1)}</span>
        </div>
        <div className="deck-count">
          <b>{deck.length}</b> / {DECK_SIZE}
        </div>
        {next && (
          <div className="unlock-hint">
            {next.remaining} win{next.remaining > 1 ? 's' : ''} to unlock
          </div>
        )}
      </div>

      {/* Squad bar */}
      <div className="deck-squad">
        <div className="deck-squad-label">SQUAD</div>
        <div className="deck-squad-slots">
          {deck.map((id) => (
            <TrenchCard
              key={id}
              cardId={id}
              size="sm"
              state="selected"
              showRibbon={false}
              onClick={() => removeCard(id)}
            />
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="deck-slot-empty" />
          ))}
        </div>
      </div>

      {/* Collection */}
      <div className="deck-collection">
        <div className="deck-collection-label">COLLECTION</div>
        <div className="deck-grid">
          {sorted.map((c) => {
            const locked = !unlocked.has(c.id)
            const inDeck = deck.includes(c.id)
            return (
              <div key={c.id} className={`tile-wrap ${locked ? 'locked' : ''} ${inDeck ? 'in-deck' : ''}`}>
                <TrenchCard
                  cardId={c.id}
                  size="sm"
                  state={inDeck ? 'in-deck' : locked ? 'locked' : undefined}
                  progress={locked ? { current: wins, max: unlockWins(c.id) } : undefined}
                  showProgress={locked}
                  showRibbon={false}
                  onClick={() => addCard(c.id)}
                />
                {locked && (
                  <div className="lock-badge">
                    <Icon name="lock" size={13} /> {unlockWins(c.id) - wins}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="status">{status}</div>
    </div>
  )
}

function getCardName(id: string): string {
  return CARDS.find((c) => c.id === id)?.name ?? id
}
