#!/usr/bin/env python3
"""
Camera bridge for PetHero.

Reads frames from a USB camera (or a static image/video file for testing),
optionally classifies the candy in the frame using a trained ResNet18 model,
and pushes JPEG base64 frames to a WebSocket backend.

Typical usage:
    python camera_bridge.py --camera 0 --ws-url wss://backend.example.com/ws/feed --model-path model_resnet.pth

Local testing without a camera:
    python camera_bridge.py --image dataset/candy_one/img1.jpg --ws-url ws://localhost:8765 --model-path model_resnet.pth
"""

import argparse
import asyncio
import base64
import json
import logging
import queue
import sys
import threading
import time
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn as nn
import websockets
from PIL import Image
from torchvision import models, transforms

from crop_utils import crop_candy


CROP_SIZE = 224


def parse_args():
    parser = argparse.ArgumentParser(description="PetHero camera bridge")
    parser.add_argument("--camera", type=str, default="0",
                        help="Camera index (int) or path/URL to image/video file")
    parser.add_argument("--image", type=str, default=None,
                        help="Static image path to loop (testing). Overrides --camera.")
    parser.add_argument("--ws-url", type=str, default="ws://localhost:8765/ws/feed",
                        help="Backend WebSocket URL")
    parser.add_argument("--model-path", type=str, default="model_resnet.pth",
                        help="Path to trained ResNet18 checkpoint (omit to disable classification)")
    parser.add_argument("--fps", type=float, default=15.0, help="Target stream FPS")
    parser.add_argument("--width", type=int, default=640, help="Capture width")
    parser.add_argument("--height", type=int, default=480, help="Capture height")
    parser.add_argument("--quality", type=int, default=85, help="JPEG encoding quality (0-100)")
    parser.add_argument("--classify-interval", type=float, default=0.5,
                        help="Seconds between candy classifications")
    parser.add_argument("--no-classify", action="store_true", help="Disable classification")
    parser.add_argument("--no-crop", action="store_true", help="Do not run crop_candy before classifying")
    parser.add_argument("--max-frames", type=int, default=0, help="Send N frames then exit (0 = infinite)")
    return parser.parse_args()


def crear_modelo(num_clases):
    modelo = models.resnet18(weights=None)
    modelo.fc = nn.Sequential(nn.Dropout(0.4), nn.Linear(512, num_clases))
    return modelo


class CandyClassifier:
    def __init__(self, model_path):
        if not Path(model_path).exists():
            raise FileNotFoundError(f"model not found: {model_path}")

        self.device = torch.device(
            "mps" if torch.backends.mps.is_available() else
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        ck = torch.load(model_path, map_location=self.device)
        self.classes = ck["classes"]
        self.model = crear_modelo(len(self.classes))
        self.model.load_state_dict(ck["model_state_dict"])
        self.model.to(self.device).eval()

        self.norm = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        self.to_t = transforms.ToTensor()
        self.rsz = transforms.Resize((CROP_SIZE, CROP_SIZE))
        print(f"[Classifier] Loaded {model_path} | {len(self.classes)} classes | {self.device}")

    def classify(self, frame_bgr, use_crop=True):
        if use_crop:
            crop = crop_candy(frame_bgr)
            if crop is None:
                crop = frame_bgr
            img = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
        else:
            img = Image.fromarray(cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB))

        variants = [
            self.rsz(img),
            self.rsz(img).transpose(Image.FLIP_LEFT_RIGHT),
            self.rsz(img).transpose(Image.FLIP_TOP_BOTTOM),
            transforms.CenterCrop(CROP_SIZE)(
                transforms.Resize((int(CROP_SIZE * 1.1), int(CROP_SIZE * 1.1)))(img)
            ),
        ]

        probs_sum = torch.zeros(len(self.classes), device=self.device)
        with torch.no_grad():
            for v in variants:
                t = self.norm(self.to_t(v)).unsqueeze(0).to(self.device)
                probs_sum += torch.softmax(self.model(t), dim=1)[0]

        probs = probs_sum / len(variants)
        conf, idx = probs.max(0)
        return self.classes[idx.item()], float(conf)


def capture_thread(args, frame_queue):
    """Continuously capture frames and put them in a thread-safe queue."""
    source = args.image if args.image else args.camera

    if args.image:
        # Static image mode: loop the same image.
        print(f"[Capture] Static image mode: {args.image}")
        img = cv2.imread(args.image)
        if img is None:
            print(f"[!] ERROR: could not load image {args.image}")
            sys.exit(1)
        img = cv2.resize(img, (args.width, args.height))
        while True:
            try:
                frame_queue.put(img.copy(), timeout=0.1)
            except queue.Full:
                pass
            time.sleep(1.0 / args.fps)
        return

    # Try to interpret --camera as int, otherwise as path/URL.
    try:
        cam_idx = int(args.camera)
        print(f"[Capture] Opening USB camera index {cam_idx}")
        cap = cv2.VideoCapture(cam_idx)
    except ValueError:
        print(f"[Capture] Opening video source: {args.camera}")
        cap = cv2.VideoCapture(args.camera)

    if not cap.isOpened():
        print(f"[!] ERROR: could not open camera/source {source}")
        sys.exit(1)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, args.width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, args.height)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[!] Capture failed, retrying...")
            time.sleep(0.5)
            continue
        try:
            frame_queue.put(frame, timeout=0.1)
        except queue.Full:
            # Drop oldest frame to keep latency low.
            try:
                frame_queue.get_nowait()
                frame_queue.put(frame, timeout=0.1)
            except queue.Empty:
                pass


def encode_jpeg(frame, quality):
    ret, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    if not ret:
        return None
    return base64.b64encode(buf).decode("utf-8")


async def run_bridge(args, classifier):
    frame_queue = queue.Queue(maxsize=2)

    # Start capture thread.
    threading.Thread(target=capture_thread, args=(args, frame_queue), daemon=True).start()

    latest_class = None
    latest_conf = 0.0
    last_classify = 0.0
    sent_frames = 0

    loop = asyncio.get_event_loop()

    while True:
        try:
            async with websockets.connect(args.ws_url) as ws:
                print(f"[Bridge] Connected to {args.ws_url}")
                while args.max_frames == 0 or sent_frames < args.max_frames:
                    # Wait for next frame (blocking on queue, run in executor).
                    frame = await loop.run_in_executor(None, frame_queue.get)

                    # Classification (throttled, run in thread pool so torch doesn't block loop).
                    if classifier and time.time() - last_classify >= args.classify_interval:
                        try:
                            cls, conf = await loop.run_in_executor(
                                None, classifier.classify, frame, not args.no_crop
                            )
                            latest_class = cls
                            latest_conf = conf
                            last_classify = time.time()
                        except Exception as e:
                            logging.warning(f"classification error: {e}")

                    # Encode and send.
                    jpeg_b64 = await loop.run_in_executor(None, encode_jpeg, frame, args.quality)
                    if not jpeg_b64:
                        continue

                    msg = {
                        "type": "frame",
                        "jpeg_b64": jpeg_b64,
                        "source": "camera_bridge",
                    }
                    if latest_class is not None:
                        msg["candy_class"] = latest_class
                        msg["confidence"] = round(latest_conf, 3)

                    await ws.send(json.dumps(msg))
                    sent_frames += 1
                    if args.max_frames and sent_frames >= args.max_frames:
                        print(f"[Bridge] Sent {sent_frames} frames, exiting.")
                        return
                    await asyncio.sleep(1.0 / args.fps)

        except (websockets.exceptions.ConnectionClosed,
                websockets.exceptions.InvalidURI,
                OSError) as e:
            print(f"[Bridge] Connection lost: {e}. Reconnecting in 2s...")
            await asyncio.sleep(2.0)


def main():
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

    classifier = None
    if not args.no_classify and Path(args.model_path).exists():
        classifier = CandyClassifier(args.model_path)
    elif not args.no_classify:
        print(f"[!] Model not found at {args.model_path}; classification disabled.")

    asyncio.run(run_bridge(args, classifier))


if __name__ == "__main__":
    main()
