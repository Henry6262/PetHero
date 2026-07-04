# Terrain + Coordinate Repo Cheatsheet

**Date:** 2026-07-04  
**Project:** Operator / SCOUT — 3D tactical C2 map  
**Source:** Curated list of reference repos for terrain generation and coordinate conversion.

## 1. Terrain from Heightmap (R3F + Canvas API) — CLOSEST MATCH

- **Repo:** `supershaneski/react-three-terrain`
- **URL:** https://github.com/supershaneski/react-three-terrain
- **License:** MIT
- **Files to steal:**
  - `src/components/Terrain.jsx` — heightmap → BufferGeometry pipeline (positions, normals, colors, uvs, indices from scratch).
  - `src/components/App.jsx` — wiring into `<Canvas>` + `<OrbitControls>` + lighting.
- **Use for Operator:** Replace image-pixel sampling with `getTerrainHeight(x, y)` from simplex-noise. Keep the BufferGeometry construction.

## 2. Procedural Terrain with Simplex Noise (VR Forest)

- **Repo:** `reality2-roycdavies/vr-forest`
- **URL:** https://github.com/reality2-roycdavies/vr-forest
- **Files to steal:**
  - `js/terrain/noise.js` — seeded simplex noise instances.
  - `js/terrain/terrain-generator.js` — height/color/normal from noise.
  - `js/terrain/chunk.js` — per-chunk mesh generation.
  - `js/forest/vegetation.js` — InstancedMesh rock/grass/fern scatter.
  - `js/config.js` — 280-parameter config structure.
- **Use for Operator:** Layered noise, chunk manager if map grows, scatter logic.

## 3. R3F Terrain with Splat Mapping + Martini LOD

- **Repo:** `nwpointer/three-landscape`
- **URL:** https://github.com/nwpointer/three-landscape
- **License:** MIT
- **Files to steal:**
  - `src/TerrainMaterial.tsx` — custom material with splatmap support.
  - `src/MartiniGeometry.tsx` — drop-in LOD geometry.
  - `src/useProgressiveTexture.ts` — progressive texture loader.
- **Use for Operator:** Replace `PlaneGeometry` with `MartiniGeometry` for automatic LOD.

## 4. Coordinate Conversion — Lat/Lon ↔ UTM ↔ MGRS

- **Full library:** `chrisveness/geodesy` (4.5k stars, MIT)
- **Lightweight MGRS only:** `proj4js/mgrs` (300 stars, MIT)
- **Use for Operator:** Convert real Ukrainian coordinates to local world meters.

## 5. Google Maps-style Lat/Lon → Three.js World

- **Repo:** `googlemaps/js-three`
- **URL:** https://github.com/googlemaps/js-three
- **License:** Apache 2.0
- **Key pattern:** anchor-point conversion to avoid floating-point precision loss at high latitudes.
- **Use for Operator:** Define a local origin near the op area and compute offsets in meters.

## 6. Hex Grid + InstancedMesh on a Globe

- **Repo:** `vasturiano/r3f-globe`
- **URL:** https://github.com/vasturiano/r3f-globe
- **Files to steal:**
  - `src/layers/hexbin.js` — hex prism InstancedMesh with per-instance altitude/color.
  - `src/layers/htmlElements.js` — CSS2DRenderer for HTML labels.
- **Use for Operator:** The hex InstancedMesh pattern is already similar; the HTML label pattern is useful for agent callsigns.

## 7. Geographic Tiles in Three.js

- **Repo:** `tentone/geo-three`
- **URL:** https://github.com/tentone/geo-three
- **Files to steal:**
  - `source/MapView.ts` — tile-based map system with LOD.
  - `source/providers/MapProvider.ts` — provider interface.
  - `source/utils/UnitsUtils.ts` — lat/lon → Mercator meters.
- **Use for Operator:** If real satellite/elevation tiles are needed later.

## 8. Complete Terrain System — THREE.Terrain

- **Repo:** `IceCreamYou/THREE.Terrain`
- **URL:** https://github.com/IceCreamYou/THREE.Terrain
- **License:** MPL 2.0
- **Files to steal:**
  - `src/generators.js` — noise generators.
  - `src/materials.js` — blended materials based on slope/elevation.
  - `src/scatter.js` — foliage/debris scatter with height/slope constraints.
- **Use for Operator:** Reference implementation; scatter logic is directly applicable.

## 9. Lightweight Coordinate Projection

- **Repo:** `proj4js/proj4js`
- **URL:** https://github.com/proj4js/proj4js
- **License:** MIT
- **Use for Operator:** Convert any CRS (e.g., Ukrainian SK-42 / Pulkovo 1942) to WGS84 or UTM.

## Quick install list

```bash
# Terrain
npm install simplex-noise alea seedrandom

# Coordinates (pick one or more)
npm install geodesy          # Full geodesy
npm install mgrs             # Lightweight MGRS only
npm install proj4            # PROJ4 transforms

# Optional terrain enhancements
npm install three-landscape  # R3F terrain abstractions
```

## Mapping to Operator

| Problem | Repo to copy from | File |
|---|---|---|
| Heightmap → 3D mesh in R3F | react-three-terrain | `Terrain.jsx` |
| Layered simplex noise terrain | vr-forest | `noise.js`, `terrain-generator.js` |
| Rock/vegetation scatter | vr-forest / THREE.Terrain | `vegetation.js`, `scatter.js` |
| Terrain LOD | three-landscape | `MartiniGeometry.tsx` |
| Lat/Lon → MGRS | geodesy / mgrs | one function call |
| Lat/Lon → UTM (Ukrainian) | geodesy / proj4 | one function call |
| Lat/Lon → local meters | googlemaps/js-three | `latLngAltitudeToVector3()` |
| Hex grid InstancedMesh | r3f-globe | `hexbin.js` |
| Real map tiles | geo-three | `MapView.ts`, `UnitsUtils.ts` |
| Complete terrain reference | THREE.Terrain | `generators.js`, `scatter.js` |
