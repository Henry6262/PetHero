// Single source of truth for brand identity + channels.
export const BRAND_NAME = "Züri Street Ball";
export const BRAND_SHORT = "ZSB";
export const BRAND_CITY = "Zürich";
export const SEASON_YEAR = 2026;

// Logo lives in /public. Drop the file here and the nav switches from the text
// wordmark to the image automatically.
export const LOGO_SRC = "/logo.svg";

// PLACEHOLDERS — organiser to provide real channels before launch.
export const CONTACT = {
  whatsapp: "+41 00 000 00 00",
  whatsappHref: "https://wa.me/41000000000",
  email: "hoi@zuristreetball.example",
  emailHref: "mailto:hoi@zuristreetball.example",
} as const;

export const SOCIAL = {
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
} as const;

// Zürich courts the jams + classes run on (placeholders — confirm before launch).
export const VENUES = [
  { name: "Josefwiese", area: "Kreis 5" },
  { name: "Heuried", area: "Wiedikon" },
  { name: "Letzigrund forecourt", area: "Albisrieden" },
] as const;
