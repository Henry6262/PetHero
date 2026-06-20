# PetHero — Autonomous Pet-Care Robot + iOS App

**Date:** 2026-06-20
**Event:** Hacklab Berlin hackathon (Mistral AI + Hugging Face sponsors)
**Target track:** Hugging Face **"Desk Hero"** — *solve local, everyday physical tasks with LeRobot*
**Status:** Design locked, ready to build

---

## 1. The one-breath pitch

> "Multi-pet households are a logistics nightmare — the cat eats the dog's food, someone forgets the 8am pill, the water bowl runs dry while you're at work. **PetHero is a robot caretaker.** A camera sees *which* pet walked up, an AI decides what that specific animal needs right now — food, water, or medicine — and a LeRobot arm physically dispenses the correct portion into the correct bowl. You run the whole thing from an iPhone app: set each pet's diet and meds schedule, watch what the robot sees, and get an alert the second something's off."

**Why this wins the Desk Hero track:**
- It is *exactly* the track brief: a robot doing a real, local, everyday physical task.
- It's emotionally legible — judges instantly get "robot feeds my cat." No explanation tax.
- Multi-pet + medicine = a genuinely hard, real problem (wrong pet eating wrong food / meds is dangerous), not a toy.
- Runs on the standard venue hardware (SO-101 arm + webcam) and **degrades gracefully to a software-only demo** if hardware flakes.

---

## 2. Scope (read this twice)

**In scope:**
- Multiple pet *types* in one household (e.g. a cat and a dog), distinguished by vision.
- Three dispense actions: **food**, **water**, **medicine**.
- An **iOS app (Swift / SwiftUI)** as the owner's control + monitoring surface.
- An AI decision layer that picks *what* to dispense and *how much*, with hard safety rules (never double-dose meds).
- A physical robot layer (LeRobot arm) that performs the dispense — **optional at runtime**, faked if no hardware.

**Explicitly out of scope (do NOT build):**
- AgroTrade / crops / escrow / blockchain — abandoned, irrelevant to the rules.
- Real pet-health diagnosis, vet integration, accounts/auth, payments.
- Training a custom robot policy from scratch (too risky for one night — use teleop + scripted moves or a pretrained pick-and-place policy).

---

## 3. Architecture — 4 stages, each swappable

```
[1] SENSE                [2] IDENTIFY            [3] DECIDE              [4] ACT
camera / webcam   →      HF vision model   →     Mistral agent     →    LeRobot arm
(or uploaded img)        which pet? + state       what + how much        dispense food /
                         (bowl empty? which       (rules + schedule       water / meds
                          animal present?)         + safety)              (or simulate)
                                                        │
                                                        ▼
                                              iOS app  ←──── live status, logs, alerts, manual triggers
```

Every stage is a clean module behind a simple interface so we can deepen whichever one the judges lean into, and so the robot stage can be a no-op stub when there's no hardware.

### Stage 1 — Sense
- **Default (no hardware):** owner taps "who's at the bowl?" or we feed a sample image / phone photo.
- **With hardware:** grab a frame from the **LeRobot webcam** (LeRobot has first-class camera support).
- Output: a single image (JPEG) + timestamp.

### Stage 2 — Identify (Hugging Face)
- Run the frame through a **HF Inference API** image model — no local GPU needed, works on venue wifi.
- Two questions answered:
  1. **Which pet is present?** (cat vs dog vs none). Start with a general image-classification / object-detection model; if time allows, fine-tune or few-shot to the specific household pets ("Whiskers" vs "Max").
  2. **(Stretch) Bowl/water state** — is the food bowl empty, is the water low? Simple image classifier or heuristic.
- Output: `{ pet: "cat"|"dog"|"unknown", confidence: float, bowlEmpty?: bool }`

### Stage 3 — Decide (Mistral)
- A **Mistral** agent receives: identified pet + that pet's profile (species, portion size, diet restrictions, med schedule, last-fed/last-dosed timestamps) + current time.
- It returns a **structured action** + a short human-readable reason:
  ```json
  { "action": "dispense", "items": [{"type":"food","grams":40},{"type":"medicine","pillId":"thyroid","count":1}],
    "target_bowl": "left", "reason": "Max is due for his 8am thyroid pill and hasn't eaten since 6pm yesterday." }
  ```
- **Hard safety rules enforced in code, not just the prompt:** never dispense meds twice within the schedule window; never give one pet's food/meds to another pet; cap portions. The agent *proposes*, the rules layer *vetoes*.

### Stage 4 — Act (LeRobot, optional)
- **With hardware:** the **SO-101 arm** performs a scripted/teleop-recorded motion — scoop food / press a water pump / drop a pill into the target bowl. For one night, prefer **scripted joint sequences or a pretrained pick-and-place policy** over training a new one.
- **Without hardware:** log the action, animate it in the app ("🤖 Dispensing 40g into left bowl…"), done. The demo still tells the full story.
- Output: action-completed event → back to the app + history log.

---

## 4. iOS app (Swift / SwiftUI)

Single owner-facing app. Talks to a small backend over HTTP/WebSocket; backend orchestrates stages 2–4.

**Screens:**
1. **Home / Live** — current camera frame (or last seen pet), big status ("Idle" / "🐱 Whiskers detected" / "Dispensing…"), and a manual **Feed / Water / Medicine** button row to trigger a dispense on demand.
2. **Pets** — list of pets; each pet has: name, species, photo, portion size, diet notes, **medication schedule**, last-fed / last-dosed timestamps.
3. **Activity log** — chronological feed of every decision + action with the agent's reason ("Skipped — Whiskers ate 1h ago"). This is the *trust* screen and a great demo beat.
4. **(Stretch) Alerts** — push/banner when a med is overdue, a bowl's been empty too long, or an unknown animal appears.

**Tech:** SwiftUI, async/await networking, a thin `PetHeroAPI` client. No auth for the demo (single household). Keep it one clean cinematic flow.

---

## 5. Backend (thin orchestrator)

A small service that the iOS app calls. Responsibilities:
- `POST /inspect` — takes/loads a frame → runs Stage 2 (HF) → Stage 3 (Mistral + safety rules) → Stage 4 (robot or stub) → returns the result and appends to the log.
- `GET /pets`, `PUT /pets/:id` — pet profiles + schedules.
- `GET /log` (or WebSocket) — activity stream for the app.
- Holds the **state** that makes safety possible: last-fed / last-dosed per pet.

**Language:** pick fastest-to-ship — Node/TS or Python. Python pairs naturally with HF + LeRobot (both Python-native) and is the HF-native choice; decide at build time. The robot driver (LeRobot) is Python, so a Python backend (or a small Python robot-worker the backend calls) is the path of least resistance.

---

## 6. What's real vs faked in the demo

| Stage | Guaranteed (software-only) | Bonus (if hardware on site) |
|---|---|---|
| Sense | uploaded / sample image | live LeRobot webcam frame |
| Identify | HF Inference API on the image | same |
| Decide | full Mistral agent + safety rules | same |
| Act | animated/logged in the app | **SO-101 arm physically dispenses** |

**The entire story demos with zero hardware.** The arm is pure upside.

---

## 7. Demo script (90 seconds)

1. Open app → Pets screen: "Whiskers the cat, Max the dog. Max needs a thyroid pill at 8am."
2. Hold a cat (photo/toy/real) up to the camera → app shows "🐱 Whiskers detected."
3. Agent reasons on screen: *"Whiskers — cat — last fed 5h ago, no meds due. Dispensing 40g cat food into the left bowl."* → (arm scoops) → log entry.
4. Now show the dog → *"Max — dog — thyroid pill is due. Dispensing 1 pill + 60g into the right bowl."* → action.
5. Show the dog **again immediately** → *"Skipped meds: Max was already dosed 20 seconds ago."* ← the safety beat that proves it's not a toy.
6. End on the Activity log: a clean, auditable record of every decision. "No human in the loop."

---

## 8. Build plan for the night (priority order)

1. **Backend skeleton + `/inspect` happy path** with Stage 4 stubbed (logs only). End-to-end on a hardcoded image.
2. **Stage 2 HF vision** — wire HF Inference API, cat-vs-dog working on real images.
3. **Stage 3 Mistral agent + safety rules** — structured output + the never-double-dose rule (this is the differentiator; make it solid).
4. **iOS app** — Home/Live + manual triggers + Activity log talking to the backend. (Pets screen can start as hardcoded profiles.)
5. **Pets screen editable** + WebSocket live log.
6. **Stretch — LeRobot arm**: once you've seen the venue hardware, wire a frame grab + a scripted dispense motion. Only after 1–4 are demoable.

**Rule:** keep a working, demoable build at every step. Never break the happy path chasing the arm.

---

## 9. Risks & mitigations

- **Never done robotics / hardware flakes:** software-only path is the primary demo; arm is bonus. Lean on on-site HF mentors for LeRobot/servo help.
- **Venue wifi kills HF Inference API:** cache a few pre-run results; have 2–3 sample images that are known to classify well.
- **One-night iOS scope creep:** Home + Log + manual triggers is the minimum lovable demo. Pets-editable and alerts are stretch.
- **Mistral hallucinating a dangerous dose:** safety is enforced in code (rules layer vetoes), never trusted to the prompt.

---

## 10. Naming
Working name **PetHero** (nods to "Desk Hero"). Alternatives: WhiskerBot, PawPantry, Critter Concierge, FeedMe. Rename freely.
