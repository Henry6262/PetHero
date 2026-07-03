# Procedural Building Techniques for Operator

**Date:** 2026-07-03  
**Goal:** Concrete techniques to add architectural detail to Operator's extruded buildings without requiring an artist or asset pipeline.

---

## 1. Facade texture generation on canvas

Generate window/door patterns at runtime to avoid shipping image assets.

```typescript
function createFacadeTexture(windowRows: number, windowCols: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Wall color
  ctx.fillStyle = "#6b6b6b";
  ctx.fillRect(0, 0, 512, 512);

  // Windows
  const cellW = 512 / windowCols;
  const cellH = 512 / windowRows;
  const winW = cellW * 0.5;
  const winH = cellH * 0.6;

  ctx.fillStyle = "#1a2330";
  for (let r = 0; r < windowRows; r++) {
    for (let c = 0; c < windowCols; c++) {
      const x = c * cellW + (cellW - winW) / 2;
      const y = r * cellH + (cellH - winH) / 2;
      ctx.fillRect(x, y, winW, winH);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
```

**Usage:** apply to building sides with UV repeat based on building width/height. Emissive windows can be rendered with a second texture channel or shader.

---

## 2. Extruded window frames

Instead of a flat texture, add thin box frames around each window.

**Steps**
1. For each facade, compute a grid of window positions.
2. Create a small box for the frame and a slightly recessed plane for the glass.
3. Merge or instance all frames per building.

**Performance**
- Use `InstancedMesh` for all window frames of the same size across the whole map.
- Use a single glass material with emissive for lit windows.
- Distant buildings can fall back to texture-only.

** LOD strategy**
- Close-up: frames + glass.
- Mid-distance: texture only.
- Far: simple colored box.

---

## 3. Roof generation

### Flat roof with parapet

1. Extrude the footprint slightly smaller than the building.
2. Add a thin parapet ring around the edge.
3. Place HVAC/AC units as instanced boxes.

### Peaked / gable roof

1. Find the longest axis of the footprint.
2. Build a triangular prism along that axis.
3. Optional: add roof overhangs.

### Shed roof

1. Pick one edge as the high side.
2. Build a sloped plane from high edge to low edge.

### Mansard / hip roof

1. More complex triangulation of the footprint.
2. Use `THREE.Shape` + `THREE.ExtrudeGeometry` with a bevel-like profile, or build from indexed triangles.

**Implementation tip:** roof geometry can be generated in a Web Worker and cached per footprint shape, just like the building geometry is today.

---

## 4. Roof props

Add small instanced props to roofs to break up flat silhouettes:

- AC units
- Water tanks
- Antennas / satellite dishes
- Chimneys
- Ventilation boxes
- Solar panels

**Approach**
- Create one geometry per prop type (box, cylinder, dish).
- Scatter on flat roofs using the same seedrandom logic as rocks.
- Skip peaked roofs or place chimneys near ridges.
- Use `InstancedMesh` with per-instance matrix + color.

---

## 5. Building archetypes from footprints

Current footprints are rectangles. Add L/T/U/H shapes:

```typescript
function createLFootprint(width: number, depth: number, wingWidth: number): THREE.Vector2[] {
  return [
    new THREE.Vector2(-width / 2, -depth / 2),
    new THREE.Vector2(width / 2, -depth / 2),
    new THREE.Vector2(width / 2, depth / 2 - wingWidth),
    new THREE.Vector2(-width / 2 + wingWidth, depth / 2 - wingWidth),
    new THREE.Vector2(-width / 2 + wingWidth, depth / 2),
    new THREE.Vector2(-width / 2, depth / 2),
  ];
}
```

**Mapping to building kinds**

| Kind | Footprint | Roof | Detail level |
|------|-----------|------|--------------|
| Office block | Rectangle / H-shape | Flat + HVAC | Medium |
| Warehouse | Long strip | Shed / flat | Low |
| Residential | Rectangle / L-shape | Peaked | Medium |
| Garage | Rectangle / L-shape | Flat | Low |
| Shopfront | Rectangle | Flat + sign | Medium |
| Tower | Rectangle | Flat + antenna cluster | High |

---

## 6. Materials and color variation

Use `MeshStandardMaterial` with:
- `color` from a small palette per archetype.
- `roughness` high (~0.8) for concrete/brick.
- `metalness` low (~0.1).
- `emissive` for status, not material base.

Vary tint slightly per building with `material.color.setHSL()` to reduce repetition.

---

## 7. Shader-based facade detail

For very large numbers of buildings, use a custom shader on the extruded box that draws windows based on world-space or UV coordinates.

**Pros**
- Zero extra geometry.
- Single draw call if using merged/batched meshes.
- Can animate lights, show damage, etc.

**Cons**
- Shader development time.
- Window depth is faked with normal/bump.

**Approach**
- Fragment shader checks UV grid and draws window color + emissive.
- Use a noise function to vary window spacing and presence.
- Combine with a normal map for subtle depth.

---

## 8. Integration with existing code

The current building pipeline is:

```
Building data → buildBuilding3D() → footprint + height → requestBuildingGeometry() → mesh
```

Recommended insertion points:

1. `buildBuilding3D()` selects archetype, roof type, and detail level.
2. `createBuildingGeometry()` calls a roof generator and returns merged building+roof geometry.
3. A new `BuildingFacadeDetail` component (or worker) generates window frames / props.
4. `buildingMaterial()` adds texture support and per-building tint.

---

## 9. Performance guardrails

- Keep total draw calls for buildings under 15.
- Use `InstancedMesh` for windows, roof props, and repeated facade elements.
- Use `@three.ez/instanced-mesh` (already in project) for per-instance frustum culling.
- Generate geometry asynchronously in the existing Web Worker.
- Skip facade detail on buildings smaller than N pixels on screen.
