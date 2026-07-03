# Three.js Tactical Map — Making SE3 Point Clouds Readable

## The Problem

SE3 gives you a .ply point cloud — millions of colored dots. In raw form, it's impossible for a human to identify buildings, rooms, or objects. It looks like static.

## The Fix (5 Layers)

| Layer | What It Does | Visual Effect |
|-------|-------------|---------------|
| **1. Ground Plane** | Flat surface beneath the point cloud | Gives context, shows where ground level is |
| **2. Point Cloud (colored by height)** | Raw SE3 data, but color-coded | Blue = floor, green = mid-height, red = ceiling |
| **3. Building Outlines** | Extruded boxes around point clusters | Makes walls and rooms visible as solid shapes |
| **4. Fog + Lighting** | Atmospheric depth cues | Far objects fade, near objects pop |
| **5. State Colors** | Rooms change color based on mission state | Gray = unknown, green = cleared, red = person detected |

## Quick Code

```javascript
// === 1. GROUND PLANE ===
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x2a2a2a, 
    roughness: 0.9 
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
scene.add(ground);

// Grid helper for scale reference
const grid = new THREE.GridHelper(100, 50, 0x444444, 0x222222);
scene.add(grid);

// === 2. LOAD PLY POINT CLOUD ===
const loader = new THREE.PLYLoader();
loader.load('se3_output.ply', (geometry) => {
    
    // Color points by height (Y axis)
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    
    for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        // Height-based coloring
        if (y < 0.5) {        // Floor level
            colors[i*3] = 0.1; colors[i*3+1] = 0.3; colors[i*3+2] = 0.6; // Blue
        } else if (y < 2.5) { // Wall/object level
            colors[i*3] = 0.3; colors[i*3+1] = 0.6; colors[i*3+2] = 0.3; // Green
        } else {              // Ceiling/high objects
            colors[i*3] = 0.6; colors[i*3+1] = 0.3; colors[i*3+2] = 0.1; // Red/orange
        }
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.03,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
});

// === 3. BUILDING OUTLINES (manual or auto-detected) ===
// These are extruded boxes that sit ON TOP of the point cloud
// making buildings readable as solid shapes

function addRoom(x, z, width, depth, height, color, label) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
    });
    const room = new THREE.Mesh(geo, mat);
    room.position.set(x, height/2, z);
    scene.add(room);
    
    // Wireframe edge for visibility
    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({ color: color, opacity: 0.6, transparent: true });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.copy(room.position);
    scene.add(wireframe);
    
    // Label
    // (use CSS2DRenderer for text labels in 3D space)
}

// Example rooms — match these to your SE3 data
addRoom(0, 0, 5, 4, 3, 0x888888, "Room 101");    // Unknown - gray
addRoom(6, 0, 4, 4, 3, 0x32D74B, "Room 102");    // Cleared - green
addRoom(0, 5, 5, 3, 3, 0xFF453A, "Room 103");    // Person detected - red
addRoom(6, 5, 4, 3, 3, 0xFF9F0A, "Corridor");    // In progress - amber

// === 4. FOG + LIGHTING ===
scene.fog = new THREE.FogExp2(0x0a0a0f, 0.02);
scene.background = new THREE.Color(0x0a0a0f);

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// Blue rim light for atmosphere
const rimLight = new THREE.DirectionalLight(0x0044ff, 0.3);
rimLight.position.set(-10, 5, -10);
scene.add(rimLight);

// === 5. STATE COLOR UPDATES ===
// When robot clears a room, change color:
function setRoomState(roomIndex, state) {
    const colors = {
        'unknown': 0x888888,
        'in_progress': 0xFF9F0A,
        'cleared': 0x32D74B,
        'person_detected': 0xFF453A,
        'evacuated': 0x0A84FF
    };
    rooms[roomIndex].material.color.setHex(colors[state]);
    rooms[roomIndex].material.opacity = state === 'cleared' ? 0.15 : 0.25;
}
```

## Visual Result

Before (raw point cloud): millions of dots, no context, eye strain
After (tactical map): ground plane, colored height-coded points, semi-transparent building boxes with wireframes, atmospheric fog, state-based room colors

## For Your Pitch

You don't need perfect auto-detection of rooms from the point cloud. You need:

1. **Load the SE3 .ply** → show the raw data ("this is what the robot sees")
2. **Overlay building boxes** → ("and this is how we make it readable")
3. **Show state changes** → click a room, it turns green ("Room 102 cleared")
4. **Show person detection** → room turns red ("Person detected — flag for rescue")

The building boxes can be manually placed for the demo. You don't need auto-room-detection working by tomorrow. Just position 4-5 boxes that roughly match your SE3 data.

## Quick Checklist

- [ ] Load .ply with PLYLoader
- [ ] Color points by height (blue/green/red)
- [ ] Add ground plane + grid
- [ ] Add 4-5 semi-transparent room boxes
- [ ] Add wireframe edges to rooms
- [ ] Add fog + 2-3 lights
- [ ] Add state color change function
- [ ] Connect to Flask /api/state for live updates
