"""In-memory state: pet profiles, per-pet feed/dose history, activity log, mode.

Single-process, single-household — exactly what a one-night demo needs. No DB.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Optional

from . import config
from .models import ActivityEvent, Pet


class Store:
    def __init__(self) -> None:
        self._pets: dict[str, Pet] = {}
        self.last_fed: dict[str, datetime] = {}
        self.last_dosed: dict[str, dict[str, datetime]] = {}
        self.log: list[ActivityEvent] = []
        self.mode: str = config.DEFAULT_MODE if config.DEFAULT_MODE in {"demo", "live"} else "demo"
        self._load_pets()

    def _load_pets(self) -> None:
        if config.PETS_SEED.exists():
            data = json.loads(config.PETS_SEED.read_text())
            for raw in data:
                pet = Pet(**raw)
                self._pets[pet.id] = pet

    # --- Pets ---
    def pets(self) -> list[Pet]:
        return list(self._pets.values())

    def get_pet(self, pet_id: str) -> Optional[Pet]:
        return self._pets.get(pet_id)

    def get_pet_by_name(self, name: str) -> Optional[Pet]:
        if not name:
            return None
        lname = name.strip().lower()
        return next((p for p in self._pets.values() if p.name.lower() == lname), None)

    # --- State ---
    def record_feed(self, pet_id: str, when: datetime) -> None:
        self.last_fed[pet_id] = when

    def record_dose(self, pet_id: str, medicine: str, when: datetime) -> None:
        self.last_dosed.setdefault(pet_id, {})[medicine.strip().lower()] = when

    def dosed_map(self, pet_id: str) -> dict[str, datetime]:
        return self.last_dosed.get(pet_id, {})

    def add_event(self, event: ActivityEvent) -> None:
        self.log.append(event)

    def set_mode(self, mode: str) -> str:
        mode = mode.strip().lower()
        if mode not in {"demo", "live"}:
            raise ValueError("mode must be 'demo' or 'live'")
        self.mode = mode
        return self.mode


store = Store()
