import { SEASON_YEAR } from "@app/brand";

export type BracketId = "U10" | "U12" | "U14" | "U16" | "U18";

export interface Bracket {
  id: BracketId;
  /** Inclusive birth-year window for the 2026 season. */
  minBorn: number;
  maxBorn: number;
  /** Game format played in this bracket. */
  format: string;
  /** Rough age span, for display. */
  ages: string;
}

// Calendar-year-of-birth bands for the 2026 season. Confirm the exact cut-off
// rule with the organiser — youth basketball commonly bands by birth year.
export const BRACKETS: Bracket[] = [
  { id: "U10", minBorn: 2017, maxBorn: 2018, format: "3x3", ages: "8–9" },
  { id: "U12", minBorn: 2015, maxBorn: 2016, format: "3x3", ages: "10–11" },
  { id: "U14", minBorn: 2013, maxBorn: 2014, format: "3x3", ages: "12–13" },
  { id: "U16", minBorn: 2011, maxBorn: 2012, format: "3x3", ages: "14–15" },
  { id: "U18", minBorn: 2009, maxBorn: 2010, format: "3x3", ages: "16–17" },
];

export const MIN_BORN = Math.min(...BRACKETS.map((b) => b.minBorn));
export const MAX_BORN = Math.max(...BRACKETS.map((b) => b.maxBorn));

/** Birth years offered in the registration form (newest first). */
export const BIRTH_YEARS: number[] = Array.from(
  { length: MAX_BORN - MIN_BORN + 1 },
  (_, i) => MAX_BORN - i
);

/** Resolve the bracket a birth year falls into, or null if outside the range. */
export function bracketForBirthYear(year: number): Bracket | null {
  if (!Number.isFinite(year)) return null;
  return BRACKETS.find((b) => year >= b.minBorn && year <= b.maxBorn) ?? null;
}

/** Everyone in these brackets is a minor in the {@link SEASON_YEAR} season. */
export function isMinor(birthYear: number): boolean {
  return SEASON_YEAR - birthYear < 18;
}
