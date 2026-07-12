# Voice Agent — Field Operator Interface

> Spec: 2026-07-10  
> Status: live demo prop for EDTH 2026. Not a full product feature yet.

## Problem

Field operators in vehicles (tank drivers, APC commanders, robot handlers) cannot safely look at a screen while moving or under fire. They need a **hands-free, eyes-free** way to interact with the C2 system.

## Concept

A small voice box — mic + speaker, no screen — that connects to Operator. The operator asks questions and gives short commands. The AI agent answers verbally and can execute actions.

### Example interactions

- *"Where is the enemy?"*
  - *"Nearest hostile squadron is 3.2 kilometers east, bearing 090."*
- *"Status of my squadron."*
  - *"Squadron Alpha-7 is operational, 82% battery, moving north at 25 km/h."*
- *"Dispatch a scout to grid AB1234."*
  - *"Scout dispatched. Estimated arrival 4 minutes."*
- *"What is my next waypoint?"*
  - *"Next waypoint is Checkpoint Bravo, 1.8 kilometers ahead."*
- *"Pause mission."*
  - *"Mission paused. Awaiting your order."*

## Why it fits the one-system vision

The voice agent is not a separate product. It is **another interface to the same Operator backend**:

- Same mission state.
- Same squadrons, assets, fused tracks.
- Same advisor logic and autonomy guardrails.
- Same escalation rules for critical decisions.

A commander at HQ uses the map UI. A driver in a tank uses the voice box. Both interact with the same system.

## Architecture

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Voice Box      │────▶│  Operator API    │────▶│  Voice Agent    │
│  (Pi / Browser) │◀────│  /api/voice/*    │◀────│  (core service) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │  Mission State   │
                        │  Squadrons       │
                        │  Assets          │
                        │  Fused Tracks    │
                        │  Advisor         │
                        └──────────────────┘
```

## Components

### 1. Backend voice agent (`src/core/voice-agent.ts`)

Responsibilities:

- Parse natural-language queries.
- Classify intent:
  - `status` — report on squadron, asset, mission, or threat.
  - `dispatch` — send an asset to a location or task.
  - `control` — start, pause, resume, reset mission.
  - `explain` — describe advisor reasoning or recent events.
- Fetch required state from existing stores/services.
- Execute non-critical commands directly.
- Escalate critical commands to human approval (same rule engine as the advisor).
- Return a concise text response.

### 2. API routes (`src/api/routes/voice.ts`)

- `POST /api/voice/query` — text in, text out.
  ```json
  { "query": "Where is the nearest enemy?" }
  ```
  ```json
  { "response": "Nearest hostile is 3.2 km east, bearing 090.", "action": "status_report" }
  ```
- `POST /api/voice/tts` (optional) — return audio file.
- `GET /api/voice/history/:sessionId` — conversation history.

### 3. Web voice UI (`apps/web/src/components/VoiceAgent.tsx`)

For demo purposes, a push-to-talk component in the browser:

- Hold button → record via Web Speech API.
- Transcript sent to `/api/voice/query`.
- Response spoken via `speechSynthesis`.
- Transcript shown on screen.

This proves the agent works without needing hardware on day one.

### 4. Raspberry Pi headless mode (optional demo hardware)

A small script running on the Pi:

- Listen to microphone.
- Use local Whisper or cloud STT to transcribe.
- POST text to Operator.
- Play response through speaker via local TTS (Piper / espeak / cloud).

Hardware needed:

- Raspberry Pi 5 (available).
- USB microphone.
- Small speaker or audio HAT.
- WiFi or Ethernet to Operator backend.

## Data access

The agent reuses existing modules:

- `MissionContextStore` — mission state, objectives, route.
- `SquadronSimulator` — squadron positions and status.
- `AssetStore` / `useAssets` — robot/payload status.
- `FusionEngine` — fused tracks and threats.
- `AutonomousAdvisor` — decision logic and escalation.

No new data model is required.

## Minimum viable demo (live prop)

For EDTH 2026 the voice agent is a **reliable 30-second live interaction**, not a general NLU product.

1. Operator backend running with the payload escort mission.
2. A phone, laptop, or Pi box with mic + speaker near the robot.
3. Push-to-talk button in the browser (or physical button on Pi).
4. Operator answers 3-5 pre-scripted questions reliably:
   - *"Where is the enemy?"*
   - *"Status of the payload."*
   - *"Dispatch the scout."*
   - *"What is my next waypoint?"*
   - *"Pause mission."*
5. Response is spoken aloud and shown on screen.

The goal is to show that a vehicle operator can interact with Operator without looking at a screen. The demo works even in a noisy room because the queries are short and the responses are deterministic.

## Hardware for live demo

- Raspberry Pi 5 (already available) or a spare phone/laptop.
- USB microphone or Bluetooth headset.
- Small portable speaker (battery-powered, 3.5 mm or Bluetooth).
- Optional: USB button for push-to-talk.

See `docs/product/voice-agent-hardware.md` for a shopping list.

## Hackathon relevance

- **Challenge #05 — Hacking at the Edge**: voice interface for disconnected/dynamic environments.
- **Challenge #07 — Mission-Aware LLM**: the agent operates on the live mission picture.
- Strengthens the "one system" pitch: Operator works on screens and voice.

## Open questions

- Use local LLM (Ollama) for NLU, or rule-based intent classifier for speed?
- Which STT/TTS engine for the Pi demo? Whisper + Piper is fully offline but heavier.
- Should the voice agent run as a separate process or inside the Hono app?
