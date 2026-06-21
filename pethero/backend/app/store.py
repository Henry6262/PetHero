"""In-memory state with SQLite persistence: pet profiles, per-pet feed/dose
history, activity log, and mode.

Single-process, single-household — exactly what a one-night demo needs. The
SQLite file lets schedules and logs survive restarts without pulling in a
full database server.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

from . import config, migrations
from .db import Database
from .models import ActivityEvent, Pet, PetSettingsUpdate


def _now_iso() -> str:
    return datetime.now().isoformat()


def _parse_iso(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


class Store:
    def __init__(self) -> None:
        self._pets: dict[str, Pet] = {}
        self.last_fed: dict[str, datetime] = {}
        self.last_dosed: dict[str, dict[str, datetime]] = {}
        self.log: list[ActivityEvent] = []
        self.mode: str = config.DEFAULT_MODE if config.DEFAULT_MODE in {"demo", "live"} else "demo"
        self._db = Database(config.DATA_DIR / "pethero.db")
        migrations.run_migrations(self._db)
        self._load_db_state()
        if not self._pets:
            self._load_pets_from_seed()

    # --- Persistence helpers -----------------------------------------------

    def _load_db_state(self) -> None:
        try:
            # pets
            for pet_id, raw in self._db.load_pets().items():
                self._pets[pet_id] = Pet(**raw)

            # mode
            stored_mode = self._db.get_state("mode")
            if stored_mode in {"demo", "live"}:
                self.mode = stored_mode

            # last fed / dosed
            fed_json = self._db.get_state("last_fed")
            if fed_json:
                self.last_fed = {
                    k: datetime.fromisoformat(v)
                    for k, v in json.loads(fed_json).items()
                    if v
                }

            dosed_json = self._db.get_state("last_dosed")
            if dosed_json:
                self.last_dosed = {
                    pet_id: {med: datetime.fromisoformat(ts) for med, ts in meds.items() if ts}
                    for pet_id, meds in json.loads(dosed_json).items()
                }

            # log
            for raw in self._db.load_events():
                self.log.append(ActivityEvent(**raw))
        except Exception:
            # If the DB is unreadable for any reason, fall back to seed state.
            pass

    def _save_pets_to_db(self) -> None:
        try:
            for pet in self._pets.values():
                self._db.save_pet(pet.id, pet.model_dump(mode="json"))
        except Exception:
            pass

    def _save_last_fed(self) -> None:
        try:
            self._db.set_state(
                "last_fed",
                json.dumps({k: v.isoformat() for k, v in self.last_fed.items()}),
            )
        except Exception:
            pass

    def _save_last_dosed(self) -> None:
        try:
            payload = {
                pet_id: {med: ts.isoformat() for med, ts in meds.items()}
                for pet_id, meds in self.last_dosed.items()
            }
            self._db.set_state("last_dosed", json.dumps(payload))
        except Exception:
            pass

    # --- Seed fallback -----------------------------------------------------

    def _load_pets_from_seed(self) -> None:
        if config.PETS_SEED.exists():
            data = json.loads(config.PETS_SEED.read_text())
            for raw in data:
                pet = Pet(**raw)
                self._pets[pet.id] = pet
            self._save_pets_to_db()

    # --- Pets --------------------------------------------------------------

    def pets(self) -> list[Pet]:
        return list(self._pets.values())

    def get_pet(self, pet_id: str) -> Optional[Pet]:
        return self._pets.get(pet_id)

    def get_pet_by_name(self, name: str) -> Optional[Pet]:
        if not name:
            return None
        lname = name.strip().lower()
        return next((p for p in self._pets.values() if p.name.lower() == lname), None)

    def update_pet(self, pet_id: str, update: PetSettingsUpdate) -> Optional[Pet]:
        pet = self._pets.get(pet_id)
        if pet is None:
            return None
        data = pet.model_dump()
        payload = update.model_dump(exclude_unset=True)
        for key, value in payload.items():
            if key == "food_options" and value:
                total = len(value)
                for i, opt in enumerate(value):
                    opt["is_default"] = i == 0 and total == 1
                data["food_options"] = value
                if value:
                    data["max_portion_grams"] = value[0]["portion_grams"]
                    data["min_feed_interval_hours"] = value[0]["min_interval_hours"]
            else:
                data[key] = value
        updated = Pet(**data)
        self._pets[pet_id] = updated
        self._save_pets_to_db()
        return updated

    # --- State -------------------------------------------------------------

    def record_feed(self, pet_id: str, when: datetime) -> None:
        self.last_fed[pet_id] = when
        self._save_last_fed()

    def record_dose(self, pet_id: str, medicine: str, when: datetime) -> None:
        self.last_dosed.setdefault(pet_id, {})[medicine.strip().lower()] = when
        self._save_last_dosed()

    def dosed_map(self, pet_id: str) -> dict[str, datetime]:
        return self.last_dosed.get(pet_id, {})

    def add_event(self, event: ActivityEvent) -> None:
        self.log.append(event)
        try:
            self._db.append_event(event.model_dump(mode="json"))
        except Exception:
            pass

    def set_mode(self, mode: str) -> str:
        mode = mode.strip().lower()
        if mode not in {"demo", "live"}:
            raise ValueError("mode must be 'demo' or 'live'")
        self.mode = mode
        try:
            self._db.set_state("mode", mode)
        except Exception:
            pass
        return self.mode


store = Store()
