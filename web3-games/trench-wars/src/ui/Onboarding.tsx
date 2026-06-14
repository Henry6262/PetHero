import { useEffect, useMemo, useState } from 'react'
import { Icon } from './Icon'
import { createAccount, connectWallet, createDeck, type Account } from '../api'
import { connectWallet as connectSolana, isWalletAvailable } from '../wallet'
import { CARDS, STARTER_DECK, getCard } from '../sim/cards'
import { DECK_SIZE } from '../sim/constants'
import { Battle } from './Battle'
import { TutorialGuide } from './TutorialGuide'
import { TrenchCard } from './TrenchCard'
import { PackOpen } from './PackOpen'
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
    setStep('deck')
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
              <div className="id-icon"><Icon name="guest" size={42} /></div>
              <h3>Play as Guest</h3>
              <p>Instant access. Local ladder and practice.</p>
            </button>
            {isWalletAvailable() ? (
              <button className="id-card" onClick={handleWallet} data-testid="onboarding-wallet">
                <div className="id-icon"><Icon name="wallet" size={42} /></div>
                <h3>Connect Wallet</h3>
                <p>Ranked ladder and $ROYALE rewards.</p>
              </button>
            ) : (
              <div className="id-card disabled">
                <div className="id-icon"><Icon name="wallet" size={42} /></div>
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
        <OnboardingLootbox onOpen={openLootbox} />
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

function OnboardingLootbox({ onOpen }: { onOpen: () => void }) {
  // The first pack is the fixed FIRST_PACK; reveal it through the cinematic PackOpen.
  return (
    <div className="screen onboarding-lootbox">
      <h2>Commander starter pack</h2>
      <p className="subtitle">Every commander needs troops. Open your first pack.</p>
      <PackOpen cardIds={FIRST_PACK} onDone={onOpen} />
      <TutorialGuide
        steps={[{ text: 'Tap the chest to reveal your squad cards one by one. These are your starting troops.' }]}
        onComplete={() => {}}
        startVisible
      />
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
          <TrenchCard
            key={c.id}
            cardId={c.id}
            size="md"
            state={deck.includes(c.id) ? 'in-deck' : 'dimmed'}
            onClick={() => toggle(c.id)}
          />
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
  const [punch, setPunch] = useState(false)
  const hero = leveledCard ? getCard(leveledCard) : null

  const pick = (id: string) => {
    setLeveledCard(id)
    setPunch(false)
    requestAnimationFrame(() => setPunch(true))
  }

  return (
    <div className="screen onboarding-levelup">
      <h2>Level up a card</h2>
      <p className="subtitle">Pick one card to boost. Higher level means more HP and damage.</p>

      {hero && (
        <div className={`levelup-hero ${punch ? 'punch' : ''}`}>
          <div className="lu-card" style={{ position: 'relative' }}>
            <div className="lu-ring" />
            <TrenchCard cardId={hero.id} size="lg" level={2} showRibbon />
          </div>
          <div className="lu-bars" key={hero.id}>
            <div className="lu-bar">HP<div className="track"><div className="fill hp" style={{ width: punch ? '90%' : '70%' }} /></div>
              <span className="lu-float">+{Math.round((hero.hp ?? 100) * 0.1)}</span></div>
            <div className="lu-bar">DMG<div className="track"><div className="fill dmg" style={{ width: punch ? '85%' : '65%' }} /></div>
              <span className="lu-float">+{Math.round((hero.damage ?? 20) * 0.1)}</span></div>
          </div>
        </div>
      )}

      <div className="levelup-pool">
        {deckCards.map((c) => (
          <TrenchCard
            key={c.id}
            cardId={c.id}
            size="sm"
            state={leveledCard === c.id ? 'selected' : undefined}
            onClick={() => pick(c.id)}
          />
        ))}
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
