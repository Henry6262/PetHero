// Single source of truth for brand identity + contact channels.
// The name is a swappable token — never hardcode "Ensemble" in components.
export const BRAND_NAME = "Ensemble";
export const BRAND_CITY = "Zürich";

// PLACEHOLDERS — founder to provide real channels before launch.
export const CONTACT = {
  whatsapp: "+41 00 000 00 00",
  whatsappHref: "https://wa.me/41000000000",
  phone: "+41 00 000 00 00",
  phoneHref: "tel:+41000000000",
  email: "hello@ensemble.example",
  emailHref: "mailto:hello@ensemble.example",
} as const;

export const SOCIAL = {
  instagram: "#",
  linkedin: "#",
} as const;
