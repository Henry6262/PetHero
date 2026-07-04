# Draw-Call Optimization for Operator

**Date:** 2026-07-03  
**Goal:** Reduce the number of WebGL draw calls as the map grows.

---

## Why draw calls matter

Each draw call has CPU overhead. On mid-range devices, 100–300 draw calls is comfortable. 1,000+ starts to hurt. Operator currently has:

| Element | Draw calls |
|---------|------------|
| Terrain | 1 |
| Hex cells | 1 (instanced) |
| Hex grid lines | 1 |
| Buildings | ~20 (one per building) |
| Rocks | 1 (instanced) |
| Agents | 2 (instanced) |
| Route | 1 |
| **Total** | **~27** |

This is fine now. But if we scale to 80+ buildings without merging, draw calls hit 90+. Add props and the problem gets worse.

---

## Instancing

Use `THREE.InstancedMesh` when many objects share the same geometry and material.

Already used for:
- Hex cells
- Rocks
- Ground/aerial agents

### Improving instancing

Switch to `@three.ez/instanced-mesh` (`InstancedMesh2`) for per-instance features:

```typescript
import { InstancedMesh2 } from '@three.ez/instanced-mesh';

const mesh = new InstancedMesh2(geometry, material, { capacity: 1000 });
mesh.addInstances(1000, (obj, i) => {
  obj.position.set(positions[i].x, positions[i].y, positions[i].z);
  obj.updateMatrix();
});
mesh.computeBVH({ margin: 0 });
```

Benefits:
- Per-instance frustum culling.
- Per-instance visibility.
- Dynamic capacity.
- LOD per instance.
- Faster raycasting with BVH.

---

## Merging building geometries

Buildings currently use one mesh per building because each has a different footprint/height/material. Two ways to merge:

### Option 1: Merge by status/material

Group buildings by status (clear, partial, conflict, etc.). Merge all geometries in each group into one mesh.

```typescript
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const clearGeoms = buildings
  .filter(b => b.status === 'clear')
  .map(b => createBuildingGeometry(b.footprint, b.height)
    .translate(b.position.x, b.position.y, b.position.z)
    .rotateY(b.rotation));

const merged = mergeGeometries(clearGeoms);
const mesh = new THREE.Mesh(merged, clearMaterial);
```

Result: one draw call per status (4–5 total).

### Option 2: BatchedMesh

`THREE.BatchedMesh` (r150+) lets you render many geometries with one draw call while keeping them separate for raycasting/updates.

```typescript
const batched = new THREE.BatchedMesh(maxCount, maxVertexCount, maxIndexCount);
const geometryId = batched.addGeometry(buildingGeom);
const instanceId = batched.addInstance(geometryId);
batched.setMatrixAt(instanceId, matrix);
```

Pros:
- One draw call for all buildings.
- Still raycastable per instance.

Cons:
- Newer API; documentation is improving but less mature than InstancedMesh.

### Recommendation

Use **merge-by-status** for static buildings and **BatchedMesh** if buildings need frequent individual updates.

---

## Material atlasing

A draw call is often triggered by a material change. If buildings use 4 different materials (one per status), that's 4 draw calls minimum.

Texture atlas approach:
1. Combine facade textures into one atlas.
2. Use UV offsets to pick the right texture per building.
3. One material, one draw call.

For Operator, status color is emissive/tint-based, not texture-based, so atlas is optional. But if we add different wall styles (brick, concrete, wood), an atlas helps.

---

## BVH for raycasting

`three-mesh-bvh` is already used for building raycasting. Keep it, but consider:
- Build BVH on merged building meshes too.
- Use BVH worker (already used) to avoid blocking the main thread.
- For hex hover, a BVH over instances is faster than `intersectObject` on the whole instanced mesh.

---

## Reducing overdraw

Overdraw = pixels drawn multiple times because objects overlap. Causes:
- Transparent objects (hex grid lines, route, X-ray buildings).
- Lots of overlapping geometry.

Mitigations:
- Render opaque objects first, transparent last.
- Use `depthWrite: false` sparingly.
- Avoid large transparent planes.

Current code already sets `depthWrite: false` for hex grid lines and route, which is correct.

---

## Expected draw-call budget

| Map scale | Buildings | Target draw calls |
|-----------|-----------|-------------------|
| Current (22×16) | ~20 | ~10 |
| 2× area (44×32) | ~80 | ~15–20 |
| 4× area (88×64) | ~320 | ~25–35 |

With merging and instancing, we can scale to 4× area without draw calls becoming the bottleneck.
