# EUDIS Defence Hackathon — Operator Plan

**Event:** EUDIS Defence Hackathon  
**Project:** Operator / SCOUT — portable multi-agent C2 for defensive ISR  
**Priority:** P0  
**Created:** 2026-07-03  
**Source research:** `researches/military-robotics-market/`

---

## Why this hackathon

- Largest EU defense hackathon; runs across **8 EU locations** simultaneously.
- Direct pipeline into the **EUDIS Business Accelerator** (€120K + €50K top-3 prize).
- 2026 Technological Challenge explicitly targets **"AI-based tactical situational awareness using swarms of small robots and drones"** — a direct fit for Operator.
- Judging weights **Progress (30%)**, Relevance (25%), Innovation (25%), Team (20%).

---

## Goal

Place top 3 and convert the result into an EUDIS Accelerator application within 48 hours.

---

## Concept pitch

> "When Russian EW jams drone comms, centralized C2 becomes a brick. Operator is a backpackable command node where every agent carries mission memory and shares it peer-to-peer through a gossip protocol. Our 3D hex map gives dismounted platoons situational awareness that no existing Battlefield Management System provides."

---

## 7-day build plan

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1 | Hardware + 3D scaffold | 2× Raspberry Pis talking over LoRa; Cesium.js + H3-js hex grid rendering on localhost |
| 2 | Mock telemetry + camera | USB camera feed on Pi A; mock bounding boxes; JSON telemetry streaming to map every 2s |
| 3 | Gossip outbound | Pi A broadcasts state {msg_id, sender_id, timestamp, position, hex_cells[], detected_objects[], ttl} |
| 4 | Gossip 2-way sync | Pi B receives, stores, and displays Pi A's state; powering off Pi A does not erase data from map |
| 5 | Visual polish | Animated trails, context-sync animation, terrain elevation shading |
| 6 | Pitch video + script | 60-second backup demo video; 2:45 pitch memorized |
| 7 | Rehearse + pack | 3 dry-runs; hardware packed in carry-on; handouts printed |

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

## Pitch script (2:45)

See `researches/military-robotics-market/2026-07-03-military-robotics-hackathon-playbook.md` Section 8.3 for the full word-for-word script.

Key beats:
1. Ukrainian EW hook (15s)
2. Centralized C2 problem (30s)
3. Live 3D hex + gossip demo (45s)
4. Simulate jamming by powering off Pi A (20s)
5. Progress + differentiation (30s)
6. Ask: EUDIS Accelerator + operator/BD intros (15s)

---

## Judging score maximization

| Criterion | Weight | How Operator scores |
|-----------|--------|---------------------|
| Progress | 30% | Day 0 = two Pis in a box; Day 2 = live 3D hex map with distributed state replication |
| Relevance | 25% | Ukrainian EW resilience + NATO capability gap |
| Innovation | 25% | First 3D hex BMS + open gossip protocol for tactical C2 |
| Team | 20% | Clear roles; bring NATO/Bundeswehr advisor if possible |

---

## Post-hackathon conversion (48 hours)

| Timeline | Action |
|----------|--------|
| Hour 0–24 | Follow every judge and participant on LinkedIn with personalized notes |
| Hour 0–48 | Document photos/videos/code; create 1-page GitHub "Hackathon Results" page |
| Day 1–3 | Prepare EUDIS Business Accelerator application for the next cohort using demo video as pitch evidence |
| Week 1–2 | Register with BRAVE1 Ukrainian defense tech cluster for battlefield testing pathway |
| Week 2–4 | Prepare NATO DIANA 2027 Challenge Call concept note |

---

## Key deadlines

- **NATO DIANA 2027 Challenge Call:** open now — 11 July 2026
- **EDF SME Non-Thematic Call:** 29 September 2026
- **Next EUDIS Accelerator cohort:** Spring 2027 (exact date TBA)

---

## Links

- Research synthesis: `researches/military-robotics-market/2026-07-03-military-robotics-hackathon-playbook.md`
- Market validation: `use-case-apps/operator/docs/research/synthesis/market-validation-synthesis.md`
- Product synthesis: `use-case-apps/operator/docs/research/synthesis/operator-product-synthesis.md`
