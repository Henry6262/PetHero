# OPERATION GHOST SQUAD — The SE3-Integrated Epic Demo
## 5 Agents. One 3D Battlefield. Your Mobile App. The IRL Robot. A Demo That Ends Hackathons.

**TL;DR:** You use SE3 Labs' 3D battlefield reconstruction data (or generate representative point cloud data) to simulate a squad of 5 autonomous ground agents dropping from a helicopter into a contested zone. The 3D map renders in real-time using Open3D. Five agent icons explore using your 01-ats graph algorithm. Your mobile app shows the operator commanding the squad. A second patrol detects changes using your 01-se3 Track 2 code. Your physical PiCrawler robot on the table is "Agent 1 — the proof that this works in the real world." SE3 Labs is a Munich company. Their mentor is at the event. You're validating their software with a use case they haven't demonstrated. This is the demo that makes the entire room go silent.

---

## 1. THE VISION: Why This Is Unstoppable

### 1.1 The Story You're Telling

> *"A helicopter drops 5 autonomous ground agents into a contested village. The village has been 3D-scanned by drones — every building, every street, every possible hiding spot is mapped. The agents don't know what's inside the buildings. They have to find out. Agent 1 — that's our robot — enters a building. The other 4 spread through the village. An operator, sitting kilometers away, watches all 5 on a phone. Threats appear as red dots. Civilians as yellow. Clear rooms as green. When something changes between patrols — a door that was closed is now open, a vehicle that wasn't there — the system alerts instantly. This is not science fiction. This is what we built in 42 hours."*

### 1.2 Why SE3 Labs Specifically Wants This

SE3 Labs is a **Munich-based defense AI company** [^148^] that builds "foundational spatial intelligence technology for autonomous systems" [^157^]. Their website says: *"SE3's spatial autonomy enables any machine to function as a teammate. It bridges the gap between human intent and mission execution."* [^148^]

They've partnered with **Carmenta** to integrate their 3D reconstruction into military geospatial platforms [^140^]. Their **SpatialGPT** lets operators query battlefield data in natural language [^140^]. They've tested in **Bundeswehr exercises under GPS jamming** [^143^] and in **Ukraine combat conditions** [^143^].

**But here's what they HAVEN'T demonstrated publicly:** A squad of autonomous ground robots using their 3D map data to clear buildings, with a mobile operator interface, in a live demo. That's what you build. You are their missing use case.

### 1.3 The Competitive Moat

| What Other Teams Show | What You Show |
|---|---|
| Code on a laptop | 5 agents moving through a 3D battlefield |
| Terminal output | Real-time 3D visualization with Open3D |
| Single robot walking on tape | Squad coordination: 5 agents, one operator |
| Abstract algorithm description | Your 01-ats code literally driving the agents |
| Static screenshots | Live animation: helicopter drop → explore → detect changes |
| No mobile component | Phone app commanding the entire squad |
| No connection to challenges | Both P0 challenges integrated into one visual narrative |

---

## 2. THE 3D BATTLEFIELD: Building the Environment

### 2.1 Data Sources (Priority Order)

**Option A: SE3 Labs Provides Data at the Event (Best Case)**
- Ask their mentor (Alexander Hobmeier) on Friday: *"We're building a multi-agent ground reconnaissance demo using your 3D reconstruction. Can you share sample point cloud or mesh data?"*
- SE3 does real-time 3D reconstruction from drone video [^140^] — their data is likely point clouds (.ply) or meshes (.obj/.gltf)
- If they provide data, your demo uses **actual SE3 software output** — the ultimate validation

**Option B: Generate Representative 3D Data (Fallback)**
- Create a simple 3D village using procedural generation
- 10-20 buildings as boxes/cubes on a terrain plane
- Add "interiors" as simplified room graphs (nodes + edges) — this connects to your 01-ats code
- Format: point cloud (.ply) or simple mesh that Open3D can render

**Option C: Use Open3D Sample Data + Customize (Safest)**
- Open3D comes with sample datasets: `o3d.data.EaglePointCloud()`, `o3d.data.LivingRoomPointClouds()` [^153^]
- Modify/add buildings to create a village-like environment
- Fastest to implement, guaranteed to work

### 2.2 The 3D Map Structure

```
3D BATTLEFIELD (Village):
├── Terrain plane (ground)
├── 10-15 buildings (3D boxes with positions)
│   ├── Each building has "interior nodes" (rooms, hallways)
│   ├── Interior = graph (nodes = rooms, edges = doorways)
│   └── This IS the 01-ats graph — you're visualizing it in 3D
├── Roads/paths between buildings (edges on ground plane)
├── Helicopter drop zone (starting position for all 5 agents)
└── Optional: trees, vehicles, debris for realism
```

### 2.3 Open3D for Real-Time 3D Visualization

**Why Open3D:** It's the standard Python library for 3D data processing. Supports point clouds, meshes, real-time animation, and agent movement [^151^][^153^][^156^]. You can animate 5 agents moving through the 3D environment at 30+ FPS.

**Key Open3D features you use:**

| Feature | Code | Purpose |
|---|---|---|
| Load point cloud | `o3d.io.read_point_cloud("village.ply")` | Display the 3D map |
| Load mesh | `o3d.io.read_triangle_mesh("building.obj")` | Buildings as 3D objects |
| Create agent | `o3d.geometry.TriangleMesh.create_sphere(0.5)` | Agent representation |
| Color agent | `agent.paint_uniform_color([1, 0, 0])` | Red = threat detected |
| Animation loop | `vis.register_animation_callback(update)` | Move agents in real-time |
| Add labels | `vis.add_3d_label(position, "Agent-1")` | Show agent IDs |
| Camera control | `vis.get_view_control().set_lookat()` | Cinematic camera angles |
| Screenshot | `vis.capture_screen_image()` | Save demo frames |

**Animation callback structure:**

```python
def update_agents(vis):
    """Called every frame. Updates agent positions."""
    for i, agent in enumerate(agents):
        # Get next position from 01-ats graph algorithm
        next_pos = graph_explorer.get_next_position(i)
        
        # Move agent smoothly
        current = np.asarray(agent.vertices).mean(axis=0)
        direction = next_pos - current
        agent.translate(direction * 0.1)  # Smooth movement
        
        # Update color based on detection status
        if detection_status[i] == "THREAT":
            agent.paint_uniform_color([1, 0, 0])  # Red
        elif detection_status[i] == "CIVILIAN":
            agent.paint_uniform_color([1, 1, 0])  # Yellow
        else:
            agent.paint_uniform_color([0, 1, 0])  # Green
        
        vis.update_geometry(agent)
    
    vis.poll_events()
    vis.update_renderer()
    return True  # Continue animation
```

### 2.4 Creating the Village (Procedural, No External Data Needed)

If SE3 doesn't provide data, generate it in Python:

```python
import open3d as o3d
import numpy as np

def create_battlefield_village():
    """Generate a simple 3D village for the demo."""
    geometries = []
    
    # Ground plane
    ground = o3d.geometry.TriangleMesh.create_box(100, 100, 0.1)
    ground.translate([-50, -50, -0.1])
    ground.paint_uniform_color([0.3, 0.25, 0.2])  # Dirt color
    geometries.append(ground)
    
    # Buildings (10 structures)
    building_positions = [
        (10, 10, 0), (-15, 5, 0), (20, -10, 0),
        (-5, -20, 0), (30, 15, 0), (-25, -15, 0),
        (0, 25, 0), (15, -25, 0), (-30, 10, 0), (5, 0, 0)
    ]
    
    for pos in building_positions:
        building = o3d.geometry.TriangleMesh.create_box(
            width=np.random.uniform(5, 12),
            height=np.random.uniform(5, 12),
            depth=np.random.uniform(4, 8)
        )
        building.translate(pos)
        building.paint_uniform_color([0.5, 0.5, 0.55])  # Concrete
        geometries.append(building)
    
    # Helicopter drop zone (marked area)
    drop_zone = o3d.geometry.TriangleMesh.create_circle(5)
    drop_zone.translate([0, 0, 0.05])
    drop_zone.paint_uniform_color([0, 0.8, 0])  # Green circle
    geometries.append(drop_zone)
    
    return geometries
```

---

## 3. THE 5 AGENTS: From Graph Algorithm to 3D Movement

### 3.1 Agent Architecture

Each agent uses your **01-ats Explorer class** to navigate. The 3D village's buildings become the "graphs" — each building's interior is a node-edge structure that your algorithm already understands.

```
SQUAD OF 5 AGENTS:

Agent 1 (ALPHA) ──→ IRL Robot on table (physical proof)
        └── 01-ats graph exploration
        └── IMX500 AI camera detection
        └── Mobile app: "AGENT-1: CLEARING BUILDING-3"

Agent 2 (BRAVO) ──→ 3D simulation on laptop
        └── 01-ats graph exploration (different start, different graph)
        └── Simulated detection (based on 3D position + heuristic)
        └── Mobile app: "AGENT-2: PATROLLING SECTOR-B"

Agent 3 (CHARLIE) → 3D simulation on laptop
        └── 01-ats graph exploration
        └── Mobile app: "AGENT-3: APPROACHING BUILDING-7"

Agent 4 (DELTA) ──→ 3D simulation on laptop
        └── 01-ats surveillance sweep (second pass)
        └── 01-se3 change detection
        └── Mobile app: "AGENT-4: CHANGE DETECTED — DOOR OPEN"

Agent 5 (ECHO) ───→ 3D simulation on laptop
        └── 01-ats surveillance sweep
        └── Mobile app: "AGENT-5: SECTOR-CLEAR"
```

### 3.2 The Helicopter Drop Sequence

This is the **visual opener** of your demo. 5 seconds of pure cinematic impact:

```python
def helicopter_drop_sequence(vis, agents, drop_zone):
    """Animate all 5 agents dropping from helicopter position."""
    
    # Phase 1: Agents appear above drop zone (helicopter hover)
    for i, agent in enumerate(agents):
        start_pos = [drop_zone[0] + (i-2)*3, drop_zone[1], 20]  # 20m up
        agent.translate(start_pos)
        vis.add_geometry(agent)
    
    # Phase 2: Agents descend (2-second animation)
    for step in range(20):
        for agent in agents:
            agent.translate([0, 0, -1])  # Drop 1m per frame
            vis.update_geometry(agent)
        vis.poll_events()
        vis.update_renderer()
        time.sleep(0.1)
    
    # Phase 3: Agents spread to their assigned buildings
    # (connected to 01-ats start positions)
```

### 3.3 Connecting 01-ats to 3D Movement

Your `submission.py` Explorer class already handles multi-agent graph exploration. The innovation: **each agent's graph is a building's interior**, and the 3D visualization shows the agents moving through those graphs in real-time.

```python
# Bridge: 01-ats algorithm → 3D position
class Agent3D:
    def __init__(self, agent_id, explorer, building_graph, start_3d_pos):
        self.id = agent_id
        self.explorer = explorer          # Your 01-ats Explorer instance
        self.graph = building_graph       # networkx.Graph of building interior
        self.position_3d = start_3d_pos   # (x, y, z) in 3D world
        self.detection = None             # THREAT / CIVILIAN / CLEAR
    
    def step(self):
        """One tick: get next action from 01-ats, move in 3D."""
        # Get observation from current position
        obs = self._build_observation()
        
        # Ask 01-ats algorithm for next move
        actions = self.explorer.step([obs], "explore")
        next_node = actions[0]
        
        # Map graph node to 3D position
        self.position_3d = self._node_to_3d(next_node)
        
        # Check for "detections" (simulated based on room contents)
        self.detection = self._simulate_detection(next_node)
        
        return self.position_3d, self.detection
```

---

## 4. THE MOBILE APP: Commanding the Squad

### 4.1 App Design: Squad Command Interface

The app is no longer controlling one robot — it's a **tactical command center** for 5 agents. This is the C2 (Command & Control) interface that military operators actually use [^159^].

**Screen 1: Squad Overview (Main Dashboard)**
```
┌─────────────────────────────────────────┐
│  SCOUT SQUAD COMMAND      🔋 78%  📡 ●  │
├─────────────────────────────────────────┤
│                                         │
│  [3D MAP MINIATURE — 5 agent dots]      │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│  │ A-1 │ │ A-2 │ │ A-3 │ │ A-4 │     │
│  │ 🟢  │ │ 🟡  │ │ 🟢  │ │ 🔴  │     │
│  │CLEAR│ │CIV  │ │CLEAR│ │THREAT│    │
│  └─────┘ └─────┘ └─────┘ └─────┘     │
│           ┌─────┐                      │
│           │ A-5 │                      │
│           │ 🟢  │                      │
│           │CLEAR│                      │
│           └─────┘                      │
│                                         │
│  🟢 3 CLEAR  🟡 1 CIVILIAN  🔴 1 THREAT │
│                                         │
│  [📹 LIVE: AGENT-1]  [🗺️ FULL MAP]     │
│                                         │
└─────────────────────────────────────────┘
```

**Screen 2: Agent Detail (Tap any agent card)**
```
┌─────────────────────────────────────────┐
│  ←  AGENT-1 (ALPHA)      🟢 ACTIVE      │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────┐               │
│  │  [LIVE CAMERA FEED] │               │
│  │   (from IRL robot   │               │
│  │    or simulated)    │               │
│  └─────────────────────┘               │
│                                         │
│  Status: CLEARING BUILDING-3            │
│  Position: Sector A, Room 2             │
│  Battery: 78%                           │
│  Detections: 0                          │
│                                         │
│  [🟢 DEPLOY]  [🟡 RECALL]  [🔴 ABORT]  │
│                                         │
│  Mission Log:                           │
│  14:32 — Dropped from helo              │
│  14:33 — Entered Building-3             │
│  14:34 — Room 1: CLEAR                  │
│  14:35 — Room 2: CLEAR                  │
│                                         │
└─────────────────────────────────────────┘
```

**Screen 3: Change Detection Alert**
```
┌─────────────────────────────────────────┐
│  🚨 ALERT — CHANGE DETECTED             │
├─────────────────────────────────────────┤
│                                         │
│  Agent: AGENT-4 (DELTA)                 │
│  Location: Building-7, Room 3           │
│  Time: 14:47 (was 12:30)                │
│                                         │
│  [BEFORE]          [AFTER]              │
│  ┌──────────┐     ┌──────────┐          │
│  │  [photo] │     │  [photo] │          │
│  │ Door:    │     │ Door:    │          │
│  │ CLOSED   │     │ OPEN     │          │
│  └──────────┘     └──────────┘          │
│                                         │
│  Change: DOOR STATUS CHANGED            │
│  Confidence: 94%                        │
│  Significance: HIGH                     │
│                                         │
│  [📍 MARK]  [🔍 INVESTIGATE]  [✓ ACK]  │
│                                         │
└─────────────────────────────────────────┘
```

### 4.2 Tech Stack: React Web App (Same as Before)

```
squad_command_app/
├── index.html           # Single HTML file, loads React
├── app.js               # React components
├── styles.css           # Tactical dark theme
└── mock_data.js         # Simulated agent data for demo
```

**The app connects to:**
- **Agent 1 (IRL robot):** Real camera feed via Flask MJPEG stream
- **Agents 2-5 (simulated):** Mock data that syncs with the 3D visualization timeline
- **Change detection alerts:** Triggered by 01-se3 code comparing simulated before/after photos

---

## 5. THE IRL ROBOT: Agent 1 in Physical Form

### 5.1 The Narrative Bridge

The robot on the table is not separate from the 3D simulation — **it IS Agent 1 (ALPHA)** in the squad.

> *"What you're seeing on the laptop is the simulation — 5 agents clearing a village. What you're seeing on the table is Agent 1, the physical proof. Same AI camera, same graph algorithm, same mobile app. The simulation scales to 50 agents. The robot proves it works with 1."*

### 5.2 Integration: Robot = Agent 1

```python
# The robot runs the SAME code as the simulated agents
# Just with physical hardware instead of 3D visualization

class PhysicalAgent(Agent3D):
    """Agent 1 — the IRL robot on the table."""
    
    def __init__(self):
        super().__init__(
            agent_id=0,
            explorer=Explorer(),      # Same 01-ats class
            building_graph=table_graph,  # Tape path = building interior
            start_3d_pos=(0, 0, 0)
        )
        self.robot = PiCrawler()
        self.camera = Picamera2(1)
        self.imx500 = IMX500("/usr/share/imx500-models/mobilenet_ssd.rpk")
    
    def move_to(self, position_3d):
        """Convert 3D target to servo commands."""
        # position_3d on table = (x_cm, y_cm, 0)
        # Convert to: forward(steps) + turn(degrees)
        dx = position_3d[0] - self.current_pos[0]
        dy = position_3d[1] - self.current_pos[1]
        distance = (dx**2 + dy**2)**0.5
        angle = np.degrees(np.arctan2(dy, dx))
        
        self.robot.turn_left(angle)
        self.robot.forward(int(distance / 10))  # 10cm per step
```

### 5.3 The Demo Moment

While the 3D visualization shows all 5 agents on the laptop:
- **Agent 1 dot moves** in the 3D village (simulation)
- **Simultaneously**, the physical robot walks on the table (IRL)
- The phone shows **"AGENT-1: ACTIVE — LIVE FEED"** with the real camera
- When the robot detects a red card: **phone flashes red**, 3D dot turns red, laptop shows alert

**This synchronization is the wow moment.** Nobody else has physical + simulation + mobile in one demo.

---

## 6. THE PITCH: OPERATION GHOST SQUAD

### 6.1 The 3-Minute Demo Script

**[0:00-0:10] THE HOOK — The Mission**
> *"A village in eastern Ukraine. Intel says enemy fighters are inside. Civilian families are hiding. A helicopter approaches. It can't land — too hot. So it drops five agents from 20 meters up. Each agent is a €200 autonomous ground robot. One operator, one phone, five machines. This is Operation Ghost Squad."*

**[0:10-0:25] THE DROP — Cinematic Opener**
> *Laptop shows 3D village. 5 green dots appear above the drop zone. They descend. They hit the ground. They spread."
> *"Five agents. Five buildings. One mission: find what's inside before a soldier has to."*

**[0:25-1:00] THE EXPLORATION — Agents Move, App Updates**
> *"Agent 1 — that's our physical robot — enters Building 3."*
> *Robot walks on table. Phone shows live feed. 3D dot moves into building.*
> *"Room 1... clear. Room 2... clear. Room 3..."*
> *Robot stops. Phone flashes. 3D dot turns red.*
> *"THREAT DETECTED. Armed individual. 91% confidence. The operator sees it. The operator decides."*

**[1:00-1:30] THE DECISION — Human in the Loop**
> *Show phone: DETONATE / HOLD buttons*
> *"The robot doesn't decide. The AI detects. The human decides. This is the ethical line."*
> *Tap HOLD. "Civilians in the next room. Can't risk it. Agent 1 marks the building. Extraction team called."*

**[1:30-2:00] THE SURVEILLANCE — Change Detection**
> *"Two hours later. Agents return for a second patrol. The map hasn't changed. But something has."*
> *3D dots move through buildings again. Agent 4 stops.*
> *"ALERT: Change detected in Building 7. Door was closed. Now it's open. Vehicle present that wasn't there before."*
> *Show before/after comparison on phone and laptop.*
> *"This is our change detection system — submitted to SE3 Labs' challenge."*

**[2:00-2:30] THE SCALE — From 5 to 500**
> *"Five agents. One village. €1,000 total. The same platform scales to fifty agents across a city. To five hundred across a forward operating area."*
> *"We submitted our graph exploration to ATS GmbH's 01-ats challenge. Our change detection to SE3 Labs' 01-se3 Track 2. Our robot validates both in the real world."*

**[2:30-3:00] THE CLOSE**
> *"Operation Ghost Squad. Five agents. One app. Zero soldiers in the building until it's clear. Built in 42 hours at EDTH Munich."*

### 6.2 Key Phrases for SE3 Mentors

When you talk to Alexander Hobmeier from SE3 Labs:

| Say This | Why It Lands |
|---|---|
| "We're using your 3D reconstruction data to validate multi-agent ground reconnaissance" | Shows you actually read their challenge |
| "Our change detection pipeline feeds directly into your SpatialGPT query system" | Connects your work to their product |
| "We've tested in simulated GPS-denied environments, like your Bundeswehr exercises" | Shows you know their work [^143^] |
| "The mobile app is the operator interface your spatial intelligence needs" | Positions your app as their missing UI layer |
| "One operator, many machines, zero friction — that's your mission statement" | Quotes their website [^148^] |

---

## 7. BUILD PLAN: Hour by Hour

### Friday Night (18:00-02:00)

| Time | Task | Output |
|---|---|---|
| 18:00-19:00 | Talk to SE3 mentor, request 3D data | Data received OR fallback plan |
| 19:00-21:00 | Build 3D village with Open3D | `.py` script renders village |
| 21:00-23:00 | Integrate 5 agents into 3D scene | Agents appear, can move |
| 23:00-01:00 | Connect 01-ats algorithm to agent movement | Agents explore using your code |
| 01:00-02:00 | Helicopter drop animation | Cinematic opener works |

### Saturday (09:00-23:00)

| Time | Task | Output |
|---|---|---|
| 09:00-12:00 | Build mobile app (squad command UI) | React app with 5 agent cards |
| 12:00-14:00 | Integrate IRL robot as Agent 1 | Robot syncs with 3D simulation |
| 14:00-16:00 | Add change detection (01-se3 T2) | Second pass + alerts |
| 16:00-17:00 | Submit 01-ats + 01-se3 T2 | Both challenges done |
| 17:00-19:00 | Polish 3D viz + animations | Smooth 30 FPS, good camera angles |
| 19:00-21:00 | Full demo integration test | All components work together |
| 21:00-23:00 | Pitch rehearsal + video backup | 3-min pitch memorized |

### Sunday (09:00-12:00)

| Time | Task | Output |
|---|---|---|
| 09:00-10:00 | Final setup at table | All hardware ready |
| 10:00-11:00 | Dress rehearsal (3x) | Smooth, confident |
| 11:00-12:00 | Relax, review notes | Mental preparation |
| 12:00 | **WIN** | 🏆 |

---

## 8. TECHNICAL REFERENCES

### SE3 Labs
- **Website:** `https://www.se3.ai/` [^148^]
- **SE3 + Carmenta partnership:** `https://carmenta.com/knowledge/ai-powered-geospatial-intelligence-by-se3-labs-and-carmenta` [^140^]
- **Isabel Tahir interview (Berlin Security Conference):** `https://www.youtube.com/watch?v=7Wsp3--R_Jk` [^143^]
- **Challenge contact:** Alexander Hobmeier

### 3D Visualization
- **Open3D docs:** `https://www.open3d.org/docs/latest/tutorial/Basic/visualization.html` [^160^]
- **Open3D point cloud tutorial:** `https://sigmoidal.ai/en/point-cloud-processing-with-open3d-and-python/` [^151^]
- **Open3D animation example:** `https://stackoverflow.com/questions/78008622/how-to-visualize-multiple-point-cloud-files-as-video-using-open3d` [^139^]
- **PyVista (VTK-based):** `https://towardsdatascience.com/ultimate-volleyball-a-3d-volleyball-environment-built-using-unity-ml-agents-c9d3213f3064/` [^149^]

### Multi-Agent / C2 Systems
- **C2 framework basics:** `https://www.activecountermeasures.com/the-beginners-guide-to-command-and-control-part-1-how-c2-frameworks-operate/` [^159^]
- **MCP for multi-agent red teaming:** `https://arxiv.org/html/2511.15998v1` [^161^]

### Tactical Communication
- **ATAK:** `https://skyfi.com/en/blog/atak-system-satellite-imaging` [^101^]
- **TAK Server on Pi:** `https://myrandomtechblog.com/tak-server-on-raspberry-pi-4-or-5/` [^111^]
- **Meshtastic + ATAK:** `https://meshtastic.org/blog/atak-update/` [^99^]

### IMX500 AI Camera
- **Raspberry Pi docs:** `https://www.raspberrypi.com/documentation/accessories/ai-camera.html`
- **Performance review:** `https://magazinmehatronika.com/en/raspberry-pi-ai-camera-review-even-more-approachable-ai/` [^134^]
- **AITRIOS Brain Builder:** `https://developer.aitrios.sony-semicon.com/en/studio/brain-builder` [^132^]

---

## 9. WHAT TO SAY TO DIFFERENT JUDGES

### To SE3 Labs Mentor (Alexander Hobmeier)
> *"We took your challenge literally. You asked for the AI layer that extracts intelligence from 3D reconstructed battlefields. We built it — and we showed it commanding a squad of 5 autonomous ground agents. Your 3D data becomes the map. Our graph algorithm becomes the exploration. Our change detection becomes the intelligence. Your SpatialGPT becomes the query interface. This is the full stack."*

### To ATS GmbH Mentor (Sam Eberl)
> *"Our 01-ats submission uses frontier-based multi-agent exploration. But here's what's different: we didn't just submit code. We visualized it. Five agents, one 3D battlefield, real-time movement. The algorithm you asked for is literally driving the dots on the screen."*

### To Ukrainian Military Mentors
> *"In Ukraine, you don't have enough soldiers to clear every building. You don't have $75,000 robots for every squad. What you CAN afford is five €200 agents per squad, controlled by a phone. We simulated it today. We proved it with hardware. This is deployable."*

### To VCs / Investors
> *"The C-UAS market is $14.4B and growing 22% annually. But the bigger opportunity is ground reconnaissance — there is NO affordable autonomous ground platform for infantry. We're building the Android of quadruped sensors. €200 per unit. Dual-use from day one."*

---

*Operation Ghost Squad. Five agents. One 3D battlefield. Your mobile app. The IRL robot. Two challenge submissions. One Munich company validated. One demo that ends hackathons. Go build it.*
