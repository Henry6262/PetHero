// Mirrors the backend Pydantic models (pethero/backend/app/models.py).

export type Action = "feed" | "water" | "medicine" | "none";
export type Species = "cat" | "dog";

export interface Medication {
  name: string;
  dose_count: number;
  interval_hours: number;
  notes: string;
}

export interface Pet {
  id: string;
  name: string;
  species: Species;
  photo_ref: string;
  max_portion_grams: number;
  min_feed_interval_hours: number;
  medications: Medication[];
}

export interface Detection {
  present: boolean;
  species: Species | null;
  pet_id: string | null;
  pet_name: string | null;
  confidence: number;
  bbox: number[] | null;
  source: string;
}

export interface DispenseDecision {
  pet_name: string;
  action: Action;
  amount_grams: number;
  medicine_name: string | null;
  reasoning: string;
}

export interface ActivityEvent {
  timestamp: string;
  pet_name: string | null;
  action: Action;
  amount_grams: number;
  medicine_name: string | null;
  allowed: boolean;
  reason: string;
  rule: string | null;
  mode: string;
}

export interface SystemStatus {
  mode: string;
  vision_backend: string;
  agent_backend: string;
  camera: string;
  pets: number;
  state: string;
}

// WebSocket envelopes (each carries a `type` discriminator).
export type WsMessage =
  | ({ type: "status" } & SystemStatus)
  | ({ type: "detection" } & Detection)
  | ({ type: "decision" } & DispenseDecision)
  | ({ type: "event" } & ActivityEvent)
  | { type: "frame"; jpeg_b64: string };
