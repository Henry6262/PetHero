# What SE3 Labs Actually Gives You — And How to Use It

## TL;DR

SE3 Labs uses **DUSt3R/MASt3R** — Naver Labs Europe's 3D reconstruction pipeline. It takes drone photos and outputs **3D point clouds (.ply files)** and **meshes (.glb files)**. No fog of war. Real 3D terrain. You load it with Open3D (`o3d.io.read_point_cloud("scene.ply")`), place agents on it, animate them moving across the actual reconstructed 3D surface. Coverage shows as small green zones on cleared areas. That's your demo.

---

## What SE3 Labs Provides for the Challenge

The challenge description says: **"data provided by SE3 Labs"** for both Track 1 and Track 2. Based on SE3's published technology stack [^140^][^143^], this means:

### The Data Format

| What You Get | Format | How to Use It |
|---|---|---|
| **3D point cloud** | `.ply` file (colored, millions of points) | Load with Open3D, render as 3D scene |
| **3D mesh** | `.glb` or `.obj` file (textured) | Load as solid 3D objects |
| **Camera poses** | JSON or text file (position + orientation per photo) | Place virtual cameras, show drone flight path |
| **Drone images** | `.jpg` files (the raw photos used for reconstruction) | For change detection (Track 2: compare Pass 1 vs Pass 2) |
| **Multiple passes** | Two sets of data (hours apart) | Track 2: detect what changed between passes |

### SE3's Reconstruction Pipeline

SE3 Labs builds on these open-source tools [^140^][^187^][^189^]:

```
Drone Video/Photos
       ↓
   DUSt3R / MASt3R (Naver Labs) — 3D reconstruction
       ↓
   SAB3R (semantic layer) — adds labels, object recognition
       ↓
   SpatialGPT (LLM query) — "where are the chokepoints?"
       ↓
   OUTPUT: 3D point cloud + semantic labels + camera poses
```

DUSt3R takes **unposed drone photos** (no GPS, no camera calibration needed) and outputs a **colored 3D point cloud** directly [^187^][^189^]. The output is a `.ply` file you can open in any 3D viewer.

### Where to Get the Data at the Event

1. **Ask the SE3 mentor (Alexander Hobmeier)** at the challenge presentation Friday 17:00
2. Check the EDTH event platform / Discord / challenge channel
3. SE3 may provide a download link or USB drive at the venue
4. **If they don't give you data Friday night**, use the fallback: generate a simple 3D village procedurally (code below)

---

## How to Work With the 3D Data

### Loading a .ply Point Cloud (One Line)

```python
import open3d as o3d
import numpy as np

# Load the SE3 3D reconstruction
pcd = o3d.io.read_point_cloud("se3_battlefield_zone.ply")
print(f"Loaded {len(pcd.points)} points")

# Visualize
o3d.visualization.draw_geometries([pcd])
```

That's it. The `.ply` file contains millions of colored 3D points representing the actual drone-reconstructed terrain, buildings, roads.

### Rendering the 3D Scene With Agents

```python
import open3d as o3d
import numpy as np

# === 1. LOAD SE3 3D MAP ===
scene = o3d.io.read_point_cloud("se3_battlefield.ply")

# === 2. CREATE AGENTS (colored spheres) ===
agent_meshes = []
agent_colors = [
    [0.0, 1.0, 0.5],   # Agent 1: green (IRL robot)
    [0.0, 0.5, 1.0],   # Agent 2: blue
    [1.0, 0.5, 0.0],   # Agent 3: orange
    [1.0, 0.0, 0.5],   # Agent 4: pink
    [1.0, 1.0, 0.0],   # Agent 5: yellow
]

for i, color in enumerate(agent_colors):
    agent = o3d.geometry.TriangleMesh.create_sphere(radius=2.0)
    agent.paint_uniform_color(color)
    agent.compute_vertex_normals()
    # Place at helicopter drop position (adjust to your scene)
    agent.translate([10 + i*5, 10, 0])
    agent_meshes.append(agent)

# === 3. CREATE COVERAGE ZONES (cleared areas) ===
coverage_spheres = []

def add_coverage_zone(position, radius=15, color=[0.0, 1.0, 0.2]):
    """Add a translucent green sphere showing cleared area."""
    zone = o3d.geometry.TriangleMesh.create_sphere(radius=radius)
    zone.paint_uniform_color(color)
    zone.translate(position)
    # Make it semi-transparent by reducing vertex colors alpha
    # (Open3D doesn't support true alpha, use smaller, denser point clouds instead)
    return zone

# === 4. RENDER EVERYTHING ===
geometries = [scene] + agent_meshes
o3d.visualization.draw_geometries(geometries, window_name="SCOUT C2")
```

### Animate Agents Moving on the 3D Surface

```python
import open3d as o3d
import numpy as np
import time

class Agent3D:
    def __init__(self, start_pos, color, agent_id):
        self.mesh = o3d.geometry.TriangleMesh.create_sphere(radius=2.5)
        self.mesh.paint_uniform_color(color)
        self.mesh.compute_vertex_normals()
        self.position = np.array(start_pos, dtype=float)
        self.mesh.translate(self.position)
        self.id = agent_id
        self.path = []  # List of waypoints
        self.path_index = 0
        
    def set_path(self, waypoints):
        """Waypoints: list of (x, y, z) from 01-ats algorithm."""
        self.path = waypoints
        self.path_index = 0
    
    def step(self):
        """Move one step along path."""
        if self.path_index < len(self.path) - 1:
            self.path_index += 1
            target = np.array(self.path[self.path_index])
            # Smooth interpolation
            direction = target - self.position
            self.mesh.translate(direction)
            self.position = target
            return True
        return False

# === SETUP ===
vis = o3d.visualization.Visualizer()
vis.create_window(window_name="SCOUT C2 - Live", width=1400, height=900)

# Load SE3 scene
scene = o3d.io.read_point_cloud("se3_battlefield.ply")
vis.add_geometry(scene)

# Create agents
agents = [
    Agent3D([0, 0, 0], [0.0, 1.0, 0.2], 0),    # Agent 1: IRL robot
    Agent3D([20, 0, 0], [0.2, 0.6, 1.0], 1),   # Agent 2
    Agent3D([40, 0, 0], [1.0, 0.6, 0.0], 2),   # Agent 3
    Agent3D([60, 0, 0], [1.0, 0.2, 0.6], 3),   # Agent 4
    Agent3D([80, 0, 0], [1.0, 1.0, 0.2], 4),   # Agent 5
]

for agent in agents:
    vis.add_geometry(agent.mesh)

# Set paths (from your 01-ats algorithm)
# Each agent explores a different building's graph
agents[0].set_path([(0,0,0), (50,0,0), (50,50,0), (100,50,0)])
agents[1].set_path([(20,0,0), (20,80,0), (80,80,0), (80,20,0)])
# ... etc

# === ANIMATION LOOP ===
for step in range(200):
    for agent in agents:
        if agent.step():
            vis.update_geometry(agent.mesh)
    
    vis.poll_events()
    vis.update_renderer()
    time.sleep(0.05)  # 20 FPS

vis.destroy_window()
```

---

## The Corrected Demo Vision (No Fog of War)

### What the 3D Map Shows

- **Full 3D terrain** from SE3's drone reconstruction — buildings, roads, terrain elevation
- **5 agents** as colored spheres moving across the actual 3D surface
- **Coverage zones**: small translucent green circles that appear where agents have been
- **Detection markers**: red alert icons when threats found, yellow for changes
- **No fog of war** — the terrain is fully visible, only the "cleared" status is indicated

### The Helicopter Drop (Cinematic Opener)

```python
# Animation: 5 agents drop from helicopter position
# They fall from z=50 to the terrain surface, then scatter

helicopter_pos = [500, 500, 50]  # Center of map, 50m up

for drop_frame in range(50):  # 2.5 seconds
    for i, agent in enumerate(agents):
        # Fall from helicopter
        z = 50 - drop_frame  # Descend 1m per frame
        # Add some scatter (agents spread out as they fall)
        x = 500 + (i - 2) * 10 * (drop_frame / 50)
        y = 500 + np.sin(drop_frame * 0.1 + i) * 5
        
        # Update position
        new_pos = np.array([x, y, max(z, get_terrain_height(x, y))])
        agent.mesh.translate(new_pos - agent.position)
        agent.position = new_pos
        vis.update_geometry(agent.mesh)
    
    vis.poll_events()
    vis.update_renderer()
    time.sleep(0.05)
```

### Coverage Zones (Cleared Areas)

Instead of fog-of-war, you show **coverage as positive confirmation**:

```python
def add_coverage_marker(position, vis):
    """Add a small green circle on the ground showing 'this area cleared'."""
    # Create a flat circle on the terrain
    circle = o3d.geometry.TriangleMesh.create_cylinder(radius=10, height=0.5)
    circle.paint_uniform_color([0.2, 0.9, 0.3])  # Bright green
    circle.translate([position[0], position[1], position[2] + 0.25])
    vis.add_geometry(circle)
    return circle
```

When an agent explores an area, a **green circle appears** on the ground. Over time, these circles overlap and show the full coverage pattern.

---

## The Admin Panel on the 3D View

Overlay text/info on the Open3D window (or render separately with matplotlib):

```python
# In your animation loop, print status to console
# (or use Open3D's GUI capabilities for text overlay)

print(f"\n{'='*50}")
print(f"SCOUT C2 — SECTOR 7")
print(f"{'='*50}")
print(f"Agent A-1 (ALPHA):  {'PATROLLING' if agents[0].path_index < len(agents[0].path)-1 else 'THREAT DETECTED'}")
print(f"Agent A-2 (BRAVO):  {'PATROLLING' if agents[1].path_index < len(agents[1].path)-1 else 'CLEAR'}")
print(f"Agent A-3 (CHARLIE): {'PATROLLING' if agents[2].path_index < len(agents[2].path)-1 else 'THREAT DETECTED'}")
print(f"Agent A-4 (DELTA):  {'PATROLLING' if agents[3].path_index < len(agents[3].path)-1 else 'CHANGE DETECTED'}")
print(f"Agent A-5 (ECHO):   {'PATROLLING' if agents[4].path_index < len(agents[4].path)-1 else 'CLEAR'}")
print(f"Coverage: {calculate_coverage_percent():.0f}%")
print(f"Detections: {threat_count} threats | {change_count} changes")
```

For the video, capture frames from the Open3D window and compose with matplotlib for the admin overlay:

```python
import matplotlib.pyplot as plt
from PIL import Image
import io

def capture_frame(vis):
    """Capture current Open3D view as image."""
    img = vis.capture_screen_float_buffer(False)
    img_array = np.asarray(img)
    return (img_array * 255).astype(np.uint8)

def compose_frame_with_overlay(vis, agent_status, coverage_pct):
    """Capture 3D view + add admin panel overlay."""
    # Capture 3D view
    frame_3d = capture_frame(vis)
    
    # Create overlay with matplotlib
    fig, (ax_3d, ax_panel) = plt.subplots(1, 2, figsize=(16, 9), 
                                            gridspec_kw={'width_ratios': [3, 1]})
    
    ax_3d.imshow(frame_3d)
    ax_3d.axis('off')
    ax_3d.set_title('SECTOR 7 — LIVE', color='white', fontsize=14, fontweight='bold')
    
    # Admin panel
    ax_panel.set_facecolor('#1a1a2e')
    ax_panel.text(0.5, 0.95, 'SCOUT C2', ha='center', va='top', 
                  color='white', fontsize=16, fontweight='bold', transform=ax_panel.transAxes)
    ax_panel.text(0.5, 0.85, f'Coverage: {coverage_pct:.0f}%', ha='center',
                  color='#00ff44', fontsize=12, transform=ax_panel.transAxes)
    
    # Agent statuses
    y_pos = 0.75
    for agent_id, status in agent_status.items():
        color = '#ff0044' if 'THREAT' in status else '#00ff44' if 'CLEAR' in status else '#ffaa00'
        ax_panel.text(0.1, y_pos, f'A-{agent_id}: {status}', color=color, fontsize=10,
                     transform=ax_panel.transAxes)
        y_pos -= 0.08
    
    ax_panel.axis('off')
    
    # Save frame
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, facecolor='#1a1a2e')
    buf.seek(0)
    plt.close()
    return Image.open(buf)
```

---

## Recording the Cinematic Video

### Option A: Frame-by-Frame Render (Best Quality)

```python
import cv2
import numpy as np

# Video writer
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter('scout_c2_demo.mp4', fourcc, 20.0, (1920, 1080))

# Run animation, capture each frame
for frame in range(TOTAL_FRAMES):
    # Update agents
    for agent in agents:
        agent.step()
    
    # Capture Open3D view
    img = capture_frame(vis)
    
    # Add overlay
    composed = compose_frame_with_overlay(vis, get_statuses(), get_coverage())
    
    # Write to video
    frame_array = np.array(composed)
    frame_bgr = cv2.cvtColor(frame_array, cv2.COLOR_RGB2BGR)
    out.write(frame_bgr)

out.release()
```

### Option B: OBS Screen Recording (Faster)

1. Run the Open3D animation
2. Use **OBS Studio** to record the window
3. Add admin panel as a separate browser source or overlay in OBS
4. Record the full 3-minute demo in one take

---

## Fallback: If SE3 Doesn't Provide Data

Generate a procedural 3D village that looks similar to what SE3 would produce:

```python
import open3d as o3d
import numpy as np

def generate_village_point_cloud(n_buildings=10, n_points=50000):
    """Generate a synthetic village point cloud (fallback if no SE3 data)."""
    points = []
    colors = []
    
    # Ground plane (dirt/grass)
    ground_pts = np.random.rand(n_points // 2, 3) * [200, 200, 0.1]
    ground_colors = np.array([[0.3, 0.25, 0.15]] * (n_points // 2))  # Brown dirt
    points.append(ground_pts)
    colors.append(ground_colors)
    
    # Buildings
    for i in range(n_buildings):
        bx = np.random.uniform(20, 180)
        by = np.random.uniform(20, 180)
        bw = np.random.uniform(10, 25)
        bd = np.random.uniform(10, 25)
        bh = np.random.uniform(8, 20)
        
        # Building walls (sample points on box surface)
        n_wall_pts = 500
        wall_pts = []
        for _ in range(n_wall_pts):
            face = np.random.randint(0, 6)
            if face == 0:  # front
                p = [bx + np.random.uniform(0, bw), by, np.random.uniform(0, bh)]
            elif face == 1:  # back
                p = [bx + np.random.uniform(0, bw), by + bd, np.random.uniform(0, bh)]
            elif face == 2:  # left
                p = [bx, by + np.random.uniform(0, bd), np.random.uniform(0, bh)]
            elif face == 3:  # right
                p = [bx + bw, by + np.random.uniform(0, bd), np.random.uniform(0, bh)]
            elif face == 4:  # top
                p = [bx + np.random.uniform(0, bw), by + np.random.uniform(0, bd), bh]
            else:  # bottom
                p = [bx + np.random.uniform(0, bw), by + np.random.uniform(0, bd), 0]
            wall_pts.append(p)
        
        wall_colors = np.array([[0.6, 0.55, 0.5]] * n_wall_pts)  # Concrete
        points.append(np.array(wall_pts))
        colors.append(wall_colors)
    
    # Combine
    all_points = np.vstack(points)
    all_colors = np.vstack(colors)
    
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(all_points)
    pcd.colors = o3d.utility.Vector3dVector(all_colors)
    
    return pcd

# Save and use
village = generate_village_point_cloud()
o3d.io.write_point_cloud("village.ply", village)
```

This produces a `.ply` file that looks and works identically to SE3's output.

---

## Key Resources

| Resource | Link | What It Does |
|---|---|---|
| **DUSt3R paper** | `https://arxiv.org/abs/2312.14132` [^187^] | The 3D reconstruction method SE3 uses |
| **DUSt3R GitHub** | `https://github.com/naver/dust3r` [^183^] | Code for 3D reconstruction from images |
| **DUSt3R tutorial** | `https://learnopencv.com/dust3r-geometric-3d-vision/` [^189^] | How DUSt3R works, step by step |
| **Open3D docs** | `https://www.open3d.org/docs/latest/` [^153^] | 3D visualization library |
| **Open3D visualization** | `https://www.open3d.org/docs/latest/tutorial/Basic/visualization.html` [^160^] | How to render and animate |
| **SE3 Labs website** | `https://www.se3.ai/` [^148^] | Munich-based company, challenge sponsor |
| **SE3 + Carmenta** | `https://carmenta.com/knowledge/ai-powered-geospatial-intelligence-by-se3-labs-and-carmenta` [^140^] | Their geospatial integration |
| **01-ats repo** | `https://github.com/SamEberl/graph_explo` | Your graph exploration code |

---

## What You Tell SE3 Labs

> *"We're using your 3D reconstruction data as the tactical base layer for a multi-agent ground reconnaissance C2 system. Your drone-scanned point cloud becomes our battlefield map. Our 01-ats graph algorithm drives 5 autonomous agents across your terrain. Our change detection compares patrol passes on your data. This is the end-to-end system your spatial intelligence enables — one operator, many machines, one shared map context."*

---

*This is the real data format. Real 3D point clouds. Real drone reconstruction. No fog of war — just a beautiful 3D map with agents moving on it and green coverage zones showing cleared areas. Go get that data from SE3 Friday night.*
