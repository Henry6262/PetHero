# StreetRivalz — Design Spec

**Date:** 2026-06-12
**Status:** Approved by Henry (brainstorm 2026-06-12)
**Location:** `web3-games/street-rivalz/` (monorepo folder; standalone repo later, like other web3-games)
**Name:** StreetRivalz (chosen by Henry 2026-06-12; "Need for Trench" considered and rejected). The marquee track keeps the "Moonaco" name (Monaco × moon street circuit). Ticker TBD at launch — $RIVALZ is the working candidate.

## 1. Concept

Browser-based 3D kart racer with a crypto-meme grand prix theme. Drift, boost, and throw meme items at rivals across candlestick canyons and the Moonaco street circuit. 100% free, instantly playable in the browser, wallet-optional. Launches with a pump.fun token; trading creator fees fund F1-style seasonal Grand Prix prize pools. Narrative: **"trading volume pays the podium."**

Design pillars (Henry's brief):
1. **Low skill floor, competitive ceiling** — items + assists keep anyone in the race; drift-boost mastery and racecraft separate the top of the ladder.
2. **Super customizable** — the Garage is a core pillar and the primary future token sink.
3. **Tournaments** — recurring F1-style Grand Prix events (qualifying → finals → SOL podium) as the token's repeating hype beat.

## 2. Why this game (market basis, researched 2026-06-11)

- The pump.fun gaming meta is saturated with idle/farm/text/clicker games; no real-time skill game exists in the browser meta.
- **Racing is a confirmed open gap** — zero browser racing games with a token. (CR-style lane battler was the prior pick — spec'd 2026-06-12 — but Henry pivoted to racing; the lane battler spec remains on the shelf.)
- Racing's noted weakness (wager/season loop) is addressed head-on by making the Grand Prix tournament structure a launch pillar rather than an afterthought.
- Proven success patterns adopted: instant free browser play, wallet-optional entry, creator-fee-funded prize pools, ranked seasons, wagering layer later, stream-friendly short races.

## 3. Game core (v1 — token launch build, ~1.5-2 weeks)

### Simulation
- **Deterministic fixed-tick sim in pure TypeScript** — custom arcade kart physics (NOT a general physics engine), no rendering dependencies, seeded RNG, fully unit-testable. The same sim module runs:
  - client-side for races vs AI and ghost playback (v1),
  - server-side for replay/ghost verification (anti-cheat),
  - server-side on Colyseus for real-time multiplayer (Season 1).
- A run/replay = `{ seed, carConfig, [tick, inputs][] }`. Re-simulation reproduces the result exactly. A ghost is just a verified replay rendered as a translucent kart.

### Driving model
- Arcade kart physics: acceleration curves, grip, drift state machine with **mini-boost chains** (hold drift → tiered boost on release), slipstream, wall/kart collisions (simplified, deterministic).
- **Assists (the low floor):** optional auto-accelerate and steering assist, on by default for new players, toggleable. Ladder/Grand Prix allows assists — items and racecraft, not twitch reflexes, are the equalizer.

### Race rules
- 3-lap races, 6 karts (player + 5 AI in v1). Checkpoint-gated lap validation (anti-cut).
- Rubber-banded AI keeps races close at the back, honest at the front.
- Item boxes on track; one held item slot.

### Modes at launch
1. **Quick Race** — instant play vs 5 rubber-banded AI. Items work because there are real targets on track.
2. **Time Trial + Ghost PvP** — race the actual recorded ghosts of real players; Elo-style ranked ladder. Zero netcode, works with 12 players online at 3am.
3. **Grand Prix (v1 format)** — scheduled weekend event on the Moonaco circuit: all week = qualifying (time trial), weekend = finals leaderboard, SOL podium payouts from creator fees.
4. **Real-time multiplayer** ships post-launch as the Season 1 hype beat (§8).

## 4. Theme & launch content (Crypto Meme Grand Prix)

### Car roster (bodies = meme archetypes, light MK-style stat flavor — all earnable, no pay-to-win)

| Body | Archetype | Stat flavor |
|---|---|---|
| Whale Limo | Heavy | Top speed, slow accel, hard to shove |
| Jeet Tuk-Tuk | Light | Fast accel, fragile, bounces off everything |
| Diamond Hands Monster Truck | Tank | Knocks others aside, mid speed |
| Rug Dev Getaway Car | Drift | Best drift/handling, slippery |
| MEV Bot F1 | Glass cannon | Highest speed, worst collision recovery |
| Paper Hands Scooter | Starter/comedy | Balanced-bad, free default |

### Items (the meme weapons / catch-up mechanic)

| Item | Effect |
|---|---|
| Pump Rocket | Homing projectile at the kart ahead |
| Rug Pull | Dropped trap — spins out whoever hits it |
| FUD Cloud | AoE slow + screen fog on karts inside |
| Diamond Shield | Blocks the next hit |
| Candle Boost | Green candle = instant speed burst |
| Liquidation Wave | Hits every kart ahead of you (the "blue shell") |

Item distribution weighted by position (worse position → stronger items). Stats/costs/weights in JSON config (`game-data/` pattern, Sin-City precedent) so balance patches need no code change.

### Tracks (3 at launch)
1. **Moonaco** — marquee street circuit (Monte-Carlo-style barriers, harbor, casino corner — crypto-casino skin). Grand Prix home track.
2. **Candlestick Canyon** — desert canyon of red/green candle rock formations.
3. **The Trenches** — war-themed mud circuit, shared universe with the (shelved) Trench Wars theme.

## 5. Garage (customization pillar)

- Slots: body, wheels, spoiler, paint, decals, boost-flame/trail effect.
- Every slot has free items earnable by racing (race XP / challenge unlocks). Holder tiers and token chests add cosmetic-only depth later (§7).
- Stat flavor lives ONLY on bodies; all other slots are pure cosmetics.

## 6. Asset pipeline

- Henry generates car GLBs via **Meshy AI / Rodin** (existing paid pipeline) — **detached-wheels convention:**
  - Named nodes: `body`, `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR` (cosmetic slots as additional named nodes: `spoiler`, etc.)
  - Consistent forward axis (+Z), real-world-ish scale, origin at ground center.
  - Enables runtime wheel spin, steering angle, drift lean, suspension bounce.
- **GLB validator script** checks node names/axes/scale on import; a car that passes the validator is drop-in playable.
- Tracks: modular track-piece kit (road segments, barriers, props) + Meshy-generated theme props; assembled in code/JSON track definitions.
- Existing assets reusable where fitting (82 GLBs in Web3-Poker env props, 56 in Sin-City buildings for trackside set dressing).

## 7. Token economy ("all 3", phased — sinks-only, no emissions)

| Phase | Mechanic |
|---|---|
| **Launch (day 1)** | Free play, ALL content earnable — no pay-to-win. Pump.fun creator fees (≤0.95% of trading volume; Creator Fee Sharing across up to 10 wallets — GoPumpMe-validated) fund the **Grand Prix SOL prize pool** (podium payouts). Holder tiers: cosmetic skins, badges, early access to new cars/tracks. |
| **Week 2-3** | **Token-powered garage:** burn token for cosmetic chests, exclusive paints/trails, name-color flex. Strictly cosmetics + optional acceleration; everything remains earnable free. Sinks-only — no token emissions (PokeDex anti-death-economy thesis). |
| **Season 1 (week 3-4+)** | Real-time multiplayer ships → **live lobbies, wager races** (SOL/token escrowed per race, winner takes pot minus rake; rake feeds the prize pool), and **live Grand Prix finals** as scheduled spectator events. |

## 8. Architecture & infra

- **Client:** Three.js + Vite + TypeScript, deployed on Vercel. React only for shell UI (menus/garage/lobby) if useful; race scene is pure Three.js on the sim's fixed tick (render interpolation between ticks).
- **Sim package:** `src/sim` — pure TS, shared client/server.
- **Backend (v1, thin):** Node service on Railway + Postgres — accounts (wallet signature via Privy pattern, or anonymous cookie), garage/loadout storage, ghost storage, ladders/Elo, Grand Prix event state, replay submission.
- **Anti-cheat (v1):** client submits the input replay; server re-simulates deterministically and accepts only verified times onto ladders/Grand Prix. Checkpoint validation blocks track cuts.
- **Season 1:** Colyseus rooms on the same Railway service for authoritative real-time races; wager escrow added here (own spec — explicitly OUT of v1 scope).
- **Solana:** wallet connect via Privy (PokeDex/Web3-Poker pattern), token launched on pump.fun with fee-share wallets configured at creation.

## 9. Testing

- **Sim:** vitest — physics determinism (golden replay fixtures reproduce byte-identical results), drift/boost state machine, item effects, checkpoint/lap validation, anti-cut, rubber-band bounds.
- **Pipeline:** GLB validator unit tests against fixture GLBs (pass/fail node conventions).
- **E2E:** Playwright smoke — game boots, a Quick Race completes, time submits.

## 10. Out of scope for v1

- Real-time multiplayer netcode (Season 1)
- Wager escrow (Season 1, own spec)
- More than 6 car bodies / 3 tracks / 6 items
- Mobile-native wrappers (browser is mobile-playable; touch controls + PWA polish later)
- Spectator mode, clans/teams

## 11. Success criteria (30 days)

- Playable-in-browser v1 live + token launched while the gaming meta is hot (~2 weeks).
- A stranger goes from link → racing in under 30 seconds, no wallet.
- First Grand Prix weekend runs with a creator-fee-funded SOL podium.
- Season 1 (real-time multiplayer + wager races) ships as the second narrative beat within ~30 days.
