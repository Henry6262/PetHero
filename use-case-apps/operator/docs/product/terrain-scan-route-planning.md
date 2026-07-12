# Terrain Scan & Deployment Planning

> Idea capture: 2026-07-10

## Problem

Before deploying drones, tanks, trucks, or troops, commanders need to know:

- Where is the ground passable?
- Where is there cover and concealment?
- Where are the bottlenecks, ridges, rivers, and urban obstacles?
- Where can vehicles move vs where can only infantry/drones go?

Today this is often done with paper maps, satellite imagery, or pre-mission reconnaissance that may be outdated or unavailable.

## Concept

Launch a scouting drone to **scan and map the terrain in detail**. Operator processes the scan into a 3D terrain model and uses it to recommend where to deploy different asset types.

### Example use cases

- A drone overflies a route ahead of a convoy and identifies mud, craters, or debris that would block trucks.
- The system marks safe corridors for tanks, alternate paths for light drones, and covered positions for infantry.
- Before an assault, the commander sees which approaches are open, which are exposed, and where to stage assets.
- After a strike, a drone rescans the area to assess route damage and update the plan.

## How it fits Operator

Operator already has the pieces to support this:

- **3D tactical view** (`/dashboard`) with procedural terrain and hex grid.
- **DEM heightmap support** — terrain can be overridden with scanned elevation data.
- **Asset types** — drones, robots, tanks, trucks, infantry squads can be modeled as `Asset` or `Squadron`.
- **Mission planning** — objectives, routes, waypoints, zones.
- **Fusion engine** — can ingest drone telemetry, photos, and sensor data.
- **Advisor** — can recommend routes and deployments based on terrain and threats.

## Integration path

### Phase 1 — Manual terrain import (post-hackathon)

- Operator accepts a terrain scan file (GeoTIFF, point cloud, or mesh).
- Convert it into a heightmap and overlay it on the 3D tactical view.
- Commander manually plans routes and marks no-go zones.

### Phase 2 — Drone-driven live terrain update

- A scouting drone (real or simulated) flies a pattern and uploads depth/photo data.
- Backend reconstructs a sparse or dense 3D model.
- System updates passability, slope, and cover maps automatically.

### Phase 3 — Terrain-aware deployment recommendations

- Advisor suggests:
  - **Tank corridors**: wide, firm, low-slope routes.
  - **Truck routes**: paved or dry ground, avoid steep grades.
  - **Drone lanes**: clear airspace, avoid obstacles and EW hotspots.
  - **Infantry cover**: wooded/urban areas, ridges, defilade.
  - **No-go zones**: marshes, rivers, rubble, steep slopes, mined areas.
- Recommendations appear as overlays on the operational and tactical maps.

### Phase 4 — Closed-loop rescan

- After a mission event (strike, flood, landslide), task a drone to rescan.
- Compare before/after terrain.
- Update routes and redeploy assets automatically or with human approval.

## Data inputs

- Drone RGB/depth video.
- LiDAR point clouds.
- Satellite or aerial DEM (e.g. SRTM, Copernicus).
- Manual annotations (mud, craters, obstacles).

## Data outputs

- Updated 3D terrain mesh.
- Passability map per asset type.
- Slope / roughness map.
- Cover and concealment map.
- Recommended routes and deployment positions.
- No-go zones.

## Demo scenario

1. Commander selects a contested zone for an upcoming movement.
2. Operator tasks a scout drone to scan the area.
3. Drone uploads data; terrain model updates in real time.
4. System highlights:
   - A muddy field as no-go for trucks.
   - A ridgeline as covered approach for infantry.
   - A dry road as the main tank corridor.
   - An open valley as high-risk for drones due to exposure.
5. Commander approves the recommended deployment plan.
6. Assets move out along their assigned routes.

## Relation to current hackathon demo

This is **out of scope for EDTH 2026**. The current demo is the Payload Escort + voice agent + COP. Terrain scan and deployment planning is a natural follow-up feature that strengthens the one-system pitch.

## When to build

- **After hackathon**: integrate manual terrain import into the 3D view.
- **Next milestone**: connect a real or simulated drone to feed terrain data.
- **Long-term**: full terrain-aware advisor with automated deployment recommendations.

## Challenges this maps to

- **#10 Multi-Sensor Track Fusion** — terrain is another sensor stream to fuse.
- **#07 Mission-Aware LLM** — advisor reasons over terrain + mission constraints.
- **#05 Hacking at the Edge** — drone scans and processes data locally when comms are poor.
