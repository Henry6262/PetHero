# Operator Demo And Challenge Synthesis

## Primary Demo Moment

Show that an agent launches with prior context:

1. Dashboard starts with blank or stale map cells.
2. Simulated agents explore and submit meaning-first events.
3. Agent returns to dock and uploads deltas.
4. Dock memory grows.
5. New agent launches and immediately receives initialized context.
6. Stale or conflicting zones trigger a re-check playbook.

This is the Operator "magic moment": every agent starts with context, not zero.

## Hackathon Components From The Research Packet

| Component | Source Packet | Operator Use |
|---|---|---|
| C2 tactical map | `C2_TACTICAL_COMMAND_SYSTEM.md` | Dashboard map, FOV/coverage language, agent status panels |
| Mobile design system | `DESIGN_SYSTEM_AND_SCREENS.md` | UI hierarchy, color semantics, field-use constraints |
| Graph exploration | `RESEARCH_PACKAGE.md`, `graph_explo/` | Planning/playbook research and simulator testbed |
| Change detection | `change_detector.py`, `SE3_REAL_DATA_GUIDE.md` | Change events and before/after provenance |
| AI camera | `AI_CAMERA_GAME_CHANGER.md` | Optional PiCrawler/edge detection bridge |
| Build plan | `THE_PLAN.md`, `BATTLE_TESTED_PLAN.md` | Demo sequencing and scope control |
| Context mesh deep dive | `raw/context-mesh-deep-dive/` | CRDT/delta-sync roadmap |

## Operator-Safe Demo Framing

Use:

- area scan
- perimeter watch
- relay chain
- lost-link recovery
- re-check stale zones
- context dock
- defensive ISR
- disaster response, facility security, border monitoring, search and rescue as dual-use analogs

Avoid:

- detonation flows
- payload release
- autonomous engagement
- kill-chain language
- claims of deployed hardware capability not demonstrated

## Current Code Alignment

The current Bun/Hono backend already supports:

- `POST /api/agents/:agentId/events`
- `GET /api/state`
- `GET /api/cells/stale`
- `POST /api/dock/check-in`
- `POST /api/playbook`

This maps cleanly to the demo flow. The next code layer should be either:

1. tactical dashboard consuming `GET /api/state`, or
2. simulator producing agent events and dock check-ins.

## Later Architecture Layer

Once the HTTP MVP is working, add the context mesh layer:

- delta-state CRDT store
- OR-set agent registry and detections
- LWW mission params
- append-only event timeline
- BLE/LoRa/WiFi/dock transport adapters
- replay protection and trust metadata

Do not add this before the dashboard makes the current state visible.
