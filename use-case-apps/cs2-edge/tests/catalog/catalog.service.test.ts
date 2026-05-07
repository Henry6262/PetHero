import { describe, test, expect } from "bun:test";
import {
  parseItemType,
  parseItemRarity,
  normaliseItemName,
} from "../../src/catalog/catalog.service.ts";

// These are pure functions — no DB needed.

describe("parseItemType", () => {
  test("AK-47 → Rifle", () => expect(parseItemType("AK-47 | Redline (Field-Tested)")).toBe("Rifle"));
  test("M4A1-S → Rifle", () => expect(parseItemType("M4A1-S | Decimator (Minimal Wear)")).toBe("Rifle"));
  test("AWP → Sniper Rifle", () => expect(parseItemType("AWP | Dragon Lore (Factory New)")).toBe("Sniper Rifle"));
  test("Knife via ★ prefix → Knife", () => expect(parseItemType("★ Karambit | Fade (Factory New)")).toBe("Knife"));
  test("Knife via word → Knife", () => expect(parseItemType("Butterfly Knife | Tiger Tooth (Factory New)")).toBe("Knife"));
  test("Gloves → Gloves", () => expect(parseItemType("★ Sport Gloves | Pandora's Box")).toBe("Gloves"));
  test("Glock-18 → Pistol", () => expect(parseItemType("Glock-18 | Water Elemental (Factory New)")).toBe("Pistol"));
  test("Desert Eagle → Pistol", () => expect(parseItemType("Desert Eagle | Blaze (Factory New)")).toBe("Pistol"));
  test("MAC-10 → SMG", () => expect(parseItemType("MAC-10 | Neon Rider (Factory New)")).toBe("SMG"));
  test("Sticker → Sticker", () => expect(parseItemType("Sticker | Titan (Holo) | Katowice 2014")).toBe("Sticker"));
  test("Case → Container", () => expect(parseItemType("Prisma Case")).toBe("Container"));
  test("Unknown → Other", () => expect(parseItemType("Some Unknown Item")).toBe("Other"));
});

describe("parseItemRarity", () => {
  test("uses rawRarity when provided", () =>
    expect(parseItemRarity("AK-47 | Redline", "Classified")).toBe("Classified"));
  test("handles null rawRarity gracefully", () =>
    expect(parseItemRarity("AK-47 | Redline", null)).toBe("Unknown"));
  test("handles undefined rawRarity gracefully", () =>
    expect(parseItemRarity("AK-47 | Redline")).toBe("Unknown"));
  test("detects Covert in rawRarity", () =>
    expect(parseItemRarity("AWP | Dragon Lore", "Covert")).toBe("Covert"));
  test("detects Mil-Spec in rawRarity", () =>
    expect(parseItemRarity("AK-47 | Safari Mesh", "Mil-Spec Grade")).toBe("Mil-Spec Grade"));
  test("returns Unknown for unrecognised rarity", () =>
    expect(parseItemRarity("Some Item", "SomethingNew")).toBe("Unknown"));
});

describe("normaliseItemName", () => {
  test("strips StatTrak™ prefix", () =>
    expect(normaliseItemName("StatTrak™ AK-47 | Redline (Field-Tested)")).toBe(
      "AK-47 | Redline (Field-Tested)",
    ));
  test("strips ★ prefix with trailing space", () =>
    expect(normaliseItemName("★ Karambit | Fade (Factory New)")).toBe(
      "Karambit | Fade (Factory New)",
    ));
  test("leaves normal names unchanged", () =>
    expect(normaliseItemName("AK-47 | Redline (Field-Tested)")).toBe(
      "AK-47 | Redline (Field-Tested)",
    ));
  test("trims whitespace", () =>
    expect(normaliseItemName("  AWP | Dragon Lore  ")).toBe("AWP | Dragon Lore"));
});
