# EDTH / SCOUT Prep — Consolidated Checklist

## What’s still relevant from prior context

- Operator/SCOUT product thesis: defensive ISR context layer, "every agent starts with context, not zero."
- Dock v0.1 spec: charging station + mission memory hub (pogo pins, Arduino, PiCrawler upload/download).
- Berlin parts list and store route: BerryBase, Modulor, Bauhaus, Fab Lab Berlin.
- Reading list: Brose, McChrystal, Kleppmann CRDTs, Sinek TED talk, Mom Test.

## What’s stale — ignore or archive

- Any "GITEX, 11 AM July 1" real-time floor-walking instructions. Date has passed.
- Same-day BerryBase pickup references unless today is still before EDTH.

## Pre-EDTH action checklist

### This week

- [ ] Watch Simon Sinek — "How Great Leaders Inspire Action" (18 min)
- [ ] Read Christian Brose — *Kill Chain* pages 1-30, 80-120, 140-170, 190-220 (~3 hr)
- [ ] Read Stanley McChrystal — *Team of Teams* Chapter 1 (~45 min)
- [ ] Read Martin Kleppmann CRDT overview posts (~1 hr)
- [ ] Read Rob Fitzpatrick — *The Mom Test* (for Tyny Genius side) (~2 hr)

### Demo build

- [ ] Buy Tier 1 tools: Pinecil V2, multimeter, helping hands, solder, wire stripper
- [ ] Buy Tier 2 dock upgrades: OLED display, WS2812B strip, piezo buzzer
- [ ] Buy Tier 3 robot sensors: HC-SR04 ultrasonic, MPU6050 IMU, SG90R servos
- [ ] Buy Tier 4 wireless mesh: RFM95W LoRa module, antenna, ESP32 (optional but strong)
- [ ] Cut acrylic dock platform (200×150mm) + ramp at Modulor
- [ ] 3D print alignment walls at Fab Lab Berlin
- [ ] Wire Arduino Dock firmware
- [ ] Install PiCrawler contact pads + agent script
- [ ] Test: dock detects robot → charges → uploads map → initializes second agent

### Pitch prep

- [ ] Write 2:45 pitch using Golden Circle:
  - **WHY:** Robots waste 90% of mission time re-discovering what another robot already mapped.
  - **HOW:** Shared context mesh using CRDTs / meaning-first event packets.
  - **WHAT:** SCOUT / Operator.
- [ ] Include Brose quote: "We’re losing because we cannot make decisions faster than they can."
- [ ] Include McChrystal frame: shared situational awareness beats hierarchical command.
- [ ] Record 60-second backup demo video.
- [ ] Rehearse 3 dry runs.

### Engineering validation

- [ ] `bun test` green.
- [ ] Backend demo flow works: ingest → conflict → stale → dock sync → playbook.
- [ ] Dashboard renders full magic-moment story.
- [ ] E2E dashboard test passes.
- [ ] Decide: software-only demo on laptop, or hardware demo with two Pis + LoRa?

## Budget priority

| Budget | Buy |
|---|---|
| €60 | Tier 1 tools + OLED + HC-SR04 |
| €100 | Tiers 1–2 + ultrasonic sensor |
| €200 | Everything including LoRa mesh + content gear |

## One-line demo punchline

> Agent One explored this maze. It uploaded everything it saw. Agent Two has never seen it — but it already knows every turn.

## Reference files

- Product brief: `use-case-apps/operator/docs/product/brief.md`
- Product synthesis: `use-case-apps/operator/docs/research/synthesis/operator-product-synthesis.md`
- Demo synthesis: `use-case-apps/operator/docs/research/synthesis/demo-and-challenge-synthesis.md`
- Berlin hackathon plan: `plans/hackathons/BERLIN_EUROPEAN_DEFENSE_TECH_HACKATHON.md`
- EUDIS hackathon plan: `plans/hackathons/EUDIS_DEFENCE_HACKATHON.md`
