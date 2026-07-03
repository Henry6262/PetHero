# Operator Product Synthesis

## One Sentence

Operator is a defensive ISR context platform where robots, drones, docks, and field operators share mission memory so every agent starts with context, not zero.

## Canonical Naming

- Product: Operator
- Repo: `operator-ai`
- Legacy/source codename: SCOUT
- Architectural phrase: context mesh

Use "Operator" in product docs, repo names, UI copy, and pitches. Use "SCOUT" only when referencing raw source material.

## Core Product Thesis

The product is not the robot. The product is a trustworthy shared mission picture:

- map cells
- detections
- tracks
- agent state
- provenance
- confidence
- freshness
- conflicts
- next suggested actions

The dock is more than a charger. It is a context initializer: agents upload what they learned on return, and new agents launch with the latest relevant mission memory.

## MVP Scope

The v0 backend should prove:

- meaning-first event ingest
- mission state merge
- stale context detection
- conflict preservation
- dock check-in, upload, merge, and initialization
- simple playbooks for area scan, perimeter watch, relay chain, return/recheck
- dashboard-ready state API

## Research Translated Into Operator Decisions

| Source Theme | Operator Decision |
|---|---|
| Tactical C2 unified map | Build one mission state API instead of separate video-first views |
| Field-of-view coverage/fog-of-war | Store observed cells, freshness, and coverage metadata |
| Graph exploration challenge | Treat routes/playbooks as interchangeable planning modules |
| Change detection | Represent changes as events with before/after provenance |
| IMX500/PiCrawler | Keep a hardware bridge path, but do not make hardware the product dependency |
| Context mesh deep dive | Add CRDT/delta sync as the next architecture layer after HTTP MVP |
| BLE/LoRa/WiFi/dock transports | Keep transport as plugins over the same packet schema |
| Mobile operator UI | Prioritize low cognitive load, status cards, timeline, and map clarity |

## Non-Negotiables

- Defensive ISR framing only.
- Human operator remains responsible for operational decisions.
- Conflicting reports are preserved instead of hidden.
- Low-bandwidth event packets matter more than raw video streams.
- Transport choices cannot leak into core product logic.
- Hardware demos are validation artifacts, not platform requirements.

## Recommended Product Cut

Build Operator in three slices:

1. Backend context core: packets, state, dock sync, freshness, conflicts, playbooks.
2. Tactical dashboard: map cells, fleet cards, event feed, stale zones, dock state.
3. Agent simulator/PiCrawler bridge: three simulated agents plus one optional hardware adapter.

CRDTs, BLE, LoRa, WiFi Direct, and richer dock protocols should be added after slice 1 is clean.
