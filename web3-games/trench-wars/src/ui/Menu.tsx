import { useEffect, useState } from 'react'
import { createAccount, getMe, getOpponent, connectWallet, getDecks } from '../api'
import type { Account, Deck } from '../api'
import { connectWallet as connectSolana, isWalletAvailable } from '../wallet'
import { DECK_SIZE } from '../sim/constants'
import { CARD_CHAR } from '../render3d/Battle3D'
import type { Screen } from './Screen'

interface Props {
  account: Account | null
  setAccount: (a: Account | null) => void
  go: (s: Screen) => void
}

type Tab = 'battle' | 'deck' | 'loot' | 'leaderboard'

export function Menu({ account, setAccount, go }: Props) {
  const [status, setStatus] = useState('')
  const [deck, setDeck] = useState<Deck | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('battle')

  useEffect(() => {
    ;(window as any).__TRENCH_READY__ = true
    if (account) {
      loadDeck()
      return
    }
    getMe()
      .then((me) => {
        setAccount(me.account)
        loadDeck()
      })
      .catch(() => setStatus('sign in to play ranked'))
  }, [account?.id])

  const loadDeck = () => {
    getDecks()
      .then(({ decks }) => setDeck(decks[0] ?? null))
      .catch(() => setDeck(null))
  }

  const handleGuest = async () => {
    setStatus('creating guest account…')
    try {
      const res = await createAccount()
      setAccount(res.account)
      setStatus('')
    } catch (err) {
      setStatus(`guest login failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const handleWallet = async () => {
    setStatus('connecting wallet…')
    try {
      const pubkey = await connectSolana()
      const res = await connectWallet(pubkey)
      setAccount(res.account)
      setStatus('')
    } catch (err) {
      setStatus(`wallet failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const startLadder = async () => {
    if (!account) { setStatus('sign in first'); return }
    setStatus('finding opponent…')
    try {
      const opponent = await getOpponent(account.elo, account.id)
      go({ name: 'battle', mode: 'ladder', defenderId: opponent.account.id, defenderDeck: opponent.deck.cards })
    } catch (err) {
      setStatus(`matchmaking failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const startPractice = () => go({ name: 'battle', mode: 'practice' })
  const openDeck = () => go({ name: 'deck' })

  return (
    <div className="screen cr-menu">
      {/* Top bar */}
      <header className="cr-topbar">
        <div className="cr-profile">
          <div className="cr-avatar">{account ? (account.wallet ?? account.id).slice(0, 2).toUpperCase() : '??'}</div>
          <div className="cr-name">
            <div>{account ? (account.wallet ?? account.id).slice(0, 8).toUpperCase() : 'COMMANDER'}</div>
            <small>{account ? 'ONLINE' : 'GUEST'}</small>
          </div>
        </div>
        <div className="cr-stats">
          <div className="cr-stat">
            <span className="cr-stat-value">{account?.elo ?? 1000}</span>
            <span className="cr-stat-label">ELO</span>
          </div>
          <div className="cr-stat">
            <span className="cr-stat-value">{account?.wins ?? 0}</span>
            <span className="cr-stat-label">WINS</span>
          </div>
        </div>
      </header>

      {/* Main stage */}
      <main className="cr-stage">
        {activeTab === 'battle' && (
          <>
            <button className="cr-battle-btn" onClick={startLadder} data-testid="battle">
              <span className="cr-battle-icon">⚔</span>
              <span>BATTLE</span>
            </button>

            <div className="cr-secondary-actions">
              <button className="cr-sec-btn" onClick={startPractice} data-testid="practice">
                <span>🎯</span> PRACTICE VS AI
              </button>
              <button className="cr-sec-btn" onClick={openDeck} data-testid="deck">
                <span>🎴</span> DECK BUILDER
              </button>
            </div>

            {deck && (
              <div className="cr-deck-preview" onClick={openDeck}>
                <div className="cr-deck-label">CURRENT SQUAD</div>
                <div className="cr-deck-cards">
                  {(deck.cards.length ? deck.cards : Array.from({ length: DECK_SIZE }, () => '')).map((id, i) =>
                    id ? (
                      <img
                        key={i}
                        src={`/assets/3d/portraits/${CARD_CHAR[id] ?? 'explorer'}.png`}
                        alt=""
                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/3d/portraits/explorer.png' }}
                      />
                    ) : (
                      <div key={i} className="cr-deck-empty" />
                    )
                  )}
                </div>
              </div>
            )}

            {!account && (
              <div className="cr-signin-prompt">
                <button className="btn primary" onClick={handleGuest} data-testid="guest">PLAY AS GUEST</button>
                {isWalletAvailable() && (
                  <button className="btn" onClick={handleWallet}>CONNECT WALLET</button>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'deck' && (
          <div className="cr-tab-panel">
            <h3>DECK BUILDER</h3>
            <p>Build and upgrade your squad.</p>
            <button className="btn primary" onClick={openDeck}>OPEN DECK BUILDER</button>
          </div>
        )}

        {activeTab === 'loot' && (
          <div className="cr-tab-panel">
            <h3>LOOT</h3>
            <p>Spend $ROYALE on card packs and lootboxes.</p>
            <div className="cr-coming-soon">Coming soon</div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="cr-tab-panel">
            <h3>LEADERBOARD</h3>
            <p>Global ranked standings.</p>
            <div className="cr-coming-soon">Coming soon</div>
          </div>
        )}

        <div className="status">{status}</div>
      </main>

      {/* Bottom nav */}
      <nav className="cr-bottom-nav">
        {([
          { id: 'battle', label: 'BATTLE', icon: '⚔' },
          { id: 'deck', label: 'DECK', icon: '🎴' },
          { id: 'loot', label: 'LOOT', icon: '🎁' },
          { id: 'leaderboard', label: 'LADDER', icon: '🏆' },
        ] as { id: Tab; label: string; icon: string }[]).map((t) => (
          <button
            key={t.id}
            className={`cr-nav-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="cr-nav-icon">{t.icon}</span>
            <span className="cr-nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
