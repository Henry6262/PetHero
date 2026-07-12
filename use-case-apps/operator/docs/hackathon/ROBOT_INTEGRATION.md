# Robot Integration Guide — EDTH Payload Escort Demo

> This document is the contract between the software team (Operator C2) and the robotics team (hardware adapters). Read it before writing any adapter code.

## Adapter philosophy

Each robot is a black box. Operator sends simple commands over HTTP. The robot adapter translates those commands into hardware-specific motion/camera/actuator calls and reports back detections, status, and telemetry.

This lets the software team build against simulated robots on a laptop while the robotics team works on the real hardware in parallel.

## Network setup

- **Primary transport:** Wi-Fi or Ethernet on the same LAN as the Operator server.
- **Operator server IP:** usually `http://localhost:3069` during dev, or the laptop's LAN IP during demo.
- **Robot adapter IP:** each robot exposes its own HTTP server on a known port (e.g., `http://192.168.1.101:5000`).
- **Degraded transport (optional):** Meshtastic/LoRa or ad-hoc Wi-Fi Direct if the main router is unplugged for the DDIL moment.

## Robot adapter HTTP API

Every adapter must implement these three endpoints.

### `GET /health`

Returns current robot state.

**Response:**

```json
{
  "ok": true,
  "robotId": "crawler-01",
  "role": "payload",
  "batteryPct": 78,
  "state": "moving",
  "currentWaypointId": "wp-3",
  "lastReportAt": "2026-07-14T12:00:00.000Z"
}
```

### `POST /command`

Accepts a command from Operator.

**Request body:**

```json
{
  "command": "move_to_waypoint",
  "waypointId": "wp-3"
}
```

**Supported commands:**

| Command | Meaning | Required params |
|---------|---------|-----------------|
| `move_to_waypoint` | Go to a route waypoint. | `waypointId` |
| `stop` | Halt immediately. | — |
| `scan` | Pause and look around / capture detection. | `waypointId` (optional) |
| `return_to_dock` | Go back to the start dock. | — |
| `actuate` | Perform a role-specific action. | `action` (e.g., `lock`, `unlock`, `flag`) |

**Response:**

```json
{
  "ok": true,
  "commandId": "cmd-uuid",
  "state": "moving",
  "message": "Moving to wp-3"
}
```

### `POST /report`

Robot sends detections, status, or telemetry to Operator.

**Headers:**

```text
X-Robot-Id: crawler-01
X-Timestamp: 1720956000000
X-Nonce: abc123
X-Signature: <HMAC-SHA256 hex>
```

**Body:**

```json
{
  "type": "detection",
  "timestamp": "2026-07-14T12:00:00.000Z",
  "robotId": "crawler-01",
  "payload": {
    "lat": 48.1374,
    "lon": 11.5755,
    "alt": 0.5,
    "classification": "PERSON",
    "confidence": 0.82,
    "imageUrl": "http://192.168.1.101:5000/capture/last.jpg"
  }
}
```

**Report types:**

| Type | Use | Required payload fields |
|------|-----|-------------------------|
| `detection` | AI camera sees something. | `lat`, `lon`, `classification`, `confidence` |
| `status` | Command ack / state change. | `state`, `currentWaypointId` |
| `telemetry` | Periodic battery/position/heartbeat. | `batteryPct`, `lat`, `lon` |

### Authentication

Reports must be HMAC-signed. The shared secret is configured in Operator (`OPERATOR_ROBOT_SECRET`) and in each adapter.

Signature computation:

```python
message = f"{body_json}:{timestamp}:{nonce}"
signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
```

Operator rejects reports older than 5 minutes or with bad signatures.

## Robot roles

### `payload` — Pi Crawler

- Carries the payload (a small box or marker).
- Follows the taped route from waypoint to waypoint.
- AI camera looks forward for obstacles/threats.
- Stops when commanded, resumes when cleared.

**Required commands:** `move_to_waypoint`, `stop`, `scan`, `return_to_dock`.

**Required reports:** `detection`, `status`, `telemetry` every 2 seconds.

### `scout` — Quadruped

- Waits at dock until dispatched.
- Moves to a contact waypoint to confirm a detection.
- Returns to dock when idle.

**Required commands:** `move_to_waypoint`, `stop`, `scan`, `return_to_dock`.

**Required reports:** `status`, `telemetry`, optional `detection` if it has a camera.

### `checkpoint` — Robot Arm

- Guards the destination.
- `actuate lock` lowers a barrier / turns red light.
- `actuate unlock` raises barrier / turns green light.

**Required commands:** `actuate`, `stop`.

**Required reports:** `status`, `telemetry`.

## Waypoints and AprilTags

The route is defined by a sequence of waypoints on the floor.

- Each waypoint has an `id`, `lat`, `lon`, and optional `tagId`.
- `tagId` refers to a printed AprilTag placed at that location.
- Robots use AprilTag detection to localize and confirm arrival.
- Waypoints are stored in `apps/web/src/data/escort-demo.ts` and mirrored in `src/core/escort-scenario.ts`.

### AprilTag spec

- Use 36h11 family, 160 mm squares.
- Print on matte paper and tape flat to the floor.
- Keep lighting even; avoid glare.
- Tag IDs must be unique and sequential (e.g., 0–9).

### Example waypoint

```json
{
  "id": "wp-3",
  "lat": 48.1374,
  "lon": 11.5755,
  "tagId": 3,
  "role": "checkpoint"
}
```

## Coordinate system

Operator stores everything in **WGS84 lat/lon** so it can plug into MapLibre and CoT XML. For an indoor demo, lat/lon are just offsets from a reference point (e.g., demo table center).

Conversion helper (Python):

```python
REF_LAT = 48.1374
REF_LON = 11.5755
M_PER_DEG = 111_320

def local_to_wgs84(x_m, y_m):
    lat = REF_LAT + y_m / M_PER_DEG
    lon = REF_LON + x_m / (M_PER_DEG * math.cos(math.radians(REF_LAT)))
    return lat, lon
```

## Adapter implementation checklist

For each robot:

- [ ] Python adapter runs a Flask/FastAPI/Bottle HTTP server.
- [ ] Adapter reads `OPERATOR_URL` and `ROBOT_SECRET` from env.
- [ ] Adapter implements `/health`, `/command`, `/report`.
- [ ] Adapter signs reports with HMAC.
- [ ] Adapter can receive `move_to_waypoint` and drive the robot to the corresponding AprilTag.
- [ ] Adapter sends `telemetry` every 2 seconds while moving.
- [ ] Adapter sends `detection` reports when the AI camera sees something.
- [ ] Adapter handles `stop` immediately and safely.

## Simulated adapter

For software-only development, use the simulated adapter in `src/core/robot-commander.ts`. It behaves like a real robot but moves instantly and generates synthetic detections.

## Fallback rules

1. If a real robot does not respond for 10 seconds, Operator marks it `OFFLINE` and falls back to simulation for that role.
2. If the AI camera misses detections, the software team can inject simulated sensor feeds to keep the demo alive.
3. If AprilTag localization fails, robots can use dead-reckoning or taped lines; accuracy is lower but acceptable for demo.

## Responsibilities

| Task | Software team | Robotics team |
|------|---------------|---------------|
| Define adapter HTTP contract | ✅ | review |
| Implement adapter in Python | — | ✅ |
| Print AprilTags / tape route | ✅ layout | ✅ placement |
| Localize robot using AprilTags | provide tags | ✅ implement |
| Move robot to waypoint | send command | ✅ execute |
| Send detections to Operator | receive & fuse | ✅ generate |
| HMAC signing | verify | ✅ sign |
| Simulate robot when hardware absent | ✅ | — |

## Quick start for robotics team

1. Pick a web framework (Flask is fine).
2. Hard-code the waypoint list from `apps/web/src/data/escort-demo.ts`.
3. Implement `/health` and `/command` with stub motion (print command, wait 2s, report arrived).
4. Add AprilTag detection with `pupil-apriltags` or OpenCV.
5. Add AI camera detection (Pi AI Camera `picamera2` + pre-trained model, or run a MobileNet via OpenCV DNN).
6. Add HMAC signing and report loop.
7. Test against Operator running on a laptop.

## Reference files

- Operator C2 server: `src/api/routes/robots.ts` (to be created)
- Escort scenario: `src/core/escort-scenario.ts` (to be created)
- Demo waypoints: `apps/web/src/data/escort-demo.ts` (to be created)
- Hardware adapters: `hardware/picrawler_adapter.py`, `hardware/quadruped_adapter.py`, `hardware/robotarm_adapter.py`
