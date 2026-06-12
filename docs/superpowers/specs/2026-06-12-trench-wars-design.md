# Trench Wars — Design Spec

**Date:** 2026-06-12
**Status:** Approved by Henry (brainstorm 2026-06-11/12)
**Location:** `web3-games/trench-wars/` (monorepo folder; standalone repo later, like other web3-games)

## 1. Concept

Browser-based Clash Royale-style lane battler with a crypto-meme war theme: **Traders vs Jeets**. 3-minute matches, elixir-style resource regen, card-deployed units that march down lanes to destroy the enemy's bags (towers). 100% free, instantly playable in the browser, wallet-optional. Launches with a pump.fun token ($TRENCH working ticker); trading creator fees fund player prize pools.

## 2. Why this game (market basis, researched 2026-06-11)

- The pump.fun gaming meta (MafiaBits, Sol Siege, Addicted, Pumpville, Sprout) is saturated with idle/farm/text/clicker games. No real-time skill game exists in the browser meta.
- **Confirmed gap:** zero browser Clash Royale-style games with a token. Demand signal is loud: pvptv.fun monetizes wagers on actual Clash Royale matches, and the $CLASH streamer token monetized just *watching* CR on pump.fun. We ship the actual game the audience is already paying around.
- Racing and fighting gaps also confirmed, but: racing has a weaker season/wager loop; fighting has no usable browser foundation and brutal netcode. Lane battler wins.
- Proven success patterns we adopt: instant free browser play, wallet-optional entry, creator-fee-funded prize pools, ranked seasons, PvP wagering layer, stream-friendly 3-minute spectacle.

## 3. Game core (v1 — token launch build, ~1-2 weeks)

### Simulation
- **Deterministic fixed-tick sim in pure TypeScript** — no rendering dependencies, fully unit-testable, seeded RNG. The same sim module runs:
  - client-side vs AI (v1),
  - server-side on Colyseus for real-time PvP (Season 1),
  - server-side for replay verification (anti-cheat).
- A match replay = `{ seed, [tick, playerId, cardId, position][] }`. Re-simulation reproduces the result exactly.

### Battle rules
- 2-lane arena, river midline, 2 lane towers + 1 king tower per side (CR layout).
- 8-card deck, 4-card rotating hand, elixir regen (1 per ~2s, 10 cap, 2x elixir final 60s).
- Win: destroy king tower, or most towers/damage at 3:00; sudden-death overtime on tie.
- Launch roster: **~12 units + 2-3 spells** (see §5).

### Modes at launch
1. **AI ladder** — instant play, rising-difficulty AI opponents (scripted decision policies over the sim).
2. **Async PvP ladder** — you battle the AI piloting a real opponent's deck; Elo ranks real players against each other. Zero netcode, works with 12 players online at 3am.
3. **Real-time PvP** ships post-launch as the Season 1 hype beat (§7).

## 4. Theme & launch roster (Traders vs Jeets)

Towers = your bags. Arena = the trenches: candlestick towers, chart-line river, meme props.

| Unit | Archetype | Gimmick |
|---|---|---|
| Diamond Hands | Tank knight | High HP, slow, never retreats |
| Jeet Horde | Cheap swarm (goblins) | 3-4 weak fast units |
| Whale | Siege heavy | Splash damage, very slow, expensive |
| MEV Bot Swarm | Fast flankers | Spawn at edges, target lowest-HP enemy |
| Rug Dev | Assassin | Invisible until close, burst damage |
| Influencer | Support | Buffs nearby units' damage |
| Paper Hands | Comedy bruiser | Decent stats but flees when below 30% HP |
| FUD Spirit | Debuffer | Slows enemies in radius |
| Liquidation Cascade | Spell | Lane-wide damage wave |
| Pump Signal | Spell | Temporary rally/speed boost |
| + 3-4 more units | Filled during asset production to balance the cost curve (1-7 elixir spread) |

Stats/costs/counters defined in JSON config (Sin-City `game-data/` pattern) so balance patches need no code change.

## 5. Asset pipeline

- Units generated as GLBs via **Meshy AI / Rodin** (existing paid pipeline, proven on PokeDex/Maison Carmin).
- **GLB → spritesheet renderer:** one reusable headless script (offscreen three.js, orbit camera) renders each animated GLB to 8-direction animation spritesheets (walk/attack/death) → packed atlas → Phaser. This is the actual Clash Royale visual technique (3D models pre-rendered to 2D).
- Target: each new unit after pipeline setup ≈ 30 min (generate → render → config entry).
- Arena/towers/props: Meshy-generated, composited into the Phaser tilemap/background.
- Existing biped animation rigs in `pokedex-landing/_incoming/` reusable as animation sources where rigs match.

## 6. Token economy ("all 3", phased — sinks-only, no emissions)

| Phase | Mechanic |
|---|---|
| **Launch (day 1)** | Free play, ALL cards earnable by playing — no pay-to-win. Pump.fun creator fees (≤0.95% of trading volume; Creator Fee Sharing split across up to 10 wallets — mechanic validated in GoPumpMe) fund the **seasonal SOL prize pool** paid to ladder top ranks (Addicted $300K-challenge pattern). Holder tiers: cosmetic skins, badges, early access to new cards. Narrative: **"trading volume pays the players."** |
| **Week 2-3** | **Token-powered acceleration:** burn $TRENCH to speed card unlocks, buy cosmetic chests, name-color flex. Strictly optional acceleration + cosmetics; everything remains earnable free, preserving competitive credibility. Sinks-only — no token emissions (PokeDex anti-death-economy thesis). |
| **Season 1 (week 3-4+)** | Real-time PvP ships → **wager matches:** SOL/$TRENCH escrowed per match, winner takes pot minus rake; rake feeds the prize pool. Captures the pvptv.fun audience with the real thing. |

## 7. Architecture & infra

- **Client:** Phaser 4 + Vite + TypeScript. Deployed on Vercel. React only for shell UI (menus/lobby) if useful; battle scene is pure Phaser.
- **Sim package:** `packages/sim` (or `src/sim`) — pure TS, shared client/server.
- **Backend (v1, thin):** Node service on Railway + Postgres — accounts (wallet signature or anonymous cookie), deck storage, ladder/Elo, match-result submission.
- **Anti-cheat (v1):** client submits the match replay; server re-simulates deterministically and accepts only verified results onto the ladder.
- **Season 1:** Colyseus rooms added to the same Railway service for authoritative real-time PvP; the sim package moves server-side as the source of truth. Wager escrow added here (program or custodial-lite TBD in its own spec — explicitly OUT of v1 scope).
- **Solana:** wallet connect via Privy pattern (PokeDex), token launched on pump.fun with fee-share wallets configured at creation.

## 8. Testing

- **Sim:** vitest — combat math, elixir regen, targeting/pathing, win/tiebreak conditions, replay determinism (golden replay fixtures must reproduce byte-identical outcomes).
- **Pipeline:** snapshot test that the spritesheet renderer produces expected frame counts/dimensions for a fixture GLB.
- **E2E:** Playwright smoke — game boots, first AI match completes, result submits.

## 9. Out of scope for v1

- Real-time PvP netcode (Season 1)
- Wager escrow (Season 1, own spec)
- Mobile-native wrappers (browser is mobile-playable; PWA polish later)
- Clan/social systems
- More than ~14 cards

## 10. Success criteria (30 days)

- Playable-in-browser v1 live + token launched while the gaming meta is hot (~2 weeks).
- A stranger can go from link → first match in under 30 seconds, no wallet.
- Season 1 (real-time PvP + wagers) ships as the second narrative beat within ~30 days.
