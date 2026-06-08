import type { Strings } from "./en";

// Swiss High German (de-CH). Uses ß-free spelling per Swiss convention.
const de: Strings = {
  nav: {
    collection: "Kollektion",
    craft: "Handwerk",
    bespoke: "Massanfertigung",
    atelier: "Atelier",
    cta: "Anfragen",
  },
  hero: {
    tag: "Zürich · Maison de Joaillerie",
    titleLine1: "Der Carmin-",
    titleLine2: "Rubin",
    sub: "Ein Zürcher Atelier für feinen Rubinschmuck. Jedes Stück wird von Hand in Gold und Platin gefasst und im Licht gedreht – damit Sie das Feuer sehen, bevor es Ihnen gehört.",
    ctaCollection: "Kollektion ansehen",
    ctaBespoke: "Stück anfertigen lassen",
    stats: {
      pieces: "Stücke",
      carats: "Gefasste Karat",
      years: "Jahre Handwerk",
      city: "Atelier",
    },
    cityValue: "Zürich",
  },
  marquee: {
    a: "Von Hand gefasst in Zürich",
    b: "Verantwortungsvoll bezogene Rubine",
    c: "Lebenslange Pflege",
    d: "Preis auf Anfrage",
    e: "Private Termine",
  },
  collection: {
    eyebrow: "Die Kollektion",
    title: "Feuer, das Sie in der Hand drehen können.",
    lead: "Eine kleine, bewusst kuratierte Kollektion. Drehen Sie jedes Stück, lesen Sie den Stein und fragen Sie an für eine private Besichtigung im Atelier.",
    metal: "Metall",
    stone: "Stein",
    carat: "Karat",
    price: "Preis auf Anfrage",
    enquire: "Zu diesem Stück anfragen",
  },
  craft: {
    eyebrow: "Das Handwerk",
    title: "Warum wir in Rot fassen.",
    lead: "Der Rubin ist der anspruchsvollste Stein, den ein Haus wählen kann. Er belohnt Geduld und bestraft Abkürzungen – genau darum haben wir die Maison um ihn herum gebaut.",
    points: {
      source: {
        title: "Mit Gewissen bezogen",
        body: "Jeder Rubin ist auf einen verantwortungsvollen Ursprung zurückführbar und wird von Hand nach Farbe, Reinheit und Feuer ausgewählt – nie allein nach Karat.",
      },
      set: {
        title: "An einer Werkbank gefasst",
        body: "Vom Wachs bis zur Endpolitur trägt ein einzelner Zürcher Meisterjuwelier jedes Stück. Kein Stück durchläuft anonyme Hände.",
      },
      kept: {
        title: "Fürs Leben bewahrt",
        body: "Reinigung, Neufassung und Anpassung gehören zum Besitz, nicht zum Verkauf. Ein Maison-Carmin-Stück soll getragen werden – immer wieder.",
      },
    },
  },
  bespoke: {
    eyebrow: "Massanfertigung",
    title: "Lassen Sie etwas anfertigen, das nur für Sie existiert.",
    lead: "Bringen Sie einen Stein, ein Erbstück oder nur eine Idee. Wir gestalten darum herum und schmieden ein einziges Stück – Ihres, und niemandes sonst.",
    steps: {
      consult: {
        k: "01",
        title: "Beratung",
        body: "Ein privater Termin im Atelier. Wir hören zu, skizzieren und sprechen über Steine, Budget und Zeitplan.",
      },
      design: {
        k: "02",
        title: "Entwurf",
        body: "Handzeichnungen, dann ein 3D-Render und ein Wachsmodell. Nichts wird geschnitten, bevor Sie es aus jedem Winkel gesehen haben.",
      },
      forge: {
        k: "03",
        title: "Anfertigung",
        body: "Der Meisterjuwelier fasst Ihren Rubin von Hand. Sechs bis zehn Wochen später gehört er Ihnen – mit Zertifikat und lebenslanger Pflege.",
      },
    },
    cta: "Anfertigung beginnen",
  },
  enquiry: {
    eyebrow: "Anfragen",
    title: "Reservieren Sie eine private Besichtigung.",
    body: "Sagen Sie uns, welches Stück Ihnen aufgefallen ist – oder was Sie anfertigen lassen möchten. Wir antworten innert zwei Werktagen, um eine Besichtigung im Zürcher Atelier zu vereinbaren.",
    modeLabel: "Ich interessiere mich für",
    modeCollection: "Ein Stück der Kollektion",
    modeBespoke: "Eine Massanfertigung",
    fields: {
      name: "Name",
      email: "E-Mail",
      phone: "Telefon (optional)",
      piece: "Stück von Interesse",
      budget: "Budgetrahmen (optional)",
      message: "Nachricht",
    },
    piecePlaceholder: "Stück wählen",
    pieceAny: "Unentschlossen / zeigen Sie mir",
    budgetPlaceholder: "Rahmen wählen",
    messagePlaceholder: "Erzählen Sie uns kurz vom Anlass…",
    submit: "Anfrage senden",
    sending: "Wird gesendet…",
    successTitle: "Vielen Dank.",
    successBody: "Ihre Anfrage liegt beim Atelier. Wir melden uns innert zwei Werktagen, um Ihre private Besichtigung zu vereinbaren.",
    error: "Etwas ist schiefgelaufen. Bitte schreiben Sie uns direkt – wir kümmern uns darum.",
    consent: "Ich bin einverstanden, zu meiner Anfrage kontaktiert zu werden. Kein Marketing, niemals.",
    privacy: "Ihre Angaben werden nur zur Beantwortung dieser Anfrage verwendet. Preis auf Anfrage; hier wird nichts berechnet.",
  },
  footer: {
    tagline: "Feiner Rubinschmuck, von Hand gefasst in Zürich. Nach Vereinbarung.",
    appointments: "Nach Vereinbarung",
    rights: "Alle Rechte vorbehalten.",
    madeIn: "Entworfen und gefasst in Zürich, Schweiz.",
  },
};

export default de;
