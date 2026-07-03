# SCOUT — Dual Challenge Completion Strategy
## How to Dominate 01-ats (Graph Exploration) + 01-se3 Track 2 (Change Detection) with One Codebase

**TL;DR:** Both challenges share the same core concept — a robot explores an environment, then checks what changed. 01-ats is the algorithm challenge (submit Python code). 01-se3 Track 2 is the change detection challenge (submit Python code). You build **one Explorer class** that solves 01-ats with frontier-based multi-agent exploration + TSP surveillance routing. The **same change detection logic** from your robot's surveillance phase becomes your 01-se3 submission. The Rerun 3D visualizer (built into 01-ats) gives you a stunning frontend for free. A web dashboard ties both together for the judges.

---

## 1. Challenge 01-ats Deep Dive — What You're Actually Building

### 1.1 The Rules (From the Official Repo)

The challenge uses **3 UAVs** controlled by one centralized `Explorer` class. You implement `reset(starts, observations, seed)` and `step(observations, phase) -> list[3 actions]`. Each action is a single next-hop node ID. The simulator handles movement, collisions, and coverage tracking [^RULES^].

| Parameter | Value | What It Means |
|---|---|---|
| **n_agents** | 3 | Three UAVs in lockstep |
| **explore_threshold** | 0.9 | Must observe 90% of all nodes to finish Phase 1 |
| **surveil_threshold** | 0.9 | Must re-observe 90% of all nodes in Phase 2 |
| **k** | 4 | Can see nodes within 4 graph hops |
| **max_turn_deg** | 75° | Vision blocked by sharp corners |
| **drop_prob** | 0.0 | Perfect sensor (for now) |
| **Scoring** | makespan distance | Lowest max per-agent total distance wins |
| **max_steps** | 1000 | Episode aborts if not done by 1000 steps |

The scoring is **makespan** — the slowest UAV's total flight distance determines the score. This means you must **balance the workload** across all three UAVs. One UAV doing all the work while two idle will score poorly [^evaluator^].

### 1.2 The Two-Phase Architecture

```
PHASE 1: EXPLORE (phase == "explore")
├── Each UAV starts at a distinct random node
├── Each step: observe k-hop neighborhood, merge into local map
├── Pick next hop toward nearest frontier (unexplored boundary)
├── Continue until 90% of ALL nodes observed across all UAVs
└── Transition to Phase 2

PHASE 2: SURVEIL (phase == "surveil")
├── Surveillance counter resets to 0 (explore observations don't count)
├── Full graph is now known from Phase 1
├── Plan efficient re-observation routes (TSP-based)
├── Distribute targets across 3 UAVs to minimize makespan
├── Continue until 90% of ALL nodes re-observed
└── Episode ends — score = max per-agent distance
```

The **only carry-over** from Phase 1 to Phase 2 is **map knowledge**. The surveillance counter resets, but you now know the full graph topology, making the second pass much more efficient than exploring blind [^simulator^].

---

## 2. The Winning Algorithm: Frontier-Based Multi-Agent Exploration

### 2.1 Why Frontier-Based Exploration Wins

Frontier-based exploration is the **dominant approach** in multi-robot exploration research. The concept, pioneered by Yamauchi at the Naval Research Laboratory and refined by CMU's Multi-Robot Exploration team, defines **frontiers** as the boundary between explored and unexplored regions [^78^][^80^]. Robots are directed to these frontiers, systematically expanding the known map until complete coverage is achieved.

The key insight: **frontiers are where new information lives**. A robot at a frontier is one step away from discovering new nodes. This is fundamentally more efficient than random walk (the baseline policy) which wanders aimlessly [^random_walk^].

Research from DLR (German Aerospace Center) and Singapore Management University shows that **A* pathfinding to the nearest frontier** with a consistent heuristic achieves optimal exploration at each time step [^79^]. The heuristic `h(s) = max distance to any unexplored node` guides the search efficiently.

### 2.2 Multi-Agent Coordination Strategy

With 3 UAVs, coordination is critical. Uncoordinated frontier selection leads to all UAVs rushing to the same frontier, causing collisions and wasted movement. The winning strategy uses **decentralized frontier assignment with utility-based coordination** [^80^][^77^]:

| Strategy | How It Works | Why It Wins |
|---|---|---|
| **Nearest Frontier** (baseline) | Each UAV picks closest frontier | Simple, but collisions waste steps |
| **Utility-Based Assignment** | Each frontier gets a utility score; UAVs bid for frontiers | Prevents duplication, balances workload |
| **Market-Based** | UAVs auction frontiers based on travel cost | Optimal assignment, but complex |
| **Greedy Sequential** | UAV 0 picks best, UAV 1 picks next best (excluding UAV 0's target), etc. | Fast, no communication overhead, good balance |

For a 42-hour hackathon, **Greedy Sequential Frontier Assignment** is the sweet spot — it prevents collisions, balances workload, and is simple to implement correctly [^80^].

### 2.3 The Algorithm (Pseudocode)

```
EXPLORATION PHASE:
1. Merge all 3 UAVs' observations into a shared graph map
2. Identify FRONTIER nodes = explored nodes with unexplored neighbors
3. For each frontier, compute shortest path from each UAV's position (Dijkstra on known graph)
4. Assign frontiers greedily:
   a. UAV 0 → nearest frontier
   b. UAV 1 → nearest frontier NOT assigned to UAV 0
   c. UAV 2 → nearest frontier NOT assigned to UAV 0 or 1
5. Each UAV moves one step toward its assigned frontier (A* path)
6. If a UAV reaches its frontier and no new frontiers nearby → reassign
7. Repeat until 90% observed

SURVEILLANCE PHASE:
1. Full graph is known from exploration
2. Compute ALL unvisited nodes (need re-observation)
3. Partition nodes into 3 regions using K-means clustering (by position)
4. For each UAV's partition, solve TSP-nearest-neighbor for visiting order
5. Each UAV follows its route, re-observing nodes
6. When a node is observed by ANY UAV, mark it surveilled
7. Continue until 90% surveilled
```

### 2.4 Key Implementation Details

**Graph Representation:** Maintain a `networkx.Graph` for the known map. Merge nodes and edges from each observation. Use `obs.neighbors(node_id)` to get visible neighbors [^observation^].

**Frontier Detection:** A node is a frontier if it's in the known graph AND has at least one neighbor that is NOT yet observed. These are the "boundary" nodes between known and unknown territory.

**Pathfinding:** Use Dijkstra's algorithm on the **known graph** (not the ground truth) to find shortest paths. The `networkx.shortest_path` function with edge weights from `edge['cost']` works perfectly [^graph_io^].

**Collision Avoidance:** The simulator handles basic collision blocking (same node, edge swaps), but your policy should avoid sending two UAVs to the same target. The greedy sequential assignment solves this.

---

## 3. Challenge 01-se3 Track 2 — Change Detection Strategy

### 3.1 The Problem

01-se3 Track 2 asks for a system that compares two photos of the same scene (taken hours apart) and detects **tactically relevant changes** — vehicle movement, new assets, disturbed earth, fresh tracks — while ignoring noise like shadows moving, trees swaying, or lighting changes [^challenge_desc^].

### 3.2 The Approach: Classical CV + Smart Filtering

For a 42-hour hackathon, a **deep learning approach** (Siamese networks, ChangeNet) is overkill — you'd need training data, GPU time, and model tuning [^86^][^88^]. The winning approach uses **classical computer vision with intelligent filtering**:

| Step | Method | Purpose |
|---|---|---|
| **1. Alignment** | Feature matching (ORB/SIFT) + homography | Compensate for camera position differences |
| **2. Difference** | `cv2.absdiff()` + grayscale + Gaussian blur | Find pixel-level changes |
| **3. Threshold** | Otsu adaptive thresholding | Separate change from noise |
| **4. Filter** | Connected component analysis + area filtering | Remove small noise (shadows, leaves) |
| **5. Classify** | Size/shape heuristics | Label changes by tactical significance |
| **6. Output** | Change mask + bounding boxes + significance score | Present results |

This approach achieves **70-85% accuracy** on building change detection tasks when properly tuned [^84^], which is more than sufficient for a hackathon demo. The key is the **filtering step** — most of the "noise" in change detection comes from small, irrelevant pixel differences.

### 3.3 Tactical Significance Scoring

Not all changes matter equally. Your system should rank changes by operational relevance:

| Change Type | Detection Method | Significance |
|---|---|---|
| **Large object moved** | Large connected component (>5% of image) | HIGH — vehicle, equipment |
| **New object appeared** | Component in "after" not in "before" | HIGH — new asset, emplacement |
| **Object removed** | Component in "before" not in "after" | MEDIUM — clearing, evacuation |
| **Small shifts** | Small component, similar shape | LOW — natural movement |
| **Edge changes** | Thin line components | LOW — shadow, vegetation |

---

## 4. The Sexy Frontend — Three Visualization Layers

### 4.1 Layer 1: Rerun 3D (Built Into 01-ats — Zero Extra Work)

The 01-ats repo already includes a **stunning Rerun 3D visualizer**. Just run:

```bash
python run_eval.py --submission your_solution.py --graphs graphs/train --viz
```

You get [^85^][^89^]:
- **Real-time 3D graph** with fog-of-war (grey = unknown, blue = observed, green = surveilled)
- **3 quadcopter drones** moving through the graph with orientation
- **Flight trails** showing each UAV's path (different colors per drone)
- **Coverage metrics** plotted in real-time
- **Fireworks celebration** when the episode completes

This is your **secret weapon** — most teams will submit code and show terminal output. You'll show a **cinematic 3D visualization** that looks like a military C2 system. Rerun can even be **embedded in web pages** via iframe [^90^].

### 4.2 Layer 2: Web Dashboard (Streamlit — 2 Hours to Build)

A Streamlit dashboard that runs alongside your robot demo shows both challenge results in one place:

```
┌─────────────────────────────────────────────────────────────┐
│  SCOUT — Tactical Reconnaissance Dashboard                  │
├──────────────────────┬──────────────────────────────────────┤
│  01-ats: GRAPH EXP   │  01-se3: CHANGE DETECTION            │
│                      │                                      │
│  [Rerun 3D iframe]   │  [Before Image]    [After Image]     │
│  or screenshot       │                                      │
│                      │  [Change Heatmap]  [Alert Banner]    │
│  Coverage: 91% ✓     │                                      │
│  Makespan: 245.3m    │  Changes: 3 detected                 │
│  Phase: SURVEIL      │  - HIGH: Vehicle moved (box C)       │
│  UAVs: 3 active      │  - MED: Object removed (box A)       │
│                      │  - LOW: Shadow shift (ignored)       │
├──────────────────────┴──────────────────────────────────────┤
│  LIVE ROBOT FEED                                          │
│  [Camera feed with crosshair]  [Tactical Map]  [Mission Log]│
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Layer 3: Mobile App Prototype (React/Web)

A simple web-based mobile app mockup showing the operator interface:
- Mission select (CLEARING / RESCUE / SURVEIL)
- Live camera feed with threat detection overlay
- Action buttons (DETONATE / HOLD / MARK)
- Tactical map with robot position and alerts

---

## 5. The Unified Code Architecture

### 5.1 File Structure

```
scout_submission/
├── submission.py              # 01-ats: Explorer class (MAIN SUBMISSION)
├── change_detector.py         # 01-se3 Track 2: Change detection (SECOND SUBMISSION)
├── viz_dashboard.py           # Streamlit web dashboard
├── app_mockup/                # React mobile app prototype
│   ├── index.html
│   └── styles.css
└── README.md                  # Setup + running instructions
```

### 5.2 The Explorer Class (01-ats Submission)

The core of your 01-ats submission is the `Explorer` class. Here's the architecture:

```python
class Explorer:
    def __init__(self):
        self.known_graph = nx.Graph()      # Merged map from all observations
        self.observed = set()               # All nodes ever observed
        self.visited = [set(), set(), set()] # Per-UAV visited nodes
        self.positions = [0, 0, 0]          # Current position of each UAV
        self.frontier_targets = [None, None, None]  # Assigned frontier per UAV
        self.paths = [[], [], []]           # Planned A* paths per UAV

    def reset(self, starts, observations, seed=None):
        """Initialize from starting positions and first observations."""
        self.positions = list(starts)
        for i, obs in enumerate(observations):
            self._merge_observation(obs, i)

    def step(self, observations, phase):
        """Return 3 actions (one next-hop per UAV)."""
        # Merge latest observations
        for i, obs in enumerate(observations):
            self._merge_observation(obs, i)
            self.positions[i] = obs.position

        if phase == "explore":
            return self._explore_step()
        else:
            return self._surveil_step()

    def _explore_step(self):
        """Frontier-based exploration with greedy coordination."""
        # Find all frontier nodes
        frontiers = self._find_frontiers()
        if not frontiers:
            # No frontiers — all explored, just wait
            return self.positions[:]

        # Compute shortest path from each UAV to each frontier
        assignments = self._assign_frontiers_greedy(frontiers)

        # Move one step along assigned path
        actions = []
        for i in range(3):
            target = assignments[i]
            if target is None or target == self.positions[i]:
                actions.append(self.positions[i])  # Wait
            else:
                path = self._shortest_path(self.positions[i], target)
                if len(path) > 1:
                    actions.append(path[1])  # Next hop
                else:
                    actions.append(self.positions[i])  # Wait
        return actions

    def _surveil_step(self):
        """TSP-based surveillance with K-means partition."""
        # Find un-surveilled nodes
        unobserved = self.all_nodes - self.surveilled
        if not unobserved:
            return self.positions[:]  # Done

        # Distribute targets (only recompute if needed)
        if self.surveil_partitions is None:
            self.surveil_partitions = self._kmeans_partition(unobserved, 3)

        # Move toward next target in partition
        actions = []
        for i in range(3):
            targets = self.surveil_partitions[i]
            if not targets:
                actions.append(self.positions[i])
                continue
            # Nearest-neighbor: pick closest unvisited target
            nearest = min(targets, key=lambda n: self._distance(self.positions[i], n))
            path = self._shortest_path(self.positions[i], nearest)
            if len(path) > 1:
                actions.append(path[1])
            else:
                actions.append(self.positions[i])
        return actions
```

### 5.3 The Change Detector (01-se3 Track 2 Submission)

```python
import cv2
import numpy as np

class TacticalChangeDetector:
    """Detects tactically relevant changes between two images."""

    def __init__(self, min_change_area=500, significance_thresholds=None):
        self.min_change_area = min_change_area
        self.thresholds = significance_thresholds or {
            'HIGH': 0.05,   # >5% of image
            'MEDIUM': 0.01, # >1% of image
            'LOW': 0.005    # >0.5% of image
        }

    def detect(self, before_path, after_path):
        """
        Compare two images and return detected changes.
        Returns: list of dicts with {bbox, area, significance, type}
        """
        # Load and align images
        before = cv2.imread(before_path)
        after = cv2.imread(after_path)
        after_aligned = self._align_images(before, after)

        # Compute difference
        diff = cv2.absdiff(before, after_aligned)
        gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Adaptive thresholding
        _, thresh = cv2.threshold(blurred, 0, 255,
                                  cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Morphological operations to clean noise
        kernel = np.ones((5, 5), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)

        # Find connected components
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
            cleaned, connectivity=8
        )

        changes = []
        total_pixels = before.shape[0] * before.shape[1]

        for i in range(1, num_labels):  # Skip background (label 0)
            area = stats[i, cv2.CC_STAT_AREA]
            if area < self.min_change_area:
                continue  # Filter small noise

            x, y, w, h = (stats[i, cv2.CC_STAT_LEFT],
                         stats[i, cv2.CC_STAT_TOP],
                         stats[i, cv2.CC_STAT_WIDTH],
                         stats[i, cv2.CC_STAT_HEIGHT])

            area_ratio = area / total_pixels
            significance = self._classify_significance(area_ratio)

            change_type = self._classify_change_type(before, after_aligned,
                                                     (x, y, w, h), labels == i)

            changes.append({
                'bbox': (x, y, w, h),
                'area': area,
                'area_ratio': area_ratio,
                'significance': significance,
                'type': change_type
            })

        # Sort by significance (HIGH first)
        changes.sort(key=lambda c: ['HIGH', 'MEDIUM', 'LOW'].index(c['significance']))
        return changes

    def _align_images(self, before, after):
        """Use ORB feature matching to align 'after' to 'before'."""
        # Convert to grayscale
        before_gray = cv2.cvtColor(before, cv2.COLOR_BGR2GRAY)
        after_gray = cv2.cvtColor(after, cv2.COLOR_BGR2GRAY)

        # ORB feature detection
        orb = cv2.ORB_create(5000)
        kp1, des1 = orb.detectAndCompute(before_gray, None)
        kp2, des2 = orb.detectAndCompute(after_gray, None)

        if des1 is None or des2 is None or len(kp1) < 10 or len(kp2) < 10:
            return after  # Can't align, return as-is

        # Match features
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        matches = sorted(matches, key=lambda x: x.distance)

        # Use top matches for homography
        if len(matches) < 10:
            return after

        src_pts = np.float32([kp1[m.queryIdx].pt for m in matches[:50]]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in matches[:50]]).reshape(-1, 1, 2)

        # Find homography
        H, mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, 5.0)
        if H is not None:
            aligned = cv2.warpPerspective(after, H,
                (before.shape[1], before.shape[0]))
            return aligned
        return after

    def _classify_significance(self, area_ratio):
        if area_ratio >= self.thresholds['HIGH']:
            return 'HIGH'
        elif area_ratio >= self.thresholds['MEDIUM']:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _classify_change_type(self, before, after, bbox, mask):
        """Classify what kind of change occurred."""
        x, y, w, h = bbox
        before_roi = before[y:y+h, x:x+w]
        after_roi = after[y:y+h, x:x+w]

        # Compare color distributions
        before_mean = np.mean(before_roi, axis=(0, 1))
        after_mean = np.mean(after_roi, axis=(0, 1))
        color_shift = np.linalg.norm(before_mean - after_mean)

        if color_shift > 100:
            return 'OBJECT_REPLACED'  # Significant color change
        elif np.mean(before_roi) < np.mean(after_roi):
            return 'OBJECT_REMOVED'   # Became brighter (background)
        else:
            return 'OBJECT_ADDED'     # Became darker (new object)

    def visualize(self, before, after, changes, output_path=None):
        """Create side-by-side visualization with change overlays."""
        before_vis = before.copy()
        after_vis = after.copy()

        colors = {'HIGH': (0, 0, 255), 'MEDIUM': (0, 165, 255), 'LOW': (0, 255, 0)}

        for change in changes:
            x, y, w, h = change['bbox']
            color = colors[change['significance']]
            cv2.rectangle(before_vis, (x, y), (x+w, y+h), color, 2)
            cv2.rectangle(after_vis, (x, y), (x+w, y+h), color, 2)
            label = f"{change['significance']}: {change['type']}"
            cv2.putText(after_vis, label, (x, y-5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # Create combined view
        combined = np.hstack([before_vis, after_vis])

        # Add legend
        legend_y = 30
        for sig, color in colors.items():
            cv2.rectangle(combined, (10, legend_y), (30, legend_y+15), color, -1)
            cv2.putText(combined, sig, (35, legend_y+12),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            legend_y += 20

        if output_path:
            cv2.imwrite(output_path, combined)
        return combined
```

---

## 6. The Build Plan: 42 Hours to Glory

### 6.1 Hour-by-Hour Breakdown

| Time | Task | Output |
|---|---|---|
| **Fri 18:00-20:00** | Understand 01-ats repo, run baseline, study API | `random_walk.py` runs successfully |
| **Fri 20:00-23:00** | Build frontier detection + Dijkstra pathfinding | `_find_frontiers()`, `_shortest_path()` work |
| **Fri 23:00-01:00** | Build greedy multi-agent coordination | 3 UAVs explore without collisions |
| **Sat 09:00-12:00** | Build surveillance phase (K-means + TSP NN) | Phase 2 runs, coverage hits 90% |
| **Sat 12:00-14:00** | Test on all training graphs, tune parameters | Scores improve on all 6 graphs |
| **Sat 14:00-15:00** | **SUBMIT 01-ats** — upload `submission.py` | Side Quest 1 done |
| **Sat 15:00-17:00** | Build change detector (`change_detector.py`) | OpenCV pipeline works on test images |
| **Sat 17:00-18:00** | Test change detection on robot's before/after photos | Detection accuracy validated |
| **Sat 18:00-19:00** | **SUBMIT 01-se3 Track 2** — upload `change_detector.py` | Side Quest 2 done |
| **Sat 19:00-21:00** | Build Streamlit dashboard | Web dashboard shows both results |
| **Sat 21:00-23:00** | Integrate robot hardware with algorithm | Robot walks, camera works |
| **Sun 09:00-11:00** | Rehearse 3-minute demo | Smooth transitions, no bugs |
| **Sun 11:00-12:00** | Final tests, pack everything | Ready to present |

### 6.2 Testing Your 01-ats Solution

```bash
# Install dependencies
uv sync  # or pip install -e .

# Run your solution on training graphs
python run_eval.py --submission submission.py --graphs graphs/train --quiet

# With visualization (for demo recording)
python run_eval.py --submission submission.py --graphs graphs/train/basic.json --viz --step-delay 0.1

# Single UAV debug mode
python run_eval.py --submission submission.py --graphs graphs/train/basic.json --n-agents 1

# Export results to JSON
python run_eval.py --submission submission.py --graphs graphs/train --quiet --output results.json
```

### 6.3 Key Parameters to Tune

| Parameter | What It Controls | Tuning Strategy |
|---|---|---|
| **Frontier selection weight** | How aggressively UAVs pursue distant frontiers | Higher = better coverage, but longer paths |
| **Surveillance partition method** | How nodes are distributed among UAVs | K-means by position works well |
| **Replan frequency** | How often surveillance routes are recomputed | Replan when a partition is nearly complete |
| **Wait vs. explore tradeoff** | Whether UAVs wait for others or keep exploring | Balance to minimize makespan |

---

## 7. The Demo Flow: How to Present Both Challenges

### 7.1 The 3-Minute Pitch Structure

**[0:00-0:15] Hook — The Problem**
> "Buildings are the deadliest environment for soldiers. We don't know what's inside. Current solutions: send a human, or buy a $75,000 robot. We're building SCOUT — a €200 autonomous reconnaissance platform."

**[0:15-0:45] Challenge 01-ats — Graph Exploration Algorithm**
> "Challenge 01-ats from ATS GmbH: 3 UAVs must explore an unknown 3D graph and then surveil it efficiently. Our solution uses frontier-based exploration with greedy multi-agent coordination. Here's the visualization:"

*Show Rerun 3D — drones exploring the graph in real-time*

**[0:45-1:15] Challenge 01-se3 Track 2 — Change Detection**
> "Challenge 01-se3 Track 2 from SE3 Labs: detect tactically relevant changes between two passes. Our system uses computer vision with intelligent filtering. Here's a before/after comparison:"

*Show dashboard — before image, after image, change heatmap, significance rankings*

**[1:15-2:00] The Robot Demo**
> "This isn't just simulation. Here's the physical robot running the same algorithm:"

*Robot walks table, explores boxes, takes photos, detects changes between passes*

**[2:00-2:30] The Mobile App**
> "The same platform in every soldier's pocket. One app. Three missions."

*Show mobile app — mission select, live feed, threat detection, operator controls*

**[2:30-3:00] The Close**
> "Two challenge submissions. One working robot. One vision. Built in 42 hours at EDTH Munich."

### 7.2 What Judges See vs. What You Built

| What Judges See | What's Actually Happening | Why It Works |
|---|---|---|
| 3D drones exploring a graph | Python simulation with networkx | Rerun makes it look cinematic |
| Before/after change detection | OpenCV absdiff + thresholding | Smart filtering makes it accurate |
| Robot walking and "thinking" | Hardcoded tape path + state machine | The robot is the emotional anchor |
| Military-grade dashboard | Streamlit + some CSS | Looks professional, costs nothing |

---

## 8. Competitive Advantages

### 8.1 Why Your 01-ats Solution Will Score Well

| Advantage | How You Achieve It | Expected Impact |
|---|---|---|
| **Frontier-based > random walk** | Systematic exploration vs. wandering | 40-60% distance reduction |
| **Multi-agent coordination** | Greedy assignment prevents collisions | Balanced workload, lower makespan |
| **A* pathfinding** | Shortest paths on known graph | Minimal wasted movement |
| **K-means surveillance partition** | Even distribution of re-observation targets | Parallel surveillance, faster completion |
| **TSP nearest-neighbor** | Efficient route within each partition | Near-optimal individual routes |

### 8.2 Why Your 01-se3 Solution Is Competitive

| Advantage | How You Achieve It | Expected Impact |
|---|---|---|
| **Image alignment** | ORB feature matching + homography | Handles camera position variation |
| **Otsu adaptive thresholding** | Automatically finds optimal threshold | Works across lighting conditions |
| **Morphological filtering** | Open/close operations clean noise | Removes shadows, vegetation artifacts |
| **Connected component analysis** | Area-based filtering | Only significant changes reported |
| **Tactical significance scoring** | Size-based classification | Prioritizes operational relevance |

---

## 9. Risk Mitigation

| Risk | Mitigation |
|---|---|
| **Algorithm too complex, doesn't work** | Start with working random_walk, incrementally add frontier logic. Test after each addition. |
| **Multi-agent collisions cause stalls** | Greedy assignment prevents same-target conflicts. Fallback to "wait" if blocked. |
| **Surveillance phase too slow** | K-means ensures parallel work. Tune partition method if needed. |
| **Change detection false positives** | Tune `min_change_area` threshold. Morphological operations clean noise. |
| **Rerun viz not working at venue** | Record a video of the viz beforehand. Show video as backup. |
| **Robot falls off table during demo** | Large table, edge detection with ultrasonic, practice 10+ times. |

---

## 10. Submission Checklist

### 01-ats Submission
- [ ] `submission.py` with `Explorer` class
- [ ] `reset(starts, observations, seed)` implemented
- [ ] `step(observations, phase)` returns list of 3 ints
- [ ] Runs on all 6 training graphs without errors
- [ ] Scores better than random_walk baseline
- [ ] Tested with `--n-agents 3` (official setting)
- [ ] Include team name and member names in file header

### 01-se3 Track 2 Submission
- [ ] `change_detector.py` with `TacticalChangeDetector` class
- [ ] `detect(before_path, after_path)` returns list of changes
- [ ] Each change has: bbox, area, significance, type
- [ ] `visualize()` creates side-by-side comparison
- [ ] Tested on robot's before/after photos
- [ ] Filter noise effectively (shadows, lighting)
- [ ] Report with methodology and results

### Demo Day
- [ ] Robot demo rehearsed 5+ times
- [ ] Rerun 3D visualization recorded (backup)
- [ ] Dashboard running and tested
- [ ] Mobile app mockup ready
- [ ] 3-minute pitch memorized

---

*This strategy combines frontier-based multi-agent graph exploration (the dominant approach in robotics research) with classical computer vision change detection (proven, fast, hackathon-appropriate). The Rerun 3D visualizer provides a stunning frontend for 01-ats at zero extra cost. A Streamlit dashboard ties both challenges together for a cohesive presentation. Build the core algorithm first, submit early, then polish the demo.*
