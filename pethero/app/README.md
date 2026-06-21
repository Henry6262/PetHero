# PetHero App

React Native (Expo) iOS app — the owner-facing dashboard for the PetHero autonomous cat-care robot.

## What it does

- **Pet tiles** — per-cat status (last fed, next feed, medications due)
- **Live panel** — real-time robot camera feed via WebSocket + detection overlay
- **Config drawer** — long-press any pet → set allowed foods, portions, intervals, medications, automation
- **Manual controls** — Feed / Protect / Pick cup 1-3 sent directly to the robot over HTTP
- **Activity log** — every dispense/deny decision with reason

## Run (simulator — dev build)

```bash
cd pethero/app
npm install
npx expo run:ios          # builds + installs on booted simulator
```

Requires Xcode + CocoaPods. The app connects to the backend at `EXPO_PUBLIC_PETHERO_HOST` (default `localhost`).

## Point at a local backend

```bash
# .env
EXPO_PUBLIC_PETHERO_HOST=172.20.10.2    # your Mac's LAN IP
```

Or for the production Railway backend (default in EAS production builds):
```bash
EXPO_PUBLIC_PETHERO_API=https://pethero-backend-production.up.railway.app
```

## Run on a real phone

You need a dev build (not Expo Go — uses native modules):

```bash
eas build --profile development --platform ios
# install the .ipa on your phone via TestFlight or direct install
npx expo start                            # then scan QR or open via dev client
```

## WebSocket live feed

`src/config.ts` builds the WS URL from your host:
```
ws://<PETHERO_HOST>:8000/ws/feed
```
Messages: `frame` (JPEG base64) | `detection` | `decision` | `event` | `status`

## Key files

```
src/
  config.ts          BASE_URL + WS_URL from env
  seed.ts            fallback pets when backend unreachable
  useBackend.ts      WebSocket hook — connects, parses, reconnects
  types.ts           Pet, FoodOption, Medication, ActivityEvent …
  screens/           HomeScreen, LiveScreen, SettingsScreen
  components/        PetCard, LivePanel, PetSettingsDrawer, RobotCommandCard
```

## Type-check

```bash
npm run tsc
```

## Food classifier (robot-side, not in app)

Training + inference scripts live in `scripts/food_classifier/`. See `scripts/food_classifier/README.md`.
