# 3D Demo Research Brief
## SCOUT C2 — Upgrading from 2D to 3D for EDTH Munich 2026

**TL;DR:** Use **Three.js** in the browser for real-time 3D rendering. Load a `.ply` point cloud (SE3 data or self-generated) with `THREE.PLYLoader`. Represent agents as colored spheres. Render FOV cones with `THREE.ConeGeometry`. Accumulate coverage with `THREE.CircleGeometry` on the ground plane. Update agent positions by polling `/api/state` every 500ms. For the 3-minute cinematic video, use **Open3D offscreen rendering** to capture frames and **ffmpeg** to stitch into MP4 with a matplotlib admin overlay. Target ~200K points for desktop, ~50K for phone.

---

## 1. 3D Map Data — Four Options Ranked

### Option A: SE3 Labs Data (Best if Available)

SE3 Labs uses the **DUSt3R/MASt3R** pipeline from Naver Labs Europe [^187^][^189^]. Their challenge data is likely:

| Format | File Extension | How to Load |
|---|---|---|
| **Point cloud** | `.ply` | `o3d.io.read_point_cloud()` / `THREE.PLYLoader` |
| **Mesh** | `.glb`/`.gltf` | `THREE.GLTFLoader` |
| **Camera poses** | `.json`/`.txt` | Parse positions for drone flight path visualization |

**How to obtain it:**
- Ask **Alexander Hobmeier** (SE3 Labs mentor) at the challenge presentation Friday 17:00
- Check EDTH Discord / event platform for download links
- SE3 is a Munich company at Ungererstraße 175 [^148^] — they may provide USB drives at the venue

**DUSt3R output format:** Running DUSt3R's `demo.py` produces a `.glb` file directly [^183^][^184^]. SE3 likely provides similar output.

### Option B: Procedural Open3D Generation (Fastest, Guaranteed)

Generate a 3D village in ~30 lines of Python. No external data needed. Fully controllable.

```python
import open3d as o3d
import numpy as np

def make_village(n_buildings=10, n_ground_pts=20000, n_building_pts=1000):
    points, colors = [], []
    
    # Ground plane (brown dirt)
    for _ in range(n_ground_pts):
        points.append([np.random.uniform(0,200), np.random.uniform(0,200), 0])
        colors.append([0.3, 0.25, 0.15])
    
    # Buildings (concrete boxes)
    for i in range(n_buildings):
        bx, by = np.random.uniform(20,180), np.random.uniform(20,180)
        bw, bd, bh = np.random.uniform(8,25), np.random.uniform(8,25), np.random.uniform(5,20)
        for _ in range(n_building_pts):
            face = np.random.randint(0,6)
            if face == 0: p = [bx+np.random.uniform(0,bw), by, np.random.uniform(0,bh)]
            elif face == 1: p = [bx+np.random.uniform(0,bw), by+bd, np.random.uniform(0,bh)]
            elif face == 2: p = [bx, by+np.random.uniform(0,bd), np.random.uniform(0,bh)]
            elif face == 3: p = [bx+bw, by+np.random.uniform(0,bd), np.random.uniform(0,bh)]
            elif face == 4: p = [bx+np.random.uniform(0,bw), by+np.random.uniform(0,bd), bh]
            else: p = [bx+np.random.uniform(0,bw), by+np.random.uniform(0,bd), 0]
            points.append(p)
            colors.append([0.6, 0.55, 0.5])
    
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(np.array(points))
    pcd.colors = o3d.utility.Vector3dVector(np.array(colors))
    return pcd

# Save as .ply for Three.js
village = make_village()
o3d.io.write_point_cloud("village.ply", village)
print(f"Generated {len(village.points)} points")
```

**Output:** A `.ply` file with ~30K points. Loads instantly in Three.js.

### Option C: DUSt3R on Drone Video (Most Impressive, Time-Consuming)

Take a free drone video, extract frames, run DUSt3R to reconstruct 3D.

**Free drone video found:** [Aerial drone view of English village](https://www.pexels.com/video/aerial-drone-view-of-quaint-english-village-29055833/) by David Pickup on Pexels [^208^]. Free stock video license, usable for hackathon demos.

**Steps:**
```bash
# 1. Download video, extract frames (1 fps = ~60 frames for 60s video)
ffmpeg -i village_drone.mp4 -vf "fps=1,scale=512:-1" frames/frame_%04d.jpg

# 2. Run DUSt3R (requires GPU, ~10-30 minutes)
git clone https://github.com/naver/dust3r.git
cd dust3r
python demo.py --image_dir ../frames --output_path village.glb

# 3. Convert .glb to .ply if needed (Three.js PLYLoader can't load .glb directly)
# Use trimesh or pygltflib for conversion
```

**Trade-off:** Most impressive result (real reconstructed village) but requires GPU and 30+ minutes. Do this Saturday morning only if the procedural village looks too fake.

### Option D: Rerun 3D Viz (Quickest to See Something, Not for Browser)

```python
import rerun as rr
rr.init("scout_c2")
rr.spawn()  # Opens viewer window
rr.log("village", rr.Points3D(positions, colors=colors))
```

**Problem:** Rerun viewer is a desktop app, not embeddable in a browser. Useful for Python-side debugging but not for the admin/operator web apps. Rerun also notes that "multi-million point clouds can be slow" [^91^].

### Recommendation

| Priority | Option | When to Use |
|---|---|---|
| **1** | **B — Procedural** | Friday night, guaranteed to work, 30 minutes |
| **2** | **A — SE3 Data** | Friday 17:00, if they provide it, use it |
| **3** | **D — Rerun** | Saturday morning if you want a quick preview |
| **4** | **C — DUSt3R** | Saturday morning if you have GPU time and want real data |

**Friday night path:** Generate procedural village → save as `.ply` → load in Three.js → done. Everything else is bonus.

---

## 2. 3D Rendering Stack — Three.js Wins

### Comparison

| Criterion | Three.js | Rerun | Open3D Web | Babylon.js |
|---|---|---|---|---|
| **Browser native** | ✅ Yes | ❌ Desktop only | ❌ Experimental | ✅ Yes |
| **PLY loader** | ✅ `PLYLoader` | ✅ Built-in | ❌ Limited | ❌ External |
| **Point cloud perf** | ✅ 2M pts @ 60 FPS [^209^] | ✅ Fast | ⚠️ Unstable | ✅ Good |
| **Flask integration** | ✅ JSON polling | ❌ Separate process | ❌ Difficult | ✅ Similar to Three.js |
| **Phone support** | ✅ iOS 60 FPS [^222^] | ❌ No | ❌ No | ✅ Good |
| **Bundle size** | ✅ 500KB gzipped [^231^] | N/A (desktop) | N/A | ⚠️ Larger |
| **Learning curve** | ✅ Moderate | ✅ Easy (Python) | ⚠️ Steep | ⚠️ Steep |
| **Community/docs** | ✅ Massive | ✅ Growing | ✅ Good | ✅ Good |
| **Video export** | ❌ Manual frames | ✅ `rr.save()` | ⚠️ OffscreenRenderer | ❌ Manual frames |

### Why Three.js

- **Only option that runs in both laptop and phone browsers** [^230^]
- **Native PLYLoader** — load SE3 data directly [^221^]
- **Proven point cloud performance** — 2M points at 60 FPS with proper optimization [^209^]
- **500KB gzipped bundle** — loads in 2-6 seconds [^231^]
- **Full DOM integration** — overlay HTML admin panel on top of canvas
- **WebGL 2.0 support** — >92% global mobile browser support [^231^]

### Why Not Rerun for the Frontend

Rerun is excellent for Python-side visualization (you log data, it renders beautifully). But:
- It's a **desktop application**, not a web library
- The web viewer (`rerun --web-viewer`) is experimental and heavy
- Cannot be embedded in your existing `index.html` admin/operator apps
- Best use: debug your 3D data in Python, export frames for the video

### Why Not Open3D for the Frontend

Open3D has a web visualizer (`draw_plotly`, WebRTC streaming) but:
- WebRTC is experimental and complex to set up
- `draw_plotly` is static, not interactive/real-time
- Not designed for Flask integration or mobile browsers

---

## 3. Loading a PLY Point Cloud in Three.js (Browser)

```javascript
// File: edth-munich-2026/src/admin/three-scene.js

import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ── SCENE SETUP ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0A0E1A); // BG_PRIMARY

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(100, 80, 100); // Bird's eye view
camera.lookAt(100, 0, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('map-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.1; // Don't go below ground

// ── LIGHTING ──
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 100, 50);
scene.add(dirLight);

// ── LOAD POINT CLOUD ──
const loader = new PLYLoader();
loader.load('/static/village.ply', (geometry) => {
    // PLYLoader returns BufferGeometry with position and color attributes
    geometry.computeVertexNormals();
    
    const material = new THREE.PointsMaterial({
        size: 0.3,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: false,
        opacity: 1.0
    });
    
    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);
    console.log(`Loaded ${geometry.attributes.position.count} points`);
});

// ── AGENT REPRESENTATION ──
const agentColors = [
    new THREE.Color(0x00FF88), // A-1: green
    new THREE.Color(0x0088FF), // A-2: blue
    new THREE.Color(0xFF8800), // A-3: orange
    new THREE.Color(0xFF0088), // A-4: pink
    new THREE.Color(0xCCFF00), // A-5: lime
];

const agents = [];
for (let i = 0; i < 5; i++) {
    const sphereGeo = new THREE.SphereGeometry(2, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: agentColors[i] });
    const agent = new THREE.Mesh(sphereGeo, sphereMat);
    agent.position.set(50 + i * 25, 5, 50); // Initial positions
    scene.add(agent);
    agents.push({ mesh: agent, id: i });
}

// ── FOV CONE ──
function createFOVCone(color, parent) {
    // Cone: radiusTop, radiusBottom, height, radialSegments
    const coneGeo = new THREE.ConeGeometry(15, 30, 32, 1, true);
    coneGeo.rotateX(Math.PI / 2); // Point along Z-axis (forward)
    const coneMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 0, 15); // Offset so apex is at agent center
    parent.add(cone);
    return cone;
}

// Add FOV cones to agents
agents.forEach((agent, i) => {
    agent.fov = createFOVCone(agentColors[i], agent.mesh);
});

// ── COVERAGE ZONES ──
const coverageGroup = new THREE.Group();
scene.add(coverageGroup);

function addCoverageZone(position, color) {
    const circleGeo = new THREE.CircleGeometry(12, 32);
    const circleMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    circle.rotation.x = -Math.PI / 2; // Lay flat on ground
    circle.position.copy(position);
    circle.position.y = 0.5; // Slightly above ground
    coverageGroup.add(circle);
}

// ── STATE UPDATE FROM FLASK ──
async function fetchState() {
    try {
        const res = await fetch('/api/state');
        const state = await res.json();
        updateAgents(state.agents);
        updateCoverage(state.coverage_zones);
        updateAlerts(state.alerts);
    } catch (e) {
        console.error('State fetch failed:', e);
    }
}

function updateAgents(agentData) {
    agentData.forEach((data, i) => {
        if (agents[i]) {
            // Lerp for smooth movement
            const target = new THREE.Vector3(data.x, data.y, data.z);
            agents[i].mesh.position.lerp(target, 0.3);
            
            // Rotate agent to face movement direction
            if (data.heading !== undefined) {
                agents[i].mesh.rotation.y = -data.heading * (Math.PI / 180);
            }
            
            // Update FOV cone color based on status
            const status = data.status;
            if (status === 'THREAT') agents[i].fov.material.color.setHex(0xFF3366);
            else if (status === 'CHANGE') agents[i].fov.material.color.setHex(0xFFCC00);
            else agents[i].fov.material.color.copy(agentColors[i]);
        }
    });
}

// Poll every 500ms
setInterval(fetchState, 500);

// ── RENDER LOOP ──
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// ── RESIZE HANDLER ──
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

---

## 4. FOV Cones and Coverage Zones in 3D

### FOV Cone (Three.js)

The FOV cone is a `ConeGeometry` with the apex at the agent's camera position, pointing in the agent's facing direction.

```javascript
// Key: rotate geometry so cone points along Z-axis, then use lookAt or rotation
const coneGeo = new THREE.ConeGeometry(radiusBottom, height, radialSegments, 1, true);
coneGeo.rotateX(Math.PI / 2); // Default cone points up Y; rotate to point Z [^239^]

const coneMat = new THREE.MeshBasicMaterial({
    color: agentColor,
    transparent: true,
    opacity: 0.08, // Very subtle
    side: THREE.DoubleSide,
    depthWrite: false // Prevents z-fighting with point cloud
});

const cone = new THREE.Mesh(coneGeo, coneMat);
cone.position.set(0, 0, height / 2); // Offset so apex is at origin
agentMesh.add(cone); // Child of agent — moves and rotates with it

// To face a direction:
agentMesh.lookAt(targetPosition); // Rotates entire agent + cone
```

### Coverage Zones on Terrain

Coverage is a **projected circle** on the ground plane at the agent's position:

```javascript
function addCoverageZone(position, color) {
    const circleGeo = new THREE.CircleGeometry(12, 32); // Radius 12, 32 segments
    const circleMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    circle.rotation.x = -Math.PI / 2; // Lay flat (XZ plane)
    circle.position.set(position.x, 0.5, position.z); // Just above ground
    coverageGroup.add(circle);
}
```

### Coverage Percentage Calculation

Track visited positions in a Set, compute bounding box ratio:

```python
# In the Python simulator
covered_cells = set()  # Grid cells that have been within any agent's FOV

def update_coverage(agent_positions, fov_radius=15, grid_size=5):
    """Mark grid cells as covered when an agent's FOV overlaps them."""
    for pos in agent_positions:
        gx, gz = int(pos[0] / grid_size), int(pos[2] / grid_size)
        # Mark cells within FOV radius
        for dx in range(-int(fov_radius/grid_size), int(fov_radius/grid_size)+1):
            for dz in range(-int(fov_radius/grid_size), int(fov_radius/grid_size)+1):
                if dx*dx + dz*dz <= (fov_radius/grid_size)**2:
                    covered_cells.add((gx+dx, gz+dz))
    
    # Coverage % = covered cells / total village cells
    total_cells = (200/grid_size) * (200/grid_size)  # Village is 200x200
    coverage_pct = len(covered_cells) / total_cells * 100
    return coverage_pct
```

---

## 5. Point Cloud Performance & Decimation

### Performance Targets

| Device | Max Points | Expected FPS | Strategy |
|---|---|---|---|
| **Desktop (admin)** | 500K — 2M | 60 FPS | Full point cloud, all effects |
| **Phone (operator)** | 50K — 200K | 30+ FPS | Decimated cloud, minimal effects |
| **Entry-level Android** | 20K — 50K | 20+ FPS | Heavy decimation, no FOV cones |

### Decimation Code (Open3D)

```python
import open3d as o3d

# Load full-resolution point cloud
pcd = o3d.io.read_point_cloud("village_full.ply")
print(f"Original: {len(pcd.points)} points")

# Voxel downsampling — one line, massive reduction [^223^]
pcd_desktop = pcd.voxel_down_sample(voxel_size=0.2)  # ~200K-500K points
pcd_phone = pcd.voxel_down_sample(voxel_size=0.5)     # ~50K-100K points

o3d.io.write_point_cloud("village_desktop.ply", pcd_desktop)
o3d.io.write_point_cloud("village_phone.ply", pcd_phone)

print(f"Desktop: {len(pcd_desktop.points)} points")
print(f"Phone: {len(pcd_phone.points)} points")
```

Typical results:
- **Original** (procedural village): ~30K points → no decimation needed
- **SE3 data** (if provided): 1M-10M points → decimate to 200K for desktop

### Three.js PointsMaterial Optimization

```javascript
const material = new THREE.PointsMaterial({
    size: 0.3,              // Small points = better performance
    sizeAttenuation: true,  // Points shrink with distance [^236^]
    vertexColors: true,     // Use per-point colors from PLY
    transparent: false,     // No transparency = faster
    opacity: 1.0
});
```

**Critical:** `sizeAttenuation: true` is essential — it makes distant points smaller, reducing pixel overdraw [^235^]. Without it, large points cause massive fill-rate bottlenecks.

---

## 6. Threat & Change Markers in 3D

### Billboard Sprites (Recommended)

Use `THREE.Sprite` with a canvas-generated texture — always faces camera:

```javascript
function createAlertSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw circle background
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(10, 10, 1); // World units
    return sprite;
}

// Add threat marker to building 7
const threatSprite = createAlertSprite('!', '#FF3366');
threatSprite.position.set(building7_position.x, building7_position.y + 20, building7_position.z);
scene.add(threatSprite);

// Animate: pulse scale
function pulseSprite(sprite) {
    const baseScale = 10;
    const time = Date.now() * 0.003;
    const scale = baseScale + Math.sin(time) * 2;
    sprite.scale.set(scale, scale, 1);
}
```

### Change Detection (Before/After)

For the 3D video, show **two camera views side by side** in the admin overlay:

```javascript
// In the video rendering loop, capture two viewpoints
// Camera 1: Before state (door closed)
// Camera 2: After state (door open)

// Or: highlight changed region in the point cloud
function highlightChangedRegion(center, radius) {
    const sphereGeo = new THREE.SphereGeometry(radius, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: 0xFFCC00,
        transparent: true,
        opacity: 0.1,
        wireframe: true
    });
    const highlight = new THREE.Mesh(sphereGeo, sphereMat);
    highlight.position.copy(center);
    scene.add(highlight);
    
    // Pulse animation
    setInterval(() => {
        highlight.material.opacity = 0.1 + Math.sin(Date.now() * 0.005) * 0.05;
    }, 16);
}
```

---

## 7. Offline 3D Video Rendering — Two Paths

### Path A: Open3D OffscreenRenderer + ffmpeg (Recommended)

Best quality, fully programmable, runs headless.

```python
# File: edth-munich-2026/src/video/render_3d_video.py

import open3d as o3d
import numpy as np
import cv2
import os

# 1. Setup offscreen renderer
width, height = 1920, 1080
renderer = o3d.visualization.rendering.OffscreenRenderer(width, height)
renderer.scene.set_background([0.06, 0.055, 0.1, 1.0])  # BG_PRIMARY

# 2. Load scene
scene = o3d.io.read_point_cloud("village.ply")
material = o3d.visualization.rendering.MaterialRecord()
material.shader = "defaultUnlit"
material.point_size = 2.0
renderer.scene.add_geometry("village", scene, material)

# 3. Setup camera (bird's eye view)
camera = renderer.scene.camera
camera.look_at([100, 0, 100], [100, 80, 100], [0, 1, 0])

# 4. Add agents
agent_colors = [[0,1,0.5], [0,0.5,1], [1,0.5,0], [1,0,0.5], [1,1,0]]
for i in range(5):
    sphere = o3d.geometry.TriangleMesh.create_sphere(radius=2)
    sphere.paint_uniform_color(agent_colors[i])
    renderer.scene.add_geometry(f"agent_{i}", sphere, material)

# 5. Animation + frame capture
fps = 30
total_frames = fps * 180  # 3 minutes
output_dir = "frames"
os.makedirs(output_dir, exist_ok=True)

for frame in range(total_frames):
    # Update agent positions from pre-computed paths
    for i in range(5):
        pos = agent_paths[i][min(frame, len(agent_paths[i])-1)]
        renderer.scene.set_geometry_transform(f"agent_{i}", 
            np.eye(4))  # Set position transform
    
    # Render frame
    img = renderer.render_to_image()
    img_np = np.asarray(img)
    cv2.imwrite(f"{output_dir}/frame_{frame:05d}.png", cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR))

# 6. Stitch with ffmpeg
os.system(f"ffmpeg -y -framerate {fps} -i {output_dir}/frame_%05d.png -c:v libx264 -pix_fmt yuv420p scout_3d.mp4")
```

**Caveat:** Open3D's `OffscreenRenderer` is experimental and may have issues on some systems. Test early.

### Path B: OBS Screen Capture (Simplest, Most Reliable)

1. Run the Three.js visualization in a browser (admin dashboard)
2. Launch OBS Studio (free, cross-platform) [^234^][^240^]
3. Add "Window Capture" source → select the browser window
4. Add "Browser" source → load the admin overlay HTML as a web page overlay
5. Hit "Start Recording" → narrate the demo
6. Hit "Stop Recording" → MP4 saved automatically

**Why this is the best approach for a hackathon:**
- Zero code needed for video export
- You can narrate live while the visualization runs
- If something goes wrong, you can re-record
- The Three.js visualization is already what the admin sees — no separate renderer

**OBS Setup (2 minutes):**
```
1. Download obsproject.com
2. Add Source → Window Capture → Select Chrome/Firefox window
3. Add Source → Browser → URL: http://localhost:5050/admin/overlay.html
4. Settings → Output → Recording Format: mp4
5. Start Recording → narrate → Stop Recording
```

### Path C: Three.js Frame-by-Frame Capture (Fallback)

```javascript
// In the Three.js render loop, capture canvas to PNG
function captureFrame(frameNumber) {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    // Send to Flask server to save
    fetch('/api/save_frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: frameNumber, image: dataURL })
    });
}
```

Then use ffmpeg to stitch: `ffmpeg -framerate 30 -i frame_%05d.png -c:v libx264 scout.mp4`

---

## 8. Admin Overlay on 3D Frames

### Matplotlib Composite (Python)

```python
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from PIL import Image
import numpy as np
import io

def compose_frame_with_overlay(frame_3d_path, agent_data, coverage_pct, alerts):
    """Overlay admin panel on 3D rendered frame."""
    
    # Load 3D frame
    frame = Image.open(frame_3d_path)
    
    # Create figure with 3D frame + admin panel
    fig = plt.figure(figsize=(19.2, 10.8), dpi=100)  # 1920x1080
    fig.patch.set_facecolor('#0A0E1A')
    
    # Left: 3D view (70% width)
    ax_3d = fig.add_axes([0, 0, 0.7, 1])
    ax_3d.imshow(frame)
    ax_3d.axis('off')
    
    # Right: Admin panel (30% width)
    ax_panel = fig.add_axes([0.7, 0, 0.3, 1])
    ax_panel.set_facecolor('#0F1629')
    ax_panel.set_xlim(0, 1)
    ax_panel.set_ylim(0, 1)
    ax_panel.axis('off')
    
    # Panel content
    ax_panel.text(0.5, 0.95, 'SCOUT C2', fontsize=24, fontweight='bold',
                  color='#00F0FF', ha='center', transform=ax_panel.transAxes)
    ax_panel.text(0.5, 0.91, f'SECTOR 7 • COVERAGE {coverage_pct:.0f}%',
                  fontsize=12, color='#6B7A9C', ha='center', transform=ax_panel.transAxes)
    
    # Agent status cards
    y = 0.85
    for agent in agent_data:
        color = {'THREAT': '#FF3366', 'CHANGE': '#FFCC00', 'CLEAR': '#00FF88'}.get(agent['status'], '#00F0FF')
        ax_panel.text(0.1, y, f"A-{agent['id']+1} {agent['name']}", fontsize=14,
                      color=color, fontweight='bold', transform=ax_panel.transAxes)
        ax_panel.text(0.1, y-0.03, f"{agent['status']} • {agent['battery']}%",
                      fontsize=10, color='#6B7A9C', transform=ax_panel.transAxes)
        y -= 0.08
    
    # Alerts
    y = 0.45
    ax_panel.text(0.1, y, 'ACTIVE ALERTS', fontsize=10, color='#6B7A9C',
                  fontweight='bold', transform=ax_panel.transAxes)
    y -= 0.04
    for alert in alerts[:3]:
        color = '#FF3366' if alert['type'] == 'THREAT' else '#FFCC00'
        ax_panel.text(0.1, y, f"• {alert['message']}", fontsize=10,
                      color=color, transform=ax_panel.transAxes)
        y -= 0.035
    
    # Save composed frame
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, facecolor='#0A0E1A', 
                bbox_inches='tight', pad_inches=0)
    buf.seek(0)
    plt.close()
    return Image.open(buf)
```

---

## 9. Integration Plan — File by File

### New Files to Create

```
edth-munich-2026/
├── src/
│   ├── c2/
│   │   ├── server.py              # EXISTING — extend /api/state with 3D positions (x,y,z)
│   │   └── simulator.py           # EXISTING — agent paths now include z coordinate
│   │
│   ├── admin/                     # EXISTING folder
│   │   ├── index.html             # EXISTING — add 3D canvas container, keep 2D as fallback
│   │   ├── three-scene.js         # NEW — Three.js 3D scene (code above)
│   │   ├── admin-overlay.js       # NEW — Squad panel, coverage bar, alerts (HTML overlay)
│   │   └── three-deps/            # NEW — three.module.js, PLYLoader.js, OrbitControls.js
│   │
│   ├── operator/                  # EXISTING folder
│   │   ├── index.html             # EXISTING — add simplified 3D view or keep 2D minimap
│   │   └── operator-3d.js         # NEW — Simplified Three.js (fewer points, no FOV cones)
│   │
│   ├── video/
│   │   ├── render_3d_video.py     # NEW — Open3D offscreen rendering (optional)
│   │   ├── compose_frames.py      # NEW — Matplotlib overlay composition
│   │   └── agent_paths.json       # NEW — Pre-computed 3D waypoints from 01-ats
│   │
│   └── algorithm/
│       └── explorer.py            # EXISTING — ensure 3D waypoints (x,y,z) are returned
│
├── static/                        # EXISTING — Flask serves from here
│   ├── village_desktop.ply        # NEW — Decimated for admin (200K points)
│   ├── village_phone.ply          # NEW — Heavily decimated for operator (50K points)
│   └── three/                     # NEW — Three.js library files
│       ├── three.module.js
│       ├── PLYLoader.js
│       └── OrbitControls.js
│
└── docs/research/
    └── 3D_DEMO_RESEARCH_BRIEF.md  # THIS FILE
```

### Flask Server Extension (`server.py`)

The existing `/api/state` endpoint needs to return 3D positions:

```python
# In server.py, update the state response
@app.route('/api/state')
def get_state():
    state = {
        'agents': [
            {
                'id': 0,
                'name': 'ALPHA',
                'x': agent.x,      # 3D position
                'y': agent.y,      # 3D position (height)
                'z': agent.z,      # 3D position
                'heading': agent.heading,  # Degrees, 0 = +X
                'status': agent.status,    # 'PATROL' | 'THREAT' | 'CHANGE' | 'CLEAR'
                'battery': agent.battery,
                'type': 'GROUND'
            },
            # ... 4 more agents
        ],
        'coverage_pct': calculate_coverage(),
        'alerts': active_alerts,
        'mission_phase': current_phase  # 'EXPLORE' | 'SURVEIL' | 'COMPLETE'
    }
    return jsonify(state)
```

### Three.js CDN (No Build Step Required)

Serve Three.js directly from CDN in your HTML:

```html
<!-- In admin/index.html -->
<script type="importmap">
{
    "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
    }
}
</script>
<script type="module" src="three-scene.js"></script>
```

**No npm. No build. No bundler.** Three.js loads directly in the browser.

---

## 10. Fallback Strategy

### If 3D Is Too Slow

```javascript
// In three-scene.js, detect performance and degrade gracefully
const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isLowPower = !navigator.hardwareConcurrency || navigator.hardwareConcurrency < 4;

if (isMobile || isLowPower) {
    // Load decimated point cloud
    loader.load('/static/village_phone.ply', onLoad);
    // Disable FOV cones
    agents.forEach(a => { a.mesh.remove(a.fov); });
    // Reduce point size
    material.size = 0.2;
} else {
    // Load full point cloud
    loader.load('/static/village_desktop.ply', onLoad);
}
```

### If SE3 Data Is Unavailable

The procedural village (`make_village()`) works identically. Same `.ply` format. Same loading code. The judges won't know the difference — it looks like a real 3D reconstruction.

### If Open3D OffscreenRenderer Fails

Use **OBS Studio** to capture the browser window running the Three.js visualization. This is actually the more reliable path for a hackathon.

### If WebGL Is Not Available

```javascript
if (!window.WebGLRenderingContext) {
    // Show 2D fallback
    document.getElementById('map-3d').style.display = 'none';
    document.getElementById('map-2d').style.display = 'block';
}
```

---

## 11. Dependencies

```bash
# Python (for procedural generation + video rendering)
pip install open3d matplotlib Pillow opencv-python numpy

# Three.js (CDN, no install)
# Just include the importmap in HTML

# OBS Studio (for screen capture)
# Download from obsproject.com — free, cross-platform

# ffmpeg (for video stitching)
# Usually pre-installed on Linux/macOS
# Windows: download from ffmpeg.org
```

**Setup time:** 15 minutes (install open3d + matplotlib + verify Three.js CDN loads).

---

## 12. Recommended Implementation Order (Tonight)

| Step | Task | Time | File |
|---|---|---|---|
| 1 | Generate procedural village → `.ply` | 15 min | `src/video/generate_village.py` |
| 2 | Add Three.js to `admin/index.html` via CDN | 10 min | `src/admin/index.html` |
| 3 | Write `three-scene.js` — load PLY, camera, lighting | 30 min | `src/admin/three-scene.js` |
| 4 | Add 5 agent spheres with colors | 15 min | `src/admin/three-scene.js` |
| 5 | Add FOV cones + coverage circles | 20 min | `src/admin/three-scene.js` |
| 6 | Wire `/api/state` polling → agent movement | 20 min | `src/admin/three-scene.js` |
| 7 | Test in browser — verify 60 FPS | 10 min | Browser DevTools |
| 8 | Add HTML admin overlay (squad panel, coverage bar) | 30 min | CSS in `admin/index.html` |
| **Total** | | **~2.5 hours** | |

**After 2.5 hours:** You have a working 3D admin dashboard. Agents move on a 3D village. FOV cones sweep. Coverage zones appear. The squad panel shows statuses. This is your foundation.

**Next 2 hours (Saturday morning):**
- Record the 3D video (OBS or frame capture)
- Add threat/change alert scenes
- Add admin overlay composition
- Polish transitions and camera angles

---

## 13. Key Resources

### Three.js
- **Point cloud example:** `https://threejs.org/examples/?q=points#webgl_buffergeometry_points` [^236^]
- **PLYLoader:** `https://threejs.org/examples/?q=ply#webgl_loader_ply` [^221^]
- **ConeGeometry docs:** `https://threejs.org/docs/pages/ConeGeometry.html` [^244^]
- **Cone rotation fix:** `https://dustinpfister.github.io/2019/07/31/threejs-cone/` [^239^]

### Open3D
- **Point cloud tutorial:** `https://www.open3d.org/docs/release/tutorial/geometry/pointcloud.html` [^223^]
- **Voxel downsampling:** `https://www.open3d.org/docs/release/python_api/open3d.geometry.PointCloud.html` [^225^]
- **OffscreenRenderer:** `https://www.open3d.org/docs/release/python_api/open3d.visualization.rendering.OffscreenRenderer.html`

### DUSt3R / SE3
- **DUSt3R GitHub:** `https://github.com/naver/dust3r` [^183^]
- **DUSt3R quickstart:** `https://github.com/naver/dust3r?tab=readme-ov-file#dust3r-geometric-3d-vision-made-easy` [^184^]
- **DUSt3R tutorial:** `https://learnopencv.com/dust3r-geometric-3d-vision/` [^189^]
- **SE3 Labs:** `https://www.se3.ai/` [^148^]

### Performance
- **LiDAR point clouds in browser:** `https://levelup.gitconnected.com/rendering-million-point-lidar-clouds-in-the-browser-with-three-js-and-potree-797179a68e78` [^209^]
- **Three.js on mobile:** `https://threejsresources.com/facts` [^230^]
- **Three.js vs Unity Web:** `https://www.utsubo.com/blog/threejs-vs-unity-web-comparison` [^231^]

### Free Assets
- **Sketchfab free models:** `https://sketchfab.com/search?features=downloadable&sort_by=-likeCount&type=models` [^217^]
- **Poly Pizza (glTF):** `https://poly.pizza/` [^216^]
- **Kenney assets:** `https://kenney.nl/assets` [^216^]
- **Free drone video:** `https://www.pexels.com/video/aerial-drone-view-of-quaint-english-village-29055833/` [^208^]

### Video Recording
- **OBS Studio:** `https://obsproject.com/` [^242^]
- **OBS setup guide:** `https://www.hkmu.edu.hk/oetools/obsstudio/` [^237^]

---

*Two paths to 3D: Three.js for the live browser app, Open3D/OBS for the video. The procedural village gets you there in 15 minutes. Everything else is polish.*
