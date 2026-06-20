# PetHero — Project Roadmap: "The Stack" & Execution Plan

**Date:** 2026-06-20
**Event:** Hacklab Berlin hackathon — Hugging Face "Desk Hero" track
**Status:** 🔒 Locked in. This is the high-level architecture and the mission-critical path for tonight.
**Related:** `2026-06-20-pethero-design.md` (concept) · `2026-06-20-pethero-tech-stack-research-request.md` (research brief)

---

## I. The Technical Stack

| Layer | Pick | Why It Wins |
|---|---|---|
| **Vision** | YOLOv8n (local) + Zer0int-CLIP-L | 40ms inference (offline); zero training needed via CLIP cosine similarity. |
| **Agent** | Mistral-small + `chat.parse()` | $0.10/M tokens; Pydantic-validated JSON for bulletproof outputs. |
| **Robot** | LeLab (Browser GUI) | One-command install; cuts calibration to 10 mins. HF-supported. |
| **iOS App** | SwiftUI + Simulator | Native WebSocket; bypasses Apple Developer / provisioning hurdles. |
| **Backend** | FastAPI | Unified Python ecosystem for all tools; <80 lines of code. |

---

## II. Critical Path — The "Ship Tonight" Strategy

### Hours 0–2: Hardware First
- Get the arm moving via **LeLab** immediately.
- Record **20 teleop episodes**.
- **Contingency:** If training fails, pivot to replaying these as a high-fidelity video demo.

### Hours 2–4: The Pipeline
- Bridge the end-to-end flow: **Camera → YOLO → CLIP → Mistral → iOS**.
- If the arm hardware fails, this **software-only pipeline is our primary demo**.

### Core Mechanic: The "Winner" Dispense
- **Don't over-engineer.** Use the proven strategy:
  - 3D-printed paddle taped to the gripper.
  - Pre-loaded cup.
  - **Wheat flour** as a food substitute.
- Let gravity do the work.

---

## III. Sponsor Integration & Efficiency

| Sponsor | Action Item | Verdict |
|---|---|---|
| **Lovable** | Generate dashboard UI | ✅ High ROI — Do it |
| **n8n** | Setup missed-medicine alerts | 🟡 Backlog — Do during downtime |
| **Apify** | N/A | ⛔ Skip — No current use case |

---

## IV. Risk Management

- **The Hardware Hedge:** If the arm dies, play our pre-recorded teleop video while running the live software pipeline in the background. It looks identical to the judges.
- **Mentor Strategy:** Locate the Hugging Face mentor (look for the LeRobot t-shirt) within the first 30 minutes. Secure a pre-assembled arm and walk them through this stack.

---

**Let's ship it. 🚀**
