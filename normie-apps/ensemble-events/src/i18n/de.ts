import type { Strings } from "./en";

// German — primary market language. Mirrors the EN key shape exactly.
const de: Strings = {
  nav: {
    services: "Leistungen",
    portfolio: "Portfolio",
    about: "Über uns",
    contact: "Kontakt",
    cta: "Beratung",
  },
  hero: {
    h1a: "Ein Team. Jedes Detail.",
    h1b: "Vom Konzept bis zum letzten geleerten Glas.",
    sub: "Full-Service-Luxusevents in Zürich und der ganzen Schweiz — Catering, Live-Künstler und ein Serviceteam, das ganz uns gehört.",
    cta: "Private Beratung anfragen",
    scroll: "Scrollen",
  },
  wedge: {
    eyebrow: "Der Unterschied",
    body: "Die meisten Häuser koordinieren Dienstleister. Wir sind die Küche, die Musik und der Service — unter einem Dach, allein Ihnen gegenüber verantwortlich.",
  },
  services: {
    eyebrow: "Was uns gehört",
    title: "Ein Haus. Vier Disziplinen.",
    items: {
      catering: {
        title: "Catering",
        body: "Eigene Küche, eigenes Menü — entworfen, gekocht und angerichtet von unserem Team.",
      },
      artists: {
        title: "Live-Künstler & DJs",
        body: "Hauseigene Musiker und DJs, die den Abend tragen — auf Ihr Fest eingespielt.",
      },
      brigade: {
        title: "Die Service-Brigade",
        body: "Geschulte, uniformierte, wiederkehrende Gesichter mit stiller Präzision.",
      },
      production: {
        title: "Produktion von A bis Z",
        body: "Gestaltung, Logistik und Durchführung — mit einer einzigen Verantwortung.",
      },
    },
  },
  brigade: {
    eyebrow: "Die Brigade",
    title: "Immer dieselben vertrauten Gesichter.",
    body: "Keine Freelancer für eine Nacht. Unsere Brigade ist fest angestellt — intern geschult, von Natur aus diskret und beim nächsten Mal wieder da, weil sie weiss, wie Ihre Familie feiert.",
    caption: "Diskretion ist eine Leistung, kein Nachgedanke.",
  },
  beforeAfter: {
    eyebrow: "Vom leeren Raum zum Anlass",
    title: "Wir dekorieren keinen Saal. Wir verwandeln ihn.",
    hint: "Zum Aufdecken ziehen",
    before: "Der Raum",
    after: "Der Abend",
  },
  portfolio: {
    eyebrow: "Ausgewählte Arbeiten",
    title: "Einige Abende. Mit Erlaubnis gezeigt.",
    note: "Unser privates Portfolio teilen wir unter NDA während Ihrer Beratung.",
    tags: { private: "Privat", corporate: "Corporate", wedding: "Hochzeit" },
  },
  stats: {
    eyebrow: "In Zahlen",
    items: {
      events: "Durchgeführte Events",
      guests: "Bewirtete Gäste",
      years: "Jahre in der Schweiz",
      staff: "Festangestellte im Team",
    },
  },
  proof: {
    eyebrow: "Vertraut von",
    title: "Diskret von Natur aus. Im Vertrauen empfohlen.",
    scarcity: "Wir nehmen jedes Jahr nur eine begrenzte Anzahl Events an.",
    fallback:
      "Wir starten mit Referenzen, Diskretion und Mundpropaganda. Kundennamen nennen wir nur mit deren Einverständnis.",
  },
  process: {
    eyebrow: "So arbeiten wir",
    title: "Vom ersten Gespräch bis zum Morgen danach.",
    steps: {
      discovery: { title: "Kennenlernen", body: "Ein privates Gespräch. Wir hören den Anlass hinter dem Briefing." },
      design: { title: "Konzept", body: "Idee, Menü, Sound und Ablauf — als ein stimmiger Abend gedacht." },
      assembly: { title: "Brigade-Aufstellung", body: "Wir stellen Küche, Künstler und Service zusammen — alle unsere eigenen." },
      execution: { title: "Durchführung", body: "Ein Ansprechpartner am Abend. Nichts dem Zufall überlassen." },
      aftercare: { title: "Nachbetreuung", body: "Wir räumen ab, melden uns und erinnern uns — für das nächste Mal." },
    },
  },
  contact: {
    eyebrow: "Beginnen",
    title: "Private Beratung anfragen.",
    body: "Erzählen Sie uns kurz von Ihrem Event. Wir antworten persönlich, noch am selben Tag.",
    fields: {
      name: "Name",
      email: "E-Mail",
      eventType: "Art des Events",
      date: "Ungefähres Datum",
      guests: "Ungefähre Gästezahl",
      consent: "Ich bin einverstanden, zu meiner Anfrage kontaktiert zu werden.",
    },
    eventTypes: { private: "Private Feier", corporate: "Corporate", wedding: "Hochzeit", other: "Andere" },
    submit: "Anfrage senden",
    sending: "Wird gesendet…",
    successTitle: "Vielen Dank.",
    successBody: "Ihre Anfrage ist bei uns. Sie hören noch heute persönlich von uns.",
    error: "Etwas ist schiefgelaufen. Bitte schreiben Sie uns direkt.",
    concierge: "Oder erreichen Sie uns direkt",
    privacy: "Wir speichern das Minimum, geben nichts weiter und achten das Schweizer Datenschutzrecht.",
  },
  footer: {
    tagline: "Full-Service-Luxusevents. Ein Team, von Anfang bis Ende.",
    discretion: "Privat von Natur aus · NDA auf Anfrage",
    rights: "Alle Rechte vorbehalten.",
  },
};

export default de;
