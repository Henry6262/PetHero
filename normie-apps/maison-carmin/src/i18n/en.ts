// Note: intentionally NOT `as const` — leaf values widen to `string` so the
// German dictionary (which differs) is assignable to the same shape.
const en = {
  nav: {
    collection: "Collection",
    craft: "The Craft",
    bespoke: "Bespoke",
    atelier: "Atelier",
    cta: "Enquire",
  },
  hero: {
    tag: "Zürich · Maison de Joaillerie",
    titleLine1: "The Carmin",
    titleLine2: "Ruby",
    sub: "A Zürich atelier for ruby fine jewelry. Each piece is hand-set in gold and platinum, then turned in the light so you can see the fire before it is yours.",
    ctaCollection: "View the collection",
    ctaBespoke: "Commission a piece",
    stats: {
      pieces: "Pieces",
      carats: "Carats set",
      years: "Years of craft",
      city: "Atelier",
    },
    cityValue: "Zürich",
  },
  marquee: {
    a: "Hand-set in Zürich",
    b: "Ethically sourced rubies",
    c: "Lifetime care",
    d: "Price on request",
    e: "Private appointments",
  },
  collection: {
    eyebrow: "The Collection",
    title: "Fire you can turn in your hand.",
    lead: "A small, deliberate collection. Spin each piece, read the stone, and enquire to reserve a private viewing at the atelier.",
    metal: "Metal",
    stone: "Stone",
    carat: "Carat",
    price: "Price on request",
    enquire: "Enquire about this piece",
  },
  craft: {
    eyebrow: "The Craft",
    title: "Why we set in red.",
    lead: "Ruby is the most demanding stone a house can choose. It rewards patience and punishes shortcuts — which is exactly why we built the Maison around it.",
    points: {
      source: {
        title: "Sourced with conscience",
        body: "Every ruby is traced to a responsible origin and selected by hand for colour, clarity and fire — never by the carat alone.",
      },
      set: {
        title: "Set by one bench",
        body: "From wax to final polish, a single Zürich master jeweller carries each piece. No piece passes through anonymous hands.",
      },
      kept: {
        title: "Kept for life",
        body: "Cleaning, re-tipping and resizing are part of ownership, not an upsell. A Maison Carmin piece is meant to be worn, and worn again.",
      },
    },
  },
  bespoke: {
    eyebrow: "Bespoke",
    title: "Commission something that only exists for you.",
    lead: "Bring a stone, an heirloom, or only an idea. We design around it and forge a single piece — yours, and no one else's.",
    steps: {
      consult: {
        k: "01",
        title: "Consult",
        body: "A private appointment at the atelier. We listen, sketch, and talk stones, budget and timeline.",
      },
      design: {
        k: "02",
        title: "Design",
        body: "Hand drawings, then a 3D render and a wax model. Nothing is cut until you have seen it from every angle.",
      },
      forge: {
        k: "03",
        title: "Forge",
        body: "The master jeweller sets your ruby by hand. Six to ten weeks later, it is yours — with papers and lifetime care.",
      },
    },
    cta: "Start a commission",
  },
  enquiry: {
    eyebrow: "Enquire",
    title: "Reserve a private viewing.",
    body: "Tell us which piece caught your eye, or what you would like made. We reply within two working days to arrange a viewing at the Zürich atelier.",
    modeLabel: "I'm interested in",
    modeCollection: "A collection piece",
    modeBespoke: "A bespoke commission",
    fields: {
      name: "Name",
      email: "Email",
      phone: "Phone (optional)",
      piece: "Piece of interest",
      budget: "Budget range (optional)",
      message: "Message",
    },
    piecePlaceholder: "Select a piece",
    pieceAny: "Undecided / show me",
    budgetPlaceholder: "Select a range",
    messagePlaceholder: "Tell us a little about the occasion…",
    submit: "Send enquiry",
    sending: "Sending…",
    successTitle: "Thank you.",
    successBody: "Your enquiry is with the atelier. We'll be in touch within two working days to arrange your private viewing.",
    error: "Something went wrong. Please email us directly and we'll take care of it.",
    consent: "I agree to be contacted about my enquiry. No marketing, ever.",
    privacy: "Your details are used only to answer this enquiry. Price on request; nothing is charged here.",
  },
  footer: {
    tagline: "Ruby fine jewelry, hand-set in Zürich. By appointment.",
    appointments: "By appointment",
    rights: "All rights reserved.",
    madeIn: "Designed and set in Zürich, Switzerland.",
  },
};

export type Strings = typeof en;
export default en;
