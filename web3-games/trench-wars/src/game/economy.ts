export type BalanceKey = 'gold' | 'gem'

const BALANCE_KEYS: Record<BalanceKey, string> = {
  gold: 'trench-royale-balance-gold',
  gem: 'trench-royale-balance-gem',
}
const COLLECTION_KEY = 'trench-royale-collection'

const DEFAULT_BALANCES: Record<BalanceKey, number> = {
  gold: 1000,
  gem: 100,
}

function createMemoryStorage(): Storage {
  const mem: Record<string, string | null> = {}
  return {
    getItem(key) {
      return mem[key] ?? null
    },
    setItem(key, value) {
      mem[key] = value
    },
    removeItem(key) {
      delete mem[key]
    },
    clear() {
      for (const key in mem) delete mem[key]
    },
    key(index) {
      return Object.keys(mem)[index] ?? null
    },
    get length() {
      return Object.keys(mem).length
    },
  } as Storage
}

let fallbackStorage: Storage | null = null

function getStorage(): Storage {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage
  }
  if (!fallbackStorage) fallbackStorage = createMemoryStorage()
  return fallbackStorage
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = getStorage().getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    getStorage().setItem(key, JSON.stringify(value))
  } catch {}
}

export function getBalance(currency: BalanceKey): number {
  const raw = getStorage().getItem(BALANCE_KEYS[currency])
  if (raw == null) return DEFAULT_BALANCES[currency]
  const n = Number(raw)
  return Number.isFinite(n) ? n : DEFAULT_BALANCES[currency]
}

export function setBalance(currency: BalanceKey, value: number) {
  getStorage().setItem(BALANCE_KEYS[currency], String(value))
}

export function spend(currency: BalanceKey, amount: number): boolean {
  if (amount <= 0) return true
  const current = getBalance(currency)
  if (current < amount) return false
  setBalance(currency, current - amount)
  return true
}

export function getCollection(): Record<string, number> {
  return readJson(COLLECTION_KEY, {})
}

export function addCards(cardIds: string[]) {
  const collection = getCollection()
  for (const id of cardIds) {
    collection[id] = (collection[id] ?? 0) + 1
  }
  writeJson(COLLECTION_KEY, collection)
}

export function hasCard(id: string): boolean {
  return (getCollection()[id] ?? 0) > 0
}

/** Test helper: wipe local economy state. */
export function resetEconomy() {
  for (const key of Object.values(BALANCE_KEYS)) {
    getStorage().removeItem(key)
  }
  getStorage().removeItem(COLLECTION_KEY)
}
