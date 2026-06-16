const PROD_API_URL = 'https://trench-wars-api-production.up.railway.app/api'
const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.PROD ? PROD_API_URL : 'http://localhost:3001/api')

export interface Account {
  id: string
  wallet: string | null
  elo: number
  wins: number
  losses: number
  createdAt: string
}

export interface Deck {
  id: string
  name: string
  cards: string[]
  updatedAt: string
}

export interface Opponent {
  account: Account
  deck: Deck
}

export interface MatchSubmitPayload {
  seed: number
  attackerDeck: string[]
  defenderId: string
  commands: { tick: number; player: number; cardId: string; x: number; y: number }[]
  claimedWinner: 0 | 1 | null
  fingerprint: string
}

export interface MatchResult {
  match: {
    id: string
    attackerId: string
    defenderId: string
    winner: number
    attackerEloChange: number
    defenderEloChange: number
    replayHash: string
  }
  eloDelta: number
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `${res.status}`)
  }
  return body as T
}

export async function createAccount(): Promise<{ account: Account }> {
  return api<{ account: Account }>('/accounts', { method: 'POST' })
}

export async function connectWallet(wallet: string): Promise<{ account: Account }> {
  return api<{ account: Account }>('/accounts/connect', { method: 'POST', body: JSON.stringify({ wallet }) })
}

export async function getMe(): Promise<{ account: Account }> {
  return api<{ account: Account }>('/accounts/me')
}

export async function getOpponent(elo: number, excludeId: string): Promise<Opponent> {
  return api<Opponent>(`/ladder/opponent?elo=${elo}&excludeId=${excludeId}`)
}

export async function submitMatch(payload: MatchSubmitPayload): Promise<MatchResult> {
  return api<MatchResult>('/matches', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getDecks(): Promise<{ decks: Deck[] }> {
  return api<{ decks: Deck[] }>('/decks')
}

export async function createDeck(name: string, cards: string[]): Promise<{ deck: Deck }> {
  return api<{ deck: Deck }>('/decks', { method: 'POST', body: JSON.stringify({ name, cards }) })
}

export async function updateDeck(id: string, name: string, cards: string[]): Promise<{ deck: Deck }> {
  return api<{ deck: Deck }>(`/decks/${id}`, { method: 'PUT', body: JSON.stringify({ name, cards }) })
}
