# SCOUT — Operator Platform
## The Mobile-First Autonomous Ground Robot System for Infantry

**TL;DR:** SCOUT is a €200 autonomous quadruped robot platform controlled by a soldier's smartphone. The same robot can carry **two payloads**: an explosive charge for building clearance (enemies inside → robot enters → operator confirms → detonates) or a **non-lethal surveillance/rescue package** (civilians detected → robot holds position → operator calls extraction). A single mobile app on every soldier's phone controls deployment, mission selection, real-time video feed, and detonation authority. The hackathon tabletop demo proves the core technology. The video and concept show the vision.

---

## 1. The Core Concept: One Platform, Two Missions

### The Problem Every Infantry Squad Faces

Urban combat is the deadliest environment for soldiers. **Room clearing** — entering an unknown building — accounts for a **disproportionate share of combat casualties** because the defender always has the advantage. The defender knows the layout. The defender is waiting behind a door. The attacker has to open that door. Current doctrine: send a human first. That's how people die.

Small ground robots exist, but they're either **$75,000 Boston Dynamics units** that require a dedicated operator and a laptop, or they're **toy-grade** with no autonomous capability. There's nothing in the **€200-€500 range** that a regular infantry soldier can carry in a backpack, deploy with a smartphone, and operate autonomously.

### The SCOUT Platform

| Component | Specification | Cost |
|---|---|---|
| **Base Robot** | PiCrawler quadruped (Raspberry Pi 4 + 12 servos + camera) | ~€90-180 [^51^] |
| **AI Vision** | Raspberry Pi AI Camera (IMX500, 30 FPS on-device detection) | €70 [^24^] |
| **Mobile App** | React Native / Flutter, runs on any Android/iOS phone | Free (open source) |
| **Payload Bay** | Modular mount on robot back — explosive charge OR rescue beacon | ~€20-50 |
| **Communication** | Wi-Fi direct / LoRa mesh (no infrastructure needed) | ~€15 |
| **Total (Lethal Config)** | Robot + explosive payload + comms | **~€250** |
| **Total (Rescue Config)** | Robot + camera + rescue beacon + comms | **~€200** |

**The same robot. Swap the payload. Different mission.**

### Mission Profile A: LETHAL — Building Clearance

A squad approaches a building suspected of harboring enemy fighters. Instead of sending a soldier to kick in the door:

1. **Soldier pulls SCOUT from backpack** — the robot weighs under 500g, fits in a small pouch
2. **Opens the SCOUT app on their phone** — selects "CLEARING" mission type
3. **Places robot at building entrance** — taps "DEPLOY" on the app
4. **Robot autonomously enters** — walks hallways, opens doors (or squeezes through), explores rooms using the 3D graph algorithm from Challenge 01-ats
5. **AI camera detects human shapes** — classifies as "armed combatant" based on posture, equipment silhouette, weapon detection
6. **Real-time video streams to soldier's phone** — the operator sees exactly what the robot sees
7. **Operator confirms target** — taps "CONFIRM THREAT" on the app
8. **Robot detonates its payload** — neutralizes the threat without risking a soldier's life

### Mission Profile B: NON-LETHAL — Civilian Rescue / Surveillance

A squad enters a village. Intel suggests civilians may be hiding in buildings. Sending soldiers door-to-door risks civilian casualties and ambushes:

1. **Soldier deploys SCOUT with "RESCUE" payload** — camera + rescue beacon + audio speaker
2. **Robot enters building autonomously** — same graph exploration, same navigation
3. **AI camera detects human shapes** — classifies as "civilian" (unarmed, family group, defensive posture)
4. **Real-time video shows a family huddled in a corner** — children, no weapons
5. **Operator taps "HOLD — CIVILIANS DETECTED"** — robot stops, beacon activates
6. **Robot's speaker plays pre-recorded message**: *"Stay calm. Help is coming. Do not move."* (in local language)
7. **Operator marks building on tactical map** — extraction team dispatched
8. **Robot holds position** — continues monitoring, provides live feed until help arrives

### The Same App. The Same Robot. Different Ethics.

This is the **narrative power** of the concept. The robot doesn't decide to kill or save — **the human operator always has final authority**. The robot just provides eyes where human eyes can't go. The app gives the soldier **perfect situational awareness** before making a life-or-death decision.

---

## 2. The Mobile App: Every Operator's Pocket

### Why a Mobile App Changes Everything

Current military robot systems require **laptops, joysticks, trained operators, and dedicated personnel**. A Predator drone has a crew of three. A Boston Dynamics Spot requires a tablet and a trained handler. This is fine for reconnaissance units but **useless for a regular infantry squad** under fire.

A smartphone app changes the equation:

| Current Systems | SCOUT Mobile App |
|---|---|
| Laptop + joystick + trained operator | Any soldier's phone — everyone already has one |
| 3-person crew for one robot | 1 soldier deploys and controls |
| $75,000+ per unit | €200-250 per unit |
| GPS-dependent, datalink vulnerable | Wi-Fi direct / LoRa mesh — no infrastructure |
| Cloud-connected, jamming risk | On-device AI — no cloud, works offline |
| One robot per specialized unit | One robot per soldier — distributed, redundant |

### App Interface Design

The app has **four screens**, designed for use under stress — large buttons, high contrast, minimal text:

**Screen 1: MISSION SELECT**
```
┌─────────────────────────┐
│  SCOUT — DEPLOY         │
│                         │
│  [🟥 CLEARING]          │  ← Lethal payload
│  "Enter and neutralize" │
│                         │
│  [🟩 RESCUE]            │  ← Non-lethal payload
│  "Search and secure"    │
│                         │
│  [🔵 SURVEIL]           │  ← Camera only
│  "Observe and report"   │
└─────────────────────────┘
```

**Screen 2: DEPLOYMENT**
```
┌─────────────────────────┐
│  MISSION: CLEARING      │
│  PAYLOAD: CHARGE-250g   │
│                         │
│  [📡 CONNECTING...]     │
│  [✅ ROBOT LINKED]      │
│                         │
│  [🟢 DEPLOY]            │  ← Big green button
│  "Place at entry point" │
└─────────────────────────┘
```

**Screen 3: LIVE FEED + THREAT DETECTION**
```
┌─────────────────────────┐
│  [📹 LIVE CAMERA FEED]  │
│                         │
│  🚨 THREAT DETECTED     │
│  Type: Armed individual │
│  Confidence: 91%        │
│  Weapon: Rifle visible  │
│                         │
│  [🔴 DETONATE]          │  ← Requires 2-tap confirmation
│  [🟡 HOLD]              │
│  [🟢 NO THREAT — MARK]  │
└─────────────────────────┘
```

**Screen 4: RESCUE MODE**
```
┌─────────────────────────┐
│  [📹 LIVE CAMERA FEED]  │
│                         │
│  ⚠️ CIVILIANS DETECTED  │
│  Count: 4 (2 adults,    │
│         2 children)     │
│  Status: Unarmed        │
│  Condition: Distressed  │
│                         │
│  [🔊 PLAY MESSAGE]      │
│  [📍 MARK FOR EXTRACTION]│
│  [🟢 HOLD POSITION]     │
└─────────────────────────┘
```

### Critical Design Principle: Human-in-the-Loop

The robot **never** autonomously detonates. The AI classifies and recommends, but the **human operator always confirms**. This is essential for:

- **Legal compliance** — autonomous lethal weapons are a legal minefield
- **Ethical acceptability** — NATO and EU defense communities are wary of fully autonomous kill chains
- **Operational trust** — soldiers won't trust a robot that makes life-or-death decisions without them

The detonation button requires a **two-tap confirmation** with a 3-second delay — designed to prevent accidental triggers under stress while not slowing down a legitimate engagement.

---

## 3. How This Maps to Your Hackathon Demo

### The Tabletop Demo IS the Proof of Concept

Your 3-minute hackathon demo demonstrates the **core technology stack** that makes the full platform possible:

| Hackathon Demo Element | Real-World Application |
|---|---|
| Tape path on table | Hallway in a building |
| Boxes on table | Rooms to clear |
| Robot walks and explores | Robot enters and clears building |
| Camera detects objects | Camera identifies threats vs. civilians |
| Dashboard shows map | Mobile app shows building layout |
| Second patrol detects changes | Follow-up mission verifies building status |

### The Three Submissions, Re-framed

| Submission | What You Submit | How the Full Concept Fits |
|---|---|---|
| **🏆 MAIN EVENT** | Live robot demo + pitch | "This is SCOUT — a €200 robot that clears buildings. Here's the app that controls it." |
| **📋 01-ats** | Graph exploration Python code | "The algorithm that guides the robot through an unknown building — optimized for minimum distance." |
| **📋 01-se3 Track 2** | Change detection Python code | "After the robot clears a building, a second pass detects what's changed — new threats, moved objects." |

### The Pitch Upgrade (Now With the Full Vision)

Your 3-minute pitch should **start with the robot demo** (proves you can build), then **zoom out to the platform vision** (proves you understand the market):

> *"What you just saw is SCOUT — a €200 autonomous ground robot. But the robot isn't the product. The product is in every soldier's pocket."*
>
> *[Show phone screen — SCOUT app]*
>
> *"One app. Three mission types. Building clearance — robot enters, identifies threats, operator confirms, threat neutralized. No soldier through the door first. Civilian rescue — robot finds families hiding from combat, marks them for extraction, keeps them safe until help arrives. Surveillance — robot patrols, reports, detects changes between passes."*
>
> *"The same €200 robot. Swap the payload. Different mission. Every soldier carries one. Not a $75,000 specialist tool — a disposable, backpack-sized unit that turns every infantryman into a robot operator."*
>
> *"We submitted our graph exploration algorithm to ATS GmbH's challenge. Our change detection system to SE3 Labs. And we're standing here with a working robot, a working app, and a vision for how this scales from a tabletop to a battlefield."*
>
> *"Built in 42 hours at EDTH Munich. The same platform that clears a building in Ukraine can patrol a warehouse in Berlin. Defense-grade robotics. Consumer-grade cost."*

---

## 4. Technical Architecture: From Tabletop to Battlefield

### What You Build in 42 Hours (Hackathon Scope)

| Component | Technology | Time | Priority |
|---|---|---|---|
| Robot controller | Python + PiCrawler library | 3h | P0 |
| AI vision (detection) | Raspberry Pi AI Camera (IMX500) | 4h | P0 |
| Graph exploration algorithm | Python (01-ats submission) | 4h | P0 |
| Change detection | OpenCV image diff (01-se3 submission) | 3h | P1 |
| Tactical dashboard | Streamlit (for demo display) | 4h | P1 |
| Mobile app prototype | React (web-based for demo) | 4h | P1 |

### What the Full Platform Requires (Post-Hackathon)

| Component | Technology | Timeline |
|---|---|---|
| React Native mobile app | iOS + Android, offline-first | 2-3 months |
| LoRa mesh communication | 868MHz / 915MHz mesh network | 1-2 months |
| Payload bay (explosive) | Safe arming mechanism, remote detonation | 3-6 months (requires defense certification) |
| Payload bay (rescue) | Audio speaker, rescue beacon, medical marker | 1-2 months |
| Threat classification AI | Custom-trained model on military datasets | 3-6 months |
| Civilian detection AI | Fine-tuned model to distinguish combatant vs. civilian | 3-6 months |
| Encrypted communication | End-to-end encrypted video + control | 1-2 months |
| Multi-robot coordination | Fleet management, area coverage | 6+ months |

### The Scalability Story (For Investors/Judges)

| Phase | What | Timeline | Cost |
|---|---|---|---|
| **Hackathon** | Working robot + app prototype + 2 code submissions | 42 hours | €200 |
| **Phase 1** (3 months) | React Native app, LoRa comms, improved AI models | 3 months | €10K-20K |
| **Phase 2** (6 months) | Payload development, field testing with defense partners | 6 months | €50K-100K |
| **Phase 3** (12 months) | NATO trials, certification, production scaling | 12 months | €200K-500K |
| **Production** | €200/unit at 1,000+ unit scale | 18+ months | Self-sustaining |

---

## 5. Why This Wins (The Emotional + Technical Knockout)

### Defense Judges See:

| What They See | What They Think |
|---|---|
| Walking robot with AI vision | "This kid builds real hardware" |
| €200 cost vs. $75K Spot | "Massive cost disruption" |
| Mobile app control | "Every soldier can use this — no training needed" |
| Lethal + non-lethal modes | "Ethically sound, legally compliant, operationally flexible" |
| Human-in-the-loop detonation | "Not a killer robot — it's a tool that saves soldier lives" |
| Two side quest submissions | "Real coding chops, not just a toy demo" |
| Civilian rescue narrative | "This saves innocent lives too — dual-use with moral clarity" |

### The Emotional Hook

The video you're about to generate is the **most important marketing asset** you'll create. Here's why:

Most hackathon demos are **dry technical demonstrations** — robot walks, screen updates, numbers change. Judges appreciate the engineering but they don't **feel** anything. Your video tells a **human story**:

- **Scene 1:** A soldier watches his buddy get hit clearing a building. The problem is visceral and real.
- **Scene 2:** That same soldier deploys SCOUT. The robot enters, finds enemies, the operator confirms, threat neutralized. Nobody else dies. **This is the save.**
- **Scene 3:** Cut to another theater. Another soldier deploys SCOUT in a different house. The robot finds a family — children, parents, terrified. The operator sees them on his phone. He taps "HOLD." The robot doesn't explode. It marks the house. Help comes. **This is the humanity.**

This dual narrative — **one robot saves soldiers, another saves civilians** — is what separates a technical demo from a **mission-driven product**. It shows the judges that you understand that defense technology isn't just about killing more efficiently. It's about **protecting the people who protect us** and **sparing the people caught in the crossfire**.

The mobile app is the thread that connects both stories. Same interface. Same robot. Same soldier making the call. The technology serves the human decision, never replaces it.

---

## 6. Competitive Landscape: Why Nobody Else Has This

| Competitor | What They Do | Why SCOUT Beats Them |
|---|---|---|
| **Boston Dynamics Spot** | $75K quadruped, laptop control, trained operator | 375x more expensive, requires specialist, not squad-level |
| **Ghost Robotics Vision 60** | $150K+ military quadruped, similar limitations | Even more expensive, US-only, no mobile app |
| **Teledyne FLIR SUGV** | Small ground robot, joystick control, $50K+ | Tracks, not legs (stairs, debris), expensive, not autonomous |
| **AeroVironment Switchblade** | $6K loitering munition (flying suicide drone) | Flying = GPS-dependent, indoor useless, one-use only, no reconnaissance |
| **Ukrainian FPV kamikaze drones** | $500 DIY explosive drones | Flying, requires pilot, no autonomous ground capability |
| **Israeli Roboteam MTGR** | Small ground robot, tactical use | $30K+, not autonomous, joystick control, no AI vision |

**SCOUT occupies a gap nobody else fills:** autonomous, AI-vision-equipped, quadruped ground robot at under €300, controlled by a smartphone, with both lethal and non-lethal mission profiles. It's the **democratization of military robotics** — from specialist units to every soldier.

---

*This document maps the full SCOUT platform vision to the hackathon deliverable. The tabletop demo proves the core technology. The video tells the human story. The side quest submissions prove the algorithmic depth. Together, they win.*
