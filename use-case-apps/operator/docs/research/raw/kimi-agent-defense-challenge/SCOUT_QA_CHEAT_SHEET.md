# SCOUT Q&A — Cheat Sheet
**Top 15 questions. One-sentence answers. Tape to your laptop.**

---

## TOP 10 (Memorize These)

**Q: How much does it cost?**
> "$567 to build. Compare to Boston Dynamics Spot at $75,000. We're 131 times cheaper."

**Q: Can it actually fly?**
> "Thrust-to-weight ratio of 5.94 to 1. That's double a DJI Mavic. The physics checks out."

**Q: What about jamming?**
> "Five layers. LoRa mesh, frequency hopping, AES-256, and fiber-optic tether as the nuclear option."

**Q: How is this different from a DJI drone?**
> "DJI flies but can't walk into buildings. SCOUT walks, flies, and hides in rubble."

**Q: Is the AI reliable?**
> "Sony IMX500 does person detection at 30 FPS on-chip. No cloud. But every action requires human confirmation."

**Q: Who's your competitor?**
> "Boston Dynamics builds robots. DJI builds drones. No one builds the coordination layer that ties them together."

**Q: What's your defensibility?**
> "The software, not the hardware. The shared map state is the IP. The robot is just a sensor."

**Q: What do you need the 3D printer for?**
> "To iterate the robot frame. Print the body, legs, rotor arms. Six iterations in one week."

**Q: How does this work without internet?**
> "868MHz LoRa mesh. 99.5% packet delivery through walls. Zero internet required."

**Q: Have you tested this in real conditions?**
> "The PiCrawler walks today. The dashboard works today. The VTOL is our 3-month prototype. The 3D printer gets us there."

---

## 5 HARDER ONES (If They Push)

**Q: The leg folding seems complicated. Will it jam?**
> "Based on DJI Inspire retractable landing gear — proven through millions of flight hours. We're prototyping it with the 3D printer."

**Q: Why should we believe your cost numbers?**
> "Every component is on Amazon right now. MG90S servo: $4. Raspberry Pi 5: $60. Sony IMX500: $70. I can show you the shopping cart."

**Q: What's stopping someone from copying this?**
> "The hardware is open. The IP is the shared state architecture — the map that lives across every robot, every operator, every command station. That's not trivial to replicate."

**Q: What about regulations?**
> "Under 25kg means exempt from heavy EU drone rules. Foam dart marker for demos. Every action is human-confirmed and logged."

**Q: Why not just buy existing military drones?**
> "A Switchblade costs $53,000 and it's single-use — crashes and it's gone. SCOUT is $567 and reusable. Fleet deployment becomes possible."

---

## PRINT THIS — TAPE IT

```
COST:       "$567. Spot is $75K. 131x cheaper."
FLY:        "5.94:1 thrust ratio. Double a DJI Mavic."
JAMMING:    "Five layers. Fiber optic can't be jammed."
VS DJI:     "DJI can't walk into buildings. We can."
AI:         "Sony IMX500. 30 FPS on-chip. Human-confirmed."
COMPETITOR: "No one builds the coordination layer."
DEFENSE:    "The shared map state is the IP."
PRINTER:    "Iterate the frame. Six versions in one week."
INTERNET:   "LoRa mesh. 99.5% through walls. Zero internet."
TESTED:     "PiCrawler walks today. Dashboard works. VTOL is 3-month target."
```

---

*One sentence each. Say it with confidence. If they ask more, point to the engineering paper.*
