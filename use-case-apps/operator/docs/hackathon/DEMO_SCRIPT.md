# EDTH Demo Script — "Payload Escort"

> 3-minute version for judges. Keep this printed next to the demo laptop.

## Setup (before judges arrive)

1. Operator server running: `bun run dev`.
2. Web dev server running: `bun run web:dev`.
3. Browser open at `http://localhost:3070/operational`.
4. Select operation **"EDTH — Relay Run"**.
5. Ollama running with `qwen3:8b` warmed up.
5. FreeTAKServer Docker running (if using ATAK).
6. Robots powered on and adapters reachable on LAN.
7. Route taped and AprilTags placed.
8. Payload mounted on Pi Crawler.
9. Demo fallback level confirmed (A/B/C).

## Demo narrative with timing

### [0:00–0:20] Intro

**Operator:**
> "We built Operator, a defensive ISR context layer for robot teams. In this demo, a payload must cross a contested route. The robots decide who does what. The human only intervenes when the decision is critical."

Point to screen:
- Pi Crawler = payload carrier.
- Quadruped = scout.
- Robot arm = checkpoint guardian.

### [0:20–0:40] Escort begins

**Action:** Click **START MISSION** in the UI.

**What happens:**
- Pi Crawler starts moving along the taped route.
- Quadruped moves ahead to the first scout waypoint.
- UI shows the mission route, zones, assigned assets, and a live reasoning log.

**Operator line:**
> "The crawler is moving autonomously. The quadruped is scouting ahead. No one is joystick-driving them."

### [0:40–1:00] Threat appears

**Action:** A teammate walks into the route (or a second robot enters as the "hostile").

**What happens:**
- Pi Crawler AI camera detects movement and sends a `detection` report.
- Operator fuses it with a simulated second sensor.
- Uncertainty ellipse appears, then shrinks as confidence rises.
- Reasoning log updates: *"Contact detected by crawler-01. Confidence 62%. Single source."*

**Operator line:**
> "The camera sees something. But one sensor can be wrong, so the system waits for corroboration."

### [1:00–1:25] AI dispatches the scout

**What happens:**
- Fusion confidence stays below the autonomous threshold.
- LLM advisor logs: *"Confidence 62% < 75% threshold. Dispatching quadruped to confirm."*
- Quadruped receives `move_to_waypoint` command and walks to the contact.
- UI shows the scout route and expected arrival time.

**Operator line:**
> "Instead of bothering the operator, the system sends the nearest robot to get a better look."

### [1:25–1:50] Confirmation and escalation

**Action:** Quadruped reaches the contact. Teammate holds up a card or prop representing a UAV/person.

**What happens:**
- Quadruped camera/classification confirms the contact.
- Fusion confidence jumps above threshold.
- LLM advisor re-evaluates: *"Confirmed UAV-class contact inside no-go zone. Human review required."*
- UI flashes a **DECISION REQUIRED** prompt: *"Approve reroute to checkpoint B?"*
- Payload crawler automatically stops.

**Operator line:**
> "Now the decision is critical. The system stops the payload and asks the human."

### [1:50–2:10] Human decision

**Action:** Click **APPROVE REROUTE**.

**What happens:**
- Robot arm at destination lowers the barrier / turns red.
- Crawler receives a new route around the contact.
- Reasoning log shows the approved decision.

**Operator line:**
> "Human approves. The checkpoint locks down, and the payload takes the safe route."

### [2:10–2:35] "Pull the Plug"

**Action:** Physically unplug the ethernet cable or disable Wi-Fi.

**What happens:**
- UI banner changes to **DEGRADED — LOCAL MODE**.
- Tracks keep updating from local SQLite/Yjs cache.
- LLM brief keeps generating from local Ollama.
- A field report still appears (simulated or via local mesh).

**Operator line:**
> "Enemy electronic warfare just killed our network. The mission does not stop."

**Action:** Plug the cable back in.

**What happens:**
- Banner changes to **RECONNECTING...** then **NORMAL**.
- Offline changes sync back to the server.

**Operator line:**
> "Network is back. Everything reconciles automatically."

### [2:35–3:00] Payload arrives + close

**What happens:**
- Crawler reaches destination.
- Robot arm raises barrier / turns green.
- UI shows the full reasoning chain and mission summary.

**Operator line:**
> "Payload delivered. Every decision, every sensor contribution, every human approval is logged. This is defensive ISR: autonomous where safe, human where critical."

Pause for questions.

## Fallback scripts

### Level B — One real robot, simulated teammates

Skip the quadruped hardware. Use simulated scout. Keep Pi Crawler real for the payload movement. Say:
> "For this setup we're showing one real robot and simulated teammates; the same software commands all of them."

### Level C — Fully simulated

No real robots. Use the simulated scenario in the UI. Say:
> "This is the software simulation. The same code runs the real robots when they're connected."

## Pre-demo checklist

- [ ] `bun run typecheck && bun test` green.
- [ ] `/operational` loads "EDTH — Relay Run" with no console errors.
- [ ] Simulated scenario runs end-to-end on the laptop.
- [ ] Real robot adapters respond to `/health`.
- [ ] At least one real robot executes a `move_to_waypoint` command.
- [ ] Ollama responds to a test prompt in <3 seconds.
- [ ] FreeTAKServer Docker is running (if used).
- [ ] Route is taped, AprilTags placed, lighting is even.
- [ ] Batteries charged; chargers nearby.
- [ ] Backup laptop/phone hotspot ready.

## Post-demo reset

1. Click **RESET SCENARIO** in UI.
2. Return robots to dock/start positions.
3. Re-plug network if unplugged.
4. Check robot batteries.
