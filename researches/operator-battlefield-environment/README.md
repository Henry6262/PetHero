# Operator Battlefield Environment Research

**Project:** Operator / SCOUT — 3D tactical C2 map  
**Date:** 2026-07-03  
**Goal:** Make the map look like a believable village battlefield with walls, compounds, cars, and obstacles.

## TL;DR

A tactical village battlefield reads better with these elements:

- **Compounds** — walled clusters of buildings (command posts, barracks, garages).
- **Walls** — concrete, cinder-block, or adobe walls connecting buildings and defining alleys.
- **Vehicles** — parked cars, trucks, wrecked cars, APCs.
- **Obstacles** — sandbag walls, concrete barriers, crates, barrels, tire stacks, checkpoints.
- **Foliage/debris** — trees, bushes, rubble piles for cover.

The best implementation is **procedural + instanced**: generate positions from a seeded RNG, avoid streets/buildings, and render each prop type as one `InstancedMesh`.

## Files

| File | Topic |
|------|-------|
| `2026-07-03-battlefield-environment-elements.md` | What elements make a village battlefield |
| `2026-07-03-procedural-compounds-and-walls.md` | How to generate compounds and walls |
| `2026-07-03-free-military-assets.md` | Free asset sources |
| `2026-07-03-implementation-plan.md` | Recommended implementation for Operator |

## Sources

- Three.js / R3F instancing best practices
- Sketchfab / Meshy / Kenney free military/barrier assets
- Web search synthesis, July 2026
