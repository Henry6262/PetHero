# Research Request — PetHero Winning Tech Stack

**For:** a research agent (web-enabled, runs `deep-research`-style fan-out + verification)
**Requested by:** Henry, 2026-06-20
**Context doc:** `docs/superpowers/specs/2026-06-20-pethero-design.md` (read it first)
**Deadline pressure:** this is for a hackathon happening TONIGHT. Bias every recommendation toward "shippable by a small team in one night" and "demos live in front of judges."

---

## 0. What we're building (one paragraph)

**PetHero** — a robot pet-caretaker for a multi-pet household, entered in the Hugging Face **"Desk Hero"** track (solve everyday physical tasks with LeRobot). Pipeline: a **camera** sees which pet is present → a **Hugging Face vision model** identifies it → a **Mistral** agent decides what & how much to dispense (food / water / **medicine**) under hard safety rules → a **LeRobot SO-101 arm** physically dispenses → a **Swift / SwiftUI iOS app** controls and monitors everything. The full pipeline must demo on a phone photo with **zero hardware**; the robot arm is bonus.

---

## 1. The mission of this research

Tell us the **specific, current, best-in-class tech choices** for each layer that will (a) be buildable in one night by someone who is strong at software/AI but **has never done robotics**, and (b) maximize "wow" with judges from **Mistral AI** and **Hugging Face**, and (c) maximize eligibility for **sponsor prizes** (Mistral, Hugging Face, and the AI-track sponsors n8n / Lovable / Apify).

For every recommendation we need: the exact tool/model/library name, why it beats alternatives **for this specific use case and time budget**, a link to current docs/repo, and any gotcha that bites beginners. **Prefer primary sources** (official docs, GitHub repos, HF model cards) over blog hearsay, and **flag anything you can't verify is current as of June 2026.**

---

## 2. Research areas (answer each)

### A. Hugging Face vision — pet identification + scene state
- Best **current** HF model(s) for: (1) cat-vs-dog and general animal detection/classification, (2) ideally distinguishing *individual* pets (few-shot / fine-tune in an hour, or embedding-similarity), (3) stretch: detecting "bowl empty" / "water low" from a frame.
- **HF Inference API / Inference Providers vs running locally** — which is realistic on flaky venue wifi? Latency? Cost/free-tier limits? Auth setup time?
- Is there a path to **real-time webcam inference** (a frame every second or two) that's fast enough to feel live?
- Name specific model IDs and link their model cards. Note license.

### B. Mistral — the decision/agent layer
- Best **current Mistral model** for a small reasoning-over-rules task with **structured JSON output** (the dispense decision). Which model, what context window, what it costs.
- Does Mistral support **structured outputs / JSON mode / function calling / an Agents API** as of now? Exact API surface + a minimal code snippet. We need reliable structured output — describe the most reliable way to get it.
- How to get an API key and how long that takes. Free credits at hackathons?
- Anything that makes Mistral usage *visibly impressive* to Mistral judges (e.g. their agents framework, tool use, their newest model) — call it out, since using the sponsor's flagship well = prize points.

### C. LeRobot / SO-101 — the robot layer (BEGINNER, ONE NIGHT)
This is the highest-risk, highest-reward area. Be brutally realistic.
- What is the **fastest path** from "never touched a robot" to "arm performs a repeatable dispense motion" in a few hours? Compare: (1) **teleoperation + record/replay** a scripted motion, (2) running a **pretrained pick-and-place policy** (e.g. ACT), (3) hand-coded **joint-angle sequences**, (4) training a new policy (probably too slow — confirm).
- **LeRobot.js / LeLab (browser-based, WebSerial/WebUSB)** vs the **Python `lerobot` library** — which gets a beginner to a moving arm faster, and which integrates better with our backend? Pros/cons of each for one night.
- How does LeRobot **camera support** work, and can we get the *same* webcam frame into our HF vision pipeline AND the robot's view? (We want one camera serving both.)
- The realistic **physical dispense mechanism**: an SO-101 gripper isn't a food dispenser. What's the simplest rig — push a lever, tip a cup, drop a pre-loaded pill, press a pump? What have past LeRobot hackathon teams actually built for "dispense"-type tasks? Find examples.
- Setup time / dependency hell warnings (Python version, servo drivers, calibration). What to ask the on-site HF mentors for first.

### D. iOS app — Swift/SwiftUI, fastest path to a polished live demo
- Best **current** approach for a SwiftUI app that: shows a **live camera/video frame** (from the backend or device), has **manual trigger buttons**, and shows a **real-time activity log** streaming from the backend.
- Backend comms: **WebSocket vs SSE vs polling** from SwiftUI — recommend one and name the library (or URLSession native). Minimal snippet.
- Any libraries/components that make it look great fast (animations, status cards) without eating the night.
- **Critical practical question:** demoing a SwiftUI app on a physical iPhone at a venue needs a Mac + Xcode + provisioning. Is that realistic, or should the "app" be the iOS Simulator on the laptop? Recommend the lowest-friction way to *show* the app to judges. (If real-device provisioning is a time-sink, say so loudly.)

### E. Backend / orchestration glue
- **Python (FastAPI) vs Node/TS** for the orchestrator, given LeRobot and HF are Python-native but the app is Swift. Recommend one and justify for the time budget.
- Simplest way to expose the pipeline to the iOS app (REST + WebSocket for the live log). Name the framework.
- How to bridge backend → LeRobot (in-process Python call vs a separate robot-worker process). Simplest reliable pattern.

### F. Cross-track / sponsor-bonus opportunities (don't let these distract — just surface them)
- Can **n8n**, **Lovable**, or **Apify** be woven in for genuine value AND bonus eligibility without derailing the core build? Examples: Lovable to generate a companion web dashboard fast; n8n for the alert/automation flow (overdue-med notification); Apify if any web data is needed. Rate each as "worth it / skip" for this project.
- Map our pipeline to **named sponsor prizes** if you can find the event's prize list — which prizes is PetHero eligible for, and what would make us a stronger fit for each?

### G. The "wow" layer — what actually impresses these judges
- Research what has **won or stood out at recent Hugging Face LeRobot / Mistral hackathons** (2025–2026). What patterns do winning Desk Hero / robotics projects share? (Live physical action? Visible agent reasoning? A real safety story? Voice? A clean narrative?)
- Concrete, cheap additions that punch above their weight for demo impact (e.g. a live vision overlay showing the bounding box + label, the agent's reasoning streaming on screen, a voice announcement of each action). Rank by impact-per-hour.

---

## 3. Constraints to respect in every recommendation
- **One night, small team, robotics-novice.** If something realistically takes more than ~2–3 hours to stand up, say so and offer the faster fallback.
- **Demo-first.** The software pipeline must work with no hardware. Never recommend a path where a hardware failure = no demo.
- **Free / instant-signup tiers preferred.** Flag anything that needs a paid plan or slow approval.
- **Current as of June 2026.** Robotics + LLM tooling moves fast — verify versions and flag staleness.

---

## 4. Required output format
A single markdown report with:
1. **TL;DR stack table** — one recommended pick per layer (A–E) with a one-line "why", ready to act on.
2. **Per-area detail** (A–G) — recommendation, runner-up, why, doc link, beginner gotcha.
3. **"If you only do 3 things tonight"** — the three highest-leverage choices.
4. **Risk list** — the 3–4 things most likely to eat the night, each with a mitigation.
5. **Sources** — primary links, with a note on anything unverifiable.

Save the report to `docs/superpowers/specs/2026-06-20-pethero-tech-stack-findings.md`.
