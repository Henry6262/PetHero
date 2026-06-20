# PetHero App (Expo / React Native)

The owner-facing dashboard. Connects to the backend over WebSocket and renders
the live feed, the agent's reasoning, pet status, and dispense controls. Matches
the prototype: warm/light theme, dark LIVE panel, dashed DEMO row, pet tiles,
Feed/Water/Med.

## Run (recommended — guaranteed version match with your Expo Go)

Expo Go on the App Store tracks the latest SDK, so the safest path is to let the
CLI pick the SDK, then drop these sources in:

```bash
npx create-expo-app@latest pethero-app -t blank-typescript
cd pethero-app
npx expo install react-native-safe-area-context
# copy from this folder, overwriting App.tsx:
#   App.tsx, index.js, src/   →   pethero-app/
npm run start          # or: npx expo start
```
Scan the QR with Expo Go on your phone (same Wi-Fi as your Mac), or press `i` for
the iOS Simulator / `w` for web.

## Run (direct — use the pinned package.json here)

```bash
cd pethero/app
npm install
npx expo start
# If Expo Go complains about SDK version: npx expo install expo@latest && npx expo install --fix
```

## Point it at the backend

Edit `src/config.ts` (default host `192.168.1.133`), or set an env var:

```bash
EXPO_PUBLIC_PETHERO_HOST=192.168.1.50 npx expo start
```
Find your Mac's LAN IP: `ipconfig getifaddr en0`. Start the backend first
(`uvicorn app.main:app --host 0.0.0.0 --port 8000` in `pethero/backend`).
The Simulator can use `localhost`; a real phone needs the LAN IP.

## The demo flow
1. Tap a pet in the **DEMO** row ("simulate a pet walking up") → backend identifies it and the **agent reasoning** card appears.
2. Pet tiles show live status ("fed · all good" / "pill due"); the red banner flags overdue meds.
3. **DISPENSE NOW** → Feed / Water / Med acts on the current pet; the reasoning card shows DISPENSED or BLOCKED (e.g. double-dose, toxic).

## Type-check
```bash
npm run tsc
```
