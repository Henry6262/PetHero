# EDTH Demo — Fallbacks & Pre-Demo Checklist

## Demo levels

| Level | What works | When to use |
|-------|-----------|-------------|
| **A — Full** | Real robots + fusion + LLM + CoT/ATAK + DDIL banner | Best case |
| **B — Software + one robot** | One real asset + simulated teammates | Hardware issues |
| **C — Fully simulated** | Laptop-only, all assets simulated | Catastrophic failure |

## Quick fallback switches

### Simulated teammate
Set `ADAPTER_URL` on the real robot and leave simulated assets registered in Operator. The simulated assets move and report automatically.

### Disable real hardware entirely
Do not run any Python adapters. Operator already loads simulated `escortAssets` on startup.

### Skip Ollama
The LLM advisor falls back to the hard-rules engine automatically if `localhost:11434` is unreachable. No code change needed.

### Skip FreeTAKServer/ATAK
The CoT endpoints still return XML; the demo narrative can point to the Operator map instead of ATAK.

## Pre-demo checklist

- [ ] `bun run typecheck && bun test` green.
- [ ] `bun run web:build` green.
- [ ] `/operational` loads "EDTH — Relay Run" with no console errors.
- [ ] Simulated scenario runs end-to-end:
  - Start mission.
  - Inject demo contact.
  - Scout dispatches automatically.
  - Inject more contacts.
  - Human decision prompt appears and can be approved.
- [ ] Real robot adapters respond to `GET /health` (if used).
- [ ] At least one real robot executes a `move_to_waypoint` command (if used).
- [ ] Ollama responds to a test prompt in <3 seconds (if used).
- [ ] FreeTAKServer Docker is running (if used).
- [ ] Route is taped, AprilTags placed, lighting is even.
- [ ] Batteries charged; chargers nearby.
- [ ] Backup laptop/phone hotspot ready.
- [ ] Fallback level confirmed with team.

## Post-demo reset

1. Click **RESET MISSION** in UI.
2. Return robots to dock/start positions.
3. Re-plug network if unplugged.
4. Check robot batteries.
