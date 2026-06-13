import { runMatchVsAi, AI_LEVELS } from '../src/sim/ai'
import { MATCH_TICKS, OVERTIME_TICKS } from '../src/sim/constants'

const STARTER = ['bag-holder', 'jeet-horde', 'paper-hands', 'chad-trader', 'diamond-hands', 'mev-bots', 'pump-signal', 'liquidation-cascade']
const NEWDECK = ['scalper', 'discord-raid', 'moon-boy', 'trading-bot', 'gas-war', 'copium', 'chad-trader', 'whale']

function series(label: string, d0: string[], d1: string[], n = 40) {
  let w0 = 0, w1 = 0, draws = 0, timeouts = 0, totalTicks = 0
  const lvl = AI_LEVELS[2] // Quant, mid
  for (let seed = 1; seed <= n; seed++) {
    const s = runMatchVsAi(seed, [d0, d1], lvl, lvl)
    totalTicks += s.tick
    if (s.tick >= 3000) timeouts++
    if (!s.result || s.result.winner === null) draws++
    else if (s.result.winner === 0) w0++
    else w1++
  }
  const maxTicks = MATCH_TICKS + OVERTIME_TICKS
  console.log(`${label}: p0 ${w0} / p1 ${w1} / draw ${draws} / timeout ${timeouts}  avg ${(totalTicks / n / 10).toFixed(0)}s (cap ${maxTicks / 10}s)`)
}

series('starter mirror', STARTER, STARTER)
series('newdeck mirror', NEWDECK, NEWDECK)
series('starter vs newdeck', STARTER, NEWDECK)
series('newdeck vs starter', NEWDECK, STARTER)
