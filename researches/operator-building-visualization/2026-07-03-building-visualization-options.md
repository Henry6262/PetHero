# Building Visualization Options for Operator

**Date:** 2026-07-03  
**Context:** Operator currently renders buildings as simple extruded rectangles. This doc compares ways to make them look more realistic while preserving tactical readability.

---

## Option 1: Facade Textures (quickest win)

**What it is:** Apply a 2D texture or generated canvas to the sides of the extruded building box. The texture shows windows, doors, brick/concrete/stucco.

**Pros**
- Minimal geometry change; reuses current `ExtrudeGeometry`.
- One or a few textures can cover many buildings via tiling.
- Cheap draw calls — still one mesh per building, same material instance if shared.
- Very fast to iterate.

**Cons**
- Flat from oblique angles; no real depth for window frames or balconies.
- Texture repetition can look obvious on many buildings.
- Roof is still flat/empty.

**Best for:** Generic residential, warehouse, and office blocks at village scale.

**Implementation notes**
- Use `MeshStandardMaterial` with a repeating texture on the sides.
- Use a separate UV unwrap for the roof (solid concrete/tar).
- Generate window-grid textures on a canvas at runtime to avoid asset dependencies.
- Vary texture color/tint per building status without duplicating textures.

---

## Option 2: Procedural Facade Geometry

**What it is:** Add actual geometry for window frames, ledges, doors, and cornices as small extruded boxes/frames on top of the building shell.

**Pros**
- Real depth and shadows; looks much better in ISO view.
- Can be generated from the same footprint + floor count data.
- Fully procedural = no asset pipeline.

**Cons**
- More geometry per building.
- Needs careful instancing or merging to keep draw calls low.
- Roof remains an issue unless also addressed.

**Best for:** Command posts, important structures, and close-up inspection views.

**Implementation notes**
- Create window frames as thin boxes placed on each facade.
- Use `InstancedMesh` for all windows of the same dimensions.
- Add window emissive planes at night/dark scenes.
- Limit detail on distant buildings via LOD.

---

## Option 3: Procedural Roof Shapes

**What it is:** Generate peaked, shed, mansard, hip, or flat roofs from the building footprint.

**Pros**
- Breaks the "cardboard box" silhouette instantly.
- Adds recognizable building variety.
- Geometry is still footprint-driven.

**Cons**
- More geometry logic.
- Roofs with overhangs need careful collision with facades.

**Best for:** All buildings. A flat roof with parapet + HVAC is already better than a bare box.

**Roof types to support**
- Flat with parapet + HVAC block
- Gable / peaked
- Shed (single slope)
- Hip
- Mansard
- Flat with water tank / antenna cluster

---

## Option 4: Building Archetypes / Non-Rectangular Footprints

**What it is:** Instead of every building being a rectangle, support L, T, U, courtyard, and H-shaped footprints.

**Pros**
- Realism jump with the same extrusion approach.
- Can map archetype to building kind (office, warehouse, residential, garage, tower).
- Fits the existing `BuildingKind` system.

**Cons**
- Needs more footprint definitions.
- BVH raycasting and interior floorplan logic must handle complex polygons.

**Best for:** Medium-density village/town maps.

**Archetypes to support**
- Rectangle
- L-shape
- T-shape
- U-shape / courtyard
- H-shape
- Long strip (warehouse / garage)

---

## Option 5: Real 3D Models (GLB) for Landmarks

**What it is:** Replace key buildings (command post, dock, station, tower) with detailed GLB/GLTF models.

**Pros**
- Highest visual fidelity.
- Perfect for hero buildings in demos.
- Can include interiors, antennas, signage.

**Cons**
- Asset pipeline: find, clean, optimize, license-track.
- Larger bundle sizes.
- Breaks the "everything is footprint-driven" data model.
- Overkill for 90% of buildings.

**Best for:** Landmarks only.

**Workflow**
1. Download from Sketchfab / Poly Haven / Kenney.
2. Clean in Blender: remove duplicate materials, apply scale, reduce polycount.
3. Export GLB with Draco compression.
4. Optimize with `gltf-transform`:
   ```bash
   npx gltf-transform inspect model.glb
   npx gltf-transform optimize model.glb model.optimized.glb
   ```
5. Lazy-load; keep a fallback procedural box.

---

## Option 6: OSM / Cesium Real-World Buildings

**What it is:** Use OpenStreetMap building data or Cesium ion OSM Buildings tileset to render real-world structures.

**Pros**
- Real-world accuracy.
- Massive coverage (350M+ buildings via Cesium OSM Buildings).
- 3D Tiles streaming for performance.

**Cons**
- Requires geospatial coordinate pipeline (WGS84 / EPSG:4326).
- Not footprint-driven from robot scan data.
- Adds dependency on Cesium ion or an OSM data pipeline.
- Overkill for a focused tactical scenario unless you need real locations.

**Best for:** Later-stage product when Operator needs to render actual operation areas, not synthetic training villages.

**Sources**
- Cesium OSM Buildings: global 3D buildings tileset.
- OSM Buildings (osmbuildings.org): open-source 3D building rendering.
- Overpass API / Geofabrik for raw OSM building footprints.

---

## Performance comparison

| Approach | Draw calls | Geometry cost | Texture cost | Development speed |
|----------|-----------|---------------|--------------|-------------------|
| Facade textures | Low | Low | Low | Very fast |
| Procedural facades | Medium | Medium | Low | Medium |
| Procedural roofs | Low-Medium | Low-Medium | None | Medium |
| Archetypes | Low | Low | Low | Medium |
| GLB landmarks | Per model | High | Medium | Slow |
| OSM/Cesium | Streaming | High | High | Slow |

---

## Recommended mix for Operator

Use a **hybrid**:

1. **Default buildings:** texture + roof shape + small instanced roof props.
2. **Important buildings:** archetype footprint + facade detail + specific roof.
3. **Landmarks:** one GLB model each, lazy-loaded.
4. **Real-world mode (future):** Cesium OSM Buildings overlay.

This gives 80% of the visual impact for 20% of the effort and keeps the tactical map fast.
