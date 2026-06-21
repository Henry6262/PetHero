"""Pydantic models shared across the pipeline and the HTTP/WebSocket API."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Species(str, Enum):
    cat = "cat"
    dog = "dog"


class Action(str, Enum):
    feed = "feed"
    water = "water"
    medicine = "medicine"
    pet = "pet"
    none = "none"


class FoodOption(BaseModel):
    id: str
    name: str
    portion_grams: float = 50
    min_interval_hours: float = 4
    is_default: bool = False


class Medication(BaseModel):
    id: str = ""
    name: str
    dose_count: int = 1
    interval_hours: float = 12
    notes: str = ""
    active: bool = True


class Pet(BaseModel):
    id: str
    name: str
    species: Species
    photo_ref: str = ""
    color: str = ""  # visual tag used in robot commands, e.g. "red cat"
    max_portion_grams: float = 50
    min_feed_interval_hours: float = 4
    food_options: list[FoodOption] = Field(default_factory=list)
    medications: list[Medication] = Field(default_factory=list)
    automation_enabled: bool = False
    weight_kg: float = 4.0
    daily_water_ml: float = 200.0
    daily_food_grams: float = 50.0

    def medication(self, name: str) -> Optional[Medication]:
        return next((m for m in self.medications if m.name == name), None)

    def default_food(self) -> Optional[FoodOption]:
        return next((f for f in self.food_options if f.is_default), self.food_options[0] if self.food_options else None)


class PetSettingsUpdate(BaseModel):
    automation_enabled: Optional[bool] = None
    food_options: Optional[list[FoodOption]] = None
    medications: Optional[list[Medication]] = None
    color: Optional[str] = None
    weight_kg: Optional[float] = None
    daily_water_ml: Optional[float] = None
    daily_food_grams: Optional[float] = None


class Detection(BaseModel):
    """Output of the vision layer."""

    present: bool = False
    species: Optional[Species] = None
    pet_id: Optional[str] = None          # individual ID, if confident
    pet_name: Optional[str] = None
    confidence: float = 0.0
    bbox: Optional[list[float]] = None     # [x, y, w, h] in pixels
    source: str = "stub"                   # "yolo+clip" | "manual" | "stub"


class DispenseDecision(BaseModel):
    """What the agent *proposes*. The safety layer has final say."""

    pet_name: str
    action: Action
    amount_grams: float = 0
    medicine_name: Optional[str] = None
    reasoning: str = ""


class SafetyVerdict(BaseModel):
    """The code-enforced outcome. Always wins over the agent's proposal."""

    allowed: bool
    action: Action
    amount_grams: float = 0
    medicine_name: Optional[str] = None
    reason: str = ""
    rule: Optional[str] = None             # which rule fired, if vetoed/adjusted
    adjusted: bool = False                 # amount was clamped


class ActivityEvent(BaseModel):
    timestamp: datetime
    pet_name: Optional[str]
    action: Action
    amount_grams: float = 0
    medicine_name: Optional[str] = None
    allowed: bool = True
    reason: str = ""
    rule: Optional[str] = None
    mode: str = "demo"


class SystemStatus(BaseModel):
    mode: str
    vision_backend: str
    agent_backend: str
    camera: str
    pets: int
    state: str = "idle"


class RobotCommand(BaseModel):
    """A safety-approved physical action for a robot worker to execute.

    This is the contract between PetHero and the robot. PetHero never contains
    motion logic — a separate worker (LeRobot/LeLab) subscribes to /ws/robot,
    receives these, and performs the dispense. The `command` field is a
    structured dictionary the robot can parse, e.g.
    {"subject": "red cat", "verb": "feed", "object": "pastrami", "count": 1}.
    """

    command: dict = Field(default_factory=dict)
    action: Action
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    amount_grams: float = 0
    medicine_name: Optional[str] = None
    food_name: Optional[str] = None
    count: int = 1
    bowl: Optional[str] = None  # which bowl/station to target (defaults to pet id)
    issued_at: datetime


class ModeRequest(BaseModel):
    mode: str  # "demo" | "live"


class ManualTrigger(BaseModel):
    """A human pressing 'Feed Mittens' in the app."""

    pet_id: str
    action: Action
    medicine_name: Optional[str] = None
