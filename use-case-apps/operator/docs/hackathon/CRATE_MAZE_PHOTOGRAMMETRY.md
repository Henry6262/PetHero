# Crate Maze Photogrammetry Workflow

How to turn 80–100 hand-held photos of a circular bottle-crate maze into a scaled orthophoto / 3D model, then into the occupancy grid that Operator and the PiCrawler use for navigation.

## 1. What you need

- A camera or phone that can save full-resolution JPG (do not use WhatsApp-compressed copies).
- A laptop with Docker and ~8 GB free RAM.
- Two scale references placed inside the maze: e.g. a 30 cm ruler and a 50 cm measured tape, visible in many photos.
- Optional: colored paper markers for start (red) and target zone (green).

## 2. How to take the photos

The maze is circular with obstacles inside. You need **overlap**, **coverage of the centre**, and **different angles**.

### Orbit 1 – 45° look-down (main orbit)

1. Stand ~1 m outside the crate circle.
2. Hold the camera at chest/shoulder height (~1.4–1.6 m).
3. Point the camera toward the centre of the maze, tilted down ~45°.
4. Walk slowly around the entire circle.
5. Take **one photo every ~30–40 cm** (roughly one step). You want 30–40 photos for the full 360°.
6. Keep the whole crate circle in frame if possible; if not, keep at least 2/3 of it.

### Orbit 2 – 30° look-down (side detail)

1. Repeat the same walk, but lower the camera a bit and aim more horizontally (~30° down).
2. This captures the sides of the crates and obstacles.
3. 20–30 photos.

### Orbit 3 – near-top-down (centre coverage)

1. Stand at the edge or just inside the circle.
2. Raise the camera as high as you can (selfie stick, tripod upside-down, broom handle with phone clamp).
3. Aim almost straight down (~70–80°).
4. Walk around the inner edge and take 20–30 photos.
5. This is the most important orbit for a clean top-down map.

### Detail shots

- 3–5 close-ups of each internal obstacle (blue/yellow crates) from different sides.
- 3–5 close-ups of the start entry point.
- 3–5 close-ups of the target zone where mines will be.

**Total: 80–100 photos.**

### Critical rules

- **Overlap is everything**: each photo should share ~60–70% of the scene with the previous one.
- **Hold still when shooting**: motion blur is the #1 cause of failure.
- **Do not change zoom or focus** during capture.
- **Do not move crates, chairs, or lights** while shooting.
- **Avoid your own shadow** on the maze floor.
- **Do not crop or filter** the photos before processing.

## 3. Process with WebODM

WebODM is a free Docker-based photogrammetry suite that gives you a 3D model, a point cloud, and an orthophoto (top-down image).

```bash
# 1. Install Docker if you don't have it, then:
git clone https://github.com/OpenDroneMap/WebODM --config core.autocrlf=input --depth 1
cd WebODM
./webodm.sh start

# 2. Open http://localhost:8000, create an account, and log in.
```

The first start downloads several GB of Docker images.

### Create the project

1. Click **Add Project** → name it `crate_maze`.
2. Click **Select Images** and upload all your JPGs.
3. Choose task options:
   - **Preset**: `3D Model`
   - **pc-quality**: `high` (use `medium` if the laptop has <8 GB RAM)
   - **mesh-size**: `300000`
   - **feature-quality**: `high`
   - Optional: set `dsm: true` if you want a height map for obstacle detection.
4. Click **Start Processing**.

Processing time: 30 min – 2 h for ~100 photos.

## 4. Export the orthophoto

When processing finishes:

1. Open the project.
2. Go to **Download Assets**.
3. Download:
   - `orthophoto.tif` (or `orthophoto.png`) – this is your top-down map.
   - `georeferenced_model.laz` / `point_cloud.ply` – optional, for 3D viewer.
   - ` textured_model.zip` – optional, for Blender/MeshLab.

The orthophoto is the only file you need for the navigation grid.

## 5. Scale the orthophoto

WebODM outputs the model in arbitrary units because there is no GPS.

1. Open CloudCompare (free: https://github.com/CloudCompare/CloudCompare).
2. Import the point cloud (`*.laz` or `*.ply`).
3. Use the **Point Picking / Distance** tool to measure the distance between your two scale references.
4. Compute scale factor:

   ```
   scale = real_distance_in_meters / measured_distance_in_cloud_units
   ```

5. Apply **Edit → Scale** with that factor.
6. Export the scaled orthophoto or save the scale factor to use later.

Alternative: if you know one crate is ~36 cm wide, measure one crate width in pixels in the orthophoto and use:

```
px_per_m = crate_width_px / 0.36
```

## 6. Convert orthophoto → Operator maze grid

Place the orthophoto in the Operator repo and run:

```bash
cd use-case-apps/operator
python3 scripts/orthophoto_to_maze_grid.py \
  --input /path/to/orthophoto.png \
  --output results/maze_extraction/bottle_maze_map.json \
  --debug results/maze_extraction/bottle_maze_debug.jpg \
  --px-per-m 55.0 \
  --physical-size-m 3.0 \
  --cell-size-m 0.05 \
  --robot-radius-m 0.08
```

Then plan a path:

```bash
python3 scripts/maze_solver.py \
  --input results/maze_extraction/bottle_maze_map.json \
  --output results/maze_extraction/bottle_maze_plan.json \
  --forward-steps-per-cell 3 \
  --turn-steps-per-90 2
```

Upload both JSONs to the Operator backend or drop them into the dashboard.

## 7. No WebODM? Use the dual-photo fallback

If you only have two opposite-side phone photos, run:

```bash
python3 scripts/maze_from_crate_photos.py \
  --photo-a photo_from_entry_side.jpg \
  --photo-b photo_from_opposite_side.jpg \
  --output results/maze_extraction/bottle_maze_map.json \
  --debug results/maze_extraction/bottle_maze_debug.jpg \
  --physical-size-m 3.0 \
  --cell-size-m 0.05 \
  --robot-radius-m 0.08
```

This is less accurate than photogrammetry but works for a quick demo.

## 8. Next steps

1. Verify the generated grid in the debug image.
2. Adjust `px-per-m` or `physical-size-m` until the grid matches real crate positions.
3. Run `maze_solver.py` to get PiCrawler gait commands.
4. Calibrate `forward_steps_per_cell` and `turn_steps_per_90` on the floor.
5. Run `scripts/picrawler_bridge.py` on the Pi to execute the plan.
