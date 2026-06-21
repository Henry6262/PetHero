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

## Food / candy classifier (training + inference)

A computer-vision pipeline lives in `scripts/food_classifier/`. It can collect new training images from a webcam, or train/predict from existing robot-camera PNGs/JPGs.

### 1. Setup
```bash
cd scripts/food_classifier
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Collect images from webcam (optional)
```bash
python collect_data.py --classes candy_one candy_two candy_three --output-dir dataset
```

Controls (once the crop box is locked):
- `1`, `2`, `3` … switch active class
- `Space` capture one frame
- `C` toggle auto-capture
- `R` redo crop box
- `Q` / `Esc` quit

### 3. Train the ResNet18 classifier
Drop your robot-camera PNGs into class folders:

```
dataset/
  candy_one/
    img1.png
    img2.png
  candy_two/
    ...
  candy_three/
    ...
```

Then train:
```bash
python train_resnet.py --data-dir dataset --model-path model_resnet.pth --epochs 25
```

This uses transfer learning (ImageNet-pretrained ResNet18) with heavy augmentation, and saves `model_resnet.pth`.

> There is also a lightweight `train.py` / `predict.py` baseline using HOG + SVM, but ResNet18 is the recommended model for real candy images.

### 4. Predict one image
```bash
python predict_resnet.py path/to/photo.png --model-path model_resnet.pth
```

The existing `dataset/` folder contains sample candy classes (`candy_one`, `candy_two`, `candy_three`, `candy_four`). A sample `model_resnet.pth` can be trained from these in ~30s.

> Note: `collect_data.py` needs a physical webcam and a GUI (macOS/Linux desktop). `train_resnet.py` and `predict_resnet.py` run anywhere with the venv.

## Live camera bridge

When the USB robot camera is plugged into a colleague’s machine, run the camera bridge on that machine to push live frames to the PetHero backend.

```
USB camera (colleague's Mac/PC)
    ↓ OpenCV
camera_bridge.py
    ↓ WebSocket
PetHero backend (/ws/feed)
    ↓ WebSocket
mobile app
```

### Run the bridge
```bash
cd scripts/food_classifier
source .venv/bin/activate

# Push to the real Railway backend
python camera_bridge.py --camera 0 --ws-url wss://pethero-backend-production.up.railway.app/ws/feed --model-path model_resnet.pth

# Or push to the local simulator for testing
python camera_bridge.py --camera 0 --ws-url ws://localhost:8765 --model-path model_resnet.pth
```

### Run the local backend simulator (for testing without Railway)
```bash
python backend_simulator.py --ws-port 8765 --http-port 8080
```

- WebSocket: `ws://localhost:8765` — connect the bridge and the mobile app here.
- MJPEG preview: `http://localhost:8080/video.mjpg` — open in any browser.

Test the bridge without a camera by looping a static image:
```bash
python camera_bridge.py --image dataset/candy_one/img1.jpg --ws-url ws://localhost:8765/ws/feed --model-path model_resnet.pth --max-frames 100
```

The bridge sends `{ type: "frame", jpeg_b64: "...", candy_class: "...", confidence: 0.95 }`. The mobile app already renders `jpeg_b64`; it will also display the candy class when present.
