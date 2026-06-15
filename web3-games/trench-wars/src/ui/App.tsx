import { useEffect, useState } from 'react'
import { Menu } from './Menu'
import { DeckBuilder } from './DeckBuilder'
import { Battle } from './Battle'
import { Landing } from '../landing/Landing'
import { Onboarding } from './Onboarding'
import type { Screen } from './Screen'
import type { Account } from '../api'

const ONBOARDING_KEY = 'trench-royale-onboarding-complete'

function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1'
  } catch {
    return false
  }
}

export function App() {
  const initialScreen: Screen = { name: isOnboardingComplete() ? 'menu' : 'landing' }
  const [screen, setScreen] = useState<Screen>(initialScreen)
  const [account, setAccount] = useState<Account | null>(null)

  // Re-evaluate the onboarding flag whenever we return to landing (edge case: reset).
  useEffect(() => {
    if (screen.name === 'landing') {
      setScreen(isOnboardingComplete() ? { name: 'menu' } : { name: 'landing' })
    }
  }, [screen.name])

  const finishOnboarding = () => {
    try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
    setScreen({ name: 'menu' })
  }

  switch (screen.name) {
    case 'landing':
      return <Landing onEnter={() => setScreen({ name: 'onboarding' })} />
    case 'onboarding':
      return <Onboarding onComplete={finishOnboarding} go={setScreen} setAccount={setAccount} />
    case 'menu':
      return <Menu account={account} setAccount={setAccount} go={setScreen} />
    case 'deck':
      return <DeckBuilder go={setScreen} />
    case 'battle':
      return <Battle key={`${screen.mode}-${screen.defenderId ?? 'ai'}`} screen={screen} go={setScreen} />
  }
}
