// The revenue engine: paid coaching programs. Copy (title/blurb) is resolved via
// i18n keys (coaching.programs.<id>.*); the structured fields below drive layout
// + the price line. PRICES ARE PLACEHOLDERS — organiser to confirm.

export type ProgramId = "weekly" | "camps";

export interface Program {
  id: ProgramId;
  /** Lowest price, in CHF. */
  priceFrom: number;
  /** i18n key suffix for the billing unit, e.g. "perMonth" / "perCamp". */
  unitKey: string;
  /** Which brackets it serves, for the eyebrow. */
  ages: string;
}

export const PROGRAMS: Program[] = [
  { id: "weekly", priceFrom: 49, unitKey: "perMonth", ages: "U10–U18" },
  { id: "camps", priceFrom: 120, unitKey: "perCamp", ages: "U10–U18" },
];
