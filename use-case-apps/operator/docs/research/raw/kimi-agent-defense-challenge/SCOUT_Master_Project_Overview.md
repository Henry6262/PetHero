# SCOUT C2 — Master Project Overview
**For Internal Team Use | Henry + Colleague | Created June 27, 2026**

---

## 1. WHAT IS SCOUT C2?

SCOUT C2 is a tactical command-and-control platform for multi-agent ground robotics in high-risk interior and urban operations. The core product is **software** — a shared virtual battlefield where one operation manager commands multiple robot sensor nodes and coordinates with field operators via a unified map state. The robots are commodity hardware; the C2 layer is the defensible IP.

### The Core Insight

Every robot, every drone, every operator shares **one map with state**. Every room, every building, every location has a color-coded status that updates in real time. When a robot clears a room, every soldier's phone shows it green instantly. No radio confusion. No fog of war.

### Two Product Variants

| Variant | Focus | Status |
|---------|-------|--------|
| **SCOUT Clearing** | Interior building-clearing (3 modes: Recon, Rescue, Eliminate) | **Built and demo-ready** |
| **SCOUT Tactical C-UAS** | Outdoor counter-drone operations | Concept stage |

---

## 2. THE THREE HARDWARE VERSIONS (Roadmap)

### Version 0: PiCrawler Base (TODAY — $280)

**What it is:** SunFounder PiCrawler kit + Raspberry Pi 5 + Sony IMX500 + mesh radio

| Spec | Value |
|------|-------|
| Legs | 4 |
| Servos | 12 × 9g (1.6 kg·cm) |
| Weight | ~1,000g |
| Payload | ~200g max |
| Compute | Raspberry Pi 5 (8GB) + Sony IMX500 AI Camera |
| AI | 30 FPS person detection, on-chip inference |
| Comms | 868MHz LoRa mesh |
| Cost | **$280** (kit only) |
| What it does | Walks rooms, streams video, AI detects people/objects, shares to dashboard |
| Limitations | Small payload, can't handle real rubble, slow walking |

**Use for hackathon:** Live demo prop. Shows the sensor node concept. Software (dashboard) is the real product.

---

### Version 1: SCOUT-Mini (3-MONTH PROTOTYPE — $552)

**What it is:** Custom 3D printed hexapod frame, 6 legs, VTOL flight capability, 1.3kg AUW

| Spec | Value |
|------|-------|
| Legs | **6** (spider configuration) |
| Servos | 18 × 9g (same as PiCrawler — proven, $3 each) |
| Motors | 6 × T-Motor F60 2207 1750KV ($20 each) |
| Props | 6 × 5-inch carbon fiber |
| Weight | **1,318g (1.32 kg)** |
| TWR @ hover | **5.01:1** (6,600g thrust / 1,318g AUW) |
| Hover time | **3.0 minutes** |
| Terrain hops | **~2 hops** per battery (30s each) |
| Walking time | **107 minutes** (1.8 hours) |
| Frame | 3D printed PLA-CF / PETG-CF |
| Leg folding | Micro linear servos (DJI Inspire-style retractable gear) |
| Rotor arms | 3D printed CF, fold flat against body top |
| Compute | Raspberry Pi 5 + Sony IMX500 |
| Comms | 868MHz LoRa mesh |
| Cost | **$552** total BOM |
| Size | ~25cm body, fits in backpack |

**Key advantages over PiCrawler:**
- 6 legs = static stability (3 always on ground, can't tip)
- VTOL = flies over rubble when walking can't
- All 3D printed = iterate frame, legs, rotor arms in hours
- 5.01:1 TWR = safer than most commercial drones
- $552 = cheaper than DJI Mini 4 Pro ($759)

**Mission configs (hot-swappable):**
- **RECON:** Pan-tilt camera mast, 360° scanning
- **RESCUE:** Medical supply pod + tow hitch
- **MARKER:** Micro foam-dart launcher for target designation

**Build time:** 1-2 weeks (experienced), 3-4 weeks (first-timer)

**Risks:**
- Leg folding mechanism untested at 6-leg scale (DJI Inspire does 2)
- 3D printed leg segments may flex under stress (upgrade to CF tubes in v2)
- Pi 5 might choke running gait control + AI + mesh simultaneously (add ESP32 co-processor)
- One shared battery may sag under VTOL spike (upgrade to 4S 3000mAh or separate batteries)

---

### Version 2: SCOUT-Elite (12-MONTH R&D — $3,907)

**What it is:** Heavy-duty hexapod with high-torque servos, 28-inch props, 5.2kg AUW, 3.70:1 TWR

| Spec | Value |
|------|-------|
| Legs | 6 |
| Servos | 18 × MG996R (55g, 11 kg·cm) or JX CLS6336HV (63g, 35.6 kg·cm) |
| Motors | 6 × T-Motor U10 II KV100 ($85 each) |
| Props | 6 × 28-inch carbon fiber |
| Weight | **5,194g (5.19 kg)** |
| TWR @ hover | **3.70:1** (19,200g thrust / 5,194g AUW) |
| Hover time | **4.2 minutes** |
| Terrain hops | **~4 hops** per battery |
| Walking time | **114 minutes** |
| Frame | Carbon fiber tubes + 3D printed joints |
| Leg material | Carbon fiber (hollow tubes) |
| Battery | 8S 5000mAh LiPo (shared) |
| Cost | **$3,907** total BOM |
| Size | ~60cm body with rotors deployed |

**Use case:** Heavy payload operations, extended missions, professional/military deployment

**Risks:**
- 28-inch props = massive, body needs to be ~60cm wide
- 5.2kg = not backpackable
- $3,907 = approaching professional drone cost
- 8S battery at 72A hover = serious power management
- 2-3 week build time minimum

---

## 3. THE SOFTWARE (THE REAL PRODUCT)

### Architecture

```
ROBOT (Pi 5 + IMX500)          COMMAND STATION          OPERATOR PHONE
     |                                |                         |
     |--- video + AI detections ---->|                         |
     |--- telemetry (position,      |                         |
     |    battery, mode) ---------->|                         |
     |<--- commands (mode change,   |                         |
     |     route, RTB) -------------|                         |
     |                                |                         |
     |                                |--- map state updates -->|
     |                                |--- push notifications ->|
     |<-------------------------------|                         |
     |     (operator confirms        |                         |
     |      room cleared)            |                         |
```

### Components Built

| Component | Status | Notes |
|-----------|--------|-------|
| Flask telemetry server (`/api/state`, `/api/command`, `/video_feed`) | ✅ Built | Port 5050 |
| SCOUT Clearing operator app (3 modes) | ✅ Built | Android/iOS, mode-aware UI |
| IMX500 person detection | ✅ Works | 30 FPS, on-chip, zero CPU load |
| Lethal gating UI (3-checklist + ARM + press-hold) | ✅ Built | Human-in-the-loop required |
| Mesh radio communication | ✅ Built | 868MHz LoRa |

### Components NOT Built (Critical Gap)

| Component | Status | Effort | Priority |
|-----------|--------|--------|----------|
| **Admin/command dashboard** | ❌ NOT BUILT | 12-16 hrs | **P0 — pitch centerpiece** |
| 3D tactical map (Three.js) | ❌ NOT BUILT | 6-8 hrs | P0 |
| Building state tree panel | ❌ NOT BUILT | 2-3 hrs | P0 |
| Fleet status panel | ❌ NOT BUILT | 2-3 hrs | P0 |
| Command console | ❌ NOT BUILT | 1-2 hrs | P0 |
| Alert feed overlay | ❌ NOT BUILT | 1 hr | P1 |
| Live state sync (dashboard ↔ server) | ❌ NOT BUILT | 2-3 hrs | P1 |
| Operator position on map | ❌ NOT BUILT | 1-2 hrs | P1 |

### Dashboard Spec (What Must Be Built)

**Layout:** Single page, 1920×1080, dark theme
- **Center (60%):** Three.js 3D tactical map with colored rooms
- **Left (20%):** Fleet status panel — robot cards with health, battery, mode
- **Right (20%):** Building state tree + mission control timer
- **Bottom (120px):** Command console with input + quick commands
- **Floating:** Alert feed (top-right), live video pop-out (draggable)

**Room state colors:**
| State | Color | Meaning |
|-------|-------|---------|
| Unknown | Dark gray #3A3A3A | Not yet entered |
| In Progress | Amber #FF9F0A | Robot scanning |
| Cleared | Green #32D74B | Confirmed clear |
| Person Detected | Red #FF453A | Human detected |
| Evacuated | Blue #0A84FF | Civilian recovered |

---

## 4. THE 3D PRINTER (THE ASK)

### Why It's Critical

| Without 3D Printer | With 3D Printer |
|---|---|
| Buy parts, wait for shipping | **Design → Print → Test in 24 hours** |
| Stock PiCrawler looks like a kit | **Custom body, mounts, covers — looks like a product** |
| Can't prototype leg folding | **Print hinge, test fold, iterate — 6 cycles in a week** |
| Body frame needs CNC ($$$) | **CF-reinforced PLA = aluminum strength, 1/10th cost** |
| One design, one chance | **100 iterations, find the best one** |

### Real Validation

- **Leptron** (military drone): 200 design changes via 3D printing, **60% cost reduction**, **6 months faster to market**
- **Graco Inc**: 3D printing reduced development time by **75%**
- **Vbot** ($73M raised): *"Launch a 60-point product, improve through user feedback"* — 500 units first batch

### Recommended Printer

| Model | Price | Key Feature |
|-------|-------|-------------|
| **Bambu Lab A1 Mini** | ~$299 | Beginner-friendly, enclosed, fast |
| **Bambu Lab P1S** | ~$549 | Hardened steel nozzle, CF filament capable |
| **Creality K1C** | ~$399 | Budget option, decent CF printing |

### What to Print First (Priority Order)

1. **PiCrawler camera mount** — holds Pi 5 + IMX500 (2-3 hrs, PLA)
2. **PiCrawler body shroud** — covers wires, tactical look (3-4 hrs, PLA-CF)
3. **Thigh holster for DJI Mini** — operator drone mount (2-3 hrs, TPU)
4. **SCOUT-Mini body frame** — hexapod concept model (4-6 hrs, PLA-CF)
5. **Hexapod leg brackets** — servo mounting hinges (1-2 hrs each, PA-CF)
6. **Rotor arm mounts** — folding hinges for VTOL (1-2 hrs each, PLA-CF)
7. **TPU foot pads** — shock absorption (30 min each, TPU)
8. **Foam dart launcher barrel** — target marker (1 hr, PLA)

---

## 5. THE ANTI-JAM COMMUNICATION (5 Layers)

| Layer | Technology | Real-World Proof |
|-------|-----------|-----------------|
| **1. Physical** | Fiber-optic tether | 35+ Ukrainian manufacturers, immune to ALL jamming |
| **2. Spectrum** | Frequency hopping (100+ channels/sec) | Ukraine beats Russian Krasukha-4 with this |
| **3. Network** | 128-hop self-healing mesh | Beechat Kaonic platform |
| **4. Encryption** | AES-256 + VPN tunneling | Halo multilink on military UAVs |
| **5. Navigation** | INS backup (GPS-denied) | Ukraine Minister Fedorov demonstrated |

**Combined effect:** System remains operational even when 3 of 5 layers are compromised.

---

## 6. THE TEAM & COMPETITION

### What the Market Has

| Competitor | Product | Price | What They Lack |
|-----------|---------|-------|---------------|
| DJI | Drones (Mavic, Mini) | $500-3,000 | No ground mobility, no C2 coordination |
| Boston Dynamics | Spot | $74,500 | No flight, no shared map state, no AI camera |
| Ghost Robotics | Vision 60 | ~$150,000 | No C2 layer, no operator phone integration |
| Unitree | Go2 Air | $2,800 | No flight, no AI camera, no mesh comms |
| Anduril | Various defense systems | $$$$ | Enterprise-scale, not squad-level |

### What SCOUT Has That Nobody Else Does

- **Shared tactical map state** — every room tracked, everyone sees the same picture
- **Multi-agent coordination** — robot + drone + operator, one dashboard
- **Human-in-the-loop lethal gating** — 3-checklist + ARM + press-hold
- **Mesh communication (no cloud)** — works in contested environments
- **On-device AI (IMX500)** — 30 FPS detection, zero CPU load, no internet
- **Modular mission configs** — RECON/RESCUE/MARKER, hot-swappable
- **$552 price point** — 135× cheaper than Spot

---

## 7. 12-MONTH ROADMAP

| Month | Milestone | Version |
|-------|-----------|---------|
| **M1** | Build SCOUT-Mini v1 (3D printed frame, 6 legs, walks) | Mini v1 |
| **M2** | Integrate IMX500 AI, mesh radio, basic dashboard | Mini v1 |
| **M3** | Add VTOL motors, first flight test (hover) | Mini v1.5 |
| **M4** | Leg folding mechanism prototype, 10+ iterations | Mini v2 |
| **M5** | Terrain-hop testing, rubble traversal validation | Mini v2 |
| **M6** | Foam dart marker config, human-in-the-loop testing | Mini v2.5 |
| **M7** | Full C2 dashboard with real robot integration | Software v1 |
| **M8** | Field testing with operators, feedback iteration | Mini v3 + Software v2 |
| **M9** | Start SCOUT-Elite design (CF frame, bigger motors) | Elite design |
| **M10** | Elite prototype build, heavy payload testing | Elite v1 |
| **M11** | Pilot program with defense partner (Baltic states / NATO) | Pilot |
| **M12** | Production readiness, Series A fundraising | Production |

---

## 8. KEY NUMBERS TO MEMORIZE

| Number | Context |
|--------|---------|
| **4.5%** | Daily casualty rate in urban warfare (Dstl UK, 145 battles) |
| **50-60M km** | Fiber-optic cable consumed in Ukraine/Russia war (2025) |
| **50,000/month** | Russia's fiber-optic FPV drone production |
| **$552** | SCOUT-Mini BOM cost |
| **5.01:1** | SCOUT-Mini thrust-to-weight ratio |
| **1.32kg** | SCOUT-Mini weight (fits in backpack) |
| **$657** | Original ARES-4 PiCrawler BOM |
| **$74,500** | Boston Dynamics Spot (113× more expensive) |
| **$150,000** | Ghost Robotics Vision 60 |
| **13 TOPS** | Raspberry Pi 5 + Hailo-8L AI performance |
| **30 FPS** | IMX500 on-chip inference rate |
| **5.85W** | IMX500 total power consumption |
| **91.2%** | AI target recognition accuracy (cannot reliably distinguish civilian) |
| **60%** | Cost reduction from 3D printing (Leptron case study) |
| **200** | Design iterations possible with 3D printing |

---

## 9. FILE INDEX (All Documents Produced)

| Document | Purpose | Key Content |
|----------|---------|-------------|
| `SCOUT_Feature_Inventory_For_PM_Agent.md` | Feature inventory for pitch deck | All screens, admin dashboard spec, backlog |
| `SCOUT_Pitch_Rebuttal_War_Chest.md` | Judge feedback response | 4 judge challenges answered with validated data |
| `ARES4_Unified_Engineering_Feasibility.md` | Original engineering analysis | Weight budgets, thrust calculations, BOM |
| `threejs_tactical_map_guide.md` | 3D map implementation guide | Code for making SE3 point clouds readable |
| `tactical_map_demo.html` | Working dashboard demo | Complete HTML file with Three.js map |
| `SCOUT_Master_Project_Overview.md` | **This document** | Complete project overview, all versions, roadmap |
| `SCOUT_Technical_Specifications.md` | Engineering deep-dive | All numbers, calculations, motor specs |
| `SCOUT_Market_Research.md` | Battlefield validation | Ukraine/Russia data, competitor analysis |
| `SCOUT_Pitch_Narrative.md` | Demo script and flow | 3-minute pitch, slide structure, delivery notes |

---

*Document compiled from 15+ hours of research across 50+ sources. All engineering numbers validated against manufacturer specifications. All battlefield data sourced from peer-reviewed publications and defense industry reports.*
