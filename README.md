# PetHero 🐾

> Autonomous cat-care robot — Hugging Face Desk Hero Hackathon, Berlin 2026

**Camera sees cat → AI classifies food → backend enforces rules → robot arm acts → app monitors live.**

---

## Demo

<!-- Drag your .mp4 here in the GitHub editor to embed it -->

---

## Architecture

```
 📷 Robot Camera
      │  JPEG frames (UDP :5007)
      ▼
 ┌─────────────────────────────────────┐
 │         FastAPI Backend             │
 │                                     │
 │  video_bridge ──► /ws/feed ──► 📱  │
 │                                     │
 │  POST /enforce                      │
 │    ├─ Which cat? (pet_id / vision)  │
 │    ├─ Food allowed? (rules)         │
 │    ├─ Fed recently? (interval)      │
 │    └─ ✅ {"cmd":"feed"} ──UDP──►   │
 │         ❌ {"cmd":"protect"} ──►   │
 └──────────────────┬──────────────────┘
                    │ WebSocket
                    ▼
              📱 iOS App
         live feed · config · controls

 🤖 Robot Arm ◄──UDP :5006── Backend
```

---

## Stack

| | |
|---|---|
| **Vision** | ResNet18 (food classification) |
| **Backend** | FastAPI · Railway · SQLite |
| **Transport** | UDP (robot commands + video) · WebSocket (app) |
| **App** | Expo · React Native · iOS |
| **Safety** | Rule-based enforcement — no LLM in the critical path |

---

## Run

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# App
cd app && npm install && npx expo run:ios

# Robot
cd scripts/pick_place
python step3_candy_vision.py && python step4_pick_place.py
```

Local wifi demo guide → [`backend/docs/LOCAL-SETUP.md`](backend/docs/LOCAL-SETUP.md)
