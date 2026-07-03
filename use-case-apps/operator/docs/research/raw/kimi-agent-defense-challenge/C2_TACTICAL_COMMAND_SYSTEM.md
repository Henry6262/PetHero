# TACTICAL C2 COMMAND SYSTEM — The Ultimate Hackathon Demo
## Real-Time Strategy for Military Operations: Map, Perimeter Coverage, Multi-Agent Control, and Change Detection in One Unified Platform

**TL;DR:** You're building a **Command & Control (C2) system** that looks and works like a military RTS game (StarCraft, Command & Conquer). A 2D tactical map shows terrain, buildings, and 5 autonomous agents. Each agent has a **Field of View (FOV) cone** — as they move, the areas they've "seen" turn from fog-of-war (dark) to covered (green). An admin panel lets a central operator send commands to all agents. Field operators use a mobile app to deploy robots that walk toward enemy positions for intel. All data — camera feeds, detections, positions, changes — feeds into **one shared map context** that everyone sees. The 3-minute demo is a **pre-recorded cinematic video** showing the full system in action, plus a live IRL robot as "Agent 1." This validates SE3 Labs' 3D reconstruction software and ATS GmbH's graph exploration — two Munich companies at their own event.

---

## 1. THE CONCEPT: Why This Wins Every Judge

### 1.1 The Problem You're Solving

Current military operations suffer from a **fragmented information problem**:
- Drones send video to one system
- Ground robots report to another
- Soldiers with helmet cameras feed a third
- Command sees a fourth dashboard
- **Nobody has the unified picture**

Your system solves this: **one map, all agents, real-time coverage, unified context.**

### 1.2 What the Demo Looks Like (The 3-Minute Video)

The video opens on a **2D tactical map** — think StarCraft, but military. Satellite imagery base layer. Buildings as polygons. Roads as lines. Fog-of-war covers everything (dark grey).

A helicopter icon appears at the edge. **5 agent icons** (colored circles) drop from it. They scatter across the map. As each agent moves, a **translucent green cone** extends from it — that's its camera FOV. Where the cone sweeps, the fog-of-war **dissolves** to reveal the terrain. Within seconds, green coverage patches spread across the map like ink in water.

Agent 3 stops. Its cone turns **red**. A popup: "THREAT DETECTED — Armed individual, Building 7." The admin panel on the right updates: "AGENT-3: HOLD POSITION. AWAITING ORDERS."

The admin clicks "DEPLOY ROBOT" — a new icon (the PiCrawler) spawns and walks toward the threat. The camera zooms to the IRL robot on the table, walking the tape path. The phone screen shows the live feed: "THREAT CONFIRMED. 91% confidence."

Cut to 2 hours later. The "RECON" button pulses. The admin clicks it. Agents sweep the map again. This time, Agent 4's cone highlights a **yellow zone**: "CHANGE DETECTED — Door closed → OPEN. Vehicle present." Before/after comparison pops up. The map updates: the building icon now has an orange alert ring.

The video zooms out to show the **full coverage map** — 80% green, 5 red alerts, 3 yellow changes. The admin panel shows: "MISSION STATUS: ACTIVE. 5 AGENTS. 12 DETECTIONS. 4 CHANGES."

Close with: "SCOUT C2. One map. Every agent. Complete situational awareness. Built in 42 hours at EDTH Munich."

### 1.3 Why Judges Will Lean Forward

| Judge Type | What They See | What They Think |
|---|---|---|
| **SE3 Labs mentor** | Their 3D data powering a real C2 use case | "This validates our entire product direction" |
| **ATS GmbH mentor** | 5 agents exploring using the graph algorithm | "Our challenge code is the brain of their system" |
| **Ukrainian military** | One operator controlling 5+ agents remotely | "This is what we need on the front line" |
| **VC / Investor** | RTS-game interface = instantly understandable | "I can see the product. I can see the market." |
| **Defense contractor** | Unified C2 with FOV coverage mapping | "This is a procurement-ready concept" |
| **Other hackers** | Cinematic video + live robot | "How did they do that in 42 hours?" |

---

## 2. THE SYSTEM ARCHITECTURE: Four Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCOUT C2 — TACTICAL COMMAND                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: THE MAP (SE3 Labs 3D / 2D Tactical Base)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Satellite imagery base layer                                        │   │
│  │  Buildings as polygons (from SE3 3D reconstruction)                 │   │
│  │  Roads, terrain features                                             │   │
│  │  Fog-of-war: unseen = dark grey, seen = full color                   │   │
│  │  Coverage overlay: green tint where FOV has swept                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                              │
│  LAYER 2: AGENTS (5 Units + Your Robot)                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│  │ AGENT 1 │ │ AGENT 2 │ │ AGENT 3 │ │ AGENT 4 │ │ AGENT 5 │             │
│  │ (Robot) │ │ (Sim)   │ │ (Sim)   │ │ (Sim)   │ │ (Sim)   │             │
│  │         │ │         │ │         │ │         │ │         │             │
│  │ • FOV   │ │ • FOV   │ │ • FOV   │ │ • FOV   │ │ • FOV   │             │
│  │ • GPS   │ │ • GPS   │ │ • GPS   │ │ • GPS   │ │ • GPS   │             │
│  │ • Cam   │ │ • Cam   │ │ • Cam   │ │ • Cam   │ │ • Cam   │             │
│  │ • AI    │ │ • AI    │ │ • AI    │ │ • AI    │ │ • AI    │             │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘             │
│       │           │           │           │           │                   │
│       └───────────┴───────────┴───────────┴───────────┘                   │
│                              │                                              │
│  LAYER 3: COMMAND & CONTROL (Admin Panel + Mobile App)                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐                │
│  │  ADMIN PANEL (Web)       │  │  FIELD OPERATOR (Mobile) │                │
│  │                          │  │                          │                │
│  │  [Live Map]              │  │  [Mini Map + Agent List] │                │
│  │  [Agent Status Cards]    │  │  [Deploy Robot Button]   │                │
│  │  [Send Command Dropdown] │  │  [Live Camera Feed]      │                │
│  │  [Coverage Stats]        │  │  [Detection Alerts]      │                │
│  │  [Change Detection Log]  │  │  [Mark Threat/Civilian]  │                │
│  └──────────────────────────┘  └──────────────────────────┘                │
│                              │                                              │
│  LAYER 4: INTELLIGENCE (01-ats + 01-se3 Integration)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • 01-ats graph algorithm → agent pathfinding & exploration         │   │
│  │  • 01-se3 change detection → compare patrol passes, flag changes    │   │
│  │  • IMX500 AI camera → real-time threat/civilian detection           │   │
│  │  • Coverage tracking → FOV polygon accumulation over time           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. THE MAP: Visual Design for Maximum Impact

### 3.1 The 2D Tactical Map (What the Video Shows)

You don't need 3D for the demo video. A **beautiful 2D tactical map** is faster to build, easier to animate, and more visually readable in 3 minutes. Think:
- **StarCraft** minimap aesthetic
- **Command & Conquer** battlefield view
- **Wargame: Red Dragon** strategic overlay

**Map layers (bottom to top):**

| Layer | Visual | Purpose |
|---|---|---|
| **Base terrain** | Satellite imagery or topographic colors | Ground reference |
| **Fog-of-war** | Semi-transparent dark grey (#222222, 70% opacity) | Shows unexplored areas |
| **Coverage** | Green tint (#00FF44, 30% opacity) where FOV swept | Shows what's been seen |
| **Buildings** | Tan/brown polygons with black outlines | Structures to clear |
| **Roads** | Grey lines, 2px width | Paths |
| **Agents** | Colored circles (8px) with directional arrow | Unit positions |
| **FOV cones** | Translucent wedge extending from agent | Camera field of view |
| **Alerts** | Pulsing red/yellow rings around buildings | Detections & changes |
| **Command lines** | Dashed animated lines from admin to agent | Orders being sent |

### 3.2 The FOV Cone: How to Render It

The FOV cone is the **visual signature** of your system. It's what makes the map come alive.

**Mathematically:** Given agent position (x, y), facing angle θ, FOV angle α (e.g., 90°), and range r:

```python
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Wedge

def draw_fov_cone(ax, x, y, angle, fov_deg=90, radius=50, color='green', alpha=0.3):
    """Draw a field-of-view cone on the map."""
    # Wedge: center, radius, theta1, theta2
    wedge = Wedge(
        center=(x, y),
        r=radius,
        theta1=angle - fov_deg/2,
        theta2=angle + fov_deg/2,
        facecolor=color,
        alpha=alpha,
        edgecolor=color,
        linewidth=1
    )
    ax.add_patch(wedge)
    
    # Add arc line at the edge
    theta = np.linspace(
        np.radians(angle - fov_deg/2),
        np.radians(angle + fov_deg/2),
        50
    )
    arc_x = x + radius * np.cos(theta)
    arc_y = y + radius * np.sin(theta)
    ax.plot(arc_x, arc_y, color=color, linewidth=1.5, alpha=0.6)
```

**Coverage accumulation:** As the agent moves, you union all FOV polygons. The covered area grows over time. This is the "ink spreading" effect that looks so satisfying.

```python
from shapely.geometry import Polygon, Point
from shapely.ops import unary_union

def fov_polygon(x, y, angle, fov_deg=90, radius=50):
    """Return a shapely Polygon representing the FOV cone."""
    points = [(x, y)]  # Center point
    for a in np.linspace(angle - fov_deg/2, angle + fov_deg/2, 30):
        points.append((x + radius * np.cos(np.radians(a)),
                       y + radius * np.sin(np.radians(a))))
    return Polygon(points)

# Accumulate coverage over time
coverage = Polygon([])  # Start empty
for agent_pos, agent_angle in agent_path:
    cone = fov_polygon(agent_pos[0], agent_pos[1], agent_angle)
    coverage = unary_union([coverage, cone])
```

### 3.3 Fog-of-War Dissolution

The most visually satisfying effect: as the FOV cone sweeps, the fog **melts away** to reveal the terrain underneath.

Implementation: Two layers — a full-resolution base map (always rendered) and a fog mask (dark overlay). Where coverage polygon exists, the fog mask has 0% opacity. Where no coverage exists, 70% opacity. The transition between them is the visual effect.

---

## 4. THE AGENTS: 5 Units + Your Robot

### 4.1 Agent Representation on the Map

Each agent is a **colored circle with a directional arrow** — instantly readable, like any RTS game.

```python
# Agent visual properties
AGENTS = {
    0: {"name": "ALPHA", "color": "#00FF88", "type": "GROUND"},   # IRL Robot
    1: {"name": "BRAVO", "color": "#0088FF", "type": "DRONE"},    # Simulated
    2: {"name": "CHARLIE", "color": "#FF8800", "type": "GROUND"}, # Simulated
    3: {"name": "DELTA", "color": "#FF0088", "type": "DRONE"},    # Simulated
    4: {"name": "ECHO", "color": "#FFFF00", "type": "GROUND"},    # Simulated
}
```

**Agent icon design:**
- Outer ring: agent color, 3px stroke
- Inner fill: white, 60% opacity
- Label: "A-1" to "A-5" in black, 8px font
- Direction arrow: pointing in facing direction, same color as ring
- Status indicator: small dot at bottom-right
  - Green dot = active, patrolling
  - Red dot = threat detected, stopped
  - Yellow dot = change detected, investigating
  - Grey dot = offline / waiting orders

### 4.2 Agent Movement: Animated Paths

Agents move along **pre-planned paths** (from your 01-ats graph algorithm). The animation interpolates between waypoints.

```python
import matplotlib.animation as animation

def animate_agent_movement(ax, path, color, agent_id):
    """Animate an agent moving along a path."""
    agent_dot, = ax.plot([], [], 'o', color=color, markersize=10)
    agent_arrow = ax.annotate('', xy=(0, 0), xytext=(0, 0),
                              arrowprops=dict(arrowstyle='->', color=color, lw=2))
    
    def init():
        agent_dot.set_data([], [])
        return agent_dot, agent_arrow
    
    def update(frame):
        if frame < len(path):
            x, y, angle = path[frame]
            agent_dot.set_data([x], [y])
            # Update arrow direction
            dx = 8 * np.cos(np.radians(angle))
            dy = 8 * np.sin(np.radians(angle))
            agent_arrow.xy = (x + dx, y + dy)
            agent_arrow.xytext = (x, y)
        return agent_dot, agent_arrow
    
    return animation.FuncAnimation(fig, update, init_func=init,
                                   frames=len(path), interval=50, blit=True)
```

### 4.3 The IRL Robot as "Agent 1 (ALPHA)"

In the video, Agent 1 is animated on the map. In the live demo, you switch to the **physical robot on the table**:

> *"What you see on screen is Agent 1 — our autonomous ground robot. And here it is in the physical world."*

The robot walks the tape path. The phone shows its live camera feed. The laptop still shows the map with Agent 1's icon moving in sync. **This bridge between simulation and reality is the proof.**

---

## 5. THE ADMIN PANEL: Central Command Interface

### 5.1 Layout (Right Side of Screen)

```
┌────────────────────────────────────┐
│  SCOUT C2 — COMMAND               │
│  Operator: CMD-01  🟢 ONLINE      │
├────────────────────────────────────┤
│                                     │
│  SQUAD STATUS                       │
│  ┌─────┐ ┌─────┐ ┌─────┐         │
│  │A-1 🟢│ │A-2 🟢│ │A-3 🟢│         │
│  │ 78% │ │ 82% │ │ 91% │         │
│  └─────┘ └─────┘ └─────┘         │
│  ┌─────┐ ┌─────┐                  │
│  │A-4 🟢│ │A-5 🟡│                  │
│  │ 85% │ │ 45% │                  │
│  └─────┘ └─────┘                  │
│                                     │
│  COVERAGE: 67% ████████░░         │
│                                     │
│  ACTIVE ORDERS                      │
│  • A-3: HOLD — THREAT DETECTED     │
│  • A-5: LOW BATTERY — RECALL       │
│                                     │
│  [📡 SEND COMMAND]                  │
│  [🎯 DEPLOY ROBOT]                  │
│  [🔍 RECON SWEEP]                   │
│  [🚨 EMERGENCY RECALL]              │
│                                     │
│  CHANGE LOG                         │
│  14:47 A-4: Door OPEN (was CLOSED) │
│  14:32 A-3: THREAT — Building 7    │
│  14:15 A-1: CLEAR — Building 3     │
│                                     │
└────────────────────────────────────┘
```

### 5.2 Command Types

| Command | What It Does | Visual Effect |
|---|---|---|
| **PATROL** | Agent follows exploration route | Dashed line shows planned path |
| **HOLD** | Agent stops, maintains position | Agent icon pulses yellow |
| **INVESTIGATE** | Agent moves to specific coordinates | Animated line drawn to target |
| **DEPLOY ROBOT** | Spawns ground robot at agent location | Robot icon appears, starts walking |
| **RECON SWEEP** | All agents do second pass | Coverage map updates, changes highlighted |
| **RECALL** | All agents return to drop zone | Agents converge on center |

---

## 6. THE FIELD OPERATOR APP: Mobile Interface

### 6.1 Screen Design

**Screen 1: Squad View**
```
┌──────────────────────────────┐
│  SCOUT — FIELD OP      📡●   │
├──────────────────────────────┤
│                              │
│  [MINI MAP — 5 agent dots]   │
│                              │
│  YOUR AGENT: A-1 (ALPHA)    │
│  ┌────────────────────────┐  │
│  │ [LIVE CAMERA FEED]    │  │
│  │  + crosshair overlay   │  │
│  └────────────────────────┘  │
│                              │
│  Status: PATROLLING          │
│  Battery: 78%                │
│  Detections: 0               │
│                              │
│  [🤖 DEPLOY ROBOT]          │
│  [📍 MARK LOCATION]         │
│  [🚨 ALERT COMMAND]         │
│                              │
│  [🔴 THREAT] [🟡 CIVILIAN]  │
│                              │
└──────────────────────────────┘
```

**Screen 2: Threat Detected**
```
┌──────────────────────────────┐
│  ←  A-1 (ALPHA)              │
├──────────────────────────────┤
│                              │
│  🚨 THREAT DETECTED          │
│                              │
│  ┌────────────────────────┐  │
│  │ [CAMERA — red card     │  │
│  │  in box visible]       │  │
│  └────────────────────────┘  │
│                              │
│  Type: Armed Individual      │
│  Confidence: 91%             │
│  Distance: 12m               │
│                              │
│  [🔴 ENGAGE]  [🟡 HOLD]     │
│  [📍 MARK FOR STRIKE]       │
│                              │
│  Sending to Admin... ✓       │
│                              │
└──────────────────────────────┘
```

---

## 7. THE 3-MINUTE CINEMATIC VIDEO: Storyboard

### 7.1 Why a Pre-Recorded Video?

In 3 minutes, you cannot:
- Set up the full system live
- Wait for agents to explore organically
- Handle technical glitches

A **pre-recorded video** gives you:
- Perfect timing
- Cinematic camera movements
- Guaranteed wow moments
- Professional polish

You play the video on the laptop while narrating. When Agent 1 appears, you cut to the **live robot** for the physical proof.

### 7.2 Storyboard: Scene by Scene

**SCENE 1: THE DROP (0:00-0:15)**
- Black screen. Text: "SECTOR 7 — EASTERN UKRAINE"
- Fade to tactical map. Fog-of-war covers everything.
- Helicopter icon enters from top. Sound effect: rotor blades.
- 5 colored dots drop from helicopter. Scatter to 5 positions.
- *"Five agents. One village. Zero intel."*

**SCENE 2: THE SWEEP (0:15-0:45)**
- Agents begin moving. FOV cones extend.
- Green coverage spreads like ink. Fog-of-war dissolves.
- Fast-forward montage: agents clearing buildings.
- Coverage meter climbs: 10%... 30%... 55%...
- *"Every camera feed. Every field of view. Mapped in real-time."*

**SCENE 3: THE THREAT (0:45-1:15)**
- Agent 3 (CHARLIE, orange) stops at Building 7.
- FOV cone turns RED. Pulse effect.
- Popup: "THREAT DETECTED — Armed Individual — 91%"
- Admin panel slides in: "A-3: HOLD. AWAITING ORDERS."
- *"The AI sees what the operator needs to know."*

**SCENE 4: THE RESPONSE (1:15-1:45)**
- Admin clicks "DEPLOY ROBOT".
- Robot icon (green, different shape) spawns, moves toward Building 7.
- **CUT TO LIVE:** Camera pans to your table. Robot walking tape path.
- Phone screen shows live feed: red card in box.
- *"Agent 1 — the physical proof. Same AI. Same algorithm. Real hardware."*

**SCENE 5: THE RECON (1:45-2:15)**
- Cut back to video. "2 HOURS LATER" text.
- Agents sweep again. Coverage already at 60%.
- Agent 4 (DELTA, pink) stops. FOV turns YELLOW.
- Popup: "CHANGE DETECTED — Door: CLOSED → OPEN"
- Before/after split screen. Map updates: orange alert ring.
- *"What changed? The system knows. Before the enemy does."*

**SCENE 6: THE BIG PICTURE (2:15-2:45)**
- Zoom out to full map. 80% green coverage.
- Alert summary: "5 THREATS | 4 CHANGES | 0 CIVILIAN CASUALTIES"
- Admin panel shows all agents, all statuses.
- Mobile app shown: operator receiving updates.
- *"One map. Every agent. Complete situational awareness."*

**SCENE 7: THE CLOSE (2:45-3:00)**
- Text: "SCOUT C2 — TACTICAL COMMAND SYSTEM"
- Subtext: "Powered by SE3 Labs spatial intelligence | ATS GmbH graph exploration"
- Logos: EDTH Munich 2026
- *"Built in 42 hours. Deployed for a lifetime."*

### 7.3 Technical: How to Build the Video

**Tool: Python + Matplotlib Animation**

```python
"""
SCOUT C2 — Cinematic Demo Video Generator
Uses matplotlib.animation to create the 3-minute tactical video.
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.patches import Polygon, Circle, FancyBboxPatch, Wedge
from matplotlib.collections import PatchCollection
import matplotlib.patheffects as path_effects
from shapely.geometry import Polygon as ShapelyPolygon
from shapely.ops import unary_union

# === CONFIGURATION ===
FPS = 30
DURATION = 180  # 3 minutes
TOTAL_FRAMES = FPS * DURATION
MAP_SIZE = (1000, 800)

# Colors
COLOR_FOG = '#1a1a2e'
COLOR_COVERAGE = '#00ff44'
COLOR_THREAT = '#ff0044'
COLOR_CHANGE = '#ffaa00'
COLOR_AGENT = ['#00ff88', '#0088ff', '#ff8800', '#ff0088', '#ffff00']
COLOR_BUILDING = '#c4a77d'
COLOR_ROAD = '#666666'

# === BUILD THE MAP ===
fig, ax = plt.subplots(1, 1, figsize=(16, 10), facecolor=COLOR_FOG)
ax.set_facecolor(COLOR_FOG)
ax.set_xlim(0, MAP_SIZE[0])
ax.set_ylim(0, MAP_SIZE[1])
ax.set_aspect('equal')
ax.axis('off')

# Buildings (10 structures)
buildings = [
    (100, 100, 80, 60), (300, 150, 100, 80), (500, 100, 90, 70),
    (200, 350, 120, 90), (450, 300, 80, 100), (700, 200, 110, 80),
    (150, 550, 100, 70), (400, 500, 130, 90), (650, 450, 90, 110),
    (800, 600, 100, 80)
]

# Draw buildings
for bx, by, bw, bh in buildings:
    building = FancyBboxPatch((bx, by), bw, bh,
                               boxstyle="round,pad=2",
                               facecolor=COLOR_BUILDING,
                               edgecolor='#5c4a3a', linewidth=2, alpha=0.9)
    ax.add_patch(building)
    # Building label
    ax.text(bx + bw/2, by + bh/2, f'B{buildings.index((bx,by,bw,bh))+1}',
            ha='center', va='center', fontsize=10, color='#5c4a3a',
            fontweight='bold')

# Draw roads
roads = [
    [(50, 400), (950, 400)],  # Horizontal main
    [(500, 50), (500, 750)],  # Vertical main
    [(150, 200), (850, 600)], # Diagonal
]
for road in roads:
    xs, ys = zip(*road)
    ax.plot(xs, ys, color=COLOR_ROAD, linewidth=8, alpha=0.6)
    ax.plot(xs, ys, color='#888888', linewidth=4, alpha=0.8)

# Fog-of-war overlay (full map)
fog = plt.Rectangle((0, 0), MAP_SIZE[0], MAP_SIZE[1],
                     facecolor=COLOR_FOG, alpha=0.75, zorder=10)
ax.add_patch(fog)

# === AGENT PATHS (pre-computed from 01-ats algorithm) ===
# Each agent has a list of (x, y, angle) waypoints
agent_paths = [
    # Agent 1: moves through buildings 1, 2, 3
    [(500, 750, 270)] * 30 +  # Drop zone hover
    np.linspace([500, 750, 270], [140, 130, 225], 60).tolist() +  # To B1
    [(140, 130, 225)] * 20 +  # At B1
    np.linspace([140, 130, 225], [350, 190, 315], 60).tolist() +  # To B2
    [(350, 190, 315)] * 20 +  # At B2
    np.linspace([350, 190, 315], [545, 135, 45], 60).tolist() +   # To B3
    [(545, 135, 45)] * 40,    # THREAT at B3
    
    # Agent 2: drone, covers right side
    # ... similar pattern ...
]

# === COVERAGE TRACKING ===
coverage_polygons = [ShapelyPolygon([]) for _ in range(5)]

def get_fov_polygon(x, y, angle, fov=90, radius=80):
    """Generate FOV cone polygon."""
    points = [(x, y)]
    for a in np.linspace(angle - fov/2, angle + fov/2, 20):
        rad = np.radians(a)
        points.append((x + radius * np.cos(rad), y + radius * np.sin(rad)))
    return ShapelyPolygon(points)

# === ANIMATION UPDATE ===
coverage_patches = [None] * 5
agent_dots = [ax.plot([], [], 'o', markersize=12, color=c, zorder=20)[0] 
              for c in COLOR_AGENT]
agent_labels = [ax.text(0, 0, f'A{i+1}', fontsize=8, fontweight='bold', 
                        color='white', zorder=21) for i in range(5)]
fov_patches = [None] * 5

def update(frame):
    """Main animation function — called every frame."""
    
    # SCENE 1: Helicopter drop (frames 0-450 = 0-15 sec)
    if frame < 450:
        # Show helicopter, animate drop
        pass  # Implementation details...
    
    # SCENE 2: Agents sweep (frames 450-1350 = 15-45 sec)
    elif frame < 1350:
        for i in range(5):
            path_idx = min(frame - 450, len(agent_paths[i]) - 1)
            x, y, angle = agent_paths[i][path_idx]
            
            # Update agent position
            agent_dots[i].set_data([x], [y])
            agent_labels[i].set_position((x + 15, y + 15))
            
            # Update FOV cone
            fov_poly = get_fov_polygon(x, y, angle)
            coverage_polygons[i] = unary_union([coverage_polygons[i], fov_poly])
            
            # Draw coverage
            if coverage_patches[i]:
                coverage_patches[i].remove()
            coords = np.array(coverage_polygons[i].exterior.coords)
            coverage_patches[i] = Polygon(coords, facecolor=COLOR_COVERAGE, 
                                           alpha=0.25, zorder=5)
            ax.add_patch(coverage_patches[i])
            
            # Draw FOV cone
            if fov_patches[i]:
                fov_patches[i].remove()
            fov_patches[i] = Wedge((x, y), 80, angle-45, angle+45,
                                    facecolor=COLOR_AGENT[i], alpha=0.15,
                                    edgecolor=COLOR_AGENT[i], linewidth=1, zorder=6)
            ax.add_patch(fov_patches[i])
    
    # SCENE 3: Threat detected (frames 1350-1800 = 45-60 sec)
    elif frame < 1800:
        # Agent 3 stops, FOV turns red
        # Alert popup appears
        pass
    
    # ... more scenes ...
    
    return agent_dots + agent_labels + coverage_patches + fov_patches

# Create and save animation
anim = animation.FuncAnimation(fig, update, frames=TOTAL_FRAMES, 
                                interval=1000/FPS, blit=False)
anim.save('scout_c2_demo.mp4', writer='ffmpeg', fps=FPS, dpi=150,
          bitrate=5000, codec='h264')
```

**Alternative: Record a screen capture of a running Python visualization**

Instead of rendering to video file, run the matplotlib animation live and use **OBS Studio** to record the screen. This gives you more control and you can pause/resume.

---

## 8. CHALLENGE INTEGRATION: How Both P0s Feed the System

### 8.1 01-ats (ATS GmbH) — The Brain

Your `Explorer` class from 01-ats becomes the **pathfinding engine** for all 5 agents:

```
01-ats Explorer Algorithm
        ↓
Generates optimal exploration routes for each agent
        ↓
Routes translated to 2D map waypoints (x, y, angle)
        ↓
Waypoints animated on the tactical map
        ↓
Agents appear to autonomously clear the village
```

**For the demo:** Pre-compute 5 exploration routes using your `submission.py`. Store them as waypoint arrays. The video animation reads these waypoints and interpolates smooth movement between them.

### 8.2 01-se3 Track 2 (SE3 Labs) — The Eyes

Your `TacticalChangeDetector` becomes the **change detection layer**:

```
01-se3 Change Detection
        ↓
Compares "before" and "after" patrol photos
        ↓
Detects: door status changes, new vehicles, moved objects
        ↓
Results displayed on map as yellow alert zones
        ↓
Before/after comparison shown in admin panel
```

**For the demo:** Simulate 3-4 changes between patrol passes. Use your change detector on pairs of pre-generated images. Show the detection results as map alerts.

### 8.3 The SE3 Connection

When you talk to SE3 Labs:

> *"Your challenge asked for the AI layer that extracts intelligence from 3D reconstructed battlefields. We built that layer — and we wrapped it in a full C2 system. Your 3D reconstruction becomes our map base. Our change detection becomes your intelligence output. The admin panel becomes the operator interface. This is the end-to-end system your technology enables."*

---

## 9. THE BUILD PLAN: 42 Hours to Glory

### Friday (18:00-02:00) — Foundation

| Time | Task | Deliverable |
|---|---|---|
| 18:00-19:00 | Talk to SE3 mentor, get 3D data if possible | Data or fallback plan |
| 19:00-21:00 | Build 2D tactical map (matplotlib) | Map renders with buildings, roads, fog |
| 21:00-23:00 | Add 5 agents + FOV cones + movement animation | Agents move, coverage spreads |
| 23:00-01:00 | Add admin panel overlay (matplotlib text/patches) | Panel shows status, commands |
| 01:00-02:00 | First video render test (30 seconds) | Video plays, looks good |

### Saturday (09:00-23:00) — Integration

| Time | Task | Deliverable |
|---|---|---|
| 09:00-12:00 | Build full 3-minute video (all scenes) | Complete cinematic video |
| 12:00-14:00 | Build mobile app (React, squad command UI) | App runs in browser |
| 14:00-16:00 | Integrate IRL robot as Agent 1 | Robot syncs with video timing |
| 16:00-17:00 | Submit 01-ats + 01-se3 Track 2 | Both challenges done |
| 17:00-19:00 | Add change detection scenes to video | Yellow alerts, before/after |
| 19:00-21:00 | Full demo rehearsal (video + live robot + app) | Smooth transitions |
| 21:00-23:00 | Polish video, add sound effects, text overlays | Professional final cut |

### Sunday (09:00-12:00) — Demo Day

| Time | Task |
|---|---|
| 09:00-10:00 | Setup table, test all hardware |
| 10:00-11:00 | Dress rehearsal (3x) |
| 11:00-12:00 | Final mental prep |
| 12:00 | **WIN** |

---

## 10. THE PITCH: Narrating the Video

### Script (Memorize This)

**[0:00] "Sector 7, Eastern Ukraine. A village. Enemy inside. Civilians hiding. We don't know what's where."**

**[0:15] "Five agents drop from a helicopter. Each one has a camera, an AI brain, and a mission: see everything."**

**[0:30] "Watch the green — that's coverage. Everywhere the camera sweeps gets mapped. The fog of war disappears. In 30 seconds, we know more than a day of human recon."**

**[0:45] "Agent 3 stops. Red cone. Threat detected. Armed individual, Building 7, 91% confidence. The system alerts the operator instantly."**

**[1:15] "The operator deploys a ground robot. Agent 1. And here it is — the physical proof. Same AI, same algorithm, walking on this table."**
*[Cut to robot walking. Phone shows live feed.]*

**[1:45] "Two hours later. The agents return. The map hasn't changed. But something has."**
*[Video shows change detection. Yellow alert. Before/after.]*

**[2:15] "One map. Five agents. Complete situational awareness. We submitted our graph exploration to ATS GmbH. Our change detection to SE3 Labs. And we built the command system that ties it all together."**

**[2:45] "SCOUT C2. Built in 42 hours at EDTH Munich. Deployed for a lifetime."**

---

## 11. TECHNICAL RESOURCES

### Python Animation
- **Matplotlib animation docs:** `https://matplotlib.org/stable/api/animation_api.html`
- **FuncAnimation tutorial:** `https://jakevdp.github.io/blog/2012/08/18/matplotlib-animation-tutorial/`
- **Shapely for polygon operations:** `https://shapely.readthedocs.io/en/stable/manual.html`

### FOV / Visibility
- **FOV cone algorithm:** `https://www.gamedeveloper.com/programming/efficient-field-of-view-and-line-of-sight-for-strategy-games` [^171^]
- **Visibility polygon:** `https://gamedev.stackexchange.com/questions/120430/drawing-visibility-polygons-in-unity-for-vision-cones-with-occlusion` [^172^]

### Tactical RPG / RTS Movement
- **Godot tactical RPG tutorial:** `https://www.gdquest.com/library/tactical_rpg_movement/` [^168^]
- **GitHub demo:** `https://github.com/gdquest-demos/godot-2d-tactical-rpg-movement` [^173^]
- **RTS game design fundamentals:** `https://gamedesignskills.com/game-design/real-time-strategy/` [^163^]

### Military C2 Interfaces
- **Blue Force Tracker:** `https://www.researchgate.net/figure/Blue-Force-Tracking-on-the-BMS-screen-to-the-left-and-through-the-commanders-sight-to_fig1_320980749` [^169^]
- **ATAK system:** `https://skyfi.com/en/blog/atak-system-satellite-imaging` [^101^]

### SE3 Labs
- **Website:** `https://www.se3.ai/` [^148^]
- **SE3 + Carmenta:** `https://carmenta.com/knowledge/ai-powered-geospatial-intelligence-by-se3-labs-and-carmenta` [^140^]
- **Isabel Tahir interview:** `https://www.youtube.com/watch?v=7Wsp3--R_Jk` [^143^]

---

## 12. FILES IN YOUR PACKAGE

| File | What It Is |
|---|---|
| `C2_TACTICAL_COMMAND_SYSTEM.md` | This document — the master plan |
| `submission.py` | 01-ats Explorer class (already built) |
| `change_detector.py` | 01-se3 Track 2 (already built) |
| `AI_CAMERA_GAME_CHANGER.md` | IMX500 integration details |
| `BATTLE_TESTED_PLAN.md` | Mobile app + comms architecture |
| `SE3_INTEGRATED_EPIC_DEMO_PLAN.md` | Previous 5-agent + 3D plan |
| `RESEARCH_PACKAGE.md` | All links and API references |

---

*This is it. A C2 system that looks like StarCraft, works like ATAK, validates SE3 Labs and ATS GmbH, and has a live robot as physical proof. Pre-recorded cinematic video for the 3-minute demo. Live robot + mobile app for the "this is real" moment. Go end this hackathon.*
