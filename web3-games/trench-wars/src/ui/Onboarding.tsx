import { useEffect, useMemo, useState } from 'react'

import { createAccount, connectWallet, createDeck, type Account } from '../api'
import { connectWallet as connectSolana, isWalletAvailable } from '../wallet'
import { CARDS, STARTER_DECK } from '../sim/cards'
import { DECK_SIZE } from '../sim/constants'
import { unlockedCards } from '../game/unlocks'
import { CardTile } from './CardTile'
import { Battle } from './Battle'
import type { Screen } from './Screen'

export type OnboardingStep = 'welcome' | 'identity' | 'deck' | 'battle' | 'complete'

interface Props {
  onComplete: () => void
  go: (s: Screen) => void
  setAccount: (a: Account | null) => void
}

export function Onboarding({ onComplete, setAccount }: Props) {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [account, setLocalAccount] = useState<Account | null>(null)
  const [deck, setDeck] = useState<string[]>([...STARTER_DECK])
  const [status, setStatus] = useState('')

  // Sync account up to App state so the main menu has it immediately.
  useEffect(() => {
    setAccount(account)
  }, [account, setAccount])

  // Signal to e2e smoke tests that the React shell has mounted and is ready.
  useEffect(() => {
    ;(window as any).__TRENCH_READY__ = true
  }, [])

  const handleGuest = async () => {
    setStatus('creating guest account…')
    try {
      const res = await createAccount()
      setLocalAccount(res.account)
      setStatus('')
      setStep('deck')
    } catch (err) {
      setStatus(`guest login failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const handleWallet = async () => {
    setStatus('connecting wallet…')
    try {
      const pubkey = await connectSolana()
      const res = await connectWallet(pubkey)
      setLocalAccount(res.account)
      setStatus('')
      setStep('deck')
    } catch (err) {
      setStatus(`wallet failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const saveDeck = async () => {
    if (deck.length !== DECK_SIZE) { setStatus(`pick exactly ${DECK_SIZE} cards`); return }
    setStatus('saving squad…')
    try {
      await createDeck('main', deck)
      setStatus('')
      setStep('battle')
    } catch (err) {
      setStatus(`save failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  switch (step) {
    case 'welcome':
      return (
        <div className="screen onboarding-welcome">
          <svg className="logo-mark" viewBox="0 0 64 40">
            <path d="M4 36 L32 4 L60 36 L46 36 L32 20 L18 36 Z" fill="#f5e600" />
          </svg>
          <h1>TRENCH ROYALE</h1>
          <div className="tagline">Traders vs Jeets</div>
          <p className="hint">First battle in under 60 seconds.</p>
          <button className="btn primary big" onClick={() => setStep('identity')}>
            ENTER THE TRENCH
          </button>
        </div>
      )

    case 'identity':
      return (
        <div className="screen onboarding-identity">
          <h2>Choose your entry</h2>
          <p className="subtitle">Pick how you want to play. You can connect a wallet later.</p>
          <div className="identity-cards">
            <button className="id-card" onClick={handleGuest} data-testid="onboarding-guest">
              <div className="id-icon">👤</div>
              <h3>Play as Guest</h3>
              <p>Instant access. Local ladder and practice.</p>
            </button>
            {isWalletAvailable() ? (
              <button className="id-card" onClick={handleWallet} data-testid="onboarding-wallet">
                <div className="id-icon">👛</div>
                <h3>Connect Wallet</h3>
                <p>Ranked ladder and $ROYALE rewards.</p>
              </button>
            ) : (
              <div className="id-card disabled">
                <div className="id-icon">👛</div>
                <h3>Connect Wallet</h3>
                <p>Install Phantom to enable ranked rewards.</p>
              </div>
            )}
          </div>
          <div className="status">{status}</div>
        </div>
      )

    case 'deck':
      return (
        <OnboardingDeck
          deck={deck}
          setDeck={setDeck}
          onSave={saveDeck}
          status={status}
        />
      )

    case 'battle':
      return (
        <Battle
          key="onboarding-battle"
          screen={{ name: 'battle', mode: 'practice' }}
          go={() => setStep('complete')}
          tutorial
        />
      )

    case 'complete':
      return (
        <div className="screen onboarding-complete">
          <h2>YOU&apos;RE IN THE TRENCH</h2>
          <p className="subtitle">Your deck is saved. Ready for ranked warfare?</p>
          <button className="btn primary big" onClick={onComplete} data-testid="onboarding-done">
            TO THE TRENCH
          </button>
        </div>
      )
  }
}

function OnboardingDeck({
  deck,
  setDeck,
  onSave,
  status,
}: {
  deck: string[]
  setDeck: React.Dispatch<React.SetStateAction<string[]>>
  onSave: () => void
  status: string
}) {
  const unlocked = useMemo(() => unlockedCards(0), [])
  const starter = useMemo(() => CARDS.filter((c) => unlocked.has(c.id)), [])

  const toggle = (id: string) => {
    setDeck((d) => {
      if (d.includes(id)) return d.filter((c) => c !== id)
      if (d.length >= DECK_SIZE) return d
      return [...d, id]
    })
  }

  return (
    <div className="screen onboarding-deck">
      <h2>Build your squad</h2>
      <p className="subtitle">Pick {DECK_SIZE} starter cards. You can edit this anytime.</p>

      <div className="deck-count-bar">
        <span>
          <b>{deck.length}</b> / {DECK_SIZE} cards
        </span>
        {deck.length === DECK_SIZE && <span className="ready">Squad ready</span>}
      </div>

      <div className="deck-grid">
        {starter.map((c) => (
          <CardTile
            key={c.id}
            cardId={c.id}
            className={deck.includes(c.id) ? 'in-deck' : ''}
            onClick={() => toggle(c.id)}
          />
        ))}
      </div>

      <div className="status">{status}</div>
      <button className="btn primary" onClick={onSave} disabled={deck.length !== DECK_SIZE}>
        DEPLOY SQUAD
      </button>
    </div>
  )
}
