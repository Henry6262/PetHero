# Recommendations: Expand the Map and Keep It Fast

**Date:** 2026-07-03  
**Goal:** Concrete implementation plan for doubling Operator's map area and adding smart rendering.

---

## What we should do now

### 1. Expand the map to 2× area

Change `hex-math.ts`:

```typescript
export const GRID_COLS = 31; // ~√2 × 22
export const GRID_ROWS = 23; // ~√2 × 16
```

This roughly doubles the area while keeping hex counts manageable (~713 cells vs 352).

Alternative: go to 44 × 32 (4× cells) if you want a dramatic expansion and are ready to optimize. For now, 31 × 23 is the safer step.

Update `TacticalCamera` max distance and fog to match:

```typescript
controls.maxDistance = 320;
scene.fog = new THREE.FogExp2(0x1a1d23, 0.006);
```

---

### 2. Scale buildings/rocks/agents correctly

Current sizes:

| Object | Size | Notes |
|--------|------|-------|
| Hex cell | radius 2.0 | ~3.5 unit width |
| House | 2.0 × 2.0 | fits one hex |
| Office | 3.0 × 5.0 | spans ~1.5 hexes |
| Rock | 0.3–1.0 | looks small relative to buildings |
| Ground agent | cylinder 1.1 radius | looks okay |
| Drone | sphere 0.9 radius | okay |

Issues:
- Rocks look like pebbles next to houses. Consider scaling rocks to 0.6–1.8.
- Agent pucks (1.1 radius) are small but readable.
- Buildings are fine, but all houses are identical boxes.

Recommended scale tweaks:
- Rocks: `baseScale = 0.6 + rng() * 1.2`.
- Agents: slightly larger at 1.4 radius for readability.
- Buildings: keep current footprints for now; visual variety comes from roofs/textures.

---

### 3. Add textures + roofs (Option A)

This is the biggest visual upgrade. See `researches/operator-building-visualization/` for the detailed plan.

Quick implementation order:
1. Generate canvas facade textures with windows.
2. Add roof geometries (flat + parapet/HVAC, peaked, shed).
3. Map roof type to building kind.
4. Apply per-building tint to reduce repetition.

---

### 4. Add smart rendering

For the expanded map, implement this stack in order:

#### Step A: Merge building geometries by status (1 day)

Reduce building draw calls from ~80 to ~5.

#### Step B: Add per-instance frustum culling (1 day)

Switch hex cells and rocks to `@three.ez/instanced-mesh` (`InstancedMesh2`) with BVH.

#### Step C: Add chunk-based culling (2–3 days)

- Split map into 8×8 hex chunks.
- Render only visible chunks.
- Update raycasting to use chunk index under pointer.

#### Step D: Add simple LOD (2 days)

- Hex cells: flat hexagon for distant chunks.
- Buildings: simple box for far buildings.
- Terrain: tiled LOD if needed.

---

## Implementation sequence

| Order | Task | Why first |
|-------|------|-----------|
| 1 | Map expansion + scale tweaks | Establishes new baseline |
| 2 | Building textures + roofs | Biggest visual impact |
| 3 | Merge buildings by status | Required before adding more buildings |
| 4 | InstancedMesh2 for hexes/rocks | Per-instance culling |
| 5 | Chunk system | Scales to large maps |
| 6 | LOD | Polishes performance at distance |

---

## Expected performance

| Stage | Draw calls (31×23) | FPS target |
|-------|---------------------|------------|
| Before | ~27 | 60 |
| After textures/roofs | ~30 | 60 |
| After merging buildings | ~10 | 60 |
| After InstancedMesh2 | ~8 | 60 |
| After chunking | ~5–8 visible | 60 |

On low-end tablets, chunking + LOD should keep the app smooth.

---

## What to avoid

- Don't use real GLB models for every building yet — too much asset work.
- Don't implement occlusion culling yet — overkill.
- Don't add terrain streaming yet — map isn't big enough.
- Don't over-detail distant buildings — tactical readability matters more.

---

## Bottom line

Double the map, add textures + roofs, then layer on merge → per-instance culling → chunks → LOD. This gives you a much bigger, better-looking map that stays fast.
