import { useEffect, useMemo, useState } from 'react'
import { createAccount, connectWallet, createDeck, type Account } from '../api'
import { connectWallet as connectSolana, isWalletAvailable } from '../wallet'
import { CARDS, STARTER_DECK } from '../sim/cards'
import { DECK_SIZE } from '../sim/constants'
import { CARD_CHAR } from '../render3d/Battle3D'
import { Battle } from './Battle'
import { TutorialGuide } from './TutorialGuide'
import type { Screen } from './Screen'

export type OnboardingStep = 'welcome' | 'identity' | 'lootbox' | 'deck' | 'levelup' | 'battle' | 'complete'

// First onboarding pack: all 10 starter cards so the player can build an 8-card deck.
const FIRST_PACK = [
  'bag-holder',
  'jeet-horde',
  'paper-hands',
  'chad-trader',
  'diamond-hands',
  'mev-bots',
  'pump-signal',
  'liquidation-cascade',
  'scalper',
  'gas-war',
]

interface Props {
  onComplete: () => void
  go: (s: Screen) => void
  setAccount: (a: Account | null) => void
}

export function Onboarding({ onComplete, setAccount }: Props) {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [account, setLocalAccount] = useState<Account | null>(null)
  const [loot, setLoot] = useState<string[]>([])
  const [deck, setDeck] = useState<string[]>([...STARTER_DECK])
  const [leveledCard, setLeveledCard] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setAccount(account)
  }, [account, setAccount])

  useEffect(() => {
    ;(window as any).__TRENCH_READY__ = true
  }, [])

  const handleGuest = async () => {
    setStatus('creating guest account…')
    try {
      const res = await createAccount()
      setLocalAccount(res.account)
      setStatus('')
      setStep('lootbox')
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
      setStep('lootbox')
    } catch (err) {
      setStatus(`wallet failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const openLootbox = () => {
    setLoot([...FIRST_PACK])
    // Auto-advance to deck after the reveal animation finishes.
    setTimeout(() => setStep('deck'), 1600)
  }

  const saveDeck = async () => {
    if (deck.length !== DECK_SIZE) { setStatus(`pick exactly ${DECK_SIZE} cards`); return }
    setStatus('saving squad…')
    try {
      await createDeck('main', deck)
      setStatus('')
      setStep('levelup')
    } catch (err) {
      setStatus(`save failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const finishLevelUp = () => {
    if (!leveledCard) { setStatus('level up a card first'); return }
    setStep('battle')
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
          <button className="btn primary big" onClick={() => setStep('identity')}>
            ENTER THE TRENCH
          </button>
          <TutorialGuide
            steps={[{ text: 'Welcome to the trench, commander. I am Vanguard. I will walk you through your first battle.' }]}
            onComplete={() => {}}
            startVisible
          />
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
          <TutorialGuide
            steps={[{ text: 'Choose how you want to fight. Guest is instant; wallet unlocks ranked rewards and $ROYALE drops.' }]}
            onComplete={() => {}}
            startVisible
          />
        </div>
      )

    case 'lootbox':
      return (
        <OnboardingLootbox
          loot={loot}
          onOpen={openLootbox}
        />
      )

    case 'deck':
      return (
        <OnboardingDeck
          loot={loot}
          deck={deck}
          setDeck={setDeck}
          onSave={saveDeck}
          status={status}
        />
      )

    case 'levelup':
      return (
        <OnboardingLevelUp
          deck={deck}
          leveledCard={leveledCard}
          setLeveledCard={setLeveledCard}
          onContinue={finishLevelUp}
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
          <p className="subtitle">Your squad is saved and ready for ranked warfare.</p>
          <button className="btn primary big" onClick={onComplete} data-testid="onboarding-done">
            TO THE TRENCH
          </button>
          <TutorialGuide
            steps={[{ text: 'You are ready for ranked warfare. Hit the big gold BATTLE button to climb the ladder.' }]}
            onComplete={() => {}}
            startVisible
          />
        </div>
      )
  }
}

function OnboardingLootbox({ loot, onOpen }: { loot: string[]; onOpen: () => void }) {
  const [opening, setOpening] = useState(false)
  const opened = loot.length > 0

  const handleOpen = () => {
    if (opened) return
    setOpening(true)
    onOpen()
  }

  return (
    <div className="screen onboarding-lootbox">
      <h2>Commander starter pack</h2>
      <p className="subtitle">Every commander needs troops. Open your first pack.</p>
      <div className="lootbox-stage">
        <div className={`lootbox-pack ${opening ? 'shaking' : ''} ${opened ? 'opened' : ''}`} onClick={handleOpen}>
          🎁
        </div>
        {!opened && <div className="lootbox-label">TAP TO OPEN</div>}
        {opened && (
          <div className="lootbox-rewards">
            {loot.map((id) => (
              <LootReward key={id} cardId={id} />
            ))}
          </div>
        )}
      </div>
      <TutorialGuide
        steps={[{ text: 'Tap the pack to reveal your first squad cards. These are your starting troops.' }]}
        onComplete={() => {}}
        startVisible
      />
    </div>
  )
}

function LootReward({ cardId }: { cardId: string }) {
  const card = useMemo(() => CARDS.find((c) => c.id === cardId)!, [cardId])
  const portrait = CARD_CHAR[cardId] ?? 'explorer'
  return (
    <div className="loot-reward">
      <img src={`/assets/3d/portraits/${portrait}.png`} alt={card.name} />
      <span className="rarity">{card.cost} ELIXIR</span>
      <span className="name">{card.name.toUpperCase()}</span>
    </div>
  )
}

function OnboardingDeck({
  loot,
  deck,
  setDeck,
  onSave,
  status,
}: {
  loot: string[]
  deck: string[]
  setDeck: React.Dispatch<React.SetStateAction<string[]>>
  onSave: () => void
  status: string
}) {
  const lootCards = useMemo(() => CARDS.filter((c) => loot.includes(c.id)), [loot])

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
      <p className="subtitle">Pick {DECK_SIZE} cards from your starter pack. Tap to add or remove.</p>

      <div className="deck-count-bar">
        <span>
          <b>{deck.length}</b> / {DECK_SIZE} cards
        </span>
        {deck.length === DECK_SIZE && <span className="ready">Squad ready</span>}
      </div>

      <div className="deck-grid">
        {lootCards.map((c) => (
          <div
            key={c.id}
            className={`tile-wrap ${deck.includes(c.id) ? '' : 'dimmed'}`}
            onClick={() => toggle(c.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`card-tile ${deck.includes(c.id) ? 'in-deck' : ''}`}>
              <span className="cost-chip">{c.cost}</span>
              {CARD_CHAR[c.id] ? (
                <img src={`/assets/3d/portraits/${CARD_CHAR[c.id]}.png`} alt={c.name} draggable={false} />
              ) : (
                <span className="spell-glyph">✦</span>
              )}
              <span className="nm">{c.name.toUpperCase()}</span>
            </div>
            {!deck.includes(c.id) && <div className="add-badge">+</div>}
          </div>
        ))}
      </div>

      <div className="status">{status}</div>
      <button className="btn primary" onClick={onSave} disabled={deck.length !== DECK_SIZE}>
        DEPLOY SQUAD
      </button>
      <TutorialGuide
        steps={[{ text: 'Pick exactly 8 cards for your squad. A good mix of cheap swarm and heavy hitters works best.' }]}
        onComplete={() => {}}
        startVisible
      />
    </div>
  )
}

function OnboardingLevelUp({
  deck,
  leveledCard,
  setLeveledCard,
  onContinue,
  status,
}: {
  deck: string[]
  leveledCard: string | null
  setLeveledCard: (id: string) => void
  onContinue: () => void
  status: string
}) {
  const deckCards = useMemo(() => CARDS.filter((c) => deck.includes(c.id)), [deck])

  return (
    <div className="screen onboarding-levelup">
      <h2>Level up a card</h2>
      <p className="subtitle">Pick one card to boost. Higher level means more HP and damage.</p>

      <div className="levelup-pool">
        {deckCards.map((c) => {
          const isLeveled = leveledCard === c.id
          return (
            <div
              key={c.id}
              className={`levelup-card ${isLeveled ? 'selected leveled' : ''}`}
              onClick={() => setLeveledCard(c.id)}
            >
              <div className="lv-badge">{isLeveled ? 2 : 1}</div>
              <img src={`/assets/3d/portraits/${CARD_CHAR[c.id] ?? 'explorer'}.png`} alt={c.name} />
              <span className="name">{c.name.toUpperCase()}</span>
              {isLeveled && (
                <span className="stat-bump">
                  +{Math.round((c.hp ?? 100) * 0.1)} HP · +{Math.round((c.damage ?? 20) * 0.1)} DMG
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="status">{status}</div>
      <button className="btn primary" onClick={onContinue} disabled={!leveledCard}>
        CONTINUE
      </button>
      <TutorialGuide
        steps={[{ text: 'Tap a card to level it up. Your favorite troop will hit harder and survive longer.' }]}
        onComplete={() => {}}
        startVisible
      />
    </div>
  )
}
