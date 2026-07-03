# Research Request: Hex-Base 3D Tactical Map for Operator / SCOUT Mission Control

**Date:** 2026-07-02  
**Project:** Operator (`use-case-apps/operator`)  
**Status:** Active research — implementation paused pending findings  
**Requested depth:** Best-of-breed only. We want the industry-standard, battle-tested, most performant approach, not a quick hack.

---

## 1. What Operator / SCOUT is

Operator is a defensive ISR and autonomy-C2 initiative. It turns cheap robots, drones, docks, and simulated agents into one shared tactical context layer:

- Map events, provenance, confidence, freshness, trust.
- Conflicting reports stay visible and become assignments.
- Agents launch with the last mission picture from dock memory.
- The product is mission memory and operator clarity under degraded comms, not the robot itself.

The canonical product name is **Operator**. SCOUT is the historical/research codename used in source material and mockups.

---

## 2. What the tactical map must do

The map is the primary operator-facing view. It must answer, at a glance:

- Where are my agents (human operators, quadrupeds, hexapods, drones, crawlers)?
- What has been explored, observed, or scanned?
- Where are stale, conflicting, blocked, or dead-end cells?
- Where is the dock / station and where is the mission goal?
- Which buildings have been scanned and what is inside them?
- What is the planned route or suggested next action?

The map is not a game. It is a C2 / ISR tool. It must feel instant, authoritative, and readable under stress.

---

## 3. The exact visual concept

### Floor base
- A **hexagonal grid** as the ground plane.
- The hex grid is the coordinate system. Streets, cells, buildings, and agents snap to hex addresses (e.g., `B14`, `F6`, `N8`).
- The grid supports two view modes:
  - **ISO / 2.5D:** perspective tilt, isometric-like readability, buildings pop up as 3D volumes.
  - **FLAT / top-down:** for precise coordinate reading and large-area planning.

### 3D world objects
Everything that is not flat ground should read as a raised 3D object:

- **Buildings / houses:** extruded volumes with roofs, walls, and eventually interiors.
- **Cars, containers, barriers, rubble:** smaller 3D props on the hex grid.
- **Dock / station:** a distinct 3D landmark.
- **Agent pucks:** 3D markers that sit on or above the grid, with orientation and status.

Objects must cast soft shadows, have readable silhouettes, and use color + status glow to communicate state (clear, partial, stale, conflict, unmapped).

### Building scan → interior view
Once a drone, crawler, or human operator scans a building, the operator must be able to inspect it:

- **Structural / architect view:** floorplans, rooms, walls, doors, hallways.
- **Holographic / ghost view:** see-through, layerable, possibly x-ray or cutaway.
- **Evidence overlay:** drone frames, scan coverage, confidence per room, last-seen timestamps.
- The interior view can be a panel, a modal, or an in-world pop-up — whatever is clearest and most performant.

This is the core differentiator: **the map is not just terrain; it becomes a live, explorable model of the operational area.**

---

## 4. Current state and why we paused

We attempted a first pass using CSS hex clip-paths, CSS 3D transforms for buildings, and a React-driven SVG overlay. It worked for a prototype but had problems:

- Hex borders looked too heavy or toy-like.
- Map felt small and did not use the available viewport.
- Buildings were CSS-only and hard to scale to real 3D interiors.
- No path interpolation, FOV cones, or agent animation.
- Performance was untested for large maps (>1,000 hexes).

We are now pausing implementation to find the correct architecture before writing more code.

---

## 5. Research questions

### A. Rendering architecture
1. What is the best rendering stack for this use case?
   - WebGL / WebGPU library: Three.js, Babylon.js, PlayCanvas, regl, raw WebGL2, something else?
   - Is a game engine export (Godot, Bevy, Unity WebGL) worth considering for the map widget?
   - Should the map be a single canvas, or layered canvases (base grid + objects + UI)?
2. How should we render the hex grid itself?
   - Instanced mesh hex tiles?
   - Hexagon texture on a single plane?
   - Shader-based grid with mouse picking?
   - What is the performance ceiling for ~5,000–10,000 hex cells?
3. How do we represent buildings and props as true 3D objects?
   - Procedural extrusion from footprint + height?
   - Instanced primitives (boxes, cylinders, roofs)?
   - GLTF / glb assets for common building types?
   - How do we batch rendering so 100+ buildings do not kill the frame rate?

### B. View modes and camera
1. How do we implement smooth ISO ↔ FLAT switching without rebuilding the scene?
2. What camera controls work best for tactical C2?
   - Pan, zoom, rotate, tilt limits.
   - Snap-to-sector, snap-to-agent, recall view.
3. How do we maintain crisp text and icons on top of a 3D scene?
   - HTML overlays vs. canvas/SVG labels vs. SDF text.

### C. Interactivity and data binding
1. How do we pick hexes and buildings with the mouse (raycasting, GPU picking, map projection)?
2. How do we stream live agent positions and map updates into the scene efficiently?
3. How do we animate routes, FOV cones, scan sweeps, and agent movement without layout thrash?

### D. Building interiors
1. What is the best way to generate and display building interiors from scan data?
   - 2D floorplan rendered in a panel?
   - 3D cutaway / exploded view in the main map?
   - Separate "blueprint / hologram" view?
2. How do we represent rooms, doors, and scan confidence visually?
3. How do we handle multi-floor buildings?
4. Can we render point-cloud or photogrammetry output from drones in the same view?

### E. Performance and large maps
1. What are the hard limits for hex count, building count, and draw calls in the browser?
2. What culling / LOD / chunking strategies are standard for tactical maps?
3. How do we keep 60 FPS during pan/zoom/rotate with hundreds of objects?
4. Should we use a worker for map geometry generation?
5. Memory budgets: what is a reasonable max for a web-based C2 client?

### F. Aesthetics
1. What lighting + material setup gives a readable, professional tactical look (not a cartoon game)?
2. How do we style the hex grid so it is present but not noisy?
3. What are provened color, glow, and contrast patterns for ISR / mission-control UIs?

---

## 6. Non-functional requirements

- **No lag.** Pan, zoom, rotate, and object selection must be 60 FPS on a modern laptop and acceptable on a tablet.
- **Large maps.** Must handle a city-block or small-village sized area without architectural redesign.
- **Offline-ready.** The map should be able to run from a local bundle without external map tile servers.
- **Touch + mouse.** Eventually usable on rugged tablets, so controls must work with both.
- **Accessibility.** Color-blind safe state indicators, keyboard shortcuts for common views.
- **Maintainability.** Prefer a stack the current team can own; avoid black-box engines unless the benefit is overwhelming.

---

## 7. Deliverables requested

1. **Recommended stack** with one primary choice and one fallback, including why.
2. **Proof-of-concept plan:** the smallest runnable demo that proves the architecture works.
3. **Data model recommendation:** how hex cells, buildings, rooms, agents, and routes should be represented.
4. **Performance benchmarks or rules of thumb** for hex count, building count, and update frequency.
5. **Asset pipeline recommendation:** how buildings, props, and interiors get authored or generated.
6. **Integration notes:** how this fits into a React/Vite frontend and an HTTP/WebSocket backend.
7. **Risk list:** what is hard, what to avoid, and what would force a different stack.

---

## 8. Constraints

- Do not frame the product around lethal autonomous engagement or payload release.
- Do not promise working hardware that does not exist.
- Plain HTTP/WebSockets first; do not block on ROS 2, Zenoh, or LoRa transport.
- Preserve conflicting reports; show conflict and provenance instead of hiding disagreement.

---

## 9. Desired tone

We want the **best possible implementation**, not the easiest. If the right answer is "use Three.js with instanced meshes, custom shaders, and a separate worker," say so. If the right answer is "use a game engine and embed it," say so. We are willing to invest in the correct architecture.

---

## 10. References

- Original SCOUT mockup source: `/Users/henry/Downloads/SCOUT Context Mesh Hackathon (1)/`
- Offline bundled dashboard: `/Users/henry/Downloads/SCOUT Mission Control (offline).html`
- ScoutMap component source: `/Users/henry/Downloads/SCOUT Context Mesh Hackathon (1)/ScoutMap.dc.html`
- Operator project: `use-case-apps/operator/`
- Product synthesis: `use-case-apps/operator/docs/research/synthesis/`
