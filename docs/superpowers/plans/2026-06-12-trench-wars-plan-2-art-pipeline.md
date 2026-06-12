# Trench Wars — Plan 2: GLB → 8-Direction Spritesheet Art Pipeline

> Goal: replace placeholder primitive graphics with reusable 3D→2D rendered sprites, while keeping the deterministic sim untouched.
> Plan 1 must be green before starting.

## Architecture

- **Input:** `raw-art/` folder of GLBs per unit/tower/prop.
- **Validator:** checks every GLB follows the convention (named nodes, origin, scale, low-poly).
- **Renderer:** headless `three.js` script that rotates an orbit camera around the GLB, captures 8 directions × N animation frames, and writes a grid PNG spritesheet + JSON metadata.
- **Client loader:** Phaser loads each unit's spritesheet and metadata; `BattleScene` maps `heading` + `action` to the right frame row/column and renders `Phaser.GameObjects.Sprite` instead of primitive shapes.
- **Manifest:** `assets/manifest.json` maps each `cardId` and tower kind to its spritesheet, frame size, animation lengths, and anchor.

## File structure

```
web3-games/trench-wars/
├── raw-art/                    # drop GLBs here (gitignored)
│   ├── units/
│   │   ├── jeet-horde.glb
│   │   ├── chad-trader.glb
│   │   └── ...
│   └── towers/
│       └── king-tower.glb
├── scripts/
│   ├── validate-glb.ts         # validate a GLB against the convention
│   └── render-sprites.ts       # GLB -> PNG spritesheet + JSON
├── public/assets/
│   ├── manifest.json
│   ├── units/
│   │   ├── jeet-horde.png
│   │   ├── jeet-horde.json
│   │   └── ...
│   └── towers/
│       └── king-tower.png
└── src/render/
    ├── AssetManifest.ts        # manifest types + loader
    └── SpriteRenderer.ts       # maps SimState -> sprite frame
```

## GLB convention (strict)

- Root node at ground center, forward = +Z.
- Required named meshes: `body` for units; towers can be a single mesh.
- Units should be roughly 1 tile tall in sim units (1 tile = 1 meter).
- Low-poly (<5k tris ideal, <15k max), PBR baked textures.
- One animation clip named `walk` (required). Optional: `attack`, `death`.

## Spritesheet layout

Each PNG is a grid:
- **Rows:** 8 directions, indexed 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW.
- **Columns:** frames in animation order. For v0 we support a single loop per unit (`walk`) to keep the pipeline minimal; `attack`/`death` added later.

Metadata JSON per unit:
```json
{
  "id": "jeet-horde",
  "frameWidth": 64,
  "frameHeight": 64,
  "directions": 8,
  "animations": { "walk": { "row": 0, "frames": 8 } }
}
```

## Client rendering changes

- `BattleScene` creates a sprite pool keyed by `unit.id`.
- Each frame:
  - Compute direction from unit heading (0=+y for player 0).
  - Pick row = direction, column = `floor(tick * animSpeed) % frames`.
  - Set sprite position with anchor at bottom-center.
  - Flip X for player 1? No — direction row already handles facing.
- Towers render as static sprites (no animation row) or single-frame sheets.
- Spells render as simple expanding circles for now (asset pass later).

## Tasks

### Task 1: Asset structure + manifest + validator
- Create `raw-art/`, `public/assets/`, `scripts/`.
- Install `three` + `@types/three` as dev deps.
- Write `src/render/AssetManifest.ts` with types and `loadManifest()`.
- Write `scripts/validate-glb.ts` that checks GLB convention and prints report.
- Add npm script: `"validate-art": "tsx scripts/validate-glb.ts raw-art"`.

### Task 2: Headless GLB → spritesheet renderer
- Write `scripts/render-sprites.ts` using `three.js` + `canvas` + `gl` (headless-gl or node-canvas).
  - Load GLB, place orbit camera at 8 angles around +Z.
  - For each angle, render N frames of the `walk` clip.
  - Stitch into a grid PNG and write metadata JSON to `public/assets/`.
- Add npm script: `"build-art": "tsx scripts/render-sprites.ts raw-art/units public/assets/units"`.
- Because `headless-gl` can be brittle on macOS, also provide a **browser-based fallback**: a small Vite page (`/tools/render.html`) that runs the same renderer and lets the user save the PNG/JSON. Tests use the fallback.

### Task 3: Placeholder directional sprites
- Generate 8-direction `walk` placeholder sprites for all 14 cards + 2 towers.
  - Use simple colored shapes with an arrow/indicator rendered via canvas (no GLB dependency for v0 placeholder pass).
  - Output to `public/assets/` so the game works before real Meshy assets arrive.
- Add `assets/manifest.json` referencing them.

### Task 4: Sprite-based BattleScene
- Replace primitive unit/tower drawing in `BattleScene` with `Phaser.GameObjects.Sprite`.
- Add `src/render/SpriteRenderer.ts` helper:
  - `getFrameKey(cardId, direction, frame)`
  - `updateUnitSprite(sprite, unit, tick)`
- Keep fallback: if manifest is missing, render primitives (so tests never break).

### Task 5: Tests + verification
- Unit test: `tests/render/AssetManifest.test.ts` validates manifest structure.
- Unit test: `tests/render/SpriteRenderer.test.ts` checks direction mapping.
- Playwright smoke still passes.
- `npm test` and `npm run build` green.

### Task 6: Documentation + commit
- Update `README.md` and `CLAUDE.md` with art pipeline commands.
- Commit.

## Done criteria

- `npm run validate-art` reports all dropped GLBs as valid/invalid with reasons.
- `npm run build-art` produces PNG+JSON for every GLB in `raw-art/units/`.
- `npm run dev` shows units as 8-direction animated sprites (placeholders acceptable).
- `npm test` green; Playwright smoke green.
- `src/sim/` still has zero Phaser imports.
