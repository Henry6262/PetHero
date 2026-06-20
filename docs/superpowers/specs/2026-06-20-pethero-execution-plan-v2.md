# PetHero — Execution Plan v2 (Battle Plan)

**Date:** 2026-06-20 (Updated)
**Event:** Hacklab Berlin hackathon — Hugging Face "Desk Hero" track
**Status:** 🔒 Ship-or-bust phase.
**Supersedes:** `2026-06-20-pethero-roadmap-execution-plan.md` (v1)
**Related:** `2026-06-20-pethero-design.md` (concept) · `2026-06-20-pethero-tech-stack-research-request.md` (research brief)

> This is the updated Battle Plan. It incorporates critical security context (avoid unauthenticated gRPC/pickle where possible), the power of the LeLab GUI, and the **Demo-First** mentality required for tonight. Stick to this plan to minimize hardware risk while maximizing "wow" factor for the judges.

---

## I. The Technical Stack (Security-Hardened)

| Layer | Recommendation | Key Change |
|---|---|---|
| **Vision** | YOLOv8n (local) + Zer0int-CLIP-L | Keep CLIP logic **local to your script**; do not use LeRobot's insecure async inference gRPC channels. |
| **Agent** | Mistral-small + `chat.parse()` | Use **`temperature=0`**. Keep all reasoning / structured output **within the Python process**. |
| **Robot** | LeLab (Browser GUI) | **Primary path.** Use the GUI to calibrate and record; avoid manual CLI integration if not needed. |
| **Backend** | FastAPI + WebSockets | Keep the API **local**. **Crucial:** add a `/mode/demo` flag in code to toggle between "Live Hardware" and "Video Replay." |
| **Frontend** | SwiftUI (Simulator) | Build for the **Simulator** to avoid provisioning headaches. Focus on UI state (Live vs. Demo). |

---

## II. Critical Path — The "Demo-First" Workflow

### Hours 0–2: Setup & Calibration
- Find the Hugging Face mentor (**LeRobot t-shirt**). Ask for a **pre-assembled, pre-calibrated arm** immediately.
- Open **LeLab in Chrome**. Perform the guided calibration.
- If calibration fails → move to **Video Replay** immediately. **Do not waste time debugging hardware assembly.**

### Hours 2–4: The Software Pipeline
- Build the core flow: **Camera → YOLOv8n (local) → CLIP (embeddings) → Mistral decision → UI**.
- Ensure this works with **zero robot connectivity**.
- If you can show this, you have a working "Desk Hero" project.

### Hours 4+: The "Wow" Layer
- Add the **Reasoning Panel** to the SwiftUI app. Stream the `reasoning` field from Mistral to the UI so judges can read **why** the AI made a decision.
- Implement the **Demo Mode toggle**: if hardware acts up, flip the switch to play the pre-recorded demo video.

---

## III. Hard Rules for Tonight

1. **Safety First (Architecture):** Avoid LeRobot's `PolicyServer` (gRPC/pickle) to prevent security vulnerabilities and race conditions. Keep your inference loop **synchronous within your own Python environment**.
2. **Visual Polish:** The **Reasoning Panel** is your "judge bait." Seeing the agent's thought process is **10x more impressive** than a simple "Dispense" button.
3. **The Dispense Rig:** Use the **"Paddle + Cup"** method. Low-tech, reliable, gravity-powered. Do not over-engineer a complex gripper mechanism.
4. **Connectivity:** **Assume venue WiFi will fail.** Cache all CLIP embeddings locally (`reference_vector` = average of 3 images per pet). The vision pipeline must run **offline**.

---

## IV. Sponsor Integration

| Sponsor | Action Item | Verdict |
|---|---|---|
| **Lovable** | Companion Dashboard | ✅ High ROI — build **only if** the iOS app is finished early. |
| **n8n** | Missed-Medicine Alert | 🟡 Backlog — build during "waiting" periods (e.g., while uploading a dataset). |
| **Apify** | N/A | ⛔ Skip — not relevant. |

---

## V. Emergency Mitigation — The "Fail-Safe"

**If the hardware fails during the demo:**
1. **Do not apologize.**
2. Flip the **"Demo Mode"** switch in the iOS app.
3. Continue the demo using the **video replay**.
4. **Narrative:** *"Our local inference agent detects the pet in real-time, but for the purpose of this demo, we're using our verified high-fidelity motion profile."*
   → Sounds professional and keeps the judges focused on your software.

---

**Let's win this. Keep the code simple, the UI responsive, and the hardware expectations managed. 🚀**
