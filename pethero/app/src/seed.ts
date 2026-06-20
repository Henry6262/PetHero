import type { Pet } from "./types";

// Local fallback so the UI is populated even when the backend isn't reachable
// (e.g. a TestFlight build before the backend is deployed). Mirrors
// backend/data/pets.json. Live agent reasoning / dispense still require the API.
export const SEED_PETS: Pet[] = [
  {
    id: "mittens",
    name: "Mittens",
    species: "cat",
    photo_ref: "",
    max_portion_grams: 50,
    min_feed_interval_hours: 4,
    medications: [{ name: "thyroid", dose_count: 1, interval_hours: 12, notes: "Hyperthyroid — 1 pill twice daily" }],
  },
  {
    id: "whiskers",
    name: "Whiskers",
    species: "cat",
    photo_ref: "",
    max_portion_grams: 45,
    min_feed_interval_hours: 5,
    medications: [],
  },
  {
    id: "max",
    name: "Max",
    species: "dog",
    photo_ref: "",
    max_portion_grams: 120,
    min_feed_interval_hours: 6,
    medications: [{ name: "joint-supplement", dose_count: 1, interval_hours: 24, notes: "Glucosamine — once daily" }],
  },
];
