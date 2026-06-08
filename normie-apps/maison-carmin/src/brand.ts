// Single source of truth for brand identity + channels.
export const BRAND_NAME = "Maison Carmin";
export const BRAND_SHORT = "MC";
export const BRAND_CITY = "Zürich";
export const BRAND_TAGLINE = "Fire, set in Zürich.";
export const ESTABLISHED = 2026;

// Logo lives in /public. Drop the file here and the nav switches from the text
// wordmark to the image automatically.
export const LOGO_SRC = "/logo.svg";

// PLACEHOLDERS — atelier to provide real channels before launch.
export const CONTACT = {
  email: "atelier@maisoncarmin.ch",
  emailHref: "mailto:atelier@maisoncarmin.ch",
  phone: "+41 44 000 00 00",
  phoneHref: "tel:+41440000000",
  whatsappHref: "https://wa.me/41440000000",
} as const;

export const SOCIAL = {
  instagram: "https://instagram.com/",
  pinterest: "https://pinterest.com/",
} as const;

// The Zürich atelier (placeholder — confirm before launch).
export const ATELIER = {
  street: "Bahnhofstrasse 1",
  postcode: "8001 Zürich",
  country: "Switzerland",
  hours: "By appointment · Tue–Sat",
} as const;
