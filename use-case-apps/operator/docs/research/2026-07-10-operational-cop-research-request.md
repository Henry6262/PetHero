# Research Request: Operator Theater-Scale Operational COP

**Project:** Operator (`use-case-apps/operator/`)  
**Context:** EDTH / European Defence Tech Hackathon, Berlin, July 2026  
**Deadline:** 4 days to demo  
**Request type:** Multi-topic deep-dive for a research swarm  

## 1. What we are building

A browser-based command-and-control (C2) "operational picture" for a Ukraine-Russia-style theater. The view is the top layer of a three-tier map system:

1. **Operational view** (this research) — MapLibre GL JS, theater COP, hundreds of squadrons, zones, vectors, real-time tracks.
2. **Tactical view** — Three.js 3D scene for a single mission (payload escort, robots, terrain).
3. **Strategic view** — Future CesiumJS globe view (out of scope for the hackathon).

The immediate demo narrative: a human/robot team runs an autonomous payload-escort mission while a commander watches the theater-wide picture, sees multi-sensor fused tracks, receives AI advisor recommendations, and can query a voice agent.

## 2. Current stack and what already works

- **Frontend:** React 19 + Vite, MapLibre GL JS via `react-map-gl/maplibre`, Three.js for tactical view.
- **Backend:** Bun + Hono REST API, in-memory squadron simulator, Zod schemas.
- **Geometry:** `@turf/turf` just added for clipping oblast polygons by the front line.
- **Data:** Real Natural Earth admin-1 oblast boundaries for Ukraine + bordering Russian oblasts; approximate line of contact; 400 simulated squadrons; simulated sensor feeds and fused tracks.
- **Symbols:** Shape-coded squadron markers (● infantry, ■ armor, ▲ artillery, ◆ drone, ★ recon, □ logistics) with affiliation colors.
- **Narrative vectors:** Wide polygon arrows for axes of advance / pressure.
- **Voice agent:** `/api/voice` endpoint for hands-free status queries.

## 3. Why this research matters now

We have a working skeleton, but several hard problems are still open or only half-solved. We need the swarm to surface best practices, libraries, military standards, and real-world precedents so we do not invent bad solutions under time pressure.

The output we need from each researcher is: **"For topic X, here is the industry/military standard, the best open-source library, the specific implementation approach, and the gotchas."**

## 4. Research topics

### Topic A — Real-time operational map rendering at scale

**Question:** How do professional C2 systems render 400–10,000 moving tracks on a 2D map without React DOM death?

- Compare MapLibre GL JS native GeoJSON layers vs deck.gl vs custom WebGL overlays.
- What is the performance ceiling of each for points, lines, and polygons?
- How should updates be delivered? WebSockets, SSE, polling, delta patches?
- What are the clustering/LOD patterns when zoomed out? (Supercluster, H3, server-side aggregation.)
- Recommend the minimal viable architecture for 400 moving squadrons + 50 fused tracks + 20 zones.

**Deliverable:** A concrete recommendation for our stack (React + MapLibre) with code-level pointers.

### Topic B — Military symbology that looks professional

**Question:** How do we render real MIL-STD-2525D / APP-6D symbols in a web browser?

- `milsymbol.js` for point symbols — limitations, SIDC usage, customization.
- Tactical graphics (lines, areas, engagement areas, no-fire areas) — how are they encoded and rendered?
- Can we generate symbols from our own type/affiliation data without pulling in the full 2525 spec?
- What do systems like ATAK, SitaWare, Palantir, or BMS use for symbology?
- Color-blind-safe palettes and day/night/NVIS modes.

**Deliverable:** A symbol-rendering plan for squadron pucks, zones, and tactical graphics that works in MapLibre.

### Topic C — Polygon geometry for dominance sectors and corridors

**Question:** How do we generate, validate, and render contested / friendly / hostile sectors that respect real administrative boundaries?

- Turf.js vs JSTS vs geos-wasm vs PostGIS for polygon operations.
- How to buffer a polyline into a clean polygon without self-intersections.
- How to split an oblast polygon by a front line or corridor.
- Handling GeoJSON ring winding order and antimeridian issues.
- Visual styling: patterned fills, hatching, dashed borders, labels.

**Deliverable:** Best-practice geometry pipeline for turning a line of contact into clean dominance sectors.

### Topic D — Multi-sensor track fusion

**Question:** How do you fuse 5 different sensor feeds into one clean air/ground picture?

- The TYTAN Technologies challenge is the canonical formulation: different coordinate frames, IDs, timestamps, precision, plots vs tracks.
- Kalman filters, JPDA, MHT, or simpler geometric + kinematic association?
- How to represent uncertainty (covariance ellipses, confidence scores)?
- Source reliability weighting and conflict detection.
- Real-world formats: Cursor-on-Target (CoT), AIS, ADS-B, ASTERIX, JSON feeds.

**Deliverable:** A fusion pipeline design that fits our Bun backend and produces tracks the frontend can render.

### Topic E — Offline-first and edge sync for field use

**Question:** How does a C2 map keep working when comms are jammed or disconnected?

- PMTiles / MBTiles / sqlite-wasm for offline basemaps.
- CRDTs (Yjs) or conflict-free sync for map state between central, edge CPs, and field devices.
- Store-and-forward for robot/drone reports.
- DDIL-tolerant architecture patterns from military C2 literature.

**Deliverable:** A pragmatic offline/edge architecture for the hackathon demo that is not over-engineered.

### Topic F — Voice and hands-free UI for operators in vehicles

**Question:** What is the best way to give a tank/vehicle driver or dismounted soldier hands-free access to the C2 picture?

- On-device STT + LLM vs cloud APIs.
- TTS that works in noisy environments.
- Prompt engineering for defense-specific terminology and concise answers.
- Safety: how to avoid hallucinated coordinates or orders?
- Real precedents: ATAK voice plugins, Android Tactical Assault Kit, military AI assistants.

**Deliverable:** Voice-agent design for our demo: intents, response format, fallback behavior.

### Topic G — Robot / drone / hardware integration

**Question:** How do we connect real field robots and cameras to the C2 system?

- ROS2, MQTT, ZeroMQ, WebRTC, or raw UDP for telemetry?
- Payload escort mission logic: scout ahead, detect threats, request human decision.
- Object detection models that run on Raspberry Pi 5 / edge devices.
- GPS-denied navigation and visual odometry options.
- Integrating analog/non-networked sensors ("Hacking at the Edge" challenge).

**Deliverable:** Integration architecture for the demo robots (quadruped, Pi crawler, camera) with the backend.

### Topic H — Mission hierarchy and kill-chain UI

**Question:** How should the UI represent operations → missions → objectives → targets → tasks and the F2T2EA kill chain?

- Existing patterns from ATAK, SitaWare, Palantir, BMS, Delta BMS.
- Decision prompts and human-on-the-loop escalation.
- Timeline and audit log for autonomous decisions.
- Mission status visualization that does not overwhelm.

**Deliverable:** UI/UX recommendations and component sketches for the mission hierarchy sidebar.

### Topic I — C2 interoperability and standards

**Question:** How do real C2 systems exchange data, and how can we integrate with or replace them?

- Cursor-on-Target (CoT), NATO FFIUC, Link-16, NFFI, MIP.
- Project Q challenge: "Tasking your systems from a real C2."
- Delta BMS / SitaWare / ATAK integration patterns.
- What is realistically achievable in a 4-day hackathon?

**Deliverable:** A standards/integration map with a "minimum viable handshake" recommendation.

### Topic J — AI/LLM for operational recommendations

**Question:** How can an LLM turn the operational picture into mission-ready recommendations without hallucinating?

- RAG over doctrine, SOPs, and current map state.
- Fine-tuning vs prompt engineering for defense terminology.
- Structured output (JSON) for decisions and reasoning logs.
- Guardrails: do not generate target coordinates, always cite sources, escalate when confidence is low.

**Deliverable:** LLM architecture for the autonomous advisor with example prompts and output schemas.

## 5. Constraints and non-goals

- **Do not recommend new frameworks unless they unblock the demo.** We are committed to React + MapLibre + Three.js + Bun.
- **Do not research classified systems.** Open sources, commercial docs, and academic papers only.
- **Prioritize hackathon-shippable solutions.** We have 4 days; perfection is the enemy.

## 6. Output format for researchers

For each topic, produce:

1. **Executive summary** (3 bullets).
2. **Recommended approach** for our stack.
3. **Key libraries / tools / standards** with version and license.
4. **Implementation sketch** (pseudo-code or real code if short).
5. **Gotchas and failure modes** (3–5 items).
6. **Sources** (URLs, paper titles, docs).

## 7. Current code pointers

- Operational map component: `apps/web/src/components/OperationalMap.tsx`
- Sub-sector generator: `apps/web/src/lib/theater-sectors.ts`
- Vector arrow generator: `apps/web/src/lib/geo.ts` (`toVectorGeoJSON`)
- Squadron simulator: `src/core/squadron-simulator.ts`
- API routes: `src/api/routes/squadrons.ts`
- Voice agent: `src/api/routes/voice.ts`

## 8. End state we want

A demo where:
- The operational map shows real oblasts, real front-line-derived dominance sectors, and 400 moving squadrons with shape-coded types.
- Fused tracks from multiple sensors appear as de-conflicted diamonds with confidence ellipses.
- A commander can click a squadron, see its status, and watch the AI advisor reason about threats.
- A field operator can ask the voice agent "Where is the enemy?" and get a concise, sourced answer.
- The tactical view shows the autonomous payload escort with robots reacting to contacts.

---

*Requested by Henry for the EDTH research swarm.*
