# Operator Source Index

Operator is the product name. SCOUT is retained only where it appears in raw source filenames.

## Primary Source Packet

Henry pointed to this packet directly:

`/Users/henry/Downloads/Kimi_Agent_机器人防御挑战 (1)`

Copied into:

`docs/research/raw/primary-kimi-agent-defense-challenge/`

## Additional Gathered Packets

`/Users/henry/Downloads/kimi-muich-hackaton-all-research/Kimi_Agent_机器人防御挑战`

Copied into:

`docs/research/raw/kimi-agent-defense-challenge/`

`/Users/henry/Downloads/kimi-muich-hackaton-all-research/SCOUT_Context_Mesh_Deep_Dive`

Copied into:

`docs/research/raw/context-mesh-deep-dive/`

`/Users/henry/Downloads/SCOUT-Drone-researches`

Copied into:

`docs/research/raw/drone-researches/`

`/Users/henry/Downloads/opearator-packs`

Copied into:

`docs/research/raw/operator-packs/`

## Read First

- `raw/primary-kimi-agent-defense-challenge/RESEARCH_PACKAGE.md` — challenge and demo build overview.
- `raw/primary-kimi-agent-defense-challenge/C2_TACTICAL_COMMAND_SYSTEM.md` — unified map, FOV coverage, multi-agent C2 demo.
- `raw/primary-kimi-agent-defense-challenge/DESIGN_SYSTEM_AND_SCREENS.md` — tactical dashboard/mobile UI references.
- `raw/primary-kimi-agent-defense-challenge/SCOUT_Operator_Concept_Document.md` — mobile operator framing. Keep only ISR-safe concepts for MVP.
- `raw/primary-kimi-agent-defense-challenge/graph_explo/README.md` and `raw/primary-kimi-agent-defense-challenge/graph_explo/docs/RULES.md` — graph exploration challenge mechanics.
- `raw/context-mesh-deep-dive/SCOUT_Context_Mesh_Deep_Dive.md` — context mesh, CRDT, dock, and transport research.

## Research Translation

The deep-dive translates into these repo artifacts:

- [Product brief](../product/brief.md)
- [Backend architecture](../architecture/backend.md)
- [Research README](README.md)
- [Operator product synthesis](synthesis/operator-product-synthesis.md)
- [Demo and challenge synthesis](synthesis/demo-and-challenge-synthesis.md)
- `src/core/context-store.ts`
- `src/core/playbook.ts`

## Public Market Signals Mentioned In Source Packet

The source notes mention public signals around autonomy C2, drone docks, mesh radios, edge AI, and remote sensing. Treat them as market orientation, not claims to ship in v0.

Key watch areas:

- autonomy C2: Anduril Lattice, L3Harris AMORPHOUS, Shield AI Hivemind, Maven-style workflows
- mesh communications: Silvus, Rajant, Doodle Labs, LoRa, BLE, Wi-Fi Direct
- persistent docks: DJI Dock 3, Skydio Dock for X10
- edge AI: Jetson, Raspberry Pi 5, Sony IMX500, small YOLO/RT-DETR models
- compression: detection-first and ROI-first transmission
