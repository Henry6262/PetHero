#!/usr/bin/env python3
"""Minimal local video sender — pushes robot-camera frames over UDP to PetHero.

Run on the friend's machine (the one with the camera):
    python video_sender_udp.py --target 10.19.29.244

UDP is one JPEG datagram per frame, so we keep the frame small (< 60 KB).
If hackathon WiFi blocks device-to-device UDP, put both machines on the same
phone hotspot and use that IP.
"""
from __future__ import annotations

import argparse
import base64
import json
import socket
import sys
import time
from pathlib import Path

try:
    import cv2
except ImportError as e:
    print("This script needs opencv-python: pip install opencv-python")
    raise SystemExit(1) from e


def encode_jpeg(frame, quality: int) -> bytes:
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("jpeg encode failed")
    return buf.tobytes()


def send_frame(sock: socket.socket, addr: tuple[str, int], jpeg: bytes) -> None:
    # Single UDP datagram — keep it under the ~65 KB limit.
    if len(jpeg) > 60000:
        raise RuntimeError(f"frame too big for UDP: {len(jpeg)} bytes")
    sock.sendto(jpeg, addr)


def main() -> None:
    parser = argparse.ArgumentParser(description="Send camera frames over UDP to PetHero")
    parser.add_argument("--target", default="127.0.0.1", help="IP of the machine running PetHero backend")
    parser.add_argument("--port", type=int, default=5007, help="UDP port (default 5007)")
    parser.add_argument("--camera", type=int, default=0, help="OpenCV camera index")
    parser.add_argument("--width", type=int, default=320, help="resize width")
    parser.add_argument("--quality", type=int, default=60, help="JPEG quality 0-100")
    parser.add_argument("--fps", type=int, default=10, help="max frames per second")
    parser.add_argument("--image", type=str, default=None, help="loop a static image instead of camera")
    args = parser.parse_args()

    addr = (args.target, args.port)
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    cap: cv2.VideoCapture | None = None
    static_frame: cv2.Mat | None = None

    if args.image:
        p = Path(args.image)
        if not p.exists():
            print(f"image not found: {args.image}")
            sys.exit(1)
        static_frame = cv2.imread(str(p))
        if static_frame is None:
            print("failed to load image")
            sys.exit(1)
        print(f"looping static image -> {addr}")
    else:
        cap = cv2.VideoCapture(args.camera)
        if not cap.isOpened():
            print(f"camera {args.camera} not available")
            sys.exit(1)
        print(f"camera {args.camera} -> {addr} ({args.width}px wide, q={args.quality}, {args.fps} fps)")

    period = 1.0 / args.fps
    frame_num = 0
    try:
        while True:
            t0 = time.time()
            if cap:
                ok, frame = cap.read()
                if not ok:
                    time.sleep(0.05)
                    continue
            else:
                frame = static_frame

            h, w = frame.shape[:2]
            if w != args.width:
                new_h = int(h * args.width / w)
                frame = cv2.resize(frame, (args.width, new_h))

            jpeg = encode_jpeg(frame, args.quality)
            send_frame(sock, addr, jpeg)
            frame_num += 1
            if frame_num == 1 or frame_num % 100 == 0:
                print(f"sent frame #{frame_num} ({len(jpeg)} bytes)")

            elapsed = time.time() - t0
            time.sleep(max(0, period - elapsed))
    except KeyboardInterrupt:
        print("\nstopped")
    finally:
        if cap:
            cap.release()
        sock.close()


if __name__ == "__main__":
    main()
