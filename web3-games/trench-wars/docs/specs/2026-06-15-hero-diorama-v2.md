# Trench Royale — Hero Diorama v2 ("Two-Sided Battlefield")

**Date:** 2026-06-15
**Status:** Approved — building
**Repo:** `web3-games/trench-wars`
**File:** `src/landing/three/BattlePreview.tsx` (hero diorama, rendered by `src/landing/sections/Hero.tsx`)

## Goal

Take the landing-page hero diorama from "a castle on grass with flat dirt
strips" to a living, two-sided lane battle that sells the game. Clean KayKit
low-poly look — level up via **density, composition, lighting**, NOT textures.

## Art direction

- Keep the KayKit flat-shaded low-poly style (matches the in-game 3D renderer).
- No photo/normal-map textures. Richness comes from more props + better
  composition + warmer lighting.

## The priority: animated units (walk → attack clash)

This is the centerpiece. Every marching unit is a real animated character:

| State | Animation | Trigger |
| --- | --- | --- |
| WALK | `<name>-walk.glb` clip, looped; unit advances down its lane | spawn |
| ATTACK | cross-fade walk→`<name>-attack.glb` clip, looped while fighting | within range of an enemy unit or the enemy castle |
| DEATH | stop clips, fall/shrink-sink out | hp ≤ 0 |

- One `THREE.AnimationMixer` per unit instance.
- Both `walk` and `attack` clips are retargeted onto the same Meshy rig — load
  the walk GLB scene, take its walk clip, and graft the attack clip from the
  attack GLB (same skeleton/bone names, so `clipAction` retargets cleanly).
  This is the pattern already proven for the current single troop; generalize
  it to all 8 roster characters.
- Cross-fades (~0.15s) on every state change — never snap.
- **Both armies animate.** Blue advances, red sallies — they meet mid-lane and
  play attack animations against each other.

All 8 characters are confirmed to have both `-walk.glb` and `-attack.glb` in
`public/assets/3d/chars/`: vanguard, bluemob, explorer, degen, crimson,
phoenix, pepe, gake.

## Composition — two-sided battlefield

```
        ┌──────────  JEETS (red)  ──────────┐
        │   red tower  [ CASTLE ]  red tower  │   back
        │        ‖              ‖              │
        │    ~~~bridge~~~~~~~~bridge~~~        │   river (lilies + reeds)
        │        ‖              ‖              │
        │   [barracks_blue]  [tents/banners]  │   front
        └──────────  TRADERS (blue)  ─────────┘
```

- **Back (Jeets/red):** existing `building_castle_red` + two `building_tower_A_red`
  flanking it.
- **Front (Traders/blue):** `building_barracks_blue` + tents, banners, a cluster
  of barrels/crates = player camp.
- **Two dirt lanes** run camp → castle, crossing the river on bridge planks.

## Units cast (baked roster, no placeholder)

- **Blue army (advancing):** vanguard, bluemob, explorer.
- **Red army (defending/sallying):** degen, crimson — 1 sallies per lane to clash.
- Castle + red towers continue to fire defensive arrows at the nearest blue unit.

## Lane polish

- Keep the flat dirt strips, add **stone-edge borders** running their length so
  they read as built roads (thin KayKit stone pieces / darker border planes).
- Slightly darker/inset dirt; a few cobble props near the bridge heads.

## Fences & props (all from the KayKit Medieval Hexagon pack)

- **Wood fence rings the grass-island perimeter**, with a gate at the front.
- **War-camp dressing:** tents, barrels, crates, target dummies, weapon racks,
  arrow buckets, sacks; banners (blue at camp, red at castle).
- **Denser nature:** large + medium tree clusters, bushes, waterlilies + reeds
  in the river.

## Bigger + framing

- Give the diorama more of the hero width (shift the Hero grid split so the
  visual column gets ~10–15% more room) and a taller canvas.
- Tune the camera + `<Bounds>` margin so the longer two-sided board frames fully
  — nothing clips top/bottom — and fills the space.

## Lighting polish

- Warm gold key + cool rim light, softer contact shadows, subtle ground fade so
  the island sits in the dark trench atmosphere.

## Assets to copy from `pokedex-landing/raw-art/asset-packs/KayKit_Medieval_Hexagon_Pack_1.0_FREE/`

Into `public/assets/3d/kaykit/` (each `.gltf` + its `.bin`; shared
`hexagons_medieval.png` atlas already present):

- `buildings/building_tower_A_red`, `buildings/.../building_barracks_blue`
- `decoration/tent`, `decoration/barrel`, `decoration/crate_A_big`,
  `decoration/crate_A_small`, `decoration/target`, `decoration/weaponrack`,
  `decoration/bucket_arrows`, `decoration/sack`
- `buildings/fence_wood_straight`, `buildings/fence_wood_straight_gate`
- `decoration/trees_A_large`, `decoration/trees_B_medium`,
  `decoration/waterlily_A`, `decoration/waterplant_A`
- `decoration/flag_blue` (red flag already present)

Characters: already in `public/assets/3d/chars/` — no copy needed.

## Out of scope (YAGNI)

- No custom textures / shaders (flat-shading stays).
- No new Meshy character exports (using the baked roster).
- No gameplay/sim changes — this is landing-only, `src/landing/**`.

## Verification

- `npx tsc --noEmit` clean.
- Live check at the dev server: board frames fully (no clipping), two lanes
  read clearly, units **walk then play attack animations** when they clash,
  fences ring the map, camp + castle both dressed.
- Also fix the unrelated pre-existing `src/ui/MenuDiorama.tsx` unused-var
  typecheck error encountered during the build.
