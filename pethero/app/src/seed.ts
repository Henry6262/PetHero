import type { Pet } from "./types";

// Local fallback so the UI is populated even when the backend isn't reachable
// (e.g. a TestFlight build before the backend is deployed). Mirrors
// backend/data/pets.json. Live agent reasoning / dispense still require the API.
export const SEED_PETS: Pet[] = [
  {
    id: "banga",
    name: "Banga",
    species: "cat",
    photo_ref: "banga.png",
    color: "red",
    food_options: [
      { id: "default", name: "Pastrami", portion_grams: 45, min_interval_hours: 5, is_default: true },
    ],
    medications: [
      { id: "red", name: "red pill", dose_count: 1, interval_hours: 12, notes: "Matrix red pill", active: true },
      { id: "black", name: "black pill", dose_count: 1, interval_hours: 12, notes: "Matrix black pill", active: true },
      { id: "blue", name: "blue pill", dose_count: 1, interval_hours: 12, notes: "Matrix blue pill", active: true },
    ],
    automation_enabled: true,
    weight_kg: 4.2,
    daily_water_ml: 220,
    daily_food_grams: 45,
  },
  {
    id: "ranga",
    name: "Ranga",
    species: "cat",
    photo_ref: "ranga.png",
    color: "orange",
    food_options: [
      { id: "default", name: "Pastrami", portion_grams: 55, min_interval_hours: 4, is_default: true },
    ],
    medications: [
      { id: "red", name: "red pill", dose_count: 1, interval_hours: 12, notes: "Matrix red pill", active: true },
      { id: "black", name: "black pill", dose_count: 1, interval_hours: 12, notes: "Matrix black pill", active: true },
      { id: "blue", name: "blue pill", dose_count: 1, interval_hours: 12, notes: "Matrix blue pill", active: true },
    ],
    automation_enabled: false,
    weight_kg: 5.1,
    daily_water_ml: 260,
    daily_food_grams: 55,
  },
];
