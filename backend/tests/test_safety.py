"""Safety layer is the heart of PetHero's trust story. The agent only *proposes*;
these code-enforced rules decide. Pure functions, deterministic, fully tested."""

from datetime import datetime, timedelta

import pytest

from app.models import Action, DispenseDecision, Medication, Pet, Species
from app import safety

NOW = datetime(2026, 6, 20, 14, 0, 0)


def cat(**over) -> Pet:
    base = dict(
        id="mittens",
        name="Mittens",
        species=Species.cat,
        max_portion_grams=50,
        min_feed_interval_hours=4,
        medications=[Medication(name="thyroid", dose_count=1, interval_hours=12)],
    )
    base.update(over)
    return Pet(**base)


def feed(grams=40, name="Mittens") -> DispenseDecision:
    return DispenseDecision(pet_name=name, action=Action.feed, amount_grams=grams)


def med(name="thyroid", pet="Mittens") -> DispenseDecision:
    return DispenseDecision(pet_name=pet, action=Action.medicine, medicine_name=name)


# --- Happy paths ---------------------------------------------------------

def test_scheduled_feed_allowed():
    v = safety.evaluate(feed(40), cat(), now=NOW, last_fed=NOW - timedelta(hours=6))
    assert v.allowed and v.action is Action.feed and v.amount_grams == 40


def test_water_always_allowed_even_for_unknown_pet():
    v = safety.evaluate(
        DispenseDecision(pet_name="?", action=Action.water), None, now=NOW
    )
    assert v.allowed and v.action is Action.water


def test_prescribed_medicine_when_due_allowed():
    v = safety.evaluate(med(), cat(), now=NOW, last_dosed={"thyroid": NOW - timedelta(hours=13)})
    assert v.allowed and v.action is Action.medicine


# --- Feeding interval ----------------------------------------------------

def test_feed_too_soon_is_vetoed():
    v = safety.evaluate(feed(40), cat(), now=NOW, last_fed=NOW - timedelta(hours=1))
    assert not v.allowed
    assert v.rule == "feed_interval"
    assert "already" in v.reason.lower()


def test_portion_over_cap_is_clamped():
    v = safety.evaluate(feed(500), cat(), now=NOW, last_fed=NOW - timedelta(hours=6))
    assert v.allowed and v.adjusted and v.amount_grams == 50


# --- Medicine safety -----------------------------------------------------

def test_double_dose_vetoed():
    v = safety.evaluate(med(), cat(), now=NOW, last_dosed={"thyroid": NOW - timedelta(minutes=20)})
    assert not v.allowed and v.rule == "double_dose"


def test_unprescribed_medicine_vetoed():
    v = safety.evaluate(med(name="amoxicillin"), cat(), now=NOW)
    assert not v.allowed and v.rule == "not_prescribed"


def test_toxic_substance_vetoed_with_clear_reason():
    # The headline demo beat: ibuprofen requested for a cat.
    v = safety.evaluate(med(name="ibuprofen"), cat(), now=NOW)
    assert not v.allowed and v.rule == "toxic"
    assert "toxic" in v.reason.lower() and "cat" in v.reason.lower()


def test_medicine_without_name_vetoed():
    d = DispenseDecision(pet_name="Mittens", action=Action.medicine, medicine_name=None)
    v = safety.evaluate(d, cat(), now=NOW)
    assert not v.allowed and v.rule == "no_medicine_name"


# --- Unknown pet ---------------------------------------------------------

def test_unknown_pet_blocks_feed():
    v = safety.evaluate(feed(40), None, now=NOW)
    assert not v.allowed and v.rule == "unknown_pet"


def test_unknown_pet_blocks_medicine():
    v = safety.evaluate(med(), None, now=NOW)
    assert not v.allowed and v.rule == "unknown_pet"


# --- Cross-pet protection ------------------------------------------------

def test_medicine_for_wrong_pet_uses_target_pet_prescription():
    # Decision names Max's drug but the pet at the bowl is Mittens (a cat).
    v = safety.evaluate(med(name="joint-supplement", pet="Max"), cat(), now=NOW)
    assert not v.allowed and v.rule == "not_prescribed"


def test_none_action_is_noop_allowed():
    v = safety.evaluate(
        DispenseDecision(pet_name="Mittens", action=Action.none), cat(), now=NOW
    )
    assert v.allowed and v.action is Action.none
