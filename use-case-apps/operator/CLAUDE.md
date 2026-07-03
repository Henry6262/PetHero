# CLAUDE.md — Operator

> Read `/Users/henry/Documents/Gazillion-dollars/AGENTS.md` first.

## What It Is

Operator is a defensive ISR and autonomy-C2 initiative. It turns cheap robots, drones, docks, and simulated agents into one shared tactical context layer: map events, provenance, confidence, freshness, trust, and suggested next actions.

The product is not the robot. The product is mission memory and operator clarity under degraded comms.

Canonical naming: use **Operator** for product, repo, and UI references. SCOUT appears only in raw research filenames and historical source material.

## Priority Note

DevPrint remains the portfolio revenue priority. Operator work should stay tightly scoped unless Henry explicitly makes it the current sprint.

## Current Goal

Start with the backend and docs:

- meaning-first event packets instead of raw video-first architecture
- shared mission context with provenance and freshness
- staleness decay and re-check tasking
- dock check-in, upload, merge, and initialization
- visible tactical playbook engine for simple formations

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
    core/            # mission context, playbook logic
    seed/            # demo payloads
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
- `docs/research/raw/primary-kimi-agent-defense-challenge/C2_TACTICAL_COMMAND_SYSTEM.md`
- `docs/research/raw/primary-kimi-agent-defense-challenge/SCOUT_Operator_Concept_Document.md`
- `docs/research/raw/primary-kimi-agent-defense-challenge/graph_explo/README.md`
- `docs/research/raw/primary-kimi-agent-defense-challenge/graph_explo/docs/RULES.md`

## Last Updated

2026-07-01
