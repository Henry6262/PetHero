import { AI_LEVELS, type AiLevel } from '../sim/ai'

const KEY = 'trench-royale-ladder-level'
const WINS_KEY = 'trench-royale-total-wins'
const OLD_KEY = 'trench-wars-ladder-level'
const OLD_WINS_KEY = 'trench-wars-total-wins'

/** Storage injected so tests run in Node; browser passes window.localStorage. */
export class Ladder {
  private storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  /** One-time rename migration so existing local progress survives the Trench Wars → Trench Royale rebrand. */
  private migrate(): void {
    for (const [oldK, newK] of [[OLD_KEY, KEY], [OLD_WINS_KEY, WINS_KEY]] as const) {
      const old = this.storage.getItem(oldK)
      if (old != null && this.storage.getItem(newK) == null) {
        this.storage.setItem(newK, old)
        this.storage.removeItem(oldK)
      }
    }
  }

  levelIndex(): number {
    this.migrate()
    const raw = this.storage.getItem(KEY)
    const n = raw === null ? 0 : parseInt(raw, 10)
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), AI_LEVELS.length - 1) : 0
  }

  currentLevel(): AiLevel {
    return AI_LEVELS[this.levelIndex()]
  }

  /** Lifetime wins — drives card unlocks. */
  totalWins(): number {
    this.migrate()
    const n = parseInt(this.storage.getItem(WINS_KEY) ?? '0', 10)
    return Number.isFinite(n) ? Math.max(0, n) : 0
  }

  recordWin(): void {
    this.storage.setItem(KEY, String(Math.min(this.levelIndex() + 1, AI_LEVELS.length - 1)))
    this.storage.setItem(WINS_KEY, String(this.totalWins() + 1))
  }

  recordLoss(): void {
    this.storage.setItem(KEY, String(Math.max(this.levelIndex() - 1, 0)))
  }
}
