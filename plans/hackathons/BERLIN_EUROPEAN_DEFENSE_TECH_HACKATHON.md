# Berlin / European Defense Tech Hackathon — Operator Plan

**Event:** European Defense Tech Hackathon — Berlin edition  
**Project:** Operator / SCOUT — portable multi-agent C2 for defensive ISR  
**Priority:** P0  
**Created:** 2026-07-03  
**Source research:** `researches/military-robotics-market/`

---

## Why this hackathon

- Co-hosted with the **Bundeswehr Cyber Innovation Hub (CIHBw)** — direct German military access.
- Timed around the **Berlin Security Conference** — defense ministers, procurement officials, VCs, and operational personnel in one venue.
- Strongest on-ramp to **BAAINBw / Bundeswehr pilots** and national fast-track procurement.
- 2025 edition drew 200+ hackers, defense officials, and investors.

---

## Goal

Win or place top 3, then convert the result into a CIHBw pilot conversation and a warm introduction to the NATO Innovation Fund / Berlin defense VC ecosystem.

---

## Concept pitch

> "The Bundeswehr needs a portable C2 layer for the drone armada and robotic systems it is procuring. Operator gives the dismounted platoon a 3D hex tactical map and a gossip-based context mesh so that every agent — air, ground, dock — starts with mission memory, not zero. TITAN commands the division. Operator commands the fire team."

---

## Audience-specific framing

| Audience | What to emphasize |
|----------|-------------------|
| **Bundeswehr officers** | Contested-commms resilience, ISR-first architecture, human-in-the-loop decision making |
| **Procurement officials** | Fits EDF/EUDIS funding lines; modular, STANAG-ready roadmap; EU-sourced stack |
| **Defense VCs** | $2–5B SAM, confirmed white space, €500K–6M non-dilutive stack, Helsing/ARX comparable path |
| **Other hackers** | Open gossip protocol, hardware-agnostic C2 layer, potential integration partner |

---

## 7-day build plan

Same hardware/software stack as EUDIS Defence Hackathon:

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1 | Hardware + 3D scaffold | 2× Raspberry Pis over LoRa; Cesium.js + H3-js hex grid on Berlin terrain |
| 2 | Mock telemetry + camera | Live mock drone data feeding the map; hex cells update on scan |
| 3 | Gossip outbound | Pi A broadcasts state messages |
| 4 | Gossip 2-way sync | Map shows two drones; Pi A offline does not erase mission memory |
| 5 | Visual polish | Animated trails, context-sync animation, elevation shading |
| 6 | Pitch video + script | 60-second backup video; 2:45 pitch memorized |
| 7 | Rehearse + pack | Dry-runs; hardware packed; handouts printed |

### Hardware list

- 2× Raspberry Pi 4/5 + SD cards + power + cases
- 2× LoRa modules (SX1276, 868 MHz)
- 1× USB camera
- 1× laptop for map server/browser
- Jumper wires, breadboard, USB cables

### Software stack

- Cesium.js + H3-js (3D hex map)
- Python asyncio + pyLoRa (gossip protocol)
- Local WebSocket or HTTP server

---

## Pitch script outline (2:45)

1. **Hook (0:00–0:15):** Ukrainian EW jams drone comms in seconds; soldiers lose situational awareness.
2. **Problem (0:15–0:45):** Centralized C2 — TITAN, Lattice — has a single point of failure and is not portable.
3. **Solution + demo (0:45–1:30):** Live 3D hex map; two Pis gossiping state; show context replication.
4. **Proof (1:30–1:50):** Power off Pi A; data persists on map via Pi B.
5. **Progress + differentiation (1:50–2:20):** Seven days from two Pis to distributed mission memory; no existing BMS has 3D hex visualization.
6. **Ask (2:20–2:45):** CIHBw sandbox trial + introductions to BAAINBw programme officers; EUDIS Accelerator.

---

## Post-hackathon conversion (48 hours)

| Timeline | Action |
|----------|--------|
| Hour 0–24 | Follow every CIHBw representative, judge, and participant on LinkedIn |
| Hour 0–48 | Document demo; publish 1-page GitHub results page; share 30-second clip tagging organizers |
| Day 1–7 | Request a CIHBw feedback meeting; propose a 30–90 day sandbox pilot (€50K–200K) |
| Week 1–2 | Submit EUDIS Accelerator application if not already submitted |
| Week 2–4 | Prepare NATO DIANA 2027 Challenge Call concept note |
| Month 2–3 | File provisional patents for gossip protocol innovations and 3D hex rendering methods |

---

## Key Berlin contacts to target

- **CIHBw** — operational validation and Bundeswehr fast-track.
- **JOIN Capital** (Berlin) — NIF/EIF-backed, defense/dual-use focus.
- **Project A Ventures** (Berlin) — led ARX Robotics pre-seed.
- **3YOURMIND** — first EUDIS cohort; potential consortium partner.
- **SE3Labs** — AI battlefield intelligence; potential partner.

---

## Strategic follow-on

A strong Berlin result should directly feed:

1. **CIHBw pilot contract** — 3–6 month decision cycle; operational validation.
2. **EDF consortium partner search** — German coordinator + 2 other EU states for the 29 Sep 2026 SME call.
3. **NATO Innovation Fund warm intro** — via CIHBw or Berlin VC network.
4. **Berlin Security Conference networking** — schedule follow-up meetings during/after the conference.

---

## Key deadlines

- **EUDIS Accelerator Autumn Cohort 3:** 30 May 2026
- **NATO DIANA 2027 Challenge Call:** 2 June – 11 July 2026
- **EDF SME Non-Thematic Call:** 29 September 2026

---

## Links

- Research synthesis: `researches/military-robotics-market/2026-07-03-military-robotics-hackathon-playbook.md`
- Market validation: `use-case-apps/operator/docs/research/synthesis/market-validation-synthesis.md`
- Product synthesis: `use-case-apps/operator/docs/research/synthesis/operator-product-synthesis.md`
