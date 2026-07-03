# SCOUT C2 — Complete Feature Inventory & Admin Dashboard Spec
**For PM Agent — Pitch Deck Preparation | EDTH Munich 2026**
*Date: June 27, 2026 | Event: June 28 Pitch Day*

---

## 1. EXECUTIVE SUMMARY

SCOUT C2 is a tactical command-and-control platform for multi-agent quadruped robotics in high-risk interior operations. Two product variants exist under the same codebase: **SCOUT Clearing** (interior building-clearing, currently built and demo-ready) and **SCOUT Tactical C-UAS** (outdoor counter-drone, concept stage). The system provides a shared virtual battlefield where one operation manager commands multiple ARES-4 robots and coordinates with field operators via a unified map state. The admin/command dashboard — the pitch centerpiece — is the critical missing piece and must be completed before tomorrow's presentation.

| Attribute | Value |
|-----------|-------|
| **Product Name** | SCOUT C2 |
| **Current Variant** | SCOUT Clearing (interior ops) |
| **Hardware** | ARES-4 Q-UGV on Raspberry Pi 5 + Sony IMX500 |
| **Comms** | Mesh network (no cloud dependency) |
| **AI** | On-device inference via IMX500 (30 FPS, zero CPU load) |
| **3D Engine** | Three.js browser-based tactical map |
| **Server** | Flask telemetry server (port 5050) |
| **Backend Status** | Flask server operational (`/api/state`, `/api/command`, `/video_feed`) |
| **Mobile App Status** | SCOUT Clearing built — 3 payload modes, live video, mode-aware UI |
| **Admin Dashboard Status** | **NOT YET BUILT — CRITICAL GAP** |
| **Pitch Deck Deadline** | June 28, 2026 (tomorrow) |

---

## 2. PRODUCT ARCHITECTURE

The SCOUT C2 platform follows a hub-and-spoke architecture with the operation manager at the center. All participants — robots, field operators, and the command station — share a single source of truth: the **Map State**. This shared context is what differentiates SCOUT from conventional "remote control" robot systems. Every entity that enters the environment changes the state, and all other participants see that change in real time.

The architecture has four layers. At the bottom, the **Hardware Layer** consists of 1-5 ARES-4 quadruped robots, each running Raspberry Pi 5 with Sony IMX500 AI camera and mesh radio. The IMX500 performs all neural inference on-chip at 30 frames per second with a total power draw of 5.85W, meaning the Pi 5 CPU remains available for locomotion control and telemetry. Above that sits the **Communication Layer**, a peer-to-peer mesh network that links operators and robots without any cloud or internet dependency — essential for contested environments where infrastructure may be destroyed or denied. The **Application Layer** contains three components: the Flask telemetry server (port 5050) that aggregates all robot state and serves API endpoints; the SCOUT Clearing field operator mobile app for Android/iOS; and the admin/command dashboard (browser-based) for the operation manager. At the top, the **Shared State Layer** maintains the Map State, Building States, Location States, and Fleet Status as a unified data model that all clients subscribe to via WebSocket or SSE.

---

## 3. BUILT: SCOUT CLEARING — FIELD OPERATOR APP

The SCOUT Clearing mobile application is the primary interface for soldiers and field operators. It is already built and functional. The app connects to the Flask telemetry server, receives live video feeds from robots, displays mode-appropriate controls and information, and receives route commands and signals pushed from the admin dashboard.

### 3.1 Screen Inventory (Built)

| Screen | Status | Description |
|--------|--------|-------------|
| **Live Feed (Main)** | Built | Primary screen showing live robot camera feed. Displays current payload mode, robot health/telemetry overlay, and quick-action buttons. |
| **Mode Selection Drawer** | Built | Slide-up drawer for switching between Recon, Rescue, and Eliminate payload modes. Mode change triggers robot hardware reconfiguration (camera settings, movement speed, scan patterns). |
| **Recon Detail View** | Built | Mode-specific overlay for Recon operations. Shows change-detection alerts, room/area scan status, coverage map overlay on video feed, and "Mark Cleared" button. |
| **Rescue Detail View** | Built | Mode-specific overlay for Rescue operations. Shows detected civilian locations (from AI classification), triage priority tags, medevac route status, and "Confirm Recovery" button. |
| **Eliminate Detail View** | Built | Mode-specific overlay for Eliminate operations. Shows threat classification confidence, positive-ID checklist (3/3 required), ARMED/DISARMED status, press-and-hold-to-confirm lethal gating, and operator-ID logging. RESTRICTED mode — requires explicit authorization. |
| **Route Command View** | Built | Displays route commands and signals pushed from admin dashboard. Shows waypoint list, estimated arrival times, and acknowledgement buttons. |
| **Settings / Connection** | Built | Server IP configuration, mesh network status, operator ID registration, and app preferences. |

### 3.2 Feature Detail: Three Operational Modes

The SCOUT Clearing app is organized around three payload modes that correspond to the phases of a building-clearing operation. Each mode reconfigures both the robot's behavior and the UI presented to the operator.

**RECON Mode** is the default entry state for any new area. In this mode, the ARES-4 robot performs systematic room and corridor scanning using the IMX500's on-chip neural network for change detection. The algorithm compares current camera frames against a learned baseline and flags any new objects, moved furniture, open doors that were closed, or visual anomalies. The field operator sees these alerts as bounding boxes overlaid on the live video feed, with a confidence score and classification label (e.g., "Unknown Object — 87%", "Door State Changed — 94%"). The operator can tap any alert to zoom the camera or request a closer scan. As areas are confirmed clear, the operator marks them via the "Mark Cleared" button, which updates the shared Map State and turns that room green on the admin dashboard's tactical map. Recon mode uses the **Standard Patrol & Overwatch** robot configuration (ARES-4 Variant Alpha), optimized for quiet movement and wide-angle observation.

**RESCUE Mode** activates when civilians are detected or when the mission objective includes casualty evacuation. The IMX500 switches to a person-detection and classification model that can identify prone bodies, distinguish between military and civilian clothing patterns, and assess accessibility (e.g., "person behind debris — requires clearing"). Detected civilians appear on the operator's screen with triage priority tags (P1 Critical, P2 Urgent, P3 Routine) based on visual cues like motion, posture, and visible injuries. The operator can tap a detected civilian to initiate a medevac route request, which is sent to the admin dashboard for approval and coordination. Rescue mode uses either the **Standard Patrol** configuration or the **Medevac & Civilian Recovery** variant (ARES-4 Variant Beta), which carries a compact medical supply pod and can tow a stretcher sled.

**ELIMINATE Mode** is the most restricted and carefully gated operational state. It is only available when the robot's AI classifies a detected figure as armed and hostile with high confidence (>90%), and only after explicit authorization from the admin dashboard. The field operator cannot independently activate Eliminate mode. Once authorized, the UI enforces a **positive-ID checklist** requiring three independent confirmations: visual confirmation of weapon (1/3), hostile posture or action (2/3), and no civilian bystanders in line of fire (3/3). Only when all three boxes are checked does the ARM button become active. Pressing ARM changes the robot's status to armed and enables the final firing mechanism. The actual engagement requires a **press-and-hold-to-confirm** gesture (3-second hold) to prevent accidental activation. Every action in Eliminate mode is logged with the operator's ID, timestamp, and GPS coordinates. Eliminate mode uses the **Assault & Breaching** configuration (ARES-4 Variant Gamma), equipped with a non-lethal deterrent launcher (paintball/concussion rounds for demo purposes) and tactical flashlight.

### 3.3 Technical Implementation (Built)

| Component | Technology | Status |
|-----------|-----------|--------|
| **Mobile Framework** | React Native / Flutter (confirm with dev) | Built |
| **Video Streaming** | H.264 over WebRTC or MJPEG over HTTP (`/video_feed`) | Built |
| **State Sync** | REST polling to `/api/state` or WebSocket | Built |
| **Command Uplink** | POST to `/api/command` | Built |
| **Payload Mode Switching** | Hardware API call to robot controller | Built |
| **AI Overlay** | Bounding boxes from IMX500 inference output | Built |
| **Route Display** | Waypoint list with map tile background | Built |
| **Lethal Gating UI** | Three-checklist + ARM + press-and-hold flow | Built |

---

## 4. NOT YET BUILT: ADMIN / COMMAND DASHBOARD

The admin/command dashboard is the **centerpiece of the pitch** and the single most important missing component. It is the screen the judges will see projected during the demo. It must communicate the full vision of SCOUT C2: one operation manager with god's-eye view of the entire tactical environment, commanding robots and coordinating human operators through a shared, stateful map.

### 4.1 Core Concept

The admin dashboard answers one question: **"What is the state of everything right now?"** It is not a video feed viewer — the field operators already have that. It is a **tactical information dominance** interface that aggregates all data from all sources, computes situational awareness, and enables the operation manager to make decisions and issue commands that propagate to every participant in the shared environment.

The key insight that makes this "next level" is that **the map has state**. Every building, every room, every corridor, every point of interest has a state that evolves as robots explore, operators confirm, and events occur. The admin dashboard is the only place where this full state is visible and editable.

### 4.2 Screen Specification: Admin Dashboard

The admin dashboard is a single-page application with multiple collapsible panels arranged around a central 3D tactical map. The layout is designed for a large monitor (1920x1080 minimum, ideally 2560x1440) and projects well for demos.

| Panel | Position | Purpose | Status |
|-------|----------|---------|--------|
| **3D Tactical Map** | Center (60% width, full height) | Three.js-rendered environment. Shows all robots, operators, buildings, coverage zones, waypoints, and active routes. Buildings change color based on state. | **NOT BUILT** |
| **Fleet Status Panel** | Left sidebar (20% width) | Live list of all ARES-4 robots with health, battery, payload mode, current action, and signal strength. Click to focus camera on robot. | **NOT BUILT** |
| **Operator Roster Panel** | Left sidebar (below Fleet) | List of field operators with position, status, assigned robot, and last check-in time. | **NOT BUILT** |
| **Mission Control Panel** | Right sidebar (20% width) | Mission timer, phase indicator (Recon → Rescue → Eliminate), objective list, and global commands (ALL STOP, RTB, EMERGENCY). | **NOT BUILT** |
| **Building State Panel** | Right sidebar (below Mission) | Hierarchical list of all buildings/rooms with their current state (Unknown / In Progress / Cleared / Contaminated / Evacuated). Click to inspect details or assign robot. | **NOT BUILT** |
| **Command Console** | Bottom bar (full width, 120px) | Text input and quick-command buttons for issuing route commands, signals, and directives to operators. Shows command history and delivery status. | **NOT BUILT** |
| **Alert Feed** | Floating top-right overlay | Real-time alerts: robot anomalies, AI detections, operator requests, system warnings. Auto-dismiss or pin for action. | **NOT BUILT** |
| **Live Video Pop-out** | Floating (draggable) | Optional pop-out video feeds from any robot camera, for when the operation manager wants to see what a specific robot sees. | **NOT BUILT** |

### 4.3 3D Tactical Map — Detailed Specification

The 3D tactical map is the visual centerpiece. It must be built in Three.js and render in the browser. For the pitch demo, it will display a procedural village or building complex (self-generated, not real SE3 data).

**Map State Visualization:**

| State | Color Code | Meaning | Trigger |
|-------|-----------|---------|---------|
| **Unknown** | Dark Gray (#3A3A3A) | Area not yet entered by any robot | Default state |
| **In Progress** | Amber (#FF9F0A) | Robot currently scanning or operator investigating | Robot enters area |
| **Cleared** | Green (#32D74B) | Area confirmed clear via Recon mode | Operator taps "Mark Cleared" |
| **Contaminated** | Red (#FF453A) | Hostile detected or hazard identified | AI classification = hostile / hazard |
| **Evacuated** | Blue (#0A84FF) | Civilians recovered, area secured for medevac | Operator confirms rescue |
| **Restricted** | Purple (#BF5AF2) | Eliminate mode authorized, armed engagement possible | Admin authorizes lethal |
| **Waypoint** | Cyan (#5AC8FA) | Route command waypoint | Admin issues route command |
| **Operator Position** | Orange Dot (#FF9500) | Field operator GPS location | Phone GPS broadcast |

**3D Map Elements:**

| Element | Visual Style | Interaction |
|---------|-------------|-------------|
| **Buildings** | Low-poly extruded footprints, color-coded by state. Slight transparency (80% opacity) to see interior. | Hover for building name and state summary. Click to open Building State Panel. |
| **Robots** | ARES-4 3D model icon (simplified, color-coded by variant). Animated when moving. | Click to select, follow camera, or open control menu. Shows health ring (green/yellow/red). |
| **Operators** | Soldier figure icon with name tag and orientation arrow. | Click to send direct message or assign route. |
| **Coverage Zones** | Semi-transparent green domes/areas showing explored regions. Expand as Recon progresses. | Visual only — shows operational progress. |
| **Routes** | Dashed cyan lines with animated marching-ants effect. Waypoints as numbered cyan spheres. | Click waypoint to edit or delete. Drag to reposition. |
| **FOV Cones** | Semi-transparent triangular cones extending from robot cameras, showing what each robot can see. | Toggle on/off. Visual only. |
| **Alert Markers** | Pulsing red/yellow icons at location of detection. Auto-fade after 30 seconds unless pinned. | Click to zoom camera and show alert details. |

**Camera Controls:**
- **Orbit**: Mouse drag to rotate around focus point
- **Pan**: Right-click drag or middle-click drag
- **Zoom**: Scroll wheel
- **Focus**: Double-click any entity (robot, building, operator) to center camera
- **Views**: Preset buttons — "Overview", "Ground Level", "Top-Down", "Follow [Selected Robot]"

### 4.4 Fleet Status Panel — Detailed Specification

The Fleet Status Panel provides at-a-glance awareness of all robot assets. It is a scrollable list on the left side of the dashboard.

| Field | Display | Example |
|-------|---------|---------|
| **Robot ID** | ARES-4-Alpha, ARES-4-Beta, etc. | ARES-4-Alpha |
| **Variant Icon** | Small icon representing payload config | Shield (Patrol), Cross (Medevac), Target (Assault), Drone (Carrier), Ghost (Stealth) |
| **Status Indicator** | Colored dot + text | Green dot "ACTIVE", Amber dot "SCANNING", Red dot "CRITICAL" |
| **Battery** | Percentage + mini bar | "78%" with green bar |
| **Signal** | RSSI bars | 4/5 bars |
| **Payload Mode** | Current mode badge | "RECON", "RESCUE", "ELIMINATE" |
| **Current Action** | One-line description | "Scanning Room 302" |
| **Health** | Mini progress bars for: locomotion, camera, comms, battery | 4 mini bars |
| **Quick Actions** | Mini buttons: "Focus Camera", "RTB", "Call Operator" | Icon buttons |

Each robot card expands on click to show detailed telemetry: CPU temperature, IMX500 inference FPS, last command received, error log, and manual override controls (stop, rotate, return to base).

### 4.5 Building State Panel — Detailed Specification

The Building State Panel shows a hierarchical tree of all structures in the environment. This is where the "stateful map" concept becomes tangible.

```
Building A (Office Block)
├── Floor 1 — CLEARED [green]
│   ├── Lobby — CLEARED
│   ├── Corridor West — CLEARED
│   └── Storage Room — CLEARED
├── Floor 2 — IN PROGRESS [amber]
│   ├── Office 201 — CLEARED
│   ├── Office 202 — IN PROGRESS (ARES-4-Alpha scanning)
│   └── Corridor East — UNKNOWN
└── Floor 3 — UNKNOWN [gray]
    └── [all rooms unknown]

Building B (Warehouse) — CONTAMINATED [red]
├── Main Floor — CONTAMINATED (hostile detected, 94% conf)
└── Office — EVACUATED [blue]
```

Each node shows:
- State color indicator
- Room/area name
- State label
- Active robot (if any)
- Time since last update

Clicking any node opens a detail drawer showing: full history of state changes, list of detections/observations, assigned operators, and action buttons ("Assign Robot", "Mark Cleared", "Flag for Review").

### 4.6 Command Console — Detailed Specification

The Command Console is the operation manager's tool for influencing the battlefield. Commands issued here appear instantly on field operators' phones.

| Command Type | Description | Operator UI Effect |
|--------------|-------------|-------------------|
| **Route Command** | Click on map to drop waypoints, assign to operator or robot. | Operator sees waypoint list with ETA and "Acknowledge" button. |
| **Signal / Directive** | Pre-defined or custom text message broadcast to all or selected operators. | Push notification + in-app alert banner. |
| **Mode Override** | Force a robot to switch payload mode (e.g., RECON → RESCUE). | Operator notified of mode change, UI updates. |
| **ALL STOP** | Emergency halt all robots and operators. | Immediate full-screen alert on all devices. |
| **RTB** | Return all robots to base position. | Robots autonomously navigate to base. |
| **AUTHORIZE LETHAL** | Enable Eliminate mode for specified robot/area. | RESTRICTED badge removed for that operator. |
| **Request Report** | Ask operator for status update from current position. | Operator receives prompt, taps to send auto-report. |

Command history is logged with timestamp, issuer ID, recipients, and delivery confirmation status. Undelivered commands (e.g., operator out of mesh range) show as pending with retry indicator.

---

## 5. ARES-4 ROBOT VARIANTS — INVENTORY & UI MAPPING

The ARES-4 platform has five specialized payload configurations. Three are currently mapped to SCOUT Clearing's operational modes; two are advanced variants for future/demo scenarios.

### 5.1 Variant Inventory

| Variant | Codename | Role | Physical Differentiator | SCOUT Clearing Mode | Dashboard Icon |
|---------|----------|------|------------------------|---------------------|----------------|
| **Alpha** | Sentinel | Standard Patrol & Overwatch | Wide-angle camera mast, LED status ring | RECON (primary) | Shield |
| **Beta** | Guardian | Medevac & Civilian Recovery | Medical supply pod, stretcher tow hitch | RESCUE (primary) | Cross/Medical |
| **Gamma** | Raider | Assault & Breaching | Non-lethal launcher mount, tactical flashlight | ELIMINATE (primary) | Target/Bullseye |
| **Delta** | Eye-in-Sky | Drone Carrier / Airborne Recon | Quadcopter docking bay on back | Multi-mode (air recon) | Drone/Quadcopter |
| **Epsilon** | Unit-47 | Stealth Infiltrator | Matte black coating, noise-dampened joints, thermal suppressors | Special operations | Ghost/Skull |

### 5.2 Variant Detail Cards

**ARES-4-Alpha "Sentinel" — Standard Patrol & Overwatch**
The Alpha configuration is the general-purpose workhorse of the ARES-4 fleet. It carries the standard Sony IMX500 camera on a retractable mast that can elevate to 1.2 meters for improved vantage points. The LED status ring around the camera housing provides visual feedback to nearby operators (green = clear, amber = scanning, red = threat detected, blue = comms mode). Alpha is optimized for quiet locomotion with dampened foot pads that reduce acoustic signature on hard surfaces. In the admin dashboard, Alpha appears with a shield icon and is the default assignment for RECON operations. Battery life is approximately 90 minutes of active scanning.

**ARES-4-Beta "Guardian" — Medevac & Civilian Recovery**
The Beta configuration is designed for humanitarian and medical scenarios. It replaces the standard camera mast with a compact medical supply pod containing: tourniquets, chest seals, pressure bandages, and a compact AED. The rear chassis includes a tow hitch for a collapsible stretcher sled that can transport a casualty at walking speed (5 km/h). The IMX500 runs a specialized person-detection model trained on prone body postures and can distinguish between military uniform patterns and civilian clothing with 91% accuracy. Beta is the primary RESCUE mode robot. In the dashboard, it appears with a cross/medical icon. Battery life is reduced to 70 minutes due to the additional payload weight.

**ARES-4-Gamma "Raider" — Assault & Breaching**
The Gamma configuration is the most heavily modified variant, designed for high-risk entry and threat engagement. It mounts a non-lethal deterrent system (for demo/hackathon purposes: a paintball launcher with concussion rounds; in production: pepper-ball or similar less-lethal system) on a servo-stabilized turret. A high-intensity tactical flashlight with strobe capability aids in room entry. The chassis is reinforced with Kevlar-composite panels rated for small-arms protection. The IMX500 runs a threat-detection model that classifies figures as "civilian", "friendly military", or "hostile" based on posture, equipment detection, and movement patterns. Gamma is the only variant authorized for ELIMINATE mode. Dashboard icon is a target/bullseye. Battery life is 60 minutes due to power-hungry turret servos.

**ARES-4-Delta "Eye-in-Sky" — Drone Carrier / Airborne Recon**
The Delta configuration adds a quadcopter docking bay to the ARES-4 chassis. The docked drone ("Falcon-1") can launch autonomously, survey upper floors or roof areas, and return to dock for recharging. The drone carries a secondary IMX500 module for aerial reconnaissance and can relay mesh network signals to extend range. This variant enables true 3D reconnaissance — ground robot clears lower floors while drone checks upper levels simultaneously. In the dashboard, Delta appears with a drone icon and shows both ground unit and airborne unit status. Battery life is 80 minutes ground + 15 minutes per drone flight.

**ARES-4-Epsilon "Unit-47" — Stealth Infiltrator**
The Epsilon configuration is a special-operations variant designed for covert reconnaissance in hostile environments. It features matte-black non-reflective coating, noise-dampened joints that reduce operational sound by 60%, and thermal suppressors that reduce infrared signature. The IMX500 is fitted with a night-vision enhanced sensor module capable of operating in near-total darkness (0.001 lux). Epsilon does not appear on the standard fleet panel unless explicitly authorized — it can be "uncloaked" by the admin for mission coordination. Dashboard icon is a ghost/skull symbol. Battery life is 100 minutes due to efficient stealth-optimized locomotion.

### 5.3 Mode-to-Variant Mapping

| SCOUT Clearing Mode | Primary Variant | Secondary Variant | Trigger Condition |
|--------------------|-----------------|-------------------|-------------------|
| RECON | ARES-4-Alpha (Sentinel) | ARES-4-Epsilon (Unit-47) for night ops | Default on area entry |
| RESCUE | ARES-4-Beta (Guardian) | ARES-4-Alpha for escort | Civilian detected or medevac request |
| ELIMINATE | ARES-4-Gamma (Raider) | None — requires explicit authorization | Hostile classification + admin approval |
| AIR RECON | ARES-4-Delta (Eye-in-Sky) | — | Multi-floor building or roof check needed |

---

## 6. SHARED STATE ARCHITECTURE

The shared state is the technical foundation that makes SCOUT C2 work. All clients — robots, operator phones, admin dashboard — maintain a synchronized copy of this state via the Flask server's `/api/state` endpoint (polled or pushed via WebSocket).

### 6.1 State Hierarchy

```
MAP STATE (root)
├── environment
│   ├── buildings[]              # Array of building objects
│   │   ├── id, name, position   # 3D coordinates, footprint polygon
│   │   ├── floors[]             # Sub-areas
│   │   │   ├── id, name, polygon
│   │   │   ├── state            # UNKNOWN / IN_PROGRESS / CLEARED / CONTAMINATED / EVACUATED
│   │   │   ├── lastUpdated      # ISO timestamp
│   │   │   ├── assignedRobot    # robot ID or null
│   │   │   └── history[]        # State change log
│   │   └── overallState         # Aggregated from floors
│   ├── roads[]                  # Navigable paths
│   └── points_of_interest[]     # Entry points, rally points, hazards
├── fleet
│   ├── robots[]
│   │   ├── id, name, variant    # ARES-4 variant code
│   │   ├── position {x,y,z}     # 3D world coordinates
│   │   ├── orientation          # Yaw, pitch, roll
│   │   ├── health {locomotion, camera, comms, battery}
│   │   ├── batteryPercent
│   │   ├── payloadMode          # RECON / RESCUE / ELIMINATE / IDLE
│   │   ├── currentAction        # "Scanning Room 302", "Moving to waypoint", etc.
│   │   ├── signalStrength       # RSSI dBm
│   │   ├── imuData              # Accelerometer, gyroscope
│   │   ├── cameraStreamUrl      # /video_feed endpoint
│   │   ├── aiDetections[]       # Current frame detections
│   │   └── lastTelemetry        # ISO timestamp
│   └── operators[]
│       ├── id, name, callsign
│       ├── position {x,y}       # GPS coordinates
│       ├── status               # ACTIVE / STANDBY / ASSISTANCE / OFFLINE
│       ├── assignedRobot        # robot ID or null
│       ├── lastCheckIn
│       └── pendingCommands[]    # Commands awaiting acknowledgment
├── mission
│   ├── phase                    # RECON / RESCUE / ELIMINATE / COMPLETE
│   ├── startTime
│   ├── objectives[]
│   │   ├── description, completed, assignedTo
│   └── globalStatus             # ACTIVE / PAUSED / EMERGENCY
├── commands
│   ├── active[]                 # Currently executing commands
│   ├── pending[]                # Awaiting acknowledgment
│   └── history[]                # Completed/cancelled
└── alerts
    ├── active[]                 # Unresolved alerts
    └── history[]                # Resolved alerts
```

### 6.2 State Update Flow

State changes propagate through the system in real time. When a robot enters a new room, its onboard system sends a position update to the Flask server via the mesh network. The server updates the `fleet.robots[].position` field and checks if the robot has crossed into a new building zone. If so, the corresponding `environment.buildings[].floors[].state` changes from UNKNOWN to IN_PROGRESS. The server then broadcasts the updated state to all connected clients. The admin dashboard's 3D map immediately reflects this by changing the room color from gray to amber. Simultaneously, the field operator's app receives the state update and sees their position marker move on the tactical overlay. When the operator marks the room as cleared, the app sends a command to `/api/command` with type `"MARK_CLEARED"` and the room ID. The server validates the command (checks that the robot is actually in that room and that the operator is authorized), updates the state to CLEARED, and broadcasts the change. The admin dashboard sees the room turn green, the Building State Panel updates, and the coverage statistics recalculate.

This shared state model means that every participant always sees a consistent, current picture of the environment. There is no "my data vs your data" — there is only THE data, and everyone shares it. This is what enables true tactical coordination: the admin can issue a route command to an operator because they both see the same map state and know which areas are clear, which are contaminated, and where the robots are.

---

## 7. PRE-PITCH BACKLOG — PRIORITIZED

The following tasks remain to be completed before the pitch demo tomorrow (June 28). They are ordered by priority and estimated effort.

### 7.1 P0 — Must Have (Pitch Will Fail Without These)

| # | Task | Effort | Owner | Notes |
|---|------|--------|-------|-------|
| 1 | **Admin Dashboard Shell** — Basic HTML/CSS/JS layout with left panel, center map area, right panel, bottom command bar | 2 hrs | Frontend | React or vanilla JS + Three.js |
| 2 | **3D Map Renderer** — Three.js scene with procedural building geometry, basic lighting, orbit controls | 4 hrs | 3D / Frontend | Use demo village GLB or generate boxes |
| 3 | **State Mock Data** — Create realistic mock state JSON for 3 robots, 2 operators, 1 building with 3 floors | 1 hr | Backend / Data | Hard-coded for demo |
| 4 | **Fleet Status Panel UI** — Scrollable list with robot cards showing health, battery, mode, quick actions | 2 hrs | Frontend | Static HTML with mock data |
| 5 | **Building State Panel UI** — Tree view of building/floors with color-coded state indicators | 2 hrs | Frontend | Collapsible tree component |
| 6 | **Map State Visualization** — Buildings change color based on state (Unknown=gray, Cleared=green, etc.) | 2 hrs | 3D / Frontend | Material color update on state change |
| 7 | **Command Console UI** — Bottom bar with text input, quick command buttons, command history | 1.5 hrs | Frontend | Send POST to `/api/command` |
| 8 | **Alert Feed Overlay** — Floating panel showing real-time mock alerts | 1 hr | Frontend | Auto-dismiss after timeout |
| 9 | **Robot 3D Icons** — Simple 3D models or icons representing each ARES-4 variant on the map | 2 hrs | 3D | Use colored boxes or basic shapes |
| 10 | **Route Drawing** — Click on map to create waypoints, draw dashed line route | 2 hrs | 3D / Frontend | Raycaster for click-to-position |

**P0 Total Estimate: 19.5 hours → Recommend 2-3 developers working in parallel, focus on items 1-6 as minimum viable dashboard.**

### 7.2 P1 — Should Have (Significantly Impresses Judges)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 11 | **Live State Sync** — Wire dashboard to Flask `/api/state` endpoint for real robot data | 2 hrs | Shows it's real, not mocked |
| 12 | **FOV Cones** — Visual cones showing each robot's camera field of view | 1.5 hrs | Dramatic visual effect |
| 13 | **Coverage Zone Visualization** — Semi-transparent green areas showing explored territory | 2 hrs | Shows operational progress |
| 14 | **Operator Position Icons** — Show field operators on 3D map with orientation | 1 hr | Completes the picture |
| 15 | **Video Pop-out** — Click robot to open floating video feed window | 2 hrs | Proves live video integration |
| 16 | **Animated Robot Movement** — Smooth interpolation of robot positions on map | 1.5 hrs | Polish, feels alive |
| 17 | **Mission Timer & Phase Indicator** — Show elapsed time and current operational phase | 1 hr | Professional touch |

### 7.3 P2 — Nice to Have (Polish Points)

| # | Task | Effort |
|------|------|--------|
| 18 | **Dark/light theme toggle** | 1 hr |
| 19 | **Fullscreen mode** | 0.5 hr |
| 20 | **Screenshot/export** | 1 hr |
| 21 | **Sound effects for alerts** | 1 hr |
| 22 | **Keyboard shortcuts** | 1 hr |
| 23 | **Mobile-responsive admin (tablet support)** | 3 hrs |

### 7.4 Recommended Pitch-Day Scope

Given that today is June 27 and the pitch is tomorrow (June 28), the realistic target is **P0 items 1-8 plus P1 items 11 and 14**. This gives a functional dashboard with:
- 3D map with state-colored buildings
- Fleet status panel showing 3 robots
- Building state tree
- Command console
- Alert feed
- Real (or realistic mock) robot positions
- Field operator positions

This is enough to tell the story: "Here's the operation manager. They see all three robots, they see the building being cleared floor by floor, they can issue commands that appear on operators' phones. The map has state. Everyone shares the same context."

---

## 8. INTEGRATION CHECKLIST

The following integration points must be verified before the pitch to ensure all components work together as a unified system.

| Integration | Components | Verification |
|-------------|-----------|-------------|
| **Robot → Server** | ARES-4 sends telemetry to Flask `/api/state` | Check: Position, health, AI detections appear in API response |
| **Server → Dashboard** | Dashboard polls/receives state from server | Check: Robot positions update on 3D map in real time |
| **Server → Operator App** | App receives state and video feed | Check: Live video displays, telemetry overlay updates |
| **Dashboard → Server** | Admin issues command via `/api/command` | Check: Command accepted, state updates, logged |
| **Server → Operator App** | Command forwarded to operator's phone | Check: Route command appears on app with acknowledge button |
| **Operator App → Server** | Operator marks area cleared or confirms action | Check: State change propagates to dashboard, building color updates |
| **IMX500 → Robot → Server** | AI camera detects object, sends detection | Check: Alert appears on dashboard alert feed with bounding box |
| **Mesh Network** | All comms via mesh (no internet) | Check: Disconnect Wi-Fi router, verify local mesh still functions |

---

## 9. PITCH DEMO FLOW (3 Minutes)

The following script should be used for the 3-minute pitch demo, leveraging the admin dashboard as the primary visual.

| Time | Action | Visual | Narrative |
|------|--------|--------|-----------|
| 0:00 | **Opening shot** | Full admin dashboard on projector | "This is SCOUT C2. One operation manager. Full situational awareness." |
| 0:05 | **Zoom to 3D map** | 3D building complex, gray (unknown) | "We're clearing this three-floor office building. Nothing is known." |
| 0:10 | **Show fleet panel** | Three robots: Alpha, Beta, Gamma | "Three ARES-4 robots — Recon, Rescue, Assault — entering the structure." |
| 0:15 | **Robot enters building** | Map shows robot icon moving into building | "Alpha enters. The map updates in real time. Room 101 is now in progress." |
| 0:20 | **Room state changes** | Room 101 turns amber → green | "Operator confirms clear. The state propagates to everyone instantly." |
| 0:25 | **AI detection alert** | Red alert pops: "Unknown object detected" | "Alpha's AI camera spots something. Alert fires on the dashboard." |
| 0:30 | **Switch to Rescue** | Beta robot highlighted, mode changes | "Switching to Rescue mode. Beta moves to investigate." |
| 0:35 | **Civilian detected** | Blue marker appears, alert: "Civilian detected" | "Civilian found. Location shared with all operators. Medevac route assigned." |
| 0:40 | **Issue route command** | Admin clicks map, waypoints appear, route draws | "Operation manager issues route command. Appears on operator's phone live." |
| 0:45 | **Show operator phone** | Split screen: dashboard + phone showing route | "Same context. Shared state. No radio confusion." |
| 0:50 | **Eliminate mode authorization** | Gamma highlighted, RESTRICTED badge | "Hostile detected. Eliminate mode requires admin authorization." |
| 0:55 | **Checklist flow** | Three-checklist UI shown | "Positive ID checklist. Three confirmations required." |
| 1:00 | **Lethal gating** | ARM button, press-and-hold | "ARM. Press and hold to confirm. Every action logged." |
| 1:05 | **Coverage progress** | Green zones expand across building floors | "Floor 1 cleared. Floor 2 in progress. Full operational picture." |
| 1:10 | **Building state panel** | Tree view showing floor-by-floor status | "Every room has a state. Every state is shared." |
| 1:15 | **Alert feed** | Multiple alerts scrolling | "All detections, all commands, all changes — one feed." |
| 1:20 | **RTB command** | Admin clicks RTB, all robots route to base | "Mission complete. RTB. All robots return autonomously." |
| 1:25 | **Closing shot** | Full dashboard, mission timer stops | "SCOUT C2. The map has state. Your team has context." |
| 1:30 | **Team slide** | Team photo, contact info | "Team SCOUT. EDTH Munich 2026." |

---

## 10. TECHNOLOGY STACK SUMMARY

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Robot OS** | Raspberry Pi OS / Ubuntu | ARES-4 onboard computer |
| **AI Inference** | Sony IMX500 + AITRIOS Brain Builder | On-chip neural network at 30 FPS |
| **Robot Control** | Python + GPIO / I2C / SPI | Locomotion, sensor integration, payload actuators |
| **Communication** | Meshtastic / custom mesh (LoRa + Wi-Fi) | Peer-to-peer mesh between all nodes |
| **Telemetry Server** | Flask (Python) | State aggregation, API endpoints, video proxy |
| **Database** | SQLite / in-memory (pitch demo) | State persistence, command logging |
| **3D Map Engine** | Three.js | Browser-based 3D tactical visualization |
| **Admin Dashboard** | React / Vanilla JS + Three.js | Operation manager command interface |
| **Operator App** | React Native / Flutter | Field operator mobile interface |
| **Video Streaming** | H.264 / WebRTC / MJPEG | Live camera feed from robots |
| **State Sync** | REST API + Server-Sent Events | Real-time state distribution |

---

## 11. FILE INDEX FOR PM AGENT

The following documents have been produced to support this project and are available in the project repository:

| Document | Purpose | Key Content |
|----------|---------|-------------|
| `EDTH_Munich_2026_Hackathon_Winning_Playbook.md` | Event strategy | Market data, past winner analysis, judging criteria, pitch framework |
| `BATTLE_TESTED_PLAN.md` | Technical architecture | Comms strategy, use cases, pitch psychology |
| `C2_TACTICAL_COMMAND_SYSTEM.md` | System design | 7-screen storyboard, cinematic video script, admin panel concept |
| `DESIGN_SYSTEM_AND_SCREENS.md` | Visual design | Hex colors, fonts, spacing, 7 screen pixel-level specs |
| `SE3_INTEGRATED_EPIC_DEMO_PLAN.md` | Demo planning | 5-agent squad concept, SE3 integration strategy |
| `AI_CAMERA_GAME_CHANGER.md` | Hardware deep-dive | Sony IMX500 specifications, AITRIOS platform, power analysis |
| `3D_DEMO_RESEARCH_BRIEF.md` | 3D technical guide | Three.js integration, PLY loading, FOV cones, performance |
| `MILITARY_GRADE_SIMULATION_BRIEF.md` | Simulation architecture | 4-layer tactical simulator design |
| `SE3_REAL_DATA_GUIDE.md` | Data pipeline | DUSt3R/MASt3R pipeline, .ply format, Open3D code |
| `THE_PLAN.md` | Implementation plan | Stripped 3-phase plan (Map → System → Proof) |
| `PITCH_SCRIPT_AND_SLIDES.md` | Pitch content | 10-slide, 3-minute pitch script with visual descriptions |
| `SCOUT_Feature_Inventory_For_PM_Agent.md` | **This document** | **Complete feature inventory, admin spec, backlog, demo flow** |
| `submission.py` | Challenge code | 01-ats frontier-based multi-agent graph explorer |
| `change_detector.py` | Challenge code | 01-se3 Track 2 OpenCV tactical change detection |

---

*Document prepared for PM Agent pitch deck assembly. EDTH Munich 2026. June 27, 2026.*
