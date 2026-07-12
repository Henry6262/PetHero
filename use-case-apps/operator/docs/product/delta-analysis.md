# Delta Situational Awareness System — Analysis for Operator

> Research snapshot: 2026-07-10  
> Sources: Grey Dynamics, Militarnyi, TechUkraine, Mezha.Media

## What is Delta?

**Delta** is Ukraine's national situational awareness / battle management system. It is a cloud-based C2 platform developed by the Ukrainian Ministry of Defense (A2724 unit and Defense Technology Innovation Center) and presented to NATO in 2022.

### Core functions

- Collect, process, and display information about enemy forces.
- Coordinate defense forces on a digital map in real time.
- Provide situational awareness according to NATO standards.
- Plan operations and combat missions.
- Enable secure exchange of location and status data.
- Integrate data from drones, satellites, radars, surveillance cameras, HUMINT, and chatbots (eVorog, SSU "STOP Russian War").

### Key architectural traits

- **Cloud-native**: hosted outside Ukraine to protect against strikes/cyber attacks.
- **Zero-trust security**.
- **Multi-domain operations**.
- **Device-agnostic**: runs on laptop, tablet, or phone with no extra setup.
- **NATO-standards-based**: compatible with Alliance systems; tested at Sea Breeze 2021 and NATO TIDE Sprint.
- **Starlink-dependent**: resilient comms in jamming/DDIL environments.

### Why it matters

Delta is the real-world proof that a network-centric COP — fusing multi-source data and sharing it across decentralized units — works at scale against a near-peer adversary. NATO is reportedly interested in acquiring/exporting it.

## How Operator relates to Delta

### Operator does NOT try to be Delta

Delta is a national-level system. Operator is a **battalion/squadron-level** C2 system focused on:

- Tactical robot/ISR control.
- Autonomous mission execution.
- Edge/offline resilience.
- Human-on-the-loop decision escalation.

### The integration problem

Real operators cannot use two separate systems. A commander in a vehicle or forward CP needs **one screen, one decision loop, one mission picture**. If Operator exists alongside Delta, the operator must choose which to trust — or context-switch between them.

### Our positioning

**Operator is the single tactical C2 system.**

- It gives the commander the COP (theater map, territories, tracks, zones).
- It plans the mission (objectives, targets, routes).
- It controls the assets (robots, drones, human squadrons).
- It reasons with AI and escalates only critical decisions.
- It works offline and syncs when connected.

Delta is a **benchmark**, not a dependency. If a unit has a Delta-like feed, Operator can ingest it via NATO-standard formats (CoT). If it does not, Operator is the standalone system that replaces the need for one.

## Pitch framing

Do not say: *"We integrate with Delta."*  
Say: *"Operator is the one system a battalion commander uses to run the mission from theater view to robot actuator."*

If asked about Delta specifically:

- *"Delta proved the network-centric COP works at scale. We are building the same idea as a single, deployable battalion system with autonomous execution."*
- *"We can ingest Delta-style CoT feeds, but Operator is designed to work standalone."*
- *"Delta shows the war. Operator runs the mission."*

## Sources

- [Network-centric Warfare in Ukraine: The Delta System — Grey Dynamics](https://greydynamics.com/network-centric-warfare-in-ukraine-the-delta-system/)
- [Ukraine unveiled its own Delta situational awareness system — Militarnyi](https://militarnyi.com/en/news/ukraine-unveiled-its-own-delta-situational-awareness-system/)
- [Ukraine Deploys Delta Situational Awareness System Across All Defense Units — Militarnyi](https://militarnyi.com/en/news/ukraine-deploys-delta-situational-awareness-system-across-all-defense-units/)
- [Ukraine’s Battle-Forged DELTA System Catches NATO Eye — TechUkraine](https://techukraine.org/2025/04/30/ukraines-battle-forged-delta-system-catches-nato-eye-export-talks-underway-for-advanced-situational-awareness-platform/)
