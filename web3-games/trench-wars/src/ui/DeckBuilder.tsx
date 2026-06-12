import { useEffect, useState } from 'react'
import { CARDS, STARTER_DECK } from '../sim/cards'
import { DECK_SIZE } from '../sim/constants'
import { getDecks, createDeck, updateDeck } from '../api'
import { CardTile } from './CardTile'
import type { Screen } from './App'

interface Props {
  go: (s: Screen) => void
}

export function DeckBuilder({ go }: Props) {
  const [deck, setDeck] = useState<string[]>([...STARTER_DECK])
  const [deckId, setDeckId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

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
    setStatus('')
    setDeck((d) => {
      if (d.includes(id)) return d.filter((c) => c !== id)
      if (d.length >= DECK_SIZE) return d
      return [...d, id]
    })
  }

  const save = async () => {
    if (deck.length !== DECK_SIZE) { setStatus(`pick exactly ${DECK_SIZE} cards`); return }
    setStatus('saving…')
    try {
      if (deckId) await updateDeck(deckId, 'main', deck)
      else {
        const res = await createDeck('main', deck)
        setDeckId(res.deck.id)
      }
      setStatus('deck saved ✓')
    } catch (err) {
      setStatus(`save failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  return (
    <div className="screen deck-screen">
      <h2>DECK BUILDER</h2>
      <div className="deck-count">
        <b>{deck.length}</b> / {DECK_SIZE} cards
      </div>
      <div className="deck-grid">
        {CARDS.map((c) => (
          <CardTile
            key={c.id}
            cardId={c.id}
            className={deck.includes(c.id) ? 'in-deck' : ''}
            onClick={() => toggle(c.id)}
          />
        ))}
      </div>
      <div className="status">{status}</div>
      <button className="btn primary" onClick={save}>SAVE DECK</button>
      <button className="btn" onClick={() => go({ name: 'menu' })}>BACK</button>
    </div>
  )
}
