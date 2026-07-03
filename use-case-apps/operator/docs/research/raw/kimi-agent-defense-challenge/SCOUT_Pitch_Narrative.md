# SCOUT C2 — Pitch Narrative & Delivery Guide
**3-Minute Hackathon Pitch | EDTH Munich 2026**

---

## THE CORE NARRATIVE (Memorize This)

**One sentence:** SCOUT C2 is a tactical command platform where one operation manager sees everything — robots, drones, operators, building states — on one shared map, and every soldier sees the same picture on their phone.

**The problem:** Soldiers walk into buildings blind. Urban warfare kills 4.5% of your force every day. Ukraine sees 50,000 jam-proof drones per month — but no one coordinates them.

**The solution:** Cheap robots that walk and fly, sharing everything they see in real time.

**The ask:** A 3D printer to iterate from a $280 kit to a $552 VTOL hexapod.

---

## 3-MINUTE PITCH SCRIPT

### Slide 1: The Hook (0:00-0:10)

**Visual:** Dark photo of soldier entering bombed building. Or: AI-generated image of robot in rubble.

**Script:**
> *"Every day in Ukraine, soldiers enter buildings like this with no idea what's inside. 4.5% of them don't come back. That's not my number — that's the UK Defence Science and Technology Laboratory, analyzing 145 battles."*

**Pause. Let the number land.**

---

### Slide 2: The Problem (0:10-0:25)

**Visual:** Split screen. Left: soldier walking blind. Right: dashboard showing "NO DATA."

**Script:**
> *"Three problems. One: no intel — the building is a black box. Two: comms are jammed — Ukraine faces 600+ drone attacks daily, electronic warfare everywhere. Three: the soldier is the probe — he finds IEDs by stepping on them."*

> *"Both sides have thousands of drones. Russia makes 50,000 fiber-optic drones per month. But watch any combat footage — every operator flies solo. No shared map. No coordination."*

---

### Slide 3: The Robot (0:25-0:45)

**Visual:** AI-generated image of SCOUT-Mini hexapod (walking mode). Or: PiCrawler with 3D printed parts on table.

**Script:**
> *"This is SCOUT-Mini. Six legs. 1.3 kilograms. $552 to build."*

> *"Six legs means static stability — three on the ground at all times. Can't tip over. Walks for 107 minutes on one battery."*

> *"The Sony IMX500 camera — seventy dollars — sees and thinks on its own. Person detection at thirty frames per second, zero CPU load, no cloud, no internet."*

> *"When it hits rubble it can't cross, the legs fold, rotors deploy, and it flies over. Terrain-hop. Validated by Nature-published research on bird-inspired jump-to-flight robots."*

**If showing PiCrawler prop:**
> *"This is our starting point — a $280 kit. The 3D printer turns it into this."* [Show Mini render]

---

### Slide 4: The Dashboard (0:45-1:15)

**Visual:** Screen recording of tactical_map_demo.html. Click a room, it changes color.

**Script:**
> *"This is the command dashboard. Every room has a state. Gray: unknown. Yellow: in progress. Green: cleared. Red: person detected."*

> *"The robot enters Room 102. The room turns yellow. AI detects a person — prone posture. Room turns red. Alert fires."*

**[Click room, show color change, show alert]**

> *"The admin clicks 'Flag for Rescue.' Room turns blue. Every operator's phone gets a push notification: 'Person detected in Room 102. Rescue team assigned.'"*

> *"Same map. Same state. No radio confusion. No fog of war."*

---

### Slide 5: The Configs (1:15-1:30)

**Visual:** Three small images side by side — RECON (camera mast), RESCUE (medical pod), MARKER (foam dart launcher).

**Script:**
> *"Three mission configs, hot-swappable. Recon: 360-degree camera scanning. Rescue: medical supply pod for civilian recovery. Marker: foam dart launcher for target designation — non-lethal, human-confirmed, every shot logged."*

> *"No weapons. No autonomous lethal. Human-in-the-loop for everything."*

---

### Slide 6: The Anti-Jam Stack (1:30-1:45)

**Visual:** 5-layer diagram (simplified).

**Script:**
> *"What about jamming? Five independent layers. Fiber-optic tether — physically can't be jammed, Ukraine proved this. Frequency hopping — dodges interference. Mesh network — self-healing, no single point of failure. AES-256 encryption. And inertial navigation when GPS is dead."*

> *"Even if three layers fail, you're still operational."*

---

### Slide 7: The Vision (1:45-2:00)

**Visual:** AI-generated image of SCOUT-Mini flying over rubble. Or: before/after comparison (PiCrawler kit → tactical unit).

**Script:**
> *"Today: PiCrawler kit, $280, walks rooms, streams video. Next month: 3D printed hexapod frame, six legs, walks and flies. Next year: carbon fiber everything, heavy payload, professional deployment."*

> *"The 3D printer isn't just a tool. It's our manufacturing line. Print. Test. Improve. Hours, not weeks."*

---

### Slide 8: The Ask (2:00-2:15)

**Visual:** 3D printer (Bambu Lab). Text: "$549. The tool that validates everything."

**Script:**
> *"We're asking for a 3D printer. Not because we want to print toys. Because it's the only way to iterate a robot chassis fast enough to keep up with the software."*

> *"Print the body. Print the legs. Print the rotor arms. Print the folding hinges. Test. Break. Print again. Six iterations in a week. That's how you go from a kit to a product."*

---

### Slide 9: The Close (2:15-2:30)

**Visual:** Team photo + logo. Tagline: "SCOUT C2. The map has state."

**Script:**
> *"Ukraine and Russia have the sensors. They don't have the software to coordinate them. SCOUT C2 is that software — with a robot that costs less than a DJI Mini."*

> *"SCOUT C2. The map has state. Your team has context."*

**End. Silence. Let it land.**

---

## DELIVERY RULES (From Judge Feedback)

| Rule | Before (What You Did) | After (What To Do Now) |
|------|----------------------|----------------------|
| **Speed** | 10 slides in 3 minutes = 18 sec/slide | 9 slides, ~20 sec each |
| **Info density** | 5 robot variants, 3 modes, full architecture | 1 robot, 3 configs, 1 dashboard |
| **Language** | Technical jargon (TWR, FHSS, SLAM) | Plain English ("The robot flies over rubble") |
| **Sentences** | Long, complex, multiple clauses | **Short. Discrete. One idea per sentence.** |
| **Examples** | Abstract concepts | Real soldier scenario (Ukraine, building clearing) |
| **Numbers** | No data cited | "4.5% casualty rate, 50,000 drones/month, $552" |
| **Eye contact** | Reading slides | **Talk to the judges, not the screen** |

---

## QUICK-REFERENCE: ANSWERS TO LIKELY QUESTIONS

### Technical Questions

| Question | 15-Second Answer | Backup Data |
|----------|-----------------|-------------|
| *"How much does it cost?"* | *"$552 to build the Mini. $3,900 for the heavy-duty Elite. The C2 software is the product — the robot is just the sensor."* | Spot costs $74,500. Vision 60 costs $150K. |
| *"Can it actually fly?"* | *"TWR of 5.01:1 — that's double a DJI Mavic. Six motors producing 6.6 kilograms of thrust for a 1.3-kilogram robot."* | DJI Mavic 3 TWR: ~2.5:1. Industry minimum: 2.0:1. |
| *"What about the leg folding?"* | *"DJI Inspire proved retractable landing gear works. We're scaling that to six legs. Currently prototyping with the 3D printer."* | XM2 SLG-20, Actuonix linear servos are commercial products. |
| *"How do you handle jamming?"* | *"Five layers: fiber-optic tether, frequency hopping, mesh network, AES-256 encryption, inertial navigation. Even three layers down, you're operational."* | 35+ Ukrainian fiber-optic drone manufacturers. |
| *"What compute is onboard?"* | *"Raspberry Pi 5 plus Sony IMX500 AI camera. Thirty FPS person detection, on-chip, zero CPU load. The heavy C2 runs at the command station."* | IMX500: 13 TOPS, 5.85W total power. |
| *"Is the AI reliable?"* | *"Ninety-one percent accuracy for person detection, but it cannot reliably distinguish civilian from combatant. That's why we have human-in-the-loop gating — three-checklist, ARM button, press-and-hold."* | Samsung SGR-A1 uses same principle. International law requires human authorization for lethal engagement. |

### Business Questions

| Question | 15-Second Answer | Backup Data |
|----------|-----------------|-------------|
| *"Who are your competitors?"* | *"Boston Dynamics sells robots. DJI sells drones. No one sells the C2 layer that coordinates them with shared map state and operator phones."* | Anduril Lattice = enterprise, no building state. Corvus Head = no shared context. |
| *"What's your defensibility?"* | *"The C2 software, not the hardware. The shared state architecture is the IP. Robots are commodity."* | DARPA OFFSET spent millions on swarm C2. We do it at squad level with open-source. |
| *"Who's your first customer?"* | *"Baltic states and Ukraine for combat validation. Then NATO SOF units. Then search and rescue."* | EDTH connects directly to European defense procurement. |
| *"How do you scale?"* | *"Software scales infinitely — one dashboard manages one squad or one hundred. Hardware: 3D printer enables distributed manufacturing."* | Vbot model: 500 units first batch, then 1,500, then 2,500/month. |
| *"What about regulations?"* | *"Non-lethal only for EU demo. Foam dart marker for target designation. Lethal gating requires three human confirmations and admin authorization. Every action logged."* | EU drone regulations: under 25kg exempt from heavy UAS rules. |

### The Hard Questions (Be Ready)

| Question | How to Handle |
|----------|--------------|
| *"This seems like a lot of hardware for a software hackathon."* | *"The software IS the product. The robot is the demo prop. But the 3D printer bridges both — it turns the prop into a platform we can iterate."* |
| *"You don't have a working prototype that flies AND walks."* | *"Correct. We have a walking robot today. The VTOL is our 3-month prototype. The 3D printer is what gets us there."* |
| *"A $552 robot can't compete with $75,000 Spot."* | *"Spot doesn't fly. Spot doesn't share a map. Spot doesn't integrate with operator phones. We're not competing with Spot — we're doing something Spot can't do at 1/135th the price."* |
| *"What if the 3D printed legs break?"* | *"First iteration uses PLA-CF for rapid testing. We iterate until they hold. Production uses carbon fiber tubes. The 3D printer lets us find the breaking point fast."* |

---

## BODY LANGUAGE & DELIVERY TIPS

| Do | Don't |
|----|-------|
| Stand still, feet shoulder-width apart | Pace back and forth |
| Hands at sides or gesturing toward screen | Hands in pockets or crossed |
| Make eye contact with each judge | Stare at your slides |
| Pause after key numbers (4.5%, $552, 5.01:1) | Rush through the data |
| Point to the screen when showing the demo | Wave your hands randomly |
| Speak loudly and clearly | Mumble or speak too fast |
| End with silence (3-5 seconds) | Say "umm" or "that's it" at the end |

---

## EMERGENCY BACKUP PLANS

### If the Dashboard Crashes During Demo

1. Have a **screen recording** of the dashboard working
2. Say: *"The live demo just had a hiccup — let me show you the recorded version while we debug."*
3. Play the recording, keep talking through the narrative

### If the Robot Doesn't Walk

1. Have the **PiCrawler sitting on the table with LEDs on**
2. Say: *"The robot's having a moment — but here's what it does when it works."*
3. Show the **AI-generated video** of the robot in action

### If a Judge Challenges the VTOL Claim

1. **Be honest:** *"The VTOL is our 3-month prototype target. Today we have the walking robot and the software. The 3D printer is what gets us to flight."*
2. Show the **physics calculations** — TWR 5.01:1, all components commercially available
3. Show the **published research** — RAVEN (Nature), lunar hexapod (2026)

---

## PRE-PITCH CHECKLIST

### Night Before

- [ ] Dashboard demo works (test 3 times)
- [ ] Screen recording saved as backup
- [ ] PiCrawler charged, LEDs working
- [ ] All AI-generated images on USB + laptop
- [ ] Pitch script memorized (can recite without slides)
- [ ] Business cards / contact info ready
- [ ] Team roles assigned (who clicks, who talks, who demos)

### Morning Of

- [ ] Arrive 30 minutes early
- [ ] Test projector with your laptop
- [ ] Test internet (if dashboard needs it)
- [ ] Robot battery charged
- [ ] Deep breath. You've done the research. You know the numbers.

---

*Pitch guide compiled from judge feedback analysis, winning hackathon pitch patterns (Perplexity, ElevenLabs), and EDTH Munich 2026 event research.*
