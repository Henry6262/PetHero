#!/usr/bin/env python3
"""Cloud bridge for the physical robot controller.

Run this on the machine that has the robot + camera (the controller PC).
It connects outbound to the Railway backend, so it works even from behind
AP-isolation wifi or NAT.

  backend  <──WS──  this bridge  <──UDP──  controller (cat_feeder_main.py)
    │                    │
    └──WS──▶  phone app  └──UDP──▶  controller commands

Environment:
    BACKEND_URL    default: wss://pethero-backend-production.up.railway.app
    ROBOT_IP       default: 127.0.0.1   (where cat_feeder_main.py runs)
    ROBOT_CMD_PORT default: 5006        (UDP commands to controller)
    ROBOT_VID_PORT default: 5007        (UDP video from controller)

Start the controller first:
    cd Controller
    VIDEO_TARGET_IP=127.0.0.1 VIDEO_TARGET_PORT=5007 python cat_feeder_main.py

Then run the bridge:
    cd pethero/scripts
    pip install websockets opencv-python
    python robot_cloud_bridge.py
"""
from __future__ import annotations

import asyncio
import base64
import json
import os
import socket

import websockets

BACKEND_URL = os.environ.get("BACKEND_URL", "wss://pethero-backend-production.up.railway.app")
ROBOT_IP = os.environ.get("ROBOT_IP", "127.0.0.1")
ROBOT_CMD_PORT = int(os.environ.get("ROBOT_CMD_PORT", "5006"))
ROBOT_VID_PORT = int(os.environ.get("ROBOT_VID_PORT", "5007"))

WS_ROBOT = f"{BACKEND_URL}/ws/robot"
WS_INGEST = f"{BACKEND_URL}/ws/ingest"


async def forward_commands(robot_sock: socket.socket) -> None:
    """Receive commands from backend /ws/robot and send UDP to controller."""
    while True:
        try:
            async with websockets.connect(WS_ROBOT) as ws:
                print(f"[bridge] connected to {WS_ROBOT}")
                async for msg in ws:
                    try:
                        data = json.loads(msg)
                    except json.JSONDecodeError:
                        continue
                    if data.get("type") != "command":
                        continue
                    cmd = data.get("command", {})
                    verb = cmd.get("verb")
                    obj = cmd.get("object")
                    cup = cmd.get("cup")
                    payload: dict = {"cmd": "feed"}
                    if verb == "protect":
                        payload = {"cmd": "protect"}
                    elif verb == "pick" or obj in ("1", "2", "3"):
                        payload = {"cmd": "pick", "cup": cup or obj or "1"}
                    elif verb == "medicine":
                        payload = {"cmd": "protect"}
                    robot_sock.sendto(json.dumps(payload).encode(), (ROBOT_IP, ROBOT_CMD_PORT))
                    print(f"[bridge] cmd -> {ROBOT_IP}:{ROBOT_CMD_PORT} {payload}")
        except websockets.exceptions.ConnectionClosed:
            print("[bridge] /ws/robot closed, reconnecting...")
        except Exception as e:
            print(f"[bridge] /ws/robot error: {e}")
        await asyncio.sleep(2)


async def forward_video(ingest_ws) -> None:
    """Receive UDP frames from controller and send to backend /ws/ingest."""
    loop = asyncio.get_running_loop()
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(("0.0.0.0", ROBOT_VID_PORT))
    sock.setblocking(False)
    print(f"[bridge] listening UDP video on port {ROBOT_VID_PORT}")

    frame_count = 0
    while True:
        try:
            data = await loop.sock_recv(sock, 65535)
            if not data:
                continue
            b64 = base64.b64encode(data).decode("ascii")
            await ingest_ws.send(json.dumps({"type": "frame", "jpeg_b64": b64}))
            frame_count += 1
            if frame_count == 1 or frame_count % 100 == 0:
                print(f"[bridge] forwarded frame #{frame_count} ({len(data)} bytes)")
        except Exception as e:
            print(f"[bridge] video error: {e}")
            await asyncio.sleep(0.1)


async def main() -> None:
    robot_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    while True:
        try:
            async with websockets.connect(WS_INGEST) as ws:
                print(f"[bridge] connected to {WS_INGEST}")
                await asyncio.gather(
                    forward_commands(robot_sock),
                    forward_video(ws),
                )
        except websockets.exceptions.ConnectionClosed:
            print("[bridge] /ws/ingest closed, reconnecting...")
        except Exception as e:
            print(f"[bridge] /ws/ingest error: {e}")
        await asyncio.sleep(2)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[bridge] stopped")
