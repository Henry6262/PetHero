# SCOUT C2 — Complete Technical Specifications
**All Engineering Data, Calculations, and Component Details**

---

## TABLE OF CONTENTS

1. Motor Specifications & Thrust Data
2. Servo Specifications & Comparison
3. Weight Budgets (All Versions)
4. Thrust-to-Weight Calculations
5. Power Budgets & Flight Time
6. Battery Specifications
7. 3D Printing Materials Guide
8. Leg Folding Mechanism Design
9. Communication Stack
10. AI/Compute Specifications

---

## 1. MOTOR SPECIFICATIONS & THRUST DATA

### T-Motor F60 Pro II 2207 1750KV (SCOUT-Mini)

| Parameter | Value |
|-----------|-------|
| Stator size | 22mm × 7mm |
| KV rating | 1750 RPM/V |
| Max voltage | 4S (16.8V) |
| Max RPM | ~29,400 |
| Weight | 30g |
| Max thrust (4S, 5x4.3x3) | ~2,400g |
| Thrust @ 50% throttle | ~1,100g |
| Current @ 50% throttle | ~6A |
| Price | ~$20 |

### T-Motor MN5006 400KV (Original Calculation)

| Parameter | Value |
|-----------|-------|
| Stator size | Large (agricultural class) |
| KV rating | 400 RPM/V |
| Max voltage | 6S (25.2V) |
| Weight | 89g |
| Max thrust (6S, 12") | ~1,800g |
| Used in | Agricultural drones |

### T-Motor U10 II KV100 (SCOUT-Elite)

| Parameter | Value |
|-----------|-------|
| KV rating | 100 RPM/V |
| Max voltage | 8S (33.6V) |
| Weight | 272g |
| Max thrust (8S, 28") | ~7,334g |
| Thrust @ 50% throttle | ~3,200g |
| Thrust @ 75% throttle | 4,782g |
| Current @ 50% | ~12A |
| Current @ 75% | ~22A |
| Price | ~$85 |

---

## 2. SERVO SPECIFICATIONS

### 9g Servo (MG90S / SG90) — SCOUT-Mini

| Parameter | Value |
|-----------|-------|
| Weight | 9g |
| Torque @ 4.8V | 1.8 kg·cm |
| Torque @ 6.0V | 2.2 kg·cm |
| Speed (60°) | 0.10s |
| Material | Metal gear (MG90S) / Plastic gear (SG90) |
| Price | $3-5 |
| Used in | PiCrawler, SCOUT-Mini |

### JX CLS6336HV — SCOUT-Elite

| Parameter | Value |
|-----------|-------|
| Weight | 63g |
| Stall torque @ 7.4V | 35.6 kg·cm (3.49 Nm) |
| Continuous torque (35%) | 1.22 Nm |
| Speed (60°) | 0.11s |
| Material | Aluminum gears |
| Stall current | ~3.0A |
| Price | ~$20 |
| Used in | SCOUT-Elite, Stanford Pupper |

### MG996R — Mid-range Option

| Parameter | Value |
|-----------|-------|
| Weight | 55g |
| Torque @ 6.0V | 11 kg·cm |
| Speed (60°) | 0.17s |
| Material | Metal gear |
| Price | ~$12 |

---

## 3. WEIGHT BUDGETS

### SCOUT-Mini (Complete)

| Component | Weight (g) |
|-----------|-----------|
| 3D printed body frame (PLA-CF) | 120 |
| 18 × 9g servos | 162 |
| 18 × 3D printed leg segments | 90 |
| 18 × servo horns + hardware | 36 |
| 6 × foot pads (TPU) | 18 |
| Raspberry Pi 5 (8GB) | 46 |
| Sony IMX500 AI Camera | 25 |
| Mesh radio module | 25 |
| IMU + sensors | 15 |
| Wiring harness | 30 |
| Power distribution | 20 |
| Buck converter | 10 |
| Walking battery (2S 3000mAh) | 150 |
| **HEXAPOD SUBTOTAL** | **747** |
| 6 × T-Motor F60 2207 motors | 180 |
| 6 × 20A ESCs | 48 |
| 6 × 5-inch CF props | 30 |
| Flight controller (Betaflight F4) | 10 |
| Shared battery (4S 1800mAh) | 200 |
| VTOL wiring | 25 |
| 3D printed rotor arms (6×) | 48 |
| Leg folding mechanism (micro servos) | 30 |
| **VTOL SUBTOTAL** | **571** |
| **TOTAL AUW** | **1,318** |

### SCOUT-Elite (Complete)

| Component | Weight (g) |
|-----------|-----------|
| CF body frame (hollow) | 180 |
| 18 × MG996R servos | 990 |
| 18 × CF leg tubes | 270 |
| 18 × 3D printed brackets | 144 |
| 6 × TPU foot pads | 72 |
| Raspberry Pi 5 | 46 |
| Sony IMX500 | 25 |
| Mesh radio | 25 |
| Sensors + IMU | 15 |
| Wiring | 50 |
| Power distribution | 35 |
| Buck converters | 25 |
| Walking battery (6S 3000mAh) | 350 |
| **HEXAPOD SUBTOTAL** | **2,227** |
| 6 × T-Motor U10 II KV100 motors | 1,632 |
| 6 × 50A ESCs | 120 |
| 6 × 28-inch CF props | 210 |
| Flight controller (Cube Orange+) | 80 |
| GPS + power module | 35 |
| Shared battery (8S 5000mAh) | 800 |
| VTOL wiring | 50 |
| 6 × CF rotor arms | 270 |
| Folding mechanisms (linear servos) | 180 |
| **VTOL SUBTOTAL** | **3,377** |
| **TOTAL AUW** | **5,604** |

---

## 4. THRUST-TO-WEIGHT CALCULATIONS

### SCOUT-Mini

| Throttle | Thrust/Motor | Total Thrust | AUW | TWR |
|----------|-------------|--------------|-----|-----|
| 50% | 1,100g | 6,600g | 1,318g | **5.01:1** ✅ |
| 75% | 1,800g | 10,800g | 1,318g | **8.19:1** ✅ |
| 100% | 2,400g | 14,400g | 1,318g | **10.93:1** ✅ |

### SCOUT-Elite

| Throttle | Thrust/Motor | Total Thrust | AUW | TWR |
|----------|-------------|--------------|-----|-----|
| 50% | 3,200g | 19,200g | 5,604g | **3.43:1** ✅ |
| 75% | 4,782g | 28,692g | 5,604g | **5.12:1** ✅ |
| 100% | 7,334g | 44,004g | 5,604g | **7.85:1** ✅ |

### TWR Guidelines

| TWR Range | Assessment |
|-----------|-----------|
| < 1.5 | Cannot take off |
| 1.5 - 2.0 | Marginal, unstable |
| 2.0 - 3.0 | Acceptable for experienced pilots |
| **3.0 - 5.0** | **Good, stable, recommended** |
| > 5.0 | Excellent, very responsive |

---

## 5. POWER BUDGETS

### SCOUT-Mini Power Consumption

| Mode | Component | Current | Voltage | Power |
|------|-----------|---------|---------|-------|
| **Hover** | 6 motors @ 6A each | 36A | 14.8V | 533W |
| **Climb** | 6 motors @ 12A each | 72A | 14.8V | 1,066W |
| **Walking** | 18 servos + Pi 5 + IMX500 | ~1A | 7.4V | ~15W |
| **Idle** | Pi 5 + radio + sensors | ~0.5A | 5V | ~3W |

### Flight Time Calculations

**SCOUT-Mini (4S 1800mAh = 26.6 Wh):**
- Hover: 26.6 Wh / 533W = **3.0 minutes**
- Climb: 26.6 Wh / 1,066W = **1.5 minutes total**
- Terrain hops: ~**2 hops** (30s each)

**SCOUT-Mini (4S 3000mAh upgrade = 44.4 Wh):**
- Hover: 44.4 Wh / 533W = **5.0 minutes**
- Terrain hops: ~**3-4 hops**

**SCOUT-Elite (8S 5000mAh = 148 Wh):**
- Hover: 148 Wh / 1,998W = **4.4 minutes**
- Climb: 148 Wh / 3,996W = **2.2 minutes total**
- Terrain hops: ~**4 hops**

---

## 6. BATTERY SPECIFICATIONS

| Battery | Voltage | Capacity | Energy | Weight | Use Case |
|---------|---------|----------|--------|--------|----------|
| 2S 3000mAh LiPo | 7.4V | 3000mAh | 22.2 Wh | 150g | PiCrawler walking only |
| 4S 1800mAh LiPo | 14.8V | 1800mAh | 26.6 Wh | 200g | SCOUT-Mini shared |
| 4S 3000mAh LiPo | 14.8V | 3000mAh | 44.4 Wh | 280g | SCOUT-Mini upgrade |
| 6S 3000mAh LiPo | 22.2V | 3000mAh | 66.6 Wh | 350g | SCOUT-Elite walking |
| 8S 5000mAh LiPo | 29.6V | 5000mAh | 148.0 Wh | 800g | SCOUT-Elite shared |

---

## 7. 3D PRINTING MATERIALS

| Material | Strength | Weight | Use Case | Printer Requirement |
|----------|----------|--------|----------|-------------------|
| PLA | 50 MPa | Light | Prototyping, non-structural | Any printer |
| PLA-CF | 70 MPa | Light | Structural parts, body frame | Hardened nozzle (0.6mm+) |
| PETG | 55 MPa | Light | Durable parts, impact resistant | Any printer |
| PETG-CF | 75 MPa | Light | High-strength structural | Hardened nozzle |
| PA-CF (Nylon) | 90 MPa | Medium | Leg segments, high stress | Hardened nozzle, heated bed |
| TPU (85A) | 25 MPa | Light | Foot pads, dampeners, flex parts | Direct drive extruder |
| Carbon Fiber Tubes | 600+ MPa | Very light | Leg segments (Elite) | Not printed — purchased |

---

## 8. LEG FOLDING MECHANISM

### Concept (Based on DJI Inspire + XM2 SLG-20)

**Deployed (Walking Mode):**
- Hip servo rotates leg 45° outward from body
- Knee joint extended (leg straight)
- Linear servo holds position (no power needed — mechanical lock)
- Wide stable stance

**Stowed (Flight Mode):**
- Linear servo retracts, pulling leg inward
- Hip servo rotates leg 90° toward body centerline
- Knee hinge folds lower leg 180° backward
- Leg sits in recessed channel on body side
- Form-fit lock — no separate pin needed
- Rotor arms deploy upward from body top

### Components per Leg

| Component | Qty | Weight Each | Function |
|-----------|-----|-------------|----------|
| Hip servo (9g) | 1 | 9g | Rotates leg at body |
| Knee servo (9g) | 1 | 9g | Folds leg at knee |
| Linear folding servo | 1 | 5g | Pulls leg into stowed position |
| Hinge mechanism | 2 | 3g each | Hip + knee rotation |
| Locking notch (printed) | 1 | 2g | Form-fit stow lock |

**Total per leg:** ~31g folding mechanism
**Total for 6 legs:** ~186g

---

## 9. COMMUNICATION STACK

| Layer | Protocol | Frequency | Range | Indoor Penetration |
|-------|----------|-----------|-------|-------------------|
| Primary | LoRa mesh | 868 MHz (EU) / 915 MHz (US) | 2-10 km | Good (88-92% through 2 floors) |
| Secondary | Wi-Fi | 2.4 GHz | 100m | Excellent (same room) |
| Backup | Bluetooth | 2.4 GHz | 10m | Excellent |
| Emergency | Fiber-optic tether | N/A | 500m | Perfect (physical cable) |

**Mesh node capacity:** 128 hops, self-healing
**Encryption:** AES-256-CBC
**Data rate:** LoRa: 0.3-50 kbps (sufficient for telemetry + commands)

---

## 10. AI/COMPUTE SPECIFICATIONS

### Raspberry Pi 5

| Parameter | Value |
|-----------|-------|
| CPU | ARM Cortex-A76, 4 cores, 2.4 GHz |
| RAM | Up to 8GB LPDDR4X |
| GPU | VideoCore VII |
| AI acceleration | 13 TOPS (with Hailo-8L AI HAT+) |
| Power | 5-15W |
| Weight | 46g |
| Price | $60 |

### Sony IMX500 Intelligent Vision Sensor

| Parameter | Value |
|-----------|-------|
| Resolution | 12.3 MP (4056 × 3040) |
| Sensor size | 1/2.3" |
| AI inference | On-chip neural network |
| Frame rate | 30 FPS @ 2×2 binned |
| Precision | INT8 |
| Tensor size | 640 × 640 |
| Power | ~2W (included in total 5.85W module) |
| Weight | 25g |
| Price | $70 |
| Detection classes | Person, vehicle, animal, custom (trainable) |

### Betaflight F4 Flight Controller

| Parameter | Value |
|-----------|-------|
| Processor | STM32F405 |
| IMU | BMI270 |
| OSD | On-screen display |
| Weight | 10g |
| Price | $35 |
| Use | VTOL motor control, stabilization |

---

*All specifications sourced from manufacturer datasheets, published research, and validated calculations. Thrust data interpolated from T-Motor bench test reports and eCalc flight time calculator.*
