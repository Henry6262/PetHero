// The collection. Adding a piece = one entry here (+ an optional compressed GLB
// under public/models/pieces/). When `model` is set the showcase loads that GLB;
// otherwise it renders a procedural placeholder gem keyed by `kind` + `glow`,
// so the site is fully live before the Meshy exports land.

export type PieceKind = "ring" | "solitaire" | "pendant" | "studs" | "cuff";

export interface Piece {
  id: string;
  name: string;
  /** Compressed GLB path, e.g. "/models/pieces/aurora.glb". Optional for now. */
  model?: string;
  /** Procedural placeholder shape used when `model` is absent. */
  kind: PieceKind;
  metal: string;
  stone: string;
  carat: string;
  /** Hex glow + gem tint for this piece's stage lighting. */
  glow: string;
  blurbKey?: string; // reserved for future per-piece i18n copy
  blurb: string;
}

// Ruby reds shift subtly piece to piece — pigeon-blood, crimson, garnet-warm.
export const PIECES: Piece[] = [
  {
    id: "carmin-solitaire",
    name: "Carmin Solitaire",
    kind: "solitaire",
    metal: "Platinum 950",
    stone: "Burmese ruby",
    carat: "2.10 ct",
    glow: "#ff2b46",
    blurb:
      "The house signature. A single pigeon-blood ruby raised on six platinum claws, so light enters from every side.",
  },
  {
    id: "braise-band",
    name: "Braise Band",
    kind: "ring",
    metal: "18k rose gold",
    stone: "Ruby pavé",
    carat: "0.88 ct total",
    glow: "#c2102e",
    blurb:
      "A continuous line of calibrated rubies channel-set into warm rose gold — a band that reads as a single ember.",
  },
  {
    id: "goutte-pendant",
    name: "Goutte Pendant",
    kind: "pendant",
    metal: "18k yellow gold",
    stone: "Pear-cut ruby",
    carat: "1.45 ct",
    glow: "#ff3b54",
    blurb:
      "A pear-cut ruby hung as a single drop on a fine gold chain. Quiet from across the room, molten up close.",
  },
  {
    id: "ardent-studs",
    name: "Ardent Studs",
    kind: "studs",
    metal: "Platinum 950",
    stone: "Round rubies",
    carat: "1.20 ct pair",
    glow: "#ff2b46",
    blurb:
      "A matched pair of round brilliants, martini-set so they sit close and catch movement. Everyday fire.",
  },
  {
    id: "sang-cuff",
    name: "Sang Cuff",
    kind: "cuff",
    metal: "18k gold & blackened silver",
    stone: "Cabochon ruby",
    carat: "4.30 ct",
    glow: "#8a0f1a",
    blurb:
      "An architectural cuff in two metals, anchored by a deep cabochon ruby. The boldest piece the bench will make.",
  },
];
