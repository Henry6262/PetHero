# Drone Scouting Video → Map Research Synthesis

## Question

How can Operator ingest a drone scouting video of a village/area and turn it into a map layer for a new `/dashboard` endpoint, while staying compatible with the existing mission context store and defensive ISR framing?

## Short Answer

Use an offline/batch photogrammetry pipeline: extract telemetry + frames from the drone video, run OpenDroneMap (ODM) to generate a georeferenced orthomosaic and DEM, convert those into web-friendly tiles/heightmaps, and render them as the base layer in the Operator dashboard. The existing hex grid, agent pucks, FOV cones, detections, and conflict overlays stay on top. For fast turnarounds or live passes, research-grade SLAM/3DGS options exist but are not yet robust enough for measurement-grade mapping.

## Output products we need

| Product | Why it matters for Operator | Typical format |
|---|---|---|
| Orthomosaic | Top-down photo-realistic base map, measure distances/areas | GeoTIFF / COG |
| DEM / DSM | Terrain height, slope, line-of-sight | GeoTIFF / terrain tiles |
| Point cloud | Raw 3D evidence, change detection input | LAS / LAZ |
| Textured mesh | Optional 3D building/terrain preview | OBJ / GLB / 3D Tiles |
| Camera trajectory + metadata | Provenance: where each observation came from | JSON / SRT / EXIF |

## Mature open-source pipeline: ODM

[OpenDroneMap (ODM)](https://opendronemap.org/) is the de-facto open-source aerial photogrammetry toolkit. It turns drone images into maps, point clouds, DEMs, and 3D models. It is built on OpenSfM, OpenMVS, PDAL, GDAL, and PoissonRecon.

Key components of the ODM ecosystem:

- **ODM** — command-line engine (`opendronemap/odm` Docker image).
- **NodeODM** — lightweight REST API wrapper so the backend can submit jobs and poll status.
- **WebODM** — browser GUI, useful for manual QA but not required for automation.
- **PyODM** — Python SDK to drive NodeODM from our backend.

ODM outputs include:

- `odm_orthophoto/odm_orthophoto.tif` — GeoTIFF orthomosaic.
- `odm_dem/dtm.tif` and `dsm.tif` — digital elevation models.
- `odm_georeferencing/odm_georeferencing_model_geo.txt` — camera positions / trajectory.
- `odm_texturing/odm_textured_model_geo.obj` — textured mesh.
- `odm_point_cloud/odm_georeferenced_model.laz` — dense point cloud.

For a DJI drone, ODM can read embedded `.SRT` telemetry (subtitle track) for georeferencing, or it can use GPS EXIF if the input is already still images.

## Video-specific preprocessing

ODM expects still images. The backend must:

1. **Extract telemetry** from the drone video container or sidecar `.SRT` file. GPS, altitude, gimbal pitch, heading, timestamp per frame.
2. **Extract frames** at a rate that guarantees sufficient overlap. Rule of thumb for mapping: ≥75% forward overlap and ≥65% side overlap. For a manual scouting video this means extracting frames every 0.5–2 seconds and possibly discarding frames when the drone is moving too fast or turning too sharply.
3. **Write geotags back into frame EXIF** so ODM can use them as initial camera positions.
4. **Run ODM** with options appropriate for aerial video (nadir/oblique mix, rolling-shutter correction if needed).
5. **Post-process** outputs into dashboard-ready assets.

Tools for this step:

- `ffmpeg` — frame extraction (`-vf fps=1`, or time-based selection).
- `exiftool` / `pyexiftool` — write GPS EXIF to extracted frames.
- `pymavlink`, `dji-sdk`, or simple `.SRT` parsers for telemetry.

## Web visualization options

### Orthomosaic

Best practice for large GeoTIFFs is to serve them as tiles rather than loading the whole image:

- **Cloud-Optimized GeoTIFF (COG)** + [TiTiler](https://developmentseed.org/titiler/) (FastAPI + Rasterio) serves `{z}/{x}/{y}` tiles on demand. This is the most flexible production path.
- **Pre-generated XYZ tiles** via `gdal2tiles.py` if we want static files and no Python tile service.
- **Client-side COG** with `geotiff.js` + Leaflet/deck.gl works for small sites but is heavier on the browser.

### Terrain / DEM

- Convert DEM to a PNG heightmap with `gdal_translate` and render it in Three.js as a displacement map / vertex displacement (the dashboard already uses Three.js + React Three Fiber).
- Or generate Cesium-style quantized-mesh / heightmap tiles with `gdal2cesium` or custom GDAL scripts.
- For tactical clarity, a subtle shaded relief layer may be more useful than raw elevation.

### 3D mesh / point cloud

- GLB/OBJ mesh can be dropped into the existing Three.js scene as a base mesh.
- LAZ point cloud can be downsampled and rendered as instanced points, or converted to 3D Tiles for large clouds.
- For the MVP, an orthomosaic + DEM heightmap is enough; full 3D mesh is a polish layer.

## What about real-time / one-pass video?

Research tools that reconstruct directly from monocular video without pre-planning a photo grid:

| Approach | Maturity | Notes |
|---|---|---|
| **COLMAP** (SfM+MVS) | Mature, CPU/GPU | Needs unordered/ordered images, slow on video, drift on large loops. |
| **Meshroom** (AliceVision) | Mature, node-based | Strong for objects/buildings, requires CUDA, not optimized for aerial grids. |
| **SLAM3R** | Research, Dec 2024 | Dense RGB SLAM, 20+ FPS, but accumulates drift outdoors, no georeferencing out of the box. |
| **MASt3R-SLAM** | Research, Dec 2024 | Strong matching prior, real-time, but same drift/georef limitations. |
| **3D Gaussian Splatting** | Emerging | Great photorealistic previews, poor measurement accuracy, hard to edit. |

Recommendation: treat these as future “live preview” or “fast recon” modes, not the primary mapping pipeline. The ODM batch pipeline gives us survey-grade outputs, provenance, and repeatability that a tactical C2 dashboard needs.

## Accuracy and capture discipline

- Forward overlap ≥75%, side overlap ≥65%.
- Stable altitude and speed; avoid aggressive turns.
- Nadir (straight down) plus a few oblique passes improve building walls.
- RTK/GCPs if centimeter accuracy is required; DJI GPS-only is usually meter-level.
- Overcast skies reduce shadows that confuse feature matching.

## Integration with Operator

The existing dashboard (`use-case-apps/operator/apps/web/src/components/OperatorDashboard.tsx`) already renders a Three.js tactical scene. Cleanup work completed before the video-to-map feature:

- `BaseMapLayer` abstraction in `apps/web/src/components/scene/BaseMapLayer.tsx` with a `procedural` / `drone` switch.
- A **PROC / DRONE** base-layer selector in the dashboard UI.
- Pluggable `TerrainSource` registry in `apps/web/src/lib/terrain.ts` (`ProceduralTerrainSource` and `HeightmapTerrainSource`), ready to ingest a drone-derived DEM via `setTerrainHeightmap()` or `setTerrainSource()`.
- Backend routes split into `src/api/routes/{agents,cells,dock,playbook,state}.ts` with shared Zod schemas.

The map-from-video feature should now:

1. Load the generated orthomosaic as a ground-plane texture (extend `DroneMapLayer` or add a new `OrthomosaicTerrainSource`).
2. Use the DEM to displace the ground plane so buildings/terrain sit correctly; the `HeightmapTerrainSource` already handles raster heightmaps.
3. Keep the existing hex grid, agents, buildings, FOV cones, conflict overlays as semantic layers.
4. Feed camera trajectory and detected changes into the mission context store as `map_cell`, `detection`, and `change` events with provenance.

## Recommended first slice

1. **Backend job endpoint**: `POST /api/maps` accepts a drone video (+ optional SRT), creates a processing job, extracts frames, runs ODM via NodeODM/PyODM.
2. **Asset pipeline**: convert ODM outputs to COG orthomosaic + PNG heightmap + camera trajectory JSON.
3. **Tile endpoint**: serve orthomosaic tiles (either pre-generated XYZ or TiTiler).
4. **Dashboard**: add a “Drone Map” base layer switcher to `/dashboard` and render tiles under the tactical overlays.
5. **Provenance**: store the source video, frame manifest, ODM report, and per-frame GPS in the mission context store as attachments/payload.

## Sources

- [OpenDroneMap](https://opendronemap.org/)
- [WebODM](https://webodm.org/)
- [NodeODM on GitHub](https://github.com/OpenDroneMap/NodeODM)
- [PyODM docs](https://pyodm.readthedocs.io/)
- [TiTiler](https://developmentseed.org/titiler/)
- [Free photogrammetry software comparison — SkyeBrowse 2026](https://www.skyebrowse.com/news/posts/free-photogrammetry-software)
- [Real-Time 2D Orthomosaic Mapping from UAV Video — MDPI Applied Sciences 2026](https://www.mdpi.com/2076-3417/16/4/2133)
- [SLAM3R paper — arXiv 2412.09401](https://arxiv.org/abs/2412.09401)
- [MASt3R-SLAM paper — arXiv 2412.12392](https://arxiv.org/pdf/2412.12392v1)
- [Comparing NeRF, Gaussian Splatting, and Drone Photogrammetry — Hammer Missions](https://www.hammermissions.com/post/comparing-nerf-3d-gaussian-splatting-and-drone-photogrammetry)
