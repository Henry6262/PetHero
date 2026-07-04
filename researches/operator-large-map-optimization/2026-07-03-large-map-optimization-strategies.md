# Large-Map Optimization Strategies for Operator

**Date:** 2026-07-03  
**Context:** Operator's tactical map needs to grow from ~22 × 16 hex cells to 2× area and beyond. This document compares the main strategies.

---

## The problem

At the current size, performance is fine because the scene is small:

- ~350 hex cells
- ~20 buildings
- 200 rocks
- 7 agents
- One terrain mesh

If we double the linear dimensions, we get:

- ~1,400 hex cells (4×)
- ~80 buildings (4×)
- ~800 rocks (4×)
- More agent labels, routes, and terrain vertices

The GPU can handle this if we are smart. The real risks are:

1. **Draw calls** — each building mesh = one draw call. 80+ buildings = 80+ draw calls.
2. **CPU overhead** — updating matrices/colors for thousands of instances every frame.
3. **Terrain vertex count** — a single dense terrain mesh grows quadratically.
4. **Raycasting** — hover/selection raycasts against thousands of hexes/buildings.

---

## Strategy 1: Draw-call reduction

**What:** Combine objects so the GPU draws more with fewer calls.

**Techniques**
- `InstancedMesh` for repeated geometry (hex cells, rocks, agents, future props).
- `BatchedMesh` for many meshes that share a material but have different geometry.
- Merge geometries manually when they are static and share a material.
- Texture atlases so multiple objects use one material.

**Best for:** Buildings, rocks, props.

**Impact:** High. Draw calls are a common bottleneck in WebGL.

---

## Strategy 2: Frustum culling

**What:** Don't render objects outside the camera view.

**Built-in:** Three.js automatically frustum-culls per `Mesh` using its bounding box.

**Problem with instancing:** Standard `InstancedMesh` culls the whole object, not individual instances. If 1,000 hex cells are in one `InstancedMesh`, all 1,000 are drawn even if only 50 are on screen.

**Solution:** Use `@three.ez/instanced-mesh` (`InstancedMesh2`) which adds per-instance frustum culling and BVH.

**Best for:** Hex cells, rocks, trees/props.

**Impact:** Very high for large maps where most content is off-screen.

---

## Strategy 3: Spatial chunking

**What:** Split the map into fixed-size chunks/tiles. Only render chunks near the camera or inside the frustum.

**How it works**
1. Divide the world into a grid of chunks (e.g., 8 × 8 hexes each).
2. Assign every object (hex, building, rock) to a chunk.
3. Each frame, find which chunks intersect the camera frustum.
4. Render only those chunks.

**Pros**
- Simple to implement.
- Works with React components (one `<Chunk />` per tile).
- Easy to add LOD per chunk.
- Future: load/unload chunks from disk/server.

**Cons**
- Objects that span chunk boundaries need special handling.
- Camera rotation can suddenly reveal many chunks.

**Best for:** Static map content (hexes, buildings, rocks, terrain).

**Impact:** Very high. This is how RTS and city builders handle big maps.

---

## Strategy 4: Level of detail (LOD)

**What:** Render simpler versions of objects far from the camera.

**For terrain**
- High-detail mesh near camera.
- Lower-poly mesh for mid-distance.
- Flat/billboard for far distance (or hide behind fog).

**For buildings**
- Near: extruded box + facade detail.
- Mid: simple box with texture.
- Far: colored box or merged impostor.

**For hex cells**
- Near: full hexagon prism.
- Far: flat hexagon or skip entirely.

**Tools**
- Three.js `LOD` object.
- `<Detailed />` from `@react-three/drei`.
- Custom distance-based switching.

**Best for:** Terrain, buildings, props.

**Impact:** High when camera can zoom out or view large areas.

---

## Strategy 5: Occlusion culling

**What:** Don't render objects that are completely hidden behind other objects.

**State of the art:** True occlusion culling is hard in WebGL. Three.js does not have it built-in. Approximations exist:

- **Hi-Z culling:** render a low-res depth buffer first, then test object bounding boxes against it.
- **Portal culling:** precompute visibility for indoor/city blocks.
- **CPU raycasting:** cast rays to see if objects are blocked (expensive).

**Verdict for Operator:** Occlusion culling is overkill right now. Frustum culling + fog + chunking gives 90% of the benefit with 10% of the complexity.

---

## Strategy 6: Terrain streaming / tiling

**What:** Instead of one giant terrain mesh, split terrain into tiles and only render visible tiles.

**Approaches**
- **Fixed tiles:** terrain is pre-baked into N × M tiles. Render tiles inside frustum.
- **LOD tiles:** each tile has multiple detail levels; pick based on distance.
- **GPU tessellation:** not reliable in WebGL.

**Best for:** Very large terrains (km-scale).

**Impact:** High for huge terrains, moderate for Operator's current scale.

---

## Strategy comparison

| Strategy | Complexity | Performance gain | Best stage |
|----------|-----------|------------------|------------|
| Draw-call reduction | Low | High | Now |
| Frustum culling (per-instance) | Low-Medium | Very high | Now |
| Spatial chunking | Medium | Very high | Now / next |
| LOD | Medium | High | Next |
| Occlusion culling | High | Medium-High | Later |
| Terrain streaming | Medium-High | High | Later |

---

## Recommended stack for Operator

Use strategies in this order:

1. **Draw-call reduction** — merge buildings, keep instancing for everything else.
2. **Per-instance frustum culling** — switch hex cells and rocks to `@three.ez/instanced-mesh`.
3. **Spatial chunking** — split hexes/buildings/rocks into chunks, render only visible chunks.
4. **LOD** — add simplified terrain and building proxies.
5. **Fog + camera far plane** — hide pop-in at chunk/LOD boundaries.

This stack is scalable: each layer buys more performance without breaking the previous one.
