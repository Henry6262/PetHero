# PetHero Backend

FastAPI orchestrator for the PetHero iOS app. Pipeline:

```
vision.identify()  →  agent.decide()  →  safety.evaluate()  →  dispense.record()  →  store
   (which pet?)        (Mistral/rules)    (code-enforced)        (intent log)         (state)
```

**Boots with stubs.** No ML deps and no API keys required — the iOS app gets a
live endpoint immediately. Real vision/agent light up when you install the extras
and set keys. **There is no robot/hardware code here** (out of scope for now); the
dispense step only records *intent* for the app to render.

## Run

```bash
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Swagger UI: http://localhost:8000/docs
```

Find your Mac's LAN IP (`ipconfig getifaddr en0`) and point the iOS app at
`ws://<that-ip>:8000/ws/feed`.

## Test

```bash
source .venv/bin/activate
pytest -q                 # safety rules (the trust-critical layer)
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/status` | mode + which backends are live (stub vs real) |
| GET | `/pets`, `/pets/{id}` | pet profiles + schedules |
| GET | `/log` | activity history |
| POST | `/mode` | `{ "mode": "demo" \| "live" }` toggle (UI label; no hardware) |
| POST | `/vision/current?pet_id=mittens` | demo control: declare who's at the bowl |
| POST | `/process` | run one autonomous step on the current frame |
| POST | `/trigger` | `{ pet_id, action, medicine_name? }` — owner button press |
| WS | `/ws/feed` | live stream: `status` / `detection` / `decision` / `event` / `frame` envelopes |

### WebSocket envelopes
Every message is JSON with a `type`:
- `status` — `SystemStatus`
- `detection` — `Detection` (`present`, `pet_name`, `confidence`, `bbox`)
- `decision` — `DispenseDecision` (the agent's proposal + **`reasoning`** ← reasoning panel)
- `event` — `ActivityEvent` (final verdict: `allowed`, `reason`, `rule`)
- `frame` — `{ "jpeg_b64": "..." }` (decode → `UIImage`)

## Lighting up the real pipeline
- **Mistral agent:** `pip install mistralai`, set `MISTRAL_API_KEY` → `/status` shows `agent_backend: mistral`. Falls back to rules on any error.
- **YOLO vision:** `pip install ultralytics opencv-python` → `vision_backend: yolo+clip` (detection wiring is a later step; stub stays the demo driver).
- **Camera:** set `PETHERO_CAMERA=/path/to/pet.jpg` to use a real image as the feed.

## Safety model
The agent only *proposes*. `app/safety.py` (fully unit-tested) makes the call and
**vetoes** unsafe dispenses: double-dosing, un-prescribed or species-toxic meds,
cross-pet meds, over-portion (clamped), feeding too soon, and any action on an
unidentified pet (water only). This is the demo's trust story — never trust the LLM
with a dose.
