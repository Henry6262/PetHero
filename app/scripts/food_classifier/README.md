# Candy / food classifier

End-to-end computer-vision pipeline for classifying candies from the robot camera.

## Layout

```
scripts/food_classifier/
  collect_data.py        webcam-based training-data collector (GUI)
  train_resnet.py        train ResNet18 classifier
  predict_resnet.py      classify a single image
  camera_bridge.py       stream USB camera frames + candy class to backend
  backend_simulator.py   local test backend that receives + rebroadcasts frames
  dataset/               class folders of training images
  model_resnet.pth       trained model (gitignored, regenerate with train_resnet.py)
```

## Quick start

```bash
cd scripts/food_classifier
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Train

Put robot-camera images into class folders under `dataset/`:

```
dataset/
  candy_one/
    img1.png
    img2.png
  candy_two/
    ...
```

```bash
python train_resnet.py --data-dir dataset --model-path model_resnet.pth --epochs 25
```

## Predict a single image

```bash
python predict_resnet.py dataset/candy_one/img1.png --model-path model_resnet.pth
```

## Stream live to the PetHero backend

Run on the machine with the USB camera:

```bash
python camera_bridge.py --camera 0 --ws-url wss://YOUR-BACKEND/ws/feed --model-path model_resnet.pth
```

For local testing without the real backend:

```bash
# Terminal 1: simulator
python backend_simulator.py --ws-port 8765 --http-port 8080

# Terminal 2: bridge (can use a static image or video file if no camera)
python camera_bridge.py --image dataset/candy_one/img1.png --ws-url ws://localhost:8765 --model-path model_resnet.pth
```

Open `http://localhost:8080/video.mjpg` for a browser preview.
