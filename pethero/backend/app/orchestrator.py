"""Glue: detection → agent proposal → safety verdict → dispense intent → state.

This is the one place the pipeline is wired together. Returns the full picture
(detection + agent reasoning + final event) so the iOS app can show *why*.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from . import agent, dispense, safety, vision
from .models import (
    Action,
    ActivityEvent,
    Detection,
    DispenseDecision,
    ManualTrigger,
    Pet,
)
from .store import store


class StepResult(dict):
    """detection / decision / event bundle, JSON-friendly."""


def _now(now: Optional[datetime]) -> datetime:
    return now or datetime.now()


def _apply(decision: DispenseDecision, pet: Optional[Pet], now: datetime) -> ActivityEvent:
    last_fed = store.last_fed.get(pet.id) if pet else None
    last_dosed = store.dosed_map(pet.id) if pet else {}

    verdict = safety.evaluate(
        decision, pet, now=now, last_fed=last_fed, last_dosed=last_dosed
    )
    event = dispense.record(verdict, pet, mode=store.mode, now=now)

    # Only mutate history when the action actually went through.
    if verdict.allowed and pet is not None:
        if verdict.action is Action.feed:
            store.record_feed(pet.id, now)
        elif verdict.action is Action.medicine and verdict.medicine_name:
            store.record_dose(pet.id, verdict.medicine_name, now)

    store.add_event(event)
    return event


def autonomous(now: Optional[datetime] = None) -> StepResult:
    """Look at the current frame, decide, and act."""
    now = _now(now)
    detection: Detection = vision.identify()
    pet = store.get_pet(detection.pet_id) if detection.pet_id else None

    decision = agent.decide(
        pet,
        detection,
        now=now,
        last_fed=store.last_fed.get(pet.id) if pet else None,
        last_dosed=store.dosed_map(pet.id) if pet else {},
    )
    event = _apply(decision, pet, now)
    return StepResult(detection=detection, decision=decision, event=event)


def manual(trigger: ManualTrigger, now: Optional[datetime] = None) -> StepResult:
    """A human pressed a button in the app."""
    now = _now(now)
    pet = store.get_pet(trigger.pet_id)
    detection = vision.identify()

    if pet is None:
        decision = DispenseDecision(
            pet_name=trigger.pet_id, action=Action.none, reasoning="Unknown pet."
        )
        return StepResult(detection=detection, decision=decision, event=_apply(decision, None, now))

    if trigger.action is Action.feed:
        decision = DispenseDecision(
            pet_name=pet.name,
            action=Action.feed,
            amount_grams=round(pet.max_portion_grams * 0.8),
            reasoning=f"Owner requested a meal for {pet.name}.",
        )
    elif trigger.action is Action.water:
        decision = DispenseDecision(
            pet_name=pet.name, action=Action.water, reasoning=f"Owner requested water for {pet.name}."
        )
    elif trigger.action is Action.medicine:
        med_name = trigger.medicine_name or (pet.medications[0].name if pet.medications else None)
        decision = DispenseDecision(
            pet_name=pet.name,
            action=Action.medicine,
            medicine_name=med_name,
            reasoning=f"Owner requested medication for {pet.name}.",
        )
    else:
        decision = DispenseDecision(pet_name=pet.name, action=Action.none, reasoning="No action.")

    return StepResult(detection=detection, decision=decision, event=_apply(decision, pet, now))
