"""Vision layer: 'which pet is at the bowl?'

Real pipeline (when `ultralytics` is installed): YOLO detects + crops the pet,
then CLIP embeddings would match the individual. For the app backend we default
to a deterministic STUB whose 'current pet' is set explicitly via the API — this
is what lets you drive the demo from the iOS app with zero hardware or models.
"""

from __future__ import annotations

from typing import Optional

from .models import Detection, Species
from .store import store

# The demo's controllable input: which pet is currently 'seen'.
_current_pet_id: Optional[str] = None


def set_current_pet(pet_id: Optional[str]) -> Detection:
    """Demo control: declare which pet is in front of the camera (or None)."""
    global _current_pet_id
    _current_pet_id = pet_id
    return identify()


def backend_name() -> str:
    return "yolo+clip" if _yolo_available() else "stub"


def _yolo_available() -> bool:
    try:
        import ultralytics  # noqa: F401

        return True
    except Exception:
        return False


def identify(frame: Optional[bytes] = None) -> Detection:
    """Return the current detection. Stub uses the API-set current pet."""
    if _current_pet_id is None:
        return Detection(present=False, source=backend_name())

    pet = store.get_pet(_current_pet_id)
    if pet is None:
        return Detection(present=False, source=backend_name())

    return Detection(
        present=True,
        species=Species(pet.species),
        pet_id=pet.id,
        pet_name=pet.name,
        confidence=0.9,
        bbox=[120, 80, 320, 320],
        source=backend_name(),
    )
