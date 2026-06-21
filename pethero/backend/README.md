# PetHero Backend

FastAPI orchestrator — safety enforcement, robot control, live WebSocket hub.

**Production:** `https://pethero-backend-production.up.railway.app` (auto-deploy from `main`)

## Architecture

```
POST /enforce
  → resolve cat (pet_id or vision)
  → check food allow-list
  → check feed interval (safety)
  → send UDP command to robot (port 5006)
  → broadcast decision to app (/ws/feed)

UDP port 5007 (video_bridge)
  → receive JPEG frames from robot camera
  → broadcast as {type:"frame"} to /ws/feed

WS /ws/ingest
  → receive frames from camera_bridge.py (WebSocket path)
  → broadcast to /ws/feed
```

## Run

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
# Swagger: http://localhost:8000/docs
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/status` | system health + pet count |
| GET | `/pets` | all pets + food options |
| GET | `/pets/{id}` | single pet |
| GET | `/pets/{id}/settings` | get pet config |
| PUT | `/pets/{id}/settings` | update food rules, portions, intervals |
| POST | `/enforce` | `{pet_id, food_label, confidence}` → allow/deny + robot UDP command |
| POST | `/robot/command` | `{cmd, cup?}` → send UDP command directly to robot |
| POST | `/trigger` | `{pet_id, action}` — manual feed/water/med from app |
| POST | `/process` | run one autonomous vision step |
| GET | `/log` | activity history |
| WS | `/ws/feed` | live stream to app: frame / detection / decision / event / status |
| WS | `/ws/ingest` | camera bridge pushes frames in → fanned out to /ws/feed |
| WS | `/ws/robot` | legacy robot command channel |

### /enforce response

```json
{
  "allow": true,
  "action": "dispense",
  "robot_cmd": "feed",
  "reason": "Dispensing 45g for Banga.",
  "pet_name": "Banga",
  "food": "Pastrami"
}
```

### Robot UDP commands (sent to ROBOT_HOST:ROBOT_PORT)

| Payload | Meaning |
|---------|---------|
| `{"cmd": "feed"}` | Dispense food |
| `{"cmd": "protect"}` | Push food away |
| `{"cmd": "pick", "cup": "1"}` | Sort into cup 1/2/3 |

## Robot config (env vars)

```bash
ROBOT_HOST=127.0.0.1    # default — robot on same PC as backend
ROBOT_PORT=5006          # default
VIDEO_UDP_PORT=5007      # default — camera frames in
```

## Tests

```bash
pytest -q
```

## Key modules

```
app/
  main.py         FastAPI app, startup, WebSocket endpoints
  enforce.py      /enforce + /robot/command (own router, survives rewrites)
  robot_tcp.py    UDP client → robot (fire-and-forget)
  video_bridge.py UDP server on 5007 → broadcast frames to hub
  hub.py          in-process broadcast hub for /ws/feed
  store.py        pet state + SQLite persistence
  safety.py       feed interval + food allow-list enforcement
  orchestrator.py manual() + auto() feed flows
  scheduler.py    automation timer
  models.py       Pydantic models
data/
  pethero.db      SQLite (pets, events, state)
  pets.json       seed data
docs/
  LOCAL-SETUP.md  full local wifi demo guide
  API.md          extended API reference
```

## Local wifi demo

Backend + robot on teammate's PC, app on Henry's phone — same hotspot, no Railway.
Full guide: [`docs/LOCAL-SETUP.md`](docs/LOCAL-SETUP.md)
