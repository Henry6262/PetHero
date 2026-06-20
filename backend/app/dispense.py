"""Dispense-intent recorder.

This turns a safety-approved verdict into an ActivityEvent that the iOS app
renders. It is deliberately just a record of *what would be dispensed* —
there is intentionally NO robot/hardware code here. Physical actuation is a
future seam (a robot worker would subscribe to these events); it is explicitly
out of scope for the app backend.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from .models import ActivityEvent, Pet, SafetyVerdict


def record(
    verdict: SafetyVerdict,
    pet: Optional[Pet],
    *,
    mode: str,
    now: datetime,
) -> ActivityEvent:
    """Build the activity event for a (possibly vetoed) verdict."""
    return ActivityEvent(
        timestamp=now,
        pet_name=pet.name if pet else None,
        action=verdict.action,
        amount_grams=verdict.amount_grams,
        medicine_name=verdict.medicine_name,
        allowed=verdict.allowed,
        reason=verdict.reason,
        rule=verdict.rule,
        mode=mode,
    )
