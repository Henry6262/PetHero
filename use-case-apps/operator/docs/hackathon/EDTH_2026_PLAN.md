# EDTH Munich 2026 — Operator "Payload Escort" Mission Plan

## Goal

Add **payload escort** as a reusable mission type inside Operator, then demonstrate it live at EDTH with real robots. The demo is not a separate app — it is one operation loaded into the existing operational COP.

The story: a battalion-level operation coordinates multiple missions across a theater. One of those missions is a **payload escort**: move critical supplies (the payload) along a contested route, detect threats by fusing real and simulated sensors, reason with a local LLM, dispatch assigned assets automatically, and only escalate critical decisions to a human operator.

The demo naturally touches four challenges:

| Challenge | How we cover it |
|-----------|-----------------|
| **10 — Multi-Sensor Track Fusion** | GNN/Hungarian association + Covariance Intersection of camera, radar, and simulated tracks. |
| **06 — Tasking from a real C2** | Operator emits CoT XML to FreeTAKServer/ATAK and tasks assets autonomously. |
| **07 — Mission-Aware LLM** | Local Ollama reasons over the COP, narrates, recommends, and flags human-review cases. |
| **05 — Hacking at the Edge** | Field assets report over WiFi/LoRa; DDIL mode keeps the mission alive when the network is pulled. |

## Product framing

Operator already models:

```text
Operation → Mission → Objective → Target
```

We extend this so a **Mission** has:

- `type`: `"payload_escort"`, `"area_scan"`, `"perimeter_watch"`, etc.
- `route`: GeoJSON LineString of waypoints.
- `zones`: polygons for corridor, no-go, destination, assembly areas.
- `assignedAssets`: robots/squadrons/units attached to the mission.
- `payload`: what is being moved and its current status.
- `autonomyPolicy`: thresholds for auto-dispatch vs human escalation.

A battalion can run several operations at once. An operator can zoom out to see the whole theater, or focus on one mission and watch its autonomous loop.

## Demo narrative: "Relay Run"

1. **Load operation.** In `/operational`, select operation **"EDTH — Relay Run"**. It contains one mission: **"Escort medical payload to Checkpoint Bravo."**
2. **Assets assigned.** Pi Crawler = payload carrier. Quadruped = scout. Robot arm = checkpoint guardian.
3. **Mission starts.** Crawler begins moving along the route. Quadruped moves to its scout waypoint.
4. **Threat detected.** A person/robot enters the corridor. The crawler AI camera creates a raw track.
5. **Fusion.** A simulated second sensor corroborates. The uncertainty ellipse shrinks; confidence rises.
6. **AI reasoning.** LLM advisor: *"Single-source camera contact, confidence 62%, inside corridor. Autonomous threshold <75%. Dispatch quadruped to confirm."*
7. **Autonomous dispatch.** Quadruped is sent to the contact waypoint.
8. **Confirmation.** Confidence jumps. System re-evaluates.
9. **Escalation.** If hostile or inside no-go zone, mission pauses and asks operator: *"Approve reroute to checkpoint B?"*
10. **Human decision.** Operator approves. Robot arm lowers barrier / turns red. Crawler reroutes.
11. **"Pull the Plug."** Network disconnected. Degraded banner appears. Local SQLite/Yjs keeps state. Local Ollama keeps advising. Reconnect → sync.
12. **Mission complete.** Crawler reaches destination. Log shows full reasoning chain.

## Team roles

| Role | Who | Responsibilities |
|------|-----|------------------|
| **Team lead / Operator full-stack** | Henry | Product, operational COP, mission UI, demo script, pitch, integration. |
| **Software engineer** | TBD | Backend mission engine, fusion upgrade, robot commander, LLM adapter, CoT bridge. |
| **Robotics engineer #1** | Germany student #1 | Quadruped integration, waypoint execution, camera/telemetry adapter. |
| **Robotics engineer #2** | Germany student #2 | Pi Crawler integration, AI camera pipeline, robot arm adapter, AprilTag localization. |

## Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Operator C2 (Bun + Hono + React 19 + MapLibre/Three.js)             │
│  ├── Mission engine (payload_escort + other types)                   │
│  ├── Fusion engine (GNN/Hungarian + Covariance Intersection)         │
│  ├── Autonomous advisor (LLM + hard guardrails)                      │
│  ├── Asset / robot commander (HTTP/WebSocket commands)               │
│  ├── CoT XML emitter ↔ FreeTAKServer/ATAK                            │
│  └── Field bridge (HMAC-signed asset reports)                        │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTP / WebSocket / CoT TCP
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐      ┌─────────────┐    ┌──────────────┐
   │Quadruped│      │ Pi Crawler  │    │ Robot Arm    │
   │Asset    │      │ Asset       │    │ Asset        │
   │(Python) │      │(Python/Rpi5)│    │(Python)      │
   └─────────┘      └─────────────┘    └──────────────┘
```

### Asset adapter contract

Each physical asset runs a small HTTP adapter. See [`ROBOT_INTEGRATION.md`](./ROBOT_INTEGRATION.md) for the full contract.

Summary:

- `POST /command` accepts `move_to_waypoint`, `stop`, `scan`, `return_to_dock`, `actuate`.
- `POST /report` sends detections/status/telemetry with HMAC signature.
- `GET /health` returns battery, waypoint, state.

## Current codebase state

- ✅ Bun/Hono backend with `/api/fusion`, `/api/squadrons`, `/api/field-bridge` stubs.
- ✅ Shared squadron and theater-mission types in `src/shared/`.
- ✅ Basic track fusion engine in `src/core/track-fusion.ts`.
- ✅ MapLibre operational map (`/operational`) with squadron layers and mission tree.
- ✅ Tactical 3D dashboard (`/dashboard`) with hex grid, agents, buildings.
- ❌ No covariance, GNN, or Kalman filter.
- ❌ No mission types, routes, or asset assignment.
- ❌ No autonomous advisor or playbook execution.
- ❌ No CoT XML or FreeTAKServer integration.
- ❌ No Yjs/SQLite WASM offline layer.
- ❌ No asset command API or hardware adapters.

## 4-day implementation roadmap

### Day 1 — Mission types + fusion upgrade + operational map route rendering

**Backend**

1. Extend `src/shared/mission.ts`:
   - Add `MissionType` union (`payload_escort`, `area_scan`, `perimeter_watch`, etc.).
   - Add `route`, `zones`, `assignedAssetIds`, `payload`, `autonomyPolicy` to `TheaterMission`.
   - Add `Asset` interface (robot/squadron/unit) and `AssetRole`.
2. Upgrade `src/shared/track.ts`:
   - Add 2×2 covariance (`{ ee, en, ne, nn }`) and ENU velocity.
   - Add `classification`, `detectionMode` fields.
3. Upgrade `src/core/track-fusion.ts`:
   - Add `munkres-js`.
   - GNN/Hungarian association with Mahalanobis gate.
   - Covariance Intersection update.
   - Output uncertainty ellipse GeoJSON.
4. Improve `src/core/sensor-simulator.ts`:
   - Realistic motion patterns, plots vs tracks, varying uncertainty.
5. Create `src/core/mission-engine.ts`:
   - Load an operation, start/pause/reset a mission.
   - Move payload along route based on assigned asset progress.
6. Create `src/core/robot-commander.ts`:
   - Asset registry (simulated + real), command dispatch, heartbeats.
7. Add/update routes:
   - `src/api/routes/fusion.ts` — ingest asset reports; expose fused tracks + ellipses.
   - `src/api/routes/assets.ts` (new) — command/query assets.
   - `src/api/routes/missions.ts` (new) — start/pause/reset missions.

**Frontend**

8. Create `apps/web/src/data/escort-mission.ts`:
   - Operation "EDTH — Relay Run" with route, zones, assets.
9. Update `apps/web/src/components/OperationalMap.tsx`:
   - Render mission route, zones, assets, fused tracks, uncertainty ellipses.
10. Update `apps/web/src/components/OperationalMapView.tsx`:
    - Load operation from mission engine.
    - Show mission controls (start/pause/reset).

**End of Day 1 success:** `/operational` loads "Relay Run", route and zones render, simulated payload moves, fused tracks appear with ellipses.

### Day 2 — Autonomous advisor + LLM + human escalation

**Backend**

11. Create `src/core/autonomous-advisor.ts`:
    - Evaluate fused tracks against mission route/zones/policy.
    - Decide: `continue`, `dispatch_scout`, `hold_payload`, `request_human_decision`.
    - Emit reasoning log entries tied to the mission.
12. Create `src/core/llm-advisor.ts`:
    - Ollama client (`qwen3:8b` primary, `qwen3:4b` fallback).
    - Prompt with mission state, rules, JSON schema.
    - 3-layer guardrails.
13. Extend playbook engine:
    - Add `payload_escort`, `dispatch_scout`, `hold_position`, `request_human_decision`.
    - Auto-execute non-critical; pause on critical.
14. Add routes:
    - `src/api/routes/advisor.ts` — brief + human decision endpoint.

**Frontend**

15. Create `apps/web/src/components/AdvisorPanel.tsx`:
    - LLM brief, reasoning log, recommendations.
16. Create `apps/web/src/components/DecisionPrompt.tsx`:
    - Human review modal.
17. Update mission tree and operational sidebar to show reasoning log.

**End of Day 2 success:** Autonomous loop runs inside a mission. LLM narrates. Human escalation prompt fires and can be approved.

### Day 3 — Hardware adapters + CoT + DDIL

**Backend**

18. Add CoT XML emitter `src/core/cot-emitter.ts`.
19. Add `src/api/routes/cot.ts`.
20. Extend `src/api/routes/field-bridge.ts` with HMAC verification.
21. Add offline layer (`useYjsMission`, `sqlite-store`).

**Frontend**

22. Add day/night/NVIS theme toggle.
23. Add degraded-mode banner.

**Hardware**

24. `hardware/picrawler_adapter.py`, `quadruped_adapter.py`, `robotarm_adapter.py`.
25. Print AprilTags and tape route.

**End of Day 3 success:** At least one real asset controllable from Operator. CoT flows to FreeTAKServer/ATAK. Pull-the-plug works in sim.

### Day 4 — Integration + rehearsal

26. End-to-end kill-chain test with real + simulated assets.
27. Performance test: 100 tracks.
28. Security hardening.
29. Demo rehearsals: 3/5/10-minute versions.
30. Fallbacks verified.

## Files that will change or be created

### Docs
- `docs/hackathon/EDTH_2026_PLAN.md`
- `docs/hackathon/ROBOT_INTEGRATION.md`
- `docs/hackathon/DEMO_SCRIPT.md`
- `use-case-apps/operator/CLAUDE.md`
- `use-case-apps/operator/README.md`

### Backend
- `src/shared/mission.ts` (upgrade)
- `src/shared/track.ts` (upgrade)
- `src/core/track-fusion.ts` (upgrade)
- `src/core/sensor-simulator.ts` (upgrade)
- `src/core/mission-engine.ts` (new)
- `src/core/robot-commander.ts` (new)
- `src/core/autonomous-advisor.ts` (new)
- `src/core/llm-advisor.ts` (new)
- `src/core/cot-emitter.ts` (new)
- `src/api/routes/fusion.ts` (update)
- `src/api/routes/field-bridge.ts` (update)
- `src/api/routes/assets.ts` (new)
- `src/api/routes/missions.ts` (new)
- `src/api/routes/advisor.ts` (new)
- `src/api/routes/cot.ts` (new)
- `src/api/app.ts` (wire routes)

### Frontend
- `apps/web/src/data/escort-mission.ts` (new)
- `apps/web/src/components/OperationalMap.tsx` (update)
- `apps/web/src/components/OperationalMapView.tsx` (update)
- `apps/web/src/components/AdvisorPanel.tsx` (new)
- `apps/web/src/components/DecisionPrompt.tsx` (new)
- `apps/web/src/hooks/useMission.ts`, `useAssets.ts`, `useAdvisor.ts`, `useYjsMission.ts` (new)
- `apps/web/src/lib/sqlite-store.ts` (new)

### Hardware
- `hardware/picrawler_adapter.py`, `hardware/quadruped_adapter.py`, `hardware/robotarm_adapter.py`
- `hardware/README.md`

### Dependencies
- `munkres-js`, `yjs`, `y-webrtc`, `y-indexeddb`, `@sqlite.org/sqlite-wasm`.

## Hardware shopping list (Berlin)

| Item | Cost | Why |
|------|------|-----|
| AprilTags printouts | €5 | Floor waypoints and localization. |
| Colored tape / gaffer tape | €10 | Route lines and zone boundaries. |
| Small barrier / flag for robot arm | €10 | Checkpoint actuation prop. |
| USB microphone (optional) | €15 | Field voice report demo. |
| Meshtastic T-Beam 868MHz (optional) | €30 | Degraded-comms prop. |
| LED strip + driver (optional) | €15 | Visual lockdown indicator. |
| USB-C / Ethernet cables | €10 | Connections. |

## Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | Quadruped cannot do waypoint commands | Medium | High | Use teleoperated quadruped as prop; Pi Crawler becomes primary autonomous asset. |
| R2 | FreeTAKServer/ATAK fails to start | Medium | Medium | Pre-configure Docker image; fallback to Operator map only. |
| R3 | Ollama too slow | Medium | Medium | Pre-warm model, 4B fallback, cache responses. |
| R4 | Robot camera misses detections | Medium | High | Use AprilTag/contact prop; simulation feed always ready. |
| R5 | DDIL demo crashes | Low | High | Rehearse; disable live if unstable. |
| R6 | LLM hallucinates offensive wording | Low | Critical | Hard output filter + mandatory human-review flag. |
| R7 | Team bandwidth overload | High | High | Strict daily success criteria; cut ATAK/hardware if behind. |

## Demo fallbacks

| Level | What works | When to use |
|-------|-----------|-------------|
| **A — Full** | Real assets + fusion + LLM + CoT/ATAK + DDIL | Best case |
| **B — Software + one robot** | One real asset + simulated teammates | Hardware issues |
| **C — Fully simulated** | Laptop-only | Catastrophic failure |

## Success criteria

- `bun run typecheck` and `bun test` pass.
- `/operational` loads "Relay Run" operation.
- Fused tracks show shrinking uncertainty ellipses.
- LLM advisor produces structured, non-offensive recommendations.
- Operator can approve/reject a critical decision.
- At least one real asset accepts a command from Operator.
- Demo runs 3 times in a row without restart.

## Notes

- Payload escort is a reusable mission type, not a one-off demo.
- The same mission engine will later support area scan, perimeter watch, and building approach.
- All LLM inference stays local.
- Offensive/strike framing is excluded from prompts, outputs, and UI.
