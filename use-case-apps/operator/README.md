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

## MVP Frame

Operator is not a weapons platform. The MVP is defensive ISR:

- area scan
- perimeter watch
- building approach
- lost-link recovery
- re-check stale zones
- relay chain

See [product brief](docs/product/brief.md) and [backend architecture](docs/architecture/backend.md).

## Research

The gathered research packets are structured under [docs/research](docs/research/README.md). Operator remains the canonical product name; SCOUT is treated as legacy/source-packet naming.
