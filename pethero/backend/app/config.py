"""Runtime configuration. Everything is optional — sensible defaults let the
backend boot fully stubbed with no env file and no ML deps installed."""

from __future__ import annotations

import os
from pathlib import Path

# Load a .env file if python-dotenv happens to be present; never required.
try:  # pragma: no cover - convenience only
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover
    pass

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
PETS_SEED = DATA_DIR / "pets.json"

# --- Mistral agent ---
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "").strip()
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-small-latest").strip()

# --- Hugging Face vision ---
HF_TOKEN = os.getenv("HF_TOKEN", "").strip()

# --- Camera source ---
# "auto" | "none" | "<path to image/video>"
CAMERA_SOURCE = os.getenv("PETHERO_CAMERA", "auto").strip()

# --- Dispense mode ---
# "demo" -> mock dispense / video replay; "live" -> drive the robot.
DEFAULT_MODE = os.getenv("PETHERO_MODE", "demo").strip().lower()

# --- Vision confidence threshold for trusting an individual-pet ID ---
PET_ID_CONFIDENCE_THRESHOLD = float(os.getenv("PETHERO_PET_ID_THRESHOLD", "0.55"))
