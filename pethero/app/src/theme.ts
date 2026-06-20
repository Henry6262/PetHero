// Design tokens matching the PetHero prototype — warm, light, premium.
// Spacing follows an 8pt grid: 4/8/16/24/32/48.

export const lightColors = {
  bg: "#F3EEE7", // outer cream
  screen: "#FBF9F5", // app surface
  card: "#FFFFFF",
  border: "rgba(28,24,18,0.08)",
  borderStrong: "rgba(28,24,18,0.14)",

  text: "#1B1A18",
  muted: "#9A948A",
  label: "#A9A299", // uppercase section labels

  green: "#16A34A",
  greenSoft: "#ECF7EF",
  red: "#DC2626",
  redSoft: "#FCEEEC",
  blue: "#3BA0E3",
  blueSoft: "#EAF5FC",
  amber: "#C98A2B",
  amberSoft: "#FBF6EC",

  live: "#1C1B19", // dark camera panel
  liveText: "#8B8983",
};

export const darkColors = {
  // Elevation-aware dark surface: higher layers are lighter so shadows read as depth.
  bg: "#0A0A0C",
  screen: "#121214", // app surface
  card: "#1C1C20", // cards / sheets
  sheet: "#222226", // bottom sheet (slightly above card)
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",

  text: "#F5F5F0",
  muted: "#A0A0A0",
  label: "#888888",

  green: "#4ADE80",
  greenSoft: "rgba(74,222,128,0.12)",
  red: "#F87171",
  redSoft: "rgba(248,113,113,0.12)",
  blue: "#60A5FA",
  blueSoft: "rgba(96,165,250,0.12)",
  amber: "#FBBF24",
  amberSoft: "rgba(251,191,36,0.12)",

  live: "#0A0A0C",
  liveText: "#6B6B6B",
};

export type ThemeColors = typeof lightColors;

export const palettes = {
  light: lightColors,
  dark: darkColors,
};

// Back-compat: static light palette for components not yet migrated to
// useTheme() (PetsVariants, DispenseVariants). Safe to drop once they are.
export const colors = lightColors;

export type Theme = keyof typeof palettes;

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const shadow = {
  // Soft warm-gray shadows for depth on the cream surface.
  card: {
    shadowColor: "#4A4038",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  lift: {
    shadowColor: "#4A4038",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
};
