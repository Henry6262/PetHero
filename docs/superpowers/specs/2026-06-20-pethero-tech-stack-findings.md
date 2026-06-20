# PetHero — Winning Tech Stack Research (Findings)

**Research Date:** 2026-06-20
**For:** Hugging Face "Desk Hero" Hackathon (tonight)
**Team:** Small team, strong software/AI, zero robotics experience
**Mission:** Ship a demo-ready robot pet-caretaker in one night
**Status:** ✅ Researched & verified by Henry. This is the source-of-truth findings doc.

---

## TL;DR — The Stack (Act On This)

| Layer | Recommendation | One-Line Why |
|---|---|---|
| **Vision** | Zer0int-CLIP-L (HF) + YOLO26n (local) | CLIP embeddings distinguish individual pets; YOLO detects "pet present" + bowl state cheaply |
| **Agent/Decision** | `mistral-small-latest` + `chat.parse()` | $0.10/M tokens, 128k context, rock-solid JSON via Pydantic, zero latency overhead |
| **Robot** | LeLab (browser GUI) — teleop → record → replay | One-command install, zero CLI, calibrate + teleoperate in minutes |
| **iOS App** | SwiftUI + `URLSessionWebSocketTask` + backend MJPEG stream | Simulator shows backend-fed video feed; no device provisioning |
| **Backend** | FastAPI + `fastapi.WebSocket` | Python-native for HF + LeRobot, one codebase, REST + WS in ~80 lines |
| **Dispense Rig** | 3D-printed paddle + pill cup taped to gripper | #2 global hackathon team used this exact pattern for medicine sorting |

---

## A. Hugging Face Vision — Pet ID + Scene State

### A.1 The Two-Model Strategy
Three jobs: (1) detect a pet is present, (2) identify *which* pet, (3) read the environment (bowl empty/water low). One model can't do all three well in one night → **fast detector + accurate embedder**.

- **Detection** ("cat or dog in frame?"): **YOLO26n** locally via `ultralytics`. 2.4M params, ~38.9ms CPU (640×640), native COCO "cat"/"dog". Offline, no API. `pip install ultralytics` → `YOLO("yolo26n.pt")` caches locally.
- **Individual ID** ("this is Mittens, not Whiskers"): **AvitoTech/Zer0int-CLIP-L-for-animal-identification** via HF Inference API. 768-dim embeddings; 87.68% Top-1 on cats, 62.89% on dog faces — plenty for 2–4 pets. Flow: YOLO crops pet → send crop to CLIP → cosine-similarity vs stored reference embeddings (computed once from 2–3 photos/pet). **No fine-tuning.**

| Model | Role | Size | Speed | Best For |
|---|---|---|---|---|
| YOLO26n | Detection + crop | 2.4M | ~39ms CPU | "Is there a pet?" + bbox |
| Zer0int-CLIP-L | Individual ID | ~300M | ~200ms via HF API | "Which pet is this?" |
| SigLIP2-Giant (stretch) | Individual ID (better) | ~1B | ~500ms via HF API | Higher accuracy if latency OK |

### A.2 "Bowl Empty / Water Low"
Stretch. Don't train. Use **YOLOE-26** open-vocab with `model.set_classes(["empty bowl","water bowl","food bowl"])`. Fallback: `mistral-large-latest` (multimodal) classifies bowl state from a crop in the agent layer.

### A.3 HF Inference API vs Local — the WiFi question
**Demo must work offline.** Run YOLO26n locally (instant). Use HF API only for the CLIP call, cache aggressively (precompute all registered-pet embeddings at setup, in-memory). If WiFi dies → fall back to "generic cat/dog" mode (skip individual ID, still dispense safely). HF free tier: a few hundred req/hr, models <~10B params (CLIP-L fits). PRO is $9/mo if limits bite.

| Approach | Latency | Offline? | Cost | Setup |
|---|---|---|---|---|
| YOLO26n local | 40ms | Yes | Free | `pip install ultralytics` |
| CLIP-L via HF Serverless | 100–300ms | No | Free tier | HF token (2 min) |
| CLIP-L via HF Inference Providers | 50–150ms | No | $0.10 free credits | Same token |
| Everything via transformers local | 2–5s | Yes | Free | ~500MB download |

### A.4 Real-Time Webcam
A frame every 1–2s is achievable. OpenCV capture → YOLO (40ms) → if pet, crop + CLIP API (200ms) → backend → iOS. ~300–500ms/frame with network, ~50ms offline. Use a background thread so camera loop is independent of API latency.

### A.5 Beginner Gotcha
`ultralytics` is **AGPL-3.0** — fine for a demo, needs Enterprise license or a swap if it becomes a product. First `YOLO("yolo26n.pt")` downloads ~6MB weights; do it **before** the demo.

---

## B. Mistral — The Decision / Agent Layer

### B.1 Model: `mistral-small-latest`
| Spec | Value |
|---|---|
| Context | 128k |
| Input | $0.10 / 1M |
| Output | $0.30 / 1M |
| Structured output | Native via `chat.parse()` |
| JSON mode | Yes (but `chat.parse()` more reliable) |
| Function calling | Yes |

~500 tok in / ~150 tok out per decision → a few hundred calls < $0.01. Fast, cheap, overkill = reliable. Runner-up `mistral-large-latest` ($0.50/$1.50) only if you need multimodal vision for bowl state.

### B.2 Structured Output — the reliable way
Always use **`chat.parse()` with a Pydantic model** (schema-validated server-side), not raw JSON mode.

```python
from pydantic import BaseModel
from mistralai import Mistral
import os

class DispenseDecision(BaseModel):
    pet_name: str
    action: str  # "feed" | "water" | "medicine" | "none"
    amount_grams: float
    medicine_name: str | None
    safety_override: bool
    reasoning: str

client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))
response = client.chat.parse(
    model="mistral-small-latest",
    messages=[
        {"role": "system", "content": "You are a pet care safety agent..."},
        {"role": "user", "content": f"Pet detected: {pet_name}. Schedule: {schedule}. Last fed: {last_fed}."},
    ],
    response_format=DispenseDecision,
    temperature=0,  # deterministic for safety
)
decision = response.choices[0].message.parsed  # typed Pydantic object
```
`temperature=0` is critical for safety decisions — consistency, not creativity.

### B.3 Agents API — the "wow" for Mistral judges
Mistral Agents API (May 2025) adds built-in **web search**, **code execution**, image gen, document RAG, **MCP tools**. The Tokyo hackathon winner used 8+ structured JSON schemas (strict mode) + an agent swarm and won "Best Use of Agent Skills". For one night, the simplest impressive add is **`web_search`**: when deciding on medicine, the agent searches "can cats take ibuprofen" and cites sources. Judges love visible reasoning with citations.

### B.4 API Key & Credits
console.mistral.ai, free tier, instant key after email verify. **Ask on-site Mistral mentors for event credits first.**

### B.5 Beginner Gotcha
`temperature=0` for safety-critical output. `chat.parse()` needs `mistralai` SDK v1.0+ (old `MistralClient` won't work). `pip install mistralai`.

---

## C. LeRobot / SO-101 — The Robot Layer (Beginner, One Night)

### C.1 Reality Check
Assembly + calibration + first motion ≈ 1–2 hrs for a first-timer. **Hardware failure cannot mean demo failure.** Software pipeline must work with zero hardware (phone photo input). Arm = bonus that elevates "cool app" → "holy cow, a robot".

### C.2 Fastest Path: LeLab (browser GUI)
```bash
uv tool install git+https://github.com/huggingface/leLab.git && lelab
```
Guided calibration (web), teleoperation w/ 3D viz, spacebar dataset recording, one-click training (local or HF Jobs), inference replay. Compresses "never touched a robot → moving arm" from hours to minutes. Open in Chrome, calibrate (~10 min), teleoperate immediately.

### C.3 LeRobot.js vs Python `lerobot`
| Approach | Best For | Backend Integration | Setup |
|---|---|---|---|
| LeLab (GUI) | Quick teleop, recording, training | Manual (browser) | 10 min |
| LeRobot.js (`@lerobot/web`) | Browser control, WebSerial | Separate from Python; harder | 15 min |
| Python `lerobot` | Full pipeline, scripted motions | In-process from FastAPI | 30–60 min |

**Use LeLab for the hackathon.** Python lib is the production integration path.

### C.4 Dispense Mechanism — what actually works
SO-101 = simple parallel-jaw gripper, can't dispense natively. The #2 global team (medicine sorting) used a **3D-printed paddle taped to the gripper**: print a paddle/scoop (or cardboard+tape), tape to jaws, pre-load pills/candy in a cup by the bowl, teleop the arm to tip the cup (record 20–30 episodes), train ACT, run inference. Used **wheat flour** as pill substitute (dry, non-sticky); reliable after 35 episodes. Water is harder — small pump on a GPIO pin (needs a Pi) or skip water for the demo. **No-printer alt:** hinged-bottom container; arm pushes a stick that opens it; gravity dispenses (arm only pushes, doesn't scoop).

### C.5 Camera Sharing — one camera, two pipelines
```python
import cv2
cap = cv2.VideoCapture(0)
ret, frame = cap.read()
detection = yolo(frame)        # vision pipeline
lerobot_record_frame(frame)    # dataset recording
```
LeRobot's dataset format stores frames alongside joint positions; same webcam serves both.

### C.6 Realistic One-Night Timeline
| Phase | Time | Fallback |
|---|---|---|
| SO-101 assembly (if needed) | 45–90 min | Ask venue for pre-assembled |
| Calibration (LeLab) | 10–15 min | Saved calibration file |
| Teleop + record 20 episodes | 30 min | Skip training, replay teleop |
| Train ACT (HF Jobs cloud GPU) | 30–60 min | Use replay instead |
| Backend integration | 30 min | Mock arm in software |
| **Total hardware time** | **2–4 hrs** | **Software demo works without any of this** |

**Critical mitigation:** pre-record a teleop session at home; if the arm fails at the venue, play the recording while the software pipeline runs live.

### C.7 Beginner Gotchas
- Motor numbering: 12 motors, different gear ratios — **label before assembly**.
- Linux USB perms: `sudo chmod 666 /dev/ttyACM*`.
- WiFi uploads fail (winner lost time) — upload manually, not auto-push.
- Camera disconnections (winner lost 16 episodes) — check cables repeatedly.
- **Python 3.10 required**: `conda create -n lerobot python=3.10`.

---

## D. iOS App — SwiftUI, Fastest Path to Polished Demo

### D.1 Architecture: Backend-Fed Video Stream
Don't use the iPhone camera. Webcam → backend (laptop) → vision pipeline → annotated frame streamed to iOS as MJPEG/WebSocket bytes. Avoids camera permissions, AVFoundation complexity, device provisioning. The app is a **dashboard**: live frame (w/ bbox), agent decision card (what/how much/why), manual triggers, real-time activity log (WebSocket).

### D.2 WebSocket from SwiftUI
`URLSessionWebSocketTask` (iOS 13+, no 3rd-party lib):
```swift
import SwiftUI

class WebSocketManager: ObservableObject {
    @Published var lastFrame: UIImage?
    @Published var activityLog: [String] = []
    private var webSocketTask: URLSessionWebSocketTask?

    func connect() {
        let url = URL(string: "ws://backend-ip:8000/ws/feed")!
        webSocketTask = URLSession.shared.webSocketTask(with: url)
        webSocketTask?.resume()
        receiveMessage()
    }

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                if case .data(let imageData) = message {
                    self?.lastFrame = UIImage(data: imageData)
                } else if case .string(let text) = message {
                    self?.activityLog.append(text)
                }
                self?.receiveMessage()
            case .failure(let error):
                print("WebSocket error: \(error)")
            }
        }
    }
}
```

### D.3 Simulator vs Device
**Use the iOS Simulator.** No camera needed (backend provides video), runs on the Mac, shows all UI. No Apple Developer account / provisioning. Physical device only if time permits (free Apple ID → 7-day cert, irrelevant for a 12-hr hackathon).

### D.4 Polish Fast
SwiftUI built-ins get 90%: `AsyncImage`/`Image(uiImage:)`, `RoundedRectangle`+shadow cards, `List` + `.refreshable`, `withAnimation(.spring())`, SF Symbols (`pawprint.fill`, `drop.fill`, `pills.fill`). No 3rd-party UI libs.

### D.5 Beginner Gotcha
Simulator can't run WebSocket in canvas preview — build & run (Cmd+R). Hardcode the backend IP (skip Bonjour/mDNS).

---

## E. Backend / Orchestration Glue

### E.1 FastAPI — the only sensible choice
Whole pipeline is Python-native (YOLO, Transformers, Mistral SDK, LeRobot). REST + native WebSocket + async + auto Swagger (`/docs`) + shared Pydantic.
```python
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    await websocket.accept()
    while True:
        frame = await camera.capture()
        detection = yolo(frame)
        pet_id = await identify_pet(frame) if detection else None
        decision = agent.decide(pet_id) if pet_id else None
        await websocket.send_bytes(annotated_frame)
        await websocket.send_json(decision.model_dump())
```

### E.2 Bridging Backend → LeRobot
Decouple. Options: (1) in-process Python call (`from lerobot import ...`, same env), (2) HTTP trigger to LeLab endpoints, (3) **mock with logging** — reliable path for one night.

### E.3 Beginner Gotcha
LeRobot needs Python 3.10 + specific conda env. Don't install it in the same env as FastAPI without testing — use separate envs + HTTP between them if needed.

---

## F. Cross-Track / Sponsor-Bonus

| Sponsor | Integration | Effort | Value | Verdict |
|---|---|---|---|---|
| **n8n** | Alert: "Mittens missed meds" → webhook → Slack/email | 30 + 15 min | n8n prize eligible | Worth it — build during downtime |
| **Lovable** | Companion web dashboard | 15 min | Lovable prize + 2nd surface | **Worth it — highest ROI** |
| **Apify** | No web-data need | — | Low | Skip |

- **Lovable:** lovable.dev → prompt "pet care dashboard: live camera feed, pet status cards, dispense log, dark mode" → connect FastAPI → deploy ~10 min. Free tier 5 msgs/day = enough for one app.
- **n8n:** n8n Cloud free (2,500 exec/mo). Webhook from FastAPI → Slack/email. Show the workflow diagram during judging.

### Prize Mapping (inferred)
| Prize | Fit | Strengthen With |
|---|---|---|
| Desk Hero (HF) | Direct | Live arm motion + vision pipeline |
| Best Use of Mistral | Strong | Agents API + web_search, visible reasoning |
| Best Agent Skills (HF) | Strong | Tool use, safety rules, citation |
| Best Vibe Coder | Moderate | Polished SwiftUI + LeLab |
| n8n Best Automation | Moderate | Visible n8n workflow |
| Lovable Best App | Moderate | Companion dashboard |

---

## G. The "Wow" Layer

### G.1 Winning Patterns
LeRobot #2 winner (medicine sorting + shirt folding): everyday relatable task, **live physical action**, visible pipeline (robot-POV cameras, training logs), personal story ("help my grandfather"), released on HF. Mistral Tokyo winner: 8+ strict JSON schemas, 4-actor agent swarm, **real-time agent-trace overlay**, demo mode with cached responses.

### G.2 Impact-Per-Hour
| Addition | Impact | Hrs | Impact/Hr | How |
|---|---|---|---|---|
| Vision overlay (bbox + pet name) | High | 0.5 | Very High | Draw rect+label on frame before sending to iOS |
| **Agent reasoning stream** | Very High | 0.5 | Very High | Stream `reasoning` field to UI live |
| Voice announcement | Medium | 1 | Medium | iOS `AVSpeechSynthesizer` |
| Safety rules visualization | High | 0.5 | Very High | Show hardcoded rules on screen |
| Live arm motion | Very High | 2–4 | Medium | Peak moment if hardware works |
| Companion web dashboard (Lovable) | Medium | 0.5 | Very High | 10-min generation, 2nd surface |
| n8n alert workflow | Low-Med | 0.5 | Medium | Nice to show, not core |

### G.3 The Demo Script That Wins
1. Problem: "My aunt has three cats and a dog. She mixes up food, forgets medicine, worries when traveling."
2. Camera feed: pet appears, bbox draws, "Mittens — 87% confidence".
3. Agent reasoning: "Mittens last fed 6h ago. Schedule: 50g dry food. No medicine due. Safe to dispense."
4. Trigger: tap → arm moves (or video) → food dispenses.
5. Log: "14:32 — Dispensed 50g food to Mittens. Reason: scheduled feeding."
6. **Safety moment:** medicine requested but refused — "Ibuprofen detected. Toxic to cats. Dispense blocked."
7. **Mistral moment:** "Agent can search the web for pet care guidelines in real-time" → show `web_search` cite.

---

## If You Only Do 3 Things Tonight
1. **Ship the software pipeline end-to-end** (camera → YOLO → CLIP → Mistral → iOS). Your whole demo if hardware fails. Working by hour 4.
2. **Use `chat.parse()` + Pydantic and stream the `reasoning` field to the UI.** Makes the agent visible, typed, impressive to HF + Mistral judges.
3. **Get the arm moving via LeLab in the first 2 hours** (calibrate + teleop a tip motion, record 20 episodes). If training fails, replay the recording as video.

## Risk List
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hardware fails/breaks | Medium | Demo-killer | Software works without it; pre-record teleop video |
| Venue WiFi dies | High | API calls fail | YOLO offline; cache embeddings; mock HF responses |
| LeRobot setup >3h | Medium | Eats coding time | LeLab 10-min calibration; ask mentors for pre-calibrated arm |
| iOS provisioning | Low (Simulator) | Can't demo app | Use Simulator |
| Mistral rate limits | Low | Decisions fail | temperature=0 + caching; free tier generous |

## Unverifiable as of 2026-06-20
- Exact "Desk Hero" prize list (check Devpost/Discord).
- Whether Mistral provides free credits at this event (likely; confirm on-site).
- Whether LeLab supports the venue's exact SO-101 variant (currently supports SO-ARM101).

**Final advice:** Find the HF mentor with the LeRobot t-shirt in the first 30 minutes. Ask for a pre-assembled, pre-calibrated arm. Show them this stack — they'll point you to the fastest path.
