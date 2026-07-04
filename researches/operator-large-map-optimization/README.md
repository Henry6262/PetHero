# Operator Large-Map Optimization Research

**Project:** Operator / SCOUT — 3D tactical C2 map  
**Date:** 2026-07-03  
**Goal:** Find the best way to expand the map to 2× area while keeping 60 FPS and adding smart rendering so only visible/important content is drawn.

## Context

- Current map: ~22 × 16 hex cells, ~88 × 84 world units.
- Current content: terrain mesh, hex cells (instanced), hex grid lines, buildings, rocks (instanced), agents (instanced), route line.
- Target: roughly double the playable area, then scale further without rewriting everything.

## Files

| File | Topic |
|------|-------|
| `2026-07-03-large-map-optimization-strategies.md` | High-level strategies and trade-offs |
| `2026-07-03-chunking-and-culling.md` | Spatial chunks, frustum culling, visibility systems |
| `2026-07-03-LOD-and-terrain-streaming.md` | Level of detail for terrain and buildings |
| `2026-07-03-draw-call-optimization.md` | Instancing, merging, BatchedMesh, material atlasing |
| `2026-07-03-recommendations.md` | Recommended implementation plan for Operator |

## TL;DR recommendation

Use a **three-layer optimization stack**:

1. **Reduce draw calls** — merge building geometries by material, keep instancing for rocks/agents.
2. **Add a chunk system** — split the map into fixed tiles; only render chunks inside the camera frustum.
3. **Add LOD** — simplified terrain and building proxies for distant views, full detail near camera.

This is the standard pattern used in RTS, city builders, and open-world web maps.

## Sources

- Three.js documentation on `InstancedMesh`, `BatchedMesh`, LOD, and frustum culling
- React Three Fiber scaling-performance guide
- `@three.ez/instanced-mesh` documentation
- `three-mesh-bvh` documentation and BVH worker patterns
- Community articles on large Three.js scene optimization (2022–2025)
- Web search synthesis, July 2026
