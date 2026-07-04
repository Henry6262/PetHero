# Chunking and Culling for Operator

**Date:** 2026-07-03  
**Goal:** Design a spatial chunking system so Operator only renders what the camera can see.

---

## Why chunking matters

In a tactical map, the camera usually looks at only 10–30% of the world at once. Without chunking, every hex cell, building, and rock is submitted to the GPU every frame. With chunking, only visible tiles are rendered.

This is the same technique used by:
- **RTS games** (StarCraft, Age of Empires) — fog-of-war + map sectors.
- **City builders** (Cities: Skylines) — district tiles.
- **Open-world web maps** (Cesium, Google Earth) — 3D tiles.

---

## Chunk design for Operator

### Chunk size

Use **8 × 8 hex cells** per chunk.

| Map size | Chunks (8×8) | Avg visible chunks (ISO view) |
|----------|--------------|-------------------------------|
| 22 × 16  | 3 × 2 = 6    | 3–4                           |
| 44 × 32  | 6 × 4 = 24   | 6–10                          |
| 88 × 64  | 11 × 8 = 88  | 10–18                         |

An 8×8 chunk is small enough for fine culling but large enough that the per-chunk overhead is negligible.

### Data structure

```typescript
interface Chunk {
  id: string;
  col: number; // chunk column
  row: number; // chunk row
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  cells: HexCell[];
  buildings: Building[];
  rocks: Rock[];
}
```

Build a `Map<string, Chunk>` at load time. Each object goes into exactly one chunk based on its world position.

### Visibility test

For each chunk, create a `THREE.Box3` bounding box. Each frame, test if the box intersects the camera frustum:

```typescript
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();
camera.updateMatrixWorld();
projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
frustum.setFromProjectionMatrix(projScreenMatrix);

const visible = frustum.intersectsBox(chunk.box);
```

React component:

```tsx
{chunks.filter(c => c.visible).map(chunk => (
  <Chunk key={chunk.id} chunk={chunk} />
))}
```

### Dealing with objects on chunk boundaries

Simple rule: assign each object to the chunk that contains its center point. Objects near boundaries may be visually cut off if the adjacent chunk is culled.

Solutions:
- Add a **margin** to each chunk's bounding box (e.g., half a hex).
- Use a **2×2 neighborhood** when rendering — render the chunk plus its neighbors.
- For large objects, store them in all overlapping chunks (more complex).

For Operator, adding a 1-hex margin is enough.

---

## Per-instance frustum culling

Even inside a visible chunk, not every instance is on screen. Standard `InstancedMesh` draws all instances in one call. To cull per-instance, use `@three.ez/instanced-mesh`:

```typescript
import { InstancedMesh2 } from '@three.ez/instanced-mesh';

const mesh = new InstancedMesh2(geometry, material, { capacity: count });
mesh.addInstances(count, (obj, i) => {
  obj.position.copy(positions[i]);
  obj.updateMatrix();
});
mesh.computeBVH({ margin: 0 });
```

Benefits:
- Per-instance frustum culling.
- Dynamic BVH for fast raycasting.
- LOD support per instance.

Best applied to:
- Hex cells (one `InstancedMesh2` per chunk or global).
- Rocks (one `InstancedMesh2` per chunk).
- Future props (AC units, antennas, trees).

---

## Raycasting optimization

Raycasting against thousands of hex cells or buildings is expensive. Current code raycasts the full hex `InstancedMesh` every frame for hover.

With chunks:
1. Only raycast against visible chunks.
2. Use `three-mesh-bvh` for each building geometry (already done).
3. For hex hover, use a spatial index or BVH over instances.

```typescript
// Option: raycast only the chunk under the pointer.
const pointerWorld = ...; // unproject mouse
const chunk = getChunkAt(pointerWorld.x, pointerWorld.z);
raycaster.intersectObject(chunk.hexMesh);
```

---

## Camera far plane and fog

Use exponential fog and a tuned far plane to hide distant chunks without obvious pop-in:

```typescript
scene.fog = new THREE.FogExp2(0x1a1d23, 0.008);
camera.far = 220; // already in TacticalCamera
```

For larger maps, lower the fog density slightly or increase `camera.far`.

---

## Chunk rendering with React Three Fiber

Option A: One component per chunk

```tsx
function MapChunks({ chunks }) {
  const visibleChunks = useFrameCulledChunks(chunks);
  return (
    <>
      {visibleChunks.map(chunk => (
        <group key={chunk.id}>
          <ChunkHexes chunk={chunk} />
          <ChunkBuildings chunk={chunk} />
          <ChunkRocks chunk={chunk} />
        </group>
      ))}
    </>
  );
}
```

Option B: Global instanced meshes, but only update instances for visible chunks

More performant but harder to implement. Good for later.

---

## State management

Track chunk visibility in a `useRef` or global store to avoid re-renders:

```typescript
const visibleChunksRef = useRef(new Set<string>());

useFrame(({ camera }) => {
  const frustum = getFrustum(camera);
  visibleChunksRef.current.clear();
  for (const chunk of chunks) {
    if (frustum.intersectsBox(chunk.box)) {
      visibleChunksRef.current.add(chunk.id);
    }
  }
});
```

Expose this to child components via context or a Zustand store so they can skip rendering invisible chunks.

---

## Expected impact

| Map size | Without chunking | With chunking |
|----------|------------------|---------------|
| 22 × 16  | 100% content drawn | ~50% drawn |
| 44 × 32  | 100% content drawn | ~35% drawn |
| 88 × 64  | 100% content drawn | ~20% drawn |

The bigger the map, the bigger the win.
