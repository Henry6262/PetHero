## 2026-06-29 | Operator | Start Defensive ISR Context Backend

Context: Henry is starting a new initiative called Operator from the gathered SCOUT/Kimi research packet. The raw material included tactical C2, robots/drones, docks, graph exploration, mobile operator UI, and some earlier lethal/payload framing. Henry clarified the important product distinction: Operator should be a context layer for defensive ISR, meaning-first packets, distributed mission memory, formation suggestions, dock sync, staleness, provenance, and trust.

Options:
- A) Continue the older robot/payload-centered SCOUT framing.
- B) Start Operator as a software-first, defensive ISR context platform with backend/docs before UI and hardware.

Decision: B — create `use-case-apps/operator/` as a Bun/Hono backend and documentation package. The first architecture uses plain HTTP/WebSockets-compatible schemas, in-memory mission context, dock check-in, stale-zone detection, and simple tactical playbook suggestions. Transport-specific middleware such as ROS 2, Zenoh, LCM, LoRa, or BLE is deferred until the product logic works.

Consequences:
- Operator is explicitly not framed around bombs, payload release, or autonomous engagement.
- The dock becomes a context initializer: authenticate, upload, merge, initialize.
- The MVP validates convergence, delta efficiency, freshness decay, conflict handling, trust handling, and dock initialization.
- Future dashboard/mobile work should consume the same meaning-first event and mission-state APIs.
