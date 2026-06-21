"""WebSocket fan-out hub shared by routes and the automation scheduler."""

from __future__ import annotations

import asyncio


class Hub:
    def __init__(self) -> None:
        self._queues: list[asyncio.Queue] = []

    def connect(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=64)
        self._queues.append(q)
        return q

    def disconnect(self, q: asyncio.Queue) -> None:
        if q in self._queues:
            self._queues.remove(q)

    def broadcast(self, message: dict) -> None:
        for q in list(self._queues):
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                pass


hub = Hub()
