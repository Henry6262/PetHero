# 🐾 PetHero

Autonomous robot pet-caretaker — for the Hugging Face **"Desk Hero"** hackathon (2026-06-20, Berlin).

A camera sees **which** pet is present → a Hugging Face vision model identifies it → a **Mistral** agent decides what & how much to dispense (food / water / **medicine**) under hard, code-enforced safety rules → a **LeRobot SO-101 arm** physically dispenses it → a **SwiftUI iOS app** controls and monitors everything.

> The full software pipeline runs **with zero hardware** (phone photo / sample frame as input). The robot arm is bonus.

## Layout

```
pethero/
  backend/   FastAPI orchestrator — vision → agent → safety → dispense, REST + WebSocket
  ios/       SwiftUI app (Simulator-first) — dashboard + reasoning panel  [next]
```

## Docs

Design, research, and the ship-tonight battle plan live in the repo root:
`docs/superpowers/specs/2026-06-20-pethero-*.md`

## Quick start (backend)

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# open http://localhost:8000/docs
```

The backend boots and serves the full API **with stubs** before any heavy ML deps are installed — so the iOS app has a live endpoint immediately. Install the optional extras (YOLO, Mistral, OpenCV) to light up real vision/agent/camera. See `backend/README.md`.
