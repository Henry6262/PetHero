# SCOUT — Research Package for Local Coding Agent
## Everything you need to build, submit, and demo at EDTH Munich 2026

---

## 1. CHALLENGE 01-ats — Graph Exploration (Primary)

### Repo
```
git clone https://github.com/SamEberl/graph_explo.git
```

### Key Files to Read
| File | What It Has |
|---|---|
| `exploration_challenge/params.toml` | Config: 3 UAVs, k=4, explore=90%, surveil=90%, max_steps=1000 |
| `exploration_challenge/policies/random_walk.py` | Baseline policy — copy and replace |
| `exploration_challenge/observation.py` | `Observation` dataclass API |
| `exploration_challenge/evaluator.py` | `run_episode()`, scoring logic |
| `exploration_challenge/simulator.py` | `Simulator` class, movement rules |
| `docs/RULES.md` | Complete rulebook |

### Your API Contract
```python
class Explorer:
    def reset(self, starts: list[int], observations: list[Observation], seed: int | None) -> None
    def step(self, observations: list[Observation], phase: str) -> list[int]  # 3 actions
```

### Observation Fields
```python
obs.position        # current node id
obs.position_xyz    # (x, y, z) tuple
obs.nodes           # tuple of ObservedNode(id, x, y, z)
obs.edges           # tuple of ObservedEdge(u, v, cost)
obs.visited         # tuple of node ids this UAV has been at
obs.neighbors(n)    # list of visible neighbor node ids
```

### Key Rules
- 3 UAVs, lockstep movement, one action per UAV per tick
- Action = single next-hop node id (known neighbor or current position to wait)
- Score = makespan distance (max per-agent total distance) — LOWER IS BETTER
- Exploration ends at 90% observed. Surveillance starts fresh (counter resets).
- Collisions: same node blocked, edge swaps blocked. Lower agent_id wins.
- Invalid actions = episode aborts, score = inf

### How to Run
```bash
cd graph_explo

# Install deps
pip install networkx  # (or uv sync if you have uv)

# Run your submission
python run_eval.py --submission submission.py --graphs graphs/train --quiet

# With 3D viz (Rerun)
python run_eval.py --submission submission.py --graphs graphs/train/basic.json --viz

# Single UAV debug
python run_eval.py --submission submission.py --graphs graphs/train/basic.json --n-agents 1

# Export JSON results
python run_eval.py --submission submission.py --graphs graphs/train --quiet --output results.json
```

### Training Graphs
| Graph | Nodes | Edges | Notes |
|---|---|---|---|
| `basic.json` | 2,118 | 13,587 | Smallest, start here |
| `obstacles.json` | 1,884 | 11,605 | Obstructed paths |
| `sparse.json` | 2,283 | 11,311 | Sparse connectivity |
| `double_room.json` | 7,123 | 44,444 | Largest, test last |
| `warehouse.json` | 2,282 | 12,435 | Structured layout |
| `large.json` | 3,912 | 20,179 | Medium-large |

### Algorithm Strategy (What We Researched)

**EXPLORATION PHASE:**
- Frontier = observed nodes that have NOT been visited yet
- Each UAV greedily picks nearest frontier (Euclidean distance, not Dijkstra — faster)
- When no frontiers, move to unvisited neighbors to expand view
- The k=4 sensor range means visiting a frontier node reveals ~50-200 new nodes

**SURVEILLANCE PHASE:**
- Pre-plan routes at phase start using nearest-neighbor TSP
- Partition nodes among 3 UAVs by nearest-start (Voronoi-style)
- Each UAV follows its route, skipping already-surveilled nodes
- When route exhausted, greedily pick nearest remaining target

**Performance targets:**
- basic graph: ~150-250m makespan (explore + surveil)
- Explore should finish in ~80-120 steps
- Surveil should finish in ~50-100 steps
- Total < 1000 steps, score < 300m

**Critical optimization:**
- Don't run Dijkstra for frontier selection — use Euclidean distance
- Only run Dijkstra for the actual next-hop path (one per UAV per step)
- Cache shortest paths to avoid recomputation
- The graph has 2000-7000 nodes — Dijkstra on the full graph is O(E log V) which is fine for 1-3 calls per step

---

## 2. CHALLENGE 01-se3 Track 2 — Change Detection (Secondary)

### The Problem
Compare two photos of the same scene, detect tactically relevant changes, ignore noise.

### Algorithm Pipeline
1. **Align images** — ORB feature matching + homography (RANSAC)
2. **Compute difference** — `cv2.absdiff()` → grayscale → Gaussian blur
3. **Threshold** — Otsu adaptive thresholding (`cv2.THRESH_BINARY + cv2.THRESH_OTSU`)
4. **Clean noise** — Morphological open + close operations
5. **Extract components** — `cv2.connectedComponentsWithStats()`
6. **Filter by size** — `min_change_area = 500` pixels (tune this)
7. **Classify significance** — by area ratio: HIGH (>5%), MEDIUM (>1%), LOW (>0.5%)
8. **Classify type** — OBJECT_REPLACED (color shift >80), OBJECT_REMOVED (brighter), OBJECT_ADDED (darker)

### Key OpenCV Functions
```python
cv2.ORB_create(nfeatures=5000)                    # Feature detection
cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)  # Feature matching
cv2.findHomography(src, dst, cv2.RANSAC, 5.0)     # Image alignment
cv2.warpPerspective(img, H, (w, h))               # Apply alignment
cv2.absdiff(img1, img2)                           # Pixel difference
cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)             # Grayscale
cv2.GaussianBlur(gray, (5,5), 0)                  # Noise reduction
cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)  # Threshold
cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)  # Remove small noise
cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel) # Fill holes
cv2.connectedComponentsWithStats(mask, 8)          # Extract regions
```

### What They Evaluate
- Detection accuracy on hold-out test images
- False positive rate (noise filtering)
- Tactical relevance of reported changes
- Report with methodology

### For Your Robot Demo
- Pass 1: robot takes photo of each box → save as `before_{node}.jpg`
- Pass 2: robot takes photo of each box → save as `after_{node}.jpg`
- Run change detector on each pair
- Show side-by-side with change overlays
- This IS your 01-se3 submission — real photos from real robot

---

## 3. THE ROBOT — PiCrawler + Pi AI Camera

### Hardware You Have
| Component | Spec | Code Access |
|---|---|---|
| PiCrawler kit | 12 servos, quadruped walking | `from picrawler import PiCrawler` |
| Raspberry Pi 4 | Python 3, Linux | Standard Python |
| Pi AI Camera (IMX500) | Sony neural accelerator, 30 FPS on-device | `from picamera2 import Picamera2` |
| Ultrasonic sensor | Obstacle/edge detection | `picrawler` built-in |

### PiCrawler Code Examples (from sunfounder/picrawler GitHub)
```python
from picrawler import PiCrawler
import time

robot = PiCrawler()

# Basic movement
robot.forward(steps=5)
robot.backward(steps=3)
robot.turn_left(degrees=30)
robot.turn_right(degrees=30)
robot.stop()

# Calibration (run once)
# python 0_calibration.py

# Custom steps (for precise positioning)
# python 14_do_step.py
# robot.do_step([[x1,y1,z1], [x2,y2,z2], ...])
```

### Pi AI Camera (IMX500)
```python
from picamera2 import Picamera2
from picamera2.devices.imx500 import IMX500

cam = Picamera2(1)
cam.configure(cam.create_preview_configuration())
cam.start()

# Capture frame
frame = cam.capture_array()

# The IMX500 runs MobileNet SSD on-sensor at 30 FPS
# Detections available via post-processing files
# See: https://github.com/raspberrypi/picamera2
```

### Robot State Machine for Demo
```
PATROL -> walk tape path
  |
  v
AT_NODE -> stop, take photo, classify
  |
  +---> RED card detected -> THREAT (for clearing demo)
  +---> BLUE card detected -> CLEAR (for rescue demo)
  +---> YELLOW card detected -> FRIENDLY
  |
  v
NEXT_NODE -> continue patrol
```

---

## 4. THE DASHBOARD / FRONTEND

### Option A: Rerun 3D (Built In — Easiest)
```bash
pip install rerun-sdk
python run_eval.py --submission submission.py --graphs graphs/train --viz
```
- Shows 3D graph, drones, trails, coverage metrics in real-time
- Can record a video of the visualization
- Looks incredibly professional for demo

### Option B: Streamlit Dashboard (For Robot Demo)
```bash
pip install streamlit
streamlit run dashboard.py
```
```python
import streamlit as st
# Live camera feed, tactical map, mission log, alert banners
# 2-hour build, looks professional
```

### Option C: Mobile App Mockup (React/Web)
- Simple HTML/CSS/JS showing the operator interface
- Mission select, live feed, action buttons
- Runs in any browser

---

## 5. KEY RESEARCH SOURCES

### Multi-Agent Graph Exploration
- **Yamauchi 1997** — Frontier-based exploration (the foundation): `https://www.cs.cmu.edu/~motionplanning/papers/sbp_papers/integrated1/yamauchi_frontier.pdf`
- **CMU Multi-Robot Lab** — Frontier detection and distributed coverage: `https://www.cs.cmu.edu/~motionplanning/papers/sbp_papers/integrated1/yamauchi_frontier.pdf`
- **DLR/SMU A* Frontier Exploration** — Optimal frontier selection: `https://pure.tudelft.nl/ws/portalfiles/portal/98286650/1-s2.0-S0921889023000766-main.pdf`
- **Frontier-vs-Random paper**: `https://openurl.ebsco.com/EPDB%3Agcd%3A6%3A21436248/detailv2?sid=ebsco%3Aplink%3Ascholar&id=ebsco%3Agcd%3A219719038&crl=c`

### TSP / Surveillance Routing
- **Christofides algorithm** — 1.5-approximation for TSP: `https://en.wikipedia.org/wiki/Christofides_algorithm`
- **Nearest Neighbor TSP** — Simple, fast, works well in practice: standard algorithm
- **Multi-agent TSP partitioning** — Voronoi decomposition approach

### Change Detection
- **OpenCV change detection tutorial**: `https://pyimagesearch.com/2014/07/28/a-slic-superpixel-tutorial-using-python/` (and related posts on pyimagesearch.com)
- **Connected components analysis**: `https://docs.opencv.org/4.x/d3/dc0/group__imgproc__shape.html`
- **Otsu thresholding**: `https://docs.opencv.org/4.x/d7/d4d/tutorial_py_thresholding.html`
- **Image alignment with ORB**: `https://docs.opencv.org/4.x/d1/d89/tutorial_py_orb.html`

### Rerun Visualization
- **Rerun SDK docs**: `https://rerun.io/docs/getting-started/what-is-rerun`
- **Python quickstart**: `https://rerun.io/docs/getting-started/quick-start/python`
- **Web embedding**: `https://rerun.io/docs/howto/browser/`

### PiCrawler
- **GitHub repo**: `https://github.com/sunfounder/picrawler`
- **20 example programs** included: `1_move.py`, `4_avoid.py`, `5_display.py`, `14_do_step.py`, `17_voice_active_crawler_gpt.py`
- **Ezblock Studio**: visual programming environment

### Pi AI Camera (IMX500)
- **Official docs**: `https://www.raspberrypi.com/documentation/accessories/ai-camera.html`
- **Picamera2 repo**: `https://github.com/raspberrypi/picamera2`
- **Getting started guide**: `https://www.jeffgeerling.com/blog/2024/raspberry-pi-ai-camera-review`
- **Post-processing (object detection)**: `https://github.com/raspberrypi/picamera2/tree/main/examples/imx500`

---

## 6. DEPENDENCIES

```
networkx>=3.0       # Graph operations
numpy>=1.24         # Math
opencv-python>=4.8  # Change detection (01-se3)
rerun-sdk>=0.15     # 3D visualization (optional)
streamlit>=1.28     # Dashboard (optional)
picrawler           # Robot control (on Pi only)
picamera2           # Camera (on Pi only)
```

---

## 7. SUBMISSION CHECKLIST

### 01-ats Submission
- [ ] `submission.py` with `Explorer` class
- [ ] `reset()` and `step()` implemented correctly
- [ ] Returns exactly 3 ints per step
- [ ] Runs on all 6 training graphs without error
- [ ] Scores better than random_walk baseline
- [ ] Include team name in file header

### 01-se3 Track 2 Submission
- [ ] `change_detector.py` with `TacticalChangeDetector` class
- [ ] `detect(before, after)` returns list of changes
- [ ] `visualize()` creates side-by-side comparison
- [ ] Tested on real robot photos
- [ ] Report with methodology

### Demo
- [ ] Robot walks tape path reliably
- [ ] Camera takes clear photos
- [ ] Change detection works on before/after
- [ ] Dashboard shows live feed + results
- [ ] 3-minute pitch rehearsed

---

## 8. QUICK REFERENCE — Common Issues

**Dijkstra too slow?**
- Use Euclidean distance for frontier selection (O(1) vs O(E log V))
- Only run Dijkstra for the chosen target's next-hop
- Cache paths: `self._path_cache[(src, dst)] = path`

**Surveillance not completing?**
- The surveillance counter resets at phase transition
- A node must be within k=4 hops DURING surveillance to count
- Pre-plan routes, don't just greedily pick nearest
- Each UAV should cover a different region

**Robot falls off table?**
- Use large table
- Add edge detection with ultrasonic sensor
- Practice 10+ times

**Camera doesn't detect objects?**
- Check lighting at venue
- Use high-contrast cards (red, blue, yellow)
- Tune color thresholds for venue lighting

---

## 9. THE PITCH (Memorize This)

> "Challenge 01-ats from ATS GmbH: 3 UAVs explore an unknown 3D graph and surveil it efficiently. Our frontier-based algorithm with greedy coordination achieves 90% coverage with minimal makespan distance. We physically demonstrate it on a quadruped robot. Challenge 01-se3 Track 2 from SE3 Labs: detect tactically relevant changes between patrol passes. Our computer vision pipeline filters noise and classifies changes by significance. Same robot, same codebase, two challenges, one vision."

---

*Take this to your coding agent. Build the Explorer class first, test on basic.json, optimize, then add change detection. You've got this.*
