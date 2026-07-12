# Research Request — Indoor / Built-Environment Mapping, Exploration & 3D Visualization for Operator

**Project:** Operator (`use-case-apps/operator/`)  
**Requester:** Henry  
**Goal:** Define the architecture and choose the best-available building/farm/warehouse/tunnel mapping stack for a low-cost quadruped robot + web-based C2 dashboard.

---

## 1. Context

Operator is a browser-based command-and-control dashboard for tactical and robotic operations. The current demo focuses on **room clearance**: a SunFounder PiCrawler quadruped with a Raspberry Pi AI Camera (Sony IMX500) walks through a few cardboard-box “rooms,” streams video, and reports contacts to a React dashboard.

The next phase is to add a **building / structure view mode** that generalizes this to houses, warehouses, farms with multiple buildings, tunnels, and multi-floor interiors. The long-term vision is:

- A robot enters an unknown structure and builds a map as it moves.
- The C2 operator sees a 3D representation of the building: floors, rooms, walls, doors, corridors.
- The operator can rotate, slice through walls, toggle floor visibility, and inspect rooms.
- The system computes useful metrics such as scanned vs unscanned area, floor surface area, and room connectivity.
- The robot reasons about completeness: if a door is closed, the room behind it is marked “unchecked”; if all visible doors are open and scanned, the area is marked “clear.”
- The same concept scales to a farm (multiple buildings) or a warehouse (large open halls + aisles).

Hardware that is available today:
- Raspberry Pi 5 on the PiCrawler.
- Raspberry Pi AI Camera (IMX500) — 12 MP sensor with on-chip AI inference.
- No LiDAR currently mounted, but cheap 2D LiDARs (LD06, YDLIDAR X2/X3) or depth cameras (OAK-D-Lite, Intel RealSense D435f) could be bought in Berlin if strongly recommended.

Software stack:
- Robot: Python, PiCrawler gait library, picamera2, OpenCV.
- Backend: Bun + Hono (TypeScript), in-memory state.
- Frontend: React 19, Three.js, MapLibre GL JS.

Research agents should treat this as a **deep survey + recommendation** exercise, not an implementation task. We need a ranked shortlist of approaches, concrete repos/commands, and a realistic scope for a 24–48 hour demo.

---

## 2. Problem statement

We need to solve four tightly coupled problems:

### 2.1 Localize and map with a low-cost legged robot
The robot has no wheel encoders, only an IMU inside the PiCrawler controller and a monocular AI camera. We need to know:
- Where the robot is inside the building.
- What the 3D shape of the building is.
- How to keep drift low enough that walls and doors stay aligned.

Scale ambiguity is a major issue for monocular SLAM. We need to understand whether IMX500 metadata, IMU fusion, or known gait distances can provide scale, or whether a cheap depth sensor is mandatory.

### 2.2 Build a web-friendly 3D representation
The operator dashboard must render the building in a browser. Requirements:
- Show floors as separate layers that can be toggled.
- Show walls, rooms, doors, corridors.
- Allow orbit, pan, zoom, and “x-ray / cutaway” views.
- Scale to at least a medium house or small warehouse.
- Prefer open-source, permissive-license libraries compatible with React + Vite.

### 2.3 Reason about coverage and door state
The robot must decide what is “done” and what is not:
- Maintain a list of observed doors and their state (open / closed / unknown).
- Mark rooms behind closed doors as “unchecked.”
- Mark rooms the robot has physically entered and scanned as “cleared.”
- Compute scanned surface area and remaining area.
- Guide the robot to the nearest frontier or unvisited room.

### 2.4 Operate within severe compute limits
The Pi 5 has CPU and RAM limits. Heavy GPU compute is not available onboard. Cloud inference is possible but undesirable for a defense/hackathon demo. Any SLAM, reconstruction, or scene-understanding pipeline must either run on the Pi 5 or be streamed to the laptop for processing.

---

## 3. Research questions

### 3.1 SLAM for a monocular/low-cost legged platform
- Which visual SLAM systems work on a Raspberry Pi 5 with a monocular camera?
  - ORB-SLAM3, RTAB-Map, OpenVSLAM, OV²SLAM, etc.
  - Compare accuracy, robustness, drift, relocalization, and compute cost.
- Can the IMX500’s on-chip inference be used to improve SLAM (e.g., by providing semantic features or known object sizes for scale)?
- Is monocular SLAM feasible without a depth sensor, or is a cheap 2D LiDAR or stereo/depth camera strongly recommended?
- What is the minimum sensor configuration that gives metrically accurate maps for indoor rooms?
- How do legged robots without wheel odometry affect SLAM choice?

Cite: [Online Visual SLAM Frameworks — Emergent Mind](https://www.emergentmind.com/topics/online-visual-slam-frameworks); [ORB-SLAM3 on Raspberry Pi 5 — IEEE Xplore](https://ieeexplore.ieee.org/iel8/6287639/11323511/11373149.pdf); [RTAB-Map 2025 update overview](https://blog.csdn.net/gitblog_01018/article/details/151948526).

### 3.2 3D reconstruction and surface area estimation
- What representations are best for our use case?
  - Sparse point clouds.
  - Dense point clouds.
  - Voxel grids / occupancy grids.
  - Polygon meshes (Poisson, marching cubes).
  - Neural fields (NeRF) or 3D Gaussian Splatting.
- Which representation can be updated incrementally as the robot moves?
- How do we compute floor surface area from the chosen representation?
- How do we extract walls and free-space boundaries from a point cloud or occupancy grid?
- Can 3D Gaussian Splatting be built in real time on a Pi 5 or offloaded to the laptop?

Cite: [RT-GuIDE: Real-Time Gaussian Splatting for Information-Driven Exploration](https://arxiv.org/html/2409.18122v3); [awesome-NeRF-and-3DGS-SLAM](https://github.com/3D-Vision-World/awesome-NeRF-and-3DGS-SLAM); [SLAM vs NeRF for Robot 3D Mapping — PatSnap](https://www.patsnap.com/resources/blog/rd-blog/slam-vs-nerf-for-robot-3d-mapping-patsnap-eureka/).

### 3.3 Floor plan extraction and room segmentation
- Given a point cloud or occupancy grid, how do we segment rooms, corridors, and doorways?
- What open-source tools exist for automatic floor-plan generation from 3D scans?
- Can we generate top-down 2D floor plans for each floor and overlay them in the 3D view?
- How do we handle multi-floor buildings (stairs, ramps, elevators)?

### 3.4 Browser-based 3D visualization
- What libraries are best for rendering interactive building interiors?
  - Three.js + custom geometry.
  - `indoor3D` / `indoor3D.js` (Three.js indoor maps).
  - Potree / `three-loader-3dtiles` for point clouds.
  - CesiumJS (overkill?).
  - IFC.js / That Open Engine for BIM-style buildings.
  - Web-based voxel engines.
- How do we render point clouds in the browser efficiently?
- How do we implement “cutaway / x-ray” views so the operator can see inside rooms?
- How do we represent a floor graph (building → floors → rooms → doors) in TypeScript and render it?

Cite: [indoor3D GitHub](https://github.com/wolfwind521/indoor3D); [Three.js 3D Point Cloud tutorial](https://threejsdemos.com/tutorials/3d-point-cloud); [Roometron floor plan builder — Three.js forum](https://discourse.threejs.org/t/roometron-floor-plan-builder-interior-design-platform/88849); [CesiumJS](https://cesium.com/platform/cesiumjs/).

### 3.5 Door detection and state classification
- What are the state-of-the-art methods for detecting doors and classifying open vs. closed from a single RGB image or video stream?
- Can a Vision-Language Model (VLM) do this zero-shot or few-shot?
- Can the IMX500 run a lightweight object-detection model trained on doors?
- What datasets exist for door-state classification?
- How do we associate a detected door with a specific wall/room in the map?

Cite: [Real-time 2D–3D door detection and state classification](https://pmc.ncbi.nlm.nih.gov/articles/PMC8082488/); [Closed-Loop Door Opening in the Wild](https://arxiv.org/html/2504.09358v1); [Think-in-Control VLA for robot navigation](https://arxiv.org/html/2602.02459v2).

### 3.6 Autonomous exploration and coverage planning
- What algorithms let a robot decide where to go next to finish mapping or clearing a building?
  - Frontier-based exploration.
  - Next-best-view (NBV) planning.
  - Information-theoretic exploration.
  - Topological / scene-graph navigation.
- How do we handle closed doors as frontiers that require human permission or a manipulation action?
- How do we ensure the robot returns to base or a safe point on low battery?
- What planners work without a pre-existing map?

### 3.7 Data model for buildings, farms, warehouses, tunnels
- What is the best hierarchical data model?
  - Site → Building → Floor → Room → Door/Window.
  - Site → Structure (tunnel, hangar, barn) → Zone → Segment.
- What schema formats should we consider?
  - GeoJSON / IndoorJSON.
  - IFC / CityJSON.
  - Custom JSON schema.
- How do we store and stream this data to the React frontend?

### 3.8 Hardware alternatives and emerging tech
- Would a cheap 2D LiDAR (LD06, YDLIDAR X2/X3, RPLIDAR A1) dramatically improve mapping compared to monocular vision?
- Would a depth camera (OAK-D-Lite, RealSense D435f) be better than LiDAR for our robot?
- What is the state of visual-inertial SLAM with commodity IMUs on legged robots?
- Are there emerging 2024–2025 methods that change the trade-off (e.g., 3D Gaussian Splatting SLAM, open-world VLMs, edge transformers)?

---

## 4. Deliverables

Each research agent should produce a concise report with:

1. **Ranked options** for their topic (1 = best fit for our constraints).
2. **Pros/cons table** covering accuracy, compute cost, setup difficulty, license, and demo readiness.
3. **Concrete repos/packages** with install/run commands where possible.
4. **Integration sketch** — how it would plug into Operator’s backend and React frontend.
5. **Blockers and unknowns** — what would kill the approach.
6. **Time estimate** for a minimal demo on our hardware.

A final synthesis should recommend a single end-to-end MVP stack, including:
- SLAM / odometry choice.
- Map representation and storage.
- Door-state detection method.
- Exploration / coverage logic.
- Frontend 3D library and data flow.
- Hardware additions (if any) worth buying today in Berlin.

---

## 5. Constraints

- **Robot:** SunFounder PiCrawler (quadruped, no wheel encoders), Raspberry Pi 5.
- **Camera:** Raspberry Pi AI Camera (IMX500) is the default sensor. LiDAR/depth cameras are optional only if a strong case is made.
- **Compute:** On-robot processing preferred; laptop/cloud acceptable only for non-real-time steps.
- **Network:** Wi-Fi between robot and laptop; assume intermittent packet loss is possible.
- **Frontend:** React 19 + Three.js + Vite; no heavy new frameworks unless justified.
- **Timeline:** 24–48 hours for a demo. The recommendation must distinguish “minimum viable demo” from “full architecture.”
- **Defense context:** Offline-first capability is valued; cloud-only VLMs are a liability.

---

## 6. Success criteria

- A concrete, ranked recommendation for each of the four problem areas.
- At least one proposed MVP stack that can be implemented in two days.
- Identification of any hardware that must be bought before implementation can start.
- Clear “no-go” options that should be avoided given our compute/timeline constraints.
- A one-page architecture diagram (textual or image) showing data flow from robot camera to dashboard visualization.

---

## 7. How to report findings

Please write findings back to this repo in `research/INDOOR_3D_MAPPING_FINDINGS.md` and update this request file with a link to the findings. Cross-link any Obsidian notes in `~/Documents/Obsidian-brain/final-fantasy/Research/` if relevant.

Start with the highest-impact question first: **“What is the cheapest sensor + SLAM combination that can give us a metric, drift-tolerant map of a few rooms on a Pi 5?”** Everything else depends on that answer.
