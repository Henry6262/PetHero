# StreetRivalz — Plan 4: Garage, GLB Loader/Validator, Token Layer

**Date:** 2026-06-12  
**Goal:** Players can equip cosmetic parts in a Garage; real Meshy GLBs load at runtime via the detached-wheels convention; token/holder tier skeleton is in place for pump.fun launch.  
**Spec:** `docs/superpowers/specs/2026-06-12-street-rivalz-design.md`  
**Predecessor:** Plan 3 (backend) — must be complete.

---

## Architecture notes

- `src/garage/` holds client-side garage logic: inventory, loadouts, GLB loading.
- `src/render/glbLoader.ts` loads a GLB, validates node names, binds the detached-wheels convention.
- The backend stores inventory/loadout as JSON; token metadata is read-only for v1 (actual pump.fun launch is a deployment step, not code).
- All stat flavor stays on car bodies (`src/data/cars.ts`). Cosmetic slots never affect physics.

---

## Task 4.1: GLB validator

**Files:**
- Create: `web3-games/street-rivalz/src/garage/validator.ts`
- Test: `web3-games/street-rivalz/tests/garage/validator.test.ts`

Validation rules:
- Required nodes: `body`, `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR`
- Optional nodes: `spoiler`, `decals`
- Body bounding box should be roughly kart-sized: length 1.5–4.5m
- Forward axis check: body should extend primarily along +Z

Return a `ValidationReport` with `{ valid: boolean; missingNodes: string[]; warnings: string[] }`.

Commit: `feat(street-rivalz): GLB validator — detached-wheels node + scale checks`

---

## Task 4.2: Runtime GLB loader + detached-wheels binding

**Files:**
- Create: `web3-games/street-rivalz/src/render/glbLoader.ts`

Use Three.js `GLTFLoader`. After load:
1. Run validator on the scene graph.
2. If valid, return a `KartVisual`-compatible group.
3. Preserve node names so `bindKartVisual()` works unchanged.

Add `THREE.GLTFLoader` dependency? Three.js includes it via examples. Use `import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'`.

Commit: `feat(street-rivalz): runtime GLB loader with detached-wheels binding`

---

## Task 4.3: Garage data model + inventory system

**Files:**
- Create: `web3-games/street-rivalz/src/data/garage.ts`
- Create: `web3-games/street-rivalz/src/garage/inventory.ts`

Slots:
- `body` (also selects car params)
- `wheels`
- `spoiler`
- `paint` (hex color)
- `trail` (boost flame color / effect id)

Default items are free unlocks. Bodies map to `src/data/cars.ts`.

```ts
export interface Loadout {
  body: string      // car id
  wheels: string    // wheel asset id
  spoiler?: string
  paint: number     // color hex
  trail: string     // effect id
}

export const DEFAULT_LOADOUT: Loadout = {
  body: 'paper-scooter',
  wheels: 'stock',
  paint: 0xfacc15,
  trail: 'default',
}
```

Commit: `feat(street-rivalz): garage data model — bodies, wheels, spoiler, paint, trails`

---

## Task 4.4: Backend garage endpoints

**Files:**
- Modify: `web3-games/street-rivalz/api/prisma/schema.prisma`
- Create migration
- Create: `web3-games/street-rivalz/api/src/routes/garage.ts`

Add `Loadout` table:

```prisma
model Loadout {
  id        String   @id @default(uuid())
  accountId String   @unique
  body      String   @default("paper-scooter")
  wheels    String   @default("stock")
  spoiler   String?
  paint     Int      @default(0xfacc15)
  trail     String   @default("default")
  account   Account  @relation(fields: [accountId], references: [id])
}
```

Endpoints:
- `GET /garage` — current loadout
- `POST /garage` — update loadout

Commit: `feat(street-rivalz): backend garage loadout endpoints`

---

## Task 4.5: Token/holder tier skeleton (pump.fun prep)

**Files:**
- Create: `web3-games/street-rivalz/src/data/token.ts`
- Create: `web3-games/street-rivalz/api/src/routes/token.ts`

Read-only v1 metadata:

```ts
export const TOKEN = {
  ticker: 'RIVALZ',
  name: 'StreetRivalz',
  network: 'solana',
  launchUrl: 'https://pump.fun', // placeholder until real launch
}

export const HOLDER_TIERS = [
  { minTokens: 0, name: 'Fan', perks: ['play', 'earn cosmetics'] },
  { minTokens: 100_000, name: 'Crew', perks: ['exclusive paint', 'name color'] },
  { minTokens: 1_000_000, name: 'Whale', perks: ['legendary trails', 'early tracks'] },
]
```

Endpoint:
- `GET /token` — returns ticker, tiers, active Grand Prix prize pool

Commit: `feat(street-rivalz): token + holder tier skeleton for pump.fun launch`

---

## Task 4.6: Client garage UI + equip/unequip

**Files:**
- Create: `web3-games/street-rivalz/src/garage/ui.ts`
- Modify: `web3-games/street-rivalz/src/main.ts`
- Modify: `web3-games/street-rivalz/index.html`

Add a Garage overlay toggled with **G**:
- Lists owned bodies/wheels/spoilers/trails
- Shows equipped loadout
- Updates placeholder kart color/materials immediately
- Persists to backend on close/equip

For v1, use placeholder visuals (no real GLB assets yet) but wire the slot system so Meshy GLBs drop in later with zero code changes.

Commit: `feat(street-rivalz): client garage UI — equip bodies, wheels, paint, trails`

---

## Task 4.7: Tests + final verification

- Validator tests pass.
- Garage endpoints tested with `fastify.inject()`.
- Client builds and runs.
- `npm test` in both client and backend passes.

Commit: `test(street-rivalz): Plan 4 tests + final verification, all green`

---

## Self-review notes

- No real pump.fun integration in code yet — that's a deployment/launch step. The skeleton exposes metadata so the UI can already show ticker + tiers.
- GLB validator is the critical blocker for asset production; everything else is data/UI.
