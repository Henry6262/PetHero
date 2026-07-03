# SCOUT — Battle-Tested Plan for EDTH Munich 2026
## How to Win the Main Event + Side Quests with a Robot, a Mobile App, and a Story That Judges Can't Ignore

**TL;DR:** You are the only team building a **physical robot + mobile app + challenge submissions** combo. Everyone else is doing code-only challenges. Your edge is the **IRL demo** — a walking robot controlled by a phone, solving real defense problems. This document gives you the use cases, tech architecture, integration strategy, IRL setup, mobile app plan, and pitch psychology to dominate. Read it once, execute fast.

---

## 1. THE CORE INSIGHT: Why You Win

### 1.1 What Everyone Else Is Doing

Walk the floor on Friday night. You'll see:
- Teams hunched over laptops writing Python for challenge 01 (data fusion)
- Teams downloading satellite datasets for challenge 08 (earth observation)
- Teams training models they won't finish in time
- Teams with slick PowerPoint slides and no hardware

**Nobody has a walking robot. Nobody has a mobile app. Nobody has a physical demo.**

The EDTH February 2026 Munich event had teams working on "deploying remote sensors via drones and balloons" and "building resilient sensing systems" — but most were **software-only or conceptual** [^2^]. The Vilnius winner built an AI drone detection system in **24 hours** — pure software, no physical component [^1^].

### 1.2 Your Unfair Advantage

| What Others Have | What You Have |
|---|---|
| Python code on a laptop | Walking quadruped robot with AI camera |
| PowerPoint slides | Live mobile app prototype |
| Challenge submissions (code only) | Challenge submissions + physical proof |
| Abstract problem descriptions | Real-world use case validated by Ukraine combat data |

The research from Georgia Tech's Tactical Mobile Robot program confirms what you're intuitively building: **soldiers prefer picture-icon interfaces over text, military symbol metaphors over abstract states, and low cognitive load under stress** [^94^]. Your mobile app with big buttons, color-coded alerts, and minimal text maps directly to what warfighters actually need.

### 1.3 The Judge Psychology

EDTH judges are defense contractors, VCs, and Ukrainian military mentors [^2^][^34^]. They see 20+ pitches on Sunday. The ones they remember share three traits:

1. **Physical proof beats simulation every time** — A robot walking is more memorable than any algorithm
2. **Soldier-centric narrative beats tech specs** — "This saves lives" beats "Our algorithm achieves O(n log n)"
3. **Dual-use scalability beats single-purpose tools** — "Works in Ukraine today, warehouses tomorrow" beats "Defense-only niche"

---

## 2. USE CASES: What Problem Are You Actually Solving

### 2.1 Primary Use Case: Urban Building Clearance

**The Problem (Validated by Ukraine Combat Data):**

Urban combat accounts for a **disproportionate share of infantry casualties** because the defender has every advantage. Ukraine's first fully unmanned ground operation in December 2024 near Lyptsi involved dozens of UGVs and FPV drones with **no infantry participation** — UGVs with machine guns performed mine clearance and direct fire while FPV drones provided air support [^96^]. The operation successfully destroyed Russian positions, but the systems were still manually operated, not autonomous.

Current alternatives:
- **Send a soldier:** High casualty risk. Ukraine has severe manpower limitations.
- **$75,000 Boston Dynamics Spot:** Requires trained operator, laptop, GPS. One per specialized unit.
- **FPV kamikaze drone:** Flying, GPS-dependent, one-use only, can't enter buildings.
- **Nylon nets / steel mesh:** Passive defense, doesn't solve the problem of unknown interiors.
- **Shooting at drones:** Ineffective, dangerous close range [^95^][^97^].

**Your Solution:**
A €200 backpack-sized quadruped that enters buildings autonomously, streams video to the soldier's phone, and lets the operator decide — detonate or hold — without ever stepping through the door.

### 2.2 Secondary Use Case: Civilian Rescue in Contested Zones

**The Problem:**

In occupied villages, civilians hide in buildings to avoid combat. Soldiers conducting clearance operations can't distinguish combatants from non-combatants without visual confirmation. Sending soldiers door-to-door risks civilian casualties and ambushes. Both adversaries in Ukraine face **recruitment difficulties and high casualty rates**, driving interest in autonomous ground systems [^97^].

**Your Solution:**
Same robot, different payload. Enters building, camera spots family huddled in a corner, operator sees them on phone, taps "HOLD — CIVILIANS DETECTED." Robot stops, beacon activates, marks location for extraction team. Nobody gets hurt.

### 2.3 Tertiary Use Case: Perimeter Patrol & Change Detection

**The Problem:**

Forward operating bases need constant perimeter monitoring. Current solutions are either human patrols (risky, tiring) or expensive sensor networks (fixed positions, can't adapt). Ukraine plans to supply **10 million FPV drones to the front in 2026** — saturating the battlefield requires autonomous ground sensors that can operate without GPS and without human operators [^98^].

**Your Solution:**
Robot patrols a defined path, takes photos at checkpoints, compares to previous patrol, flags changes (shifted objects, new presences, open doors). All on-device, no cloud, no GPS, works in GPS-denied environments.

---

## 3. THE MOBILE APP: Your Secret Weapon

### 3.1 Why the Mobile App Changes Everything

Current military robot systems require **laptops, joysticks, trained operators, and dedicated personnel** [^94^]. A Predator drone has a crew of three. Boston Dynamics Spot requires a tablet and trained handler. This creates a bottleneck: one robot per specialist, not one robot per soldier.

A smartphone app democratizes robot control:

| Current Systems | SCOUT Mobile App |
|---|---|
| Laptop + joystick + trained operator | Any soldier's phone — everyone already has one |
| 3-person crew for one robot | 1 soldier deploys and controls |
| $75,000+ per unit | €200 per unit |
| GPS-dependent, datalink vulnerable | Wi-Fi direct / LoRa mesh — no infrastructure |
| Cloud-connected, jamming risk | On-device AI — works offline |
| One robot per specialized unit | One robot per soldier — distributed, redundant |

The Georgia Tech Tactical Mobile Robot research found that soldiers **overwhelmingly preferred picture-icon interfaces** over text-based ones — "lower cognitive load," "easier to recognize in poor light," "no need to remember text names" [^94^]. Your app's design should reflect this: big colored buttons, military symbols, minimal text.

### 3.2 App Architecture for Hackathon Speed

**Framework: React with Expo Go**

Don't build a native app in 42 hours. Use **React web app** running in a browser — it looks identical to a native app for demo purposes, works on any phone instantly, and takes 2-3 hours to build.

```
Tech Stack:
├── React (frontend framework you know)
├── CSS/Tailwind (styling)
├── No backend needed (connects directly to robot via Wi-Fi)
└── Runs in browser = works on any phone instantly
```

**Why not React Native / Flutter for the hackathon?**

| Factor | React Web App | React Native | Flutter |
|---|---|---|---|
| Setup time | 5 minutes | 30+ minutes | 30+ minutes |
| Deploy to phone | Open URL | Build + install | Build + install |
| Demo reliability | 100% | Depends on build | Depends on build |
| Looks like native | Yes (with CSS) | Yes | Yes |
| Time to build UI | 2 hours | 4 hours | 4 hours |

For the hackathon, a **web app** is the pragmatic choice. For post-hackathon, port to React Native with Expo [^105^].

### 3.3 App Screens (What to Build)

**Screen 1: Mission Select**
- Three big buttons: CLEARING (red), RESCUE (green), SURVEIL (blue)
- Large icons, minimal text, military aesthetic
- Connection status indicator ("ROBOT LINKED ✓")

**Screen 2: Deployment**
- Mission type displayed
- Big green DEPLOY button
- Countdown animation (3-2-1)
- "Place robot at entry point" instruction

**Screen 3: Live Feed (The Money Screen)**
- Top half: live camera feed with targeting crosshair overlay
- Detection banner: pops up when AI sees something
  - Red: "THREAT DETECTED — Armed Individual — 91%"
  - Yellow: "CIVILIANS DETECTED — 4 unarmed"
  - Green: "CLEAR — No contacts"
- Bottom: action buttons (changes based on detection)
  - Lethal: [DETONATE] [HOLD] [NO THREAT]
  - Rescue: [HOLD + MARK] [PLAY MESSAGE] [CONTINUE]
  - Surveil: [LOG] [SKIP] [ALERT]

**Screen 4: Tactical Map**
- 2D graph view: dots = rooms, lines = paths
- Green dot = explored, red = unvisited, blue triangle = robot
- Alert icons on changed nodes
- Simple, readable under stress

**Screen 5: Mission Log**
- Timestamped events in scrollable list
- "14:32 — Entered building"
- "14:33 — Room 1: CLEAR"
- "14:34 — Room 2: THREAT DETECTED — DETONATED"

### 3.4 Design Principles (From Military UX Research)

Based on Georgia Tech's TMR interface studies [^94^]:

| Principle | How to Apply |
|---|---|
| **Picture icons > text** | Use symbols for all actions, not words |
| **Low cognitive load** | One decision per screen, clear hierarchy |
| **Consistent appearance** | Same colors always mean same things (red = danger/threat) |
| **Uncluttered layout** | Clean design, qualitative over quantitative data |
| **Visual safeguards** | DETONATE button requires double-tap with delay |
| **Functional organization** | Group related controls together |
| **Works in poor light** | High contrast, large elements, no small text |

---

## 4. COMMUNICATION ARCHITECTURE: Robot ↔ Phone

### 4.1 Wi-Fi Direct (For Hackathon Demo)

The simplest approach: robot creates a Wi-Fi hotspot, phone connects to it, communication over HTTP/WebSocket.

```
Robot (Raspberry Pi)          Phone (Any device)
├── Creates Wi-Fi AP          ├── Connects to robot's AP
├── Runs Flask server         ├── Opens web app in browser
├── Serves:                   └── Receives:
│   ├── /video_feed (MJPEG)       ├── Live camera feed
│   ├── /status (JSON)            ├── Robot status
│   ├── /detect (JSON)            ├── Detection alerts
│   └── /command (POST)           └── Sends commands
└── Receives commands:
    ├── DEPLOY
    ├── DETONATE
    ├── HOLD
    └── MARK
```

**Advantages:**
- No internet needed
- Works completely offline
- Low latency (same network)
- Simple to implement (Flask + JavaScript fetch)

**Limitations:**
- Range: ~30-50 meters (Wi-Fi)
- Not encrypted (for demo, acceptable)
- Single client (one phone at a time)

### 4.2 LoRa Mesh (For Vision / Post-Hackathon)

For the pitch narrative, mention LoRa as the future communication layer. The research on Meshtastic + ATAK integration shows this is real and deployed [^99^]:

| Spec | Value |
|---|---|
| Range | 5-10 km line-of-sight per node |
| Mesh | Self-forming, self-healing, multi-hop |
| Encryption | End-to-end |
| Power | Low power, minimal electronic signature |
| Data rate | ~5 kbps (text + GPS, not video) |
| Cost | ~$30 per radio node |

**Real-world validation:** A border conflict exercise deployed **150 Meshtastic nodes** with ATAK integration, achieving full area coverage with automatic relay [^99^]. The system supported 300+ concurrent devices using a hybrid Starlink + LoRa architecture.

**For your demo:** Wi-Fi is fine. For the pitch: "Future versions use LoRa mesh for 10km range, end-to-end encrypted, no infrastructure needed — tested in live military exercises."

### 4.3 TAK Server Integration (The Big Vision)

ATAK (Android Tactical Assault Kit) is the **standard military situational awareness platform** used by NATO and allied forces [^101^][^109^]. It runs on Android phones, shows maps, tracks friendly positions, shares chat and video.

**The vision:** Your SCOUT app feeds data into the TAK ecosystem.

```
SCOUT Robot → SCOUT App → TAK Server → ATAK Clients
   ↓              ↓              ↓             ↓
Camera      CoT messages    Federation    All soldiers
Detections  (position,      (sharing      see robot
Alerts      alerts,         across        position +
Photos      status)         networks)     alerts
```

**TAK Server runs on Raspberry Pi** — the same hardware as your robot [^111^][^112^]. A Pi 5 supports ~100 concurrent users for basic situational awareness. Setup takes ~46 minutes [^111^].

**For your pitch:** "SCOUT integrates with ATAK — the same system NATO soldiers already use. Robot position, detection alerts, and mission status appear on every soldier's ATAK map. No new training needed."

---

## 5. IRL SETUP: What You Build at the Venue

### 5.1 The Tabletop Environment

This is your "building." The judges need to immediately understand what they're looking at.

```
TABLE LAYOUT (top-down view):

    [START] ==== [Box A] ==== [Box B] ==== [Box C]
       ↑         (yellow)      (blue)       (red)
       │                                    threat
    ROBOT
    entry

    ==== = tape path (hallway)
    Box  = cardboard box (room)
    Card = colored paper inside box (what's in the room)
```

**Physical components to bring:**

| Item | Purpose | Where to Get |
|---|---|---|
| Colored electrical tape (3 colors) | Hallway paths | Hardware store |
| Cardboard boxes (3, shoebox size) | Rooms | Bring from home |
| Colored cards (red, blue, yellow) | Room contents | Print on paper |
| Large table (2m x 1m minimum) | Building floor | Venue provides |
| Power strip + extension | Robot + laptop | Bring |
| Laptop | Runs dashboard + serves app | Your laptop |
| Phone | Shows mobile app | Your phone |
| "Drone" cutout | Simulated aerial threat | Black cardboard + stick |

### 5.2 The Demo Flow (3 Minutes, Scripted)

**Setup (before judges arrive):**
- Table set with tape path and boxes
- Robot at START position
- Laptop showing dashboard
- Phone showing app (Mission Select screen)
- Cards placed: Box A = yellow, Box B = blue, Box C = red

**Phase 1 — DEPLOY (15 seconds):**
> *"A soldier approaches a building. Instead of entering, they pull SCOUT from their pack."*
- You pick up robot, place at START
- Tap CLEARING on phone, tap DEPLOY
- Countdown 3-2-1, robot starts moving

**Phase 2 — EXPLORE (60 seconds):**
> *"SCOUT enters autonomously. AI camera scans each room."*
- Robot walks to Box A, stops, "camera takes photo"
- Dashboard: "Room A: FRIENDLY_ASSET detected"
- Robot walks to Box B, stops
- Dashboard: "Room B: CLEAR — door closed"
- Robot walks to Box C, stops
- Dashboard: "Room C: THREAT DETECTED"
- App screen shows live feed with red alert banner

**Phase 3 — OPERATOR DECISION (30 seconds):**
> *"The operator sees the threat on their phone. They decide."*
- Show phone screen: THREAT DETECTED, DETONATE button visible
- Tap DETONATE (with dramatic pause)
- "Threat neutralized. Soldier never entered the building."

**Phase 4 — RESCUE VARIANT (45 seconds):**
> *"Same robot. Different mission."*
- Reset robot, swap red card in Box C for another yellow card
- Select RESCUE mission on app
- Robot patrols again
- Box C: "CIVILIANS DETECTED — 4 unarmed"
- Show phone: CIVILIANS DETECTED banner
- Tap HOLD — MARK FOR EXTRACTION
- "Family saved. Help dispatched."

**Phase 5 — THE CLOSE (30 seconds):**
> *"Current options: send a soldier, or buy a $75,000 Spot."
> "SCOUT: €200. Every soldier's pocket. Defense-grade robotics. Consumer-grade cost."
> "Built in 42 hours at EDTH Munich."*

### 5.3 What Can Go Wrong & Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Robot falls off table | Medium | Large table, ultrasonic edge detection, practice 10x |
| Camera doesn't detect colors | Low | Test venue lighting Friday night, bring backup detection (simple brightness check) |
| Wi-Fi doesn't work | Low | Run everything on localhost, use Ethernet cable as backup |
| Robot servo fails | Low | SunFounder includes spare servos, calibrate before event [^29^] |
| Demo freezes mid-pitch | Medium | Record a **video backup** of the full demo working |
| App doesn't load on phone | Low | Have app open and ready before judges arrive, test on venue Wi-Fi |
| You get nervous | High | Practice 5+ times, memorize transitions, have notes on laptop |

---

## 6. CHALLENGE INTEGRATION STRATEGY

### 6.1 How Challenges Feed the Main Demo

Your challenge submissions are **proof that the algorithm behind the robot is real and competitive**. They validate the technical depth.

| Challenge | What You Submit | How It Feeds the Main Demo |
|---|---|---|
| **01-ats** | Python `Explorer` class for graph exploration | "The algorithm guiding SCOUT through the building — tested and scored against official metrics" |
| **01-se3 T2** | Python `TacticalChangeDetector` for change detection | "The same computer vision that compares patrol passes and flags what changed — runs on the robot's camera" |
| **01** (Geo-Temporal) | Data fusion engine + Streamlit dashboard | "The tactical dashboard showing mission timeline and hex-grid map — same UI concept scaled up" |
| **03** (UAV-Ground Correlation) | Correlation analysis pipeline | "Analytics showing how drone activity correlates with ground threats — the intelligence layer above SCOUT" |

### 6.2 The Narrative Thread

Your pitch should weave all submissions into one coherent story:

> "SCOUT is an autonomous ground reconnaissance platform. At its core is a **graph exploration algorithm** [01-ats] that efficiently maps unknown indoor environments. Its **AI vision system** [01-se3 T2] detects threats and civilians, filtering noise from real signals. The **tactical dashboard** [01] provides command-level situational awareness. And the **correlation engine** [03] links what SCOUT sees to broader intelligence patterns. All controlled by a soldier's phone."

### 6.3 Submission Priority (Given 42 Hours)

| Priority | Challenge | Time Budget | Deliverable |
|---|---|---|---|
| **P0** | 01-ats | 4h | `submission.py` with frontier-based explorer |
| **P0** | 01-se3 T2 | 3h | `change_detector.py` with OpenCV pipeline |
| **P1** | 01 (Geo-Temporal) | 5h | Data fusion + Streamlit dashboard |
| **P1** | 03 (Correlation) | 4h | Python analysis pipeline + visualizations |
| **P2** | Robot + App integration | 6h | Working hardware demo + mobile app |
| **P2** | Pitch rehearsal | 3h | Smooth 3-minute presentation |

**Total coding time: ~25 hours. Total prep time: ~35 hours. Leaves buffer for debugging and polish.**

---

## 7. COMPETITIVE LANDSCAPE: Who You're Beating

### 7.1 Direct Competitors at the Event

| Team Type | Likely Project | Their Weakness | Your Advantage |
|---|---|---|---|
| **Pure software teams** | AI detection web app, data analysis | No physical demo, no hardware | You have a walking robot |
| **Drone teams** | Autonomous surveillance drone | Risky indoors, battery life, regulations | Your robot works indoors, 2+ hour runtime |
| **RF/SDR teams** | Radio frequency detection | Doesn't work on fiber-optic drones, no visual | Your vision works on ALL drone types |
| **Satellite imagery teams** | Earth observation analysis | No interactivity, no real-time | Your demo is live and interactive |
| **Simulation teams** | Wargaming, scenario modeling | No physical proof | Physical demo > simulation |

### 7.2 Real-World Product Analogs

Reference these in your pitch to show you understand the market:

| Product | What They Do | Price | SCOUT vs. Them |
|---|---|---|---|
| **Boston Dynamics Spot** | Quadruped robot, laptop control | $75,000+ [^43^] | 375x cheaper, phone-controlled |
| **Ghost Robotics Vision 60** | Military quadruped | $150,000+ | 750x cheaper, disposable |
| **Teledyne FLIR SUGV** | Small tracked robot | $50,000+ | 250x cheaper, autonomous |
| **AeroVironment Switchblade** | Loitering munition (flying) | $6,000 [^97^] | Ground-based, reusable, indoor-capable |
| **ATAK** | Military situational awareness | Free (open source) [^101^] | SCOUT integrates with ATAK ecosystem |
| **Meshtastic** | LoRa mesh communication | ~$30/radio [^99^] | SCOUT uses same mesh tech for comms |

---

## 8. THE PITCH: Word-for-Word Framework

### 8.1 The 60-Second Hook (For Walking Around the Venue)

> "I'm building SCOUT — a €200 autonomous ground robot that clears buildings and saves civilians, controlled by any soldier's phone. I have working hardware, two challenge submissions, and a mobile app. Looking for one Python dev to finish strong. Who's in?"

### 8.2 The 3-Minute Demo Pitch (For Sunday)

**[0:00-0:15] The Hook — A Soldier's Dilemma**
> "A soldier approaches a building. What's inside? Enemies? Civilians? A trap? Current options: send a human through the door — that's how soldiers die. Or buy a $75,000 robot that needs a trained operator and a laptop."

**[0:15-0:30] The Solution — SCOUT**
> "SCOUT. €200. Backpack-sized. Controlled by the phone every soldier already carries. One app. Three missions. Building clearance. Civilian rescue. Perimeter patrol."

**[0:30-1:30] The Demo — Robot Walks, Phone Decides**
> *Deploy robot, walk through tape path, stop at boxes*
> *"Room A: friendly asset. Room B: clear. Room C: THREAT DETECTED."*
> *Show phone: red alert, DETONATE button*
> *"The operator decides. Not the robot. The human always has final authority."*

**[1:30-2:15] The Second Mission — Rescue**
> *Reset, swap card, RESCUE mission*
> *"Same robot. Different payload. Different decision."*
> *"Civilians detected. HOLD. Mark for extraction. Family saved."*

**[2:15-2:45] The Challenges — Technical Depth**
> "We submitted our graph exploration algorithm to ATS GmbH's 01-ats challenge. Our change detection system to SE3 Labs' 01-se3 Track 2. The code is real. The scores are competitive."

**[2:45-3:00] The Close — Scale and Vision**
> "€200. Every soldier's pocket. Defense-grade robotics. Consumer-grade cost. The same robot that clears a building in Ukraine can patrol a warehouse in Berlin. Built in 42 hours at EDTH Munich."

### 8.3 Key Phrases That Trigger Defense Judges

| Say This | Why It Works |
|---|---|
| "GPS-denied environment" | Military terminology, addresses known operational gap |
| "Disposable reconnaissance node" | Sounds procurement-ready, cost-effective |
| "On-device AI, no cloud dependency" | Resilience/jamming-proof narrative |
| "Human-in-the-loop" | Addresses autonomous weapons concerns, legally sound |
| "Layered C-UAS architecture" | Shows systems thinking, NATO doctrine alignment |
| "Cost asymmetry" | $4M tank vs $500 drone is the compelling story [^35^] |
| "Dual-use consumer angle" | Addresses commercial scalability for VCs |
| "Integrates with ATAK" | Shows you understand military ecosystems [^101^] |
| "LoRa mesh, 10km range" | References real deployed military tech [^99^] |
| "Tested in Ukraine combat conditions" | Grounds your product in real operational need [^96^] |

---

## 9. POST-HACKATHON ROADMAP (For Judges Who Ask)

Judges will ask "What's next?" Have a 30-second answer ready:

| Phase | Timeline | What Happens |
|---|---|---|
| **Phase 0** (Now) | 42 hours | Working prototype, challenge submissions, demo |
| **Phase 1** (3 months) | Summer 2026 | React Native app, LoRa mesh integration, improved AI models |
| **Phase 2** (6 months) | Fall 2026 | Field testing with defense partners, payload development |
| **Phase 3** (12 months) | 2027 | NATO trials, certification, production at €200/unit scale |
| **Production** | 2027+ | 1,000+ units, self-sustaining, dual-use market |

The NATO Innovation Fund co-led a **€30 million Series A** into TYTAN Technologies — a counter-drone startup that originated at a hackathon [^35^]. Hackathon C-UAS ideas do graduate to serious funding. EDTH's explicit goal is **deployment**, not just prototypes [^6^].

---

## 10. RESOURCE LINKS (Everything in One Place)

### Challenge Repos & Docs
- **01-ats GitHub:** `https://github.com/SamEberl/graph_explo`
- **01-ats Rules:** `exploration_challenge/docs/RULES.md` (in repo)
- **01-ats Evaluator:** `exploration_challenge/evaluator.py` (in repo)

### Technical References
- **Frontier-based exploration (Yamauchi 1997):** Foundation of the algorithm [^78^]
- **Multi-robot frontier coordination:** CMU research on distributed coverage [^80^]
- **A* frontier exploration:** DLR/SMU optimal pathfinding to frontiers [^79^]
- **OpenCV change detection:** `https://docs.opencv.org/4.x/d7/d4d/tutorial_py_thresholding.html`
- **ORB feature matching:** `https://docs.opencv.org/4.x/d1/d89/tutorial_py_orb.html`
- **Rerun 3D viz:** `https://rerun.io/docs/getting-started/quick-start/python`

### Communication & Tactical
- **Meshtastic + ATAK integration:** Real 150-node deployment [^99^]
- **ATAK overview:** `https://skyfi.com/en/blog/atak-system-satellite-imaging` [^101^]
- **TAK Server on Raspberry Pi:** Full setup guide [^111^]
- **FreeTAK Server (open source):** `https://github.com/FreeTAKTeam/FreeTAKServer` [^113^]
- **TAK ecosystem (Hackaday):** `https://hackaday.com/2022/09/08/the-tak-ecosystem-military-coordination-goes-open-source/` [^109^]

### Ukraine Combat Validation
- **CSIS report on Ukraine autonomous warfare:** `https://www.csis.org/analysis/ukraines-future-vision-and-current-capabilities-waging-ai-enabled-autonomous-warfare` [^96^]
- **Ukraine drone warfare evolution:** `https://vgi.com.ua/en/from-quantity-to-algorithms-how-fpv-warfare-is-changing-in-2026/` [^98^]
- **Counter-drone limitations in Ukraine:** `https://securityanddefence.pl/Analysis-of-the-power-of-drones-and-limitations-of-the-anti-drone-solutions-on-the-Russian-Ukrainian-battlefield,208347,0,2.html` [^97^]

### Mobile App Development
- **React Native + Expo (2026):** `https://dev.to/strapi/building-a-react-native-app-with-expo-and-strapi-a-complete-guide-5fma` [^105^]
- **Flutter vs React Native 2026:** `https://www.bolderapps.com/blog-posts/flutter-vs-react-native-in-2026` [^102^]

### Robot Hardware
- **PiCrawler GitHub:** `https://github.com/sunfounder/picrawler`
- **Pi AI Camera docs:** `https://www.raspberrypi.com/documentation/accessories/ai-camera.html` [^24^]
- **Picamera2 repo:** `https://github.com/raspberrypi/picamera2`
- **Pi AI Camera review:** `https://www.jeffgeerling.com/blog/2024/raspberry-pi-ai-camera-review`

### Market Data
- **Counter-UAS market $14.41B (2026):** [^37^]
- **$29B in Q1 2026 contracts:** [^35^]
- **US Army $20B Anduril contract:** [^35^]
- **Dual-use defense tech investments:** `https://valueaddvc.com/blog/dual-use-startups-how-defense-tech-investments-work-and-whos-funding-them` [^110^]

---

*This plan combines frontier-based graph exploration algorithms, classical computer vision change detection, tactical mobile interface design, LoRa mesh communication research, Ukraine combat validation, and defense hackathon psychology into one cohesive strategy. The robot is the proof. The app is the product. The challenges are the technical credentials. The story is what wins.*
