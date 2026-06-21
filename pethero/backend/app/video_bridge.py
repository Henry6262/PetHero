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
_frame_count = 0


class _UDPFrameProtocol(asyncio.DatagramProtocol):
    def __init__(self, broadcast_fn):
        self._broadcast = broadcast_fn

    def datagram_received(self, data: bytes, addr) -> None:
        global _frame_count
        if not data:
            return
        _frame_count += 1
        if _frame_count == 1 or _frame_count % 100 == 0:
            print(f"[video_bridge] frame #{_frame_count} from {addr} ({len(data)} bytes)")
        b64 = base64.b64encode(data).decode("ascii")
        self._broadcast({"type": "frame", "jpeg_b64": b64})

    def error_received(self, exc) -> None:
        print(f"[video_bridge] error: {exc}")

    def connection_lost(self, exc) -> None:
        print(f"[video_bridge] connection lost: {exc}")


async def _run(broadcast_fn) -> None:
    loop = asyncio.get_running_loop()
    try:
        transport, _ = await loop.create_datagram_endpoint(
            lambda: _UDPFrameProtocol(broadcast_fn),
            local_addr=(VIDEO_UDP_HOST, VIDEO_UDP_PORT),
        )
        print(f"[video_bridge] listening on UDP {VIDEO_UDP_HOST}:{VIDEO_UDP_PORT}")
        await asyncio.Future()   # run forever
    except Exception as e:
        print(f"[video_bridge] failed to start: {e}")


async def start(broadcast_fn) -> None:
    """Launch the bridge as a background asyncio task (call from async startup)."""
    global _task

    async def _safe_run():
        try:
            await _run(broadcast_fn)
        except asyncio.CancelledError:
            pass

    _task = asyncio.create_task(_safe_run())


def stop() -> None:
    if _task and not _task.done():
        _task.cancel()
