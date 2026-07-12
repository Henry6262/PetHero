# Voice Agent Live Demo — Hardware Shopping List

> For Berry Base or similar electronics store in Berlin.

## Goal

Build a small, portable voice demo kit that lets a person talk to Operator and hear a spoken response near the robot.

## Required items

| Item | Purpose | Notes |
|------|---------|-------|
| **Raspberry Pi 5** (already owned) | Run the voice client | 4 GB RAM minimum. 8 GB preferred if running Whisper locally. |
| **USB microphone** | Capture voice commands | Directional mic preferred for noisy demo room. USB-C or USB-A with adapter. |
| **Portable speaker** | Play spoken responses | Battery-powered, 3.5 mm jack or Bluetooth. Loud enough for a demo room. |
| **USB-C power supply** | Power the Pi 5 | Official Pi 5 power supply (5V 5A) recommended. |
| **Micro-SD card 64 GB** | Pi OS + dependencies | Class 10 or faster. |
| **USB-C to USB-A hub** | Connect mic + speaker + optional button | Pi 5 has limited USB ports. |
| **Optional: USB push button** | Physical push-to-talk | Any USB HID button or arcade button with USB encoder. |
| **Optional: Bluetooth headset** | Alternative to speaker + mic | Less visible in demo but easier to transport. |

## Recommended specific products (examples)

- **USB microphone**: Jabra Speak 410/510 (also a speaker), Blue Snowball, or any directional conference mic.
- **Portable speaker**: JBL Go 4, Anker Soundcore Mini, or similar.
- **USB hub**: Anker 4-port USB 3.0 hub.
- **USB button**: Adafruit Arcade Button with USB encoder, or a simple USB panic button.

## Software stack on Pi

- Raspberry Pi OS Lite or Full.
- Bun runtime.
- Browser or headless script that calls `POST /api/voice/query`.
- Web Speech API in browser (easiest, requires Chromium).
- OR local Whisper + Piper for fully offline STT/TTS.

## Fallback if hardware fails

Use a phone or laptop with the web voice UI and a Bluetooth speaker. The demo still works; the Pi is just a nicer prop.

## Transport checklist

- [ ] Pi 5 + power supply
- [ ] Micro-SD card with image
- [ ] USB microphone
- [ ] Portable speaker + cable
- [ ] USB hub
- [ ] USB button (if used)
- [ ] Phone with hotspot as backup network
- [ ] Extension cable / power strip
