# 🚀 AMD Developer Hackathon 2026

**Organizer:** LabLab.ai + AMD  
**Prize Pool:** $20,000 USD + Radeon™ GPU + AMD Developer Cloud credits  
**URL:** https://lablab.ai/ai-hackathons/amd-developer

## 📅 Key Dates (VERIFIED)
- **Registration Deadline:** May 3, 2026 (CLOSED)
- **Kick-off / Hacking Start:** May 4, 2026 (LIVE NOW)
- **Submission Deadline:** May 10, 2026 ~12:00 PM PDT (check Event Schedule tab on lablab.ai for exact TZ)
- **Optional In-Person Finale:** May 9–10, 2026 — San Francisco, CA
- **Winners Announced:** Shortly after finale

## 🛠️ End-to-End Requirements

### Hardware Mandate
- Must utilize **AMD AI Developer Cloud** OR local **AMD ROCm** enabled hardware (Instinct™ / Radeon™).
- $100 in AMD Developer Cloud credits provided to accepted participants.

### Tech Stack
- **Training:** PyTorch / Hugging Face (ROCm-enabled).
- **Models:** Qwen is an official ecosystem partner. Fine-tuning track strongly encouraged.
- **Deployment:** Public GitHub repo (MIT-compliant), working demo app URL.

### Submission Checklist
- [ ] Project Title + Short/Long Description
- [ ] Technology & Category Tags
- [ ] Cover Image (📸)
- [ ] Video Presentation (5 min max typical)
- [ ] Slide Presentation
- [ ] Public GitHub Repository
- [ ] Demo Application URL / Hosting Platform
- [ ] Application of Technology explanation

### Judging Criteria
1. **Application of Technology** — How effectively chosen model(s) are integrated.
2. **Presentation** — Clarity and effectiveness of pitch.
3. **Impact & Practical Value** — Business/real-world fit.
4. **Uniqueness & Creativity** — Novel approaches and demonstrated behaviors.

### Partners / Mentors
AMD, MindsDB, Hugging Face, Akash Systems, NYSE Wired, theCUBE, Qwen.

## 🏗️ Project: SwarmOps
- **Mission:** High-performance AI training pipeline for token market intelligence.
- **Track:** Models & Training / Fine-Tuning LLMs.
- **Implementation Roadmap:**
    1. **[X] Dataset Gen (Rust):** `tools/dataset-gen` → 33K SFT + DPO pairs from on-chain outcomes.
    2. **[X] ROCm Training Script:** `tools/training/train_qwen_rocm.py` with LoRA/QLoRA + benchmarking.
    3. **[ ] Execute Training:** Run on AMD Developer Cloud credits or local ROCm hardware.
    4. **[ ] Benchmark:** Compare fine-tuned conviction vs base model on held-out signals.
    5. **[ ] HF Space:** Deploy ROCm-optimized container for live demo.
    6. **[ ] Video Pitch:** 3-min end-to-end pipeline demo for judges.

---
*Status: 🔴 LIVE. Dataset + pipeline shipped. Next: Execute training run on AMD hardware.*
