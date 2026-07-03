# Recommendations: Making Operator Buildings Look Real

**Date:** 2026-07-03  
**Goal:** Pick a concrete, low-risk implementation path for improving Operator's building visuals.

---

## Recommended strategy

**Hybrid: procedural textures + roof shapes + instanced props, with GLB only for landmarks.**

This gives the biggest visual improvement for the least complexity and keeps the tactical map readable and fast.

---

## Phase 1: Textures + roofs (1–2 days)

### 1. Add facade textures
- Generate window-grid textures on canvas at runtime.
- Apply to building sides with UV repeat based on width/height.
- Use a concrete/tar texture for roofs.
- Vary wall tint slightly per building to reduce repetition.

### 2. Add roof shapes
- Flat roof with parapet + HVAC block.
- Peaked/gable roof for residential.
- Shed roof for warehouses/garages.
- Pick roof type based on building kind.

### 3. Snap roofs to terrain
- Roof geometry inherits the same base position as the building.
- Overhangs should not clip into sloped terrain (keep overhangs small).

**Expected result:** Buildings stop looking like cardboard boxes. Draw call impact is minimal.

---

## Phase 2: Archetypes + instanced props (2–3 days)

### 1. Add non-rectangular footprints
- L-shape, T-shape, U-shape, long strip.
- Map archetype to `BuildingKind`.
- Update floorplan/interior logic to handle complex polygons.

### 2. Add roof props
- AC units, water tanks, antennas, chimneys.
- Use `InstancedMesh` for each prop type.
- Scatter on flat roofs, skip peaked roofs.

### 3. Add small facade props
- Doors, shop awnings, loading docks.
- Instance per type.

**Expected result:** Village looks varied and lived-in. Still footprint-driven.

---

## Phase 3: Facade geometry for hero buildings (optional, 2–3 days)

### 1. Extruded window frames
- Thin boxes around windows.
- Recessed glass planes.
- Limit to command post, tower, and dock.

### 2. Building-specific signs / markings
- Command post flag, dock beacon, tower antenna cluster.

**Expected result:** Important buildings stand up to close-up inspection.

---

## Phase 4: Real GLB landmarks (optional, when needed)

### 1. Identify landmark buildings
- Command post, dock, maybe a water tower or comms tower.

### 2. Source or model GLBs
- Use Sketchfab CC0 or model in Blender.
- Optimize with `gltf-transform`.
- Lazy-load and track licenses.

**Expected result:** Demo has one or two "wow" buildings without bloating the whole map.

---

## What to avoid

| Don't | Why |
|-------|-----|
| Photorealistic textures everywhere | Hurts readability; not standard in C2 |
| Detailed interiors in 3D | Use the existing 2D floorplan panel |
| High-poly models for every building | Kills performance on tablets |
| OSM/Cesium integration now | Adds geospatial complexity before the core demo is solid |
| Roof overhangs on steep terrain | Will clip/float unless carefully handled |

---

## Suggested first code change

Modify `src/lib/buildings.ts`:

1. Add `roofType` and `archetype` to `Building3D`.
2. Extend `createBuildingGeometry()` to call a `createRoofGeometry(footprint, roofType)` helper.
3. Add a `createFacadeTexture(kind)` helper that returns a `CanvasTexture`.
4. Update `buildingMaterial()` to accept a texture map and status emissive.

Then update `BuildingLayer.tsx` to pass the new parameters.

---

## Performance budget

Keep the building draw-call budget under **15 calls** for 100 buildings:

| Element | Draw calls target |
|---------|-------------------|
| Building shells | 1 per material/archetype (~4) |
| Roofs | merged into shell or 1 per roof type |
| Facade textures | shared across buildings |
| Window frames (if added) | 1–2 instanced meshes |
| Roof props | 3–5 instanced meshes |
| Landmarks (GLB) | 1 per model |

---

## Bottom line

Operator doesn't need photorealistic buildings. It needs **recognizable, varied, readable buildings** that support the tactical story. The fastest path is textures + roofs + archetypes + a few instanced props. Save real models for landmarks only.
