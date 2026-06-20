"""Code-enforced pet-care safety rules.

The Mistral agent only *proposes* a dispense. These deterministic rules decide.
Never trust an LLM with a dosing decision — the rules veto, clamp, or allow.
Pure functions, no I/O, time injected for testability.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from .models import Action, DispenseDecision, Pet, SafetyVerdict, Species

# Substances dangerous to dispense to a given species. Used as a hard block even
# if something upstream mistakenly proposes them.
TOXIC_SUBSTANCES: dict[Species, set[str]] = {
    Species.cat: {
        "ibuprofen", "paracetamol", "acetaminophen", "aspirin", "caffeine",
        "chocolate", "xylitol", "onion", "garlic", "grapes", "raisins",
    },
    Species.dog: {
        "ibuprofen", "chocolate", "xylitol", "grapes", "raisins", "onion",
        "garlic", "caffeine", "macadamia", "paracetamol", "acetaminophen",
    },
}


def _veto(rule: str, reason: str, decision: DispenseDecision) -> SafetyVerdict:
    return SafetyVerdict(
        allowed=False,
        action=Action.none,
        amount_grams=0,
        medicine_name=decision.medicine_name,
        reason=reason,
        rule=rule,
    )


def _fmt_hours(delta: timedelta) -> str:
    hours = delta.total_seconds() / 3600
    if hours < 1:
        return f"{int(delta.total_seconds() / 60)} min"
    return f"{hours:.1f} h"


def evaluate(
    decision: DispenseDecision,
    pet: Optional[Pet],
    *,
    now: datetime,
    last_fed: Optional[datetime] = None,
    last_dosed: Optional[dict[str, datetime]] = None,
) -> SafetyVerdict:
    """Return the final, code-enforced outcome for a proposed dispense."""
    last_dosed = last_dosed or {}

    # No-op proposal — nothing to guard.
    if decision.action is Action.none:
        return SafetyVerdict(allowed=True, action=Action.none, reason="No action needed.")

    # Water is always safe, even if we couldn't identify the pet.
    if decision.action is Action.water:
        return SafetyVerdict(allowed=True, action=Action.water, reason="Fresh water dispensed.")

    # Beyond water, we must know who the pet is.
    if pet is None:
        return _veto(
            "unknown_pet",
            "Pet not identified — only water can be dispensed safely.",
            decision,
        )

    # --- Feeding ---------------------------------------------------------
    if decision.action is Action.feed:
        if last_fed is not None:
            since = now - last_fed
            if since < timedelta(hours=pet.min_feed_interval_hours):
                return _veto(
                    "feed_interval",
                    f"Skipped — {pet.name} was already fed {_fmt_hours(since)} ago "
                    f"(min interval {pet.min_feed_interval_hours:g} h).",
                    decision,
                )

        amount = decision.amount_grams
        adjusted = False
        if amount > pet.max_portion_grams:
            amount = pet.max_portion_grams
            adjusted = True

        reason = f"Dispensing {amount:g} g for {pet.name}."
        if adjusted:
            reason = (
                f"Capped at {pet.max_portion_grams:g} g for {pet.name} "
                f"(requested {decision.amount_grams:g} g)."
            )
        return SafetyVerdict(
            allowed=True,
            action=Action.feed,
            amount_grams=amount,
            reason=reason,
            rule="portion_cap" if adjusted else None,
            adjusted=adjusted,
        )

    # --- Medicine --------------------------------------------------------
    if decision.action is Action.medicine:
        name = (decision.medicine_name or "").strip().lower()
        if not name:
            return _veto("no_medicine_name", "No medicine specified — blocked.", decision)

        # Hard toxic block first — the clearest, most important safety signal.
        if name in TOXIC_SUBSTANCES.get(pet.species, set()):
            return _veto(
                "toxic",
                f"{decision.medicine_name} is toxic to {pet.species.value}s. Dispense blocked.",
                decision,
            )

        med = pet.medication(name)
        if med is None:
            return _veto(
                "not_prescribed",
                f"{decision.medicine_name} is not prescribed for {pet.name}. Blocked.",
                decision,
            )

        prev = last_dosed.get(name)
        if prev is not None:
            since = now - prev
            if since < timedelta(hours=med.interval_hours):
                next_in = timedelta(hours=med.interval_hours) - since
                return _veto(
                    "double_dose",
                    f"Skipped meds — {pet.name} had {decision.medicine_name} "
                    f"{_fmt_hours(since)} ago; next dose in {_fmt_hours(next_in)}.",
                    decision,
                )

        return SafetyVerdict(
            allowed=True,
            action=Action.medicine,
            medicine_name=decision.medicine_name,
            reason=f"Dispensing {med.dose_count} × {decision.medicine_name} for {pet.name}.",
        )

    return _veto("unknown_action", "Unrecognised action — blocked.", decision)
