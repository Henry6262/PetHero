# Sky + Clouds Approach for Operator Tactical Map

Date: 2026-07-05
Sources:
- https://www.npmjs.com/package/@takram/three-clouds (volumetric clouds)
- https://tympanus.net/codrops/2020/01/28/how-to-create-procedural-clouds-using-three-js-sprites/ (sprite clouds)
- https://drei.docs.pmnd.rs/staging/cloud (`@react-three/drei` Clouds)

## Options considered

1. **Volumetric clouds** (`@takram/three-clouds`)
   - Pros: photorealistic, physically based.
   - Cons: heavy, needs EffectComposer normal pass, pulls external textures, overkill for a tactical UI.

2. **Procedural sprite clouds**
   - Pros: lightweight, stylized, no assets, easy to tint/animate.
   - Cons: flat-looking, hard to make thick and fluffy.

3. **Skybox + fog**
   - Pros: simplest, hides black void.
   - Cons: static, no cloud shapes.

4. **`@react-three/drei` `<Clouds>` / `<Cloud>`**
   - Pros: particle-based instanced clouds, thick/fluffy, single draw call, no external textures, built into existing dependency.
   - Cons: stylized, not physically based.

## Decision

Use option 4 combined with a dark sky background and subtle distance fog:
- Set scene background to dark blue-gray (`#0f1720`).
- Add fog to blend distant hex edges into the sky.
- Render 24 thick `drei/Cloud` instances in a ring around the map perimeter.
- Tune `bounds`, `volume`, `segments`, `opacity` for dense, fluffy clouds.
- Clouds slowly drift and wrap around the battlefield so the ring never breaks.

If Henry provides custom cloud PNG sprites later, they can be swapped via the `texture` prop on `<Clouds>`, but the particle-based Drei clouds already look convincing.

## Map size

Increased hex grid from 31×23 to 41×31 (~80% more cells). Instanced hex mesh handles this without issue. Fog and shadow camera scaled accordingly.
