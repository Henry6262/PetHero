/**
 * Operator visual theme tokens.
 *
 * Keep this file as the single source of truth for colors that appear in the
 * tactical scene and the dashboard UI. New features (map layers, overlays,
 * detections) should derive from these tokens instead of adding one-off hex
 * values elsewhere.
 */

export type StatusKind =
  | "clear"
  | "partial"
  | "unmapped"
  | "conflict"
  | "stale"
  | "alert"
  | "observed"
  | "station"
  | "goal"
  | "route"
  | "street"
  | "deadEnd"
  | "rejected"
  | "trusted"
  | "operator"
  | "relay";

export interface StatusThemeEntry {
  /** Primary color for the status (hex). */
  color: string;
  /** Background color for UI chips/pills (rgba). */
  bg: string;
  /** Border color for UI chips/pills (rgba or hex). */
  border: string;
  /** Emissive color used on 3D meshes. */
  emissive: string;
  /** Emissive intensity for 3D meshes (normal). */
  emissiveIntensity: number;
  /** Human-readable label used in panels. */
  label: string;
}

export const STATUS_THEME: Record<StatusKind, StatusThemeEntry> = {
  clear: {
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.14)",
    border: "rgba(52, 211, 153, 0.4)",
    emissive: "#34d399",
    emissiveIntensity: 0.35,
    label: "INSPECTED",
  },
  partial: {
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.14)",
    border: "rgba(251, 191, 36, 0.4)",
    emissive: "#fbbf24",
    emissiveIntensity: 0.35,
    label: "PARTIAL",
  },
  unmapped: {
    color: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.35)",
    emissive: "#6b7280",
    emissiveIntensity: 0.15,
    label: "NOT INSPECTED",
  },
  conflict: {
    color: "#f87171",
    bg: "rgba(248, 113, 113, 0.14)",
    border: "rgba(248, 113, 113, 0.4)",
    emissive: "#f87171",
    emissiveIntensity: 0.55,
    label: "CONFLICT",
  },
  stale: {
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.14)",
    border: "rgba(251, 191, 36, 0.4)",
    emissive: "#fbbf24",
    emissiveIntensity: 0.3,
    label: "STALE",
  },
  alert: {
    color: "#f87171",
    bg: "rgba(248, 113, 113, 0.2)",
    border: "rgba(248, 113, 113, 0.55)",
    emissive: "#f87171",
    emissiveIntensity: 0.55,
    label: "ALERT",
  },
  observed: {
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.18)",
    border: "1px solid rgba(52, 211, 153, 0.5)",
    emissive: "#34d399",
    emissiveIntensity: 0.35,
    label: "OBSERVED",
  },
  station: {
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.3)",
    border: "1px solid #34d399",
    emissive: "#22c55e",
    emissiveIntensity: 0.35,
    label: "STATION",
  },
  goal: {
    color: "#4ade80",
    bg: "rgba(52, 211, 153, 0.42)",
    border: "1px solid #5fe6b0",
    emissive: "#4ade80",
    emissiveIntensity: 0.35,
    label: "GOAL",
  },
  route: {
    color: "#3b8c5f",
    bg: "rgba(59, 140, 95, 0.2)",
    border: "rgba(59, 140, 95, 0.5)",
    emissive: "#3b8c5f",
    emissiveIntensity: 0.35,
    label: "ROUTE",
  },
  street: {
    color: "#2f6b47",
    bg: "rgba(47, 107, 71, 0.2)",
    border: "rgba(47, 107, 71, 0.5)",
    emissive: "#2f6b47",
    emissiveIntensity: 0.2,
    label: "STREET",
  },
  deadEnd: {
    color: "#f87171",
    bg: "rgba(248, 113, 113, 0.2)",
    border: "1px solid rgba(248, 113, 113, 0.55)",
    emissive: "#f87171",
    emissiveIntensity: 0.55,
    label: "DEAD END",
  },
  rejected: {
    color: "#f87171",
    bg: "rgba(248, 113, 113, 0.14)",
    border: "rgba(248, 113, 113, 0.4)",
    emissive: "#f87171",
    emissiveIntensity: 0.55,
    label: "REJECTED",
  },
  trusted: {
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.14)",
    border: "rgba(52, 211, 153, 0.4)",
    emissive: "#34d399",
    emissiveIntensity: 0.35,
    label: "TRUSTED",
  },
  operator: {
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.14)",
    border: "rgba(251, 191, 36, 0.4)",
    emissive: "#fbbf24",
    emissiveIntensity: 0.35,
    label: "OPERATOR",
  },
  relay: {
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.14)",
    border: "rgba(251, 191, 36, 0.4)",
    emissive: "#fbbf24",
    emissiveIntensity: 0.35,
    label: "RELAY",
  },
};

/** Agent/role accent colors used in cards, pucks, and popovers. */
export const AGENT_ACCENT: Record<string, string> = {
  op: "#fbbf24",
  quad: "#34d399",
  hexapod: "#5fb2ff",
  drone: "#94a3b8",
  "OP-7": "#fbbf24",
  "V-02": "#a78bfa",
  "A-03": "#60a5fa",
  "R-04": "#f87171",
  Q1: "#34d399",
  H1: "#5fb2ff",
  D1: "#94a3b8",
};

/** Common UI colors not tied to a status. */
export const UI_THEME = {
  background: "#0d1117",
  fog: "#0d1117",
  panelText: "#9fd0ff",
  subtleText: "#94a3b8",
  borderSubtle: "rgba(148, 163, 184, 0.25)",
};

/** Terrain surface colors by height and slope. */
export const TERRAIN_THEME = {
  lowFlat: "#3d7a4f",
  midGentle: "#4a6b45",
  steep: "#6b5d4d",
  high: "#3e4d3f",
};
