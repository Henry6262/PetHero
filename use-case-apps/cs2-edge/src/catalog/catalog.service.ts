import { PrismaClient, type Item } from "@prisma/client";
import type { SkinportItem } from "../ingestion/types.ts";

// ─── Item type/rarity normalisation ──────────────────────────────────────────
// Derived from market_hash_name patterns. Order matters — more specific first.

const TYPE_PATTERNS: [RegExp, string][] = [
  [/\bGloves?\b/, "Gloves"],
  [/\bKnife\b|★/, "Knife"],
  [/\bAWP\b/, "Sniper Rifle"],
  [/\bAK-47\b/, "Rifle"],
  [/\bM4A4\b|\bM4A1-S\b|\bFAMAS\b|\bAUG\b|\bSG 553\b|\bGALIL AR\b/, "Rifle"],
  [/\bMAC-10\b|\bMP5-SD\b|\bMP7\b|\bMP9\b|\bPP-Bizon\b|\bP90\b|\bUMP-45\b/, "SMG"],
  [/\bM249\b|\bNegev\b/, "Machine Gun"],
  [/\bSSG 08\b|\bSCAR-20\b|\bG3SG1\b/, "Sniper Rifle"],
  [/\bXM1014\b|\bMAG-7\b|\bNova\b|\bSawed-Off\b/, "Shotgun"],
  [/\bGlock-18\b|\bUSP-S\b|\bP2000\b|\bP250\b|\bTec-9\b|\bFive-SeveN\b|\bCZ75-Auto\b|\bDual Berettas\b|\bDesert Eagle\b|\bR8 Revolver\b/, "Pistol"],
  [/\bAgent\b/, "Agent"],
  [/\bPatch\b/, "Patch"],
  [/\bSticker\b/, "Sticker"],
  [/\bGraffiti\b/, "Graffiti"],
  [/\bMusic Kit\b/, "Music Kit"],
  [/\bCase\b/, "Container"],
  [/\bKey\b/, "Key"],
  [/\bPin\b/, "Collectible"],
];

const RARITY_PATTERNS: [RegExp, string][] = [
  [/Contraband/, "Contraband"],
  [/Covert/, "Covert"],
  [/Classified/, "Classified"],
  [/Restricted/, "Restricted"],
  [/Mil-Spec/, "Mil-Spec Grade"],
  [/Industrial Grade/, "Industrial Grade"],
  [/Consumer Grade/, "Consumer Grade"],
  [/Base Grade/, "Base Grade"],
  [/High Grade/, "High Grade"],
  [/Remarkable/, "Remarkable"],
  [/Exotic/, "Exotic"],
  [/Extraordinary/, "Extraordinary"],
];

export function parseItemType(marketHashName: string): string {
  for (const [pattern, type] of TYPE_PATTERNS) {
    if (pattern.test(marketHashName)) return type;
  }
  return "Other";
}

export function parseItemRarity(marketHashName: string, rawRarity?: string | null): string {
  if (rawRarity) {
    for (const [pattern, rarity] of RARITY_PATTERNS) {
      if (pattern.test(rawRarity)) return rarity;
    }
  }
  // Fallback: infer from market hash name keywords
  for (const [pattern, rarity] of RARITY_PATTERNS) {
    if (pattern.test(marketHashName)) return rarity;
  }
  return "Unknown";
}

export function normaliseItemName(marketHashName: string): string {
  // Strip StatTrak™ and ★ for the clean display name
  return marketHashName
    .replace(/^StatTrak™\s+/, "")
    .replace(/^★\s+/, "")
    .trim();
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CatalogService {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertItem(raw: SkinportItem): Promise<Item> {
    const type = parseItemType(raw.market_hash_name);
    const rarity = parseItemRarity(raw.market_hash_name, raw.version ?? null);
    const name = normaliseItemName(raw.market_hash_name);

    return this.prisma.item.upsert({
      where: { id: raw.market_hash_name },
      create: { id: raw.market_hash_name, name, type, rarity },
      update: { name, type, rarity },
    });
  }

  async upsertMany(raws: SkinportItem[]): Promise<number> {
    // Process in batches to avoid overwhelming the DB connection pool
    const BATCH = 200;
    let count = 0;
    for (let i = 0; i < raws.length; i += BATCH) {
      const batch = raws.slice(i, i + BATCH);
      await Promise.all(batch.map(r => this.upsertItem(r)));
      count += batch.length;
    }
    return count;
  }
}
