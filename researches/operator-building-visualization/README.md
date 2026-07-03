# Operator Building Visualization Research

**Project:** Operator / SCOUT — 3D tactical C2 map  
**Date:** 2026-07-03  
**Goal:** Find realistic, performant ways to render buildings that are currently extruded rectangles.

## What this folder covers

The Operator tactical map currently renders buildings as extruded footprint boxes with emissive status coloring. This research explores how to make buildings look more realistic without breaking the tactical readability or performance budget.

## Files

| File | Topic |
|------|-------|
| `2026-07-03-building-visualization-options.md` | High-level approaches: textures, procedural detail, 3D models, OSM/Cesium |
| `2026-07-03-procedural-building-techniques.md` | Specific procedural geometry techniques for facades, roofs, props |
| `2026-07-03-free-building-asset-sources.md` | Free/CC0 asset libraries and conversion workflows |
| `2026-07-03-tactical-bms-building-patterns.md` | How real C2/BMS systems render buildings (MIL-STD-2525, TITAN, ATAK, Cesium) |
| `2026-07-03-recommendations.md` | Recommended implementation path for Operator |

## TL;DR recommendation

For Operator, the best first step is a **texture + procedural facade + roof-shape** combo:

1. Add facade textures with window/door patterns to the existing extruded boxes.
2. Add 4–6 roof geometries (flat, peaked, shed, mansard) per building kind.
3. Add small instanced props (AC units, antennas, chimneys) on roofs.
4. Reserve real GLB models only for landmark/dock/command-post buildings.

This keeps the data model simple, draw calls low, and the map readable.

## Sources

- Three.js documentation and community (instancing, batched mesh, materials)
- CesiumJS / Cesium ion documentation and OSM Buildings
- MIL-STD-2525C / APP-6 military symbology standards
- Free asset sites: Poly Haven, Kenney, Sketchfab, ambientCG, Quaternius
- Web search synthesis, July 2026
