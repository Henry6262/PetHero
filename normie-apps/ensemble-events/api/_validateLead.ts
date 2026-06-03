// Pure, framework-free lead validation. Unit-tested in _validateLead.test.ts.

export type EventType = "private" | "corporate" | "wedding" | "other";

export interface Lead {
  name: string;
  email: string;
  eventType: EventType;
  date?: string;
  guests?: number;
  consent: true;
}

export type ValidateResult =
  | { ok: true; data: Lead }
  | { ok: false; errors: string[]; spam?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EVENT_TYPES: EventType[] = ["private", "corporate", "wedding", "other"];
const MAX = 200;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function validateLead(input: Record<string, unknown>): ValidateResult {
  // Honeypot: a real user never fills the hidden `company` field.
  if (str(input.company).length > 0) {
    return { ok: false, errors: [], spam: true };
  }

  const errors: string[] = [];

  const name = str(input.name).slice(0, MAX);
  if (!name) errors.push("name");

  const email = str(input.email).slice(0, MAX).toLowerCase();
  if (!EMAIL_RE.test(email)) errors.push("email");

  const consentRaw = str(input.consent).toLowerCase();
  const consent = consentRaw === "on" || consentRaw === "true" || consentRaw === "1";
  if (!consent) errors.push("consent");

  if (errors.length) return { ok: false, errors };

  const etRaw = str(input.eventType).toLowerCase();
  const eventType: EventType = (EVENT_TYPES as string[]).includes(etRaw)
    ? (etRaw as EventType)
    : "other";

  const date = str(input.date).slice(0, MAX) || undefined;

  const guestsNum = Number.parseInt(str(input.guests), 10);
  const guests = Number.isFinite(guestsNum) && guestsNum > 0 ? guestsNum : undefined;

  return { ok: true, data: { name, email, eventType, date, guests, consent: true } };
}
