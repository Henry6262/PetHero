import type { ActivityEvent, Pet } from "./types";

export interface PetStatus {
  label: string;
  tone: "good" | "alert" | "muted";
}

// Derive a pet's headline status from the activity log (newest-first).
export function deriveStatus(pet: Pet, log: ActivityEvent[]): PetStatus {
  const mine = log.filter((e) => e.pet_name === pet.name);
  const lastAllowed = mine.find((e) => e.allowed);

  const hasMeds = pet.medications.length > 0;
  const dosed = mine.some((e) => e.allowed && e.action === "medicine");

  if (hasMeds && !dosed) {
    return { label: "pill due", tone: "alert" };
  }
  if (lastAllowed?.action === "feed") {
    return { label: "fed · all good", tone: "good" };
  }
  if (lastAllowed?.action === "medicine") {
    return { label: "meds given", tone: "good" };
  }
  return { label: "all good", tone: "good" };
}

export function petEmoji(species: string): string {
  return species === "dog" ? "🐶" : "🐱";
}
