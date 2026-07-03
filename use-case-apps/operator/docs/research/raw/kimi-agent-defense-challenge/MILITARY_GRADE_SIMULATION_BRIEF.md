# Military-Grade Tactical Simulation — Research Brief
## Upgrading SCOUT C2 from "agents on rails" to a believable squad AI

**TL;DR:** Replace the current straight-line waypoint simulator with a **four-layer tactical simulation**: (1) **Navmesh + Visibility Graph** for pathfinding around buildings, (2) **Formation Controller** for squad-level positioning (wedge, column, line), (3) **Finite State Machine** for agent behavior (patrol, move-to-cover, hold, engage, fall-back), and (4) **ORCA Collision Avoidance** so agents don't walk through each other. The biggest visual wins: agents pathfind around building corners instead of sliding through walls, they move in wedge formation like a real squad, they pause at cover positions, and they smoothly accelerate/decelerate. Implementation order: navmesh → pathfinding → formations → FSM → ORCA. Each layer is ~100 lines of Python. Total build time: 4–6 hours. The frontends stay the same — they just receive better `x, y, heading, status` data.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCOUT TACTICAL SIMULATOR                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 4: COLLISION AVOIDANCE (rvo2)                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ORCA — Optimal Reciprocal Collision Avoidance                      │   │
│  │  Each agent computes velocity that avoids others, in real time      │   │
│  │  Library: rvo2 (MIT-ACL fork) — 200 agents at 60 FPS [^254^]       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                              │
│  LAYER 3: BEHAVIOR (Finite State Machine)                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STATES: PATROL → MOVE_TO_COVER → HOLD → ENGAGE → FALL_BACK       │   │
│  │  Triggers: command from UI, threat detected, cover found, etc.      │   │
│  │  Each state defines: target speed, target heading, FOV behavior     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                              │
│  LAYER 2: FORMATION CONTROLLER                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  WEDGE, COLUMN, LINE, FILE formations                               │   │
│  │  Based on FM 3-21.8 Infantry Doctrine [^278^][^283^]                │   │
│  │  Leader defines heading + speed; followers compute offset positions │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                              │
│  LAYER 1: PATHFINDING & NAVIGATION                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Navmesh from building polygons (shapely.constrained_delaunay)      │   │
│  │  A* on visibility graph (extremitypathfinder — optimized VGO) [^255^]│  │
│  │  Path smoothing + turning radius constraints                         │  │
│  │  Cover position scoring (ray casting against building edges)         │  │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ▲                                              │
│  INPUT: Building polygons, agent positions, commands from UI                │
│  OUTPUT: Agent positions, headings, speeds, statuses → Flask /api/state     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer 1: Pathfinding & Navigation

### 2.1 The Problem

Current agents slide in straight lines, ignoring buildings. We need them to **go around corners**, **hug walls**, and **find the shortest valid path** through open spaces.

### 2.2 The Solution: Visibility Graph + A*

Instead of a grid-based approach (slow, memory-hungry), use a **visibility graph** — a graph where nodes are the vertices of building polygons, and edges exist between any two vertices that can "see" each other (no building blocks the line).

**Why this is the right approach for your map:**
- Your village has ~10 buildings with ~40 vertices total
- A visibility graph has ~400 edges (every vertex sees every other)
- A* on 400 edges takes <1ms per query
- Paths naturally follow building edges — looks tactical

**The library: `extremitypathfinder`** — an optimized visibility graph pathfinder that uses only "extremity" vertices (the ones that matter) rather than all vertices, dramatically reducing graph size [^255^][^260^].

```bash
pip install extremitypathfinder
```

### 2.3 Navmesh from Building Polygons

```python
# File: edth-munich-2026/src/c2/tactical/pathfinding.py

from extremitypathfinder import PolygonEnvironment
from shapely.geometry import Polygon
import numpy as np

class TacticalPathfinder:
    """
    Visibility-graph pathfinder for polygonal environments.
    Agents pathfind around buildings using corners.
    """
    
    def __init__(self):
        self.env = PolygonEnvironment()
        self.boundary = None
        self.obstacles = []
    
    def load_map(self, boundary_polygon, building_polygons):
        """
        boundary_polygon: shapely Polygon — the outer edge of the map
        building_polygons: list of shapely Polygons — buildings as obstacles
        """
        self.boundary = boundary_polygon
        self.obstacles = building_polygons
        
        # Convert to extremitypathfinder format
        # boundary: list of (x, y) vertices, counter-clockwise
        boundary_coords = list(boundary_polygon.exterior.coords)[:-1]  # Remove duplicate closing point
        
        # holes: list of lists of (x, y) vertices, clockwise
        hole_list = []
        for building in building_polygons:
            hole_coords = list(building.exterior.coords)[:-1]
            hole_list.append(hole_coords)
        
        # Store the prepared environment
        self.env.store(boundary=boundary_coords, holes=hole_list, validate=False)
        self.env.prepare()  # Build the visibility graph
    
    def find_path(self, start, goal):
        """
        Find shortest valid path from start to goal, avoiding buildings.
        Returns: list of (x, y) waypoints, or None if no path.
        """
        try:
            path, length = self.env.find_shortest_path(start, goal)
            return path  # List of (x, y) tuples
        except Exception:
            # Fallback: straight line if pathfinding fails
            return [start, goal]
    
    def find_cover_position(self, agent_pos, threat_pos, max_dist=50):
        """
        Find the nearest position behind a building from the threat.
        Cast rays from threat through building edges, find shadow zone.
        """
        best_cover = None
        best_score = float('inf')
        
        for building in self.obstacles:
            # For each edge of the building
            coords = list(building.exterior.coords)[:-1]
            for i in range(len(coords)):
                p1, p2 = coords[i], coords[(i+1) % len(coords)]
                
                # Find the midpoint of the edge, offset outward by building width
                mid_x = (p1[0] + p2[0]) / 2
                mid_y = (p1[1] + p2[1]) / 2
                
                # Vector from threat to midpoint
                dx = mid_x - threat_pos[0]
                dy = mid_y - threat_pos[1]
                dist = np.hypot(dx, dy)
                if dist == 0:
                    continue
                
                # Offset point behind the building (away from threat)
                offset_dist = 15  # meters behind building
                cover_x = mid_x - (dx / dist) * offset_dist
                cover_y = mid_y - (dy / dist) * offset_dist
                
                # Score: distance from agent + how well it blocks LOS from threat
                agent_dist = np.hypot(cover_x - agent_pos[0], cover_y - agent_pos[1])
                los_blocked = self._line_intersects_building(threat_pos, (cover_x, cover_y))
                
                # Lower score = better cover
                score = agent_dist - (100 if los_blocked else 0)
                if score < best_score and agent_dist < max_dist:
                    best_score = score
                    best_cover = (cover_x, cover_y)
        
        return best_cover
    
    def _line_intersects_building(self, p1, p2):
        """Check if line from p1 to p2 passes through any building."""
        from shapely.geometry import LineString
        line = LineString([p1, p2])
        for building in self.obstacles:
            if line.intersects(building):
                return True
        return False
    
    def get_random_open_position(self):
        """Get a random position in open space (not inside a building)."""
        minx, miny, maxx, maxy = self.boundary.bounds
        for _ in range(100):
            x = np.random.uniform(minx, maxx)
            y = np.random.uniform(miny, maxy)
            point = __import__('shapely.geometry').geometry.Point(x, y)
            if self.boundary.contains(point):
                inside_building = False
                for b in self.obstacles:
                    if b.contains(point):
                        inside_building = True
                        break
                if not inside_building:
                    return (x, y)
        return ((minx + maxx) / 2, (miny + maxy) / 2)
```

### 2.4 Smooth Path Following

Agents shouldn't snap instantly to new directions. They should **smoothly turn**, **accelerate**, and **decelerate**.

```python
class SmoothAgentController:
    """
    Makes agents follow paths with realistic movement:
    - Smooth turning (not instantaneous)
    - Acceleration / deceleration
    - Stop at waypoints, then continue
    """
    
    def __init__(self, max_speed=8.0, turn_rate=120.0, accel=15.0):
        self.max_speed = max_speed      # meters/second
        self.turn_rate = turn_rate      # degrees/second
        self.accel = accel              # meters/second^2
        self.position = np.array([0.0, 0.0])
        self.heading = 0.0              # degrees, 0 = +X
        self.speed = 0.0
        self.path = []                  # List of (x, y) waypoints
        self.path_index = 0
        self.state = 'IDLE'
    
    def set_path(self, waypoints):
        """Set a new path to follow."""
        self.path = waypoints
        self.path_index = 0
        self.state = 'MOVING'
    
    def update(self, dt):
        """Update position and heading for one timestep."""
        if self.state != 'MOVING' or self.path_index >= len(self.path):
            # Decelerate to stop
            self.speed = max(0, self.speed - self.accel * dt)
            if self.speed < 0.1:
                self.state = 'IDLE'
            return
        
        target = np.array(self.path[self.path_index])
        to_target = target - self.position
        dist = np.linalg.norm(to_target)
        
        if dist < 2.0:  # Within 2m of waypoint
            self.path_index += 1
            if self.path_index >= len(self.path):
                self.state = 'ARRIVED'
            return
        
        # Compute desired heading
        desired_heading = np.degrees(np.arctan2(to_target[1], to_target[0]))
        
        # Smooth turn: rotate toward desired heading at turn_rate
        heading_diff = (desired_heading - self.heading + 180) % 360 - 180
        turn_amount = np.clip(heading_diff, -self.turn_rate * dt, self.turn_rate * dt)
        self.heading += turn_amount
        
        # Accelerate toward max speed, or decelerate if close to target
        if dist < 10.0:
            # Slow down as we approach waypoint
            target_speed = self.max_speed * (dist / 10.0)
        else:
            target_speed = self.max_speed
        
        if self.speed < target_speed:
            self.speed = min(target_speed, self.speed + self.accel * dt)
        else:
            self.speed = max(target_speed, self.speed - self.accel * dt)
        
        # Move
        rad = np.radians(self.heading)
        self.position[0] += self.speed * np.cos(rad) * dt
        self.position[1] += self.speed * np.sin(rad) * dt
    
    def get_state(self):
        """Return current position, heading, speed for Flask API."""
        return {
            'x': float(self.position[0]),
            'y': float(self.position[1]),
            'heading': float(self.heading),
            'speed': float(self.speed),
            'state': self.state
        }
```

---

## 3. Layer 2: Formation Controller

### 3.1 Military Formations (FM 3-21.8)

The US Army Infantry Platoon and Squad manual [^278^][^281^][^283^] defines standard formations. For your 5-agent squad, implement **three formations**:

| Formation | Description | Use Case |
|---|---|---|
| **WEDGE** | Lead agent front, 2 flanking left, 2 flanking right, forming a V | Default movement. Best 360° security. |
| **COLUMN** | Agents in single file, 10m spacing | Moving through narrow terrain. Easy control. |
| **LINE** | Agents side by side, maximum frontage | Approaching objective. Maximum firepower forward. |

### 3.2 Formation Controller Code

```python
# File: edth-munich-2026/src/c2/tactical/formations.py

import numpy as np

class FormationController:
    """
    Computes follower positions relative to a leader.
    Based on FM 3-21.8 Infantry Doctrine [^278^].
    """
    
    # Formation offset definitions (relative to leader position)
    # Each is a list of (forward_offset, lateral_offset) for followers
    FORMATIONS = {
        'WEDGE': [
            (0, 0),        # Leader (index 0)
            (-15, -10),    # Left flank
            (-15, 10),     # Right flank
            (-30, -20),    # Far left
            (-30, 20),     # Far right
        ],
        'COLUMN': [
            (0, 0),        # Leader
            (-15, 0),
            (-30, 0),
            (-45, 0),
            (-60, 0),
        ],
        'LINE': [
            (0, -20),      # Far left
            (0, -10),      # Left
            (0, 0),        # Center (leader)
            (0, 10),       # Right
            (0, 20),       # Far right
        ],
    }
    
    def __init__(self, formation='WEDGE'):
        self.formation = formation
        self.offsets = self.FORMATIONS[formation]
    
    def set_formation(self, formation_name):
        """Switch formation (WEDGE, COLUMN, LINE)."""
        if formation_name in self.FORMATIONS:
            self.formation = formation_name
            self.offsets = self.FORMATIONS[formation_name]
    
    def get_follower_positions(self, leader_pos, leader_heading):
        """
        Given leader position (x, y) and heading (degrees),
        compute where each follower should be.
        
        Returns: list of (x, y) positions for all 5 agents
        """
        positions = []
        rad = np.radians(leader_heading)
        cos_h = np.cos(rad)
        sin_h = np.sin(rad)
        
        for forward, lateral in self.offsets:
            # Rotate offset by leader heading
            dx = forward * cos_h - lateral * sin_h
            dy = forward * sin_h + lateral * cos_h
            positions.append((leader_pos[0] + dx, leader_pos[1] + dy))
        
        return positions
    
    def adapt_to_terrain(self, leader_pos, leader_heading, pathfinder):
        """
        Modify formation based on terrain width.
        If path ahead is narrow, switch to column.
        If wide open, use wedge.
        """
        # Check if path ahead is narrow
        check_pos = (
            leader_pos[0] + 20 * np.cos(np.radians(leader_heading)),
            leader_pos[1] + 20 * np.sin(np.radians(leader_heading))
        )
        
        # Simple heuristic: if we had a clearance map, use it
        # For now, stay in current formation
        return self.formation
```

### 3.3 Integration: Formation + Pathfinding

The leader agent uses the pathfinder to find a route. The formation controller computes where followers should be. Each agent then pathfinds to their assigned formation position.

```python
# High-level squad movement
class SquadController:
    def __init__(self, pathfinder, formation_ctrl):
        self.pf = pathfinder
        self.fc = formation_ctrl
        self.leader_idx = 0  # Agent 0 is leader
    
    def move_squad_to(self, target_pos, agent_controllers):
        """Move the entire squad to target position in formation."""
        leader = agent_controllers[self.leader_idx]
        
        # Leader pathfinds to target
        leader_path = self.pf.find_path(
            (leader.position[0], leader.position[1]),
            target_pos
        )
        leader.set_path(leader_path)
        
        # Followers pathfind to formation positions
        formation_positions = self.fc.get_follower_positions(
            (leader.position[0], leader.position[1]),
            leader.heading
        )
        
        for i, agent in enumerate(agent_controllers):
            if i == self.leader_idx:
                continue  # Leader already has path
            
            # Follower pathfinds to their formation slot
            follower_path = self.pf.find_path(
                (agent.position[0], agent.position[1]),
                formation_positions[i]
            )
            agent.set_path(follower_path)
```

---

## 4. Layer 3: Behavior — Finite State Machine

### 4.1 Why FSM (Not Behavior Trees or GOAP)

For a hackathon, **Finite State Machines (FSM)** are the sweet spot:
- Simpler than Behavior Trees (no tree structure, no decorators)
- More controllable than Utility AI (explicit state transitions)
- Easier to debug than GOAP (state is explicit)
- Fast enough for real-time (just a switch statement)
- Military doctrine naturally maps to states (FM 3-21.8 [^278^])

### 4.2 Agent States

```python
# File: edth-munich-2026/src/c2/tactical/behavior.py

class AgentBehaviorFSM:
    """
    Finite State Machine for tactical agent behavior.
    States correspond to standard infantry actions (FM 3-21.8).
    """
    
    STATES = {
        'IDLE': {
            'speed_target': 0,
            'fov_behavior': 'scan',       # Slow 360° scan
            'transition_on': ['command_deploy', 'command_recon'],
        },
        'PATROL': {
            'speed_target': 5.0,
            'fov_behavior': 'forward',    # FOV points in heading direction
            'transition_on': ['threat_detected', 'command_hold', 'cover_found'],
        },
        'MOVE_TO_COVER': {
            'speed_target': 8.0,          # Sprint to cover
            'fov_behavior': 'rear',       # Watch behind while moving
            'transition_on': ['at_cover', 'command_hold'],
        },
        'HOLD': {
            'speed_target': 0,
            'fov_behavior': 'scan',       # 360° security
            'transition_on': ['command_deploy', 'command_recon', 'all_clear'],
        },
        'ENGAGE': {
            'speed_target': 3.0,          # Slow advance
            'fov_behavior': 'target',     # FOV locked on threat
            'transition_on': ['command_hold', 'threat_neutralized', 'command_fall_back'],
        },
        'FALL_BACK': {
            'speed_target': 6.0,          # Withdraw
            'fov_behavior': 'rear',       # Covering retreat
            'transition_on': ['at_rally_point', 'command_hold'],
        },
        'RECON': {
            'speed_target': 4.0,
            'fov_behavior': 'sweep',      # Side-to-side scan
            'transition_on': ['command_hold', 'area_cleared'],
        },
    }
    
    def __init__(self, pathfinder, formation_ctrl):
        self.state = 'IDLE'
        self.pf = pathfinder
        self.fc = formation_ctrl
        self.current_target = None
        self.threat_position = None
        self.cover_position = None
    
    def transition(self, event, agent_controller, squad_context):
        """
        Transition to a new state based on event.
        squad_context: dict with positions/statuses of all squad members.
        """
        old_state = self.state
        
        if self.state == 'IDLE':
            if event == 'command_deploy':
                self.state = 'PATROL'
                target = self.pf.get_random_open_position()
                agent_controller.set_path(self.pf.find_path(
                    (agent_controller.position[0], agent_controller.position[1]),
                    target
                ))
            
            elif event == 'command_recon':
                self.state = 'RECON'
                # Assign a sector to sweep
                target = self.pf.get_random_open_position()
                agent_controller.set_path(self.pf.find_path(
                    (agent_controller.position[0], agent_controller.position[1]),
                    target
                ))
        
        elif self.state == 'PATROL':
            if event == 'threat_detected':
                # Find cover from threat
                self.threat_position = squad_context.get('threat_pos')
                self.cover_position = self.pf.find_cover_position(
                    (agent_controller.position[0], agent_controller.position[1]),
                    self.threat_position
                )
                if self.cover_position:
                    self.state = 'MOVE_TO_COVER'
                    agent_controller.set_path(self.pf.find_path(
                        (agent_controller.position[0], agent_controller.position[1]),
                        self.cover_position
                    ))
                else:
                    self.state = 'HOLD'
            
            elif event == 'command_hold':
                self.state = 'HOLD'
            
            elif event == 'cover_found':
                self.state = 'MOVE_TO_COVER'
        
        elif self.state == 'MOVE_TO_COVER':
            if event == 'at_cover' or event == 'command_hold':
                self.state = 'HOLD'
        
        elif self.state == 'HOLD':
            if event == 'command_deploy':
                self.state = 'PATROL'
            elif event == 'command_recon':
                self.state = 'RECON'
            elif event == 'all_clear':
                self.state = 'PATROL'
        
        elif self.state == 'ENGAGE':
            if event == 'command_hold':
                self.state = 'HOLD'
            elif event == 'threat_neutralized':
                self.state = 'PATROL'
            elif event == 'command_fall_back':
                self.state = 'FALL_BACK'
                rally = squad_context.get('rally_point', (100, 100))
                agent_controller.set_path(self.pf.find_path(
                    (agent_controller.position[0], agent_controller.position[1]),
                    rally
                ))
        
        elif self.state == 'FALL_BACK':
            if event == 'at_rally_point' or event == 'command_hold':
                self.state = 'HOLD'
        
        elif self.state == 'RECON':
            if event == 'command_hold':
                self.state = 'HOLD'
            elif event == 'area_cleared':
                self.state = 'PATROL'
        
        if self.state != old_state:
            print(f"Agent transitioned: {old_state} → {self.state} (event: {event})")
        
        return self.state
    
    def update(self, dt, agent_controller):
        """
        Per-frame update. Adjust FOV behavior based on state.
        Returns: (fov_angle, fov_range, fov_scan_speed)
        """
        state_cfg = self.STATES[self.state]
        
        fov_behavior = state_cfg['fov_behavior']
        
        if fov_behavior == 'forward':
            # FOV points in movement direction
            return agent_controller.heading, 80, 0
        
        elif fov_behavior == 'scan':
            # Slow 360° rotation
            scan_angle = (agent_controller.heading + dt * 30) % 360
            return scan_angle, 80, 30
        
        elif fov_behavior == 'rear':
            # FOV points behind (covering retreat)
            return (agent_controller.heading + 180) % 360, 80, 0
        
        elif fov_behavior == 'target':
            # FOV locked on threat
            if self.threat_position:
                dx = self.threat_position[0] - agent_controller.position[0]
                dy = self.threat_position[1] - agent_controller.position[1]
                target_heading = np.degrees(np.arctan2(dy, dx))
                return target_heading, 80, 0
            return agent_controller.heading, 80, 0
        
        elif fov_behavior == 'sweep':
            # Side-to-side scan (±45°)
            sweep = np.sin(dt * 2) * 45
            return (agent_controller.heading + sweep) % 360, 80, 0
        
        return agent_controller.heading, 80, 0
```

### 4.3 Behavior Tree Alternative (If Time Permits)

If you want more sophisticated AI, `py_trees` is the standard Python behavior tree library [^270^][^271^]:

```bash
pip install py-trees
```

```python
import py_trees

# Example: Simple behavior tree for a patrol agent
root = py_trees.composites.Selector(name="Tactical Behavior", memory=False)

# Priority 1: React to threat
threat_sequence = py_trees.composites.Sequence(name="Threat Response", memory=True)
threat_sequence.add_child(CheckThreatCondition())      # Is threat detected?
threat_sequence.add_child(FindCoverAction())           # Pathfind to cover
threat_sequence.add_child(HoldPositionAction())        # Stop and observe
root.add_child(threat_sequence)

# Priority 2: Follow patrol route
patrol_sequence = py_trees.composites.Sequence(name="Patrol", memory=True)
patrol_sequence.add_child(GetNextWaypointAction())     # Get next patrol point
patrol_sequence.add_child(MoveToAction())              # Pathfind and move
patrol_sequence.add_child(WaitAction(duration=2.0))    # Pause at waypoint
root.add_child(patrol_sequence)

# Tick the tree every frame
root.tick_once()
```

For the hackathon, stick with FSM. Add py_trees only if you finish everything else and want more polish.

---

## 5. Layer 4: Collision Avoidance (ORCA / RVO2)

### 5.1 Why ORCA

When 5 agents move in formation, they **must not walk through each other**. ORCA (Optimal Reciprocal Collision Avoidance) computes collision-free velocities for all agents simultaneously [^249^][^252^].

**Key insight:** Each agent computes a velocity that avoids all other agents, considering that those agents are also trying to avoid it. The result is smooth, natural-looking avoidance without explicit coordination.

### 5.2 Python Implementation

```bash
pip install rvo2  # or: pip install git+https://github.com/mit-acl/rvo2.git
```

```python
# File: edth-munich-2026/src/c2/tactical/collision_avoidance.py

import rvo2
import numpy as np

class ORCACollisionAvoidance:
    """
    ORCA collision avoidance for multiple agents.
    Based on: van den Berg et al. "Reciprocal n-body Collision Avoidance" [^252^]
    """
    
    def __init__(self, num_agents=5, time_horizon=5.0, neighbor_dist=15.0):
        # Create ORCA simulator
        # params: time_step, neighbor_dist, max_neighbors, time_horizon, time_horizon_obst, radius, max_speed
        self.sim = rvo2.PyRVOSimulator(
            timeStep=0.1,           # 10 Hz update
            neighborDist=neighbor_dist,
            maxNeighbors=10,
            timeHorizon=time_horizon,
            timeHorizonObst=5.0,
            radius=3.0,             # Agent collision radius (meters)
            maxSpeed=10.0           # Max speed (m/s)
        )
        
        self.agent_ids = []
        for i in range(num_agents):
            aid = self.sim.addAgent((0, 0))  # Initial position (will be updated)
            self.agent_ids.append(aid)
    
    def add_obstacles(self, building_polygons):
        """Add building polygons as obstacles to ORCA."""
        for poly in building_polygons:
            coords = list(poly.exterior.coords)[:-1]
            obstacle = []
            for x, y in coords:
                obstacle.append((x, y))
            self.sim.addObstacle(obstacle)
        self.sim.processObstacles()
    
    def set_agent_goal(self, agent_idx, goal_pos):
        """Set preferred velocity for an agent (toward its goal)."""
        agent_id = self.agent_ids[agent_idx]
        current_pos = self.sim.getAgentPosition(agent_id)
        
        # Compute preferred velocity toward goal
        to_goal = np.array(goal_pos) - np.array(current_pos)
        dist = np.linalg.norm(to_goal)
        
        if dist > 0:
            preferred_velocity = (to_goal / dist) * min(dist, 10.0)  # Max speed 10 m/s
            self.sim.setAgentPrefVelocity(agent_id, tuple(preferred_velocity))
        else:
            self.sim.setAgentPrefVelocity(agent_id, (0, 0))
    
    def update_positions(self, agent_positions):
        """Update agent positions before ORCA step."""
        for i, pos in enumerate(agent_positions):
            self.sim.setAgentPosition(self.agent_ids[i], (pos[0], pos[1]))
    
    def step(self):
        """Run one ORCA simulation step. Returns new positions."""
        self.sim.doStep()
        
        new_positions = []
        for aid in self.agent_ids:
            pos = self.sim.getAgentPosition(aid)
            new_positions.append((pos[0], pos[1]))
        
        return new_positions
    
    def get_velocities(self):
        """Get collision-free velocities for all agents."""
        velocities = []
        for aid in self.agent_ids:
            v = self.sim.getAgentVelocity(aid)
            velocities.append((v[0], v[1]))
        return velocities
```

### 5.3 Integration Pattern

```python
# Each frame:
# 1. Behavior FSM sets goal positions for each agent
# 2. Formation controller adjusts goals for squad alignment
# 3. Pathfinder computes waypoint paths to goals
# 4. Smooth controller follows paths
# 5. ORCA adjusts velocities to avoid collisions
# 6. Positions are sent to Flask /api/state

def simulation_step(dt, agents, orca, behaviors, formation, pathfinder):
    # 1. Update behaviors (may change state, set new goals)
    for i, (agent, behavior) in enumerate(zip(agents, behaviors)):
        # Check for state transitions
        if agent.state == 'ARRIVED':
            behavior.transition('at_destination', agent, {})
        
        # Get FOV settings from behavior
        fov_angle, fov_range, scan_speed = behavior.update(dt, agent)
        agent.fov_angle = fov_angle
    
    # 2. Formation controller adjusts follower goals
    leader = agents[0]
    formation_positions = formation.get_follower_positions(
        (leader.position[0], leader.position[1]), leader.heading
    )
    
    # 3. Set ORCA goals
    for i, agent in enumerate(agents):
        if i == 0:  # Leader uses its own path
            goal = agent.path[agent.path_index] if agent.path else agent.position
        else:  # Followers use formation positions
            goal = formation_positions[i]
        orca.set_agent_goal(i, goal)
    
    # 4. ORCA step
    orca.step()
    new_velocities = orca.get_velocities()
    
    # 5. Apply velocities to agents
    for i, agent in enumerate(agents):
        vx, vy = new_velocities[i]
        agent.heading = np.degrees(np.arctan2(vy, vx))
        agent.speed = np.hypot(vx, vy)
        agent.position[0] += vx * dt
        agent.position[1] += vy * dt
```

---

## 6. Integration with Flask State API

### 6.1 New Data in `/api/state`

The existing Flask API should be extended with tactical data:

```python
@app.route('/api/state')
def get_state():
    state = {
        'agents': [],
        'coverage_pct': 0,
        'alerts': [],
        'mission_phase': 'EXPLORE',
        'formation': 'WEDGE',
        'sim_time': 0.0,
    }
    
    for i, agent in enumerate(tactical_sim.agents):
        state['agents'].append({
            'id': i,
            'name': ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO'][i],
            'x': float(agent.position[0]),
            'y': float(agent.position[1]),
            'heading': float(agent.heading),
            'speed': float(agent.speed),
            'status': agent.behavior.state,  # IDLE | PATROL | HOLD | ENGAGE | etc.
            'battery': 100 - int(agent.distance_traveled * 0.1),  # Simulated
            'type': 'GROUND' if i in [0, 2, 4] else 'DRONE',
            'fov_angle': float(agent.fov_angle),
            'fov_range': 80,
            # NEW: Path waypoints for UI rendering
            'path': [(float(p[0]), float(p[1])) for p in agent.path[agent.path_index:agent.path_index+10]],
        })
    
    state['coverage_pct'] = tactical_sim.compute_coverage()
    state['alerts'] = tactical_sim.active_alerts
    state['formation'] = tactical_sim.formation_ctrl.formation
    state['sim_time'] = tactical_sim.elapsed_time
    
    return jsonify(state)
```

### 6.2 Command Processing

```python
@app.route('/api/command', methods=['POST'])
def receive_command():
    data = request.get_json()
    cmd = data.get('command')
    agent_id = data.get('agent_id')  # None = all agents
    
    if cmd == 'DEPLOY':
        if agent_id is not None:
            tactical_sim.command_agent(agent_id, 'command_deploy')
        else:
            for i in range(5):
                tactical_sim.command_agent(i, 'command_deploy')
    
    elif cmd == 'HOLD':
        if agent_id is not None:
            tactical_sim.command_agent(agent_id, 'command_hold')
        else:
            for i in range(5):
                tactical_sim.command_agent(i, 'command_hold')
    
    elif cmd == 'RECON':
        tactical_sim.set_formation('LINE')
        for i in range(5):
            tactical_sim.command_agent(i, 'command_recon')
    
    elif cmd == 'RECALL':
        tactical_sim.set_formation('COLUMN')
        rally = tactical_sim.get_rally_point()
        for i, agent in enumerate(tactical_sim.agents):
            agent.set_path(tactical_sim.pathfinder.find_path(
                (agent.position[0], agent.position[1]),
                rally
            ))
    
    elif cmd == 'FORMATION_WEDGE':
        tactical_sim.set_formation('WEDGE')
    
    elif cmd == 'FORMATION_COLUMN':
        tactical_sim.set_formation('COLUMN')
    
    elif cmd == 'FORMATION_LINE':
        tactical_sim.set_formation('LINE')
    
    return jsonify({'ok': True})
```

---

## 7. File Layout

```
edth-munich-2026/
├── src/
│   ├── c2/
│   │   ├── server.py              # EXISTING — Flask server (extend with tactical sim)
│   │   ├── simulator.py           # EXISTING — simple simulator (replace with tactical_sim.py)
│   │   └── tactical/              # NEW FOLDER — all tactical simulation code
│   │       ├── __init__.py
│   │       ├── tactical_sim.py    # NEW — Main simulator class (orchestrates all layers)
│   │       ├── pathfinding.py     # NEW — Visibility graph + A* (extremitypathfinder)
│   │       ├── formations.py      # NEW — Formation controller (wedge/column/line)
│   │       ├── behavior.py        # NEW — FSM for agent states
│   │       ├── collision_avoidance.py  # NEW — ORCA (rvo2)
│   │       └── smooth_controller.py    # NEW — Smooth movement (accel/decel/turn)
│   │
│   ├── admin/                     # EXISTING — minimal changes
│   │   ├── index.html             # EXISTING — add 'path' rendering from agent state
│   │   └── 3d.html                # EXISTING — render agent trails (path history)
│   │
│   └── operator/                  # EXISTING — minimal changes
│       └── index.html             # EXISTING — formation command buttons
│
├── static/
│   └── ...                        # EXISTING
│
└── docs/research/
    └── MILITARY_GRADE_SIMULATION_BRIEF.md  # THIS FILE
```

---

## 8. Main Simulator Class

```python
# File: edth-munich-2026/src/c2/tactical/tactical_sim.py

from .pathfinding import TacticalPathfinder
from .formations import FormationController
from .behavior import AgentBehaviorFSM
from .collision_avoidance import ORCACollisionAvoidance
from .smooth_controller import SmoothAgentController
from shapely.geometry import Polygon
import numpy as np
import time

class TacticalSimulator:
    """
    Main tactical simulator — orchestrates all 4 layers.
    Replaces the existing simple simulator.
    """
    
    def __init__(self, boundary_coords, building_coords_list):
        # 1. Build pathfinder from map data
        boundary = Polygon(boundary_coords)
        buildings = [Polygon(c) for c in building_coords_list]
        
        self.pathfinder = TacticalPathfinder()
        self.pathfinder.load_map(boundary, buildings)
        
        # 2. Formation controller
        self.formation_ctrl = FormationController('WEDGE')
        
        # 3. Create 5 agents
        self.agents = []
        self.behaviors = []
        start_positions = [
            (500, 750), (480, 730), (520, 730), (460, 710), (540, 710)
        ]
        
        for i in range(5):
            agent = SmoothAgentController(max_speed=8.0)
            agent.position = np.array(start_positions[i], dtype=float)
            self.agents.append(agent)
            
            behavior = AgentBehaviorFSM(self.pathfinder, self.formation_ctrl)
            self.behaviors.append(behavior)
        
        # 4. Collision avoidance
        self.orca = ORCACollisionAvoidance(num_agents=5)
        self.orca.add_obstacles(buildings)
        
        # State tracking
        self.active_alerts = []
        self.elapsed_time = 0.0
        self.last_update = time.time()
        self.covered_cells = set()
    
    def update(self):
        """Called every simulation tick (10 Hz = 100ms)."""
        now = time.time()
        dt = min(now - self.last_update, 0.2)  # Cap at 200ms
        self.last_update = now
        self.elapsed_time += dt
        
        # 1. Update behaviors
        for i, (agent, behavior) in enumerate(zip(self.agents, self.behaviors)):
            fov_angle, fov_range, _ = behavior.update(dt, agent)
            agent.fov_angle = fov_angle
        
        # 2. Update smooth controllers
        for agent in self.agents:
            agent.update(dt)
        
        # 3. ORCA collision avoidance
        agent_positions = [(a.position[0], a.position[1]) for a in self.agents]
        self.orca.update_positions(agent_positions)
        
        for i, agent in enumerate(self.agents):
            goal = self._get_agent_goal(i)
            self.orca.set_agent_goal(i, goal)
        
        self.orca.step()
        new_velocities = self.orca.get_velocities()
        
        # 4. Apply ORCA velocities
        for i, agent in enumerate(self.agents):
            vx, vy = new_velocities[i]
            if np.hypot(vx, vy) > 0.1:
                agent.heading = np.degrees(np.arctan2(vy, vx))
                agent.speed = np.hypot(vx, vy)
                agent.position[0] += vx * dt
                agent.position[1] += vy * dt
        
        # 5. Update coverage
        self._update_coverage()
        
        # 6. Check for state transitions
        self._check_transitions()
    
    def _get_agent_goal(self, agent_idx):
        """Get the current goal position for an agent."""
        agent = self.agents[agent_idx]
        if agent.path and agent.path_index < len(agent.path):
            return agent.path[min(agent.path_index + 3, len(agent.path) - 1)]
        return (agent.position[0], agent.position[1])
    
    def _update_coverage(self):
        """Track which grid cells have been observed."""
        grid_size = 10
        for agent in self.agents:
            gx = int(agent.position[0] / grid_size)
            gy = int(agent.position[1] / grid_size)
            self.covered_cells.add((gx, gy))
    
    def compute_coverage(self):
        """Compute coverage percentage."""
        total_cells = (200 / 10) * (200 / 10)  # 200x200 map, 10m grid
        return len(self.covered_cells) / total_cells * 100
    
    def command_agent(self, agent_id, command):
        """Send a command to a specific agent."""
        self.behaviors[agent_id].transition(command, self.agents[agent_id], {})
    
    def set_formation(self, formation_name):
        """Change squad formation."""
        self.formation_ctrl.set_formation(formation_name)
    
    def get_rally_point(self):
        """Get the rally point (drop zone)."""
        return (500, 750)
    
    def get_state(self):
        """Return full state for Flask /api/state."""
        return {
            'agents': [{
                'id': i,
                'name': ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO'][i],
                'x': float(a.position[0]),
                'y': float(a.position[1]),
                'heading': float(a.heading),
                'speed': float(a.speed),
                'status': b.state,
                'battery': max(0, 100 - int(np.hypot(a.position[0]-500, a.position[1]-750) * 0.05)),
                'type': 'GROUND' if i in [0, 2, 4] else 'DRONE',
                'fov_angle': float(a.fov_angle),
                'fov_range': 80,
                'path': [(float(p[0]), float(p[1])) for p in a.path[a.path_index:a.path_index+8]] if a.path else [],
            } for i, (a, b) in enumerate(zip(self.agents, self.behaviors))],
            'coverage_pct': self.compute_coverage(),
            'alerts': self.active_alerts,
            'formation': self.formation_ctrl.formation,
            'sim_time': self.elapsed_time,
        }
    
    def _check_transitions(self):
        """Check for automatic state transitions."""
        for i, (agent, behavior) in enumerate(zip(self.agents, self.behaviors)):
            if agent.state == 'ARRIVED' and behavior.state == 'MOVE_TO_COVER':
                behavior.transition('at_cover', agent, {})
            elif agent.state == 'IDLE' and behavior.state == 'PATROL':
                # Reached end of patrol path, assign new one
                target = self.pathfinder.get_random_open_position()
                agent.set_path(self.pathfinder.find_path(
                    (agent.position[0], agent.position[1]), target
                ))
```

---

## 9. Frontend Changes (Minimal)

### 9.1 Render Agent Paths (2D Canvas Admin)

```javascript
// In admin/index.html, add to the render loop:

// Draw agent path (waypoints)
if (agent.path && agent.path.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = agent.color + '44';  // 25% opacity
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);  // Dashed line
    
    const start = worldToScreen(agent.path[0][0], agent.path[0][1]);
    ctx.moveTo(start.x, start.y);
    
    for (let j = 1; j < agent.path.length; j++) {
        const pt = worldToScreen(agent.path[j][0], agent.path[j][1]);
        ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);  // Reset
}
```

### 9.2 Formation Command Buttons (Operator App)

```html
<!-- Add to operator/index.html -->
<div style="display: flex; gap: 8px; margin: 12px 0;">
    <button onclick="sendCommand('FORMATION_WEDGE')" 
            style="flex: 1; background: #00F0FF22; color: #00F0FF; border: 1px solid #00F0FF;">
        🔺 WEDGE
    </button>
    <button onclick="sendCommand('FORMATION_COLUMN')" 
            style="flex: 1; background: #00F0FF22; color: #00F0FF; border: 1px solid #00F0FF;">
        ⬇ COLUMN
    </button>
    <button onclick="sendCommand('FORMATION_LINE')" 
            style="flex: 1; background: #00F0FF22; color: #00F0FF; border: 1px solid #00F0FF;">
        ⬌ LINE
    </button>
</div>
```

---

## 10. Implementation Order (Priority)

| Priority | Layer | Time | Visual Impact | File |
|---|---|---|---|---|
| **P0** | Pathfinding (extremitypathfinder) | 1h | **CRITICAL** — agents go around buildings | `pathfinding.py` |
| **P0** | Smooth controller | 30m | **HIGH** — agents turn and accelerate realistically | `smooth_controller.py` |
| **P1** | FSM behavior | 1h | **HIGH** — agents pause at cover, react to threats | `behavior.py` |
| **P1** | Formations | 45m | **HIGH** — squad moves as a unit, looks military | `formations.py` |
| **P2** | ORCA collision avoidance | 45m | **MEDIUM** — agents don't overlap | `collision_avoidance.py` |
| **P2** | Tactical simulator (orchestrator) | 1h | **MEDIUM** — ties everything together | `tactical_sim.py` |
| **P2** | Flask integration | 30m | **MEDIUM** — wire to /api/state | `server.py` |
| **P3** | Frontend path rendering | 30m | **LOW** — nice-to-have visual polish | `admin/index.html` |
| **Total** | | **~6 hours** | | |

**Friday night goal (3 hours):** Pathfinding + smooth controller + FSM. Agents now pathfind around buildings and behave tactically.

**Saturday morning (3 hours):** Formations + ORCA + integration. Full squad AI working.

---

## 11. Key Resources

### Libraries
- **extremitypathfinder**: `pip install extremitypathfinder` — visibility graph A* [^255^][^260^]
- **rvo2**: `pip install rvo2` — ORCA collision avoidance [^254^]
- **py_trees**: `pip install py-trees` — behavior trees (optional) [^270^]
- **shapely**: Already in project — geometric operations [^269^]

### Military Doctrine
- **FM 3-21.8** (Infantry Platoon and Squad): `https://www.marines.mil/Portals/1/Publications/FM%203-21.8%20%20The%20Infantry%20Rifle%20Platoon%20and%20Squad_3.pdf` [^283^]
- **FM 3-21.9** (Rifle Platoon and Squad Operations): `https://www.globalsecurity.org/military/library/policy/army/fm/3-21-9/chap3.htm` [^278^]
- **Movement formations PPT**: `https://www.slideshare.net/slideshow/move-tactically/6826183` [^279^]

### Algorithms
- **ORCA paper**: van den Berg et al. "Reciprocal Velocity Obstacles" [^249^]
- **Visibility graph**: `https://redblobgames.github.io/circular-obstacle-pathfinding/` [^288^]
- **Tactical pathfinding**: `https://www.gamedeveloper.com/programming/tactical-pathfinding-with-astar-influence-maps` [^275^]
- **extremitypathfinder docs**: `https://extremitypathfinder.readthedocs.io/` [^255^]

### Open Source Projects
- **ROS2 Nav2**: `https://navigation.ros.org/` — behavior trees + planners [^258^][^256^]
- **OpenRA**: `https://github.com/OpenRA/OpenRA` — RTS pathfinding + formations
- **Zero-K**: `https://github.com/ZeroK-RTS/Zero-K` — spring engine tactical AI

---

*Four layers. Six hours. From "agents on rails" to a squad that moves, thinks, and fights like real infantry. The frontends don't change — they just receive better data. Go build the brain.*
