// PLACEHOLDER imagery — deterministic stock photos via picsum.
// Founder swaps these for real event / brigade photography before launch.
// Centralised so the swap is a one-file change.
const pic = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const HERO_POSTER = pic("ensemble-hero", 1920, 1280);

export const BRIGADE_SHOTS = [
  pic("ensemble-kitchen", 900, 1200),
  pic("ensemble-dj", 1200, 900),
  pic("ensemble-floor", 900, 1200),
  pic("ensemble-plating", 1200, 900),
  pic("ensemble-pour", 900, 1200),
];

export const TEAM = [
  { name: "Founder Name", role: "Founder & Creative Director", img: pic("ensemble-t1", 600, 800) },
  { name: "Head Chef", role: "Executive Chef", img: pic("ensemble-t2", 600, 800) },
  { name: "Floor Lead", role: "Maître d'hôtel", img: pic("ensemble-t3", 600, 800) },
];

export const BEFORE_IMG = pic("ensemble-empty-venue", 1400, 900);
export const AFTER_IMG = pic("ensemble-set-event", 1400, 900);

export const PORTFOLIO = [
  { id: "p1", img: pic("ensemble-p1", 800, 1000), tag: "private", height: 1000 },
  { id: "p2", img: pic("ensemble-p2", 800, 600), tag: "corporate", height: 600 },
  { id: "p3", img: pic("ensemble-p3", 800, 1100), tag: "wedding", height: 1100 },
  { id: "p4", img: pic("ensemble-p4", 800, 700), tag: "private", height: 700 },
  { id: "p5", img: pic("ensemble-p5", 800, 900), tag: "corporate", height: 900 },
  { id: "p6", img: pic("ensemble-p6", 800, 650), tag: "wedding", height: 650 },
];
