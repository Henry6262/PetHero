"""Robot communication channel.

PetHero decides *what* to dispense (vision -> agent -> safety). When a dispense
is approved, it emits a RobotCommand on this channel. A separate robot worker
(LeRobot / LeLab) connects to /ws/robot, receives the command, and performs the
physical motion. No motion/hardware logic lives here — only the contract and the
transport, so the two systems can be developed and run independently.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Optional

from .models import Action, Pet, RobotCommand, SafetyVerdict


class RobotHub:
    """Fan-out of approved commands to any connected robot workers."""

    def __init__(self) -> None:
        self._queues: list[asyncio.Queue] = []
        self.last_command: Optional[RobotCommand] = None

    def connect(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=32)
        self._queues.append(q)
        return q

    def disconnect(self, q: asyncio.Queue) -> None:
        if q in self._queues:
            self._queues.remove(q)

    def connected(self) -> int:
        return len(self._queues)

    def dispatch(self, cmd: RobotCommand) -> None:
        self.last_command = cmd
        for q in list(self._queues):
            try:
                q.put_nowait(cmd)
            except asyncio.QueueFull:
                pass


robot_hub = RobotHub()


def build_command(verdict: SafetyVerdict, pet: Optional[Pet], *, now: datetime) -> Optional[RobotCommand]:
    """Turn an approved verdict into a robot command. Returns None if there's
    nothing physical to do (vetoed, or a no-op)."""
    if not verdict.allowed or verdict.action is Action.none:
        return None
    return RobotCommand(
        action=verdict.action,
        pet_id=pet.id if pet else None,
        pet_name=pet.name if pet else None,
        amount_grams=verdict.amount_grams,
        medicine_name=verdict.medicine_name,
        bowl=pet.id if pet else None,
        issued_at=now,
    )
