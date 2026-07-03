# SCOUT C2 — Design System & Screen Specifications
## For your design agent. Every screen. Every detail. Zero ambiguity.

---

## 1. DESIGN SYSTEM

### Color Palette

| Token | Hex | Use |
|---|---|---|
| **BG_PRIMARY** | `#0A0E1A` | Main background — near-black with deep blue tint |
| **BG_PANEL** | `#0F1629` | Panel/card backgrounds — slightly elevated |
| **BG_ELEVATED** | `#141D35` | Buttons, inputs, hover states |
| **BORDER** | `#1E2A4A` | Divider lines, card borders, panel outlines |
| **BORDER_GLOW** | `#00F0FF33` | Cyan glow on active/focused elements (20% opacity) |
| **TEXT_PRIMARY** | `#E0E6F0` | Headlines, primary labels — bright, readable |
| **TEXT_SECONDARY** | `#6B7A9C` | Timestamps, metadata, disabled — muted |
| **ACCENT_CYAN** | `#00F0FF` | Primary accent — CTAs, active agent, highlights |
| **ACCENT_RED** | `#FF3366` | THREAT, danger, DETONATE, critical alert |
| **ACCENT_YELLOW** | `#FFCC00` | CHANGE detected, warning, civilian alert |
| **ACCENT_GREEN** | `#00FF88` | CLEAR, safe, coverage zone, go signal |
| **ACCENT_BLUE** | `#4488FF` | AGENT-2 (BRAVO), info, drone indicator |
| **ACCENT_ORANGE** | `#FF8800` | AGENT-3 (CHARLIE), patrol active |
| **ACCENT_PINK** | `#FF0088` | AGENT-4 (DELTA), recon sweep |
| **ACCENT_LIME** | `#CCFF00` | AGENT-5 (ECHO), standby |

### Typography

| Token | Font | Size | Weight | Use |
|---|---|---|---|---|
| **DISPLAY** | `Rajdhani` or `Orbitron` | 48px | 700 | Splash screen title |
| **H1** | `Rajdhani` | 32px | 700 | Screen titles |
| **H2** | `Rajdhani` | 24px | 600 | Section headers |
| **H3** | `Rajdhani` | 20px | 600 | Card titles, agent names |
| **BODY** | `Inter` or `Roboto` | 16px | 500 | Primary text — BIG for field use |
| **LABEL** | `Inter` | 12px | 600 | Uppercase, tracked +1px, metadata |
| **DATA** | `JetBrains Mono` | 18px | 700 | Numbers, coordinates, percentages |

### Spacing

| Token | Value | Use |
|---|---|---|
| **UNIT** | 8px | Base grid unit |
| **CARD_PADDING** | 16px | Internal card padding |
| **CARD_GAP** | 12px | Gap between cards/panels |
| **SCREEN_MARGIN** | 20px | Edge padding on mobile |
| **BUTTON_HEIGHT** | 64px | Minimum touch target — gloved fingers |
| **BUTTON_RADIUS** | 8px | Button corner radius |
| **PANEL_RADIUS** | 12px | Card/panel corner radius |
| **ICON_SIZE** | 32px | Standard icon size |
| **ICON_SIZE_LARGE** | 48px | Status indicator icons |

### Iconography

All icons are **filled, monoline, 2px stroke weight**. No text labels on primary buttons — icons + color communicate meaning.

| Icon | Symbol | Color Context |
|---|---|---|
| **ROBOT_GROUND** | Quadruped silhouette | Agent-1 (green outline) |
| **DRONE** | Quadcopter silhouette | Agent-2 (blue), Agent-4 (pink) |
| **PERSON_THREAT** | Person with rifle icon | ACCENT_RED |
| **PERSON_CIVILIAN** | Person with hands up | ACCENT_YELLOW |
| **PERSON_UNKNOWN** | Person silhouette | TEXT_SECONDARY |
| **EYE_SCAN** | Eye with scan lines | ACCENT_CYAN (active scan) |
| **TARGET_CROSSHAIR** | Crosshair with dot | ACCENT_RED (threat locked) |
| **SHIELD_CHECK** | Shield with checkmark | ACCENT_GREEN (area clear) |
| **EXCLAMATION** | Triangle warning | ACCENT_YELLOW (change) |
| **DEPLOY** | Arrow down to ground | ACCENT_CYAN |
| **HOLD** | Hand palm | ACCENT_YELLOW |
| **DETONATE** | Explosion burst | ACCENT_RED (with confirmation) |
| **MARK** | Pin on map | ACCENT_CYAN |
| **RECALL** | Arrow returning to center | ACCENT_GREEN |
| **RECON** | Circular arrows | ACCENT_CYAN |
| **BATTERY** | Battery with level | ACCENT_GREEN > ACCENT_YELLOW > ACCENT_RED |
| **SIGNAL** | Wi-Fi waves | ACCENT_CYAN (strong), ACCENT_YELLOW (weak), ACCENT_RED (lost) |
| **CLOCK** | Clock face | TEXT_SECONDARY |
| **MAP** | Folded map | TEXT_SECONDARY |
| **CROSSHAIR_MAP** | Crosshair on grid | ACCENT_CYAN (operator focus) |
| **VIDEO_FEED** | Camera rectangle | TEXT_PRIMARY |
| **ALERT_BELL** | Bell with dot | ACCENT_RED when active |
| **SQUAD** | 5-person formation | ACCENT_CYAN |
| **HELMET** | Military helmet | TEXT_PRIMARY (operator ID) |
| **RADIO** | Radio handset | ACCENT_GREEN (connected) |

---

## 2. SCREEN 1 — SPLASH / MISSION SELECT

### Purpose
Operator opens app. Selects mission type. Big, fast, no confusion.

### Layout (375 x 812 — iPhone 13/14 size)

```
┌─────────────────────────────────────────┐  ← Full bleed, BG_PRIMARY
│                                         │
│     [LOGO: SCOUT hexagon icon]          │  ← 80x80px, centered, top 15%
│                                         │
│        SCOUT                            │  ← DISPLAY, ACCENT_CYAN, centered
│     ─────────────                       │  ← BORDER, 1px, 200px wide, centered
│   TACTICAL COMMAND                      │  ← H1, TEXT_PRIMARY, centered
│                                         │
│                                         │
│  ┌─────────────────────────────────┐    │  ← Full width minus margins
│  │                                 │    │
│  │   [ICON: SHIELD_CHECK 48px]     │    │  ← ACCENT_GREEN
│  │                                 │    │
│  │       CLEAR & HOLD              │    │  ← H2, TEXT_PRIMARY
│  │       ─────────────             │    │
│  │   Secure area. Hold position.   │    │  ← BODY, TEXT_SECONDARY
│  │   Mark friendlies. No action.   │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │  ← BG_PANEL, BORDER 1px, RADIUS 12px
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │   [ICON: TARGET_CROSSHAIR 48px] │    │  ← ACCENT_RED
│  │                                 │    │
│  │       ENGAGE & CLEAR            │    │  ← H2, TEXT_PRIMARY
│  │       ─────────────             │    │
│  │   Locate threats. Neutralize.   │    │  ← BODY, TEXT_SECONDARY
│  │   Deploy payload. Confirm.      │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │  ← BG_PANEL, BORDER 1px, RADIUS 12px
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │   [ICON: EYE_SCAN 48px]         │    │  ← ACCENT_CYAN
│  │                                 │    │
│  │       RECON SWEEP               │    │  ← H2, TEXT_PRIMARY
│  │       ─────────────             │    │
│  │   Patrol area. Detect changes.  │    │  ← BODY, TEXT_SECONDARY
│  │   Compare passes. Report.       │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │  ← BG_PANEL, BORDER 1px, RADIUS 12px
│                                         │
│         Operator: CMD-01                │  ← LABEL, TEXT_SECONDARY, bottom
│           [ICON: RADIO] ONLINE          │  ← ACCENT_GREEN
│                                         │
└─────────────────────────────────────────┘
```

### Interaction
- Tap any card → transitions to Screen 2 with that mission type active
- Card press animation: scale 0.98, border glows ACCENT_CYAN
- Transition: fade + slide up, 200ms

### Design Notes
- **ZERO text on buttons except the card titles and descriptions**
- Icons are 48px — readable at arm's length in poor light
- Cards are full-width, 200px tall — huge touch targets for gloved fingers
- Mission types are color-coded: Green (safe), Red (danger), Cyan (intel)

---

## 3. SCREEN 2 — SQUAD DASHBOARD (The Minimap on Steroids)

### Purpose
Main screen. Operator sees all 5 agents, the mini map, and can command. This is the "home" screen.

### Layout (375 x 812)

```
┌─────────────────────────────────────────┐  ← BG_PRIMARY
│ ◀  SQUAD DASHBOARD    [ICON: ALERT_BELL]│  ← H1 left, alert icon right (red if active)
│     SECTOR 7 • 14:32:07                 │  ← LABEL, TEXT_SECONDARY
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │  ← 335 x 280px, BG_PANEL, RADIUS 12px
│  │                                   │  │
│  │      [MINI MAP — 2D tactical]     │  │
│  │                                   │  │
│  │         Top-down village view     │  │
│  │         Buildings as grey blocks  │  │
│  │         Roads as dark lines       │  │
│  │                                   │  │
│  │         [●] A-1  green dot        │  │  ← Agent positions
│  │         [●] A-2  blue dot         │  │  ← with pulsing ring when moving
│  │         [●] A-3  orange dot       │  │  ← red ring + pulse = threat
│  │         [●] A-4  pink dot         │  │  ← yellow ring = change detected
│  │         [●] A-5  lime dot         │  │
│  │                                   │  │
│  │         Green circles = coverage  │  │
│  │         Red icons = threats       │  │
│  │         Yellow icons = changes    │  │
│  │                                   │  │
│  │    [+][−]  [RECENTER]  [LAYERS ▼]│  │  ← Map controls, bottom-right
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  COVERAGE  67% ████████████░░           │  ← DATA number, green progress bar
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │  ← 3 cards across, 105px each
│  │ [A-1 ●]  │ │ [A-2 ●]  │ │ [A-3 ●]  │ │  ← Agent mini cards
│  │  ALPHA   │ │  BRAVO   │ │  CHARLIE │ │
│  │  🟢 78%  │ │  🟢 82%  │ │  🔴 HOLD │ │  ← Status dot + battery or alert
│  │   GND    │ │   DRN    │ │   GND    │ │  ← Type icon: GND or DRN
│  └──────────┘ └──────────┘ └──────────┘ │  ← BG_PANEL, BORDER, RADIUS 8px
│                                         │
│  ┌──────────┐ ┌──────────┐              │
│  │ [A-4 ●]  │ │ [A-5 ●]  │              │
│  │  DELTA   │ │  ECHO    │              │
│  │  🟡 CHNG │ │  🟢 45%  │              │  ← Yellow = change, low battery
│  │   DRN    │ │   GND    │              │
│  └──────────┘ └──────────┘              │
│                                         │
│  ┌─────────────────────────────────┐    │  ← Full-width action bar
│  │  [ICON: SQUAD]  QUICK ACTIONS   │    │  ← H3, TEXT_PRIMARY
│  ├─────────────────────────────────┤    │
│  │  [DEPLOY] [RECON] [RECALL]      │    │  ← Three big buttons, equal width
│  └─────────────────────────────────┘    │  ← BG_PANEL
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  🚨  ACTIVE ALERTS              │    │  ← ACCENT_RED if alerts exist
│  │  ─────────────────────          │    │
│  │  🔴 A-3: THREAT — Bldg 7       │    │  ← Red text, expandable
│  │  🟡 A-4: CHANGE — Bldg 3       │    │  ← Yellow text
│  │  [VIEW ALL 3 ALERTS →]          │    │  ← Link to alert screen
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Mini Map Design Details

- **Base layer:** Dark grey (#1a1f2e) top-down terrain
- **Buildings:** Tan/grey polygons (#3a3f4e) with 1px BORDER outline
- **Roads:** Dark lines (#2a2f3e), 2px width
- **Agent dots:** 12px circles with agent color + 2px white border
- **Agent rings:** Pulsing 24px ring (opacity 0.3 → 0.6, 2s loop) in agent color when active
- **Coverage circles:** 20px ACCENT_GREEN circles at 0.2 opacity where agents have been
- **Threat markers:** ACCENT_RED triangle warning icon, 16px, pulsing
- **Change markers:** ACCENT_YELLOW circle icon, 16px, static
- **Map controls:** Small circular buttons (32px) bottom-right of map panel

### Agent Mini Card Design

Each card (105 x 120px):
- Top-left: Agent ID badge (A-1 to A-5) — 20px circle with agent color fill, white text
- Center: Agent name (ALPHA, BRAVO, etc.) — H3, TEXT_PRIMARY
- Bottom: Status indicator
  - Battery: 🟢 Green dot + percentage number (DATA font)
  - Alert: 🔴 Red dot + "THREAT"/"HOLD"/"CHNG" (LABEL font, uppercase)
- Bottom-right: Type icon (ROBOT_GROUND or DRONE), 20px, TEXT_SECONDARY
- Tap → navigates to Screen 3 (Agent Detail)
- Alert state: Card border glows 2px in alert color (red or yellow)

### Quick Actions Bar

Three equal buttons (full width, 56px height each):
- **DEPLOY:** ACCENT_CYAN background, white DEPLOY icon, "DEPLOY" text (H3)
- **RECON:** BG_ELEVATED background, RECON icon (circular arrows), ACCENT_CYAN text
- **RECALL:** BG_ELEVATED background, RECALL icon (return arrow), ACCENT_GREEN text
- Press: scale 0.96, background lightens 10%

---

## 4. SCREEN 3 — AGENT DETAIL / LIVE FEED

### Purpose
Deep-dive on one agent. Live camera feed. Full controls. This is where the operator commands a specific agent.

### Layout (375 x 812)

```
┌─────────────────────────────────────────┐  ← BG_PRIMARY
│ ◀  A-1 ALPHA          [ICON: SIGNAL]●   │  ← Back arrow + agent name + signal strength
│   GROUND UNIT • SECTOR A               │  ← LABEL: type + sector
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │  ← Full width, 280px height
│  │                                   │  │
│  │     [LIVE VIDEO FEED]             │  │  ← MJPEG stream from robot camera
│  │                                   │  │
│  │    +---------------------+        │  │  ← Crosshair overlay (center)
│  │    |                     |        │  │
│  │    |       +----+        |        │  │  ← Bounding box appears when object detected
│  │    |       |    |        |        │  │  ← IMX500 draws this automatically
│  │    |       +----+        |        │  │
│  │    |       PERSON 91%    |        │  ← Detection label + confidence
│  │    +---------------------+        │  │
│  │                                   │  │
│  │  [● REC]  14:33:22  [HD]        │  │  ← Recording indicator + timestamp + quality
│  │                                   │  │
│  └───────────────────────────────────┘  │  ← BG_PANEL, RADIUS 8px
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  STATUS                           │  │  ← LABEL, TEXT_SECONDARY
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  [ICON: EYE_SCAN]  PATROLLING     │  │  ← Large status icon + word
│  │                                   │  │
│  │  Position:  ████░░░░░░  45m       │  │  ← Progress bar + distance to objective
│  │  Battery:   ████████░░  78%       │  ← Green bar
│  │  Signal:    █████████░  92%       │  ← Cyan bar
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  DETECTION                        │  │
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  🟢 CLEAR — No contacts           │  │  ← Green icon + text (default)
│  │                                   │  │
│  │  [OR when threat detected:]       │  │
│  │                                   │  │
│  │  🔴 THREAT DETECTED               │  │  ← Red icon + text, 24px
│  │  Type: Armed Individual           │  │  ← BODY
│  │  Confidence: 91%                  │  ← DATA, ACCENT_RED
│  │  Distance: 12m                    │  ← DATA
│  │  Location: Building 7, Room 3     │  ← BODY
│  │                                   │  │
│  │  [THREAT IMAGE THUMBNAIL]         │  │  ← 80x80px, cropped detection
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  CONTROLS                         │  │  ← LABEL
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  [ICON: DEPLOY]   DEPLOY          │  │  ← Full-width, 64px height
│  │                                   │  │     BG_ELEVATED → ACCENT_CYAN on press
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  ┌─────────────┐ ┌─────────────┐  │  │  ← 50/50 split
│  │  │ [ICON:HOLD] │ │ [ICON:MARK] │  │  │
│  │  │    HOLD     │ │    MARK     │  │  │
│  │  │  Position   │ │  Threat/Civ │  │  │
│  │  └─────────────┘ └─────────────┘  │  │
│  │                                   │  │
│  ├───────────────────────────────────┤  │
│  │  [ICON: DETONATE]  DETONATE       │  │  ← ACCENT_RED background, full-width
│  │  Double-tap to confirm            │  │  ← LABEL, TEXT_SECONDARY, below button
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  MISSION LOG                      │  │
│  ├───────────────────────────────────┤  │
│  │  [CLOCK] 14:32 — Entered Bldg 3   │  │
│  │  [CLOCK] 14:33 — Room 1: CLEAR    │  │  ← Green dot prefix
│  │  [CLOCK] 14:34 — Room 2: CLEAR    │  │
│  │  [CLOCK] 14:35 — THREAT DETECTED  │  │  ← Red dot prefix
│  │  [CLOCK] 14:36 — HOLDING          │  │  ← Yellow dot prefix
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Video Feed Design

- **Aspect ratio:** 16:9 (standard camera)
- **Border:** 2px BORDER, RADIUS 8px
- **Crosshair:** White + shape, 2px stroke, center of feed
  - Horizontal line: full width
  - Vertical line: full height
  - Center dot: 4px circle
- **Detection overlay:** Bounding box (2px stroke, color = detection type)
  - Green box = person detected
  - Red box = threat classification
  - Label below box: icon + class + confidence %
- **Recording indicator:** Red pulsing dot (●) + "REC" text top-left
- **Timestamp:** JetBrains Mono, top-right
- **Tap video:** Full-screen modal (Screen 3B)

### Threat Detected State (Dynamic)

When the IMX500 detects a red card:

1. Video feed border flashes ACCENT_RED (3 pulses, 0.5s each)
2. Detection panel updates:
   - Icon changes to TARGET_CROSSHAIR (48px, red)
   - "THREAT DETECTED" in H2, ACCENT_RED
   - Classification, confidence, distance, location in DATA font
   - Thumbnail of the detection crops
3. Controls panel updates:
   - HOLD button becomes primary (moves to full-width)
   - DETONATE button appears below (red, with confirmation)
   - DEPLOY button hidden (already deployed)

### DETONATE Button Safety

- **Visual:** ACCENT_RED background, white DETONATE icon + text
- **First tap:** Button text changes to "CONFIRM DETONATE", background pulses
- **Second tap:** Action executes, button shows "EXECUTED", greyed out
- **Timeout:** If no second tap within 3 seconds, reverts to "DETONATE"
- **This prevents accidental triggers under stress**

---

## 5. SCREEN 4 — THREAT DETECTED ALERT (Full-Screen Modal)

### Purpose
Interrupts everything when any agent finds a threat. Operator MUST see this.

### Layout (375 x 812 — full screen overlay)

```
┌─────────────────────────────────────────┐  ← BG_PRIMARY at 90% opacity overlay
│                                         │
│     [ICON: ALERT_BELL 64px]             │  ← Top, pulsing red
│                                         │
│      🚨 THREAT DETECTED                 │  ← H1, ACCENT_RED, centered
│                                         │
│      Agent: A-3 CHARLIE                 │  ← H2, TEXT_PRIMARY
│      Location: Building 7, Room 3       │  ← BODY
│                                         │
│  ┌───────────────────────────────────┐  │  ← BG_PANEL, RADIUS 12px
│  │                                   │  │
│  │   [AGENT CAMERA FEED — zoomed]    │  │  ← Full-width, 240px height
│  │                                   │  │
│  │   +---------------------------+   │  │
│  │   |   [Red card visible in    |   │  │
│  │   |    bounding box]          |   │  │
│  │   |   PERSON 91%              |   │  │
│  │   +---------------------------+   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│      Classification: Armed Individual   │  ← BODY + DATA
│      Confidence: 91%                    │
│      Distance: 12m                      │
│      Time: 14:35:22                     │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │  [ICON: HOLD 32px]  HOLD POSITION │  │  ← Full-width, 72px, ACCENT_YELLOW bg
│  │                                   │  │     "Mark location. Wait for orders."
│  │                                   │  │
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  [ICON: DEPLOY 32px] DEPLOY ROBOT │  │  ← Full-width, 72px, ACCENT_CYAN bg
│  │       (Send ground unit to verify)│  │
│  │                                   │  │
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  [ICON: DETONATE 32px]  DETONATE  │  │  ← Full-width, 72px, ACCENT_RED bg
│  │       Double-tap to confirm       │  │  ← LABEL below
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│         [SWIPE UP TO DISMISS]           │  ← LABEL, TEXT_SECONDARY
│                                         │
└─────────────────────────────────────────┘
```

### Behavior
- **Auto-appears** when any agent reports THREAT
- **Haptic feedback** (vibration) on phone
- **Sound alert** (optional — beep or radio chirp)
- **Cannot be dismissed** without tapping an action button
- **Background** shows the squad dashboard blurred at 20% opacity

---

## 6. SCREEN 5 — CHANGE DETECTION ALERT

### Purpose
Shows before/after comparison when recon sweep detects changes.

### Layout (375 x 812)

```
┌─────────────────────────────────────────┐  ← BG_PRIMARY
│ ◀  CHANGE DETECTED      [ICON: CLOSE]   │  ← H1, back + close
│   PASS 2 RECON SWEEP • 14:47:33        │  ← LABEL
├─────────────────────────────────────────┤
│                                         │
│  Agent: A-4 DELTA                       │  ← H3
│  Location: Building 3, Room 2           │  ← BODY
│                                         │
│  ┌─────────────────┐ ┌─────────────────┐│  ← Side by side
│  │                 │ │                 ││
│  │  [BEFORE IMAGE] │ │  [AFTER IMAGE]  ││  ← 160 x 160px each
│  │                 │ │                 ││
│  │  Pass 1         │ │  Pass 2         ││  ← LABEL below each
│  │  12:30          │ │  14:47          ││
│  │                 │ │                 ││
│  │  🟢 CLEAR       │ │  🟡 CHANGE      ││  ← Status badge
│  │                 │ │                 ││
│  └─────────────────┘ └─────────────────┘│
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  CHANGE DETAILS                   │  │  ← LABEL
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  [ICON: EXCLAMATION]  DOOR STATUS │  │  ← 32px icon + H3
│  │                       CLOSED → OPEN│ │
│  │                                   │  │
│  │  [ICON: EXCLAMATION]  NEW OBJECT  │  │
│  │                       Vehicle present│ │
│  │                       (was empty)  │  │
│  │                                   │  │
│  │  Significance: HIGH               │  │  ← DATA, ACCENT_YELLOW
│  │  Confidence: 94%                  │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │  [ICON: MARK]  MARK FOR STRIKE   │  │  ← Full-width, ACCENT_RED
│  │                                   │  │
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  [ICON: HOLD]  HOLD — INVESTIGATE │  │  ← Full-width, ACCENT_YELLOW
│  │                                   │  │
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  [ICON: SHIELD_CHECK]  FALSE ALERT│  │  ← Full-width, ACCENT_GREEN
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Before/After Images
- **Side by side**, equal width
- **BORDER** 2px: green (before) / yellow (after)
- **Red outline** drawn around changed region on both images
- **Swipe** to see additional detected changes (if multiple)

---

## 7. SCREEN 6 — ADMIN DASHBOARD (The Magic)

### Purpose
Central command interface. This is what the "admin guy" at HQ sees. Full tactical view. All agents. All data. Command authority. **This is the showstopper screen.**

### Layout — Tablet/Laptop (1024 x 768 minimum)

This is NOT a mobile screen. This runs on the laptop at the command station. Wide aspect ratio. Information dense. Military command center aesthetic.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  SCOUT C2                           SECTOR 7    14:32:07 UTC    [● ONLINE]  │  ← Top bar: title, sector, time, status
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────┐  ┌───────────────────────────┐  │
│  │                                         │  │    SQUAD STATUS           │  │
│  │                                         │  │  ┌─────┐ ┌─────┐ ┌─────┐ │  │
│  │      [LIVE TACTICAL MAP — 2D]          │  │  │A-1 🟢│ │A-2 🟢│ │A-3 🔴│ │  │
│  │                                         │  │  │ALPH │ │BRAVO│ │CHOLD│ │  │
│  │         Top-down view of village        │  │  │78%  │ │82%  │ │     │ │  │
│  │         Full satellite imagery base     │  │  └─────┘ └─────┘ └─────┘ │  │
│  │         5 agent icons with trails       │  │  ┌─────┐ ┌─────┐         │  │
│  │         Green coverage overlay          │  │  │A-4 🟡│ │A-5 🟢│         │  │
│  │         Red threat markers              │  │  │DELTA│ │ECHO │         │  │
│  │         Yellow change markers           │  │  │CHNG │ │45%  │         │  │
│  │         Building labels (B1-B10)        │  │  └─────┘ └─────┘         │  │
│  │                                         │  │                           │  │
│  │    [AGENT SELECT: A-1 ▼] [ZOOM ±]      │  │  COVERAGE                 │  │
│  │    [LAYER: ALL ▼]  [GRID: ON]           │  │  ████████████░░  67%     │  │
│  │                                         │  │                           │  │
│  │                                         │  │  ACTIVE ALERTS            │  │
│  │                                         │  │  🔴 A-3: THREAT — Bldg 7 │  │
│  │                                         │  │  🟡 A-4: CHANGE — Bldg 3 │  │
│  │                                         │  │  🔴 A-3: LOW AMMO        │  │
│  │                                         │  │  [VIEW ALL 6 →]          │  │
│  │                                         │  │                           │  │
│  │                                         │  │  COMMAND ACTIONS          │  │
│  │                                         │  │  ┌─────────────────────┐  │  │
│  │                                         │  │  │ [DEPLOY TO A-3]     │  │  │
│  │                                         │  │  │ Send ground robot    │  │  │
│  │                                         │  │  └─────────────────────┘  │  │
│  │                                         │  │  ┌─────────────────────┐  │  │
│  │                                         │  │  │ [RECON SWEEP ALL]   │  │  │
│  │                                         │  │  │ Second pass, all    │  │  │
│  │                                         │  │  └─────────────────────┘  │  │
│  │                                         │  │  ┌─────────────────────┐  │  │
│  │                                         │  │  │ [EMERGENCY RECALL]  │  │  │
│  │                                         │  │  │ All agents return    │  │  │
│  │                                         │  │  └─────────────────────┘  │  │
│  │                                         │  │                           │  │
│  └─────────────────────────────────────────┘  └───────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  LIVE FEEDS — AGENT A-1 (ALPHA)                                       │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │  │ [CAMERA]     │ │ [MAP ZOOM]   │ │ [THERMAL]    │ │ [TELEMETRY]  │  │  │
│  │  │ Front cam    │ │ Top-down     │ │ Simulated    │ │ Battery      │  │  │
│  │  │ 320x240      │ │ 320x240      │ │ 320x240      │ │ 78% Signal   │  │  │
│  │  │              │ │ agent pos    │ │ grayscale    │ │ 92%          │  │  │
│  │  │              │ │ highlighted  │ │              │ │ Temp: 42°C   │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │  MISSION LOG              │  │  CHANGE DETECTION LOG                  │  │
│  │  [CLOCK] 14:32 Drop       │  │  [CLOCK] 14:47 A-4: Door OPEN        │  │
│  │  [CLOCK] 14:33 A-1 CLEAR  │  │  [CLOCK] 14:47 A-4: Vehicle new      │  │
│  │  [CLOCK] 14:35 A-3 THREAT │  │  [CLOCK] 14:15 A-1: CLEAR            │  │
│  │  [CLOCK] 14:36 A-3 HOLD   │  │  [CLOCK] 14:10 A-2: CLEAR            │  │
│  │  [VIEW FULL LOG →]        │  │  [VIEW FULL LOG →]                   │  │
│  └───────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Admin Dashboard Design Details

**Top Bar:**
- Height: 48px, BG_PANEL, bottom BORDER 1px
- Left: SCOUT logo (hexagon icon, 24px) + "SCOUT C2" (H2, ACCENT_CYAN)
- Center: "SECTOR 7" (LABEL) + live clock (DATA, JetBrains Mono)
- Right: Connection status (green dot + "ONLINE")

**Main Map Panel (60% width):**
- Full tactical map — larger, more detailed than mobile minimap
- **Agent trails:** Faint colored lines showing where each agent has been
- **Selection:** Click agent icon → highlights in right panel, zooms map
- **Building tooltips:** Hover building → popup with label, status, last visited
- **Grid overlay:** Toggleable coordinate grid (10m squares)
- **Layer controls:** Satellite / tactical / thermal / coverage toggles

**Right Panel (40% width):**
- **Squad Status:** 5 mini cards (same design as mobile, but smaller)
- **Coverage:** Large progress bar with percentage
- **Active Alerts:** Scrollable list, most recent at top, color-coded
- **Command Actions:** Three big buttons — DEPLOY, RECON, RECALL
  - Each button has icon + title + one-line description
  - Hover: background lightens, border glows

**Bottom Feeds Panel:**
- **4-column layout:** Camera, Map Zoom, Thermal (simulated), Telemetry
- Each feed: 320x240px, BG_PANEL, RADIUS 8px
- **Camera feed:** Real MJPEG from robot
- **Map zoom:** Centered on selected agent, 2x zoom
- **Thermal:** Simulated FLIR-style grayscale (for demo effect)
- **Telemetry:** Battery %, signal %, temperature, heading (DATA font)

**Bottom Logs:**
- Two columns: Mission Log (left), Change Detection Log (right)
- Each: 4 entries max, scrollable, timestamp + icon + event
- Color-coded dots: green = clear, red = threat, yellow = change

### Admin Color Accents

- **Selected agent:** Map icon has 3px white border + pulsing glow
- **Active command:** Button background animates (subtle pulse)
- **New alert:** Red border flash on right panel (3 pulses)
- **Trail colors:** Each agent leaves a faint colored line (same as agent color, 20% opacity)

---

## 8. SCREEN 7 — MISSION LOG / TIMELINE

### Purpose
Full chronological history of the mission. Filterable by agent, event type.

### Layout (375 x 812)

```
┌─────────────────────────────────────────┐  ← BG_PRIMARY
│ ◀  MISSION LOG        [ICON: FILTER]    │  ← H1 + filter button
│   SECTOR 7 • 42 MINUTES ELAPSED         │  ← LABEL
├─────────────────────────────────────────┤
│                                         │
│  [ALL] [THREATS] [CHANGES] [CLEAR] [CMD]│  ← Filter tabs, horizontal scroll
│  ────                                      ← Active tab underlined ACCENT_CYAN
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  14:47:33                         │  │  ← Timestamp, LABEL
│  │  🟡 A-4 CHANGE — Door OPEN        │  │  ← Icon + event, BODY
│  │     Building 3, Room 2            │  │  ← Detail, TEXT_SECONDARY
│  │     Before/After comparison →     │  │  ← Link to Screen 5
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  14:35:22                         │  │
│  │  🔴 A-3 THREAT — Armed Individual │  │
│  │     Building 7, Room 3            │  │
│  │     Confidence: 91%               │  │
│  │     [VIEW FOOTAGE →]              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  14:34:15                         │  │
│  │  🟢 A-1 CLEAR — Building 3        │  │
│  │     All rooms checked, no contacts│  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  14:33:00                         │  │
│  │  ⚪ CMD — DEPLOY TO A-3           │  │  ← White icon = command
│  │     Admin ordered ground unit     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  14:32:00                         │  │
│  │  ⚪ MISSION START — Sector 7      │  │
│  │     5 agents deployed             │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. INTERACTION PATTERNS (Global)

### Animations

| Animation | Duration | Easing | Use |
|---|---|---|---|
| **Screen transition** | 200ms | ease-out | Page navigation |
| **Card press** | 100ms | ease-in-out | Button/card tap feedback |
| **Alert pulse** | 2000ms | ease-in-out | Red/yellow alert glow loop |
| **Agent dot pulse** | 2000ms | ease-in-out | Moving agent ring |
| **Coverage appear** | 500ms | ease-out | Green circle fades in |
| **Map zoom** | 300ms | ease-out | Map zoom in/out |
| **Modal slide** | 300ms | cubic-bezier(0.32,0.72,0,1) | Alert modal appears |
| **Progress bar** | 1000ms | ease-out | Coverage percentage fills |

### Haptic Feedback

| Event | Pattern |
|---|---|
| **Threat detected** | Triple pulse (strong) |
| **Change detected** | Double pulse (medium) |
| **Command sent** | Single pulse (light) |
| **Detonate confirm** | Warning buzz (3 quick pulses) |
| **Mission complete** | Success pattern (ascending tones if audio) |

### Accessibility (Field Use)

- **All touch targets minimum 64px** — gloved fingers
- **High contrast ratios** — readable in bright sun and dark rooms
- **No text smaller than 12px** — readable at arm's length
- **Color + icon + shape** — never rely on color alone
- **Redundant communication** — visual + haptic for critical alerts

---

## 10. BRANDING ELEMENTS

### Logo

Hexagon shape, 6 segments, ACCENT_CYAN fill. Center: stylized "S" formed by two converging lines (suggesting sightlines / targeting). Outer hexagon: 1px BORDER.

```
     ____
    /    \
   /  S   \     ← Hexagon logo
   \      /
    \____/
```

### Splash Screen

- Background: BG_PRIMARY with subtle grid pattern (5% opacity)
- Center: Logo (80px), pulsing glow animation
- Below: "SCOUT" (DISPLAY font, ACCENT_CYAN)
- Below: "TACTICAL COMMAND" (H1, TEXT_PRIMARY)
- Bottom: Version + "EDTH MUNICH 2026" (LABEL, TEXT_SECONDARY)
- Animation: Logo scales 0.8 → 1.0, glow intensifies, 2 seconds

### Sound Design (For Video)

- **Alert ping:** Short radio chirp for threat
- **Command sent:** Subtle confirmation beep
- **Coverage complete:** Satisfying completion tone
- **Ambient:** Low radio static / drone hum (very subtle, 10% volume)

---

## SUMMARY FOR YOUR DESIGN AGENT

**Color palette:** Dark backgrounds (#0A0E1A, #0F1629), cyan accent (#00F0FF), red for threat (#FF3366), yellow for change (#FFCC00), green for clear (#00FF88). 5 agent colors (green, blue, orange, pink, lime).

**Typography:** Military/game fonts — Rajdhani/Orbitron for headlines, Inter for body, JetBrains Mono for data. Big sizes — 16px minimum body, 32px+ headlines.

**Icons:** Military standard symbols. Filled, monoline. No text on primary buttons — icon + color tells the story.

**Screens to design:**
1. Splash / Mission Select (3 big cards: Clear, Engage, Recon)
2. Squad Dashboard (minimap + 5 agent cards + quick actions)
3. Agent Detail (live video + status + controls + detonate)
4. Threat Alert (full-screen modal, camera feed, action buttons)
5. Change Detection (before/after images, change details, actions)
6. Admin Dashboard (tablet layout, tactical map, squad status, feeds, logs)
7. Mission Log (timeline, filterable, color-coded)

**Key principle:** Minimal text. Big buttons. Color + icon communication. Works in poor light with gloved fingers. Futuristic military aesthetic like a video game HUD.

*That's it. Every screen. Every detail. Go make history.*
