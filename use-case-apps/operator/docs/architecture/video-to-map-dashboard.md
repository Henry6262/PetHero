# Architecture: Drone Video → Map → `/dashboard`

## Goal

Add a new map-from-scouting-video capability to Operator. A drone scouting video of a village or area can be uploaded, processed into a georeferenced base map, and displayed on the existing `/dashboard` tactical view alongside agents, hex cells, detections, and conflicts.

## Scope

- Defensive ISR framing only: map is context, not a weapon.
- Human operator remains in control of all tasking and interpretation.
- Preserve provenance: every pixel ties back to a source video frame, GPS fix, and processing run.
- Start with batch/offline processing; live “reconstruct as it flies” is a future slice.

## Current state

- Backend: Bun + Hono in `src/api/app.ts`, with routes split into `src/api/routes/{agents,cells,dock,playbook,state}.ts`; shared Zod schemas live in `src/api/schemas.ts`. Core logic is in `src/core/context-store.ts`, `src/core/types.ts`, `src/core/playbook.ts`.
- Frontend: React + Vite + Three.js/React Three Fiber in `apps/web/src/components/OperatorDashboard.tsx`.
- Dashboard route: `window.location.pathname === "/dashboard"` renders `<OperatorDashboard />`.
- Map scene uses a `BaseMapLayer` abstraction (`apps/web/src/components/scene/BaseMapLayer.tsx`) that switches between `TerrainLayer` (procedural) and `DroneMapLayer` (placeholder). The dashboard UI has a PROC / DRONE base-layer selector.
- Terrain is backed by a pluggable `TerrainSource` registry (`apps/web/src/lib/terrain.ts`) with `ProceduralTerrainSource` and `HeightmapTerrainSource`, exposing `getHeight`, `getNormal`, `getSlope`, and `getQuaternion`. The registry emits `terrain:reload` when the source changes.
- Buildings, agents, props, and demo data are now in `apps/web/src/data/demo.ts` and `apps/web/src/types/data.ts`; synthetic building geometry uses `BuildingLayer` from `apps/web/src/components/scene/BuildingLayer.tsx`.
- Theme/status tokens are centralized in `apps/web/src/lib/theme.ts`.
- Reusable dashboard UI pieces (`AgentIcon`, `AgentPopover`, `ActionToast`, `BuildingPanel`) live in `apps/web/src/components/dashboard/`.

## Proposed data flow

```
Drone video (+ .SRT telemetry)
        │
        ▼
┌─────────────────────────────┐
│  POST /api/maps             │  ← accept upload, return jobId
│  (Hono + async job queue)   │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  1. Extract telemetry       │     ffmpeg, SRT parser, exiftool
│  2. Extract key frames      │     based on GPS-derived overlap
│  3. Geotag frames           │     write GPS EXIF
│  4. Run ODM (NodeODM/PyODM) │     orthomosaic + DEM + point cloud
│  5. Convert outputs         │     COG, PNG heightmap, XYZ tiles
│  6. Store assets + manifest │     local disk / S3-compatible
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  GET /api/maps/:id          │  ← metadata, status, tile URLs
│  GET /api/maps/:id/tiles/…  │  ← orthomosaic / terrain tiles
│  GET /api/maps/:id/trajectory│ ← camera path as GeoJSON
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  /dashboard                 │
│  - base layer selector      │
│  - orthomosaic plane        │
│  - DEM height displacement  │
│  - existing tactical layers │
└─────────────────────────────┘
```

## Backend additions

### New types (`src/core/types.ts`)

```ts
export type MapJobStatus =
  | "pending"
  | "extracting_telemetry"
  | "extracting_frames"
  | "processing_odm"
  | "post_processing"
  | "ready"
  | "failed";

export interface MapJob {
  id: string;
  status: MapJobStatus;
  uploadedAt: string;
  updatedAt: string;
  sourceVideoUrl: string;
  telemetryUrl?: string;
  bounds?: { minX: number; minY: number; maxX: number; maxY: number }; // in local CRS / UTM
  crs?: string;
  orthomosaicUrl?: string;
  demUrl?: string;
  pointCloudUrl?: string;
  meshUrl?: string;
  tileUrlTemplate?: string;
  trajectoryUrl?: string;
  reportUrl?: string;
  errorMessage?: string;
}

export interface MapTileset {
  jobId: string;
  kind: "ortho" | "dem" | "hillshade";
  urlTemplate: string;
  minZoom: number;
  maxZoom: number;
  bounds: [number, number, number, number];
}
```

### New modules

| Module | Responsibility |
|---|---|
| `src/core/map-jobs.ts` | In-memory job store, status transitions, manifest lookup. |
| `src/jobs/extract-telemetry.ts` | Parse `.SRT` or video metadata into per-frame GPS/altitude/heading/time. |
| `src/jobs/extract-frames.ts` | Use `ffmpeg` to extract frames and select a subset that preserves overlap. |
| `src/jobs/geotag-frames.ts` | Write GPS EXIF into extracted frames. |
| `src/jobs/run-odm.ts` | Drive NodeODM/PyODM, poll until completion, download assets. |
| `src/jobs/post-process.ts` | Generate COG, PNG heightmap, tile tree, trajectory GeoJSON. |
| `src/api/maps.ts` | Hono routes: upload, status, list, tile proxy, trajectory. |

### New API routes (`src/api/app.ts` or `src/api/maps.ts`)

| Route | Purpose |
|---|---|
| `POST /api/maps` | Upload video + optional telemetry, create job. |
| `GET /api/maps` | List jobs. |
| `GET /api/maps/:id` | Get job metadata and asset URLs. |
| `DELETE /api/maps/:id` | Cancel / clean up. |
| `GET /api/maps/:id/tiles/ortho/{z}/{x}/{y}.png` | Orthomosaic tiles. |
| `GET /api/maps/:id/tiles/dem/{z}/{x}/{y}.png` | Terrain height tiles. |
| `GET /api/maps/:id/trajectory` | Camera path GeoJSON. |
| `GET /api/maps/:id/report` | ODM quality report. |

### ODM integration options

**Option A — NodeODM REST API (recommended for v0)**

Run NodeODM as a sibling Docker container:

```bash
docker run -p 3000:3000 opendronemap/nodeodm
```

Backend submits images via HTTP multipart and polls `/task/{uuid}/info`.

**Option B — PyODM SDK**

```python
from pyodm import Node
n = Node("localhost", 3000)
task = n.create_task([...frames...], {"dsm": True, "dtm": True})
task.wait_for_completion()
```

Use a Python microservice if the main Hono backend wants to avoid spawning ffmpeg/ODM directly.

**Option C — ODM CLI directly**

Spawn `docker run --rm -v ... opendronemap/odm ...` from Bun via `child_process`. Simplest for local dev, hardest to scale.

Recommendation: **Option A** for the first slice. It gives a clean REST contract and is how WebODM itself talks to ODM.

## Frontend changes

### Base layer selector

Add a small control in `OperatorDashboard.tsx` near the ISO/FLAT/FOV/INT buttons:

```tsx
<select value={baseLayer} onChange={...}>
  <option value="procedural">Procedural terrain</option>
  <option value="drone-ortho">Drone orthomosaic</option>
  <option value="drone-dem">Drone elevation</option>
</select>
```

### Map layer component

Create `apps/web/src/components/scene/DroneMapLayer.tsx`:

```tsx
// Renders an orthomosaic as a Three.js plane with DEM-based displacement.
// Falls back to procedural terrain when no drone map is selected.
```

Inputs:

- `tileUrlTemplate` for orthomosaic.
- `demUrl` (PNG heightmap) or tile template for displacement.
- `bounds` in local scene coordinates.
- `opacity` / `visible`.

Use `@react-three/drei` `<Plane>` or custom mesh with a displacement map. For tile streaming, use a small tile loader that fetches `{z}/{x}/{y}` tiles and assembles them into a texture atlas for the current view.

### Trajectory overlay

Render the drone camera path as a faint line on the map. Each vertex carries:

- timestamp
- GPS position
- altitude
- heading
- frame index

On hover, show the source frame thumbnail if available.

### Integration with mission context

When a map job finishes, the backend can synthesize events for the context store:

- `map_cell` events for each observed cell (derived from trajectory + FOV footprint).
- `change` events if a second map is processed for the same area.
- `detection` events if an object-detection pass is run on the orthomosaic.

Keep the existing provenance fields (`agentId`, `observedAt`, `confidence`, `payload.sourceFrame`).

## Asset storage layout

```
data/maps/
  {jobId}/
    source.mp4
    telemetry.srt
    telemetry.json
    frames/
      0001.jpg
      0002.jpg
      ...
    odm/
      odm_orthophoto.tif
      dtm.tif
      dsm.tif
      odm_georeferenced_model.laz
      ...
    outputs/
      ortho_cog.tif
      dem.png
      tiles_ortho/{z}/{x}/{y}.png
      tiles_dem/{z}/{x}/{y}.png
      trajectory.geojson
      manifest.json
```

## Coordinate handling

ODM will project outputs into a UTM CRS by default. The dashboard scene currently uses an arbitrary local coordinate system centered on the hex grid. Two options:

1. **Georeferenced scene**: keep everything in UTM/EPSG:4326 and convert agent positions from lat/lon/alt to scene coordinates. Best long-term.
2. **Local scene with map offset**: pick the map centroid as origin `(0,0)`, store an offset/scale, and translate GPS-derived positions into the local frame. Faster for v0.

Recommendation: **Option 2** for the first slice, with the offset stored in the `MapJob` manifest so future maps can be aligned.

## Tile strategy

**For v0** (simplicity, no extra Python service):

- Pre-generate an XYZ tile tree with `gdal2tiles.py` or a small GDAL script.
- Serve static tiles from `public/maps/{jobId}/tiles_ortho/...` or via the Hono backend.

**For scale**:

- Convert orthomosaic to COG with `rio cogeo create`.
- Run TiTiler (FastAPI) to serve tiles on demand.
- Keep v0 static tiles for offline/demo use.

## Error handling and provenance

- If ODM fails, surface the ODM log snippet in the job `errorMessage`.
- Store the full ODM report and frame manifest for audit.
- Never overwrite the source video; version maps as `map-job-v1`, `map-job-v2`.
- Conflicting maps: if two videos cover the same area at different times, show both as layers with time slider / opacity, and let the operator mark conflicts.

## Security / dual-use notes

- The feature itself is mapping only. Do not add targeting, strike, or payload-release affordances.
- Source videos may be sensitive. Store them under the same trust model as other mission data.
- Exported map tiles should respect the same trust-token gate as agent events if served over the network.

## First-sprint tasks

1. Add `MapJob` types and in-memory store.
2. Create `POST /api/maps` and `GET /api/maps/:id` routes.
3. Build telemetry + frame extraction helper using `ffmpeg`.
4. Build geotagging helper using `exiftool`.
5. Stand up NodeODM locally and submit a test video.
6. Convert ODM orthomosaic + DEM into PNG/XYZ tiles.
7. Add `DroneMapLayer` to the dashboard.
8. Add base-layer selector to `/dashboard`.
9. Wire trajectory GeoJSON into the scene.
10. Update dashboard E2E test to assert the new layer loads without runtime errors.

## Open questions

- Will drone footage come with `.SRT` telemetry, or do we need to support other formats (Mavlink `.tlog`, Parrot metadata, Insta360, etc.)?
- Is the target deployment environment okay with a Docker sidecar for NodeODM, or should we use a cloud ODM service / WebODM Lightning?
- Do we need RTK/GCP-level accuracy in the first slice, or is GPS-only acceptable?
- Should the dashboard support time-series map comparison out of the box, or is a single latest map enough for v0?
