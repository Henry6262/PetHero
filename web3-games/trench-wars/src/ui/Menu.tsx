import { useEffect, useState, Suspense, lazy } from 'react'
import { createAccount, getMe, getOpponent, connectWallet, getDecks } from '../api'
import type { Account, Deck } from '../api'
import { connectWallet as connectSolana, isWalletAvailable } from '../wallet'
import { DECK_SIZE } from '../sim/constants'
import { Icon } from './Icon'
import { TrenchCard } from './TrenchCard'
import { Shop } from './Shop'
import type { Screen } from './Screen'

interface Props {
  account: Account | null
  setAccount: (a: Account | null) => void
  go: (s: Screen) => void
}

type Tab = 'battle' | 'deck' | 'loot' | 'leaderboard'

const MenuDiorama = lazy(() => import('./MenuDiorama').then((m) => ({ default: m.MenuDiorama })))

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

  const displayName = account ? (account.wallet ?? account.id).slice(0, 8).toUpperCase() : 'COMMANDER'
  const shortName = account ? (account.wallet ?? account.id).slice(0, 2).toUpperCase() : '??'

  return (
    <div className="screen cr-menu">
      {/* Resource header */}
      <header className="cr-topbar">
        <div className="cr-profile">
          <div className="cr-avatar">{shortName}</div>
          <div className="cr-name">
            <div>{displayName}</div>
            <small>{account ? 'ONLINE' : 'GUEST'}</small>
          </div>
        </div>
        <div className="cr-resources">
          <div className="cr-resource" title="Trophies">
            <Icon name="ladder" size={16} color="#f5c842" />
            <span>{account?.elo ?? 1000}</span>
          </div>
          <div className="cr-resource" title="Wins">
            <Icon name="crown" size={16} color="#2bff88" />
            <span>{account?.wins ?? 0}</span>
          </div>
          <div className="cr-resource cr-resource-gold" title="Gold">
            <Icon name="loot" size={16} color="#f5c842" />
            <span>0</span>
          </div>
          <div className="cr-resource cr-resource-token" title="$ROYALE">
            <Icon name="elixir" size={16} color="#b44dff" />
            <span>0</span>
          </div>
        </div>
      </header>

      {/* Season pass progress */}
      <div className="cr-pass-bar">
        <div className="cr-pass-info">
          <Icon name="loot" size={14} />
          <span>SEASON PASS · LVL 1</span>
        </div>
        <div className="cr-pass-track">
          <div className="cr-pass-fill" style={{ width: '12%' }} />
        </div>
        <div className="cr-pass-claim">
          <button className="cr-pass-btn">CLAIM</button>
        </div>
      </div>

      {/* Main stage */}
      <main className="cr-stage">
        {activeTab === 'battle' && (
          <>
            <div className="cr-diorama-wrap">
              <Suspense fallback={<div className="cr-diorama-fallback">RAISING THE TRENCH…</div>}>
                <MenuDiorama />
              </Suspense>
            </div>

            <button className="cr-battle-btn" onClick={startLadder} data-testid="battle">
              <span className="cr-battle-icon"><Icon name="battle" size={48} /></span>
              <span>BATTLE</span>
            </button>

            <div className="cr-daily-banner">
              <div className="cr-daily-icon"><Icon name="loot" size={22} /></div>
              <div className="cr-daily-body">
                <div className="cr-daily-title">DAILY BONUS</div>
                <div className="cr-daily-sub">Win 2 matches for a free pack</div>
              </div>
              <div className="cr-daily-progress">0/2</div>
            </div>

            <div className="cr-secondary-actions">
              <button className="cr-sec-btn" onClick={startPractice} data-testid="practice">
                <Icon name="practice" size={16} /> PRACTICE VS AI
              </button>
              <button className="cr-sec-btn" onClick={openDeck} data-testid="deck">
                <Icon name="deck" size={16} /> DECK BUILDER
              </button>
            </div>

            {deck && (
              <div className="cr-deck-preview" onClick={openDeck}>
                <div className="cr-deck-label">CURRENT SQUAD</div>
                <div className="cr-deck-cards">
                  {(deck.cards.length ? deck.cards : Array.from({ length: DECK_SIZE }, () => '')).map((id, i) =>
                    id ? <TrenchCard key={i} cardId={id} size="sm" showRibbon={false} /> : <div key={i} className="cr-deck-empty" />
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

        {activeTab === 'loot' && <Shop />}

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
          { id: 'battle', label: 'BATTLE', icon: 'battle' },
          { id: 'deck', label: 'DECK', icon: 'deck' },
          { id: 'loot', label: 'LOOT', icon: 'loot' },
          { id: 'leaderboard', label: 'LADDER', icon: 'ladder' },
        ] as { id: Tab; label: string; icon: string }[]).map((t) => (
          <button
            key={t.id}
            className={`cr-nav-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="cr-nav-icon"><Icon name={t.icon} size={22} /></span>
            <span className="cr-nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
