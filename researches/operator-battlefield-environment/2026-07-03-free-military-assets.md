# Free Military / Battlefield Assets

**Date:** 2026-07-03

## Free model sources

| Source | License | Best for |
|--------|---------|----------|
| **Sketchfab** | Mixed (filter CC0/CC-BY) | Detailed vehicles, barriers, sandbags |
| **Kenney** | CC0 | Low-poly military, vehicles, crates, barriers |
| **Quaternius** | CC0 | Low-poly characters, props, vehicles |
| **Meshy** | Mixed | Free barrier/concrete models |
| **Poly Haven** | CC0 | Textures (concrete, metal, wood) |
| **ambientCG** | CC0 | PBR textures for walls and ground |

## Recommended asset packs

- **Kenney Weapon Pack / Vehicle Pack** — simple, consistent low-poly style.
- **Sketchfab "Military Barricade"** — sandbags, concrete barriers, barbed wire.
- **Quaternius military vehicles** — trucks, tanks, APCs in low-poly.

## Procedural alternative

For Operator, procedural geometry is faster than sourcing assets:

- Cars: scaled boxes + cylinders for wheels.
- Walls: boxes.
- Sandbags: scaled spheres or capsules arranged in a line.
- Barriers: boxes.
- Barrels: cylinders.

This keeps the file size small and load time fast.

## Textures

If using procedural shapes, apply simple PBR textures from Poly Haven / ambientCG:

- `concrete_017` for walls and barriers.
- `metal_008` for barrels and vehicles.
- `wood_071` for crates and barriers.
