# Operator Pitch Positioning

> Living doc: 2026-07-10

## The one-sentence pitch

**Operator is the single C2 system that turns a battlefield picture into autonomous robot missions — with humans kept in the loop only for critical decisions.**

## The problem we solve

Commanders today juggle too many tools:

- One screen for the enemy picture.
- Another screen for friendly forces.
- Another screen for robots and drones.
- Chat for coordination.
- Spreadsheets or whiteboards for mission planning.
- Paper or memory for what happened last time.

In a moving vehicle or under fire, this is impossible. Real operators need **one system**.

## Our answer

Operator combines four things into one platform:

1. **Common Operational Picture (COP)** — theater map, territories, tracks, zones, front line.
2. **Mission Planning & Control** — objectives, targets, routes, tasks, asset assignment.
3. **Autonomous Execution** — AI advisor dispatches robots, manages routes, decides routine actions.
4. **Human-on-the-Loop Escalation** — only critical decisions reach a human.

## Key differentiators

| Capability | Operator |
|------------|----------|
| Single system | Map + mission + robots + advisor + chat in one UI |
| Autonomy | AI decides routine actions; human approves only critical ones |
| Edge/DDIL | Works offline, syncs when connected, dock memory inheritance |
| Robotics | Native robot/drone adapters, not bolted-on |
| Voice | Hands-free interface for vehicle operators |
| Standards | CoT / NATO-aligned data exchange |

## How we talk about Delta

Delta is the national-level Ukrainian COP. It proves the problem is real and the approach works. But:

- Delta is a **national/strategic** system.
- Operator is a **battalion/tactical** system.
- Delta shows the war; Operator runs the mission.
- Operator can ingest Delta-style feeds, but it is designed to work standalone.

**Never say**: *"We replace Delta."*

**Say**: *"Operator is the single tactical system a battalion commander uses. It gives you the COP, plans the mission, controls the robots, and escalates critical decisions — all in one place."*

## Target users

- Battalion / squadron commanders who need one picture.
- Robot/drone operators who need tasking, not just telemetry.
- Vehicle crews who need voice updates while moving.
- Coalition forces that need standards-based data sharing.

## Demo story

1. Show the theater COP: our territory, contested, enemy, front line.
2. A contact appears in the contested zone.
3. Operator fuses the report, assesses confidence, decides to dispatch a scout.
4. Scout robot moves out. Driver asks via voice: *"Where is the enemy?"*
5. Voice agent answers.
6. Contact is confirmed. Advisor escalates to human: *"Approve hold or continue?"*
7. Human approves. Mission continues.
8. End state: one system controlled the whole loop.

## Taglines

- *"One picture. One mission. One system."*
- *"From theater map to robot actuator."*
- *"Let the AI run the routine. Keep the human for the hard calls."*
- *"Every agent starts with context, not zero."*

## Challenges we map to

- **#10 Multi-Sensor Track Fusion** — our fusion engine.
- **#06 Tasking from a real C2** — CoT adapter, standards-based tasking.
- **#07 Mission-Aware LLM** — autonomous advisor.
- **#05 Hacking at the Edge** — field robot adapters, DDIL, voice interface.
