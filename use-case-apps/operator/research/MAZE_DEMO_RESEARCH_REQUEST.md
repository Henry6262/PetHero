# Swarm Research Request — Operator Maze Demo

## Mission

We are building a **single-screen C2 demo** for the EDTH Munich 2026 hackathon. A quadruped robot (SunFounder PiCrawler, Raspberry Pi 5, ultrasound sensor, Raspberry Pi AI camera) must navigate a circular bottle-crate maze (~3 m × 3 m), find simulated landmines, and stream progress to the Operator dashboard.

We need the best off-the-shelf tools, libraries, and integration patterns for **mapping**, **navigation**, **mine detection**, and **live dashboard visualization**.

---

## Deliverables

For each research track below, produce:

1. **Options matrix**: tools/libraries with pros/cons, maturity, license, hardware requirements.
2. **Recommended stack**: your top 1–2 choices with justification.
3. **Integration notes**: how each piece connects to the others (input/output formats, APIs, latency).
4. **Risk list**: what breaks first and how to mitigate.
5. **Concrete next step**: the exact command/script/config to try first.

---

## Research Track 1 — From Photos to a Scaled Top-Down Map

**Goal**: turn 80–100 hand-held photos of a circular crate maze into a scaled orthophoto / occupancy grid.

**Questions**

- Which photogrammetry pipeline is fastest to install and run on a laptop with 8–16 GB RAM?
  - WebODM, Meshroom, COLMAP, OpenMVG/OpenMVS, RealityCapture, Metashape.
- Which produces the cleanest **orthophoto** (top-down image) without GPS?
- How do we scale the model to real-world meters using a known reference length?
- What is the minimum viable number of photos and overlap percentage?
- Are there smartphone apps (Scaniverse, Polycam, Kiri Engine) that export scaled orthophotos or point clouds?

**Output format we need**

A PNG/TIFF orthophoto plus `px_per_m`. We already have a converter (`scripts/orthophoto_to_maze_grid.py`) that turns this into the JSON grid format used by Operator.

---

## Research Track 2 — Robot Navigation on a Known Grid

**Goal**: given the occupancy grid, make the PiCrawler walk from a start cell to a target zone and find mines.

**Questions**

- Is A* on a grid sufficient, or should we use Dijkstra / Theta* / RRT / potential fields?
- How do we handle open-loop gait error on the PiCrawler (no wheel encoders)?
  - Step-count calibration, IMU fusion, visual odometry, AprilTag localization.
- What is the best way to integrate the ultrasound sensor?
  - Simple stop-and-replan on obstacle, or local replanning with D*
- Can the Raspberry Pi AI camera run a small on-device object-detection model for mines (colored objects) without frying the Pi 5?
- Should navigation run on the Pi or on the laptop? Trade-offs for latency, reliability, and ease of debugging.

**Current baseline**

We already have:
- `scripts/maze_solver.py` — A* → PiCrawler gait commands.
- `scripts/picrawler_bridge.py` — polls Operator backend, executes gaits, reads ultrasound.
- `src/core/maze-engine.ts` — backend state machine.

Your job is to identify the **minimal upgrade** that makes this reliable enough for a live demo.

---

## Research Track 3 — Live Dashboard Visualization

**Goal**: the Operator dashboard should show the map, planned path, robot pose, discovered mines, and camera feed in real time.

**Questions**

- What is the best way to render a 2D occupancy grid + path + robot + discoveries in a React/TypeScript frontend?
  - HTML5 Canvas, SVG, PixiJS, Three.js (orthographic), deck.gl, Leaflet/MapLibre with custom tiles.
- How do we animate the robot moving cell-by-cell as telemetry arrives?
- How do we represent "fog of war" / discovered areas vs. known map?
- What is the cleanest way to overlay the live camera feed (MJPEG/WebRTC) on the map?
- Are there existing React libraries for robotics dashboards (roslibjs, foxglove, etc.) that we can borrow UI patterns from?

**Current baseline**

`apps/web/src/components/MazeDemoView.tsx` renders the grid, path, start/end, and robot pose. It needs polish and animation.

---

## Research Track 4 — Mine / Object Detection at the Edge

**Goal**: the robot identifies colored objects (simulated mines) in the maze using the Raspberry Pi AI camera and/or ultrasound.

**Questions**

- What models run on the Raspberry Pi AI Camera (IMX500) out of the box?
- What is the simplest pipeline for color-based object detection on Pi 5 with the AI camera?
- Can we do inference directly on the Pi 5 (YOLOv8n, MobileNet SSD, MediaPipe) at usable frame rates?
- How do we fuse ultrasound proximity with camera detection to reduce false positives?
- What colored markers work best under indoor lighting for reliable detection?

**Current baseline**

`scripts/picrawler_bridge.py` has a placeholder OpenCV color detector. We need a real edge-detection strategy.

---

## Research Track 5 — End-to-End Integration Architecture

**Goal**: one coherent system from camera → map → plan → robot → dashboard.

**Questions**

- Should the Pi run ROS 2, a minimal Python state machine, or just a bridge that polls the Operator backend?
- What transport is most reliable for the demo: HTTP polling, WebSocket, MQTT, or ZeroMQ?
- How do we handle the demo laptop and the Pi being on the same Wi-Fi network (or the Pi as AP)?
- What is the fastest recovery path if the robot drifts or misses a turn during the live demo?
- Can we record a "golden run" and replay it as a fallback if live navigation fails?

---

## Constraints

- **Hardware**: Raspberry Pi 5, SunFounder PiCrawler hat + servos, ultrasound HC-SR04 via robot_hat pins D2/D3, Raspberry Pi AI camera.
- **Software stack**: Operator is Bun/TypeScript/Hono backend + React frontend. Robot code is Python 3 on Raspberry Pi OS.
- **Time**: we need a working demo in days, not weeks.
- **No-cloud rule**: the demo must work offline on a local network.
- **No ROS dependency unless it clearly saves time**.

---

## How to Report Back

Structure your findings as:

```markdown
# Track X — Title

## Executive summary
1-sentence recommendation.

## Options matrix
| Tool | Maturity | Install complexity | Output | License | Best for |
|------|----------|-------------------|--------|---------|----------|

## Recommended stack
Tool A for X, Tool B for Y.

## Integration sketch
[ASCII or bullet flow]

## Risks and mitigations
- Risk: ... → Mitigation: ...

## First command to try
```bash
...
```
```

When finished, drop the markdown file in `use-case-apps/operator/research/` and tag the file with the track name.
