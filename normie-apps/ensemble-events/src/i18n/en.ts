// Note: intentionally NOT `as const` — leaf values widen to `string` so the
// German dictionary (which differs) is assignable to `Strings`.
const en = {
  nav: {
    services: "Services",
    portfolio: "Portfolio",
    about: "About",
    contact: "Contact",
    cta: "Consultation",
  },
  hero: {
    h1a: "One team. Every detail.",
    h1b: "From concept to the last glass cleared.",
    sub: "Full-service luxury events across Zürich and Switzerland — catering, live artists, and a service team entirely our own.",
    cta: "Request a private consultation",
    scroll: "Scroll",
  },
  wedge: {
    eyebrow: "The difference",
    body: "Most houses coordinate vendors. We are the kitchen, the music, and the floor — under one roof, accountable to you alone.",
  },
  services: {
    eyebrow: "What we own",
    title: "One house. Four disciplines.",
    items: {
      catering: {
        title: "Catering",
        body: "Our own kitchen and menu — designed, cooked, and plated by a team that answers to us.",
      },
      artists: {
        title: "Live Artists & DJs",
        body: "In-house musicians and DJs who set the room's energy, rehearsed to your night.",
      },
      brigade: {
        title: "The Service Brigade",
        body: "Trained, uniformed, recurring faces who run the floor with quiet precision.",
      },
      production: {
        title: "End-to-End Production",
        body: "Design, logistics, and execution under a single point of true accountability.",
      },
    },
  },
  brigade: {
    eyebrow: "The brigade",
    title: "The same trusted faces, every time.",
    body: "Not freelancers booked for the night. Our brigade is on staff — trained in-house, discreet by default, and back at your next event having learned exactly how your family likes to entertain.",
    caption: "Discretion is a service, not an afterthought.",
  },
  beforeAfter: {
    eyebrow: "From empty room to occasion",
    title: "We don't dress a venue. We transform it.",
    hint: "Drag to reveal",
    before: "The space",
    after: "The evening",
  },
  portfolio: {
    eyebrow: "Selected work",
    title: "A few evenings. Shown with permission.",
    note: "Our private portfolio is shared under NDA during your consultation.",
    tags: { private: "Private", corporate: "Corporate", wedding: "Wedding" },
  },
  stats: {
    eyebrow: "By the numbers",
    items: {
      events: "Events delivered",
      guests: "Guests served",
      years: "Years in Switzerland",
      staff: "Team members on staff",
    },
  },
  proof: {
    eyebrow: "Trusted by",
    title: "Discreet by default. Recommended in confidence.",
    scarcity: "We accept a limited number of events each year.",
    fallback:
      "We launch on credentials, discretion, and word of mouth. Client names are shared only with their blessing.",
  },
  process: {
    eyebrow: "How we work",
    title: "From first conversation to the morning after.",
    steps: {
      discovery: { title: "Discovery", body: "A private conversation. We listen for the occasion beneath the brief." },
      design: { title: "Design", body: "Concept, menu, sound, and flow — proposed as one coherent evening." },
      assembly: { title: "Brigade assembly", body: "We assign your kitchen, artists, and floor team — all ours." },
      execution: { title: "Execution", body: "One point of contact on the night. Nothing improvised." },
      aftercare: { title: "After-care", body: "We clear, we follow up, and we remember — for next time." },
    },
  },
  contact: {
    eyebrow: "Begin",
    title: "Request a private consultation.",
    body: "Tell us a little about your event. We reply personally, the same day.",
    fields: {
      name: "Name",
      email: "Email",
      eventType: "Event type",
      date: "Approximate date",
      guests: "Approximate guests",
      consent: "I agree to be contacted about my enquiry.",
    },
    eventTypes: { private: "Private celebration", corporate: "Corporate", wedding: "Wedding", other: "Other" },
    submit: "Send enquiry",
    sending: "Sending…",
    successTitle: "Thank you.",
    successBody: "Your enquiry is with us. Expect a personal reply the same day.",
    error: "Something went wrong. Please email us directly.",
    concierge: "Or reach us directly",
    privacy: "We store the minimum, never share it, and honour Swiss data-protection law.",
  },
  about: {
    title: "A house built on relationships, not transactions.",
    body: "Founded in Zürich, Ensemble grew from one conviction: the families and houses we serve deserve a team that knows them — not a different crew each time. Trained in Switzerland's grand hotels and private kitchens, our people stay. That is why our clients return.",
    point1: "Trained in Swiss grand-hôtellerie",
    point2: "An entirely in-house brigade",
    point3: "Discretion by default · NDA on request",
    statLabel: "of our events come from repeat clients and referrals",
  },
  footer: {
    tagline: "Full-service luxury events. One team, end to end.",
    discretion: "Private by default · NDA on request",
    rights: "All rights reserved.",
  },
};

export default en;
export type Strings = typeof en;
