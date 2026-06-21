# Local-wifi setup — App ⇄ Backend ⇄ Robot (no production deploy)

For dynamic testing, run the backend on the **same PC as the robot** and point the
phone app at that PC over wifi. No Railway, instant iteration.

```
 ┌─ Teammate's PC (wifi) ────────────────────────────────────────┐
 │  robot UDP listener : port 5006                                │
 │  backend            : uvicorn on 0.0.0.0:8000                  │
 │                                                                │
 │  phone ──HTTP─▶ :8000/enforce ──UDP─▶ :5006 (robot)           │
 │  robot camera ──UDP──▶ :5007 (video_bridge) ──WS──▶ phone     │
 └────────────────────────────────────────────────────────────────┘
        Henry's phone (same wifi) → http://<PC-LAN-IP>:8000
```

## Architecture (UDP)

The robot runs a **raw UDP listener on port 5006** that accepts one JSON datagram:

| Command | Effect |
|---------|--------|
| `{"cmd": "feed"}` | Dispense food to the cat |
| `{"cmd": "protect"}` | Push the food away |
| `{"cmd": "pick", "cup": "1"}` | Sort candy into cup 1/2/3 |

The backend decides (food rules + interval) then **pushes a UDP command to the robot**.
The phone never talks to the robot directly.

## 1. On the PC — start the robot UDP listener

Your robot controller must be listening on UDP port 5006.
Use your own UDP listener that handles the commands above.

## 2. On the PC — run the backend
```bash
cd pethero/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Find the PC's LAN IP (give it to Henry for the app):
- macOS: `ipconfig getifaddr en0`
- Linux: `hostname -I`
- Windows: `ipconfig` → IPv4 Address

Sanity check: `curl http://localhost:8000/status` → 200.

Override robot host/port if needed:
```bash
ROBOT_HOST=127.0.0.1 ROBOT_PORT=5006 uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 3. On the PC — run the vision pipeline (optional)
```bash
cd scripts/food_classifier
python camera_bridge.py --camera 0 --ws-url ws://localhost:8000/ws/feed
```

## 4. On the phone — point the app at the PC
```bash
# pethero/app/.env
EXPO_PUBLIC_PETHERO_HOST=<PC-LAN-IP>     # e.g. 192.168.1.42
```
Restart Metro / reload the dev build.

## 5. The end-to-end flow (MVP)
1. **App** → configure each cat: long-press a pet → `PetSettingsDrawer` → set allowed
   foods, portions, intervals → saves via `POST /pets/{id}/settings`.
2. **Robot** (or app manual button) calls `POST /enforce`:
   `{ pet_id, food_label, confidence }`.
3. **Backend** decides:
   - food not in that cat's allow-list → `push_away` + sends `{"cmd":"protect"}` over UDP
   - allowed but fed too recently → `push_away` + sends `{"cmd":"protect"}` over UDP
   - allowed + due → `dispense` + sends `{"cmd":"feed"}` over UDP
4. **Robot UDP listener** receives the command and actuates.
5. **App** live panel reflects the decision (broadcast over `/ws/feed`).

You can also drive the robot directly from the app:
```
POST /robot/command  {"cmd": "feed"}
POST /robot/command  {"cmd": "protect"}
POST /robot/command  {"cmd": "pick", "cup": "2"}
```

## Verified (local)
`/enforce` tested green on localhost with mock UDP robot:
- allowed + due → `dispense` + robot received `{"cmd":"feed"}` ✅
- food not in allow-list → `push_away` + robot received `{"cmd":"protect"}` ✅
- too soon → `push_away` + robot received `{"cmd":"protect"}` ✅
- direct `/robot/command pick cup 1` → `sent: true` ✅

## Notes
- UDP sends are fire-and-forget — a missing robot never crashes the backend.
- Backend persists pets + events to a local SQLite file (resets cleanly if deleted).
- Live camera stream (`/ws/feed` + `camera_bridge.py`) is the separate "livestream
  gateway" track — see `scripts/food_classifier/`.
