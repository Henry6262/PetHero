import { AI_LEVELS, type AiLevel } from '../sim/ai'

const KEY = 'trench-wars-ladder-level'
const WINS_KEY = 'trench-wars-total-wins'

/** Storage injected so tests run in Node; browser passes window.localStorage. */
export class Ladder {
  private storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  levelIndex(): number {
    const raw = this.storage.getItem(KEY)
    const n = raw === null ? 0 : parseInt(raw, 10)
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), AI_LEVELS.length - 1) : 0
  }

  currentLevel(): AiLevel {
    return AI_LEVELS[this.levelIndex()]
  }

  /** Lifetime wins — drives card unlocks. */
  totalWins(): number {
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
