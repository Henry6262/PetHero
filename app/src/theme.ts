// Design tokens matching the PetHero prototype — warm, light, premium.

export const colors = {
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

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

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
