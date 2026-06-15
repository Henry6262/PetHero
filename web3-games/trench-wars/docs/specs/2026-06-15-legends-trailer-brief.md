# Trench Royale — "EARTH'S MIGHTIEST DEGENS" trailer brief

**Date:** 2026-06-15
**Format:** ~28–30s cinematic meme trailer (Clash Royale x Avengers homage)
**Goal:** epic, shareable launch trailer for Trench Royale. Casts the real Solana
legends as animal-themed superheroes — **recognizable by face, never named in text or VO.**

---

## Logline

The trenches are wiped out by a Thanos-style **Snap** (= the FTX collapse). From the
ashes, the legends of Solana rise — six animal-superheroes — and **assemble**, building
to a colossal dinosaur charge, then the logo. Earth's Mightiest Degens.

## Tone & style

- Pixar-stylized cinematic 3D (the look Kling nailed first-try on the Krava "Legends" series).
- Marvel-teaser pacing: cold-open on the villain, hero reveals one by one, assemble, logo slam.
- Suits + animal motifs. Epic, hype, a little funny. Crypto-Twitter native.

## The cast — real legends → hero archetypes (NEVER named in output)

Likeness is carried by **their real photos used as the face/reference image** in generation.
The prompt only ever describes the **suit + animal**. No names typed, no names spoken.

| Hero (title used in trailer) | Animal | Real legend (production note only) |
|---|---|---|
| **The Sovereign** | 🦁 Lion (crowned leader) | Pump.fun co-founder |
| **The Forgemaster** | 🦅 Eagle (genius architect) | Solana founder |
| **The Charger** | 🐂 Bull (hype war-machine) | Helius CEO |
| **The Howler** | 🐺 Wolf (the seer who calls the moon) | the trader |
| **The Prophet** | 🐍 Cobra (supercycle oracle) | the supercycle guy |
| **The Beastlord** | 🦖 Raptor (dino summoner) | Jurassic Finance founder |

**Villain — The Snap Warlord** 💜 : Thanos-style purple tyrant with the six-gem gauntlet.
Likeness = FTX founder (public photo as reference), never named. The Snap = the FTX collapse.

**The Fossil Titan** 🦖 : the colossal amber-cracked T-Rex the Beastlord rides (creature, no face).

## Shot list (~28–30s)

| # | Time | Shot | Narrator (titles, not names) |
|---|---|---|---|
| 1 | 0–3 | Black → **Snap Warlord**, gauntlet, **the Snap** → half the trench turns to dust | *"In the trenches… half of everything… was gone."* |
| 2 | 3–6 | **The Sovereign 🦁** rises from the ash, crowned | *"But a king rose."* |
| 3 | 6–9 | **The Forgemaster 🦅** — wings spread, forging light | *"The one who forged the realm."* |
| 4 | 9–12 | **The Charger 🐂** — charges, roars, rallies a horde | *"The voice that shook the chain."* |
| 5 | 12–15 | **The Howler 🐺** — howls at a coin-marked moon | *"The one who calls the moon."* |
| 6 | 15–18 | **The Prophet 🐍** — hooded, slams the staff, purple shockwave | *"The oracle of the supercycle."* |
| 7 | 18–22 | **The Fossil Titan 🦖** charges in, Beastlord riding | *"And from the fossils… it rose."* |
| 8 | 22–27 | All six assembled in a line, power surge, villain silhouette in distance | *"Earth's Mightiest Degens."* |
| 9 | 27–30 | **TRENCH ROYALE** logo + tagline | *(music slam)* |

> Narrator uses **epic titles**, not real names — honors "don't mention them directly"
> while the faces make it obvious who they are. (If we ever want real names spoken, that's
> a one-line swap.)

## Audio

- Deep movie-trailer **narrator** (ElevenLabs), orchestral build + sound design.
- Big brass/drum hit on the dino charge; bass drop into the logo.

## Pipeline (proven on Krava)

1. **Character reference stills** — generate each hero (photo as face reference + suit prompt,
   no names) → 8 canonical character images. *(Kling AI Images, web UI, runs off subscription.)*
2. **Shots** — image-to-video (i2v) from each still + motion prompt → ~9 clips (~5s each).
3. **Voiceover** — ElevenLabs deep narrator reads the script above.
4. **Assemble** — ffmpeg: clips + VO + orchestral bed + SFX + title cards + logo.
5. Export **16:9** (cinematic) and a **9:16** crop (TikTok/X).

## Asset checklist

- [ ] 6 hero reference stills (photo-ref + suit prompt)
- [ ] 1 villain still (Snap Warlord)
- [ ] 1 dino still (Fossil Titan, text-to-image)
- [ ] Narrator VO (ElevenLabs)
- [ ] Orchestral music bed + SFX (snap, roars, charge, logo slam)
- [ ] TRENCH ROYALE logo + tagline end card

## Prompts

Suit/animal prompts (no names) + shared negative live in
`content-engine/brands/trench-royale/characters/prompts.json`.
Generator (once Kling API is topped up): `content-engine/scripts/gen-trench-legends.ts`.

## Status

- Concept + story: **LOCKED** (this doc).
- Kling **API** pack empty (1/100) → stills being generated in the **web UI** (subscription).
- Next: generate 8 reference stills → review → i2v shots.
