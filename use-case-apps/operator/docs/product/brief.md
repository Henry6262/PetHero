# Operator Product Brief

## Positioning

Operator is a defensive ISR context layer for robots, drones, docks, and field operators. It does not try to win by building the best drone or the best robot. It wins by making every cheap autonomous node contribute to one trustworthy mission picture.

Every agent starts with context, not zero.

SCOUT is a legacy/source-packet codename. Operator is the canonical product name.

## Core Difference

| Layer | Typical drone AI | Operator context layer |
|---|---|---|
| Perception | Detects object/person/obstacle in one feed | Turns detections into map events with provenance and freshness |
| Memory | Local logs or cloud upload | Distributed mission memory across agents and dock |
| Coordination | One pilot or preplanned route | Multi-agent tasking based on shared context |
| Comms | Video stream or telemetry | Meaning-first packets: detections, map cells, confidence, stale zones |
| Operator view | Separate feeds and controls | One tactical picture with timeline, trust, and suggested next actions |

## MVP Modes

| Mode | What It Does | Formation / Behavior |
|---|---|---|
| Area scan | Quickly build first context over a zone | Fan-out sweep; agents split sectors and return to dock with summaries |
| Perimeter watch | Maintain awareness around a base, dock, or convoy stop | Ring/patrol loop; one relay node stays near dock |
| Building approach | Check routes, entrances, and blind corners | Lead scout plus overwatch; ground agent handles close/indoor view |
| Lost-link recovery | Preserve information when comms are intermittent | Agents store locally, move toward sync points, upload at dock |
| Re-check stale zones | Refresh areas where context is too old | Priority queue based on age, risk, and distance |
| Relay chain | Extend communication into difficult terrain/buildings | One or more agents become temporary comms/context relays |

## What Not To Focus On

- Bombs, payload release, or autonomous engagement.
- Flying hexapod promises before working hardware exists.
- Solar charging math beyond station support.
- Head-on dock hardware competition against DJI or Skydio.
- Solving all GPS-denied navigation in v0.

## This Week's Validation Targets

- Convergence: two agents with different local maps sync and converge.
- Delta efficiency: event packets are tiny compared to video/keyframes.
- Staleness: old context decays and triggers re-check playbooks.
- Conflict handling: conflicting reports are preserved and shown.
- Trust handling: unknown or replayed packets are rejected or flagged.
- Dock initialization: a new agent starts with context gathered by previous agents.
