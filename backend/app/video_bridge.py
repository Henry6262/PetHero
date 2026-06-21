"""UDP video bridge — robot camera → app /ws/feed.

The robot sends JPEG-compressed frames as raw UDP datagrams to port 5007.
This module receives them and broadcasts each frame to all connected app
clients via the existing hub, replacing the placeholder frame.

Config (env):
    VIDEO_UDP_PORT   default 5007
    VIDEO_UDP_HOST   default 0.0.0.0  (listen on all interfaces)
"""
from __future__ import annotations

import asyncio
import base64
import os

VIDEO_UDP_HOST = os.environ.get("VIDEO_UDP_HOST", "0.0.0.0")
VIDEO_UDP_PORT = int(os.environ.get("VIDEO_UDP_PORT", "5007"))

_task: asyncio.Task | None = None


class _UDPFrameProtocol(asyncio.DatagramProtocol):
    def __init__(self, broadcast_fn):
        self._broadcast = broadcast_fn

    def datagram_received(self, data: bytes, addr) -> None:
        if not data:
            return
        b64 = base64.b64encode(data).decode("ascii")
        self._broadcast({"type": "frame", "jpeg_b64": b64})


async def _run(broadcast_fn) -> None:
    loop = asyncio.get_running_loop()
    try:
        _, protocol = await loop.create_datagram_endpoint(
            lambda: _UDPFrameProtocol(broadcast_fn),
            local_addr=(VIDEO_UDP_HOST, VIDEO_UDP_PORT),
        )
        print(f"[video_bridge] listening for robot frames on UDP {VIDEO_UDP_HOST}:{VIDEO_UDP_PORT}")
        await asyncio.Future()   # run forever
    except Exception as e:
        print(f"[video_bridge] failed to start: {e}")


def start(broadcast_fn) -> None:
    """Launch the bridge as a background asyncio task."""
    global _task

    async def _safe_run():
        try:
            await _run(broadcast_fn)
        except asyncio.CancelledError:
            pass

    loop = asyncio.get_event_loop()
    _task = loop.create_task(_safe_run())


def stop() -> None:
    if _task and not _task.done():
        _task.cancel()
