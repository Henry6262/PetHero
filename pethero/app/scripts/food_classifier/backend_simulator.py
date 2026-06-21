#!/usr/bin/env python3
"""
Local test backend for the camera bridge.

- WebSocket server: receives frames from camera_bridge.py and re-broadcasts
  them to all connected clients (mobile app, browsers, other backends).
- HTTP MJPEG stream: browser-friendly live preview at /video.mjpg.
- Web UI: simple page at / that shows the stream + latest candy class.

Message format (matches PetHero backend):
    { "type": "frame", "jpeg_b64": "...", "candy_class": "...", "confidence": 0.95 }
"""

import argparse
import asyncio
import base64
import json
import logging
from pathlib import Path

import aiohttp
from aiohttp import web
import websockets
import websockets.exceptions


# Shared state (single-threaded asyncio, so no locks needed)
state = {
    "latest_frame": None,      # bytes (JPEG)
    "latest_meta": {},         # candy_class, confidence, etc.
    "latest_msg": None,        # last JSON string received from bridge
    "ws_clients": set(),       # connected browser/mobile clients
}


def parse_args():
    parser = argparse.ArgumentParser(description="Local PetHero backend simulator.")
    parser.add_argument("--ws-host", type=str, default="0.0.0.0", help="WebSocket bind host")
    parser.add_argument("--ws-port", type=int, default=8765, help="WebSocket port")
    parser.add_argument("--http-host", type=str, default="0.0.0.0", help="HTTP bind host")
    parser.add_argument("--http-port", type=int, default=8080, help="HTTP port")
    return parser.parse_args()


async def ws_handler(websocket):
    """Handle a bridge (ingress) or client (egress) WebSocket connection."""
    remote = websocket.remote_address
    print(f"[WS] {'bridge' if websocket.request.path == '/ws/feed' else 'client'} connected from {remote}")

    if websocket.request.path == "/ws/feed":
        # Ingress path: this is the camera bridge sending frames.
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                except json.JSONDecodeError:
                    continue
                if data.get("type") != "frame":
                    continue

                jpeg_b64 = data.get("jpeg_b64")
                if not jpeg_b64:
                    continue

                try:
                    jpeg_bytes = base64.b64decode(jpeg_b64)
                except Exception:
                    continue

                state["latest_frame"] = jpeg_bytes
                state["latest_msg"] = message
                state["latest_meta"] = {
                    k: v for k, v in data.items()
                    if k not in ("type", "jpeg_b64")
                }

                # Re-broadcast to all egress clients.
                dead = set()
                for client in state["ws_clients"]:
                    try:
                        await client.send(message)
                    except websockets.exceptions.ConnectionClosed:
                        dead.add(client)
                state["ws_clients"] -= dead
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            print(f"[WS] bridge disconnected from {remote}")
    else:
        # Egress path: browser/mobile client that wants frames.
        state["ws_clients"].add(websocket)
        # Send the latest frame immediately so the client doesn't wait for the next camera frame.
        if state["latest_msg"] is not None:
            try:
                await websocket.send(state["latest_msg"])
            except websockets.exceptions.ConnectionClosed:
                pass
        try:
            await websocket.wait_closed()
        finally:
            state["ws_clients"].discard(websocket)
            print(f"[WS] client disconnected from {remote}")


async def mjpeg_handler(request):
    """HTTP MJPEG stream."""
    response = web.StreamResponse(
        status=200,
        reason="OK",
        headers={
            "Content-Type": "multipart/x-mixed-replace; boundary=frame",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        },
    )
    await response.prepare(request)

    last_frame = None
    while True:
        frame = state["latest_frame"]
        if frame and frame is not last_frame:
            try:
                response.write(
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(frame)).encode() + b"\r\n\r\n"
                    + frame + b"\r\n"
                )
                await response.drain()
                last_frame = frame
            except (ConnectionResetError, BrokenPipeError, aiohttp.ClientConnectionError):
                break
        await asyncio.sleep(0.05)  # 20 FPS max

    return response


async def index_handler(request):
    """Simple HTML UI showing the MJPEG stream + latest metadata."""
    html = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PetHero Camera Simulator</title>
  <style>
    body { font-family: system-ui; background: #111; color: #eee; text-align: center; margin: 0; padding: 20px; }
    img { max-width: 95vw; max-height: 75vh; border-radius: 12px; border: 2px solid #333; }
    .meta { margin-top: 12px; font-size: 18px; }
  </style>
</head>
<body>
  <h1>PetHero Camera Simulator</h1>
  <img src="/video.mjpg" alt="live stream">
  <div class="meta" id="meta">Waiting for frames...</div>
  <script>
    const ws = new WebSocket('ws://' + location.hostname + ':8765/client');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      const text = msg.candy_class
        ? `${msg.candy_class} (${(msg.confidence * 100).toFixed(0)}%)`
        : 'No classification';
      document.getElementById('meta').textContent = text;
    };
  </script>
</body>
</html>"""
    return web.Response(text=html, content_type="text/html")


async def main():
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

    # HTTP server (aiohttp)
    app = web.Application()
    app.router.add_get("/", index_handler)
    app.router.add_get("/video.mjpg", mjpeg_handler)
    runner = web.AppRunner(app)
    await runner.setup()
    http_site = web.TCPSite(runner, args.http_host, args.http_port)
    await http_site.start()
    print(f"[HTTP] MJPEG preview at http://{args.http_host}:{args.http_port}/video.mjpg")
    print(f"[HTTP] UI at http://{args.http_host}:{args.http_port}/")

    # WebSocket server (websockets)
    # Serve /ws/feed for the bridge and /client for browsers/mobile.
    stop = asyncio.Future()
    async with websockets.serve(ws_handler, args.ws_host, args.ws_port):
        print(f"[WS] listening on ws://{args.ws_host}:{args.ws_port}/ws/feed (bridge)")
        print(f"[WS] client path ws://{args.ws_host}:{args.ws_port}/client")
        await stop


if __name__ == "__main__":
    asyncio.run(main())
