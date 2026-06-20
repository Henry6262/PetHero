# PetHero API Reference

> Auto-generated from FastAPI + hand-written request/response examples.  
> Interactive version: open [`index.html`](./index.html) in a browser or visit `/docs` on a running backend.

---

## Base URL

```
http://localhost:8000
```

When the backend is running locally (see [`backend/README.md`](../README.md)):

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The app talks to this host. For a real phone, use the Mac's LAN IP (`ipconfig getifaddr en0`); the iOS Simulator can use `localhost`.

---

## Authentication

Currently **none**. CORS is wide open for local development.

---

## REST Endpoints

| Method | Path | What it does |
|--------|------|--------------|
| `GET` | `/status` | System status (mode, backends, camera, pet count). |
| `GET` | `/pets` | List all pets. |
| `GET` | `/pets/{pet_id}` | Get a single pet. |
| `GET` | `/log` | Activity log (newest first). |
| `POST` | `/mode` | Switch `demo` ↔ `live`. |
| `POST` | `/vision/current` | Demo: tell the camera which pet is at the bowl. |
| `POST` | `/process` | Run one autonomous agent step. |
| `POST` | `/trigger` | Manually dispense feed/water/medicine. |
| `GET` | `/robot/status` | Robot worker connection + last command. |

---

## `GET /status`

Current system configuration.

### Response

```json
{
  "mode": "demo",
  "vision_backend": "stub",
  "agent_backend": "rules",
  "camera": "placeholder",
  "pets": 3,
  "state": "idle"
}
```

Fields:

- `mode` — `"demo"` or `"live"`.
- `vision_backend` — `"stub"`, `"yolo"`, `"hf"`, etc.
- `agent_backend` — `"rules"` or `"mistral"`.
- `camera` — camera identifier.
- `pets` — number of pets configured.
- `state` — current orchestrator state.

---

## `GET /pets`

All configured pets.

### Response

```json
[
  {
    "id": "mittens",
    "name": "Mittens",
    "species": "cat",
    "photo_ref": "",
    "max_portion_grams": 50,
    "min_feed_interval_hours": 4,
    "medications": [
      {
        "name": "thyroid",
        "dose_count": 1,
        "interval_hours": 12,
        "notes": "Hyperthyroid — 1 pill twice daily"
      }
    ]
  }
]
```

---

## `GET /pets/{pet_id}`

Single pet lookup.

### Request

```bash
curl http://localhost:8000/pets/mittens
```

### Response

Same shape as an item from `/pets`.

---

## `GET /log`

Recent activity, newest first. The WebSocket pushes these same events live.

### Response

```json
[
  {
    "timestamp": "2026-06-20T17:30:00",
    "pet_name": "Mittens",
    "action": "water",
    "amount_grams": 0,
    "medicine_name": null,
    "allowed": true,
    "reason": "Fresh water dispensed.",
    "rule": null,
    "mode": "demo"
  },
  {
    "timestamp": "2026-06-20T17:15:00",
    "pet_name": "Mittens",
    "action": "feed",
    "amount_grams": 50,
    "medicine_name": null,
    "allowed": false,
    "reason": "Fed too recently (1.5 h ago).",
    "rule": "double_feed",
    "mode": "demo"
  }
]
```

### Log event fields

| Field | Type | Meaning |
|-------|------|---------|
| `timestamp` | ISO-8601 | When the event happened. |
| `pet_name` | `string \| null` | Target pet. `null` for shared/global events. |
| `action` | `"feed" \| "water" \| "medicine" \| "none"` | Action type. |
| `amount_grams` | `number` | Food amount (0 for water/medicine). |
| `medicine_name` | `string \| null` | Dispensed medication, if any. |
| `allowed` | `boolean` | Whether safety rules approved it. |
| `reason` | `string` | Human-readable outcome. |
| `rule` | `string \| null` | Safety rule slug when blocked. |
| `mode` | `string` | Mode the system was in. |

---

## `POST /mode`

Switch system mode.

### Request

```bash
curl -X POST http://localhost:8000/mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "live"}'
```

### Response

Updated `SystemStatus` (same shape as `GET /status`).

---

## `POST /vision/current`

Demo-only: tell the backend which pet is currently at the bowl. Passing no `pet_id` means "no pet / unknown".

### Request

```bash
curl -X POST "http://localhost:8000/vision/current?pet_id=mittens"
```

### Response

A `Detection` object:

```json
{
  "present": true,
  "species": "cat",
  "pet_id": "mittens",
  "pet_name": "Mittens",
  "confidence": 0.92,
  "bbox": [120, 80, 400, 360],
  "source": "demo"
}
```

To clear the current pet:

```bash
curl -X POST "http://localhost:8000/vision/current"
```

---

## `POST /process`

Run one autonomous step: detect → agent decides → safety checks → dispense (if approved).

### Request

```bash
curl -X POST http://localhost:8000/process
```

### Response

```json
{
  "detection": {
    "present": true,
    "species": "cat",
    "pet_id": "mittens",
    "pet_name": "Mittens",
    "confidence": 0.92,
    "bbox": [120, 80, 400, 360],
    "source": "demo"
  },
  "decision": {
    "pet_name": "Mittens",
    "action": "water",
    "amount_grams": 0,
    "medicine_name": null,
    "reasoning": "Mittens is already fed and up to date on meds."
  },
  "event": {
    "timestamp": "2026-06-20T17:30:00",
    "pet_name": "Mittens",
    "action": "water",
    "amount_grams": 0,
    "medicine_name": null,
    "allowed": true,
    "reason": "Fresh water dispensed.",
    "rule": null,
    "mode": "demo"
  }
}
```

---

## `POST /trigger`

Manual owner override: press Feed / Water / Medicine for a specific pet.

### Request

```bash
curl -X POST http://localhost:8000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": "mittens",
    "action": "feed"
  }'
```

For medicine:

```bash
curl -X POST http://localhost:8000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": "mittens",
    "action": "medicine",
    "medicine_name": "thyroid"
  }'
```

### Response

```json
{
  "decision": {
    "pet_name": "Mittens",
    "action": "feed",
    "amount_grams": 50,
    "medicine_name": null,
    "reasoning": "Owner requested a meal for Mittens."
  },
  "event": {
    "timestamp": "2026-06-20T17:35:00",
    "pet_name": "Mittens",
    "action": "feed",
    "amount_grams": 50,
    "medicine_name": null,
    "allowed": true,
    "reason": "Dispensing 50 g for Mittens.",
    "rule": null,
    "mode": "demo"
  }
}
```

---

## `GET /robot/status`

Connection status for the physical robot arm.

### Response

```json
{
  "robots_connected": 1,
  "last_command": {
    "action": "feed",
    "amount_grams": 50,
    "medicine_name": null
  }
}
```

---

## WebSocket `/ws/feed`

The iOS app connects here for the live dashboard. Messages are JSON envelopes with a `type` field.

```javascript
const ws = new WebSocket("ws://localhost:8000/ws/feed");

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  switch (msg.type) {
    case "status":     // SystemStatus
    case "detection":  // Detection
    case "decision":   // DispenseDecision
    case "event":      // ActivityEvent
    case "frame":      // { jpeg_b64: string }
  }
};
```

### Message types

#### `status`

Sent immediately on connect and again when `/mode` changes.

```json
{
  "type": "status",
  "mode": "demo",
  "vision_backend": "stub",
  "agent_backend": "rules",
  "camera": "placeholder",
  "pets": 3,
  "state": "idle"
}
```

#### `detection`

Who/what is at the bowl.

```json
{
  "type": "detection",
  "present": true,
  "species": "cat",
  "pet_id": "mittens",
  "pet_name": "Mittens",
  "confidence": 0.92,
  "bbox": [120, 80, 400, 360],
  "source": "demo"
}
```

#### `decision`

What the agent thinks should happen.

```json
{
  "type": "decision",
  "pet_name": "Mittens",
  "action": "water",
  "amount_grams": 0,
  "medicine_name": null,
  "reasoning": "Mittens is already fed and up to date on meds."
}
```

#### `event`

What actually happened after safety rules ran.

```json
{
  "type": "event",
  "timestamp": "2026-06-20T17:30:00",
  "pet_name": "Mittens",
  "action": "water",
  "amount_grams": 0,
  "medicine_name": null,
  "allowed": true,
  "reason": "Fresh water dispensed.",
  "rule": null,
  "mode": "demo"
}
```

#### `frame`

Base64-encoded JPEG from the camera. The app renders it as a data URI:

```javascript
image.src = `data:image/jpeg;base64,${msg.jpeg_b64}`;
```

---

## WebSocket `/ws/robot`

Robot workers (e.g. LeRobot/LeLab arm) subscribe here to receive physical dispense commands.

```python
import asyncio, websockets, json

async def main():
    async with websockets.connect("ws://localhost:8000/ws/robot") as ws:
        hello = await ws.recv()
        print(hello)
        async for msg in ws:
            print(json.loads(msg))

asyncio.run(main())
```

### Command message

```json
{
  "type": "command",
  "action": "feed",
  "amount_grams": 50,
  "medicine_name": null
}
```

---

## Common flows

### Demo a pet walking up to the bowl

```bash
# 1. Tell the backend Mittens is at the bowl
curl -X POST "http://localhost:8000/vision/current?pet_id=mittens"

# 2. Run one autonomous step
curl -X POST http://localhost:8000/process
```

### Manual feed/water from the app

```bash
curl -X POST http://localhost:8000/trigger \
  -H "Content-Type: application/json" \
  -d '{"pet_id": "mittens", "action": "water"}'
```

### Switch to live mode

```bash
curl -X POST http://localhost:8000/mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "live"}'
```

---

## Data models

### `Action`

```json
"feed" | "water" | "medicine" | "none"
```

### `Pet`

```json
{
  "id": "mittens",
  "name": "Mittens",
  "species": "cat",
  "photo_ref": "",
  "max_portion_grams": 50,
  "min_feed_interval_hours": 4,
  "medications": [
    {
      "name": "thyroid",
      "dose_count": 1,
      "interval_hours": 12,
      "notes": "Hyperthyroid — 1 pill twice daily"
    }
  ]
}
```

### `DispenseDecision`

```json
{
  "pet_name": "Mittens",
  "action": "water",
  "amount_grams": 0,
  "medicine_name": null,
  "reasoning": "Mittens is already fed and up to date on meds."
}
```

### `ActivityEvent`

See [`GET /log`](#get-log).

---

## Files in this folder

| File | Purpose |
|------|---------|
| [`openapi.json`](./openapi.json) | Machine-readable OpenAPI 3.1 spec. Import into Postman, Swagger UI, etc. |
| [`index.html`](./index.html) | Self-contained Swagger UI. Open locally or host on GitHub Pages. |
| [`API.md`](./API.md) | This hand-written reference with copy-paste examples. |
