# LOD and Terrain Streaming for Operator

**Date:** 2026-07-03  
**Goal:** Use level-of-detail and terrain tiling so distant content is cheaper to render.

---

## LOD for hex cells

Current hex cells are extruded prisms. From far away they are tiny; from close up they fill the screen.

### Distance thresholds

| Distance | Detail |
|----------|--------|
| 0–30     | Full prism with side faces |
| 30–80    | Flat hexagon (no extrusion) |
| 80+      | Skip or render as dot/label only |

For a tactical map, you usually don't view hexes from very close, so flat hexagons may be enough for most of the scene.

### Implementation

Use Three.js `LOD` or Drei `<Detailed />`:

```tsx
import { Detailed } from '@react-three/drei';

<Detailed distances={[0, 30, 80]}>
  <mesh geometry={hexPrismGeom} material={material} />
  <mesh geometry={hexFlatGeom} material={material} />
  <mesh geometry={hexDotGeom} material={material} />
</Detailed>
```

For instanced hex cells, per-instance LOD is harder. Use `@three.ez/instanced-mesh` LOD or switch between two instanced meshes based on chunk distance.

---

## LOD for buildings

Current buildings are extruded footprints with bevel. LOD stages:

| Distance | Detail |
|----------|--------|
| 0–25     | Full geometry + facade texture + roof |
| 25–70    | Simple extruded box with facade texture |
| 70+      | Colored box only |

This is easy to implement if we pre-generate the three LOD geometries per building kind.

### Merged impostors for far buildings

For very large maps, far buildings can be merged into one giant mesh per material:

```typescript
const farGeometries = buildings.map(b => createBox(b.position, b.height)).filter(...);
const merged = BufferGeometryUtils.mergeGeometries(farGeometries);
```

This turns hundreds of far building meshes into one draw call.

---

## LOD for terrain

Current terrain is one plane with 120 × 80 segments. For a doubled map, this becomes 240 × 160 = 38,400 vertices. Still fine, but scaling further requires tiling.

### Simple LOD terrain

Split terrain into tiles. Each tile has multiple detail levels:

```typescript
interface TerrainTile {
  x: number;
  z: number;
  lod0: THREE.BufferGeometry; // 32x32 segments
  lod1: THREE.BufferGeometry; // 16x16 segments
  lod2: THREE.BufferGeometry; // 8x8 segments
}
```

At runtime, pick LOD based on distance from camera:

```typescript
const dist = camera.position.distanceTo(tile.center);
const lod = dist < 40 ? 0 : dist < 100 ? 1 : 2;
```

### Skirts between tiles

Different LODs can create gaps at tile edges. Solutions:
- Add vertical **skirts** to hide gaps.
- Use a vertex shader that snaps vertices to a coarser grid (geometry clipmaps).
- For Operator's scale, skirts are enough.

### Geometry clipmaps (advanced)

A geometry clipmap is a set of nested rings with increasing detail near the camera. This is the gold standard for large terrains but is complex to implement.

**Verdict:** Use simple tiled LOD for now. Switch to clipmaps only if the map grows to city-scale.

---

## Terrain streaming

For very large maps, don't generate all terrain at load time. Instead:

1. Pre-generate terrain tiles on the server or at build time.
2. Store as binary heightmaps or compressed meshes.
3. Load tiles on demand based on camera position.
4. Unload distant tiles to free memory.

For Operator v0, streaming is unnecessary. Generate all tiles at load but only render visible ones.

---

## LOD transitions

Avoid popping:
- Use **fog** to fade distant objects.
- Use **cross-fade** between LOD levels (alpha blending for one frame).
- For terrain, vertical skirts prevent cracks.

In most tactical views, the camera angle is oblique and fog hides distant LOD switches.

---

## Shadow LOD

Shadows are expensive. Cast shadows only from:
- Near buildings.
- Important landmarks.
- Skip rocks, distant buildings, and flat hexes.

Use `castShadow={false}` for far LODs.

---

## Recommended LOD setup for Operator

1. **Hex cells:** full prism near camera, flat hexagon elsewhere.
2. **Buildings:** box + texture by default; add detail only for selected/near buildings.
3. **Terrain:** split into tiled LOD if map grows beyond 44 × 32 hexes.
4. **Shadows:** cast only from near buildings.
5. **Fog:** hide distant LOD switches.
