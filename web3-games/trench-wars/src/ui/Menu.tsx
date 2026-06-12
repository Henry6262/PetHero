import { useEffect, useState } from 'react'
import { createAccount, getMe, getOpponent, connectWallet } from '../api'
import type { Account } from '../api'
import { connectWallet as connectSolana, isWalletAvailable } from '../wallet'
import type { Screen } from './App'

interface Props {
  account: Account | null
  setAccount: (a: Account | null) => void
  go: (s: Screen) => void
}

export function Menu({ account, setAccount, go }: Props) {
  const [status, setStatus] = useState('')

  useEffect(() => {
    ;(window as any).__TRENCH_READY__ = true
    if (account) return
    getMe()
      .then((me) => setAccount(me.account))
      .catch(() => setStatus('sign in to play ranked ladder'))
  }, [])

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

  const handleLadder = async () => {
    if (!account) { setStatus('sign in first'); return }
    setStatus('finding opponent…')
    try {
      const opponent = await getOpponent(account.elo, account.id)
      go({ name: 'battle', mode: 'ladder', defenderId: opponent.account.id, defenderDeck: opponent.deck.cards })
    } catch (err) {
      setStatus(`matchmaking failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  return (
    <div className="screen menu">
      <svg className="logo-mark" viewBox="0 0 64 40">
        <path d="M4 36 L32 4 L60 36 L46 36 L32 20 L18 36 Z" fill="#f5e600" />
      </svg>
      <h1>TRENCH WARS</h1>
      <div className="tagline">Traders vs Jeets</div>

      <div className="heroes">
        <img src="/assets/3d/portraits/explorer.png" alt="" />
        <img src="/assets/3d/portraits/vanguard.png" alt="" />
        <img src="/assets/3d/portraits/crimson.png" alt="" />
      </div>

      {account && (
        <div className="account">
          {(account.wallet ?? account.id).slice(0, 8).toUpperCase()} · ELO <b>{account.elo}</b> · {account.wins}W/{account.losses}L
        </div>
      )}
      <div className="status">{status}</div>

      {!account ? (
        <>
          <button className="btn primary" onClick={handleGuest} data-testid="guest">PLAY AS GUEST</button>
          {isWalletAvailable() && (
            <button className="btn" onClick={handleWallet}>CONNECT WALLET</button>
          )}
        </>
      ) : (
        <>
          <button className="btn primary" onClick={() => go({ name: 'battle', mode: 'practice' })} data-testid="practice">
            PRACTICE VS AI
          </button>
          <button className="btn" onClick={handleLadder}>LADDER MATCH</button>
          <button className="btn" onClick={() => go({ name: 'deck' })} data-testid="deck">DECK BUILDER</button>
        </>
      )}
    </div>
  )
}
