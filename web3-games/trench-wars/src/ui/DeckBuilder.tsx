import { useEffect, useMemo, useState } from 'react'
import { CARDS, STARTER_DECK } from '../sim/cards'
import { DECK_SIZE } from '../sim/constants'
import { getDecks, createDeck, updateDeck } from '../api'
import { Ladder } from '../game/ladder'
import { unlockedCards, unlockWins, nextUnlock } from '../game/unlocks'
import { CardTile } from './CardTile'
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

  const toggle = (id: string) => {
    if (!unlocked.has(id)) {
      setStatus(`${getCardName(id)} unlocks at ${unlockWins(id)} wins (you have ${wins})`)
      return
    }
    setStatus('')
    setDeck((d) => {
      if (d.includes(id)) return d.filter((c) => c !== id)
      if (d.length >= DECK_SIZE) return d
      return [...d, id]
    })
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

  // unlocked cards first, then locked (sorted by unlock requirement)
  const sorted = [...CARDS].sort((a, b) => {
    const ua = unlocked.has(a.id) ? 0 : 1
    const ub = unlocked.has(b.id) ? 0 : 1
    return ua - ub || unlockWins(a.id) - unlockWins(b.id) || a.cost - b.cost
  })

  return (
    <div className="screen deck-screen">
      <h2>DECK BUILDER</h2>
      <div className="deck-count">
        <b>{deck.length}</b> / {DECK_SIZE} cards
        {next && <span className="unlock-hint"> · {next.remaining} win{next.remaining > 1 ? 's' : ''} to next unlock</span>}
      </div>
      <div className="deck-grid">
        {sorted.map((c) => {
          const locked = !unlocked.has(c.id)
          return (
            <div key={c.id} className={`tile-wrap ${locked ? 'locked' : ''}`}>
              <CardTile
                cardId={c.id}
                className={deck.includes(c.id) ? 'in-deck' : ''}
                onClick={() => toggle(c.id)}
              />
              {locked && <div className="lock-badge"><Icon name="lock" size={13} /> {unlockWins(c.id)}W</div>}
            </div>
          )
        })}
      </div>
      <div className="status">{status}</div>
      <button className="btn primary" onClick={save}>SAVE DECK</button>
      <button className="btn" onClick={() => go({ name: 'menu' })}>BACK</button>
    </div>
  )
}

function getCardName(id: string): string {
  return CARDS.find((c) => c.id === id)?.name ?? id
}
