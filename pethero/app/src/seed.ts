import type { Pet } from "./types";

// Local fallback so the UI is populated even when the backend isn't reachable
// (e.g. a TestFlight build before the backend is deployed). Mirrors
// backend/data/pets.json. Live agent reasoning / dispense still require the API.
export const SEED_PETS: Pet[] = [
  {
    id: "mochi",
    name: "Mochi",
    species: "cat",
    photo_ref: "mochi.png",
    food_options: [
      { id: "default", name: "Dry food", portion_grams: 45, min_interval_hours: 5, is_default: true },
    ],
    medications: [
      { id: "thyroid", name: "thyroid", dose_count: 1, interval_hours: 12, notes: "Hyperthyroid — 1 pill twice daily", active: true },
    ],
  },
  {
    id: "biscuit",
    name: "Biscuit",
    species: "cat",
    photo_ref: "biscuit.png",
    food_options: [
      { id: "default", name: "Dry food", portion_grams: 55, min_interval_hours: 4, is_default: true },
    ],
    medications: [],
  },
  {
    id: "pixel",
    name: "Pixel",
    species: "cat",
    photo_ref: "pixel.png",
    food_options: [
      { id: "default", name: "Dry food", portion_grams: 40, min_interval_hours: 5, is_default: true },
    ],
    medications: [],
  },
];
