# Operator Backend Architecture

## First Build Decision

Use plain HTTP/WebSockets first. Keep packets clean so transport can later move to Zenoh, LoRa, BLE, ROS 2 bridges, or custom mesh.

Do not block the MVP on ROS 2, Zenoh, LCM, or a full robotics middleware mesh. The backend proves the product logic first: shared context, provenance, freshness, trust, and formation suggestions.

## Services In V0

| Module | Role |
|---|---|
| Mission context store | Holds agents, cells, events, revision, provenance |
| Event ingest API | Accepts meaning-first packets from agents |
| Dock sync API | Authenticates, uploads local deltas, merges, initializes agents |
| Staleness engine | Decays cell freshness and surfaces re-check candidates |
| Playbook engine | Proposes simple formations/tasks from mission intent |

## Meaning-First Event Packet

```json
{
  "kind": "detection",
  "cellId": "B2",
  "x": 4,
  "y": 7,
  "label": "person",
  "confidence": 0.81,
  "observedAt": "2026-06-29T20:15:00.000Z",
  "payload": {
    "poseConfidence": 0.68,
    "source": "imx500"
  }
}
```

The packet is intentionally small. Video and keyframes can attach later, but the core state update should survive low bandwidth.

## Dock As Context Initializer

The dock is a context station, not just a charger.

1. Authenticate: agent checks in as trusted or untrusted.
2. Upload: returning agent sends unsynced deltas.
3. Merge: station updates shared mission memory.
4. Initialize: new agent downloads latest relevant context before launch.

## Conflict Policy

Conflicts are first-class. If two recent reports disagree, Operator marks the cell as `conflict` and keeps both provenance records. The dashboard should show the disagreement, not collapse it into false certainty.

## Freshness Policy

Every cell has `freshnessScore` from `1.0` to `0.0`. When freshness reaches zero, the cell becomes `stale` unless it is already a conflict. Stale cells feed the `recheck_stale_zones` playbook.

## Current Limitations

- In-memory state only.
- Trust tokens are static environment values.
- No WebSocket push stream yet.
- No replay protection beyond trust gate.
- No persistence or mission export.
