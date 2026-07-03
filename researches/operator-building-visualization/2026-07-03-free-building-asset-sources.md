# Free Building Asset Sources for Operator

**Date:** 2026-07-03  
**Goal:** Identify free/CC0 sources for real 3D building models and textures that work with Three.js / R3F.

---

## TL;DR

For Operator, **Poly Haven** and **ambientCG** are the best free texture sources, **Kenney** and **Quaternius** are the best free low-poly model packs, and **Sketchfab** is the best broad marketplace if you filter by CC0.

---

## Free model libraries

### Poly Haven (polyhaven.com)
- **License:** CC0
- **Best for:** Realistic textures, HDRIs, a smaller set of models.
- **Use case:** Facade textures, roof materials, environment HDRIs.
- **Pros:** High quality, no attribution, commercial-safe.
- **Cons:** Limited building-specific models.

### Kenney (kenney.nl)
- **License:** CC0
- **Best for:** Game-ready low-poly assets.
- **Use case:** Stylized props, vehicles, simple buildings.
- **Pros:** Consistent style, small file sizes, optimized for games.
- **Cons:** Style is cartoonish; may not fit a serious tactical map.

### Quaternius (quaternius.com)
- **License:** CC0
- **Best for:** Low-poly characters, props, some environments.
- **Use case:** Character models, simple props.
- **Cons:** Less building-focused.

### Sketchfab (sketchfab.com) — Free section
- **License:** Mixed (CC0, CC-BY, etc.)
- **Best for:** Huge variety of realistic and stylized models.
- **Use case:** Specific landmark buildings, vehicles, equipment.
- **Pros:** Massive library.
- **Cons:** License varies per asset; quality varies; cleanup often needed.
- **Filter:** Search by "Downloadable" + license.

### CGTrader Free / TurboSquid Free
- **License:** Mixed
- **Best for:** Realistic architectural models.
- **Cons:** Often need cleanup; license restrictions common.

### OpenGameArt
- **License:** Mixed
- **Best for:** Game-style assets.
- **Cons:** Quality inconsistent.

---

## Free texture / material sources

### ambientCG (ambientcg.com)
- **License:** CC0
- **Best for:** PBR textures (brick, concrete, metal, wood).
- **Use case:** Building facade and roof materials.
- **Pros:** Large library, multiple resolutions, PBR maps included.

### Poly Haven Textures
- **License:** CC0
- **Best for:** High-quality seamless PBR textures.
- **Use case:** Concrete, brick, stucco, metal roofing.

### ShareTextures (sharetextures.com)
- **License:** Free with registration / mixed
- **Best for:** PBR materials.
- **Cons:** Smaller library than ambientCG.

### CC0 Textures
- **License:** CC0
- **Best for:** Seamless high-res textures.

---

## Real-world building data sources

### Cesium OSM Buildings
- **URL:** cesium.com/platform/cesium-ion/content/cesium-osm-buildings
- **License:** Free for non-commercial / commercial with Cesium ion credits
- **What:** 350M+ 3D buildings from OpenStreetMap, streamed as 3D Tiles.
- **Use case:** Real-world urban environments.
- **Cons:** Requires Cesium ion account; not footprint-driven from robot scans.

### OSM Buildings (osmbuildings.org)
- **License:** OpenStreetMap ODbL
- **What:** Open-source 3D building rendering from OSM data.
- **Use case:** Free alternative to Cesium for OSM buildings.

### Overpass API
- **What:** Query OSM building footprints, heights, roof types.
- **Use case:** Generate procedural buildings from real OSM footprints.

### CityJSON / 3D City DB
- **What:** Structured 3D city models.
- **Use case:** High-fidelity urban digital twins (overkill for Operator v0).

---

## Recommended asset workflow

For each real model you bring into Operator:

1. **Download** from Sketchfab / Poly Haven / Kenney.
2. **Inspect** with `npx gltf-transform inspect model.glb`.
3. **Clean in Blender:**
   - Remove duplicate materials.
   - Apply scale/rotation.
   - Reduce polygon count if >5K triangles for a hero building.
   - Resize textures to 1K or 2K max.
4. **Export as GLB** with Draco compression.
5. **Optimize:**
   ```bash
   npx gltf-transform optimize model.glb model.optimized.glb
   ```
6. **Track license** in `assets/licenses.md`:
   ```
   Asset: command-post.glb
   Source: Sketchfab
   Author: ...
   License: CC0
   Downloaded: 2026-07-03
   Changes: resized textures, applied Draco compression
   ```
7. **Lazy-load** in the app; keep a procedural fallback.

---

## What NOT to use

- **Photogrammetry scans** (e.g., Smithsonian 3D) — too heavy, not building-focused.
- **Unoptimized Sketchfab models** — can be 50MB+ with 4K textures.
- **Unity/Unreal asset store packs** — require format conversion, often non-commercial licenses.

---

## Operator-specific asset shortlist

| Need | Source | Asset type |
|------|--------|------------|
| Facade textures | ambientCG / Poly Haven | PBR textures |
| Roof materials | ambientCG | PBR textures |
| Command post model | Sketchfab (CC0) | GLB |
| Dock / station model | Sketchfab / Kenney | GLB / low-poly |
| AC units, antennas | Kenney / Quaternius | GLB / low-poly |
| Real-world urban backdrop | Cesium OSM Buildings | 3D Tiles |
