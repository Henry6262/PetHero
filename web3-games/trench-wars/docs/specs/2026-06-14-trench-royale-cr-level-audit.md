# Trench Royale — Clash Royale Level Audit

**Date:** 2026-06-14
**Status:** Planning
**Repo:** `web3-games/trench-wars`

## Current roster

### Cards (32 total)

| ID | Name | Cost | Type | Role | Notes |
| --- | --- | --- | --- | --- | --- |
| bag-holder | Bag Holder | 1 | unit | tank | |
| scalper | Scalper | 1 | unit | assassin | |
| jeet-horde | Jeet Horde | 2 | unit | swarm | |
| paper-hands | Paper Hands | 2 | unit | brawler | |
| mev-bots | MEV Bot Swarm | 3 | unit | swarm | |
| fud-spirit | FUD Spirit | 3 | unit | mage | |
| chad-trader | Chad Trader | 3 | unit | brawler | |
| discord-raid | Discord Raid | 3 | unit | swarm | |
| trading-bot | Trading Bot | 3 | unit | building | |
| diamond-hands | Diamond Hands | 4 | unit | tank | |
| rug-dev | Rug Dev | 4 | unit | assassin | |
| influencer | Influencer | 4 | unit | support | |
| moon-boy | Moon Boy | 4 | unit | brawler | |
| sniper-bot | Sniper Bot | 5 | unit | ranged | |
| exit-liquidity | Exit Liquidity Mob | 5 | unit | swarm | |
| whale | Whale | 6 | unit | mage | |
| airdrop | Airdrop Drone | 4 | unit | ranged | flying |
| fomo-jet | FOMO Jet | 5 | unit | mage | flying |
| gigachad | Gigachad | 5 | unit | brawler | |
| sailor-cat | Sailor Cat | 4 | unit | support | |
| fomo-mob | FOMO Mob | 2 | unit | swarm | |
| shadow-dev | Shadow Dev | 4 | unit | assassin | |
| degen-titan | Degen Titan | 7 | unit | tank | |
| mev-overlord | MEV Overlord | 5 | unit | mage | |
| based-brawlers | Based Brawlers | 3 | unit | brawler | |
| pump-signal | Pump Signal | 2 | spell | spell | buff |
| liquidation-cascade | Liquidation Cascade | 4 | spell | spell | damage |
| gas-war | Gas War | 2 | spell | spell | damage |
| copium | Copium | 3 | spell | spell | heal |
| liquidity-freeze | Liquidity Freeze | 3 | spell | spell | slow |

### Character rigs (8)

- vanguard
- explorer
- crimson
- pepe
- bluemob
- degen
- phoenix
- gake

Each rig has walk + attack GLBs. Cards map to rigs via `CARD_CHAR`.

## Gaps to Clash Royale level

### Visuals / 3D
- Only 8 distinct unit visuals for 30+ cards (CR has unique model per card)
- Spells/buildings use emojis, no real models or VFX
- No death, hit, spawn, or reaction animations
- No projectile models for ranged/mage units
- No tower destruction pieces/animations
- Limited environment props

### Audio
- Missing most SFX keys: deploy, hit, shoot, explosion, tower-down, elixir, victory, defeat, battle-loop

### Progression / meta
- No real card levels affecting battle stats
- No leagues/arenas
- No chest cycle
- No daily quests
- No clan/social
- No real shop economy

### UI/UX polish
- Menu transitions are instant (CR has smooth pan/slide)
- No card upgrade animations
- No trophy road
- No profile customization

## Proposed roadmap to CR level

### Phase A — Character coverage (biggest CR gap)
Generate unique character models for the most important cards first:
1. **Top 8 core cards** — one unique model per card (bag-holder, scalper, jeet-horde, paper-hands, chad-trader, diamond-hands, whale, degen-titan)
2. **Next 8** — fud-spirit, rug-dev, influencer, sniper-bot, gigachad, sailor-cat, shadow-dev, mev-overlord
3. **Remaining 14** — unique models or heavy reskins

Or, keep the 8-rig system but create **distinct skins/materials per card** so Jeet Horde looks different from Exit Liquidity even though both use pepe.

### Phase B — Spells & buildings VFX
- Create simple projectile models (arrow, fireball, laser)
- Spell cast VFX: explosion, heal ring, freeze, buff aura
- Building models: trading bot turret, tower variants

### Phase C — Audio pass
- Add all missing SFX
- Battle music loop
- UI click/hover sounds

### Phase D — Progression
- Real card levels affect sim stats
- Trophy leagues/arenas
- Chest cycle + daily rewards
- Clan/social (later)

### Phase E — UI animation polish
- Menu screen transitions
- Card upgrade punch
- Pack opening improvements
- Battle intro/outro
