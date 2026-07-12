# Operator

Operator is a defensive ISR context platform for small autonomous systems. It converts agent observations into a shared mission picture with provenance, confidence, freshness, and suggested next actions.

Every agent starts with context, not zero.

The first backend slice is intentionally simple: HTTP APIs, in-memory state, clean packet schemas, dock sync, stale-zone detection, and tactical playbook suggestions.

## Run

```bash
bun install
bun run dev
```

Default API: `http://localhost:3069`

## Web Preview

```bash
bun run web:dev
```

Default web app: `http://localhost:3070`

## Useful Endpoints

- `GET /health`
- `GET /api/state`
- `POST /api/agents/:agentId/events`
- `GET /api/cells/stale`
- `POST /api/dock/check-in`
- `POST /api/playbook`
- `POST /api/reset`
- `GET /api/squadrons?bbox=minLat,maxLat,minLon,maxLon`
- `GET /api/squadrons/:id`
- `GET /api/fusion/tracks`
- `GET /api/fusion/sources`
- `GET /api/missions/state` / `POST /api/missions/{start,pause,resume,reset}`
- `GET /api/assets` / `GET /api/assets/:id` / `POST /api/assets/:id/command`
- `GET /api/advisor/brief` / `GET /api/advisor/reasoning` / `POST /api/advisor/decision`
- `POST /api/advisor/inject-contact`
- `GET /api/cot/tracks` / `GET /api/cot/mission` / `POST /api/cot/send`
- `POST /api/field-bridge/report` / `POST /api/field-bridge/nmea` / `POST /api/field-bridge/robot-report`
- `GET /api/maze/state` / `GET /api/maze/map` / `GET /api/maze/plan` / `POST /api/maze/telemetry` / `GET /api/maze/next-command`
- `POST /api/maze/{execute,pause,resume,reset}` / `POST /api/maze/map` / `POST /api/maze/plan`

## Web routes

- `/` — landing page
- `/dashboard` — tactical 3D dashboard
- `/operational` — theater-scale operational map
- `/maze` — maze-solving robot demo (grid, path, robot pose, controls)

## MVP Frame

Operator is not a weapons platform. The MVP is defensive ISR:

- area scan
- perimeter watch
- building approach
- lost-link recovery
- re-check stale zones
- relay chain

See [product brief](docs/product/brief.md) and [backend architecture](docs/architecture/backend.md).

## EDTH Munich 2026 Hackathon

Current build target: **Payload Escort** — an autonomous defensive-ISR demo where a Pi Crawler carries a payload, a quadruped scouts, a robot arm guards the destination, and Operator fuses sensors, reasons with a local LLM, and only escalates critical decisions to a human.

- [Demo plan](docs/hackathon/EDTH_2026_PLAN.md)
- [Robot integration guide](docs/hackathon/ROBOT_INTEGRATION.md)
- [Demo script](docs/hackathon/DEMO_SCRIPT.md)

## Raspberry Pi mission code

Onboard PiCrawler demo code lives in [`hardware/raspberry/mision_minas`](hardware/raspberry/mision_minas/README.md). Edit locally, then sync back to the Pi.

## Research

The gathered research packets are structured under [docs/research](docs/research/README.md). Operator remains the canonical product name; SCOUT is treated as legacy/source-packet naming.
