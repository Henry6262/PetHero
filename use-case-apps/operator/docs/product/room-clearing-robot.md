# Room-Clearing Robot — Replace Blind Grenade Entry

> Idea capture: 2026-07-10

## Problem

Current military room-clearing doctrine often relies on throwing grenades into a room before entry. This is dangerous and blind:

- The team does not know what is inside.
- Civilians, hostages, or non-combatants may be present.
- Structural damage is guaranteed.
- The team still enters with limited information.

A small robot can go in first, scan the room, and report what is there before any human commits.

## Concept

Deploy a **pocket-sized ground robot** (crawler, quadruped, or tracked) through a door, window, or breach. The robot:

- Streams video and audio.
- Maps the room layout.
- Detects people, weapons, explosives, and obstacles.
- Reports room state and threats back to Operator.
- Marks rooms as clear, hostile, unknown, or booby-trapped.

The human team enters only after they have a clear picture.

## Why it fits Operator

Operator already models buildings and rooms in the tactical view:

- `Building` and `BuildingRoom` types.
- Rooms can be marked `clear` or `unknown`.
- Agents can be assigned to buildings.
- The 3D dashboard shows room-by-room status.

Adding a room-clearing robot means:

- A robot enters a building.
- It scans rooms and updates their status in real time.
- The operator sees the building fill in from `unknown` to `clear` / `hostile` / `booby-trapped`.
- The advisor recommends next room, safe path, or human escalation.

## Example scenario

1. Squad approaches a building. Rooms B-12, B-18, B-21 are `unknown`.
2. Operator tasks the quadruped robot to enter and scan.
3. Robot streams video through the doorway.
4. AI detects two hostiles in B-12, none in B-18, obstacles in B-21.
5. Room statuses update:
   - B-12 → hostile
   - B-18 → clear
   - B-21 → unknown (blocked)
6. Advisor recommends:
   - Breach B-12 from two angles.
   - Use B-18 as the entry corridor.
   - Send robot through alternate route for B-21.
7. Human commander approves. Squad moves with full knowledge.

## Hardware options

- Existing Pi Crawler or small quadruped with a camera.
- Throwbot / throwable micro-robot.
- Phone-on-wheels with fisheye camera.
- Drone for upper-floor windows.

## Data the robot sends

- Video stream or frames.
- Room occupancy detection.
- Weapon / explosive detection.
- Audio anomalies (voices, movement).
- Door/window locations.
- Floor plan estimate (SLAM).

## Operator integration

- New `room-scan` playbook or mission type.
- Robot adapter for streaming frames.
- Object detection model (local on robot or edge node).
- Room status update API.
- Building panel auto-updates as rooms are scanned.
- Advisor logic for room-clearing tactics.

## Pitch angle

> *"Right now soldiers throw grenades into rooms they cannot see into. We give them a small robot that goes first, sees first, and comes back. Less collateral damage. Fewer dead soldiers. Better decisions."*

## Relation to current hackathon demo

This is **out of scope for EDTH 2026**. The current demo focuses on payload escort + COP + voice agent. Room-clearing robots are a natural extension that uses the same building/room model already in the tactical view.

## When to build

- **After hackathon**: add room-scan playbook and building status update.
- **Next milestone**: integrate a real small robot streaming video into the 3D dashboard.
- **Long-term**: AI-driven room-clearing tactics with multi-robot coordination.

## Challenges this maps to

- **#05 Hacking at the Edge** — small robot + camera + local AI at the edge.
- **#07 Mission-Aware LLM** — advisor reasons over room states and recommends tactics.
- **#10 Multi-Sensor Track Fusion** — fuse video, audio, and motion into room status.
