# Procedural Compounds and Walls

**Date:** 2026-07-03

## Compound generation

### Step 1: Pick a cluster of buildings

Choose 2–6 buildings that are close together. Compute the bounding box of their cell centers plus a margin.

```typescript
function compoundBounds(buildings: Building[], margin: number): Box {
  const xs = buildings.map(b => cellWorldPosition(b.hexCol, b.hexRow).x);
  const zs = buildings.map(b => cellWorldPosition(b.hexCol, b.hexRow).z);
  return {
    minX: Math.min(...xs) - margin,
    maxX: Math.max(...xs) + margin,
    minZ: Math.min(...zs) - margin,
    maxZ: Math.max(...zs) + margin,
  };
}
```

### Step 2: Place wall segments around the bounding box

Create a rectangular wall around the compound. Place wall segments at regular intervals (e.g., every 3–4 units).

Leave gaps for gates/entrances.

```typescript
const segments: WallSegment[] = [];
// Top and bottom edges
for (let x = minX; x <= maxX; x += segmentLength) {
  segments.push({ x, z: minZ, rotation: 0 });
  segments.push({ x, z: maxZ, rotation: 0 });
}
// Left and right edges
for (let z = minZ; z <= maxZ; z += segmentLength) {
  segments.push({ x: minX, z, rotation: Math.PI / 2 });
  segments.push({ x: maxX, z, rotation: Math.PI / 2 });
}
```

### Step 3: Add corner towers / watchtowers (optional)

Place a small tower at each corner for visual interest and gameplay elevation.

### Step 4: Add gate

Leave a 4–6 unit gap on one side and add a gate or barrier.

## Wall segment geometry

A wall segment is a long, thin box:

```typescript
new THREE.BoxGeometry(length, height, thickness)
```

Typical sizes:
- Length: 3–4 units
- Height: 2–3 units
- Thickness: 0.3–0.5 units

## Variations

- **Damaged walls** — random sections missing or shorter.
- **Hesco walls** — sandbag-style, wider base.
- **Barbed wire on top** — thin cylinder segments along the wall top.

## Avoid overlap

Check each wall segment against building positions and street cells. Skip if too close.
