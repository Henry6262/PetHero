# Operator Research Index

Operator is the canonical product name. SCOUT appears in source filenames because the gathered research packet used that codename.

## Folder Map

```text
docs/research/
  README.md
  source-index.md
  synthesis/
    operator-product-synthesis.md
    demo-and-challenge-synthesis.md
  raw/
    primary-kimi-agent-defense-challenge/
    kimi-agent-defense-challenge/
    context-mesh-deep-dive/
    drone-researches/
    operator-packs/
```

## How To Use This Research

Start with the synthesis docs when making product or code decisions:

- [Operator product synthesis](synthesis/operator-product-synthesis.md)
- [Demo and challenge synthesis](synthesis/demo-and-challenge-synthesis.md)

Use raw research for source traceability:

- `raw/primary-kimi-agent-defense-challenge/` is the compact packet Henry pointed to directly. Treat this as the primary source packet.
- `raw/kimi-agent-defense-challenge/` is the larger extracted packet from the Kimi research archive.
- `raw/context-mesh-deep-dive/` covers decentralized context sharing, CRDTs, transport layers, and dock-based initialization.
- `raw/drone-researches/` contains the smaller drone/product research subset from Downloads.
- `raw/operator-packs/` contains design handoff and UI concept exports.

## Product Filter

The raw packet includes older lethal/payload and engagement framing. Preserve it as research history, but Operator product work should stay defensive and ISR-focused:

- shared mission memory
- context dock
- multi-agent map state
- provenance, confidence, freshness, conflicts
- low-bandwidth meaning-first packets
- operator clarity under degraded comms
- PiCrawler/demo integration as a validation path

Do not frame Operator around bombs, payload release, autonomous engagement, or target neutralization.
