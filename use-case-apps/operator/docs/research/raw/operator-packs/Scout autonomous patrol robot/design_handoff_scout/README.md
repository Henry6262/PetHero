# Handoff: SCOUT — Autonomous Patrol & Command System

## Overview
SCOUT is a two-surface system for a single robot platform with swappable payloads, plus a command layer that ties dismounted soldiers, ground robots (the ARES-4 Q-UGV variants) and a commander into one **shared, live tactical picture**.

Two deliverables in this bundle:
1. **SCOUT Clearing** (`SCOUT Clearing.dc.html`) — the **operator handheld** (mobile, 402×874). Pick a payload → deploy → operate live → debrief.
2. **SCOUT Command** (`SCOUT Command.dc.html`) — the **command dashboard** (desktop, 1512×944). One operations manager sees all units/feeds on a stateful map and pushes orders/routes that appear live on soldiers' handsets.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that show the intended look, layout, and behavior. They are **not production code to copy directly**. They are authored as "Design Components" (a streaming HTML/JS prototyping format); treat them as a precise visual + interaction spec.

**The task is to recreate these designs in the target codebase's environment** using its established patterns and component library (React, Vue, SwiftUI, native, etc.). If no environment exists yet, choose the most appropriate stack for the product (a React + TypeScript SPA is a reasonable default for the command dashboard; a native or React Native app for the handheld) and implement there.

You do **not** need to reuse the `.dc.html` runtime, `support.js`, or the `<x-dc>`/`{{ }}` template syntax — those are prototype scaffolding. Re-implement the markup as idiomatic components and the `renderVals()`/state logic as ordinary component state.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, layout, and interactions are intentional. Recreate the UI pixel-accurately using the codebase's libraries. Exact tokens are listed in **Design Tokens** below.

---

## Product Concept (read first)
- **One robot, swappable payload.** The handheld's three payloads are roles, not three robots: **RECON** (teal, change-detection / "spot what changed"), **RESCUE** (green, locate civilians), **ELIMINATE** (red, RESTRICTED — engage confirmed threats, gated).
- **Human-in-the-loop is mandatory** for lethal action: positive-ID checklist → arm → press-and-hold-to-confirm → logged with operator ID. This is policy-enforced (cannot be disabled from the handheld) and is the core defensibility story.
- **On-device AI, mesh link, no cloud.** Surfaced throughout as copy; for implementation it means no hard dependency on a backend for the core loop.
- **Shared context.** The commander draws a route on the dashboard map and pushes it; it appears on the named soldier's handset in real time. (Bi-directional sync — soldier-flagged contacts surfacing on the commander map — is a planned next step, not yet built.)
- **ARES-4 robot variants** (used in the command roster / future loadout sheets): Standard Patrol & Overwatch, Medevac & Recovery, Assault & Breaching, Drone Carrier / Air Recon, Stealth Infiltrator. Each has a distinct loadout (see the `loadout` arrays in `SCOUT Command.dc.html`).

---

# SURFACE 1 — SCOUT Clearing (Operator Handheld)

Mobile frame 402×874 inside an iPhone-style bezel (radius 54px outer / 42px screen, dynamic island, status bar 9:41, home indicator). Dark theme default; a light theme exists (toggle lives in Settings). All screens share a top app area; content scrolls below.

## Screens / Views (single-screen state machine: `screen` = select | deploy | plan | deploying | live | debrief)

### 1. Mission Select (`select`)
- **Purpose:** choose the payload/role for this deployment.
- **Layout:** title "Mission select" (Inter 700, 26px) → a **robot display stage** → three payload cards (12–15px gap).
- **Robot display stage:** ~228px tall rounded card (radius 22) with a *neutral* (white/gray, NOT amber) holographic turntable: faint grid floor, slow dashed scan ring, corner brackets, glowing pedestal, "SCOUT-01 / UNIT · READY" labels. Center holds a **user-fillable image slot** (`image-slot.js`, id `scout-unit-render`, `fit=contain`) for the user's robot render; floats gently.
- **Payload cards (`OptionButton`):** glassmorphic card, per-mode color wash gradient fading to the panel color, a 3px glowing left accent edge, **no border**, soft shadow, `backdrop-filter: blur(13px)`. Left: outline icon in the mode hue (goggles=Recon, three-person family=Rescue, crosshair-target=Eliminate), ~50px, **no icon tile**. Title Inter 800 ~23px. Subtitle Inter 500 ~15.5px muted — copy: Recon "Secure the building", Rescue "Locate civilians", Eliminate "Engage confirmed threats". Eliminate also shows a small `RESTRICTED` badge (alert-red). Right chevron.

### 2. Deploy (`deploy`)
- **Purpose:** commit a payload and choose how to deploy.
- **Layout:** back link "Payload"; big payload header — large mode icon (52px, **no tile**), mode label Inter 800 28px, a small mode-hue status dot (no description line). Then two large action buttons (`OptionButton`, ~92px tall, less rounded), then an info note.
- **Action buttons:** **Drop & go** — `variant=primary`, solid **mode-hue** fill, dark text, bolt icon, title only (no subtitle). **Plan a route** — solid **steel-blue `#7C8AA5`** (deliberately a *different* color from Drop & go), route icon, title only. Below: a one-line note "Alerts you the moment it sees a person or anything of interest."
- (An earlier pre-flight "readiness checklist" exists in code but the simplified two-action layout is the current intent.)

### 3. Plan a route (`plan`)
- **Purpose:** tap a floor plan to set an ordered path.
- **Layout:** "Plan route" + live "N STOPS" counter. A 330px tappable floor-plan canvas (`cursor: crosshair`) with room blocks, a START marker, numbered waypoint pins (mode hue), and a dashed polyline through them. Tapping the map appends a waypoint (max 6); Undo / Clear buttons; "Deploy along route" (disabled until ≥1 stop).

### 4. Deploying (`deploying`)
- **Purpose:** on-device boot bridge after deploy.
- **Layout:** "Deploying SCOUT-01" + mode/site. An "acquiring" viewport (static-scan texture, searching reticle that spins, crosshair, scan line, mode-hue banner). A progress bar + a 4-step checklist resolving top→bottom: **Mesh link → Sensors → On-device AI → Camera feed** (spinner on active, check on done). Auto-advances (~750ms/step) and resolves into Live after ~3.6s; tap anywhere to skip. Mode-accented.

### 5. Live (`live`)
- **Purpose:** operate and supervise.
- **Layout (top→bottom):** status line ("SCANNING/SEARCHING/ENGAGING · ROOM 2") + **Feed/Map** segmented toggle (active segment = amber accent). A payload chip row ("RECON payload · Change"). Then **Feed** or **Map**:
  - **Feed:** ~300px viewport (radius 22), corner brackets in mode hue, scan line, a tappable detection box with a mode-hue tag (e.g., "NEW OBJECT"), top banner ("CHANGE DETECTED"), meta ("DIFF 3.4%"), foot + state.
  - **Map:** floor plan, rooms colored cleared / active(mode hue, pulsing) / pending, with "N / 4 CLEAR".
  - **Primary actions row:** **Review** (one word; solid mode-hue fill; icon + text in the dark `mhOn` color for contrast — do NOT use white-on-cyan) at `flex:1`, radius 12; and **Mark** — a 60px **icon-only** square (pin icon in **amber** `--accent`, amber-tinted border), radius 12, which on tap flips to an amber check ("Marked") for 1.6s. Labels by mode: Review / Report / Assess.
  - **Activity** list (timeline of events; the live one is tappable with a "Review/Open/Assess" link).
  - **"End mission · view debrief"** button.
- **Bottom utility bar:** Mission · Log · Node · Settings.

### 6. Detail drawer (bottom sheet; mode-aware)
Opens from the detection box / activity item. Slides up (`translateY`, cubic-bezier(.32,.72,0,1)), scrim behind.
- **Recon →** "Change detected": **baseline vs now** side-by-side compare, "new object since baseline", Mark & report / Update baseline.
- **Rescue →** "Person located": thermal+optical box, posture/motion/thermal tiles, "non-combatant likely", Report to medics / Mark on map.
- **Eliminate → gated engagement** (3 sub-states):
  1. **Assess:** contact box (UNVERIFIED) + **POSITIVE ID checklist** of 3 tappable items (visual confirmed / no friendly IFF / within ROE). "Arm engagement" stays disabled until all 3 checked.
  2. **Armed:** "ARMED · POSITIVE ID CONFIRMED". A **press-and-hold** radial button (conic-gradient fills over ~1.6s); release early aborts; Abort button.
  3. **Engaged:** "Engagement logged" — operator ID, human-in-the-loop verified, held duration, on-node video/ROE record. Done.

### 7. Other drawers
- **Mission Log:** vertical timeline of mission events (mode-aware copy).
- **Node (SCOUT-01):** robot health — battery 81% bar, datalink "Mesh" bars, sensor/AI checklist, payload bay = current mode.
- **Settings:** Dark/Light segmented toggle; Engagement section (Require positive ID, Hold-to-confirm — both ON, shown as policy-locked); Detection sensitivity Low/Medium/High segmented.

### 8. Debrief / After-Action Report (`debrief`)
- Mode-aware: header, "Mission complete" banner, stat tiles (4/4 rooms, 06:12 duration, mode-specific count). Outcomes list. For **Eliminate**, an **Engagement Audit** card: human-in-the-loop verified, operator ID OP-2241, positive-ID 3/3, hold 1.6s, on-node video+ROE. Actions: New mission / Full log.

---

# SURFACE 2 — SCOUT Command (Desktop Dashboard, 1512×944, dark only)

Three-region layout under a top command bar.

## Top command bar (h 62)
Left: SCOUT/COMMAND logo (amber hex mark) · divider · "OPERATION IRONHAND" + "PHASE 2 · ENTRY" (amber). Center: **LIVE** rec dot + ticking mission clock "T+ HH:MM:SS" (JetBrains Mono, +1s/sec). Right chips: "THREAT · ELEVATED" (amber), "MESH · 12 NODES" (cyan), "5 UGV · 5 PAX", alert bell, commander identity "CMD · OP-9001 / Maj. Halden".

## Left rail — Roster (w 288)
"UNITS / 10 ACTIVE". Two sections: **GROUND ROBOTS · ARES-4** (5 rows) and **DISMOUNTS · 2 FIRETEAMS** (5 rows). Each row: variant code tile / soldier code circle (friendly blue), name + role, status dot, battery% or "HR nn". Selected row = amber-tinted bg + border. Clicking a row selects the unit (and opens the detail sheet).

## Center — Tactical map (flex)
- **Street grid:** ground `#0C0E12` + faint 46px grid; **avenues** (asphalt `#171b22` bands, ~2.5–3% thick, light curbs) with dashed amber centerlines; named labels "VICTOR AVE", "MERIDIAN ST", "RTE 4" (vertical). Buildings/units snap to the blocks between roads.
- **Blocks & zones:** generic building footprints (`#13161c`) fill empty cells; **named zones** carry a **state** (border+fill tint + label): CMD POST=SECURED(blue), COURTYARD=CLEARED(green), N. COMPOUND & S. MARKET=UNCLEARED(gray hatch), BLOCK C=CLEARING(amber), WAREHOUSE 7=HOSTILE(red), PLAZA=OBJECTIVE(amber, dashed target ring). A **PARK** terrain patch (green tint + tree dots) sits among the blocks.
- **Units:** friendly **robots** = blue rounded-square with variant letter (P/M/B/D/S); **soldiers** = blue circle with code (B1/A2…); **hostiles** = red rotated-square (diamond), pulsing, labeled CONTACT/SUSPECT; **civilian** = green circle "C"; **UAV** = cyan dot drifting (drone). Selected unit gets a pulsing amber ring. Each has a small callsign label.
- **Ambient movement:** a few civilians (green person icon) walk the streets, a dismount (blue person) patrols Rte 4 into Block C, a robot (cyan) tracks a road — CSS keyframes animating `left/top`.
- **Routes:** SVG polyline from a soldier to the objective. **Dim blue** when planned; turns **amber + marching-ants animation** when an order is pushed.
- **Radar sweep** (slow cyan conic-gradient) + range rings behind everything.
- **Map toolbar (top-left):** tool buttons (Select / Route / Mark danger / Recon ping / Rally — active = amber) + layer toggle chips (Threats / Routes / Civilians / Drone — toggle dims the matching map layer).
- **Tactical Feed (top-right):** live alert stack (Contact · Warehouse 7 / Change detected · Block C / Civilian · Courtyard); newest pulses; clicking an alert selects the related unit.
- **Legend (bottom-left):** location states + unit types.
- **Handset mirror (bottom-right):** a small phone showing the *selected soldier's* view. Default "STANDING BY"; when an order is pushed it shows "NEW ROUTE ORDER" (amber) + the route + "MOVE TO FALCON · 60m" — i.e., the live shared-context payoff.

## Right — Unit detail (collapsible sheet, w 362)
**Collapsed by default** so the map is full-width; a vertical "UNIT" tab sits at the right edge. Selecting any unit (roster / map marker / alert) slides the sheet in (`translateX`, cubic-bezier(.32,.72,0,1)); a chevron in the header or the tab toggles it.
Contents: unit header (variant-tinted code tile, name, role, kind chip "UGV · ONLINE" / "DISMOUNT · LIVE", collapse chevron) → **live feed** box (camera placeholder, REC dot, corner brackets in unit tint, scan line, feed label e.g. "ARES-1 · FWD THERMAL · 30fps" or "B-1 · HELMET CAM") → 3 stat tiles (battery / posture or vitals / zone+state) → **PAYLOAD · LOADOUT** list (the variant's gadgets) → **ORDERS** (Route / Hold / Recon / Danger grid; Route highlights when active) → primary **"Push order to handset"** (soldiers) / **"Send task to unit"** (robots) which sets the delivered state (button turns green "Order delivered · live on handset", route goes amber on map + handset mirror, Recall appears).

---

## Interactions & Behavior (summary)
- **Handheld:** payload select → deploy → (drop&go | plan route) → deploying boot (auto, skippable) → live → debrief. Detail drawers slide up over a scrim. Eliminate engagement is a 3-step gate (checklist → hold-to-confirm → logged). Mark = 1.6s confirm flip. Theme dark/light. Boot/clear timers via intervals (clear on unmount).
- **Command:** select unit (roster/marker/alert) opens detail sheet; chevron/UNIT tab toggle it. Tool + layer toggles. Push order → route+handset go amber/live; Recall reverts. Mission clock ticks every second.
- **Animations:** slide sheets cubic-bezier(.32,.72,0,1); pulses/scan/radar/marching-ants via CSS keyframes; hold-to-confirm via conic-gradient driven by a JS interval (~80ms steps to 100% ≈ 1.6s).

## State Management
- **Handheld:** `screen`, `mode` (surveil/rescue/clearing — internal keys for Recon/Rescue/Eliminate), `home` (feed/map), `drawer`, `engage` (assess/armed/done), positive-ID booleans `id1..3`, `holdPct`, `clearStep`, `bootStep`, `readyStep`, `waypoints[]`, `marked`, `sens`, `theme`.
- **Command:** `selected` (unit id), `tool`, `pushed`, mission `t` (seconds), `panelOpen`, layer booleans `layThreats/layRoutes/layCiv/layDrone`. Static data: `_units` (id, kind, code, name, role, tint, x/y %, battery, posture, zone, zoneState, feed, loadout[], vitals), `_hostiles`, `_civ`, `_buildings`, `_blocks`.

## Design Tokens

### Fonts (Google Fonts)
- **Inter** 400/500/600/700/800 — UI text.
- **Space Grotesk** 400/500/600/700 — labels/eyebrows/codes.
- **JetBrains Mono** 400/500/600/700 — clocks, coordinates, technical readouts.

### Handheld palette — Dark (default)
bg `#0D0E11` · surf `#16181D` · surf2 `#1E2127` · line `rgba(255,255,255,.09)` · hair `rgba(255,255,255,.055)` · text `#ECEEF1` · muted `rgba(236,238,241,.52)` · faint `rgba(236,238,241,.30)` · accent (amber) `#FFAB00` · onAccent `#141414` · alert `#FF4D4D` · scrim `rgba(0,0,0,.55)`.
### Handheld palette — Light
bg `#ECEEF1` · surf `#FFFFFF` · surf2 `#F4F5F7` · line `rgba(20,22,27,.11)` · text `#16181D` · muted `rgba(20,22,27,.55)` · accent `#F2A100` · onAccent `#1A1206` · alert `#E03333`.
### Mode hues (both surfaces)
Recon/Surveil teal `#18C0CE` (onHue `#06222A`) · Rescue green `#2FB873` (onHue `#04230F`) · Eliminate/Clearing red `#FF4D4D` (onHue `#2A0606`). Plan-route accent steel-blue `#7C8AA5`.

### Command palette
bg `#0B0C0F` · panel `#101216` · surf `#16191F` · surf2 `#1E222A` · map ground `#0C0E12` · street `#171b22` · line `rgba(255,255,255,.08)` · hair `rgba(255,255,255,.05)` · text `#ECEEF1` · muted `rgba(236,238,241,.55)` · faint `rgba(236,238,241,.32)`.
### Command semantic colors (MIL-style)
command/system amber `#FFAB00` · friendly blue `#3D8BFF` · hostile red `#FF4D4D` · civilian/cleared green `#2FB873` · recon/UAV cyan `#18C0CE` · assault-variant tan `#E8A35C`.
### Location states
SECURED=blue · CLEARED=green · CLEARING=amber · HOSTILE=red · UNCLEARED=gray `rgba(236,238,241,.34)` (hatched) · OBJECTIVE=amber.

### Radii
Handheld cards 16–22 · buttons 12–16 · pills 999 · phone bezel 54/42. Command panels/cards 10–18 · markers 5–8 · map blocks 6–8.

### Spacing
Handheld content padding 20px horizontal; card padding 14–22; gaps 9–15. Command rails 288 / 362; top bar 62; map overlay insets 16; chip/tile padding 11–14.

## Assets
- **Icons:** all inline SVG (no icon font). Distinct glyphs: goggles (Recon), three-person family (Rescue), crosshair/target (Eliminate), bolt (Drop & go), route nodes (Plan), pin (Mark), plus C2 markers. Recreate with your icon set if preferred, matching weight (~1.5–1.8 stroke).
- **`image-slot.js`** — a drag-and-drop image placeholder used for the user's robot render on Mission Select. In the real app, replace with your image component; the user intends to supply generated robot renders (per-variant renders are a planned enhancement).
- **No bitmap assets** are required; camera feeds are striped placeholders (replace with real video).

## Files in this bundle
- `SCOUT Clearing.dc.html` — handheld (all screens/drawers + logic).
- `SCOUT Command.dc.html` — command dashboard (map + roster + sheet + logic).
- `OptionButton.dc.html` — the reusable payload/action card used on Select + Deploy (props: iconName, title, subtitle, accent, dark, restricted, variant, onClick). Re-implement as a single shared component.
- `image-slot.js` — the fillable image placeholder (prototype helper).
- `support.js` — the Design Component runtime. **Reference only — do not ship.** It exists so the `.dc.html` files open in a browser; do not port it.

### How to read the `.dc.html` files
Open them in a browser to see the live design. In source, the markup between the implicit component tags is the template (`{{ x }}` = a value from `renderVals()`; `<sc-for>`/`<sc-if>` = loops/conditionals; `<dc-import>` = a child component). The `class Component extends DCLogic { … }` block is the state + logic (`renderVals()` returns the values the template binds). Port template → your components, `renderVals`/handlers → component state/methods.
