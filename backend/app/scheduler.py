"""Backend cron for automated pet care.

A single APScheduler job runs every minute, checks each pet whose automation is
enabled, and triggers feed / medication actions when they are due. The scheduler
reuses the same manual trigger path that the mobile app uses, so every automated
action produces an ActivityEvent and, if approved, a robot command.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .hub import hub
from .models import Action, ManualTrigger, Pet
from .orchestrator import manual
from .store import store


_scheduler: Optional[AsyncIOScheduler] = None


def _is_due(pet_id: str, interval_hours: float, last_map: dict[str, datetime]) -> bool:
    last = last_map.get(pet_id)
    if last is None:
        return True
    elapsed = (datetime.now() - last).total_seconds() / 3600.0
    return elapsed >= interval_hours


def _due_medicine(pet: Pet) -> list[str]:
    due: list[str] = []
    dosed = store.dosed_map(pet.id)
    for med in pet.medications:
        if not med.active:
            continue
        if _is_due(pet.id, med.interval_hours, dosed):
            due.append(med.name)
    return due


def _run_automation_tick() -> None:
    now = datetime.now()
    for pet in store.pets():
        if not pet.automation_enabled:
            continue

        food = pet.default_food()
        if food is not None and _is_due(pet.id, food.min_interval_hours, store.last_fed):
            result = manual(ManualTrigger(pet_id=pet.id, action=Action.feed))
            hub.broadcast({"type": "decision", **result["decision"].model_dump(mode="json")})
            hub.broadcast({"type": "event", **result["event"].model_dump(mode="json")})

        for med_name in _due_medicine(pet):
            result = manual(ManualTrigger(pet_id=pet.id, action=Action.medicine, medicine_name=med_name))
            hub.broadcast({"type": "decision", **result["decision"].model_dump(mode="json")})
            hub.broadcast({"type": "event", **result["event"].model_dump(mode="json")})


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _run_automation_tick,
        trigger=IntervalTrigger(minutes=1),
        id="pethero_automation",
        replace_existing=True,
    )
    _scheduler.start()


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
