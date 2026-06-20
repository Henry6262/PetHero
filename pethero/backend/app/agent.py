"""Decision agent. Proposes a dispense given the identified pet + its history.

Uses Mistral `chat.parse()` (structured, temperature=0) when MISTRAL_API_KEY and
the `mistralai` SDK are available; otherwise a deterministic rule-based fallback
so the whole backend runs offline. Either way, the proposal is *advisory* — the
safety layer has final say.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from . import config
from .models import Action, Detection, DispenseDecision, Pet

SYSTEM_PROMPT = (
    "You are PetHero, a careful pet-care assistant. Given the identified pet, its "
    "feeding schedule, medication schedule, and recent history, decide the single "
    "most appropriate action right now: feed, water, medicine, or none. Prefer a due "
    "medication over feeding. Never propose feeding if the pet was fed within its "
    "minimum interval. Keep amounts within the pet's max portion. Always explain your "
    "reasoning in one short sentence. Safety rules are enforced downstream regardless."
)


def backend_name() -> str:
    if config.MISTRAL_API_KEY and _mistral_available():
        return "mistral"
    return "rules"


def _mistral_available() -> bool:
    try:
        import mistralai  # noqa: F401

        return True
    except Exception:
        return False


def decide(
    pet: Optional[Pet],
    detection: Detection,
    *,
    now: datetime,
    last_fed: Optional[datetime] = None,
    last_dosed: Optional[dict[str, datetime]] = None,
) -> DispenseDecision:
    if pet is None:
        return DispenseDecision(
            pet_name=detection.pet_name or "unknown",
            action=Action.none,
            reasoning="No pet confidently identified.",
        )

    if backend_name() == "mistral":
        try:
            return _decide_mistral(pet, now=now, last_fed=last_fed, last_dosed=last_dosed)
        except Exception:
            # Network/API/parse failure → never block the demo; fall back to rules.
            pass

    return _decide_rules(pet, now=now, last_fed=last_fed, last_dosed=last_dosed)


# --- Rule-based fallback -------------------------------------------------

def _decide_rules(
    pet: Pet,
    *,
    now: datetime,
    last_fed: Optional[datetime],
    last_dosed: Optional[dict[str, datetime]],
) -> DispenseDecision:
    last_dosed = last_dosed or {}

    # 1) A medication that is due wins.
    for med in pet.medications:
        prev = last_dosed.get(med.name.lower())
        due = prev is None or (now - prev) >= timedelta(hours=med.interval_hours)
        if due:
            return DispenseDecision(
                pet_name=pet.name,
                action=Action.medicine,
                medicine_name=med.name,
                reasoning=f"{pet.name}'s {med.name} is due ({med.notes or 'scheduled dose'}).",
            )

    # 2) Otherwise feed if past the minimum interval.
    feed_due = last_fed is None or (now - last_fed) >= timedelta(hours=pet.min_feed_interval_hours)
    if feed_due:
        portion = round(pet.max_portion_grams * 0.8)
        ago = "not fed yet today" if last_fed is None else f"last fed {(now - last_fed).total_seconds()/3600:.1f} h ago"
        return DispenseDecision(
            pet_name=pet.name,
            action=Action.feed,
            amount_grams=portion,
            reasoning=f"{pet.name} is due for a meal ({ago}).",
        )

    # 3) Nothing needed.
    return DispenseDecision(
        pet_name=pet.name,
        action=Action.none,
        reasoning=f"{pet.name} is already fed and up to date on meds.",
    )


# --- Mistral path --------------------------------------------------------

def _decide_mistral(
    pet: Pet,
    *,
    now: datetime,
    last_fed: Optional[datetime],
    last_dosed: Optional[dict[str, datetime]],
) -> DispenseDecision:
    from mistralai import Mistral

    client = Mistral(api_key=config.MISTRAL_API_KEY)
    meds = ", ".join(f"{m.name} (every {m.interval_hours:g}h)" for m in pet.medications) or "none"
    dosed = last_dosed or {}
    dose_hist = ", ".join(
        f"{k} last {(now - v).total_seconds()/3600:.1f}h ago" for k, v in dosed.items()
    ) or "no recent doses"
    fed = "never today" if last_fed is None else f"{(now - last_fed).total_seconds()/3600:.1f}h ago"

    user = (
        f"Pet: {pet.name} ({pet.species.value}). "
        f"Max portion: {pet.max_portion_grams:g} g. "
        f"Min feed interval: {pet.min_feed_interval_hours:g} h. "
        f"Prescribed meds: {meds}. "
        f"Medication history: {dose_hist}. "
        f"Last fed: {fed}. Current time: {now.isoformat()}."
    )

    resp = client.chat.parse(
        model=config.MISTRAL_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user},
        ],
        response_format=DispenseDecision,
        temperature=0,
    )
    decision = resp.choices[0].message.parsed
    decision.pet_name = pet.name  # never let the model rename the pet
    return decision
