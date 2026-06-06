// Pure, framework-free registration validation. Unit-tested in
// _validateRegistration.test.ts. The bracket is ALWAYS re-derived here from the
// birth year — the client value is never trusted.

export type Mode = "jam" | "coaching";
export type BracketId = "U10" | "U12" | "U14" | "U16" | "U18";

interface BracketDef {
  id: BracketId;
  minBorn: number;
  maxBorn: number;
}

// Kept in sync with src/data/brackets.ts (2026 season). Duplicated here so the
// serverless function has zero src/ imports.
const SEASON_YEAR = 2026;
const BRACKETS: BracketDef[] = [
  { id: "U10", minBorn: 2017, maxBorn: 2018 },
  { id: "U12", minBorn: 2015, maxBorn: 2016 },
  { id: "U14", minBorn: 2013, maxBorn: 2014 },
  { id: "U16", minBorn: 2011, maxBorn: 2012 },
  { id: "U18", minBorn: 2009, maxBorn: 2010 },
];

export function bracketForBirthYear(year: number): BracketId | null {
  const b = BRACKETS.find((x) => year >= x.minBorn && year <= x.maxBorn);
  return b ? b.id : null;
}

export interface Registration {
  mode: Mode;
  name: string;
  email: string;
  birthYear: number;
  bracket: BracketId;
  phone?: string;
  position?: string;
  skill?: string;
  program?: string;
  consent: true;
}

export type ValidateResult =
  | { ok: true; data: Registration }
  | { ok: false; errors: string[]; spam?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = 200;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function validateRegistration(input: Record<string, unknown>): ValidateResult {
  // Honeypot: a real user never fills the hidden `company` field.
  if (str(input.company).length > 0) {
    return { ok: false, errors: [], spam: true };
  }

  const errors: string[] = [];

  const mode: Mode = str(input.mode).toLowerCase() === "coaching" ? "coaching" : "jam";

  const name = str(input.name).slice(0, MAX);
  if (!name) errors.push("name");

  const email = str(input.email).slice(0, MAX).toLowerCase();
  if (!EMAIL_RE.test(email)) errors.push("email");

  const birthYear = Number.parseInt(str(input.birthYear), 10);
  const bracket = Number.isFinite(birthYear) ? bracketForBirthYear(birthYear) : null;
  if (!bracket) errors.push("birthYear");

  // Everyone in U10–U18 is a minor → guardian consent is mandatory.
  const consentRaw = str(input.consent).toLowerCase();
  const consent = consentRaw === "on" || consentRaw === "true" || consentRaw === "1";
  const minor = Number.isFinite(birthYear) && SEASON_YEAR - birthYear < 18;
  if (minor && !consent) errors.push("consent");

  if (errors.length || !bracket) return { ok: false, errors };

  const phone = str(input.phone).slice(0, MAX) || undefined;

  const data: Registration = {
    mode,
    name,
    email,
    birthYear,
    bracket,
    phone,
    consent: true,
  };

  if (mode === "jam") {
    data.position = str(input.position).slice(0, MAX) || undefined;
    data.skill = str(input.skill).slice(0, MAX) || undefined;
  } else {
    data.program = str(input.program).slice(0, MAX) || undefined;
  }

  return { ok: true, data };
}
