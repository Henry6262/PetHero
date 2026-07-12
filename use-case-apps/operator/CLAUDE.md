# CLAUDE.md — Operator

> Read `/Users/henry/Documents/Gazillion-dollars/AGENTS.md` first.

## What It Is

Operator is a defensive ISR and autonomy-C2 initiative. It turns cheap robots, drones, docks, and simulated agents into one shared tactical context layer: map events, provenance, confidence, freshness, trust, and suggested next actions.

The product is not the robot. The product is mission memory and operator clarity under degraded comms.

**Core product thesis:** real commanders cannot use two separate systems. Operator must be the **single C2 system** they use — from theater map down to robot actuator. It can ingest standards-based feeds (e.g. CoT), but the operator only sees one picture, one mission loop, one decision timeline.

Canonical naming: use **Operator** for product, repo, and UI references. SCOUT appears only in raw research filenames and historical source material.

## Priority Note

DevPrint remains the portfolio revenue priority. Operator work should stay tightly scoped unless Henry explicitly makes it the current sprint.

## Current Goal

EDTH Munich 2026 hackathon: build the **"Payload Escort"** autonomous defensive-ISR demo and a **maze-solving robot** prop. A Pi Crawler carries a payload along a contested route, a quadruped scouts, a robot arm guards the destination, and Operator fuses real + simulated sensors, reasons with a local LLM, dispatches robots automatically, and only escalates critical decisions to a human operator. The maze demo shows a drone/phone video turned into a grid map, planned with A*, and executed by the PiCrawler in one attempt.

**New priority:** Operator must demo as the **single C2 system** — one screen for the commander, one voice prop for the vehicle driver. No separate systems open side by side.

The demo covers four challenges:

- **10 — Multi-Sensor Track Fusion:** GNN/Hungarian + Covariance Intersection.
- **06 — Tasking from a real C2:** CoT XML to FreeTAKServer/ATAK.
- **07 — Mission-Aware LLM:** Local Ollama advisor with guardrails.
- **05 — Hacking at the Edge:** Field robot adapters + DDIL offline mode + voice agent.

## Positioning Notes

- **Delta** is Ukraine's national COP. It proves network-centric warfare works, but it is strategic/national. Operator is the battalion/tactical layer. See `docs/product/delta-analysis.md`.
- **One-system rule:** commanders will not switch between Delta and Operator. Operator must either stand alone or be the only UI the operator touches.
- **Voice agent (live demo prop):** a hands-free, eyes-free interface for vehicle crews, demonstrated as a 30-second live interaction. Spec in `docs/product/voice-agent-spec.md`; hardware list in `docs/product/voice-agent-hardware.md`.
- Pitch framing and taglines live in `docs/product/pitch-positioning.md`.

## Recent work

- Cleaned unused variables/imports across tactical and operational views.
- Deduplicated raw research folders.
- Wrote end-to-end hackathon docs:
  - `docs/hackathon/EDTH_2026_PLAN.md`
  - `docs/hackathon/ROBOT_INTEGRATION.md`
  - `docs/hackathon/DEMO_SCRIPT.md`
- Completed Phase 1 of the EDTH Payload Escort mission feature:
  - Shared mission types (`TheaterOperation`, `TheaterMission`, `Asset`, `MissionPayload`, etc.).
  - Upgraded track fusion with covariance + Mahalanobis gating → 95% uncertainty ellipses.
  - Mission engine + robot commander for simulated/live asset dispatch.
  - Backend routes: `/api/missions/*` and `/api/assets/*`.
  - Operational map now renders escort route, mission zones, assets, and fused-track ellipses.
  - Frontend hooks: `useMission.ts`, `useAssets.ts`.
- Completed Phase 2 — autonomous advisor + local LLM + human escalation:
  - `AutonomousAdvisor` hard-rules engine: continue / dispatch_scout / hold_payload / request_human_decision.
  - `LLMAdvisor` Ollama wrapper with qwen3 fallback and safety guardrails.
  - Mission engine auto-executes non-critical actions and pauses on critical decisions.
  - Backend routes: `/api/advisor/brief`, `/reasoning`, `/decision`, `/inject-contact`.
  - Frontend: `AdvisorPanel`, `DecisionPrompt`, `useAdvisor.ts`.
- Completed Phase 3 — hardware adapters + CoT + DDIL simulation:
  - CoT XML emitter (`src/core/cot-emitter.ts`) + routes `/api/cot/tracks`, `/api/cot/mission`, `/api/cot/send`.
  - Field-bridge HMAC verification + robot detection/status ingestion into fusion engine.
  - Python hardware adapters: `hardware/picrawler_adapter.py`, `hardware/quadruped_adapter.py`, `hardware/robotarm_adapter.py` + shared `hardware/adapter_base.py`.
  - Frontend degraded-mode banner via `useNetworkStatus.ts`.
- Completed Phase 4 — integration, rehearsals, fallbacks:
  - End-to-end mission integration test: scout dispatch + human escalation.
  - Performance test: 100 tracks fused in <50 ms.
  - Fallback doc + pre-demo checklist: `docs/hackathon/FALLBACKS_AND_CHECKLIST.md`.
  - Updated `README.md` and `hardware/README.md`.
- Operational map redesign:
  - Switched to CartoDB Dark Matter basemap (country boundaries, cities, roads).
  - Replaced 400 random dots with ~73 battalions clustered along the front line.
  - Replaced hand-drawn schematic zones with real Natural Earth 10m Ukraine/Russia oblast boundaries (`src/shared/data/theater-oblasts.json`).
  - Three territorial layers now follow real admin-1 borders: friendly Ukrainian oblasts, contested oblasts (Donetsk, Luhansk, Kherson, Zaporizhzhia), hostile Russian border oblasts.
  - Added glowing country border highlights for Ukraine and Russia.
  - Added line of contact and large territory labels.
  - Shared theater geometry in `src/shared/theater.ts` so backend simulator and frontend demo stay in sync.
  - Fixed Sheet sidebar layout regression (`display: flex` restored on the root view).
- Room-clearance tactical demo (work in progress):
  - Backend state machine: `src/core/room-clearance-engine.ts` with synthetic timer-driven mission and real-robot telemetry ingestion.
  - API routes: `src/api/routes/room-clearance.ts` (`/api/room-clearance/*`).
  - Dashboard panel: `apps/web/src/components/dashboard/RobotClearancePanel.tsx`.
  - UI polish: moved styles into `app.css`, replaced emojis with SVG icons, added animated SVG floor-plan visualization, matched existing dashboard panel aesthetics.
  - Replaced stale `SCOUT` dashboard branding with canonical `OPERATOR`.
  - Tests: `tests/room-clearance.test.ts`.
- Maze-solving robot demo pipeline (new):
  - Python computer-vision pipeline: `scripts/maze_from_video.py` turns a drone/phone video into a binary grid map with perspective correction, wall inflation, and start/end marker detection (ArUco or color).
  - Python path planner: `scripts/maze_solver.py` runs A* on the grid and converts the path into PiCrawler gait commands (`forward`, `turn_left`, `turn_right`, `sit`).
  - Backend state machine: `src/core/maze-engine.ts` stores map/plan, queues commands, and pauses on obstacle telemetry.
  - API routes: `src/api/routes/maze.ts` (`/api/maze/*`) for map upload, plan upload, execute/pause/resume/reset, telemetry, and bridge polling.
  - Frontend view: `apps/web/src/components/MazeDemoView.tsx` at `/maze/` renders the grid, path, start/end, and robot pose; supports uploading map/plan JSON and mission controls.
  - PiCrawler bridge update: `scripts/picrawler_bridge.py` polls `/api/maze/next-command`, executes gait commands, and uses the ultrasonic sensor as a safety stop.
  - Tests: `tests/maze.test.ts` covers engine + routes.
- Product docs captured:
  - `docs/product/delta-analysis.md`
  - `docs/product/voice-agent-spec.md`
  - `docs/product/pitch-positioning.md`
- Measured PDF → grid map pipeline (new):
  - `scripts/pdf_crate_maze_to_grid.py` extracts black-filled crate polygons from a measured PDF plan, detects scale (100 PDF points/m), rasterizes rotated crates, inflates walls by robot radius, and emits the same JSON grid format used by the solver.
  - Generated `results/maze_extraction/ddas_maze_map.json` and `ddas_maze_plan.json` from `ddas.pdf` (the circular bottle-crate maze).
  - Plan verified collision-free on the inflated grid: 55 cells, 19 gait commands, ~93.8 s.
  - Assets copied to `public/maze/` for dashboard static serving.
  - Backend auto-loads the default maze map/plan at startup (`src/api/app.ts`).
  - Center obstacle and start/end are currently placeholders; waiting for real measurements of the central crate cluster.
- Raspberry Pi code synced into the repo:
  - Copied `~/mision_minas` from the Pi into `hardware/raspberry/mision_minas/`.
  - Includes teleop route recorder (`grabar.py`), replay + yellow-mine detection demo (`demo.py`), archived autonomous grid-navigation code (`_archivo/`), and a web dashboard served by the Pi.
  - This gives us a local editing copy; push back to the Pi with `rsync` when ready.
- Maze dashboard camera integration:
  - `MazeDemoView.tsx` now has a right-side camera panel: enter the Pi URL (e.g. `http://172.20.10.4:8000`), click Set, and the MJPEG stream appears live while the robot moves and scans.
  - The panel also consumes the Pi's Server-Sent Events (`/eventos`) to show current phase and detected mines in real time.
  - `demo.py` serves the MJPEG stream and SSE feed with `Access-Control-Allow-Origin: *` so the Operator frontend on a different origin can display them.
  - Synced the updated `demo.py` back to the Pi.
- Research request for indoor 3D mapping/maze demo: `research/MAZE_DEMO_RESEARCH_REQUEST.md`.
- All checks green: `bun run typecheck`, `bun test` (54 tests), `bun run web:build`.

## Non-Negotiables

- Keep MVP defensive and ISR-focused.
- Do not frame the product around bombs, payload release, or autonomous engagement.
- Do not promise working VTOL/hexapod hardware unless it exists.
- Treat localization/navigation as plugins with confidence scores.
- Use plain HTTP/WebSockets first. Do not block MVP progress on ROS 2, Zenoh, LCM, or LoRa-specific transport.
- Preserve conflicting reports; show conflict and provenance instead of hiding disagreement.

## Tech Stack

- Bun + TypeScript
- Hono HTTP API
- Zod schemas
- In-memory store for v0; later persistence can be SQLite/Postgres

## Folder Structure

```text
operator/
  src/
    api/             # HTTP API
    core/            # mission context, playbook logic, simulators
    seed/            # demo payloads
    shared/          # types + schemas shared by backend and frontend
  docs/
    architecture/    # backend and protocol specs
    product/         # product brief, MVP scope
    research/        # source packet index and synthesis
  tests/             # Bun tests
```

## Source Material

Primary source packet:

`/Users/henry/Downloads/Kimi_Agent_机器人防御挑战 (1)`

Copied into:

`docs/research/raw/primary-kimi-agent-defense-challenge/`

Additional gathered research lives under:

`docs/research/raw/`

Key docs to read before major changes:

- `docs/research/README.md`
- `docs/research/synthesis/operator-product-synthesis.md`
- `docs/research/synthesis/demo-and-challenge-synthesis.md`
- `docs/research/synthesis/drone-video-to-map-research.md`
- `docs/architecture/video-to-map-dashboard.md`
- `docs/research/raw/primary-kimi-agent-defense-challenge/C2_TACTICAL_COMMAND_SYSTEM.md`
- `docs/research/raw/primary-kimi-agent-defense-challenge/SCOUT_Operator_Concept_Document.md`
- `docs/research/raw/primary-kimi-agent-defense-challenge/graph_explo/README.md`
- `docs/research/raw/primary-kimi-agent-defense-challenge/graph_explo/docs/RULES.md`

## Last Updated

2026-07-11
