import { BASE_URL } from "./config";
import type { ActivityEvent, DispenseDecision, FoodOption, Medication, Pet, SystemStatus, Action, PetAvatar } from "./types";

export interface PetSettingsPayload {
  automation_enabled?: boolean;
  food_options?: FoodOption[];
  medications?: Medication[];
  color?: string;
  weight_kg?: number;
  daily_water_ml?: number;
  daily_food_grams?: number;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  status: () => req<SystemStatus>("/status"),
  pets: () => req<Pet[]>("/pets"),
  log: () => req<ActivityEvent[]>("/log"),

  setMode: (mode: "demo" | "live") =>
    req<SystemStatus>("/mode", { method: "POST", body: JSON.stringify({ mode }) }),

  // Demo control: declare which pet is at the bowl (null = no pet / unknown).
  setCurrentPet: (petId: string | null) =>
    req(`/vision/current${petId ? `?pet_id=${encodeURIComponent(petId)}` : ""}`, {
      method: "POST",
    }),

  // Run one autonomous step on the current frame.
  process: () => req<{ decision: DispenseDecision; event: ActivityEvent }>("/process", { method: "POST" }),

  // Owner pressed a Feed / Water / Medicine button.
  trigger: (pet_id: string, action: Action, medicine_name?: string) =>
    req<{ decision: DispenseDecision; event: ActivityEvent }>("/trigger", {
      method: "POST",
      body: JSON.stringify({ pet_id, action, medicine_name }),
    }),

  // 3D avatar generation via Meshy AI pipeline.
  startAvatar: (pet_id: string) =>
    req<{ avatar: PetAvatar }>(`/pets/${encodeURIComponent(pet_id)}/avatar`, { method: "POST" }),

  getAvatar: (pet_id: string) =>
    req<{ avatar: PetAvatar }>(`/pets/${encodeURIComponent(pet_id)}/avatar`),

  deleteAvatar: (pet_id: string) =>
    req<void>(`/pets/${encodeURIComponent(pet_id)}/avatar`, { method: "DELETE" }),

  getPetSettings: (pet_id: string) =>
    req<Pet>(`/pets/${encodeURIComponent(pet_id)}/settings`),

  updatePetSettings: (pet_id: string, payload: PetSettingsPayload) =>
    req<Pet>(`/pets/${encodeURIComponent(pet_id)}/settings`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
