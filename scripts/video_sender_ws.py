#!/usr/bin/env python3
"""WebSocket video sender for the official Railway backend.

Use this when the backend is on Railway / public internet and UDP is not an option.
The camera machine pushes frames to /ws/ingest, the backend fans them out to the
app's /ws/feed.

    python video_sender_ws.py --url wss://pethero-backend-production.up.railway.app/ws/ingest
"""
from __future__ import annotations

import argparse
import asyncio
import base64
import sys
from pathlib import Path

try:
    import cv2
    import websockets
except ImportError as e:
    print("Install deps: pip install opencv-python websockets")
    raise SystemExit(1) from e


def encode_jpeg(frame, quality: int) -> bytes:
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("jpeg encode failed")
    return buf.tobytes()


async def run(url: str, camera: int, width: int, quality: int, fps: int, image: str | None) -> None:
    cap: cv2.VideoCapture | None = None
    static_frame = None
    if image:
        p = Path(image)
        if not p.exists():
            print(f"image not found: {image}")
            sys.exit(1)
        static_frame = cv2.imread(str(p))
        if static_frame is None:
            print("failed to load image")
            sys.exit(1)
    else:
        cap = cv2.VideoCapture(camera)
        if not cap.isOpened():
            print(f"camera {camera} not available")
            sys.exit(1)

    period = 1.0 / fps
    frame_num = 0
    async with websockets.connect(url) as ws:
        print(f"connected to {url}")
        while True:
            t0 = asyncio.get_event_loop().time()
            if cap:
                ok, frame = cap.read()
                if not ok:
                    await asyncio.sleep(0.05)
                    continue
            else:
                frame = static_frame

            h, w = frame.shape[:2]
            if w != width:
                frame = cv2.resize(frame, (width, int(h * width / w)))

            jpeg = encode_jpeg(frame, quality)
            b64 = base64.b64encode(jpeg).decode("ascii")
            await ws.send(f'{{"type":"frame","jpeg_b64":"{b64}"}}')
            frame_num += 1
            if frame_num == 1 or frame_num % 100 == 0:
                print(f"sent frame #{frame_num} ({len(jpeg)} bytes)")

            elapsed = asyncio.get_event_loop().time() - t0
            await asyncio.sleep(max(0, period - elapsed))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="wss://pethero-backend-production.up.railway.app/ws/ingest")
    parser.add_argument("--camera", type=int, default=0)
    parser.add_argument("--width", type=int, default=320)
    parser.add_argument("--quality", type=int, default=60)
    parser.add_argument("--fps", type=int, default=10)
    parser.add_argument("--image", type=str, default=None)
    args = parser.parse_args()
    try:
        asyncio.run(run(args.url, args.camera, args.width, args.quality, args.fps, args.image))
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
