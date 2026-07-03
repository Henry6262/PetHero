# Military Robotics & AI Drone Market — Hackathon Playbook

**Date:** 2026-07-03  
**Purpose:** Win the EUDIS Defence Hackathon and Berlin/European Defense Tech Hackathon, then convert momentum into funding.

---

## What wins: the hackathon formula

### Visual demos win

At EUDIS Spring 2025, third place went to **AEREUS** (Germany) for real-time 3D scene reconstruction from drone data. They did not have a finished product — they had a compelling 3D visualization fed by live telemetry.

At the Copenhagen Defense Tech Hackathon (October 2025), all three winning teams brought physical hardware:

- **Stronghold AI** — 8-microphone sensor array.
- **Mindfield Defence** — edge AI for acoustic threat detection.
- **DEEPDOCK** — Jetson + Starlink USV control.

**Formula: show, then tell. Never tell, then show.**

### EUDIS judging criteria

| Criterion | Weight | What judges evaluate | How to maximize |
|-----------|--------|---------------------|-----------------|
| **Progress** | **30%** | Comparable progress during the hackathon | Show a Day 0 → Day 2 transformation |
| **Relevance** | **25%** | Alignment with EU/Norway/Ukraine defence needs | Frame as Ukrainian EW comms denial / NATO capability gap |
| **Innovation** | **25%** | Uniqueness and value for end-users | Emphasize gossip + 3D hex combination — no competitor |
| **Team** | **20%** | Defence, technical, business experience | Clear roles; NATO advisor if team lacks military background |

The highest-weighted criterion — Progress — is the one most teams ignore. Judges ask: "What did you build between arrival and demo time?"

### NATO TIDE Hackathon benchmark

**CGI TurnCraft** scored **93/100** at NATO TIDE 2025. The jury praised "intuitive operation, technical maturity, clarity of creation, and strong focus on NATO-compatible implementation." All components ran locally without cloud or third-party APIs.

Operator's gossip protocol satisfies the same offline, device-to-device requirement.

---

## Recommended pitch narrative

> "When the enemy jams your comms, your situational awareness dies. We are building a portable, backpackable C2 system that commands 10–50 drones using peer-to-peer gossip protocols — so even if 50% of your swarm is destroyed, the remaining drones still share full battlefield intelligence. Our 3D hexagonal tactical map gives operators spatial awareness that traditional 2D maps cannot match. TITAN is the division's AI vehicle; Operator is the platoon's AI tablet."

---

## 7-day build plan

### Hardware needed before Day 1

- 2× Raspberry Pi 4 or 5 (SD cards, power, cases)
- 2× LoRa modules (SX1276-based, 868 MHz for Europe)
- 1× USB camera
- 1× laptop capable of browser + local web server
- Jumper wires, breadboard, USB cables

### Software stack (validated, free)

- **3D map:** Cesium.js (Apache 2) + H3-js hexagonal indexing
- **Gossip protocol:** Python with asyncio + pyLoRa (or RadioHead port)
- **Mock telemetry:** Python script generating hex-cell position updates
- **Map server:** Simple Python HTTP server or Node.js localhost

### Day-by-day schedule

| Day | Theme | Morning (4h) | Afternoon (4h) | Deliverable by EOD |
|-----|-------|--------------|----------------|--------------------|
| **1** | Hardware + 3D scaffold | Flash Pis; test LoRa "hello" at 10m. | Initialize Cesium.js + H3-js hex grid over Berlin terrain; color 3–4 random hexes. | Two Pis communicating via LoRa; browser shows 3D hex grid. |
| **2** | Camera + mock telemetry | Connect camera to Pi A; overlay mock bounding box. | Build telemetry generator: JSON {lat, lon, altitude, hex_cell, detected_objects[]} every 2s via WebSocket. | Live mock drone data feeding the map; hex cells update color when scanned. |
| **3** | Gossip outbound | Define message schema {msg_id, sender_id, timestamp, position, hex_cells[], detected_objects[], ttl}. Implement gossip outbound on Pi A. | Implement gossip inbound on Pi B; build shared-state dict merging heard senders. | Pi B has a local copy of Pi A's telemetry. |
| **4** | Gossip 2-way sync | Add gossip outbound on Pi B; deduplicate via msg_id. | Integrate Pi B's received data into the map; show two drone icons. Power off Pi A; confirm data persists on map. | Map displays two drones; Pi A offline does not erase its last-known state. |
| **5** | Integration + polish | Polish map: animated trails, smooth icon transitions, terrain elevation shading. | Add "context sync" demo: Pi B joins and previously scanned hexes flood into view. | Visually compelling map that tells a story without explanation. |
| **6** | Pitch video + script | Film 60-second demo video: screen record map, cut to Pis with LEDs, back to map. | Write and rehearse 2:45 pitch script. | Recorded backup demo; memorized pitch. |
| **7** | Rehearse + pack | Dry-run complete demo 3 times; fix failure points. | Pack hardware in carry-on; print QR code to repo, 1-page handout, pitch backup. | Reliable demo; bag packed; confidence. |

### Day-by-day guidance

- **Days 1–2:** prove hardware stack. If LoRa fails, pivot to WiFi Direct or USB-serial — gossip logic is transport-agnostic.
- **Days 3–4:** technical core. The critical demo moment is powering off Pi A and showing its data persists via Pi B.
- **Days 5–6:** integration is where teams falter. Budget 4–6 hours of debugging.
- **Day 7:** no new code. Rehearse, fix bugs, pack, sleep.

---

## The 3-minute pitch script

Memorize this. Deliver in **2 minutes 45 seconds**.

### [0:00–0:15] The hook

> "In Ukraine, Russian electronic warfare jams drone communications within thirty seconds of launch. The drone doesn't come back. The commander loses eyes on the battlespace. And soldiers die because their machines couldn't share what they saw."

### [0:15–0:45] The problem

> "Every current drone swarm platform — TITAN, Anduril Lattice, every centralized C2 system — has the same fatal flaw. One radio link to one command station. When that link breaks, the entire swarm goes blind. Palantir's TITAN is a hundred-and-seventy-eight-million-dollar vehicle that becomes a brick the moment its comms are jammed."

### [0:45–1:30] The solution + demo

> "We built the opposite. A distributed swarm where every drone carries its own AI brain and shares intelligence peer-to-peer through a gossip protocol. No central command. No single point of failure.
>
> [Turn to screen — 3D hex map visible]
>
> This is our 3D tactical hex map. Every hex cell represents terrain, threat probability, and scan status. Watch — this drone is scanning live. Each hex it passes turns from gray to blue. Now I add a second drone to the swarm.
>
> [Pi B powers on — map shows second icon]
>
> They automatically share everything they see through gossip messages. If I lose this drone, its last-known position and every hex it scanned are still on the map — because the other drone has a complete copy."

### [1:30–1:50] The proof — simulate jamming

[Power off Pi A]

> "Drone one is gone. Jammed. Destroyed. Doesn't matter. Every piece of intelligence it gathered is still here, replicated across the swarm. This is not backup. This is continuous distributed state. The swarm heals itself as nodes fail."

### [1:50–2:20] Progress + differentiation

> "Seven days ago, we had two Raspberry Pis in a box. Today, we have local AI on every node, a gossip protocol for jam-resistant D2D communication, a portable command node that fits in a backpack, and a 3D hex map that no existing Battlefield Management System has built. SitaWare, ATAK, TITAN — none of them use hexagonal tessellation. We are creating a new category of battlefield visualization."

### [2:20–2:45] The ask

> "We're applying to the EUDIS Accelerator to take this to pilot deployment with European defence forces. We need mentorship from operators who understand contested comms, and introductions to procurement officers who can run a sandbox trial. This works on a table today. In six months, it works on a Ukrainian battlefield. Thank you."

---

## Competitive framing cheat sheet

| Differentiator | Operator | TITAN / Lattice / SitaWare |
|----------------|----------|---------------------------|
| Portability | Backpack-sized command node; runs on Raspberry Pi | FMTV truck or fixed infrastructure |
| Visualization | 3D hexagonal grid — no existing BMS uses this | 2D planar maps or 3D terrain without hex tessellation |
| Resilience | Gossip protocol: swarm heals as nodes fail | Centralized C2: single point of failure |

### Likely Q&A

- **"How is this different from Anduril or Helsing?"**
  - "They build large-scale systems. We build the communication layer any drone can use — open, interoperable, portable. We don't compete with their platforms; we make every platform more resilient."
- **"What happens when drones are shot down?"**
  - "The gossip protocol replicates information across the swarm. Losing one drone doesn't lose the intelligence. It's designed for attrition."
- **"How do you handle classified data?"**
  - "Everything is developed unclassified. For classified deployment, only the encryption module changes; the core gossip protocol and map renderer stay the same."
- **"What is your TRL?"**
  - "TRL 3–4 moving to TRL 5 with EUDIS. Seed-stage defense investors expect TRL 4–5 at entry and TRL 6 by the end of seed."

---

## Post-hackathon: convert momentum to funding

The 48 hours after the hackathon matter more than the 48 hours during it.

### Immediate (Hour 0–48)

| Timeline | Action | Output |
|----------|--------|--------|
| Hour 0–24 | Follow every judge and participant on LinkedIn with personalized requests | Network |
| Hour 0–48 | Document photos, videos, code commits, architecture diagrams; create 1-page "Hackathon Results" page on GitHub | Asset library |
| Day 1–3 | Submit EUDIS Accelerator application | €120K (+€50K top-3) voucher application |

### Short-term (Week 1–4)

| Timeline | Action | Output |
|----------|--------|--------|
| Week 1–2 | Register with BRAVE1 Ukrainian defence tech cluster | Frontline testing pathway |
| Week 2–4 | Prepare NATO DIANA Challenge Call application | €100K + up to €300K funding |
| Week 2–4 | Reach out to JOIN Capital and Project A Ventures (Berlin) | Investor conversations |

### Medium-term (Month 2–6)

| Timeline | Action | Output |
|----------|--------|--------|
| Month 2–3 | Submit EDF Cascade Funding (FSTP MaJoR sub-call) | Up to €60K |
| Month 2–3 | Begin German Accelerator Kickstart Defense & Dual-Use | Pitch + GTM mentoring |
| Month 3–6 | File provisional patents for gossip innovations and 3D hex rendering methods | IP protection |

### Key deadlines

- **EUDIS Accelerator Autumn Cohort 3:** 30 May 2026
- **NATO DIANA 2027 Challenge Call:** 2 June – 11 July 2026
- **EIC STEP Defence Scale Up:** 28 October 2026
- **EDF SME Non-Thematic Call:** 29 September 2026

---

## Which hackathons to target

| Priority | Event | Timing | Why |
|----------|-------|--------|-----|
| **P0** | **EUDIS Defence Hackathon** | Spring/Autumn 2026 | EU's largest; 8 locations; €120K accelerator voucher; direct fit to swarm/AI situational awareness challenge |
| **P0** | **European Defense Tech Hackathon — Berlin** | Around Berlin Security Conference | Co-hosted with CIHBw; direct Bundeswehr access |
| **P1** | **NATO DIANA Challenge Call** | 2 Jun – 11 Jul 2026 | €100K non-dilutive; 180+ test centres; autonomy priority area |
| **P1** | **European Defense Tech Hackathon — Munich** | Around Munich Security Conference | Highest-profile European defense event; primes + late-stage investors |
| **P2** | **CASSINI / EUDIS Joint Hackathon** | Check website | Space + Defence crossover; geospatial/tactical mapping relevance |

---

## Success factors

1. **Narrow the problem to one scenario** — e.g., platoon-level ISR in GPS-denied environments.
2. **Lead with the 3D hex map demo** — not the drones, not the protocol.
3. **Have physical hardware on the table** — every Copenhagen 2025 winner had a prototype.
4. **Quantify cost advantage** — sub-$10K portable C2 vs. $50K+ legacy solutions.
5. **Have a Ukraine story ready** — even untested, show battlefield relevance.
6. **Demo > Slides > Explanation** — allocate 60% effort to working demo, 20% problem, 20% architecture.

---

## Print-and-carry checklist

- [ ] Hardware packed in carry-on (never checked)
- [ ] Backup pitch video on laptop and phone
- [ ] QR code to GitHub repo printed
- [ ] 1-page handout with team contacts
- [ ] Pitch script printed
- [ ] Judge Q&A answers rehearsed
- [ ] LinkedIn connection requests drafted
- [ ] EUDIS Accelerator application materials ready to submit within 48 hours

---

## Bottom line

The hackathon is a launchpad, not a destination. The team that networks on Monday morning wins more than the team that partied on Sunday night. Build a demo that proves distributed state survives node loss, pitch it as NATO-compatible by design, and convert every judge and participant into a grant or investor introduction within 90 days.
