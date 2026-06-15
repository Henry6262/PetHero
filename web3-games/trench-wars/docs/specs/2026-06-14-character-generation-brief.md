:

**Date:** 2026-06-14
**Status:** Ready for generation
**Repo:** `web3-games/trench-wars`

## Goal

Generate character models + animations so every unit card in `src/sim/cards.json` has a distinct 3D identity. Spells and buildings are out of scope for this batch.

## Style guide

- **Low-poly, cartoony, mobile-optimized** — match existing Meshy characters
- **Readable silhouettes** — identify the card by a glance
- **Exaggerated proportions** — big heads, chunky weapons, clear poses
- **Two factions:**
  - **Traders** — blue/cool tones, tech/heroic, clean
  - **Jeets** — red/warm tones, chaotic/meme, gritty
- **Animations required:**
  - `{card-id}-walk.glb` — idle/moving loop
  - `{card-id}-attack.glb` — one clear strike/cast/shoot
- Format: `.glb` with embedded textures
- Poly count: ~2k–5k tris (swarm units can be lower)
- Place in: `public/assets/3d/chars/`
- Portraits: 256×256 transparent PNG in `public/assets/3d/portraits/`

## Naming convention

```
public/assets/3d/chars/{card-id}-walk.glb
public/assets/3d/chars/{card-id}-attack.glb
public/assets/3d/portraits/{card-id}.png
```

Example: `bag-holder-walk.glb`, `bag-holder-attack.glb`, `bag-holder.png`

## Pipeline

1. Generate with **Meshy AI** (matching existing assets)
2. Drop files into `public/assets/3d/chars/`
3. I will update `CARD_CHAR` mapping in `src/render3d/Battle3D.ts`
4. Run `npm run portraits` to bake card portraits
5. Run `npm run smoke-3d` to verify in battle

## Unit cards that need models

Cards in **bold** are P0 — generate these first. The rest can follow in priority order.

### P0 — core 8 (most played, most important)

| Card ID | Name | Role | Attack | Prompt |
| --- | --- | --- | --- | --- |
| **bag-holder** | Bag Holder | tank | melee punches | low-poly sad trader with paper bag over head, oversized gloved fists, hunched tanky posture, cartoon 3D character, blue-grey tones, T-pose, walk and attack animations |
| **scalper** | Scalper | assassin | melee knife slash | low-poly sneaky trader assassin with hood, glowing dagger, jittery pose, cartoon 3D, neon accents, T-pose, walk and attack animations |
| **jeet-horde** | Jeet Horde | swarm | melee flailing | low-poly group of 3 tiny frog-like creatures in torn shirts, meme jeet soldiers, cartoon 3D, green, walk and attack animations |
| **paper-hands** | Paper Hands | brawler | melee panic slap | low-poly panicky blue-skinned trader with trembling hands, wild eyes, cartoon 3D, panic pose, walk and attack animations |
| **chad-trader** | Chad Trader | brawler | melee haymaker | low-poly square-jawed muscular trader in suit, massive fists, confident pose, cartoon 3D, strong jaw, walk and attack animations |
| **diamond-hands** | Diamond Hands | tank | melee diamond slam | low-poly heavy knight with crystalline diamond fists and forearms, fiery aura, tanky cartoon 3D, walk and attack animations |
| **whale** | Whale | mage | ranged water splash | low-poly giant armored whale floating in air, spouting energy water, mage, cartoon 3D, blue, walk and attack animations |
| **degen-titan** | Degen Titan | tank | melee ground slam | low-poly massive hulking degen in hoodie with spiked knuckles, dark aura, tanky cartoon 3D, walk and attack animations |

### P1 — next 8 (generate as unique models)

| Card ID | Name | Role | Attack | Prompt |
| --- | --- | --- | --- | --- |
| **fud-spirit** | FUD Spirit | mage | ranged fear orb | low-poly ghostly dark spirit with glowing red eyes, tattered cloak, floating, cartoon 3D mage, walk and attack animations |
| **rug-dev** | Rug Dev | assassin | melee backstab | low-poly hooded anonymous developer with laptop-blade arm, stealthy, cartoon 3D assassin, walk and attack animations |
| **influencer** | Influencer | support | ranged buff beam | low-poly flashy influencer with glowing phone and selfie stick, aura rings, cartoon 3D support, walk and attack animations |
| **sniper-bot** | Sniper Bot | ranged | ranged rifle shot | low-poly sleek military robot sniper with long rifle, camo accents, cartoon 3D, walk and attack animations |
| **gigachad** | Gigachad | brawler | melee uppercut | low-poly hyper-muscular chad with sunglasses and tank top, cartoon 3D brawler, walk and attack animations |
| **sailor-cat** | Sailor Cat | support | melee paw swipe | low-poly cat in sailor suit holding small anchor, tanky support, cartoon 3D, walk and attack animations |
| **shadow-dev** | Shadow Dev | assassin | melee shadow strike | low-poly stealthy coder wrapped in shadow code particles, dual blades, cartoon 3D assassin, walk and attack animations |
| **mev-overlord** | MEV Overlord | mage | ranged tech explosion | low-poly floating mechanical brain with cables and screens, tech mage, cartoon 3D, walk and attack animations |

### P2 — swarm/variant cards

These can be unique models OR reskins of P0/P1 characters with different colors/weapons/scale.

| Card ID | Name | Role | Attack | Suggested approach |
| --- | --- | --- | --- | --- |
| mev-bots | MEV Bot Swarm | swarm | melee claw | 4 tiny versions of sniper-bot/vanguard, simpler meshes |
| discord-raid | Discord Raid | swarm | melee keyboard | 5 tiny keyboard warriors, reskin jeet-horde |
| exit-liquidity | Exit Liquidity Mob | swarm | melee panic | 5 sad figures with bags, reskin jeet-horde/panicky blue |
| fomo-mob | FOMO Mob | swarm | melee hype | 4 tiny hyped figures with rocket hats, reskin jeet-horde |
| based-brawlers | Based Brawlers | swarm | melee brawl | 3 medium brawlers, reskin chad-trader/degen |
| moon-boy | Moon Boy | brawler | melee charge | chad-trader with rocket backpack, charges forward |
| airdrop | Airdrop Drone | ranged | supply drop | flying drone with package, unique model |
| fomo-jet | FOMO Jet | mage | missile | flying jet with missile pods, unique or reskin airddrop |

### P3 — Legendary parody bosses

Four high-cost, high-impact Legendary cards. These are parodies of public figures / memes, not direct likenesses. Each has a **“trademark” attack animation** and should feel arena-dominating. Generating one legendary should consume roughly the same art budget as two normal characters.

| Card ID | Parody of | In-game name | Role | Attack | Prompt |
| --- | --- | --- | --- | --- | --- |
| **rocket-king** | Elon Musk | Rocket King | tank | **Falcon slam** — calls down a stylized rocket that crashes fists-first into the ground for AOE | low-poly exaggerated billionaire in black flight suit, slick hair, holding a tiny steel rocket like a club, confident smirk, rocket exhaust aura, cartoon 3D mobile game character, T-pose, walk and attack animations, blue-grey and steel tones |
| **gold-godfather** | Donald Trump | Gold Godfather | brawler | **Deal slam** — swings a giant golden handshake / contract hammer | low-poly exaggerated tycoon in oversized navy suit, bright red tie, golden hair, holds a giant golden gavel stamped with a dollar sign, cartoon 3D mobile game character, T-pose, walk and attack animations, gold and navy tones |
| **doge-dad** | Kabosu / Doge meme spirit | Doge Dad | support | **Much wow** — throws Doge coins that buff allies with golden aura | low-poly wise Shiba Inu spirit wearing a golden halo and meme sunglasses, floating lotus/coin platform, holds a glowing Doge coin staff, cartoon 3D mobile game character, T-pose, walk and attack animations, warm gold and orange tones |
| **chain-emperor** | SBF / FTX fall | Chain Emperor | mage | **Rugpull vortex** — summons a dark chain vortex that pulls enemies in | low-poly fallen crypto emperor in a frayed suit crown, glowing red handcuff chains, sinister grin, dark aura, floating, cartoon 3D mobile game character, T-pose, walk and attack animations, deep red and black tones |

#### Legendary design rules

1. **Parody distance:** Use archetype exaggeration, not portraits or names. Avoid real names, logos, or trademarks.
2. **Faction split:**
   - Traders: Rocket King (blue/steel), Doge Dad (gold/blue support)
   - Jeets: Gold Godfather (gold/red), Chain Emperor (red/black)
3. **Scale:** Legendaries should be ~1.5× the size of a normal tank.
4. **Attack clarity:** The legendary attack must have a wind-up, impact, and short recovery so players can read it on a small screen.
5. **Effects:** Embed a small token prop (rocket, gavel, coin, chain) into the rig; full spell VFX will be added in-engine.
6. **Portraits:** Show the character mid-attack with faction-colored background.

## Notes per card

- **Jeet Horde / Discord Raid / Exit Liquidity / FOMO Mob** — all swarms. Keep individual figure simple (~1k tris each). The game spawns `count` copies.
- **Whale / MEV Overlord / Doge Dad / Chain Emperor** — floating mage/support units. No leg walk cycle needed; bobbing idle + cast attack.
- **Sniper Bot / Airdrop / FOMO Jet** — need clear projectile spawn point (muzzle).
- **Diamond Hands / Degen Titan / Rocket King / Gold Godfather** — big tanks/brawlers. Make them noticeably larger than chad-trader.
- **Influencer / Doge Dad** — support aura should be visible; attack can be a beam or thrown buff item.
- **Legendaries** — each needs a clear silhouette prop so it reads at 64×64 portrait size.

## Delivery checklist

For each character send me:
- `{card-id}-walk.glb`
- `{card-id}-attack.glb`
- `{card-id}.png` portrait

When a batch lands, I will:
1. Map them in `CARD_CHAR`
2. Generate portraits if missing
3. Run `npm run smoke-3d`
4. Commit
