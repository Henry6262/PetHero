import { useState } from 'react'
import { Menu } from './Menu'
import { DeckBuilder } from './DeckBuilder'
import { Battle } from './Battle'
import type { Account } from '../api'

export type Screen =
  | { name: 'menu' }
  | { name: 'deck' }
  | { name: 'battle'; mode: 'practice' | 'ladder'; defenderId?: string; defenderDeck?: string[] }

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })
  const [account, setAccount] = useState<Account | null>(null)

  switch (screen.name) {
    case 'menu':
      return <Menu account={account} setAccount={setAccount} go={setScreen} />
    case 'deck':
      return <DeckBuilder go={setScreen} />
    case 'battle':
      return <Battle key={`${screen.mode}-${screen.defenderId ?? 'ai'}`} screen={screen} go={setScreen} />
  }
}
