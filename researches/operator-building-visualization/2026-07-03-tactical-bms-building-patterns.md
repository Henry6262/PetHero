# How Real C2/BMS Systems Render Buildings

**Date:** 2026-07-03  
**Goal:** Learn from military Battle Management Systems and geospatial tools so Operator's building visualization is credible and useful.

---

## Key insight

Real military C2 systems do **not** try to render photorealistic buildings. They render buildings as **simple 3D blocks** with strong status/symbol encoding. Readability and interoperability beat realism.

---

## MIL-STD-2525 / APP-6 symbology

The NATO/US standard for military symbols (MIL-STD-2525, NATO APP-6) is designed for 2D maps, but it explicitly supports 2.5D/3D display.

### Relevant patterns

- **2D symbols draped on terrain** — cheap, always readable, but can be hidden by terrain.
- **Extruded symbols** — lines and area symbols raised above ground as "walls" for emphasis.
- **Symbicons** — hybrid of abstract symbol + pictograph, useful for 3D.
- **Pseudo-3D models** — realistic icons for specific platforms (tanks, aircraft), but the standard warns they cause slower, error-prone recognition compared to abstract symbols.

### What this means for Operator

- Abstract, color-coded building blocks are actually more correct for C2 than photorealistic models.
- Status (clear, partial, conflict, stale) should remain the dominant visual signal.
- Realistic detail should support, not override, tactical readability.

**Source:** MIL-STD-2525C, Annex F — 3D visualization guidance.

---

## Palantir TITAN

TITAN is a mobile AI ground station, not a portable tablet C2. It visualizes sensor data, targets, and multi-domain intelligence.

### Relevant patterns

- Software-centric, data-driven displays.
- Heavy use of map overlays and symbology rather than 3D building detail.
- Focus on sensor-to-shooter timelines, not architectural fidelity.

### Takeaway for Operator

Don't compete with TITAN on sensor fusion. Compete on **portable, squad-level situational awareness**. Building detail should be just enough to orient the operator.

**Source:** C4ISRNET, Palantir TITAN reporting, 2024–2025.

---

## ATAK (Android Tactical Assault Kit)

ATAK is the US military's dismounted C2 app. It runs on tablets and shows:

- 2D/2.5D map with building footprints.
- MIL-STD-2525 symbols for units and points of interest.
- Elevation data and 3D terrain in some configurations.
- Video feeds and chat overlaid on the map.

### Relevant patterns

- **Footprints + labels** are enough for most tactical decisions.
- **3D is secondary** to track data, symbols, and communication.
- Touch-first, rugged-tablet UI.

### Takeaway for Operator

ATAK proves that a tablet-scale C2 tool can be effective with relatively simple building representations. Operator's 3D hex approach is already a differentiator; don't let building detail slow the app down.

---

## CesiumJS / Cesium ion

Cesium is used in many defense geospatial apps for global 3D visualization.

### Relevant patterns

- **3D Tiles** stream large city datasets without loading everything.
- **OSM Buildings** provides global 3D buildings as a base layer.
- Buildings are simple extruded footprints with basic roof shapes.
- Elevation/terrain is integrated.

### Takeaway for Operator

If Operator later needs real-world locations, Cesium OSM Buildings is the fastest path. For now, synthetic villages don't need Cesium.

**Source:** CesiumJS documentation, Janea Systems Cesium architecture overview, 2025.

---

## SitaWare / Systematic

SitaWare is a NATO-aligned C2 suite. Its 3D view uses:

- Terrain elevation.
- Building footprints (often from OSM or national data).
- MIL-STD-2525 / APP-6 symbols.
- Route planning and FOV cones.

### Takeaway

SitaWare's building representation is functional, not beautiful. Operator should aim for similar functional clarity.

---

## Commercial digital twins (e.g., Virtual Twins, ArchVisual)

These tools emphasize photorealistic building interiors and exteriors for facility management and real estate.

### Relevant patterns

- 2D floorplan + 3D cutaway view.
- CAD/BIM import (IFC, DWG).
- User-specific views (hide sensitive data).

### Takeaway for Operator

The existing floorplan panel + X-ray building concept aligns with this pattern. Keep the 2D floorplan as the primary interior view; use 3D only for situational awareness.

---

## Recommended design principles for Operator

Based on these systems:

1. **Status first.** The building's color/emissive status must be visible at a glance.
2. **Silhouette second.** Roof shape and footprint archetype help identify building type.
3. **Detail third.** Facade textures/props add realism but must not obscure status.
4. **Avoid photorealism.** It's slower, harder to read, and not standard in C2 tools.
5. **Keep it interactive.** Selection, X-ray, and floorplan drill-down are more valuable than polished exteriors.
