# SCOUT C2 — The Plan
## What we're building, what we're not, and the order to build it in

---

## THE PRODUCT (One Sentence)

A tactical command system where 5 autonomous agents (4 simulated + 1 real robot) explore a 3D village, their camera coverage paints cleared areas green, threats show red, changes show yellow, and a field operator sees everything on a mobile "minimap on steroids."

---

## THE 3-MINUTE VIDEO (What Judges See)

1. **The Drop** (15s) — 5 agents spawn on a 3D village map and scatter
2. **The Sweep** (30s) — Agents move through buildings. Green circles appear where they've been. Map coverage grows.
3. **The Threat** (30s) — Agent 3 stops. Red alert: "THREAT — Building 7."
4. **The Response** (30s) — Cut to live robot on table walking tape path. Phone shows camera feed with red card detected.
5. **The Recon** (30s) — "2 hours later." Agents sweep again. Yellow alert: "CHANGE — Door closed → open."
6. **The Big Picture** (30s) — Zoom out. 80% coverage. 5 agents. All statuses. Mobile app shown.
7. **The Close** (15s) — "SCOUT C2. One map. Every agent. Complete situational awareness."

---

## THE ARCHITECTURE (What Code Runs Where)

```
LAPTOP (your dev machine)
├── 3D Map Generator (Python + Open3D)
│   └── Procedurally generates a village (.ply point cloud)
│
├── Agent Controller (Python)
│   └── 5 agents move using your 01-ats graph algorithm
│
├── Video Renderer (Python matplotlib + Open3D)
│   └── Captures frames, adds admin overlay, saves MP4
│
├── Flask Server (Python)
│   └── Serves: video feed, agent statuses, detection alerts
│
└── 01-ats submission (Python)
    └── Your frontier-based Explorer class

PI 5 (inside PiCrawler robot)
├── Robot Controller (Python picrawler lib)
│   └── Walks tape path, stops at boxes, turns, etc.
│
├── IMX500 AI Camera (on-chip neural network)
│   └── Detects "person" at 30 FPS, zero CPU load
│
├── Vision Classifier (Python OpenCV)
│   └── Red card = THREAT, blue/yellow = CIVILIAN
│
├── Flask Client
│   └── Sends detections + camera feed to laptop
│
└── 01-se3 submission (Python OpenCV)
    └── Compares before/after photos for change detection

PHONE (any device with browser)
└── React Web App
    ├── Squad view: 5 agent cards with status
    ├── Mini map: agent positions on 2D tactical view
    ├── Live feed: camera from Agent 1 (IRL robot)
    └── Action buttons: DEPLOY / HOLD / MARK
```

---

## DEVELOPMENT PHASES (In Order — Don't Skip)

### PHASE 1: MVP — "The Map Works" (Friday Night, 6 hours)

**Goal:** A 3D village renders. 5 agents move on it. Green circles appear. A video saves.

**What to build:**

```python
# ONE Python file: map_demo.py

import open3d as o3d
import numpy as np

# 1. Generate village point cloud (or load SE3 demo if they have one)
def make_village():
    points, colors = [], []
    # Ground (brown)
    for _ in range(20000):
        points.append([np.random.uniform(0,200), np.random.uniform(0,200), 0])
        colors.append([0.3, 0.25, 0.15])
    # 10 buildings (grey boxes)
    for _ in range(10):
        bx, by = np.random.uniform(20,180), np.random.uniform(20,180)
        bw, bd, bh = np.random.uniform(8,20), np.random.uniform(8,20), np.random.uniform(5,15)
        for _ in range(1000):
            points.append([bx + np.random.uniform(0,bw), by + np.random.uniform(0,bd), np.random.uniform(0,bh)])
            colors.append([0.6, 0.55, 0.5])
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(np.array(points))
    pcd.colors = o3d.utility.Vector3dVector(np.array(colors))
    return pcd

# 2. Create 5 agents (colored spheres)
def make_agent(color, pos):
    sphere = o3d.geometry.TriangleMesh.create_sphere(radius=2.0)
    sphere.paint_uniform_color(color)
    sphere.compute_vertex_normals()
    sphere.translate(pos)
    return sphere

# 3. Animate and capture frames
vis = o3d.visualization.Visualizer()
vis.create_window(width=1280, height=720)
scene = make_village()
vis.add_geometry(scene)

agents = []
agent_colors = [[0,1,0.5], [0,0.5,1], [1,0.5,0], [1,0,0.5], [1,1,0]]
agent_paths = [...]  # From your 01-ats algorithm

for i in range(5):
    a = make_agent(agent_colors[i], [50+i*25, 50, 2])
    agents.append(a)
    vis.add_geometry(a)

# Animation loop — save frames
for frame in range(300):
    for i, agent in enumerate(agents):
        # Move agent along path
        # Add coverage circle at current position
        pass
    vis.capture_screen_image(f"frame_{frame:04d}.png")

# Stitch frames into video using ffmpeg or cv2
```

**Output:** `scout_demo.mp4` — 5 agents moving on a 3D village, green coverage circles.

**When this is done:** You have a video. That's the foundation of everything.

---

### PHASE 2: V1 — "The System Works" (Saturday Morning, 6 hours)

**Goal:** Admin panel overlay. Mobile app shows squad status. Threat and change alerts appear.

**What to build:**

**A. Admin Panel Overlay (matplotlib)**

Right side of the screen. Shows:
- 5 agent cards (name, status, battery)
- Coverage percentage bar
- Active alerts list
- Command buttons (DEPLOY, RECON, RECALL)

```python
# Composite: Open3D frame + matplotlib overlay
fig, (ax_map, ax_panel) = plt.subplots(1, 2, figsize=(16,9), gridspec_kw={'width_ratios':[3,1]})
ax_map.imshow(captured_3d_frame)
ax_panel.set_facecolor('#111')
ax_panel.text(0.5, 0.9, 'SCOUT C2', color='white', fontsize=14, ha='center', transform=ax_panel.transAxes)
# ... agent status, alerts, buttons
plt.savefig(f"composed_frame_{frame:04d}.png")
```

**B. Mobile App (React, one HTML file)**

```html
<!-- index.html — single file, no build step -->
<!DOCTYPE html>
<html>
<head><style>
body { background: #111; color: white; font-family: sans-serif; margin: 0; }
.agent-card { background: #222; border-radius: 8px; padding: 12px; margin: 8px; }
.agent-green { border-left: 4px solid #0f0; }
.agent-red { border-left: 4px solid #f00; }
.agent-yellow { border-left: 4px solid #fa0; }
.feed { width: 100%; height: 200px; background: #000; border-radius: 8px; }
button { background: #333; color: white; border: none; padding: 16px; 
         border-radius: 8px; font-size: 16px; width: 100%; margin: 4px 0; }
button.deploy { background: #0a0; }
button.hold { background: #a00; }
</style></head>
<body>
  <h2>SCOUT — FIELD OP</h2>
  <div id="feed" class="feed"></div>
  <div class="agent-card agent-green"><b>A-1 ALPHA</b><br>Patrolling • 78%</div>
  <div class="agent-card agent-red"><b>A-3 CHARLIE</b><br>THREAT DETECTED • HOLD</div>
  <div class="agent-card agent-yellow"><b>A-4 DELTA</b><br>Change Detected</div>
  <button class="deploy">DEPLOY ROBOT</button>
  <button class="hold">HOLD POSITION</button>
  <button>MARK THREAT</button>
</body>
</html>
```

That's it. No React build. No npm. One HTML file. Open it in any browser.

**C. Threat & Change Alerts**

- **Threat:** Agent stops, red circle pulses around building, popup appears
- **Change:** Second patrol compares photos, yellow marker appears, before/after shown

**Output:** Full video with admin panel, mobile app works, alerts trigger.

---

### PHASE 3: V2 — "The Robot Works" (Saturday Afternoon, 6 hours)

**Goal:** IRL robot syncs with Agent 1. Pitch rehearsed. Challenges submitted.

**What to build:**

**A. Robot as Agent 1**

```python
# On the Pi 5 inside the robot
from picrawler import PiCrawler
from picamera2 import Picamera2
from picamera2.devices.imx500 import IMX500
import cv2, requests

robot = PiCrawler()
cam = Picamera2(1)
imx500 = IMX500("/usr/share/imx500-models/mobilenet_ssd.rpk")
cam.start()

# Movement: follow the same path as Agent 1 in the video
# Walk tape path → stop at box → take photo → classify → report
```

**B. Sync with Video**

When the video shows "Agent 1 entering Building 3," you trigger the robot to walk toward the corresponding box on the table. The timing doesn't need to be frame-perfect — it's a demo, not a product.

**C. Submit Challenges**

- 01-ats: `submission.py` (already built) → upload to their GitHub repo
- 01-se3 Track 2: `change_detector.py` (already built) → package with report

**D. Pitch Rehearsal**

Practice the 3-minute narration 5 times. Time yourself. Smooth transitions between video and live robot.

**Output:** Working demo. Robot walks. Video plays. Pitch is smooth. Challenges submitted.

---

## WHAT WE'RE NOT BUILDING (Scope Control)

| Not Building | Why Not |
|---|---|
| Real-time multi-agent coordination | 5 simulated agents with pre-planned paths is enough |
| Full 3D pathfinding on terrain | Agents move on flat ground; terrain is visual only |
| Live SE3 data integration | Self-generated village is faster and works guaranteed |
| React Native native app | HTML file in browser is identical for demo, 10x faster |
| LoRa mesh communication | Wi-Fi direct for demo; mention LoRa in pitch for vision |
| ATAK integration | Mention in pitch; build post-hackathon |
| Custom AI model training | Use IMX500 pre-loaded MobileNet SSD + color heuristics |
| SLAM / real 3D mapping | Too complex. Village is procedural. |
| Explosive payload mechanism | Never demo explosives at a hackathon. Mention conceptually. |

---

## THE TABLETOP SETUP (What You Bring)

| Item | Purpose |
|---|---|
| PiCrawler robot | Agent 1 (physical proof) |
| Raspberry Pi 5 + IMX500 camera | Robot brain + AI vision |
| Laptop | Runs 3D viz, video, Flask server |
| Phone | Shows mobile app |
| Tape (colored) | Paths on table |
| 3 boxes | Buildings |
| Red/blue/yellow cards | Room contents |
| Power bank | Robot power |
| "Drone" cutout (optional) | Simulated aerial threat |

---

## THE PITCH (What You Say, 3 Minutes)

**[0:00]** "Sector 7. A village. We don't know who's inside. Five agents drop."

**[0:15]** *Video: agents scatter, green coverage spreads.* "Every camera feed. Every field of view. Mapped in real-time."

**[0:45]** *Video: Agent 3 stops, red alert.* "Threat detected. The system alerts before a soldier steps through the door."

**[1:15]** *Cut to live robot.* "Agent 1 — our autonomous ground robot. Same AI, same algorithm, real hardware."

**[1:45]** *Video: recon sweep, yellow change alert.* "Two hours later. What changed? The system knows."

**[2:15]** *Video: full map, 80% coverage.* "One map. Five agents. Complete situational awareness."

**[2:45]** "SCOUT C2. We submitted our graph exploration to ATS GmbH and our change detection to SE3 Labs. Built in 42 hours at EDTH Munich."

---

## FRIDAY NIGHT CHECKLIST (Do These In Order)

- [ ] Generate village point cloud (30 min)
- [ ] Create 5 agents, place on map (30 min)
- [ ] Animate agents moving (2 hours)
- [ ] Add green coverage circles (1 hour)
- [ ] Capture 30-second video test (30 min)
- [ ] If video looks good: build full 3-minute version (2 hours)
- [ ] If video doesn't work: debug until it does (don't sleep until it works)

**Friday night success criteria:** A 30-second MP4 plays showing agents moving on a 3D village with coverage zones. Everything else is Saturday.

---

## SATURDAY CHECKLIST

**Morning (6 hours):**
- [ ] Add admin panel overlay to video
- [ ] Add threat/change alert scenes
- [ ] Build mobile app (HTML file)
- [ ] Render full 3-minute video

**Afternoon (6 hours):**
- [ ] Integrate IRL robot as Agent 1
- [ ] Submit 01-ats + 01-se3 Track 2
- [ ] Pitch rehearsal (5x)
- [ ] Record video backup (in case live fails)

---

*That's the plan. One document. Three phases. One video. One robot. One app. Two challenge submissions. Win.*
