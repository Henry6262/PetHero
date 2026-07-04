# Implementation Plan: Village Battlefield for Operator

**Date:** 2026-07-03

## Phase 1: Expand prop library

Add new `PropType` values to `lib/props.ts`:

- `car` — civilian sedan/van (already exists).
- `wrecked-car` — damaged car, darker color.
- `truck` — military/civilian truck.
- `barrier` — concrete jersey barrier (already exists).
- `sandbag-wall` — row of sandbags.
- `crate` — wooden crate (already exists).
- `barrel` — metal barrel.
- `tire-stack` — stack of tires.
- `wall` — cinder-block wall segment.
- `gate` — compound gate opening with barrier.

## Phase 2: Generate compounds

1. Identify building clusters (e.g., command post + barracks + garage).
2. Compute bounding box + margin.
3. Place wall segments around the perimeter with gaps for gates.
4. Add a gate barrier or sandbag checkpoint at the entrance.

## Phase 3: Scatter props

Place props with seeded RNG:

- **Cars/trucks** near buildings and along streets (parked).
- **Wrecked cars** on streets or near conflict zones.
- **Barriers / sandbags** near compounds and checkpoints.
- **Crates / barrels / tires** near garages and warehouses.
- **Walls** only as compound perimeters.

Avoid:
- Inside buildings.
- On active route/street cells if they would block the demo route (unless intentional wreck).
- Too close to agent spawn positions.

## Phase 4: Render

Update `PropLayer.tsx` to handle all new prop types. Continue using one `InstancedMesh` per type.

## Phase 5: Polish

- Add color variation per instance.
- Add simple damage/weathering by tint.
- Ensure shadows are cast/received.

## Performance budget

Keep total prop instances under 1,500 for the expanded map. Use `InstancedMesh` so draw calls stay under 15.
